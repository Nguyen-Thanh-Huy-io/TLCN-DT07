import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { GenerateMindmapDto } from './dto/mindmap.dto';
import {
  MINDMAP_LIMITS,
  MINDMAP_MESSAGES,
  MindmapAiEngine,
  MindmapBranchColor,
  MindmapTemplateType,
} from './mindmap.constant';
import {
  MindmapEdgeData,
  MindmapGraphData,
  MindmapNodeData,
} from './mindmap-template.strategy';

export interface GeneratedMindmapPreview {
  title: string;
  periodLabel?: string;
  template: MindmapTemplateType;
  graph: MindmapGraphData;
  engine: MindmapAiEngine;
  noteCount: number;
  articleCount: number;
}

const BRANCH_COLORS: readonly MindmapBranchColor[] = [
  MindmapBranchColor.GOLD,
  MindmapBranchColor.TEAL,
  MindmapBranchColor.INDIGO,
  MindmapBranchColor.STONE,
];

const AI_SYSTEM_PROMPT = `Bạn là trợ lý học Lịch sử Việt Nam của HISGO.
Nhiệm vụ: từ ghi chú và bài viết đã lưu của người học, hãy tạo một Sơ đồ tư duy (Mindmap) dạng đồ thị gồm nodes và edges.
- Đặt sự kiện/chủ đề chính ở node đầu tiên (id: "n-root", x: 420, y: 240, color: "CRIMSON").
- Tỏa các nhánh chính ra xung quanh (tối đa 5-6 nhánh chính, mỗi nhánh 1-2 nhánh con), toạ độ x từ 60..900, y từ 60..500 sao cho không đè lên nhau.
- Từ khoá ngắn gọn (tên mốc, địa danh, nhân vật, kết quả).
- Trả về đúng JSON thuần túy (không markdown):
{
  "title": "Tên sơ đồ ngắn gọn",
  "periodLabel": "Niên đại nếu có",
  "nodes": [{ "id": "n-root", "x": 420, "y": 240, "title": "...", "badge": "...", "note": "...", "color": "CRIMSON|GOLD|TEAL|INDIGO|STONE" }],
  "edges": [{ "id": "e-1", "fromId": "n-root", "toId": "n-1", "label": "..." }]
}`;

function extractHeadingsFromHtml(html: string): string[] {
  const headings: string[] = [];
  for (const m of html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)) {
    const clean = m[1].replace(/<[^>]+>/g, '').trim();
    if (clean) headings.push(clean);
  }
  return headings;
}

function extractHeadingsFromBlock(block: Record<string, unknown>): string[] {
  const headings: string[] = [];
  if (
    block.type === 'HEADING' &&
    typeof block.text === 'string' &&
    block.text.trim()
  ) {
    headings.push(block.text.trim());
  }
  if (typeof block.content === 'string') {
    headings.push(...extractHeadingsFromHtml(block.content));
  }
  return headings;
}

function extractHeadingsFromBlocks(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) return [];
  const headings: string[] = [];
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    headings.push(...extractHeadingsFromBlock(b as Record<string, unknown>));
  }
  return headings.slice(0, 6);
}

@Injectable()
export class MindmapAiService {
  private readonly logger = new Logger(MindmapAiService.name);

  constructor(private readonly prisma: PrismaService) {}

