import {
  MINDMAP_CANVAS,
  MindmapBranchSide,
  MindmapEdgeStyle,
  MindmapNodeShape,
  MindmapStructure,
  NODE_SIZE_MAX_WIDTH,
} from '../constants/mindmap.constants';
import type { MindmapEdge, MindmapGraph, MindmapNode } from '../services/mindmap.service';
import type { MindmapTreeModel } from './mindmap-tree.util';

export interface NodeRectSize {
  width: number;
  height: number;
}

export enum NodeVisualVariant {
  ROOT = 'ROOT',
  BRANCH_CARD = 'BRANCH_CARD',
  UNDERLINE = 'UNDERLINE',
  PILL = 'PILL',
  CIRCLE = 'CIRCLE',
  PLAIN = 'PLAIN',
  STICKY = 'STICKY',
}

export interface NodeLayoutPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  side: MindmapBranchSide;
  level: number;
  variant: NodeVisualVariant;
}

export interface RoutedEdgeGeometry {
  d: string;
  midX: number;
  midY: number;
  underlineSegment?: string;
}

export interface MindmapLayoutResult {
  placements: Map<string, NodeLayoutPlacement>;
  routedEdges: Map<string, RoutedEdgeGeometry>;
  spineLine?: { x1: number; y1: number; x2: number; y2: number };
}

export interface LayoutStrategyContext {
  graph: MindmapGraph;
  tree: MindmapTreeModel;
  sizes: Map<string, NodeRectSize>;
  structure: MindmapStructure;
  balancedBranches: boolean;
  edgeStyle: MindmapEdgeStyle;
}

const GAP = {
  MIND_X: 64,
  MIND_Y: 22,
  MIND_ROOT_SIDE_GAP: 84,
  ORG_X: 34,
  ORG_Y: 46,
  FISH_COL: 260,
  FISH_CHILD_Y: 46,
} as const;

export function estimateNodeSize(
  node: MindmapNode,
  sizes: Map<string, NodeRectSize>,
): NodeRectSize {
  const measured = sizes.get(node.id);
  if (measured && measured.width > 10 && measured.height > 10) {
    return measured;
  }
  const maxW = node.size ? NODE_SIZE_MAX_WIDTH[node.size] : MINDMAP_CANVAS.DEFAULT_NODE_WIDTH;
  const estW = Math.min(maxW, Math.max(96, node.title.length * 8.5 + 36));
  const estH = node.imageUrl ? 170 : MINDMAP_CANVAS.DEFAULT_NODE_HEIGHT;
  return { width: estW, height: estH };
}

export function resolveNodeVisualVariant(
  structure: MindmapStructure,
  level: number,
  node: MindmapNode,
): NodeVisualVariant {
  if (node.isStickyNote) return NodeVisualVariant.STICKY;
  if (node.shape === MindmapNodeShape.PILL) return NodeVisualVariant.PILL;
  if (node.shape === MindmapNodeShape.CIRCLE) return NodeVisualVariant.CIRCLE;
  if (node.shape === MindmapNodeShape.PLAIN) return NodeVisualVariant.PLAIN;
  if (node.shape === MindmapNodeShape.UNDERLINE && !node.imageUrl) {
    return NodeVisualVariant.UNDERLINE;
  }
  if (level === 0) return NodeVisualVariant.ROOT;
  if (node.imageUrl || node.shape === MindmapNodeShape.CARD || Boolean(node.dateLabel)) {
    return NodeVisualVariant.BRANCH_CARD;
  }
  const isHorizontalBranch =
    structure === MindmapStructure.MIND_MAP ||
    structure === MindmapStructure.LOGIC_CHART ||
    structure === MindmapStructure.FISHBONE;
  if (level >= 2 && isHorizontalBranch) {
    return NodeVisualVariant.UNDERLINE;
  }
  return NodeVisualVariant.BRANCH_CARD;
}

