/**
 * Export dữ liệu tri thức từ PostgreSQL HISGO sang các file Markdown (.md) sạch
 * kèm file ánh xạ `hisgo-manifest.json` để nạp vào GCS / Vertex AI RAG Engine.
 *
 * Cách chạy từ thư mục `backend/`:
 *   npm run rag:export
 *   npm run rag:export -- --out=./rag-export --include-drafts
 */
import 'dotenv/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { ContentStatus, PrismaClient } from '@prisma/client';
import {
  ensureUniqueArtifactPath,
  formatArticleMarkdown,
  formatBlogPostMarkdown,
  formatLessonMarkdown,
  formatTimelineNodeMarkdown,
} from './rag-export.formatter';
import {
  CategoryHierarchyNode,
  ExportableArticle,
  ExportableBlogPost,
  ExportableLesson,
  ExportableTimelineNode,
  RagExportArtifact,
  RagManifestDocument,
} from './rag-export.types';

const EXPORT_SUBDIRS = ['articles', 'lessons', 'blogs', 'timelines'] as const;
const MANIFEST_FILENAME = 'hisgo-manifest.json';

interface CliOptions {
  outDir: string;
  includeDrafts: boolean;
  clean: boolean;
  quiet: boolean;
}

function parseCliOptions(argv: string[]): CliOptions {
  const defaultOutDir = path.resolve(process.cwd(), 'rag-export');
  let outDir = defaultOutDir;
  let includeDrafts = false;
  let clean = true;
  let quiet = false;

  for (const arg of argv) {
    if (arg.startsWith('--out=')) {
      const rawPath = arg.slice('--out='.length).trim();
      if (rawPath) {
        outDir = path.isAbsolute(rawPath)
          ? rawPath
          : path.resolve(process.cwd(), rawPath);
      }
    } else if (arg === '--include-drafts') {
      includeDrafts = true;
    } else if (arg === '--no-clean') {
      clean = false;
    } else if (arg === '--quiet') {
      quiet = true;
    }
  }

  return { outDir, includeDrafts, clean, quiet };
}

async function prepareOutputDirectories(
  outDir: string,
  clean: boolean,
): Promise<void> {
  await fs.mkdir(outDir, { recursive: true });
  if (clean) {
    for (const sub of EXPORT_SUBDIRS) {
      await fs.rm(path.join(outDir, sub), { recursive: true, force: true });
    }
    await fs.rm(path.join(outDir, MANIFEST_FILENAME), { force: true });
  }
  for (const sub of EXPORT_SUBDIRS) {
    await fs.mkdir(path.join(outDir, sub), { recursive: true });
  }
}

async function fetchCategoriesMap(
  prisma: PrismaClient,
): Promise<Map<string, CategoryHierarchyNode>> {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
    },
  });
  return new Map(rows.map((c) => [c.id, c]));
}

async function fetchArticles(
  prisma: PrismaClient,
  includeDrafts: boolean,
): Promise<ExportableArticle[]> {
  return prisma.article.findMany({
    where: includeDrafts ? undefined : { status: ContentStatus.PUBLISHED },
    orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      contentBlocks: true,
      metadata: true,
      dateText: true,
      startYear: true,
      endYear: true,
      status: true,
      categoryId: true,
      topic: { select: { name: true, slug: true } },
      articleTags: { select: { tag: { select: { name: true } } } },
    },
  });
}

async function fetchLessons(
  prisma: PrismaClient,
  includeDrafts: boolean,
): Promise<ExportableLesson[]> {
  return prisma.lesson.findMany({
    where: includeDrafts ? undefined : { status: ContentStatus.PUBLISHED },
    orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      contentRichText: true,
      difficulty: true,
      sourceReferenceNote: true,
      status: true,
      topic: { select: { name: true, slug: true } },
      lessonTags: { select: { tag: { select: { name: true } } } },
    },
  });
}

