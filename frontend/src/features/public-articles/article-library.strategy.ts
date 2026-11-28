import type { PublicArticleLibraryItemDto } from '@/services/entities/landing.service';
import { collectDescendantTopicIds } from '@/services/entities/landing-graph';
import {
  findRootCategory,
  SYSTEM_CATEGORY_ROOT_SLUGS,
  type PublicCategory,
  type PublicTopicRef,
} from '@/services/public/public-content.service';

export enum ArticleViewMode {
  GRID = 'grid',
  LIST = 'list',
}

export enum ArticleSortOption {
  FEATURED = 'featured',
  YEAR_ASC = 'year-asc',
  YEAR_DESC = 'year-desc',
  NAME = 'name',
}

export const ARTICLE_SORT_LABELS: Record<ArticleSortOption, string> = {
  [ArticleSortOption.FEATURED]: 'Tiêu biểu',
  [ArticleSortOption.YEAR_ASC]: 'Cũ → mới',
  [ArticleSortOption.YEAR_DESC]: 'Mới → cũ',
  [ArticleSortOption.NAME]: 'Tên A–Z',
};

export const ARTICLE_PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
export const DEFAULT_ARTICLE_PAGE_SIZE = 24;

export enum CatalogUrlParamKey {
  CATEGORY = 'chuyen-muc',
  TOPIC = 'chu-de',
  QUERY = 'q',
  TAG = 'tag',
  SORT = 'sort',
  PAGE = 'page',
  LIMIT = 'limit',
}

export enum ArticleFilterKey {
  TAGS = 'tags',
}

export enum ArticleMetaIconKey {
  MAP_PIN = 'map-pin',
  USERS = 'users',
  LANDMARK = 'landmark',
  HISTORY = 'history',
  TAG = 'tag',
  QUOTE = 'quote',
}

export interface ArticleFilters {
  /** Chọn đơn 1 chuyên mục gốc tại một thời điểm (`null` = chưa lọc chuyên mục). */
  rootCategoryId: string | null;
  /** Tích chọn 1 hoặc nhiều chuyên mục con/cháu bên trong nhánh của `rootCategoryId` (rỗng = lấy toàn bộ nhánh gốc). */
  subCategoryIds: string[];
  tags: string[];
}

export const EMPTY_ARTICLE_FILTERS: ArticleFilters = {
  rootCategoryId: null,
  subCategoryIds: [],
  tags: [],
};

export function hasSecondaryDraftFilters(f: ArticleFilters): boolean {
  return f.tags.length > 0;
}

export interface ArticleMetaRow {
  icon: ArticleMetaIconKey;
  text: string;
}

export interface IArticleCardMetaStrategy {
  primaryBadgeOf(item: PublicArticleLibraryItemDto): string | null;
  locationBadgeOf(item: PublicArticleLibraryItemDto): string | null;
  metaRowsOf(item: PublicArticleLibraryItemDto): ArticleMetaRow[];
  ctaLabel: string;
}

function extractProvince(address: string | null): string | null {
  const last = address?.split(',').pop()?.trim();
  if (!last) return null;
  const cleaned = last.replace(/^(tỉnh|thành phố|tp\.?)\s*/i, '').trim();
  if (!cleaned) return null;
  return /^hồ chí minh$/i.test(cleaned) ? 'TP. Hồ Chí Minh' : cleaned;
}

function formatNamePreview(names: string[], max = 2): string {
  const head = names.slice(0, max).join(', ');
  return names.length > max ? `${head} +${names.length - max}` : head;
}