function visibleChildren(tree: MindmapTreeModel, nodeId: string): string[] {
  const node = tree.nodeMap.get(nodeId);
  if (!node || node.collapsed) return [];
  return (tree.childrenMap.get(nodeId) ?? []).filter((id) => !tree.hiddenNodeIds.has(id));
}

enum SpanAxis {
  WIDTH = 'WIDTH',
  HEIGHT = 'HEIGHT',
}

function putPlacement(
  nodeId: string,
  x: number,
  y: number,
  side: MindmapBranchSide,
  ctx: LayoutStrategyContext,
  placements: Map<string, NodeLayoutPlacement>,
): NodeRectSize {
  const node = ctx.tree.nodeMap.get(nodeId)!;
  const size = estimateNodeSize(node, ctx.sizes);
  const level = ctx.tree.depthMap.get(nodeId) ?? 1;
  placements.set(nodeId, {
    x: Math.round(x),
    y: Math.round(y),
    width: size.width,
    height: size.height,
    side,
    level,
    variant: resolveNodeVisualVariant(ctx.structure, level, node),
  });
  return size;
}

function computeSubtreeSpan(
  nodeId: string,
  ctx: LayoutStrategyContext,
  axis: SpanAxis,
  gap: number,
  cache: Map<string, number>,
): number {
  const cached = cache.get(nodeId);
  if (cached !== undefined) return cached;
  const node = ctx.tree.nodeMap.get(nodeId)!;
  const rect = estimateNodeSize(node, ctx.sizes);
  const selfSpan = axis === SpanAxis.WIDTH ? rect.width : rect.height;
  const children = visibleChildren(ctx.tree, nodeId);
  if (children.length === 0) {
    cache.set(nodeId, selfSpan);
    return selfSpan;
  }
  let sum = 0;
  for (let i = 0; i < children.length; i++) {
    sum += computeSubtreeSpan(children[i], ctx, axis, gap, cache);
    if (i > 0) sum += gap;
  }
  const total = Math.max(selfSpan, sum);
  cache.set(nodeId, total);
  return total;
}

function placeHorizontalSubtree(
  nodeId: string,
  anchorX: number,
  centerY: number,
  side: MindmapBranchSide,
  ctx: LayoutStrategyContext,
  heightCache: Map<string, number>,
  placements: Map<string, NodeLayoutPlacement>,
): void {
  const node = ctx.tree.nodeMap.get(nodeId)!;
  const size = estimateNodeSize(node, ctx.sizes);
  const x = side === MindmapBranchSide.LEFT ? anchorX - size.width : anchorX;
  const y = centerY - size.height / 2;
  putPlacement(nodeId, x, y, side, ctx, placements);

  const children = visibleChildren(ctx.tree, nodeId);
  if (children.length === 0) return;

  const totalH = children.reduce(
    (acc, id, idx) =>
      acc + computeSubtreeSpan(id, ctx, SpanAxis.HEIGHT, GAP.MIND_Y, heightCache) + (idx > 0 ? GAP.MIND_Y : 0),
    0,
  );
  let cursorY = centerY - totalH / 2;
  const nextAnchorX = side === MindmapBranchSide.LEFT ? x - GAP.MIND_X : x + size.width + GAP.MIND_X;

  for (const childId of children) {
    const childH = computeSubtreeSpan(childId, ctx, SpanAxis.HEIGHT, GAP.MIND_Y, heightCache);
    placeHorizontalSubtree(childId, nextAnchorX, cursorY + childH / 2, side, ctx, heightCache, placements);
    cursorY += childH + GAP.MIND_Y;
  }
}

