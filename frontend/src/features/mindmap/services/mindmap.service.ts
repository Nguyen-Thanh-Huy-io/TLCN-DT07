import type { TextStyleValue } from '@/components/common/TextStyleControls';
import { emitGamificationRefresh } from '@/features/gamification/services/gamification.service';
import api from '@/services/api';
import type {
  PublicArticleDetail,
  PublicArticleSummary,
} from '@/services/public/public-content.service';
import {
  MINDMAP_API,
  MindmapAiEngine,
  MindmapBorderStyle,
  MindmapBranchColor,
  MindmapBranchSide,
  MindmapCanvasTheme,
  MindmapEdgeStyle,
  MindmapImageHeight,
  MindmapMapTheme,
  MindmapMarkerId,
  MindmapNodeShape,
  MindmapNodeSize,
  MindmapStructure,
  MindmapTemplateType,
} from '../constants/mindmap.constants';

const unwrap = <T,>(res: { data: { data: T } }): T => res.data.data;

export interface MindmapArticleRef {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
}

export interface MindmapNodeStyle extends TextStyleValue {
  borderRadius?: number;
  fillColor?: string;
  borderStyle?: MindmapBorderStyle;
  borderColor?: string;
  borderWidth?: number;
  childEdgeStyle?: MindmapEdgeStyle;
  childStrokeStyle?: MindmapBorderStyle;
  childStrokeColor?: string;
  childStrokeWidth?: number;
}

export interface MindmapNode {
  id: string;
  x: number;
  y: number;
  title: string;
  badge?: string;
  dateLabel?: string;
  note?: string;
  imageUrl?: string;
  imageHeight?: MindmapImageHeight;
  markers?: MindmapMarkerId[];
  tags?: string[];
  externalUrl?: string;
  style?: MindmapNodeStyle;
  isStickyNote?: boolean;
  showNoteInline?: boolean;
  collapsed?: boolean;
  side?: MindmapBranchSide;
  shape?: MindmapNodeShape;
  size?: MindmapNodeSize;
  color: MindmapBranchColor;
  colorOverride?: MindmapBranchColor;
  articleRef?: MindmapArticleRef;
  articleRefs?: MindmapArticleRef[];
}

export interface MindmapEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  isCrossLink?: boolean;
}

export interface MindmapGraph {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  structure?: MindmapStructure;
  mapTheme?: MindmapMapTheme;
  balancedBranches?: boolean;
  customBgColor?: string;
  showGrid?: boolean;
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
    const created = unwrap<MindmapDetail>(await api.post(MINDMAP_API.ROOT, input));
    emitGamificationRefresh();
    return created;
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
      { params: { q: query.trim() || undefined, limit: 12 } },
    );
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
  async getArticleDetail(slug: string): Promise<PublicArticleDetail | null> {
    const res = await api.get<{ data?: PublicArticleDetail } | PublicArticleDetail>(
      MINDMAP_API.PUBLIC_ARTICLE_BY_SLUG(slug),
    );
    const payload = res.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data ?? null;
    }
    return (payload as PublicArticleDetail) ?? null;
  },
};
