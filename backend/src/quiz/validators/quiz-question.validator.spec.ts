import { BadRequestException } from '@nestjs/common';
import { QuizQuestionType } from '../types/quiz-question.types';
import { validateAndNormalizeQuestions } from './quiz-question.validator';

describe('QuizQuestionValidator (Automated Unit Tests)', () => {
  it('ném lỗi nếu input không phải là một mảng', () => {
    expect(() => validateAndNormalizeQuestions('not-array')).toThrow(
      BadRequestException,
    );
    expect(() => validateAndNormalizeQuestions(null)).toThrow(
      BadRequestException,
    );
  });

  describe('1. Trắc nghiệm 1 đáp án (SINGLE_CHOICE)', () => {
    it('chuẩn hóa thành công câu hỏi trắc nghiệm 1 đáp án hợp lệ', () => {
      const raw = [
        {
          id: 'q_sc_1',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Chiến thắng Điện Biên Phủ trên không diễn ra vào năm nào?',
          explanation: 'Diễn ra vào tháng 12 năm 1972.',
          options: [
            { id: 'opt_1', text: 'Năm 1972', isCorrect: true },
            { id: 'opt_2', text: 'Năm 1975', isCorrect: false },
          ],
        },
      ];
      const result = validateAndNormalizeQuestions(raw);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuizQuestionType.SINGLE_CHOICE);
      expect(result[0].prompt).toBe(
        'Chiến thắng Điện Biên Phủ trên không diễn ra vào năm nào?',
      );
    });

    it('chuẩn hóa thành công câu hỏi trắc nghiệm 1 đáp án hợp lệ kèm giải thích riêng cho từng phương án', () => {
      const raw = [
        {
          id: 'q_sc_opt_exp',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Chiến thắng Điện Biên Phủ trên không diễn ra vào năm nào?',
          explanation: 'Diễn ra vào tháng 12 năm 1972.',
          options: [
            {
              id: 'opt_1',
              text: 'Năm 1972',
              isCorrect: true,
              explanation: 'Chính xác! Tháng 12/1972 tại Hà Nội và Hải Phòng.',
            },
            {
              id: 'opt_2',
              text: 'Năm 1975',
              isCorrect: false,
              explanation:
                'Sai. Năm 1975 là Chiến dịch Hồ Chí Minh giải phóng miền Nam.',
            },
          ],
        },
      ];
      const result = validateAndNormalizeQuestions(raw);
      expect(result).toHaveLength(1);
      const scQuestion = result[0] as any;
      expect(scQuestion.options[0].explanation).toBe(
        'Chính xác! Tháng 12/1972 tại Hà Nội và Hải Phòng.',
      );
      expect(scQuestion.options[1].explanation).toBe(
        'Sai. Năm 1975 là Chiến dịch Hồ Chí Minh giải phóng miền Nam.',
      );
    });

    it('ném lỗi nếu SINGLE_CHOICE có nhiều hơn 1 đáp án đúng', () => {
      const raw = [
        {
          id: 'q_sc_err',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Chọn đáp án đúng',
          options: [
            { id: 'opt_1', text: 'Đáp án 1', isCorrect: true },
            { id: 'opt_2', text: 'Đáp án 2', isCorrect: true },
          ],
        },
      ];
      expect(() => validateAndNormalizeQuestions(raw)).toThrow(
        /chính xác 1 lựa chọn đúng/,
      );
    });

    it('ném lỗi nếu SINGLE_CHOICE không có đáp án đúng nào', () => {
      const raw = [
        {
          id: 'q_sc_err2',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Chọn đáp án đúng',
          options: [
            { id: 'opt_1', text: 'Đáp án 1', isCorrect: false },
            { id: 'opt_2', text: 'Đáp án 2', isCorrect: false },
          ],
        },
      ];
      expect(() => validateAndNormalizeQuestions(raw)).toThrow(
        /chính xác 1 lựa chọn đúng/,
      );
    });
  });

  describe('2. Đúng / Sai (TRUE_FALSE)', () => {
    it('chuẩn hóa thành công câu hỏi Đúng / Sai', () => {
      const raw = [
        {
          id: 'q_tf_1',
          type: QuizQuestionType.TRUE_FALSE,
          prompt: 'B-52 là loại máy bay ném bom chiến lược của quân đội Mỹ.',
          correctAnswer: true,
        },
      ];
      const result = validateAndNormalizeQuestions(raw);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuizQuestionType.TRUE_FALSE);
      expect((result[0] as any).correctAnswer).toBe(true);
    });

    it('ném lỗi nếu correctAnswer không phải boolean', () => {
      const raw = [
        {
          id: 'q_tf_err',
          type: QuizQuestionType.TRUE_FALSE,
          prompt: 'Mệnh đề sai',
          correctAnswer: 'yes',
        },
      ];
      expect(() => validateAndNormalizeQuestions(raw)).toThrow(
        /cần `correctAnswer` là boolean/,
      );
    });
  });

  describe('3. Nhiều đáp án (MULTIPLE_CHOICE)', () => {
    it('chuẩn hóa thành công câu hỏi có từ 2 đáp án đúng trở lên kèm giải thích từng phương án', () => {
      const raw = [
        {
          id: 'q_mc_1',
          type: QuizQuestionType.MULTIPLE_CHOICE,
          prompt: 'Những phi công nào sau đây đã bắn rơi B-52?',
          explanation:
            'Cả Phạm Tuân và Vũ Xuân Thiều đều lập công bắn rơi B-52 trong tháng 12/1972.',
          options: [
            {
              id: 'o1',
              text: 'Phạm Tuân',
              isCorrect: true,
              explanation: 'Đúng: Bắn rơi B-52 đêm 27/12/1972.',
            },
            {
              id: 'o2',
              text: 'Vũ Xuân Thiều',
              isCorrect: true,
              explanation:
                'Đúng: Anh dũng cảm tử tiêu diệt B-52 đêm 28/12/1972.',
            },
            {
              id: 'o3',
              text: 'Phương án gây nhiễu',
              isCorrect: false,
              explanation: 'Sai: Đây là phương án gây nhiễu.',
            },
          ],
        },
      ];
      const result = validateAndNormalizeQuestions(raw);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuizQuestionType.MULTIPLE_CHOICE);
      const mcQuestion = result[0] as any;
      expect(mcQuestion.options.filter((o: any) => o.isCorrect)).toHaveLength(
        2,
      );
      expect(mcQuestion.options[0].explanation).toBe(
        'Đúng: Bắn rơi B-52 đêm 27/12/1972.',
      );
      expect(mcQuestion.options[1].explanation).toBe(
        'Đúng: Anh dũng cảm tử tiêu diệt B-52 đêm 28/12/1972.',
      );
    });

    it('ném lỗi nếu không có lựa chọn nào đúng', () => {
      const raw = [
        {
          id: 'q_mc_err',
          type: QuizQuestionType.MULTIPLE_CHOICE,
          prompt: 'Câu hỏi lỗi',
          options: [
            { id: 'o1', text: 'A', isCorrect: false },
            { id: 'o2', text: 'B', isCorrect: false },
          ],
        },
      ];
      expect(() => validateAndNormalizeQuestions(raw)).toThrow(
        /ít nhất 1 lựa chọn đúng/,
      );
    });
  });

  describe('4. Sắp xếp dòng thời gian (ORDERING)', () => {
    it('chuẩn hóa thành công câu hỏi sắp xếp các mốc lịch sử', () => {
      const raw = [
        {
          id: 'q_ord_1',
          type: QuizQuestionType.ORDERING,
          prompt: 'Sắp xếp trình tự thời gian:',
          items: [
            { id: 'it_1', label: 'Khởi nghĩa Hai Bà Trưng' },
            { id: 'it_2', label: 'Khởi nghĩa Bà Triệu' },
            { id: 'it_3', label: 'Chiến thắng Bạch Đằng của Ngô Quyền' },
          ],
          correctOrder: ['it_1', 'it_2', 'it_3'],
        },
      ];
      const result = validateAndNormalizeQuestions(raw);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuizQuestionType.ORDERING);
      expect((result[0] as any).correctOrder).toEqual(['it_1', 'it_2', 'it_3']);
    });

    it('ném lỗi nếu correctOrder không khớp số lượng hoặc id với items', () => {
      const raw = [
        {
          id: 'q_ord_err',
          type: QuizQuestionType.ORDERING,
          prompt: 'Sắp xếp sai',
          items: [
            { id: 'it_1', label: 'Mốc 1' },
            { id: 'it_2', label: 'Mốc 2' },
          ],
          correctOrder: ['it_1', 'it_999'],
        },
      ];
      expect(() => validateAndNormalizeQuestions(raw)).toThrow(
        /chứa id không khớp với `items`/,
      );
    });
  });

  describe('5. Ghép nối (MATCHING)', () => {
    it('chuẩn hóa thành công câu hỏi ghép nối cặp', () => {
      const raw = [
        {
          id: 'q_mat_1',
          type: QuizQuestionType.MATCHING,
          prompt: 'Nối nhân vật với sự kiện:',
          leftItems: [
            { id: 'l1', label: 'Phạm Tuân' },
            { id: 'l2', label: 'Vũ Xuân Thiều' },
          ],
          rightItems: [
            { id: 'r1', label: 'Hạ B-52 đêm 27/12' },
            { id: 'r2', label: 'Hạ B-52 đêm 28/12' },
          ],
          correctPairs: [
            { leftId: 'l1', rightId: 'r1' },
            { leftId: 'l2', rightId: 'r2' },
          ],
        },
      ];
      const result = validateAndNormalizeQuestions(raw);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(QuizQuestionType.MATCHING);
      expect((result[0] as any).correctPairs).toHaveLength(2);
    });

    it('ném lỗi nếu ghép nối cặp chứa id không tồn tại trong left/right items', () => {
      const raw = [
        {
          id: 'q_mat_err',
          type: QuizQuestionType.MATCHING,
          prompt: 'Nối sai',
          leftItems: [{ id: 'l1', label: 'A' }],
          rightItems: [{ id: 'r1', label: 'B' }],
          correctPairs: [{ leftId: 'l1', rightId: 'r_unknown' }],
        },
      ];
      expect(() => validateAndNormalizeQuestions(raw)).toThrow(
        /có leftId\/rightId không khớp/,
      );
    });
  });
});
