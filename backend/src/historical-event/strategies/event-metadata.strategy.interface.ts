import { EventCategory } from '@prisma/client';

/**
 * Interface cho Metadata Strategy theo từng loại sự kiện
 * Tuân thủ Open-Closed Principle (OCP) và Single Responsibility Principle (SRP)
 */
export interface IEventMetadataStrategy {
  /**
   * Xác định Strategy này có hỗ trợ category chỉ định hay không
   */
  supports(category: EventCategory): boolean;

  /**
   * Validate và chuẩn hóa metadata thô thành cấu trúc chuẩn
   */
  validateAndNormalize(rawMetadata: unknown): Record<string, any> | null;

  /**
   * Lấy category tương ứng
   */
  getCategory(): EventCategory;
}