function splitSideBranches(
  rootChildren: string[],
  ctx: LayoutStrategyContext,
  heightCache: Map<string, number>,
): { leftIds: string[]; rightIds: string[] } {
  const leftIds: string[] = [];
  const rightIds: string[] = [];

  if (!ctx.balancedBranches) {
    for (const id of rootChildren) {
      const node = ctx.tree.nodeMap.get(id);
      if (node?.side === MindmapBranchSide.LEFT) leftIds.push(id);
      else rightIds.push(id);
    }
    return { leftIds, rightIds };
  }

  let leftSum = 0;
  let rightSum = 0;
  for (const id of rootChildren) {
    const h = computeSubtreeSpan(id, ctx, SpanAxis.HEIGHT, GAP.MIND_Y, heightCache);
    if (rightSum <= leftSum) {
      rightIds.push(id);
      rightSum += h + GAP.MIND_Y;
    } else {
      leftIds.push(id);
      leftSum += h + GAP.MIND_Y;
    }
  }
  return { leftIds, rightIds };
}

function buildHorizontalEdgeGeometry(
  from: NodeLayoutPlacement,
  to: NodeLayoutPlacement,
  edgeStyle: MindmapEdgeStyle,
): RoutedEdgeGeometry {
  const isLeft = to.side === MindmapBranchSide.LEFT;
  const fromUnderline = from.variant === NodeVisualVariant.UNDERLINE;
  const toUnderline = to.variant === NodeVisualVariant.UNDERLINE;

  const sx = isLeft ? from.x : from.x + from.width;
  const sy = fromUnderline ? from.y + from.height : from.y + from.height / 2;
  const tx = isLeft ? to.x + to.width : to.x;
  const ty = toUnderline ? to.y + to.height : to.y + to.height / 2;
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  let d: string;
  if (edgeStyle === MindmapEdgeStyle.STRAIGHT) {
    d = `M ${sx} ${sy} L ${tx} ${ty}`;
  } else if (edgeStyle === MindmapEdgeStyle.STEP) {
    d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  } else {
    const dx = Math.abs(tx - sx) * 0.55;
    const c1x = isLeft ? sx - dx : sx + dx;
    const c2x = isLeft ? tx + dx : tx - dx;
    d = `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ty}, ${tx} ${ty}`;
  }

  const underlineSegment = toUnderline
    ? `M ${tx} ${ty} L ${isLeft ? to.x : to.x + to.width} ${ty}`
    : undefined;
  return { d, midX, midY, underlineSegment };
}

function buildVerticalEdgeGeometry(
  from: NodeLayoutPlacement,
  to: NodeLayoutPlacement,
  edgeStyle: MindmapEdgeStyle,
): RoutedEdgeGeometry {
  const sx = from.x + from.width / 2;
  const sy = from.y + from.height;
  const tx = to.x + to.width / 2;
  const ty = to.y;
  const elbowY = sy + Math.max(16, (ty - sy) * 0.48);
  const midX = (sx + tx) / 2;
  const midY = elbowY;

  if (edgeStyle === MindmapEdgeStyle.BEZIER) {
    const dy = (ty - sy) * 0.5;
    return { d: `M ${sx} ${sy} C ${sx} ${sy + dy}, ${tx} ${ty - dy}, ${tx} ${ty}`, midX, midY };
  }
  if (edgeStyle === MindmapEdgeStyle.STRAIGHT) {
    return { d: `M ${sx} ${sy} L ${tx} ${ty}`, midX, midY };
  }
  return {
    d: `M ${sx} ${sy} L ${sx} ${elbowY} L ${tx} ${elbowY} L ${tx} ${ty}`,
    midX,
    midY,
  };
}

