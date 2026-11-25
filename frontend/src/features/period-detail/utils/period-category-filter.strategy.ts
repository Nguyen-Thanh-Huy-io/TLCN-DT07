import type { TreeSelectNode } from '@/components/common/TreeSelectModal';
import type { PublicEventSummaryDto } from '@/services/entities/landing.service';
import {
  SYSTEM_CATEGORY_ROOT_SLUGS,
  categoryKeyLabel,
  eventCategoryKey,
  findRootCategory,
  type EventCategoryItem,
} from '@/services/public/public-content.service';

export const ALL_ROOT_FILTER_KEY = 'ALL';

const ROOT_SHORT_LABELS: Record<string, string> = {
  [SYSTEM_CATEGORY_ROOT_SLUGS.EVENT]: 'Sự kiện',
  [SYSTEM_CATEGORY_ROOT_SLUGS.PERSON]: 'Nhân vật',
  [SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION]: 'Di tích',
  [SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY]: 'Triều đại',
  [SYSTEM_CATEGORY_ROOT_SLUGS.DOCUMENT]: 'Tác phẩm & Tư liệu',
};

const ROOT_DISPLAY_PRIORITY: readonly string[] = [
  SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
  SYSTEM_CATEGORY_ROOT_SLUGS.PERSON,
  SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION,
  SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY,
  SYSTEM_CATEGORY_ROOT_SLUGS.DOCUMENT,
];

export interface ResolvedEventCategory {
  rootId: string;
  rootSlug: string;
  rootLabel: string;
  leafId: string;
  leafLabel: string;
  isDirectRoot: boolean;
}

export interface RootCategoryFacet {
  rootId: string;
  rootSlug: string;
  label: string;
  count: number;
}

export interface SubCategoryFacet {
  id: string;
  label: string;
  count: number;
}

export interface PeriodCategoryTreeResult {
  roots: RootCategoryFacet[];
  subByRootSlug: Map<string, SubCategoryFacet[]>;
  treeNodes: TreeSelectNode[];
  labelById: Map<string, string>;
}

function findMatchedCategory(
  categories: EventCategoryItem[],
  event: PublicEventSummaryDto,
): EventCategoryItem | undefined {
  const primaryId = event.categoryIds?.[0];
  if (primaryId) {
    const byId = categories.find((c) => c.id === primaryId);
    if (byId) return byId;
  }
  const rawSlug = event.category?.trim();
  if (rawSlug) {
    const bySlug = categories.find(
      (c) => c.slug === rawSlug || c.id === rawSlug || c.name === rawSlug,
    );
    if (bySlug) return bySlug;
  }
  return undefined;
}

/**
 * Chuẩn hóa chuyên mục của một mục biên niên/bài viết về cặp (Chuyên mục gốc cấp 1, Chuyên mục con cấp 2).
 * Khử hoàn toàn tình trạng trùng nhãn "Sự kiện lịch sử" giữa node gốc và fallback.
 */
export function resolvePeriodEventCategory(
  categories: EventCategoryItem[],
  event: PublicEventSummaryDto,
): ResolvedEventCategory {
  const matched = findMatchedCategory(categories, event);
  if (matched) {
    const root = findRootCategory(categories, matched.id) ?? matched;
    const rootSlug = root.slug || SYSTEM_CATEGORY_ROOT_SLUGS.EVENT;
    const rootLabel = ROOT_SHORT_LABELS[rootSlug] ?? root.name;
    const isDirectRoot = matched.id === root.id;
    return {
      rootId: `root:${rootSlug}`,
      rootSlug,
      rootLabel,
      leafId: isDirectRoot ? `root-direct:${rootSlug}` : matched.id,
      leafLabel: isDirectRoot ? rootLabel : matched.name,
      isDirectRoot,
    };
  }

  const fallbackSlug =
    event.category && ROOT_SHORT_LABELS[event.category]
      ? event.category
      : SYSTEM_CATEGORY_ROOT_SLUGS.EVENT;
  const fallbackRootLabel = ROOT_SHORT_LABELS[fallbackSlug] ?? 'Sự kiện';
  const rawLabel = categoryKeyLabel(categories, eventCategoryKey(event));
  const isGenericEvent =
    !rawLabel ||
    rawLabel === 'Sự kiện' ||
    rawLabel === 'Sự kiện lịch sử' ||
    rawLabel === fallbackRootLabel;

  return {
    rootId: `root:${fallbackSlug}`,
    rootSlug: fallbackSlug,
    rootLabel: fallbackRootLabel,
    leafId: isGenericEvent ? `root-direct:${fallbackSlug}` : `label:${rawLabel}`,
    leafLabel: isGenericEvent ? fallbackRootLabel : rawLabel,
    isDirectRoot: isGenericEvent,
  };
}

