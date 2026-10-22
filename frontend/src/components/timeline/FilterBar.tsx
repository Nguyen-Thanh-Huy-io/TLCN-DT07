"use client";

import { Bookmark, LayoutList, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Input } from "./sk-ui";
import type { Era, TimelineEvent } from "./sk-types";

export interface TimelineFilters {
  era: string;
  sub: string;
  category: string;
  region: string;
}

export const EMPTY_FILTERS: TimelineFilters = { era: "", sub: "", category: "", region: "" };

export function activeFilterCount(filters: TimelineFilters): number {
  return [filters.era, filters.sub, filters.category, filters.region].filter(Boolean).length;
}

/** Quốc gia / khu vực thực sự có dấu mốc (theo Period.region), xếp theo tên. */
export function regionOptions(events: TimelineEvent[]): string[] {
  return Array.from(new Set(events.map((ev) => ev.region))).sort((a, b) => a.localeCompare(b, "vi"));
}

/** "" = tất cả quốc gia / khu vực. */
export function matchesRegion(event: TimelineEvent, filter: string): boolean {
  return !filter || event.region === filter;
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
  const chips: Array<{ key: string; label: string; clear: Partial<TimelineFilters> }> = [];
  if (filters.region) chips.push({ key: "region", label: filters.region, clear: { region: "" } });
  if (filters.era)
    chips.push({ key: "era", label: eras.find((e) => e.id === filters.era)?.title ?? "Thời kỳ", clear: { era: "", sub: "" } });
  if (filters.sub)
    chips.push({ key: "sub", label: subs.find((s) => s.id === filters.sub)?.title ?? "Giai đoạn", clear: { sub: "" } });
  if (filters.category) chips.push({ key: "category", label: filters.category, clear: { category: "" } });

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
            <button key={c.key} type="button" onClick={() => onFilters({ ...filters, ...c.clear })} aria-label={`Bỏ lọc ${c.label}`}>
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
