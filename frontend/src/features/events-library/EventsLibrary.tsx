'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownUp, ArrowRight, History, MapPin, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import { ChipGroup, FilterDialog, FilterSection, PickedCount, toggleValue } from '@/components/filters/ChipFilter';
import { EVENT_CATEGORY_LABELS, EventCategory } from '@/constants/enums';
import { formatYear, normalizeSearch, shortPeriodName } from '@/features/search/search-index';
import type { PublicEventSummaryDto, PublicPeriodDto } from '@/services/entities/landing.service';
import { regionLabel, sortedRegions } from '@/utils/region.utils';
import type { TaxonomyTermItem } from '@/services/entities/taxonomy.service';
import { ancestorChain, flattenTree, loadPublicTaxonomy } from '@/features/taxonomy/taxonomy-tree';
import { useRegionOrder } from '@/features/taxonomy/usePublicTaxonomy';
import './events-library.css';

/** Giá trị "chưa gắn" dùng chung cho nhóm thời kỳ. */
const NO_PERIOD = '__none__';

const LINK_OPTIONS = {
  NO_PERIOD: 'Chưa gắn thời kỳ',
  NO_FIGURE: 'Chưa gắn nhân vật',
  NO_LOCATION: 'Chưa gắn địa danh',
} as const;
type LinkKey = keyof typeof LINK_OPTIONS;

export enum EventSortOption {
  YEAR_ASC = 'year-asc',
  YEAR_DESC = 'year-desc',
  NAME = 'name',
}
export type Sort = EventSortOption | 'year-asc' | 'year-desc' | 'name';
const SORT_LABELS: Record<EventSortOption, string> = {
  [EventSortOption.YEAR_ASC]: 'Cũ → mới',
  [EventSortOption.YEAR_DESC]: 'Mới → cũ',
  [EventSortOption.NAME]: 'Tên A–Z',
};

interface EventFilters {
  regions: string[];
  eras: string[];
  categories: string[];
  links: string[];
}
const EMPTY: EventFilters = { regions: [], eras: [], categories: [], links: [] };
const filterCount = (f: EventFilters) => f.regions.length + f.eras.length + f.categories.length + f.links.length;

interface EventRow {
  event: PublicEventSummaryDto;
  eraId: string;
  eraName: string | null;
  region: string;
  haystack: string;
  linkFlags: Set<LinkKey>;
  /** Loại đã gắn và mọi loại cha của chúng — lọc theo nút cha ra cả nút con. */
  categoryPath: Set<string>;
}

const categoryLabel = (c: string) => EVENT_CATEGORY_LABELS[c as EventCategory] ?? c;

function buildRows(events: PublicEventSummaryDto[], periods: PublicPeriodDto[], terms: TaxonomyTermItem[]): EventRow[] {
  const bySlug = new Map(periods.map((p) => [p.slug, p]));
  const byId = new Map(periods.map((p) => [p.id, p]));
  return events.map((event) => {
    let root = event.periodSlug ? bySlug.get(event.periodSlug) : undefined;
    while (root?.parentId && byId.has(root.parentId)) root = byId.get(root.parentId);
    const flags = new Set<LinkKey>();
    if (!root) flags.add('NO_PERIOD');
    if (event.figures.length === 0) flags.add('NO_FIGURE');
    if (event.locations.length === 0 && !event.location) flags.add('NO_LOCATION');
    return {
      event,
      eraId: root?.id ?? NO_PERIOD,
      eraName: root ? shortPeriodName(root.name) : null,
      region: regionLabel(root?.region),
      haystack: normalizeSearch(
        [event.title, event.description ?? '', event.location ?? '', ...event.figures.map((f) => f.name), String(event.startYear)].join(' '),
      ),
      linkFlags: flags,
      categoryPath: new Set((event.categoryIds ?? []).flatMap((id) => ancestorChain(terms, id).map((t) => t.id))),
    };
  });
}

function matches(row: EventRow, f: EventFilters, needle: string): boolean {
  if (f.regions.length && !f.regions.includes(row.region)) return false;
  if (f.eras.length && !f.eras.includes(row.eraId)) return false;
  if (f.categories.length && !f.categories.some((c) => row.categoryPath.has(c))) return false;
  if (f.links.length && !f.links.some((l) => row.linkFlags.has(l as LinkKey))) return false;
  return !needle || row.haystack.includes(needle);
}

/**
 * Thư viện sự kiện: mọi sự kiện đã xuất bản ở một chỗ — kể cả sự kiện chưa gắn
 * thời kỳ, nhân vật hay địa danh (những sự kiện này không xuất hiện trên Dòng thời gian).
 */
