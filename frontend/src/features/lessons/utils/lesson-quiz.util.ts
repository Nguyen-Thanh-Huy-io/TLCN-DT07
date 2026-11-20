import { generateQuizId } from '../factories/quiz-question.factory';
import { LessonBlockType } from '../types/editor.types';
import type {
  LessonBlockItem,
  LessonQuizQuestion,
  QuizBlockData,
} from '../types/block-builder.types';
import { QuizQuestionType, type QuizQuestion } from '../types/quiz.types';

/** Khối Ôn tập là phần tự kiểm tra ngắn giữa / cuối bài — đề dài thì dùng Đề thi ở /luyen-tap. */
export const LESSON_QUIZ_MAX_QUESTIONS = 5;
export const LESSON_QUIZ_DEFAULT_TITLE = 'Kiểm tra nhanh';
/** Chỗ giữ chỗ trong HTML bài học; trang đọc / xem trước gắn khối tương tác vào đây. */
export const LESSON_QUIZ_PLACEHOLDER_ATTR = 'data-lesson-quiz';

/** Câu hỏi của khối; khối dạng cũ (1 câu một đáp án) được đọc thành 1 câu SINGLE_CHOICE. */
export function quizBlockQuestions(block: QuizBlockData): LessonQuizQuestion[] {
  if (Array.isArray(block.questions)) return block.questions;
  if (!block.question?.trim() || !block.options?.length) return [];
  return [
    {
      id: `${block.id}_legacy`,
      type: QuizQuestionType.SINGLE_CHOICE,
      prompt: block.question,
      options: block.options,
      ...(block.explanation ? { explanation: block.explanation } : {}),
    },
  ];
}

/** Mọi khối Ôn tập trong bài (kể cả nằm trong cột của hàng nhiều cột), theo id. */
export function collectQuizBlocks(blocks: LessonBlockItem[]): Map<string, QuizBlockData> {
  const found = new Map<string, QuizBlockData>();
  const visit = (items: LessonBlockItem[]) => {
    for (const block of items) {
      if (block.type === LessonBlockType.QUIZ) found.set(block.id, block);
      if (block.type === LessonBlockType.SECTION_ROW) {
        block.columns.forEach((col) => visit(col.blocks));
      }
    }
  };
  visit(blocks);
  return found;
}

/** Chép câu từ Ngân hàng vào bài: id mới để sửa trong bài không đụng Ngân hàng, giữ `sourceQuestionId`. */
export function copyBankQuestion(question: QuizQuestion): LessonQuizQuestion {
  return { ...structuredClone(question), id: generateQuizId('q'), sourceQuestionId: question.id };
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string');

function isChoiceCorrect(options: Array<{ id: string; isCorrect: boolean }>, answer: unknown): boolean {
  const selected = typeof answer === 'string' && answer ? [answer] : isStringArray(answer) ? answer : [];
  const correct = options.filter((o) => o.isCorrect).map((o) => o.id);
  return correct.length > 0 && selected.length === correct.length && correct.every((id) => selected.includes(id));
}

function isFillInBlankCorrect(accepted: string[], caseSensitive: boolean, answer: unknown): boolean {
  if (typeof answer !== 'string' || !answer.trim()) return false;
  const normalize = (s: string) => (caseSensitive ? s.trim() : s.trim().toLowerCase());
  return accepted.some((acc) => normalize(acc) === normalize(answer));
}

function isMatchingCorrect(pairs: Array<{ leftId: string; rightId: string }>, answer: unknown): boolean {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return false;
  const chosen = new Map(Object.entries(answer));
  return pairs.length > 0 && pairs.every((p) => chosen.get(p.leftId) === p.rightId);
}

/** Tự chấm 1 câu ngay trên trình duyệt — cùng luật với `backend/src/quiz/quiz-grading.ts`. */
export function isLessonAnswerCorrect(question: QuizQuestion, answer: unknown): boolean {
  switch (question.type) {
    case QuizQuestionType.SINGLE_CHOICE:
    case QuizQuestionType.MULTIPLE_CHOICE:
      return isChoiceCorrect(question.options, answer);
    case QuizQuestionType.TRUE_FALSE:
      return typeof answer === 'boolean' && answer === question.correctAnswer;
    case QuizQuestionType.FILL_IN_BLANK:
      return isFillInBlankCorrect(question.acceptedAnswers, Boolean(question.caseSensitive), answer);
    case QuizQuestionType.ORDERING:
      return (
        isStringArray(answer) &&
        answer.length === question.correctOrder.length &&
        question.correctOrder.every((id, idx) => answer[idx] === id)
      );
    case QuizQuestionType.MATCHING:
      return isMatchingCorrect(question.correctPairs, answer);
    default:
      return false;
  }
}
