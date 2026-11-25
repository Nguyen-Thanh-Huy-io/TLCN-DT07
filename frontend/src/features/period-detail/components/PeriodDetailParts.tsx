'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, FolderTree, LayoutGrid, List, MapPin, Search, Users, X } from 'lucide-react';
import {
  type PublicPeriodDetailDto,
  type PublicEventSummaryDto,
  type PublicPeriodDto,
} from '@/services/entities/landing.service';
import { formatYear, shortPeriodName } from '@/features/landing/landing.adapter';
import { normalizeSearch } from '@/features/search/search-index';
import { useEventCategories } from '@/hooks/useEventCategories';
import { RemoteImage } from '@/components/common/CommonUi';
import { TreeSelectModal } from '@/components/common/TreeSelectModal';
import {
  ALL_ROOT_FILTER_KEY,
  buildPeriodCategoryHierarchy,
  matchesPeriodCategoryFilter,
  resolvePeriodEventCategory,
} from '../utils/period-category-filter.strategy';

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

export function siblingPeriods(period: PublicPeriodDto, all: PublicPeriodDto[]) {
  const siblings = all
    .filter((p) => (period.parentId ? p.parentId === period.parentId : !p.parentId))
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));
  const i = siblings.findIndex((p) => p.id === period.id);
  return { prev: i > 0 ? siblings[i - 1] : null, next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null };
}

// === EventStream.tsx ===
export enum EventStreamViewMode {
  LIST = 'list',
  CARDS = 'cards',
}

const MAX_INLINE_SUB_PILLS = 5;

