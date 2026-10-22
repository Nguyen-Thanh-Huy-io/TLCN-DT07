"use client";

import { Bookmark, LayoutList, Search, X } from "lucide-react";
import { Button, Input, Select } from "./sk-ui";
import type { Era } from "./sk-types";

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
