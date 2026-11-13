"use client";

import {
  TimelineFocusContext,
  computeLens,
  computeRelated,
  lifespanLabel,
  type RelatedReason,
  type TimelineFocusState,
} from "./TimelineFocus";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDownUp, ArrowRight, BookOpen, Landmark, Network, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Heading } from "./SkUi";
import { EMPTY_FILTERS, FilterBar, type TimelineFilters } from "./FilterBar";
import { FilterSheet } from "./FilterSheet";
import { Minimap } from "./Minimap";
import { EraTocDrawer } from "./EraTocDrawer";
import { EraSection } from "./EraSection";
import { SubEraSection, SplitMode } from "./SubEraSection";
import { HorizontalExplorer } from "./HorizontalExplorer";
import { EventDetailModal } from "./EventDetailModal";
import { SK_SELECTED_CLASS } from "./sk-shared";
import type { Era, TimeNode, TimelineActor, TimelineEvent } from "./sk-types";

const SAVED_STORAGE_KEY = "hisgo:timeline:saved-events";
const SPLIT_LABELS: Record<SplitMode, string> = {
  alternating: "So le hai bên",
  domain: "Chính trị / Văn hóa",
};

function readSaved(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

type FilterScope = { query: string; bookmarksOnly: boolean; saved: string[]; onlyIds?: Set<string> | null };

function matchesEvent(event: TimelineEvent, node: TimeNode, f: TimelineFilters, scope: FilterScope): boolean {
  const q = scope.query.toLocaleLowerCase("vi");
  return (
    (f.categories.length === 0 || f.categories.includes(event.category)) &&
    (!scope.bookmarksOnly || scope.saved.includes(event.id)) &&
    (!scope.onlyIds || scope.onlyIds.has(event.id)) &&
    (!q ||
      [event.title, event.summary, ...event.tags, ...node.figures.map((x) => x.name), ...node.locations.map((l) => l.name)]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(q))
  );
}

function filterEras(baseEras: Era[], f: TimelineFilters, scope: FilterScope): Era[] {
  return baseEras
    .filter((e) => f.eras.length === 0 || f.eras.includes(e.id))
    .map((e) => {
      // Giai đoạn chỉ thu hẹp thời kỳ chứa nó; thời kỳ không chọn giai đoạn nào thì giữ nguyên.
      const pickedSubs = e.subEras.filter((s) => f.subs.includes(s.id));
      return { e, pickedSubs };
    })
    .map(({ e, pickedSubs }) => ({
      ...e,
      subEras: (pickedSubs.length ? pickedSubs : e.subEras)
        .map((s) => ({
          ...s,
          timeNodes: s.timeNodes
            .map((n) => ({ ...n, events: n.events.filter((ev) => matchesEvent(ev, n, f, scope)) }))
            // Mốc chỉ gồm mốc kết thúc vẫn giữ (trừ khi đang lọc "chỉ liên quan" mà không dính sự kiện nào).
            .filter((n) => n.events.length || (n.endings.length && (!scope.onlyIds || n.endings.some((x) => scope.onlyIds!.has(x.eventId))))),
        }))
        .filter((s) => s.timeNodes.length),
    }))
    .filter((e) => e.subEras.length);
}

function countEvents(eras: Era[]): number {
  return eras.reduce(
    (sum, e) => sum + e.subEras.reduce((s, sb) => s + sb.timeNodes.reduce((n, node) => n + node.events.length, 0), 0),
    0,
  );
}

/** Sự kiện liên quan tới sự kiện đang chọn, hoặc tới chủ thể đang xem qua lăng kính. */
function relatedEvents(
  focus: TimelineEvent | null,
  lens: TimelineActor | null,
  allEvents: TimelineEvent[],
): Map<string, RelatedReason[]> {
  if (focus) return computeRelated(focus, allEvents);
  if (lens) return computeLens(lens, allEvents);
  return new Map();
}

/** Khi bật "chỉ hiện sự kiện liên quan": tập id được giữ lại; null = không lọc. */
function onlyRelatedIds(
  focus: TimelineEvent | null,
  lens: TimelineActor | null,
  onlyRelated: boolean,
  related: Map<string, RelatedReason[]>,
): Set<string> | null {
  if (!(focus || lens) || !onlyRelated) return null;
  return new Set([...(focus ? [focus.id] : []), ...related.keys()]);
}

function collectCategories(nodes: TimeNode[]): string[] {
  const seen = new Set<string>();
  for (const n of nodes) for (const ev of n.events) seen.add(ev.category);
  return Array.from(seen);
}

/** Bật/tắt dấu mốc đã lưu và ghi lại vào trình duyệt (lỗi storage thì chỉ giữ trong phiên này). */
function toggleSavedId(saved: string[], id: string): string[] {
  const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); bookmarks then last for this visit only.
  }
  return next;
}

