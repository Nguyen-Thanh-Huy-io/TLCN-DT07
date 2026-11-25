'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { AccountTabKey, accountTabRoute } from '@/features/account/components/AccountView';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { ReaderSourceKind } from '../constants/mindmap.constants';
import {
  ConceptCanvasApiService,
  SPATIAL_LAYOUT,
  collectExploredPrompts,
  computeNextSpatialPosition,
  convertSpatialNodesToMindmapPayload,
  downloadSpatialCanvasAsPng,
  removeSpatialSubtree,
  type SpatialCanvasNode,
  type SpatialMatchedArticle,
  type SpatialNodeVersion,
} from '../services/concept-canvas.service';
import { MindmapApiService, type MindmapArticleRef } from '../services/mindmap.service';
import {
  DrawerSide,
  MindmapReferenceDrawer,
  type RequestedReaderSearch,
  type RequestedReaderSource,
} from './MindmapReferenceDrawer';
import { MINDMAP_OPEN_ID_PARAM } from './MindmapsSection';
import {
  SpatialCanvasToolbar,
  SpatialConnectingLines,
  SpatialDiscoveryHero,
  SpatialMinimap,
  type SpatialCategorySeedGroup,
  type SpatialSeedSuggestion,
} from './SpatialCanvasParts';
import { SpatialNodeCard } from './SpatialNodeCard';

const PRIMARY_MOUSE_BUTTON = 0;
const POINTER_MOUSE = 'mouse';

function clampZoom(value: number): number {
  return Math.min(SPATIAL_LAYOUT.MAX_ZOOM, Math.max(SPATIAL_LAYOUT.MIN_ZOOM, value));
}

function toNodeVersion(
  res: Awaited<ReturnType<typeof ConceptCanvasApiService.explore>>,
): SpatialNodeVersion {
  return {
    periodLabel: res.periodLabel,
    text: res.text,
    prompts: res.prompts,
    imageUrl: res.imageUrl,
    engine: res.engine,
    matchedArticles: res.matchedArticles,
    matchedTimelineNodes: res.matchedTimelineNodes,
    webSources: res.webSources ?? [],
    webSearchQueries: res.webSearchQueries ?? [],
    ragCitations: res.ragCitations ?? [],
    animateText: true,
  };
}

export interface SpatialConceptCanvasProps {
  initialQuery?: string;
  initialArticleSlug?: string;
  topicSeeds: readonly SpatialSeedSuggestion[];
  categoryGroups: readonly SpatialCategorySeedGroup[];
}

function resolveParentContextTitle(
  nodes: readonly SpatialCanvasNode[],
  parentId: string | null,
): string | undefined {
  if (!parentId) return undefined;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parent = byId.get(parentId);
  if (!parent) return undefined;

  let root = parent;
  let guard = 0;
  while (root.parentId && byId.has(root.parentId) && guard < 12) {
    root = byId.get(root.parentId)!;
    guard += 1;
  }

  if (root.id === parent.id) return parent.prompt;
  return `${root.prompt} → ${parent.prompt}`;
}

