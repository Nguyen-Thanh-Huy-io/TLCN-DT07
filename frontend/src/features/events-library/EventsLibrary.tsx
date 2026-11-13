'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownUp,
  ArrowRight,
  Calendar,
  History,
  ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { ChipGroup, FilterDialog, FilterSection, PickedCount, toggleValue } from '@/components/filters/ChipFilter';
import { Pagination } from '@/components/common/Pagination';
import { formatYear, normalizeSearch, shortPeriodName } from '@/features/search/search-index';
import { categoryKeyLabel, eventCategoryLabel, useEventCategories } from '@/hooks/useEventCategories';
import type { PublicEventSummaryDto, PublicPeriodDto } from '@/services/entities/landing.service';
import './events-library.css';
import { RemoteImage } from '@/components/common/RemoteImage';

enum LibraryViewMode {
  GRID = 'grid',
  LIST = 'list',
}

/** Giá trị "chưa gắn" dùng chung cho nhóm thời kỳ. */
const NO_PERIOD = '__none__';
const PAGE_SIZE = 12;

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
  eras: string[];
  categories: string[];
  links: string[];
}
const EMPTY: EventFilters = { eras: [], categories: [], links: [] };
const filterCount = (f: EventFilters) => f.eras.length + f.categories.length + f.links.length;

interface EventRow {
  event: PublicEventSummaryDto;
  eraId: string;
  eraName: string | null;
  haystack: string;
  linkFlags: Set<LinkKey>;
}

function buildRows(events: PublicEventSummaryDto[], periods: PublicPeriodDto[]): EventRow[] {
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
      haystack: normalizeSearch(
        [
          event.title,
          event.description ?? '',
          event.location ?? '',
          ...event.figures.map((f) => f.name),
          String(event.startYear),
        ].join(' '),
      ),
      linkFlags: flags,
    };
  });
}

function matches(row: EventRow, f: EventFilters, needle: string): boolean {
  if (f.eras.length && !f.eras.includes(row.eraId)) return false;
  if (f.categories.length && !f.categories.some((c) => row.event.categoryIds?.includes(c))) return false;
  if (f.links.length && !f.links.some((l) => row.linkFlags.has(l as LinkKey))) return false;
  return !needle || row.haystack.includes(needle);
}

/**
 * Thư viện sự kiện: Lưới thẻ sự kiện tạp chí lịch sử chuyên nghiệp
 * Hỗ trợ chuyển đổi Grid / List, phân trang Pagination rõ ràng.
 */
