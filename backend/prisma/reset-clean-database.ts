/**
 * Script làm sạch toàn bộ dữ liệu lịch sử và tái tạo Taxonomy chuẩn (không dấu gạch chéo /).
 * Không xóa tài khoản authUser / staff / profiles.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedTaxonomyV1 } from './seeds/taxonomy-v1.seed';
import { seedPeriodsV1 } from './seeds/periods-v1.seed';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function resetCleanDatabase() {
  console.log('🧹 Bắt đầu dọn sạch dữ liệu cũ trong cơ sở dữ liệu...');

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      historical_statement_references,
      historical_statements,
      historical_references,
      historical_entity_media,
      historical_events,
      persons,
      historical_sites,
      historical_entities,
      periods,
      content_revisions,
      taxonomy_predicate_rules,
      taxonomy_terms,
      taxonomy_groups
    CASCADE;
  `);

  console.log('✨ Đã xóa sạch dữ liệu thực thể, sự kiện, thời kỳ, quan hệ và taxonomy cũ.');
  console.log('🌱 Đang nạp lại bộ Taxonomy chuẩn hóa mới...');

  await seedTaxonomyV1();
  console.log('🏛️ Đang nạp danh mục Period chuẩn hóa 2 cấp...');
  await seedPeriodsV1();

  console.log('🎉 Hoàn tất làm sạch cơ sở dữ liệu và nạp Taxonomy + Periods chuẩn hóa!');
}

resetCleanDatabase()
  .catch((err) => {
    console.error('❌ Lỗi khi dọn dẹp cơ sở dữ liệu:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
