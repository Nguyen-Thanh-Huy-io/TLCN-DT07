'use client';

import { useRegionOrder } from '@/features/taxonomy/usePublicTaxonomy';
import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ChipGroup, FilterDialog, FilterSection, PickedCount, toggleValue, type ChipOption } from '@/components/filters/ChipFilter';
import { LOCATION_TYPE_LABELS, LocationType } from '@/constants/enums';
import { shortPeriodName } from '@/features/search/search-index';
import type { PublicPeriodDto } from '@/services/entities/landing.service';
import { sortedRegions } from '@/utils/region.utils';
import {
  DIGITAL_FEATURE_LABELS,
  PRESERVATION_LABELS,
  RANK_SHORT_LABELS,
  type DigitalFeature,
  type HeritageRank,
  type HistoricalHeritage,
  type PreservationCategory,
} from '../heritage.types';
import { Input, cn } from '../ui';

/** Mỗi nhóm chọn nhiều (OR trong nhóm, AND giữa các nhóm); riêng "Trải nghiệm số" là AND: phải có đủ. */
export interface HeritageFilters {
  query: string;
  eras: string[];
  subEras: string[];
  figures: string[];
  events: string[];
  regions: string[];
  localities: string[];
  ranks: string[];
  types: string[];
  preservation: string[];
  digital: string[];
}

export const EMPTY_HERITAGE_FILTERS: HeritageFilters = {
  query: '',
  eras: [],
  subEras: [],
  figures: [],
  events: [],
  regions: [],
  localities: [],
  ranks: [],
  types: [],
  preservation: [],
  digital: [],
};

export enum HeritageFacetKey {
  ERAS = 'eras',
  SUB_ERAS = 'subEras',
  FIGURES = 'figures',
  EVENTS = 'events',
  REGIONS = 'regions',
  LOCALITIES = 'localities',
  RANKS = 'ranks',
  TYPES = 'types',
  PRESERVATION = 'preservation',
  DIGITAL = 'digital',
}

type FacetKey = HeritageFacetKey | Exclude<keyof HeritageFilters, 'query'>;
const FACET_KEYS: FacetKey[] = Object.values(HeritageFacetKey);
const RANK_ORDER: HeritageRank[] = ['UNESCO', 'INTERNATIONAL', 'SPECIAL_NATIONAL', 'NATIONAL', 'PROVINCIAL', 'UNRANKED'];

export const heritageFilterCount = (f: HeritageFilters) => FACET_KEYS.reduce((n, k) => n + f[k].length, 0);

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

const anyOf = (picked: string[], values: string[]) => picked.length === 0 || picked.some((p) => values.includes(p));

/**
 * Lọc di tích. Từ khóa tìm trong tên hiện tại, tên cổ, địa phương, loại hình,
 * nhân vật và sự kiện gắn liền, cùng các hạng mục / hiện vật bên trong (khi đã có).
 */
export function matchesHeritage(h: HistoricalHeritage, f: HeritageFilters): boolean {
  const facets = h.facets;
  if (!anyOf(f.eras, facets?.eraIds ?? [])) return false;
  // Giai đoạn con chỉ thu hẹp thêm: chọn giai đoạn nào thì di tích phải thuộc một trong số đó.
  if (!anyOf(f.subEras, facets?.subEraIds ?? [])) return false;
  if (!anyOf(f.figures, facets?.figures.map((x) => x.id) ?? [])) return false;
  if (!anyOf(f.events, facets?.events.map((x) => x.id) ?? [])) return false;
  if (!anyOf(f.regions, [h.region])) return false;
  if (!anyOf(f.localities, [h.province])) return false;
  if (!anyOf(f.ranks, [h.rank])) return false;
  if (!anyOf(f.types, [h.siteType ?? LocationType.OTHER])) return false;
  if (!anyOf(f.preservation, facets?.preservation ? [facets.preservation] : [])) return false;
  if (f.digital.some((d) => !(facets?.digital ?? []).includes(d as DigitalFeature))) return false;

  const q = normalize(f.query.trim());
  if (!q) return true;
  return normalize(
    [
      h.name,
      ...h.ancientNames,
      h.province,
      h.siteTypeLabel ?? '',
      ...(facets?.figures.map((x) => x.name) ?? []),
      ...(facets?.events.map((x) => x.title) ?? []),
      ...h.subStructures.map((s) => s.name),
    ].join(' '),
  ).includes(q);
}