  private fetchSources(userId: string, dto: GenerateMindmapDto) {
    const includeNotes = dto.includeNotes ?? true;
    const articleIds = dto.articleIds ?? [];

    return Promise.all([
      includeNotes
        ? this.prisma.note.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: MINDMAP_LIMITS.MAX_AI_NOTES,
            select: {
              id: true,
              title: true,
              content: true,
              highlightText: true,
            },
          })
        : Promise.resolve([]),
      articleIds.length > 0
        ? this.prisma.article.findMany({
            where: { id: { in: articleIds }, status: ContentStatus.PUBLISHED },
            take: MINDMAP_LIMITS.MAX_AI_ARTICLES,
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              dateText: true,
              contentBlocks: true,
            },
          })
        : Promise.resolve([]),
    ]);
  }

  async generatePreview(
    userId: string,
    dto: GenerateMindmapDto,
  ): Promise<GeneratedMindmapPreview> {
    const [notes, articles] = await this.fetchSources(userId, dto);

    if (notes.length === 0 && articles.length === 0) {
      throw new BadRequestException(MINDMAP_MESSAGES.NO_AI_SOURCES);
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      const ai = await this.callGemini(notes, articles, apiKey);
      if (ai) {
        return {
          ...ai,
          template: MindmapTemplateType.SPIDER,
          engine: MindmapAiEngine.GEMINI_FLASH,
          noteCount: notes.length,
          articleCount: articles.length,
        };
      }
    }

    const fallback = this.buildHeuristicGraph(notes, articles);
    return {
      ...fallback,
      template: MindmapTemplateType.TREE,
      engine: MindmapAiEngine.HEURISTIC,
      noteCount: notes.length,
      articleCount: articles.length,
    };
  }

  private async callGemini(
    notes: Array<{
      id: string;
      title: string | null;
      content: string;
      highlightText: string | null;
    }>,
    articles: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      dateText: string | null;
      contentBlocks: unknown;
    }>,
    apiKey: string,
  ): Promise<{
    title: string;
    periodLabel?: string;
    graph: MindmapGraphData;
  } | null> {
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const context = [
      articles.length
        ? 'BÀI VIẾT:\n' +
          articles
            .map(
              (a) => `- ${a.title} (${a.dateText ?? ''}): ${a.summary ?? ''}`,
            )
            .join('\n')
        : '',
      notes.length
        ? 'GHI CHÚ:\n' +
          notes
            .map((n) => `- ${n.highlightText || n.title || ''}: ${n.content}`)
            .join('\n')
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      MINDMAP_LIMITS.AI_TIMEOUT_MS,
    );
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
          contents: [
            { role: 'user', parts: [{ text: context.slice(0, 6000) }] },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) return null;
      const parsed = JSON.parse(
        raw
          .replace(/^```json\s*/i, '')
          .replace(/```$/i, '')
          .trim(),
      ) as {
        title?: string;
        periodLabel?: string;
        nodes?: MindmapNodeData[];
        edges?: MindmapEdgeData[];
      };
      if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0)
        return null;
      return {
        title: (parsed.title || 'Sơ đồ tư duy AI').slice(
          0,
          MINDMAP_LIMITS.MAX_TITLE_LENGTH,
        ),
        periodLabel: parsed.periodLabel?.slice(
          0,
          MINDMAP_LIMITS.MAX_PERIOD_LENGTH,
        ),
        graph: {
          nodes: parsed.nodes,
          edges: Array.isArray(parsed.edges) ? parsed.edges : [],
        },
      };
    } catch (error) {
      this.logger.warn(`Mindmap Gemini fallback: ${String(error)}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHeuristicGraph(
    notes: Array<{
      id: string;
      title: string | null;
      content: string;
      highlightText: string | null;
    }>,
    articles: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      dateText: string | null;
      contentBlocks: unknown;
    }>,
  ): { title: string; periodLabel?: string; graph: MindmapGraphData } {
    const mainTitle =
      articles.length === 1 ? articles[0].title : 'Tổng hợp Tư liệu & Ghi chú';
    const periodLabel =
      articles.length === 1 ? (articles[0].dateText ?? undefined) : undefined;

    const nodes: MindmapNodeData[] = [
      {
        id: 'n-root',
        x: 60,
        y: 260,
        title: mainTitle.slice(0, 80),
        badge: periodLabel || 'Trung tâm',
        color: MindmapBranchColor.CRIMSON,
      },
    ];
    const edges: MindmapEdgeData[] = [];

    let branchIdx = 0;
    const addBranch = (
      title: string,
      badge: string,
      note?: string,
      articleRef?: { id: string; slug: string; title: string },
    ) => {
      const id = `n-${branchIdx + 1}`;
      const y = 60 + branchIdx * 115;
      nodes.push({
        id,
        x: 420,
        y,
        title: title.slice(0, 70),
        badge,
        ...(note ? { note: note.slice(0, 220) } : {}),
        ...(articleRef ? { articleRef } : {}),
        color: BRANCH_COLORS[branchIdx % BRANCH_COLORS.length],
      });
      edges.push({ id: `e-${branchIdx + 1}`, fromId: 'n-root', toId: id });
      branchIdx += 1;
    };

    for (const art of articles.slice(0, 4)) {
      const headings = extractHeadingsFromBlocks(art.contentBlocks);
      if (articles.length === 1 && headings.length > 0) {
        headings.slice(0, 5).forEach((h) => addBranch(h, 'Đề mục'));
      } else {
        addBranch(
          art.title,
          art.dateText || 'Bài viết',
          art.summary ?? undefined,
          {
            id: art.id,
            slug: art.slug,
            title: art.title,
          },
        );
      }
    }

    for (const n of notes.slice(0, Math.max(0, 6 - branchIdx))) {
      const label = (n.highlightText || n.title || n.content).trim();
      if (!label) continue;
      addBranch(label, 'Ghi chú', n.content || undefined);
    }

    return {
      title: mainTitle.slice(0, MINDMAP_LIMITS.MAX_TITLE_LENGTH),
      periodLabel,
      graph: { nodes, edges },
    };
  }
}
