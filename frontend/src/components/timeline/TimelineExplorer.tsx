"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDownUp, ArrowRight, Landmark, Search, X } from "lucide-react";
import { Button, Heading, compactPeriod } from "./TimelineChrome";
import { EMPTY_FILTERS, FilterBar, type TimelineFilters } from "./TimelineChrome";
import { FilterSheet } from "./TimelineChrome";
import { Minimap } from "./TimelineChrome";
import { EraSection } from "./TimelineSections";
import { SubEraSection } from "./TimelineSections";
import { HorizontalExplorer } from "./TimelineSections";
import { EventDetailModal } from "./TimelineChrome";
import { TocDrawer, type TocNode } from "@/components/common/TocDrawer";
import { SK_SELECTED_CLASS, type Era, type TimeNode, type TimelineEvent } from "./sk-adapter";

const SAVED_STORAGE_KEY = "hisgo:timeline:saved-events";

function readSaved(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

type FilterScope = { query: string; bookmarksOnly: boolean; saved: string[] };

function matchesEvent(event: TimelineEvent, _node: TimeNode, f: TimelineFilters, scope: FilterScope): boolean {
  const q = scope.query.toLocaleLowerCase("vi");
  return (
    (f.categories.length === 0 || f.categories.includes(event.category)) &&
    (!scope.bookmarksOnly || scope.saved.includes(event.id)) &&
    (!q ||
      [event.title, event.summary, event.category, ...event.tags]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(q))
  );
}

function filterEras(baseEras: Era[], f: TimelineFilters, scope: FilterScope): Era[] {
  return baseEras
    .filter((e) => f.eras.length === 0 || f.eras.includes(e.id))
    .map((e) => {
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
            .filter((n) => n.events.length > 0),
        }))
        .filter((s) => s.timeNodes.length > 0),
    }))
    .filter((e) => e.subEras.length > 0);
}

function countEvents(eras: Era[]): number {
  return eras.reduce(
    (sum, e) => sum + e.subEras.reduce((s, sb) => s + sb.timeNodes.reduce((n, node) => n + node.events.length, 0), 0),
    0,
  );
}

function collectCategories(nodes: TimeNode[]): string[] {
  const seen = new Set<string>();
  for (const n of nodes) for (const ev of n.events) seen.add(ev.category);
  return Array.from(seen);
}

/** Nhảy tới era = nhảy sang giai đoạn con đầu tiên của nó. */
function toTocNodes(eras: Era[]): TocNode[] {
  return eras.map((e) => ({
    id: e.subEras[0]?.id ?? e.id,
    title: e.title,
    subtitle: compactPeriod(e.periodLabel),
    count: e.subEras.reduce((n, s) => n + s.timeNodes.length, 0),
    children: e.subEras.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: compactPeriod(s.periodLabel),
      count: s.timeNodes.length,
    })),
  }));
}

/** Bật/tắt dấu mốc đã lưu và ghi lại vào trình duyệt. */
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

function pickSelectedNode(nodes: TimeNode[], selectedId: string): TimeNode | undefined {
  const chosen = nodes.find((n) => n.id === selectedId) ?? nodes[0];
  return chosen?.events.length ? chosen : nodes.find((n) => n.events.length > 0);
}

export function TimelineExplorer({ eras: baseEras, hero }: { eras: Era[]; hero?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [horizontal, setHorizontal] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [active, setActive] = useState("");
  const [detail, setDetail] = useState<{ event: TimelineEvent; node: TimeNode } | null>(null);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [dockSidebar, setDockSidebar] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setSaved(readSaved());
    });
  }, []);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
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

  const scope = { query, bookmarksOnly, saved };
  const eras = useMemo(
    () => filterEras(baseEras, filters, { query, bookmarksOnly, saved }),
    [baseEras, filters, bookmarksOnly, query, saved],
  );
  const countFor = (f: TimelineFilters) => countEvents(filterEras(baseEras, f, scope));
  const filterKey = JSON.stringify(filters);

  const visibleNodes = useMemo(() => eras.flatMap((e) => e.subEras.flatMap((s) => s.timeNodes)), [eras]);
  const selectedNode = pickSelectedNode(visibleNodes, selected);
  const tocNodes = useMemo(() => toTocNodes(eras), [eras]);

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

  return (
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

        <div className={`sk-workspace ${!dockSidebar ? "sk-workspace-full" : ""}`}>
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
                    eras.map((e, ei) => {
                      const isSingleSub = e.subEras.length === 1;
                      return (
                        <EraSection key={e.id} title={e.title} slug={e.slug} period={e.periodLabel} index={ei} overview={e.overview}>
                          <motion.div key="spine-progress" className="sk-spine-progress" style={{ scaleY: progress }} />
                          {e.subEras.map((s) => {
                            const isDuplicateTitle = isSingleSub || s.title.trim().toLowerCase() === e.title.trim().toLowerCase();
                            return (
                              <SubEraSection
                                key={`${s.id}-${query}-${filterKey}-${bookmarksOnly}`}
                                subEra={s}
                                compact={compact}
                                onDetail={setDetail}
                                onSave={toggleSaved}
                                saved={saved}
                                onActive={setActive}
                                hideSubHeading={isDuplicateTitle}
                              />
                            );
                          })}
                        </EraSection>
                      );
                    })
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

      <TocDrawer
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        heading="Mục lục thời kỳ"
        itemLabel="mốc sự kiện"
        nodes={tocNodes}
        activeId={active}
        totalCount={countEvents(eras)}
        onJump={jump}
      />
    </div>
  );
}