/** Sự kiện liền trước/liền sau (vòng tròn) trên toàn trục, dùng cho nút chuyển trong hộp chi tiết. */
function neighborEvent(nodes: TimeNode[], eventId: string, direction: 1 | -1) {
  const entries = nodes.flatMap((n) => n.events.map((event) => ({ event, node: n })));
  const i = entries.findIndex((x) => x.event.id === eventId);
  return i === -1 ? null : entries[(i + direction + entries.length) % entries.length];
}

/** Mốc đang chọn ở trục ngang; mốc chỉ có điểm kết thúc (không có sự kiện) thì lấy mốc có sự kiện đầu tiên. */
function pickSelectedNode(nodes: TimeNode[], selectedId: string): TimeNode | undefined {
  const chosen = nodes.find((n) => n.id === selectedId) ?? nodes[0];
  return chosen?.events.length ? chosen : nodes.find((n) => n.events.length > 0);
}

/** Thanh trạng thái khi đang xem liên kết của 1 sự kiện hoặc lăng kính 1 chủ thể. */
function FocusBar({
  title,
  summary,
  onlyLabel,
  onlyRelated,
  onOnlyRelatedChange,
  children,
}: {
  title: string;
  summary: string;
  onlyLabel: string;
  onlyRelated: boolean;
  onOnlyRelatedChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="sk-focus-bar" role="status">
      <Network size={16} />
      <div>
        <strong>{title}</strong>
        <small>{summary}</small>
      </div>
      <label className="sk-focus-only">
        <input type="checkbox" checked={onlyRelated} onChange={(e) => onOnlyRelatedChange(e.target.checked)} />
        {onlyLabel}
      </label>
      {children}
    </div>
  );
}

function lensSummary(lens: TimelineActor, count: number): string {
  const lifespan = lifespanLabel(lens);
  const base = `${count} sự kiện có chủ thể này`;
  return lifespan ? `${base} · tồn tại ${lifespan} (thanh đánh dấu dọc trục)` : base;
}

function focusSummary(focus: TimelineEvent, count: number, strongCount: number): string {
  const base = `${count} sự kiện liên quan (${strongCount} liên kết trực tiếp)`;
  return focus.spanLabel ? `${base} · kéo dài ${focus.spanLabel}` : base;
}