export function EventsLibrary({ events, periods }: { events: PublicEventSummaryDto[]; periods: PublicPeriodDto[] }) {
  const eventCategories = useEventCategories();
  const rows = useMemo(() => buildRows(events, periods), [events, periods]);
  const primaryLabel = (event: PublicEventSummaryDto) => eventCategoryLabel(eventCategories, event);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>(EMPTY);
  const [sort, setSort] = useState<Sort>(EventSortOption.YEAR_ASC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<LibraryViewMode>(LibraryViewMode.GRID);
  const [currentPage, setCurrentPage] = useState(1);

  const needle = normalizeSearch(query.trim());

  // Reset trang về 1 khi đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    void Promise.resolve().then(() => {
      setCurrentPage(1);
    });
  }, [query, filters, sort]);

  const eras = useMemo(() => {
    const seen = new Map<string, { label: string; start: number }>();
    for (const r of rows) {
      if (!seen.has(r.eraId)) {
        const p = periods.find((x) => x.id === r.eraId);
        seen.set(r.eraId, { label: r.eraName ?? LINK_OPTIONS.NO_PERIOD, start: p?.startYear ?? Infinity });
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

  // Phân trang dữ liệu
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [visible, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('el-content-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chips = [
    ...filters.eras.map((v) => ({ key: 'eras' as const, value: v, label: eras.find(([id]) => id === v)?.[1].label ?? v })),
    ...filters.categories.map((v) => ({ key: 'categories' as const, value: v, label: categoryKeyLabel(eventCategories, v) })),
    ...filters.links.map((v) => ({ key: 'links' as const, value: v, label: LINK_OPTIONS[v as LinkKey] })),
  ];
  const active = filterCount(filters);

  return (
    <div className="sk-app el-app">
      {/* Intro Header */}
      <section className="el-intro">
        <span className="sk-section-eyebrow">KHO TƯ LIỆU LỊCH SỬ</span>
        <h1>Thư viện Sự kiện Lịch sử</h1>
        <p>
          Khám phá {rows.length} dấu mốc lịch sử hào hùng của dân tộc Việt Nam và thế giới. Tra cứu toàn diện theo niên đại,
          thời kỳ, nhân vật và chiến trường xưa.
        </p>
      </section>

      <div className="el-wrap" id="el-content-anchor">
        {/* Filter Bar */}
        <div className="sk-filter-bar">
          <div className="sk-search-field">
            <Search size={17} />
            <input
              aria-label="Tìm sự kiện"
              placeholder="Tìm tên sự kiện, năm, nhân vật, địa danh..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="sk-button" aria-label="Xóa tìm kiếm" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`sk-button sk-filter-open ${active ? 'sk-is-on' : ''}`}
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Bộ lọc</span>
            {active > 0 && <span className="sk-badge">{active}</span>}
          </button>

          <div className="sk-split-segment" role="group" aria-label="Sắp xếp sự kiện">
            <ArrowDownUp size={13} />
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <button
                key={s}
                type="button"
                className={sort === s ? 'sk-selected' : ''}
                aria-pressed={sort === s}
                onClick={() => setSort(s)}
              >
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Nút chuyển chế độ xem Grid / List */}
          <div className="el-view-mode-toggle" role="group" aria-label="Chế độ hiển thị">
            <button
              type="button"
              className={`el-view-btn ${viewMode === LibraryViewMode.GRID ? 'sk-active' : ''}`}
              onClick={() => setViewMode(LibraryViewMode.GRID)}
              title="Xem dạng lưới thẻ tạp chí"
              aria-label="Xem dạng lưới"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`el-view-btn ${viewMode === LibraryViewMode.LIST ? 'sk-active' : ''}`}
              onClick={() => setViewMode(LibraryViewMode.LIST)}
              title="Xem dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List size={16} />
            </button>
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

        {/* Modal Bộ lọc Dialog */}
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
            const eraOptions = eras.map(([id, e]) => ({ value: id, label: e.label, hint: `${count((r) => r.eraId === id)} sự kiện` }));
            const categories = eventCategories
              .map((cat) => ({ cat, n: count((r) => Boolean(r.event.categoryIds?.includes(cat.id))) }))
              .filter((c) => c.n > 0);
            const links = (Object.keys(LINK_OPTIONS) as LinkKey[]).filter((k) => count((r) => r.linkFlags.has(k)) > 0);
            return (
              <>
                <FilterSection card title="Thời kỳ" aside={<PickedCount count={draft.eras.length} />}>
                  <ChipGroup options={eraOptions} selected={draft.eras} onToggle={(v) => toggle('eras', v)} searchLabel="Tìm thời kỳ..." />
                </FilterSection>
                <FilterSection title="Danh mục sự kiện" aside={<PickedCount count={draft.categories.length} />}>
                  <ChipGroup
                    options={categories.map(({ cat, n }) => ({
                      value: cat.id,
                      label: cat.name,
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

        {/* Status Toolbar */}
        <div className="el-toolbar">
          <span>
            Tìm thấy <strong>{visible.length}</strong> sự kiện lịch sử
          </span>
          {active > 0 && (
            <button
              type="button"
              className="el-reset-link"
              onClick={() => {
                setQuery('');
                setFilters(EMPTY);
              }}
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Nội dung danh sách sự kiện */}
        {visible.length > 0 ? (
          <>
            {viewMode === LibraryViewMode.GRID ? (
              /* DẠNG 1: LƯỚI THẺ SỰ KIỆN TẠP CHÍ (CARD GRID) */
              <div className="el-grid">
                {paginatedRows.map(({ event, eraName }) => {
                  const place = event.locations[0]?.name ?? event.location;
                  const href = event.slug ? `/su-kien/${event.slug}` : null;
                  const yearLabel = event.endYear && event.endYear !== event.startYear
                    ? `${formatYear(event.startYear)} – ${formatYear(event.endYear)}`
                    : formatYear(event.startYear);

                  return (
                    <article key={event.id} className="el-card">
                      {/* Ảnh bìa sự kiện */}
                      <div className="el-card-media">
                        {event.imageUrl ? (
                          <RemoteImage src={event.imageUrl} alt={event.title} loading="lazy" />
                        ) : (
                          <div className="el-card-fallback-media">
                            <ImageIcon size={32} className="opacity-30" />
                          </div>
                        )}
                        <span className="el-card-year-badge">
                          <Calendar size={12} />
                          {yearLabel}
                        </span>
                      </div>

                      {/* Thân thẻ sự kiện */}
                      <div className="el-card-body">
                        <div className="el-card-meta-top">
                          <span className="el-tag">{primaryLabel(event)}</span>
                          <span className="el-era-tag">{eraName ? `${eraName}` : 'Thời kỳ chung'}</span>
                        </div>

                        <h3 className="el-card-title">
                          {href ? <Link href={href}>{event.title}</Link> : event.title}
                        </h3>

                        {event.description && (
                          <p className="el-card-desc">{event.description}</p>
                        )}

                        {/* Thông tin nhân vật và địa danh */}
                        <div className="el-card-entities">
                          {event.figures.length > 0 && (
                            <div className="el-card-entity-item" title={event.figures.map((f) => f.name).join(', ')}>
                              <Users size={13} />
                              <span>
                                {event.figures.slice(0, 2).map((f) => f.name).join(', ')}
                                {event.figures.length > 2 && ` +${event.figures.length - 2}`}
                              </span>
                            </div>
                          )}
                          {place && (
                            <div className="el-card-entity-item" title={place}>
                              <MapPin size={13} />
                              <span>{place}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer thẻ */}
                        {href && (
                          <div className="el-card-footer">
                            <Link href={href} className="el-card-link">
                              <span>Khám phá sự kiện</span>
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* DẠNG 2: DANH SÁCH CHI TIẾT (LIST VIEW) */
              <ol className="el-list">
                {paginatedRows.map(({ event, eraName }) => {
                  const place = event.locations[0]?.name ?? event.location;
                  const placeSlug = event.locations[0]?.slug;
                  const href = event.slug ? `/su-kien/${event.slug}` : null;
                  const yearLabel = event.endYear && event.endYear !== event.startYear
                    ? `${formatYear(event.startYear)}–${formatYear(event.endYear)}`
                    : formatYear(event.startYear);

                  return (
                    <li key={event.id} className="el-list-item">
                      <div className="el-list-year">
                        <strong>{yearLabel}</strong>
                        <span className="el-tag">{primaryLabel(event)}</span>
                      </div>
                      <div className="el-main">
                        {href ? <Link href={href}>{event.title}</Link> : <strong>{event.title}</strong>}
                        {event.description && <p className="el-list-desc">{event.description}</p>}
                        <div className="el-meta">
                          <span>{eraName ?? 'Chưa gắn thời kỳ'}</span>
                          {event.figures.length > 0 && (
                            <span>
                              <Users size={12} />
                              {event.figures.slice(0, 2).map((f) => f.name).join(', ')}
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
            )}

            {/* Phân trang Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={visible.length}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              itemLabel="sự kiện lịch sử"
            />
          </>
        ) : (
          <div className="sk-empty">
            <History size={36} />
            <h2>Chưa tìm thấy sự kiện</h2>
            <p>Thử từ khóa khác hoặc xóa bớt các tiêu chí lọc đang chọn.</p>
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