interface BoxAnchor {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

function boxAnchors(box: NodeLayoutPlacement): BoxAnchor[] {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return [
    { x: cx, y: box.y, nx: 0, ny: -1 },
    { x: box.x + box.width, y: cy, nx: 1, ny: 0 },
    { x: cx, y: box.y + box.height, nx: 0, ny: 1 },
    { x: box.x, y: cy, nx: -1, ny: 0 },
  ];
}

function pickNearestAnchorPair(
  from: NodeLayoutPlacement,
  to: NodeLayoutPlacement,
): { a: BoxAnchor; b: BoxAnchor; dist: number } {
  const fcx = from.x + from.width / 2;
  const fcy = from.y + from.height / 2;
  const tcx = to.x + to.width / 2;
  const tcy = to.y + to.height / 2;
  const dirX = tcx - fcx;
  const dirY = tcy - fcy;

  const fromCandidates = boxAnchors(from).filter((a) => dirX * a.nx + dirY * a.ny >= -20);
  const toCandidates = boxAnchors(to).filter((b) => -dirX * b.nx - dirY * b.ny >= -20);
  const fList = fromCandidates.length > 0 ? fromCandidates : boxAnchors(from);
  const tList = toCandidates.length > 0 ? toCandidates : boxAnchors(to);

  let bestA = fList[0];
  let bestB = tList[0];
  let bestDist = Infinity;

  for (const a of fList) {
    for (const b of tList) {
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < bestDist) {
        bestDist = d;
        bestA = a;
        bestB = b;
      }
    }
  }
  return { a: bestA, b: bestB, dist: bestDist };
}

function buildNearestEdgeGeometry(
  from: NodeLayoutPlacement,
  to: NodeLayoutPlacement,
  edgeStyle: MindmapEdgeStyle,
): RoutedEdgeGeometry {
  const { a, b, dist } = pickNearestAnchorPair(from, to);

  if (edgeStyle === MindmapEdgeStyle.STRAIGHT) {
    return { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
  }
  if (edgeStyle === MindmapEdgeStyle.STEP) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const d = Math.abs(a.nx) > 0
      ? `M ${a.x} ${a.y} L ${mx} ${a.y} L ${mx} ${b.y} L ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${b.y}`;
    return { d, midX: mx, midY: my };
  }

  const handle = Math.min(120, Math.max(40, dist * 0.42));
  const c1x = a.x + a.nx * handle;
  const c1y = a.y + a.ny * handle;
  const c2x = b.x + b.nx * handle;
  const c2y = b.y + b.ny * handle;

  // Điểm giữa thực sự trên đường cong Cubic Bezier (t = 0.5)
  const midX = 0.125 * a.x + 0.375 * c1x + 0.375 * c2x + 0.125 * b.x;
  const midY = 0.125 * a.y + 0.375 * c1y + 0.375 * c2y + 0.125 * b.y;
  return {
    d: `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`,
    midX,
    midY,
  };
}

function resolveEdgeStyleForParent(
  fromId: string,
  ctx: LayoutStrategyContext,
): MindmapEdgeStyle {
  const override = ctx.tree.nodeMap.get(fromId)?.style?.childEdgeStyle;
  return override && override !== MindmapEdgeStyle.AUTO ? override : ctx.edgeStyle;
}

function routeTreeEdges(
  treeEdges: MindmapEdge[],
  placements: Map<string, NodeLayoutPlacement>,
  ctx: LayoutStrategyContext,
  edgeBuilder: (from: NodeLayoutPlacement, to: NodeLayoutPlacement, style: MindmapEdgeStyle) => RoutedEdgeGeometry,
  out: Map<string, RoutedEdgeGeometry>,
): void {
  for (const edge of treeEdges) {
    const from = placements.get(edge.fromId);
    const to = placements.get(edge.toId);
    if (!from || !to) continue;
    out.set(edge.id, edgeBuilder(from, to, resolveEdgeStyleForParent(edge.fromId, ctx)));
  }
}

function placeStickyAndOrphans(ctx: LayoutStrategyContext, placements: Map<string, NodeLayoutPlacement>): void {
  for (const id of ctx.tree.stickyNodeIds) {
    const node = ctx.tree.nodeMap.get(id)!;
    const size = estimateNodeSize(node, ctx.sizes);
    placements.set(id, {
      x: node.x,
      y: node.y,
      width: size.width,
      height: size.height,
      side: MindmapBranchSide.RIGHT,
      level: 1,
      variant: NodeVisualVariant.STICKY,
    });
  }

  let orphanOffset = 0;
  for (const id of ctx.tree.orphanNodeIds) {
    const node = ctx.tree.nodeMap.get(id)!;
    const size = estimateNodeSize(node, ctx.sizes);
    placements.set(id, {
      x: -200 + orphanOffset * 240,
      y: 360,
      width: size.width,
      height: size.height,
      side: MindmapBranchSide.RIGHT,
      level: 1,
      variant: resolveNodeVisualVariant(ctx.structure, 1, node),
    });
    orphanOffset += 1;
  }
}

