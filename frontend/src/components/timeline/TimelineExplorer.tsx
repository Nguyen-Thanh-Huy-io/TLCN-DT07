"use client";

import { usePublicTaxonomyTerms, useRegionOrder } from "@/features/taxonomy/usePublicTaxonomy";
import { TimelineFocusContext, computeRelated, type RelatedReason, type TimelineFocusState } from "./TimelineFocus";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDownUp, ArrowRight, Landmark, Network, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Heading } from "./sk-ui";
import { EMPTY_FILTERS, FilterBar, matchesRegion, regionOptions, type TimelineFilters } from "./FilterBar";
import { FilterSheet } from "./FilterSheet";
import { Minimap } from "./Minimap";
import { EraSection } from "./EraSection";
import { SubEraSection, SplitMode } from "./SubEraSection";
import { HorizontalExplorer } from "./HorizontalExplorer";
import { EventDetailModal } from "./EventDetailModal";
import type { Era, TimeNode, TimelineEvent } from "./sk-types";

const SAVED_STORAGE_KEY = "hisgo:timeline:saved-events";
const SPLIT_LABELS: Record<SplitMode, string> = {
  alternating: "So le hai bên",
  scope: "Việt Nam / Thế giới",
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
    matchesRegion(event, f.regions) &&
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

export function TimelineExplorer({ eras: baseEras, hero }: { eras: Era[]; hero?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [horizontal, setHorizontal] = useState(false);
  const [compact, setCompact] = useState(false);
  const [split, setSplit] = useState<SplitMode>("alternating");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [active, setActive] = useState("");
  const [detail, setDetail] = useState<{ event: TimelineEvent; node: TimeNode } | null>(null);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  // Bookmarks are a per-browser convenience; read after mount so server and client render the same.
  useEffect(() => {
    setSaved(readSaved());
  }, []);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  // Chế độ "Liên kết" (đồ thị tri thức trên dòng thời gian).
  const [focus, setFocus] = useState<TimelineEvent | null>(null);
  const [onlyRelated, setOnlyRelated] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const relationTerms = usePublicTaxonomyTerms("EVENT_RELATION");
  const canvas = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: canvas, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 25 });

  const allSubs = useMemo(() => baseEras.flatMap((e) => e.subEras), [baseEras]);
  const allNodes = useMemo(() => allSubs.flatMap((s) => s.timeNodes), [allSubs]);
  const regionOrder = useRegionOrder();
  const allRegions = useMemo(() => regionOptions(allNodes.flatMap((n) => n.events), regionOrder), [allNodes, regionOrder]);
  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const n of allNodes) for (const ev of n.events) seen.add(ev.category);
    return Array.from(seen);
  }, [allNodes]);

  const reset = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setBookmarksOnly(false);
  };

  const allEvents = useMemo(() => allNodes.flatMap((n) => n.events), [allNodes]);
  const related = useMemo<Map<string, RelatedReason[]>>(
    () => (focus ? computeRelated(focus, allEvents, relationTerms) : new Map()),
    [focus, allEvents, relationTerms],
  );
  const onlyIds = useMemo(
    () => (focus && onlyRelated ? new Set([focus.id, ...related.keys()]) : null),
    [focus, onlyRelated, related],
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
    related,
    setFocus: (ev) => {
      setFocus(ev);
      if (!ev) setOnlyRelated(false);
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
  const selectedNode = visibleNodes.find((n) => n.id === selected) || visibleNodes[0];

  const jump = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const toggleSaved = (id: string) =>
    setSaved((v) => {
      const next = v.includes(id) ? v.filter((x) => x !== id) : [...v, id];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); bookmarks then last for this visit only.
      }
      return next;
    });
  const moveEvent = (direction: 1 | -1) => {
    if (!detail) return;
    const entries = allNodes.flatMap((n) => n.events.map((event) => ({ event, node: n })));
    const i = entries.findIndex((x) => x.event.id === detail.event.id);
    if (i === -1) return;
    setDetail(entries[(i + direction + entries.length) % entries.length]);
  };

  const strongCount = [...related.values()].filter((r) => r.some((x) => x.strong)).length;

  return (
    <TimelineFocusContext.Provider value={focusState}>
    <div className="sk-app">
      {hero}
      <div className="sk-explorer">
        <div className="sk-explorer-intro">
          <div>
            <span className="sk-section-eyebrow">KHÁM PHÁ LỊCH SỬ</span>
            <Heading level={2}>{bookmarksOnly ? "Dấu mốc đã lưu" : "Dòng chảy ngàn năm"}</Heading>
            <p>Mỗi thời kỳ là một chương. Mỗi dấu mốc là một câu chuyện.</p>
          </div>
          <div className="sk-view-toggle">
            <Button className={!horizontal ? "sk-selected" : ""} onClick={() => setHorizontal(false)}>
              <ArrowDownUp size={15} /> Trục dọc
            </Button>
            <Button className={horizontal ? "sk-selected" : ""} onClick={() => setHorizontal(true)}>
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
          regions={allRegions}
        />

        {focus && (
          <div className="sk-focus-bar" role="status">
            <Network size={16} />
            <div>
              <strong>Đang xem liên kết của: {focus.title}</strong>
              <small>
                {related.size} sự kiện liên quan ({strongCount} liên kết trực tiếp)
                {focus.spanLabel && <> · kéo dài {focus.spanLabel}</>}
              </small>
            </div>
            <label className="sk-focus-only">
              <input type="checkbox" checked={onlyRelated} onChange={(e) => setOnlyRelated(e.target.checked)} />
              Chỉ hiện sự kiện liên quan
            </label>
            <Button onClick={() => reveal(`ev-${focus.id}`)}>Tới sự kiện</Button>
            <Button aria-label="Tắt chế độ liên kết" onClick={() => focusState.setFocus(null)}>
              <X size={15} />
            </Button>
          </div>
        )}

        <div className="sk-workspace">
          {/* Minimap đi theo bộ lọc: chỉ liệt kê thời kỳ / giai đoạn còn dấu mốc sau khi lọc. */}
          <Minimap
            eras={eras}
            active={active}
            totalEvents={countEvents(eras)}
            onJumpEra={(e) => jump(e.subEras[0]?.id)}
            onJumpSubEra={jump}
          />

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
                      className={split === mode ? "sk-selected" : ""}
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
                      selectedNode={selectedNode?.events.length ? selectedNode : visibleNodes.find((n) => n.events.length)!}
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
    </div>
    </TimelineFocusContext.Provider>
  );
}
