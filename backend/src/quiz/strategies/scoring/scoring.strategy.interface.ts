import { QuestionEvaluationResult } from '../../evaluators/question-evaluator.interface';

export interface QuizScoringInput {
  results: QuestionEvaluationResult[];
  passingScorePercentage: number;
  xpReward: number;
}

export interface QuizScoringResult {
  scorePercentage: number; // 0 - 100
  totalPoints: number;
  earnedPoints: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  passed: boolean;
  earnedXp: number;
}

export interface IScoringStrategy {
  calculateScore(input: QuizScoringInput): QuizScoringResult;
}
