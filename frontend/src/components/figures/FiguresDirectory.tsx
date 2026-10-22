"use client";

import { useCallback, useMemo, useState } from "react";
import { Compass, RotateCcw, Search, Users, X } from "lucide-react";
import { Badge, Button, Heading } from "@/components/timeline/sk-ui";
import type { PublicFigureProfileDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { FiguresHero } from "./FiguresHero";
import { FiguresFilterBar, type FigureSort, type FilterOption } from "./FiguresFilterBar";
import { FiguresSidebar } from "./FiguresSidebar";
import { FiguresGrid } from "./FigureCard";
import { FigureProfileSheet, type ProfileTab } from "./FigureProfileSheet";
import { buildFigureViews, normalize, type FigureView } from "./figure-utils";
import { figureRoles, isFigureRole } from "./figure-roles";
import { FIGURE_ROLE_LABELS, type FigureRole } from "@/constants/enums";

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
  const [era, setEra] = useState("");
  const [subEra, setSubEra] = useState("");
  const [role, setRole] = useState("");
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

  const countByRole = useMemo(() => {
    const counts = new Map<FigureRole, number>();
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
      .filter((f) => {
        if (era && f.eraId !== era) return false;
        if (subEra && f.subEraSlug !== subEra) return false;
        if (role && !f.roles.includes(role)) return false;
        if (!needle) return true;
        const haystack = [f.name, ...f.aliases, f.occupation ?? "", ...f.titles, ...f.events.map((e) => e.title)].join(" ");
        return normalize(haystack).includes(needle);
      })
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, "vi") : a.sortYear - b.sortYear));
  }, [figures, query, era, subEra, role, sort]);

  const reset = () => {
    setQuery("");
    setEra("");
    setSubEra("");
    setRole("");
  };
  const open = useCallback(
    (figure: FigureView) => {
      selectFigure(figure);
      setTab("timeline");
    },
    [selectFigure],
  );
  const activeFilters = [era, subEra, role, query].filter(Boolean).length;

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
          era={era}
          onEra={setEra}
          subEra={subEra}
          onSubEra={setSubEra}
          role={role}
          onRole={setRole}
          sort={sort}
          onSort={setSort}
          eras={eras}
          subEras={subEras}
        />
        <div className="sk-directory-body">
          <FiguresSidebar role={role} onRole={setRole} total={figures.length} countByRole={countByRole} />
          <div className="sk-directory-results">
            <div className="sk-results-toolbar">
              <span>
                Hiển thị <strong>{filtered.length}</strong> nhân vật
                {role && isFigureRole(role) && <> · {FIGURE_ROLE_LABELS[role]}</>}
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
