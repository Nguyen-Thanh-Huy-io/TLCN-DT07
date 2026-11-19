import api from '@/services/api';
import type { PublicArticleSummary } from '@/services/public/public-content.service';
import {
  MINDMAP_API,
  MindmapAiEngine,
  MindmapBranchColor,
  MindmapCanvasTheme,
  MindmapEdgeStyle,
  MindmapNodeShape,
  MindmapNodeSize,
  MindmapTemplateType,
} from '../constants/mindmap.constants';

const unwrap = <T,>(res: { data: { data: T } }): T => res.data.data;

export interface MindmapArticleRef {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
}

export interface MindmapNode {
  id: string;
  x: number;
  y: number;
  title: string;
  badge?: string;
  note?: string;
  imageUrl?: string;
  isStickyNote?: boolean;
  shape?: MindmapNodeShape;
  size?: MindmapNodeSize;
  color: MindmapBranchColor;
  articleRef?: MindmapArticleRef;
  articleRefs?: MindmapArticleRef[];
}

export interface MindmapEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export interface MindmapGraph {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  theme?: MindmapCanvasTheme;
  edgeStyle?: MindmapEdgeStyle;
}

export interface MindmapSummary {
  id: string;
  title: string;
  periodLabel: string | null;
  template: MindmapTemplateType;
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MindmapDetail {
  id: string;
  title: string;
  periodLabel: string | null;
  template: MindmapTemplateType;
  graph: MindmapGraph;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedMindmapPreview {
  title: string;
  periodLabel?: string;
  template: MindmapTemplateType;
  graph: MindmapGraph;
  engine: MindmapAiEngine;
  noteCount: number;
  articleCount: number;
}

export const MindmapApiService = {
  async list(): Promise<MindmapSummary[]> {
    return unwrap(await api.get(MINDMAP_API.ROOT));
  },
  async get(id: string): Promise<MindmapDetail> {
    return unwrap(await api.get(MINDMAP_API.BY_ID(id)));
  },
  async create(input: {
    title: string;
    periodLabel?: string;
    template?: MindmapTemplateType;
    graph?: MindmapGraph;
  }): Promise<MindmapDetail> {
    return unwrap(await api.post(MINDMAP_API.ROOT, input));
  },
  async update(
    id: string,
    input: {
      title?: string;
      periodLabel?: string | null;
      template?: MindmapTemplateType;
      graph?: MindmapGraph;
    },
  ): Promise<MindmapDetail> {
    return unwrap(await api.patch(MINDMAP_API.BY_ID(id), input));
  },
  async remove(id: string): Promise<void> {
    await api.delete(MINDMAP_API.BY_ID(id));
  },
  async generatePreview(input: {
    articleIds?: string[];
    includeNotes?: boolean;
  }): Promise<GeneratedMindmapPreview> {
    return unwrap(await api.post(MINDMAP_API.GENERATE_PREVIEW, input));
  },
  async searchArticles(query: string): Promise<PublicArticleSummary[]> {
    const res = await api.get<{ data: PublicArticleSummary[] }>(
      MINDMAP_API.PUBLIC_ARTICLES,
      { params: { q: query.trim() || undefined, limit: 8 } },
    );
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
};
