import { Injectable } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { IEventMetadataStrategy } from './event-metadata.strategy.interface';
import {
  BattleMetadataStrategy,
  TreatyMetadataStrategy,
  NaturalDisasterMetadataStrategy,
  DefaultEventMetadataStrategy,
} from './category-metadata.strategies';

/**
 * Registry / Factory quản lý các Metadata Strategies theo nguyên tắc OCP
 * Cho phép đăng ký thêm Strategy mới mà không phải sửa logic xử lý chính
 */
@Injectable()
export class EventMetadataStrategyRegistry {
  private readonly strategies: IEventMetadataStrategy[] = [];
  private readonly fallbackStrategy: IEventMetadataStrategy;

  constructor(
    battleStrategy: BattleMetadataStrategy,
    treatyStrategy: TreatyMetadataStrategy,
    disasterStrategy: NaturalDisasterMetadataStrategy,
    defaultStrategy: DefaultEventMetadataStrategy,
  ) {
    this.fallbackStrategy = defaultStrategy;
    this.registerStrategy(battleStrategy);
    this.registerStrategy(treatyStrategy);
    this.registerStrategy(disasterStrategy);
  }

  /**
   * Đăng ký một Strategy mới (Mở rộng OCP)
   */
  registerStrategy(strategy: IEventMetadataStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Lấy Strategy phù hợp nhất dựa trên category
   */
  getStrategy(category?: EventCategory | null): IEventMetadataStrategy {
    if (!category) {
      return this.fallbackStrategy;
    }

    const matched = this.strategies.find((s) => s.supports(category));
    return matched || this.fallbackStrategy;
  }
}
