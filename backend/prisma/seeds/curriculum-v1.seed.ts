/**
 * Seed khép kín toàn diện hệ thống tri thức & học tập (Curriculum & Knowledge Integration)
 * Chuỗi liên kết:
 *   TOPIC -> ARTICLE -> LESSON (Block Builder) <- CHAPTER <- LEARNING PATH (A -> B -> C) -> QUIZ -> TIMELINE
 *
 *   Chạy: npm --prefix backend run seed:curriculum
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import {
  PrismaClient,
  ContentStatus,
  LearningPathType,
  TopicIcon,
  DifficultyLevel,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { toBankQuestion, upsertTopicQuizFromSeed } from './quiz-bank.helper';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

// ---------- Helper tạo khối nội dung Block Builder (Lesson) ----------
const text = (html: string) => ({ id: randomUUID(), type: 'TEXT', width: 'FULL', content: html });
const heading = (value: string, level: 2 | 3 = 2) => ({
  id: randomUUID(),
  type: 'HEADING',
  width: 'FULL',
  level,
  text: value,
});
const quote = (quoteText: string, author: string, sourceContext?: string) => ({
  id: randomUUID(),
  type: 'QUOTE',
  width: 'FULL',
  quoteText,
  author,
  sourceContext,
});
const callout = (title: string, content: string, variant = 'HISTORICAL_NOTE') => ({
  id: randomUUID(),
  type: 'CALLOUT',
  width: 'FULL',
  variant,
  title,
  content,
});

async function upsertTag(name: string) {
  return prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function attachLessonTags(lessonId: string, tagNames: string[]) {
  for (const name of tagNames) {
    const tag = await upsertTag(name);
    await prisma.lessonTag.upsert({
      where: {
        lessonId_tagId: { lessonId, tagId: tag.id },
      },
      update: {},
      create: { lessonId, tagId: tag.id },
    });
  }
}

async function main() {
  console.log('🚀 Bắt đầu seed toàn diện Chương trình học (Curriculum) theo chuỗi A -> B -> C...');

  // =========================================================================
  // BƯỚC 1: KHỞI TẠO CÁC CHỦ ĐỀ (TOPICS)
  // =========================================================================
  console.log('1️⃣ Khởi tạo các Topic lịch sử...');
  const topicDungNuoc = await prisma.topic.upsert({
    where: { slug: 'thoi-ky-dung-nuoc' },
    update: {
      name: 'Thời kỳ dựng nước Văn Lang - Âu Lạc',
      eyebrow: 'Thế kỷ VII TCN - 179 TCN',
      icon: TopicIcon.Landmark,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      description: 'Thời kỳ mở đầu lịch sử dân tộc với truyền thuyết Hùng Vương, An Dương Vương và nền văn minh sông Hồng.',
    },
    create: {
      slug: 'thoi-ky-dung-nuoc',
      name: 'Thời kỳ dựng nước Văn Lang - Âu Lạc',
      eyebrow: 'Thế kỷ VII TCN - 179 TCN',
      icon: TopicIcon.Landmark,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      description: 'Thời kỳ mở đầu lịch sử dân tộc với truyền thuyết Hùng Vương, An Dương Vương và nền văn minh sông Hồng.',
    },
  });

  const topicBacThuoc = await prisma.topic.upsert({
    where: { slug: 'nghin-nam-bac-thuoc-dau-tranh' },
    update: {
      name: 'Nghìn năm Bắc thuộc và đấu tranh giành độc lập',
      eyebrow: '179 TCN - 938',
      icon: TopicIcon.Swords,
      isFeatured: true,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
      description: 'Thời kỳ đấu tranh bền bỉ, kiên cường giữ gìn bản sắc và các cuộc khởi nghĩa quật khởi giành lại chủ quyền dân tộc.',
    },
    create: {
      slug: 'nghin-nam-bac-thuoc-dau-tranh',
      name: 'Nghìn năm Bắc thuộc và đấu tranh giành độc lập',
      eyebrow: '179 TCN - 938',
      icon: TopicIcon.Swords,
      isFeatured: true,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
      description: 'Thời kỳ đấu tranh bền bỉ, kiên cường giữ gìn bản sắc và các cuộc khởi nghĩa quật khởi giành lại chủ quyền dân tộc.',
    },
  });

  const topicLyTran = await prisma.topic.upsert({
    where: { slug: 'thoi-ky-ly-tran' },
    update: {
      name: 'Thời kỳ Lý - Trần',
      eyebrow: 'Thế kỷ XI - XIV',
      icon: TopicIcon.Castle,
      isFeatured: true,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
      description: 'Giai đoạn củng cố nền độc lập tự chủ và phát triển rực rỡ của văn minh Đại Việt với hào khí Đông A.',
    },
    create: {
      slug: 'thoi-ky-ly-tran',
      name: 'Thời kỳ Lý - Trần',
      eyebrow: 'Thế kỷ XI - XIV',
      icon: TopicIcon.Castle,
      isFeatured: true,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
      description: 'Giai đoạn củng cố nền độc lập tự chủ và phát triển rực rỡ của văn minh Đại Việt với hào khí Đông A.',
    },
  });

  const topicDiSan = await prisma.topic.upsert({
    where: { slug: 'di-san-van-hoa-viet-nam' },
    update: {
      name: 'Di sản Văn hóa & Kiến trúc Dân tộc',
      eyebrow: 'Chuyên đề chuyên sâu',
      icon: TopicIcon.BookOpen,
      isFeatured: true,
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
      description: 'Khám phá các giá trị văn hóa, kiến trúc nghệ thuật và di sản vật thể, phi vật thể ngàn năm của người Việt.',
    },
    create: {
      slug: 'di-san-van-hoa-viet-nam',
      name: 'Di sản Văn hóa & Kiến trúc Dân tộc',
      eyebrow: 'Chuyên đề chuyên sâu',
      icon: TopicIcon.BookOpen,
      isFeatured: true,
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
      description: 'Khám phá các giá trị văn hóa, kiến trúc nghệ thuật và di sản vật thể, phi vật thể ngàn năm của người Việt.',
    },
  });

  // =========================================================================
  // BƯỚC 2: TẠO BÀI HỌC (LESSONS) CHO TỪNG GIAI ĐOẠN
  // =========================================================================
  console.log('2️⃣ Khởi tạo các Bài học (Lessons)...');

  // Bài A1: Nguồn gốc con Rồng cháu Tiên
  const lessonA1Blocks = [
    heading('1. Cội nguồn hình thành dân tộc Việt cổ', 2),
    text('<p>Theo truyền thuyết dân gian được ghi chép trong <em>Lĩnh Nam chích quái</em> và <em>Đại Việt sử ký toàn thư</em>, Lạc Long Quân thuộc dòng dõi Rồng kết duyên cùng Âu Cơ dòng giống Tiên, sinh ra bọc trăm trứng nở trăm người con trai. Đây là biểu tượng của tinh thần đại đoàn kết giống nòi đồng bào.</p>'),
    quote('Các Vua Hùng đã có công dựng nước, Bác cháu ta phải cùng nhau giữ lấy nước.', 'Chủ tịch Hồ Chí Minh', 'Nói chuyện tại Đền Hùng, 19/09/1954'),
    heading('2. Cương vực và kinh đô thời Hùng Vương', 2),
    text('<p>Người con trưởng ở lại đất Phong Châu (Phú Thọ ngày nay) được tôn lên làm vua, hiệu là Hùng Vương, đặt tên nước là <strong>Văn Lang</strong>. Đất nước chia làm 15 bộ, đóng đô tại Phong Châu (Việt Trì, Phú Thọ).</p>'),
    callout('Văn hóa Đông Sơn rực rỡ', 'Nền văn minh lúa nước sông Hồng phát triển vượt bậc gắn liền với trống đồng Đông Sơn - đỉnh cao nghệ thuật đúc đồng của người Việt cổ.', 'HISTORICAL_NOTE'),
  ];
  const lessonA1 = await prisma.lesson.upsert({
    where: { slug: 'nguon-goc-con-rong-chau-tien-van-lang' },
    update: {
      topicId: topicDungNuoc.id,
      title: 'Nguồn gốc con Rồng cháu Tiên và Địa bàn nước Văn Lang',
      description: 'Khám phá nguồn cội của dân tộc Việt qua huyền tích Rồng Tiên và cương vực nước Văn Lang thời kỳ đầu.',
      content: lessonA1Blocks,
      contentRichText: lessonA1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
    create: {
      slug: 'nguon-goc-con-rong-chau-tien-van-lang',
      topicId: topicDungNuoc.id,
      title: 'Nguồn gốc con Rồng cháu Tiên và Địa bàn nước Văn Lang',
      description: 'Khám phá nguồn cội của dân tộc Việt qua huyền tích Rồng Tiên và cương vực nước Văn Lang thời kỳ đầu.',
      content: lessonA1Blocks,
      contentRichText: lessonA1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
  });
  await attachLessonTags(lessonA1.id, ['Hùng Vương', 'Văn Lang', 'Đông Sơn']);

  // Bài A2: Tổ chức nhà nước và đời sống người Việt cổ
  const lessonA2Blocks = [
    heading('1. Cơ cấu tổ chức bộ máy nhà nước Văn Lang', 2),
    text('<p>Đứng đầu nhà nước là Hùng Vương, nắm mọi quyền hành tối cao. Giúp việc cho vua có các <strong>Lạc hầu</strong>. Đứng đầu các bộ là các <strong>Lạc tướng</strong> (thường là con trai vua). Dưới bộ là các công xã nông thôn (chiềng, chạ) do <strong>Bồ chính</strong> đứng đầu.</p>'),
    heading('2. Đời sống vật chất và phong tục tập quán', 2),
    text('<p>Người dân Văn Lang ăn gạo nếp, gạo tẻ nấu trong chõ gốm, ở nhà sàn tránh thú dữ, mặc váy, khố. Tục xăm mình, nhuộm răng, ăn trầu, làm bánh chưng bánh giầy ra đời từ thời kỳ này và trở thành bản sắc văn hóa trường tồn.</p>'),
  ];
  const lessonA2 = await prisma.lesson.upsert({
    where: { slug: 'to-chuc-va-doi-song-thoi-vua-hung' },
    update: {
      topicId: topicDungNuoc.id,
      title: 'Tổ chức nhà nước và Đời sống người Việt cổ thời Hùng Vương',
      description: 'Tìm hiểu cơ cấu chính quyền sơ khai và phong tục tập quán giàu bản sắc của cư dân Văn Lang.',
      content: lessonA2Blocks,
      contentRichText: lessonA2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
    create: {
      slug: 'to-chuc-va-doi-song-thoi-vua-hung',
      topicId: topicDungNuoc.id,
      title: 'Tổ chức nhà nước và Đời sống người Việt cổ thời Hùng Vương',
      description: 'Tìm hiểu cơ cấu chính quyền sơ khai và phong tục tập quán giàu bản sắc của cư dân Văn Lang.',
      content: lessonA2Blocks,
      contentRichText: lessonA2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
  });
  await attachLessonTags(lessonA2.id, ['Văn Lang', 'Đời sống cổ truyền', 'Hùng Vương']);

  // Bài A3: An Dương Vương và thành Cổ Loa
  const lessonA3Blocks = [
    heading('1. Sự thành lập nước Âu Lạc (khoảng 208 TCN)', 2),
    text('<p>Thục Phán - thủ lĩnh của người Tây Âu đã liên minh cùng người Lạc Việt đánh bại quân xâm lược Tần của Đồ Thư. Sau thắng lợi, Thục Phán lên ngôi xưng là <strong>An Dương Vương</strong>, sáp nhập Tây Âu và Lạc Việt thành nước <strong>Âu Lạc</strong>, dời đô xuống Cổ Loa (Đông Anh, Hà Nội).</p>'),
    heading('2. Thành Cổ Loa - Kiệt tác quân sự thành lũy hình xoắn ốc', 2),
    text('<p>Thành Cổ Loa gồm 3 vòng khép kín: Thành Nội, Thành Trung và Thành Ngoại. Chu vi vòng ngoài khoảng 8km, hào sâu nối liền sông Hoàng, thuận tiện cho việc cơ động thủy binh và bộ binh bảo vệ kinh đô.</p>'),
  ];
  const lessonA3 = await prisma.lesson.upsert({
    where: { slug: 'an-duong-vuong-ky-tich-thanh-co-loa' },
    update: {
      topicId: topicDungNuoc.id,
      title: 'An Dương Vương và Kỳ tích quân sự thành Cổ Loa',
      description: 'Tìm hiểu cuộc kháng chiến chống Tần, sự ra đời của nước Âu Lạc và kiến trúc quân sự kỳ vĩ của thành Cổ Loa.',
      content: lessonA3Blocks,
      contentRichText: lessonA3Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 3,
    },
    create: {
      slug: 'an-duong-vuong-ky-tich-thanh-co-loa',
      topicId: topicDungNuoc.id,
      title: 'An Dương Vương và Kỳ tích quân sự thành Cổ Loa',
      description: 'Tìm hiểu cuộc kháng chiến chống Tần, sự ra đời của nước Âu Lạc và kiến trúc quân sự kỳ vĩ của thành Cổ Loa.',
      content: lessonA3Blocks,
      contentRichText: lessonA3Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 3,
    },
  });
  await attachLessonTags(lessonA3.id, ['Âu Lạc', 'An Dương Vương', 'Cổ Loa']);

  // Bài B1: Khởi nghĩa Hai Bà Trưng
  const lessonB1Blocks = [
    heading('1. Tiếng trống Mê Linh thổi bùng ngọn lửa căm hờn', 2),
    text('<p>Mùa xuân năm 40, trước ách đô hộ tàn bạo của viên thái thú Tô Định và lòng căm thù giặc giết chồng (Thi Sách), Trưng Trắc cùng em gái là Trưng Nhị đã phất cờ khởi nghĩa tại cửa sông Hát (Hát Môn, Phúc Thọ, Hà Nội).</p>'),
    quote('Một xin rửa sạch nước thù,\nHai xin đem lại nghiệp xưa họ Hùng,\nBa kẻo oan ức lòng chồng,\nBốn xin vẹn vẹn sở công lênh này.', 'Lời thề xuất quân', 'Thiên Nam ngữ lục'),
    heading('2. Đánh đuổi Tô Định, xưng vương dựng nền tự chủ', 2),
    text('<p>Nghĩa quân đánh chiếm Mê Linh, tiến công Luy Lâu khiến Tô Định phải cắt tóc cạo râu trốn chạy về nước. Trưng Trắc được suy tôn làm vua (Trưng Vương), đóng đô tại Mê Linh, miễn thuế cho dân hai năm.</p>'),
  ];
  const lessonB1 = await prisma.lesson.upsert({
    where: { slug: 'tieng-trong-me-linh-khoi-nghia-hai-ba-trung' },
    update: {
      topicId: topicBacThuoc.id,
      title: 'Tiếng trống Mê Linh: Khởi nghĩa Hai Bà Trưng (Năm 40)',
      description: 'Cuộc khởi nghĩa mở đầu cho chuỗi phong trào đấu tranh bất khuất chống đồng hóa và áp bức phương Bắc.',
      content: lessonB1Blocks,
      contentRichText: lessonB1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
    create: {
      slug: 'tieng-trong-me-linh-khoi-nghia-hai-ba-trung',
      topicId: topicBacThuoc.id,
      title: 'Tiếng trống Mê Linh: Khởi nghĩa Hai Bà Trưng (Năm 40)',
      description: 'Cuộc khởi nghĩa mở đầu cho chuỗi phong trào đấu tranh bất khuất chống đồng hóa và áp bức phương Bắc.',
      content: lessonB1Blocks,
      contentRichText: lessonB1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
  });
  await attachLessonTags(lessonB1.id, ['Hai Bà Trưng', 'Mê Linh', 'Bắc thuộc']);

  // Bài B2: Khởi nghĩa Bà Triệu
  const lessonB2Blocks = [
    heading('1. Khí phách hiên ngang của nữ tướng Triệu Thị Trinh', 2),
    text('<p>Năm 248, bất bình trước chính sách bóc lột hà khắc của nhà Đông Ngô, Bà Triệu (Triệu Thị Trinh) cùng anh trai là Triệu Quốc Đạt dựng cờ khởi nghĩa ở căn cứ núi Nưa (Triệu Sơn, Thanh Hóa).</p>'),
    quote('Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ, chém cá kình ở biển Đông, lấy lại giang sơn, dựng nền độc lập, cởi ách nô lệ, chứ không chịu khom lưng làm tì thiếp người ta!', 'Bà Triệu', 'Khẩu khí anh hùng lưu danh sử sách'),
    heading('2. Cuộc chiến không cân sức làm rung chuyển Giao Châu', 2),
    text('<p>Khởi nghĩa lan nhanh khắp Cửu Chân rồi ra Giao Chỉ. Quân Ngô hoảng sợ phái Lục Dận đem 8.000 quân thiện chiến sang đàn áp. Sau nhiều tháng chiến đấu oanh liệt, Bà Triệu đã anh dũng hy sinh trên núi Tùng (Thanh Hóa).</p>'),
  ];
  const lessonB2 = await prisma.lesson.upsert({
    where: { slug: 'khoi-nghia-ba-trieu-khi-phach-song-ma' },
    update: {
      topicId: topicBacThuoc.id,
      title: 'Khởi nghĩa Bà Triệu: Khí phách người nữ anh hùng sông Mã',
      description: 'Bản anh hùng ca quật khởi thế kỷ thứ III với tuyên ngôn bất hủ về khát vọng độc lập và tự do.',
      content: lessonB2Blocks,
      contentRichText: lessonB2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
    create: {
      slug: 'khoi-nghia-ba-trieu-khi-phach-song-ma',
      topicId: topicBacThuoc.id,
      title: 'Khởi nghĩa Bà Triệu: Khí phách người nữ anh hùng sông Mã',
      description: 'Bản anh hùng ca quật khởi thế kỷ thứ III với tuyên ngôn bất hủ về khát vọng độc lập và tự do.',
      content: lessonB2Blocks,
      contentRichText: lessonB2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
  });
  await attachLessonTags(lessonB2.id, ['Bà Triệu', 'Thanh Hóa', 'Chống Ngô']);

  // Bài B3: Chiến thắng Bạch Đằng 938
  const lessonB3Blocks = [
    heading('1. Kế sách đánh giặc của Ngô Quyền', 2),
    text('<p>Năm 938, hoàng tử Nam Hán là Lưu Hoằng Tháo đem đoàn thủy binh lớn sang xâm lược. Ngô Quyền nhanh chóng hạ lệnh đốn gỗ lim rừng vót nhọn, bịt sắt cắm xuống lòng sông Bạch Đằng làm trận địa cọc ngầm.</p>'),
    heading('2. Quyết chiến trên sông Bạch Đằng', 2),
    text('<p>Khi thủy triều lên, Ngô Quyền cho thuyền nhẹ ra khiêu chiến rồi vờ rút chạy. Địch đuổi theo vượt qua bãi cọc. Khi triều rút nhanh, toàn bộ thủy quân ta quay lại tổng phản công dồn dập, đẩy thuyền giặc vướng cọc nhọn vỡ nát. Hoằng Tháo đền tội giữa dòng sông.</p>'),
    callout('Mốc son chói lọi', 'Chiến thắng Bạch Đằng năm 938 chấm dứt hơn 1.000 năm Bắc thuộc, mở ra kỷ nguyên độc lập, tự chủ lâu dài cho dân tộc ta.', 'HISTORICAL_NOTE'),
  ];
  const lessonB3 = await prisma.lesson.upsert({
    where: { slug: 'chien-thang-bach-dang-938-ngo-quyen' },
    update: {
      topicId: topicBacThuoc.id,
      title: 'Chiến thắng Bạch Đằng năm 938: Ngô Quyền mở ra kỷ nguyên độc lập',
      description: 'Trận thủy chiến lịch sử đặt dấu chấm hết vĩnh viễn cho hơn một thiên niên kỷ Bắc thuộc tăm tối.',
      content: lessonB3Blocks,
      contentRichText: lessonB3Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.HARD,
      status: ContentStatus.PUBLISHED,
      displayOrder: 3,
    },
    create: {
      slug: 'chien-thang-bach-dang-938-ngo-quyen',
      topicId: topicBacThuoc.id,
      title: 'Chiến thắng Bạch Đằng năm 938: Ngô Quyền mở ra kỷ nguyên độc lập',
      description: 'Trận thủy chiến lịch sử đặt dấu chấm hết vĩnh viễn cho hơn một thiên niên kỷ Bắc thuộc tăm tối.',
      content: lessonB3Blocks,
      contentRichText: lessonB3Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.HARD,
      status: ContentStatus.PUBLISHED,
      displayOrder: 3,
    },
  });
  await attachLessonTags(lessonB3.id, ['Ngô Quyền', 'Bạch Đằng 938', 'Độc lập']);

  // Bài C1: Hội nghị Diên Hồng và Hịch tướng sĩ
  const lessonC1Blocks = [
    heading('1. Tinh thần "Sát Thát" và Hội nghị Diên Hồng (1284)', 2),
    text('<p>Đứng trước họa xâm lược lần thứ hai của 50 vạn quân Nguyên Mông, Thượng hoàng Trần Thánh Tông triệu họp các bô lão cả nước tại thềm điện Diên Hồng để hỏi kế đánh hay hòa. Muôn người như một đồng thanh thét lớn: <strong>"ĐÁNH!"</strong>.</p>'),
    heading('2. Hịch tướng sĩ - Khúc tráng ca của lòng yêu nước', 2),
    text('<p>Quốc công Tiết chế Trần Hưng Đạo viết bài <em>Dụ chư tì tướng hịch văn</em> (Hịch tướng sĩ) khích lệ lòng căm thù giặc, tình nghĩa chủ tướng và tinh thần xả thân vì độc lập tổ quốc.</p>'),
  ];
  const lessonC1 = await prisma.lesson.upsert({
    where: { slug: 'hoi-nghi-dien-hong-hich-tuong-si' },
    update: {
      topicId: topicLyTran.id,
      title: 'Hội nghị Diên Hồng và Hịch tướng sĩ: Ý chí quật cường nhà Trần',
      description: 'Tìm hiểu sức mạnh đại đoàn kết dân tộc và áng văn nghị luận quân sự mẫu mực của Trần Hưng Đạo.',
      content: lessonC1Blocks,
      contentRichText: lessonC1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
    create: {
      slug: 'hoi-nghi-dien-hong-hich-tuong-si',
      topicId: topicLyTran.id,
      title: 'Hội nghị Diên Hồng và Hịch tướng sĩ: Ý chí quật cường nhà Trần',
      description: 'Tìm hiểu sức mạnh đại đoàn kết dân tộc và áng văn nghị luận quân sự mẫu mực của Trần Hưng Đạo.',
      content: lessonC1Blocks,
      contentRichText: lessonC1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
  });
  await attachLessonTags(lessonC1.id, ['Diên Hồng', 'Hịch tướng sĩ', 'Trần Hưng Đạo']);

  // Bài C2: Kế sách cọc ngầm Bạch Đằng 1288
  const lessonC2Blocks = [
    heading('1. Kế sách rút lui của Ô Mã Nhi và trận địa mai phục', 2),
    text('<p>Đầu năm 1288, sau khi cạn kiệt lương thực do bị Trần Khánh Dư tiêu diệt đoàn thuyền lương tại Vân Đồn, Ô Mã Nhi rút thủy quân men theo sông Bạch Đằng. Nắm chắc lộ trình này, Trần Hưng Đạo đã tổ chức trận địa cọc gỗ lim bịt sắt kết hợp quy luật bán nhật triều.</p>'),
    heading('2. Thắng lợi vang dội tiêu diệt 400 chiến thuyền', 2),
    text('<p>Toàn bộ thủy quân giặc bị đè bẹp, bắt sống các tướng giặc Ô Mã Nhi, Phàn Tiếp, vĩnh viễn chấm dứt dã tâm bành trướng xuống Đông Nam Á của vó ngựa Mông Cổ.</p>'),
  ];
  const lessonC2 = await prisma.lesson.upsert({
    where: { slug: 'nghe-thuat-coc-ngam-bach-dang-1288' },
    update: {
      topicId: topicLyTran.id,
      title: 'Kế sách cọc ngầm và Chiến thắng Bạch Đằng 1288',
      description: 'Đỉnh cao nghệ thuật chiến tranh nhân dân lợi dụng địa hình hiểm trở và quy luật thủy triều diệt giặc.',
      content: lessonC2Blocks,
      contentRichText: lessonC2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.HARD,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
    create: {
      slug: 'nghe-thuat-coc-ngam-bach-dang-1288',
      topicId: topicLyTran.id,
      title: 'Kế sách cọc ngầm và Chiến thắng Bạch Đằng 1288',
      description: 'Đỉnh cao nghệ thuật chiến tranh nhân dân lợi dụng địa hình hiểm trở và quy luật thủy triều diệt giặc.',
      content: lessonC2Blocks,
      contentRichText: lessonC2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.HARD,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
  });
  await attachLessonTags(lessonC2.id, ['Bạch Đằng 1288', 'Kháng chiến Nguyên Mông', 'Nhà Trần']);

  // Bài D1 (Chuyên đề): Điêu khắc gỗ đình làng
  const lessonD1Blocks = [
    heading('1. Vẻ đẹp mộc mạc và chân thực của nghệ thuật dân gian', 2),
    text('<p>Khác với nghệ thuật cung đình gò bó theo điển tích Nho giáo, các tác phẩm điêu khắc gỗ tại đình làng Bắc Bộ (thế kỷ XVI - XVIII) phản ánh sinh động cuộc sống đời thường: chèo thuyền, đấu vật, đánh cờ, trai gái tỏ tình...</p>'),
  ];
  const lessonD1 = await prisma.lesson.upsert({
    where: { slug: 'nghe-thuat-dieu-khac-go-dinh-lang' },
    update: {
      topicId: topicDiSan.id,
      title: 'Nghệ thuật điêu khắc gỗ đình làng Bắc Bộ',
      description: 'Hơi thở bình dị, phóng khoáng và tài hoa tuyệt luân của những nghệ nhân dân gian trên từng thớ gỗ cổ.',
      content: lessonD1Blocks,
      contentRichText: lessonD1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
    create: {
      slug: 'nghe-thuat-dieu-khac-go-dinh-lang',
      topicId: topicDiSan.id,
      title: 'Nghệ thuật điêu khắc gỗ đình làng Bắc Bộ',
      description: 'Hơi thở bình dị, phóng khoáng và tài hoa tuyệt luân của những nghệ nhân dân gian trên từng thớ gỗ cổ.',
      content: lessonD1Blocks,
      contentRichText: lessonD1Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.EASY,
      status: ContentStatus.PUBLISHED,
      displayOrder: 1,
    },
  });
  await attachLessonTags(lessonD1.id, ['Điêu khắc gỗ', 'Đình làng', 'Di sản']);

  // Bài D2 (Chuyên đề): Thành nhà Hồ
  const lessonD2Blocks = [
    heading('1. Kiến trúc thành đá độc nhất vô nhị ở Đông Nam Á', 2),
    text('<p>Xây dựng vào năm 1397 dưới triều Hồ Quý Ly tại Thanh Hóa, thành Tây Đô (Thành nhà Hồ) được ghép từ những khối đá vôi khổng lồ nặng từ 10 đến 20 tấn mà không cần bất kỳ chất kết dính vôi vữa nào.</p>'),
  ];
  const lessonD2 = await prisma.lesson.upsert({
    where: { slug: 'thanh-nha-ho-di-san-thanh-da' },
    update: {
      topicId: topicDiSan.id,
      title: 'Thành nhà Hồ: Di sản thành đá độc nhất vô nhị',
      description: 'Tìm hiểu kỹ thuật ghép đá kiệt xuất được UNESCO công nhận là Di sản Văn hóa Thế giới.',
      content: lessonD2Blocks,
      contentRichText: lessonD2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
    create: {
      slug: 'thanh-nha-ho-di-san-thanh-da',
      topicId: topicDiSan.id,
      title: 'Thành nhà Hồ: Di sản thành đá độc nhất vô nhị',
      description: 'Tìm hiểu kỹ thuật ghép đá kiệt xuất được UNESCO công nhận là Di sản Văn hóa Thế giới.',
      content: lessonD2Blocks,
      contentRichText: lessonD2Blocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: ContentStatus.PUBLISHED,
      displayOrder: 2,
    },
  });
  await attachLessonTags(lessonD2.id, ['Thành nhà Hồ', 'UNESCO', 'Kiến trúc']);

  // =========================================================================
  // BƯỚC 3: TẠO CHUỖI LỘ TRÌNH LIÊN KẾT A -> B -> C VÀ D (THEMATIC)
  // =========================================================================
  console.log('3️⃣ Khởi tạo chuỗi Lộ trình học (Learning Paths): A -> B -> C...');

  // KHÓA A: Buổi đầu dựng nước
  const pathA = await prisma.learningPath.upsert({
    where: { slug: 'buoi-dau-dung-nuoc-hung-vuong-an-duong-vuong' },
    update: {
      title: 'Buổi đầu dựng nước: Thời đại Hùng Vương và An Dương Vương',
      description: 'Lộ trình nhập môn khởi đầu dòng chảy nghìn năm dựng nước và giữ nước của dân tộc Việt cổ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      prerequisitePathId: null,
    },
    create: {
      slug: 'buoi-dau-dung-nuoc-hung-vuong-an-duong-vuong',
      title: 'Buổi đầu dựng nước: Thời đại Hùng Vương và An Dương Vương',
      description: 'Lộ trình nhập môn khởi đầu dòng chảy nghìn năm dựng nước và giữ nước của dân tộc Việt cổ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  // KHÓA B: Nghìn năm Bắc thuộc (Tiên quyết là Khóa A)
  const pathB = await prisma.learningPath.upsert({
    where: { slug: 'nghin-nam-bac-thuoc-dau-tranh-gianh-doc-lap' },
    update: {
      title: 'Nghìn năm Bắc thuộc và các cuộc đấu tranh giành độc lập',
      description: 'Hành trình kiên cường chống đồng hóa và các phong trào giải phóng dân tộc quật khởi (Yêu cầu xong Khóa A).',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
      prerequisitePathId: pathA.id,
    },
    create: {
      slug: 'nghin-nam-bac-thuoc-dau-tranh-gianh-doc-lap',
      title: 'Nghìn năm Bắc thuộc và các cuộc đấu tranh giành độc lập',
      description: 'Hành trình kiên cường chống đồng hóa và các phong trào giải phóng dân tộc quật khởi (Yêu cầu xong Khóa A).',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
      prerequisitePathId: pathA.id,
    },
  });

  // KHÓA C: Hào khí Đông A thời Trần (Tiên quyết là Khóa B)
  const pathC = await prisma.learningPath.upsert({
    where: { slug: 'hao-khi-dong-a-khang-chien-nguyen-mong' },
    update: {
      title: 'Hào khí Đông A: Nghệ thuật quân sự Đại Việt thời Trần',
      description: 'Khóa học chuyên sâu khám phá tư tưởng "vua tôi đồng lòng" và ba lần kháng chiến chống Nguyên Mông (Yêu cầu xong Khóa B).',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
      prerequisitePathId: pathB.id,
    },
    create: {
      slug: 'hao-khi-dong-a-khang-chien-nguyen-mong',
      title: 'Hào khí Đông A: Nghệ thuật quân sự Đại Việt thời Trần',
      description: 'Khóa học chuyên sâu khám phá tư tưởng "vua tôi đồng lòng" và ba lần kháng chiến chống Nguyên Mông (Yêu cầu xong Khóa B).',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
      prerequisitePathId: pathB.id,
    },
  });

  // KHÓA D: Chuyên đề Tự do (THEMATIC - Không ràng buộc tuần tự)
  const pathD = await prisma.learningPath.upsert({
    where: { slug: 'di-san-van-hoa-kien-truc-co-truyen' },
    update: {
      title: 'Di sản Văn hóa và Kiến trúc Cổ truyền Việt Nam',
      description: 'Khóa học chuyên đề tự do, có thể học bất cứ bài nào tùy thích để chiêm ngưỡng tinh hoa nghệ thuật cổ truyền.',
      pathType: LearningPathType.THEMATIC,
      isSequential: false,
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
      prerequisitePathId: null,
    },
    create: {
      slug: 'di-san-van-hoa-kien-truc-co-truyen',
      title: 'Di sản Văn hóa và Kiến trúc Cổ truyền Việt Nam',
      description: 'Khóa học chuyên đề tự do, có thể học bất cứ bài nào tùy thích để chiêm ngưỡng tinh hoa nghệ thuật cổ truyền.',
      pathType: LearningPathType.THEMATIC,
      isSequential: false,
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
    },
  });

  // =========================================================================
  // BƯỚC 4: TẠO CÁC CHƯƠNG (CHAPTERS) VÀ GẮN BÀI HỌC (CHAPTER_LESSON)
  // =========================================================================
  console.log('4️⃣ Tạo các Chương và liên kết Bài học...');

  async function upsertChapter(learningPathId: string, slug: string, title: string, displayOrder: number) {
    const existing = await prisma.chapter.findFirst({
      where: { learningPathId, slug },
    });
    if (existing) {
      return prisma.chapter.update({
        where: { id: existing.id },
        data: { title, displayOrder, status: ContentStatus.PUBLISHED },
      });
    }
    return prisma.chapter.create({
      data: { learningPathId, slug, title, displayOrder, status: ContentStatus.PUBLISHED },
    });
  }

  // Chapters của Khóa A
  const chA1 = await upsertChapter(pathA.id, 'chuong-1-nha-nuoc-van-lang', 'Chương 1: Nhà nước Văn Lang thời các vua Hùng', 1);
  const chA2 = await upsertChapter(pathA.id, 'chuong-2-nuoc-au-lac-co-loa', 'Chương 2: Nước Âu Lạc và công trình thành Cổ Loa', 2);

  // Gắn bài vào ChA1
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chA1.id } });
  await prisma.chapterLesson.createMany({
    data: [
      { chapterId: chA1.id, lessonId: lessonA1.id, displayOrder: 1 },
      { chapterId: chA1.id, lessonId: lessonA2.id, displayOrder: 2 },
    ],
  });
  // Gắn bài vào ChA2
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chA2.id } });
  await prisma.chapterLesson.createMany({
    data: [{ chapterId: chA2.id, lessonId: lessonA3.id, displayOrder: 1 }],
  });

  // Chapters của Khóa B
  const chB1 = await upsertChapter(pathB.id, 'chuong-1-khoi-nghia-gianh-chinh-quyen', 'Chương 1: Tiếng trống khởi nghĩa của các nữ tướng', 1);
  const chB2 = await upsertChapter(pathB.id, 'chuong-2-bach-dang-lich-su-938', 'Chương 2: Trận quyết chiến khép lại ngàn năm Bắc thuộc', 2);

  // Gắn bài vào ChB1
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chB1.id } });
  await prisma.chapterLesson.createMany({
    data: [
      { chapterId: chB1.id, lessonId: lessonB1.id, displayOrder: 1 },
      { chapterId: chB1.id, lessonId: lessonB2.id, displayOrder: 2 },
    ],
  });
  // Gắn bài vào ChB2
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chB2.id } });
  await prisma.chapterLesson.createMany({
    data: [{ chapterId: chB2.id, lessonId: lessonB3.id, displayOrder: 1 }],
  });

  // Chapters của Khóa C
  const chC1 = await upsertChapter(pathC.id, 'chuong-1-nguyen-mong-bach-dang', 'Chương 1: Nghệ thuật quân sự đánh thắng quân Mông - Nguyên', 1);
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chC1.id } });
  await prisma.chapterLesson.createMany({
    data: [
      { chapterId: chC1.id, lessonId: lessonC1.id, displayOrder: 1 },
      { chapterId: chC1.id, lessonId: lessonC2.id, displayOrder: 2 },
    ],
  });

  // Chapters của Khóa D
  const chD1 = await upsertChapter(pathD.id, 'chuong-1-tinh-hoa-kien-truc-co', 'Chương 1: Tinh hoa kiến trúc đá và điêu khắc gỗ', 1);
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chD1.id } });
  await prisma.chapterLesson.createMany({
    data: [
      { chapterId: chD1.id, lessonId: lessonD1.id, displayOrder: 1 },
      { chapterId: chD1.id, lessonId: lessonD2.id, displayOrder: 2 },
    ],
  });

  // =========================================================================
  // BƯỚC 5: TẠO ĐỀ ÔN TẬP QUIZ
  // =========================================================================
  console.log('5️⃣ Tạo các đề ôn tập Quiz...');
  await upsertTopicQuizFromSeed(prisma, {
    title: 'Đề ôn tập: Nguồn gốc và Văn minh Văn Lang - Âu Lạc',
    description: 'Kiểm tra hiểu biết về thời đại các vua Hùng, truyền thuyết và thành Cổ Loa.',
    passingScorePercent: 80,
    timeLimitMinutes: 10,
    topicIds: [topicDungNuoc.id],
    questions: [
      {
        id: randomUUID(),
        type: 'MULTIPLE_CHOICE',
        prompt: 'Thủ đô của nước Văn Lang thời các vua Hùng đặt ở đâu?',
        options: [
          { id: 'opt_1', text: 'Phong Châu (Phú Thọ)', isCorrect: true },
          { id: 'opt_2', text: 'Cổ Loa (Đông Anh)', isCorrect: false },
          { id: 'opt_3', text: 'Hoa Lư (Ninh Bình)', isCorrect: false },
          { id: 'opt_4', text: 'Thăng Long (Hà Nội)', isCorrect: false },
        ],
        explanation: 'Nhà nước Văn Lang đóng đô tại Phong Châu (nay thuộc tỉnh Phú Thọ).',
      },
      {
        id: randomUUID(),
        type: 'TRUE_FALSE',
        prompt: 'Nước Âu Lạc do Thục Phán An Dương Vương sáng lập sau thắng lợi trước quân xâm lược Tần.',
        correctAnswer: true,
        explanation: 'Thục Phán lãnh đạo kháng chiến chống Tần thắng lợi, xưng An Dương Vương và lập ra nước Âu Lạc.',
      },
    ],
  });

  await upsertTopicQuizFromSeed(prisma, {
    title: 'Đề ôn tập: Khởi nghĩa chống Bắc thuộc & Ngô Quyền',
    description: 'Ôn tập về Hai Bà Trưng, Bà Triệu và trận Bạch Đằng năm 938.',
    passingScorePercent: 80,
    timeLimitMinutes: 10,
    topicIds: [topicBacThuoc.id],
    questions: [
      {
        id: randomUUID(),
        type: 'MULTIPLE_CHOICE',
        prompt: 'Chiến thắng nào đã đặt dấu chấm hết vĩnh viễn cho hơn 1.000 năm Bắc thuộc?',
        options: [
          { id: 'opt_1', text: 'Khởi nghĩa Hai Bà Trưng năm 40', isCorrect: false },
          { id: 'opt_2', text: 'Khởi nghĩa Lý Bí năm 542', isCorrect: false },
          { id: 'opt_3', text: 'Chiến thắng Bạch Đằng năm 938 của Ngô Quyền', isCorrect: true },
          { id: 'opt_4', text: 'Khúc Thừa Dụ xưng Tiết độ sứ năm 905', isCorrect: false },
        ],
        explanation: 'Trận Bạch Đằng năm 938 do Ngô Quyền lãnh đạo tiêu diệt quân Nam Hán đã khép lại 1.000 năm Bắc thuộc.',
      },
    ],
  });

  console.log('✅ HOÀN TẤT SEED CHƯƠNG TRÌNH HỌC TOÀN DIỆN:');
  console.log(`- Khóa A: "${pathA.title}" (Tuần tự: Có, Tiên quyết: Không)`);
  console.log(`- Khóa B: "${pathB.title}" (Tuần tự: Có, Tiên quyết: Khóa A)`);
  console.log(`- Khóa C: "${pathC.title}" (Tuần tự: Có, Tiên quyết: Khóa B)`);
  console.log(`- Khóa D: "${pathD.title}" (Thematic - Tự do)`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed curriculum:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
