"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveTimeline, TimelinePoint } from "./InteractiveTimeline";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/constants/enums";
import { PUBLIC_ROUTE_PREFIX } from "@/services/entities/landing.service";

export interface TimelinePeriodInput {
  id: string;
  slug: string;
  name: string;
  startYear: number;
  timeLabel: string;
}

export interface TimelineEventInput {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  eventDateNote: string | null;
  category: string;
  periodSlug: string | null;
}

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  BATTLE: "#b4231f",
  WAR: "#7a1d1f",
  TREATY: "#1c6e4a",
  REVOLUTION: "#c0772e",
  POLITICAL_EVENT: "#2c5f8a",
  SUMMIT_CONFERENCE: "#5b3a8a",
  CULTURE_SCIENCE: "#9b7338",
  NATURAL_DISASTER: "#555555",
  OTHER: "#8a6828",
};

const PERIOD_COLOR_KEY = "PERIOD";
const PERIOD_COLOR_MAP = { [PERIOD_COLOR_KEY]: "#6e181b" };
const PERIOD_LEGEND_LABELS = { [PERIOD_COLOR_KEY]: "Giai đoạn lịch sử" };

export function TimelineExplorer({
  periods,
  events,
}: {
  periods: TimelinePeriodInput[];
  events: TimelineEventInput[];
}) {
  const router = useRouter();
  const [selectedPeriodSlug, setSelectedPeriodSlug] = useState<string | null>(null);

  const periodPoints: TimelinePoint[] = useMemo(
    () =>
      periods.map((p) => ({
        id: p.id,
        label: p.name,
        year: p.startYear,
        dateNote: p.timeLabel,
        colorKey: PERIOD_COLOR_KEY,
      })),
    [periods],
  );

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.slug === selectedPeriodSlug) || null,
    [periods, selectedPeriodSlug],
  );

  const eventPoints: TimelinePoint[] = useMemo(() => {
    if (!selectedPeriodSlug) return [];
    return events
      .filter((e) => e.periodSlug === selectedPeriodSlug)
      .map((e) => ({
        id: e.id,
        label: e.title,
        year: e.startYear,
        dateNote: e.eventDateNote,
        colorKey: e.category,
      }));
  }, [events, selectedPeriodSlug]);

  const eventLegendLabels = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of Object.keys(EVENT_CATEGORY_COLORS)) {
      result[key] = EVENT_CATEGORY_LABELS[key as EventCategory] || key;
    }
    return result;
  }, []);

  const eventSlugById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const e of events) map.set(e.id, e.slug);
    return map;
  }, [events]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 font-[Lora] text-base font-semibold text-[#6e181b]">
          Tổng quan — toàn bộ Giai đoạn lịch sử
        </h3>
        <InteractiveTimeline
          points={periodPoints}
          colorMap={PERIOD_COLOR_MAP}
          legendLabels={PERIOD_LEGEND_LABELS}
          defaultColor="#6e181b"
          showLegend={false}
          emptyMessage="Chưa có giai đoạn nào được xuất bản."
          onPointClick={(p) => {
            const period = periods.find((per) => per.id === p.id);
            if (period) setSelectedPeriodSlug(period.slug);
          }}
        />
        <p className="mt-2 text-[11px] text-[#776b61]">
          Kéo để di chuyển, cuộn chuột để phóng to/thu nhỏ — bấm vào 1 điểm để xem các sự kiện bên trong giai đoạn đó.
        </p>
      </div>

      {selectedPeriod && (
        <div className="border-t border-[#d7c5a1] pt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-[Lora] text-base font-semibold text-[#6e181b]">
              Chi tiết — {selectedPeriod.name} <span className="font-normal text-[#776b61]">({selectedPeriod.timeLabel})</span>
            </h3>
            <div className="flex items-center gap-2">
              <a
                href={`${PUBLIC_ROUTE_PREFIX.PERIOD}/${selectedPeriod.slug}`}
                className="text-xs font-semibold text-[#6e181b] hover:underline"
              >
                Xem trang giai đoạn →
              </a>
              <button
                type="button"
                onClick={() => setSelectedPeriodSlug(null)}
                className="rounded-full border border-[#d7c5a1] px-2.5 py-1 text-xs text-[#776b61] hover:bg-[#f2e9d8]"
              >
                ✕ Đóng
              </button>
            </div>
          </div>
          <InteractiveTimeline
            points={eventPoints}
            colorMap={EVENT_CATEGORY_COLORS}
            legendLabels={eventLegendLabels}
            emptyMessage="Giai đoạn này chưa có sự kiện nào được xuất bản."
            onPointClick={(p) => {
              const slug = eventSlugById.get(p.id);
              if (slug) router.push(`${PUBLIC_ROUTE_PREFIX.EVENT}/${slug}`);
            }}
          />
          <p className="mt-2 text-[11px] text-[#776b61]">Bấm vào 1 sự kiện để xem chi tiết.</p>
        </div>
      )}
    </div>
  );
}
