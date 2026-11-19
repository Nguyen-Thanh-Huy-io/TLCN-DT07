'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  GitBranch,
  Grid,
  LayoutGrid,
  Loader2,
  Maximize2,
  Plus,
  Printer,
  StickyNote,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import {
  BRANCH_COLOR_STYLES,
  CANVAS_THEME_CONFIG,
  MINDMAP_CANVAS,
  MindmapArrangeMode,
  MindmapBranchColor,
  MindmapCanvasTheme,
  MindmapEdgeStyle,
  MindmapNodeShape,
  NODE_SHAPE_CLASS,
} from '../constants/mindmap.constants';
import {
  MindmapApiService,
  type MindmapDetail,
  type MindmapEdge,
  type MindmapGraph,
  type MindmapNode,
} from '../services/mindmap.service';
import {
  autoArrangeGraph,
  computeFitViewport,
  edgePathBetween,
  nodeWidthOf,
} from '../utils/mindmap-layout.util';
import { MindmapNodeInspector, nodeArticlesOf } from './MindmapNodeInspector';

const nextId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 7)}${Date.now().toString(36).slice(-3)}`;

enum SaveState {
  SAVED = 'SAVED',
  SAVING = 'SAVING',
  ERROR = 'ERROR',
}

enum DragKind {
  NODE = 'NODE',
  PAN = 'PAN',
}

/** Canvas Sơ đồ tư duy tương tác tự do (hình ảnh, ghi chú dán, nhiều tư liệu, xoá nhanh, tự căn giữa). */
export function MindmapCanvas({
  initialMindmap,
  onBack,
}: {
  initialMindmap: MindmapDetail;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(initialMindmap.title);
  const [graph, setGraph] = useState<MindmapGraph>(initialMindmap.graph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialMindmap.graph.nodes[0]?.id ?? null,
  );
  const [linkFromId, setLinkFromId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>(SaveState.SAVED);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    type: DragKind;
    nodeId?: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const fitToViewport = useCallback((nodes: MindmapNode[]) => {
    const el = canvasRef.current;
    if (!el) return;
    const fitted = computeFitViewport(nodes, el.clientWidth, el.clientHeight);
    setPan(fitted.pan);
    setZoom(fitted.zoom);
  }, []);

  // Tự căn giữa toàn bộ sơ đồ ngay khi mở Canvas để node gốc không bị lệch mép trái.
  useEffect(() => {
    const id = requestAnimationFrame(() => fitToViewport(initialMindmap.graph.nodes));
    return () => cancelAnimationFrame(id);
  }, [fitToViewport, initialMindmap.graph.nodes]);

  const scheduleSave = useCallback(
    (nextTitle: string, nextGraph: MindmapGraph) => {
      setSaveState(SaveState.SAVING);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void MindmapApiService.update(initialMindmap.id, {
          title: nextTitle.trim() || initialMindmap.title,
          graph: nextGraph,
        })
          .then(() => setSaveState(SaveState.SAVED))
          .catch(() => setSaveState(SaveState.ERROR));
      }, MINDMAP_CANVAS.AUTOSAVE_DELAY_MS);
    },
    [initialMindmap.id, initialMindmap.title],
  );

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const commitGraph = useCallback(
    (updater: (prev: MindmapGraph) => MindmapGraph) => {
      setGraph((prev) => {
        const next = updater(prev);
        scheduleSave(title, next);
        return next;
      });
    },
    [scheduleSave, title],
  );

  const addNode = (parentId?: string, sticky = false) => {
    const parent = parentId ? graph.nodes.find((n) => n.id === parentId) : null;
    const siblingCount = parentId
      ? graph.edges.filter((e) => e.fromId === parentId).length
      : graph.nodes.length;
    const newId = nextId('n');
    const newNode: MindmapNode = {
      id: newId,
      x: parent && !sticky ? parent.x + 290 : 120 + (siblingCount % 4) * 70,
      y: parent && !sticky ? parent.y + (siblingCount - 1) * 120 : 100 + (siblingCount % 4) * 60,
      title: sticky ? 'Ghi chú nhanh' : 'Ý mới',
      ...(sticky
        ? {
            badge: 'Ghi chú',
            note: 'Nhấp đúp hoặc sửa ở bảng bên phải…',
            isStickyNote: true,
            color: MindmapBranchColor.GOLD,
          }
        : {
            color:
              parent?.color && parent.color !== MindmapBranchColor.CRIMSON
                ? parent.color
                : MindmapBranchColor.GOLD,
          }),
    };

    commitGraph((prev) => ({
      nodes: [...prev.nodes, newNode],
      edges:
        parent && !sticky
          ? [...prev.edges, { id: nextId('e'), fromId: parent.id, toId: newId }]
          : prev.edges,
    }));
    setSelectedNodeId(newId);
    setEditingNodeId(newId);
  };

  const updateNode = (nodeId: string, patch: Partial<MindmapNode>) => {
    commitGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    }));
  };

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (graph.nodes.length <= 1) return;
      commitGraph((prev) => ({
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter((e) => e.fromId !== nodeId && e.toId !== nodeId),
      }));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [commitGraph, graph.nodes.length, selectedNodeId],
  );

  const updateEdgeLabel = (edgeId: string, label: string) => {
    commitGraph((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, label } : e)),
    }));
  };

  const deleteEdge = (edgeId: string) => {
    commitGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
  };

  const handleNodeClick = (nodeId: string) => {
    if (linkFromId) {
      if (linkFromId !== nodeId) {
        const exists = graph.edges.some(
          (e) =>
            (e.fromId === linkFromId && e.toId === nodeId) ||
            (e.fromId === nodeId && e.toId === linkFromId),
        );
        if (!exists) {
          const newEdge: MindmapEdge = {
            id: nextId('e'),
            fromId: linkFromId,
            toId: nodeId,
          };
          commitGraph((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
        }
      }
      setLinkFromId(null);
      return;
    }
    setSelectedNodeId(nodeId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.type === DragKind.PAN) {
      setPan({ x: drag.origX + dx, y: drag.origY + dy });
    } else if (drag.type === DragKind.NODE && drag.nodeId) {
      const nextX = Math.round(drag.origX + dx / zoom);
      const nextY = Math.round(drag.origY + dy / zoom);
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === drag.nodeId ? { ...n, x: nextX, y: nextY } : n,
        ),
      }));
    }
  };

  const onPointerUp = () => {
    if (dragRef.current?.type === DragKind.NODE) {
      scheduleSave(title, graph);
    }
    dragRef.current = null;
  };

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const activeTheme = graph.theme ?? MindmapCanvasTheme.PAPER;
  const themeMeta = CANVAS_THEME_CONFIG[activeTheme];
  const activeEdgeStyle = graph.edgeStyle ?? MindmapEdgeStyle.BEZIER;

  const applyArrange = (mode: MindmapArrangeMode) => {
    const arranged = autoArrangeGraph(graph, mode);
    commitGraph(() => arranged);
    requestAnimationFrame(() => fitToViewport(arranged.nodes));
  };

  return (
    <div className="space-y-3">
      {/* Thanh công cụ Canvas nổi */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border,#E2D5B8)] bg-white px-3.5 py-2.5 shadow-xs">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/60 px-2.5 py-1.5 text-xs font-bold text-stone-800 hover:border-[var(--gold,#B8893F)] cursor-pointer"
          >
            <ArrowLeft size={14} /> Danh sách
          </button>
          <input
            aria-label="Tên sơ đồ tư duy"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleSave(e.target.value, graph);
            }}
            maxLength={150}
            className="min-w-[140px] bg-transparent font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)] outline-none focus:underline"
          />
          <span className="inline-flex items-center gap-1 rounded border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/50 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
            {saveState === SaveState.SAVING ? (
              <>
                <Loader2 size={11} className="animate-spin" /> Đang lưu…
              </>
            ) : saveState === SaveState.ERROR ? (
              <span className="text-rose-700">Lỗi lưu</span>
            ) : (
              <>
                <Check size={11} className="text-teal-700" /> Đã lưu
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => addNode(selectedNodeId ?? undefined, false)}
            className="inline-flex items-center gap-1 rounded-xl bg-[#7A1F24] px-3 py-1.5 font-bold text-white hover:brightness-110 cursor-pointer"
          >
            <Plus size={13} /> Thêm Node
          </button>

          <button
            type="button"
            onClick={() => addNode(undefined, true)}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--gold,#B8893F)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 font-bold text-[#7A1F24] hover:bg-[#EFE4CC] cursor-pointer"
            title="Thêm ghi chú dán tự do lên canvas"
          >
            <StickyNote size={13} /> Thêm Ghi chú
          </button>

          <button
            type="button"
            onClick={() => setLinkFromId(linkFromId ? null : selectedNodeId ?? graph.nodes[0]?.id ?? null)}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 font-bold cursor-pointer ${
              linkFromId
                ? 'border-[var(--primary,#7A1F24)] bg-amber-50 text-[var(--primary,#7A1F24)]'
                : 'border-[var(--border,#E2D5B8)] bg-white text-stone-800 hover:border-[var(--gold,#B8893F)]'
            }`}
          >
            <GitBranch size={13} /> {linkFromId ? 'Chọn node đích…' : 'Nối dây'}
          </button>

          <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-2 py-1">
            <LayoutGrid size={12} className="text-[var(--gold,#B8893F)]" />
            <select
              aria-label="Kiểu sắp xếp"
              value=""
              onChange={(e) => {
                if (e.target.value) applyArrange(e.target.value as MindmapArrangeMode);
              }}
              className="bg-transparent text-xs font-semibold text-stone-700 outline-none cursor-pointer"
            >
              <option value="">Tự xếp…</option>
              <option value={MindmapArrangeMode.TREE}>Sơ đồ Cây</option>
              <option value={MindmapArrangeMode.TWO_SIDED}>2 phía (XMind)</option>
              <option value={MindmapArrangeMode.FISHBONE}>Xương cá</option>
            </select>
          </div>

          <select
            aria-label="Kiểu đường nối"
            value={activeEdgeStyle}
            onChange={(e) =>
              commitGraph((prev) => ({
                ...prev,
                edgeStyle: e.target.value as MindmapEdgeStyle,
              }))
            }
            className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 outline-none cursor-pointer"
          >
            <option value={MindmapEdgeStyle.BEZIER}>Dây cong</option>
            <option value={MindmapEdgeStyle.STEP}>Dây vuông</option>
            <option value={MindmapEdgeStyle.STRAIGHT}>Dây thẳng</option>
          </select>

          <select
            aria-label="Màu nền canvas"
            value={activeTheme}
            onChange={(e) =>
              commitGraph((prev) => ({
                ...prev,
                theme: e.target.value as MindmapCanvasTheme,
              }))
            }
            className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 outline-none cursor-pointer"
          >
            <option value={MindmapCanvasTheme.PAPER}>Nền giấy dó</option>
            <option value={MindmapCanvasTheme.WHITE}>Nền trắng</option>
            <option value={MindmapCanvasTheme.DARK}>Bảng tối</option>
          </select>

          <button
            type="button"
            onClick={() => fitToViewport(graph.nodes)}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-2.5 py-1.5 font-semibold text-stone-700 hover:border-[var(--gold,#B8893F)] cursor-pointer"
            title="Căn giữa toàn bộ sơ đồ"
          >
            <Maximize2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            aria-pressed={showGrid}
            className={`rounded-xl border p-1.5 cursor-pointer ${
              showGrid ? 'border-[var(--gold,#B8893F)] bg-[var(--bg-page,#F5EEDC)]' : 'border-[var(--border,#E2D5B8)] bg-white'
            }`}
            title="Bật/tắt lưới chấm"
          >
            <Grid size={14} />
          </button>

          <div className="inline-flex items-center rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MINDMAP_CANVAS.MIN_ZOOM, Number((z - MINDMAP_CANVAS.ZOOM_STEP).toFixed(2))))}
              aria-label="Thu nhỏ"
              className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <ZoomOut size={13} />
            </button>
            <span className="min-w-[40px] text-center font-mono text-[11px] font-bold text-stone-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MINDMAP_CANVAS.MAX_ZOOM, Number((z + MINDMAP_CANVAS.ZOOM_STEP).toFixed(2))))}
              aria-label="Phóng to"
              className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-2.5 py-1.5 font-semibold text-stone-700 hover:border-[var(--gold,#B8893F)] cursor-pointer"
            title="In / Xuất PDF"
          >
            <Printer size={13} />
          </button>
        </div>
      </div>

      {/* Vùng Canvas + Inspector bên phải */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          ref={canvasRef}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return;
            dragRef.current = {
              type: DragKind.PAN,
              startX: e.clientX,
              startY: e.clientY,
              origX: pan.x,
              origY: pan.y,
            };
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className={`relative h-[580px] flex-1 overflow-hidden rounded-2xl border border-[var(--border,#E2D5B8)] select-none cursor-grab active:cursor-grabbing ${themeMeta.bgClass}`}
          style={
            showGrid
              ? {
                  backgroundImage: `radial-gradient(${themeMeta.gridColor} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }
              : undefined
          }
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            className="relative h-full w-full pointer-events-none"
          >
            {/* Đường nối SVG Bezier */}
            <svg className="pointer-events-none absolute inset-0 h-[2400px] w-[2400px] overflow-visible">
              {graph.edges.map((edge) => {
                const from = nodeMap.get(edge.fromId);
                const to = nodeMap.get(edge.toId);
                if (!from || !to) return null;
                const { d, midX, midY } = edgePathBetween(from, to, activeEdgeStyle);
                const stroke = BRANCH_COLOR_STYLES[to.color]?.stroke ?? '#B8893F';
                return (
                  <g key={edge.id} className="pointer-events-auto">
                    <path
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={2.2}
                      strokeOpacity={0.7}
                    />
                    <circle
                      cx={midX}
                      cy={midY}
                      r={10}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => deleteEdge(edge.id)}
                    >
                      <title>Bấm để ngắt đường nối</title>
                    </circle>
                    {edge.label && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-38}
                          y={-11}
                          width={76}
                          height={22}
                          rx={6}
                          fill="#FFFCF5"
                          stroke="#E2D5B8"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={10}
                          fontWeight={600}
                          fill="#5C2A1E"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Các Node */}
            {graph.nodes.map((node) => {
              const style = BRANCH_COLOR_STYLES[node.color] ?? BRANCH_COLOR_STYLES[MindmapBranchColor.STONE];
              const shape = node.shape ?? MindmapNodeShape.CARD;
              const shapeClass = NODE_SHAPE_CLASS[shape];
              const isPlainDark = shape === MindmapNodeShape.PLAIN && activeTheme === MindmapCanvasTheme.DARK;
              const isSelected = selectedNodeId === node.id;
              const isLinkSource = linkFromId === node.id;
              const articles = nodeArticlesOf(node);
              return (
                <div
                  key={node.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragRef.current = {
                      type: DragKind.NODE,
                      nodeId: node.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: node.x,
                      origY: node.y,
                    };
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingNodeId(node.id);
                  }}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: nodeWidthOf(node),
                    minHeight: shape === MindmapNodeShape.PILL ? 52 : MINDMAP_CANVAS.NODE_HEIGHT,
                  }}
                  className={`group pointer-events-auto absolute overflow-visible transition-shadow cursor-pointer ${shapeClass} ${style.card} ${
                    isPlainDark ? '!text-white' : ''
                  } ${isSelected ? 'ring-2 ring-[#B8893F] ring-offset-2' : ''} ${
                    isLinkSource ? 'ring-2 ring-amber-500 animate-pulse' : ''
                  }`}
                >
                  {/* Nút xoá nhanh trực tiếp trên node */}
                  {graph.nodes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      title="Xoá node này"
                      aria-label="Xoá node"
                      className="absolute -right-2 -top-2 z-10 grid size-5 place-items-center rounded-full border border-rose-200 bg-white text-rose-700 opacity-0 shadow-xs transition group-hover:opacity-100 hover:bg-rose-50 cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  )}

                  {node.imageUrl && (
                    <div className="overflow-hidden rounded-t-[10px] border-b border-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={node.imageUrl}
                        alt={node.title}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-3">
                    {node.badge && (
                      <span className={`mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                        {node.badge}
                      </span>
                    )}

                    {editingNodeId === node.id ? (
                      <input
                        autoFocus
                        value={node.title}
                        onChange={(e) => updateNode(node.id, { title: e.target.value })}
                        onBlur={() => setEditingNodeId(null)}
                        onKeyDown={(e) => {
                          if (e.key === KeyboardKey.ENTER || e.key === KeyboardKey.ESCAPE) {
                            setEditingNodeId(null);
                          }
                        }}
                        className="w-full rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-stone-900 outline-none"
                      />
                    ) : (
                      <div className="font-[family-name:var(--font-heading)] text-sm font-bold leading-snug">
                        {node.title}
                      </div>
                    )}

                    {node.note && (
                      <div className="mt-1 space-y-0.5 text-[11px] opacity-90 leading-snug">
                        {node.note
                          .split('\n')
                          .filter((line) => line.trim())
                          .slice(0, 4)
                          .map((line, i) => (
                            <p key={i} className="line-clamp-2">
                              {line}
                            </p>
                          ))}
                      </div>
                    )}

                    {articles.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {articles.map((art) => (
                          <Link
                            key={art.id}
                            href={PUBLIC_ROUTES.ARTICLE(art.slug)}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex max-w-full items-center gap-1 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold underline"
                          >
                            <ExternalLink size={9} className="shrink-0" />
                            <span className="truncate">{art.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNode(node.id, false);
                    }}
                    title="Thêm nhánh con"
                    aria-label="Thêm nhánh con"
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 grid size-5 place-items-center rounded-full border border-[#E2D5B8] bg-white text-[#7A1F24] shadow-xs hover:scale-110 cursor-pointer"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className={`pointer-events-none absolute bottom-3 left-3 rounded-lg border px-2.5 py-1 text-[11px] backdrop-blur-xs ${themeMeta.hintClass}`}>
            Kéo node để xếp vị trí · Double-click để sửa nhanh · Hover node để xoá nhanh · Kéo nền để di chuyển
          </div>
        </div>

        {selectedNode && (
          <MindmapNodeInspector
            node={selectedNode}
            edges={graph.edges}
            nodeMap={nodeMap}
            canDelete={graph.nodes.length > 1}
            onChange={(patch) => updateNode(selectedNode.id, patch)}
            onAddChild={() => addNode(selectedNode.id, false)}
            onDelete={() => deleteNode(selectedNode.id)}
            onUpdateEdge={updateEdgeLabel}
            onDeleteEdge={deleteEdge}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}
