import api from '@/services/api';
import {
  MindmapBranchColor,
  MindmapCanvasTheme,
  MindmapEdgeStyle,
  MindmapMapTheme,
  MindmapNodeShape,
  MindmapStructure,
  MindmapTemplateType,
} from '../constants/mindmap.constants';
import { exportMindmapToPngFile } from '../utils/mindmap-export-image.util';
import { computeMindmapLayout } from '../utils/mindmap-layout.strategy';
import { buildMindmapTree } from '../utils/mindmap-tree.util';
import type {
  MindmapArticleRef,
  MindmapEdge,
  MindmapGraph,
  MindmapNode,
} from './mindmap.service';

export const CONCEPT_CANVAS_API = {
  EXPLORE: '/public/concept-canvas/explore',
} as const;

export enum ConceptCanvasEngine {
  VERTEX_RAG = 'VERTEX_RAG',
  GOOGLE_GROUNDED = 'GOOGLE_GROUNDED',
  GEMINI_AI = 'GEMINI_AI',
  HISGO_DB_FALLBACK = 'HISGO_DB_FALLBACK',
  OUT_OF_CORPUS = 'OUT_OF_CORPUS',
}

export const SPATIAL_LAYOUT = {
  ROOT_X: 120,
  ROOT_Y: 140,
  CHILD_OFFSET_X: 740,
  CHILD_SPREAD_Y: 320,
  OVERLAP_X_THRESHOLD: 220,
  OVERLAP_Y_THRESHOLD: 520,
  SHIFT_STEP_Y: 540,
  CARD_WIDTH: 440,
  CARD_CENTER_Y_OFFSET: 180,
  PROMPT_CLUSTER_WIDTH: 250,
  MINIMAP_WIDTH: 200,
  MINIMAP_HEIGHT: 150,
  MIN_ZOOM: 0.35,
  MAX_ZOOM: 1.65,
  ZOOM_STEP: 0.15,
} as const;

export interface SpatialMatchedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  dateText: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
}

export interface SpatialMatchedTimelineNode {
  id: string;
  title: string;
  dateText: string | null;
  timelineTitle: string;
  timelineSlug: string;
  imageUrl: string | null;
}

export interface SpatialWebSource {
  title: string;
  uri: string;
  domain?: string;
  snippet?: string;
}

export interface SpatialRagCitation {
  title: string;
  subtitle?: string;
  href?: string;
}

export interface SpatialExploreResponse {
  prompt: string;
  periodLabel: string;
  text: string;
  prompts: string[];
  imageUrl: string | null;
  engine: ConceptCanvasEngine;
  matchedArticles: SpatialMatchedArticle[];
  matchedTimelineNodes: SpatialMatchedTimelineNode[];
  webSources: SpatialWebSource[];
  webSearchQueries?: string[];
  ragCitations?: SpatialRagCitation[];
}

export interface SpatialNodeVersion {
  periodLabel: string;
  text: string;
  prompts: string[];
  imageUrl: string | null;
  engine: ConceptCanvasEngine;
  matchedArticles: SpatialMatchedArticle[];
  matchedTimelineNodes: SpatialMatchedTimelineNode[];
  webSources: SpatialWebSource[];
  webSearchQueries?: string[];
  ragCitations?: SpatialRagCitation[];
  animateText: boolean;
}

export interface SpatialCanvasNode {
  id: string;
  parentId: string | null;
  prompt: string;
  x: number;
  y: number;
  loading: boolean;
  error: string | null;
  versions: SpatialNodeVersion[];
  versionIndex: number;
}

export interface ExploreConceptInput {
  prompt: string;
  parentTitle?: string;
  articleSlug?: string;
  excludePrompts?: string[];
  useGoogleSearch?: boolean;
}

const BRANCH_PALETTE: readonly MindmapBranchColor[] = [
  MindmapBranchColor.CRIMSON,
  MindmapBranchColor.GOLD,
  MindmapBranchColor.TEAL,
  MindmapBranchColor.NAVY,
  MindmapBranchColor.INDIGO,
  MindmapBranchColor.ORANGE,
];

export const ConceptCanvasApiService = {
  async explore(input: ExploreConceptInput): Promise<SpatialExploreResponse> {
    const res = await api.post<{ data: SpatialExploreResponse }>(
      CONCEPT_CANVAS_API.EXPLORE,
      input,
    );
    return res.data.data;
  },
};

function findMatchingCloseParen(text: string, openParenIdx: number): number {
  let depth = 0;
  for (let idx = openParenIdx; idx < text.length; idx += 1) {
    if (text[idx] === '(') depth += 1;
    else if (text[idx] === ')') {
      depth -= 1;
      if (depth === 0) return idx;
    }
  }
  return -1;
}

function tryConsumeConceptLabel(
  text: string,
  pos: number,
): { label: string; nextPos: number } | null {
  if (text[pos] !== '[') return null;
  const closeBracket = text.indexOf(']', pos + 1);
  if (closeBracket <= pos + 1 || text[closeBracket + 1] !== '(') return null;
  const closeParen = findMatchingCloseParen(text, closeBracket + 1);
  if (closeParen < 0) return null;
  return {
    label: text.slice(pos + 1, closeBracket),
    nextPos: closeParen + 1,
  };
}

