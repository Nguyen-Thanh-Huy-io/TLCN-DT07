import { Injectable } from '@nestjs/common';
import { IProgressionStrategy } from './progression-strategy.interface';
import { SequentialProgressionStrategy } from './sequential-progression.strategy';
import { FreePacedProgressionStrategy } from './free-paced-progression.strategy';

@Injectable()
export class ProgressionStrategyFactory {
  constructor(
    private readonly sequentialStrategy: SequentialProgressionStrategy,
    private readonly freePacedStrategy: FreePacedProgressionStrategy,
  ) {}

  getStrategy(isSequential: boolean): IProgressionStrategy {
    return isSequential ? this.sequentialStrategy : this.freePacedStrategy;
  }
}
