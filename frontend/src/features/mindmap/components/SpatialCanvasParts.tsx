'use client';

import React, { useMemo, useState } from 'react';
import {
  FolderTree,
  Globe,
  Layers,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  SPATIAL_LAYOUT,
  type SpatialCanvasNode,
} from '../services/concept-canvas.service';

export interface SpatialSeedSuggestion {
  id: string;
  label: string;
  subtitle?: string;
  articleSlug?: string;
}

export interface SpatialCategorySeedGroup {
  slug: string;
  name: string;
  items: readonly SpatialSeedSuggestion[];
}

enum SeedTab {
  TOPICS = 'TOPICS',
  CATEGORIES = 'CATEGORIES',
}

export function GoogleSearchToggle({
  enabled,
  onChange,
  compactOnMobile = false,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
  compactOnMobile?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      data-testid="google-search-toggle"
      onClick={() => onChange(!enabled)}
      title={
        enabled
          ? 'Đang bật mở rộng kiến thức từ Google Search (kết hợp tư liệu HISGO)'
          : 'Đang tắt Google Search (chỉ bám sát kho sử liệu nội bộ HISGO & Vertex RAG)'
      }
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-[#1A120B] font-bold shadow-[2px_2px_0px_#1A120B] transition ${
        compactOnMobile ? 'px-2 py-1 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs' : 'gap-2 px-3 py-1.5 text-xs'
      } ${
        enabled
          ? 'bg-[#FEF3C7] text-[#1A120B]'
          : 'bg-[#FFFDF8] text-[#5C4632] hover:bg-[#FAF3E0]'
      }`}
    >
      <Globe size={13} className={enabled ? 'text-[#1D4ED8]' : 'text-[#8a6828]'} />
      <span>{compactOnMobile ? 'Google' : 'Google Search'}</span>
      <span
        className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
          enabled ? 'bg-[#1A120B] text-[#FDE68A]' : 'bg-[#E6D8BE] text-[#4A3520]'
        }`}
      >
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

export function SpatialConnectingLines({
  nodes,
}: {
  nodes: readonly SpatialCanvasNode[];
}) {
  const paths = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges: Array<{ id: string; d: string }> = [];

    for (const child of nodes) {
      if (!child.parentId) continue;
      const parent = byId.get(child.parentId);
      if (!parent) continue;

      const startX = parent.x + SPATIAL_LAYOUT.CARD_WIDTH;
      const startY = parent.y + SPATIAL_LAYOUT.CARD_CENTER_Y_OFFSET;
      const endX = child.x;
      const endY = child.y + SPATIAL_LAYOUT.CARD_CENTER_Y_OFFSET;
      const cpX = startX + (endX - startX) * 0.5;
      const d = `M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`;
      edges.push({ id: `${parent.id}->${child.id}`, d });
    }
    return edges;
  }, [nodes]);

  if (paths.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      width={1}
      height={1}
    >
      {paths.map((edge) => (
        <path
          key={edge.id}
          d={edge.d}
          fill="none"
          stroke="#1A120B"
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

interface MinimapBounds {
  minX: number;
  minY: number;
  scale: number;
}

function computeMinimapBounds(nodes: readonly SpatialCanvasNode[]): MinimapBounds {
  const padding = 320;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x - padding);
    minY = Math.min(minY, node.y - padding);
    maxX = Math.max(
      maxX,
      node.x + SPATIAL_LAYOUT.CARD_WIDTH + SPATIAL_LAYOUT.PROMPT_CLUSTER_WIDTH + padding,
    );
    maxY = Math.max(maxY, node.y + 420 + padding);
  }

  const spanX = Math.max(1200, maxX - minX);
  const spanY = Math.max(900, maxY - minY);
  const scale = Math.min(
    SPATIAL_LAYOUT.MINIMAP_WIDTH / spanX,
    SPATIAL_LAYOUT.MINIMAP_HEIGHT / spanY,
  );
  return { minX, minY, scale };
}

export function SpatialMinimap({
  nodes,
  pan,
  zoom,
  viewportWidth,
  viewportHeight,
  onJumpTo,
}: {
  nodes: readonly SpatialCanvasNode[];
  pan: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  onJumpTo: (worldX: number, worldY: number) => void;
}) {
  const bounds = useMemo(() => computeMinimapBounds(nodes), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  if (nodes.length === 0) return null;

  const viewWorldX = -pan.x / zoom;
  const viewWorldY = -pan.y / zoom;
  const viewWorldW = viewportWidth / zoom;
  const viewWorldH = viewportHeight / zoom;

  const rectX = (viewWorldX - bounds.minX) * bounds.scale;
  const rectY = (viewWorldY - bounds.minY) * bounds.scale;
  const rectW = Math.max(18, viewWorldW * bounds.scale);
  const rectH = Math.max(14, viewWorldH * bounds.scale);

  return (
    <div
      data-testid="spatial-minimap"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - box.left;
        const clickY = e.clientY - box.top;
        const worldX = clickX / bounds.scale + bounds.minX;
        const worldY = clickY / bounds.scale + bounds.minY;
        onJumpTo(worldX, worldY);
      }}
      style={{
        width: `${SPATIAL_LAYOUT.MINIMAP_WIDTH}px`,
      }}
      title="Bấm để di chuyển nhanh trên bản đồ không gian"
      className="fixed bottom-5 left-16 z-30 hidden cursor-pointer overflow-hidden rounded-lg border-2 border-[#1A120B] bg-[#FFFBEA] shadow-[4px_4px_0px_#1A120B] md:block"
    >
      <div className="pointer-events-none border-b border-[#1A120B]/20 bg-[#FAF3E0] px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-[#1A120B] uppercase">
        Minimap · {nodes.length} nodes
      </div>
      <svg
        width={SPATIAL_LAYOUT.MINIMAP_WIDTH}
        height={SPATIAL_LAYOUT.MINIMAP_HEIGHT}
        className="block"
      >
        {nodes.map((child) => {
          if (!child.parentId) return null;
          const parent = byId.get(child.parentId);
          if (!parent) return null;
          const x1 = (parent.x + SPATIAL_LAYOUT.CARD_WIDTH - bounds.minX) * bounds.scale;
          const y1 = (parent.y + 160 - bounds.minY) * bounds.scale;
          const x2 = (child.x - bounds.minX) * bounds.scale;
          const y2 = (child.y + 160 - bounds.minY) * bounds.scale;
          return (
            <line
              key={`mm-e-${child.id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#1A120B"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          );
        })}
        {nodes.map((node) => {
          const nx = (node.x - bounds.minX) * bounds.scale;
          const ny = (node.y - bounds.minY) * bounds.scale;
          const nw = Math.max(8, SPATIAL_LAYOUT.CARD_WIDTH * bounds.scale);
          const nh = Math.max(6, 260 * bounds.scale);
          return (
            <rect
              key={node.id}
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx={1.5}
              fill={node.parentId ? '#8a6828' : '#7A1F24'}
              stroke="#1A120B"
              strokeWidth={0.8}
            />
          );
        })}
        <rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          fill="rgba(26, 18, 11, 0.08)"
          stroke="#1A120B"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

export function SpatialDiscoveryHero({
  topicSeeds,
  categoryGroups,
  useGoogleSearch,
  onToggleGoogleSearch,
  onStartExplore,
}: {
  topicSeeds: readonly SpatialSeedSuggestion[];
  categoryGroups: readonly SpatialCategorySeedGroup[];
  useGoogleSearch: boolean;
  onToggleGoogleSearch: (next: boolean) => void;
  onStartExplore: (prompt: string, articleSlug?: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [activeTab, setActiveTab] = useState<SeedTab>(() =>
    topicSeeds.length > 0 ? SeedTab.TOPICS : SeedTab.CATEGORIES,
  );
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    () => categoryGroups[0]?.slug ?? '',
  );

  const activeCategory =
    categoryGroups.find((g) => g.slug === selectedCategorySlug) ??
    categoryGroups[0];
  const visibleSeeds =
    activeTab === SeedTab.TOPICS ? topicSeeds : (activeCategory?.items ?? []);

  const allPool = useMemo(
    () => [...topicSeeds, ...categoryGroups.flatMap((g) => g.items)],
    [categoryGroups, topicSeeds],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length >= 2) {
      onStartExplore(trimmed);
    }
  };

  const handleRandomPick = () => {
    if (allPool.length === 0) return;
    const picked = allPool[Math.floor(Math.random() * allPool.length)];
    onStartExplore(picked.label, picked.articleSlug);
  };

  return (
    <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 pb-12 text-center">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A120B] md:text-5xl">
        Khám phá Không gian Lịch sử
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-7 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-[#D4AE67]/40 bg-[#FFFDF8]/95 p-2 shadow-lg backdrop-blur-xs sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <Search size={19} className="ml-1.5 shrink-0 text-[#7A6B57]" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập chủ đề, thời kỳ, sự kiện hoặc nhân vật..."
            aria-label="Nhập khái niệm lịch sử cần khám phá"
            className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm font-medium text-[#1A120B] placeholder-[#8C775E] focus:outline-hidden sm:py-2.5 sm:text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            aria-label="Khám phá"
            disabled={draft.trim().length < 2}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#5E161A] px-5 text-xs font-bold text-[#FAF5E6] shadow-xs transition hover:brightness-110 disabled:opacity-40 sm:h-11 sm:flex-initial"
          >
            <Play size={14} fill="currentColor" /> Khám phá
          </button>
          {allPool.length > 0 && (
            <button
              type="button"
              onClick={handleRandomPick}
              title="Khám phá ngẫu nhiên"
              aria-label="Khám phá ngẫu nhiên"
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#D4AE67]/50 bg-[#FEF3C7] text-[#92400E] shadow-2xs transition hover:bg-[#FDE68A] sm:h-11 sm:w-11"
            >
              <Sparkles size={17} />
            </button>
          )}
        </div>
      </form>

      <div className="mt-5 flex w-full max-w-2xl flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-[#E2D5B8] bg-white/90 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab(SeedTab.TOPICS)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === SeedTab.TOPICS
                ? 'bg-[#7A1F24] text-[#FAF5E6] shadow-xs'
                : 'text-[#4A3520] hover:bg-[#FAF3E0]'
            }`}
          >
            <Layers size={13} /> Chủ đề
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(SeedTab.CATEGORIES)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === SeedTab.CATEGORIES
                ? 'bg-[#7A1F24] text-[#FAF5E6] shadow-xs'
                : 'text-[#4A3520] hover:bg-[#FAF3E0]'
            }`}
          >
            <FolderTree size={13} /> Chuyên mục
          </button>
        </div>

        <GoogleSearchToggle
          enabled={useGoogleSearch}
          onChange={onToggleGoogleSearch}
        />
      </div>

      {activeTab === SeedTab.CATEGORIES && categoryGroups.length > 0 && (
        <div className="mt-3 flex w-full max-w-2xl flex-wrap items-center gap-1.5">
          {categoryGroups.map((group) => {
            const isSelected = group.slug === activeCategory?.slug;
            return (
              <button
                key={group.slug}
                type="button"
                onClick={() => setSelectedCategorySlug(group.slug)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                  isSelected
                    ? 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6] shadow-xs'
                    : 'border-[#E2D5B8] bg-white/90 text-[#1A120B] hover:bg-[#F5EEDC]'
                }`}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      )}

      {visibleSeeds.length > 0 && (
        <div className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {visibleSeeds.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`spatial-seed-${item.id}`}
              onClick={() => onStartExplore(item.label, item.articleSlug)}
              className="group flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#E2D5B8] bg-white/90 p-3.5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#D4AE67] hover:bg-[#FFFDF8] hover:shadow-md"
            >
              {activeTab === SeedTab.TOPICS ? (
                <Layers size={15} className="mt-0.5 shrink-0 text-[#7A1F24]" />
              ) : (
                <FolderTree size={15} className="mt-0.5 shrink-0 text-[#8a6828]" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[#1A120B] group-hover:text-[#7A1F24] transition-colors">
                  {item.label}
                </div>
                {item.subtitle && (
                  <div className="mt-0.5 truncate text-xs text-[#5C4632]">
                    {item.subtitle}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export {
  SpatialCanvasToolbar,
  type SpatialCanvasToolbarProps,
} from './SpatialCanvasToolbar';
