"use client";

import { Bookmark, LayoutList, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Input } from "./sk-ui";
import type { Era, TimelineEvent } from "./sk-types";
import { sortedRegions } from "@/utils/region.utils";

/** Mỗi nhóm cho chọn nhiều giá trị; mảng rỗng = không lọc theo nhóm đó. */
export interface TimelineFilters {
  eras: string[];
  subs: string[];
  categories: string[];
  regions: string[];
}

export const EMPTY_FILTERS: TimelineFilters = { eras: [], subs: [], categories: [], regions: [] };

export function activeFilterCount(filters: TimelineFilters): number {
  return filters.eras.length + filters.subs.length + filters.categories.length + filters.regions.length;
}

/** Bỏ một giá trị khỏi nhóm; bỏ thời kỳ thì bỏ luôn các giai đoạn thuộc thời kỳ đó. */
export function withoutValue(filters: TimelineFilters, key: keyof TimelineFilters, value: string, eras: Era[]): TimelineFilters {
  const next = { ...filters, [key]: filters[key].filter((v) => v !== value) };
  if (key === "eras") {
    const dropped = new Set(eras.find((e) => e.id === value)?.subEras.map((s) => s.id));
    next.subs = next.subs.filter((s) => !dropped.has(s));
  }
  return next;
}

/** Quốc gia / khu vực thực sự có dấu mốc (theo Period.region), theo thứ tự chuẩn dùng chung. */
export function regionOptions(events: TimelineEvent[], order?: readonly string[]): string[] {
  return sortedRegions(
    events.map((ev) => ev.region),
    order,
  );
}

/** [] = tất cả quốc gia / khu vực. */
export function matchesRegion(event: TimelineEvent, regions: string[]): boolean {
  return regions.length === 0 || regions.includes(event.region);
}

export function FilterBar({
  query,
  onQuery,
  filters,
  onFilters,
  onOpenSheet,
  eras,
  subs,
  compact,
  onCompact,
  bookmarksOnly,
  onBookmarksOnly,
  savedCount,
}: {
  query: string;
  onQuery: (v: string) => void;
  filters: TimelineFilters;
  onFilters: (f: TimelineFilters) => void;
  onOpenSheet: () => void;
  eras: Era[];
  subs: Era["subEras"];
  compact: boolean;
  onCompact: () => void;
  bookmarksOnly: boolean;
  onBookmarksOnly: () => void;
  savedCount: number;
}) {
  const count = activeFilterCount(filters);
  // Bộ lọc đang bật hiển thị thành chip có nút xóa, để không phải mở lại hộp thoại.
  const chips: Array<{ key: keyof TimelineFilters; value: string; label: string }> = [
    ...filters.regions.map((v) => ({ key: "regions" as const, value: v, label: v })),
    ...filters.eras.map((v) => ({ key: "eras" as const, value: v, label: eras.find((e) => e.id === v)?.title ?? "Thời kỳ" })),
    ...filters.subs.map((v) => ({ key: "subs" as const, value: v, label: subs.find((s) => s.id === v)?.title ?? "Giai đoạn" })),
    ...filters.categories.map((v) => ({ key: "categories" as const, value: v, label: v })),
  ];

  return (
    <div className="sk-filter-bar">
      <div className="sk-search-field">
        <Search size={18} />
        <Input
          aria-label="Tìm kiếm lịch sử"
          placeholder="Tìm sự kiện, nhân vật, địa danh..."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <Button aria-label="Xóa tìm kiếm" onClick={() => onQuery("")}>
            <X size={14} />
          </Button>
        )}
      </div>
      <Button className={`sk-filter-open ${count ? "sk-is-on" : ""}`} onClick={onOpenSheet} aria-haspopup="dialog">
        <SlidersHorizontal size={16} />
        <span>Bộ lọc</span>
        {count > 0 && <span className="sk-badge">{count}</span>}
      </Button>
      <span className="sk-filter-divider" />
      <Button className={`sk-saved-button ${bookmarksOnly ? "sk-is-on" : ""}`} onClick={onBookmarksOnly}>
        <Bookmark size={15} fill={bookmarksOnly ? "currentColor" : "none"} />
        <span>Đã lưu</span>
        {savedCount > 0 && <span className="sk-badge">{savedCount}</span>}
      </Button>
      <Button className={`sk-compact-button ${compact ? "sk-is-on" : ""}`} onClick={onCompact}>
        <LayoutList size={17} />
        <span>Thu gọn</span>
        <span className={`sk-switch ${compact ? "sk-on" : ""}`} />
      </Button>
      {chips.length > 0 && (
        <div className="sk-active-filters">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() => onFilters(withoutValue(filters, c.key, c.value, eras))}
              aria-label={`Bỏ lọc ${c.label}`}
            >
              {c.label}
              <X size={13} />
            </button>
          ))}
          {chips.length > 1 && (
            <button type="button" className="sk-active-clear" onClick={() => onFilters(EMPTY_FILTERS)}>
              Xóa tất cả
            </button>
          )}
        </div>
      )}
    </div>
  );
}
