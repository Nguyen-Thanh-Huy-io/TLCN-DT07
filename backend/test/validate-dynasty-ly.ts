/**
 * Automated Validation Test for Sample Dynasty Crawl & JSONB Blocks (Nhà Lý)
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function runValidation() {
  console.log('🧪 Bắt đầu Automated Validation cho Triều đại Nhà Lý...\n');

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, msg: string) {
    total++;
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
  }

  try {
    const nhaLy = await prisma.historicalEntity.findUnique({
      where: { slug: 'nha-ly' },
      include: { period: true },
    });

    assert(Boolean(nhaLy), 'Thực thể "nha-ly" phải tồn tại trong CSDL');
    assert(nhaLy?.type === 'DYNASTY', 'Loại thực thể phải là DYNASTY');
    assert(nhaLy?.startYear === 1009, 'Năm bắt đầu phải là 1009');
    assert(nhaLy?.endYear === 1225, 'Năm kết thúc phải là 1225');
    assert(nhaLy?.period?.slug === 'thoi-ky-nha-ly', 'Triều đại phải được gắn trực tiếp vào Period "thoi-ky-nha-ly"');
    assert(Boolean(nhaLy?.imageUrl), 'Phải có hình ảnh bản đồ/cương vực từ Wikipedia');

    // Kiểm tra cấu trúc blocks JSONB
    const blocks = nhaLy?.contentBlocks as Array<Record<string, any>> | null;
    assert(Array.isArray(blocks) && blocks.length === 8, 'contentBlocks phải có đúng 8 khối đa phương thức');

    const blockTypes = blocks!.map((b) => b.type);
    const expectedTypes = ['QUOTE', 'TEXT', 'CALLOUT', 'COMPARISON_TABLE', 'TIMELINE', 'MAP', 'IMAGE'];
    for (const t of expectedTypes) {
      assert(blockTypes.includes(t), `contentBlocks phải chứa khối loại ${t}`);
    }

    const uniqueIds = new Set(blocks!.map((b) => b.id));
    assert(uniqueIds.size === blocks!.length, 'Tất cả block ID phải là duy nhất');

    // Kiểm tra nội dung khối đặc thù
    const quoteBlock = blocks!.find((b) => b.type === 'QUOTE');
    assert(quoteBlock?.quote?.includes('Huống chi thành Đại La'), 'Khối QUOTE phải chứa Chiếu dời đô');

    const tableBlock = blocks!.find((b) => b.type === 'COMPARISON_TABLE');
    assert(tableBlock?.rows?.length === 9, 'Bảng phả hệ phải chứa đủ 9 vị Hoàng đế triều Lý');

    const timelineBlock = blocks!.find((b) => b.type === 'TIMELINE');
    assert(timelineBlock?.nodes?.length >= 7, 'Trục TIMELINE phải có ít nhất 7 mốc son lịch sử');

    console.log(`\n🎉 TẤT CẢ KIỂM THỬ THÀNH CÔNG: ${passed}/${total} assertions passed!`);
  } catch (err) {
    console.error('\n❌ VALIDATION THẤT BẠI:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runValidation();