async function fetchBlogPosts(
  prisma: PrismaClient,
  includeDrafts: boolean,
): Promise<ExportableBlogPost[]> {
  return prisma.blogPost.findMany({
    where: includeDrafts ? undefined : { status: ContentStatus.PUBLISHED },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      postType: true,
      contentBlocks: true,
      status: true,
      publishedAt: true,
      author: {
        select: {
          username: true,
          userProfile: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });
}

async function fetchTimelineNodes(
  prisma: PrismaClient,
  includeDrafts: boolean,
): Promise<ExportableTimelineNode[]> {
  return prisma.timelineNode.findMany({
    where: includeDrafts
      ? undefined
      : { timeline: { status: ContentStatus.PUBLISHED } },
    orderBy: [{ timeline: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      dateText: true,
      year: true,
      month: true,
      day: true,
      endYear: true,
      displayOrder: true,
      timeline: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          topic: { select: { name: true, slug: true } },
        },
      },
      article: {
        select: {
          slug: true,
          title: true,
          status: true,
          categoryId: true,
        },
      },
      articles: {
        orderBy: { displayOrder: 'asc' },
        select: {
          article: {
            select: {
              slug: true,
              title: true,
              status: true,
              categoryId: true,
            },
          },
        },
      },
    },
  });
}

async function writeArtifactsToDisk(
  outDir: string,
  artifacts: RagExportArtifact[],
): Promise<void> {
  for (const item of artifacts) {
    const absPath = path.join(outDir, item.relativePath);
    await fs.writeFile(absPath, item.markdown, 'utf8');
  }
}

export async function runRagExport(
  argv = process.argv.slice(2),
): Promise<void> {
  const options = parseCliOptions(argv);
  const connectionString = (process.env.DATABASE_URL || '').trim();
  if (!connectionString) {
    throw new Error(
      'Thiếu biến môi trường DATABASE_URL để kết nối PostgreSQL.',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const [categoriesById, articles, lessons, blogs, timelineNodes] =
      await Promise.all([
        fetchCategoriesMap(prisma),
        fetchArticles(prisma, options.includeDrafts),
        fetchLessons(prisma, options.includeDrafts),
        fetchBlogPosts(prisma, options.includeDrafts),
        fetchTimelineNodes(prisma, options.includeDrafts),
      ]);

    const usedPaths = new Set<string>();
    const articleArtifacts = articles.map((a) =>
      ensureUniqueArtifactPath(
        formatArticleMarkdown(a, categoriesById, options.includeDrafts),
        usedPaths,
      ),
    );
    const lessonArtifacts = lessons.map((l) =>
      ensureUniqueArtifactPath(formatLessonMarkdown(l), usedPaths),
    );
    const blogArtifacts = blogs.map((b) =>
      ensureUniqueArtifactPath(formatBlogPostMarkdown(b), usedPaths),
    );
    const timelineArtifacts = timelineNodes.map((n) =>
      ensureUniqueArtifactPath(
        formatTimelineNodeMarkdown(n, categoriesById, options.includeDrafts),
        usedPaths,
      ),
    );

    const allArtifacts = [
      ...articleArtifacts,
      ...lessonArtifacts,
      ...blogArtifacts,
      ...timelineArtifacts,
    ];

    await prepareOutputDirectories(options.outDir, options.clean);
    await writeArtifactsToDisk(options.outDir, allArtifacts);

    const manifest: RagManifestDocument = {
      version: 1,
      exportedAt: new Date().toISOString(),
      includeDrafts: options.includeDrafts,
      counts: {
        articles: articleArtifacts.length,
        lessons: lessonArtifacts.length,
        blogs: blogArtifacts.length,
        timelineNodes: timelineArtifacts.length,
        total: allArtifacts.length,
      },
      entries: allArtifacts.map((item) => item.manifestEntry),
    };

    await fs.writeFile(
      path.join(options.outDir, MANIFEST_FILENAME),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );

    if (!options.quiet) {
      console.log(
        `✅ Đã export ${manifest.counts.total} file .md vào ${options.outDir}`,
      );
      console.log(
        `   • Articles: ${manifest.counts.articles} | Lessons: ${manifest.counts.lessons} | BlogPosts: ${manifest.counts.blogs} | TimelineNodes: ${manifest.counts.timelineNodes}`,
      );
      console.log(
        `   • Manifest: ${path.join(options.outDir, MANIFEST_FILENAME)}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runRagExport().catch((err: unknown) => {
    console.error('❌ Lỗi export dữ liệu RAG:', err);
    process.exit(1);
  });
}
