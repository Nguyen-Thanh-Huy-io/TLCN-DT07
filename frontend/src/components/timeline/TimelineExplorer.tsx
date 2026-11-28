"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDownUp, ArrowRight, BookOpen, Landmark, Search, X } from "lucide-react";
import {
  computeRecursiveCategoryBranchCounts,
  resolveEffectiveCategorySelectionIds,
} from "@/components/filters/CategoryHierarchyFilterSection";
import {
  computeTagFacetsFromItems,
  matchesSelectedTags,
} from "@/components/filters/PublicContentFilterSections";
import { TocDrawer, type TocNode } from "@/components/common/TocDrawer";
import { SYSTEM_CATEGORY_ROOT_SLUGS, type PublicCategory } from "@/services/public/public-content.service";
import {
  Button,
  compactPeriod,
  EMPTY_FILTERS,
  EventDetailModal,
  FilterBar,
  FilterSheet,
  Heading,
  Minimap,
  type TimelineFilters,
} from "./TimelineChrome";
import { EraSection, HorizontalExplorer, LazySubEraList, SubEraSection } from "./TimelineSections";
import { SK_SELECTED_CLASS, type Era, type SubEra, type TimeNode, type TimelineEvent } from "./sk-adapter";

const SAVED_STORAGE_KEY = "hisgo:timeline:saved-events";

function readSaved(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

interface FilterScope {
  query: string;
  bookmarksOnly: boolean;
  saved: string[];
  allowedCategoryIds: Set<string>;
  selectedTags: string[];
  fallbackEventRootId: string | null;
}

function resolveTimelineEventCategoryId(
  event: TimelineEvent,
  categoriesByNameOrSlug: ReadonlyMap<string, string>,
  fallbackEventRootId: string | null,
): string | null {
  if (event.categoryId) return event.categoryId;
  const fromCode = event.categoryCode
    ? categoriesByNameOrSlug.get(event.categoryCode.toLocaleLowerCase("vi"))
    : undefined;
  if (fromCode) return fromCode;
  const fromLabel = event.category
    ? categoriesByNameOrSlug.get(event.category.toLocaleLowerCase("vi"))
    : undefined;
  return fromLabel ?? fallbackEventRootId;
}

function matchesEvent(
  event: TimelineEvent,
  scope: FilterScope,
  categoriesByNameOrSlug: ReadonlyMap<string, string>,
): boolean {
  if (scope.allowedCategoryIds.size > 0) {
    const catId = resolveTimelineEventCategoryId(
      event,
      categoriesByNameOrSlug,
      scope.fallbackEventRootId,
    );
    if (!catId || !scope.allowedCategoryIds.has(catId)) return false;
  }
  if (!matchesSelectedTags(event, scope.selectedTags)) {
    return false;
  }
  if (scope.bookmarksOnly && !scope.saved.includes(event.id)) {
    return false;
  }
  const q = scope.query.trim().toLocaleLowerCase("vi");
  if (!q) return true;
  return [event.title, event.summary, event.category, ...event.tags]
    .join(" ")
    .toLocaleLowerCase("vi")
    .includes(q);
}

function filterEras(
  baseEras: Era[],
  f: TimelineFilters,
  scope: FilterScope,
  categoriesByNameOrSlug: ReadonlyMap<string, string>,
): Era[] {
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
            .map((n) => ({
              ...n,
              events: n.events.filter((ev) => matchesEvent(ev, scope, categoriesByNameOrSlug)),
            }))
            .filter((n) => n.events.length > 0),
        }))
        .filter((s) => s.timeNodes.length > 0),
    }))
    .filter((e) => e.subEras.length > 0);
}

function countEvents(eras: Era[]): number {
  return eras.reduce(
    (sum, e) =>
      sum + e.subEras.reduce((s, sb) => s + sb.timeNodes.reduce((n, node) => n + node.events.length, 0), 0),
    0,
  );
}

const TOC_ERA_PREFIX = "era:";
const TOC_SUB_PREFIX = "sub:";

