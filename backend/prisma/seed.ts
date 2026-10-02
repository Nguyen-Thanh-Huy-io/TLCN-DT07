import 'dotenv/config';
import { PrismaClient, ContentStatus, DifficultyLevel, userRole, userStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Bắt đầu Seeding Dữ liệu Hệ thống TLCN-DT07 ---');

  // 1. Khởi tạo tài khoản Quản trị viên (Admin)
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
          bio: 'Tài khoản quản trị nội dung hệ thống học lịch sử.',
        },
      },
    },
  });

  console.log(`✓ Tạo tài khoản Admin thành công: ${adminUser.email}`);

  // 2. Khởi tạo các Thẻ phân loại (Tags)
  const tagData = [
    { name: 'Kháng chiến chống Mỹ', description: 'Các bài học thuộc cuộc kháng chiến chống Mỹ (1954 - 1975)', colorHex: '#1E40AF' },
    { name: 'Chiến dịch quân sự', description: 'Các chiến dịch quân sự quy mô lớn trong lịch sử', colorHex: '#DC2626' },
    { name: 'Phong trào quần chúng', description: 'Các phong trào khởi nghĩa, đồng khởi của nhân dân', colorHex: '#059669' },
    { name: 'Phòng không - Không quân', description: 'Chiến đấu bảo vệ vùng trời Tổ quốc', colorHex: '#0284C7' },
    { name: 'Đại thắng 1975', description: 'Tổng tiến công và nổi dậy giải phóng hoàn toàn miền Nam', colorHex: '#D97706' },
  ];

  const createdTags: Record<string, string> = {};
  for (const t of tagData) {
    const tag = await prisma.tag.upsert({
      where: { name: t.name },
      update: { description: t.description, colorHex: t.colorHex },
      create: t,
    });
    createdTags[t.name] = tag.id;
  }
  console.log(`✓ Đã tạo ${Object.keys(createdTags).length} thẻ phân loại (Tags).`);

  // 3. Khởi tạo Giai đoạn Lịch sử (Period)
  const period = await prisma.period.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000001' },
    update: {
      name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
      region: 'Toàn quốc',
      startYear: 1954,
      endYear: 1975,
      description: 'Giai đoạn lịch sử hào hùng của dân tộc Việt Nam: vừa xây dựng CNXH ở miền Bắc làm hậu phương, vừa kiên cường đánh bại các chiến lược chiến tranh của đế quốc Mỹ ở miền Nam, đỉnh cao là Đại thắng mùa Xuân 1975 thống nhất đất nước.',
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000001',
      name: 'Kháng chiến chống Mỹ, cứu nước (1954 - 1975)',
      region: 'Toàn quốc',
      startYear: 1954,
      endYear: 1975,
      description: 'Giai đoạn lịch sử hào hùng của dân tộc Việt Nam: vừa xây dựng CNXH ở miền Bắc làm hậu phương, vừa kiên cường đánh bại các chiến lược chiến tranh của đế quốc Mỹ ở miền Nam, đỉnh cao là Đại thắng mùa Xuân 1975 thống nhất đất nước.',
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
  });

  console.log(`✓ Đã tạo Giai đoạn: ${period.name}`);

  // 4. Khởi tạo 3 Chủ đề Lịch sử (Topics)
  const topicsData = [
    {
      id: 'c0a80123-0000-0000-0000-000000000011',
      periodId: period.id,
      name: 'Xây dựng hậu phương miền Bắc và Khởi nghĩa miền Nam (1954 - 1960)',
      description: 'Miền Bắc khôi phục kinh tế, cải tạo XHCN; miền Nam kiên cường giữ gìn lực lượng cách mạng và chuyển sang thế tiến công với phong trào Đồng Khởi.',
      isSequential: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000012',
      periodId: period.id,
      name: 'Đánh bại các chiến lược chiến tranh của Mỹ & Trận Điện Biên Phủ trên không (1961 - 1973)',
      description: 'Đánh bại Chiến tranh đặc biệt, Chiến tranh cục bộ, Việt Nam hóa chiến tranh; đập tan cuộc tập kích B-52 vào Hà Nội, buộc Mỹ ký Hiệp định Paris 1973.',
      isSequential: true,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000013',
      periodId: period.id,
      name: 'Cuộc Tổng tiến công và nổi dậy mùa Xuân 1975 giải phóng miền Nam (1973 - 1975)',
      description: 'Tiến hành 3 đòn chiến lược: Tây Nguyên, Huế - Đà Nẵng và Chiến dịch Hồ Chí Minh lịch sử, giải phóng hoàn toàn miền Nam, thống nhất Tổ quốc.',
      isSequential: true,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
  ];

  for (const top of topicsData) {
    await prisma.topic.upsert({
      where: { id: top.id },
      update: top,
      create: top,
    });
  }
  console.log('✓ Đã tạo 3 Chủ đề (Topics) phân kỳ chiến lược.');

  // 5. Khởi tạo Sự kiện Lịch sử (Historical Events)
  const eventsData = [
    {
      id: 'c0a80123-0000-0000-0000-000000000021',
      topicId: topicsData[0].id,
      title: 'Phong trào Đồng Khởi Bến Tre bùng nổ',
      eventYear: 1960,
      eventDateNote: '17/01/1960',
      location: 'Mỏ Cày, Bến Tre',
      description: 'Dưới sự lãnh đạo của nữ tướng Nguyễn Thị Định, quần chúng nhân dân vùng lên phá vỡ từng mảng lớn chính quyền địch, mở đầu phong trào Đồng Khởi toàn miền Nam.',
      displayOrder: 1,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000022',
      topicId: topicsData[1].id,
      title: 'Chiến thắng Ấp Bắc',
      eventYear: 1963,
      eventDateNote: '02/01/1963',
      location: 'Cai Lậy, Tiền Giang',
      description: 'Quân dân ta bẻ gãy chiến thuật trực thăng vận và thiết xa vận của Mỹ, mở ra phong trào thi đua Ấp Bắc giết giặc lập công.',
      displayOrder: 1,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000023',
      topicId: topicsData[1].id,
      title: 'Trận Điện Biên Phủ trên không 12 ngày đêm',
      eventYear: 1972,
      eventDateNote: '18/12 - 30/12/1972',
      location: 'Hà Nội, Hải Phòng',
      description: 'Quân dân miền Bắc bắn rơi 34 pháo đài bay B-52, đập tan âm mưu đưa miền Bắc trở về thời kỳ đồ đá của đế quốc Mỹ.',
      displayOrder: 2,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000024',
      topicId: topicsData[1].id,
      title: 'Ký kết Hiệp định Paris về Việt Nam',
      eventYear: 1973,
      eventDateNote: '27/01/1973',
      location: 'Paris, Pháp',
      description: 'Mỹ buộc phải ký hiệp định cam kết tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam, rút hết quân về nước.',
      displayOrder: 3,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000025',
      topicId: topicsData[2].id,
      title: 'Giải phóng Buôn Ma Thuột - Đột phá khẩu Tây Nguyên',
      eventYear: 1975,
      eventDateNote: '10/03/1975',
      location: 'Buôn Ma Thuột, Đắk Lắk',
      description: 'Đòn điểm huyệt chiến lược làm rối loạn toàn bộ thế bố phòng của đối phương ở Tây Nguyên.',
      displayOrder: 1,
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000026',
      topicId: topicsData[2].id,
      title: 'Đại thắng Chiến dịch Hồ Chí Minh',
      eventYear: 1975,
      eventDateNote: '30/04/1975',
      location: 'Dinh Độc Lập, Sài Gòn',
      description: '11 giờ 30 phút ngày 30/4/1975, lá cờ cách mạng tung bay trên nóc Dinh Độc Lập, chiến dịch Hồ Chí Minh toàn thắng.',
      displayOrder: 2,
    },
  ];

  for (const evt of eventsData) {
    await prisma.historicalEvent.upsert({
      where: { id: evt.id },
      update: evt,
      create: evt,
    });
  }
  console.log('✓ Đã tạo 6 Sự kiện lịch sử (Historical Events).');

  // 6. Khởi tạo Bài học (Lessons) và gán Tags
  const lessonsData = [
    {
      id: 'c0a80123-0000-0000-0000-000000000031',
      topicId: topicsData[0].id,
      title: 'Phong trào Đồng Khởi (1959 - 1960) - Bước ngoặt cách mạng miền Nam',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Sách giáo khoa Lịch sử 12, NXB Giáo dục, tr. 140',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Hoàn cảnh lịch sử</h2>
<p>Từ năm 1954 đến 1959, chính quyền Ngô Đình Diệm ban hành Luật 10/59, lê máy chém đi khắp miền Nam nhằm tiêu diệt lực lượng cách mạng.</p>
<p>Tháng 1/1959, Hội nghị Ban Chấp hành Trung ương Đảng lần thứ 15 quyết định: con đường phát triển cơ bản của cách mạng miền Nam là khởi nghĩa giành chính quyền về tay nhân dân.</p>
<h2>2. Diễn biến và Kết quả</h2>
<p>Ngày 17/1/1960, dưới sự lãnh đạo của Nữ tướng Nguyễn Thị Định, nhân dân huyện Mỏ Cày (Bến Tre) đồng loạt nổi dậy với vũ khí thô sơ kết hợp đòn tâm lý chính trị của "Đội quân tóc dài".</p>
<p>Phong trào nhanh chóng lan rộng ra toàn Nam Bộ và Tây Nguyên, phá vỡ từng mảng lớn bộ máy kìm kẹp của địch tại các xã, ấp.</p>
<h2>3. Ý nghĩa lịch sử</h2>
<p>Đồng Khởi đánh dấu bước phát triển nhảy vọt của cách mạng miền Nam: chuyển từ thế giữ gìn lực lượng sang thế tiến công, dẫn tới sự ra đời của Mặt trận Dân tộc Giải phóng miền Nam Việt Nam (20/12/1960).</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Phong trào quần chúng'],
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000032',
      topicId: topicsData[1].id,
      title: 'Trận Điện Biên Phủ trên không 1972 - Bản hùng ca bầu trời Hà Nội',
      difficulty: DifficultyLevel.HARD,
      sourceReferenceNote: 'Lịch sử Đảng Cộng sản Việt Nam, NXB Chính trị Quốc gia Sự thật',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Âm mưu của đế quốc Mỹ</h2>
<p>Cuối năm 1972, nhằm ép Việt Nam ký kết hiệp định theo các điều khoản có lợi cho Mỹ, Tổng thống Nixon ra lệnh mở chiến dịch tập kích đường không chiến lược Linebacker II bằng pháo đài bay B-52 vào Hà Nội và Hải Phòng.</p>
<h2>2. Diễn biến 12 ngày đêm khói lửa</h2>
<p>Từ đêm 18/12 đến 30/12/1972, quân và dân miền Bắc, nòng cốt là Bộ đội Phòng không - Không quân, đã kiên cường đánh trả các đợt rải thảm bom tàn bạo.</p>
<p>Hàng loạt pháo đài bay B-52 bốc cháy trên bầu trời thủ đô. Đêm 27/12/1972, phi công Phạm Tuân điều khiển tiêm kích MiG-21 xuất kích bắn rơi B-52 ngay trên bầu trời.</p>
<h2>3. Thắng lợi vang dội</h2>
<p>Quân dân ta đã bắn rơi 81 máy bay các loại (trong đó có 34 pháo đài bay B-52), lập nên kỳ tích "Điện Biên Phủ trên không", buộc Mỹ phải ký Hiệp định Paris ngày 27/1/1973 và rút quân về nước.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Phòng không - Không quân', 'Chiến dịch quân sự'],
    },
    {
      id: 'c0a80123-0000-0000-0000-000000000033',
      topicId: topicsData[2].id,
      title: 'Đại thắng Mùa Xuân 1975 - Chiến dịch Hồ Chí Minh toàn thắng',
      difficulty: DifficultyLevel.MEDIUM,
      sourceReferenceNote: 'Tổng hành dinh trong mùa Xuân toàn thắng - Đại tướng Võ Nguyên Giáp',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdBy: adminUser.id,
      contentRichText: `<h2>1. Bối cảnh và Quyết tâm chiến lược</h2>
<p>Sau thắng lợi vang dội của Chiến dịch Tây Nguyên và Chiến dịch Huế - Đà Nẵng, Bộ Chính trị Trung ương Đảng nhận định thời cơ lịch sử đã chín muồi: "Thần tốc, thần tốc hơn nữa; táo bạo, táo bạo hơn nữa; tranh thủ từng giờ, từng phút, xốc tới mặt trận, giải phóng miền Nam".</p>
<h2>2. Diễn biến 5 cánh quân tiến về Sài Gòn</h2>
<p>Ngày 26/4/1975, Chiến dịch Hồ Chí Minh mở màn. 5 cánh quân chủ lực đồng loạt tổng công kích vào các mục tiêu đầu não của đối phương tại Sài Gòn.</p>
<p>10 giờ 45 phút ngày 30/4/1975, xe tăng 390 và xe tăng 843 húc đổ cổng Dinh Độc Lập. Trung úy Bùi Quang Thận cắm lá cờ Mặt trận Dân tộc Giải phóng lên nóc dinh vào lúc 11 giờ 30 phút.</p>
<h2>3. Ý nghĩa vĩ đại</h2>
<p>Chấm dứt hoàn toàn ách thống trị của chủ nghĩa thực dân mới, hoàn thành xuất sắc cuộc kháng chiến chống Mỹ cứu nước, non sông thu về một mối, mở ra kỷ nguyên độc lập thống nhất cả nước đi lên CNXH.</p>`,
      tags: ['Kháng chiến chống Mỹ', 'Chiến dịch quân sự', 'Đại thắng 1975'],
    },
  ];

  for (const les of lessonsData) {
    const { tags, ...lessonPayload } = les;
    const lesson = await prisma.lesson.upsert({
      where: { id: lessonPayload.id },
      update: lessonPayload,
      create: lessonPayload,
    });

    // Gán Tags cho bài học qua LessonTag
    for (const tagName of tags) {
      const tagId = createdTags[tagName];
      if (tagId) {
        await prisma.lessonTag.upsert({
          where: {
            lessonId_tagId: {
              lessonId: lesson.id,
              tagId: tagId,
            },
          },
          update: {},
          create: {
            lessonId: lesson.id,
            tagId: tagId,
          },
        });
      }
    }
  }
  console.log('✓ Đã tạo 3 Bài học (Lessons) kèm nội dung Rich Text và liên kết LessonTags.');
  console.log('--- Hoàn tất Seeding thành công 100%! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