const locationStrategy: IArticleCardMetaStrategy = {
  primaryBadgeOf: (item) => item.siteTypeLabel ?? item.categoryName,
  locationBadgeOf: (item) => extractProvince(item.address),
  metaRowsOf: (item) => {
    const rows: ArticleMetaRow[] = [];
    if (item.address) rows.push({ icon: ArticleMetaIconKey.MAP_PIN, text: item.address });
    const statsLine = [
      item.linkedEventsCount > 0 ? `${item.linkedEventsCount} sự kiện lịch sử gắn liền` : null,
      item.recognizedYear ? `Công nhận: ${item.recognizedYear}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    if (statsLine) rows.push({ icon: ArticleMetaIconKey.LANDMARK, text: statsLine });
    return rows;
  },
  ctaLabel: 'Khám phá di tích',
};

const eventStrategy: IArticleCardMetaStrategy = {
  primaryBadgeOf: (item) => item.categoryName,
  locationBadgeOf: (item) => item.linkedLocationNames[0] ?? null,
  metaRowsOf: (item) => {
    const rows: ArticleMetaRow[] = [];
    if (item.linkedFigureNames.length > 0) {
      rows.push({ icon: ArticleMetaIconKey.USERS, text: formatNamePreview(item.linkedFigureNames) });
    }
    if (item.linkedLocationNames.length > 0) {
      rows.push({ icon: ArticleMetaIconKey.MAP_PIN, text: formatNamePreview(item.linkedLocationNames) });
    }
    return rows;
  },
  ctaLabel: 'Khám phá sự kiện',
};

const personStrategy: IArticleCardMetaStrategy = {
  primaryBadgeOf: (item) => item.roles[0] ?? item.titles[0] ?? item.categoryName,
  locationBadgeOf: (item) => item.hometown,
  metaRowsOf: (item) => {
    const rows: ArticleMetaRow[] = [];
    const roleOrTitle = (
      item.roles.length > 1
        ? item.roles.slice(0, 3)
        : item.titles.length > 0
          ? item.titles.slice(0, 2)
          : item.aliases.slice(0, 2)
    ).join(' · ');
    if (roleOrTitle) rows.push({ icon: ArticleMetaIconKey.USERS, text: roleOrTitle });
    if (item.famousQuote) {
      rows.push({ icon: ArticleMetaIconKey.QUOTE, text: `“${item.famousQuote}”` });
    } else if (item.linkedEventsCount > 0) {
      rows.push({ icon: ArticleMetaIconKey.HISTORY, text: `${item.linkedEventsCount} sự kiện trong dòng đời` });
    }
    return rows;
  },
  ctaLabel: 'Đọc bài viết',
};

const dynastyStrategy: IArticleCardMetaStrategy = {
  primaryBadgeOf: (item) => item.categoryName,
  locationBadgeOf: (item) => item.linkedLocationNames[0] ?? null,
  metaRowsOf: (item) => {
    const rows: ArticleMetaRow[] = [];
    if (item.aliases.length > 0) {
      rows.push({ icon: ArticleMetaIconKey.LANDMARK, text: `Danh xưng: ${item.aliases.slice(0, 2).join(', ')}` });
    }
    if (item.linkedFigureNames.length > 0) {
      rows.push({ icon: ArticleMetaIconKey.USERS, text: formatNamePreview(item.linkedFigureNames) });
    }
    return rows;
  },
  ctaLabel: 'Khám phá triều đại',
};

const defaultStrategy: IArticleCardMetaStrategy = {
  primaryBadgeOf: (item) => item.categoryName,
  locationBadgeOf: (item) => item.linkedLocationNames[0] ?? null,
  metaRowsOf: (item) => {
    const rows: ArticleMetaRow[] = [];
    if (item.aliases.length > 0) {
      rows.push({ icon: ArticleMetaIconKey.LANDMARK, text: item.aliases.slice(0, 2).join(' · ') });
    }
    if (item.tags.length > 0) {
      rows.push({ icon: ArticleMetaIconKey.TAG, text: item.tags.slice(0, 3).map((t) => t.name).join(' · ') });
    }
    return rows;
  },
  ctaLabel: 'Đọc bài viết',
};

const ARTICLE_CARD_META_STRATEGIES: Record<string, IArticleCardMetaStrategy> = {
  [SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION]: locationStrategy,
  [SYSTEM_CATEGORY_ROOT_SLUGS.EVENT]: eventStrategy,
  [SYSTEM_CATEGORY_ROOT_SLUGS.PERSON]: personStrategy,
  [SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY]: dynastyStrategy,
};

export function getArticleCardMetaStrategy(kindOrSlug: string): IArticleCardMetaStrategy {
  return ARTICLE_CARD_META_STRATEGIES[kindOrSlug] ?? defaultStrategy;
}

export interface ArticleRow {
  item: PublicArticleLibraryItemDto;
}

/** Bao gồm đệ quy N tầng: chính các ID truyền vào + toàn bộ con, cháu, chắt... của chúng. */
export function expandSelectedCategoryIds(selectedIds: string[], categories: PublicCategory[]): Set<string> {
  const expanded = new Set(selectedIds);
  if (expanded.size === 0) return expanded;
  let added = true;
  while (added) {
    added = false;
    for (const cat of categories) {
      if (cat.parentId && expanded.has(cat.parentId) && !expanded.has(cat.id)) {
        expanded.add(cat.id);
        added = true;
      }
    }
  }
  return expanded;
}

/** Thu thập đường dẫn từ chuyên mục gốc xuống `targetId` (`[root, ..., parent, target]`). */
export function collectCategoryLineage(
  targetId: string | null,
  categories: PublicCategory[],
): PublicCategory[] {
  if (!targetId) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: PublicCategory[] = [];
  let cur = byId.get(targetId);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

/** Lọc các node con sâu nhất nếu người dùng tích cả mục cha lẫn mục cháu trong `subCategoryIds`. */
export function getDeepestSelectedCategoryIds(
  selectedIds: string[],
  categories: PublicCategory[],
): string[] {
  if (selectedIds.length === 0) return [];
  const selectedSet = new Set(selectedIds);
  const hasSelectedDescendant = new Set<string>();
  const byId = new Map(categories.map((c) => [c.id, c]));

  for (const id of selectedIds) {
    let cur = byId.get(id);
    const seen = new Set<string>();
    while (cur?.parentId && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (selectedSet.has(cur.parentId)) {
        hasSelectedDescendant.add(cur.parentId);
      }
      cur = byId.get(cur.parentId);
    }
  }

  return selectedIds.filter((id) => !hasSelectedDescendant.has(id));
}

export function countActiveArticleFilters(f: ArticleFilters, categories: PublicCategory[] = []): number {
  const catCount =
    f.subCategoryIds.length > 0
      ? getDeepestSelectedCategoryIds(f.subCategoryIds, categories).length
      : f.rootCategoryId
        ? 1
        : 0;
  return catCount + f.tags.length;
}

/** Khởi tạo trạng thái từ slug `?chuyen-muc=` trên URL (chấp nhận cả slug Cha lẫn slug Con/Cháu N tầng). */
export function buildInitialCategorySelection(
  initialSlug: string | undefined,
  categories: PublicCategory[],
): Pick<ArticleFilters, 'rootCategoryId' | 'subCategoryIds'> {
  if (!initialSlug) return { rootCategoryId: null, subCategoryIds: [] };
  const matched = categories.find((c) => c.slug === initialSlug);
  if (!matched) return { rootCategoryId: null, subCategoryIds: [] };
  const root = findRootCategory(categories, matched.id) ?? matched;
  if (root.id === matched.id) {
    return { rootCategoryId: root.id, subCategoryIds: [] };
  }
  return { rootCategoryId: root.id, subCategoryIds: [matched.id] };
}

/** Chọn đơn 1 Chuyên mục gốc: bấm lại chính nó sẽ bỏ chọn; bấm sang Cha khác sẽ chuyển nhánh và xóa tích lẻ cũ. */
export function selectRootCategory(
  filters: ArticleFilters,
  rootId: string,
): ArticleFilters {
  if (filters.rootCategoryId === rootId) {
    return { ...filters, rootCategoryId: null, subCategoryIds: [] };
  }
  return { ...filters, rootCategoryId: rootId, subCategoryIds: [] };
}

/**
 * Bật/tắt 1 mục trong khung "Chuyên mục con" (ở bất kỳ tầng 2, 3, 4...):
 * - Nếu chưa tích hết các mục: tự ghi nhận `rootCategoryId` của nhánh và cập nhật `subCategoryIds`.
 * - Nếu bỏ tích mục con cuối cùng: giữ nguyên `rootCategoryId` để tự động lấy toàn bộ nhánh gốc.
 */
export function toggleSubCategorySelection(
  filters: ArticleFilters,
  subId: string,
  categories: PublicCategory[],
): ArticleFilters {
  const root = findRootCategory(categories, subId);
  const nextRootId = root?.id ?? filters.rootCategoryId;
  const subtreeIds = expandSelectedCategoryIds([subId], categories);

  if (filters.subCategoryIds.includes(subId)) {
    return {
      ...filters,
      rootCategoryId: nextRootId,
      subCategoryIds: filters.subCategoryIds.filter((id) => !subtreeIds.has(id)),
    };
  }

  const ancestorIds = new Set(collectCategoryLineage(subId, categories).map((c) => c.id));
  ancestorIds.delete(subId);
  const cleaned = filters.subCategoryIds.filter(
    (id) => !subtreeIds.has(id) && !ancestorIds.has(id),
  );
  return {
    ...filters,
    rootCategoryId: nextRootId,
    subCategoryIds: [...cleaned, subId],
  };
}

/** Quy đổi trạng thái chọn sang danh sách `categoryIds` gửi lên Server. */
export function resolveEffectiveCategoryIds(
  filters: Pick<ArticleFilters, 'rootCategoryId' | 'subCategoryIds'>,
  categories: PublicCategory[],
): string[] {
  if (filters.subCategoryIds.length > 0) {
    const deepest = getDeepestSelectedCategoryIds(filters.subCategoryIds, categories);
    return [...expandSelectedCategoryIds(deepest, categories)];
  }
  if (filters.rootCategoryId) {
    return [...expandSelectedCategoryIds([filters.rootCategoryId], categories)];
  }
  return [];
}

/** Tính tổng số bài thực tế của từng Chuyên mục đệ quy N tầng (node = bài trực tiếp + mọi con/cháu). */
export function computeBranchCategoryCounts(
  categories: PublicCategory[],
  categoryCounts: Record<string, number>,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const cat of categories) {
    const branchIds = expandSelectedCategoryIds([cat.id], categories);
    let sum = 0;
    for (const id of branchIds) {
      sum += categoryCounts[id] ?? 0;
    }
    result.set(cat.id, sum);
  }
  return result;
}

export function estimateDraftCategoryCount(
  draft: ArticleFilters,
  categories: PublicCategory[],
  categoryCounts: Record<string, number>,
  totalInScope: number,
): number {
  const effectiveIds = resolveEffectiveCategoryIds(draft, categories);
  if (effectiveIds.length === 0) return totalInScope;
  return effectiveIds.reduce((sum, id) => sum + (categoryCounts[id] ?? 0), 0);
}

export function parseCatalogPageSize(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_ARTICLE_PAGE_SIZE;
  return (ARTICLE_PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_ARTICLE_PAGE_SIZE;
}

export function parseCatalogSort(raw: string | undefined): ArticleSortOption {
  if (raw && Object.values<string>(ArticleSortOption).includes(raw)) {
    return raw as ArticleSortOption;
  }
  return ArticleSortOption.FEATURED;
}

export function resolveActiveTopicIds(
  topics: PublicTopicRef[],
  focusedTopicId: string | null,
): string[] {
  if (!focusedTopicId) return [];
  return [...collectDescendantTopicIds(topics, focusedTopicId)];
}
