import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QuizQuestion } from './types/quiz-question.types';
import { normalizeLegacyQuestion } from './validators/legacy-question.normalizer';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

/** Câu hỏi của đề, theo thứ tự trong đề — dùng chung cho mọi truy vấn đọc đề. */
export const QUIZ_QUESTIONS_INCLUDE = {
  quizQuestions: {
    include: { question: true },
    orderBy: { displayOrder: 'asc' },
  },
} satisfies Prisma.QuizInclude;

type QuizQuestionLink = Prisma.QuizQuestionGetPayload<{
  include: { question: true };
}>;

export type QuizQuestionWithPoints = QuizQuestion & { points: number };

const logger = new Logger('QuizQuestionMapper');

/** Trường chung của câu hỏi — là cột riêng ở bảng `questions`, không nằm trong `data`. */
const QUESTION_COLUMN_KEYS = new Set(['id', 'type', 'prompt', 'explanation']);

/** Phần riêng theo dạng câu (lựa chọn, mốc, cặp nối…) → cột `data` của Ngân hàng. */
export function bankDataOf(question: QuizQuestion): Prisma.InputJsonObject {
  const body = Object.fromEntries(
    Object.entries(question).filter(([key]) => !QUESTION_COLUMN_KEYS.has(key)),
  );
  // Câu đã qua validateAndNormalizeQuestions nên chỉ chứa chuỗi / số / boolean / mảng / object thuần.
  return body as Prisma.InputJsonObject;
}

/** Một dòng ngân hàng → câu hỏi đúng định dạng chấm điểm; `null` nếu không dùng được. */
export function toQuizQuestion(row: {
  id: string;
  type: string;
  prompt: string;
  explanation: string | null;
  data: Prisma.JsonValue;
}): QuizQuestion | null {
  const data =
    typeof row.data === 'object' &&
    row.data !== null &&
    !Array.isArray(row.data)
      ? row.data
      : {};
  const normalized = normalizeLegacyQuestion({
    ...data,
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    ...(row.explanation ? { explanation: row.explanation } : {}),
  });
  if (!normalized) return null;
  try {
    return validateAndNormalizeQuestions([normalized])[0];
  } catch (error) {
    logger.warn(
      `Bỏ qua câu hỏi ${row.id} không hợp lệ: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/** Liên kết đề ↔ ngân hàng (đã sắp theo `displayOrder`) → danh sách câu hỏi của đề. */
export function toQuizQuestions(
  links: QuizQuestionLink[],
): QuizQuestionWithPoints[] {
  return links.flatMap((link) => {
    const question = toQuizQuestion(link.question);
    return question ? [{ ...question, points: link.points }] : [];
  });
}
