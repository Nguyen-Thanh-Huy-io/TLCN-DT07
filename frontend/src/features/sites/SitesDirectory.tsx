'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownUp, Award, CalendarDays, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { ChipGroup, FilterDialog, FilterSection, PickedCount, toggleValue } from '@/components/filters/ChipFilter';
import { normalizeSearch, shortPeriodName } from '@/features/search/search-index';
import type { PublicEventSummaryDto, PublicLocationSummaryDto, PublicPeriodDto } from '@/services/entities/landing.service';
import { regionLabel, sortedRegions, UNKNOWN_REGION } from '@/utils/region.utils';
import { SITE_TYPE_ICONS, SiteImage, siteTypeLabel } from './site-ui';
import './sites.css';

type Sort = 'events' | 'name';
const SORT_LABELS: Record<Sort, string> = { events: 'Nhiều sự kiện', name: 'Tên A–Z' };

interface SiteFilters {
  regions: string[];
  types: string[];
  eras: string[];
  recognition: string[];
}
const EMPTY: SiteFilters = { regions: [], types: [], eras: [], recognition: [] };
const filterCount = (f: SiteFilters) => f.regions.length + f.types.length + f.eras.length + f.recognition.length;

interface SiteRow {
  site: PublicLocationSummaryDto;
  eventCount: number;
  region: string;
  eraIds: string[];
  haystack: string;
}

/**
 * Thời kỳ / khu vực của một di tích: theo thời kỳ gắn trực tiếp, nếu không có thì
 * theo thời kỳ của các sự kiện diễn ra tại đó.
 */
function buildRows(sites: PublicLocationSummaryDto[], events: PublicEventSummaryDto[], periods: PublicPeriodDto[]): SiteRow[] {
  const bySlug = new Map(periods.map((p) => [p.slug, p]));
  const byId = new Map(periods.map((p) => [p.id, p]));
  const rootOf = (slug: string | null | undefined) => {
    let p = slug ? bySlug.get(slug) : undefined;
    while (p?.parentId && byId.has(p.parentId)) p = byId.get(p.parentId);
    return p;
  };
  return sites.map((site) => {
    const siteEvents = events.filter((e) => e.locations.some((l) => l.id === site.id));
    const roots = [rootOf(site.periodSlug), ...siteEvents.map((e) => rootOf(e.periodSlug))].filter(
      (p): p is PublicPeriodDto => Boolean(p),
    );
    return {
      site,
      eventCount: siteEvents.length,
      region: roots[0] ? regionLabel(roots[0].region) : UNKNOWN_REGION,
      eraIds: [...new Set(roots.map((p) => p.id))],
      haystack: normalizeSearch(
        [site.name, site.address ?? '', site.historicalSignificance ?? '', siteTypeLabel(site.siteType), ...siteEvents.map((e) => e.title)].join(' '),
      ),
    };
  });
}

function matches(row: SiteRow, f: SiteFilters, needle: string) {
  if (f.regions.length && !f.regions.includes(row.region)) return false;
  if (f.types.length && !f.types.includes(row.site.siteType ?? 'OTHER')) return false;
  if (f.eras.length && !f.eras.some((e) => row.eraIds.includes(e))) return false;
  if (f.recognition.length && !f.recognition.includes(row.site.recognitionLevel ?? '')) return false;
  return !needle || row.haystack.includes(needle);
}

