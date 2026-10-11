import 'dotenv/config';
import {
  PrismaClient,
  ContentStatus,
  DifficultyLevel,
  userRole,
  userStatus,
  LearningPathType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

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
  await prisma.lessonMedia.deleteMany();
  await prisma.lessonTag.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.historicalEvent.deleteMany();
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
      periodId: period.id,
      parentId: null,
      name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
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
      periodId: period.id,
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1954 - 1960: Giữ gìn lực lượng và Phong trào Đồng Khởi',
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
      periodId: period.id,
      parentId: rootTopic1.id,
      name: 'Xây dựng hậu phương miền Bắc và chi viện cho tiền tuyến (1954 - 1959)',
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
      periodId: period.id,
      parentId: rootTopic1.id,
      name: 'Phong trào Đồng Khởi (1959 - 1960) & Sự ra đời của Mặt trận Dân tộc Giải phóng',
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
      periodId: period.id,
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1961 - 1965: Đánh bại chiến lược "Chiến tranh đặc biệt"',
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
      periodId: period.id,
      parentId: rootTopic2.id,
      name: 'Chiến thắng Ấp Bắc (1963) và cao trào phá tan Quốc sách Ấp chiến lược',
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
      periodId: period.id,
      parentId: rootTopic2.id,
      name: 'Các chiến dịch Bình Giã, Ba Gia, Đồng Xoài - Phá sản hoàn toàn Chiến tranh đặc biệt',
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
      periodId: period.id,
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1965 - 1968: Đánh bại "Chiến tranh cục bộ" & Tổng tiến công Tết Mậu Thân',
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
      periodId: period.id,
      parentId: rootTopic3.id,
      name: 'Chiến thắng Núi Thành, Vạn Tường & Bẻ gãy hai cuộc phản công chiến lược mùa khô',
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
      periodId: period.id,
      parentId: rootTopic3.id,
      name: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968 - Bước ngoặt chiến tranh',
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
      periodId: period.id,
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1969 - 1973: Đánh bại "Việt Nam hóa chiến tranh" & Hiệp định Paris 1973',
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
      periodId: period.id,
      parentId: rootTopic4.id,
      name: 'Chiến thắng Đường 9 - Nam Lào (1971) và Tiến công chiến lược 1972',
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
      periodId: period.id,
      parentId: rootTopic4.id,
      name: 'Trận Điện Biên Phủ trên không 12 ngày đêm (1972) & Ký kết Hiệp định Paris (1973)',
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
      periodId: period.id,
      parentId: rootTopicWar.id,
      name: 'Giai đoạn 1973 - 1975: Tổng tiến công và nổi dậy mùa Xuân 1975 giải phóng miền Nam',
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
      periodId: period.id,
      parentId: rootTopic5.id,
      name: 'Chiến thắng Phước Long (01/1975) & Hội nghị Bộ Chính trị hạ quyết tâm chiến lược',
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
      periodId: period.id,
      parentId: rootTopic5.id,
      name: 'Chiến dịch Tây Nguyên & Chiến dịch giải phóng Huế - Đà Nẵng (Tháng 3/1975)',
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
      periodId: period.id,
      parentId: rootTopic5.id,
      name: 'Chiến dịch Hồ Chí Minh lịch sử - Đại thắng ngày 30/4/1975 non sông liền một dải',
      description:
        '5 cánh quân thần tốc tiến về Sài Gòn - Gia Định, 11 giờ 30 phút ngày 30/4/1975 xe tăng 390 húc đổ cổng Dinh Độc Lập, cờ giải phóng tung bay, kết thúc vẻ vang 21 năm kháng chiến chống Mỹ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
  });

  console.log('✓ Đã tạo thành công 1 Chủ đề Gốc (Cấp 1), 5 Giai đoạn (Cấp 2) và 11 Chuyên đề (Cấp 3) phân cấp chuẩn.');

  // -------------------------------------------------------------
  // BƯỚC 5: KHỞI TẠO CÁC SỰ KIỆN LỊCH SỬ CHUẨN XÁC (HISTORICAL EVENTS)
  // -------------------------------------------------------------
  const eventsData = [
    {
      topicId: child1_1.id,
      title: 'Mở tuyến đường vận tải chiến lược Trường Sơn - Đường Hồ Chí Minh',
      eventYear: 1959,
      eventDateNote: '19/05/1959',
      location: 'Dãy Trường Sơn',
      description:
        'Đoàn 559 được thành lập, mở đường mòn Hồ Chí Minh trên bộ soi đường chi viện sức người, vũ khí từ hậu phương miền Bắc cho tiền tuyến miền Nam.',
      displayOrder: 1,
    },
    {
      topicId: child1_2.id,
      title: 'Phong trào Đồng Khởi Bến Tre bùng nổ',
      eventYear: 1960,
      eventDateNote: '17/01/1960',
      location: 'Mỏ Cày, Bến Tre',
      description:
        'Dưới sự lãnh đạo của Nữ tướng Nguyễn Thị Định và Tỉnh ủy Bến Tre, nhân dân huyện Mỏ Cày đồng loạt nổi dậy, mở đầu cao trào Đồng Khởi khắp miền Nam.',
      displayOrder: 2,
    },
    {
      topicId: child1_2.id,
      title: 'Thành lập Mặt trận Dân tộc Giải phóng miền Nam Việt Nam',
      eventYear: 1960,
      eventDateNote: '20/12/1960',
      location: 'Tây Ninh',
      description:
        'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam ra đời nhằm đoàn kết toàn dân đánh đổ ách thống trị của đế quốc Mỹ và chính quyền tay sai Ngô Đình Diệm.',
      displayOrder: 3,
    },
    {
      topicId: child2_1.id,
      title: 'Chiến thắng Ấp Bắc chấn động',
      eventYear: 1963,
      eventDateNote: '02/01/1963',
      location: 'Cai Lậy, Tiền Giang',
      description:
        'Lực lượng vũ trang cách mạng miền Nam bẻ gãy chiến thuật trực thăng vận và thiết xa vận của Mỹ, mở ra phong trào thi đua "Ấp Bắc giết giặc lập công".',
      displayOrder: 1,
    },
    {
      topicId: child3_1.id,
      title: 'Chiến thắng Vạn Tường - Trận đụng đầu lịch sử với quân viễn chinh Mỹ',
      eventYear: 1965,
      eventDateNote: '18/08/1965',
      location: 'Bình Sơn, Quảng Ngãi',
      description:
        'Trận đánh phủ đầu lính thủy đánh bộ Mỹ, chứng minh quân dân miền Nam có đầy đủ khả năng đánh thắng trực diện quân viễn chinh Mỹ.',
      displayOrder: 1,
    },
    {
      topicId: child3_2.id,
      title: 'Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968',
      eventYear: 1968,
      eventDateNote: '30/01/1968',
      location: 'Sài Gòn - Gia Định và toàn miền Nam',
      description:
        'Đòn tập kích bất ngờ vào Tòa Đại sứ Mỹ, Dinh Độc Lập, Bộ Tổng tham mưu ngụy, làm lung lay ý chí xâm lược của chính giới Washington.',
      displayOrder: 1,
    },
    {
      topicId: child4_1.id,
      title: 'Chiến thắng chiến dịch Đường 9 - Nam Lào',
      eventYear: 1971,
      eventDateNote: '23/03/1971',
      location: 'Đường 9 - Nam Lào',
      description:
        'Đập tan cuộc hành quân Lam Sơn 719 của địch, bảo vệ vững chắc tuyến hành lang vận chuyển chiến lược Bắc - Nam.',
      displayOrder: 1,
    },
    {
      topicId: child4_2.id,
      title: 'Chiến thắng "Điện Biên Phủ trên không" 12 ngày đêm Hà Nội',
      eventYear: 1972,
      eventDateNote: '18/12 - 30/12/1972',
      location: 'Hà Nội, Hải Phòng',
      description:
        'Quân dân miền Bắc bắn rơi 34 pháo đài bay B-52, đập tan cuộc tập kích đường không chiến lược Linebacker II của đế quốc Mỹ.',
      displayOrder: 1,
    },
    {
      topicId: child4_2.id,
      title: 'Ký kết Hiệp định Paris về chấm dứt chiến tranh tại Việt Nam',
      eventYear: 1973,
      eventDateNote: '27/01/1973',
      location: 'Paris, Pháp',
      description:
        'Mỹ buộc phải cam kết tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của nước Việt Nam, rút hết toàn bộ quân viễn chinh về nước.',
      displayOrder: 2,
    },
    {
      topicId: child5_1.id,
      title: 'Chiến thắng Đường 14 - Phước Long',
      eventYear: 1975,
      eventDateNote: '06/01/1975',
      location: 'Phước Long, Bình Phước',
      description:
        'Đòn trinh sát chiến lược giải phóng hoàn toàn một thị xã và một tỉnh đầu tiên ở miền Nam, tạo cơ sở thực tiễn để Bộ Chính trị quyết tâm giải phóng miền Nam.',
      displayOrder: 1,
    },
    {
      topicId: child5_2.id,
      title: 'Đột phá khẩu Buôn Ma Thuột - Khai màn Chiến dịch Tây Nguyên',
      eventYear: 1975,
      eventDateNote: '10/03/1975',
      location: 'Buôn Ma Thuột, Đắk Lắk',
      description:
        'Đòn điểm huyệt chiến lược xuất sắc làm rung chuyển và tan rã toàn bộ Quân đoàn 2 ngụy, mở toang cánh cửa xuống đồng bằng duyên hải miền Trung.',
      displayOrder: 1,
    },
    {
      topicId: child5_2.id,
      title: 'Giải phóng Cố đô Huế và thành phố Đà Nẵng',
      eventYear: 1975,
      eventDateNote: '26/03 - 29/03/1975',
      location: 'Huế & Đà Nẵng',
      description:
        'Tiêu diệt và làm tan rã toàn bộ lực lượng Quân đoàn 1 ngụy, giải phóng hoàn toàn dải đất miền Trung, tạo thời cơ "thần tốc" tiến về Sài Gòn.',
      displayOrder: 2,
    },
    {
      topicId: child5_3.id,
      title: 'Đại thắng Chiến dịch Hồ Chí Minh - Giải phóng hoàn toàn miền Nam',
      eventYear: 1975,
      eventDateNote: '30/04/1975',
      location: 'Dinh Độc Lập, Sài Gòn',
      description:
        '11 giờ 30 phút ngày 30/4/1975, xe tăng 390 húc đổ cổng chính Dinh Độc Lập. Lá cờ Mặt trận Dân tộc Giải phóng tung bay trên nóc dinh, non sông thu về một mối.',
      displayOrder: 1,
    },
  ];

  for (const evt of eventsData) {
    await prisma.historicalEvent.create({ data: evt });
  }
  console.log(`✓ Đã tạo ${eventsData.length} Sự kiện Lịch sử tiêu biểu với niên đại chính xác.`);

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
      sourceReferenceNote: 'Lịch sử Bộ chủng Phòng không - Không quân Việt Nam',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Âm mưu tàn bạo của Tổng thống Nixon</h2>
