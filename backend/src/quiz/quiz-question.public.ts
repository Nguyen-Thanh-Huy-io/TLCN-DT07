import type { QuizQuestionWithPoints } from './quiz-question.mapper';
import {
  FillInBlankQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  QuizQuestionType,
  SingleChoiceQuestion,
  TrueFalseQuestion,
} from './types/quiz-question.types';

type WithoutKey<Q, K extends keyof Q> = Omit<Q, K | 'explanation'> & {
  points: number;
};
type ChoiceOptionView = { id: string; text: string };

/** Câu hỏi gửi cho người học trước khi nộp bài: không có đáp án đúng, không có lời giải. */
export type PublicQuizQuestion =
  | (WithoutKey<SingleChoiceQuestion, 'options'> & {
      options: ChoiceOptionView[];
    })
  | (WithoutKey<MultipleChoiceQuestion, 'options'> & {
      options: ChoiceOptionView[];
    })
  | WithoutKey<TrueFalseQuestion, 'correctAnswer'>
  | WithoutKey<OrderingQuestion, 'correctOrder'>
  | WithoutKey<MatchingQuestion, 'correctPairs'>
  | WithoutKey<FillInBlankQuestion, 'acceptedAnswers' | 'caseSensitive'>;

const sameOrder = (ids: string[], expected: string[]) =>
  ids.length === expected.length && ids.every((id, i) => id === expected[i]);

/**
 * Trộn ngẫu nhiên; nếu trùng đúng thứ tự `revealing` (thứ tự này chính là đáp án) thì xoay 1 nấc,
 * để thứ tự gửi xuống không bao giờ lộ đáp án.
 */
export function shuffleAwayFrom<T extends { id: string }>(
  items: T[],
  revealing: string[],
): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const revealsAnswer =
    shuffled.length > 1 &&
    sameOrder(
      shuffled.map((item) => item.id),
      revealing,
    );
  return revealsAnswer ? [...shuffled.slice(1), shuffled[0]] : shuffled;
}

/** Bỏ mọi trường đáp án / lời giải khỏi câu hỏi; server vẫn chấm theo bản đầy đủ trong DB. */
export function toPublicQuestion(
  question: QuizQuestionWithPoints,
): PublicQuizQuestion {
  const { id, prompt, points } = question;
  switch (question.type) {
    case QuizQuestionType.SINGLE_CHOICE:
    case QuizQuestionType.MULTIPLE_CHOICE:
      return {
        id,
        prompt,
        points,
        type: question.type,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      };
    case QuizQuestionType.TRUE_FALSE:
    case QuizQuestionType.FILL_IN_BLANK:
      return { id, prompt, points, type: question.type };
    case QuizQuestionType.ORDERING:
      return {
        id,
        prompt,
        points,
        type: question.type,
        items: shuffleAwayFrom(question.items, question.correctOrder),
      };
    case QuizQuestionType.MATCHING: {
      const pairedRightIds = question.leftItems.map(
        (left) =>
          question.correctPairs.find((pair) => pair.leftId === left.id)
            ?.rightId ?? '',
      );
      return {
        id,
        prompt,
        points,
        type: question.type,
        leftItems: question.leftItems,
        rightItems: shuffleAwayFrom(question.rightItems, pairedRightIds),
      };
    }
  }
}