export function SpatialConceptCanvas({
  initialQuery,
  initialArticleSlug,
  topicSeeds,
  categoryGroups,
}: SpatialConceptCanvasProps) {
  const router = useRouter();
  const user = useAuthSession();

  const [nodes, setNodes] = useState<SpatialCanvasNode[]>([]);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 48, y: 88 });
  const [zoom, setZoom] = useState<number>(0.9);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 1280, h: 760 });
  const [quickPrompt, setQuickPrompt] = useState<string>('');
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [savingMindmap, setSavingMindmap] = useState<boolean>(false);
  const [exportingPng, setExportingPng] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);
  const [requestedSource, setRequestedSource] = useState<RequestedReaderSource | null>(null);
  const [requestedSearch, setRequestedSearch] = useState<RequestedReaderSearch | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panDragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const nodeDragRef = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const seqRef = useRef<number>(0);
  const drawerSeqRef = useRef<number>(0);
  const nodesRef = useRef<SpatialCanvasNode[]>([]);
  const googleSearchRef = useRef<boolean>(false);
  const bootTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    googleSearchRef.current = useGoogleSearch;
  }, [useGoogleSearch]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setViewport({ w, h });
      if (w < 640 && nodesRef.current.length === 0) {
        setZoom(0.72);
        setPan({ x: Math.max(12, Math.round((w - SPATIAL_LAYOUT.CARD_WIDTH * 0.72) / 2)), y: 154 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!confirmReset) return undefined;
    const timer = window.setTimeout(() => setConfirmReset(false), 3200);
    return () => window.clearTimeout(timer);
  }, [confirmReset]);

  const focusOnWorldPoint = useCallback(
    (worldX: number, worldY: number, targetZoom?: number) => {
      const liveW = containerRef.current?.clientWidth ?? viewport.w;
      const liveH = containerRef.current?.clientHeight ?? viewport.h;
      const defaultMobileZoom = 0.72;
      const z = targetZoom ?? (liveW < 640 && zoom > 0.8 ? defaultMobileZoom : zoom);
      if (z !== zoom) setZoom(z);

      if (liveW < 640) {
        const centeredX = Math.max(10, Math.round((liveW - SPATIAL_LAYOUT.CARD_WIDTH * z) / 2));
        setPan({
          x: centeredX - worldX * z,
          y: 154 - worldY * z,
        });
        return;
      }

      setPan({
        x: Math.round(liveW * 0.24 - worldX * z),
        y: Math.round(Math.max(118, liveH * 0.22) - worldY * z),
      });
    },
    [viewport.h, viewport.w, zoom],
  );

  const spawnConceptNode = useCallback(
    async (
      prompt: string,
      options: {
        parentId: string | null;
        slotIndex?: number;
        articleSlug?: string;
        resetExisting?: boolean;
      },
    ) => {
      const cleanPrompt = prompt.trim();
      if (cleanPrompt.length < 2) return;

      setBannerError(null);
      seqRef.current += 1;
      const newId = `sc-node-${seqRef.current}`;

      const baseList = options.resetExisting ? [] : nodesRef.current;
      const parentNode = options.parentId
        ? (baseList.find((n) => n.id === options.parentId) ?? null)
        : null;
      const coords = computeNextSpatialPosition(baseList, parentNode, options.slotIndex ?? 1);

      const placeholder: SpatialCanvasNode = {
        id: newId,
        parentId: options.parentId,
        prompt: cleanPrompt,
        x: coords.x,
        y: coords.y,
        loading: true,
        error: null,
        versions: [],
        versionIndex: 0,
      };

      setNodes((prev) => (options.resetExisting ? [placeholder] : [...prev, placeholder]));
      focusOnWorldPoint(coords.x, coords.y);

      try {
        const res = await ConceptCanvasApiService.explore({
          prompt: cleanPrompt,
          parentTitle: resolveParentContextTitle(baseList, options.parentId),
          articleSlug: options.articleSlug,
          excludePrompts: collectExploredPrompts(baseList),
          useGoogleSearch: googleSearchRef.current,
        });
        const version = toNodeVersion(res);
        setNodes((prev) =>
          prev.map((item) =>
            item.id === newId
              ? { ...item, loading: false, error: null, versions: [version], versionIndex: 0 }
              : item,
          ),
        );
      } catch (err) {
        const msg = extractErrorMessage(err, 'Không thể kết nối máy chủ phân tích khái niệm.');
        setNodes((prev) =>
          prev.map((item) => (item.id === newId ? { ...item, loading: false, error: msg } : item)),
        );
      }
    },
    [focusOnWorldPoint],
  );

  const handleRegenerate = useCallback(async (nodeId: string) => {
    const target = nodesRef.current.find((n) => n.id === nodeId);
    if (!target) return;
    const parentContext = resolveParentContextTitle(nodesRef.current, target.parentId);

    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, loading: true, error: null } : n)));

    try {
      const res = await ConceptCanvasApiService.explore({
        prompt: target.prompt,
        parentTitle: parentContext,
        excludePrompts: collectExploredPrompts(nodesRef.current),
        useGoogleSearch: googleSearchRef.current,
      });
      const version = toNodeVersion(res);
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== nodeId) return n;
          const quietHistory = n.versions.map((v) => ({ ...v, animateText: false }));
          const nextVersions = [...quietHistory, version];
          return {
            ...n,
            loading: false,
            error: null,
            versions: nextVersions,
            versionIndex: nextVersions.length - 1,
          };
        }),
      );
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể làm mới nhánh khái niệm này.');
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, loading: false, error: msg } : n)));
    }
  }, []);

  const handleOpenArticleInDrawer = useCallback((nodeId: string, art: SpatialMatchedArticle) => {
    drawerSeqRef.current += 1;
    setDrawerNodeId(nodeId);
    setDrawerOpen(true);
    setRequestedSearch(null);
    setRequestedSource({
      kind: ReaderSourceKind.ARTICLE,
      slug: art.slug,
      seq: drawerSeqRef.current,
    });
  }, []);

  const handleSearchConceptInDrawer = useCallback((nodeId: string, conceptQuery: string) => {
    drawerSeqRef.current += 1;
    setDrawerNodeId(nodeId);
    setDrawerOpen(true);
    setRequestedSource(null);
    setRequestedSearch({ query: conceptQuery, seq: drawerSeqRef.current });
  }, []);

  const handleSaveAndOpenStudio = useCallback(async () => {
    if (!user) {
      router.push(APP_ROUTES.LOGIN);
      return;
    }
    if (!nodesRef.current.some((n) => n.versions.length > 0)) return;

    setSavingMindmap(true);
    setBannerError(null);
    try {
      const payload = convertSpatialNodesToMindmapPayload(nodesRef.current);
      const created = await MindmapApiService.create(payload);
      router.push(
        `${accountTabRoute(AccountTabKey.MINDMAPS)}&${MINDMAP_OPEN_ID_PARAM}=${encodeURIComponent(created.id)}`,
      );
    } catch (err) {
      setBannerError(extractErrorMessage(err, 'Không thể lưu sang Mindmap Studio lúc này.'));
    } finally {
      setSavingMindmap(false);
    }
  }, [router, user]);

  const handleExportPng = useCallback(async () => {
    if (!nodesRef.current.some((n) => n.versions.length > 0)) return;
    setExportingPng(true);
    setBannerError(null);
    try {
      await downloadSpatialCanvasAsPng(nodesRef.current);
    } catch (err) {
      setBannerError(extractErrorMessage(err, 'Không thể xuất ảnh PNG lúc này.'));
    } finally {
      setExportingPng(false);
    }
  }, []);

  useEffect(() => {
    const seed = initialQuery?.trim();
    if (!seed || bootTriggeredRef.current) return;
    bootTriggeredRef.current = true;
    void Promise.resolve().then(() =>
      spawnConceptNode(seed, {
        parentId: null,
        articleSlug: initialArticleSlug,
        resetExisting: true,
      }),
    );
  }, [initialArticleSlug, initialQuery, spawnConceptNode]);

  const handleStartNodeDrag = useCallback((nodeId: string, e: React.PointerEvent) => {
    if (e.pointerType === POINTER_MOUSE && e.button !== PRIMARY_MOUSE_BUTTON) return;
    e.stopPropagation();
    window.getSelection()?.removeAllRanges();
    const found = nodesRef.current.find((n) => n.id === nodeId);
    if (!found) return;
    nodeDragRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      origX: found.x,
      origY: found.y,
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nDrag = nodeDragRef.current;
    if (nDrag) {
      const dx = (e.clientX - nDrag.startX) / zoom;
      const dy = (e.clientY - nDrag.startY) / zoom;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nDrag.nodeId
            ? { ...n, x: Math.round(nDrag.origX + dx), y: Math.round(nDrag.origY + dy) }
            : n,
        ),
      );
      return;
    }
    const pDrag = panDragRef.current;
    if (pDrag) {
      setPan({
        x: pDrag.panX + (e.clientX - pDrag.startX),
        y: pDrag.panY + (e.clientY - pDrag.startY),
      });
    }
  };

  const stopAllDrags = () => {
    nodeDragRef.current = null;
    panDragRef.current = null;
  };

  const attachedArticles = useMemo<MindmapArticleRef[]>(() => {
    const map = new Map<string, MindmapArticleRef>();
    for (const node of nodes) {
      const active = node.versions[node.versionIndex];
      for (const art of active?.matchedArticles ?? []) {
        map.set(art.id, {
          id: art.id,
          slug: art.slug,
          title: art.title,
          coverImageUrl: art.coverImageUrl,
        });
      }
    }
    return Array.from(map.values());
  }, [nodes]);

  const activeDrawerNode = nodes.find((n) => n.id === drawerNodeId) ?? nodes[0];
  const hasReadyNodes = nodes.some((n) => n.versions.length > 0);

  return (
    <section
      ref={containerRef}
      onPointerDown={(e) => {
        if (e.pointerType === POINTER_MOUSE && e.button !== PRIMARY_MOUSE_BUTTON) return;
        panDragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={stopAllDrags}
      onPointerCancel={stopAllDrags}
      onPointerLeave={stopAllDrags}
      onWheel={(e) => {
        if (nodes.length === 0) return;
        setZoom((prev) => clampZoom(Number((prev + (e.deltaY < 0 ? 0.08 : -0.08)).toFixed(2))));
      }}
      style={{
        backgroundImage: 'radial-gradient(rgba(26, 18, 11, 0.22) 1.25px, transparent 1.25px)',
        backgroundSize: '24px 24px',
      }}
      className={`relative min-h-[calc(100vh-76px)] w-full overflow-hidden bg-[#F5EEDC] select-none ${
        nodes.length > 0 ? 'touch-none' : ''
      }`}
    >
      {nodes.length > 0 && (
        <SpatialCanvasToolbar
          drawerOpen={drawerOpen}
          quickPrompt={quickPrompt}
          useGoogleSearch={useGoogleSearch}
          zoom={zoom}
          hasReadyNodes={hasReadyNodes}
          exportingPng={exportingPng}
          savingMindmap={savingMindmap}
          isLoggedIn={Boolean(user)}
          confirmReset={confirmReset}
          onQuickPromptChange={setQuickPrompt}
          onSubmitNewRoot={() => {
            if (quickPrompt.trim().length >= 2) {
              setConfirmReset(false);
              void spawnConceptNode(quickPrompt, { parentId: null, resetExisting: true });
              setQuickPrompt('');
            }
          }}
          onToggleGoogleSearch={setUseGoogleSearch}
          onToggleDrawer={() => setDrawerOpen((v) => !v)}
          onZoomOut={() => setZoom((z) => clampZoom(z - SPATIAL_LAYOUT.ZOOM_STEP))}
          onZoomIn={() => setZoom((z) => clampZoom(z + SPATIAL_LAYOUT.ZOOM_STEP))}
          onResetView={() => {
            const root = nodesRef.current[0];
            const resetZoom = viewport.w < 640 ? 0.72 : 0.9;
            setZoom(resetZoom);
            if (root) focusOnWorldPoint(root.x, root.y, resetZoom);
          }}
          onExportPng={() => void handleExportPng()}
          onSaveStudio={() => void handleSaveAndOpenStudio()}
          onResetCanvasClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              return;
            }
            setConfirmReset(false);
            setNodes([]);
            setDrawerOpen(false);
            setBannerError(null);
            const nextZoom = viewport.w < 640 ? 0.72 : 0.9;
            setZoom(nextZoom);
            setPan(viewport.w < 640 ? { x: 24, y: 120 } : { x: 48, y: 118 });
          }}
        />
      )}

      {bannerError && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed top-36 left-1/2 z-40 -translate-x-1/2 rounded-lg border-2 border-[#1A120B] bg-[#FDF1F2] px-4 py-2 text-xs font-bold text-[#7A1F24] shadow-[3px_3px_0px_#1A120B]"
        >
          {bannerError}
        </div>
      )}

      {nodes.length === 0 ? (
        <SpatialDiscoveryHero
          topicSeeds={topicSeeds}
          categoryGroups={categoryGroups}
          useGoogleSearch={useGoogleSearch}
          onToggleGoogleSearch={setUseGoogleSearch}
          onStartExplore={(prompt, articleSlug) =>
            void spawnConceptNode(prompt, { parentId: null, articleSlug, resetExisting: true })
          }
        />
      ) : (
        <>
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            className="absolute top-0 left-0 h-full w-full cursor-grab active:cursor-grabbing"
          >
            <SpatialConnectingLines nodes={nodes} />
            {nodes.map((node, index) => (
              <SpatialNodeCard
                key={node.id}
                index={index}
                node={node}
                canDelete={nodes.length > 1}
                onBranchPrompt={(parentId, prompt, slotIdx) =>
                  void spawnConceptNode(prompt, { parentId, slotIndex: slotIdx })
                }
                onRegenerate={(id) => void handleRegenerate(id)}
                onSwitchVersion={(nodeId, nextIdx) =>
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === nodeId && nextIdx >= 0 && nextIdx < n.versions.length
                        ? {
                            ...n,
                            versions: n.versions.map((v) => ({ ...v, animateText: false })),
                            versionIndex: nextIdx,
                          }
                        : n,
                    ),
                  )
                }
                onDeleteSubtree={(id) => setNodes((prev) => removeSpatialSubtree(prev, id))}
                onStartNodeDrag={handleStartNodeDrag}
                onOpenArticleInDrawer={handleOpenArticleInDrawer}
                onSearchConceptInDrawer={handleSearchConceptInDrawer}
              />
            ))}
          </div>

          <SpatialMinimap
            nodes={nodes}
            pan={pan}
            zoom={zoom}
            viewportWidth={viewport.w}
            viewportHeight={viewport.h}
            onJumpTo={(wx, wy) => focusOnWorldPoint(wx, wy)}
          />
        </>
      )}

      {drawerOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          className="fixed top-[68px] right-0 bottom-0 z-40 flex max-w-full select-text sm:top-[72px]"
        >
          <MindmapReferenceDrawer
            side={DrawerSide.RIGHT}
            requestedSource={requestedSource}
            requestedSearch={requestedSearch}
            attachedArticles={attachedArticles}
            selectedNodeTitle={activeDrawerNode?.prompt}
            onCreateBranchFromText={({ title, articleRef }) => {
              void spawnConceptNode(title, {
                parentId: activeDrawerNode?.id ?? null,
                articleSlug: articleRef?.slug,
              });
            }}
            onAppendToSelectedNote={(text, articleRef) => {
              void spawnConceptNode(text.slice(0, 120), {
                parentId: activeDrawerNode?.id ?? null,
                articleSlug: articleRef?.slug,
              });
            }}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      )}
    </section>
  );
}
