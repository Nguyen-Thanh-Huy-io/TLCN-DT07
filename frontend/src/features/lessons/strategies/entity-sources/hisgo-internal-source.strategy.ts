import { IEntityDataSourceStrategy } from './entity-source.interface';
import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
} from '../../types/entity-source.types';
import { HistoricalEntityApiService } from '@/services/entities/historical-entity.service';

/**
 * Strategy tra cứu thực thể từ Cơ sở dữ liệu nội bộ HISGO (PostgreSQL)
 * Dữ liệu đã thẩm định, có ID thực thể đầy đủ để liên kết Đồ thị tri thức (Knowledge Graph).
 */
export class HisgoInternalSourceStrategy implements IEntityDataSourceStrategy {
  public readonly sourceType = EntitySourceType.HISGO;

  /**
   * Tìm kiếm trong kho tri thức nội bộ HISGO
   */
  public async search(keyword: string, limit: number = 20): Promise<IEntitySearchResult[]> {
    try {
      const trimmed = keyword.trim();
      const res = await HistoricalEntityApiService.getEntities({
        search: trimmed || undefined,
        limit,
      });

      return (res.items || []).map((entity) => ({
        id: entity.id,
        title: entity.name,
        description: entity.tagline || entity.description || '',
        thumbnailUrl: entity.imageUrl || '',
        sourceType: EntitySourceType.HISGO,
      }));
    } catch (error) {
      console.error('Error fetching internal HISGO entities:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết thực thể nội bộ HISGO
   */
  public async getDetail(id: string): Promise<IEntityDetailPreview | null> {
    try {
      const entity = await HistoricalEntityApiService.getEntityById(id);
      if (!entity) return null;

      const formattedYears = entity.birthYear
        ? `${entity.birthYear} – ${entity.deathYear ?? 'Nay'}`
        : entity.birthDateLabel || '';

      return {
        name: entity.name,
        years: formattedYears,
        summary: entity.tagline || entity.description || '',
        avatarUrl: entity.imageUrl || '',
        tagline: entity.tagline || '',
        sourceType: EntitySourceType.HISGO,
        entityId: entity.id,
      };
    } catch (error) {
      console.error('Error fetching internal HISGO entity detail:', error);
      return null;
    }
  }
}
