'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutGrid, List, MapPin, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import {
  type PublicPeriodDetailDto,
  type PublicEventSummaryDto,
} from '@/services/entities/landing.service';
import { formatYear, shortPeriodName } from '@/features/landing/landing.adapter';
import { normalizeSearch } from '@/features/search/search-index';
import { useEventCategories, type EventCategoryItem } from '@/hooks/useEventCategories';
import { RemoteImage } from '@/components/common/CommonUi';
import { FilterDialog, toggleValue } from '@/components/filters/ChipFilter';
import {
  computeRecursiveCategoryBranchCounts,
  getDeepestCategoryIds,
  resolveEffectiveCategorySelectionIds,
  selectSingleRootCategory,
  toggleSubCategoryNode,
} from '@/components/filters/CategoryHierarchyFilterSection';
import {
  activePublicFacetFilterCount,
  computeTagFacetsFromItems,
  EMPTY_PUBLIC_CONTENT_FACET_FILTERS,
  matchesSelectedTags,
  PublicContentFilterSections,
  type PublicContentFacetFilterState,
} from '@/components/filters/PublicContentFilterSections';
import { SYSTEM_CATEGORY_ROOT_SLUGS } from '@/services/public/public-content.service';
import { resolvePeriodEventCategory } from '../utils/period-category-filter.strategy';
import '@/components/timeline/sk-timeline.css';

export { formatYear, shortPeriodName };

export const PERIOD_ROUTES = {
  PERIOD: (slug: string) => `/giai-doan/${slug}`,
  EVENT: (slug: string) => `/bai-viet/${slug}`,
  FIGURE: (slug: string) => `/bai-viet/${slug}`,
  LOCATIONS: '/bai-viet?chuyen-muc=di-tich',
  LOCATION: (slug: string) => `/bai-viet/${slug}`,
  TIMELINE: '/dong-thoi-gian',
} as const;

const INITIAL_EVENTS_VISIBLE = 20;
const EVENTS_PAGE_STEP = 20;

export function eventYearLabel(event: PublicEventSummaryDto): string {
  const note = event.eventDateNote?.trim();
  return note && note.length <= 24 ? note : formatYear(event.startYear);
}

export interface EventGroup {
  id: string;
  title: string;
  years: string;
  href: string | null;
  totalInStage: number;
  events: PublicEventSummaryDto[];
}

function belongsToChildStage(event: PublicEventSummaryDto, child: PublicPeriodDetailDto['children'][number]): boolean {
  return event.stageId === child.id || event.periodSlug === child.slug;
}

export function groupEventsByStage(
  period: PublicPeriodDetailDto,
  visibleEvents: PublicEventSummaryDto[],
  allFilteredEvents: PublicEventSummaryDto[] = visibleEvents,
): EventGroup[] {
  const groups: EventGroup[] = period.children.map((child) => {
    const totalInStage = allFilteredEvents.filter((e) => belongsToChildStage(e, child)).length;
    return {
      id: child.id,
      title: shortPeriodName(child.name),
      years: child.timeLabel,
      href: PERIOD_ROUTES.PERIOD(child.slug),
      totalInStage,
      events: visibleEvents.filter((e) => belongsToChildStage(e, child)),
    };
  });
  const isChildMatched = (e: PublicEventSummaryDto) =>
    period.children.some((child) => belongsToChildStage(e, child));
  const direct = visibleEvents.filter((e) => !isChildMatched(e));
  const totalDirect = allFilteredEvents.filter((e) => !isChildMatched(e)).length;
  if (direct.length) {
    groups.unshift({
      id: period.id,
      title: period.children.length ? 'Gắn trực tiếp thời kỳ' : shortPeriodName(period.name),
      years: period.timeLabel,
      href: null,
      totalInStage: totalDirect,
      events: direct,
    });
  }
  return groups.filter((g) => g.events.length);
}

export enum EventStreamViewMode {
  LIST = 'list',
  CARDS = 'cards',
}

function resolvePeriodItemCategoryId(
  event: PublicEventSummaryDto,
  categories: EventCategoryItem[],
  fallbackEventRootId: string | null,
): string | null {
  const primaryId = event.categoryIds?.[0];
  if (primaryId) return primaryId;
  const raw = event.category?.trim();
  if (raw) {
    const matched = categories.find((c) => c.id === raw || c.slug === raw || c.name === raw);
    if (matched) return matched.id;
  }
  return fallbackEventRootId;
}

