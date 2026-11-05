/**
 * Automated Validation Test for Bach Dang 1288 & Tran Dynasty Knowledge Graph
 * Kiểm thử tự động tính toàn vẹn của Đồ thị tri thức và Cấu trúc khối JSONB
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function runValidation() {
  console.log('🧪 Bắt đầu Automated Validation cho dữ liệu Sự kiện Đại thắng Bạch Đằng 1288...\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Validation failed on: ${message}`);
    }
  }

  try {
    // 1. Kiểm tra Thực thể Sự kiện Bạch Đằng
    const bachDang = await prisma.historicalEntity.findUnique({
      where: { slug: 'dai-thang-bach-dang-1288' },
      include: {
        period: true,
        event: true,
        subjectStatements: {
          include: { predicate: true, object: true },
        },
        objectStatements: {
          include: { predicate: true, subject: true },
        },
      },
    });

    assert(Boolean(bachDang), 'Thực thể "dai-thang-bach-dang-1288" phải tồn tại trong CSDL');
    assert(bachDang?.type === 'EVENT', 'Loại thực thể phải là EVENT');
    assert(bachDang?.period?.slug === 'thoi-ky-nha-tran', 'Sự kiện phải được gắn trực tiếp vào Period "thoi-ky-nha-tran"');
    assert(Boolean(bachDang?.event), 'Bản ghi bảng con HistoricalEvent phải tồn tại');

    // 2. Kiểm tra JSONB ContentBlocks
    const blocks = bachDang?.contentBlocks as Array<Record<string, any>> | null;
    assert(Array.isArray(blocks) && blocks.length > 0, 'Trường contentBlocks (JSONB) phải là mảng không rỗng');
    assert(blocks!.length === 10, `Số lượng khối JSONB phải là 10 (Hiện có: ${blocks?.length})`);

    const blockTypes = blocks!.map((b) => b.type);
    const requiredTypes = ['QUOTE', 'TEXT', 'CALLOUT', 'COMPARISON_TABLE', 'TIMELINE', 'SECTION_ROW', 'MAP', 'IMAGE'];
    for (const reqType of requiredTypes) {
      assert(blockTypes.includes(reqType), `contentBlocks phải chứa khối loại ${reqType}`);
    }

    // Kiểm tra tính duy nhất của ID khối
    const blockIds = blocks!.map((b) => b.id);
    const uniqueIds = new Set(blockIds);
    assert(blockIds.length === uniqueIds.size, 'Tất cả block IDs phải duy nhất, không trùng lặp');

    // 3. Kiểm tra Quan hệ Nhân quả (Causal Graph)
    const vanDonLink = bachDang?.subjectStatements.find(
      (s) => s.predicate.code === 'CAUSED_BY' && s.object?.slug === 'tran-van-don-1288',
    );
    assert(Boolean(vanDonLink), 'Phải có quan hệ nhân quả: Đại thắng Bạch Đằng CAUSED_BY Trận Vân Đồn 1288');
    assert(
      Boolean((vanDonLink?.qualifiers as any)?.mechanism),
      'Quan hệ nhân quả phải có giải thích cơ chế tác động (qualifiers.mechanism)',
    );

    // 4. Kiểm tra Quan hệ Chỉ huy & Tham chiến
    const thdCommand = bachDang?.objectStatements.find(
      (s) => s.predicate.code === 'COMMANDED' && s.subject.slug === 'tran-hung-dao',
    );
    assert(Boolean(thdCommand), 'Trần Hưng Đạo phải có quan hệ COMMANDED đối với Đại thắng Bạch Đằng 1288');
    assert(thdCommand?.isPrimary === true, 'Quan hệ chỉ huy của Trần Hưng Đạo phải là isPrimary = true');

    const oMaNhiParticipant = bachDang?.objectStatements.find(
      (s) => s.predicate.code === 'PARTICIPATED_IN' && s.subject.slug === 'o-ma-nhi',
    );
    assert(Boolean(oMaNhiParticipant), 'Ô Mã Nhi phải có quan hệ PARTICIPATED_IN đối với trận Bạch Đằng');
    assert(
      (oMaNhiParticipant?.qualifiers as any)?.role === 'OPPONENT',
      'Vai trò của Ô Mã Nhi phải được định nghĩa là OPPONENT trong qualifiers',
    );

    // 5. Kiểm tra Địa danh diễn ra
    const locationLink = bachDang?.subjectStatements.find(
      (s) => s.predicate.code === 'OCCURRED_AT' && s.object?.slug === 'song-bach-dang',
    );
    assert(Boolean(locationLink), 'Sự kiện phải có quan hệ OCCURRED_AT tới địa danh "song-bach-dang"');

    // 6. Kiểm tra Hiện vật Bãi cọc Bạch Đằng
    const baiCoc = await prisma.historicalEntity.findUnique({
      where: { slug: 'bai-coc-bach-dang' },
      include: {
        subjectStatements: {
          include: { predicate: true, object: true },
        },
      },
    });
    assert(Boolean(baiCoc), 'Hiện vật "bai-coc-bach-dang" phải tồn tại');
    const baiCocLocation = baiCoc?.subjectStatements.find(
      (s) => s.predicate.code === 'LOCATED_AT' && s.object?.slug === 'song-bach-dang',
    );
    assert(Boolean(baiCocLocation), 'Hiện vật bãi cọc phải có quan hệ LOCATED_AT tại "song-bach-dang"');

    console.log(`\n🎉 TẤT CẢ KIỂM THỬ ĐẠT CHUẨN: ${passedTests}/${totalTests} tests passed successfully!`);
  } catch (error) {
    console.error('\n❌ VALIDATION TEST THẤT BẠI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runValidation();