export function stripConceptMarkdown(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const consumed = tryConsumeConceptLabel(text, i);
    if (consumed) {
      out += consumed.label;
      i = consumed.nextPos;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
}

export function computeNextSpatialPosition(
  existingNodes: readonly SpatialCanvasNode[],
  parentNode: SpatialCanvasNode | null,
  siblingIndex: number,
): { x: number; y: number } {
  if (!parentNode) {
    return { x: SPATIAL_LAYOUT.ROOT_X, y: SPATIAL_LAYOUT.ROOT_Y };
  }

  const targetX = parentNode.x + SPATIAL_LAYOUT.CHILD_OFFSET_X;
  const centeredSlot = siblingIndex - 1;
  let targetY = parentNode.y + centeredSlot * SPATIAL_LAYOUT.CHILD_SPREAD_Y;

  let safety = 0;
  while (
    safety < 25 &&
    existingNodes.some(
      (n) =>
        Math.abs(n.x - targetX) < SPATIAL_LAYOUT.OVERLAP_X_THRESHOLD &&
        Math.abs(n.y - targetY) < SPATIAL_LAYOUT.OVERLAP_Y_THRESHOLD,
    )
  ) {
    targetY += SPATIAL_LAYOUT.SHIFT_STEP_Y;
    safety += 1;
  }

  return { x: targetX, y: targetY };
}

export function removeSpatialSubtree(
  nodes: readonly SpatialCanvasNode[],
  targetId: string,
): SpatialCanvasNode[] {
  const toDelete = new Set<string>([targetId]);
  let added = true;
  while (added) {
    added = false;
    for (const node of nodes) {
      if (node.parentId && toDelete.has(node.parentId) && !toDelete.has(node.id)) {
        toDelete.add(node.id);
        added = true;
      }
    }
  }
  return nodes.filter((node) => !toDelete.has(node.id));
}

export function collectExploredPrompts(
  nodes: readonly SpatialCanvasNode[],
): string[] {
  return Array.from(new Set(nodes.map((n) => n.prompt.trim()).filter(Boolean))).slice(
    0,
    20,
  );
}

export function convertSpatialNodesToMindmapPayload(
  spatialNodes: readonly SpatialCanvasNode[],
): {
  title: string;
  periodLabel?: string;
  template: MindmapTemplateType;
  graph: MindmapGraph;
} {
  const validNodes = spatialNodes.filter((n) => n.versions.length > 0);
  const root = validNodes[0] ?? spatialNodes[0];
  const rootVersion = root?.versions[root.versionIndex];

  const nodes: MindmapNode[] = validNodes.map((sn, idx) => {
    const active = sn.versions[sn.versionIndex];
    const primaryArticle = active?.matchedArticles[0];
    const articleRefs: MindmapArticleRef[] = (active?.matchedArticles ?? []).map(
      (art) => ({
        id: art.id,
        slug: art.slug,
        title: art.title,
        coverImageUrl: art.coverImageUrl,
      }),
    );

    return {
      id: sn.id,
      x: Math.round(sn.x * 0.65),
      y: Math.round(sn.y * 0.65),
      title: sn.prompt,
      dateLabel: active?.periodLabel || undefined,
      badge: active?.matchedArticles[0]?.categoryName ?? undefined,
      note: active ? stripConceptMarkdown(active.text) : undefined,
      imageUrl: active?.imageUrl ?? undefined,
      shape: MindmapNodeShape.CARD,
      color: BRANCH_PALETTE[idx % BRANCH_PALETTE.length],
      articleRef: articleRefs[0],
      articleRefs: articleRefs.length > 0 ? articleRefs : undefined,
      tags: primaryArticle?.categoryName ? [primaryArticle.categoryName] : undefined,
    };
  });

  const validIds = new Set(nodes.map((n) => n.id));
  const edges: MindmapEdge[] = validNodes
    .filter((sn) => sn.parentId !== null && validIds.has(sn.parentId))
    .map((sn, idx) => ({
      id: `e-spatial-${idx + 1}`,
      fromId: sn.parentId ?? '',
      toId: sn.id,
    }));

  return {
    title: root?.prompt || 'Bản đồ khái niệm lịch sử',
    periodLabel: rootVersion?.periodLabel || undefined,
    template: MindmapTemplateType.TREE,
    graph: {
      nodes,
      edges,
      structure: MindmapStructure.LOGIC_CHART,
      mapTheme: MindmapMapTheme.HISGO_HERITAGE,
      theme: MindmapCanvasTheme.PAPER,
      edgeStyle: MindmapEdgeStyle.BEZIER,
      showGrid: true,
    },
  };
}

export async function downloadSpatialCanvasAsPng(
  spatialNodes: readonly SpatialCanvasNode[],
): Promise<void> {
  const payload = convertSpatialNodesToMindmapPayload(spatialNodes);
  const tree = buildMindmapTree(payload.graph);
  const layout = computeMindmapLayout({
    graph: payload.graph,
    tree,
    sizes: new Map(),
    structure: MindmapStructure.LOGIC_CHART,
    balancedBranches: true,
    edgeStyle: MindmapEdgeStyle.BEZIER,
  });
  const exported = await exportMindmapToPngFile({
    title: payload.title,
    periodLabel: payload.periodLabel,
    graph: payload.graph,
    tree,
    layout,
  });

  const anchor = document.createElement('a');
  anchor.href = exported.previewUrl;
  anchor.download = exported.file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(exported.previewUrl), 2000);
}
