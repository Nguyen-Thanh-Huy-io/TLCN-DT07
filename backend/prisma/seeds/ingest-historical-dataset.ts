/**
 * ingest-historical-dataset.ts
 * ----------------------------
 * Nạp trực tiếp bộ dữ liệu lịch sử chuẩn:
 * "C:\Users\ACER\Downloads\historical-dataset.json.json" (đã copy vào scripts/data/historical-dataset.json)
 *
 * Tương thích 100% schema Prisma HISGO hiện tại:
 * - Map đúng chuyên mục (slug hoặc kind)
 * - Map Topic -> Article -> Timeline & Nodes -> LearningPath -> Chapter -> Lesson -> Quiz -> Question Bank
 * - Chạy an toàn nhiều lần (Idempotent upsert).
 *
 * Chạy bằng: cd backend; npx ts-node prisma/seeds/ingest-historical-dataset.ts
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  PrismaClient,
  ContentStatus,
  LessonStatus,
  LearningPathType,
  TopicIcon,
  ArticleKind,
  DifficultyLevel,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  console.log('🚀 Bắt đầu nạp & làm giàu dữ liệu từ historical-dataset.json...');

  const jsonPath = path.resolve(__dirname, '../../../scripts/data/historical-dataset.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file: ${jsonPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. TOPICS
  console.log(`1️⃣ Nạp ${raw.topics?.length || 0} Topics...`);
  const topicIdMap = new Map<string, string>(); // oldId -> newId

  // Nạp topics gốc trước (parentId null), sau đó tới con
  const sortedTopics = [...(raw.topics || [])].sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0));

  for (const t of sortedTopics) {
    const parentId = t.parentId ? topicIdMap.get(t.parentId) || null : null;
    const upserted = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        eyebrow: t.eyebrow ?? null,
        icon: t.icon as TopicIcon ?? null,
        pathType: (t.pathType as LearningPathType) ?? LearningPathType.CHRONOLOGICAL,
        isFeatured: Boolean(t.isFeatured),
        description: t.description ?? null,
        coverImageUrl: t.coverImageUrl ?? null,
        isSequential: Boolean(t.isSequential),
        displayOrder: t.displayOrder ?? 0,
        status: (t.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        parentId,
      },
      create: {
        slug: t.slug,
        name: t.name,
        eyebrow: t.eyebrow ?? null,
        icon: t.icon as TopicIcon ?? null,
        pathType: (t.pathType as LearningPathType) ?? LearningPathType.CHRONOLOGICAL,
        isFeatured: Boolean(t.isFeatured),
        description: t.description ?? null,
        coverImageUrl: t.coverImageUrl ?? null,
        isSequential: Boolean(t.isSequential),
        displayOrder: t.displayOrder ?? 0,
        status: (t.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        parentId,
      },
    });
    topicIdMap.set(t.id, upserted.id);
  }

  // 2. CATEGORIES
  console.log(`2️⃣ Nạp ${raw.categories?.length || 0} Categories...`);
  const categoryIdMap = new Map<string, string>();

  // Map slug tương đương để không làm vỡ các route frontend cũ
  const slugAlias: Record<string, string> = {
    'nhan-vat-lich-su': 'nhan-vat',
    'su-kien-lich-su': 'su-kien',
    'dia-danh-lich-su': 'di-tich',
    'trieu-dai': 'trieu-dai',
  };

  for (const c of raw.categories || []) {
    const targetSlug = slugAlias[c.slug] || c.slug;
    const upserted = await prisma.category.upsert({
      where: { slug: targetSlug },
      update: {
        name: c.name,
        description: c.description ?? null,
        icon: c.icon ?? null,
        kind: (c.kind as ArticleKind) ?? null,
        displayOrder: c.displayOrder ?? 0,
      },
      create: {
        slug: targetSlug,
        name: c.name,
        description: c.description ?? null,
        icon: c.icon ?? null,
        kind: (c.kind as ArticleKind) ?? null,
        displayOrder: c.displayOrder ?? 0,
      },
    });
    categoryIdMap.set(c.id, upserted.id);
  }

  // 3. TAGS
  console.log(`3️⃣ Nạp ${raw.tags?.length || 0} Tags...`);
  const tagIdMap = new Map<string, string>();
  for (const tag of raw.tags || []) {
    const upserted = await prisma.tag.upsert({
      where: { name: tag.name },
      update: {
        description: tag.description ?? null,
        colorHex: tag.colorHex ?? null,
      },
      create: {
        name: tag.name,
        description: tag.description ?? null,
        colorHex: tag.colorHex ?? null,
      },
    });
    tagIdMap.set(tag.id, upserted.id);
  }

  // 4. ARTICLES
  console.log(`4️⃣ Nạp ${raw.articles?.length || 0} Articles...`);
  const articleIdMap = new Map<string, string>();
  for (const a of raw.articles || []) {
    const categoryId = a.categoryId ? categoryIdMap.get(a.categoryId) || null : null;
    const topicId = a.topicId ? topicIdMap.get(a.topicId) || null : null;

    const upserted = await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        summary: a.summary ?? null,
        coverImageUrl: a.coverImageUrl ?? null,
        coverCaption: a.coverCaption ?? null,
        contentBlocks: a.contentBlocks ?? [],
        metadata: a.metadata ?? null,
        dateText: a.dateText ?? null,
        startYear: a.startYear ?? null,
        endYear: a.endYear ?? null,
        datePrecision: a.datePrecision ?? null,
        isFeatured: Boolean(a.isFeatured),
        displayOrder: a.displayOrder ?? 0,
        status: (a.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        categoryId,
        topicId,
      },
      create: {
        slug: a.slug,
        title: a.title,
        summary: a.summary ?? null,
        coverImageUrl: a.coverImageUrl ?? null,
        coverCaption: a.coverCaption ?? null,
        contentBlocks: a.contentBlocks ?? [],
        metadata: a.metadata ?? null,
        dateText: a.dateText ?? null,
        startYear: a.startYear ?? null,
        endYear: a.endYear ?? null,
        datePrecision: a.datePrecision ?? null,
        isFeatured: Boolean(a.isFeatured),
        displayOrder: a.displayOrder ?? 0,
        status: (a.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        categoryId,
        topicId,
      },
    });
    articleIdMap.set(a.id, upserted.id);
  }

  // 5. ARTICLE TAGS
  console.log(`5️⃣ Gán Article Tags...`);
  for (const at of raw.articleTags || []) {
    const articleId = articleIdMap.get(at.articleId);
    const tagId = tagIdMap.get(at.tagId);
    if (articleId && tagId) {
      await prisma.articleTag.upsert({
        where: { articleId_tagId: { articleId, tagId } },
        update: {},
        create: { articleId, tagId },
      });
    }
  }

  // 6. ARTICLE LINKS (Liên kết 2 chiều)
  console.log(`6️⃣ Nạp ${raw.articleLinks?.length || 0} Article Links...`);
  for (const al of raw.articleLinks || []) {
    const sourceId = articleIdMap.get(al.sourceId);
    const targetId = articleIdMap.get(al.targetId);
    if (sourceId && targetId && sourceId !== targetId) {
      await prisma.articleLink.upsert({
        where: { sourceId_targetId: { sourceId, targetId } },
        update: {
          label: al.label ?? null,
          note: al.note ?? null,
          displayOrder: al.displayOrder ?? 0,
        },
        create: {
          sourceId,
          targetId,
          label: al.label ?? null,
          note: al.note ?? null,
          displayOrder: al.displayOrder ?? 0,
        },
      });
    }
  }

  // 7. TIMELINES & NODES
  console.log(`7️⃣ Nạp ${raw.timelines?.length || 0} Timelines & Nodes...`);
  for (const t of raw.timelines || []) {
    const topicId = t.topicId ? topicIdMap.get(t.topicId) || null : null;
    const timeline = await prisma.timeline.upsert({
      where: { slug: t.slug },
      update: {
        title: t.title,
        description: t.description ?? null,
        displayOrder: t.displayOrder ?? 0,
        status: (t.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        topicId,
      },
      create: {
        slug: t.slug,
        title: t.title,
        description: t.description ?? null,
        displayOrder: t.displayOrder ?? 0,
        status: (t.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        topicId,
      },
    });

    // Recreate nodes
    await prisma.timelineNode.deleteMany({ where: { timelineId: timeline.id } });
    if (t.nodes && Array.isArray(t.nodes)) {
      for (const [order, n] of t.nodes.entries()) {
        const articleId = n.articleId ? articleIdMap.get(n.articleId) || null : null;
        await prisma.timelineNode.create({
          data: {
            timelineId: timeline.id,
            articleId,
            title: n.title,
            description: n.description ?? null,
            imageUrl: n.imageUrl ?? null,
            dateText: n.dateText ?? null,
            year: n.year ?? null,
            month: n.month ?? null,
            day: n.day ?? null,
            endYear: n.endYear ?? null,
            displayOrder: n.displayOrder ?? order,
          },
        });
      }
    }
  }

  // 8. LEARNING PATHS & CHAPTERS
  console.log(`8️⃣ Nạp ${raw.learningPaths?.length || 0} Learning Paths...`);
  const lpIdMap = new Map<string, string>();
  for (const lp of raw.learningPaths || []) {
    const upserted = await prisma.learningPath.upsert({
      where: { slug: lp.slug },
      update: {
        title: lp.title,
        description: lp.description ?? null,
        pathType: (lp.pathType as LearningPathType) ?? LearningPathType.CHRONOLOGICAL,
        isSequential: Boolean(lp.isSequential),
        displayOrder: lp.displayOrder ?? 0,
        status: (lp.status as ContentStatus) ?? ContentStatus.PUBLISHED,
      },
      create: {
        slug: lp.slug,
        title: lp.title,
        description: lp.description ?? null,
        pathType: (lp.pathType as LearningPathType) ?? LearningPathType.CHRONOLOGICAL,
        isSequential: Boolean(lp.isSequential),
        displayOrder: lp.displayOrder ?? 0,
        status: (lp.status as ContentStatus) ?? ContentStatus.PUBLISHED,
      },
    });
    lpIdMap.set(lp.id, upserted.id);
  }

  const chapterIdMap = new Map<string, string>();
  for (const ch of raw.chapters || []) {
    const learningPathId = lpIdMap.get(ch.learningPathId);
    if (!learningPathId) continue;

    let existingChapter = await prisma.chapter.findFirst({
      where: { learningPathId, slug: ch.slug },
    });

    if (!existingChapter) {
      existingChapter = await prisma.chapter.create({
        data: {
          learningPathId,
          title: ch.title,
          slug: ch.slug,
          description: ch.description ?? null,
          displayOrder: ch.displayOrder ?? 0,
          status: (ch.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        },
      });
    }
    chapterIdMap.set(ch.id, existingChapter.id);
  }

  // 9. LESSONS & QUIZZES
  console.log(`9️⃣ Nạp ${raw.lessons?.length || 0} Lessons & Quizzes...`);
  const lessonIdMap = new Map<string, string>();
  for (const l of raw.lessons || []) {
    const topicId = l.topicId ? topicIdMap.get(l.topicId) || null : null;
    const upserted = await prisma.lesson.upsert({
      where: { slug: l.slug },
      update: {
        title: l.title,
        description: l.description ?? null,
        content: l.content ?? [],
        contentRichText: l.contentRichText ?? null,
        difficulty: (l.difficulty as DifficultyLevel) ?? DifficultyLevel.MEDIUM,
        sourceReferenceNote: l.sourceReferenceNote ?? null,
        status: (l.status as LessonStatus) ?? LessonStatus.PUBLISHED,
        displayOrder: l.displayOrder ?? 0,
        topicId,
      },
      create: {
        slug: l.slug,
        title: l.title,
        description: l.description ?? null,
        content: l.content ?? [],
        contentRichText: l.contentRichText ?? null,
        difficulty: (l.difficulty as DifficultyLevel) ?? DifficultyLevel.MEDIUM,
        sourceReferenceNote: l.sourceReferenceNote ?? null,
        status: (l.status as LessonStatus) ?? LessonStatus.PUBLISHED,
        displayOrder: l.displayOrder ?? 0,
        topicId,
      },
    });
    lessonIdMap.set(l.id, upserted.id);
  }

  // Chapter Lessons & Lesson Tags
  for (const cl of raw.chapterLessons || []) {
    const chapterId = chapterIdMap.get(cl.chapterId);
    const lessonId = lessonIdMap.get(cl.lessonId);
    if (chapterId && lessonId) {
      await prisma.chapterLesson.deleteMany({ where: { chapterId, lessonId } });
      await prisma.chapterLesson.create({
        data: { chapterId, lessonId, displayOrder: cl.displayOrder ?? 0 },
      });
    }
  }

  for (const lt of raw.lessonTags || []) {
    const lessonId = lessonIdMap.get(lt.lessonId);
    const tagId = tagIdMap.get(lt.tagId);
    if (lessonId && tagId) {
      await prisma.lessonTag.upsert({
        where: { lessonId_tagId: { lessonId, tagId } },
        update: {},
        create: { lessonId, tagId },
      });
    }
  }

  // Quizzes
  for (const qz of raw.quizzes || []) {
    const lessonId = lessonIdMap.get(qz.lessonId);
    if (!lessonId) continue;
    await prisma.quiz.upsert({
      where: { lessonId },
      update: {
        title: qz.title ?? null,
        description: qz.description ?? null,
        passingScorePercent: qz.passingScorePercent ?? 80,
        timeLimitMinutes: qz.timeLimitMinutes ?? 15,
        questions: qz.questions ?? [],
      },
      create: {
        lessonId,
        title: qz.title ?? null,
        description: qz.description ?? null,
        passingScorePercent: qz.passingScorePercent ?? 80,
        timeLimitMinutes: qz.timeLimitMinutes ?? 15,
        questions: qz.questions ?? [],
      },
    });
  }

  // 10. QUESTION BANK
  console.log(`🔟 Nạp ${raw.questions?.length || 0} Questions vào Ngân hàng đề...`);
  for (const q of raw.questions || []) {
    const mappedLessonIds = (q.lessonIds || [])
      .map((id: string) => lessonIdMap.get(id))
      .filter(Boolean) as string[];
    const mappedTopicIds = (q.topicIds || [])
      .map((id: string) => topicIdMap.get(id))
      .filter(Boolean) as string[];

    const existingQ = await prisma.question.findFirst({
      where: { prompt: q.prompt },
    });

    if (existingQ) {
      await prisma.question.update({
        where: { id: existingQ.id },
        data: {
          type: q.type,
          difficulty: q.difficulty ?? 'MEDIUM',
          points: q.points ?? 10,
          explanation: q.explanation ?? null,
          data: q.data ?? {},
          lessons: { set: mappedLessonIds.map((id) => ({ id })) },
          topics: { set: mappedTopicIds.map((id) => ({ id })) },
        },
      });
    } else {
      await prisma.question.create({
        data: {
          type: q.type,
          prompt: q.prompt,
          difficulty: q.difficulty ?? 'MEDIUM',
          points: q.points ?? 10,
          explanation: q.explanation ?? null,
          data: q.data ?? {},
          lessons: { connect: mappedLessonIds.map((id) => ({ id })) },
          topics: { connect: mappedTopicIds.map((id) => ({ id })) },
        },
      });
    }
  }

  console.log('\n🎉 THÀNH CÔNG: Đã nạp và làm giàu toàn bộ dữ liệu lịch sử chuẩn vào CSDL!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi nạp historical-dataset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
