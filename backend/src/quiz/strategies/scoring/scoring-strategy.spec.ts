import { StandardScoringStrategy } from './standard-scoring.strategy';
import { WeightedScoringStrategy } from './weighted-scoring.strategy';
import { ScoringStrategyContext, ScoringMode } from './scoring-strategy.context';

describe('Scoring Strategies (Strategy Pattern)', () => {
  let standardStrategy: StandardScoringStrategy;
  let weightedStrategy: WeightedScoringStrategy;
  let context: ScoringStrategyContext;

  beforeEach(() => {
    standardStrategy = new StandardScoringStrategy();
    weightedStrategy = new WeightedScoringStrategy();
    context = new ScoringStrategyContext(standardStrategy, weightedStrategy);
  });

  const mockEvaluationResults = [
    { questionId: 'q-1', isCorrect: true, earnedPoints: 10, maxPoints: 10 },
    { questionId: 'q-2', isCorrect: true, earnedPoints: 20, maxPoints: 20 },
    { questionId: 'q-3', isCorrect: false, earnedPoints: 0, maxPoints: 70 },
  ];

  describe('StandardScoringStrategy', () => {
    it('nên tính điểm theo số câu đúng / tổng số câu', () => {
      const result = standardStrategy.calculateScore({
        results: mockEvaluationResults,
        passingScorePercentage: 60,
        xpReward: 100,
      });

      // 2/3 câu đúng ~ 67%
      expect(result.correctAnswersCount).toBe(2);
      expect(result.totalQuestionsCount).toBe(3);
      expect(result.scorePercentage).toBe(67);
      expect(result.passed).toBe(true);
      expect(result.earnedXp).toBe(100);
    });
  });

  describe('WeightedScoringStrategy', () => {
    it('nên tính điểm theo trọng số điểm từng câu hỏi', () => {
      const result = weightedStrategy.calculateScore({
        results: mockEvaluationResults,
        passingScorePercentage: 50,
        xpReward: 100,
      });

      // (10 + 20) / (10 + 20 + 70) = 30 / 100 = 30%
      expect(result.earnedPoints).toBe(30);
      expect(result.totalPoints).toBe(100);
      expect(result.scorePercentage).toBe(30);
      expect(result.passed).toBe(false);
      expect(result.earnedXp).toBe(0);
    });
  });

  describe('ScoringStrategyContext', () => {
    it('nên chuyển đổi linh hoạt giữa các strategy', () => {
      context.setStrategy(ScoringMode.STANDARD);
      const resStandard = context.executeStrategy({
        results: mockEvaluationResults,
        passingScorePercentage: 60,
        xpReward: 100,
      });
      expect(resStandard.scorePercentage).toBe(67);

      context.setStrategy(ScoringMode.WEIGHTED);
      const resWeighted = context.executeStrategy({
        results: mockEvaluationResults,
        passingScorePercentage: 60,
        xpReward: 100,
      });
      expect(resWeighted.scorePercentage).toBe(30);
    });
  });
});
