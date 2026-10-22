"use client";

import { ArrowDownUp, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Input } from "@/components/timeline/sk-ui";

export type FigureSort = "time" | "name";

export interface FilterOption {
  id: string;
  title: string;
}

/** Mỗi nhóm chọn nhiều; mảng rỗng = không lọc theo nhóm đó. */
export interface FigureFilters {
  regions: string[];
  eras: string[];
  subs: string[];
  roles: string[];
}

export const EMPTY_FIGURE_FILTERS: FigureFilters = { regions: [], eras: [], subs: [], roles: [] };

export function figureFilterCount(f: FigureFilters): number {
  return f.regions.length + f.eras.length + f.subs.length + f.roles.length;
}

const SORT_LABELS: Record<FigureSort, string> = { time: "Theo thời gian", name: "Theo tên A–Z" };

export function FiguresFilterBar({
  query,
  onQuery,
  filters,
  onFilters,
  onOpenSheet,
  chips,
  sort,
  onSort,
}: {
  query: string;
  onQuery: (v: string) => void;
  filters: FigureFilters;
  onFilters: (f: FigureFilters) => void;
  onOpenSheet: () => void;
  /** Bộ lọc đang bật, hiển thị thành chip có nút xóa. */
  chips: Array<{ key: keyof FigureFilters; value: string; label: string }>;
  sort: FigureSort;
  onSort: (v: FigureSort) => void;
}) {
  const count = figureFilterCount(filters);
  const remove = (key: keyof FigureFilters, value: string) => {
    const next = { ...filters, [key]: filters[key].filter((v) => v !== value) };
    onFilters(next);
  };

  return (
    <div className="sk-filter-bar sk-figures-filter">
      <div className="sk-search-field">
        <Search size={17} />
        <Input
          aria-label="Tìm nhân vật, tên gọi khác hoặc sự kiện"
          placeholder="Tìm tên, tên gọi khác, sự kiện..."
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
      {/* Sắp xếp là cách hiển thị, không phải bộ lọc nên để ngoài. */}
      <div className="sk-split-segment sk-figure-sort" role="group" aria-label="Sắp xếp nhân vật">
        <ArrowDownUp size={13} />
        {(Object.keys(SORT_LABELS) as FigureSort[]).map((s) => (
          <button key={s} type="button" className={sort === s ? "sk-selected" : ""} aria-pressed={sort === s} onClick={() => onSort(s)}>
            {SORT_LABELS[s]}
          </button>
        ))}
      </div>
      {chips.length > 0 && (
        <div className="sk-active-filters">
          {chips.map((c) => (
            <button key={`${c.key}-${c.value}`} type="button" onClick={() => remove(c.key, c.value)} aria-label={`Bỏ lọc ${c.label}`}>
              {c.label}
              <X size={13} />
            </button>
          ))}
          {chips.length > 1 && (
            <button type="button" className="sk-active-clear" onClick={() => onFilters(EMPTY_FIGURE_FILTERS)}>
              Xóa tất cả
            </button>
          )}
        </div>
      )}
    </div>
  );
}
