import {
  MindmapBranchColor,
  MindmapCanvasTheme,
  MindmapEdgeStyle,
  MindmapMapTheme,
  MindmapNodeShape,
  MindmapStructure,
  MindmapTemplateType,
} from '../constants/mindmap.constants';
import type {
  MindmapArticleRef,
  MindmapEdge,
  MindmapGraph,
  MindmapNode,
} from '../services/mindmap.service';
import type { SpatialCanvasNode } from '../services/concept-canvas.service';
import { stripConceptMarkdown } from './concept-canvas-poster.util';

const BRANCH_PALETTE: readonly MindmapBranchColor[] = [
  MindmapBranchColor.CRIMSON,
  MindmapBranchColor.GOLD,
  MindmapBranchColor.TEAL,
  MindmapBranchColor.NAVY,
  MindmapBranchColor.INDIGO,
  MindmapBranchColor.ORANGE,
];

const SUB_NODE_X_OFFSET = 320;
const SUB_NODE_Y_SPREAD = 90;
const MAX_AUTO_SUB_NODES = 4;
const MIN_SENTENCE_LEN = 12;
const MAX_TITLE_LEN = 80;

interface ExtractedKeyPoint {
  title: string;
  detail?: string;
  badge?: string;
}

const HISTORICAL_DIMENSION_PATTERNS: ReadonlyArray<{
  regex: RegExp;
  badge: string;
  defaultTitle: string;
}> = [
  {
    regex: /(?:hang|địa điểm|vị trí|phát hiện tại|khai quật tại|thuộc địa phận|lạng sơn|hang thẩm)/i,
    badge: 'Địa điểm & Di chỉ',
    defaultTitle: 'Vị trí & Địa tầng khai quật',
  },
  {
    regex: /(?:hóa thạch|răng|di cốt|người cổ|homo erectus|vượn|xương|công cụ đá)/i,
    badge: 'Hiện vật & Di cốt',
    defaultTitle: 'Di cốt & Hiện vật khảo cổ',
  },
  {
    regex: /(?:niên đại|cách ngày nay|vạn năm|pleistocene|thời đại đá|thế canh tân)/i,
    badge: 'Niên đại & Thời kỳ',
    defaultTitle: 'Niên đại địa tầng & Thời kỳ',
  },
  {
    regex: /(?:ý nghĩa|chứng minh|khẳng định|giá trị|nguồn gốc|cái nôi)/i,
    badge: 'Ý nghĩa Lịch sử',
    defaultTitle: 'Giá trị khoa học & Sử học',
  },
];

function cleanSentence(sentence: string): string {
  return stripConceptMarkdown(sentence)
    .replace(/^[-*•\d.)\s]+/, '')
    .trim();
}

function truncateTitle(text: string, maxLen = MAX_TITLE_LEN): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 20 ? `${cut.slice(0, lastSpace)}...` : `${cut}...`;
}

function extractKeyPointsFromMarkdown(rawText: string): ExtractedKeyPoint[] {
  const clean = stripConceptMarkdown(rawText);
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^[-*•\d.)]/.test(l));

  if (bulletLines.length >= 2) {
    return bulletLines.slice(0, MAX_AUTO_SUB_NODES).map((line) => {
      const text = cleanSentence(line);
      const colonIdx = text.indexOf(':');
      if (colonIdx > 2 && colonIdx < 45) {
        return {
          title: text.slice(0, colonIdx).trim(),
          detail: text.slice(colonIdx + 1).trim(),
        };
      }
      return { title: truncateTitle(text) };
    });
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter((s) => s.length >= MIN_SENTENCE_LEN);

  if (sentences.length === 0) return [];

  const points: ExtractedKeyPoint[] = [];
  const usedSentences = new Set<number>();

  for (const dim of HISTORICAL_DIMENSION_PATTERNS) {
    const foundIdx = sentences.findIndex(
      (s, idx) => !usedSentences.has(idx) && dim.regex.test(s),
    );
    if (foundIdx >= 0) {
      usedSentences.add(foundIdx);
      points.push({
        title: dim.defaultTitle,
        detail: sentences[foundIdx],
        badge: dim.badge,
      });
    }
  }

  if (points.length < 2) {
    sentences.slice(0, MAX_AUTO_SUB_NODES).forEach((s, idx) => {
      if (!usedSentences.has(idx) && points.length < MAX_AUTO_SUB_NODES) {
        points.push({ title: truncateTitle(s, 60), detail: s });
      }
    });
  }

  return points.slice(0, MAX_AUTO_SUB_NODES);
}

