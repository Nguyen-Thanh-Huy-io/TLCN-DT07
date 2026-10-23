"use client";

import { useCallback, useMemo, useState } from "react";
import { Compass, RotateCcw, Search, Users, X } from "lucide-react";
import { Badge, Button, Heading } from "@/components/timeline/sk-ui";
import type { PublicFigureProfileDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { FiguresHero } from "./FiguresHero";
import {
  EMPTY_FIGURE_FILTERS,
  FiguresFilterBar,
  figureFilterCount,
  type FigureFilters,
  type FigureSort,
  type FilterOption,
} from "./FiguresFilterBar";
import { FiguresSidebar } from "./FiguresSidebar";
import { FiguresGrid } from "./FigureCard";
import { FigureProfileSheet, type ProfileTab } from "./FigureProfileSheet";
import { buildFigureViews, normalize, type FigureView } from "./figure-utils";
import { figureRoles, useFigureRoles } from "./figure-roles";
import { ChipGroup, FilterDialog, FilterSection, PickedCount, toggleValue } from "@/components/filters/ChipFilter";
import { regionLabel, sortedRegions } from "@/utils/region.utils";

const PROFILE_QUERY_KEY = "nv";

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
  const [sort, setSort] = useState<FigureSort>("time");
  const [selected, setSelected] = useState<FigureView | null>(
    () => figures.find((f) => f.slug === initialSlug) ?? null,
  );
  const [tab, setTab] = useState<ProfileTab>("timeline");

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

  // Khu vực của nhân vật = khu vực của thời kỳ gốc chứa nhân vật.
  const regionOfEra = useMemo(() => {
    const byId = new Map(periods.map((p) => [p.id, regionLabel(p.region)]));
    return (eraId: string | null) => (eraId ? byId.get(eraId) ?? null : null);
  }, [periods]);
  const regions = useMemo(
    () => sortedRegions(figures.map((f) => regionOfEra(f.eraId)).filter((r): r is string => Boolean(r))),
    [figures, regionOfEra],
  );

  // Bỏ thời kỳ thì bỏ luôn các giai đoạn thuộc thời kỳ đó.
  const cleanSubs = useCallback(
    (f: FigureFilters): FigureFilters =>
      f.eras.length === 0 ? f : { ...f, subs: f.subs.filter((s) => f.eras.includes(subEras.find((x) => x.id === s)?.eraId ?? "")) },
    [subEras],
  );
  const setFilters = (f: FigureFilters) => setFiltersRaw(cleanSubs(f));

  const matches = useCallback(
    (f: FigureView, fl: FigureFilters, needle: string) => {
      if (fl.regions.length && !fl.regions.includes(regionOfEra(f.eraId) ?? "")) return false;
      if (fl.eras.length && !fl.eras.includes(f.eraId ?? "")) return false;
      // Giai đoạn chỉ thu hẹp thời kỳ chứa nó.
      const subsOfEra = fl.subs.filter((s) => subEras.find((x) => x.id === s)?.eraId === f.eraId);
      if (subsOfEra.length && !subsOfEra.includes(f.subEraSlug ?? "")) return false;
      if (fl.roles.length && !fl.roles.some((r) => f.roles.includes(r))) return false;
      if (!needle) return true;
      const haystack = [f.name, ...f.aliases, f.occupation ?? "", ...f.titles, ...f.events.map((e) => e.title)].join(" ");
      return normalize(haystack).includes(needle);
    },
    [regionOfEra, subEras],
  );

  // Vai trò theo "Danh mục dùng chung" (thứ tự, nhãn do CMS quản lý).
  const figureRoleTaxonomy = useFigureRoles();
  const countByRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of figures) for (const r of figureRoles(f.roles)) counts.set(r, (counts.get(r) ?? 0) + 1);
    return counts;
  }, [figures]);

  const relationCount = useMemo(
    () => figures.reduce((n, f) => n + f.relationships.filter((r) => r.direction === "OUTGOING").length, 0),
    [figures],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return figures
      .filter((f) => matches(f, filters, needle))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, "vi") : a.sortYear - b.sortYear));
  }, [figures, query, filters, sort, matches]);
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
    ...filters.regions.map((v) => ({ key: "regions" as const, value: v, label: v })),
    ...filters.eras.map((v) => ({ key: "eras" as const, value: v, label: eraTitle(v) })),
    ...filters.subs.map((v) => ({ key: "subs" as const, value: v, label: subEras.find((s) => s.id === v)?.title ?? "Giai đoạn" })),
    ...filters.roles.map((v) => ({ key: "roles" as const, value: v, label: figureRoleTaxonomy.label(v) })),
  ];
  const open = useCallback(
    (figure: FigureView) => {
      selectFigure(figure);
      setTab("timeline");
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
            // Đã chọn khu vực thì chỉ gợi ý thời kỳ thuộc khu vực đó (thời kỳ đã chọn vẫn giữ).
            const eraOptions = eras
              .filter((e) => !draft.regions.length || draft.eras.includes(e.id) || draft.regions.includes(regionOfEra(e.id) ?? ""))
              .map((e) => ({ value: e.id, label: e.title }));
            return (
              <>
                {regions.length > 1 && (
                  <FilterSection title="Quốc gia / khu vực" aside={<PickedCount count={draft.regions.length} />}>
                    <ChipGroup
                      options={regions.map((r) => ({ value: r, label: r }))}
                      selected={draft.regions}
                      onToggle={(v) => toggle("regions", v)}
                      searchLabel="Tìm quốc gia / khu vực..."
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
                <FilterSection title="Vai trò" aside={<PickedCount count={draft.roles.length} />}>
                  <ChipGroup
                    options={figureRoleTaxonomy.options.filter((r) => countByRole.get(r.code)).map((r) => ({
                      value: r.code,
                      label: r.label,
                      hint: `${countByRole.get(r.code)} nhân vật`,
                    }))}
                    selected={draft.roles}
                    onToggle={(v) => toggle("roles", v)}
                    searchLabel="Tìm vai trò..."
                  />
                </FilterSection>
              </>
            );
          }}
        </FilterDialog>
        <div className="sk-directory-body">
          <FiguresSidebar
            roles={filters.roles}
            onToggleRole={(r) => setFilters({ ...filters, roles: toggleValue(filters.roles, r) })}
            onClearRoles={() => setFilters({ ...filters, roles: [] })}
            total={figures.length}
            countByRole={countByRole}
          />
          <div className="sk-directory-results">
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
              <FiguresGrid figures={filtered} onOpen={open} />
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
