"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PublicPeriodDto,
  PublicEventSummaryDto,
  PUBLIC_ROUTE_PREFIX,
} from "@/services/entities/landing.service";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/constants/enums";

const TOP_PERIOD_COLORS = [
  "#ef4444", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#06b6d4", "#ec4899",
];

const CATEGORY_COLORS: Record<string, string> = {
  BATTLE: "#f87171",
  WAR: "#fb923c",
  TREATY: "#34d399",
  REVOLUTION: "#fbbf24",
  POLITICAL_EVENT: "#60a5fa",
  SUMMIT_CONFERENCE: "#c084fc",
  CULTURE_SCIENCE: "#facc15",
  NATURAL_DISASTER: "#94a3b8",
  OTHER: "#a78bfa",
};

const CURRENT_YEAR = new Date().getFullYear();

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

interface TopPeriod extends PublicPeriodDto {
  color: string;
}

export function TimelineDashboard({
  periods,
  events,
}: {
  periods: PublicPeriodDto[];
  events: PublicEventSummaryDto[];
}) {
  const topPeriods: TopPeriod[] = useMemo(
    () =>
      periods
        .filter((p) => !p.parentId)
        .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0))
        .map((p, i) => ({ ...p, color: TOP_PERIOD_COLORS[i % TOP_PERIOD_COLORS.length] })),
    [periods],
  );

  const periodBySlug = useMemo(() => {
    const map = new Map<string, PublicPeriodDto>();
    for (const p of periods) map.set(p.slug, p);
    return map;
  }, [periods]);

  function topPeriodIdOf(event: PublicEventSummaryDto): string | null {
    if (!event.periodSlug) return null;
    const leaf = periodBySlug.get(event.periodSlug);
    if (!leaf) return null;
    return leaf.parentId || leaf.id;
  }

  const [selectedTopPeriodId, setSelectedTopPeriodId] = useState<string | null>(
    topPeriods[0]?.id ?? null,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedTopPeriod = topPeriods.find((p) => p.id === selectedTopPeriodId) || null;

  const minYear = useMemo(() => {
    if (periods.length === 0) return CURRENT_YEAR - 1000;
    return Math.min(...periods.map((p) => p.startYear ?? CURRENT_YEAR));
  }, [periods]);
  const maxYear = CURRENT_YEAR;
  const span = Math.max(1, maxYear - minYear);

  function pct(year: number): number {
    return Math.min(100, Math.max(0, ((year - minYear) / span) * 100));
  }

  const periodEvents = useMemo(() => {
    if (!selectedTopPeriodId) return [];
    return events
      .filter((e) => topPeriodIdOf(e) === selectedTopPeriodId)
      .sort((a, b) => a.startYear - b.startYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, selectedTopPeriodId, periodBySlug]);

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of periodEvents) counts.set(e.category, (counts.get(e.category) || 0) + 1);
    return Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: EVENT_CATEGORY_LABELS[key as EventCategory] || key,
      count,
    }));
  }, [periodEvents]);

  const visibleEvents = useMemo(() => {
    if (!categoryFilter) return periodEvents;
    return periodEvents.filter((e) => e.category === categoryFilter);
  }, [periodEvents, categoryFilter]);

  const selectedEvent =
    visibleEvents.find((e) => e.id === selectedEventId) || visibleEvents[0] || null;

  const milestones = useMemo(
    () =>
      topPeriods
        .map((tp) => {
          const candidate = events
            .filter((e) => topPeriodIdOf(e) === tp.id)
            .sort((a, b) => a.startYear - b.startYear)[0];
          return candidate ? { period: tp, event: candidate } : null;
        })
        .filter((x): x is { period: TopPeriod; event: PublicEventSummaryDto } => x !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topPeriods, events, periodBySlug],
  );

  function selectTopPeriod(id: string) {
    setSelectedTopPeriodId(id);
    setCategoryFilter(null);
    setSelectedEventId(null);
  }

  function cyclePeriod(delta: number) {
    if (!selectedTopPeriodId || topPeriods.length === 0) return;
    const idx = topPeriods.findIndex((p) => p.id === selectedTopPeriodId);
    const next = topPeriods[(idx + delta + topPeriods.length) % topPeriods.length];
    selectTopPeriod(next.id);
  }

  return (
    <div className="rounded-2xl border border-[#2a3444] bg-[#0b1220] p-4 text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Các thời kỳ lịch sử
            </h3>
            <div className="space-y-1.5">
              {topPeriods.map((p) => {
                const active = p.id === selectedTopPeriodId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectTopPeriod(p.id)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      active ? "bg-[#1c2a3f] ring-1 ring-[#334155]" : "hover:bg-[#121a29]"
                    }`}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-100">{p.name}</span>
                      <span className="block text-xs text-slate-400">{p.timeLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lọc sự kiện
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCategoryFilter(null)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  categoryFilter === null
                    ? "bg-[#1c2a3f] font-medium text-slate-100 ring-1 ring-[#334155]"
                    : "text-slate-400 hover:bg-[#121a29] hover:text-slate-200"
                }`}
              >
                Tất cả
              </button>
              {Object.values(EventCategory).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    categoryFilter === cat
                      ? "bg-[#1c2a3f] font-medium text-slate-100 ring-1 ring-[#334155]"
                      : "text-slate-400 hover:bg-[#121a29] hover:text-slate-200"
                  }`}
                >
                  {EVENT_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <div>
            <h2 className="font-[Lora] text-2xl font-semibold text-slate-50">
              Trục thời gian lịch sử Việt Nam
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Khám phá các sự kiện quan trọng và dòng chảy lịch sử qua các thời kỳ.
            </p>
          </div>

          {milestones.length > 0 && (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[640px] items-end gap-3">
                {milestones.map(({ period, event }) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => selectTopPeriod(period.id)}
                    className="flex w-36 shrink-0 flex-col items-start gap-2 rounded-xl border border-[#273246] bg-[#111a2b] p-2.5 text-left transition hover:border-[#3b4a63]"
                  >
                    <div
                      className="flex h-16 w-full items-center justify-center rounded-lg text-2xl font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${period.color}33, ${period.color}99)` }}
                    >
                      {event.title.slice(0, 1)}
                    </div>
                    <div className="w-full">
                      <div className="truncate text-xs font-medium text-slate-100">{event.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{formatYear(event.startYear)}</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
                          style={{ backgroundColor: CATEGORY_COLORS[event.category] || "#64748b" }}
                        >
                          {EVENT_CATEGORY_LABELS[event.category as EventCategory] || event.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {topPeriods.map((p) => {
                const start = p.startYear ?? minYear;
                const end = p.endYear ?? maxYear;
                const width = Math.max(1, ((end - start) / span) * 100);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectTopPeriod(p.id)}
                    title={p.name}
                    style={{ width: `${width}%`, backgroundColor: p.color }}
                    className={`h-full transition-opacity ${
                      p.id === selectedTopPeriodId ? "opacity-100" : "opacity-50 hover:opacity-80"
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
              {topPeriods.map((p) => (
                <span key={p.id}>{formatYear(p.startYear ?? minYear)}</span>
              ))}
              <span>Hiện tại</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#273246] bg-[#0f1726] px-3 py-2">
            <button
              type="button"
              onClick={() => cyclePeriod(-1)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#334155] text-slate-300 hover:bg-[#1c2a3f]"
              aria-label="Thời kỳ trước"
            >
              ‹
            </button>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#1c2a3f]">
              {selectedTopPeriod && (
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${pct(selectedTopPeriod.startYear ?? minYear)}%`,
                    width: `${Math.max(2, pct(selectedTopPeriod.endYear ?? maxYear) - pct(selectedTopPeriod.startYear ?? minYear))}%`,
                    backgroundColor: selectedTopPeriod.color,
                  }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => cyclePeriod(1)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#334155] text-slate-300 hover:bg-[#1c2a3f]"
              aria-label="Thời kỳ sau"
            >
              ›
            </button>
            {selectedTopPeriod && (
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: selectedTopPeriod.color }}
              >
                {selectedTopPeriod.name}
              </span>
            )}
          </div>

          {selectedTopPeriod && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-[Lora] text-lg font-semibold text-slate-100">
                  Các sự kiện nổi bật trong thời kỳ {selectedTopPeriod.name}
                </h3>
                <Link
                  href={`${PUBLIC_ROUTE_PREFIX.PERIOD}/${selectedTopPeriod.slug}`}
                  className="text-xs font-semibold text-sky-400 hover:underline"
                >
                  Xem trang giai đoạn →
                </Link>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategoryFilter(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    categoryFilter === null
                      ? "bg-sky-500 text-white"
                      : "bg-[#121a29] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tất cả ({periodEvents.length})
                </button>
                {categoryTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCategoryFilter(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      categoryFilter === tab.key
                        ? "bg-sky-500 text-white"
                        : "bg-[#121a29] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {visibleEvents.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có sự kiện nào được xuất bản.</p>
                  ) : (
                    visibleEvents.map((event) => {
                      const active = selectedEvent?.id === event.id;
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => setSelectedEventId(event.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition ${
                            active
                              ? "border-sky-500 bg-[#122235]"
                              : "border-[#273246] bg-[#0f1726] hover:border-[#3b4a63]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-slate-100">{event.title}</span>
                              <span
                                className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
                                style={{ backgroundColor: CATEGORY_COLORS[event.category] || "#64748b" }}
                              >
                                {EVENT_CATEGORY_LABELS[event.category as EventCategory] || event.category}
                              </span>
                            </div>
                            {event.description && (
                              <p className="mt-1 truncate text-xs text-slate-400">{event.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-slate-500">
                            {event.eventDateNote || formatYear(event.startYear)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="rounded-xl border border-[#273246] bg-[#0f1726] p-5">
                  {selectedEvent ? (
                    <>
                      <span
                        className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[selectedEvent.category] || "#64748b" }}
                      >
                        {EVENT_CATEGORY_LABELS[selectedEvent.category as EventCategory] || selectedEvent.category}
                      </span>
                      <h4 className="mt-2 font-[Lora] text-xl font-semibold text-slate-50">
                        {selectedEvent.title}
                      </h4>
                      <p className="mt-1 text-sm font-medium text-sky-400">
                        {selectedEvent.eventDateNote || formatYear(selectedEvent.startYear)}
                      </p>
                      {selectedEvent.location && (
                        <p className="mt-2 text-xs text-slate-400">📍 {selectedEvent.location}</p>
                      )}
                      {selectedEvent.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-300">{selectedEvent.description}</p>
                      )}
                      {selectedEvent.slug && (
                        <Link
                          href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${selectedEvent.slug}`}
                          className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-400"
                        >
                          Xem chi tiết sự kiện →
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Chọn một sự kiện để xem chi tiết.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
