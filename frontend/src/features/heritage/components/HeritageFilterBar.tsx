'use client';

import { RotateCcw, Search } from 'lucide-react';
import {
  CATEGORY_LABELS,
  REGION_LABELS,
  RANK_SHORT_LABELS,
  type HeritageCategory,
  type HeritageRank,
  type HeritageRegion,
  type HistoricalHeritage,
} from '../heritage.types';
import { Button, Input, Select, cn } from '../ui';

export const ALL = 'ALL';

export interface HeritageFilters {
  query: string;
  rank: HeritageRank | typeof ALL;
  category: HeritageCategory | typeof ALL;
  region: HeritageRegion | typeof ALL;
  province: string;
  era: string;
}

export const EMPTY_HERITAGE_FILTERS: HeritageFilters = { query: '', rank: ALL, category: ALL, region: ALL, province: ALL, era: ALL };

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

/** Tìm theo tên, tên cổ, tỉnh thành và tên hạng mục / bảo vật bên trong. */
export function matchesHeritage(h: HistoricalHeritage, f: HeritageFilters): boolean {
  if (f.rank !== ALL && h.rank !== f.rank) return false;
  if (f.category !== ALL && h.category !== f.category) return false;
  if (f.region !== ALL && h.region !== f.region) return false;
  if (f.province !== ALL && h.province !== f.province) return false;
  if (f.era !== ALL && h.foundedEra !== f.era) return false;
  const q = normalize(f.query.trim());
  if (!q) return true;
  return normalize([h.name, ...h.ancientNames, h.province, ...h.subStructures.map((s) => s.name)].join(' ')).includes(q);
}

const RANK_PILLS: Array<HeritageRank | typeof ALL> = [ALL, 'UNESCO', 'SPECIAL_NATIONAL', 'NATIONAL'];

export function HeritageFilterBar({
  filters,
  onChange,
  heritages,
  resultCount,
}: {
  filters: HeritageFilters;
  onChange: (f: HeritageFilters) => void;
  heritages: HistoricalHeritage[];
  resultCount: number;
}) {
  const set = (patch: Partial<HeritageFilters>) => onChange({ ...filters, ...patch });
  const provinces = [...new Set(heritages.filter((h) => filters.region === ALL || h.region === filters.region).map((h) => h.province))].sort(
    (a, b) => a.localeCompare(b, 'vi'),
  );
  const eras = [...new Set(heritages.map((h) => h.foundedEra))];
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_HERITAGE_FILTERS);

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)] p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--hx-muted)]" />
        <Input
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Tìm di tích, tên cổ, tỉnh thành hoặc bảo vật bên trong..."
          aria-label="Tìm kiếm di tích"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Cấp độ xếp hạng">
        {RANK_PILLS.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={filters.rank === r}
            onClick={() => set({ rank: r })}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              filters.rank === r
                ? 'border-[var(--hx-primary)] bg-[var(--hx-primary-soft)] text-[var(--hx-primary)]'
                : 'border-[var(--hx-line)] text-[var(--hx-muted)] hover:text-[var(--hx-ink)]',
            )}
          >
            {r === ALL ? 'Tất cả' : RANK_SHORT_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Loại hình"
          value={filters.category}
          onChange={(v) => set({ category: v })}
          options={[{ value: ALL, label: 'Mọi loại hình' }, ...(Object.keys(CATEGORY_LABELS) as HeritageCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
        />
        <Select
          label="Vùng miền"
          value={filters.region}
          onChange={(v) => set({ region: v, province: ALL })}
          options={[{ value: ALL, label: 'Cả 3 miền' }, ...(Object.keys(REGION_LABELS) as HeritageRegion[]).map((r) => ({ value: r, label: REGION_LABELS[r] }))]}
        />
        <Select
          label="Tỉnh thành"
          value={filters.province}
          onChange={(v) => set({ province: v })}
          options={[{ value: ALL, label: 'Mọi tỉnh thành' }, ...provinces.map((p) => ({ value: p, label: p }))]}
        />
        <Select
          label="Thời kỳ khởi dựng"
          value={filters.era}
          onChange={(v) => set({ era: v })}
          options={[{ value: ALL, label: 'Mọi thời kỳ khởi dựng' }, ...eras.map((e) => ({ value: e, label: e }))]}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--hx-muted)]">
        <span>
          <strong className="text-[var(--hx-ink)]">{resultCount}</strong> di tích phù hợp
        </span>
        {dirty && (
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => onChange(EMPTY_HERITAGE_FILTERS)}>
            <RotateCcw className="size-3.5" /> Đặt lại bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
