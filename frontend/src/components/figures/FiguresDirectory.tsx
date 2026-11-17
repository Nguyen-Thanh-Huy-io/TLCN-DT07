"use client";

import { useCallback, useMemo, useState } from "react";
import { BookOpen, Compass, RotateCcw, Search, Users, X } from "lucide-react";
import { Badge, Button, Heading } from "@/components/timeline/TimelineChrome";
import type { PublicFigureProfileDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { findRootTopic, groupByTopic } from "@/services/entities/landing-graph";
import type { PublicTopicRef } from "@/services/public/public-content.service";
import { TocDrawer, type TocNode } from "@/components/common/TocDrawer";
import { FiguresHero, TopicSection, TopicLeafSection } from "./FiguresDirectoryParts";
import { FiguresFilterBar, FigureSort } from "./FiguresDirectoryParts";
import { FigureProfileSheet, FigureProfileTab, type ProfileTab } from "./FigureProfileParts";
import { buildFigureViews, normalize, type FigureView } from "./figure-utils";
import { TimelineRelationDirection } from "@/components/timeline/sk-types";

const PROFILE_QUERY_KEY = "nv";

/** Id khớp với TopicSection/TopicLeafSection bên dưới. */
function jumpToTopic(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function FiguresDirectory({
  figures: rawFigures,
  periods,
  topics,
  initialSlug,
}: {
  figures: PublicFigureProfileDto[];
  periods: PublicPeriodDto[];
  topics: PublicTopicRef[];
  initialSlug?: string;
}) {
  const figures = useMemo(() => buildFigureViews(rawFigures, periods), [rawFigures, periods]);
  const [query, setQuery] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [sort, setSort] = useState<FigureSort>(FigureSort.TIME);
  const [selected, setSelected] = useState<FigureView | null>(
    () => figures.find((f) => f.slug === initialSlug) ?? null,
  );
  const [tab, setTab] = useState<ProfileTab>(FigureProfileTab.TIMELINE);

  // Keep the open profile in the URL so it can be shared. Done from event handlers only:
  // Next.js routes history.replaceState through the app router, which must be mounted first.
  const selectFigure = useCallback((figure: FigureView | null) => {
    setSelected(figure);
    const url = new URL(window.location.href);
    if (figure) url.searchParams.set(PROFILE_QUERY_KEY, figure.slug);
    else url.searchParams.delete(PROFILE_QUERY_KEY);
    window.history.replaceState(null, "", url);
  }, []);

  /** Chỉ còn tìm kiếm: tên, tên gọi khác, danh hiệu, vai trò, sự kiện trong dòng đời. */
  const matches = useCallback((f: FigureView, needle: string) => {
    if (!needle) return true;
    const haystack = [f.name, ...f.aliases, ...f.titles, ...(f.roles ?? []), ...f.events.map((e) => e.title)].join(" ");
    return normalize(haystack).includes(needle);
  }, []);

  const relationCount = useMemo(
    () => figures.reduce((n, f) => n + f.relationships.filter((r) => r.direction === TimelineRelationDirection.OUTGOING).length, 0),
    [figures],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return figures
      .filter((f) => matches(f, needle))
      .sort((a, b) => (sort === FigureSort.NAME ? a.name.localeCompare(b.name, "vi") : a.sortYear - b.sortYear));
  }, [figures, query, sort, matches]);

  const topicBlocks = useMemo(
    () =>
      groupByTopic(filtered, (f) => f.topicId ?? null, {
        topics,
        rootTopicOf: (id) => findRootTopic(topics, id),
      }),
    [filtered, topics],
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

  const reset = () => setQuery("");
  const open = useCallback(
    (figure: FigureView) => {
      selectFigure(figure);
      setTab(FigureProfileTab.TIMELINE);
    },
    [selectFigure],
  );
  const activeFilters = query ? 1 : 0;

  return (
    <div className="sk-app">
      <FiguresHero figures={figures} periodCount={topicBlocks.reduce((n, b) => n + b.leaves.length, 0)} relationCount={relationCount} />
      <section className="sk-figures-directory">
        <div className="sk-directory-intro">
          <div>
            <span className="sk-section-eyebrow">DANH BẠ NHÂN VẬT</span>
            <Heading>
              Gặp người trong sử sách<span>.</span>
            </Heading>
            <p>Khám phá cuộc đời, di sản và những mối giao thoa lịch sử.</p>
          </div>
          <Badge className="sk-directory-count">
            <Users size={14} /> {figures.length} hồ sơ để khám phá
          </Badge>
        </div>
        <FiguresFilterBar query={query} onQuery={setQuery} sort={sort} onSort={setSort} />
        <div className="sk-directory-body">
          <div className="sk-directory-results w-full" id="sk-directory-anchor">
            <div className="sk-results-toolbar">
              <span>
                Hiển thị <strong>{filtered.length}</strong> nhân vật
              </span>
              {activeFilters > 0 && (
                <Button onClick={reset}>
                  <X size={12} /> Xóa bộ lọc ({activeFilters})
                </Button>
              )}
            </div>
            {filtered.length ? (
              topicBlocks.map((block) => (
                <TopicSection key={block.id} block={block}>
                  {block.leaves.map((leaf) => (
                    <TopicLeafSection key={leaf.id} leaf={leaf} onOpen={open} />
                  ))}
                </TopicSection>
              ))
            ) : (
              <div className="sk-empty">
                <Search size={34} />
                <Heading>Chưa tìm thấy nhân vật</Heading>
                <p>Thử tìm bằng tên gọi khác, sự kiện hoặc chọn một thời kỳ khác.</p>
                {activeFilters > 0 && (
                  <Button className="sk-primary" onClick={reset}>
                    Xóa bộ lọc <RotateCcw size={14} />
                  </Button>
                )}
              </div>
            )}
            <div className="sk-directory-end">
              <span />
              <Compass size={18} />
              <span />
            </div>
          </div>
        </div>
      </section>
      <FigureProfileSheet
        figure={selected}
        directory={figures}
        periods={periods}
        tab={tab}
        onTab={setTab}
        onClose={() => selectFigure(null)}
        onNavigate={selectFigure}
      />

      <button
        type="button"
        className="sk-toc-floating-side-tab"
        onClick={() => setTocOpen(true)}
        title="Mục lục chủ đề nhân vật"
        aria-label="Mở mục lục chủ đề"
      >
        <BookOpen size={15} />
        <span>Mục lục</span>
      </button>

      <TocDrawer
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        heading="Mục lục chủ đề"
        itemLabel="nhân vật"
        nodes={tocNodes}
        totalCount={filtered.length}
        onJump={jumpToTopic}
      />
    </div>
  );
}
