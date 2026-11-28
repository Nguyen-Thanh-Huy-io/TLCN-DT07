import type { PublicEventSummaryDto } from '@/services/entities/landing.service';
import {
  SYSTEM_CATEGORY_ROOT_SLUGS,
  categoryKeyLabel,
  eventCategoryKey,
  findRootCategory,
  type EventCategoryItem,
} from '@/services/public/public-content.service';

const ROOT_SHORT_LABELS: Record<string, string> = {
  [SYSTEM_CATEGORY_ROOT_SLUGS.EVENT]: 'Sự kiện',
  [SYSTEM_CATEGORY_ROOT_SLUGS.PERSON]: 'Nhân vật',
  [SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION]: 'Di tích',
  [SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY]: 'Triều đại',
  [SYSTEM_CATEGORY_ROOT_SLUGS.DOCUMENT]: 'Tác phẩm & Tư liệu',
};

export interface ResolvedEventCategory {
  rootId: string;
  rootSlug: string;
  rootLabel: string;
  leafId: string;
  leafLabel: string;
  isDirectRoot: boolean;
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
