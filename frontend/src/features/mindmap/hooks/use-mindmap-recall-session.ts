'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  FlashcardApiService,
  type FlashcardDeck,
} from '@/features/flashcards/services/flashcard.service';
import { extractErrorMessage } from '@/services/api';
import {
  MindmapRecallMode,
  MindmapRecallRating,
} from '../constants/mindmap.constants';
import type { MindmapGraph } from '../services/mindmap.service';
import {
  MindmapRecallStrategyRegistry,
  type NodeRecallMask,
  buildFlashcardsFromMindmapNodes,
} from '../utils/mindmap-recall.strategy';
import type { MindmapTreeModel } from '../utils/mindmap-tree.util';

export interface RecallProgressStats {
  totalTestable: number;
  rememberedCount: number;
  needsReviewCount: number;
  unratedCount: number;
}

function collectAncestorChain(
  nodeIds: Iterable<string>,
  tree: MindmapTreeModel,
): Set<string> {
  const ancestors = new Set<string>();
  for (const id of nodeIds) {
    let cur = tree.parentMap.get(id);
    let guard = 0;
    while (cur && guard < 12) {
      ancestors.add(cur);
      cur = tree.parentMap.get(cur);
      guard += 1;
    }
  }
  return ancestors;
}

export function useMindmapRecallSession({
  mindmapTitle,
  baseGraph,
  baseTree,
  onAfterModeChange,
}: {
  mindmapTitle: string;
  baseGraph: MindmapGraph;
  baseTree: MindmapTreeModel;
  onAfterModeChange?: () => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState<MindmapRecallMode>(
    MindmapRecallMode.PROGRESSIVE_UNFOLD,
  );
  const [activeMode, setActiveMode] = useState<MindmapRecallMode>(
    MindmapRecallMode.PROGRESSIVE_UNFOLD,
  );

  const [unfoldedIds, setUnfoldedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [ratings, setRatings] = useState<Record<string, MindmapRecallRating>>(
    {},
  );

  const [creatingDeck, setCreatingDeck] = useState(false);
  const [createdDeck, setCreatedDeck] = useState<FlashcardDeck | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);

  const strategy = useMemo(
    () => MindmapRecallStrategyRegistry.get(activeMode),
    [activeMode],
  );

  const sessionSnapshot = useMemo(
    () => ({ unfoldedIds, revealedIds, ratings }),
    [unfoldedIds, revealedIds, ratings],
  );

  const effectiveGraph = useMemo(
    () =>
      isStudyMode
        ? strategy.buildVirtualGraph(baseGraph, baseTree, sessionSnapshot)
        : baseGraph,
    [baseGraph, baseTree, isStudyMode, sessionSnapshot, strategy],
  );

  const testableNodeIds = useMemo(() => {
    const ids: string[] = [];
    for (const node of baseGraph.nodes) {
      if (strategy.isNodeTestable(node, baseTree, baseGraph)) {
        ids.push(node.id);
      }
    }
    return ids;
  }, [baseGraph, baseTree, strategy]);

  const nodeMasks = useMemo(() => {
    const map = new Map<string, NodeRecallMask>();
    if (!isStudyMode) return map;
    for (const node of baseGraph.nodes) {
      map.set(
        node.id,
        strategy.evaluateNodeMask(node, baseTree, baseGraph, sessionSnapshot),
      );
    }
    return map;
  }, [baseGraph, baseTree, isStudyMode, sessionSnapshot, strategy]);

  const stats = useMemo<RecallProgressStats>(() => {
    let rememberedCount = 0;
    let needsReviewCount = 0;
    for (const id of testableNodeIds) {
      const r = ratings[id];
      if (r === MindmapRecallRating.REMEMBERED) rememberedCount += 1;
      else if (r === MindmapRecallRating.NEEDS_REVIEW) needsReviewCount += 1;
    }
    return {
      totalTestable: testableNodeIds.length,
      rememberedCount,
      needsReviewCount,
      unratedCount: Math.max(
        0,
        testableNodeIds.length - rememberedCount - needsReviewCount,
      ),
    };
  }, [ratings, testableNodeIds]);

  const startWithStrategy = useCallback(
    (modeToApply: MindmapRecallMode) => {
      setSelectedMode(modeToApply);
      setActiveMode(modeToApply);
      setUnfoldedIds(new Set());
      setRevealedIds(new Set());
      setRatings({});
      setCreatedDeck(null);
      setDeckError(null);
      setIsStudyMode(true);
      setPopoverOpen(false);
      onAfterModeChange?.();
    },
    [onAfterModeChange],
  );

  const exitStudyMode = useCallback(() => {
    setIsStudyMode(false);
    setPopoverOpen(false);
    setCreatedDeck(null);
    setDeckError(null);
    onAfterModeChange?.();
  }, [onAfterModeChange]);

  const resetCurrentSession = useCallback(() => {
    setUnfoldedIds(new Set());
    setRevealedIds(new Set());
    setRatings({});
    setCreatedDeck(null);
    setDeckError(null);
    onAfterModeChange?.();
  }, [onAfterModeChange]);

  const toggleUnfoldInStudy = useCallback((nodeId: string) => {
    setUnfoldedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const revealOrInteractNode = useCallback(
    (nodeId: string) => {
      if (!isStudyMode) return;
      if (activeMode === MindmapRecallMode.PROGRESSIVE_UNFOLD) {
        const hasChildren = (baseTree.childrenMap.get(nodeId)?.length ?? 0) > 0;
        if (hasChildren && !unfoldedIds.has(nodeId)) {
          setUnfoldedIds((prev) => new Set(prev).add(nodeId));
        }
        return;
      }
      setRevealedIds((prev) =>
        prev.has(nodeId) ? prev : new Set(prev).add(nodeId),
      );
    },
    [activeMode, baseTree.childrenMap, isStudyMode, unfoldedIds],
  );

  const rateNode = useCallback(
    (nodeId: string, rating: MindmapRecallRating) => {
      setRevealedIds((prev) =>
        prev.has(nodeId) ? prev : new Set(prev).add(nodeId),
      );
      setRatings((prev) => ({
        ...prev,
        [nodeId]: rating,
      }));
    },
    [],
  );

  const retryWeakNodesOnly = useCallback(() => {
    const rememberedSet = new Set(
      testableNodeIds.filter(
        (id) => ratings[id] === MindmapRecallRating.REMEMBERED,
      ),
    );
    const weakSet = new Set(
      testableNodeIds.filter(
        (id) => ratings[id] !== MindmapRecallRating.REMEMBERED,
      ),
    );
    setRevealedIds(rememberedSet);
    const nextRatings: Record<string, MindmapRecallRating> = {};
    for (const id of rememberedSet) {
      nextRatings[id] = MindmapRecallRating.REMEMBERED;
    }
    setRatings(nextRatings);

    if (activeMode === MindmapRecallMode.PROGRESSIVE_UNFOLD) {
      const rememberedAncestors = collectAncestorChain(rememberedSet, baseTree);
      const weakParents = new Set<string>();
      for (const id of weakSet) {
        const p = baseTree.parentMap.get(id);
        if (p) weakParents.add(p);
      }
      for (const wp of weakParents) {
        rememberedAncestors.delete(wp);
      }
      setUnfoldedIds(rememberedAncestors);
    }
    onAfterModeChange?.();
  }, [activeMode, baseTree, onAfterModeChange, ratings, testableNodeIds]);

  const exportWeakNodesToFlashcards = useCallback(async () => {
    const explicitWeakIds = testableNodeIds.filter(
      (id) => ratings[id] === MindmapRecallRating.NEEDS_REVIEW,
    );
    const targetIds = new Set(
      explicitWeakIds.length > 0
        ? explicitWeakIds
        : testableNodeIds.filter(
            (id) => ratings[id] !== MindmapRecallRating.REMEMBERED,
          ),
    );
    const cards = buildFlashcardsFromMindmapNodes(
      mindmapTitle,
      baseGraph,
      baseTree,
      targetIds,
    );
    if (cards.length === 0) return;

    setCreatingDeck(true);
    setDeckError(null);
    try {
      const cleanTitle = mindmapTitle.trim() || 'Sơ đồ tư duy';
      const deck = await FlashcardApiService.createDeckBatch({
        title: `Ôn tập từ Mindmap: ${cleanTitle}`.slice(0, 140),
        description: `Trích xuất ${cards.length} ý cần củng cố từ phiên ôn tập sơ đồ tư duy "${cleanTitle}".`,
        cards,
      });
      setCreatedDeck(deck);
    } catch (err) {
      setDeckError(
        extractErrorMessage(
          err,
          'Không thể tạo bộ thẻ ghi nhớ lúc này. Vui lòng thử lại.',
        ),
      );
    } finally {
      setCreatingDeck(false);
    }
  }, [baseGraph, baseTree, mindmapTitle, ratings, testableNodeIds]);

  return {
    popoverOpen,
    setPopoverOpen,
    isStudyMode,
    selectedMode,
    setSelectedMode,
    activeMode,
    effectiveGraph,
    nodeMasks,
    stats,
    creatingDeck,
    createdDeck,
    deckError,
    startWithStrategy,
    exitStudyMode,
    resetCurrentSession,
    toggleUnfoldInStudy,
    revealOrInteractNode,
    rateNode,
    retryWeakNodesOnly,
    exportWeakNodesToFlashcards,
  };
}
