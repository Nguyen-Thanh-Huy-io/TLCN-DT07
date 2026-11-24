/**
 * Khởi tạo dữ liệu cố định trên DB E2E (`tlcn_db_e2e`) cho kiểm thử Selenium UI & hiệu năng.
 * Tuyệt đối không đụng DB dev nhờ `applyE2eEnv()`.
 * Chạy: npx ts-node test/seed-ui-e2e.ts [--clean]
 */
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ContentStatus,
  DifficultyLevel,
  PostType,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { QuizQuestionType } from '../src/quiz/types/quiz-question.types';
import { applyE2eEnv } from './e2e-env';

const UI_PREFIX = 'e2e_ui_';
const DEFAULT_PASSWORD = process.env.E2E_UI_PASSWORD || 'HisgoE2e@2026!';

const SEED_CONSTANTS = {
  CATEGORY_SLUG: 'e2e-ui-nhan-vat',
  TOPIC_SLUG: 'e2e-ui-thoi-ky-hai-ba-trung',
  ARTICLE_SLUG: 'e2e-ui-khoi-nghia-hai-ba-trung',
  ARTICLE_TITLE: 'E2E Khởi nghĩa Hai Bà Trưng',
  BLOG_SLUG: 'e2e-ui-bai-dang-hai-ba-trung',
  TIMELINE_SLUG: 'e2e-ui-dong-thoi-gian-hai-ba-trung',
  TIMELINE_TITLE: 'E2E Dòng thời gian Hai Bà Trưng',
  QUIZ_TITLE: 'E2E Đề luyện tập Hai Bà Trưng',
  QUESTION_PROMPT: 'Cuộc khởi nghĩa Hai Bà Trưng nổ ra vào năm nào?',
  LESSON_SLUG: 'e2e-ui-bai-hoc-hai-ba-trung',
  LESSON_TITLE: 'E2E Bài học Khởi nghĩa Hai Bà Trưng',
  PATH_SLUG: 'e2e-ui-lo-trinh-hai-ba-trung',
  PATH_TITLE: 'E2E Lộ trình Lịch sử Hai Bà Trưng',
  TAG_NAME: 'E2E Hai Bà Trưng',
  TAG_SLUG: 'e2e-ui-tag-hai-ba-trung',
} as const;

async function cleanUiE2eFixtures(prisma: PrismaClient): Promise<void> {
  await prisma.learningPath.deleteMany({
    where: { slug: SEED_CONSTANTS.PATH_SLUG },
  });
  await prisma.lesson.deleteMany({
    where: { slug: SEED_CONSTANTS.LESSON_SLUG },
  });
  await prisma.tag.deleteMany({
    where: { name: SEED_CONSTANTS.TAG_NAME },
  });
  await prisma.quiz.deleteMany({
    where: { title: SEED_CONSTANTS.QUIZ_TITLE },
  });
  await prisma.timeline.deleteMany({
    where: { slug: SEED_CONSTANTS.TIMELINE_SLUG },
  });
  await prisma.question.deleteMany({
    where: { prompt: SEED_CONSTANTS.QUESTION_PROMPT },
  });
  await prisma.article.deleteMany({
    where: { slug: { startsWith: 'e2e-ui-' } },
  });
  await prisma.blogPost.deleteMany({
    where: { slug: SEED_CONSTANTS.BLOG_SLUG },
  });
  await prisma.topic.deleteMany({
    where: { slug: SEED_CONSTANTS.TOPIC_SLUG },
  });
  await prisma.category.deleteMany({
    where: { slug: { startsWith: 'e2e-ui-' } },
  });
  await prisma.authUser.deleteMany({
    where: { username: { startsWith: UI_PREFIX } },
  });
}

async function seedUser(
  prisma: PrismaClient,
  username: string,
  role: UserRole,
  passwordHash: string,
  firstName: string,
  lastName: string,
) {
  const email = `${username}@example.com`;
  const user = await prisma.authUser.create({
    data: {
      email,
      username,
      password: passwordHash,
      role,
      verified: true,
      status: UserStatus.ACTIVE,
      provider: 'local',
      tokenVersion: 1,
    },
  });
  await prisma.userProfile.create({
    data: {
      authId: user.id,
      firstName,
      lastName,
      bio: `Tài khoản kiểm thử tự động (${role})`,
    },
  });
  return user;
}