export function EventsLibrary({ events, periods }: { events: PublicEventSummaryDto[]; periods: PublicPeriodDto[] }) {
  // Loại sự kiện theo cây "Danh mục dùng chung"; chưa tải xong thì thẻ dùng nhãn enum cũ.
  const [categoryTerms, setCategoryTerms] = useState<TaxonomyTermItem[]>([]);
  useEffect(() => {
    loadPublicTaxonomy('EVENT_CATEGORY')
      .then((group) => setCategoryTerms(group?.terms ?? []))
      .catch(() => setCategoryTerms([]));
  }, []);
  const rows = useMemo(() => buildRows(events, periods, categoryTerms), [events, periods, categoryTerms]);
  const termLabel = (id: string) => categoryTerms.find((t) => t.id === id)?.label ?? id;
  const primaryLabel = (event: PublicEventSummaryDto) =>
    event.categoryIds?.[0] && categoryTerms.length ? termLabel(event.categoryIds[0]) : categoryLabel(event.category);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>(EMPTY);
  const [sort, setSort] = useState<Sort>(EventSortOption.YEAR_ASC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const needle = normalizeSearch(query.trim());

  const regionOrder = useRegionOrder();
  const regions = useMemo(() => sortedRegions(rows.map((r) => r.region), regionOrder), [rows, regionOrder]);
  const eras = useMemo(() => {
    const seen = new Map<string, { label: string; region: string; start: number }>();
    for (const r of rows) {
      if (!seen.has(r.eraId)) {
        const p = periods.find((x) => x.id === r.eraId);
        seen.set(r.eraId, { label: r.eraName ?? LINK_OPTIONS.NO_PERIOD, region: r.region, start: p?.startYear ?? Infinity });
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].start - b[1].start);
  }, [rows, periods]);
  const count = (pick: (r: EventRow) => boolean) => rows.filter(pick).length;

  const visible = useMemo(() => {
    const list = rows.filter((r) => matches(r, filters, needle));
    return list.sort((a, b) =>
      sort === EventSortOption.NAME
        ? a.event.title.localeCompare(b.event.title, 'vi')
        : sort === EventSortOption.YEAR_DESC
          ? b.event.startYear - a.event.startYear
          : a.event.startYear - b.event.startYear,
    );
  }, [rows, filters, needle, sort]);

  const chips = [
    ...filters.regions.map((v) => ({ key: 'regions' as const, value: v, label: v })),
    ...filters.eras.map((v) => ({ key: 'eras' as const, value: v, label: eras.find(([id]) => id === v)?.[1].label ?? v })),
    ...filters.categories.map((v) => ({ key: 'categories' as const, value: v, label: termLabel(v) })),
    ...filters.links.map((v) => ({ key: 'links' as const, value: v, label: LINK_OPTIONS[v as LinkKey] })),
  ];
  const active = filterCount(filters);

  return (
    <div className="sk-app el-app">
      <section className="el-intro">
        <span className="sk-section-eyebrow">THƯ VIỆN SỰ KIỆN</span>
        <h1>Mọi sự kiện, ở một nơi</h1>
        <p>
          {rows.length} sự kiện của Việt Nam và thế giới — tìm theo tên, năm, nhân vật hay địa danh, lọc theo khu vực, thời kỳ,
          danh mục.
        </p>
      </section>

      <div className="el-wrap">
        <div className="sk-filter-bar">
          <div className="sk-search-field">
            <Search size={17} />
            <input
              aria-label="Tìm sự kiện"
              placeholder="Tìm sự kiện, năm, nhân vật, địa danh..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="sk-button" aria-label="Xóa tìm kiếm" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <button type="button" className={`sk-button sk-filter-open ${active ? 'sk-is-on' : ''}`} onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
            {active > 0 && <span className="sk-badge">{active}</span>}
          </button>
          <div className="sk-split-segment" role="group" aria-label="Sắp xếp sự kiện">
            <ArrowDownUp size={13} />
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <button key={s} type="button" className={sort === s ? 'sk-selected' : ''} aria-pressed={sort === s} onClick={() => setSort(s)}>
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>
          {chips.length > 0 && (
            <div className="sk-active-filters">
              {chips.map((c) => (
                <button
                  key={`${c.key}-${c.value}`}
                  type="button"
                  onClick={() => setFilters({ ...filters, [c.key]: filters[c.key].filter((v) => v !== c.value) })}
                  aria-label={`Bỏ lọc ${c.label}`}
                >
                  {c.label}
                  <X size={13} />
                </button>
              ))}
              {chips.length > 1 && (
                <button type="button" className="sk-active-clear" onClick={() => setFilters(EMPTY)}>
                  Xóa tất cả
                </button>
              )}
            </div>
          )}
        </div>

        <FilterDialog
          open={sheetOpen}
          value={filters}
          empty={EMPTY}
          countFor={(draft) => rows.filter((r) => matches(r, draft, needle)).length}
          onApply={(f) => {
            setFilters(f);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        >
          {(draft, setDraft) => {
            const toggle = (key: keyof EventFilters, v: string) => setDraft((d) => ({ ...d, [key]: toggleValue(d[key], v) }));
            const eraOptions = eras
              .filter(([id, e]) => !draft.regions.length || draft.eras.includes(id) || draft.regions.includes(e.region))
              .map(([id, e]) => ({ value: id, label: e.label, hint: `${count((r) => r.eraId === id)} sự kiện` }));
            // Cây loại: chỉ hiện nút có sự kiện (tính cả nút con), cha đứng trước con.
            const categories = flattenTree(categoryTerms)
              .map(({ term, depth }) => ({ term, depth, n: count((r) => r.categoryPath.has(term.id)) }))
              .filter((c) => c.n > 0);
            const links = (Object.keys(LINK_OPTIONS) as LinkKey[]).filter((k) => count((r) => r.linkFlags.has(k)) > 0);
            return (
              <>
                {regions.length > 1 && (
                  <FilterSection title="Quốc gia / khu vực" aside={<PickedCount count={draft.regions.length} />}>
                    <ChipGroup
                      options={regions.map((r) => ({ value: r, label: r }))}
                      selected={draft.regions}
                      onToggle={(v) => toggle('regions', v)}
                      searchLabel="Tìm quốc gia / khu vực..."
                    />
                  </FilterSection>
                )}
                <FilterSection card title="Thời kỳ" aside={<PickedCount count={draft.eras.length} />}>
                  <ChipGroup options={eraOptions} selected={draft.eras} onToggle={(v) => toggle('eras', v)} searchLabel="Tìm thời kỳ..." />
                </FilterSection>
                <FilterSection title="Danh mục sự kiện" aside={<PickedCount count={draft.categories.length} />}>
                  <ChipGroup
                    options={categories.map(({ term, depth, n }) => ({
                      value: term.id,
                      label: depth > 0 ? `› ${term.label}` : term.label,
                      hint: `${n} sự kiện`,
                    }))}
                    selected={draft.categories}
                    onToggle={(v) => toggle('categories', v)}
                    searchLabel="Tìm danh mục..."
                  />
                </FilterSection>
                {links.length > 0 && (
                  <FilterSection title="Mức độ liên kết" aside={<PickedCount count={draft.links.length} />}>
                    <ChipGroup
                      options={links.map((k) => ({ value: k, label: LINK_OPTIONS[k], hint: `${count((r) => r.linkFlags.has(k))} sự kiện` }))}
                      selected={draft.links}
                      onToggle={(v) => toggle('links', v)}
                      searchLabel="Tìm..."
                    />
                  </FilterSection>
                )}
              </>
            );
          }}
        </FilterDialog>

        <div className="el-toolbar">
          Hiển thị <strong>{visible.length}</strong> / {rows.length} sự kiện
        </div>

        {visible.length ? (
          <ol className="el-list">
            {visible.map(({ event, eraName, region }) => {
              const place = event.locations[0]?.name ?? event.location;
              const placeSlug = event.locations[0]?.slug;
              const href = event.slug ? `/su-kien/${event.slug}` : null;
              return (
                <li key={event.id}>
                  <span className="el-year">{formatYear(event.startYear)}</span>
                  <div className="el-main">
                    {href ? <Link href={href}>{event.title}</Link> : <strong>{event.title}</strong>}
                    <div className="el-meta">
                      <span className="el-tag">{primaryLabel(event)}</span>
                      <span>{eraName ? `${eraName} · ${region}` : 'Chưa gắn thời kỳ'}</span>
                      {event.figures.length > 0 && (
                        <span>
                          <Users size={12} />
                          {event.figures
                            .slice(0, 2)
                            .map((f) => f.name)
                            .join(', ')}
                          {event.figures.length > 2 && ` +${event.figures.length - 2}`}
                        </span>
                      )}
                      {place && (
                        <span>
                          <MapPin size={12} />
                          {placeSlug ? <Link href={`/di-tich/${placeSlug}`}>{place}</Link> : place}
                        </span>
                      )}
                    </div>
                  </div>
                  {href && (
                    <Link href={href} className="el-go" aria-label={`Đọc ${event.title}`}>
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="sk-empty">
            <History size={34} />
            <h2>Chưa tìm thấy sự kiện</h2>
            <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
            {(active > 0 || query) && (
              <button
                type="button"
                className="sk-button sk-primary"
                onClick={() => {
                  setQuery('');
                  setFilters(EMPTY);
                }}
              >
                Xóa bộ lọc <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
