import {
  BRANCH_COLOR_STYLES,
  type BranchPaletteToken,
  MAP_THEME_CONFIGS,
  type MapThemeConfig,
  MindmapBranchColor,
  MindmapCanvasTheme,
  MindmapMapTheme,
  MindmapStructure,
} from '../constants/mindmap.constants';
import type { MindmapEdge, MindmapGraph, MindmapNode } from '../services/mindmap.service';

export interface MindmapTreeModel {
  rootId: string | null;
  nodeMap: Map<string, MindmapNode>;
  parentMap: Map<string, string>;
  childrenMap: Map<string, string[]>;
  depthMap: Map<string, number>;
  branchIndexMap: Map<string, number>;
  treeEdges: MindmapEdge[];
  crossEdges: MindmapEdge[];
  hiddenNodeIds: Set<string>;
  descendantCountMap: Map<string, number>;
  stickyNodeIds: Set<string>;
  orphanNodeIds: string[];
}

export function nextMindmapId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}${Date.now().toString(36).slice(-3)}`;
}

export function resolveEffectiveStructure(graph: MindmapGraph): MindmapStructure {
  return graph.structure ?? MindmapStructure.MIND_MAP;
}

export function resolveEffectiveTheme(graph: MindmapGraph): MapThemeConfig {
  if (graph.mapTheme && MAP_THEME_CONFIGS[graph.mapTheme]) {
    return MAP_THEME_CONFIGS[graph.mapTheme];
  }
  if (graph.theme === MindmapCanvasTheme.DARK) {
    return MAP_THEME_CONFIGS[MindmapMapTheme.DARK_CHALK];
  }
  if (graph.theme === MindmapCanvasTheme.PAPER) {
    return MAP_THEME_CONFIGS[MindmapMapTheme.HISGO_HERITAGE];
  }
  return MAP_THEME_CONFIGS[MindmapMapTheme.MODERN_BLUE];
}

function findRootNodeId(treeNodes: MindmapNode[], edges: MindmapEdge[]): string | null {
  if (treeNodes.length === 0) return null;
  const incoming = new Set(edges.filter((e) => !e.isCrossLink).map((e) => e.toId));
  const preferred = treeNodes.find((n) => !incoming.has(n.id));
  return (preferred ?? treeNodes[0]).id;
}

function countDescendants(nodeId: string, childrenMap: Map<string, string[]>, out: Map<string, number>): number {
  let total = 0;
  for (const childId of childrenMap.get(nodeId) ?? []) {
    total += 1 + countDescendants(childId, childrenMap, out);
  }
  out.set(nodeId, total);
  return total;
}

function markHidden(nodeId: string, childrenMap: Map<string, string[]>, hidden: Set<string>): void {
  for (const childId of childrenMap.get(nodeId) ?? []) {
    hidden.add(childId);
    markHidden(childId, childrenMap, hidden);
  }
}

export function collectDescendantIds(childrenMap: Map<string, string[]>, rootId: string): Set<string> {
  const result = new Set<string>();
  const stack = [...(childrenMap.get(rootId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const c of childrenMap.get(id) ?? []) stack.push(c);
  }
  return result;
}

function collectAdjacency(
  edges: MindmapEdge[],
  treeNodeSet: Set<string>,
): Map<string, MindmapEdge[]> {
  const outgoing = new Map<string, MindmapEdge[]>();
  for (const edge of edges) {
    if (edge.isCrossLink) continue;
    if (!treeNodeSet.has(edge.fromId) || !treeNodeSet.has(edge.toId)) continue;
    const list = outgoing.get(edge.fromId) ?? [];
    list.push(edge);
    outgoing.set(edge.fromId, list);
  }
  return outgoing;
}

function populateSpanningTree(
  rootId: string,
  outgoing: Map<string, MindmapEdge[]>,
  parentMap: Map<string, string>,
  childrenMap: Map<string, string[]>,
  depthMap: Map<string, number>,
  branchIndexMap: Map<string, number>,
  treeEdgeIds: Set<string>,
): void {
  depthMap.set(rootId, 0);
  const queue = [rootId];
  let topBranchCounter = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDepth = depthMap.get(curr) ?? 0;
    for (const edge of outgoing.get(curr) ?? []) {
      if (depthMap.has(edge.toId)) continue;
      treeEdgeIds.add(edge.id);
      parentMap.set(edge.toId, curr);
      const list = childrenMap.get(curr) ?? [];
      list.push(edge.toId);
      childrenMap.set(curr, list);
      depthMap.set(edge.toId, currDepth + 1);
      branchIndexMap.set(edge.toId, curr === rootId ? topBranchCounter++ : (branchIndexMap.get(curr) ?? 0));
      queue.push(edge.toId);
    }
  }
}

export function buildMindmapTree(graph: MindmapGraph): MindmapTreeModel {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const stickyNodeIds = new Set(graph.nodes.filter((n) => n.isStickyNote).map((n) => n.id));
  const treeNodes = graph.nodes.filter((n) => !n.isStickyNote);
  const treeNodeSet = new Set(treeNodes.map((n) => n.id));

  const rootId = findRootNodeId(treeNodes, graph.edges);
  const parentMap = new Map<string, string>();
  const childrenMap = new Map<string, string[]>();
  const depthMap = new Map<string, number>();
  const branchIndexMap = new Map<string, number>();
  const treeEdgeIds = new Set<string>();

  if (rootId) {
    const outgoing = collectAdjacency(graph.edges, treeNodeSet);
    populateSpanningTree(rootId, outgoing, parentMap, childrenMap, depthMap, branchIndexMap, treeEdgeIds);
  }

  const treeEdges = graph.edges.filter((e) => treeEdgeIds.has(e.id));
  const crossEdges = graph.edges.filter((e) => !treeEdgeIds.has(e.id));
  const orphanNodeIds = treeNodes.filter((n) => !depthMap.has(n.id)).map((n) => n.id);

  const descendantCountMap = new Map<string, number>();
  const hiddenNodeIds = new Set<string>();
  if (rootId) countDescendants(rootId, childrenMap, descendantCountMap);
  for (const n of treeNodes) {
    if (n.collapsed) markHidden(n.id, childrenMap, hiddenNodeIds);
  }

  return {
    rootId,
    nodeMap,
    parentMap,
    childrenMap,
    depthMap,
    branchIndexMap,
    treeEdges,
    crossEdges,
    hiddenNodeIds,
    descendantCountMap,
    stickyNodeIds,
    orphanNodeIds,
  };
}

export function resolveNodePalette(
  node: MindmapNode,
  tree: MindmapTreeModel,
  theme: MapThemeConfig,
): BranchPaletteToken {
  if (node.colorOverride && BRANCH_COLOR_STYLES[node.colorOverride]) {
    return BRANCH_COLOR_STYLES[node.colorOverride].token;
  }
  const branchIdx = tree.branchIndexMap.get(node.id) ?? 0;
  return theme.branchPalette[branchIdx % theme.branchPalette.length];
}

export function addChildNodeToGraph(
  graph: MindmapGraph,
  parentId: string,
  title = 'Nhánh mới',
): { graph: MindmapGraph; newId: string } {
  const parent = graph.nodes.find((n) => n.id === parentId);
  if (!parent) return { graph, newId: '' };
  const newId = nextMindmapId('n');
  const newNode: MindmapNode = {
    id: newId,
    x: parent.x + 220,
    y: parent.y + 60,
    title,
    color: parent.color === MindmapBranchColor.CRIMSON ? MindmapBranchColor.GOLD : parent.color,
  };
  return {
    newId,
    graph: {
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === parentId ? { ...n, collapsed: false } : n)).concat(newNode),
      edges: [...graph.edges, { id: nextMindmapId('e'), fromId: parentId, toId: newId }],
    },
  };
}

export function addSiblingNodeToGraph(
  graph: MindmapGraph,
  targetId: string,
  title = 'Nhánh mới',
): { graph: MindmapGraph; newId: string } {
  const tree = buildMindmapTree(graph);
  const parentId = tree.parentMap.get(targetId) ?? tree.rootId ?? targetId;
  return addChildNodeToGraph(graph, parentId, title);
}

export function deleteSubtreeFromGraph(
  graph: MindmapGraph,
  nodeId: string,
): { graph: MindmapGraph; nextSelectedId: string | null } {
  const tree = buildMindmapTree(graph);
  if (nodeId === tree.rootId && graph.nodes.length <= 1) {
    return { graph, nextSelectedId: nodeId };
  }
  if (nodeId === tree.rootId) {
    return { graph, nextSelectedId: nodeId };
  }
  const toRemove = collectDescendantIds(tree.childrenMap, nodeId);
  toRemove.add(nodeId);
  const nextSelectedId = tree.parentMap.get(nodeId) ?? tree.rootId;
  return {
    nextSelectedId,
    graph: {
      ...graph,
      nodes: graph.nodes.filter((n) => !toRemove.has(n.id)),
      edges: graph.edges.filter((e) => !toRemove.has(e.fromId) && !toRemove.has(e.toId)),
    },
  };
}

export function reparentNodeInGraph(
  graph: MindmapGraph,
  nodeId: string,
  newParentId: string,
): MindmapGraph {
  if (nodeId === newParentId) return graph;
  const tree = buildMindmapTree(graph);
  if (nodeId === tree.rootId) return graph;
  const descendants = collectDescendantIds(tree.childrenMap, nodeId);
  if (descendants.has(newParentId)) return graph;

  const cleanedEdges = graph.edges.filter((e) => !(e.toId === nodeId && !e.isCrossLink));
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === newParentId ? { ...n, collapsed: false } : n)),
    edges: [...cleanedEdges, { id: nextMindmapId('e'), fromId: newParentId, toId: nodeId }],
  };
}
