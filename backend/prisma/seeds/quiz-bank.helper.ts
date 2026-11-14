/**
 * Ghi câu hỏi seed vào Ngân hàng câu hỏi đúng định dạng bộ kiểm tra (seed cũ còn viết lựa chọn là chuỗi,
 * đáp án bằng chữ…). Đề thi chỉ lấy câu từ Ngân hàng qua `quiz_questions` — không còn cột JSON trong đề.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_QUESTION_POINTS } from '../../src/quiz/quiz.constant';
import { bankDataOf } from '../../src/quiz/quiz-question.mapper';
import { normalizeLegacyQuestion } from '../../src/quiz/validators/legacy-question.normalizer';
import { validateAndNormalizeQuestions } from '../../src/quiz/validators/quiz-question.validator';

const SEED_PLACEHOLDER_ID = 'seed-question';

export interface BankQuestionContent {
  type: string;
  prompt: string;
  explanation: string | null;
  data: Prisma.InputJsonObject;
}

/** Câu hỏi seed (có thể ở định dạng cũ) → nội dung một dòng Ngân hàng; `null` nếu không chấm được (MAP). */
export function toBankQuestion(
  raw: Record<string, unknown>,
): BankQuestionContent | null {
  const normalized = normalizeLegacyQuestion({
    id: SEED_PLACEHOLDER_ID,
    ...raw,
  });
  if (!normalized) return null;
  const [question] = validateAndNormalizeQuestions([normalized]);
  return {
    type: question.type,
    prompt: question.prompt,
    explanation: question.explanation ?? null,
    data: bankDataOf(question),
  };
}

/** Thay toàn bộ câu hỏi của đề bằng các câu seed: câu cùng type + prompt trong Ngân hàng thì dùng lại. */
export async function setQuizQuestionsFromSeed(
  prisma: PrismaClient,
  quizId: string,
  lessonId: string | null,
  questions: unknown[],
): Promise<number> {
  const lessonLink = lessonId ? { lessons: { connect: { id: lessonId } } } : {};
  const questionIds: string[] = [];
  for (const raw of questions) {
    if (typeof raw !== 'object' || raw === null) continue;
    const content = toBankQuestion(raw as Record<string, unknown>);
    if (!content) continue;
    const existing = await prisma.question.findFirst({
      where: { type: content.type, prompt: content.prompt },
      select: { id: true },
    });
    const saved = existing
      ? await prisma.question.update({
          where: { id: existing.id },
          data: { ...content, ...lessonLink },
          select: { id: true },
        })
      : await prisma.question.create({
          data: { ...content, ...lessonLink },
          select: { id: true },
        });
    if (!questionIds.includes(saved.id)) questionIds.push(saved.id);
  }

  await prisma.$transaction([
    prisma.quizQuestion.deleteMany({ where: { quizId } }),
    prisma.quizQuestion.createMany({
      data: questionIds.map((questionId, displayOrder) => ({
        quizId,
        questionId,
        displayOrder,
        points: DEFAULT_QUESTION_POINTS,
      })),
    }),
  ]);
  return questionIds.length;
}

export interface SeedTopicQuiz {
  title: string;
  description?: string | null;
  passingScorePercent?: number;
  timeLimitMinutes?: number;
  /** Chủ đề của đề (đề thi thuộc Topic, không gắn Lesson). */
  topicIds: string[];
  /** Bài học nguồn — chỉ để gắn câu hỏi trong Ngân hàng với bài (lọc khi chọn câu). */
  lessonId: string | null;
  questions: unknown[];
}

/** Tạo hoặc cập nhật đề theo tên, gắn đúng các chủ đề, rồi thay toàn bộ câu hỏi của đề. */
export async function upsertTopicQuizFromSeed(
  prisma: PrismaClient,
  seed: SeedTopicQuiz,
): Promise<{ id: string; questionCount: number }> {
  const content = {
    title: seed.title,
    description: seed.description ?? null,
    passingScorePercent: seed.passingScorePercent,
    timeLimitMinutes: seed.timeLimitMinutes,
    topics: { set: seed.topicIds.map((id) => ({ id })) },
  };
  const existing = await prisma.quiz.findFirst({
    where: { title: seed.title },
    select: { id: true },
  });
  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: content,
        select: { id: true },
      })
    : await prisma.quiz.create({
        data: {
          ...content,
          topics: { connect: seed.topicIds.map((id) => ({ id })) },
        },
        select: { id: true },
      });
  const questionCount = await setQuizQuestionsFromSeed(
    prisma,
    quiz.id,
    seed.lessonId,
    seed.questions,
  );
  return { id: quiz.id, questionCount };
}
