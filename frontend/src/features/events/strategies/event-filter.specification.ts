import type { HistoricalEventItem } from '@/services/entities/historical-event.service';
import type { TaxonomyTermItem } from '@/services/entities/taxonomy.service';
import { SmartEventClassifier } from './event-classifier.strategy';

/**
 * Interface chuẩn cho Specification Pattern
 */
export interface ISpecification<T> {
  isSatisfiedBy(item: T): boolean;
}

/**
 * Tiêu chí lọc sự kiện lịch sử (Hỗ trợ Multi-Select)
 */
export interface EventFilterCriteria {
  selectedPeriodIds: string[]; // Mảng các ID thời kỳ đã chọn (rỗng = tất cả)
  selectedCategories: string[]; // Mảng các mã phân loại đã chọn (rỗng = tất cả)
  selectedStatus: string; // Trạng thái ('all' hoặc mã status)
}

/**
 * Specification lọc theo từ khóa tìm kiếm (Tiêu đề, tóm tắt, địa điểm, sự kiện cha)
 */
export class KeywordEventSpecification implements ISpecification<HistoricalEventItem> {
  constructor(private readonly keyword: string) {}

  isSatisfiedBy(item: HistoricalEventItem): boolean {
    const q = this.keyword.trim().toLowerCase();
    if (!q) return true;

    const titleMatch = item.title.toLowerCase().includes(q);
    const summaryMatch = Boolean(item.summary?.toLowerCase().includes(q));
    const parentMatch = Boolean(item.parent?.title?.toLowerCase().includes(q));
    const locationMatch = Boolean(item.historicalLocation?.name?.toLowerCase().includes(q));

    return titleMatch || summaryMatch || parentMatch || locationMatch;
  }
}

/**
 * Specification lọc theo danh sách Thời kỳ (Multi-Select)
 * Khớp nếu sự kiện thuộc về bất kỳ thời kỳ nào được chọn hoặc nhánh con của thời kỳ đó
 */
export class MultiPeriodEventSpecification implements ISpecification<HistoricalEventItem> {
  private readonly validPeriodIdSet: Set<string>;

  constructor(
    private readonly selectedPeriodIds: string[],
    periodChildrenMap: Map<string, Set<string>>
  ) {
    this.validPeriodIdSet = new Set<string>();

    for (const periodId of selectedPeriodIds) {
      if (periodId && periodId !== 'all') {
        this.validPeriodIdSet.add(periodId);
        // Bổ sung toàn bộ cây con của periodId này
        const children = periodChildrenMap.get(periodId);
        if (children) {
          children.forEach((childId) => this.validPeriodIdSet.add(childId));
        }
      }
    }
  }

  isSatisfiedBy(item: HistoricalEventItem): boolean {
    if (this.validPeriodIdSet.size === 0) return true;
    if (!item.periodId) return false;
    return this.validPeriodIdSet.has(item.periodId);
  }
}

/**
 * Specification lọc theo danh sách Phân loại Taxonomy (Multi-Select)
 * Khớp nếu phân loại của sự kiện thuộc về bất kỳ mã category nào được chọn
 */
export class MultiCategoryEventSpecification implements ISpecification<HistoricalEventItem> {
  private readonly validCategoryCodes: Set<string>;

  constructor(
    private readonly selectedCategories: string[],
    private readonly categoryTerms: TaxonomyTermItem[]
  ) {
    this.validCategoryCodes = new Set<string>();
    for (const code of selectedCategories) {
      if (code && code !== 'all') {
        this.validCategoryCodes.add(code);
      }
    }
  }

  isSatisfiedBy(item: HistoricalEventItem): boolean {
    if (this.validCategoryCodes.size === 0) return true;
    const classified = SmartEventClassifier.classify(this.categoryTerms, item);
    return this.validCategoryCodes.has(classified.code);
  }
}

/**
 * Specification lọc theo trạng thái xuất bản
 */
export class StatusEventSpecification implements ISpecification<HistoricalEventItem> {
  constructor(private readonly selectedStatus: string) {}

  isSatisfiedBy(item: HistoricalEventItem): boolean {
    if (!this.selectedStatus || this.selectedStatus === 'all') return true;
    const itemStatus = item.status || 'PUBLISHED';
    return itemStatus === this.selectedStatus;
  }
}

/**
 * Composite Specification kết hợp toàn bộ các tiêu chí với logic AND
 */
export class CompositeEventSpecification implements ISpecification<HistoricalEventItem> {
  private readonly specifications: ISpecification<HistoricalEventItem>[] = [];

  constructor(
    search: string,
    criteria: EventFilterCriteria,
    categoryTerms: TaxonomyTermItem[],
    periodChildrenMap: Map<string, Set<string>>
  ) {
    this.specifications.push(new KeywordEventSpecification(search));
    this.specifications.push(
      new MultiPeriodEventSpecification(criteria.selectedPeriodIds, periodChildrenMap)
    );
    this.specifications.push(
      new MultiCategoryEventSpecification(criteria.selectedCategories, categoryTerms)
    );
    this.specifications.push(new StatusEventSpecification(criteria.selectedStatus));
  }

  isSatisfiedBy(item: HistoricalEventItem): boolean {
    return this.specifications.every((spec) => spec.isSatisfiedBy(item));
  }
}
