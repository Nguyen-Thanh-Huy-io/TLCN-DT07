import { EntitySourceType } from '../types/entity-source.types';
import { IEntityDataSourceStrategy } from '../strategies/entity-sources/entity-source.interface';
import { WikipediaSourceStrategy } from '../strategies/entity-sources/wikipedia-source.strategy';
import { HisgoInternalSourceStrategy } from '../strategies/entity-sources/hisgo-internal-source.strategy';

/**
 * Factory Pattern: Khởi tạo và quản lý các Strategy nguồn dữ liệu thực thể lịch sử
 * Đảm bảo tính mở rộng OCP: Dễ dàng thêm nguồn mới (Vd: Thư viện Quốc gia, Bách khoa Quân sự...)
 */
export class EntitySourceStrategyFactory {
  private static readonly strategies = new Map<EntitySourceType, IEntityDataSourceStrategy>([
    [EntitySourceType.HISGO, new HisgoInternalSourceStrategy()],
    [EntitySourceType.WIKIPEDIA, new WikipediaSourceStrategy()],
  ]);

  /**
   * Lấy strategy theo loại nguồn dữ liệu
   */
  public static getStrategy(type: EntitySourceType): IEntityDataSourceStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unsupported entity source type: ${type}`);
    }
    return strategy;
  }
}