export function SitesDirectory({
  sites,
  events,
  periods,
}: {
  sites: PublicLocationSummaryDto[];
  events: PublicEventSummaryDto[];
  periods: PublicPeriodDto[];
}) {
  const rows = useMemo(() => buildRows(sites, events, periods), [sites, events, periods]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SiteFilters>(EMPTY);
  const [sort, setSort] = useState<Sort>('events');
  const [sheetOpen, setSheetOpen] = useState(false);
  const needle = normalizeSearch(query.trim());

  const options = useMemo(() => {
    const count = (pick: (r: SiteRow) => boolean) => rows.filter(pick).length;
    const types = [...new Set(rows.map((r) => r.site.siteType ?? 'OTHER'))];
    const recognition = [...new Set(rows.map((r) => r.site.recognitionLevel).filter((v): v is string => Boolean(v)))];
    const eraIds = [...new Set(rows.flatMap((r) => r.eraIds))];
    return {
      regions: sortedRegions(rows.map((r) => r.region)).map((r) => ({ value: r, label: r, hint: `${count((x) => x.region === r)} di tích` })),
      types: types.map((t) => ({ value: t, label: siteTypeLabel(t), hint: `${count((x) => (x.site.siteType ?? 'OTHER') === t)} di tích` })),
      recognition: recognition.map((v) => ({ value: v, label: v })),
      eras: periods
        .filter((p) => eraIds.includes(p.id))
        .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0))
        .map((p) => ({ value: p.id, label: shortPeriodName(p.name), hint: p.timeLabel })),
    };
  }, [rows, periods]);

  const visible = useMemo(
    () =>
      rows
        .filter((r) => matches(r, filters, needle))
        .sort((a, b) => (sort === 'name' ? a.site.name.localeCompare(b.site.name, 'vi') : b.eventCount - a.eventCount)),
    [rows, filters, needle, sort],
  );

  const labelOf = (key: keyof SiteFilters, v: string) =>
    key === 'types' ? siteTypeLabel(v) : key === 'eras' ? options.eras.find((e) => e.value === v)?.label ?? v : v;
  const chips = (Object.keys(filters) as Array<keyof SiteFilters>).flatMap((key) =>
    filters[key].map((value) => ({ key, value, label: labelOf(key, value) })),
  );
  const active = filterCount(filters);

  return (
    <div className="sk-app st-app">
      <section className="st-intro">
        <span className="sk-section-eyebrow">DI TÍCH & ĐỊA DANH</span>
        <h1>Những nơi lịch sử đã diễn ra</h1>
        <p>
          {rows.length} di tích, chiến trường, kinh đô và đền đài — mỗi nơi gắn với những sự kiện và con người cụ thể. Bấm vào
          một di tích để xem điều gì đã xảy ra tại đó.
        </p>
      </section>

      <div className="st-wrap">
        <div className="sk-filter-bar">
          <div className="sk-search-field">
            <Search size={17} />
            <input
              aria-label="Tìm di tích"
              placeholder="Tìm di tích, địa chỉ, sự kiện..."
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
          <div className="sk-split-segment" role="group" aria-label="Sắp xếp di tích">
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
            const toggle = (key: keyof SiteFilters, v: string) => setDraft((d) => ({ ...d, [key]: toggleValue(d[key], v) }));
            return (
              <>
                {options.regions.length > 1 && (
                  <FilterSection title="Quốc gia / khu vực" aside={<PickedCount count={draft.regions.length} />}>
                    <ChipGroup options={options.regions} selected={draft.regions} onToggle={(v) => toggle('regions', v)} searchLabel="Tìm khu vực..." />
                  </FilterSection>
                )}
                <FilterSection card title="Loại di tích" aside={<PickedCount count={draft.types.length} />}>
                  <ChipGroup options={options.types} selected={draft.types} onToggle={(v) => toggle('types', v)} searchLabel="Tìm loại..." />
                </FilterSection>
                {options.eras.length > 0 && (
                  <FilterSection title="Thời kỳ" aside={<PickedCount count={draft.eras.length} />}>
                    <ChipGroup options={options.eras} selected={draft.eras} onToggle={(v) => toggle('eras', v)} searchLabel="Tìm thời kỳ..." />
                  </FilterSection>
                )}
                {options.recognition.length > 0 && (
                  <FilterSection title="Xếp hạng di tích" aside={<PickedCount count={draft.recognition.length} />}>
                    <ChipGroup
                      options={options.recognition}
                      selected={draft.recognition}
                      onToggle={(v) => toggle('recognition', v)}
                      searchLabel="Tìm xếp hạng..."
                    />
                  </FilterSection>
                )}
              </>
            );
          }}
        </FilterDialog>

        <div className="st-toolbar">
          Hiển thị <strong>{visible.length}</strong> / {rows.length} di tích
        </div>

        {visible.length ? (
          <div className="st-grid">
            {visible.map(({ site, eventCount, region }) => {
              const Icon = SITE_TYPE_ICONS[site.siteType ?? 'OTHER'] ?? MapPin;
              return (
                <Link key={site.id} href={`/di-tich/${site.slug}`} className="st-card">
                  <div className="st-card-media">
                    <SiteImage src={site.imageUrl} alt={site.name} siteType={site.siteType} />
                    <span className="st-type">
                      <Icon size={13} /> {siteTypeLabel(site.siteType)}
                    </span>
                  </div>
                  <div className="st-card-body">
                    <h2>{site.name}</h2>
                    {site.address && (
                      <p className="st-address">
                        <MapPin size={13} /> {site.address}
                      </p>
                    )}
                    {site.historicalSignificance && <p className="st-desc">{site.historicalSignificance}</p>}
                    <div className="st-meta">
                      {eventCount > 0 && (
                        <span>
                          <CalendarDays size={12} /> {eventCount} sự kiện
                        </span>
                      )}
                      {site.recognitionLevel && (
                        <span>
                          <Award size={12} /> {site.recognitionLevel}
                        </span>
                      )}
                      {region !== UNKNOWN_REGION && <span>{region}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="sk-empty">
            <MapPin size={34} />
            <h2>Chưa tìm thấy di tích</h2>
            <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
}
