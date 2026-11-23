'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MINDMAP_CANVAS,
  MindmapBorderStyle,
  MindmapBranchColor,
  MindmapEdgeStyle,
  MindmapInspectorTab,
  MindmapShortcutKey,
  MindmapStructure,
  MindmapToolMode,
  ReaderSourceKind,
} from '../constants/mindmap.constants';
import { useMeasuredNodeSizes } from '../hooks/use-measured-node-sizes';
import { useMindmapHistory } from '../hooks/use-mindmap-history';
import {
  MindmapApiService,
  type MindmapArticleRef,
  type MindmapDetail,
  type MindmapEdge,
  type MindmapGraph,
  type MindmapNode,
} from '../services/mindmap.service';
import {
  computeFitViewportFromPlacements,
  computeMindmapLayout,
} from '../utils/mindmap-layout.strategy';
import {
  addChildNodeToGraph,
  addSiblingNodeToGraph,
  buildMindmapTree,
  deleteSubtreeFromGraph,
  nextMindmapId,
  reparentNodeInGraph,
  resolveEffectiveStructure,
  resolveEffectiveTheme,
  resolveNodePalette,
} from '../utils/mindmap-tree.util';
import { MindmapLeftToolbar } from './MindmapLeftToolbar';
import { AiMindmapPromptModal } from './AiMindmapPromptModal';
import { MindmapNodeCard, nodeArticlesOf } from './MindmapNodeCard';
import {
  MindmapReferenceDrawer,
  type RequestedReaderSource,
} from './MindmapReferenceDrawer';
import { MindmapStyleSidebar } from './MindmapStyleSidebar';
import { MindmapSaveState, MindmapTopBar } from './MindmapTopBar';
import { ShareMindmapCommunityModal } from './ShareMindmapCommunityModal';

enum DragMode {
  PAN = 'PAN',
  FREE_NODE = 'FREE_NODE',
  REPARENT_NODE = 'REPARENT_NODE',
}

interface DragState {
  mode: DragMode;
  nodeId?: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function edgeStrokeDasharray(isCrossLink?: boolean, strokeStyle?: MindmapBorderStyle): string | undefined {
  if (isCrossLink || strokeStyle === MindmapBorderStyle.DASHED) return '6 4';
  if (strokeStyle === MindmapBorderStyle.DOTTED) return '2 4';
  return undefined;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

function collectUniqueAttachedArticles(nodes: MindmapNode[]): MindmapArticleRef[] {
  const seen = new Map<string, MindmapArticleRef>();
  for (const node of nodes) {
    for (const art of nodeArticlesOf(node)) {
      if (!seen.has(art.id)) seen.set(art.id, art);
    }
  }
  return Array.from(seen.values());
}

/** Mindmap Studio toàn màn hình (theo chuẩn MindMeister / XMind). */
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
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [linkFromId, setLinkFromId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<MindmapSaveState>(MindmapSaveState.SAVED);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [readerOpen, setReaderOpen] = useState(false);
  const [requestedReaderSource, setRequestedReaderSource] = useState<RequestedReaderSource | null>(null);
  const [activeTab, setActiveTab] = useState<MindmapInspectorTab>(MindmapInspectorTab.STYLE);
  const [toolMode, setToolMode] = useState<MindmapToolMode>(MindmapToolMode.POINTER);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 480, y: 260 });

  const studioRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const initialFitDoneRef = useRef(false);

  const history = useMindmapHistory();
  const structure = resolveEffectiveStructure(graph);
  const theme = resolveEffectiveTheme(graph);
  const balancedBranches = graph.balancedBranches ?? true;
  const edgeStyle = graph.edgeStyle ?? MindmapEdgeStyle.AUTO;
  const showGrid = graph.showGrid ?? false;
  const canvasBg = graph.customBgColor || theme.canvasBg;

  const tree = useMemo(() => buildMindmapTree(graph), [graph]);
  const nodeSignature = useMemo(
    () =>
      graph.nodes
        .map(
          (n) =>
            `${n.id}:${n.title.length}:${n.style?.fontSize ?? 13}:${Boolean(n.style?.bold)}:${(n.tags ?? []).length}:${Boolean(n.imageUrl)}:${Boolean(n.collapsed)}`,
        )
        .join('|'),
    [graph.nodes],
  );
  const { sizes, registerNodeRef } = useMeasuredNodeSizes(nodeSignature);

