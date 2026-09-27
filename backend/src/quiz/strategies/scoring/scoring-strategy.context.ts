import { Injectable } from '@nestjs/common';
import { IScoringStrategy, QuizScoringInput, QuizScoringResult } from './scoring.strategy.interface';
import { StandardScoringStrategy } from './standard-scoring.strategy';
import { WeightedScoringStrategy } from './weighted-scoring.strategy';

export enum ScoringMode {
  STANDARD = 'STANDARD',
  WEIGHTED = 'WEIGHTED',
}

@Injectable()
export class ScoringStrategyContext {
  private strategy: IScoringStrategy;

  constructor(
    private readonly standardStrategy: StandardScoringStrategy,
    private readonly weightedStrategy: WeightedScoringStrategy,
  ) {
    this.strategy = this.standardStrategy; // Default strategy
  }

  setStrategy(mode: ScoringMode): void {
    if (mode === ScoringMode.WEIGHTED) {
      this.strategy = this.weightedStrategy;
    } else {
      this.strategy = this.standardStrategy;
    }
  }

  executeStrategy(input: QuizScoringInput): QuizScoringResult {
    return this.strategy.calculateScore(input);
  }
}
