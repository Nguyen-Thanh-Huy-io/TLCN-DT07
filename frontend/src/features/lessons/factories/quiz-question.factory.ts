import { QuizQuestion, QuizQuestionType } from '../types/quiz.types';

let idCounter = 0;
export const generateQuizId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

/** Tạo dữ liệu mặc định cho 1 câu hỏi mới theo từng dạng, để tác giả có sẵn khung mà sửa. */
export function createDefaultQuestion(type: QuizQuestionType): QuizQuestion {
  const id = generateQuizId('q');

  switch (type) {
    case QuizQuestionType.MULTIPLE_CHOICE:
      return {
        id,
        type,
        prompt: '',
        options: [
          { id: generateQuizId('opt'), text: '', isCorrect: true },
          { id: generateQuizId('opt'), text: '', isCorrect: false },
        ],
      };

    case QuizQuestionType.TRUE_FALSE:
      return { id, type, prompt: '', correctAnswer: true };

    case QuizQuestionType.ORDERING: {
      const items = [
        { id: generateQuizId('item'), label: '' },
        { id: generateQuizId('item'), label: '' },
      ];
      return { id, type, prompt: '', items, correctOrder: items.map((i) => i.id) };
    }

    case QuizQuestionType.MATCHING: {
      const l1 = generateQuizId('l');
      const r1 = generateQuizId('r');
      return {
        id,
        type,
        prompt: '',
        leftItems: [{ id: l1, label: '' }],
        rightItems: [{ id: r1, label: '' }],
        correctPairs: [{ leftId: l1, rightId: r1 }],
      };
    }

    case QuizQuestionType.FILL_IN_BLANK:
      return { id, type, prompt: '', acceptedAnswers: [''], caseSensitive: false };

    default:
      throw new Error(`Dạng câu hỏi không được hỗ trợ: ${type}`);
  }
}
