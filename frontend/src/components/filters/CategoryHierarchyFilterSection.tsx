'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { FilterSection, PickedCount } from './ChipFilter';
import { findRootCategory, type CategoryHierarchyNode } from '@/services/public/public-content.service';

export interface CategorySelectionState {
  rootCategoryId: string | null;
  subCategoryIds: string[];
}

export const EMPTY_CATEGORY_SELECTION: CategorySelectionState = {
  rootCategoryId: null,
  subCategoryIds: [],
};

/** Bao gồm đệ quy N tầng: chính các ID truyền vào + toàn bộ con, cháu, chắt... của chúng. */
export function expandCategorySubtreeIds<T extends CategoryHierarchyNode>(
  selectedIds: string[],
  categories: T[],
): Set<string> {
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
export function collectCategoryNodeLineage<T extends CategoryHierarchyNode>(
  targetId: string | null,
  categories: T[],
): T[] {
  if (!targetId) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: T[] = [];
  let cur = byId.get(targetId);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

/** Lọc các node con sâu nhất nếu có cả mục cha lẫn mục cháu trong danh sách. */
export function getDeepestCategoryIds<T extends CategoryHierarchyNode>(
  selectedIds: string[],
  categories: T[],
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

export function selectSingleRootCategory<S extends CategorySelectionState>(
  state: S,
  rootId: string,
): S {
  if (state.rootCategoryId === rootId) {
    return { ...state, rootCategoryId: null, subCategoryIds: [] };
  }
  return { ...state, rootCategoryId: rootId, subCategoryIds: [] };
}

export function toggleSubCategoryNode<S extends CategorySelectionState, T extends CategoryHierarchyNode>(
  state: S,
  subId: string,
  categories: T[],
): S {
  const root = findRootCategory(categories, subId);
  const nextRootId = root?.id ?? state.rootCategoryId;
  const subtreeIds = expandCategorySubtreeIds([subId], categories);

  if (state.subCategoryIds.includes(subId)) {
    return {
      ...state,
      rootCategoryId: nextRootId,
      subCategoryIds: state.subCategoryIds.filter((id) => !subtreeIds.has(id)),
    };
  }

  const ancestorIds = new Set(collectCategoryNodeLineage(subId, categories).map((c) => c.id));
  ancestorIds.delete(subId);
  const cleaned = state.subCategoryIds.filter(
    (id) => !subtreeIds.has(id) && !ancestorIds.has(id),
  );
  return {
    ...state,
    rootCategoryId: nextRootId,
    subCategoryIds: [...cleaned, subId],
  };
}

export function resolveEffectiveCategorySelectionIds<T extends CategoryHierarchyNode>(
  state: CategorySelectionState,
  categories: T[],
): string[] {
  if (state.subCategoryIds.length > 0) {
    const deepest = getDeepestCategoryIds(state.subCategoryIds, categories);
    return [...expandCategorySubtreeIds(deepest, categories)];
  }
  if (state.rootCategoryId) {
    return [...expandCategorySubtreeIds([state.rootCategoryId], categories)];
  }
  return [];
}

export function computeRecursiveCategoryBranchCounts<T extends CategoryHierarchyNode>(
  categories: T[],
  directCounts: Record<string, number>,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const cat of categories) {
    const branchIds = expandCategorySubtreeIds([cat.id], categories);
    let sum = 0;
    for (const id of branchIds) {
      sum += directCounts[id] ?? 0;
    }
    result.set(cat.id, sum);
  }
  return result;
}

export function countPickedSubtreeDescendants<T extends CategoryHierarchyNode>(
  parentId: string,
  subCategoryIds: string[],
  categories: T[],
): number {
  if (subCategoryIds.length === 0) return 0;
  const descendants = expandCategorySubtreeIds([parentId], categories);
  descendants.delete(parentId);
  return subCategoryIds.filter((id) => descendants.has(id)).length;
}

const SELECTED_CHIP_CLASS = 'sk-selected';

function SubCategoryBreadcrumb<T extends CategoryHierarchyNode>({
  lineage,
  onStepTo,
}: {
  lineage: T[];
  onStepTo: (parentId: string) => void;
}) {
  if (lineage.length <= 1) return null;
  const previousParent = lineage[lineage.length - 2];
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#7A6B57]">
      {previousParent && (
        <button
          type="button"
          onClick={() => onStepTo(previousParent.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#E2D5B8] bg-white px-2 py-0.5 font-bold text-[#7A1F24] hover:border-[#B8893F] cursor-pointer"
        >
          <ArrowLeft size={12} /> Cấp trước
        </button>
      )}
      {lineage.map((node, idx) => {
        const isLast = idx === lineage.length - 1;
        return (
          <span key={node.id} className="inline-flex items-center gap-1">
            {idx > 0 && <ChevronRight size={12} className="opacity-60" />}
            {isLast ? (
              <strong className="font-bold text-[#2D1A10]">{node.name}</strong>
            ) : (
              <button
                type="button"
                onClick={() => onStepTo(node.id)}
                className="font-semibold text-[#7A1F24] hover:underline cursor-pointer"
              >
                {node.name}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

function SubCategoryCardItem<T extends CategoryHierarchyNode>({
  cat,
  count,
  childCount,
  unitLabel,
  isSelected,
  pickedDescendantCount,
  onToggle,
  onDrillDown,
}: {
  cat: T;
  count: number;
  childCount: number;
  unitLabel: string;
  isSelected: boolean;
  pickedDescendantCount: number;
  onToggle: () => void;
  onDrillDown: () => void;
}) {
  const hasActiveChild = !isSelected && pickedDescendantCount > 0;

  if (childCount === 0) {
    return (
      <button
        type="button"
        className={`sk-fs-chip ${isSelected ? SELECTED_CHIP_CLASS : ''}`}
        aria-pressed={isSelected}
        onClick={onToggle}
      >
        {cat.name}
        <small>
          {count.toLocaleString('vi-VN')} {unitLabel}
        </small>
      </button>
    );
  }

  return (
    <div
      className={`sk-fs-chip !flex !flex-row items-center justify-between gap-2 !pr-2 ${
        isSelected || hasActiveChild ? SELECTED_CHIP_CLASS : ''
      }`}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onToggle}
        className="flex flex-col items-start text-left cursor-pointer"
      >
        <span>{cat.name}</span>
        <small>
          {count.toLocaleString('vi-VN')} {unitLabel}
          {hasActiveChild ? ` · Đã chọn ${pickedDescendantCount} mục con` : ''}
        </small>
      </button>
      <button
        type="button"
        onClick={onDrillDown}
        title={`Mở rộng ${childCount} chuyên mục con của ${cat.name}`}
        aria-label={`Mở rộng ${cat.name}`}
        className="grid size-7 shrink-0 place-items-center rounded-lg border border-[#E2D5B8] bg-white/80 text-[#7A1F24] transition hover:border-[#7A1F24] hover:bg-[#FAF6EA] cursor-pointer"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

/**
 * Component Bộ lọc Chuyên mục chuẩn dùng chung cho toàn bộ trang công khai HISGO
 * (/bai-viet, /dong-thoi-gian, /giai-doan/[slug]):
 * - Hàng trên: Chọn đơn 1 Chuyên mục gốc.
 * - Khung dưới: Duy nhất 1 khung "Chuyên mục con" cố định (chọn nhiều mục con + nút › chuyển cấp sâu kèm Breadcrumb).
 */
export function CategoryHierarchyFilterSection<
  S extends CategorySelectionState,
  T extends CategoryHierarchyNode,
>({
  draft,
  setDraft,
  categories,
  branchCategoryCounts,
  rootUnitLabel = 'bài viết',
  subUnitLabel = 'bài',
  hideZeroRoots = false,
}: {
  draft: S;
  setDraft: (update: (d: S) => S) => void;
  categories: T[];
  branchCategoryCounts: Map<string, number>;
  rootUnitLabel?: string;
  subUnitLabel?: string;
  hideZeroRoots?: boolean;
}) {
  const [drillParentId, setDrillParentId] = useState<string | null>(null);

  const rootCategories = categories.filter(
    (c) => !c.parentId && (!hideZeroRoots || (branchCategoryCounts.get(c.id) ?? 0) > 0),
  );
  const childrenByParent = new Map<string, T[]>();
  for (const c of categories) {
    if (!c.parentId) continue;
    if (hideZeroRoots && (branchCategoryCounts.get(c.id) ?? 0) === 0) continue;
    const list = childrenByParent.get(c.parentId) ?? [];
    list.push(c);
    childrenByParent.set(c.parentId, list);
  }

  const drillLineage = collectCategoryNodeLineage(drillParentId, categories);
  const validFocusParentId =
    draft.rootCategoryId &&
    drillParentId &&
    drillLineage[0]?.id === draft.rootCategoryId &&
    (childrenByParent.get(drillParentId)?.length ?? 0) > 0
      ? drillParentId
      : draft.rootCategoryId;

  const activeSubCategories = validFocusParentId ? (childrenByParent.get(validFocusParentId) ?? []) : [];
  const activeLineage = collectCategoryNodeLineage(validFocusParentId, categories);
  const hasDeeperChildrenInPanel = activeSubCategories.some(
    (sub) => (childrenByParent.get(sub.id)?.length ?? 0) > 0,
  );
  const pickedSubCount = getDeepestCategoryIds(draft.subCategoryIds, categories).length;

  const handleClickRoot = (rootId: string) => {
    setDrillParentId(null);
    setDraft((d) => selectSingleRootCategory(d, rootId));
  };

  return (
    <FilterSection
      card
      title="Chuyên mục"
      aside={<PickedCount count={draft.rootCategoryId ? 1 : 0} />}
    >
      <div className="sk-fs-chips">
        {rootCategories.map((cat) => {
          const isSelected = draft.rootCategoryId === cat.id;
          const count = branchCategoryCounts.get(cat.id) ?? 0;
          return (
            <button
              key={cat.id}
              type="button"
              className={`sk-fs-chip ${isSelected ? SELECTED_CHIP_CLASS : ''}`}
              aria-pressed={isSelected}
              onClick={() => handleClickRoot(cat.id)}
            >
              {cat.name}
              <small>
                {count.toLocaleString('vi-VN')} {rootUnitLabel}
              </small>
            </button>
          );
        })}
      </div>

      {activeSubCategories.length > 0 && (
        <div className="mt-4 border-t border-[#E2D5B8]/80 pt-3.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-bold text-[#2D1A10]">Chuyên mục con</h4>
            <PickedCount count={pickedSubCount} />
          </div>

          <p className="mt-0.5 text-xs text-[#7A6B57]">
            {hasDeeperChildrenInPanel
              ? 'Chọn chuyên mục hoặc bấm › để mở rộng xem cấp tiếp theo'
              : 'Chọn một hoặc nhiều chuyên mục con để thu hẹp kết quả (bỏ trống sẽ lấy toàn bộ nhánh trên)'}
          </p>

          <SubCategoryBreadcrumb
            lineage={activeLineage}
            onStepTo={(parentId) => setDrillParentId(parentId)}
          />

          <div className="sk-fs-chips mt-3">
            {activeSubCategories.map((sub) => {
              const count = branchCategoryCounts.get(sub.id) ?? 0;
              const childCount = childrenByParent.get(sub.id)?.length ?? 0;
              const isSelected = draft.subCategoryIds.includes(sub.id);
              const pickedDesc = countPickedSubtreeDescendants(sub.id, draft.subCategoryIds, categories);
              return (
                <SubCategoryCardItem
                  key={sub.id}
                  cat={sub}
                  count={count}
                  childCount={childCount}
                  unitLabel={subUnitLabel}
                  isSelected={isSelected}
                  pickedDescendantCount={pickedDesc}
                  onToggle={() => setDraft((d) => toggleSubCategoryNode(d, sub.id, categories))}
                  onDrillDown={() => setDrillParentId(sub.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </FilterSection>
  );
}
