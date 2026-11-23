import { ArticleKind, ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  AI_ASSISTANT_LIMITS,
  AssistantLinkKind,
} from './ai-assistant.constant';
import {
  FEATURE_GUIDE_RULES,
  SEARCH_STOP_WORDS,
  STATIC_PAGE_DESCRIPTIONS,
} from './ai-assistant.guide';
import {
  AssistantSuggestedLink,
  PageContentSnapshot,
} from './ai-assistant.types';

const BLOCK_TEXT_KEYS = ['content', 'text', 'title', 'quote'] as const;

export function extractBlockSnippet(blocks: unknown, maxChars = 700): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    for (const key of BLOCK_TEXT_KEYS) {
      const val = rec[key];
      if (typeof val === 'string' && val.trim()) {
        parts.push(
          val
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        );
      }
    }
    if (parts.join(' ').length >= maxChars) break;
  }
  return parts.join(' ').slice(0, maxChars);
}

export function extractSearchKeywords(message: string): string[] {
  const words = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !SEARCH_STOP_WORDS.has(w));

  if (words.length === 0) return [];
  const phrases: string[] = [];
  if (words.length >= 2) {
    phrases.push(words.slice(-2).join(' '));
    phrases.push(words.slice(0, 2).join(' '));
  }
  return Array.from(
    new Set([...phrases, ...words.filter((w) => w.length >= 3)]),
  ).slice(0, 6);
}

/** Intent Gate: chỉ kích hoạt RAG với câu hỏi tra cứu lịch sử / tóm tắt; bỏ qua tiến độ, hướng dẫn tính năng & tán gẫu. */
export function shouldUseRagForMessage(
  message: string,
  hasPageContext = false,
): boolean {
  const clean = message.trim();
  if (!clean) return false;
  if (/tóm tắt|trang này|bài này|đang đọc|đang xem/i.test(clean)) {
    return !hasPageContext ? true : false;
  }
  if (/tiến độ|hôm nay|cần ôn|tài khoản của tôi|thành tích/i.test(clean)) {
    return false;
  }
  if (FEATURE_GUIDE_RULES.some((rule) => rule.keywords.test(clean))) {
    return false;
  }
  const hasHistorySignal =
    /năm|thế kỷ|chiến|trận|triều|vua|tướng|lịch sử|cách mạng|đế quốc|khởi nghĩa|nhân vật|sự kiện|di tích|tài liệu|tư liệu|link|đường dẫn/i.test(
      clean,
    );
  if (hasHistorySignal) return true;

  const isGreetingOrSmallTalk =
    /^(xin\s+chào|chào(\s+bạn)?|hello|hi|hey|cảm ơn|thank|tạm biệt|bye|ok|oke|ăn cơm chưa|nay ăn cơm chưa|bạn là ai|khỏe không)[?!.\s]*$/i.test(
      clean,
    );
  if (isGreetingOrSmallTalk) return false;

  return clean.split(/\s+/).length >= 3;
}

export function resolveArticleRouteByKind(kind?: ArticleKind | null): {
  linkKind: AssistantLinkKind;
  routeBase: string;
  label: string;
} {
  switch (kind) {
    case ArticleKind.EVENT:
      return {
        linkKind: AssistantLinkKind.EVENT,
        routeBase: '/su-kien',
        label: 'Sự kiện',
      };
    case ArticleKind.PERSON:
      return {
        linkKind: AssistantLinkKind.PERSON,
        routeBase: '/nhan-vat',
        label: 'Nhân vật',
      };
    case ArticleKind.LOCATION:
      return {
        linkKind: AssistantLinkKind.LOCATION,
        routeBase: '/di-tich',
        label: 'Di tích',
      };
    case ArticleKind.DYNASTY:
    case ArticleKind.OTHER:
    default:
      return {
        linkKind: AssistantLinkKind.ARTICLE,
        routeBase: '/bai-viet',
        label: 'Bài viết',
      };
  }
}

interface CategoryRef {
  id: string;
  parentId: string | null;
  kind: ArticleKind | null;
}

function resolveInheritedKind(
  categoriesById: ReadonlyMap<string, CategoryRef>,
  categoryId: string | null | undefined,
): ArticleKind {
  let cur = categoryId ? categoriesById.get(categoryId) : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    if (cur.kind) return cur.kind;
    seen.add(cur.id);
    cur = cur.parentId ? categoriesById.get(cur.parentId) : undefined;
  }
  return ArticleKind.OTHER;
}