function buildSubEraTocBranch(
  subs: SubEra[],
  parentId: string,
  byId: Set<string>,
  visited: Set<string>,
): TocNode[] {
  const direct = subs.filter((s) => {
    if (visited.has(s.id)) return false;
    if (s.parentId === parentId) return true;
    return parentId === s.eraId && (!s.parentId || !byId.has(s.parentId)) && s.id !== s.eraId;
  });
  return direct.map((s) => {
    visited.add(s.id);
    const children = buildSubEraTocBranch(subs, s.id, byId, visited);
    const childSum = children.reduce((sum, c) => sum + c.count, 0);
    return {
      id: `${TOC_SUB_PREFIX}${s.id}`,
      title: s.title,
      subtitle: s.periodLabel ? compactPeriod(s.periodLabel) : undefined,
      count: s.timeNodes.length + childSum,
      ...(children.length > 0 ? { children } : {}),
    };
  });
}

function toTocNodes(eras: Era[]): TocNode[] {
  return eras.map((e) => {
    const sourceSubs = e.tocSubEras ?? e.subEras;
    const byId = new Set(sourceSubs.map((s) => s.id));
    const children = buildSubEraTocBranch(sourceSubs, e.id, byId, new Set([e.id]));
    const count = children.reduce((n, c) => n + c.count, 0);
    return {
      id: `${TOC_ERA_PREFIX}${e.id}`,
      title: e.title,
      subtitle: e.periodLabel ? compactPeriod(e.periodLabel) : undefined,
      count: count || e.subEras.reduce((n, s) => n + s.timeNodes.length, 0),
      children,
    };
  });
}

function collectDescendantSubIds(subs: SubEra[], rootSubId: string): string[] {
  const result = new Set<string>([rootSubId]);
  let added = true;
  while (added) {
    added = false;
    for (const s of subs) {
      if (s.parentId && result.has(s.parentId) && !result.has(s.id)) {
        result.add(s.id);
        added = true;
      }
    }
  }
  return [...result];
}

function resolveTocSelection(
  baseEras: Era[],
  focusedTocId: string | null,
): { eras: string[]; subs: string[]; label: string | null } {
  if (!focusedTocId) return { eras: [], subs: [], label: null };
  if (focusedTocId.startsWith(TOC_ERA_PREFIX)) {
    const eraId = focusedTocId.slice(TOC_ERA_PREFIX.length);
    const era = baseEras.find((e) => e.id === eraId);
    return { eras: era ? [era.id] : [], subs: [], label: era?.title ?? null };
  }
  if (focusedTocId.startsWith(TOC_SUB_PREFIX)) {
    const subId = focusedTocId.slice(TOC_SUB_PREFIX.length);
    const ownerEra = baseEras.find((e) =>
      (e.tocSubEras ?? e.subEras).some((s) => s.id === subId),
    );
    const sourceSubs = ownerEra ? ownerEra.tocSubEras ?? ownerEra.subEras : [];
    const pickedSub = sourceSubs.find((s) => s.id === subId);
    const targetSubIds = ownerEra ? collectDescendantSubIds(sourceSubs, subId) : [subId];
    return {
      eras: ownerEra ? [ownerEra.id] : [],
      subs: targetSubIds,
      label: pickedSub?.title ?? null,
    };
  }
  return { eras: [], subs: [], label: null };
}

function toggleSavedId(saved: string[], id: string): string[] {
  const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private mode
  }
  return next;
}

function neighborEvent(nodes: TimeNode[], eventId: string, direction: 1 | -1) {
  const entries = nodes.flatMap((n) => n.events.map((event) => ({ event, node: n })));
  const i = entries.findIndex((x) => x.event.id === eventId);
  return i === -1 ? null : entries[(i + direction + entries.length) % entries.length];
}

function pickSelectedNode(nodes: TimeNode[], selectedId: string): TimeNode | undefined {
  const chosen = nodes.find((n) => n.id === selectedId) ?? nodes[0];
  return chosen?.events.length ? chosen : nodes.find((n) => n.events.length > 0);
}