async function main(): Promise<void> {
  const target = applyE2eEnv();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: target.url }),
  });

  try {
    await cleanUiE2eFixtures(prisma);
    if (process.argv.includes('--clean')) {
      console.log(`Đã dọn dữ liệu UI E2E trên DB "${target.databaseName}".`);
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const [learner, author] = await Promise.all([
      seedUser(
        prisma,
        `${UI_PREFIX}learner`,
        UserRole.USER,
        passwordHash,
        'Minh',
        'Học Viên',
      ),
      seedUser(
        prisma,
        `${UI_PREFIX}author`,
        UserRole.MODERATOR,
        passwordHash,
        'Sử',
        'Biên Tập',
      ),
      seedUser(
        prisma,
        `${UI_PREFIX}admin`,
        UserRole.ADMIN,
        passwordHash,
        'Duyệt',
        'Quản Trị',
      ),
    ]);

    const category = await prisma.category.create({
      data: {
        name: 'Nhân vật E2E',
        slug: SEED_CONSTANTS.CATEGORY_SLUG,
        isActive: true,
        displayOrder: 99,
      },
    });

    const topic = await prisma.topic.create({
      data: {
        name: 'Thời kỳ Bắc thuộc E2E',
        slug: SEED_CONSTANTS.TOPIC_SLUG,
        status: ContentStatus.PUBLISHED,
        displayOrder: 99,
      },
    });

    const article = await prisma.article.create({
      data: {
        title: SEED_CONSTANTS.ARTICLE_TITLE,
        slug: SEED_CONSTANTS.ARTICLE_SLUG,
        summary:
          'Cuộc khởi nghĩa năm 40 SCN do Trưng Trắc và Trưng Nhị lãnh đạo chống nhà Đông Hán.',
        categoryId: category.id,
        topicId: topic.id,
        status: ContentStatus.PUBLISHED,
        createdBy: author.id,
        publishedAt: new Date(),
        startYear: 40,
        endYear: 43,
        contentBlocks: [
          {
            id: 'blk-e2e-1',
            type: 'TEXT',
            html: '<p>Mùa xuân năm 40 SCN, Hai Bà Trưng dựng cờ khởi nghĩa tại Hát Môn.</p>',
          },
        ],
      },
    });

    await prisma.blogPost.create({
      data: {
        authorId: author.id,
        postType: PostType.QUICK_POST,
        title: 'Ghi chép sử liệu Hai Bà Trưng E2E',
        slug: SEED_CONSTANTS.BLOG_SLUG,
        excerpt: 'Chia sẻ tư liệu về cuộc khởi nghĩa Mê Linh.',
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        contentBlocks: [],
      },
    });

    await prisma.timeline.create({
      data: {
        title: SEED_CONSTANTS.TIMELINE_TITLE,
        slug: SEED_CONSTANTS.TIMELINE_SLUG,
        description: 'Trình tự khởi nghĩa Hai Bà Trưng năm 40 - 43 SCN.',
        topicId: topic.id,
        status: ContentStatus.PUBLISHED,
        displayOrder: 1,
        nodes: {
          create: [
            {
              title: 'Hội thề Hát Môn (Năm 40)',
              description: 'Hai Bà Trưng phất cờ khởi nghĩa tại Hát Môn.',
              year: 40,
              displayOrder: 0,
              articleId: article.id,
              articles: {
                create: [{ articleId: article.id, displayOrder: 0 }],
              },
            },
          ],
        },
      },
    });

    const question = await prisma.question.create({
      data: {
        type: QuizQuestionType.SINGLE_CHOICE,
        prompt: SEED_CONSTANTS.QUESTION_PROMPT,
        explanation: 'Hai Bà Trưng khởi nghĩa vào mùa xuân năm 40 SCN.',
        difficulty: DifficultyLevel.EASY,
        points: 10,
        data: {
          options: [
            { id: 'opt_40', text: 'Năm 40 SCN', isCorrect: true },
            { id: 'opt_938', text: 'Năm 938 SCN', isCorrect: false },
          ],
        },
        topics: { connect: [{ id: topic.id }] },
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        title: SEED_CONSTANTS.QUIZ_TITLE,
        description: 'Đề luyện tập tự động E2E',
        passingScorePercent: 50,
        timeLimitMinutes: 10,
        topics: { connect: [{ id: topic.id }] },
        quizQuestions: {
          create: [
            {
              questionId: question.id,
              displayOrder: 0,
              points: 10,
            },
          ],
        },
      },
    });

    const tag = await prisma.tag.create({
      data: {
        name: SEED_CONSTANTS.TAG_NAME,
        colorHex: '#6e181b',
      },
    });

    const lesson = await prisma.lesson.create({
      data: {
        title: SEED_CONSTANTS.LESSON_TITLE,
        slug: SEED_CONSTANTS.LESSON_SLUG,
        description: 'Bài học E2E tìm hiểu cuộc khởi nghĩa Hai Bà Trưng năm 40 SCN.',
        topicId: topic.id,
        status: ContentStatus.PUBLISHED,
        difficulty: DifficultyLevel.EASY,
        createdBy: author.id,
        content: [
          {
            id: 'lesson-blk-1',
            type: 'HEADING',
            text: '1. Bối cảnh khởi nghĩa Mê Linh',
            level: 2,
          },
          {
            id: 'lesson-blk-2',
            type: 'TEXT',
            html: '<p>Mùa xuân năm 40 SCN, Hai Bà Trưng lập đàn thề tại cửa sông Hát.</p>',
          },
        ],
        lessonTags: {
          create: [{ tagId: tag.id }],
        },
      },
    });

    await prisma.learningPath.create({
      data: {
        title: SEED_CONSTANTS.PATH_TITLE,
        slug: SEED_CONSTANTS.PATH_SLUG,
        description: 'Lộ trình học tập E2E về thời kỳ Hai Bà Trưng.',
        status: ContentStatus.PUBLISHED,
        isSequential: true,
        displayOrder: 1,
        chapters: {
          create: [
            {
              title: 'Chương 1: Tiếng trống Mê Linh',
              slug: 'e2e-ui-chuong-1-tieng-trong-me-linh',
              description: 'Khởi nguồn cuộc khởi nghĩa năm 40 SCN.',
              displayOrder: 1,
              chapterLessons: {
                create: [
                  {
                    lessonId: lesson.id,
                    displayOrder: 1,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log(
      JSON.stringify({
        database: target.databaseName,
        learnerUsername: learner.username,
        authorUsername: author.username,
        articleSlug: article.slug,
        quizId: quiz.id,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
