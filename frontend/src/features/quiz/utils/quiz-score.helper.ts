import { QuizQuestionType } from '@/features/lessons/types/quiz.types';

export const ANSWER_LABEL_TRUE = 'Đúng';
export const ANSWER_LABEL_FALSE = 'Sai';

export interface QuizOptionObject {
  id?: string;
  text?: string;
  isCorrect?: boolean;
}

export type QuizOptionItem = string | QuizOptionObject;

export interface RawQuizQuestion {
  id: string;
  type: string;
  prompt: string;
  options?: QuizOptionItem[];
  correctAnswer?: string | boolean;
  acceptedAnswers?: string[];
  explanation?: string;
}

export function getOptionLabel(opt: QuizOptionItem): string {
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt !== null) {
    return opt.text || opt.id || '';
  }
  return '';
}

export function isOptionCorrectAnswer(opt: QuizOptionItem, q: RawQuizQuestion): boolean {
  if (typeof opt === 'object' && opt !== null && opt.isCorrect !== undefined) {
    return Boolean(opt.isCorrect);
  }
  const label = getOptionLabel(opt);
  if (typeof q.correctAnswer === 'string') {
    return label.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
  }
  return false;
}

function checkChoiceQuestion(q: RawQuizQuestion, userAns: string): boolean {
  const matchedOpt = (q.options || []).find((opt) => getOptionLabel(opt) === userAns);
  return Boolean(matchedOpt && isOptionCorrectAnswer(matchedOpt, q));
}

function checkTrueFalseQuestion(q: RawQuizQuestion, userAns: string): boolean {
  const boolUser = userAns === ANSWER_LABEL_TRUE;
  if (typeof q.correctAnswer === 'boolean') {
    return boolUser === q.correctAnswer;
  }
  if (typeof q.correctAnswer === 'string') {
    return userAns.toLowerCase() === q.correctAnswer.toLowerCase();
  }
  return false;
}

function checkFillInBlankQuestion(q: RawQuizQuestion, userAns: string): boolean {
  return (q.acceptedAnswers || []).some(
    (ans) => ans.trim().toLowerCase() === userAns.trim().toLowerCase(),
  );
}

function isQuestionAnsweredCorrectly(q: RawQuizQuestion, userAns: string): boolean {
  if (q.type === QuizQuestionType.MULTIPLE_CHOICE || q.type === QuizQuestionType.SINGLE_CHOICE) {
    return checkChoiceQuestion(q, userAns);
  }
  if (q.type === QuizQuestionType.TRUE_FALSE) {
    return checkTrueFalseQuestion(q, userAns);
  }
  if (q.type === QuizQuestionType.FILL_IN_BLANK) {
    return checkFillInBlankQuestion(q, userAns);
  }
  return true;
}

export function calculateExamScore(
  questions: RawQuizQuestion[],
  selectedAnswers: Record<number, string>,
): number {
  return questions.reduce((correct, q, idx) => {
    const userAns = selectedAnswers[idx];
    if (!userAns) return correct;
    return isQuestionAnsweredCorrectly(q, userAns) ? correct + 1 : correct;
  }, 0);
}
