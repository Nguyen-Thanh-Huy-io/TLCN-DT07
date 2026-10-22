"use client";

import { ArrowDownUp, Search, X } from "lucide-react";
import { Button, Input, Select } from "@/components/timeline/sk-ui";

export type FigureSort = "time" | "name";

export interface FilterOption {
  id: string;
  title: string;
}

export function FiguresFilterBar({
  query,
  onQuery,
  era,
  onEra,
  subEra,
  onSubEra,
  sort,
  onSort,
  eras,
  subEras,
}: {
  query: string;
  onQuery: (v: string) => void;
  era: string;
  onEra: (v: string) => void;
  subEra: string;
  onSubEra: (v: string) => void;
  sort: FigureSort;
  onSort: (v: FigureSort) => void;
  eras: FilterOption[];
  subEras: Array<FilterOption & { eraId: string | null }>;
}) {
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
      <Select
        label="Thời kỳ của nhân vật"
        value={era}
        onChange={(v) => {
          onEra(v);
          onSubEra("");
        }}
      >
        <option value="">Tất cả thời kỳ</option>
        {eras.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title}
          </option>
        ))}
      </Select>
      <Select label="Giai đoạn của nhân vật" value={subEra} onChange={onSubEra}>
        <option value="">Tất cả giai đoạn</option>
        {subEras
          .filter((s) => !era || s.eraId === era)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
      </Select>
      <span className="sk-filter-divider" />
      <div className="sk-figure-sort">
        <ArrowDownUp size={14} />
        <Select label="Sắp xếp nhân vật" value={sort} onChange={(v) => onSort(v as FigureSort)}>
          <option value="time">Theo thời gian</option>
          <option value="name">Theo tên A–Z</option>
        </Select>
      </div>
    </div>
  );
}
