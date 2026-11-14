/**
 * Seed khép kín toàn diện hệ thống tri thức & học tập (Curriculum & Knowledge Integration)
 * Chuỗi liên kết:
 *   TOPIC -> ARTICLE -> LESSON (Block Builder) <- CHAPTER <- LEARNING PATH -> QUIZ (5 dạng) + QUESTION BANK -> TIMELINE (TimelineNode)
 *
 *   npm run seed:curriculum
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import {
  PrismaClient,
  ContentStatus,
  LessonStatus,
  LearningPathType,
  TopicIcon,
  DifficultyLevel,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { toBankQuestion, upsertTopicQuizFromSeed } from './quiz-bank.helper';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

// ---------- Helper tạo khối nội dung Block Builder (Lesson & Article) ----------
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

async function main() {
  console.log('🚀 Bắt đầu seed toàn diện: TOPIC -> ARTICLE -> LESSON -> LP -> QUIZ -> QUESTION -> TIMELINE...');

  // =========================================================================
  // BƯỚC 1: TẠO CÂY TOPIC (CHỦ ĐỀ LỊCH SỬ)
  // =========================================================================
  console.log('1️⃣ Khởi tạo cây Topic...');
  const rootTopic = await prisma.topic.upsert({
    where: { slug: 'thoi-ky-ly-tran' },
    update: {
      name: 'Thời kỳ Lý - Trần',
      eyebrow: 'Thế kỷ XI - XIV',
      icon: TopicIcon.Castle,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      description: 'Giai đoạn củng cố nền độc lập tự chủ và phát triển rực rỡ của văn minh Đại Việt với hào khí Đông A.',
    },
    create: {
      slug: 'thoi-ky-ly-tran',
      name: 'Thời kỳ Lý - Trần',
      eyebrow: 'Thế kỷ XI - XIV',
      icon: TopicIcon.Castle,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      description: 'Giai đoạn củng cố nền độc lập tự chủ và phát triển rực rỡ của văn minh Đại Việt với hào khí Đông A.',
    },
  });

  const childTopic = await prisma.topic.upsert({
    where: { slug: 'ba-lan-khang-chien-chong-nguyen-mong' },
    update: {
      parentId: rootTopic.id,
      name: 'Ba lần kháng chiến chống Nguyên Mông',
      eyebrow: '1258 - 1288',
      icon: TopicIcon.Swords,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      description: 'Ba cuộc kháng chiến vĩ đại của quân dân nhà Trần đánh bại đế quốc Mông - Nguyên hùng mạnh nhất thế giới thời bấy giờ.',
    },
    create: {
      slug: 'ba-lan-khang-chien-chong-nguyen-mong',
      parentId: rootTopic.id,
      name: 'Ba lần kháng chiến chống Nguyên Mông',
      eyebrow: '1258 - 1288',
      icon: TopicIcon.Swords,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      description: 'Ba cuộc kháng chiến vĩ đại của quân dân nhà Trần đánh bại đế quốc Mông - Nguyên hùng mạnh nhất thế giới thời bấy giờ.',
    },
  });

  // =========================================================================
  // BƯỚC 2: LIÊN KẾT BÀI VIẾT (ARTICLE) VÀO TOPIC
  // =========================================================================
  console.log('2️⃣ Gán Topic cho các Article liên quan...');
  const relatedArticleSlugs = [
    'tran-hung-dao',
    'tran-bach-dang-1288',
    'khang-chien-chong-nguyen-mong',
    'nha-tran',
  ];

  for (const slug of relatedArticleSlugs) {
    const art = await prisma.article.findUnique({ where: { slug } });
    if (art) {
      await prisma.article.update({
        where: { id: art.id },
        data: { topicId: childTopic.id },
      });
    }
  }

  // =========================================================================
  // BƯỚC 3: CẬP NHẬT DÒNG THỜI GIAN (TIMELINE) THEO TOPIC
  // =========================================================================
  console.log('3️⃣ Gán Topic cho Timeline & đảm bảo mốc trỏ đúng Article...');
  const timelineSlug = 'khang-chien-chong-nguyen-mong';
  const existingTimeline = await prisma.timeline.findUnique({ where: { slug: timelineSlug } });
  if (existingTimeline) {
    await prisma.timeline.update({
      where: { id: existingTimeline.id },
      data: { topicId: childTopic.id },
    });
  }

  // =========================================================================
  // BƯỚC 4: KHÓA HỌC (LEARNING PATH) & CHƯƠNG (CHAPTER)
  // =========================================================================
  console.log('4️⃣ Tạo Lộ trình học (Learning Path) và Chương (Chapter)...');
  const learningPath = await prisma.learningPath.upsert({
    where: { slug: 'hao-khi-dong-a-khang-chien-nguyen-mong' },
    update: {
      title: 'Hào khí Đông A: Nghệ thuật quân sự Đại Việt thời Trần',
      description: 'Khóa học chuyên sâu khám phá tư tưởng "vua tôi đồng lòng, anh em hòa mục" và nghệ thuật tác chiến đỉnh cao trong ba lần kháng chiến chống quân Nguyên.',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      slug: 'hao-khi-dong-a-khang-chien-nguyen-mong',
      title: 'Hào khí Đông A: Nghệ thuật quân sự Đại Việt thời Trần',
      description: 'Khóa học chuyên sâu khám phá tư tưởng "vua tôi đồng lòng, anh em hòa mục" và nghệ thuật tác chiến đỉnh cao trong ba lần kháng chiến chống quân Nguyên.',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });

  // Tìm hoặc tạo Chương 1
  let chapter = await prisma.chapter.findFirst({
    where: { learningPathId: learningPath.id, slug: 'chuong-3-quyet-chien-bach-dang' },
  });
  if (!chapter) {
    chapter = await prisma.chapter.create({
      data: {
        learningPathId: learningPath.id,
        title: 'Chương 3: Trận quyết chiến chiến lược trên sông Bạch Đằng (1288)',
        slug: 'chuong-3-quyet-chien-bach-dang',
        description: 'Phân tích nghệ thuật lợi dụng thủy triều, cọc ngầm và thế trận hợp đồng tác chiến tiêu diệt hoàn toàn thủy quân Ô Mã Nhi.',
        displayOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  // =========================================================================
  // BƯỚC 5: BÀI HỌC (LESSON) VỚI KHỐI NỘI DUNG BLOCK BUILDER
  // =========================================================================
  console.log('5️⃣ Tạo Bài học (Lesson) chuẩn Block Builder...');
  const lessonSlug = 'nghe-thuat-coc-ngam-bach-dang-1288';
  const lessonBlocks = [
    heading('1. Bối cảnh lịch sử và Kế sách rút lui của Ô Mã Nhi', 2),
    text(
      '<p>Đầu năm 1288, sau khi bị quân dân nhà Trần liên tục tập kích tiêu hao sinh lực và cắt đứt đoàn thuyền lương của Trương Văn Hổ tại Vân Đồn, quân Nguyên lâm vào tình thế tiến thoái lưỡng nan, thiếu lương thực trầm trọng và dịch bệnh hoành hành.</p><p>Thoát Hoan buộc phải hạ lệnh chia quân rút về nước theo hai đường: bộ binh do Thoát Hoan chỉ huy chạy về hướng Lạng Sơn, còn thủy quân do <strong>Ô Mã Nhi</strong> và Phàn Tiếp thống lĩnh men theo sông Bạch Đằng ra biển.</p>'
    ),
    quote(
      'Năm nay đánh giặc nhàn!',
      'Hưng Đạo Đại Vương Trần Quốc Tuấn',
      'Trả lời vua Trần Thánh Tông khi được hỏi về thế giặc lần thứ ba (1288)'
    ),
    heading('2. Trận địa cọc ngầm và quy luật thủy triều', 2),
    text(
      '<p>Nắm chắc đường rút lui của địch, Quốc công Tiết chế Trần Hưng Đạo đã chọn vùng hạ lưu sông Bạch Đằng - nơi lòng sông rộng hiểm trở, lau sậy rậm rạp và chịu ảnh hưởng trực tiếp của chế độ bán nhật triều - để bố trí trận địa mai phục lịch sử.</p><p>Hàng vạn thân gỗ lim, táu vót nhọn, bịt sắt được cắm nghiêng xuôi theo dòng nước ở các cửa lạch hiểm yếu như bãi cọc Yên Hưng, Đồng Vạn Muối. Khi thủy triều dâng cao, cọc hoàn toàn chìm dưới mặt nước; khi nước rút kiệt, cọc nhô lên thành bãi chông hiểm hóc ngăn đứt đường tháo chạy.</p>'
    ),
    callout(
      'Nghệ thuật nhử địch tài tình',
      'Sáng ngày 9 tháng 4 năm 1288 (tức ngày 8 tháng 3 năm Mậu Tý), khi thủy triều đang lên cao, tướng Nguyễn Khoái cho thuyền nhẹ ra khiêu chiến rồi giả thua rút chạy. Ô Mã Nhi tưởng thật xua toàn bộ chiến thuyền đuổi theo lọt sâu vào ổ mai phục khi triều bắt đầu rút mạnh.',
      'HISTORICAL_NOTE'
    ),
    heading('3. Ý nghĩa lịch sử vĩ đại', 2),
    text(
      '<p>Chiến thắng Bạch Đằng năm 1288 là đỉnh cao chói lọi của nghệ thuật quân sự Đại Việt. Toàn bộ hơn 400 chiến thuyền giặc bị tiêu diệt hoặc bắt sống, các tướng giặc Ô Mã Nhi, Phàn Tiếp, Tích Lệ Cơ đều bị bắt sống, đè bẹp vĩnh viễn mưu đồ xâm lược Đại Việt và các nước Đông Nam Á của đế chế Nguyên - Mông hùng mạnh.</p>'
    ),
  ];

  const lesson = await prisma.lesson.upsert({
    where: { slug: lessonSlug },
    update: {
      topicId: childTopic.id,
      title: 'Kế sách cọc ngầm và Chiến thắng Bạch Đằng 1288',
      description: 'Tìm hiểu chi tiết nghệ thuật mai phục cọc gỗ, tận dụng thủy triều tiêu diệt đoàn thủy binh Ô Mã Nhi trong kháng chiến chống Nguyên Mông lần thứ ba.',
      content: lessonBlocks,
      contentRichText: lessonBlocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: LessonStatus.PUBLISHED,
      displayOrder: 1,
    },
    create: {
      slug: lessonSlug,
      topicId: childTopic.id,
      title: 'Kế sách cọc ngầm và Chiến thắng Bạch Đằng 1288',
      description: 'Tìm hiểu chi tiết nghệ thuật mai phục cọc gỗ, tận dụng thủy triều tiêu diệt đoàn thủy binh Ô Mã Nhi trong kháng chiến chống Nguyên Mông lần thứ ba.',
      content: lessonBlocks,
      contentRichText: lessonBlocks.map((b) => ('content' in b ? b.content : '')).join('\n'),
      difficulty: DifficultyLevel.MEDIUM,
      status: LessonStatus.PUBLISHED,
      displayOrder: 1,
    },
  });

  // Gắn Lesson vào Chapter
  await prisma.chapterLesson.deleteMany({ where: { chapterId: chapter.id, lessonId: lesson.id } });
  await prisma.chapterLesson.create({
    data: {
      chapterId: chapter.id,
      lessonId: lesson.id,
      displayOrder: 1,
    },
  });

  // Gắn Tag cho Lesson
  const tagBachDang = await prisma.tag.findUnique({ where: { name: 'Bạch Đằng' } });
  const tagNhaTran = await prisma.tag.findUnique({ where: { name: 'Nhà Trần' } });
  if (tagBachDang) {
    await prisma.lessonTag.deleteMany({ where: { lessonId: lesson.id, tagId: tagBachDang.id } });
    await prisma.lessonTag.create({ data: { lessonId: lesson.id, tagId: tagBachDang.id } });
  }
  if (tagNhaTran) {
    await prisma.lessonTag.deleteMany({ where: { lessonId: lesson.id, tagId: tagNhaTran.id } });
    await prisma.lessonTag.create({ data: { lessonId: lesson.id, tagId: tagNhaTran.id } });
  }

  // =========================================================================
  // BƯỚC 6: ĐỀ ÔN TẬP CUỐI BÀI (QUIZ - 5 DẠNG CÂU HỎI TƯƠNG TÁC)
  // =========================================================================
  console.log('6️⃣ Tạo Đề ôn tập Quiz cuối bài học...');
  const quizQuestions = [
    {
      id: randomUUID(),
      type: 'MULTIPLE_CHOICE',
      prompt: 'Vị tướng nào trực tiếp chỉ huy đoàn thuyền chiến khiêu chiến nhử quân Nguyên vào bãi cọc Bạch Đằng?',
      options: [
        { id: 'opt_1', text: 'Trần Khánh Dư', isCorrect: false },
        { id: 'opt_2', text: 'Nguyễn Khoái', isCorrect: true },
        { id: 'opt_3', text: 'Phạm Ngũ Lão', isCorrect: false },
        { id: 'opt_4', text: 'Yết Kiêu', isCorrect: false },
      ],
      explanation: 'Tướng quân Nguyễn Khoái chỉ huy quân Thánh Dực dũng cảm ra khiêu chiến rồi giả vờ thua chạy để kéo địch vào bãi cọc khi nước rút.',
    },
    {
      id: randomUUID(),
      type: 'TRUE_FALSE',
      prompt: 'Trần Hưng Đạo đã chọn thời điểm thủy triều dâng cao nhất để phản công tổng lực dồn tàu địch vào bãi cọc.',
      correctAnswer: false,
      explanation: 'Quân ta nhử địch vào bãi cọc khi triều dâng, nhưng chờ đến lúc thủy triều rút kiệt, cọc nhô lên mới tổng phản công đẩy thuyền địch vào bãi cọc.',
    },
    {
      id: randomUUID(),
      type: 'ORDERING',
      prompt: 'Sắp xếp thứ tự diễn biến của trận Bạch Đằng năm 1288:',
      items: [
        { id: 'ord_1', label: 'Nguyễn Khoái khiêu chiến nhử thủy quân Ô Mã Nhi vào trận địa' },
        { id: 'ord_2', label: 'Thủy triều rút kiệt làm thuyền chiến địch vướng cọc và tan vỡ' },
        { id: 'ord_3', label: 'Quân mai phục của Trần Hưng Đạo hai bên bờ đồng loạt đổ ra tấn công' },
        { id: 'ord_4', label: 'Bắt sống tướng giặc Ô Mã Nhi và giải phóng hoàn toàn biên cương' },
      ],
      correctOrder: ['ord_1', 'ord_2', 'ord_3', 'ord_4'],
      explanation: 'Trình tự: Khiêu chiến nhử địch -> Thủy triều rút để lộ bãi cọc -> Đổ quân tổng công kích -> Bắt tướng giặc toàn thắng.',
    },
    {
      id: randomUUID(),
      type: 'MATCHING',
      prompt: 'Nối các nhân vật lịch sử với chiến công tiêu biểu trong kháng chiến chống Nguyên Mông 1288:',
      leftItems: [
        { id: 'left_1', label: 'Trần Hưng Đạo' },
        { id: 'left_2', label: 'Trần Khánh Dư' },
        { id: 'left_3', label: 'Ô Mã Nhi' },
      ],
      rightItems: [
        { id: 'right_1', label: 'Tổng chỉ huy trận Bạch Đằng' },
        { id: 'right_2', label: 'Đánh chìm đoàn thuyền lương Vân Đồn' },
        { id: 'right_3', label: 'Tướng giặc bị bắt sống trên sông' },
      ],
      correctPairs: [
        { leftId: 'left_1', rightId: 'right_1' },
        { leftId: 'left_2', rightId: 'right_2' },
        { leftId: 'left_3', rightId: 'right_3' },
      ],
      explanation: 'Trần Hưng Đạo chỉ huy toàn bộ chiến dịch; Trần Khánh Dư lập công tại Vân Đồn làm địch kiệt quệ lương thảo; Ô Mã Nhi bị bắt sống.',
    },
    {
      id: randomUUID(),
      type: 'FILL_IN_BLANK',
      prompt: 'Trong cuộc kháng chiến lần thứ ba, câu nói nổi tiếng của Trần Hưng Đạo với vua Trần là: "Năm nay đánh giặc _____!"',
      acceptedAnswers: ['nhàn', 'nhàn!'],
      explanation: 'Trần Hưng Đạo tự tin khẳng định: "Năm nay đánh giặc nhàn!" vì đã thấu rõ quy luật và kế sách của địch.',
    },
  ];

  await upsertTopicQuizFromSeed(prisma, {
    title: 'Đề ôn tập: Kế sách cọc ngầm Bạch Đằng 1288',
    description: 'Kiểm tra độ hiểu biết về chiến thuật, quy luật thủy triều và các nhân vật lịch sử then chốt trong trận Bạch Đằng.',
    passingScorePercent: 80,
    timeLimitMinutes: 10,
    topicIds: [childTopic.id],
    lessonId: lesson.id,
    questions: quizQuestions,
  });

  // =========================================================================
  // BƯỚC 7: BỔ SUNG NGÂN HÀNG CÂU HỎI TẬP TRUNG (QUESTION BANK)
  // =========================================================================
  console.log('7️⃣ Seed Ngân hàng câu hỏi tập trung (Question Model)...');
  const existingQ = await prisma.question.findFirst({
    where: { prompt: { contains: 'Trận Bạch Đằng năm 1288 diễn ra vào ngày nào' } },
  });

  const bankQuestion = existingQ
    ? null
    : toBankQuestion({
      type: 'SINGLE_CHOICE',
      prompt: 'Trận Bạch Đằng năm 1288 diễn ra vào ngày nào theo dương lịch?',
      explanation: 'Trận quyết chiến Bạch Đằng diễn ra vào ngày 9 tháng 4 năm 1288 (tức ngày 8 tháng 3 năm Mậu Tý).',
      options: ['09/04/1288', '08/03/1288', '01/01/1288', '30/04/1288'],
      correctAnswer: '09/04/1288',
    });
  if (bankQuestion) {
    await prisma.question.create({
      data: {
        ...bankQuestion,
        difficulty: 'MEDIUM',
        points: 10,
        topics: { connect: { id: childTopic.id } },
        lessons: { connect: { id: lesson.id } },
      },
    });
  }

  console.log('✅ HOÀN TẤT SEED TRỌN VẸN CHUỖI LIÊN KẾT DỮ LIỆU:');
  console.log(`- Topic: "${rootTopic.name}" -> "${childTopic.name}"`);
  console.log(`- Learning Path: "${learningPath.title}"`);
  console.log(`- Chapter: "${chapter.title}"`);
  console.log(`- Lesson: "${lesson.title}"`);
  console.log(`- Quiz: 5 dạng câu hỏi tích hợp sẵn vào bài học`);
  console.log(`- Question Bank: Kết nối N-N với Topic & Lesson`);
  console.log(`- Timeline & Article: Đã kết nối với Topic ID`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed curriculum:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
