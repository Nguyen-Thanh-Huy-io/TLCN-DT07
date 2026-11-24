import { normalizeSearch } from '@/features/search/search-index';
import type { PublicArticleLibraryItemDto } from '@/services/entities/landing.service';
import {
  findRootCategory,
  SYSTEM_CATEGORY_ROOT_SLUGS,
  type PublicCategory,
} from '@/services/public/public-content.service';

export type PreservationCategory = 'INTACT' | 'MUSEUM_MEMORIAL' | 'ARCHAEOLOGICAL_RUIN' | 'RESTORED' | 'ACTIVE_SITE';

export const PRESERVATION_LABELS: Record<PreservationCategory, string> = {
  INTACT: '🏛️ Bảo tồn nguyên vẹn',
  MUSEUM_MEMORIAL: '🕯️ Bảo tàng & Khu tưởng niệm',
  ARCHAEOLOGICAL_RUIN: '🏺 Phế tích & Khảo cổ',
  RESTORED: '🛠️ Đã trùng tu / Phục dựng',
  ACTIVE_SITE: '🚀 Công trình đang hoạt động',
};

export enum ArticleViewMode {
  GRID = 'grid',
  LIST = 'list',
}

export enum ArticleSortOption {
  YEAR_ASC = 'year-asc',
  YEAR_DESC = 'year-desc',
  NAME = 'name',
}

export const ARTICLE_SORT_LABELS: Record<ArticleSortOption, string> = {
  [ArticleSortOption.YEAR_ASC]: 'Cũ → mới',
  [ArticleSortOption.YEAR_DESC]: 'Mới → cũ',
  [ArticleSortOption.NAME]: 'Tên A–Z',
};

export enum ArticleFilterKey {
  CATEGORIES = 'categories',
  TAGS = 'tags',
  SITE_TYPES = 'siteTypes',
  PRESERVATIONS = 'preservations',
  PERSON_ROLES = 'personRoles',
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
  categories: string[];
  tags: string[];
  siteTypes: string[];
  preservations: string[];
  personRoles: string[];
}

export const EMPTY_ARTICLE_FILTERS: ArticleFilters = {
  categories: [],
  tags: [],
  siteTypes: [],
  preservations: [],
  personRoles: [],
};

export const countActiveArticleFilters = (f: ArticleFilters): number =>
  f.categories.length +
  f.tags.length +
  f.siteTypes.length +
  f.preservations.length +
  f.personRoles.length;

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

export function preservationTextOf(code: string | null): string | null {
  if (!code) return null;
  return PRESERVATION_LABELS[code as PreservationCategory] ?? null;
}

