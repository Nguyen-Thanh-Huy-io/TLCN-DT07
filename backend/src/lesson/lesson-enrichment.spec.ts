import {
  DIEN_BIEN_PHU_LESSON_SLUG,
  DIEN_BIEN_PHU_BLOCKS_DATA,
  DIEN_BIEN_PHU_QUIZ_DATA,
} from '../../prisma/seed-lesson-dien-bien-phu';
import { validateAndNormalizeQuestions } from '../quiz/validators/quiz-question.validator';
import { QuizQuestionType } from '../quiz/types/quiz-question.types';

describe('Lesson Enrichment & Quick Quiz Validation (Trận Điện Biên Phủ trên không 1972)', () => {
  describe('Lesson Blocks Content Structure (Composite & Block Builder Pattern)', () => {
    it('phải có slug chuẩn xác cho bài học Điện Biên Phủ trên không', () => {
      expect(DIEN_BIEN_PHU_LESSON_SLUG).toBe(
        'tran-dien-bien-phu-tren-khong-12-ngay-dem-cuoi-nam-1972',
      );
    });

    it('phải chứa đầy đủ các loại khối nội dung quan trọng (TEXT, TIMELINE, ROW, EVENT, IMAGE, VIDEO, MAP, TABLE, QUIZ, RESOURCE)', () => {
      const blockTypes = new Set(DIEN_BIEN_PHU_BLOCKS_DATA.map((b) => b.type));
      expect(blockTypes.has('TEXT')).toBe(true);
      expect(blockTypes.has('TIMELINE')).toBe(true);
      expect(blockTypes.has('SECTION_ROW')).toBe(true);
      expect(blockTypes.has('EVENT')).toBe(true);
      expect(blockTypes.has('IMAGE')).toBe(true);
      expect(blockTypes.has('VIDEO')).toBe(true);
      expect(blockTypes.has('MAP')).toBe(true);
      expect(blockTypes.has('COMPARISON_TABLE')).toBe(true);
      expect(blockTypes.has('QUIZ')).toBe(true);
      expect(blockTypes.has('RESOURCE_LINK')).toBe(true);
      expect(DIEN_BIEN_PHU_BLOCKS_DATA.length).toBeGreaterThanOrEqual(10);
    });

    it('khối TIMELINE phải có ít nhất 5 mốc lịch sử then chốt với mô tả rõ ràng', () => {
      const timelineBlock: any = DIEN_BIEN_PHU_BLOCKS_DATA.find(
        (b) => b.type === 'TIMELINE',
      );
      expect(timelineBlock).toBeDefined();
      expect(timelineBlock.nodes.length).toBeGreaterThanOrEqual(5);

      const firstNode = timelineBlock.nodes[0];
      expect(firstNode.year).toContain('18/12/1972');
      expect(firstNode.mediaList?.length).toBeGreaterThan(0);
      expect(firstNode.detailContent).toBeDefined();
    });

    it('khối SECTION_ROW phải chứa nhân vật Phạm Tuân và Vũ Xuân Thiều kèm ảnh chân dung và tiểu sử', () => {
      const rowBlock: any = DIEN_BIEN_PHU_BLOCKS_DATA.find(
        (b) => b.type === 'SECTION_ROW',
      );
      expect(rowBlock).toBeDefined();
      expect(rowBlock.columnCount).toBe(2);

      const char1 = rowBlock.columns[0].blocks[0];
      const char2 = rowBlock.columns[1].blocks[0];

      expect(char1.name).toContain('Phạm Tuân');
      expect(char1.avatarUrl).toMatch(/^https:\/\/.+/);
      expect(char1.detailContent).toBeDefined();

      expect(char2.name).toContain('Vũ Xuân Thiều');
      expect(char2.avatarUrl).toMatch(/^https:\/\/.+/);
      expect(char2.detailContent).toBeDefined();
    });

    it('khối VIDEO phải chứa URL embed tư liệu YouTube hợp lệ, không được để trống', () => {
      const videoBlock: any = DIEN_BIEN_PHU_BLOCKS_DATA.find(
        (b) => b.type === 'VIDEO',
      );
      expect(videoBlock).toBeDefined();
      expect(videoBlock.src).toMatch(/^https:\/\/www\.youtube\.com\/embed\/.+/);
      expect(videoBlock.caption).toBeDefined();
    });

    it('khối IMAGE phải có ảnh xác máy bay B-52 hồ Hữu Tiệp và chú thích tư liệu', () => {
      const imageBlock: any = DIEN_BIEN_PHU_BLOCKS_DATA.find(
        (b) => b.type === 'IMAGE',
      );
      expect(imageBlock).toBeDefined();
      expect(imageBlock.src).toMatch(/^https:\/\/.+/);
      expect(imageBlock.caption).toContain('Hữu Tiệp');
    });

    it('khối QUIZ inline trong bài phải có câu hỏi, các lựa chọn và đáp án đúng rõ ràng', () => {
      const inlineQuiz: any = DIEN_BIEN_PHU_BLOCKS_DATA.find(
        (b) => b.type === 'QUIZ',
      );
      expect(inlineQuiz).toBeDefined();
      expect(inlineQuiz.question).toContain('Chiến thắng 12 ngày đêm');
      expect(inlineQuiz.options.length).toBeGreaterThanOrEqual(4);
      expect(inlineQuiz.options.some((o: any) => o.isCorrect)).toBe(true);
      expect(inlineQuiz.explanation).toBeDefined();
    });
  });

  describe('End-of-Lesson Quiz Validation (Strategy & Polymorphic Quiz Types)', () => {
    it('phải vượt qua bộ validator chuẩn validateAndNormalizeQuestions của hệ thống Quiz', () => {
      const normalized = validateAndNormalizeQuestions(
        DIEN_BIEN_PHU_QUIZ_DATA.questions,
      );
      expect(normalized).toBeDefined();
      expect(normalized.length).toBe(5);
    });

    it('phải có đầy đủ 5 dạng câu hỏi đa dạng (MULTIPLE_CHOICE, TRUE_FALSE, ORDERING, MATCHING, FILL_IN_BLANK)', () => {
      const questionTypes = DIEN_BIEN_PHU_QUIZ_DATA.questions.map((q) => q.type);
      expect(questionTypes).toContain(QuizQuestionType.MULTIPLE_CHOICE);
      expect(questionTypes).toContain(QuizQuestionType.TRUE_FALSE);
      expect(questionTypes).toContain(QuizQuestionType.ORDERING);
      expect(questionTypes).toContain(QuizQuestionType.MATCHING);
      expect(questionTypes).toContain(QuizQuestionType.FILL_IN_BLANK);
    });

    it('câu hỏi ORDERING phải có số lượng correctOrder khớp chính xác với items', () => {
      const orderQ = DIEN_BIEN_PHU_QUIZ_DATA.questions.find(
        (q) => q.type === QuizQuestionType.ORDERING,
      ) as any;
      expect(orderQ).toBeDefined();
      expect(orderQ.items.length).toBe(5);
      expect(orderQ.correctOrder.length).toBe(5);
      expect(new Set(orderQ.correctOrder).size).toBe(5);
    });

    it('câu hỏi MATCHING phải có các cặp nối ghép hợp lệ giữa leftItems và rightItems', () => {
      const matchQ = DIEN_BIEN_PHU_QUIZ_DATA.questions.find(
        (q) => q.type === QuizQuestionType.MATCHING,
      ) as any;
      expect(matchQ).toBeDefined();
      expect(matchQ.leftItems.length).toBe(4);
      expect(matchQ.rightItems.length).toBe(4);
      expect(matchQ.correctPairs.length).toBe(4);
    });

    it('câu hỏi FILL_IN_BLANK phải có acceptedAnswers hỗ trợ các biến thể của Hiệp định Paris', () => {
      const fibQ = DIEN_BIEN_PHU_QUIZ_DATA.questions.find(
        (q) => q.type === QuizQuestionType.FILL_IN_BLANK,
      ) as any;
      expect(fibQ).toBeDefined();
      expect(fibQ.acceptedAnswers).toContain('Paris');
      expect(fibQ.acceptedAnswers).toContain('Hiệp định Paris');
    });
  });
});