export function TimelineExplorer({ eras: baseEras, hero }: { eras: Era[]; hero?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [horizontal, setHorizontal] = useState(false);
  const [compact, setCompact] = useState(false);
  const [split, setSplit] = useState<SplitMode>(SplitMode.ALTERNATING);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [active, setActive] = useState("");
  const [detail, setDetail] = useState<{ event: TimelineEvent; node: TimeNode } | null>(null);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  // Cho phép chuyển đổi giữa toàn màn hình thoáng đãng và ghim sidebar cố định
  const [dockSidebar, setDockSidebar] = useState(false);
  // Drawer mục lục trượt từ mép phải ra (chịu tải hàng trăm thời kỳ có tìm kiếm)
  const [tocOpen, setTocOpen] = useState(false);

  // Bookmarks are a per-browser convenience; read after mount so server and client render the same.
  useEffect(() => {
    void Promise.resolve().then(() => {
      setSaved(readSaved());
    });
  }, []);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  // Chế độ "Liên kết" (đồ thị tri thức trên dòng thời gian).
  const [focus, setFocus] = useState<TimelineEvent | null>(null);
  const [lens, setLens] = useState<TimelineActor | null>(null);
  const [onlyRelated, setOnlyRelated] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: canvas, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 25 });

  const allSubs = useMemo(() => baseEras.flatMap((e) => e.subEras), [baseEras]);
  const allNodes = useMemo(() => allSubs.flatMap((s) => s.timeNodes), [allSubs]);
  const allCategories = useMemo(() => collectCategories(allNodes), [allNodes]);

  const reset = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setBookmarksOnly(false);
  };

  const allEvents = useMemo(() => allNodes.flatMap((n) => n.events), [allNodes]);
  const related = useMemo(
    () => relatedEvents(focus, lens, allEvents),
    [focus, lens, allEvents],
  );
  const onlyIds = useMemo(
    () => onlyRelatedIds(focus, lens, onlyRelated, related),
    [focus, lens, onlyRelated, related],
  );
  const reveal = (domId: string) => {
    // Đang lọc "chỉ liên quan" có thể ẩn mốc cần tới — bỏ lọc trước khi cuộn.
    if (!document.getElementById(domId) && onlyRelated) setOnlyRelated(false);
    window.setTimeout(() => {
      document.getElementById(domId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(domId);
      window.setTimeout(() => setFlashId((v) => (v === domId ? null : v)), 2200);
    }, 60);
  };
  const focusState: TimelineFocusState = {
    focus,
    lens,
    // Liên kết của sự kiện và lăng kính chủ thể loại trừ nhau — bật cái này thì tắt cái kia.
    setLens: (actor) => {
      setLens(actor);
      setFocus(null);
      setOnlyRelated((v) => v && actor !== null);
    },
    related,
    setFocus: (ev) => {
      setFocus(ev);
      setLens(null);
      setOnlyRelated((v) => v && ev !== null);
    },
    reveal,
    flashId,
  };

  const scope = { query, bookmarksOnly, saved, onlyIds };
  const eras = useMemo(
    () => filterEras(baseEras, filters, { query, bookmarksOnly, saved, onlyIds }),
    [baseEras, filters, bookmarksOnly, query, saved, onlyIds],
  );
  const countFor = (f: TimelineFilters) => countEvents(filterEras(baseEras, f, scope));
  const filterKey = JSON.stringify(filters);

  const visibleNodes = useMemo(() => eras.flatMap((e) => e.subEras.flatMap((s) => s.timeNodes)), [eras]);
  const selectedNode = pickSelectedNode(visibleNodes, selected);

  const jump = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const toggleSaved = (id: string) => setSaved((v) => toggleSavedId(v, id));
  const moveEvent = (direction: 1 | -1) => {
    if (!detail) return;
    const next = neighborEvent(allNodes, detail.event.id, direction);
    if (next) setDetail(next);
  };

  const strongCount = [...related.values()].filter((r) => r.some((x) => x.strong)).length;

  return (
    <TimelineFocusContext.Provider value={focusState}>
    <div className="sk-app">
      {hero}
      <div className="sk-explorer">
        <div className="sk-explorer-intro">
          <div>
            <Heading level={2}>{bookmarksOnly ? "Dấu mốc đã lưu" : "Dòng chảy lịch sử ngàn năm"}</Heading>
            <p>Mỗi thời kỳ là một chương. Mỗi dấu mốc là một câu chuyện.</p>
          </div>
          <div className="sk-view-toggle">
            <Button className={!horizontal ? SK_SELECTED_CLASS : ""} onClick={() => setHorizontal(false)}>
              <ArrowDownUp size={15} /> Trục dọc
            </Button>
            <Button className={horizontal ? SK_SELECTED_CLASS : ""} onClick={() => setHorizontal(true)}>
              <ArrowRight size={16} /> Trục ngang
            </Button>
          </div>
        </div>

        <FilterBar
          query={query}
          onQuery={setQuery}
          filters={filters}
          onFilters={setFilters}
          onOpenSheet={() => setSheetOpen(true)}
          eras={baseEras}
          subs={allSubs}
          compact={compact}
          onCompact={() => setCompact(!compact)}
          bookmarksOnly={bookmarksOnly}
          onBookmarksOnly={() => setBookmarksOnly(!bookmarksOnly)}
          savedCount={saved.length}
          onOpenToc={() => setTocOpen(true)}
          eraCount={eras.length}
        />
        <FilterSheet
          open={sheetOpen}
          value={filters}
          onApply={(f) => {
            setFilters(f);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
          countFor={countFor}
          eras={baseEras}
          categories={allCategories}
        />

        {lens && (
          <FocusBar
            title={`Lăng kính: ${lens.name}`}
            summary={lensSummary(lens, related.size)}
            onlyLabel="Chỉ hiện các sự kiện này"
            onlyRelated={onlyRelated}
            onOnlyRelatedChange={setOnlyRelated}
          >
            <Button aria-label="Tắt lăng kính chủ thể" onClick={() => focusState.setLens(null)}>
              <X size={15} />
            </Button>
          </FocusBar>
        )}
        {focus && (
          <FocusBar
            title={`Đang xem liên kết của: ${focus.title}`}
            summary={focusSummary(focus, related.size, strongCount)}
            onlyLabel="Chỉ hiện sự kiện liên quan"
            onlyRelated={onlyRelated}
            onOnlyRelatedChange={setOnlyRelated}
          >
            <Button onClick={() => reveal(`ev-${focus.id}`)}>Tới sự kiện</Button>
            <Button aria-label="Tắt chế độ liên kết" onClick={() => focusState.setFocus(null)}>
              <X size={15} />
            </Button>
          </FocusBar>
        )}

        <div className={`sk-workspace ${!dockSidebar ? "sk-workspace-full" : ""}`}>
          {/* Khi ghim sidebar: hiển thị Minimap cố định bên trái */}
          {dockSidebar && (
            <div className="sk-minimap-dock-wrap">
              <div className="sk-minimap-dock-header">
                <button
                  type="button"
                  className="sk-dock-toggle-btn"
                  onClick={() => setDockSidebar(false)}
                  title="Thu gọn sang thanh bám đỉnh để mở rộng tối đa không gian"
                >
                  Thu gọn sang thanh bám đỉnh
                </button>
              </div>
              <Minimap
                eras={eras}
                active={active}
                totalEvents={countEvents(eras)}
                onJumpEra={(e) => jump(e.subEras[0]?.id)}
                onJumpSubEra={jump}
              />
            </div>
          )}

          <main className="sk-timeline-main" ref={canvas}>
            <div className="sk-canvas-toolbar">
              {/* Phân luồng là cách hiển thị (chỉ trục dọc), không phải bộ lọc nên để ngoài. */}
              {!horizontal && (
                <div className="sk-split-segment" role="group" aria-label="Phân luồng trục dọc">
                  <SlidersHorizontal size={13} />
                  {(Object.keys(SPLIT_LABELS) as SplitMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={split === mode ? SK_SELECTED_CLASS : ""}
                      aria-pressed={split === mode}
                      onClick={() => setSplit(mode)}
                    >
                      {SPLIT_LABELS[mode]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {allNodes.length === 0 ? (
              <div className="sk-empty">
                <Landmark size={36} />
                <Heading>Chưa có dấu mốc nào được xuất bản</Heading>
                <p>Dòng thời gian sẽ hiển thị khi có sự kiện được xuất bản trong hệ thống.</p>
              </div>
            ) : visibleNodes.length === 0 ? (
              <div className="sk-empty">
                <Search size={36} />
                <Heading>Chưa tìm thấy dấu mốc</Heading>
                <p>Thử một từ khóa khác hoặc mở rộng bộ lọc của bạn.</p>
                <Button className="sk-primary" onClick={reset}>
                  Xóa bộ lọc <X size={15} />
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={horizontal ? "horizontal" : "vertical"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {horizontal ? (
                    <HorizontalExplorer
                      visibleNodes={visibleNodes.filter((n) => n.events.length)}
                      selectedNode={selectedNode!}
                      onSelectNode={setSelected}
                      subs={allSubs}
                      onDetail={setDetail}
                      onSave={toggleSaved}
                      saved={saved}
                    />
                  ) : (
                    eras.map((e, ei) => (
                      <EraSection key={e.id} title={e.title} slug={e.slug} period={e.periodLabel} index={ei} overview={e.overview}>
                        <motion.div className="sk-spine-progress" style={{ scaleY: progress }} />
                        {e.subEras.map((s) => (
                          <SubEraSection
                            key={`${s.id}-${query}-${filterKey}-${bookmarksOnly}`}
                            subEra={s}
                            compact={compact}
                            split={split}
                            onDetail={setDetail}
                            onSave={toggleSaved}
                            saved={saved}
                            onActive={setActive}
                          />
                        ))}
                      </EraSection>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            )}
            <div className="sk-journey-end">
              <span />
              <Landmark size={18} />
              <span />
              <p>Lịch sử vẫn đang được viết tiếp.</p>
            </div>
          </main>
        </div>
      </div>

      <EventDetailModal detail={detail} onClose={() => setDetail(null)} onSelect={setDetail} onStep={moveEvent} />

      {/* Nút Tab nổi tiện lợi ở mép phải màn hình: luôn xuất hiện để mở Mục lục bất kỳ lúc nào */}
      <button
        type="button"
        className="sk-toc-floating-side-tab"
        onClick={() => setTocOpen(true)}
        title="Mục lục thời kỳ lịch sử"
        aria-label="Mở mục lục thời kỳ"
      >
        <BookOpen size={15} />
        <span>Mục lục</span>
      </button>

      {/* Drawer Mục lục trượt từ mép phải ra (có ô tìm kiếm, chịu tải hàng trăm thời kỳ) */}
      <EraTocDrawer
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        eras={eras}
        activeSubEraId={active}
        totalEvents={countEvents(eras)}
        onJumpEra={(e) => jump(e.subEras[0]?.id)}
        onJumpSubEra={jump}
      />
    </div>
    </TimelineFocusContext.Provider>
  );
}
