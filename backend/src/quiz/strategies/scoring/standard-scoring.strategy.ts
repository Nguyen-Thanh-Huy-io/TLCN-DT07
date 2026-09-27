import { Injectable } from '@nestjs/common';
import {
  IScoringStrategy,
  QuizScoringInput,
  QuizScoringResult,
} from './scoring.strategy.interface';

@Injectable()
export class StandardScoringStrategy implements IScoringStrategy {
  calculateScore(input: QuizScoringInput): QuizScoringResult {
    const { results, passingScorePercentage, xpReward } = input;
    const totalQuestionsCount = results.length;

    if (totalQuestionsCount === 0) {
      return {
        scorePercentage: 0,
        totalPoints: 0,
        earnedPoints: 0,
        correctAnswersCount: 0,
        totalQuestionsCount: 0,
        passed: false,
        earnedXp: 0,
      };
    }

    const correctAnswersCount = results.filter((r) => r.isCorrect).length;
    const totalPoints = results.reduce((sum, r) => sum + r.maxPoints, 0);
    const earnedPoints = results.reduce((sum, r) => sum + r.earnedPoints, 0);

    const scorePercentage = Math.round(
      (correctAnswersCount / totalQuestionsCount) * 100,
    );
    const passed = scorePercentage >= passingScorePercentage;
    const earnedXp = passed ? xpReward : 0;

    return {
      scorePercentage,
      totalPoints,
      earnedPoints,
      correctAnswersCount,
      totalQuestionsCount,
      passed,
      earnedXp,
    };
  }
}
