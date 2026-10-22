"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDownUp, ArrowRight, Compass, Landmark, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Heading, Select } from "./sk-ui";
import { FilterBar, matchesRegion, regionOptions } from "./FilterBar";
import { Minimap } from "./Minimap";
import { EraSection } from "./EraSection";
import { SubEraSection, SplitMode } from "./SubEraSection";
import { HorizontalExplorer } from "./HorizontalExplorer";
import { EventDetailModal } from "./EventDetailModal";
import type { Era, TimeNode, TimelineEvent } from "./sk-types";

const SAVED_STORAGE_KEY = "hisgo:timeline:saved-events";

function readSaved(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function TimelineExplorer({ eras: baseEras, hero }: { eras: Era[]; hero?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState("");
  const [sub, setSub] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [horizontal, setHorizontal] = useState(false);
  const [compact, setCompact] = useState(false);
  const [split, setSplit] = useState<SplitMode>("alternating");
  const [active, setActive] = useState("");
  const [detail, setDetail] = useState<{ event: TimelineEvent; node: TimeNode } | null>(null);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  // Bookmarks are a per-browser convenience; read after mount so server and client render the same.
  useEffect(() => {
    setSaved(readSaved());
  }, []);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: canvas, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 25 });

  const allSubs = useMemo(() => baseEras.flatMap((e) => e.subEras), [baseEras]);
  const allNodes = useMemo(() => allSubs.flatMap((s) => s.timeNodes), [allSubs]);
  const allRegions = useMemo(() => regionOptions(allNodes.flatMap((n) => n.events)), [allNodes]);
  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const n of allNodes) for (const ev of n.events) seen.add(ev.category);
    return Array.from(seen);
  }, [allNodes]);

  const reset = () => {
    setQuery("");
    setEra("");
    setSub("");
    setCategory("");
    setRegion("");
    setBookmarksOnly(false);
  };

  const matches = (event: TimelineEvent, node: TimeNode) =>
    (!category || event.category === category) &&
    matchesRegion(event, region) &&
    (!bookmarksOnly || saved.includes(event.id)) &&
    (!query ||
      [event.title, event.summary, ...event.tags, ...node.figures.map((f) => f.name), ...node.locations.map((l) => l.name)]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")));

  const eras = useMemo(() => {
    return baseEras
      .filter((e) => !era || e.id === era)
      .map((e) => ({
        ...e,
        subEras: e.subEras
          .filter((s) => !sub || s.id === sub)
          .map((s) => ({ ...s, timeNodes: s.timeNodes.map((n) => ({ ...n, events: n.events.filter((ev) => matches(ev, n)) })).filter((n) => n.events.length) }))
          .filter((s) => s.timeNodes.length),
      }))
      .filter((e) => e.subEras.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseEras, era, sub, category, region, bookmarksOnly, query, saved]);

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

  return (
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
          era={era}
          onEra={setEra}
          sub={sub}
          onSub={setSub}
          category={category}
          onCategory={setCategory}
          region={region}
          onRegion={setRegion}
          regions={allRegions}
          compact={compact}
          onCompact={() => setCompact(!compact)}
          bookmarksOnly={bookmarksOnly}
          onBookmarksOnly={() => setBookmarksOnly(!bookmarksOnly)}
          savedCount={saved.length}
          eras={baseEras}
          subs={allSubs}
          categories={allCategories}
        />

        <div className="sk-workspace">
          <Minimap
            eras={baseEras}
            active={active}
            totalEvents={allNodes.flatMap((n) => n.events).length}
            onJumpEra={(e) => {
              reset();
              setTimeout(() => jump(e.subEras[0]?.id), 80);
            }}
            onJumpSubEra={(id) => {
              if (era || sub) reset();
              setTimeout(() => jump(id), 80);
            }}
          />

          <main className="sk-timeline-main" ref={canvas}>
            <div className="sk-canvas-toolbar">
              <div className="sk-breadcrumb">
                <Compass size={14} />
                <span>Lịch sử Việt Nam</span>
                <strong>Tất cả thời kỳ</strong>
              </div>
              <div className="sk-split-control">
                <SlidersHorizontal size={13} />
                <Select label="Phân luồng" value={split} onChange={(v) => setSplit(v as SplitMode)}>
                  <option value="alternating">So le hai bên</option>
                  <option value="scope">Trong nước / Thế giới</option>
                  <option value="domain">Chính trị / Văn hóa</option>
                </Select>
              </div>
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
                      visibleNodes={visibleNodes}
                      selectedNode={selectedNode}
                      onSelectNode={setSelected}
                      subs={allSubs}
                      onDetail={setDetail}
                      onSave={toggleSaved}
                      saved={saved}
                    />
                  ) : (
                    eras.map((e, ei) => (
                      <EraSection key={e.id} title={e.title} period={e.periodLabel} index={ei} overview={e.overview}>
                        <motion.div className="sk-spine-progress" style={{ scaleY: progress }} />
                        {e.subEras.map((s) => (
                          <SubEraSection
                            key={`${s.id}-${query}-${category}-${region}-${bookmarksOnly}`}
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
  );
}
