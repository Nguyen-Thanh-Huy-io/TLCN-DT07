import type { QuizQuestionWithPoints } from './quiz-question.mapper';
import { shuffleAwayFrom, toPublicQuestion } from './quiz-question.public';
import { QuizQuestionType } from './types/quiz-question.types';

const ANSWER_KEYS = [
  'isCorrect',
  'correctAnswer',
  'correctOrder',
  'correctPairs',
  'acceptedAnswers',
  'caseSensitive',
  'explanation',
];

const base = { prompt: 'Câu hỏi', explanation: 'Lời giải', points: 10 };

const ALL_TYPES: QuizQuestionWithPoints[] = [
  {
    ...base,
    id: 'single',
    type: QuizQuestionType.SINGLE_CHOICE,
    options: [
      { id: 'a', text: 'A', isCorrect: true, explanation: 'Vì A' },
      { id: 'b', text: 'B', isCorrect: false },
    ],
  },
  {
    ...base,
    id: 'multi',
    type: QuizQuestionType.MULTIPLE_CHOICE,
    options: [
      { id: 'a', text: 'A', isCorrect: true },
      { id: 'b', text: 'B', isCorrect: true },
    ],
  },
  { ...base, id: 'tf', type: QuizQuestionType.TRUE_FALSE, correctAnswer: true },
  {
    ...base,
    id: 'order',
    type: QuizQuestionType.ORDERING,
    items: [
      { id: 'i1', label: '938' },
      { id: 'i2', label: '1288' },
      { id: 'i3', label: '1789' },
    ],
    correctOrder: ['i1', 'i2', 'i3'],
  },
  {
    ...base,
    id: 'match',
    type: QuizQuestionType.MATCHING,
    leftItems: [
      { id: 'l1', label: 'Ngô Quyền' },
      { id: 'l2', label: 'Trần Hưng Đạo' },
    ],
    rightItems: [
      { id: 'r1', label: '938' },
      { id: 'r2', label: '1288' },
    ],
    correctPairs: [
      { leftId: 'l1', rightId: 'r1' },
      { leftId: 'l2', rightId: 'r2' },
    ],
  },
  {
    ...base,
    id: 'blank',
    type: QuizQuestionType.FILL_IN_BLANK,
    acceptedAnswers: ['Bạch Đằng'],
    caseSensitive: false,
  },
];

/** Gom mọi khoá (kể cả lồng trong mảng / object con) để chắc không còn sót trường đáp án. */
function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys);
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...allKeys(child),
  ]);
}

describe('toPublicQuestion — câu hỏi gửi người học trước khi nộp bài', () => {
  it.each(ALL_TYPES.map((q) => [q.type, q] as const))(
    '%s không còn trường đáp án / lời giải',
    (_type, question) => {
      const keys = allKeys(toPublicQuestion(question));
      expect(keys.filter((key) => ANSWER_KEYS.includes(key))).toEqual([]);
    },
  );

  it('giữ id, câu dẫn, điểm và nội dung lựa chọn để làm bài', () => {
    expect(toPublicQuestion(ALL_TYPES[0])).toEqual({
      id: 'single',
      type: QuizQuestionType.SINGLE_CHOICE,
      prompt: 'Câu hỏi',
      points: 10,
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
    });
  });

  it('câu sắp xếp không bao giờ gửi đúng thứ tự đáp án', () => {
    for (let run = 0; run < 50; run++) {
      const view = toPublicQuestion(ALL_TYPES[3]);
      if (view.type !== QuizQuestionType.ORDERING) throw new Error('sai dạng');
      expect(view.items.map((i) => i.id)).not.toEqual(['i1', 'i2', 'i3']);
      expect([...view.items.map((i) => i.id)].sort()).toEqual([
        'i1',
        'i2',
        'i3',
      ]);
    }
  });

  it('câu nối không xếp cột phải theo đúng cặp của cột trái', () => {
    for (let run = 0; run < 20; run++) {
      const view = toPublicQuestion(ALL_TYPES[4]);
      if (view.type !== QuizQuestionType.MATCHING) throw new Error('sai dạng');
      expect(view.rightItems.map((i) => i.id)).toEqual(['r2', 'r1']);
    }
  });
});

describe('shuffleAwayFrom', () => {
  it('một phần tử thì giữ nguyên', () => {
    expect(shuffleAwayFrom([{ id: 'x' }], ['x'])).toEqual([{ id: 'x' }]);
  });
});
