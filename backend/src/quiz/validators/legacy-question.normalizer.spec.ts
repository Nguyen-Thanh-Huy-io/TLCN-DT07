import { QuizQuestionType } from '../types/quiz-question.types';
import { normalizeLegacyQuestion } from './legacy-question.normalizer';
import { validateAndNormalizeQuestions } from './quiz-question.validator';

const normalized = (raw: Record<string, unknown>) => {
  const result = normalizeLegacyQuestion({
    id: 'q1',
    prompt: 'Câu hỏi',
    ...raw,
  });
  if (!result) throw new Error('normalizer trả null');
  return validateAndNormalizeQuestions([result])[0];
};

describe('normalizeLegacyQuestion — chuyển câu hỏi định dạng cũ về chuẩn', () => {
  it('lựa chọn là chuỗi + đáp án bằng chữ → chọn 1 đáp án', () => {
    expect(
      normalized({
        type: 'SINGLE_CHOICE',
        options: ['Trần Khánh Dư', 'Nguyễn Khoái'],
        correctAnswer: 'Nguyễn Khoái',
      }),
    ).toMatchObject({
      type: QuizQuestionType.SINGLE_CHOICE,
      options: [
        { id: 'a', text: 'Trần Khánh Dư', isCorrect: false },
        { id: 'b', text: 'Nguyễn Khoái', isCorrect: true },
      ],
    });
  });

  it('"nhiều lựa chọn" nhưng chỉ 1 đáp án `correctAnswer` (theo id) → chọn 1 đáp án', () => {
    const q = normalized({
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a', text: '1009' },
        { id: 'b', text: '1225' },
      ],
      correctAnswer: 'b',
    });
    expect(q.type).toBe(QuizQuestionType.SINGLE_CHOICE);
  });

  it('nhiều đáp án `correctAnswers` bằng chữ → giữ nhiều lựa chọn', () => {
    const q = normalized({
      type: 'MULTIPLE_CHOICE',
      options: ['A', 'B', 'C'],
      correctAnswers: ['A', 'C'],
    });
    expect(q).toMatchObject({
      type: QuizQuestionType.MULTIPLE_CHOICE,
      options: [{ isCorrect: true }, { isCorrect: false }, { isCorrect: true }],
    });
  });

  it('lựa chọn đã có `isCorrect` thì giữ nguyên', () => {
    const raw = {
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'x', text: 'A', isCorrect: true, explanation: 'vì…' },
        { id: 'y', text: 'B', isCorrect: true },
      ],
    };
    expect(normalized(raw)).toMatchObject({
      type: QuizQuestionType.MULTIPLE_CHOICE,
      options: raw.options,
    });
  });

  it('đúng / sai bằng chữ "Đúng" / "Sai" → boolean', () => {
    expect(
      normalized({
        type: 'TRUE_FALSE',
        options: ['Đúng', 'Sai'],
        correctAnswer: 'Sai',
      }),
    ).toMatchObject({ correctAnswer: false });
    expect(
      normalized({ type: 'TRUE_FALSE', correctAnswer: true }),
    ).toMatchObject({ correctAnswer: true });
  });

  it('sắp xếp: phần tử là chuỗi, thứ tự theo chỉ số', () => {
    expect(
      normalized({
        type: 'ORDERING',
        items: ['Sau', 'Trước'],
        correctOrder: [1, 0],
      }),
    ).toMatchObject({
      items: [
        { id: 'i1', label: 'Sau' },
        { id: 'i2', label: 'Trước' },
      ],
      correctOrder: ['i2', 'i1'],
    });
  });

  it('TIMELINE (thứ tự ghi bằng chữ) → sắp xếp', () => {
    expect(
      normalized({
        type: 'TIMELINE',
        items: ['Sau', 'Trước'],
        correctOrder: ['Trước', 'Sau'],
      }),
    ).toMatchObject({
      type: QuizQuestionType.ORDERING,
      correctOrder: ['i2', 'i1'],
    });
  });

  it('sắp xếp: phần tử `{ id, text }`, thứ tự theo id', () => {
    expect(
      normalized({
        type: 'ORDERING',
        items: [
          { id: 'a', text: 'Lần 1' },
          { id: 'b', text: 'Lần 2' },
        ],
        correctOrder: ['a', 'b'],
      }),
    ).toMatchObject({
      items: [
        { id: 'a', label: 'Lần 1' },
        { id: 'b', label: 'Lần 2' },
      ],
      correctOrder: ['a', 'b'],
    });
  });

  it('nối cặp: chuỗi + cặp theo chỉ số', () => {
    expect(
      normalized({
        type: 'MATCHING',
        leftItems: ['Trần Hưng Đạo', 'Ô Mã Nhi'],
        rightItems: ['Tổng chỉ huy', 'Bị bắt sống'],
        correctPairs: [
          { left: 0, right: 0 },
          { left: 1, right: 1 },
        ],
      }),
    ).toMatchObject({
      leftItems: [{ id: 'l1' }, { id: 'l2' }],
      correctPairs: [
        { leftId: 'l1', rightId: 'r1' },
        { leftId: 'l2', rightId: 'r2' },
      ],
    });
  });

  it('nối cặp dạng `pairs: [{ left, right }]`', () => {
    expect(
      normalized({
        type: 'MATCHING',
        pairs: [
          { left: 'Ngô Quyền', right: 'Chủ soái' },
          { left: 'Kiều Công Tiễn', right: 'Phản nghịch' },
        ],
      }),
    ).toMatchObject({
      leftItems: [
        { id: 'l1', label: 'Ngô Quyền' },
        { id: 'l2', label: 'Kiều Công Tiễn' },
      ],
      rightItems: [
        { id: 'r1', label: 'Chủ soái' },
        { id: 'r2', label: 'Phản nghịch' },
      ],
      correctPairs: [
        { leftId: 'l1', rightId: 'r1' },
        { leftId: 'l2', rightId: 'r2' },
      ],
    });
  });

  it('điền khuyết chỉ có `correctAnswer` → `acceptedAnswers`', () => {
    expect(
      normalized({ type: 'FILL_IN_BLANK', correctAnswer: 'Bạch Đằng' }),
    ).toMatchObject({ acceptedAnswers: ['Bạch Đằng'] });
  });

  it('SOURCE_ANALYSIS / RECOGNITION → chọn 1 đáp án, bỏ trường thừa', () => {
    const q = normalized({
      type: 'RECOGNITION',
      options: ['La Mã', 'Ai Cập'],
      correctAnswer: 'La Mã',
      imageUrl: 'anh-mai-vom.jpg',
    });
    expect(q.type).toBe(QuizQuestionType.SINGLE_CHOICE);
    expect(q).not.toHaveProperty('imageUrl');
  });

  it('MAP không chấm tự động được → null', () => {
    expect(
      normalizeLegacyQuestion({
        id: 'm',
        type: 'MAP',
        prompt: 'Chỉ trên bản đồ',
      }),
    ).toBeNull();
  });

  it('câu đã đúng định dạng đi qua không đổi', () => {
    const canonical = {
      id: 'q1',
      type: QuizQuestionType.ORDERING,
      prompt: 'Sắp xếp',
      explanation: 'Giải thích',
      items: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      correctOrder: ['b', 'a'],
    };
    expect(normalizeLegacyQuestion(canonical)).toEqual(canonical);
  });
});
