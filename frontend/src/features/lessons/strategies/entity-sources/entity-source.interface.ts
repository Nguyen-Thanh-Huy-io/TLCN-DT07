import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
} from '../../types/entity-source.types';

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
