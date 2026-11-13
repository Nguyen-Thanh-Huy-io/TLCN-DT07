import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
} from '../../types/editor.types';
import { ArticleApiService } from '@/services/entities/article.service';
import { WikipediaSourceStrategy } from './wikipedia-source.strategy';

/**
 * Tra cứu trong kho BÀI VIẾT nội bộ HISGO (nhân vật, sự kiện, di tích... đều là bài viết).
 * `entityId` trả về là id bài viết — khối Nhân vật/Sự kiện ghi id này vào HTML (data-entity-id)
 * để trang đọc bài học tìm ra bài viết liên quan.
 */
export class HisgoInternalSourceStrategy implements IEntityDataSourceStrategy {
  public readonly sourceType = EntitySourceType.HISGO;

  public async search(keyword: string, limit: number = 20): Promise<IEntitySearchResult[]> {
    try {
      const res = await ArticleApiService.list({ search: keyword.trim() || undefined, limit, sort: 'title' });
      return res.items.map((article) => ({
        id: article.id,
        title: article.title,
        description: [article.category?.name, article.summary].filter(Boolean).join(' · '),
        thumbnailUrl: article.coverImageUrl || '',
        sourceType: EntitySourceType.HISGO,
      }));
    } catch (error) {
      console.error('Error searching HISGO articles:', error);
      return [];
    }
  }

  public async getDetail(id: string): Promise<IEntityDetailPreview | null> {
    try {
      const article = await ArticleApiService.get(id);
      return {
        name: article.title,
        years: article.dateText || (article.startYear ? `${article.startYear}${article.endYear ? ` – ${article.endYear}` : ''}` : ''),
        summary: article.summary || '',
        avatarUrl: article.coverImageUrl || '',
        tagline: article.category?.name || '',
        sourceType: EntitySourceType.HISGO,
        entityId: article.id,
      };
    } catch (error) {
      console.error('Error fetching HISGO article detail:', error);
      return null;
    }
  }
}


/**
 * Interface cho Strategy nguồn dữ liệu thực thể lịch sử
 * Tuân thủ Strategy Pattern (Open/Closed Principle)
 */
export interface IEntityDataSourceStrategy {
  /**
   * Định danh loại nguồn
   */
  readonly sourceType: EntitySourceType;

  /**
   * Tìm kiếm danh sách thực thể theo từ khóa
   */
  search(keyword: string, limit?: number): Promise<IEntitySearchResult[]>;

  /**
   * Lấy chi tiết thông tin thực thể để xem trước và trích xuất
   */
  getDetail(identifier: string): Promise<IEntityDetailPreview | null>;
}

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
