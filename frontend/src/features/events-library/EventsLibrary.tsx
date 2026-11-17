'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
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
import { formatYear, normalizeSearch, shortPeriodName } from '@/features/search/search-index';
import { categoryKeyLabel, eventCategoryLabel, useEventCategories } from '@/hooks/useEventCategories';
import type { PublicEventSummaryDto, PublicPeriodDto } from '@/services/entities/landing.service';
import { findRootTopic, groupByTopic, type TopicBlock, type TopicLeafGroup } from '@/services/entities/landing-graph';
import type { PublicTopicRef } from '@/services/public/public-content.service';
import { TocDrawer, type TocNode } from '@/components/common/TocDrawer';
import './events-library.css';
import { RemoteImage } from '@/components/common/RemoteImage';

enum LibraryViewMode {
  GRID = 'grid',
  LIST = 'list',
}

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
/** Id khớp với TopicBlockSection/TopicLeafHeading bên dưới. */
function jumpToTopic(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function EventsLibrary({
  events,
  periods,
  topics,
}: {
  events: PublicEventSummaryDto[];
  periods: PublicPeriodDto[];
  topics: PublicTopicRef[];
}) {
  const eventCategories = useEventCategories();
  const rows = useMemo(() => buildRows(events, periods), [events, periods]);
  const primaryLabel = (event: PublicEventSummaryDto) => eventCategoryLabel(eventCategories, event);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>(EMPTY);
  const [sort, setSort] = useState<Sort>(EventSortOption.YEAR_ASC);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<LibraryViewMode>(LibraryViewMode.GRID);
  const [tocOpen, setTocOpen] = useState(false);

  const needle = normalizeSearch(query.trim());

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

  const topicBlocks = useMemo(
    () =>
      groupByTopic(visible, (r) => r.event.topicId ?? null, {
        topics,
        rootTopicOf: (id) => findRootTopic(topics, id),
      }),
    [visible, topics],
  );

  const tocNodes: TocNode[] = useMemo(
    () =>
      topicBlocks.map((block) => {
        const total = block.leaves.reduce((n, l) => n + l.items.length, 0);
        const singleLeaf = block.leaves.length === 1 && block.leaves[0].id === block.id;
        return {
          id: `topic-${block.id}`,
          title: block.name,
          count: total,
          children: singleLeaf
            ? undefined
            : block.leaves.map((leaf) => ({
                id: `topic-leaf-${leaf.id}`,
                title: leaf.name,
                count: leaf.items.length,
              })),
        };
      }),
    [topicBlocks],
  );

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
                {categories.length > 0 && (
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
                )}
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

        {/* Nội dung danh sách sự kiện, chia khối theo Chủ đề */}
        {visible.length > 0 ? (
          topicBlocks.map((block) => (
            <TopicBlockSection key={block.id} block={block}>
              {block.leaves.map((leaf) => (
                <div key={leaf.id} id={`topic-leaf-${leaf.id}`} className="sk-sub-era">
                  {block.leaves.length > 1 && <TopicLeafHeading leaf={leaf} />}
                  {viewMode === LibraryViewMode.GRID ? (
                    <div className="el-grid">
                      {leaf.items.map((row) => (
                        <EventCard key={row.event.id} row={row} primaryLabel={primaryLabel} />
                      ))}
                    </div>
                  ) : (
                    <ol className="el-list">
                      {leaf.items.map((row) => (
                        <EventListItem key={row.event.id} row={row} primaryLabel={primaryLabel} />
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </TopicBlockSection>
          ))
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

      <button
        type="button"
        className="sk-toc-floating-side-tab"
        onClick={() => setTocOpen(true)}
        title="Mục lục chủ đề sự kiện"
        aria-label="Mở mục lục chủ đề"
      >
        <BookOpen size={15} />
        <span>Mục lục</span>
      </button>

      <TocDrawer
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        heading="Mục lục chủ đề"
        itemLabel="sự kiện"
        nodes={tocNodes}
        totalCount={visible.length}
        onJump={jumpToTopic}
      />
    </div>
  );
}

/** Giống TopicSection ở Danh bạ nhân vật. */
function TopicBlockSection({ block, children }: { block: TopicBlock<EventRow>; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const total = block.leaves.reduce((n, l) => n + l.items.length, 0);
  return (
    <section className="sk-era-section" id={`topic-${block.id}`}>
      <button type="button" className="sk-era-banner sk-button" onClick={() => setOpen((v) => !v)}>
        <span>
          <strong>{block.name}</strong>
          <small>
            {total} sự kiện · {block.leaves.length} chủ đề con
          </small>
        </span>
        <ChevronDown size={16} className={open ? '' : 'sk-rotate'} />
      </button>
      {open && children}
    </section>
  );
}

function TopicLeafHeading({ leaf }: { leaf: TopicLeafGroup<EventRow> }) {
  return (
    <div className="sk-sub-heading">
      <div>
        <h3>{leaf.name}</h3>
        <span className="sk-sub-count">{leaf.items.length} sự kiện</span>
      </div>
    </div>
  );
}

function EventCard({
  row: { event, eraName },
  primaryLabel,
}: {
  row: EventRow;
  primaryLabel: (event: PublicEventSummaryDto) => string;
}) {
  const place = event.locations[0]?.name ?? event.location;
  const href = event.slug ? `/su-kien/${event.slug}` : null;
  const yearLabel =
    event.endYear && event.endYear !== event.startYear
      ? `${formatYear(event.startYear)} – ${formatYear(event.endYear)}`
      : formatYear(event.startYear);

  return (
    <article className="el-card">
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

        <h3 className="el-card-title">{href ? <Link href={href}>{event.title}</Link> : event.title}</h3>

        {event.description && <p className="el-card-desc">{event.description}</p>}

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
}

function EventListItem({
  row: { event, eraName },
  primaryLabel,
}: {
  row: EventRow;
  primaryLabel: (event: PublicEventSummaryDto) => string;
}) {
  const place = event.locations[0]?.name ?? event.location;
  const placeSlug = event.locations[0]?.slug;
  const href = event.slug ? `/su-kien/${event.slug}` : null;
  const yearLabel =
    event.endYear && event.endYear !== event.startYear
      ? `${formatYear(event.startYear)}–${formatYear(event.endYear)}`
      : formatYear(event.startYear);

  return (
    <li className="el-list-item">
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
}
