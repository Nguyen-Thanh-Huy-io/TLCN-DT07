'use client';

import { ChipGroup, FilterSection, PickedCount, toggleValue } from './ChipFilter';
import {
  CategoryHierarchyFilterSection,
  EMPTY_CATEGORY_SELECTION,
  getDeepestCategoryIds,
  type CategorySelectionState,
} from './CategoryHierarchyFilterSection';
import type {
  ArticleCatalogTagFacet,
  PublicCategory,
  PublicTag,
} from '@/services/public/public-content.service';

export interface PublicContentFacetFilterState extends CategorySelectionState {
  tags: string[];
}

export const EMPTY_PUBLIC_CONTENT_FACET_FILTERS: PublicContentFacetFilterState = {
  ...EMPTY_CATEGORY_SELECTION,
  tags: [],
};

export function activePublicFacetFilterCount(
  state: PublicContentFacetFilterState,
  categories: PublicCategory[],
): number {
  const catCount =
    state.subCategoryIds.length > 0
      ? getDeepestCategoryIds(state.subCategoryIds, categories).length
      : state.rootCategoryId
        ? 1
        : 0;
  return catCount + state.tags.length;
}

export function computeTagFacetsFromItems(
  items: ReadonlyArray<{ tagItems?: ReadonlyArray<PublicTag> }>,
): ArticleCatalogTagFacet[] {
  const map = new Map<string, ArticleCatalogTagFacet>();
  for (const item of items) {
    for (const t of item.tagItems ?? []) {
      const existing = map.get(t.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(t.id, {
          id: t.id,
          name: t.name,
          count: 1,
        });
      }
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'),
  );
}

export function matchesSelectedTags(
  item: { tagItems?: ReadonlyArray<PublicTag> },
  selectedTags: ReadonlyArray<string>,
): boolean {
  if (selectedTags.length === 0) return true;
  const itemTagIds = new Set((item.tagItems ?? []).map((t) => t.id));
  const itemTagNames = new Set(
    (item.tagItems ?? []).map((t) => t.name.toLocaleLowerCase('vi')),
  );
  return selectedTags.some(
    (picked) =>
      itemTagIds.has(picked) || itemTagNames.has(picked.toLocaleLowerCase('vi')),
  );
}

/**
 * Ruột hộp thoại Bộ lọc dùng chung 100% từ dữ liệu DB giữa `/bai-viet`, `/dong-thoi-gian` và `/giai-doan/[slug]`:
 *  1. Chuyên mục ➔ Chuyên mục con (1 khung đơn kèm Breadcrumb N-tầng)
 *  2. Chủ điểm (Tag) kèm ô tìm kiếm nhanh
 */
export function PublicContentFilterSections<T extends PublicContentFacetFilterState>({
  draft,
  setDraft,
  categories,
  branchCategoryCounts,
  tagOptions,
  rootUnitLabel = 'bài viết',
  subUnitLabel = 'bài',
  tagUnitLabel = rootUnitLabel,
  hideZeroRoots = false,
}: {
  draft: T;
  setDraft: (update: (d: T) => T) => void;
  categories: PublicCategory[];
  branchCategoryCounts: Map<string, number>;
  tagOptions: ArticleCatalogTagFacet[];
  rootUnitLabel?: string;
  subUnitLabel?: string;
  tagUnitLabel?: string;
  hideZeroRoots?: boolean;
}) {
  return (
    <>
      <CategoryHierarchyFilterSection
        draft={draft}
        setDraft={setDraft}
        categories={categories}
        branchCategoryCounts={branchCategoryCounts}
        rootUnitLabel={rootUnitLabel}
        subUnitLabel={subUnitLabel}
        hideZeroRoots={hideZeroRoots}
      />

      {tagOptions.length > 0 && (
        <FilterSection title="Chủ điểm" aside={<PickedCount count={draft.tags.length} />}>
          <ChipGroup
            options={tagOptions.map((t) => ({
              value: t.id,
              label: t.name,
              hint: `${t.count.toLocaleString('vi-VN')} ${tagUnitLabel}`,
            }))}
            selected={draft.tags}
            onToggle={(v) => setDraft((d) => ({ ...d, tags: toggleValue(d.tags, v) }))}
            searchLabel="Tìm chủ điểm..."
          />
        </FilterSection>
      )}
    </>
  );
}
