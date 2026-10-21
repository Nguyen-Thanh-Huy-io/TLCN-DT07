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

function formatYear(year: number): string {
  const rounded = Math.round(year);
  return rounded < 0 ? `${Math.abs(rounded)} TCN` : `${rounded}`;
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
  height = 220,
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
  const margin = { top: 20, right: 24, bottom: 34, left: 24 };
  const innerWidth = Math.max(100, width - margin.left - margin.right);
  const baseline = height - margin.top - margin.bottom;

  const sorted = useMemo(
    () => [...points].filter((p) => typeof p.year === "number").sort((a, b) => a.year - b.year),
    [points],
  );

  const domainMin = useMemo(() => Math.min(...sorted.map((p) => p.year), 0), [sorted]);
  const domainMax = useMemo(() => Math.max(...sorted.map((p) => p.year), 1), [sorted]);
  const domainPad = Math.max(10, (domainMax - domainMin) * 0.05);
  const fullMin = domainMin - domainPad;
  const fullMax = domainMax + domainPad;

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

  const dragState = useRef<{ startX: number; startViewMin: number; startViewMax: number; moved: boolean } | null>(null);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - margin.left;
    const cursorYear = yearFromX(cursorX);
    const zoomFactor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    let newSpan = span * zoomFactor;
    const fullSpan = fullMax - fullMin;
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
    return <p className="text-sm text-[#776b61]">{emptyMessage}</p>;
  }

  return (
    <div>
      {legendEntries.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#504640]">
          {legendEntries.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative w-full select-none overflow-hidden rounded-lg border border-[#d7c5a1] bg-white/60">
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
            <line x1={0} x2={innerWidth} y1={baseline} y2={baseline} stroke="#d7c5a1" strokeWidth={1.5} />

            {ticks.map((t) => {
              const x = xScale(t);
              if (x < -20 || x > innerWidth + 20) return null;
              return (
                <g key={t}>
                  <line x1={x} x2={x} y1={baseline} y2={baseline + 5} stroke="#d7c5a1" />
                  <text x={x} y={baseline + 18} fontSize={11} fill="#504640" textAnchor="middle">
                    {formatYear(t)}
                  </text>
                </g>
              );
            })}

            <g clipPath="inset(0 0 -20px 0)">
              {sorted.map((p) => {
                const x = xScale(p.year);
                if (x < -10 || x > innerWidth + 10) return null;
                return (
                  <circle
                    key={p.id}
                    cx={x}
                    cy={baseline}
                    r={6}
                    fill={colorMap[p.colorKey] || defaultColor}
                    stroke="#fffdf8"
                    strokeWidth={1.5}
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
                  />
                );
              })}
            </g>
          </g>
        </svg>

        {hovered && hoverPos && (
          <div
            className="pointer-events-none absolute z-20 max-w-[240px] rounded-lg border border-[#d7c5a1] bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: hoverPos.x + 14, top: hoverPos.y - 10 }}
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
