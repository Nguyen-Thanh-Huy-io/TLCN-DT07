import type { GeneratedCardDraft } from '@/features/flashcards/services/flashcard.service';
import {
  MINDMAP_RECALL_STRATEGY_OPTIONS,
  MindmapRecallMode,
  MindmapRecallRating,
} from '../constants/mindmap.constants';
import type { MindmapGraph, MindmapNode } from '../services/mindmap.service';
import type { MindmapTreeModel } from './mindmap-tree.util';

export interface RecallSessionSnapshot {
  unfoldedIds: ReadonlySet<string>;
  revealedIds: ReadonlySet<string>;
  ratings: Readonly<Record<string, MindmapRecallRating>>;
}

export interface NodeRecallMask {
  isTestable: boolean;
  isMasked: boolean;
  maskTitle: boolean;
  maskDateAndBadge: boolean;
  maskNote: boolean;
  rating?: MindmapRecallRating;
}

export interface IMindmapRecallStrategy {
  readonly mode: MindmapRecallMode;
  buildVirtualGraph(
    baseGraph: MindmapGraph,
    tree: MindmapTreeModel,
    session: RecallSessionSnapshot,
  ): MindmapGraph;
  isNodeTestable(
    node: MindmapNode,
    tree: MindmapTreeModel,
    baseGraph: MindmapGraph,
  ): boolean;
  evaluateNodeMask(
    node: MindmapNode,
    tree: MindmapTreeModel,
    baseGraph: MindmapGraph,
    session: RecallSessionSnapshot,
  ): NodeRecallMask;
}

function hasNodeHistoricalDetail(node: MindmapNode): boolean {
  return Boolean(
    node.dateLabel?.trim() || node.badge?.trim() || node.note?.trim(),
  );
}

function graphHasAnyHistoricalDetail(
  graph: MindmapGraph,
  rootId: string | null,
): boolean {
  return graph.nodes.some(
    (n) => n.id !== rootId && !n.isStickyNote && hasNodeHistoricalDetail(n),
  );
}

function isStandardBranchNode(
  node: MindmapNode,
  tree: MindmapTreeModel,
): boolean {
  return node.id !== tree.rootId && !node.isStickyNote;
}

function buildExpandedVirtualGraph(baseGraph: MindmapGraph): MindmapGraph {
  return {
    ...baseGraph,
    nodes: baseGraph.nodes.map((node) =>
      node.collapsed ? { ...node, collapsed: false } : node,
    ),
  };
}

class ProgressiveUnfoldRecallStrategy implements IMindmapRecallStrategy {
  readonly mode = MindmapRecallMode.PROGRESSIVE_UNFOLD;

  buildVirtualGraph(
    baseGraph: MindmapGraph,
    tree: MindmapTreeModel,
    session: RecallSessionSnapshot,
  ): MindmapGraph {
    return {
      ...baseGraph,
      nodes: baseGraph.nodes.map((node) => {
        if (node.isStickyNote) return node;
        const hasChildren = (tree.childrenMap.get(node.id)?.length ?? 0) > 0;
        const shouldCollapse = hasChildren && !session.unfoldedIds.has(node.id);
        return { ...node, collapsed: shouldCollapse };
      }),
    };
  }

  isNodeTestable(node: MindmapNode, tree: MindmapTreeModel): boolean {
    return isStandardBranchNode(node, tree);
  }

  evaluateNodeMask(
    node: MindmapNode,
    tree: MindmapTreeModel,
    _baseGraph: MindmapGraph,
    session: RecallSessionSnapshot,
  ): NodeRecallMask {
    const testable = this.isNodeTestable(node, tree);
    return {
      isTestable: testable,
      isMasked: false,
      maskTitle: false,
      maskDateAndBadge: false,
      maskNote: false,
      rating: session.ratings[node.id],
    };
  }
}

class BlurClozeRecallStrategy implements IMindmapRecallStrategy {
  readonly mode = MindmapRecallMode.BLUR_CLOZE;

  buildVirtualGraph(baseGraph: MindmapGraph): MindmapGraph {
    return buildExpandedVirtualGraph(baseGraph);
  }

  isNodeTestable(node: MindmapNode, tree: MindmapTreeModel): boolean {
    return isStandardBranchNode(node, tree);
  }

  evaluateNodeMask(
    node: MindmapNode,
    tree: MindmapTreeModel,
    _baseGraph: MindmapGraph,
    session: RecallSessionSnapshot,
  ): NodeRecallMask {
    const testable = this.isNodeTestable(node, tree);
    const masked = testable && !session.revealedIds.has(node.id);
    return {
      isTestable: testable,
      isMasked: masked,
      maskTitle: masked,
      maskDateAndBadge: masked,
      maskNote: masked,
      rating: session.ratings[node.id],
    };
  }
}

