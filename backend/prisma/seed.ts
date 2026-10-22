import 'dotenv/config';
import {
  PrismaClient,
  ContentStatus,
  LessonStatus,
  DifficultyLevel,
  userRole,
  userStatus,
  LearningPathType,
  HistoricalEntityType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { toSlug } from '../src/common/utils/slug.util';
import {
  DIEN_BIEN_PHU_BLOCKS_DATA,
  DIEN_BIEN_PHU_QUIZ_DATA,
} from './seed-lesson-dien-bien-phu';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('================================================================');
  console.log('   BẮT ĐẦU QUY TRÌNH LÀM SẠCH VÀ SEEDING DỮ LIỆU CHUẨN LỊCH SỬ   ');
  console.log('         GIAI ĐOẠN: KHÁNG CHIẾN CHỐNG MỸ, CỨU NƯỚC (1954 - 1975)  ');
  console.log('================================================================');

  // -------------------------------------------------------------
  // BƯỚC 0: XÓA SẠCH DỮ LIỆU CŨ THEO TRẬT TỰ RÀNG BUỘC KHÓA NGOẠI
  // -------------------------------------------------------------
  console.log('\n[1/5] Đang xóa sạch toàn bộ dữ liệu lịch sử cũ...');
  // Xóa Lộ trình trước (Chapter/ChapterLesson cascade theo) — bảng này độc lập với
  // Topic/Lesson bên dưới nhưng vẫn phải xóa mỗi lần seed lại để tránh đụng unique slug.
  await prisma.learningPath.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.historicalEvent.updateMany({ data: { parentId: null } });
  await prisma.historicalEvent.deleteMany();
  await prisma.historicalEntity.deleteMany();
    // Ngắt quan hệ cha - con của topic trước khi xóa sạch topic
  await prisma.topic.updateMany({ data: { parentId: null } });
  await prisma.topic.deleteMany();
  await prisma.period.deleteMany();
  await prisma.tag.deleteMany();
  console.log('✓ Hoàn tất làm sạch cơ sở dữ liệu.');

  // -------------------------------------------------------------
  // BƯỚC 1: KHỞI TẠO HOẶC CẬP NHẬT TÀI KHOẢN QUẢN TRỊ VIÊN (ADMIN)
  // -------------------------------------------------------------
  console.log('\n[2/5] Khởi tạo tài khoản Quản trị viên (Admin)...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123456', salt);

  const adminUser = await prisma.authUser.upsert({
    where: { email: 'admin@hisgo.edu.vn' },
    update: {
      status: userStatus.ACTIVE,
      verified: true,
      role: userRole.ADMIN,
      tokenVersion: 1,
    },
    create: {
      email: 'admin@hisgo.edu.vn',
      username: 'admin_hisgo',
      password: passwordHash,
      role: userRole.ADMIN,
      status: userStatus.ACTIVE,
      verified: true,
      tokenVersion: 1,
      userProfile: {
        create: {
          firstName: 'Quản trị viên',
          lastName: 'HisGo',
          bio: 'Tài khoản quản trị nội dung hệ thống học lịch sử HISGO.',
        },
      },
    },
  });
  console.log(`✓ Tài khoản Admin: ${adminUser.email} (Mật khẩu: Admin@123456)`);

  // -------------------------------------------------------------
  // BƯỚC 2: KHỞI TẠO CÁC THẺ PHÂN LOẠI (TAGS)
  // -------------------------------------------------------------
  console.log('\n[3/5] Khởi tạo hệ thống Thẻ phân loại (Tags)...');
  const tagData = [
    {
      name: 'Kháng chiến chống Mỹ',
      description: 'Chủ đề và bài học thuộc cuộc Kháng chiến chống Mỹ cứu nước (1954 - 1975)',
      colorHex: '#1E40AF',
    },
    {
      name: 'Chiến dịch quân sự',
      description: 'Các chiến dịch quân sự quy mô lớn mang tính bước ngoặt',
      colorHex: '#DC2626',
    },
    {
      name: 'Phong trào quần chúng',
      description: 'Khởi nghĩa từng phần, phong trào quần chúng, Đội quân tóc dài',
      colorHex: '#059669',
    },
    {
      name: 'Phòng không - Không quân',
      description: 'Chiến đấu bảo vệ vùng trời Tổ quốc miền Bắc',
      colorHex: '#0284C7',
    },
    {
      name: 'Mặt trận ngoại giao',
      description: 'Đấu tranh ngoại giao, đàm phán và Hiệp định Paris 1973',
      colorHex: '#7C3AED',
    },
    {
      name: 'Hậu phương miền Bắc',
      description: 'Xây dựng CNXH ở miền Bắc và chi viện sức người sức của cho tiền tuyến',
      colorHex: '#0D9488',
    },
    {
      name: 'Đại thắng mùa Xuân 1975',
      description: 'Cuộc Tổng tiến công và nổi dậy mùa Xuân 1975 giải phóng trọn vẹn non sông',
      colorHex: '#D97706',
    },
  ];

  const createdTags: Record<string, string> = {};
  for (const t of tagData) {
    const tag = await prisma.tag.create({ data: t });
    createdTags[t.name] = tag.id;
  }
  console.log(`✓ Đã tạo ${Object.keys(createdTags).length} Thẻ phân loại (Tags).`);

  // -------------------------------------------------------------
  // BƯỚC 3: KHỞI TẠO DUY NHẤT GIAI ĐOẠN LỊCH SỬ CHUẨN
  // -------------------------------------------------------------
  console.log('\n[4/5] Khởi tạo Giai đoạn Lịch sử: Kháng chiến chống Mỹ, cứu nước (1954 - 1975)...');
  const period = await prisma.period.create({
    data: {
      id: 'a0000000-0000-4000-8000-000000000001',
      name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
      slug: 'khang-chien-chong-my-cuu-nuoc-1954-1975',
      timeLabel: '(1954 - 1975)',
      region: 'Toàn quốc',
      startYear: 1954,
      endYear: 1975,
      description:
        'Giai đoạn lịch sử oanh liệt của dân tộc Việt Nam: thực hiện đồng thời hai nhiệm vụ chiến lược - xây dựng chủ nghĩa xã hội ở miền Bắc làm hậu phương lớn vững chắc và tiến hành cách mạng dân tộc dân chủ nhân dân ở miền Nam, kiên cường đánh bại các chiến lược chiến tranh của đế quốc Mỹ, đỉnh cao là Đại thắng mùa Xuân 1975, thu non sông về một mối.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });
  console.log(`✓ Giai đoạn duy nhất: "${period.name}" (${period.startYear} - ${period.endYear})`);

  // -------------------------------------------------------------
  // BƯỚC 4: KHỞI TẠO CÂY CHỦ ĐỀ PHÂN CẤP (COMPOSITE TOPIC TREE)
  // Gồm:
  // - CẤP 1 (Chủ đề gốc duy nhất): Kháng chiến chống Mỹ, cứu nước (1954 - 1975)
  // - CẤP 2 (5 Giai đoạn chiến lược)
  // - CẤP 3 (11 Chuyên đề / Chiến dịch tiêu biểu)
  // -------------------------------------------------------------
  console.log('\n[5/5] Khởi tạo Cây chủ đề phân cấp chuẩn SGK Lịch sử 12 & Lịch sử Quân sự...');

  // 0. Cấp 1 (Chủ đề gốc duy nhất): Kháng chiến chống Mỹ, cứu nước (1954 - 1975)
  const rootTopicWar = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000000',
      
      parentId: null,
      name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
      slug: 'chu-de-khang-chien-chong-my-cuu-nuoc-1954-1975',
      description:
        'Toàn bộ tiến trình lịch sử 21 năm kháng chiến chống Mỹ cứu nước của nhân dân Việt Nam: thực hiện đồng thời hai nhiệm vụ chiến lược - xây dựng CNXH ở miền Bắc và đánh bại các chiến lược chiến tranh của đế quốc Mỹ ở miền Nam, tiến tới Đại thắng mùa Xuân 1975 thống nhất non sông.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      isSequential: true,
      status: ContentStatus.PUBLISHED,
      coverImageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // 1. Cấp 2: Giai đoạn 1954 - 1960
  const rootTopic1 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000001',
      
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1954 - 1960: Giữ gìn lực lượng và Phong trào Đồng Khởi',
      slug: toSlug('Giai đoạn 1954 - 1960: Giữ gìn lực lượng và Phong trào Đồng Khởi'),
      eyebrow: 'GIAI ĐOẠN 1954 - 1960',
      isFeatured: true,
      description:
        'Thời kỳ miền Bắc khôi phục kinh tế, tiến hành cải tạo XHCN; miền Nam kiên cường đấu tranh giữ gìn lực lượng cách mạng, chuyển từ thế phòng ngự sang thế tiến công với phong trào Đồng Khởi vang dội.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      isSequential: true,
      status: ContentStatus.PUBLISHED,
      coverImageUrl:
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const child1_1 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000011',
      
      parentId: rootTopic1.id,
      name: 'Xây dựng hậu phương miền Bắc và chi viện cho tiền tuyến (1954 - 1959)',
      slug: toSlug('Xây dựng hậu phương miền Bắc và chi viện cho tiền tuyến (1954 - 1959)'),
      description:
        'Miền Bắc hoàn thành cải cách ruộng đất, khôi phục kinh tế sau kháng chiến chống Pháp, mở đường Trường Sơn lịch sử (19/5/1959) chi viện miền Nam.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child1_2 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000012',
      
      parentId: rootTopic1.id,
      name: 'Phong trào Đồng Khởi (1959 - 1960) & Sự ra đời của Mặt trận Dân tộc Giải phóng',
      slug: toSlug('Phong trào Đồng Khởi (1959 - 1960) & Sự ra đời của Mặt trận Dân tộc Giải phóng'),
      description:
        'Nghị quyết Trung ương 15 mở đường cho khởi nghĩa vũ trang, cao trào Đồng Khởi Bến Tre bùng nổ, thành lập Mặt trận Dân tộc Giải phóng miền Nam Việt Nam (20/12/1960).',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  // 2. Cấp 2: Giai đoạn 1961 - 1965
  const rootTopic2 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000002',
      
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1961 - 1965: Đánh bại chiến lược "Chiến tranh đặc biệt"',
      slug: toSlug('Giai đoạn 1961 - 1965: Đánh bại chiến lược Chiến tranh đặc biệt'),
      eyebrow: 'GIAI ĐOẠN 1961 - 1965',
      isFeatured: true,
      description:
        'Quân và dân miền Nam đánh bại chiến lược Chiến tranh đặc biệt của đế quốc Mỹ với công thức "quân ngụy + vũ khí và cố vấn chỉ huy Mỹ", đập tan quốc sách Ấp chiến lược và các chiến thuật "trực thăng vận", "thiết xa vận".',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 2,
      isSequential: true,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child2_1 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000021',
      
      parentId: rootTopic2.id,
      name: 'Chiến thắng Ấp Bắc (1963) và cao trào phá tan Quốc sách Ấp chiến lược',
      slug: toSlug('Chiến thắng Ấp Bắc (1963) và cao trào phá tan Quốc sách Ấp chiến lược'),
      description:
        'Chiến thắng Ấp Bắc (02/01/1963) bẻ gãy chiến thuật trực thăng vận và thiết xa vận, dấy lên phong trào "Thi đua Ấp Bắc, giết giặc lập công".',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child2_2 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000022',
      
      parentId: rootTopic2.id,
      name: 'Các chiến dịch Bình Giã, Ba Gia, Đồng Xoài - Phá sản hoàn toàn Chiến tranh đặc biệt',
      slug: toSlug('Các chiến dịch Bình Giã, Ba Gia, Đồng Xoài - Phá sản hoàn toàn Chiến tranh đặc biệt'),
      description:
        'Những đòn tiến công tiêu diệt nhiều tiểu đoàn, trung đoàn chủ lực ngụy tại Đông Nam Bộ và Trung Bộ, buộc Mỹ phải chuyển sang Chiến tranh cục bộ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  // 3. Cấp 2: Giai đoạn 1965 - 1968
  const rootTopic3 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000003',
      
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1965 - 1968: Đánh bại "Chiến tranh cục bộ" & Tổng tiến công Tết Mậu Thân',
      slug: toSlug('Giai đoạn 1965 - 1968: Đánh bại Chiến tranh cục bộ & Tổng tiến công Tết Mậu Thân'),
      eyebrow: 'GIAI ĐOẠN 1965 - 1968',
      isFeatured: true,
      description:
        'Đế quốc Mỹ ồ ạt đưa quân viễn chinh vào miền Nam và phát động chiến tranh phá hoại miền Bắc. Quân dân hai miền dũng mãnh giáng trả, đỉnh cao là đòn sấm sét Tết Mậu Thân 1968 làm rung chuyển nước Mỹ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 3,
      isSequential: true,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child3_1 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000031',
      
      parentId: rootTopic3.id,
      name: 'Chiến thắng Núi Thành, Vạn Tường & Bẻ gãy hai cuộc phản công chiến lược mùa khô',
      slug: toSlug('Chiến thắng Núi Thành, Vạn Tường & Bẻ gãy hai cuộc phản công chiến lược mùa khô'),
      description:
        'Trận Vạn Tường (18/8/1965) khẳng định quân dân ta hoàn toàn có khả năng đánh thắng lính Mỹ xâm lược; bẻ gãy 2 cuộc phản công mùa khô 1965-1966 và 1966-1967.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child3_2 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000032',
      
      parentId: rootTopic3.id,
      name: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968 - Bước ngoặt chiến tranh',
      slug: toSlug('Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968 - Bước ngoặt chiến tranh'),
      description:
        'Đồng loạt tập kích vào các cơ quan đầu não đối phương tại Sài Gòn và khắp đô thị miền Nam, làm phá sản Chiến tranh cục bộ, buộc Mỹ phải ngồi vào bàn đàm phán tại Paris.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  // 4. Cấp 2: Giai đoạn 1969 - 1973
  const rootTopic4 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000004',
      
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1969 - 1973: Đánh bại "Việt Nam hóa chiến tranh" & Hiệp định Paris 1973',
      slug: toSlug('Giai đoạn 1969 - 1973: Đánh bại Việt Nam hóa chiến tranh & Hiệp định Paris 1973'),
      eyebrow: 'GIAI ĐOẠN 1969 - 1973',
      isFeatured: true,
      description:
        'Đập tan âm mưu "dùng người Việt đánh người Việt" và tập kích hủy diệt bằng B-52, lập nên kỳ tích "Điện Biên Phủ trên không", buộc Mỹ ký Hiệp định Paris rút hết quân viễn chinh về nước.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 4,
      isSequential: true,
      status: ContentStatus.PUBLISHED,
      coverImageUrl:
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const child4_1 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000041',
      
      parentId: rootTopic4.id,
      name: 'Chiến thắng Đường 9 - Nam Lào (1971) và Tiến công chiến lược 1972',
      slug: toSlug('Chiến thắng Đường 9 - Nam Lào (1971) và Tiến công chiến lược 1972'),
      description:
        'Bẻ gãy cuộc hành quân Lam Sơn 719 của địch, đòn tiến công chiến lược năm 1972 chọc thủng 3 phòng tuyến mạnh nhất của địch tại Quảng Trị, Tây Nguyên, Đông Nam Bộ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child4_2 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000042',
      
      parentId: rootTopic4.id,
      name: 'Trận Điện Biên Phủ trên không 12 ngày đêm (1972) & Ký kết Hiệp định Paris (1973)',
      slug: toSlug('Trận Điện Biên Phủ trên không 12 ngày đêm (1972) & Ký kết Hiệp định Paris (1973)'),
      description:
        'Quân dân miền Bắc bắn rơi 34 pháo đài bay B-52 của không quân Mỹ trong 12 ngày đêm cuối năm 1972, buộc Mỹ ký Hiệp định Paris ngày 27/01/1973 rút toàn bộ quân về nước.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  // 5. Cấp 2: Giai đoạn 1973 - 1975
  const rootTopic5 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000005',
      
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1973 - 1975: Tổng tiến công và nổi dậy mùa Xuân 1975 giải phóng miền Nam',
      slug: toSlug('Giai đoạn 1973 - 1975: Tổng tiến công và nổi dậy mùa Xuân 1975 giải phóng miền Nam'),
      eyebrow: 'ĐẠI THẮNG MÙA XUÂN 1975',
      isFeatured: true,
      description:
        'Thời cơ lịch sử chín muồi, quân dân ta mở cuộc Tổng tiến công và nổi dậy thần tốc qua 3 chiến dịch đòn bẩy: Tây Nguyên, Huế - Đà Nẵng và Chiến dịch Hồ Chí Minh lịch sử, giải phóng hoàn toàn miền Nam ngày 30/4/1975.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 5,
      isSequential: true,
      status: ContentStatus.PUBLISHED,
      coverImageUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const child5_1 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000051',
      
      parentId: rootTopic5.id,
      name: 'Chiến thắng Phước Long (01/1975) & Hội nghị Bộ Chính trị hạ quyết tâm chiến lược',
      slug: toSlug('Chiến thắng Phước Long (01/1975) & Hội nghị Bộ Chính trị hạ quyết tâm chiến lược'),
      description:
        'Trận trinh sát chiến lược Phước Long chứng minh quân ngụy đã suy yếu rõ rệt và Mỹ không còn khả năng can thiệp trở lại; Bộ Chính trị quyết định kế hoạch giải phóng miền Nam trong 2 năm 1975-1976.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child5_2 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000052',
      
      parentId: rootTopic5.id,
      name: 'Chiến dịch Tây Nguyên & Chiến dịch giải phóng Huế - Đà Nẵng (Tháng 3/1975)',
      slug: toSlug('Chiến dịch Tây Nguyên & Chiến dịch giải phóng Huế - Đà Nẵng (Tháng 3/1975)'),
      description:
        'Đòn điểm huyệt Buôn Ma Thuột (10/3/1975) làm rung chuyển toàn bộ chiến trường; tiếp nối là chiến dịch tiến công giải phóng Cố đô Huế (26/3) và thành phố Đà Nẵng (29/3).',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  const child5_3 = await prisma.topic.create({
    data: {
      id: 'b0000000-0000-4000-8000-000000000053',
      
      parentId: rootTopic5.id,
      name: 'Chiến dịch Hồ Chí Minh lịch sử - Đại thắng ngày 30/4/1975 non sông liền một dải',
      slug: toSlug('Chiến dịch Hồ Chí Minh lịch sử - Đại thắng ngày 30/4/1975 non sông liền một dải'),
      description:
        '5 cánh quân thần tốc tiến về Sài Gòn - Gia Định, 11 giờ 30 phút ngày 30/4/1975 xe tăng 390 húc đổ cổng Dinh Độc Lập, cờ giải phóng tung bay, kết thúc vẻ vang 21 năm kháng chiến chống Mỹ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
  });

  // Đã BỎ seed 6 "Chủ đề kiến thức chuyên đề" (Văn hóa & Đời sống, Kiến trúc & Di
  // tích...) — đây là danh mục dành cho trang chủ công khai (landing page), không phải
  // chủ đề bài học thật, không có bài học nào gắn vào, nhưng lại hiện lẫn vào cây
  // Giai đoạn→Chủ đề→Bài học và trang /topics gây rối, trông như dữ liệu dư thừa. Nếu
  // sau này cần danh mục riêng cho landing page, nên tạo bảng/model riêng, không mượn
  // Topic (Topic nên chỉ dùng cho phân loại bài học thật).

  console.log('✓ Đã tạo thành công 1 Chủ đề Gốc (Cấp 1), 5 Giai đoạn (Cấp 2), 11 Chuyên đề (Cấp 3).');

  // -------------------------------------------------------------
  // BƯỚC 5: KHỞI TẠO CÁC SỰ KIỆN LỊCH SỬ CHUẨN XÁC (HISTORICAL EVENTS)
  // -------------------------------------------------------------
  const eventsData = [
    {
      topicId: child1_1.id,
      
      title: 'Mở tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh',
      slug: toSlug('Mở tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh'),
      eventYear: 1959,
      endYear: 1975,
      eventDateNote: '19/05/1959',
      location: 'Dãy Trường Sơn',
      description:
        'Đoàn 559 được thành lập, mở đường mòn Hồ Chí Minh trên bộ soi đường chi viện sức người, vũ khí từ hậu phương miền Bắc cho tiền tuyến miền Nam.',
      cause:
        'Cách mạng miền Nam chuyển sang thế tiến công sau Nghị quyết 15, đòi hỏi tuyến giao liên vận tải chiến lược xuyên Bắc - Nam để chi viện vũ khí, cán bộ và hậu cần.',
      outcome:
        'Hình thành mạng lưới đường cơ giới hơn 20.000km xuyên Trường Sơn, vận chuyển hàng triệu tấn vũ khí và hàng triệu lượt bộ đội vào chiến trường miền Nam.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80',
      sourceReferenceNote: 'Lịch sử Đoàn 559 - Bộ đội Trường Sơn, NXB Quân đội Nhân dân',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child1_2.id,
      
      title: 'Phong trào Đồng Khởi Bến Tre bùng nổ',
      slug: toSlug('Phong trào Đồng Khởi Bến Tre bùng nổ'),
      eventYear: 1959,
      endYear: 1960,
      eventDateNote: '17/01/1960',
      location: 'Mỏ Cày, Bến Tre',
      description:
        'Dưới sự lãnh đạo của Nữ tướng Nguyễn Thị Định và Tỉnh ủy Bến Tre, nhân dân huyện Mỏ Cày đồng loạt nổi dậy, mở đầu cao trào Đồng Khởi khắp miền Nam.',
      cause:
        'Chính quyền Ngô Đình Diệm thi hành chính sách "Tố cộng, diệt cộng" tàn bạo với Luật 10/59; Nghị quyết Trung ương 15 (1959) soi đường cho quần chúng nổi dậy.',
      outcome:
        'Phá vỡ từng mảng lớn bộ máy cai trị cơ sở của địch ở nông thôn, chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công, dẫn tới sự ra đời của Mặt trận Dân tộc Giải phóng miền Nam Việt Nam.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
      sourceReferenceNote: 'Sách giáo khoa Lịch sử 12, NXB Giáo dục Việt Nam, tr. 140 - 144',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child1_2.id,
      
      title: 'Thành lập Mặt trận Dân tộc Giải phóng miền Nam Việt Nam',
      slug: toSlug('Thành lập Mặt trận Dân tộc Giải phóng miền Nam Việt Nam'),
      eventYear: 1960,
      eventDateNote: '20/12/1960',
      location: 'Tân Biên, Tây Ninh',
      description:
        'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam ra đời nhằm đoàn kết toàn dân đánh đổ ách thống trị của đế quốc Mỹ và chính quyền tay sai Ngô Đình Diệm.',
      cause:
        'Thắng lợi vang dội của cao trào Đồng Khởi (1959 - 1960) đặt ra yêu cầu bức thiết phải có một tổ chức chính trị công khai quy tụ mọi tầng lớp yêu nước tại miền Nam.',
      outcome:
        'Tập hợp đông đảo các giai cấp, dân tộc, tôn giáo dưới ngọn cờ độc lập, dân chủ, hòa bình, trung lập, tiến tới hòa bình thống nhất Tổ quốc.',
      sourceReferenceNote: 'Văn kiện Đảng Toàn tập, Tập 21, NXB Chính trị Quốc gia',
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child2_1.id,
      
      title: 'Chiến thắng Ấp Bắc chấn động',
      slug: toSlug('Chiến thắng Ấp Bắc chấn động'),
      eventYear: 1963,
      eventDateNote: '02/01/1963',
      location: 'Cai Lậy, Tiền Giang',
      description:
        'Lực lượng vũ trang cách mạng miền Nam bẻ gãy chiến thuật trực thăng vận và thiết xa vận của Mỹ, mở ra phong trào thi đua "Ấp Bắc giết giặc lập công".',
      cause:
        'Mỹ - ngụy huy động hơn 2.000 quân tinh nhuệ cùng máy bay trực thăng và xe thiết giáp M-113 mở cuộc càn quét lớn vào vùng giải phóng Ấp Bắc (Mỹ Tho).',
      outcome:
        'Bắn rơi 5 máy bay trực thăng, phá hủy 3 xe thiết giáp M-113, đánh dấu sự phá sản bước đầu của các chiến thuật tân kỳ trong "Chiến tranh đặc biệt".',
      sourceReferenceNote: 'Lịch sử kháng chiến chống Mỹ, cứu nước 1954 - 1975, Tập III',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child3_1.id,
      
      title: 'Chiến thắng Vạn Tường - Trận đụng đầu lịch sử với quân viễn chinh Mỹ',
      slug: toSlug('Chiến thắng Vạn Tường - Trận đụng đầu lịch sử với quân viễn chinh Mỹ'),
      eventYear: 1965,
      eventDateNote: '18/08/1965',
      location: 'Bình Sơn, Quảng Ngãi',
      description:
        'Trận đánh phủ đầu lính thủy đánh bộ Mỹ, chứng minh quân dân miền Nam có đầy đủ khả năng đánh thắng trực diện quân viễn chinh Mỹ.',
      cause:
        'Quân viễn chinh Mỹ mở cuộc hành quân "Ánh sáng sao" (Starlite) nhằm tiêu diệt Trung đoàn 1 Chủ lực Quân khu 5 tại thôn Vạn Tường.',
      outcome:
        'Loại khỏi vòng chiến đấu khoảng 900 lính Mỹ, bắn cháy 22 xe tăng và xe bọc thép, mở đầu cao trào "Tìm Mỹ mà đánh, lùng ngụy mà diệt".',
      sourceReferenceNote: 'Lịch sử Quân khu 5 trong kháng chiến chống Mỹ',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child3_2.id,
      
      title: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968',
      slug: toSlug('Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968'),
      eventYear: 1968,
      eventDateNote: '30/01/1968',
      location: 'Sài Gòn - Gia Định và toàn miền Nam',
      description:
        'Đòn tập kích bất ngờ vào Tòa Đại sứ Mỹ, Dinh Độc Lập, Bộ Tổng tham mưu ngụy, làm lung lay ý chí xâm lược của chính giới Washington.',
      cause:
        'Nhằm giáng một đòn quyết định làm chuyển biến cục diện chiến tranh, buộc Mỹ phải xuống thang chiến tranh và ngồi vào bàn đàm phán.',
      outcome:
        'Làm phá sản chiến lược "Chiến tranh cục bộ", buộc Tổng thống Johnson phải tuyên bố ngừng ném bom miền Bắc và chấp nhận đàm phán tại Hội nghị Paris.',
      sourceReferenceNote: 'Tổng tiến công và nổi dậy Xuân Mậu Thân 1968, NXB Quân đội Nhân dân',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child4_1.id,
      
      title: 'Chiến thắng chiến dịch Đường 9 - Nam Lào',
      slug: toSlug('Chiến thắng chiến dịch Đường 9 - Nam Lào'),
      eventYear: 1971,
      eventDateNote: '30/01 - 23/03/1971',
      location: 'Đường 9 - Nam Lào',
      description:
        'Đập tan cuộc hành quân Lam Sơn 719 của địch, bảo vệ vững chắc tuyến hành lang vận chuyển chiến lược Bắc - Nam.',
      cause:
        'Mỹ - ngụy mở cuộc hành quân quy mô lớn "Lam Sơn 719" nhằm cắt đứt tuyến đường chi viện Trường Sơn tại khu vực Đường 9 - Nam Lào.',
      outcome:
        'Tiêu diệt phần lớn lực lượng tinh nhuệ của Quân đội Sài Gòn, giáng đòn nặng nề vào công thức "Quân đội Sài Gòn + Hỏa lực Mỹ" của học thuyết Việt Nam hóa chiến tranh.',
      sourceReferenceNote: 'Chiến dịch phản công Đường 9 - Nam Lào 1971, Viện Lịch sử Quân sự',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child4_2.id,
      
      title: 'Chiến thắng "Điện Biên Phủ trên không" 12 ngày đêm Hà Nội',
      slug: toSlug('Chiến thắng Điện Biên Phủ trên không 12 ngày đêm Hà Nội'),
      eventYear: 1972,
      eventDateNote: '18/12 - 30/12/1972',
      location: 'Hà Nội, Hải Phòng',
      description:
        'Quân dân miền Bắc bắn rơi 34 pháo đài bay B-52, đập tan cuộc tập kích đường không chiến lược Linebacker II của đế quốc Mỹ.',
      cause:
        'Tổng thống Mỹ Nixon mở chiến dịch tập kích đường không chiến lược Linebacker II bằng siêu pháo đài bay B-52 hòng khuất phục Hà Nội và ép ta ký Hiệp định Paris theo điều khoản của Mỹ.',
      outcome:
        'Bắn rơi 81 máy bay Mỹ (có 34 chiếc B-52), buộc chính quyền Nixon tuyên bố ngừng ném bom từ vĩ tuyến 20 trở ra và ký Hiệp định Paris nguyên vẹn.',
      sourceReferenceNote: 'Lịch sử Quân chủng Phòng không - Không quân Việt Nam',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child4_2.id,
      
      title: 'Ký kết Hiệp định Paris về chấm dứt chiến tranh tại Việt Nam',
      slug: toSlug('Ký kết Hiệp định Paris về chấm dứt chiến tranh tại Việt Nam'),
      eventYear: 1973,
      eventDateNote: '27/01/1973',
      location: 'Paris, Pháp',
      description:
        'Mỹ buộc phải cam kết tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của nước Việt Nam, rút hết toàn bộ quân viễn chinh về nước.',
      cause:
        'Sau thất bại nặng nề trên cả hai miền Nam - Bắc, đặc biệt là trận Điện Biên Phủ trên không cuối năm 1972, đế quốc Mỹ không còn con đường nào khác ngoài giải pháp ngoại giao.',
      outcome:
        'Hoàn thành mục tiêu chiến lược "Đánh cho Mỹ cút", tạo bước ngoặt quyết định về tương quan lực lượng để tiến lên "Đánh cho ngụy nhào" vào mùa Xuân 1975.',
      sourceReferenceNote: 'Mặt trận Ngoại giao Việt Nam trong kháng chiến chống Mỹ (1954 - 1975)',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child5_1.id,
      
      title: 'Chiến thắng Đường 14 - Phước Long',
      slug: toSlug('Chiến thắng Đường 14 - Phước Long'),
      eventYear: 1974,
      endYear: 1975,
      eventDateNote: '13/12/1974 - 06/01/1975',
      location: 'Phước Long, Bình Phước',
      description:
        'Đòn trinh sát chiến lược giải phóng hoàn toàn một thị xã và một tỉnh đầu tiên ở miền Nam, tạo cơ sở thực tiễn để Bộ Chính trị quyết tâm giải phóng miền Nam.',
      cause:
        'Thực hiện chủ trương mở chiến dịch tiến công tại Đông Nam Bộ nhằm mở rộng hành lang chiến lược và thăm dò phản ứng thực tế của Mỹ và quân đội Sài Gòn.',
      outcome:
        'Giải phóng hoàn toàn tỉnh Phước Long, củng cố quyết tâm chiến lược của Bộ Chính trị giải phóng miền Nam ngay trong năm 1975.',
      sourceReferenceNote: 'Lịch sử Quân đoàn 4 - Binh đoàn Cửu Long',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child5_2.id,
      
      title: 'Đột phá khẩu Buôn Ma Thuột - Khai màn Chiến dịch Tây Nguyên',
      slug: toSlug('Đột phá khẩu Buôn Ma Thuột - Khai màn Chiến dịch Tây Nguyên'),
      eventYear: 1975,
      eventDateNote: '10/03/1975',
      location: 'Buôn Ma Thuột, Đắk Lắk',
      description:
        'Đòn điểm huyệt chiến lược xuất sắc làm rung chuyển và tan rã toàn bộ Quân đoàn 2 ngụy, mở toang cánh cửa xuống đồng bằng duyên hải miền Trung.',
      cause:
        'Bộ Chính trị và Quân ủy Trung ương chọn Tây Nguyên làm hướng tiến công chủ yếu trong năm 1975, lấy thị xã Buôn Ma Thuột làm mục tiêu đột phá mở màn.',
      outcome:
        'Giải phóng hoàn toàn Tây Nguyên, tiêu diệt Quân đoàn 2 ngụy, chuyển cuộc kháng chiến từ tiến công chiến lược sang Tổng tiến công chiến lược trên toàn miền Nam.',
      sourceReferenceNote: 'Tổng hành dinh trong mùa Xuân toàn thắng - Đại tướng Võ Nguyên Giáp',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child5_2.id,
      
      title: 'Giải phóng Cố đô Huế và thành phố Đà Nẵng',
      slug: toSlug('Giải phóng Cố đô Huế và thành phố Đà Nẵng'),
      eventYear: 1975,
      eventDateNote: '26/03 - 29/03/1975',
      location: 'Huế & Đà Nẵng',
      description:
        'Tiêu diệt và làm tan rã toàn bộ lực lượng Quân đoàn 1 ngụy, giải phóng hoàn toàn dải đất miền Trung, tạo thời cơ "thần tốc" tiến về Sài Gòn.',
      cause:
        'Nắm vững thời cơ chiến lược sau thắng lợi Tây Nguyên, Quân giải phóng thần tốc bao vây cô lập và tiến công giải phóng Trị - Thiên - Huế và căn cứ liên hợp Đà Nẵng.',
      outcome:
        'Đập tan hoàn toàn ý đồ co cụm chiến lược của địch ở miền Trung, tạo bàn đạp trực tiếp cho 5 cánh quân tiến vào Chiến dịch Hồ Chí Minh.',
      sourceReferenceNote: 'Đại thắng mùa Xuân 1975 - Văn Tiến Dũng',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      topicId: child5_3.id,
      
      title: 'Đại thắng Chiến dịch Hồ Chí Minh - Giải phóng hoàn toàn miền Nam',
      slug: toSlug('Đại thắng Chiến dịch Hồ Chí Minh - Giải phóng hoàn toàn miền Nam'),
      eventYear: 1975,
      eventDateNote: '26/04 - 30/04/1975',
      location: 'Dinh Độc Lập, Sài Gòn',
      description:
        '11 giờ 30 phút ngày 30/4/1975, xe tăng 390 húc đổ cổng chính Dinh Độc Lập. Lá cờ Mặt trận Dân tộc Giải phóng tung bay trên nóc dinh, non sông thu về một mối.',
      cause:
        'Thời cơ tổng công kích vào sào huyệt cuối cùng của địch tại Sài Gòn - Gia Định đã chín muồi với phương châm "Thần tốc, táo bạo, bất ngờ, chắc thắng".',
      outcome:
        'Giải phóng hoàn toàn miền Nam, thống nhất đất nước, kết thúc thắng lợi 21 năm kháng chiến chống Mỹ cứu nước và 30 năm chiến tranh giải phóng dân tộc.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80',
      sourceReferenceNote: 'Đại thắng mùa Xuân 1975 - Đại tướng Văn Tiến Dũng, NXB Quân đội Nhân dân',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  ];

  const createdEventsMap = new Map<string, any>();
  for (const evt of eventsData) {
    // `topicId` không tồn tại trong schema HistoricalEvent (model này liên kết qua
    // `periodId`, không qua Topic) — phải loại khỏi payload, nếu không Prisma báo lỗi
    // "Unknown argument topicId" và dừng hẳn seed giữa đường.
    const { eventYear, cause, outcome, location, sourceReferenceNote, topicId, ...rest } = evt as any;
    const metadata = {
      ...(cause ? { cause } : {}),
      ...(outcome ? { outcome } : {}),
      ...(location ? { rawLocation: location } : {}),
      ...(sourceReferenceNote ? { sourceReferenceNote } : {}),
    };
    const created = await prisma.historicalEvent.create({
      data: {
        ...rest,
        // Gắn lại vào Giai đoạn lịch sử duy nhất đã tạo ở bước 4 — trước đây bị bỏ sót
        // hoàn toàn, khiến sự kiện không hiện đúng khi lọc/nhóm theo Giai đoạn.
        periodId: period.id,
        startYear: eventYear,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });
    createdEventsMap.set(evt.title, created);
  }

  // Khởi tạo các sự kiện con (Sự kiện thành phần trực thuộc sự kiện cha)
  const mauThanParent = createdEventsMap.get('Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968');
  const duong9Parent = createdEventsMap.get('Chiến thắng chiến dịch Đường 9 - Nam Lào');

  const subEventsData: any[] = [];
  if (mauThanParent) {
    subEventsData.push(
      {
        topicId: mauThanParent.topicId,
        periodId: mauThanParent.periodId,
        parentId: mauThanParent.id,
        title: 'Các đợt tiến công tại các đô thị miền Nam',
        slug: toSlug('Các đợt tiến công tại các đô thị miền Nam'),
        eventYear: 1968,
        eventDateNote: 'Đợt 1 (30/01 - 25/02/1968)',
        location: 'Các đô thị trọng yếu toàn miền Nam',
        description: 'Đồng loạt tiến công vào 4 trên 6 thành phố lớn, 37 trên 44 thị xã và hàng trăm quận lỵ.',
        cause: 'Mục tiêu giáng đòn bất ngờ làm sụp đổ hệ thống phòng thủ hậu cứ đô thị của địch.',
        outcome: 'Gây chấn động dư luận nước Mỹ, phá vỡ hoàn toàn thế trận bình định nông thôn và phòng thủ đô thị của quân đội Mỹ.',
        displayOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
      {
        topicId: mauThanParent.topicId,
        periodId: mauThanParent.periodId,
        parentId: mauThanParent.id,
        title: 'Diễn biến tác chiến tại Sài Gòn - Gia Định',
        slug: toSlug('Diễn biến tác chiến tại Sài Gòn - Gia Định'),
        eventYear: 1968,
        eventDateNote: 'Đêm 30 rạng sáng 31/01/1968',
        location: 'Sài Gòn - Gia Định',
        description: 'Các đội Biệt động Sài Gòn tập kích Tòa Đại sứ Mỹ, Dinh Độc Lập, Bộ Tổng tham mưu quân đội Sài Gòn và Đài Phát thanh.',
        cause: 'Đánh thẳng vào cơ quan đầu não chỉ huy chiến tranh của đối phương giữa trung tâm Sài Gòn.',
        outcome: 'Tạo hiệu ứng truyền thông toàn cầu, phơi bày sự bất lực của chính quyền Sài Gòn và quân đội Mỹ ngay tại trung tâm thủ phủ.',
        displayOrder: 2,
        status: ContentStatus.DRAFT,
      },
    );
  }

  if (duong9Parent) {
    subEventsData.push({
      topicId: duong9Parent.topicId,
      periodId: duong9Parent.periodId,
      parentId: duong9Parent.id,
      title: 'Trận đánh điểm cao 543 và bắt sống Ban chỉ huy Lữ đoàn dù 3 địch',
      slug: toSlug('Trận đánh điểm cao 543 và bắt sống Ban chỉ huy Lữ đoàn dù 3 địch'),
      eventYear: 1971,
      eventDateNote: '25/02/1971',
      location: 'Điểm cao 543, Đường 9 - Nam Lào',
      description: 'Trung đoàn 102 (Đại đoàn 308) tiêu diệt cứ điểm then chốt trên điểm cao 543, bắt sống đại tá Nguyễn Văn Thọ.',
      cause: 'Đánh bẻ gãy cánh quân dù tinh nhuệ của quân lực Việt Nam Cộng hòa trong cuộc hành quân Lam Sơn 719.',
      outcome: 'Làm lung lay tinh thần toàn bộ cánh quân phía bắc của địch, tạo thế bao vây tiêu diệt căn cứ Bản Đông.',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    });
  }

  for (const subEvt of subEventsData) {
    // Tương tự: `topicId` không phải field hợp lệ của HistoricalEvent, phải loại bỏ.
    const { eventYear, cause, outcome, location, sourceReferenceNote, topicId, ...rest } = subEvt as any;
    const metadata = {
      ...(cause ? { cause } : {}),
      ...(outcome ? { outcome } : {}),
      ...(location ? { rawLocation: location } : {}),
      ...(sourceReferenceNote ? { sourceReferenceNote } : {}),
    };
    await prisma.historicalEvent.create({
      data: {
        ...rest,
        startYear: eventYear,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });
  }

  console.log(`✓ Đã tạo ${eventsData.length} Sự kiện Lịch sử cấp cha/độc lập và ${subEventsData.length} Sự kiện thành phần trực thuộc.`);

  // -------------------------------------------------------------
  // BƯỚC 6: KHỞI TẠO CÁC BÀI HỌC GIÀU NỘI DUNG RICH TEXT & GÁN TAGS
  // -------------------------------------------------------------
  const lessonsData = [
    {
      topicId: child1_2.id,
      title: 'Phong trào Đồng Khởi (1959 - 1960) - Bước ngoặt lịch sử cách mạng miền Nam',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Sách giáo khoa Lịch sử 12, NXB Giáo dục Việt Nam, tr. 140 - 144',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Hoàn cảnh lịch sử và Nguyên nhân bùng nổ</h2>
<p>Từ năm 1954 đến 1959, chính quyền tay sai Ngô Đình Diệm thẳng tay đàn áp phong trào yêu nước, ban hành <strong>Luật 10/59</strong> lê máy chém đi khắp miền Nam, đặt cộng sản ra ngoài vòng pháp luật.</p>
<blockquote>Tháng 1/1959, Hội nghị Ban Chấp hành Trung ương Đảng lần thứ 15 xác định: con đường cơ bản của cách mạng miền Nam là khởi nghĩa giành chính quyền về tay nhân dân bằng đấu tranh chính trị kết hợp đấu tranh vũ trang.</blockquote>

<h2>2. Diễn biến phong trào Đồng Khởi tại Bến Tre</h2>
<p>Ngày <strong>17/01/1960</strong>, dưới sự lãnh đạo của Nữ tướng Nguyễn Thị Định, quần chúng nhân dân 3 xã Định Thủy, Phước Hiệp, Bình Khánh thuộc huyện Mỏ Cày (Bến Tre) đồng loạt nổi dậy:</p>
<ul>
  <li>Sử dụng súng ngựa trời, giáo mác, đòn gánh kết hợp gõ mõ vang trời tạo thanh thế.</li>
  <li>Đội quân tóc dài phát huy sức mạnh đấu tranh chính trị, binh vận trực tiếp vào đồn bốt giặc.</li>
  <li>Phá vỡ từng mảng lớn hệ thống kìm kẹp, giải tán chính quyền địch ở thôn xã và thành lập Ủy ban nhân dân tự quản.</li>
</ul>

<h2>3. Ý nghĩa lịch sử to lớn</h2>
<p>Phong trào Đồng Khởi là bước ngoặt chiến lược đưa cách mạng miền Nam từ <em>thế giữ gìn lực lượng</em> chuyển hẳn sang <em>thế tiến công</em>, dẫn tới sự ra đời của <strong>Mặt trận Dân tộc Giải phóng miền Nam Việt Nam (20/12/1960)</strong>.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Phong trào quần chúng'],
    },
    {
      topicId: child2_1.id,
      title: 'Chiến thắng Ấp Bắc (1963) - Đòn bẻ gãy chiến thuật cơ động của Mỹ',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Lịch sử Quân sự Việt Nam - Tập 11, NXB Quân đội Nhân dân',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Âm mưu của địch và Bối cảnh trận đánh</h2>
<p>Đầu năm 1963, quân đội Sài Gòn dưới sự chỉ huy trực tiếp của cố vấn quân sự Mỹ mở cuộc càn quét lớn vào căn cứ Ấp Bắc (xã Tân Phú, huyện Cai Lậy, tỉnh Mỹ Tho nay là Tiền Giang).</p>
<p>Địch huy động hơn 2.000 quân chủ lực, có máy bay trực thăng chở quân (chiến thuật <em>trực thăng vận</em>) và xe bọc thép M-113 (chiến thuật <em>thiết xa vận</em>) yểm trợ tối đa.</p>

<h2>2. Diễn biến quả cảm của quân và dân ta</h2>
<p>Lực lượng ta gồm Tiểu đoàn 261, Tiểu đoàn 514 cùng du kích địa phương đã kiên cường bố trí trận địa công sự ngụy trang kín đáo, bám trụ kiên quyết:</p>
<ul>
  <li>Bắn rơi 5 trực thăng và bắn hỏng nhiều chiếc khác, làm phá sản phương án đổ quân bất ngờ.</li>
  <li>Dùng súng trường, lựu đạn tiêu diệt hỏa lực trên xe thiết giáp M-113.</li>
  <li>Bẻ gãy 5 đợt tiến công điên cuồng của địch suốt từ sáng sớm đến chiều tối ngày 02/01/1963.</li>
</ul>

<h2>3. Kết quả và Tầm vóc chiến thắng</h2>
<p>Chiến thắng Ấp Bắc chứng minh quân dân miền Nam hoàn toàn đủ sức bẻ gãy các chiến thuật tân kỳ của đế quốc Mỹ, mở đầu cho phong trào thi đua <strong>"Ấp Bắc giết giặc lập công"</strong> trên toàn chiến trường.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Chiến dịch quân sự'],
    },
    {
      topicId: child3_2.id,
      title: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968',
      difficulty: DifficultyLevel.HARD,
      sourceReferenceNote: 'Giáo trình Lịch sử Đảng Cộng sản Việt Nam, NXB Chính trị Quốc gia',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Quyết sách chiến lược của Đảng</h2>
<p>Nhận thấy thế và lực của cách mạng đã lớn mạnh, tháng 12/1967, Bộ Chính trị họp ra nghị quyết lịch sử: Chuyển cuộc chiến tranh cách mạng miền Nam sang một thời kỳ mới - thời kỳ giành thắng lợi quyết định bằng cuộc Tổng tiến công và nổi dậy đồng loạt vào các sào huyệt của địch.</p>

<h2>2. Đòn sấm sét đêm Giao thừa</h2>
<p>Đêm 30 rạng sáng 31/01/1968 (đêm mùng 1 Tết Mậu Thân), lực lượng vũ trang biệt động và quân giải phóng bất ngờ nổ súng đánh vào các mục tiêu hiểm yếu tại trung tâm Sài Gòn:</p>
<ul>
  <li>Tòa Đại sứ quán Mỹ - biểu tượng quyền lực của Mỹ tại miền Nam Việt Nam.</li>
  <li>Dinh Độc Lập - cơ quan đầu não của chính quyền tay sai Sài Gòn.</li>
  <li>Bộ Tổng Tham mưu ngụy, Đài phát thanh Sài Gòn, Bộ Tư lệnh Hải quân.</li>
  <li>Tại Cố đô Huế, quân ta làm chủ thành phố suốt 26 ngày đêm kiên cường.</li>
</ul>

<h2>3. Tác động làm rung chuyển nước Mỹ</h2>
<p>Cuộc tập kích làm lung lay tận gốc rễ ý chí tiếp tục chiến tranh của chính quyền Tổng thống Johnson, buộc Mỹ phải tuyên bố chấm dứt không điều kiện ném bom miền Bắc và chấp nhận ngồi vào bàn đàm phán bốn bên tại Paris.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Chiến dịch quân sự'],
    },
    {
      topicId: child4_2.id,
      title: 'Trận "Điện Biên Phủ trên không" 12 ngày đêm cuối năm 1972',
      difficulty: DifficultyLevel.HARD,
      sourceReferenceNote: 'Lịch sử Quân chủng Phòng không - Không quân & Lịch sử Quân sự Việt Nam (NXB Quân đội Nhân dân)',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      blocksContent: DIEN_BIEN_PHU_BLOCKS_DATA,
      tags: ['Kháng chiến chống Mỹ', 'Phòng không - Không quân', 'Chiến dịch quân sự'],
    },
    {
      topicId: child4_2.id,
      title: 'Hiệp định Paris 1973 - Thắng lợi quyết định trên mặt trận ngoại giao',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Mặt trận Ngoại giao Việt Nam trong kháng chiến chống Mỹ (1954 - 1975)',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Bối cảnh đàm phán lịch sử</h2>
<p>Sau những thất bại liên tiếp trên chiến trường từ Mậu Thân 1968 đến Điện Biên Phủ trên không 1972, đế quốc Mỹ buộc phải ký kết <em>Hiệp định Paris về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam</em> vào ngày <strong>27/01/1973</strong>.</p>

<h2>2. Các nội dung cốt lõi của Hiệp định</h2>
<ul>
  <li>Hoa Kỳ và các nước cam kết tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của nước Việt Nam.</li>
  <li>Hoa Kỳ chấm dứt mọi hành động quân sự, rút hết toàn bộ quân đội viễn chinh, cố vấn quân sự và hủy bỏ các căn cứ quân sự trong vòng 60 ngày.</li>
  <li>Nhân dân miền Nam tự quyết định tương lai chính trị của mình thông qua tổng tuyển cử tự do, dân chủ.</li>
</ul>

<h2>3. Ý nghĩa then chốt mở đường cho ngày toàn thắng</h2>
<p>Hiệp định Paris đã thực hiện trọn vẹn lời dạy của Chủ tịch Hồ Chí Minh: <strong>"Đánh cho Mỹ cút"</strong>, tạo so sánh lực lượng áp đảo có lợi hoàn toàn cho cách mạng Việt Nam để tiến tới <strong>"Đánh cho ngụy nhào"</strong> mùa Xuân 1975.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Mặt trận ngoại giao'],
    },
    {
      topicId: child5_2.id,
      title: 'Chiến dịch Tây Nguyên (Tháng 3/1975) - Đòn điểm huyệt Buôn Ma Thuột',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Tổng hành dinh trong mùa Xuân toàn thắng - Đại tướng Võ Nguyên Giáp',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Lựa chọn hướng tiến công chiến lược</h2>
<p>Tây Nguyên là địa bàn chiến lược xung yếu bậc nhất nhưng lực lượng địch ở đây tương đối sơ hở do nhận định ta sẽ đánh ở Bắc Tây Nguyên (Pleiku, Kon Tum). Bộ Tổng tư lệnh quyết định chọn <strong>Buôn Ma Thuột</strong> làm điểm đột phá khẩu mở màn.</p>

<h2>2. Diễn biến trận đánh bất ngờ</h2>
<p>Rạng sáng ngày <strong>10/03/1975</strong>, quân giải phóng bất thần dội bão lửa vào các mục tiêu đầu não tại thị xã Buôn Ma Thuột:</p>
<ul>
  <li>Nhanh chóng làm chủ Sân bay Hòa Bình, Bộ Tư lệnh Sư đoàn 23 ngụy.</li>
  <li>Ngày 11/03/1975, hoàn toàn giải phóng thị xã Buôn Ma Thuột.</li>
  <li>Đập tan cuộc phản kích tái chiếm của Sư đoàn 23 ngụy, truy kích tiêu diệt tàn quân địch tháo chạy trên đường số 7.</li>
</ul>

<h2>3. Ý nghĩa bẻ gãy thế trận đối phương</h2>
<p>Chiến thắng Buôn Ma Thuột đã chuyển cuộc kháng chiến từ <em>tiến công chiến lược</em> sang <em>tổng tiến công chiến lược</em> trên toàn chiến trường miền Nam, mở đầu cho sự sụp đổ dây chuyền của quân đội Sài Gòn.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Chiến dịch quân sự', 'Đại thắng mùa Xuân 1975'],
    },
    {
      topicId: child5_3.id,
      title: 'Đại thắng Mùa Xuân 1975 - Chiến dịch Hồ Chí Minh lịch sử',
      difficulty: DifficultyLevel.HARD,
      sourceReferenceNote: 'Đại thắng mùa Xuân 1975 - Đại tướng Văn Tiến Dũng',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Quyết tâm chiến lược "Thần tốc, táo bạo"</h2>
<p>Ngày 14/04/1975, Bộ Chính trị phê chuẩn quyết định đặt tên cho chiến dịch giải phóng Sài Gòn - Gia Định là <strong>Chiến dịch Hồ Chí Minh</strong>.</p>
<blockquote>"Thần tốc, thần tốc hơn nữa; táo bạo, táo bạo hơn nữa; tranh thủ từng giờ, từng phút, xốc tới mặt trận, giải phóng miền Nam. Quyết chiến và toàn thắng!" - Bức điện lịch sử của Đại tướng Tổng tư lệnh Võ Nguyên Giáp ngày 07/04/1975.</blockquote>

<h2>2. Năm cánh quân hội tụ về Sài Gòn</h2>
<p>17 giờ ngày 26/04/1975, Chiến dịch Hồ Chí Minh chính thức nổ súng. 5 cánh quân binh chủng hợp thành (Quân đoàn 1, Quân đoàn 2, Quân đoàn 3, Quân đoàn 4 và Đoàn 232) đồng loạt tiến công tiêu diệt các tuyến phòng thủ vòng ngoài và tiến thẳng vào trung tâm:</p>
<ul>
  <li>Chiếm giữ Sân bay Tân Sơn Nhất, Bộ Tổng Tham mưu ngụy, Tổng nha Cảnh sát.</li>
  <li>Khoảng 10 giờ 45 phút ngày 30/04/1975, xe tăng số hiệu 843 và xe tăng số hiệu 390 thuộc Lữ đoàn Tăng thiết giáp 203 (Quân đoàn 2) dũng mãnh húc tung cổng Dinh Độc Lập.</li>
  <li>Trung úy Bùi Quang Thận cắm cờ Mặt trận Dân tộc Giải phóng lên nóc dinh lúc 11 giờ 30 phút.</li>
  <li>Tổng thống Dương Văn Minh tuyên bố đầu hàng không điều kiện.</li>
</ul>

<h2>3. Ý nghĩa vĩ đại của Đại thắng</h2>
<p>Chiến dịch Hồ Chí Minh toàn thắng đã kết thúc vẻ vang 21 năm kháng chiến chống Mỹ và 30 năm chiến tranh giải phóng dân tộc (1945 - 1975), chấm dứt vĩnh viễn ách thống trị của chủ nghĩa đế quốc thực dân, non sông thu về một mối, mở ra kỷ nguyên độc lập, tự do và chủ nghĩa xã hội trên toàn vẹn lãnh thổ Việt Nam.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Chiến dịch quân sự', 'Đại thắng mùa Xuân 1975'],
    },
    {
      topicId: child1_1.id,
      title: 'Tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh huyền thoại',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Lịch sử Đoàn 559 - Bộ đội Trường Sơn, NXB Quân đội Nhân dân',
      displayOrder: 1,
      status: LessonStatus.REVIEW,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Sự ra đời của Đoàn 559</h2>
<p>Ngày <strong>19/05/1959</strong>, Thường trực Tổng Quân ủy chính thức giao nhiệm vụ cho Đoàn công tác quân sự đặc biệt (Đoàn 559) mở tuyến đường giao liên, vận tải quân sự dọc dãy Trường Sơn để chi viện cho miền Nam.</p>
<h2>2. Huyền thoại xẻ dọc Trường Sơn đi cứu nước</h2>
<p>Vượt qua mưa bom bão đạn và chất độc hóa học của đế quốc Mỹ, Bộ đội Trường Sơn cùng Thanh niên xung phong đã xây dựng hệ thống đường cơ giới hơn 20.000km, đường ống dẫn xăng dầu và đường thông tin liên lạc xuyên rừng.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Tuyến chi viện Trường Sơn'],
    },
    {
      topicId: child4_1.id,
      title: '81 ngày đêm bảo vệ Thành cổ Quảng Trị mùa hè đỏ lửa 1972',
      difficulty: DifficultyLevel.HARD,
      sourceReferenceNote: 'Lịch sử Mặt trận Quảng Trị 1972, NXB Quân đội Nhân dân',
      displayOrder: 1,
      status: LessonStatus.REVIEW,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Cuộc chiến đấu kiên cường trong lòng Thành cổ</h2>
<p>Từ ngày 28/06 đến 16/09/1972, các chiến sĩ Quân giải phóng đã kiên cường bám trụ suốt 81 ngày đêm dưới làn mưa bom pháo hủy diệt tương đương 7 quả bom nguyên tử của Mỹ - ngụy.</p>
<h2>2. Phối hợp chặt chẽ với bàn đàm phán Paris</h2>
<p>Mỗi ngày kiên cường giữ vững Thành cổ Quảng Trị đã tạo hậu thuẫn trực tiếp cho phái đoàn ngoại giao ta tại Hội nghị Paris.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Chiến dịch quân sự'],
    },
  ];

  const createdLessonsByTitle: Record<string, string> = {};

  for (const les of lessonsData) {
    const { tags, topicId: _unusedTopicId, sourceReferenceNote, contentRichText, blocksContent, ...rest } = les as any;
    const tagIdsToLink = Array.isArray(tags)
      ? tags.map((tagName: string) => createdTags[tagName]).filter(Boolean)
      : [];

    const createdLesson = await prisma.lesson.create({
      data: {
        ...rest,
        slug: toSlug(rest.title),
        content: blocksContent || contentRichText || '',
        description: `Tóm tắt nội dung: ${rest.title}`,
        ...(sourceReferenceNote ? { sourceReferenceNote } : {}),
        ...(tagIdsToLink.length > 0
          ? {
              lessonTags: {
                create: tagIdsToLink.map((tagId: string) => ({ tagId })),
              },
            }
          : {}),
      },
    });
    createdLessonsByTitle[createdLesson.title] = createdLesson.id;
  }
  console.log(`✓ Đã tạo ${lessonsData.length} Bài học chuyên sâu.`);

  const lessonDienBienPhuId =
    createdLessonsByTitle['Trận "Điện Biên Phủ trên không" 12 ngày đêm cuối năm 1972'];
  if (lessonDienBienPhuId) {
    await prisma.quiz.upsert({
      where: { lessonId: lessonDienBienPhuId },
      update: {
        title: DIEN_BIEN_PHU_QUIZ_DATA.title,
        passingScorePercent: DIEN_BIEN_PHU_QUIZ_DATA.passingScorePercent,
        questions: DIEN_BIEN_PHU_QUIZ_DATA.questions,
      },
      create: {
        lessonId: lessonDienBienPhuId,
        title: DIEN_BIEN_PHU_QUIZ_DATA.title,
        passingScorePercent: DIEN_BIEN_PHU_QUIZ_DATA.passingScorePercent,
        questions: DIEN_BIEN_PHU_QUIZ_DATA.questions,
      },
    });
    console.log(`✓ Đã tạo Đề ôn tập nhanh (Quiz) 5 dạng câu hỏi cho bài học Điện Biên Phủ trên không.`);
  }

  // -------------------------------------------------------------
  // BƯỚC 7: KHỞI TẠO CÁC THỰC THỂ LỊCH SỬ DÙNG CHUNG (HISTORICAL ENTITIES)
  // -------------------------------------------------------------
  const entitiesData = [
    {
      
      name: 'Chủ tịch Hồ Chí Minh',
      slug: 'chu-tich-ho-chi-minh',
      type: HistoricalEntityType.PERSON,
      tagline: 'Lãnh tụ vĩ đại của dân tộc Việt Nam',
      biography:
        'Người sáng lập, rèn luyện Đảng Cộng sản Việt Nam, khai sinh nước Việt Nam Dân chủ Cộng hòa và lãnh đạo cuộc kháng chiến giải phóng dân tộc.',
      imageUrl: '/assets/figures/ho-chi-minh.jpg',
      birthYear: 1890,
      deathYear: 1969,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Đại tướng Võ Nguyên Giáp',
      slug: 'dai-tuong-vo-nguyen-giap',
      type: HistoricalEntityType.PERSON,
      tagline: 'Tổng tư lệnh tối cao Quân đội Nhân dân Việt Nam',
      biography:
        'Vị Đại tướng đầu tiên, Tổng tư lệnh Quân đội Nhân dân Việt Nam, người ra bức điện lịch sử "Thần tốc, táo bạo" trong Đại thắng mùa Xuân 1975.',
      imageUrl: '/assets/figures/vo-nguyen-giap.jpg',
      birthYear: 1911,
      deathYear: 2013,
      isFeatured: true,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Nữ tướng Nguyễn Thị Định',
      slug: 'nu-tuong-nguyen-thi-dinh',
      type: HistoricalEntityType.PERSON,
      tagline: 'Linh hồn phong trào Đồng Khởi Bến Tre & Đội quân tóc dài',
      biography:
        'Nữ tướng đầu tiên của Quân đội Nhân dân Việt Nam, Phó Tư lệnh Quân giải phóng miền Nam Việt Nam.',
      imageUrl: '/assets/figures/nguyen-thi-dinh.jpg',
      birthYear: 1920,
      deathYear: 1992,
      isFeatured: true,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Đại tướng Văn Tiến Dũng',
      slug: 'dai-tuong-van-tien-dung',
      type: HistoricalEntityType.PERSON,
      tagline: 'Tư lệnh Chiến dịch Hồ Chí Minh lịch sử (1975)',
      biography:
        'Tổng Tham mưu trưởng Quân đội Nhân dân Việt Nam, trực tiếp chỉ huy Chiến dịch Tây Nguyên và Chiến dịch Hồ Chí Minh toàn thắng.',
      imageUrl: '/assets/figures/van-tien-dung.jpg',
      birthYear: 1917,
      deathYear: 2002,
      isFeatured: true,
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Nhà ngoại giao Nguyễn Thị Bình',
      slug: 'nha-ngoai-giao-nguyen-thi-binh',
      type: HistoricalEntityType.PERSON,
      tagline: 'Trưởng phái đoàn đàm phán tại Hội nghị Paris (1968 - 1973)',
      biography:
        'Bộ trưởng Ngoại giao Chính phủ Cách mạng lâm thời Cộng hòa miền Nam Việt Nam, đặt bút ký Hiệp định Paris 1973.',
      imageUrl: '/assets/figures/nguyen-thi-binh.jpg',
      birthYear: 1927,
      isFeatured: true,
      displayOrder: 5,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Đại tướng Nguyễn Chí Thanh',
      slug: 'dai-tuong-nguyen-chi-thanh',
      type: HistoricalEntityType.PERSON,
      tagline: 'Chính ủy Quân giải phóng miền Nam Việt Nam',
      biography:
        'Người đề ra phương châm "Nắm thắt lưng địch mà đánh", góp phần quyết định đánh bại chiến lược Chiến tranh cục bộ của đế quốc Mỹ.',
      imageUrl: '/assets/figures/nguyen-chi-thanh.jpg',
      birthYear: 1914,
      deathYear: 1967,
      isFeatured: true,
      displayOrder: 6,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Đoàn 559 - Bộ đội Trường Sơn',
      slug: 'doan-559-bo-doi-truong-son',
      type: HistoricalEntityType.MILITARY_FORCE,
      tagline: 'Lực lượng mở đường và bảo đảm chi viện chiến lược Trường Sơn',
      biography:
        'Đơn vị vận tải quân sự chiến lược thành lập ngày 19/05/1959, xẻ dọc Trường Sơn chi viện sức người sức của cho chiến trường miền Nam.',
      birthYear: 1959,
      deathYear: 1975,
      isFeatured: false,
      displayOrder: 7,
      status: ContentStatus.PUBLISHED,
    },
    {
      
      name: 'Xe tăng T-54B số hiệu 843 & 390',
      slug: 'xe-tang-t-54b-so-hieu-843-va-390',
      type: HistoricalEntityType.ARTIFACT,
      tagline: 'Bảo vật quốc gia húc đổ cổng Dinh Độc Lập trưa 30/04/1975',
      biography:
        'Hai chiếc xe tăng thuộc Đại đội 4, Tiểu đoàn 1, Lữ đoàn Tăng thiết giáp 203, Quân đoàn 2 dẫn đầu đội hình tiến vào Dinh Độc Lập.',
      birthYear: 1975,
      isFeatured: false,
      displayOrder: 8,
      status: ContentStatus.PUBLISHED,
    },
  ];

  const createdEntitiesBySlug: Record<string, string> = {};
  for (const entity of entitiesData) {
    // `biography`/`birthYear`/`deathYear` không phải cột của HistoricalEntity — chúng
    // thuộc bảng con 1-1 `Person` (tách riêng trong schema), phải tạo qua nested write
    // `person: { create: {...} }`, không được đặt trực tiếp lên HistoricalEntity.
    const { biography, birthYear, deathYear, ...rest } = entity as any;
    const hasPersonData = biography !== undefined || birthYear !== undefined || deathYear !== undefined;
    const createdEntity = await prisma.historicalEntity.create({
      data: {
        ...rest,
        ...(hasPersonData ? { person: { create: { biography, birthYear, deathYear } } } : {}),
      },
    });
    createdEntitiesBySlug[createdEntity.slug] = createdEntity.id;
  }
  console.log(`✓ Đã tạo ${entitiesData.length} Thực thể Lịch sử dùng chung (6 Nhân vật tiêu biểu + Lực lượng + Hiện vật).`);

  // -------------------------------------------------------------
  // BƯỚC 8: KHỞI TẠO ĐỊA DANH & DI TÍCH LỊCH SỬ DÙNG CHUNG (HISTORICAL ENTITY: LOCATION + HISTORICAL SITE)
  // -------------------------------------------------------------
  const locationsData = [
    {
      name: 'Dinh Độc Lập (Hội trường Thống Nhất)',
      slug: 'dinh-doc-lap-hoi-truong-thong-nhat',
      aliases: ['Dinh Norodom', 'Dinh Độc Lập', 'Hội trường Thống Nhất'],
      siteType: 'MONUMENT',
      address: '135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      latitude: 10.777,
      longitude: 106.6953,
      tagline:
        'Nơi xe tăng 843 và 390 húc đổ cổng trưa 30/04/1975, đánh dấu thời khắc toàn thắng của Chiến dịch Hồ Chí Minh.',
      status: ContentStatus.PUBLISHED,
    },
    {
      name: 'Khu di tích lịch sử Địa đạo Củ Chi',
      slug: 'khu-di-tich-lich-su-dia-dao-cu-chi',
      aliases: ['Đất thép thành đồng Củ Chi'],
      siteType: 'BATTLEFIELD',
      address: 'Ấp Phú Hiệp, Xã Phú Mỹ Hưng, Huyện Củ Chi, TP. Hồ Chí Minh',
      latitude: 11.1414,
      longitude: 106.4625,
      tagline:
        'Hệ thống phòng tuyến ngầm dài hơn 250km kiên cường bám trụ sát nách sào huyệt Sài Gòn suốt thời kỳ kháng chiến chống Mỹ.',
      status: ContentStatus.PUBLISHED,
    },
    {
      name: 'Thành cổ Quảng Trị',
      slug: 'thanh-co-quang-tri',
      aliases: ['Thành Đinh Công Tráng'],
      siteType: 'CITADEL',
      address: 'Phường 2, Thị xã Quảng Trị, Tỉnh Quảng Trị',
      latitude: 16.7503,
      longitude: 107.1872,
      tagline:
        'Biểu tượng bất tử của 81 ngày đêm chiến đấu bảo vệ Thành cổ mùa hè đỏ lửa năm 1972, góp phần quyết định trên bàn đàm phán Paris.',
      status: ContentStatus.PUBLISHED,
    },
    {
      name: 'Đôi bờ Hiền Lương - Bến Hải (Vĩ tuyến 17)',
      slug: 'doi-bo-hien-luong-ben-hai-vi-tuyen-17',
      aliases: ['Giới tuyến quân sự tạm thời Vĩ tuyến 17'],
      siteType: 'MONUMENT',
      address: 'Xã Hiền Thành, Huyện Vĩnh Linh, Tỉnh Quảng Trị',
      latitude: 17.0044,
      longitude: 107.0514,
      tagline:
        'Chứng nhân lịch sử 21 năm chia cắt hai miền Nam - Bắc và khát vọng thống nhất non sông của dân tộc Việt Nam.',
      status: ContentStatus.PUBLISHED,
    },
    {
      name: 'Khu di tích Đồng Khởi Bến Tre',
      slug: 'khu-di-tich-dong-khoi-ben-tre',
      aliases: ['Định Thủy - Mỏ Cày'],
      siteType: 'MONUMENT',
      address: 'Xã Định Thủy, Huyện Mỏ Cày Nam, Tỉnh Bến Tre',
      latitude: 10.1235,
      longitude: 106.3328,
      tagline:
        'Cái nôi của phong trào Đồng Khởi năm 1960 mở bước ngoặt chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công.',
      status: ContentStatus.PUBLISHED,
    },
    {
      name: 'Hoàng thành Thăng Long - Hầm chỉ huy tác chiến T1',
      slug: 'hoang-thanh-thang-long-ham-chi-huy-tac-chien-t1',
      aliases: ['Tổng hành dinh Quân đội Nhân dân Việt Nam (Nhà D67)'],
      siteType: 'ANCIENT_CAPITAL',
      address: '19C Hoàng Diệu, Quận Ba Đình, TP. Hà Nội',
      latitude: 21.0347,
      longitude: 105.8407,
      tagline:
        'Nơi Bộ Chính trị và Quân ủy Trung ương trực tiếp chỉ đạo chống chiến tranh phá hoại miền Bắc và hạ quyết tâm giải phóng miền Nam.',
      status: ContentStatus.PUBLISHED,
    },
  ];

  const createdLocationsBySlug: Record<string, string> = {};
  for (const loc of locationsData) {
    const { siteType, address, latitude, longitude, ...entityData } = loc;
    const createdEntity = await prisma.historicalEntity.create({
      data: {
        ...entityData,
        type: HistoricalEntityType.LOCATION,
        historicalSite: {
          create: {
            siteType,
            address,
            latitude,
            longitude,
          },
        },
      },
    });
    createdLocationsBySlug[loc.slug] = createdEntity.id;
  }
  console.log(`✓ Đã tạo ${locationsData.length} Địa danh & Di tích lịch sử (HistoricalEntity type LOCATION + HistoricalSite).`);

  // -------------------------------------------------------------
  // BƯỚC 9: LIÊN KẾT ĐỒ THỊ TRI THỨC (KNOWLEDGE GRAPH JUNCTIONS)
  // -------------------------------------------------------------
  const allEvents = await prisma.historicalEvent.findMany();
  const findEventId = (keyword: string) =>
    allEvents.find((e) => e.title.includes(keyword))?.id;

  const lessonDongKhoiId =
    createdLessonsByTitle[
      'Phong trào Đồng Khởi (1959 - 1960) - Bước ngoặt lịch sử cách mạng miền Nam'
    ];
  const lessonParisId =
    createdLessonsByTitle[
      'Hiệp định Paris 1973 - Thắng lợi quyết định trên mặt trận ngoại giao'
    ];
  const lessonHoChiMinhCampaignId =
    createdLessonsByTitle['Đại thắng Mùa Xuân 1975 - Chiến dịch Hồ Chí Minh lịch sử'];

  const evtTruongSonId = findEventId('Trường Sơn');
  const evtDongKhoiId = findEventId('Đồng Khởi Bến Tre');
  const evtDienBienPhuTrenKhongId = findEventId('Điện Biên Phủ trên không');
  const evtParisId = findEventId('Hiệp định Paris');
  const evtHoChiMinhId = findEventId('Chiến dịch Hồ Chí Minh');

  if (evtTruongSonId && createdEntitiesBySlug['doan-559-bo-doi-truong-son']) {
    await prisma.historicalEventEntity.create({
      data: {
        eventId: evtTruongSonId,
        entityId: createdEntitiesBySlug['doan-559-bo-doi-truong-son'],
        role: 'Lực lượng mở đường & vận tải chiến lược',
      },
    });
  }

  if (evtDongKhoiId) {
    if (createdLocationsBySlug['khu-di-tich-dong-khoi-ben-tre']) {
      await prisma.historicalEvent.update({
        where: { id: evtDongKhoiId },
        data: {
          locationId: createdLocationsBySlug['khu-di-tich-dong-khoi-ben-tre'],
        },
      });
    }
    if (createdEntitiesBySlug['nu-tuong-nguyen-thi-dinh']) {
      await prisma.historicalEventEntity.create({
        data: {
          eventId: evtDongKhoiId,
          entityId: createdEntitiesBySlug['nu-tuong-nguyen-thi-dinh'],
          role: 'LEADER',
          roleLabel: 'Lãnh đạo khởi nghĩa',
        },
      });
    }
  }

  if (
    evtDienBienPhuTrenKhongId &&
    createdLocationsBySlug['hoang-thanh-thang-long-ham-chi-huy-tac-chien-t1']
  ) {
    await prisma.historicalEvent.update({
      where: { id: evtDienBienPhuTrenKhongId },
      data: {
        locationId: createdLocationsBySlug[
            'hoang-thanh-thang-long-ham-chi-huy-tac-chien-t1'
          ],
      },
    });
  }

  if (evtParisId && createdEntitiesBySlug['nha-ngoai-giao-nguyen-thi-binh']) {
    await prisma.historicalEventEntity.create({
      data: {
        eventId: evtParisId,
        entityId: createdEntitiesBySlug['nha-ngoai-giao-nguyen-thi-binh'],
        role: 'NEGOTIATOR',
        roleLabel: 'Trưởng phái đoàn đàm phán & Ký kết',
      },
    });
  }

  if (evtHoChiMinhId) {
    if (createdLocationsBySlug['dinh-doc-lap-hoi-truong-thong-nhat']) {
      await prisma.historicalEvent.update({
        where: { id: evtHoChiMinhId },
        data: {
          locationId: createdLocationsBySlug['dinh-doc-lap-hoi-truong-thong-nhat'],
        },
      });
    }
    for (const slugKey of [
      'dai-tuong-vo-nguyen-giap',
      'dai-tuong-van-tien-dung',
      'xe-tang-t-54b-so-hieu-843-va-390',
    ]) {
      if (createdEntitiesBySlug[slugKey]) {
        await prisma.historicalEventEntity.create({
          data: {
            eventId: evtHoChiMinhId,
            entityId: createdEntitiesBySlug[slugKey],
          },
        });
      }
    }
  }

  // -------------------------------------------------------------
  // BƯỚC 10: LỘ TRÌNH HỌC MẪU (LearningPath → Chapter → ChapterLesson)
  // -------------------------------------------------------------
  // Lưu ý quan trọng: LearningPath/Chapter là 1 trục HOÀN TOÀN KHÁC với Topic (Chủ đề) ở
  // trên — Topic phân loại bài học theo môn học (không phụ thuộc khóa học nào), còn
  // LearningPath là 1 KHÓA HỌC cụ thể tự chọn lại các bài học có sẵn (bất kể thuộc Topic
  // nào) và sắp xếp theo Chương riêng cho khóa học này. Xem ghi chú đầy đủ ở đầu
  // learningPath.prisma / topic.prisma. Seed 1 lộ trình mẫu ở đây để tab "Chương & nhóm"
  // trong HISGO Studio không trống khi mới cài đặt.
  const pickLessonIds = (titles: string[]): string[] =>
    titles.map((t) => createdLessonsByTitle[t]).filter((id): id is string => Boolean(id));

  const demoPathChapters = [
    {
      title: 'Chương 1: Giữ gìn lực lượng & Phong trào Đồng Khởi (1954 - 1963)',
      lessons: pickLessonIds([
        'Tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh huyền thoại',
        'Phong trào Đồng Khởi (1959 - 1960) - Bước ngoặt lịch sử cách mạng miền Nam',
        'Chiến thắng Ấp Bắc (1963) - Đòn bẻ gãy chiến thuật cơ động của Mỹ',
      ]),
    },
    {
      title: 'Chương 2: Tổng tiến công Tết Mậu Thân & "Điện Biên Phủ trên không" (1968 - 1972)',
      lessons: pickLessonIds([
        'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968',
        '81 ngày đêm bảo vệ Thành cổ Quảng Trị mùa hè đỏ lửa 1972',
        'Trận "Điện Biên Phủ trên không" 12 ngày đêm cuối năm 1972',
      ]),
    },
    {
      title: 'Chương 3: Hiệp định Paris & Đại thắng Mùa Xuân 1975',
      lessons: pickLessonIds([
        'Hiệp định Paris 1973 - Thắng lợi quyết định trên mặt trận ngoại giao',
        'Chiến dịch Tây Nguyên (Tháng 3/1975) - Đòn điểm huyệt Buôn Ma Thuột',
        'Đại thắng Mùa Xuân 1975 - Chiến dịch Hồ Chí Minh lịch sử',
      ]),
    },
  ];

  await prisma.learningPath.create({
    data: {
      title: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
      slug: toSlug('Lo trinh on thi THPT Khang chien chong My cuu nuoc 1954 1975'),
      description:
        'Hệ thống lại toàn bộ kiến thức trọng tâm giai đoạn 1954-1975 theo đúng trình tự ôn luyện, chọn lọc từ các bài học đã có trong Thư viện (không trùng với cây phân cấp Chủ đề).',
      isSequential: true,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
      chapters: {
        create: demoPathChapters.map((ch, chIdx) => ({
          title: ch.title,
          slug: toSlug(`${ch.title}-${chIdx}`),
          displayOrder: chIdx + 1,
          status: ContentStatus.PUBLISHED,
          chapterLessons: {
            create: ch.lessons.map((lessonId, lIdx) => ({
              lessonId,
              displayOrder: lIdx + 1,
            })),
          },
        })),
      },
    },
  });
  console.log('✓ Đã tạo 1 Lộ trình học mẫu (3 Chương, dùng lại bài học có sẵn trong Thư viện).');

  console.log('\n================================================================');
  console.log('   HOÀN TẤT SEED DỮ LIỆU CHUẨN XÁC 100%! CƠ SỞ DỮ LIỆU ĐÃ SẴN SÀNG');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
