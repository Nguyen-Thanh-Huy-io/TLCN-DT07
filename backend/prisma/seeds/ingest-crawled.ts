/**
 * ingest-crawled.ts
 * -----------------
 * Nạp dữ liệu vừa cào được từ scripts/crawler/data/processed/crawled_articles.json
 * vào PostgreSQL thông qua Prisma (idempotent upsert).
 *
 * Chạy bằng: npx ts-node prisma/seeds/ingest-crawled.ts
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, ContentStatus, TopicIcon } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  console.log('🚀 Bắt đầu nạp dữ liệu cào tự động vào DB...');

  const jsonPath = path.resolve(__dirname, '../../../scripts/crawler/data/processed/crawled_articles.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file dữ liệu cào tại: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const articles: any[] = JSON.parse(rawData);

  console.log(`📦 Tìm thấy ${articles.length} bài viết cần nạp.`);

  // 1. Đảm bảo có Topic tương ứng
  // Lam Sơn
  const lamSonRoot = await prisma.topic.upsert({
    where: { slug: 'lich-su-co-trung-dai' },
    update: {},
    create: {
      slug: 'lich-su-co-trung-dai',
      name: 'Lịch sử Việt Nam Cổ - Trung đại',
      icon: TopicIcon.Castle,
      status: ContentStatus.PUBLISHED,
    },
  });

  const lamSonChild = await prisma.topic.upsert({
    where: { slug: 'khoi-nghia-lam-son' },
    update: { parentId: lamSonRoot.id },
    create: {
      slug: 'khoi-nghia-lam-son',
      parentId: lamSonRoot.id,
      name: 'Khởi nghĩa Lam Sơn & Triều Lê sơ',
      eyebrow: '1418 - 1427',
      icon: TopicIcon.Swords,
      status: ContentStatus.PUBLISHED,
      description: 'Cuộc khởi nghĩa trường kỳ 10 năm do Lê Lợi lãnh đạo giành lại độc lập hoàn toàn trước ách đô hộ của nhà Minh.',
    },
  });

  // Điện Biên Phủ / Cận - Hiện đại
  const modernRoot = await prisma.topic.upsert({
    where: { slug: 'lich-su-can-hien-dai' },
    update: {},
    create: {
      slug: 'lich-su-can-hien-dai',
      name: 'Lịch sử Việt Nam Cận - Hiện đại',
      icon: TopicIcon.Swords,
      status: ContentStatus.PUBLISHED,
    },
  });

  const modernChild = await prisma.topic.upsert({
    where: { slug: 'khang-chien-chong-phap-1945-1954' },
    update: { parentId: modernRoot.id },
    create: {
      slug: 'khang-chien-chong-phap-1945-1954',
      parentId: modernRoot.id,
      name: 'Kháng chiến chống thực dân Pháp (1945 - 1954)',
      eyebrow: '1945 - 1954',
      icon: TopicIcon.Landmark,
      status: ContentStatus.PUBLISHED,
      description: 'Chín năm kháng chiến trường kỳ gian khổ kết thúc bằng chiến thắng Điện Biên Phủ lừng lẫy năm châu.',
    },
  });

  const topicMap: Record<string, string> = {
    'khoi-nghia-lam-son': lamSonChild.id,
    'khang-chien-chong-phap-1945-1954': modernChild.id,
  };

  // 2. Nạp từng Article
  for (const item of articles) {
    const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
    if (!category) {
      console.warn(`⚠️ Bỏ qua ${item.title}: Không tìm thấy Category "${item.categorySlug}"`);
      continue;
    }

    const topicId = topicMap[item.topicSlug] || null;

    const article = await prisma.article.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        summary: item.summary,
        categoryId: category.id,
        topicId: topicId,
        dateText: item.dateText,
        startYear: item.startYear,
        endYear: item.endYear,
        metadata: item.metadata || {},
        contentBlocks: item.contentBlocks || [],
        status: ContentStatus.PUBLISHED,
      },
      create: {
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        categoryId: category.id,
        topicId: topicId,
        dateText: item.dateText,
        startYear: item.startYear,
        endYear: item.endYear,
        metadata: item.metadata || {},
        contentBlocks: item.contentBlocks || [],
        status: ContentStatus.PUBLISHED,
      },
    });

    // 3. Xử lý Tags
    if (item.tags && Array.isArray(item.tags)) {
      for (const tagName of item.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        const exists = await prisma.articleTag.findUnique({
          where: { articleId_tagId: { articleId: article.id, tagId: tag.id } },
        });

        if (!exists) {
          await prisma.articleTag.create({
            data: { articleId: article.id, tagId: tag.id },
          });
        }
      }
    }

    console.log(`✅ Đã nạp thành công: ${article.title} (${item.slug})`);
  }

  console.log('\n🎉 NẠP TOÀN BỘ DỮ LIỆU CÀO THÀNH CÔNG!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi nạp dữ liệu cào:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
