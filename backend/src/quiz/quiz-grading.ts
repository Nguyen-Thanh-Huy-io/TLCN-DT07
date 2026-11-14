import {
  FillInBlankQuestion,
  MatchingQuestion,
  OrderingQuestion,
  QuizQuestion,
  QuizQuestionType,
  TrueFalseQuestion,
} from './types/quiz-question.types';

/**
 * Câu trả lời của người học cho 1 câu hỏi — cùng định dạng client gửi lên:
 * SINGLE_CHOICE: optionId · MULTIPLE_CHOICE: optionId[] · TRUE_FALSE: boolean ·
 * FILL_IN_BLANK: chuỗi · ORDERING: itemId[] theo thứ tự · MATCHING: { leftId: rightId }.
 */
export type QuizAnswer = unknown;

export interface QuizGradingResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  /** questionId → đúng/sai, để client tô màu từng câu theo kết quả của server. */
  results: Record<string, boolean>;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string');

function gradeChoice(
  options: Array<{ id: string; isCorrect: boolean }>,
  answer: QuizAnswer,
): boolean {
  const selected =
    typeof answer === 'string' && answer
      ? [answer]
      : isStringArray(answer)
        ? answer
        : [];
  const correct = options.filter((o) => o.isCorrect).map((o) => o.id);
  if (correct.length === 0 || selected.length !== correct.length) return false;
  const selectedSet = new Set(selected);
  return correct.every((id) => selectedSet.has(id));
}

function gradeTrueFalse(q: TrueFalseQuestion, answer: QuizAnswer): boolean {
  return typeof answer === 'boolean' && answer === q.correctAnswer;
}

function gradeFillInBlank(q: FillInBlankQuestion, answer: QuizAnswer): boolean {
  if (typeof answer !== 'string' || !answer.trim()) return false;
  const normalize = (s: string) =>
    q.caseSensitive ? s.trim() : s.trim().toLowerCase();
  const candidate = normalize(answer);
  return (q.acceptedAnswers ?? []).some((acc) => normalize(acc) === candidate);
}

function gradeOrdering(q: OrderingQuestion, answer: QuizAnswer): boolean {
  const order = q.correctOrder ?? [];
  return (
    isStringArray(answer) &&
    answer.length === order.length &&
    order.every((id, idx) => answer[idx] === id)
  );
}

function gradeMatching(q: MatchingQuestion, answer: QuizAnswer): boolean {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
    return false;
  }
  const pairs = answer as Record<string, unknown>;
  const expected = q.correctPairs ?? [];
  return (
    expected.length > 0 && expected.every((p) => pairs[p.leftId] === p.rightId)
  );
}

export function isAnswerCorrect(q: QuizQuestion, answer: QuizAnswer): boolean {
  switch (q.type) {
    case QuizQuestionType.SINGLE_CHOICE:
    case QuizQuestionType.MULTIPLE_CHOICE:
      return gradeChoice(q.options ?? [], answer);
    case QuizQuestionType.TRUE_FALSE:
      return gradeTrueFalse(q, answer);
    case QuizQuestionType.FILL_IN_BLANK:
      return gradeFillInBlank(q, answer);
    case QuizQuestionType.ORDERING:
      return gradeOrdering(q, answer);
    case QuizQuestionType.MATCHING:
      return gradeMatching(q, answer);
    default:
      return false;
  }
}

/** Chấm cả bài theo đáp án lưu trong đề — không tin bất kỳ điểm số nào client tự khai. */
export function gradeQuizAttempt(
  questions: QuizQuestion[],
  answers: Record<string, QuizAnswer>,
): QuizGradingResult {
  const results: Record<string, boolean> = {};
  for (const q of questions) {
    results[q.id] = isAnswerCorrect(q, answers[q.id]);
  }
  const correctCount = Object.values(results).filter(Boolean).length;
  const totalQuestions = questions.length;
  return {
    correctCount,
    totalQuestions,
    scorePercent:
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0,
    results,
  };
}
