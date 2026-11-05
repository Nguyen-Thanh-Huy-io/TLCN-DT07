import { IEntityDataSourceStrategy } from './entity-source.interface';
import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
} from '../../types/entity-source.types';
import { ArticleApiService } from '@/services/entities/article.service';

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
