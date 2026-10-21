"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface TimelinePoint {
  id: string;
  label: string;
  year: number;
  dateNote?: string | null;
  colorKey: string;
}

const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
const MIN_LABEL_GAP_PX = 92;

function formatYear(year: number): string {
  const rounded = Math.round(year);
  return rounded < 0 ? `${Math.abs(rounded)} TCN` : `${rounded}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function niceStep(rawStep: number): number {
  for (const step of NICE_STEPS) {
    if (rawStep <= step) return step;
  }
  return NICE_STEPS[NICE_STEPS.length - 1];
}

export function InteractiveTimeline({
  points,
  colorMap,
  legendLabels,
  defaultColor = "#8a6828",
  onPointClick,
  emptyMessage = "Chưa có dữ liệu để hiển thị.",
  height = 260,
  showLegend = true,
}: {
  points: TimelinePoint[];
  colorMap: Record<string, string>;
  legendLabels: Record<string, string>;
  defaultColor?: string;
  onPointClick?: (point: TimelinePoint) => void;
  emptyMessage?: string;
  height?: number;
  showLegend?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const margin = { top: 46, right: 24, bottom: 36, left: 24 };
  const innerWidth = Math.max(100, width - margin.left - margin.right);
  const baseline = height - margin.top - margin.bottom - 46;

  const sorted = useMemo(
    () => [...points].filter((p) => typeof p.year === "number").sort((a, b) => a.year - b.year),
    [points],
  );

  const domainMin = useMemo(() => Math.min(...sorted.map((p) => p.year), 0), [sorted]);
  const domainMax = useMemo(() => Math.max(...sorted.map((p) => p.year), 1), [sorted]);
  const domainPad = Math.max(10, (domainMax - domainMin) * 0.06);
  const fullMin = domainMin - domainPad;
  const fullMax = domainMax + domainPad;
  const fullSpan = fullMax - fullMin;

  const [viewMin, setViewMin] = useState(fullMin);
  const [viewMax, setViewMax] = useState(fullMax);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${sorted.length}:${domainMin}:${domainMax}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    if (sorted.length === 0) return;
    setViewMin(fullMin);
    setViewMax(fullMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted.length, domainMin, domainMax]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const span = Math.max(1, viewMax - viewMin);
  const xScale = useCallback((year: number) => ((year - viewMin) / span) * innerWidth, [viewMin, span, innerWidth]);
  const yearFromX = useCallback((px: number) => viewMin + (px / innerWidth) * span, [viewMin, span, innerWidth]);

  const zoomAt = useCallback(
    (cursorX: number, zoomFactor: number) => {
      const cursorYear = yearFromX(cursorX);
      let newSpan = span * zoomFactor;
      newSpan = Math.max(fullSpan / 400, Math.min(fullSpan * 1.5, newSpan));
      const ratio = cursorX / innerWidth;
      let newMin = cursorYear - ratio * newSpan;
      let newMax = newMin + newSpan;
      if (newMin < fullMin - fullSpan * 0.3) {
        newMin = fullMin - fullSpan * 0.3;
        newMax = newMin + newSpan;
      }
      if (newMax > fullMax + fullSpan * 0.3) {
        newMax = fullMax + fullSpan * 0.3;
        newMin = newMax - newSpan;
      }
      setViewMin(newMin);
      setViewMax(newMax);
    },
    [span, fullSpan, fullMin, fullMax, innerWidth, yearFromX],
  );

  const dragState = useRef<{ startX: number; startViewMin: number; startViewMax: number; moved: boolean } | null>(null);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - margin.left;
    zoomAt(cursorX, e.deltaY > 0 ? 1.15 : 1 / 1.15);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragState.current = { startX: e.clientX, startViewMin: viewMin, startViewMax: viewMax, moved: false };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    const deltaPx = e.clientX - dragState.current.startX;
    if (Math.abs(deltaPx) > 3) dragState.current.moved = true;
    const deltaYears = (deltaPx / innerWidth) * (dragState.current.startViewMax - dragState.current.startViewMin);
    setViewMin(dragState.current.startViewMin - deltaYears);
    setViewMax(dragState.current.startViewMax - deltaYears);
  };

  const stopDrag = () => {
    dragState.current = null;
  };

  const resetView = () => {
    setViewMin(fullMin);
    setViewMax(fullMax);
  };

  const ticks = useMemo(() => {
    const desiredCount = Math.max(3, Math.floor(innerWidth / 110));
    const rawStep = span / desiredCount;
    const step = niceStep(rawStep);
    const start = Math.ceil(viewMin / step) * step;
    const result: number[] = [];
    for (let y = start; y <= viewMax; y += step) {
      result.push(y);
    }
    return result;
  }, [viewMin, viewMax, span, innerWidth]);

  // Các điểm đang nằm trong khung nhìn, kèm toạ độ x + lane (trên/dưới trục,
  // xen kẽ khi 2 điểm quá gần nhau) để tên sự kiện hiện sẵn, không cần hover.
  const visiblePoints = useMemo(() => {
    const withX = sorted
      .map((p) => ({ ...p, x: xScale(p.year) }))
      .filter((p) => p.x >= -40 && p.x <= innerWidth + 40);

    let lastAboveX = -Infinity;
    let lastBelowX = -Infinity;
    let toggleUp = true;
    return withX.map((p) => {
      let lane: "above" | "below";
      if (p.x - lastAboveX >= MIN_LABEL_GAP_PX && p.x - lastBelowX >= MIN_LABEL_GAP_PX) {
        lane = toggleUp ? "above" : "below";
        toggleUp = !toggleUp;
      } else if (p.x - lastAboveX >= MIN_LABEL_GAP_PX) {
        lane = "above";
      } else if (p.x - lastBelowX >= MIN_LABEL_GAP_PX) {
        lane = "below";
      } else {
        lane = p.x - lastAboveX > p.x - lastBelowX ? "above" : "below";
      }
      if (lane === "above") lastAboveX = p.x;
      else lastBelowX = p.x;
      return { ...p, lane };
    });
  }, [sorted, xScale, innerWidth]);

  const [hovered, setHovered] = useState<TimelinePoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const legendEntries = useMemo(() => {
    if (!showLegend) return [];
    const present = new Set(sorted.map((p) => p.colorKey));
    return Array.from(present).map((key) => ({
      key,
      label: legendLabels[key] || key,
      color: colorMap[key] || defaultColor,
    }));
  }, [sorted, colorMap, legendLabels, defaultColor, showLegend]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d7c5a1] bg-[#faf6ec] p-6 text-center text-sm text-[#776b61]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      {legendEntries.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-[#504640]">
          {legendEntries.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden rounded-2xl border border-[#d7c5a1] bg-[linear-gradient(180deg,#fffdf8_0%,#f7efdd_100%)] shadow-[0_8px_24px_rgba(110,24,27,0.08)]"
      >
        {/* Nút zoom */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-[#d7c5a1] bg-white/90 p-1 shadow-sm">
          <button
            type="button"
            aria-label="Thu nhỏ"
            onClick={() => zoomAt(innerWidth / 2, 1.4)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6e181b] hover:bg-[#f2e9d8]"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Phóng to"
            onClick={() => zoomAt(innerWidth / 2, 1 / 1.4)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6e181b] hover:bg-[#f2e9d8]"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Đặt lại"
            onClick={resetView}
            className="flex h-7 items-center justify-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide text-[#6e181b] hover:bg-[#f2e9d8]"
          >
            Reset
          </button>
        </div>

        <svg
          width={width}
          height={height}
          className="block cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            <line x1={0} x2={innerWidth} y1={baseline} y2={baseline} stroke="#d7c5a1" strokeWidth={2} strokeLinecap="round" />

            {ticks.map((t) => {
              const x = xScale(t);
              if (x < -20 || x > innerWidth + 20) return null;
              return (
                <g key={t}>
                  <line x1={x} x2={x} y1={baseline} y2={baseline + 6} stroke="#d7c5a1" />
                  <text x={x} y={baseline + 20} fontSize={11} fontWeight={600} fill="#8a6828" textAnchor="middle">
                    {formatYear(t)}
                  </text>
                </g>
              );
            })}

            {visiblePoints.map((p) => {
              const color = colorMap[p.colorKey] || defaultColor;
              const labelY = p.lane === "above" ? -14 : 30;
              const stemY2 = p.lane === "above" ? -6 : baseline + 6;
              return (
                <g
                  key={p.id}
                  style={{ cursor: onPointClick ? "pointer" : "default" }}
                  onMouseEnter={(e) => {
                    setHovered(p);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (dragState.current?.moved) return;
                    onPointClick?.(p);
                  }}
                >
                  <line
                    x1={p.x}
                    x2={p.x}
                    y1={baseline}
                    y2={p.lane === "above" ? baseline - 20 : baseline + 20}
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={0.45}
                  />
                  <circle cx={p.x} cy={baseline} r={6.5} fill={color} stroke="#fffdf8" strokeWidth={2} />
                  <text
                    x={p.x}
                    y={p.lane === "above" ? baseline - 26 : baseline + 42}
                    fontSize={11}
                    fontWeight={600}
                    fill="#302622"
                    textAnchor="middle"
                  >
                    {truncate(p.label, 22)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hovered && hoverPos && (
          <div
            className="pointer-events-none absolute z-20 max-w-[260px] rounded-lg border border-[#d7c5a1] bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: Math.min(hoverPos.x + 14, width - 260), top: Math.max(hoverPos.y - 10, 4) }}
          >
            <div className="font-semibold text-[#302622]">{hovered.label}</div>
            <div className="mt-0.5 text-[#776b61]">
              {hovered.dateNote || formatYear(hovered.year)}
              {legendLabels[hovered.colorKey] ? ` · ${legendLabels[hovered.colorKey]}` : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