function buildArticleRefs(node: SpatialCanvasNode): MindmapArticleRef[] {
  const active = node.versions[node.versionIndex];
  if (!active?.matchedArticles) return [];
  return active.matchedArticles.map((art) => ({
    id: art.id,
    slug: art.slug,
    title: art.title,
    coverImageUrl: art.coverImageUrl,
  }));
}

export function convertSpatialToSemanticMindmap(
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

  const nodes: MindmapNode[] = [];
  const edges: MindmapEdge[] = [];
  const allArticleRefs: MindmapArticleRef[] = [];

  validNodes.forEach((sn, nodeIdx) => {
    const active = sn.versions[sn.versionIndex];
    const primaryArticle = active?.matchedArticles[0];
    const articleRefs = buildArticleRefs(sn);
    allArticleRefs.push(...articleRefs);

    const baseColor = BRANCH_PALETTE[nodeIdx % BRANCH_PALETTE.length];
    const cleanNote = active ? stripConceptMarkdown(active.text) : undefined;

    nodes.push({
      id: sn.id,
      x: Math.round(sn.x * 0.75),
      y: Math.round(sn.y * 0.75),
      title: sn.prompt,
      dateLabel: active?.periodLabel || undefined,
      badge: primaryArticle?.categoryName ?? (nodeIdx === 0 ? 'Khái niệm trung tâm' : undefined),
      note: cleanNote,
      imageUrl: active?.imageUrl ?? undefined,
      shape: MindmapNodeShape.CARD,
      color: baseColor,
      articleRef: articleRefs[0],
      articleRefs: articleRefs.length > 0 ? articleRefs : undefined,
      tags: primaryArticle?.categoryName ? [primaryArticle.categoryName] : undefined,
    });

    if (sn.parentId && validNodes.some((n) => n.id === sn.parentId)) {
      edges.push({
        id: `e-spatial-${sn.parentId}-${sn.id}`,
        fromId: sn.parentId,
        toId: sn.id,
      });
    }

    if (active?.text && validNodes.length <= 4) {
      const keyPoints = extractKeyPointsFromMarkdown(active.text);
      const halfCount = (keyPoints.length - 1) / 2;

      keyPoints.forEach((point, pIdx) => {
        const subId = `${sn.id}-sub-${pIdx + 1}`;
        const subY = Math.round(sn.y * 0.75 + (pIdx - halfCount) * SUB_NODE_Y_SPREAD);
        const subX = Math.round(sn.x * 0.75 + SUB_NODE_X_OFFSET);

        nodes.push({
          id: subId,
          x: subX,
          y: subY,
          title: point.title,
          badge: point.badge,
          note: point.detail,
          shape: MindmapNodeShape.PILL,
          color: baseColor,
        });

        edges.push({
          id: `e-sub-${sn.id}-${subId}`,
          fromId: sn.id,
          toId: subId,
        });
      });
    }
  });

  const dedupedArticles = Array.from(
    new Map(allArticleRefs.map((a) => [a.id, a])).values(),
  );

  if (nodes.length > 0 && dedupedArticles.length > 0) {
    nodes[0] = {
      ...nodes[0],
      articleRefs: dedupedArticles,
    };
  }

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
