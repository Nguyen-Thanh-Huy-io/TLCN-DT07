"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, RotateCcw, Search, Users, X } from "lucide-react";
import { Badge, Button, Heading } from "@/components/timeline/TimelineChrome";
import { Pagination } from "@/components/common/Pagination";
import type { PublicFigureProfileDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { FiguresHero } from "./FiguresDirectoryParts";
import {
  EMPTY_FIGURE_FILTERS,
  FiguresFilterBar,
  figureFilterCount,
  type FigureFilters,
  FigureSort,
  type FilterOption,
} from "./FiguresDirectoryParts";
import { FiguresGrid, FiguresSidebar, type SidebarFilterItem } from "./FiguresDirectoryParts";
import { FigureProfileSheet, FigureProfileTab, type ProfileTab } from "./FigureProfileParts";
import {
  ARTICLE_ERA_LABELS,
  ARTICLE_REGION_LABELS,
  articleEraLabel,
  articleRegionLabel,
  buildFigureViews,
  normalize,
  personRoleLabel,
  type FigureView,
} from "./figure-utils";
import { ChipGroup, FilterDialog, FilterSection, PickedCount, toggleValue } from "@/components/filters/ChipFilter";
import { TimelineRelationDirection } from "@/components/timeline/sk-types";

const PROFILE_QUERY_KEY = "nv";
const FIGURES_PAGE_SIZE = 16;

export function FiguresDirectory({
  figures: rawFigures,
  periods,
  initialSlug,
}: {
  figures: PublicFigureProfileDto[];
  periods: PublicPeriodDto[];
  initialSlug?: string;
}) {
  const figures = useMemo(() => buildFigureViews(rawFigures, periods), [rawFigures, periods]);
  const [query, setQuery] = useState("");
  const [filters, setFiltersRaw] = useState<FigureFilters>(EMPTY_FIGURE_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sort, setSort] = useState<FigureSort>(FigureSort.TIME);
  const [selected, setSelected] = useState<FigureView | null>(
    () => figures.find((f) => f.slug === initialSlug) ?? null,
  );
  const [tab, setTab] = useState<ProfileTab>(FigureProfileTab.TIMELINE);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset về trang 1 khi lọc hoặc tìm kiếm
  useEffect(() => {
    queueMicrotask(() => setCurrentPage(1));
  }, [query, filters, sort]);

  // Keep the open profile in the URL so it can be shared. Done from event handlers only:
  // Next.js routes history.replaceState through the app router, which must be mounted first.
  const selectFigure = useCallback((figure: FigureView | null) => {
    setSelected(figure);
    const url = new URL(window.location.href);
    if (figure) url.searchParams.set(PROFILE_QUERY_KEY, figure.slug);
    else url.searchParams.delete(PROFILE_QUERY_KEY);
    window.history.replaceState(null, "", url);
  }, []);

  const eras: FilterOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    for (const f of figures) if (f.eraId && f.eraTitle) seen.set(f.eraId, f.eraTitle);
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [figures]);

  const subEras = useMemo(() => {
    const seen = new Map<string, { title: string; eraId: string | null }>();
    for (const f of figures) if (f.subEraSlug && f.subEraTitle) seen.set(f.subEraSlug, { title: f.subEraTitle, eraId: f.eraId });
    return Array.from(seen, ([id, v]) => ({ id, ...v }));
  }, [figures]);

  const roleOptions: SidebarFilterItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of figures) for (const r of f.roles ?? []) counts.set(r, (counts.get(r) ?? 0) + 1);
    return Array.from(counts, ([id, count]) => ({ id, label: personRoleLabel(id), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
  }, [figures]);

  const regionOptions: SidebarFilterItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of figures) if (f.region) counts.set(f.region, (counts.get(f.region) ?? 0) + 1);
    return Object.keys(ARTICLE_REGION_LABELS)
      .filter((id) => counts.has(id))
      .map((id) => ({ id, label: articleRegionLabel(id) ?? id, count: counts.get(id)! }));
  }, [figures]);

  const articleEraOptions: SidebarFilterItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of figures) if (f.era) counts.set(f.era, (counts.get(f.era) ?? 0) + 1);
    return Object.keys(ARTICLE_ERA_LABELS)
      .filter((id) => counts.has(id))
      .map((id) => ({ id, label: articleEraLabel(id) ?? id, count: counts.get(id)! }));
  }, [figures]);

  const eraSidebarOptions: SidebarFilterItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of figures) if (f.eraId) counts.set(f.eraId, (counts.get(f.eraId) ?? 0) + 1);
    return eras.map((e) => ({ id: e.id, label: e.title, count: counts.get(e.id) ?? 0 }));
  }, [figures, eras]);

  // Bỏ thời kỳ thì bỏ luôn các giai đoạn thuộc thời kỳ đó.
  const cleanSubs = useCallback(
    (f: FigureFilters): FigureFilters =>
      f.eras.length === 0 ? f : { ...f, subs: f.subs.filter((s) => f.eras.includes(subEras.find((x) => x.id === s)?.eraId ?? "")) },
    [subEras],
  );
  const setFilters = (f: FigureFilters) => setFiltersRaw(cleanSubs(f));
  const toggleSidebarFilter = (key: keyof FigureFilters, value: string) =>
    setFilters({ ...filters, [key]: toggleValue(filters[key], value) });

  const matches = useCallback(
    (f: FigureView, fl: FigureFilters, needle: string) => {
      if (fl.regions.length && !fl.regions.includes(f.region ?? "")) return false;
      if (fl.articleEras.length && !fl.articleEras.includes(f.era ?? "")) return false;
      if (fl.roles.length && !(f.roles ?? []).some((r) => fl.roles.includes(r))) return false;
      if (fl.eras.length && !fl.eras.includes(f.eraId ?? "")) return false;
      // Giai đoạn chỉ thu hẹp thời kỳ chứa nó.
      const subsOfEra = fl.subs.filter((s) => subEras.find((x) => x.id === s)?.eraId === f.eraId);
      if (subsOfEra.length && !subsOfEra.includes(f.subEraSlug ?? "")) return false;
      if (!needle) return true;
      const haystack = [f.name, ...f.aliases, f.occupation ?? "", ...f.titles, ...f.events.map((e) => e.title)].join(" ");
      return normalize(haystack).includes(needle);
    },
    [subEras],
  );

  const relationCount = useMemo(
    () => figures.reduce((n, f) => n + f.relationships.filter((r) => r.direction === TimelineRelationDirection.OUTGOING).length, 0),
    [figures],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return figures
      .filter((f) => matches(f, filters, needle))
      .sort((a, b) => (sort === FigureSort.NAME ? a.name.localeCompare(b.name, "vi") : a.sortYear - b.sortYear));
  }, [figures, query, filters, sort, matches]);

  // Phân trang dữ liệu
  const paginatedFigures = useMemo(() => {
    const start = (currentPage - 1) * FIGURES_PAGE_SIZE;
    return filtered.slice(start, start + FIGURES_PAGE_SIZE);
  }, [filtered, currentPage]);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    document.getElementById("sk-directory-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const countFor = (draft: FigureFilters) => {
    const needle = normalize(query.trim());
    return figures.filter((f) => matches(f, cleanSubs(draft), needle)).length;
  };

  const reset = () => {
    setQuery("");
    setFiltersRaw(EMPTY_FIGURE_FILTERS);
  };

  const eraTitle = (id: string) => eras.find((e) => e.id === id)?.title ?? "Thời kỳ";
  const chips = [
    ...filters.regions.map((v) => ({ key: "regions" as const, value: v, label: articleRegionLabel(v) ?? v })),
    ...filters.articleEras.map((v) => ({ key: "articleEras" as const, value: v, label: articleEraLabel(v) ?? v })),
    ...filters.roles.map((v) => ({ key: "roles" as const, value: v, label: personRoleLabel(v) })),
    ...filters.eras.map((v) => ({ key: "eras" as const, value: v, label: eraTitle(v) })),
    ...filters.subs.map((v) => ({ key: "subs" as const, value: v, label: subEras.find((s) => s.id === v)?.title ?? "Giai đoạn" })),
  ];
  const open = useCallback(
    (figure: FigureView) => {
      selectFigure(figure);
      setTab(FigureProfileTab.TIMELINE);
    },
    [selectFigure],
  );
  const activeFilters = figureFilterCount(filters) + (query ? 1 : 0);

  return (
    <div className="sk-app">
      <FiguresHero figures={figures} periodCount={subEras.length} relationCount={relationCount} />
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
        <FiguresFilterBar
          query={query}
          onQuery={setQuery}
          filters={filters}
          onFilters={setFilters}
          onOpenSheet={() => setSheetOpen(true)}
          chips={chips}
          sort={sort}
          onSort={setSort}
        />
        <FilterDialog
          open={sheetOpen}
          value={filters}
          empty={EMPTY_FIGURE_FILTERS}
          countFor={countFor}
          onApply={(f) => {
            setFilters(f);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        >
          {(draft, setDraft) => {
            const toggle = (key: keyof FigureFilters, v: string) =>
              setDraft((d) => cleanSubs({ ...d, [key]: toggleValue(d[key], v) }));
            const eraOptions = eras.map((e) => ({ value: e.id, label: e.title }));
            return (
              <>
                {regionOptions.length > 0 && (
                  <FilterSection card title="Phạm vi" aside={<PickedCount count={draft.regions.length} />}>
                    <ChipGroup
                      options={regionOptions.map((o) => ({ value: o.id, label: o.label }))}
                      selected={draft.regions}
                      onToggle={(v) => toggle("regions", v)}
                      searchLabel="Tìm phạm vi..."
                    />
                  </FilterSection>
                )}
                {articleEraOptions.length > 0 && (
                  <FilterSection card title="Kỷ nguyên" aside={<PickedCount count={draft.articleEras.length} />}>
                    <ChipGroup
                      options={articleEraOptions.map((o) => ({ value: o.id, label: o.label }))}
                      selected={draft.articleEras}
                      onToggle={(v) => toggle("articleEras", v)}
                      searchLabel="Tìm kỷ nguyên..."
                    />
                  </FilterSection>
                )}
                {roleOptions.length > 0 && (
                  <FilterSection card title="Vai trò" aside={<PickedCount count={draft.roles.length} />}>
                    <ChipGroup
                      options={roleOptions.map((o) => ({ value: o.id, label: o.label }))}
                      selected={draft.roles}
                      onToggle={(v) => toggle("roles", v)}
                      searchLabel="Tìm vai trò..."
                    />
                  </FilterSection>
                )}
                <FilterSection card title="Thời kỳ" aside={<PickedCount count={draft.eras.length + draft.subs.length} />}>
                  <ChipGroup options={eraOptions} selected={draft.eras} onToggle={(v) => toggle("eras", v)} searchLabel="Tìm thời kỳ..." />
                  {draft.eras.map((eraId) => {
                    const subs = subEras.filter((s) => s.eraId === eraId);
                    if (subs.length < 2) return null;
                    return (
                      <div key={eraId}>
                        <div className="sk-fs-sublabel">Giai đoạn · {eraTitle(eraId)}</div>
                        <ChipGroup
                          options={subs.map((s) => ({ value: s.id, label: s.title }))}
                          selected={draft.subs}
                          onToggle={(v) => toggle("subs", v)}
                          searchLabel="Tìm giai đoạn..."
                        />
                      </div>
                    );
                  })}
                </FilterSection>
              </>
            );
          }}
        </FilterDialog>
        <div className="sk-directory-body">
          <FiguresSidebar
            filters={filters}
            onToggle={toggleSidebarFilter}
            onReset={reset}
            regionOptions={regionOptions}
            articleEraOptions={articleEraOptions}
            roleOptions={roleOptions}
            eraOptions={eraSidebarOptions}
          />
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
              <>
                <FiguresGrid figures={paginatedFigures} onOpen={open} />
                <Pagination
                  currentPage={currentPage}
                  totalItems={filtered.length}
                  pageSize={FIGURES_PAGE_SIZE}
                  onPageChange={handlePageChange}
                  itemLabel="nhân vật lịch sử"
                />
              </>
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
    </div>
  );
}
