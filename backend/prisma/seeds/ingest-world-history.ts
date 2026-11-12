/**
 * ingest-world-history.ts
 * -----------------------
 * Nạp dữ liệu Lịch sử Thế giới vừa cào từ scripts/crawler/data/processed/crawled_world_history.json:
 * - Topics: Lịch sử Thế giới -> Chiến tranh Thế giới thứ hai, Cách mạng Pháp & Napoléon
 * - Timelines: Dòng thời gian Thế chiến 2 (Châu Âu), Thời kỳ Napoléon (Châu Âu)
 * - Articles: Chiến tranh Thế giới thứ hai, Trận Stalingrad, Napoléon Bonaparte, Trận Waterloo, Julius Caesar
 *
 * Chạy bằng: cd backend; npx ts-node prisma/seeds/ingest-world-history.ts
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  PrismaClient,
  ContentStatus,
  TopicIcon,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  console.log('🚀 Bắt đầu nạp Lịch sử Thế giới vào DB...');

  const jsonPath = path.resolve(__dirname, '../../../scripts/crawler/data/processed/crawled_world_history.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file: ${jsonPath}`);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. TOPICS
  console.log('1️⃣ Nạp Topics Lịch sử Thế giới...');
  const worldRoot = await prisma.topic.upsert({
    where: { slug: 'lich-su-the-gioi' },
    update: {
      name: 'Lịch sử Thế giới',
      icon: TopicIcon.Castle,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
      description: 'Khám phá các nền văn minh cổ đại, các cuộc cách mạng và những biến cố định hình nhân loại.',
    },
    create: {
      slug: 'lich-su-the-gioi',
      name: 'Lịch sử Thế giới',
      icon: TopicIcon.Castle,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
      description: 'Khám phá các nền văn minh cổ đại, các cuộc cách mạng và những biến cố định hình nhân loại.',
    },
  });

  const topicIdMap = new Map<string, string>();
  topicIdMap.set('lich-su-the-gioi', worldRoot.id);

  for (const t of data.topics || []) {
    const child = await prisma.topic.upsert({
      where: { slug: t.childSlug },
      update: {
        parentId: worldRoot.id,
        name: t.childName,
        eyebrow: t.eyebrow,
        icon: TopicIcon.Swords,
        isFeatured: true,
        status: ContentStatus.PUBLISHED,
        description: t.description,
      },
      create: {
        slug: t.childSlug,
        parentId: worldRoot.id,
        name: t.childName,
        eyebrow: t.eyebrow,
        icon: TopicIcon.Swords,
        isFeatured: true,
        status: ContentStatus.PUBLISHED,
        description: t.description,
      },
    });
    topicIdMap.set(t.childSlug, child.id);
  }

  // 2. ARTICLES
  console.log('2️⃣ Nạp Articles Lịch sử Thế giới...');
  const articleIdMap = new Map<string, string>();

  for (const a of data.articles || []) {
    const category = await prisma.category.findUnique({ where: { slug: a.categorySlug } });
    if (!category) continue;

    const topicId = topicIdMap.get(a.topicSlug) || worldRoot.id;

    const upserted = await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        summary: a.summary,
        categoryId: category.id,
        topicId,
        dateText: a.dateText,
        startYear: a.startYear,
        endYear: a.endYear,
        metadata: a.metadata || {},
        contentBlocks: a.contentBlocks || [],
        status: ContentStatus.PUBLISHED,
      },
      create: {
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        categoryId: category.id,
        topicId,
        dateText: a.dateText,
        startYear: a.startYear,
        endYear: a.endYear,
        metadata: a.metadata || {},
        contentBlocks: a.contentBlocks || [],
        status: ContentStatus.PUBLISHED,
      },
    });

    articleIdMap.set(a.slug, upserted.id);

    // Tags
    for (const tagName of a.tags || []) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      await prisma.articleTag.upsert({
        where: { articleId_tagId: { articleId: upserted.id, tagId: tag.id } },
        update: {},
        create: { articleId: upserted.id, tagId: tag.id },
      });
    }

    console.log(`✅ Đã nạp Article: ${upserted.title}`);
  }

  // 3. TIMELINES
  console.log('3️⃣ Nạp Timelines Lịch sử Thế giới...');
  for (const t of data.timelines || []) {
    const topicId = topicIdMap.get(t.topicSlug) || worldRoot.id;

    const timeline = await prisma.timeline.upsert({
      where: { slug: t.slug },
      update: {
        title: t.title,
        description: t.description,
        topicId,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        slug: t.slug,
        title: t.title,
        description: t.description,
        topicId,
        status: ContentStatus.PUBLISHED,
      },
    });

    await prisma.timelineNode.deleteMany({ where: { timelineId: timeline.id } });

    for (const [order, n] of t.nodes.entries()) {
      const articleId = n.articleSlug ? articleIdMap.get(n.articleSlug) || null : null;
      await prisma.timelineNode.create({
        data: {
          timelineId: timeline.id,
          articleId,
          title: n.title,
          description: n.description,
          dateText: n.dateText,
          year: n.year,
          month: n.month ?? null,
          day: n.day ?? null,
          displayOrder: order,
        },
      });
    }

    console.log(`✅ Đã nạp Timeline: ${timeline.title} (${t.nodes.length} nodes)`);
  }

  console.log('\n🎉 THÀNH CÔNG: Đã nạp xong toàn bộ dữ liệu Lịch sử Thế giới!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
