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
