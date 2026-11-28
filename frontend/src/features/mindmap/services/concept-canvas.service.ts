import api from '@/services/api';
import {
  downloadSpatialCanvasAsPng,
  exportConceptCanvasPoster,
  stripConceptMarkdown,
} from '../utils/concept-canvas-poster.util';
import {
  convertSpatialToSemanticMindmap,
  convertSpatialToSemanticMindmap as convertSpatialNodesToMindmapPayload,
} from '../utils/concept-to-mindmap.adapter';

export {
  convertSpatialNodesToMindmapPayload,
  convertSpatialToSemanticMindmap,
  downloadSpatialCanvasAsPng,
  exportConceptCanvasPoster,
  stripConceptMarkdown,
};

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

export const ConceptCanvasApiService = {
  async explore(input: ExploreConceptInput): Promise<SpatialExploreResponse> {
    const res = await api.post<{ data: SpatialExploreResponse }>(
      CONCEPT_CANVAS_API.EXPLORE,
      input,
    );
    return res.data.data;
  },
};

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