/**
 * Xây dựng dữ liệu phân cấp 2 tầng:
 * 1. Hàng pill gốc cấp 1 (tối đa 5 nhánh chuẩn: Sự kiện, Nhân vật, Di tích, Triều đại, Tư liệu).
 * 2. Danh sách chuyên mục con theo từng nhánh gốc.
 * 3. Cây `TreeSelectNode[]` cho `TreeSelectModal` (chỉ hiển thị nhánh thực sự có bài trong thời kỳ).
 */
export function buildPeriodCategoryHierarchy(
  events: PublicEventSummaryDto[],
  categories: EventCategoryItem[],
): PeriodCategoryTreeResult {
  const rootMap = new Map<
    string,
    { rootId: string; rootSlug: string; label: string; count: number; directCount: number }
  >();
  const subCountsByRoot = new Map<string, Map<string, { id: string; label: string; count: number }>>();
  const labelById = new Map<string, string>();

  for (const event of events) {
    const resolved = resolvePeriodEventCategory(categories, event);
    const existingRoot = rootMap.get(resolved.rootSlug) ?? {
      rootId: resolved.rootId,
      rootSlug: resolved.rootSlug,
      label: resolved.rootLabel,
      count: 0,
      directCount: 0,
    };
    existingRoot.count += 1;
    if (resolved.isDirectRoot) {
      existingRoot.directCount += 1;
    } else {
      let subMap = subCountsByRoot.get(resolved.rootSlug);
      if (!subMap) {
        subMap = new Map();
        subCountsByRoot.set(resolved.rootSlug, subMap);
      }
      const existingSub = subMap.get(resolved.leafId) ?? {
        id: resolved.leafId,
        label: resolved.leafLabel,
        count: 0,
      };
      existingSub.count += 1;
      subMap.set(resolved.leafId, existingSub);
      labelById.set(resolved.leafId, resolved.leafLabel);
    }
    rootMap.set(resolved.rootSlug, existingRoot);
    labelById.set(resolved.rootId, resolved.rootLabel);
    if (resolved.isDirectRoot) {
      labelById.set(resolved.leafId, `${resolved.rootLabel} (chung)`);
    }
  }

  const roots: RootCategoryFacet[] = [...rootMap.values()]
    .sort((a, b) => {
      const idxA = ROOT_DISPLAY_PRIORITY.indexOf(a.rootSlug);
      const idxB = ROOT_DISPLAY_PRIORITY.indexOf(b.rootSlug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.count - a.count;
    })
    .map(({ rootId, rootSlug, label, count }) => ({ rootId, rootSlug, label, count }));

  const subByRootSlug = new Map<string, SubCategoryFacet[]>();
  const treeNodes: TreeSelectNode[] = [];

  for (const root of roots) {
    const meta = rootMap.get(root.rootSlug)!;
    const rawSubs = [...(subCountsByRoot.get(root.rootSlug)?.values() ?? [])].sort(
      (a, b) => b.count - a.count,
    );
    subByRootSlug.set(root.rootSlug, rawSubs);

    const childNodes: TreeSelectNode[] = rawSubs.map((sub) => ({
      id: sub.id,
      label: `${sub.label} (${sub.count.toLocaleString('vi-VN')})`,
      selectable: true,
    }));

    if (meta.directCount > 0 && rawSubs.length > 0) {
      const directId = `root-direct:${root.rootSlug}`;
      childNodes.push({
        id: directId,
        label: `${root.label} chung (${meta.directCount.toLocaleString('vi-VN')})`,
        selectable: true,
      });
    }

    treeNodes.push({
      id: root.rootId,
      label: `${root.label} (${root.count.toLocaleString('vi-VN')})`,
      selectable: true,
      selectChildrenOnClick: childNodes.length > 0,
      ...(childNodes.length > 0 ? { children: childNodes } : {}),
    });
  }

  return { roots, subByRootSlug, treeNodes, labelById };
}

/**
 * Kiểm tra bài viết/mốc thời gian có khớp bộ lọc chuyên mục (gốc cấp 1 + danh sách node chọn chi tiết) hay không.
 */
export function matchesPeriodCategoryFilter(
  event: PublicEventSummaryDto,
  categories: EventCategoryItem[],
  activeRootSlug: string,
  selectedDetailIds: readonly string[],
): boolean {
  const resolved = resolvePeriodEventCategory(categories, event);

  if (selectedDetailIds.length > 0) {
    return (
      selectedDetailIds.includes(resolved.leafId) ||
      selectedDetailIds.includes(resolved.rootId)
    );
  }

  if (activeRootSlug !== ALL_ROOT_FILTER_KEY) {
    return resolved.rootSlug === activeRootSlug;
  }

  return true;
}
