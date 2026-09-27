import { QuestionType } from '@prisma/client';
import { MultipleChoiceEvaluator } from './multiple-choice.evaluator';
import { MultipleSelectEvaluator } from './multiple-select.evaluator';
import { TrueFalseEvaluator } from './true-false.evaluator';
import { QuestionEvaluatorFactory } from './question-evaluator.factory';

describe('QuestionEvaluators & Factory', () => {
  let mcEvaluator: MultipleChoiceEvaluator;
  let msEvaluator: MultipleSelectEvaluator;
  let tfEvaluator: TrueFalseEvaluator;
  let factory: QuestionEvaluatorFactory;

  beforeEach(() => {
    mcEvaluator = new MultipleChoiceEvaluator();
    msEvaluator = new MultipleSelectEvaluator();
    tfEvaluator = new TrueFalseEvaluator();
    factory = new QuestionEvaluatorFactory(
      mcEvaluator,
      msEvaluator,
      tfEvaluator,
    );
  });

  describe('MultipleChoiceEvaluator', () => {
    it('nên chấm đúng khi người dùng chọn đúng 1 đáp án chuẩn', () => {
      const result = mcEvaluator.evaluate({
        questionId: 'q-1',
        userSelectedOptionIds: ['opt-1'],
        correctOptionIds: ['opt-1'],
        points: 2,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(2);
    });

    it('nên chấm sai khi người dùng chọn sai đáp án hoặc chọn nhiều hơn 1 đáp án', () => {
      const resultWrong = mcEvaluator.evaluate({
        questionId: 'q-1',
        userSelectedOptionIds: ['opt-2'],
        correctOptionIds: ['opt-1'],
        points: 2,
      });
      expect(resultWrong.isCorrect).toBe(false);
      expect(resultWrong.earnedPoints).toBe(0);

      const resultMultiple = mcEvaluator.evaluate({
        questionId: 'q-1',
        userSelectedOptionIds: ['opt-1', 'opt-2'],
        correctOptionIds: ['opt-1'],
        points: 2,
      });
      expect(resultMultiple.isCorrect).toBe(false);
      expect(resultMultiple.earnedPoints).toBe(0);
    });
  });

  describe('MultipleSelectEvaluator', () => {
    it('nên chấm đúng khi người dùng chọn đủ tất cả các đáp án đúng và không chọn đáp án sai', () => {
      const result = msEvaluator.evaluate({
        questionId: 'q-2',
        userSelectedOptionIds: ['opt-1', 'opt-2'],
        correctOptionIds: ['opt-1', 'opt-2'],
        points: 5,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(5);
    });

    it('nên chấm sai khi chọn thiếu hoặc chọn thêm đáp án sai', () => {
      // Chọn thiếu
      const resultMissing = msEvaluator.evaluate({
        questionId: 'q-2',
        userSelectedOptionIds: ['opt-1'],
        correctOptionIds: ['opt-1', 'opt-2'],
        points: 5,
      });
      expect(resultMissing.isCorrect).toBe(false);
      expect(resultMissing.earnedPoints).toBe(0);

      // Chọn thừa
      const resultExtra = msEvaluator.evaluate({
        questionId: 'q-2',
        userSelectedOptionIds: ['opt-1', 'opt-2', 'opt-3'],
        correctOptionIds: ['opt-1', 'opt-2'],
        points: 5,
      });
      expect(resultExtra.isCorrect).toBe(false);
      expect(resultExtra.earnedPoints).toBe(0);
    });
  });

  describe('TrueFalseEvaluator', () => {
    it('nên chấm đúng khi chọn đúng đáp án boolean', () => {
      const result = tfEvaluator.evaluate({
        questionId: 'q-3',
        userSelectedOptionIds: ['opt-true'],
        correctOptionIds: ['opt-true'],
        points: 1,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(1);
    });
  });

  describe('QuestionEvaluatorFactory', () => {
    it('nên trả về đúng evaluator tương ứng với từng QuestionType', () => {
      expect(factory.getEvaluator(QuestionType.MULTIPLE_CHOICE)).toBeInstanceOf(
        MultipleChoiceEvaluator,
      );
      expect(factory.getEvaluator(QuestionType.MULTIPLE_SELECT)).toBeInstanceOf(
        MultipleSelectEvaluator,
      );
      expect(factory.getEvaluator(QuestionType.TRUE_FALSE)).toBeInstanceOf(
        TrueFalseEvaluator,
      );
    });
  });
});