async function loadCategoryHierarchy(
  prisma: PrismaService,
): Promise<Map<string, CategoryRef>> {
  if (!prisma.category?.findMany) return new Map();
  const rows = await prisma.category.findMany({
    select: { id: true, parentId: true, kind: true },
  });
  return new Map(rows.map((c) => [c.id, c]));
}

async function tryResolveArticlePage(
  prisma: PrismaService,
  cleanPath: string,
  pageContext?: string,
): Promise<PageContentSnapshot | null> {
  const match =
    /^\/(bai-viet|su-kien|nhan-vat|di-tich|thuc-the)\/([^/]+)$/i.exec(
      cleanPath,
    );
  if (!match || !prisma.article?.findFirst) return null;

  const slug = decodeURIComponent(match[2]);
  const art = await prisma.article.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: {
      title: true,
      slug: true,
      summary: true,
      dateText: true,
      contentBlocks: true,
      categoryId: true,
    },
  });
  if (!art) return null;

  const categories = await loadCategoryHierarchy(prisma);
  const routeInfo = resolveArticleRouteByKind(
    resolveInheritedKind(categories, art.categoryId),
  );
  const entryPrefix = `/${match[1].toLowerCase()}`;
  return {
    kind: routeInfo.linkKind,
    title: art.title,
    summary: [
      art.dateText,
      art.summary,
      extractBlockSnippet(art.contentBlocks),
      pageContext,
    ]
      .filter(Boolean)
      .join(' — '),
    href:
      entryPrefix === '/thuc-the'
        ? `${routeInfo.routeBase}/${art.slug}`
        : `${entryPrefix}/${art.slug}`,
  };
}

async function tryResolveLessonPage(
  prisma: PrismaService,
  cleanPath: string,
  pageContext?: string,
): Promise<PageContentSnapshot | null> {
  const match = /^\/bai-hoc\/([^/]+)$/i.exec(cleanPath);
  if (!match || !prisma.lesson?.findFirst) return null;

  const slug = decodeURIComponent(match[1]);
  const lesson = await prisma.lesson.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: { title: true, slug: true, description: true, content: true },
  });
  if (!lesson) return null;

  return {
    kind: AssistantLinkKind.LESSON,
    title: lesson.title,
    summary: [
      lesson.description,
      extractBlockSnippet(lesson.content),
      pageContext,
    ]
      .filter(Boolean)
      .join(' — '),
    href: `/bai-hoc/${lesson.slug}`,
  };
}

async function tryResolveBlogPage(
  prisma: PrismaService,
  cleanPath: string,
  pageContext?: string,
): Promise<PageContentSnapshot | null> {
  const match = /^\/blog\/([^/]+)$/i.exec(cleanPath);
  if (!match || match[1] === 'create' || !prisma.blogPost?.findFirst) {
    return null;
  }

  const slug = decodeURIComponent(match[1]);
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: { title: true, slug: true, excerpt: true, contentBlocks: true },
  });
  if (!post) return null;

  return {
    kind: AssistantLinkKind.BLOG,
    title: post.title,
    summary: [
      post.excerpt,
      extractBlockSnippet(post.contentBlocks),
      pageContext,
    ]
      .filter(Boolean)
      .join(' — '),
    href: `/blog/${post.slug}`,
  };
}

export async function resolveCurrentPageSnapshot(
  prisma: PrismaService,
  currentPath?: string,
  pageContext?: string,
): Promise<PageContentSnapshot | null> {
  if (!currentPath && !pageContext) return null;
  const cleanPath = (currentPath || '/').split('?')[0];

  const dynamicHit =
    (await tryResolveArticlePage(prisma, cleanPath, pageContext)) ??
    (await tryResolveLessonPage(prisma, cleanPath, pageContext)) ??
    (await tryResolveBlogPage(prisma, cleanPath, pageContext));
  if (dynamicHit) return dynamicHit;

  const matchedStatic = STATIC_PAGE_DESCRIPTIONS.find((item) =>
    item.match(cleanPath),
  );
  if (matchedStatic) {
    return {
      kind: matchedStatic.kind ?? AssistantLinkKind.ROUTE,
      title: matchedStatic.title,
      summary: [
        matchedStatic.summary,
        pageContext ? `Các mục hiển thị trên màn hình: ${pageContext}` : '',
      ]
        .filter(Boolean)
        .join('\n• '),
      href: currentPath || matchedStatic.href,
    };
  }

  return pageContext
    ? {
        kind: AssistantLinkKind.ROUTE,
        title: `Trang ${cleanPath}`,
        summary: pageContext,
        href: currentPath || cleanPath,
      }
    : null;
}