const locationStrategy: IArticleCardMetaStrategy = {
  primaryBadgeOf: (item) => item.siteTypeLabel ?? item.categoryName,
  locationBadgeOf: (item) => extractProvince(item.address),
  metaRowsOf: (item) => {
    const rows: ArticleMetaRow[] = [];
    const preservation = preservationTextOf(item.preservationCategory);
    const placeLine = [preservation, item.address].filter(Boolean).join(' · ');
    if (placeLine) rows.push({ icon: ArticleMetaIconKey.MAP_PIN, text: placeLine });
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
  haystack: string;
  tagIds: Set<string>;
}

export function buildArticleRows(articles: PublicArticleLibraryItemDto[]): ArticleRow[] {
  return articles.map((item) => {
    const searchable = [
      item.title,
      item.summary ?? '',
      item.categoryName ?? '',
      item.siteTypeLabel ?? '',
      item.address ?? '',
      item.hometown ?? '',
      item.famousQuote ?? '',
      item.dateLabel ?? '',
      ...item.aliases,
      ...item.roles,
      ...item.titles,
      ...item.tags.map((t) => t.name),
      ...item.linkedFigureNames,
      ...item.linkedLocationNames,
    ].join(' ');
    return {
      item,
      haystack: normalizeSearch(searchable),
      tagIds: new Set(item.tags.map((t) => t.id)),
    };
  });
}

/** Khi chọn 1 chuyên mục cha, tự động bao gồm luôn các chuyên mục con đệ quy của nó. */
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

/** Suy `slug` chuyên mục gốc đang được chọn nếu các chuyên mục đang lọc cùng thuộc 1 nhánh gốc. */
export function resolveActiveFilterKind(
  selectedCategoryIds: string[],
  categories: PublicCategory[],
): string | null {
  if (selectedCategoryIds.length === 0) return null;
  const rootSlugs = new Set(
    selectedCategoryIds
      .map((id) => findRootCategory(categories, id)?.slug)
      .filter((s): s is string => Boolean(s)),
  );
  return rootSlugs.size === 1 ? ([...rootSlugs][0] ?? null) : null;
}

function matchesJsonbFacets(item: PublicArticleLibraryItemDto, filters: ArticleFilters): boolean {
  if (filters.siteTypes.length > 0 && (!item.siteType || !filters.siteTypes.includes(item.siteType))) {
    return false;
  }
  if (
    filters.preservations.length > 0 &&
    (!item.preservationCategory || !filters.preservations.includes(item.preservationCategory))
  ) {
    return false;
  }
  if (filters.personRoles.length > 0 && !filters.personRoles.some((r) => item.roles.includes(r))) {
    return false;
  }
  return true;
}

export function matchesArticleRow(
  row: ArticleRow,
  filters: ArticleFilters,
  expandedCategoryIds: Set<string>,
  needle: string,
): boolean {
  if (expandedCategoryIds.size > 0 && (!row.item.categoryId || !expandedCategoryIds.has(row.item.categoryId))) {
    return false;
  }
  if (filters.tags.length > 0 && !filters.tags.some((t) => row.tagIds.has(t))) {
    return false;
  }
  if (!matchesJsonbFacets(row.item, filters)) {
    return false;
  }
  return !needle || row.haystack.includes(needle);
}

export interface JsonbFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface ArticleJsonbFacets {
  siteTypes: JsonbFacetOption[];
  preservations: JsonbFacetOption[];
  personRoles: JsonbFacetOption[];
}

export function buildArticleJsonbFacets(rows: ArticleRow[]): ArticleJsonbFacets {
  const siteTypeMap = new Map<string, JsonbFacetOption>();
  const preservationMap = new Map<string, JsonbFacetOption>();
  const roleMap = new Map<string, JsonbFacetOption>();

  for (const { item } of rows) {
    if (item.siteType && item.siteTypeLabel) {
      const cur = siteTypeMap.get(item.siteType) ?? { value: item.siteType, label: item.siteTypeLabel, count: 0 };
      cur.count += 1;
      siteTypeMap.set(item.siteType, cur);
    }
    const pLabel = preservationTextOf(item.preservationCategory);
    if (item.preservationCategory && pLabel) {
      const cur = preservationMap.get(item.preservationCategory) ?? {
        value: item.preservationCategory,
        label: pLabel,
        count: 0,
      };
      cur.count += 1;
      preservationMap.set(item.preservationCategory, cur);
    }
    for (const role of item.roles) {
      const cur = roleMap.get(role) ?? { value: role, label: role, count: 0 };
      cur.count += 1;
      roleMap.set(role, cur);
    }
  }

  const byCountDesc = (a: JsonbFacetOption, b: JsonbFacetOption) => b.count - a.count;
  return {
    siteTypes: [...siteTypeMap.values()].sort(byCountDesc),
    preservations: [...preservationMap.values()].sort(byCountDesc),
    personRoles: [...roleMap.values()].sort(byCountDesc),
  };
}

export function sortArticleRows(rows: ArticleRow[], sort: ArticleSortOption): ArticleRow[] {
  return [...rows].sort((a, b) => {
    if (sort === ArticleSortOption.NAME) {
      return a.item.title.localeCompare(b.item.title, 'vi');
    }
    const yearA = a.item.startYear;
    const yearB = b.item.startYear;
    if (yearA === null && yearB === null) return a.item.title.localeCompare(b.item.title, 'vi');
    if (yearA === null) return 1;
    if (yearB === null) return -1;
    return sort === ArticleSortOption.YEAR_DESC ? yearB - yearA : yearA - yearB;
  });
}
