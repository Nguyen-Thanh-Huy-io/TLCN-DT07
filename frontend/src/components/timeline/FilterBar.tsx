"use client";

import { Bookmark, LayoutList, Search, X } from "lucide-react";
import { Button, Input, Select } from "./sk-ui";
import type { Era, TimelineEvent } from "./sk-types";

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
  era,
  onEra,
  sub,
  onSub,
  category,
  onCategory,
  compact,
  onCompact,
  bookmarksOnly,
  onBookmarksOnly,
  savedCount,
  eras,
  subs,
  categories,
  region,
  onRegion,
  regions,
}: {
  query: string;
  onQuery: (v: string) => void;
  era: string;
  onEra: (v: string) => void;
  sub: string;
  onSub: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  compact: boolean;
  onCompact: () => void;
  bookmarksOnly: boolean;
  onBookmarksOnly: () => void;
  savedCount: number;
  eras: Era[];
  subs: Era["subEras"];
  categories: string[];
  region: string;
  onRegion: (v: string) => void;
  regions: string[];
}) {
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
      <Select
        label="Thời kỳ"
        value={era}
        onChange={(v) => {
          onEra(v);
          onSub("");
        }}
      >
        <option value="">Tất cả thời kỳ</option>
        {eras.map((e) => (
          <option value={e.id} key={e.id}>
            {e.title}
          </option>
        ))}
      </Select>
      <Select label="Giai đoạn" value={sub} onChange={onSub}>
        <option value="">Giai đoạn</option>
        {subs.filter((s) => !era || s.eraId === era).map((s) => (
          <option value={s.id} key={s.id}>
            {s.title}
          </option>
        ))}
      </Select>
      <Select label="Danh mục" value={category} onChange={onCategory}>
        <option value="">Danh mục</option>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
      <Select label="Quốc gia / khu vực" value={region} onChange={onRegion}>
        <option value="">Tất cả quốc gia / khu vực</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
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
    </div>
  );
}