export function TimelineExplorer({
  eras: baseEras,
  categories = [],
  hero,
}: {
  eras: Era[];
  categories?: PublicCategory[];
  hero?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [focusedTocId, setFocusedTocId] = useState<string | null>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [active, setActive] = useState("");
  const [detail, setDetail] = useState<{ event: TimelineEvent; node: TimeNode } | null>(null);
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [dockSidebar, setDockSidebar] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setSaved(readSaved());
    });
  }, []);

  const canvas = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: canvas, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 25 });

  const allSubs = useMemo(
    () => baseEras.flatMap((e) => e.tocSubEras ?? e.subEras),
    [baseEras],
  );
  const allNodes = useMemo(
    () => baseEras.flatMap((e) => e.subEras.flatMap((s) => s.timeNodes)),
    [baseEras],
  );

  const categoriesByNameOrSlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.slug.toLocaleLowerCase("vi"), c.id);
      map.set(c.name.toLocaleLowerCase("vi"), c.id);
    }
    return map;
  }, [categories]);

  const fallbackEventRootId = useMemo(
    () => categories.find((c) => c.slug === SYSTEM_CATEGORY_ROOT_SLUGS.EVENT)?.id ?? null,
    [categories],
  );

  const reset = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setFocusedTocId(null);
    setBookmarksOnly(false);
  };

  const tocSelection = useMemo(
    () => resolveTocSelection(baseEras, focusedTocId),
    [baseEras, focusedTocId],
  );

  const effectiveFilters = useMemo<TimelineFilters>(
    () =>
      focusedTocId
        ? { ...filters, eras: tocSelection.eras, subs: tocSelection.subs }
        : filters,
    [filters, focusedTocId, tocSelection],
  );

  // Tính số dấu mốc theo từng categoryId trên phạm vi Thời kỳ, Chủ điểm & Tìm kiếm hiện tại
  const branchCategoryCounts = useMemo(() => {
    const erasWithoutCatFilter = filterEras(
      baseEras,
      { ...effectiveFilters, rootCategoryId: null, subCategoryIds: [] },
      {
        query,
        bookmarksOnly,
        saved,
        allowedCategoryIds: new Set(),
        selectedTags: effectiveFilters.tags,
        fallbackEventRootId,
      },
      categoriesByNameOrSlug,
    );
    const directCounts: Record<string, number> = {};
    for (const era of erasWithoutCatFilter) {
      for (const sub of era.subEras) {
        for (const node of sub.timeNodes) {
          for (const ev of node.events) {
            const cid = resolveTimelineEventCategoryId(ev, categoriesByNameOrSlug, fallbackEventRootId);
            if (cid) directCounts[cid] = (directCounts[cid] ?? 0) + 1;
          }
        }
      }
    }
    return computeRecursiveCategoryBranchCounts(categories, directCounts);
  }, [baseEras, effectiveFilters, query, bookmarksOnly, saved, fallbackEventRootId, categoriesByNameOrSlug, categories]);

  const tagOptions = useMemo(() => {
    const allowedCategoryIds = new Set(resolveEffectiveCategorySelectionIds(effectiveFilters, categories));
    const erasWithoutTagFilter = filterEras(
      baseEras,
      { ...effectiveFilters, tags: [] },
      {
        query,
        bookmarksOnly,
        saved,
        allowedCategoryIds,
        selectedTags: [],
        fallbackEventRootId,
      },
      categoriesByNameOrSlug,
    );
    const eventsForTags = erasWithoutTagFilter.flatMap((e) =>
      e.subEras.flatMap((s) => s.timeNodes.flatMap((n) => n.events)),
    );
    return computeTagFacetsFromItems(eventsForTags);
  }, [baseEras, effectiveFilters, categories, query, bookmarksOnly, saved, fallbackEventRootId, categoriesByNameOrSlug]);

  const tagNamesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of allNodes) {
      for (const ev of n.events) {
        for (const t of ev.tagItems) map.set(t.id, t.name);
      }
    }
    return map;
  }, [allNodes]);

  const eras = useMemo(() => {
    const allowedCategoryIds = new Set(resolveEffectiveCategorySelectionIds(effectiveFilters, categories));
    return filterEras(
      baseEras,
      effectiveFilters,
      {
        query,
        bookmarksOnly,
        saved,
        allowedCategoryIds,
        selectedTags: effectiveFilters.tags,
        fallbackEventRootId,
      },
      categoriesByNameOrSlug,
    );
  }, [baseEras, effectiveFilters, categories, query, bookmarksOnly, saved, fallbackEventRootId, categoriesByNameOrSlug]);

  const countFor = (draft: TimelineFilters) => {
    const mergedDraft = focusedTocId
      ? { ...draft, eras: tocSelection.eras, subs: tocSelection.subs }
      : draft;
    const allowedCategoryIds = new Set(resolveEffectiveCategorySelectionIds(mergedDraft, categories));
    return countEvents(
      filterEras(
        baseEras,
        mergedDraft,
        {
          query,
          bookmarksOnly,
          saved,
          allowedCategoryIds,
          selectedTags: mergedDraft.tags,
          fallbackEventRootId,
        },
        categoriesByNameOrSlug,
      ),
    );
  };

  const filterKey = `${JSON.stringify(filters)}-${focusedTocId ?? ""}`;
  const visibleNodes = useMemo(() => eras.flatMap((e) => e.subEras.flatMap((s) => s.timeNodes)), [eras]);
  const selectedNode = pickSelectedNode(visibleNodes, selected);
  const tocNodes = useMemo(() => toTocNodes(baseEras), [baseEras]);

  const activeTocId = focusedTocId ?? undefined;

  const handleFocusFromToc = (tocId: string) => {
    setFocusedTocId(tocId);
    canvas.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearTocFocus = () => {
    setFocusedTocId(null);
  };

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

  const hasAnyFacetFilter = Boolean(
    filters.rootCategoryId || filters.subCategoryIds.length > 0 || filters.tags.length > 0,
  );

  return (
    <div className="sk-app">
      {hero}
      <div className="sk-explorer">
        <div className="sk-explorer-intro">
          <div>
            <Heading
              level={1}
              className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl font-extrabold text-[var(--text-body)] tracking-tight"
            >
              {bookmarksOnly ? "Dấu mốc đã lưu" : "Dòng chảy lịch sử ngàn năm"}
            </Heading>
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
          categories={categories}
          tagNamesById={tagNamesById}
          compact={compact}
          onCompact={() => setCompact(!compact)}
          bookmarksOnly={bookmarksOnly}
          onBookmarksOnly={() => setBookmarksOnly(!bookmarksOnly)}
          savedCount={saved.length}
          focusedTocLabel={tocSelection.label}
          onClearTocFocus={clearTocFocus}
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
          categories={categories}
          branchCategoryCounts={branchCategoryCounts}
          tagOptions={tagOptions}
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
                      const hasActiveFilter = Boolean(
                        query ||
                          Boolean(focusedTocId) ||
                          filters.eras.length ||
                          filters.subs.length ||
                          hasAnyFacetFilter ||
                          bookmarksOnly,
                      );
                      const eraResetKey = `${e.id}-${query}-${filterKey}-${bookmarksOnly}`;
                      return (
                        <EraSection
                          key={`${e.id}-${hasActiveFilter ? "filtered" : "all"}`}
                          title={e.title}
                          slug={e.slug}
                          period={e.periodLabel}
                          index={ei}
                          overview={e.overview}
                          defaultOpen={ei === 0 || eras.length === 1 || hasActiveFilter}
                        >
                          <motion.div key="spine-progress" className="sk-spine-progress" style={{ scaleY: progress }} />
                          <LazySubEraList
                            subEras={e.subEras}
                            resetKey={eraResetKey}
                            renderSubEra={(s) => {
                              const isDuplicateTitle =
                                isSingleSub || s.title.trim().toLowerCase() === e.title.trim().toLowerCase();
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
                            }}
                          />
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

      <EventDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        onSelect={setDetail}
        onStep={moveEvent}
        saved={detail ? saved.includes(detail.event.id) : false}
        onSave={toggleSaved}
      />

      {!tocOpen && !detail && !sheetOpen && (
        <button
          type="button"
          className="sk-toc-floating-side-tab"
          onClick={() => setTocOpen(true)}
          title="Mục lục thời kỳ lịch sử"
          aria-label="Mở mục lục thời kỳ"
        >
          <BookOpen size={15} />
          <span>Mục lục</span>
          {eras.length > 0 && <span className="sk-toc-floating-badge">{eras.length}</span>}
        </button>
      )}

      <TocDrawer
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        heading="Mục lục thời kỳ"
        itemLabel="mốc sự kiện"
        nodes={tocNodes}
        activeId={activeTocId}
        totalCount={countEvents(baseEras)}
        onJump={handleFocusFromToc}
        onClearActive={clearTocFocus}
        allLabel="Tất cả thời kỳ"
      />
    </div>
  );
}