  const layout = useMemo(
    () =>
      computeMindmapLayout({
        graph,
        tree,
        sizes,
        structure,
        balancedBranches,
        edgeStyle,
      }),
    [balancedBranches, edgeStyle, graph, sizes, structure, tree],
  );

  const scheduleSave = useCallback(
    (nextTitle: string, nextGraph: MindmapGraph) => {
      setSaveState(MindmapSaveState.SAVING);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void MindmapApiService.update(initialMindmap.id, {
          title: nextTitle.trim() || initialMindmap.title,
          graph: nextGraph,
        })
          .then(() => setSaveState(MindmapSaveState.SAVED))
          .catch(() => setSaveState(MindmapSaveState.ERROR));
      }, MINDMAP_CANVAS.AUTOSAVE_DELAY_MS);
    },
    [initialMindmap.id, initialMindmap.title],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const flushSaveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveState(MindmapSaveState.SAVING);
    try {
      await MindmapApiService.update(initialMindmap.id, {
        title: title.trim() || initialMindmap.title,
        graph,
      });
      setSaveState(MindmapSaveState.SAVED);
    } catch (err) {
      setSaveState(MindmapSaveState.ERROR);
      throw err;
    }
  }, [graph, initialMindmap.id, initialMindmap.title, title]);

  const commitGraph = useCallback(
    (updater: (prev: MindmapGraph) => MindmapGraph, recordUndo = true) => {
      setGraph((prev) => {
        if (recordUndo) history.recordSnapshot(prev);
        const next = updater(prev);
        scheduleSave(title, next);
        return next;
      });
    },
    [history, scheduleSave, title],
  );

  const fitView = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const fitted = computeFitViewportFromPlacements(
      layout.placements.values(),
      el.clientWidth,
      el.clientHeight,
    );
    setPan(fitted.pan);
    setZoom(fitted.zoom);
  }, [layout.placements]);

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const el = canvasRef.current;
      const p = layout.placements.get(nodeId);
      if (!el || !p) return;
      setPan({
        x: Math.round(el.clientWidth / 2 - (p.x + p.width / 2) * zoom),
        y: Math.round(el.clientHeight / 2 - (p.y + p.height / 2) * zoom),
      });
    },
    [layout.placements, zoom],
  );

  useEffect(() => {
    if (initialFitDoneRef.current) return;
    if (layout.placements.size === 0) return;
    const raf = requestAnimationFrame(() => {
      fitView();
      initialFitDoneRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, [fitView, layout.placements.size]);

  const insertBranchNode = useCallback(
    (
      targetId: string | undefined,
      mutate: (prev: MindmapGraph, id: string, title: string) => { graph: MindmapGraph; newId: string },
    ) => {
      const resolvedId = targetId ?? selectedNodeId ?? tree.rootId;
      if (!resolvedId) return;
      let createdId = '';
      commitGraph((prev) => {
        const res = mutate(prev, resolvedId, 'Ý tưởng mới');
        createdId = res.newId;
        return res.graph;
      });
      if (createdId) {
        setSelectedNodeId(createdId);
        setEditingNodeId(createdId);
      }
    },
    [commitGraph, selectedNodeId, tree.rootId],
  );

  const handleAddChild = useCallback(
    (parentId?: string) => insertBranchNode(parentId, addChildNodeToGraph),
    [insertBranchNode],
  );

  const handleAddSibling = useCallback(
    (referenceId?: string) => insertBranchNode(referenceId, addSiblingNodeToGraph),
    [insertBranchNode],
  );

  const handleAddSticky = useCallback(() => {
    const newId = nextMindmapId('sticky');
    const stickyNode: MindmapNode = {
      id: newId,
      x: 120,
      y: 120,
      title: 'Ghi chú nhanh',
      note: 'Nhấp để sửa nội dung ghi chú…',
      isStickyNote: true,
      showNoteInline: true,
      color: graph.nodes[0]?.color ?? MindmapBranchColor.GOLD,
    };
    commitGraph((prev) => ({ ...prev, nodes: [...prev.nodes, stickyNode] }));
    setSelectedNodeId(newId);
    setEditingNodeId(newId);
    setActiveTab(MindmapInspectorTab.NODE);
    setSidebarOpen(true);
  }, [commitGraph, graph.nodes]);

  const openReaderWithAutoFit = useCallback(() => {
    setReaderOpen(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      setSidebarOpen(false);
    }
  }, []);

  const openArticleInReader = useCallback(
    (slug: string) => {
      setRequestedReaderSource({ kind: ReaderSourceKind.ARTICLE, slug, seq: Date.now() });
      openReaderWithAutoFit();
    },
    [openReaderWithAutoFit],
  );

  const handleCreateBranchFromReader = useCallback(
    (payload: { title: string; note?: string; articleRef?: MindmapArticleRef }) => {
      const parentId = selectedNodeId ?? tree.rootId;
      if (!parentId) return;
      commitGraph((prev) => {
        const res = addChildNodeToGraph(prev, parentId, payload.title);
        if (!res.newId) return prev;
        return {
          ...res.graph,
          nodes: res.graph.nodes.map((n) =>
            n.id === res.newId
              ? {
                  ...n,
                  ...(payload.note ? { note: payload.note } : {}),
                  ...(payload.articleRef ? { articleRefs: [payload.articleRef] } : {}),
                }
              : n,
          ),
        };
      });
    },
    [commitGraph, selectedNodeId, tree.rootId],
  );

  const handleAppendToSelectedNote = useCallback(
    (text: string, articleRef?: MindmapArticleRef) => {
      const targetId = selectedNodeId ?? tree.rootId;
      if (!targetId) return;
      commitGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => {
          if (n.id !== targetId) return n;
          const existingArts = nodeArticlesOf(n);
          const nextArts =
            articleRef && !existingArts.some((a) => a.id === articleRef.id)
              ? [...existingArts, articleRef]
              : existingArts;
          const nextNote = n.note?.trim() ? `${n.note.trim()}\n\n${text}` : text;
          return {
            ...n,
            note: nextNote.slice(0, 600),
            ...(nextArts.length > 0 ? { articleRefs: nextArts, articleRef: undefined } : {}),
          };
        }),
      }));
    },
    [commitGraph, selectedNodeId, tree.rootId],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      let nextSelected: string | null = selectedNodeId;
      commitGraph((prev) => {
        const res = deleteSubtreeFromGraph(prev, nodeId);
        nextSelected = res.nextSelectedId;
        return res.graph;
      });
      setSelectedNodeId(nextSelected);
    },
    [commitGraph, selectedNodeId],
  );

  const handleUndo = useCallback(() => {
    const prevGraph = history.stepUndo(graph);
    if (!prevGraph) return;
    setGraph(prevGraph);
    scheduleSave(title, prevGraph);
  }, [graph, history, scheduleSave, title]);

  const handleRedo = useCallback(() => {
    const nextGraph = history.stepRedo(graph);
    if (!nextGraph) return;
    setGraph(nextGraph);
    scheduleSave(title, nextGraph);
  }, [graph, history, scheduleSave, title]);

  // Phím tắt chuyên nghiệp (Tab, Enter, Del, Ctrl+Z/Y)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === MindmapShortcutKey.UNDO) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === MindmapShortcutKey.REDO) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.key === MindmapShortcutKey.ESCAPE) {
        setLinkFromId(null);
        setEditingNodeId(null);
        return;
      }
      if (e.key === MindmapShortcutKey.TAB && selectedNodeId) {
        e.preventDefault();
        handleAddChild(selectedNodeId);
        return;
      }
      if (e.key === MindmapShortcutKey.ENTER && selectedNodeId) {
        e.preventDefault();
        handleAddSibling();
        return;
      }
      if (
        (e.key === MindmapShortcutKey.DELETE || e.key === MindmapShortcutKey.BACKSPACE) &&
        selectedNodeId &&
        selectedNodeId !== tree.rootId
      ) {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAddChild, handleAddSibling, handleDeleteNode, handleRedo, handleUndo, selectedNodeId, tree.rootId]);

  const updateNode = (nodeId: string, patch: Partial<MindmapNode>) => {
    commitGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    }));
  };

  const handleNodeClick = (nodeId: string) => {
    if (linkFromId) {
      const alreadyLinked = graph.edges.some(
        (e) =>
          (e.fromId === linkFromId && e.toId === nodeId) ||
          (e.fromId === nodeId && e.toId === linkFromId),
      );
      if (linkFromId !== nodeId && !alreadyLinked) {
        const newEdge: MindmapEdge = {
          id: nextMindmapId('edge'),
          fromId: linkFromId,
          toId: nodeId,
          isCrossLink: true,
        };
        commitGraph((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
      }
      setLinkFromId(null);
      return;
    }
    setSelectedNodeId(nodeId);
  };

  const detectDropNodeId = (clientX: number, clientY: number, draggedId: string): string | null => {
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      const nodeEl = el.closest<HTMLElement>('[data-mindmap-node-id]');
      const candidate = nodeEl?.dataset.mindmapNodeId;
      if (candidate && candidate !== draggedId) return candidate;
    }
    return null;
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    const insideNode =
      e.target instanceof HTMLElement && Boolean(e.target.closest('[data-mindmap-node-id]'));
    if (toolMode !== MindmapToolMode.HAND && insideNode) return;
    dragRef.current = {
      mode: DragMode.PAN,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
      moved: false,
    };
  };

  const onNodePointerDown = (e: React.PointerEvent, node: MindmapNode) => {
    if (toolMode === MindmapToolMode.HAND) return;
    e.stopPropagation();
    const isFree = structure === MindmapStructure.FREEFORM || Boolean(node.isStickyNote);
    dragRef.current = {
      mode: isFree ? DragMode.FREE_NODE : DragMode.REPARENT_NODE,
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;

    if (drag.mode === DragMode.PAN) {
      setPan({ x: drag.origX + dx, y: drag.origY + dy });
      return;
    }
    if (drag.mode === DragMode.FREE_NODE && drag.nodeId) {
      const nx = Math.round(drag.origX + dx / zoom);
      const ny = Math.round(drag.origY + dy / zoom);
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === drag.nodeId ? { ...n, x: nx, y: ny } : n)),
      }));
      return;
    }
    if (drag.mode === DragMode.REPARENT_NODE && drag.nodeId && drag.moved) {
      setDropTargetId(detectDropNodeId(e.clientX, e.clientY, drag.nodeId));
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (drag?.mode === DragMode.FREE_NODE && drag.moved) {
      scheduleSave(title, graph);
    } else if (drag?.mode === DragMode.REPARENT_NODE && drag.nodeId && dropTargetId) {
      commitGraph((prev) => reparentNodeInGraph(prev, drag.nodeId!, dropTargetId));
    }
    dragRef.current = null;
    setDropTargetId(null);
  };

  const toggleFullscreen = async () => {
    if (!studioRef.current) return;
    if (!document.fullscreenElement) {
      await studioRef.current.requestFullscreen().catch(() => undefined);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => undefined);
      setIsFullscreen(false);
    }
  };

  const selectedNode = selectedNodeId ? tree.nodeMap.get(selectedNodeId) ?? null : null;
  const attachedArticles = useMemo(() => collectUniqueAttachedArticles(graph.nodes), [graph.nodes]);

  return (
    <div
      ref={studioRef}
      className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900"
    >
      <MindmapTopBar
        title={title}
        saveState={saveState}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        hasSelectedNode={Boolean(selectedNode)}
        isLinking={Boolean(linkFromId)}
        readerOpen={readerOpen}
        sidebarOpen={sidebarOpen}
        onBack={onBack}
        onTitleChange={(next) => {
          setTitle(next);
          scheduleSave(next, graph);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddChild={() => handleAddChild()}
        onAddSibling={() => handleAddSibling()}
        onAddSticky={handleAddSticky}
        onToggleLink={() => setLinkFromId(linkFromId ? null : selectedNodeId ?? tree.rootId)}
        onToggleReader={() => {
          if (readerOpen) setReaderOpen(false);
          else openReaderWithAutoFit();
        }}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onPrint={() => window.print()}
        onShareToCommunity={() => setShareOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {readerOpen && (
          <MindmapReferenceDrawer
            requestedSource={requestedReaderSource}
            attachedArticles={attachedArticles}
            selectedNodeTitle={selectedNode?.title}
            onCreateBranchFromText={handleCreateBranchFromReader}
            onAppendToSelectedNote={handleAppendToSelectedNote}
            onClose={() => setReaderOpen(false)}
          />
        )}

        <div className="relative flex-1 overflow-hidden">
        <div
          ref={canvasRef}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault();
              const factor = e.deltaY < 0 ? 1 + MINDMAP_CANVAS.ZOOM_STEP : 1 - MINDMAP_CANVAS.ZOOM_STEP;
              setZoom((z) => Math.max(MINDMAP_CANVAS.MIN_ZOOM, Math.min(MINDMAP_CANVAS.MAX_ZOOM, Number((z * factor).toFixed(2)))));
            } else {
              setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
            }
          }}
          className={`relative h-full w-full overflow-hidden select-none ${
            toolMode === MindmapToolMode.HAND ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          style={{
            backgroundColor: canvasBg,
            ...(showGrid
              ? {
                  backgroundImage: `radial-gradient(${theme.gridDotColor} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }
              : undefined),
          }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            className="pointer-events-none relative h-full w-full"
          >
            {/* Lớp SVG dây nối & gạch chân */}
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width={1} height={1}>
              <defs>
                <marker
                  id="mindmap-cross-arrow"
                  viewBox="0 0 10 10"
                  refX="8.5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="context-stroke" />
                </marker>
              </defs>

              {layout.spineLine && (
                <line
                  x1={layout.spineLine.x1}
                  y1={layout.spineLine.y1}
                  x2={layout.spineLine.x2}
                  y2={layout.spineLine.y2}
                  stroke={theme.branchPalette[0].stroke}
                  strokeWidth={2.5}
                />
              )}

              {graph.edges.map((edge) => {
                const geom = layout.routedEdges.get(edge.id);
                const fromNode = tree.nodeMap.get(edge.fromId);
                const toNode = tree.nodeMap.get(edge.toId);
                if (!geom || !toNode) return null;
                const parentStyle = fromNode?.style;
                const stroke = parentStyle?.childStrokeColor || resolveNodePalette(toNode, tree, theme).stroke;
                const strokeW = parentStyle?.childStrokeWidth ?? (edge.isCrossLink ? 1.8 : 2);
                const dash = edgeStrokeDasharray(edge.isCrossLink, parentStyle?.childStrokeStyle);
                return (
                  <g key={edge.id} className="pointer-events-auto">
                    <path
                      d={geom.d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={strokeW}
                      strokeDasharray={dash}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      markerEnd={edge.isCrossLink ? 'url(#mindmap-cross-arrow)' : undefined}
                    />
                    {edge.isCrossLink && (
                      <path
                        d={geom.d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        className="cursor-pointer"
                        onClick={() =>
                          commitGraph((prev) => ({
                            ...prev,
                            edges: prev.edges.filter((e) => e.id !== edge.id),
                          }))
                        }
                      >
                        <title>Bấm để xoá đường nối chéo</title>
                      </path>
                    )}
                    {geom.underlineSegment && (
                      <path
                        d={geom.underlineSegment}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={strokeW}
                        strokeDasharray={dash}
                        strokeLinecap="round"
                      />
                    )}
                    {edge.label && (
                      <g transform={`translate(${geom.midX}, ${geom.midY})`}>
                        <rect x={-36} y={-10} width={72} height={20} rx={6} fill="#FFFFFF" stroke={stroke} strokeWidth={1} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600} fill="#1E293B">
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Lớp Nodes */}
            {graph.nodes.map((node) => {
              const placement = layout.placements.get(node.id);
              if (!placement) return null;
              const palette = resolveNodePalette(node, tree, theme);
              return (
                <MindmapNodeCard
                  key={node.id}
                  node={node}
                  placement={placement}
                  structure={structure}
                  theme={theme}
                  palette={palette}
                  isRoot={node.id === tree.rootId}
                  isSelected={selectedNodeId === node.id}
                  isEditing={editingNodeId === node.id}
                  isLinkSource={linkFromId === node.id}
                  isDropTarget={dropTargetId === node.id}
                  descendantCount={tree.descendantCountMap.get(node.id) ?? 0}
                  onRegisterRef={registerNodeRef(node.id)}
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingNodeId(node.id);
                  }}
                  onChangeTitle={(nextTitle) => updateNode(node.id, { title: nextTitle })}
                  onStopEditing={() => setEditingNodeId(null)}
                  onAddChild={() => handleAddChild(node.id)}
                  onAddSibling={() => handleAddSibling(node.id)}
                  onDelete={() => handleDeleteNode(node.id)}
                  onToggleCollapse={() => updateNode(node.id, { collapsed: !node.collapsed })}
                  onChangeNote={(note) => updateNode(node.id, { note })}
                  onOpenInspector={(tab) => {
                    setSelectedNodeId(node.id);
                    setActiveTab(tab);
                    setSidebarOpen(true);
                  }}
                  onOpenArticleInReader={openArticleInReader}
                />
              );
            })}
          </div>
        </div>

        <MindmapLeftToolbar
          toolMode={toolMode}
          isFullscreen={isFullscreen}
          zoom={zoom}
          onChangeToolMode={setToolMode}
          onFitView={fitView}
          onCenterRoot={() => tree.rootId && centerOnNode(tree.rootId)}
          onZoomIn={() => setZoom((z) => Math.min(MINDMAP_CANVAS.MAX_ZOOM, Number((z + MINDMAP_CANVAS.ZOOM_STEP).toFixed(2))))}
          onZoomOut={() => setZoom((z) => Math.max(MINDMAP_CANVAS.MIN_ZOOM, Number((z - MINDMAP_CANVAS.ZOOM_STEP).toFixed(2))))}
          onResetZoom={() => setZoom(1)}
          onToggleFullscreen={() => void toggleFullscreen()}
        />

        <AiMindmapPromptModal
          structure={structure}
          existingGraph={graph}
          selectedNodeId={selectedNodeId}
          onApply={({ title: aiTitle, preview }) => {
            setTitle(aiTitle);
            commitGraph(() => preview.graph);
            setSelectedNodeId(selectedNodeId ?? preview.graph.nodes[0]?.id ?? null);
            setTimeout(() => fitView(), 80);
          }}
        />
        </div>

        {sidebarOpen && (
          <MindmapStyleSidebar
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            structure={structure}
            mapTheme={theme.id}
            balancedBranches={balancedBranches}
            edgeStyle={edgeStyle}
            customBgColor={graph.customBgColor}
            showGrid={showGrid}
            selectedNode={selectedNode}
            graph={graph}
            tree={tree}
            onUpdateGraphMeta={(patch) => {
              commitGraph((prev) => ({ ...prev, ...patch }));
              if (patch.structure) {
                setTimeout(() => fitView(), 60);
              }
            }}
            onUpdateNode={updateNode}
            onAddChild={handleAddChild}
            onDeleteNode={handleDeleteNode}
            onUpdateEdge={(edgeId, label) =>
              commitGraph((prev) => ({
                ...prev,
                edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, label } : e)),
              }))
            }
            onDeleteEdge={(edgeId) =>
              commitGraph((prev) => ({
                ...prev,
                edges: prev.edges.filter((e) => e.id !== edgeId),
              }))
            }
            onSelectAndFocus={(id) => {
              setSelectedNodeId(id);
              centerOnNode(id);
            }}
            onOpenArticleInReader={openArticleInReader}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {shareOpen && (
        <ShareMindmapCommunityModal
          isOpen={shareOpen}
          mindmapTitle={title}
          periodLabel={initialMindmap.periodLabel}
          graph={graph}
          tree={tree}
          layout={layout}
          onFlushSave={flushSaveNow}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