export interface MindmapLayoutStrategy {
  compute(ctx: LayoutStrategyContext): MindmapLayoutResult;
}

class MindMapSideLayoutStrategy implements MindmapLayoutStrategy {
  constructor(private readonly twoSided: boolean) {}

  compute(ctx: LayoutStrategyContext): MindmapLayoutResult {
    const placements = new Map<string, NodeLayoutPlacement>();
    const routedEdges = new Map<string, RoutedEdgeGeometry>();
    const { tree } = ctx;

    if (!tree.rootId) {
      placeStickyAndOrphans(ctx, placements);
      return { placements, routedEdges };
    }

    const rootNode = tree.nodeMap.get(tree.rootId)!;
    const rootSize = estimateNodeSize(rootNode, ctx.sizes);
    const rootX = -Math.round(rootSize.width / 2);
    const rootY = -Math.round(rootSize.height / 2);
    placements.set(tree.rootId, {
      x: rootX,
      y: rootY,
      width: rootSize.width,
      height: rootSize.height,
      side: MindmapBranchSide.AUTO,
      level: 0,
      variant: resolveNodeVisualVariant(ctx.structure, 0, rootNode),
    });

    const heightCache = new Map<string, number>();
    const rootChildren = visibleChildren(tree, tree.rootId);
    const { leftIds, rightIds } = this.twoSided
      ? splitSideBranches(rootChildren, ctx, heightCache)
      : { leftIds: [], rightIds: rootChildren };

    const placeSideList = (ids: string[], side: MindmapBranchSide) => {
      if (ids.length === 0) return;
      const totalH = ids.reduce(
        (acc, id, idx) =>
          acc + computeSubtreeSpan(id, ctx, SpanAxis.HEIGHT, GAP.MIND_Y * 1.4, heightCache) + (idx > 0 ? GAP.MIND_Y * 1.4 : 0),
        0,
      );
      let cursorY = -totalH / 2;
      const anchorX =
        side === MindmapBranchSide.LEFT
          ? rootX - GAP.MIND_ROOT_SIDE_GAP
          : rootX + rootSize.width + GAP.MIND_ROOT_SIDE_GAP;

      for (const id of ids) {
        const subH = computeSubtreeSpan(id, ctx, SpanAxis.HEIGHT, GAP.MIND_Y * 1.4, heightCache);
        placeHorizontalSubtree(id, anchorX, cursorY + subH / 2, side, ctx, heightCache, placements);
        cursorY += subH + GAP.MIND_Y * 1.4;
      }
    };

    placeSideList(rightIds, MindmapBranchSide.RIGHT);
    placeSideList(leftIds, MindmapBranchSide.LEFT);
    placeStickyAndOrphans(ctx, placements);

    routeTreeEdges(
      tree.treeEdges,
      placements,
      ctx,
      buildHorizontalEdgeGeometry,
      routedEdges,
    );
    routeTreeEdges(
      tree.crossEdges,
      placements,
      ctx,
      buildNearestEdgeGeometry,
      routedEdges,
    );

    return { placements, routedEdges };
  }
}

