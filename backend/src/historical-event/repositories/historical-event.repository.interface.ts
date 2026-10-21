import { QueryHistoricalEventDto } from '../dto/query-historical-event.dto';
import {
  CreateHistoricalEventDomainModel,
  HistoricalEventEntityModel,
  UpdateHistoricalEventDomainModel,
} from '../models/historical-event.domain-model';

/**
 * Pure Port Interface for HistoricalEvent Repository
 * Tuân thủ tuyệt đối DIP (Dependency Inversion Principle):
 * Service và tầng nghiệp vụ hoàn toàn độc lập, không phụ thuộc vào bất kỳ ORM nào (Prisma, TypeORM, v.v.)
 */
export interface IHistoricalEventRepository {
  /**
   * Tạo sự kiện mới
   */
  create(data: CreateHistoricalEventDomainModel): Promise<HistoricalEventEntityModel>;

  /**
   * Cập nhật sự kiện theo ID
   */
  update(
    id: string,
    data: UpdateHistoricalEventDomainModel,
  ): Promise<HistoricalEventEntityModel>;

  /**
   * Tìm sự kiện theo ID
   */
  findById(id: string): Promise<HistoricalEventEntityModel | null>;

  /**
   * Tìm danh sách sự kiện có phân trang và lọc
   */
  findMany(
    query: QueryHistoricalEventDto,
  ): Promise<{ items: HistoricalEventEntityModel[]; total: number }>;

  /**
   * Kiểm tra tồn tại slug
   */
  existsBySlug(slug: string): Promise<boolean>;

  /**
   * Đếm số lượng sự kiện con có parentId = id
   */
  countChildren(parentId: string): Promise<number>;

  /**
   * Kiểm tra sự tồn tại của các khóa ngoại tham chiếu (Topic, Period, Location, Parent)
   */
  checkReferences(dto: {
    topicId?: string;
    periodId?: string;
    siteId?: string;
    locationId?: string;
    parentId?: string;
  }): Promise<{
    topicExists: boolean;
    periodExists: boolean;
    locationExists: boolean;
    parentExists: boolean;
  }>;

  /**
   * Xóa sự kiện theo ID
   */
  delete(id: string): Promise<HistoricalEventEntityModel>;

  /**
   * Thêm quan hệ giữa hai sự kiện
   */
  addRelation(data: {
    sourceEventId: string;
    targetEventId: string;
    relationType: any;
    description?: string;
    status?: any;
    sourceReference?: string;
  }): Promise<any>;

  /**
   * Xóa quan hệ giữa hai sự kiện
   */
  removeRelation(relationId: string): Promise<any>;

  /**
   * Tìm quan hệ theo ID
   */
  findRelationById(relationId: string): Promise<any | null>;

  /**
   * Lấy quan hệ hai chiều của sự kiện (outgoing & incoming)
   */
  findRelationsByEventId(eventId: string): Promise<{
    outgoing: any[];
    incoming: any[];
  }>;
}