interface FacetOptions {
  eras: ChipOption[];
  subErasByEra: Map<string, ChipOption[]>;
  figures: ChipOption[];
  events: ChipOption[];
  regions: ChipOption[];
  localitiesByRegion: Map<string, ChipOption[]>;
  ranks: ChipOption[];
  types: ChipOption[];
  preservation: ChipOption[];
  digital: ChipOption[];
}

/** Chỉ đưa vào bộ lọc những giá trị thực sự có trong dữ liệu, kèm số di tích. */
function buildOptions(items: HistoricalHeritage[], periods: PublicPeriodDto[], regionOrder?: readonly string[]): FacetOptions {
  const count = (pick: (h: HistoricalHeritage) => boolean) => `${items.filter(pick).length} di tích`;
  const periodById = new Map(periods.map((p) => [p.id, p]));
  const byStart = (a: PublicPeriodDto, b: PublicPeriodDto) => (a.startYear ?? 0) - (b.startYear ?? 0);

  const eraIds = new Set(items.flatMap((h) => h.facets?.eraIds ?? []));
  const subIds = new Set(items.flatMap((h) => h.facets?.subEraIds ?? []));
  const subErasByEra = new Map<string, ChipOption[]>();
  for (const sub of periods.filter((p) => subIds.has(p.id)).sort(byStart)) {
    if (!sub.parentId) continue;
    const list = subErasByEra.get(sub.parentId) ?? [];
    list.push({ value: sub.id, label: shortPeriodName(sub.name), hint: count((h) => h.facets?.subEraIds.includes(sub.id) ?? false) });
    subErasByEra.set(sub.parentId, list);
  }

  const figures = new Map<string, string>();
  const events = new Map<string, string>();
  for (const h of items) {
    for (const f of h.facets?.figures ?? []) figures.set(f.id, f.name);
    for (const e of h.facets?.events ?? []) events.set(e.id, e.title);
  }

  const localitiesByRegion = new Map<string, ChipOption[]>();
  for (const region of new Set(items.map((h) => h.region))) {
    const names = [...new Set(items.filter((h) => h.region === region).map((h) => h.province))].sort((a, b) => a.localeCompare(b, 'vi'));
    localitiesByRegion.set(
      region,
      names.map((n) => ({ value: n, label: n, hint: count((h) => h.province === n) })),
    );
  }

  const present = <T extends string>(values: T[]) => [...new Set(values)];
  return {
    eras: periods
      .filter((p) => eraIds.has(p.id))
      .sort(byStart)
      .map((p) => ({ value: p.id, label: shortPeriodName(p.name), hint: p.timeLabel })),
    subErasByEra,
    figures: [...figures]
      .map(([id, name]) => ({ value: id, label: name, hint: count((h) => h.facets?.figures.some((f) => f.id === id) ?? false) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    events: [...events].map(([id, title]) => ({ value: id, label: title })),
    regions: sortedRegions(
      items.map((h) => h.region),
      regionOrder,
    ).map((r) => ({ value: r, label: r, hint: count((h) => h.region === r) })),
    localitiesByRegion,
    ranks: RANK_ORDER.filter((r) => items.some((h) => h.rank === r)).map((r) => ({
      value: r,
      label: RANK_SHORT_LABELS[r],
      hint: count((h) => h.rank === r),
    })),
    types: present(items.map((h) => h.siteType ?? LocationType.OTHER)).map((t) => ({
      value: t,
      label: LOCATION_TYPE_LABELS[t as LocationType] ?? t,
      hint: count((h) => (h.siteType ?? LocationType.OTHER) === t),
    })),
    // Luôn đúng 5 nhóm cố định, kể cả nhóm chưa có di tích (hiện số 0).
    preservation: (Object.keys(PRESERVATION_LABELS) as PreservationCategory[]).map((p) => ({
      value: p,
      label: PRESERVATION_LABELS[p],
      hint: count((h) => h.facets?.preservation === p),
    })),
    digital: (Object.keys(DIGITAL_FEATURE_LABELS) as DigitalFeature[]).map((d) => ({
      value: d,
      label: DIGITAL_FEATURE_LABELS[d],
      hint: count((h) => h.facets?.digital.includes(d) ?? false),
    })),
  };
}

const GROUP_TITLES: Record<FacetKey, string> = {
  eras: 'Thời kỳ',
  subEras: 'Triều đại / giai đoạn',
  figures: 'Nhân vật',
  events: 'Sự kiện',
  regions: 'Khu vực',
  localities: 'Địa phương',
  ranks: 'Xếp hạng',
  types: 'Loại hình',
  preservation: 'Hiện trạng',
  digital: 'Trải nghiệm số',
};

export function HeritageFilterBar({
  filters,
  onChange,
  heritages,
  periods,
  resultCount,
}: {
  filters: HeritageFilters;
  onChange: (f: HeritageFilters) => void;
  heritages: HistoricalHeritage[];
  periods: PublicPeriodDto[];
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const regionOrder = useRegionOrder();
  const options = useMemo(() => buildOptions(heritages, periods, regionOrder), [heritages, periods, regionOrder]);

  const labelOf = (key: FacetKey, value: string): string => {
    if (key === HeritageFacetKey.SUB_ERAS) return [...options.subErasByEra.values()].flat().find((o) => o.value === value)?.label ?? value;
    if (key === HeritageFacetKey.LOCALITIES) return value;
    const list = options[key as Exclude<FacetKey, 'subEras' | 'localities'>] as ChipOption[];
    return list.find((o) => o.value === value)?.label ?? value;
  };
  const chips = FACET_KEYS.flatMap((key) => filters[key].map((value) => ({ key, value, label: labelOf(key, value) })));
  const active = heritageFilterCount(filters);

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)] p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--hx-muted)]" />
          <Input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Tìm tên di tích, tên cổ, nhân vật, sự kiện, địa phương..."
            aria-label="Tìm kiếm di tích"
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors',
            active ? 'border-[var(--hx-primary)] text-[var(--hx-primary)]' : 'border-[var(--hx-line)] text-[var(--hx-ink)] hover:border-[var(--hx-primary)]',
          )}
        >
          <SlidersHorizontal className="size-4" /> Bộ lọc
          {active > 0 && <span className="rounded-full bg-[var(--hx-primary)] px-2 py-0.5 text-[11px] text-white">{active}</span>}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() => onChange({ ...filters, [c.key]: filters[c.key].filter((v) => v !== c.value) })}
              aria-label={`Bỏ lọc ${c.label}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hx-primary)]/40 bg-[var(--hx-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--hx-primary)]"
            >
              <span className="opacity-60">{GROUP_TITLES[c.key]}:</span> {c.label}
              <X className="size-3" />
            </button>
          ))}
          {chips.length > 1 && (
            <button type="button" onClick={() => onChange({ ...EMPTY_HERITAGE_FILTERS, query: filters.query })} className="px-2 text-xs text-[var(--hx-muted)] underline">
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--hx-muted)]">
        <strong className="text-[var(--hx-ink)]">{resultCount}</strong> di tích phù hợp
      </p>

      <FilterDialog
        open={open}
        value={filters}
        empty={{ ...EMPTY_HERITAGE_FILTERS, query: filters.query }}
        countFor={(draft) => heritages.filter((h) => matchesHeritage(h, draft)).length}
        onApply={(f) => {
          onChange(f);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      >
        {(draft, setDraft) => {
          const toggle = (key: FacetKey, v: string) =>
            setDraft((d) => {
              const next = { ...d, [key]: toggleValue(d[key], v) };
              // Bỏ thời kỳ thì bỏ luôn các giai đoạn con của nó; bỏ khu vực thì bỏ địa phương thuộc khu vực đó.
              if (key === HeritageFacetKey.ERAS && !next.eras.includes(v)) {
                const subs = new Set((options.subErasByEra.get(v) ?? []).map((o) => o.value));
                next.subEras = next.subEras.filter((s) => !subs.has(s));
              }
              if (key === HeritageFacetKey.REGIONS && !next.regions.includes(v)) {
                const locs = new Set((options.localitiesByRegion.get(v) ?? []).map((o) => o.value));
                next.localities = next.localities.filter((l) => !locs.has(l));
              }
              return next;
            });
          const group = (key: Exclude<FacetKey, 'subEras' | 'localities'>, title: string, search: string, card = false) =>
            options[key].length > 0 && (
              <FilterSection title={title} card={card} aside={<PickedCount count={draft[key].length} />}>
                <ChipGroup options={options[key]} selected={draft[key]} onToggle={(v) => toggle(key, v)} searchLabel={search} />
              </FilterSection>
            );

          return (
            <>
              {options.eras.length > 0 && (
                <FilterSection card title="Thời kỳ & Triều đại" aside={<PickedCount count={draft.eras.length + draft.subEras.length} />}>
                  <ChipGroup options={options.eras} selected={draft.eras} onToggle={(v) => toggle('eras', v)} searchLabel="Tìm thời kỳ..." />
                  {/* Chọn thời kỳ nào thì hiện triều đại / giai đoạn con của thời kỳ đó để lọc sâu. */}
                  {draft.eras.map((eraId) => {
                    const subs = options.subErasByEra.get(eraId) ?? [];
                    if (subs.length === 0) return null;
                    return (
                      <div key={eraId}>
                        <div className="sk-fs-sublabel">Triều đại / giai đoạn · {options.eras.find((e) => e.value === eraId)?.label}</div>
                        <ChipGroup options={subs} selected={draft.subEras} onToggle={(v) => toggle('subEras', v)} searchLabel="Tìm triều đại / giai đoạn..." />
                      </div>
                    );
                  })}
                </FilterSection>
              )}
              {group('figures', 'Nhân vật lịch sử gắn liền', 'Tìm nhân vật...')}
              {group('events', 'Sự kiện / Chiến dịch', 'Tìm sự kiện...')}
              {options.regions.length > 0 && (
                <FilterSection card title="Quốc gia / khu vực & Địa phương" aside={<PickedCount count={draft.regions.length + draft.localities.length} />}>
                  <ChipGroup options={options.regions} selected={draft.regions} onToggle={(v) => toggle('regions', v)} searchLabel="Tìm khu vực..." />
                  {draft.regions.map((region) => {
                    const locs = options.localitiesByRegion.get(region) ?? [];
                    if (locs.length < 2) return null;
                    return (
                      <div key={region}>
                        <div className="sk-fs-sublabel">Địa phương · {region}</div>
                        <ChipGroup options={locs} selected={draft.localities} onToggle={(v) => toggle('localities', v)} searchLabel="Tìm địa phương..." />
                      </div>
                    );
                  })}
                </FilterSection>
              )}
              {group('ranks', 'Cấp độ xếp hạng', 'Tìm xếp hạng...')}
              {group('types', 'Loại hình di tích', 'Tìm loại hình...')}
              {(options.preservation.length > 0 || options.digital.length > 0) && (
                <FilterSection title="Hiện trạng & Trải nghiệm số" aside={<PickedCount count={draft.preservation.length + draft.digital.length} />}>
                  {options.preservation.length > 0 && (
                    <>
                      <div className="sk-fs-sublabel">Hiện trạng bảo tồn</div>
                      <ChipGroup options={options.preservation} selected={draft.preservation} onToggle={(v) => toggle('preservation', v)} searchLabel="Tìm hiện trạng..." />
                    </>
                  )}
                  <div className="sk-fs-sublabel">Trải nghiệm số (phải có đủ các mục đã chọn)</div>
                  <ChipGroup options={options.digital} selected={draft.digital} onToggle={(v) => toggle('digital', v)} searchLabel="Tìm..." />
                </FilterSection>
              )}
            </>
          );
        }}
      </FilterDialog>
    </div>
  );
}