function placeOrgSubtree(
  nodeId: string,
  centerX: number,
  topY: number,
  ctx: LayoutStrategyContext,
  widthCache: Map<string, number>,
  placements: Map<string, NodeLayoutPlacement>,
): void {
  const node = ctx.tree.nodeMap.get(nodeId)!;
  const preSize = estimateNodeSize(node, ctx.sizes);
  const size = putPlacement(nodeId, centerX - preSize.width / 2, topY, MindmapBranchSide.AUTO, ctx, placements);

  const children = visibleChildren(ctx.tree, nodeId);
  if (children.length === 0) return;

  const totalW = children.reduce(
    (acc, id, idx) =>
      acc + computeSubtreeSpan(id, ctx, SpanAxis.WIDTH, GAP.ORG_X, widthCache) + (idx > 0 ? GAP.ORG_X : 0),
    0,
  );
  let cursorX = centerX - totalW / 2;
  const childY = topY + size.height + GAP.ORG_Y;

  for (const childId of children) {
    const childW = computeSubtreeSpan(childId, ctx, SpanAxis.WIDTH, GAP.ORG_X, widthCache);
    placeOrgSubtree(childId, cursorX + childW / 2, childY, ctx, widthCache, placements);
    cursorX += childW + GAP.ORG_X;
  }
}

class OrgChartLayoutStrategy implements MindmapLayoutStrategy {
  compute(ctx: LayoutStrategyContext): MindmapLayoutResult {
    const placements = new Map<string, NodeLayoutPlacement>();
    const routedEdges = new Map<string, RoutedEdgeGeometry>();
    if (ctx.tree.rootId) {
      const widthCache = new Map<string, number>();
      placeOrgSubtree(ctx.tree.rootId, 0, 0, ctx, widthCache, placements);
    }
    placeStickyAndOrphans(ctx, placements);

    routeTreeEdges(
      ctx.tree.treeEdges,
      placements,
      ctx,
      buildVerticalEdgeGeometry,
      routedEdges,
    );
    routeTreeEdges(
      ctx.tree.crossEdges,
      placements,
      ctx,
      buildNearestEdgeGeometry,
      routedEdges,
    );
    return { placements, routedEdges };
  }
}

class FishboneLayoutStrategy implements MindmapLayoutStrategy {
  compute(ctx: LayoutStrategyContext): MindmapLayoutResult {
    const placements = new Map<string, NodeLayoutPlacement>();
    const routedEdges = new Map<string, RoutedEdgeGeometry>();
    const { tree } = ctx;
    let spineMaxX = 520;

    if (tree.rootId) {
      const rootNode = tree.nodeMap.get(tree.rootId)!;
      const rootSize = estimateNodeSize(rootNode, ctx.sizes);
      placements.set(tree.rootId, {
        x: 0,
        y: -Math.round(rootSize.height / 2),
        width: rootSize.width,
        height: rootSize.height,
        side: MindmapBranchSide.RIGHT,
        level: 0,
        variant: resolveNodeVisualVariant(ctx.structure, 0, rootNode),
      });

      const rootChildren = visibleChildren(tree, tree.rootId);
      const heightCache = new Map<string, number>();
      rootChildren.forEach((childId, idx) => {
        const col = Math.floor(idx / 2);
        const isTop = idx % 2 === 0;
        const childNode = tree.nodeMap.get(childId)!;
        const cSize = estimateNodeSize(childNode, ctx.sizes);
        const branchX = rootSize.width + 130 + col * GAP.FISH_COL;
        const subH = computeSubtreeSpan(childId, ctx, SpanAxis.HEIGHT, GAP.MIND_Y, heightCache);
        const targetY = isTop ? -(150 + subH / 2) : 150 + subH / 2;
        spineMaxX = Math.max(spineMaxX, branchX + cSize.width + 80);

        placeHorizontalSubtree(childId, branchX, targetY, MindmapBranchSide.RIGHT, ctx, heightCache, placements);
      });
    }

    placeStickyAndOrphans(ctx, placements);

    for (const edge of tree.treeEdges) {
      const from = placements.get(edge.fromId);
      const to = placements.get(edge.toId);
      if (!from || !to) continue;
      if (edge.fromId === tree.rootId) {
        const startX = to.x - 56;
        const startY = 0;
        const endX = to.x + to.width / 2;
        const endY = to.y < 0 ? to.y + to.height : to.y;
        routedEdges.set(edge.id, {
          d: `M ${startX} ${startY} L ${endX} ${endY}`,
          midX: (startX + endX) / 2,
          midY: (startY + endY) / 2,
        });
      } else {
        routedEdges.set(edge.id, buildHorizontalEdgeGeometry(from, to, MindmapEdgeStyle.STEP));
      }
    }
    routeTreeEdges(
      tree.crossEdges,
      placements,
      ctx,
      buildNearestEdgeGeometry,
      routedEdges,
    );

    const rootPlace = tree.rootId ? placements.get(tree.rootId) : undefined;
    const spineLine = rootPlace
      ? { x1: rootPlace.x + rootPlace.width, y1: 0, x2: spineMaxX, y2: 0 }
      : undefined;

    return { placements, routedEdges, spineLine };
  }
}

