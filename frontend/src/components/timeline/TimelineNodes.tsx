'use client';

import Link from 'next/link';
import { ArrowUpRight, MapPin, Users, ArrowRight, BookOpen, Bookmark, Flag, Landmark, Network, Swords, TimerReset, Plus, Undo2 } from 'lucide-react';
import { Heading, Badge, Button } from './TimelineChrome';
import { NodeContentTab, EventDomainGroup, SK_SELECTED_CLASS, TimelineActorType, type TimelineFigure, type TimelineLocation, type TimelineEvent, type TimeNode, type TimelineActor } from './sk-types';
import { useFigureProfile } from '@/components/figures/FigureProfileParts';
import { RemoteImage } from '@/components/common/RemoteImage';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, createContext, useContext } from 'react';

// === EntityList.tsx ===
/** Mở hồ sơ nhân vật tại chỗ (modal) nếu có Provider bao ngoài; không thì mới điều hướng sang /nhan-vat?nv=. */
function FigureLink({ slug, name }: { slug: string; name: string }) {
  const figureProfile = useFigureProfile();
  const href = `/nhan-vat?nv=${encodeURIComponent(slug)}`;
  const content = (
    <>
      {name} <ArrowUpRight size={14} className="sk-entity-link-icon" />
    </>
  );
  if (!figureProfile) return <Link href={href}>{content}</Link>;
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        figureProfile.openFigure(slug);
      }}
    >
      {content}
    </a>
  );
}

type WithEvents<T> = T & { eventTitles?: string[] };

function EventTitles({ titles }: { titles?: string[] }) {
  if (!titles || titles.length === 0) return null;
  return <small className="sk-entity-events">Trong sự kiện: {titles.join("; ")}</small>;
}