<p>Cuối năm 1972, nhằm ép Việt Nam Dân chủ Cộng hòa nhượng bộ tại bàn đàm phán Paris, Tổng thống Mỹ Nixon phát động chiến dịch tập kích đường không chiến lược <em>Linebacker II</em> rải thảm bom B-52 hủy diệt Hà Nội, Hải Phòng và miền Bắc.</p>

<h2>2. 12 ngày đêm quật ngã "Pháo đài bay"</h2>
<p>Từ ngày 18/12 đến ngày 30/12/1972, quân và dân miền Bắc với lực lượng nòng cốt là Bộ đội Phòng không - Không quân đã kiên cường giăng lưới lửa nhiều tầng:</p>
<ul>
  <li>Bộ đội Tên lửa SAM-2 lập công xuất sắc, bắn rơi pháo đài bay B-52 ngay trên bầu trời Hà Nội.</li>
  <li>Đêm 27/12/1972, Anh hùng phi công Phạm Tuân lái tiêm kích MiG-21 xuất kích bắn rơi B-52 tại chỗ.</li>
  <li>Đêm 28/12/1972, phi công Vũ Xuân Thiều dũng cảm công kích và hy sinh anh dũng sau khi tiêu diệt máy bay địch.</li>
</ul>

<h2>3. Ý nghĩa quyết định buộc Mỹ ký Hiệp định Paris</h2>
<p>Quân dân ta đã bắn rơi 81 máy bay địch, trong đó có <strong>34 chiếc siêu pháo đài bay B-52</strong>, đập tan huyền thoại bất khả xâm phạm của không lực Hoa Kỳ, buộc Mỹ phải đặt bút ký Hiệp định Paris ngày 27/01/1973.</p>`,
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
  ];

  for (const les of lessonsData) {
    const { tags, ...payload } = les;
    const createdLesson = await prisma.lesson.create({ data: payload });

    for (const tagName of tags) {
      const tagId = createdTags[tagName];
      if (tagId) {
        await prisma.lessonTag.create({
          data: {
            lessonId: createdLesson.id,
            tagId: tagId,
          },
        });
      }
    }
  }
  console.log(`✓ Đã tạo ${lessonsData.length} Bài học chuyên sâu với định dạng Rich Text và liên kết Tags.`);

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