class FreeformLayoutStrategy implements MindmapLayoutStrategy {
  compute(ctx: LayoutStrategyContext): MindmapLayoutResult {
    const placements = new Map<string, NodeLayoutPlacement>();
    const routedEdges = new Map<string, RoutedEdgeGeometry>();

    for (const node of ctx.graph.nodes) {
      if (ctx.tree.hiddenNodeIds.has(node.id)) continue;
      const size = estimateNodeSize(node, ctx.sizes);
      const level = ctx.tree.depthMap.get(node.id) ?? 1;
      placements.set(node.id, {
        x: node.x,
        y: node.y,
        width: size.width,
        height: size.height,
        side: node.side ?? MindmapBranchSide.RIGHT,
        level,
        variant: resolveNodeVisualVariant(ctx.structure, level, node),
      });
    }

    routeTreeEdges(
      ctx.graph.edges,
      placements,
      ctx,
      buildNearestEdgeGeometry,
      routedEdges,
    );
    return { placements, routedEdges };
  }
}

const LAYOUT_STRATEGIES: Record<MindmapStructure, MindmapLayoutStrategy> = {
  [MindmapStructure.MIND_MAP]: new MindMapSideLayoutStrategy(true),
  [MindmapStructure.ORG_CHART]: new OrgChartLayoutStrategy(),
  [MindmapStructure.LOGIC_CHART]: new MindMapSideLayoutStrategy(false),
  [MindmapStructure.FISHBONE]: new FishboneLayoutStrategy(),
  [MindmapStructure.FREEFORM]: new FreeformLayoutStrategy(),
};

export function computeMindmapLayout(ctx: LayoutStrategyContext): MindmapLayoutResult {
  const strategy = LAYOUT_STRATEGIES[ctx.structure] ?? LAYOUT_STRATEGIES[MindmapStructure.MIND_MAP];
  return strategy.compute(ctx);
}

export function computeFitViewportFromPlacements(
  placements: Iterable<NodeLayoutPlacement>,
  viewportWidth: number,
  viewportHeight: number,
): { pan: { x: number; y: number }; zoom: number } {
  const list = Array.from(placements);
  if (list.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { pan: { x: Math.round(viewportWidth / 2), y: Math.round(viewportHeight / 2) }, zoom: 1 };
  }
  const minX = Math.min(...list.map((p) => p.x));
  const minY = Math.min(...list.map((p) => p.y));
  const maxX = Math.max(...list.map((p) => p.x + p.width));
  const maxY = Math.max(...list.map((p) => p.y + p.height));

  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const pad = 72;

  const scaleX = (viewportWidth - pad * 2) / contentW;
  const scaleY = (viewportHeight - pad * 2) / contentH;
  const zoom = Math.max(
    MINDMAP_CANVAS.MIN_ZOOM,
    Math.min(1, Number(Math.min(scaleX, scaleY).toFixed(2))),
  );

  const panX = Math.round((viewportWidth - contentW * zoom) / 2 - minX * zoom);
  const panY = Math.round((viewportHeight - contentH * zoom) / 2 - minY * zoom);
  return { pan: { x: panX, y: panY }, zoom };
}
