import 'dotenv/config';
import {
  PrismaClient,
  ContentStatus,
  DifficultyLevel,
  LearningPathType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function buildLessonContent(heading: string, summary: string, keyPoints: string[]) {
  return {
    blocks: [
      {
        id: 'intro-heading',
        type: 'HEADING',
        data: { level: 2, text: heading },
      },
      {
        id: 'intro-text',
        type: 'TEXT',
        data: { content: summary },
      },
      {
        id: 'key-points',
        type: 'TEXT',
        data: {
          content: keyPoints.map((p) => `- ${p}`).join('\n'),
        },
      },
    ],
  };
}

async function main() {
  // Lấy 1 topic sẵn có làm topic mặc định cho các bài học mới
  const defaultTopic = await prisma.topic.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!defaultTopic) {
    throw new Error('Không tìm thấy Topic nào trong CSDL để gắn cho bài học.');
  }

  // 1. Seed 4 bài học riêng cho Mạch 02 (1945–1975) + 2 bài học cho Chuyên đề mới
  const lessonSpecs = [
    {
      slug: 'cach-mang-thang-tam-1945-va-nuoc-viet-nam-dan-chu-cong-hoa',
      title: 'Cách mạng Tháng Tám 1945 và sự ra đời nước Việt Nam Dân chủ Cộng hòa',
      description:
        'Bối cảnh lịch sử tháng 8/1945, Tổng khởi nghĩa giành chính quyền trên cả nước và bản Tuyên ngôn Độc lập ngày 2/9/1945.',
      difficulty: DifficultyLevel.MEDIUM,
      keyPoints: [
        'Thời cơ lịch sử khi phát xít Nhật đầu hàng Đồng minh (8/1945).',
        'Khởi nghĩa thắng lợi nhanh chóng tại Hà Nội (19/8), Huế (23/8), Sài Gòn (25/8).',
        'Ngày 2/9/1945 tại Quảng trường Ba Đình, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.',
      ],
    },
    {
      slug: 'chien-dich-dien-bien-phu-1954-lung-lay-nam-chau',
      title: 'Chiến dịch Điện Biên Phủ 1954 — Lừng lẫy năm châu, chấn động địa cầu',
      description:
        'Quyết định chuyển phương châm từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc" và chiến thắng lịch sử ngày 7/5/1954.',
      difficulty: DifficultyLevel.HARD,
      keyPoints: [
        'Tập đoàn cứ điểm Điện Biên Phủ được Pháp – Mỹ xây dựng thành "pháo đài bất khả xâm phạm".',
        'Ba đợt tiến công kéo dài 56 ngày đêm khoét núi, ngủ hầm, mưa dầm, cơm vắt.',
        'Ngày 7/5/1954, tướng De Castries đầu hàng, dẫn đến Hiệp định Giơ-ne-vơ.',
      ],
    },
    {
      slug: 'phong-trao-dong-khoi-va-tong-tien-cong-tet-mau-than-1968',
      title: 'Phong trào Đồng Khởi và Tổng tiến công Tết Mậu Thân 1968',
      description:
        'Bước ngoặt của cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công và đòn bất ngờ chiến lược năm 1968.',
      difficulty: DifficultyLevel.MEDIUM,
      keyPoints: [
        'Phong trào Đồng Khởi (1959–1960) bùng nổ từ Bến Tre, lan rộng khắp Nam Bộ và Tây Nguyên.',
        'Mặt trận Dân tộc Giải phóng miền Nam Việt Nam ra đời (20/12/1960).',
        'Tổng tiến công Tết Mậu Thân 1968 buộc Mỹ xuống thang chiến tranh và ngồi vào bàn đàm phán Paris.',
      ],
    },
    {
      slug: 'chien-dich-ho-chi-minh-va-dai-thang-mua-xuan-1975',
      title: 'Chiến dịch Hồ Chí Minh và Đại thắng Mùa Xuân 1975',
      description:
        'Ba chiến dịch lớn Tây Nguyên, Huế – Đà Nẵng và Chiến dịch Hồ Chí Minh giải phóng hoàn toàn miền Nam, thống nhất đất nước.',
      difficulty: DifficultyLevel.MEDIUM,
      keyPoints: [
        'Chiến dịch Tây Nguyên (3/1975) mở màn bằng trận then chốt Buôn Ma Thuột.',
        'Giải phóng Huế (26/3) và Đà Nẵng (29/3) làm tan rã hệ thống phòng thủ miền Trung.',
        '11 giờ 30 phút ngày 30/4/1975, cờ giải phóng tung bay trên nóc Dinh Độc Lập.',
      ],
    },
    {
      slug: 'nguyen-trai-va-tu-tuong-nhan-nghia-binh-ngo-dai-cao',
      title: 'Nguyễn Trãi và tư tưởng nhân nghĩa trong Bình Ngô đại cáo',
      description:
        'Tìm hiểu bản tuyên ngôn độc lập thứ hai của dân tộc và nghệ thuật "đem đại nghĩa để thắng hung tàn".',
      difficulty: DifficultyLevel.EASY,
      keyPoints: [
        'Tư tưởng lấy dân làm gốc: "Việc nhân nghĩa cốt ở yên dân".',
        'Khẳng định chủ quyền văn hiến, cương vực, phong tục và lịch sử độc lập của Đại Việt.',
        'Nghệ thuật tâm công và mở đường hiếu sinh cho quân bại trận.',
      ],
    },
    {
      slug: 'ngoai-giao-mem-deo-qua-cac-trieu-dai-viet-nam',
      title: 'Nghệ thuật ngoại giao mềm dẻo qua các triều đại Việt Nam',
      description:
        'Từ chính sách "trong xưng đế, ngoài xưng vương" thời Lý – Trần đến nghệ thuật hòa hiếu giữ vững độc lập.',
      difficulty: DifficultyLevel.MEDIUM,
      keyPoints: [
        'Giữ vững nguyên tắc độc lập chủ quyền nhưng linh hoạt về sách lược ứng xử.',
        'Kết hợp chặt chẽ giữa thắng lợi quân sự trên chiến trường với đấu tranh ngoại giao.',
        'Bài học lịch sử về bảo vệ hòa bình lâu dài cho quốc gia.',
      ],
    },
  ];

  const createdLessons: Record<string, { id: string; title: string }> = {};
  for (const spec of lessonSpecs) {
    const lesson = await prisma.lesson.upsert({
      where: { slug: spec.slug },
      update: {
        title: spec.title,
        description: spec.description,
        status: ContentStatus.PUBLISHED,
        difficulty: spec.difficulty,
      },
      create: {
        title: spec.title,
        slug: spec.slug,
        description: spec.description,
        difficulty: spec.difficulty,
        status: ContentStatus.PUBLISHED,
        topicId: defaultTopic.id,
        content: buildLessonContent(spec.title, spec.description, spec.keyPoints),
      },
      select: { id: true, title: true },
    });
    createdLessons[spec.slug] = lesson;
  }

  // 2. Tạo 1 đề thi Stage Exam riêng cho Mạch 02 Chặng 01 (1945–1954)
  const stageExamTitle = 'Kiểm tra cuối chặng: Kháng chiến chống Pháp (1945 – 1954)';
  let stageExam = await prisma.quiz.findFirst({
    where: { title: stageExamTitle },
    select: { id: true, title: true, passingScorePercent: true },
  });

  if (!stageExam) {
    stageExam = await prisma.quiz.create({
      data: {
        title: stageExamTitle,
        description:
          'Bài kiểm tra tổng hợp kiến thức Chặng 01 (Cách mạng Tháng Tám 1945 và Chiến dịch Điện Biên Phủ 1954).',
        passingScorePercent: 75,
        timeLimitMinutes: 15,
        topics: { connect: [{ id: defaultTopic.id }] },
      },
      select: { id: true, title: true, passingScorePercent: true },
    });

    const examQuestions = [
      {
        prompt: 'Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa vào ngày nào?',
        explanation: 'Ngày 2/9/1945 tại Quảng trường Ba Đình (Hà Nội).',
        options: [
          { id: 'a', text: '19/8/1945' },
          { id: 'b', text: '2/9/1945' },
          { id: 'c', text: '7/5/1954' },
          { id: 'd', text: '30/4/1975' },
        ],
        correctOptionId: 'b',
      },
      {
        prompt: 'Phương châm tác chiến quyết định thắng lợi trong Chiến dịch Điện Biên Phủ năm 1954 là gì?',
        explanation: 'Đại tướng Võ Nguyên Giáp đã quyết định chuyển từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc".',
        options: [
          { id: 'a', text: 'Đánh nhanh, thắng nhanh' },
          { id: 'b', text: 'Đánh chắc, tiến chắc' },
          { id: 'c', text: 'Vây thành diệt viện' },
          { id: 'd', text: 'Vườn không nhà trống' },
        ],
        correctOptionId: 'b',
      },
      {
        prompt: 'Chiến thắng lịch sử Điện Biên Phủ kết thúc toàn thắng vào ngày nào?',
        explanation: 'Chiều ngày 7/5/1954, quân ta bắt sống tướng De Castries và toàn bộ Bộ tham mưu tập đoàn cứ điểm.',
        options: [
          { id: 'a', text: '13/3/1954' },
          { id: 'b', text: '7/5/1954' },
          { id: 'c', text: '21/7/1954' },
          { id: 'd', text: '10/10/1954' },
        ],
        correctOptionId: 'b',
      },
    ];

    for (let i = 0; i < examQuestions.length; i++) {
      const q = examQuestions[i];
      const question = await prisma.question.create({
        data: {
          type: 'SINGLE_CHOICE',
          prompt: q.prompt,
          explanation: q.explanation,
          difficulty: DifficultyLevel.MEDIUM,
          points: 10,
          data: {
            options: q.options,
            correctOptionId: q.correctOptionId,
          },
          topics: { connect: [{ id: defaultTopic.id }] },
        },
      });
      await prisma.quizQuestion.create({
        data: {
          quizId: stageExam.id,
          questionId: question.id,
          displayOrder: i + 1,
          points: 10,
        },
      });
    }
  }

  // 3. Cập nhật Mạch 02 + 2 chặng với 4 bài học mới & Stage Exam riêng
  const track = await prisma.curriculumTrack.upsert({
    where: { slug: 'viet-nam-can-hien-dai-khang-chien-va-thong-nhat' },
    update: {
      title: 'Việt Nam Cận – Hiện đại: Kháng chiến & Thống nhất',
      description:
        'Hành trình từ Cách mạng Tháng Tám 1945, chiến thắng Điện Biên Phủ 1954 đến Đại thắng Mùa Xuân 1975.',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      title: 'Việt Nam Cận – Hiện đại: Kháng chiến & Thống nhất',
      slug: 'viet-nam-can-hien-dai-khang-chien-va-thong-nhat',
      description:
        'Hành trình từ Cách mạng Tháng Tám 1945, chiến thắng Điện Biên Phủ 1954 đến Đại thắng Mùa Xuân 1975.',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  const stage1 = await prisma.learningPath.upsert({
    where: { slug: 'cach-mang-thang-tam-va-khang-chien-chong-phap-1945-1954' },
    update: {
      trackId: track.id,
      stageOrder: 1,
      stageExamQuizId: stageExam.id,
      stageExamPassScore: stageExam.passingScorePercent ?? 75,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      title: 'Cách mạng Tháng Tám & Kháng chiến chống Pháp (1945 – 1954)',
      slug: 'cach-mang-thang-tam-va-khang-chien-chong-phap-1945-1954',
      description:
        'Tổng khởi nghĩa giành chính quyền năm 1945 và cuộc kháng chiến trường kỳ kết thúc bằng chiến thắng Điện Biên Phủ.',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 10,
      status: ContentStatus.PUBLISHED,
      trackId: track.id,
      stageOrder: 1,
      stageExamQuizId: stageExam.id,
      stageExamPassScore: stageExam.passingScorePercent ?? 75,
    },
  });

  const stage2 = await prisma.learningPath.upsert({
    where: { slug: 'khang-chien-chong-my-va-thong-nhat-dat-nuoc-1954-1975' },
    update: {
      trackId: track.id,
      stageOrder: 2,
      prerequisitePathId: stage1.id,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      title: 'Kháng chiến chống Mỹ & Thống nhất đất nước (1954 – 1975)',
      slug: 'khang-chien-chong-my-va-thong-nhat-dat-nuoc-1954-1975',
      description:
        'Các chiến dịch lớn từ Đồng Khởi, Tết Mậu Thân 1968 đến Chiến dịch Hồ Chí Minh lịch sử năm 1975.',
      pathType: LearningPathType.CHRONOLOGICAL,
      isSequential: true,
      displayOrder: 11,
      status: ContentStatus.PUBLISHED,
      trackId: track.id,
      stageOrder: 2,
      prerequisitePathId: stage1.id,
    },
  });

  // 4. Seed thêm Chuyên đề chuyên sâu thứ 2 (THEMATIC)
  const thematic2 = await prisma.learningPath.upsert({
    where: { slug: 'nghe-thuat-ngoai-giao-va-danh-nhan-lich-su-viet-nam' },
    update: {
      pathType: LearningPathType.THEMATIC,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      title: 'Nghệ thuật Ngoại giao & Danh nhân Lịch sử Việt Nam',
      slug: 'nghe-thuat-ngoai-giao-va-danh-nhan-lich-su-viet-nam',
      description:
        'Khám phá tư tưởng nhân nghĩa của Nguyễn Trãi và bản lĩnh ngoại giao mềm dẻo giúp dân tộc giữ vững độc lập.',
      pathType: LearningPathType.THEMATIC,
      isSequential: false,
      displayOrder: 12,
      status: ContentStatus.PUBLISHED,
    },
  });

  const replaceChapterLessons = async (
    learningPathId: string,
    title: string,
    slug: string,
    lessonSlugs: string[],
  ) => {
    let chapter = await prisma.chapter.findFirst({
      where: { learningPathId, slug },
    });
    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: {
          learningPathId,
          title,
          slug,
          displayOrder: 1,
          status: ContentStatus.PUBLISHED,
        },
      });
    }
    await prisma.chapterLesson.deleteMany({ where: { chapterId: chapter.id } });
    for (let i = 0; i < lessonSlugs.length; i++) {
      const lesson = createdLessons[lessonSlugs[i]];
      if (!lesson) continue;
      await prisma.chapterLesson.create({
        data: {
          chapterId: chapter.id,
          lessonId: lesson.id,
          displayOrder: i + 1,
        },
      });
    }
  };

  await replaceChapterLessons(
    stage1.id,
    'Chương 1: Từ Tổng khởi nghĩa 1945 đến Điện Biên Phủ',
    'chuong-1-tu-tong-khoi-nghia-1945-den-dien-bien-phu',
    [
      'cach-mang-thang-tam-1945-va-nuoc-viet-nam-dan-chu-cong-hoa',
      'chien-dich-dien-bien-phu-1954-lung-lay-nam-chau',
    ],
  );

  await replaceChapterLessons(
    stage2.id,
    'Chương 1: Tiến tới Đại thắng Mùa Xuân 1975',
    'chuong-1-tien-toi-dai-thang-mua-xuan-1975',
    [
      'phong-trao-dong-khoi-va-tong-tien-cong-tet-mau-than-1968',
      'chien-dich-ho-chi-minh-va-dai-thang-mua-xuan-1975',
    ],
  );

  await replaceChapterLessons(
    thematic2.id,
    'Chương 1: Tư tưởng nhân nghĩa và nghệ thuật ngoại giao',
    'chuong-1-tu-tuong-nhan-nghia-va-nghe-thuat-ngoai-giao',
    [
      'nguyen-trai-va-tu-tuong-nhan-nghia-binh-ngo-dai-cao',
      'ngoai-giao-mem-deo-qua-cac-trieu-dai-viet-nam',
    ],
  );

  console.log('Seeded distinct lessons, Stage Exam & Thematic 02:', {
    track: track.title,
    stageExam: stageExam.title,
    thematic2: thematic2.title,
    newLessons: Object.keys(createdLessons).length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
