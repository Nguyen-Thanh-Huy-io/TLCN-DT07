import { gradeQuizAttempt, isAnswerCorrect } from './quiz-grading';
import { QuizQuestion, QuizQuestionType } from './types/quiz-question.types';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'single',
    type: QuizQuestionType.SINGLE_CHOICE,
    prompt: '?',
    options: [
      { id: 'a', text: 'A', isCorrect: true },
      { id: 'b', text: 'B', isCorrect: false },
    ],
  },
  {
    id: 'multi',
    type: QuizQuestionType.MULTIPLE_CHOICE,
    prompt: '?',
    options: [
      { id: 'a', text: 'A', isCorrect: true },
      { id: 'b', text: 'B', isCorrect: true },
      { id: 'c', text: 'C', isCorrect: false },
    ],
  },
  {
    id: 'tf',
    type: QuizQuestionType.TRUE_FALSE,
    prompt: '?',
    correctAnswer: false,
  },
  {
    id: 'fill',
    type: QuizQuestionType.FILL_IN_BLANK,
    prompt: '?',
    acceptedAnswers: ['Cổ Loa'],
  },
  {
    id: 'order',
    type: QuizQuestionType.ORDERING,
    prompt: '?',
    items: [
      { id: 'e1', label: '905' },
      { id: 'e2', label: '938' },
    ],
    correctOrder: ['e1', 'e2'],
  },
  {
    id: 'match',
    type: QuizQuestionType.MATCHING,
    prompt: '?',
    leftItems: [{ id: 'l1', label: 'Ngô Quyền' }],
    rightItems: [{ id: 'r1', label: 'Chủ tướng' }],
    correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
  },
];

const byId = (id: string) => QUESTIONS.find((q) => q.id === id)!;

describe('quiz-grading', () => {
  it('trả lời đúng hết → 100%', () => {
    const result = gradeQuizAttempt(QUESTIONS, {
      single: 'a',
      multi: ['b', 'a'],
      tf: false,
      fill: '  cổ loa ',
      order: ['e1', 'e2'],
      match: { l1: 'r1' },
    });

    expect(result).toMatchObject({
      correctCount: 6,
      totalQuestions: 6,
      scorePercent: 100,
    });
  });

  it('không trả lời câu nào → 0%, mọi câu sai', () => {
    const result = gradeQuizAttempt(QUESTIONS, {});

    expect(result.scorePercent).toBe(0);
    expect(Object.values(result.results).every((ok) => !ok)).toBe(true);
  });

  it('chọn thiếu hoặc thừa đáp án ở câu nhiều lựa chọn → sai', () => {
    expect(isAnswerCorrect(byId('multi'), ['a'])).toBe(false);
    expect(isAnswerCorrect(byId('multi'), ['a', 'b', 'c'])).toBe(false);
  });

  it('đúng/sai so đúng kiểu boolean, không nhận chuỗi', () => {
    expect(isAnswerCorrect(byId('tf'), 'false')).toBe(false);
    expect(isAnswerCorrect(byId('tf'), false)).toBe(true);
  });

  it('sắp xếp sai thứ tự hoặc ghép sai cặp → sai', () => {
    expect(isAnswerCorrect(byId('order'), ['e2', 'e1'])).toBe(false);
    expect(isAnswerCorrect(byId('match'), { l1: 'r9' })).toBe(false);
  });

  it('dữ liệu trả lời sai kiểu không làm lỗi, chỉ tính là sai', () => {
    expect(isAnswerCorrect(byId('order'), 'e1,e2')).toBe(false);
    expect(isAnswerCorrect(byId('match'), ['r1'])).toBe(false);
    expect(isAnswerCorrect(byId('fill'), 123)).toBe(false);
  });
});