export async function searchMultiEntityContent(
  prisma: PrismaService,
  message: string,
): Promise<AssistantSuggestedLink[]> {
  const keywords = extractSearchKeywords(message);
  if (keywords.length === 0) return [];

  const [categories, articles, lessons, blogs, timelineNodes] =
    await Promise.all([
      loadCategoryHierarchy(prisma),
      prisma.article?.findMany
        ? prisma.article.findMany({
            where: {
              status: ContentStatus.PUBLISHED,
              OR: keywords.flatMap((kw) => [
                { title: { contains: kw, mode: 'insensitive' } },
                { summary: { contains: kw, mode: 'insensitive' } },
                {
                  articleTags: {
                    some: {
                      tag: { name: { contains: kw, mode: 'insensitive' } },
                    },
                  },
                },
              ]),
            },
            take: 4,
            select: {
              title: true,
              slug: true,
              dateText: true,
              summary: true,
              categoryId: true,
            },
          })
        : Promise.resolve([]),
      prisma.lesson?.findMany
        ? prisma.lesson.findMany({
            where: {
              status: ContentStatus.PUBLISHED,
              OR: keywords.flatMap((kw) => [
                { title: { contains: kw, mode: 'insensitive' } },
                { description: { contains: kw, mode: 'insensitive' } },
              ]),
            },
            take: 2,
            select: { title: true, slug: true, description: true },
          })
        : Promise.resolve([]),
      prisma.blogPost?.findMany
        ? prisma.blogPost.findMany({
            where: {
              status: ContentStatus.PUBLISHED,
              OR: keywords.flatMap((kw) => [
                { title: { contains: kw, mode: 'insensitive' } },
                { excerpt: { contains: kw, mode: 'insensitive' } },
              ]),
            },
            take: 2,
            select: { title: true, slug: true, excerpt: true },
          })
        : Promise.resolve([]),
      prisma.timelineNode?.findMany
        ? prisma.timelineNode.findMany({
            where: {
              timeline: { status: ContentStatus.PUBLISHED },
              OR: keywords.flatMap((kw) => [
                { title: { contains: kw, mode: 'insensitive' } },
                { description: { contains: kw, mode: 'insensitive' } },
              ]),
            },
            take: 2,
            select: {
              title: true,
              dateText: true,
              timeline: { select: { title: true, slug: true } },
            },
          })
        : Promise.resolve([]),
    ]);

  const results: AssistantSuggestedLink[] = [];

  for (const a of articles) {
    const kind = resolveInheritedKind(categories, a.categoryId);
    const meta = resolveArticleRouteByKind(kind);
    results.push({
      kind: meta.linkKind,
      title: a.title,
      subtitle: [meta.label, a.dateText, a.summary].filter(Boolean).join(' · '),
      href: `${meta.routeBase}/${a.slug}`,
    });
  }

  for (const l of lessons) {
    results.push({
      kind: AssistantLinkKind.LESSON,
      title: l.title,
      subtitle: l.description || 'Bài học lịch sử HISGO',
      href: `/bai-hoc/${l.slug}`,
    });
  }

  for (const b of blogs) {
    results.push({
      kind: AssistantLinkKind.BLOG,
      title: b.title,
      subtitle: b.excerpt || 'Blog chuyên khảo sử học HISGO',
      href: `/blog/${b.slug}`,
    });
  }

  for (const node of timelineNodes) {
    results.push({
      kind: AssistantLinkKind.TIMELINE,
      title: node.dateText ? `${node.dateText}: ${node.title}` : node.title,
      subtitle: `Giai đoạn · ${node.timeline.title}`,
      href: `/giai-doan/${node.timeline.slug}`,
    });
  }

  return results.slice(0, AI_ASSISTANT_LIMITS.MAX_SUGGESTED_LINKS);
}