export function EntityList({
  figures,
  locations,
  tab,
  showEventTitles = false,
}: {
  figures: WithEvents<TimelineFigure>[];
  locations: WithEvents<TimelineLocation>[];
  tab: NodeContentTab | string;
  showEventTitles?: boolean;
}) {
  if (tab === NodeContentTab.FIGURES) {
    if (figures.length === 0) {
      return <p className="sk-muted">Chưa có nhân vật nào được liên kết.</p>;
    }
    return (
      <div className="sk-entity-list">
        {figures.map((f) => (
          <div className="sk-entity-card" key={f.id}>
            <div className="sk-entity-icon">
              {f.avatarUrl ? <RemoteImage src={f.avatarUrl} alt={f.name} /> : <Users size={21} />}
            </div>
            <div>
              <Heading level={3}>
                {f.slug ? <FigureLink slug={f.slug} name={f.name} /> : f.name}
              </Heading>
              <Badge>{f.role}</Badge>
              {showEventTitles && <EventTitles titles={f.eventTitles} />}
              <p>{f.bio}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return <p className="sk-muted">Chưa có địa điểm nào được liên kết.</p>;
  }
  return (
    <div className="sk-entity-list">
      {locations.map((l) => (
        <div className="sk-entity-card" key={l.id}>
          <div className="sk-entity-icon">
            <MapPin size={21} />
          </div>
          <div>
            <Heading level={3}>{l.name}</Heading>
            <small>
              {l.modernName}
              {l.coordinates && ` · ${l.coordinates}`}
            </small>
            {showEventTitles && <EventTitles titles={l.eventTitles} />}
            <p>{l.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// === EventCard.tsx ===
function renderCategoryIcon(event: TimelineEvent) {
  const slug = event.categoryCode.toLowerCase();
  if (/tran-danh|chien-tranh|quan-su|khang-chien/.test(slug)) return <Swords size={12} />;
  if (/cach-mang|khoi-nghia|chinh-tri/.test(slug)) return <Flag size={12} />;
  if (event.domainGroup === EventDomainGroup.ECONOMY_CULTURE) return <BookOpen size={12} />;
  return <Landmark size={12} />;
}

export function EventCard({
  event,
  onOpen,
  saved,
  onSave,
}: {
  event: TimelineEvent;
  onOpen: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const { focus, lens, related, setFocus, setLens, reveal, flashId } = useTimelineFocus();
  const reasons = related.get(event.id);
  const isFocus = focus?.id === event.id;
  // Chế độ Liên kết / lăng kính chủ thể: sự kiện liên quan sáng lên, phần còn lại mờ đi.
  const focusClass = !focus && !lens ? "" : isFocus ? "sk-focus-self" : reasons ? "sk-focus-related" : "sk-focus-dim";
  const category = (
    <Badge className="sk-category">
      {renderCategoryIcon(event)}
      {event.category}
    </Badge>
  );
  const saveButton = (
    <Button
      className={`sk-save-card ${saved ? "sk-saved" : ""}`}
      aria-label={saved ? "Bỏ lưu sự kiện" : "Lưu sự kiện"}
      onClick={(e) => {
        e.stopPropagation();
        onSave();
      }}
    >
      <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
    </Button>
  );

  return (
    <motion.article
      layout
      id={`ev-${event.id}`}
      className={`sk-event-card ${event.imageUrl ? "" : "sk-no-image"} ${focusClass} ${flashId === `ev-${event.id}` ? "sk-flash" : ""}`}
    >
      {event.imageUrl && (
        <div className="sk-card-image" onClick={onOpen}>
          <RemoteImage src={event.imageUrl} alt={event.title} loading="lazy" />
          <div className="sk-image-overlay" />
          {category}
          {saveButton}
        </div>
      )}
      <div className="sk-card-body">
        {!event.imageUrl && (
          <div className="sk-card-head">
            {category}
            {saveButton}
          </div>
        )}
        <div className="sk-card-meta">
          <span>{event.spanLabel ?? event.dateLabel}</span>
        </div>
        {event.actors.length > 0 && (
          <div className="sk-actors">
            {event.actors.slice(0, 3).map((a) => (
              <button
                key={a.id}
                type="button"
                className={`sk-actor-chip ${lens?.id === a.id ? SK_SELECTED_CLASS : ""}`}
                title="Xem mọi sự kiện có chủ thể này trên dòng thời gian"
                onClick={() => setLens(lens?.id === a.id ? null : a)}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
        {reasons && (
          <ul className="sk-related-reasons">
            {reasons.slice(0, 3).map((r) => (
              <li key={r.text} className={r.strong ? "sk-strong" : ""}>
                {r.text}
              </li>
            ))}
            {reasons.length > 3 && <li>+{reasons.length - 3} liên kết khác</li>}
          </ul>
        )}
        <Button className="sk-card-title" onClick={onOpen}>
          <Heading level={3}>{event.title}</Heading>
          <ArrowRight size={17} />
        </Button>
        <p>{event.summary}</p>
        <div className="sk-card-footer">
          <div className="sk-tags">
            {event.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
          <div className="sk-card-actions">
            {(event.endYear !== undefined || event.endedByEventId) && (
              <Button
                className="sk-link-button"
                title="Cuộn tới mốc kết thúc của sự kiện này"
                onClick={() => reveal(`end-${event.id}`)}
              >
                <TimerReset size={13} /> Lúc kết thúc
              </Button>
            )}
            <Button
              className={`sk-link-button ${isFocus ? SK_SELECTED_CLASS : ""}`}
              title="Làm sáng các sự kiện liên quan trên dòng thời gian"
              aria-pressed={isFocus}
              onClick={() => setFocus(isFocus ? null : event)}
            >
              <Network size={13} /> {isFocus ? "Tắt liên kết" : "Liên kết"}
            </Button>
            <Button onClick={onOpen}>
              Khám phá <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// === NodeContent.tsx ===
export function NodeContent({
  node,
  onDetail,
  onSave,
  saved,
  workspace = false,
}: {
  node: TimeNode;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
  workspace?: boolean;
}) {
  const [tab, setTab] = useState<NodeContentTab>(NodeContentTab.EVENTS);
  const [more, setMore] = useState(false);

  const tabs = [
    { id: NodeContentTab.EVENTS, label: "Sự kiện", icon: BookOpen, count: node.events.length },
    { id: NodeContentTab.FIGURES, label: "Nhân vật", icon: Users, count: node.figures.length },
    { id: NodeContentTab.LOCATIONS, label: "Địa điểm", icon: MapPin, count: node.locations.length },
  ];

  return (
    <div className={`sk-node-card-group ${workspace ? "sk-workspace-cards" : ""}`}>
      <div className="sk-entity-tabs" role="tablist">
        {tabs.map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "sk-selected" : ""}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={13} />
            {t.label}
            <span>{t.count}</span>
          </Button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {tab === NodeContentTab.EVENTS ? (
            <div className="sk-event-list">
              {node.events.slice(0, more ? undefined : 2).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onOpen={() => onDetail({ event, node })}
                  saved={saved.includes(event.id)}
                  onSave={() => onSave(event.id)}
                />
              ))}
              {node.events.length > 2 && (
                <Button className="sk-more-events" onClick={() => setMore(!more)}>
                  <Plus size={14} />
                  {more ? "Thu gọn sự kiện" : `Xem thêm ${node.events.length - 2} sự kiện cùng thời điểm`}
                </Button>
              )}
            </div>
          ) : (
            <EntityList
              figures={node.figures}
              locations={node.locations}
              tab={tab}
              showEventTitles={node.events.length > 1}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// === TimelineNodeItem.tsx ===
/** Các sự kiện kéo dài kết thúc tại mốc này, kèm nút quay về lúc bắt đầu. */
function EndingList({ node }: { node: TimeNode }) {
  const { reveal, flashId, focus } = useTimelineFocus();
  if (!node.endings.length) return null;
  return (
    <ul className="sk-endings">
      {node.endings.map((end) => (
        <li
          key={end.eventId}
          id={`end-${end.eventId}`}
          className={`${flashId === `end-${end.eventId}` ? "sk-flash" : ""} ${focus && focus.id !== end.eventId ? "sk-focus-dim" : ""}`}
        >
          <span className="sk-ending-mark" aria-hidden />
          <div>
            <strong>Kết thúc: {end.title}</strong>
            <small>
              {end.startLabel} – {end.endLabel}
              {end.viaTitle && <> · kết thúc bằng “{end.viaTitle}”</>}
            </small>
          </div>
          <Button className="sk-link-button" onClick={() => reveal(`ev-${end.eventId}`)}>
            <Undo2 size={13} /> Về lúc bắt đầu
          </Button>
        </li>
      ))}
    </ul>
  );
}


type FocusState = ReturnType<typeof useTimelineFocus>;

/** Mốc có chứa sự kiện liên quan tới sự kiện/chủ thể đang xem (hoặc chưa chọn gì) thì không bị làm mờ. */
function isNodeTouched(node: TimeNode, { focus, lens, related }: FocusState): boolean {
  if (!focus && !lens) return true;
  return (
    node.events.some((e) => e.id === focus?.id || related.has(e.id)) ||
    node.endings.some((e) => e.eventId === focus?.id || related.has(e.eventId))
  );
}

/** Khoảng thời gian: của sự kiện kéo dài đang chọn, hoặc thời gian tồn tại của chủ thể đang xem. */
function highlightRange({ focus, lens }: FocusState): [number, number] | null {
  if (focus?.endYear !== undefined) return [focus.year, focus.endYear];
  if (lens && (lens.startYear !== null || lens.endYear !== null)) {
    return [lens.startYear ?? -Infinity, lens.endYear ?? Infinity];
  }
  return null;
}

export function TimelineNodeItem({
  node,
  right,
  compact,
  onDetail,
  onSave,
  saved,
}: {
  node: TimeNode;
  right: boolean;
  compact: boolean;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const focusState = useTimelineFocus();
  const isOpen = !compact || expanded;
  // Chế độ Liên kết: mốc không chứa sự kiện liên quan thì mờ; mốc nằm trong khoảng thời gian của
  // sự kiện đang chọn (sự kiện kéo dài) có thanh đánh dấu dọc trục.
  const touched = isNodeTouched(node, focusState);
  const range = highlightRange(focusState);
  const inSpan = Boolean(range && node.sortYear > range[0] && node.sortYear < range[1]);
  const endOnly = node.events.length === 0;

  if (endOnly) {
    return (
      <div className={`sk-timeline-node sk-end-node ${right ? "sk-right" : "sk-left"} ${touched ? "" : "sk-node-dim"} ${inSpan ? "sk-span-node" : ""}`}>
        <span className="sk-node-dot sk-end-dot" aria-hidden />
        <div className="sk-node-date">
          <span className="sk-end-date">{node.dateLabel}</span>
        </div>
        <div className="sk-node-content">
          <EndingList node={node} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={`sk-timeline-node ${right ? "sk-right" : "sk-left"} ${touched ? "" : "sk-node-dim"} ${inSpan ? "sk-span-node" : ""}`}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <Button className="sk-node-dot" aria-label={`Mở ${node.dateLabel}`} onClick={() => setExpanded(!expanded)}>
        <span />
      </Button>
      <div className="sk-node-date">
        <Button onClick={() => setExpanded(!expanded)}>{node.dateLabel}</Button>
        <small>
          {node.events.length} sự kiện <span>·</span> {node.figures.length} nhân vật <span>·</span>{" "}
          {node.locations.length} địa điểm
        </small>
      </div>
      <div className="sk-node-content">
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <NodeContent node={node} onDetail={onDetail} onSave={onSave} saved={saved} />
            </motion.div>
          )}
        </AnimatePresence>
        <EndingList node={node} />
      </div>
    </motion.div>
  );
}

// === TimelineFocus.tsx ===
/** Lý do một sự kiện liên quan tới sự kiện đang chọn. strong = liên kết trực tiếp. */
export interface RelatedReason {
  text: string;
  strong: boolean;
}

export interface TimelineFocusState {
  /** Sự kiện đang bật chế độ "Liên kết" (null = tắt). */
  focus: TimelineEvent | null;
  /** Lăng kính chủ thể: sáng mọi sự kiện có chủ thể này (null = tắt). */
  lens: TimelineActor | null;
  setLens: (actor: TimelineActor | null) => void;
  related: Map<string, RelatedReason[]>;
  setFocus: (event: TimelineEvent | null) => void;
  /** Cuộn tới một mục (sự kiện / mốc kết thúc) và nhấp nháy để dễ thấy. */
  reveal: (domId: string) => void;
  flashId: string | null;
}

export const TimelineFocusContext = createContext<TimelineFocusState>({
  focus: null,
  lens: null,
  setLens: () => undefined,
  related: new Map(),
  setFocus: () => undefined,
  reveal: () => undefined,
  flashId: null,
});

export const useTimelineFocus = () => useContext(TimelineFocusContext);

/**
 * Sự kiện liên quan tới sự kiện đang chọn (đồ thị tri thức đặt lên dòng thời gian):
 *  - trực tiếp: quan hệ giữa sự kiện (nguyên nhân, tiền đề, kết thúc bằng...), sự kiện cha / con;
 *  - gián tiếp: cùng sự kiện cha, cùng nhân vật, cùng địa danh.
 * Liên kết gián tiếp chỉ đi một bước qua nhân vật / địa danh — không lan tiếp để tránh "cái gì
 * cũng liên quan".
 */
type AddRelated = (id: string, reason: RelatedReason) => void;

function addDirectRelations(focus: TimelineEvent, add: AddRelated) {
  for (const r of focus.relations) {
    add(r.eventId, { text: `${r.relationType} “${focus.title}”`, strong: true });
  }
}

function addHierarchy(focus: TimelineEvent, all: TimelineEvent[], byId: Map<string, TimelineEvent>, add: AddRelated) {
  if (focus.parentId) {
    const parentTitle = byId.get(focus.parentId)?.title ?? "sự kiện lớn";
    add(focus.parentId, { text: "Sự kiện lớn chứa sự kiện này", strong: true });
    for (const e of all) if (e.parentId === focus.parentId) add(e.id, { text: `Cùng thuộc “${parentTitle}”`, strong: false });
  }
  for (const e of all) if (e.parentId === focus.id) add(e.id, { text: "Diễn ra trong sự kiện này", strong: true });
}

function addSharedBy(
  all: TimelineEvent[],
  ids: Set<string>,
  pick: (e: TimelineEvent) => Array<{ id: string; name: string }>,
  label: string,
  add: AddRelated,
) {
  for (const e of all) for (const x of pick(e)) if (ids.has(x.id)) add(e.id, { text: `${label} ${x.name}`, strong: false });
}

function addSharedEntities(focus: TimelineEvent, all: TimelineEvent[], add: AddRelated) {
  // Chủ thể nhỏ (tổ chức, lực lượng, hiện vật) là liên kết gián tiếp. Triều đại / quốc gia nối tới
  // quá nhiều sự kiện nên không lan qua — xem bằng lăng kính chủ thể thay vào đó.
  const actorIds = new Set(focus.actors.filter((a) => a.type !== TimelineActorType.DYNASTY).map((a) => a.id));
  addSharedBy(all, actorIds, (e) => e.actors, 'Cùng chủ thể', add);
  addSharedBy(all, new Set(focus.figures.map((f) => f.id)), (e) => e.figures, 'Cùng nhân vật', add);
  addSharedBy(all, new Set(focus.locations.map((l) => l.id)), (e) => e.locations, 'Cùng địa danh', add);
}

export function computeRelated(
  focus: TimelineEvent,
  all: TimelineEvent[],
): Map<string, RelatedReason[]> {
  const byId = new Map(all.map((e) => [e.id, e]));
  const out = new Map<string, RelatedReason[]>();
  const add: AddRelated = (id, reason) => {
    if (id === focus.id || !byId.has(id)) return;
    const list = out.get(id) ?? [];
    if (!list.some((r) => r.text === reason.text)) list.push(reason);
    out.set(id, list);
  };

  addDirectRelations(focus, add);
  addHierarchy(focus, all, byId, add);
  addSharedEntities(focus, all, add);
  return out;
}

/** Lăng kính chủ thể: sự kiện có chủ thể này, lý do là vai trò của chủ thể trong sự kiện. */
export function computeLens(actor: TimelineActor, all: TimelineEvent[]) {
  const out = new Map<string, RelatedReason[]>();
  for (const e of all) {
    const hit = e.actors.find((a) => a.id === actor.id);
    if (hit) out.set(e.id, [{ text: hit.roleLabel || hit.role, strong: true }]);
  }
  return out;
}

const eraYear = (y: number) => (y < 0 ? `${Math.abs(y)} TCN` : String(y));

/** "544 – 602" / "1922 – 1991" / "từ 1945". */
export function lifespanLabel(actor: Pick<TimelineActor, "startYear" | "endYear">): string | null {
  if (actor.startYear === null && actor.endYear === null) return null;
  if (actor.endYear === null) return `từ ${eraYear(actor.startYear!)}`;
  if (actor.startYear === null) return `đến ${eraYear(actor.endYear)}`;
  return `${eraYear(actor.startYear)} – ${eraYear(actor.endYear)}`;
}