class DateDetailRecallStrategy implements IMindmapRecallStrategy {
  readonly mode = MindmapRecallMode.DATE_DETAIL_ONLY;

  buildVirtualGraph(baseGraph: MindmapGraph): MindmapGraph {
    return buildExpandedVirtualGraph(baseGraph);
  }

  isNodeTestable(
    node: MindmapNode,
    tree: MindmapTreeModel,
    baseGraph: MindmapGraph,
  ): boolean {
    if (!isStandardBranchNode(node, tree)) return false;
    if (graphHasAnyHistoricalDetail(baseGraph, tree.rootId)) {
      return hasNodeHistoricalDetail(node);
    }
    const isLeaf = (tree.childrenMap.get(node.id)?.length ?? 0) === 0;
    return isLeaf;
  }

  evaluateNodeMask(
    node: MindmapNode,
    tree: MindmapTreeModel,
    baseGraph: MindmapGraph,
    session: RecallSessionSnapshot,
  ): NodeRecallMask {
    const hasDetailsInMap = graphHasAnyHistoricalDetail(baseGraph, tree.rootId);
    const testable = this.isNodeTestable(node, tree, baseGraph);
    const masked = testable && !session.revealedIds.has(node.id);

    if (!hasDetailsInMap) {
      return {
        isTestable: testable,
        isMasked: masked,
        maskTitle: masked,
        maskDateAndBadge: masked,
        maskNote: masked,
        rating: session.ratings[node.id],
      };
    }

    return {
      isTestable: testable,
      isMasked: masked,
      maskTitle: false,
      maskDateAndBadge: masked,
      maskNote: masked,
      rating: session.ratings[node.id],
    };
  }
}

class StrategyRegistry {
  private readonly map: ReadonlyMap<MindmapRecallMode, IMindmapRecallStrategy>;

  constructor(items: ReadonlyArray<IMindmapRecallStrategy>) {
    this.map = new Map(items.map((s) => [s.mode, s]));
  }

  get(mode: MindmapRecallMode): IMindmapRecallStrategy {
    return this.map.get(mode) ?? this.map.get(MindmapRecallMode.PROGRESSIVE_UNFOLD)!;
  }

  options() {
    return MINDMAP_RECALL_STRATEGY_OPTIONS;
  }
}

export const MindmapRecallStrategyRegistry = new StrategyRegistry([
  new ProgressiveUnfoldRecallStrategy(),
  new BlurClozeRecallStrategy(),
  new DateDetailRecallStrategy(),
]);

function buildAncestorBreadcrumb(
  nodeId: string,
  tree: MindmapTreeModel,
): string {
  const parts: string[] = [];
  let cur = tree.parentMap.get(nodeId);
  let guard = 0;
  while (cur && guard < 8) {
    const parentNode = tree.nodeMap.get(cur);
    if (parentNode?.title?.trim()) {
      parts.unshift(parentNode.title.trim());
    }
    cur = tree.parentMap.get(cur);
    guard += 1;
  }
  return parts.join(' → ');
}

function buildFlashcardBackContent(node: MindmapNode): string {
  const lines: string[] = [node.title.trim() || 'Ý kiến thức'];
  const timeChip = node.dateLabel?.trim() || node.badge?.trim();
  if (timeChip) {
    lines.push(`Mốc thời gian / Nhãn: ${timeChip}`);
  }
  if (node.note?.trim()) {
    lines.push(`Chi tiết: ${node.note.trim()}`);
  }
  return lines.join('\n');
}

/**
 * Chuyển danh sách các node cần củng cố trên Mindmap thành mảng thẻ Flashcard SM-2.
 */
export function buildFlashcardsFromMindmapNodes(
  mindmapTitle: string,
  graph: MindmapGraph,
  tree: MindmapTreeModel,
  targetNodeIds: ReadonlySet<string>,
): GeneratedCardDraft[] {
  const cleanMapTitle = mindmapTitle.trim() || 'Sơ đồ tư duy Lịch sử';
  const cards: GeneratedCardDraft[] = [];

  for (const node of graph.nodes) {
    if (!targetNodeIds.has(node.id)) continue;
    const breadcrumb = buildAncestorBreadcrumb(node.id, tree);
    const contextPrefix = breadcrumb || cleanMapTitle;
    const hasTimeChip = Boolean(node.dateLabel?.trim() || node.badge?.trim());

    const front = hasTimeChip
      ? `[${contextPrefix}] Sự kiện "${node.title.trim()}" gắn với mốc thời gian & nội dung trọng tâm nào?`
      : `[${contextPrefix}] Trình bày ý kiến thức thuộc nhánh này?`;

    cards.push({
      front: front.slice(0, 480),
      back: buildFlashcardBackContent(node).slice(0, 1800),
    });
  }

  return cards;
}
