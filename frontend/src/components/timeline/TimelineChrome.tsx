'use client';

import { KeyboardKey } from '@/constants/enums';
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, BookOpen, Compass, Flag, MapPin, Bookmark, LayoutList, Search, SlidersHorizontal, ChevronDown, Layers, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { heroLandscape, TimelineFacetKey, type Era, type TimeNode, type TimelineEvent } from './sk-types';
import { RemoteImage } from '@/components/common/RemoteImage';
import { ChipGroup, FilterDialog, FilterSection, PickedCount, type ChipOption } from '@/components/filters/ChipFilter';
import Link from 'next/link';
import { EntityList } from './TimelineNodes';

// === SkUi.tsx ===
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`sk-button ${className}`} {...props} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`sk-badge ${className}`}>{children}</span>;
}

export function Heading({
  children,
  className = "",
  level = 2,
}: {
  children: ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return <Tag className={className}>{children}</Tag>;
}

export function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  sheet = false,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  sheet?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sk-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sk-modal-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="sk-content"
            role="dialog"
            aria-modal="true"
            className={`${sheet ? "sk-sheet" : "sk-dialog"} ${className}`}
            initial={sheet ? { x: "100%" } : { opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }}
            animate={sheet ? { x: 0 } : { opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={sheet ? { x: "100%" } : { opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }}
            transition={sheet ? { type: "spring", damping: 28, stiffness: 260 } : { duration: 0.18 }}
          >
            <div className="sk-modal-heading">
              <h2>{title}</h2>
              <Button aria-label="Đóng" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// === TimelineHero.tsx ===
export function TimelineHero({ periodCount, eventCount }: { periodCount: number; eventCount: number }) {
  return (
    <section className="sk-hero">
      <RemoteImage src={heroLandscape} alt="Núi non và dòng sông Ninh Bình" />
      <div className="sk-hero-shade" />
      <div className="sk-hero-content">
        <div className="sk-eyebrow">
          <span /> Mỗi dấu mốc, một câu chuyện
        </div>
        <h1>
          Chạm vào quá khứ.
          <br />
          <em>Hiểu hơn hiện tại.</em>
        </h1>
        <p>
          Khám phá dòng chảy lịch sử Việt Nam qua những sự kiện,
          <br className="sk-desktop-break" /> con người và vùng đất đã làm nên bản sắc dân tộc.
        </p>
        <div className="sk-hero-stats">
          <span>
            <BookOpen size={16} /> {periodCount} thời kỳ lịch sử
          </span>
          <i />
          <span>
            <Flag size={16} /> {eventCount} dấu mốc đáng nhớ
          </span>
          <i />
          <span>
            <Compass size={16} /> Vô vàn góc nhìn
          </span>
        </div>
      </div>
      <div className="sk-hero-location">
        <MapPin size={14} />
        <span>Tràng An, Ninh Bình</span>
        <span className="sk-photo-credit">Ảnh: Fernando Strabuli / Unsplash</span>
      </div>
      <span className="sk-hero-vertical">Hành trình xuyên thời gian</span>
    </section>
  );
}

// === FilterBar.tsx ===
/** Mỗi nhóm cho chọn nhiều giá trị; mảng rỗng = không lọc theo nhóm đó. */
export interface TimelineFilters {
  eras: string[];
  subs: string[];
  categories: string[];
}

export const EMPTY_FILTERS: TimelineFilters = { eras: [], subs: [], categories: [] };

export function activeFilterCount(filters: TimelineFilters): number {
  return filters.eras.length + filters.subs.length + filters.categories.length;
}

/** Bỏ một giá trị khỏi nhóm; bỏ thời kỳ thì bỏ luôn các giai đoạn thuộc thời kỳ đó. */
export function withoutValue(filters: TimelineFilters, key: keyof TimelineFilters, value: string, eras: Era[]): TimelineFilters {
  const next = { ...filters, [key]: filters[key].filter((v) => v !== value) };
  if (key === TimelineFacetKey.ERAS) {
    const dropped = new Set(eras.find((e) => e.id === value)?.subEras.map((s) => s.id));
    next.subs = next.subs.filter((s) => !dropped.has(s));
  }
  return next;
}

export function FilterBar({
  query,
  onQuery,
  filters,
  onFilters,
  onOpenSheet,
  eras,
  subs,
  compact,
  onCompact,
  bookmarksOnly,
  onBookmarksOnly,
  savedCount,
  onOpenToc,
  eraCount = 0,
}: {
  query: string;
  onQuery: (v: string) => void;
  filters: TimelineFilters;
  onFilters: (f: TimelineFilters) => void;
  onOpenSheet: () => void;
  eras: Era[];
  subs: Era["subEras"];
  compact: boolean;
  onCompact: () => void;
  bookmarksOnly: boolean;
  onBookmarksOnly: () => void;
  savedCount: number;
  onOpenToc?: () => void;
  eraCount?: number;
}) {
  const count = activeFilterCount(filters);
  // Bộ lọc đang bật hiển thị thành chip có nút xóa, để không phải mở lại hộp thoại.
  const chips: Array<{ key: keyof TimelineFilters; value: string; label: string }> = [
    ...filters.eras.map((v) => ({ key: "eras" as const, value: v, label: eras.find((e) => e.id === v)?.title ?? "Thời kỳ" })),
    ...filters.subs.map((v) => ({ key: "subs" as const, value: v, label: subs.find((s) => s.id === v)?.title ?? "Giai đoạn" })),
    ...filters.categories.map((v) => ({ key: "categories" as const, value: v, label: v })),
  ];

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
      {onOpenToc && (
        <Button
          className="sk-toc-filter-btn"
          onClick={onOpenToc}
          title="Mở mục lục danh sách các thời kỳ lịch sử"
        >
          <BookOpen size={16} />
          <span>Mục lục</span>
          {eraCount > 0 && <span className="sk-badge">{eraCount}</span>}
        </Button>
      )}
      <Button className={`sk-filter-open ${count ? "sk-is-on" : ""}`} onClick={onOpenSheet} aria-haspopup="dialog">
        <SlidersHorizontal size={16} />
        <span>Bộ lọc</span>
        {count > 0 && <span className="sk-badge">{count}</span>}
      </Button>
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
      {chips.length > 0 && (
        <div className="sk-active-filters">
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() => onFilters(withoutValue(filters, c.key, c.value, eras))}
              aria-label={`Bỏ lọc ${c.label}`}
            >
              {c.label}
              <X size={13} />
            </button>
          ))}
          {chips.length > 1 && (
            <button type="button" className="sk-active-clear" onClick={() => onFilters(EMPTY_FILTERS)}>
              Xóa tất cả
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// === FilterSheet.tsx ===
export function FilterSheet({
  open,
  value,
  onApply,
  onClose,
  countFor,
  eras,
  categories,
}: {
  open: boolean;
  value: TimelineFilters;
  onApply: (filters: TimelineFilters) => void;
  onClose: () => void;
  countFor: (filters: TimelineFilters) => number;
  eras: Era[];
  categories: string[];
}) {
  const eraOptions: ChipOption[] = eras.map((e) => ({ value: e.id, label: e.title, hint: e.periodLabel }));

  return (
    <FilterDialog open={open} value={value} empty={EMPTY_FILTERS} countFor={countFor} onApply={onApply} onClose={onClose}>
      {(draft, setDraft) => {
        const toggle = (key: keyof TimelineFilters, v: string) =>
          setDraft((d) => (d[key].includes(v) ? withoutValue(d, key, v, eras) : { ...d, [key]: [...d[key], v] }));

        return (
          <>
            <FilterSection card title="Thời kỳ" aside={<PickedCount count={draft.eras.length + draft.subs.length} />}>
              <ChipGroup options={eraOptions} selected={draft.eras} onToggle={(v) => toggle("eras", v)} searchLabel="Tìm thời kỳ..." />
              {/* Chọn thời kỳ nào thì hiện giai đoạn của thời kỳ đó để thu hẹp thêm. */}
              {eras
                .filter((e) => draft.eras.includes(e.id) && e.subEras.length > 1)
                .map((e) => (
                  <div key={e.id}>
                    <div className="sk-fs-sublabel">Giai đoạn · {e.title}</div>
                    <ChipGroup
                      options={e.subEras.map((s) => ({ value: s.id, label: s.title }))}
                      selected={draft.subs}
                      onToggle={(v) => toggle("subs", v)}
                      searchLabel="Tìm giai đoạn..."
                    />
                  </div>
                ))}
            </FilterSection>

            {categories.length > 0 && (
              <FilterSection title="Danh mục sự kiện" aside={<PickedCount count={draft.categories.length} />}>
                <ChipGroup
                  options={categories.map((c) => ({ value: c, label: c }))}
                  selected={draft.categories}
                  onToggle={(v) => toggle("categories", v)}
                  searchLabel="Tìm danh mục..."
                />
              </FilterSection>
            )}
          </>
        );
      }}
    </FilterDialog>
  );
}

// === Minimap.tsx ===
/** "Giai đoạn Trưng Nữ Vương (40 - 43)" → "Giai đoạn Trưng Nữ Vương": năm đã có ở chip riêng. */
export function shortTitle(title: string): string {
  return title.replace(/\s*\([^()]*\d[^()]*\)\s*$/, "").trim() || title;
}

/** Tên giai đoạn trong cột hẹp: bỏ tiền tố lặp lại ("Thời kỳ", "Giai đoạn"...) — tên đầy đủ ở tooltip. */
function sidebarName(title: string): string {
  const short = shortTitle(title).replace(/^(Thời kỳ|Thời đại|Giai đoạn)\s+/i, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** "2879 TCN – 208 TCN" → "2879–208 TCN" khi hai đầu cùng hậu tố, để chip năm gọn. */
function compactPeriod(label: string): string {
  const cleaned = label.replace(/[()]/g, "").trim();
  const match = cleaned.match(/^(\d+)\s*(TCN|CN)?\s*[–-]\s*(\d+|Nay)\s*(TCN|CN)?$/);
  if (!match) return cleaned;
  const [, from, fromEra, to, toEra] = match;
  if (fromEra && fromEra === toEra) return `${from}–${to} ${toEra}`;
  return `${from}${fromEra ? ` ${fromEra}` : ""}–${to}${toEra ? ` ${toEra}` : ""}`;
}

export function Minimap({
  eras,
  active,
  totalEvents,
  onJumpEra,
  onJumpSubEra,
}: {
  eras: Era[];
  active: string;
  totalEvents: number;
  onJumpEra: (era: Era) => void;
  onJumpSubEra: (subEraId: string) => void;
}) {
  // Chỉ mở thời kỳ đang xem; người dùng có thể mở/thu thêm bằng tay.
  const activeEraId = useMemo(() => eras.find((e) => e.subEras.some((s) => s.id === active))?.id, [eras, active]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (eraId: string) => toggled[eraId] ?? (eraId === (activeEraId ?? eras[0]?.id));

  return (
    <aside className="sk-minimap">
      <div className="sk-minimap-title">
        <Layers size={16} /> Các thời kỳ
      </div>
      {eras.length === 0 && <p className="sk-minimap-empty">Không có thời kỳ nào khớp bộ lọc.</p>}
      {eras.map((e, i) => {
        const open = isOpen(e.id);
        const nodeCount = e.subEras.reduce((n, s) => n + s.timeNodes.length, 0);
        return (
          <div className={`sk-tree-era ${open ? "sk-open" : ""}`} key={e.id}>
            <div className="sk-tree-parent-row">
              <Button className="sk-tree-parent" onClick={() => onJumpEra(e)} title={e.title}>
                <span className="sk-era-number">{String(i + 1).padStart(2, "0")}</span>
                <span className="sk-tree-text">
                  <strong>{shortTitle(e.title)}</strong>
                  <small>
                    {compactPeriod(e.periodLabel)} · {e.subEras.length} giai đoạn · {nodeCount} mốc
                  </small>
                </span>
              </Button>
              <Button
                className="sk-tree-toggle"
                aria-label={open ? "Thu gọn thời kỳ" : "Mở thời kỳ"}
                aria-expanded={open}
                onClick={() => setToggled((t) => ({ ...t, [e.id]: !open }))}
              >
                <ChevronDown size={14} />
              </Button>
            </div>
            {open && (
              <div className="sk-tree-children">
                {e.subEras.map((s) => (
                  <Button
                    key={s.id}
                    className={active === s.id ? "sk-active" : ""}
                    onClick={() => onJumpSubEra(s.id)}
                    title={`${s.title} — ${s.timeNodes.length} mốc`}
                  >
                    <span className="sk-tree-dot" />
                    <span className="sk-tree-name">
                      {sidebarName(s.title)}
                      <small>
                        {compactPeriod(s.periodLabel)} · {s.timeNodes.length} mốc
                      </small>
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="sk-sidebar-bottom">
        <span className="sk-status-dot" /> Đang khám phá {totalEvents} dấu mốc
      </div>
    </aside>
  );
}

// === EventDetailModal.tsx ===
export function EventDetailModal({
  detail,
  onClose,
  onSelect,
  onStep,
}: {
  detail: { event: TimelineEvent; node: TimeNode } | null;
  onClose: () => void;
  onSelect: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <Modal open={!!detail} onClose={onClose} title="Câu chuyện lịch sử" sheet>
      {detail && (
        <>
          {detail.event.imageUrl && (
            <RemoteImage className="sk-detail-image" src={detail.event.imageUrl} alt={detail.event.title} />
          )}
          <div className="sk-detail-body">
            <Badge>{detail.event.category}</Badge>
            <span className="sk-detail-date">{detail.event.dateLabel}</span>
            <Heading level={1}>{detail.event.title}</Heading>
            {detail.event.dateNote && detail.event.dateNote !== detail.event.dateLabel && (
              <p className="sk-detail-note">{detail.event.dateNote}</p>
            )}
            <div className="sk-detail-text">{detail.event.content}</div>
            {detail.event.slug && (
              <Link
                className="sk-related-event"
                href={`/su-kien/${detail.event.slug}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                Xem chi tiết sự kiện <ArrowUpRight size={16} />
              </Link>
            )}
            <Heading level={2}>Nhân vật & địa danh</Heading>
            <EntityList figures={detail.event.figures || []} locations={detail.event.locations || []} tab="figures" />
            <EntityList figures={detail.event.figures || []} locations={detail.event.locations || []} tab="locations" />
            <Heading level={2}>Cùng thời điểm</Heading>
            {detail.node.events
              .filter((ev) => ev.id !== detail.event.id)
              .map((ev) => (
                <Button
                  className="sk-related-event"
                  key={ev.id}
                  onClick={() => onSelect({ event: ev, node: detail.node })}
                >
                  {ev.title}
                  <ArrowUpRight size={16} />
                </Button>
              ))}
            {detail.node.events.length === 1 && (
              <p className="sk-muted">Bạn đang xem sự kiện tiêu biểu tại dấu mốc này.</p>
            )}
            <div className="sk-drawer-navigation">
              <Button onClick={() => onStep(-1)}>
                <ArrowLeft size={16} /> Sự kiện trước
              </Button>
              <Button onClick={() => onStep(1)}>
                Sự kiện tiếp theo <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