/** Dòng sự kiện của thời kỳ, chia theo giai đoạn, lọc phân cấp 5 chuyên mục gốc + Modal cây cha-con + tìm nhanh. */
export function EventStream({ period }: { period: PublicPeriodDetailDto }) {
  const eventCategories = useEventCategories();

  const hierarchy = useMemo(
    () => buildPeriodCategoryHierarchy(period.events, eventCategories),
    [period.events, eventCategories],
  );

  const [activeRoot, setActiveRoot] = useState<string>(ALL_ROOT_FILTER_KEY);
  const [selectedDetailIds, setSelectedDetailIds] = useState<string[]>([]);
  const [subExpanded, setSubExpanded] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_EVENTS_VISIBLE);
  const [view, setView] = useState<EventStreamViewMode>(EventStreamViewMode.LIST);

  const handleSelectRoot = (rootSlug: string) => {
    const nextRoot = activeRoot === rootSlug ? ALL_ROOT_FILTER_KEY : rootSlug;
    setActiveRoot(nextRoot);
    setSelectedDetailIds([]);
    setSubExpanded(false);
    setVisibleLimit(INITIAL_EVENTS_VISIBLE);
  };

  const handleToggleSubChip = (subId: string) => {
    setSelectedDetailIds((prev) =>
      prev.includes(subId) ? prev.filter((x) => x !== subId) : [...prev, subId],
    );
    setVisibleLimit(INITIAL_EVENTS_VISIBLE);
  };

  const handleApplyTreeSelection = (ids: string[]) => {
    setSelectedDetailIds(ids);
    if (ids.length > 0) {
      setActiveRoot(ALL_ROOT_FILTER_KEY);
    }
    setVisibleLimit(INITIAL_EVENTS_VISIBLE);
  };

  const handleClearFilters = () => {
    setActiveRoot(ALL_ROOT_FILTER_KEY);
    setSelectedDetailIds([]);
    setSubExpanded(false);
    setVisibleLimit(INITIAL_EVENTS_VISIBLE);
  };

  const activeSubCategories = useMemo(
    () => (activeRoot !== ALL_ROOT_FILTER_KEY ? hierarchy.subByRootSlug.get(activeRoot) ?? [] : []),
    [activeRoot, hierarchy],
  );

  const visibleSubCategories = useMemo(() => {
    if (subExpanded || activeSubCategories.length <= MAX_INLINE_SUB_PILLS) {
      return activeSubCategories;
    }
    return activeSubCategories.filter(
      (sub, idx) => idx < MAX_INLINE_SUB_PILLS || selectedDetailIds.includes(sub.id),
    );
  }, [activeSubCategories, subExpanded, selectedDetailIds]);

  const hiddenSubCount = Math.max(0, activeSubCategories.length - visibleSubCategories.length);

  const filtered = useMemo(() => {
    const q = normalizeSearch(searchQuery.trim());
    return period.events.filter((e) => {
      if (!matchesPeriodCategoryFilter(e, eventCategories, activeRoot, selectedDetailIds)) {
        return false;
      }
      if (!q) return true;
      const hay = normalizeSearch(`${e.title} ${eventYearLabel(e)} ${e.description ?? ''}`);
      return hay.includes(q);
    });
  }, [period.events, eventCategories, activeRoot, selectedDetailIds, searchQuery]);

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
  const isAllActive = activeRoot === ALL_ROOT_FILTER_KEY && selectedDetailIds.length === 0;

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

      {hierarchy.roots.length > 0 && (
        <div className="pd-filter-stack">
          <div className="pd-chips pd-root-chips" role="group" aria-label="Lọc theo nhóm chuyên mục chính">
            <button
              type="button"
              className={isAllActive ? 'active' : ''}
              aria-pressed={isAllActive}
              onClick={handleClearFilters}
            >
              Tất cả <small>{period.events.length.toLocaleString('vi-VN')}</small>
            </button>

            {hierarchy.roots.map((root) => {
              const isRootSelected = activeRoot === root.rootSlug && selectedDetailIds.length === 0;
              return (
                <button
                  key={root.rootSlug}
                  type="button"
                  className={isRootSelected ? 'active' : ''}
                  aria-pressed={isRootSelected}
                  onClick={() => handleSelectRoot(root.rootSlug)}
                >
                  {root.label} <small>{root.count.toLocaleString('vi-VN')}</small>
                </button>
              );
            })}

            <button
              type="button"
              className={`pd-tree-trigger ${selectedDetailIds.length > 0 ? 'active' : ''}`}
              onClick={() => setIsTreeModalOpen(true)}
            >
              <FolderTree size={14} />
              <span>Chuyên mục chi tiết</span>
              {selectedDetailIds.length > 0 && <small>{selectedDetailIds.length}</small>}
              <ChevronDown size={13} />
            </button>

            {!isAllActive && (
              <button type="button" className="pd-chip-clear" onClick={handleClearFilters}>
                <X size={13} /> Bỏ lọc
              </button>
            )}
          </div>

          {activeSubCategories.length > 0 && (
            <div className="pd-sub-chips" role="group" aria-label="Chuyên mục con">
              <span className="pd-sub-chips-label">Nhánh con:</span>
              {visibleSubCategories.map((sub) => {
                const isSubActive = selectedDetailIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={isSubActive ? 'active' : ''}
                    aria-pressed={isSubActive}
                    onClick={() => handleToggleSubChip(sub.id)}
                  >
                    {sub.label} <small>{sub.count.toLocaleString('vi-VN')}</small>
                  </button>
                );
              })}
              {(hiddenSubCount > 0 || (subExpanded && activeSubCategories.length > MAX_INLINE_SUB_PILLS)) && (
                <button
                  type="button"
                  className="pd-sub-chips-more"
                  onClick={() => setSubExpanded((prev) => !prev)}
                >
                  {subExpanded ? 'Thu gọn' : `+${hiddenSubCount} xem thêm`}
                </button>
              )}
            </div>
          )}

          {activeRoot === ALL_ROOT_FILTER_KEY && selectedDetailIds.length > 0 && (
            <div className="pd-active-detail-bar">
              <span className="pd-sub-chips-label">Đang lọc chi tiết:</span>
              {selectedDetailIds.slice(0, 6).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="pd-active-detail-pill"
                  onClick={() => handleToggleSubChip(id)}
                  title="Bấm để gỡ chuyên mục này"
                >
                  <span>{hierarchy.labelById.get(id) ?? id}</span>
                  <X size={12} />
                </button>
              ))}
              {selectedDetailIds.length > 6 && (
                <button
                  type="button"
                  className="pd-sub-chips-more"
                  onClick={() => setIsTreeModalOpen(true)}
                >
                  +{selectedDetailIds.length - 6} mục khác
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <TreeSelectModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        title="Lọc theo chuyên mục lịch sử"
        subtitle="Chọn một hoặc nhiều nhánh chuyên mục thuộc thời kỳ đang xem"
        nodes={hierarchy.treeNodes}
        selectedIds={selectedDetailIds}
        onChangeSelected={handleApplyTreeSelection}
        multiple
        unitLabel="chuyên mục"
        searchPlaceholder="Tìm chuyên mục (VD: Chiến dịch, Quân chủ, Khoa cử...)"
      />

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
                {g.events.map((e) => {
                  const locName = e.locations[0]?.name ?? e.location ?? null;
                  const showLoc = Boolean(locName && locName.trim() !== e.title.trim());
                  const catLabel = resolvePeriodEventCategory(eventCategories, e).leafLabel;
                  return (
                    <li key={e.id} id={`ev-${e.id}`}>
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
                })}
              </ol>
            ) : (
              <ol>
                {g.events.map((e) => {
                  const locName = e.locations[0]?.name ?? e.location ?? null;
                  const showLoc = Boolean(locName && locName.trim() !== e.title.trim());
                  const catLabel = resolvePeriodEventCategory(eventCategories, e).leafLabel;
                  return (
                    <li key={e.id} id={`ev-${e.id}`} className="pd-event">
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
                })}
              </ol>
            )}
          </section>
        ))}

        {groups.length === 0 && (
          <div className="pd-empty">Không tìm thấy sự kiện phù hợp với bộ lọc hiện tại.</div>
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

// === TimeRuler.tsx ===
/** Khoảng cách tối thiểu (% chiều dài thước) giữa 2 chấm mốc để không chồng nhãn năm. */
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
  return Math.max(1, (unit < 1.5 ? 1 : unit < 3.5 ? 2 : unit < 7.5 ? 5 : 10) * pow);
}

function yearRange(events: PublicEventSummaryDto[]): string {
  const first = events[0].startYear;
  const last = events[events.length - 1].startYear;
  return first === last ? formatYear(first) : `${formatYear(first)} – ${formatYear(last)}`;
}

/**
 * Thước thời gian trực quan:
 * - Dải giai đoạn xếp flex cân đối (không bao giờ đè nhau).
 * - Nếu thời kỳ bắt đầu từ Tiền sử sâu (< 3000 TCN) và kéo tới lịch sử thành văn,
 *   nén vùng Tiền sử vào 14% đầu thước để 4.000 năm lịch sử thành văn không bị dồn thành 1 chấm ở mép phải.
 */
export function TimeRuler({ period, onPickStage }: { period: PublicPeriodDetailDto; onPickStage: (id: string) => void }) {
  const eventYears = period.events.map((e) => e.startYear).filter((y) => Number.isFinite(y) && y !== 0);
  const start =
    period.startYear && period.startYear !== 0
      ? period.startYear
      : eventYears.length
        ? Math.min(...eventYears)
        : NaN;
  const end =
    period.endYear && period.endYear !== 0
      ? period.endYear
      : eventYears.length
        ? Math.max(...eventYears)
        : new Date().getFullYear();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const historicYears = eventYears.filter((y) => y > PREHISTORIC_THRESHOLD_YEAR);
  const useSplitScale = start <= PREHISTORIC_THRESHOLD_YEAR && historicYears.length > 0 && end > PREHISTORIC_THRESHOLD_YEAR;
  const historicStart = useSplitScale ? Math.min(...historicYears) : start;
  const historicSpan = Math.max(1, end - historicStart);
  const preSpan = Math.max(1, historicStart - start);

  const pos = (year: number) => {
    if (!useSplitScale) {
      return Math.min(100, Math.max(0, ((year - start) / (end - start)) * 100));
    }
    if (year <= historicStart) {
      return Math.min(PREHISTORIC_ZONE_PERCENT, Math.max(0, ((year - start) / preSpan) * PREHISTORIC_ZONE_PERCENT));
    }
    return Math.min(
      100,
      PREHISTORIC_ZONE_PERCENT + ((year - historicStart) / historicSpan) * (100 - PREHISTORIC_ZONE_PERCENT),
    );
  };

  const clusters: Cluster[] = [];
  for (const e of [...period.events].sort((a, b) => a.startYear - b.startYear)) {
    const p = pos(e.startYear);
    const last = clusters[clusters.length - 1];
    if (last && p - last.pos < CLUSTER_GAP_PERCENT) last.events.push(e);
    else clusters.push({ pos: p, events: [e] });
  }

  const tickBaseStart = useSplitScale ? historicStart : start;
  const step = niceStep(end - tickBaseStart);
  const ticks: number[] = [];
  for (let t = Math.ceil(tickBaseStart / step) * step; t < end; t += step) {
    if (t === 0) continue;
    const p = pos(t);
    if (p > TICK_EDGE_PERCENT && p < 100 - TICK_EDGE_PERCENT) ticks.push(t);
  }

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
        {clusters.map((c, i) => {
          const alignClass = c.pos < 10 ? 'align-start' : c.pos > 90 ? 'align-end' : 'align-mid';
          return (
            <a
              key={c.events[0].id}
              href={`#ev-${c.events[0].id}`}
              className={`pd-ruler-dot ${c.events.length > 1 ? 'is-group' : ''} ${i % 2 ? 'label-low' : ''} ${alignClass}`}
              style={{ left: `${c.pos}%` }}
              title={c.events.map((e) => `${formatYear(e.startYear)} · ${e.title}`).join('\n')}
              aria-label={`${yearRange(c.events)}: ${c.events.length} sự kiện`}
            >
              {c.events.length > 1 && <b>{c.events.length}</b>}
              <span className="pd-ruler-dot-label">{yearRange(c.events)}</span>
            </a>
          );
        })}
      </div>
      <div className="pd-ruler-ticks">
        {!(clusters[0]?.pos < EDGE_DOT_PERCENT) && <span className="edge-start">{formatYear(start)}</span>}
        {ticks.map((t) => (
          <span key={t} style={{ left: `${pos(t)}%` }}>
            {formatYear(t)}
          </span>
        ))}
        {!(clusters[clusters.length - 1]?.pos > 100 - EDGE_DOT_PERCENT) && (
          <span className="edge-end">{period.endYear == null ? formatYear(end) : formatYear(end)}</span>
        )}
      </div>
    </div>
  );
}