function matchesSearchNeedle(event: PublicEventSummaryDto, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const hay = normalizeSearch(`${event.title} ${eventYearLabel(event)} ${event.description ?? ''}`);
  return hay.includes(normalizedQuery);
}

/** Dòng sự kiện của thời kỳ, dùng chung 100% hộp thoại Bộ lọc Chuyên mục + Chủ điểm Tag. */
export function EventStream({ period }: { period: PublicPeriodDetailDto }) {
  const eventCategories = useEventCategories();
  const [facetFilter, setFacetFilter] = useState<PublicContentFacetFilterState>(
    EMPTY_PUBLIC_CONTENT_FACET_FILTERS,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_EVENTS_VISIBLE);
  const [view, setView] = useState<EventStreamViewMode>(EventStreamViewMode.LIST);

  const fallbackEventRootId = useMemo(
    () => eventCategories.find((c) => c.slug === SYSTEM_CATEGORY_ROOT_SLUGS.EVENT)?.id ?? null,
    [eventCategories],
  );

  const normalizedQuery = useMemo(() => normalizeSearch(searchQuery.trim()), [searchQuery]);

  const searchMatchedEvents = useMemo(
    () => period.events.filter((e) => matchesSearchNeedle(e, normalizedQuery)),
    [period.events, normalizedQuery],
  );

  const branchCategoryCounts = useMemo(() => {
    const directCounts: Record<string, number> = {};
    for (const ev of searchMatchedEvents) {
      if (!matchesSelectedTags(ev, facetFilter.tags)) continue;
      const cid = resolvePeriodItemCategoryId(ev, eventCategories, fallbackEventRootId);
      if (cid) directCounts[cid] = (directCounts[cid] ?? 0) + 1;
    }
    return computeRecursiveCategoryBranchCounts(eventCategories, directCounts);
  }, [searchMatchedEvents, facetFilter.tags, eventCategories, fallbackEventRootId]);

  const tagOptions = useMemo(() => {
    const allowedIds = new Set(resolveEffectiveCategorySelectionIds(facetFilter, eventCategories));
    const categoryMatched =
      allowedIds.size === 0
        ? searchMatchedEvents
        : searchMatchedEvents.filter((ev) => {
            const cid = resolvePeriodItemCategoryId(ev, eventCategories, fallbackEventRootId);
            return Boolean(cid && allowedIds.has(cid));
          });
    return computeTagFacetsFromItems(categoryMatched);
  }, [searchMatchedEvents, facetFilter, eventCategories, fallbackEventRootId]);

  const tagNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of period.events) {
      for (const t of ev.tagItems ?? []) map.set(t.id, t.name);
    }
    return map;
  }, [period.events]);

  const filtered = useMemo(() => {
    const allowedIds = new Set(resolveEffectiveCategorySelectionIds(facetFilter, eventCategories));
    return searchMatchedEvents.filter((ev) => {
      if (allowedIds.size > 0) {
        const cid = resolvePeriodItemCategoryId(ev, eventCategories, fallbackEventRootId);
        if (!cid || !allowedIds.has(cid)) return false;
      }
      return matchesSelectedTags(ev, facetFilter.tags);
    });
  }, [searchMatchedEvents, facetFilter, eventCategories, fallbackEventRootId]);

  const countForDraft = (draft: PublicContentFacetFilterState): number => {
    const allowedIds = new Set(resolveEffectiveCategorySelectionIds(draft, eventCategories));
    return searchMatchedEvents.filter((ev) => {
      if (allowedIds.size > 0) {
        const cid = resolvePeriodItemCategoryId(ev, eventCategories, fallbackEventRootId);
        if (!cid || !allowedIds.has(cid)) return false;
      }
      return matchesSelectedTags(ev, draft.tags);
    }).length;
  };

  const activeCategoryIds = useMemo(() => {
    const deepest = getDeepestCategoryIds(facetFilter.subCategoryIds, eventCategories);
    if (deepest.length > 0) return deepest;
    return facetFilter.rootCategoryId ? [facetFilter.rootCategoryId] : [];
  }, [facetFilter, eventCategories]);

  const activeTotalCount = activePublicFacetFilterCount(facetFilter, eventCategories);

  const catNameById = useMemo(
    () => new Map(eventCategories.map((c) => [c.id, c.name])),
    [eventCategories],
  );

  const handleRemoveActiveCategoryChip = (id: string) => {
    setFacetFilter((prev) => {
      if (prev.rootCategoryId === id && prev.subCategoryIds.length === 0) {
        return selectSingleRootCategory(prev, id);
      }
      return toggleSubCategoryNode(prev, id, eventCategories);
    });
    setVisibleLimit(INITIAL_EVENTS_VISIBLE);
  };

  const handleRemoveActiveTagChip = (tagId: string) => {
    setFacetFilter((prev) => ({ ...prev, tags: toggleValue(prev.tags, tagId) }));
    setVisibleLimit(INITIAL_EVENTS_VISIBLE);
  };

  const displayedEvents = useMemo(
    () => filtered.slice(0, visibleLimit),
    [filtered, visibleLimit],
  );
  const remainingCount = Math.max(0, filtered.length - displayedEvents.length);
  const groups = groupEventsByStage(period, displayedEvents, filtered);

  if (period.events.length === 0) {
    return (
      <div className="pd-empty">
        Chưa có bài viết hay mốc thời gian nào được xuất bản cho thời kỳ này.
      </div>
    );
  }

  const isListView = view === EventStreamViewMode.LIST;

  return (
    <>
      <div className="pd-stream-toolbar">
        <label className="pd-stream-search">
          <Search size={15} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleLimit(INITIAL_EVENTS_VISIBLE);
            }}
            placeholder="Tìm theo tiêu đề hoặc năm..."
            aria-label="Tìm tư liệu trong thời kỳ"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => setSearchQuery('')}
              className="pd-stream-search-clear"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            activeTotalCount > 0
              ? 'border-[#7A1F24] bg-[#7A1F24] text-white shadow-2xs'
              : 'border-[#E2D5B8] bg-[#FAF6EA] text-[#2D1A10] hover:border-[#B8893F]'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Bộ lọc</span>
          {activeTotalCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-extrabold">
              {activeTotalCount}
            </span>
          )}
        </button>

        <div className="pd-view-toggle" role="group" aria-label="Kiểu hiển thị">
          <button
            type="button"
            className={isListView ? 'active' : ''}
            aria-pressed={isListView}
            onClick={() => setView(EventStreamViewMode.LIST)}
          >
            <List size={14} /> Danh sách
          </button>
          <button
            type="button"
            className={view === EventStreamViewMode.CARDS ? 'active' : ''}
            aria-pressed={view === EventStreamViewMode.CARDS}
            onClick={() => setView(EventStreamViewMode.CARDS)}
          >
            <LayoutGrid size={14} /> Thẻ chi tiết
          </button>
        </div>
      </div>

      {activeTotalCount > 0 && (
        <div className="pd-active-detail-bar mb-4">
          <span className="pd-sub-chips-label">Đang lọc:</span>
          {activeCategoryIds.map((id) => (
            <button
              key={`cat-${id}`}
              type="button"
              className="pd-active-detail-pill"
              onClick={() => handleRemoveActiveCategoryChip(id)}
              title="Bấm để gỡ chuyên mục này"
            >
              <span>{catNameById.get(id) ?? id}</span>
              <X size={12} />
            </button>
          ))}
          {facetFilter.tags.map((tid) => (
            <button
              key={`tag-${tid}`}
              type="button"
              className="pd-active-detail-pill"
              onClick={() => handleRemoveActiveTagChip(tid)}
              title="Bấm để gỡ chủ điểm này"
            >
              <span>{tagNameById.get(tid) ?? `#${tid}`}</span>
              <X size={12} />
            </button>
          ))}
          <button
            type="button"
            className="pd-chip-clear"
            onClick={() => {
              setFacetFilter(EMPTY_PUBLIC_CONTENT_FACET_FILTERS);
              setVisibleLimit(INITIAL_EVENTS_VISIBLE);
            }}
          >
            <X size={13} /> Bỏ lọc
          </button>
        </div>
      )}

      <FilterDialog
        open={filterOpen}
        value={facetFilter}
        empty={EMPTY_PUBLIC_CONTENT_FACET_FILTERS}
        countFor={countForDraft}
        onApply={(next) => {
          setFacetFilter(next);
          setVisibleLimit(INITIAL_EVENTS_VISIBLE);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      >
        {(draft, setDraft) => (
          <PublicContentFilterSections
            draft={draft}
            setDraft={setDraft}
            categories={eventCategories}
            branchCategoryCounts={branchCategoryCounts}
            tagOptions={tagOptions}
            rootUnitLabel="tư liệu"
            subUnitLabel="mục"
            tagUnitLabel="tư liệu"
            hideZeroRoots
          />
        )}
      </FilterDialog>

      <div className="pd-stream">
        {groups.map((g) => (
          <section key={g.id} className="pd-stream-group">
            <div className="pd-stream-group-head">
              <div>
                <h3>{g.title}</h3>
                <span>
                  {g.years ? `${g.years} · ` : ''}
                  {g.events.length < g.totalInStage
                    ? `Hiển thị ${g.events.length} / ${g.totalInStage.toLocaleString('vi-VN')} mục`
                    : `${g.totalInStage.toLocaleString('vi-VN')} mục`}
                </span>
              </div>
              {g.href && (
                <Link href={g.href}>
                  Xem giai đoạn <ArrowRight size={14} />
                </Link>
              )}
            </div>
            {isListView ? (
              <ol className="pd-event-list">
                {g.events.map((e) => (
                  <PeriodEventListItem key={e.id} event={e} categories={eventCategories} />
                ))}
              </ol>
            ) : (
              <ol>
                {g.events.map((e) => (
                  <PeriodEventCardItem key={e.id} event={e} categories={eventCategories} />
                ))}
              </ol>
            )}
          </section>
        ))}

        {groups.length === 0 && (
          <div className="pd-empty">Không tìm thấy tư liệu phù hợp với bộ lọc hiện tại.</div>
        )}

        {remainingCount > 0 && (
          <div className="pd-load-more">
            <button
              type="button"
              className="pd-load-more-btn"
              onClick={() => setVisibleLimit((prev) => prev + EVENTS_PAGE_STEP)}
            >
              Xem thêm {Math.min(EVENTS_PAGE_STEP, remainingCount)} mục (còn {remainingCount.toLocaleString('vi-VN')})
            </button>
            <button
              type="button"
              className="pd-load-more-all"
              onClick={() => setVisibleLimit(filtered.length)}
            >
              Hiện tất cả ({filtered.length.toLocaleString('vi-VN')})
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function PeriodEventListItem({
  event: e,
  categories,
}: {
  event: PublicEventSummaryDto;
  categories: EventCategoryItem[];
}) {
  const locName = e.locations[0]?.name ?? e.location ?? null;
  const showLoc = Boolean(locName && locName.trim() !== e.title.trim());
  const catLabel = resolvePeriodEventCategory(categories, e).leafLabel;
  return (
    <li id={`ev-${e.id}`}>
      <span className="pd-event-list-year">{eventYearLabel(e)}</span>
      <div>
        {e.slug ? <Link href={PERIOD_ROUTES.EVENT(e.slug)}>{e.title}</Link> : <strong>{e.title}</strong>}
        <small>
          {catLabel}
          {e.figures.length > 0 && ` · ${e.figures.slice(0, 2).map((f) => f.name).join(', ')}`}
          {showLoc && ` · ${locName}`}
        </small>
      </div>
      {e.slug && (
        <Link href={PERIOD_ROUTES.EVENT(e.slug)} className="pd-event-list-go" aria-label={`Đọc ${e.title}`}>
          <ArrowRight size={16} />
        </Link>
      )}
    </li>
  );
}

function PeriodEventCardItem({
  event: e,
  categories,
}: {
  event: PublicEventSummaryDto;
  categories: EventCategoryItem[];
}) {
  const locName = e.locations[0]?.name ?? e.location ?? null;
  const showLoc = Boolean(locName && locName.trim() !== e.title.trim());
  const catLabel = resolvePeriodEventCategory(categories, e).leafLabel;
  return (
    <li id={`ev-${e.id}`} className="pd-event">
      <div className="pd-event-year">{eventYearLabel(e)}</div>
      <article>
        {e.imageUrl && <RemoteImage src={e.imageUrl} alt="" />}
        <div>
          <span className="pd-tag">{catLabel}</span>
          <h4>{e.slug ? <Link href={PERIOD_ROUTES.EVENT(e.slug)}>{e.title}</Link> : e.title}</h4>
          {e.description && <p>{e.description}</p>}
          {(e.figures.length > 0 || showLoc) && (
            <div className="pd-event-meta">
              {e.figures.length > 0 && (
                <span>
                  <Users size={13} />
                  {e.figures.slice(0, 3).map((f, i) => (
                    <span key={f.id}>
                      {i > 0 && ', '}
                      <Link href={PERIOD_ROUTES.FIGURE(f.slug)}>{f.name}</Link>
                    </span>
                  ))}
                  {e.figures.length > 3 && ` +${e.figures.length - 3}`}
                </span>
              )}
              {showLoc && (
                <span>
                  <MapPin size={13} />
                  {e.locations[0]?.slug ? (
                    <Link href={PERIOD_ROUTES.LOCATION(e.locations[0].slug)}>{e.locations[0].name}</Link>
                  ) : (
                    locName
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </li>
  );
}

// === TimeRuler.tsx ===
const CLUSTER_GAP_PERCENT = 15;
const TICK_EDGE_PERCENT = 12;
const EDGE_DOT_PERCENT = 5;
const TARGET_TICKS = 3;
const PREHISTORIC_THRESHOLD_YEAR = -3000;
const PREHISTORIC_ZONE_PERCENT = 14;

interface Cluster {
  pos: number;
  events: PublicEventSummaryDto[];
}

function niceStep(span: number): number {
  const raw = span / TARGET_TICKS;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  if (unit < 1.5) return Math.max(1, pow);
  if (unit < 3.5) return Math.max(1, 2 * pow);
  if (unit < 7.5) return Math.max(1, 5 * pow);
  return Math.max(1, 10 * pow);
}

function yearRange(events: PublicEventSummaryDto[]): string {
  const first = events[0].startYear;
  const last = events[events.length - 1].startYear;
  return first === last ? formatYear(first) : `${formatYear(first)} – ${formatYear(last)}`;
}

function computeScalePosition(
  year: number,
  start: number,
  end: number,
  useSplitScale: boolean,
  historicStart: number,
): number {
  if (!useSplitScale) {
    return Math.min(100, Math.max(0, ((year - start) / (end - start)) * 100));
  }
  const preSpan = Math.max(1, historicStart - start);
  const historicSpan = Math.max(1, end - historicStart);
  if (year <= historicStart) {
    return Math.min(PREHISTORIC_ZONE_PERCENT, Math.max(0, ((year - start) / preSpan) * PREHISTORIC_ZONE_PERCENT));
  }
  return Math.min(
    100,
    PREHISTORIC_ZONE_PERCENT + ((year - historicStart) / historicSpan) * (100 - PREHISTORIC_ZONE_PERCENT),
  );
}

function resolveDotAlignClass(posPercent: number): string {
  if (posPercent < 10) return 'align-start';
  if (posPercent > 90) return 'align-end';
  return 'align-mid';
}

function resolveTimeRulerBounds(eventYears: number[]): { start: number; end: number } | null {
  if (eventYears.length === 0) return null;
  const start = Math.min(...eventYears);
  const end = Math.max(...eventYears);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

function buildTimeRulerClustersAndTicks(
  events: PublicEventSummaryDto[],
  start: number,
  end: number,
  useSplitScale: boolean,
  historicStart: number,
): {
  pos: (year: number) => number;
  clusters: Cluster[];
  ticks: number[];
} {
  const pos = (year: number) => computeScalePosition(year, start, end, useSplitScale, historicStart);
  const clusters: Cluster[] = [];
  for (const e of [...events].sort((a, b) => a.startYear - b.startYear)) {
    const p = pos(e.startYear);
    const last = clusters[clusters.length - 1];
    if (last && p - last.pos < CLUSTER_GAP_PERCENT) last.events.push(e);
    else clusters.push({ pos: p, events: [e] });
  }

  const tickBaseStart = useSplitScale ? historicStart : start;
  const step = niceStep(end - tickBaseStart);
  const ticks: number[] = [];
  for (let t = Math.ceil(tickBaseStart / step) * step; t < end; t += step) {
    if (t !== 0) {
      const p = pos(t);
      if (p > TICK_EDGE_PERCENT && p < 100 - TICK_EDGE_PERCENT) ticks.push(t);
    }
  }
  return { pos, clusters, ticks };
}

function parseHistoricalBoundYear(numRaw: string, bceRaw?: string): number {
  const value = Number.parseInt(numRaw, 10);
  return bceRaw ? -value : value;
}

function extractDeclaredYearBounds(
  timeLabel: string,
  periodName: string,
): { minYear: number; maxYear: number } | null {
  const source = `${timeLabel} | ${periodName}`;
  const rangeMatch = source.match(
    /(\d{2,7})\s*(TCN)?\s*[–-]\s*(?:(\d{2,7})\s*(TCN)?|(nay|hiện nay))/i,
  );
  if (!rangeMatch) return null;
  const [, startDigits, startBce, endDigits, endBce, isPresent] = rangeMatch;
  const minYear = parseHistoricalBoundYear(startDigits, startBce);
  const maxYear = isPresent
    ? new Date().getFullYear()
    : parseHistoricalBoundYear(endDigits, endBce);
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear) || maxYear <= minYear) {
    return null;
  }
  return { minYear, maxYear };
}

function selectRulerEvents(period: PublicPeriodDetailDto): PublicEventSummaryDto[] {
  const declared = extractDeclaredYearBounds(period.timeLabel, period.name);
  if (declared) {
    const withinDeclared = period.events.filter(
      (e) => e.startYear >= declared.minYear && e.startYear <= declared.maxYear,
    );
    if (withinDeclared.length >= 2) return withinDeclared;
  }
  const curated = period.events.filter((e) => e.isCuratedNode);
  return curated.length >= 2 ? curated : period.events;
}

export function TimeRuler({ period, onPickStage }: { period: PublicPeriodDetailDto; onPickStage: (id: string) => void }) {
  const rulerEvents = useMemo(() => selectRulerEvents(period), [period]);
  const eventYears = rulerEvents.map((e) => e.startYear).filter((y) => Number.isFinite(y) && y !== 0);
  const bounds = resolveTimeRulerBounds(eventYears);
  if (!bounds) return null;

  const { start, end } = bounds;
  const historicYears = eventYears.filter((y) => y > PREHISTORIC_THRESHOLD_YEAR);
  const useSplitScale = start <= PREHISTORIC_THRESHOLD_YEAR && historicYears.length > 0 && end > PREHISTORIC_THRESHOLD_YEAR;
  const historicStart = useSplitScale ? Math.min(...historicYears) : start;
  const { pos, clusters, ticks } = buildTimeRulerClustersAndTicks(
    rulerEvents,
    start,
    end,
    useSplitScale,
    historicStart,
  );

  const firstPos = clusters[0]?.pos ?? 50;
  const lastPos = clusters[clusters.length - 1]?.pos ?? 50;

  return (
    <div className="pd-ruler" aria-label="Thước thời gian của thời kỳ">
      {period.children.length > 0 && (
        <div className="pd-ruler-bands">
          {period.children.map((c, i) => (
            <button
              type="button"
              key={c.id}
              className={`pd-ruler-band tone-${i % 4}`}
              onClick={() => onPickStage(c.id)}
              title={`${c.name}${c.timeLabel ? ` (${c.timeLabel})` : ''}`}
            >
              <span>{shortPeriodName(c.name)}</span>
              {c.timeLabel && <small>{c.timeLabel}</small>}
            </button>
          ))}
        </div>
      )}
      <div className="pd-ruler-track">
        {clusters.map((c, i) => (
          <a
            key={c.events[0].id}
            href={`#ev-${c.events[0].id}`}
            className={`pd-ruler-dot ${c.events.length > 1 ? 'is-group' : ''} ${i % 2 ? 'label-low' : ''} ${resolveDotAlignClass(c.pos)}`}
            style={{ left: `${c.pos}%` }}
            title={c.events.map((e) => `${formatYear(e.startYear)} · ${e.title}`).join('\n')}
            aria-label={`${yearRange(c.events)}: ${c.events.length} sự kiện`}
          >
            {c.events.length > 1 && <b>{c.events.length}</b>}
            <span className="pd-ruler-dot-label">{yearRange(c.events)}</span>
          </a>
        ))}
      </div>
      <div className="pd-ruler-ticks">
        {firstPos >= EDGE_DOT_PERCENT && <span className="edge-start">{formatYear(start)}</span>}
        {ticks.map((t) => (
          <span key={t} style={{ left: `${pos(t)}%` }}>
            {formatYear(t)}
          </span>
        ))}
        {lastPos <= 100 - EDGE_DOT_PERCENT && <span className="edge-end">{formatYear(end)}</span>}
      </div>
    </div>
  );
}
