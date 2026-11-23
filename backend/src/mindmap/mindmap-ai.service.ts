import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { GoogleAiService } from '../common/services/google-ai.service';
import { PrismaService } from '../common/services/prisma.service';
import { GenerateMindmapDto } from './dto/mindmap.dto';
import {
  MINDMAP_LIMITS,
  MINDMAP_MESSAGES,
  MindmapAiEngine,
  MindmapBranchColor,
  MindmapMapTheme,
  MindmapStructure,
  MindmapTemplateType,
} from './mindmap.constant';
import {
  MindmapArticleRef,
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

interface SourceNoteItem {
  id: string;
  title: string | null;
  content: string;
  highlightText: string | null;
}

interface SourceArticleItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  dateText: string | null;
  contentBlocks: unknown;
}

interface RawGeminiNode {
  id?: unknown;
  x?: unknown;
  y?: unknown;
  title?: unknown;
  badge?: unknown;
  dateLabel?: unknown;
  note?: unknown;
  color?: unknown;
}

interface RawGeminiEdge {
  id?: unknown;
  fromId?: unknown;
  toId?: unknown;
  label?: unknown;
}

interface ExistingCanvasContext {
  isBlankDefault: boolean;
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
  rootId: string;
  focusNodeId: string;
  focusNodeTitle: string;
}

const DEFAULT_PLACEHOLDER_TITLES = new Set([
  'chủ đề mới',
  'chủ đề chính',
  'chủ đề trung tâm',
  'ý tưởng mới',
  'ghi chú nhanh',
]);

const BRANCH_COLORS: readonly MindmapBranchColor[] = [
  MindmapBranchColor.GOLD,
  MindmapBranchColor.TEAL,
  MindmapBranchColor.INDIGO,
  MindmapBranchColor.STONE,
];

const AI_SYSTEM_PROMPT = `Bạn là trợ lý thiết kế Sơ đồ tư duy Lịch sử Việt Nam chuyên nghiệp của nền tảng HISGO (tương tự Canva Magic Write / XMind AI Co-Pilot).
Nhiệm vụ: từ yêu cầu / đoạn văn bản sử liệu người học nhập vào ("Bạn muốn xây dựng cái gì?") và NGỮ CẢNH SƠ ĐỒ HIỆN TẠI trên Canvas (nếu người học đã vẽ dở một số node), hãy thiết kế hoặc mở rộng tiếp Sơ đồ tư duy chuẩn xác theo Sách giáo khoa Lịch sử Việt Nam (GDPT 2018) và chính sử.

QUY TẮC QUAN TRỌNG VỀ NGỮ CẢNH CANVAS HIỆN TẠI:
1. Nếu người học ĐÃ SOẠN SẴN các node có nội dung trên Canvas:
   - BẮT BUỘC GIỮ NGUYÊN toàn bộ các node và edges mà người học đã soạn (giữ đúng "id" và "title" cũ của họ trong mảng "nodes" và "edges" trả về).
   - Đọc kỹ các nhánh người học đã viết để KHÔNG SINH TRÙNG LẶP và bổ sung/phát triển tiếp các nhánh mới còn thiếu (hoặc triển khai sâu nhánh con cho "Node đang được người học chọn" nếu họ yêu cầu mở rộng nhánh đó).
   - Nối các node mới tạo vào đúng "fromId" của node cha tương ứng trong đồ thị hiện có.
2. Nếu Canvas đang mới tinh (chưa có nội dung thực tế):
   - Dựng cây sơ đồ tư duy phân cấp 3 tầng hoàn chỉnh: Node trung tâm (id: "n-root", color: "CRIMSON") -> 4-5 nhánh chính (xoay vòng màu "GOLD", "TEAL", "INDIGO", "STONE") -> mỗi nhánh chính có 2-3 nhánh con chi tiết kèm "dateLabel" (năm/niên đại) và "note" (giải thích ngắn gọn 1-2 câu).
3. Trả về đúng JSON thuần túy (không markdown):
{
  "title": "Tên sơ đồ tư duy ngắn gọn (tối đa 70 ký tự)",
  "periodLabel": "Niên đại lịch sử (VD: 1225 – 1400)",
  "nodes": [
    {
      "id": "n-root",
      "x": 420,
      "y": 240,
      "title": "...",
      "badge": "...",
      "dateLabel": "...",
      "note": "...",
      "color": "CRIMSON|GOLD|TEAL|INDIGO|STONE"
    }
  ],
  "edges": [
    { "id": "e-1", "fromId": "n-root", "toId": "n-1", "label": "..." }
  ]
}`;

function isPlaceholderTitle(title: string): boolean {
  return DEFAULT_PLACEHOLDER_TITLES.has(title.trim().toLowerCase());
}

function parseRawCanvasNodes(rawNodes: unknown): MindmapNodeData[] {
  if (!Array.isArray(rawNodes)) return [];
  const nodes: MindmapNodeData[] = [];
  for (const item of rawNodes) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== 'string' || typeof rec.title !== 'string') continue;
    nodes.push({
      ...(rec as unknown as MindmapNodeData),
      id: rec.id,
      title: rec.title.trim(),
      x: typeof rec.x === 'number' ? rec.x : 420,
      y: typeof rec.y === 'number' ? rec.y : 240,
      color: resolveBranchColor(rec.color, nodes.length),
    });
  }
  return nodes;
}

function parseRawCanvasEdges(
  rawEdges: unknown,
  nodeIds: Set<string>,
): MindmapEdgeData[] {
  if (!Array.isArray(rawEdges)) return [];
  const edges: MindmapEdgeData[] = [];
  for (const item of rawEdges) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id : '';
    const fromId = typeof rec.fromId === 'string' ? rec.fromId : '';
    const toId = typeof rec.toId === 'string' ? rec.toId : '';
    if (id && nodeIds.has(fromId) && nodeIds.has(toId)) {
      edges.push({ ...(rec as unknown as MindmapEdgeData), id, fromId, toId });
    }
  }
  return edges;
}

function parseExistingCanvasContext(
  rawGraph: Record<string, unknown> | undefined,
  selectedNodeId?: string,
): ExistingCanvasContext {
  const empty: ExistingCanvasContext = {
    isBlankDefault: true,
    nodes: [],
    edges: [],
    rootId: 'n-root',
    focusNodeId: 'n-root',
    focusNodeTitle: '',
  };
  if (!rawGraph || typeof rawGraph !== 'object') return empty;

  const nodes = parseRawCanvasNodes(rawGraph.nodes);
  if (nodes.length === 0) return empty;

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = parseRawCanvasEdges(rawGraph.edges, nodeIds);
  const isBlankDefault = !nodes.some((n) => !isPlaceholderTitle(n.title));
  const focusNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  return {
    isBlankDefault,
    nodes,
    edges,
    rootId: nodes[0].id,
    focusNodeId: focusNode.id,
    focusNodeTitle: focusNode.title,
  };
}

function shouldKeepExistingNode(
  node: MindmapNodeData,
  ctx: ExistingCanvasContext,
): boolean {
  if (node.id === ctx.rootId || !isPlaceholderTitle(node.title)) return true;
  return ctx.edges.some((e) => e.fromId === node.id);
}

function appendAiEdgesToMerged(
  mergedEdges: MindmapEdgeData[],
  aiEdges: MindmapEdgeData[],
  idRemap: Map<string, string>,
  validNodeIds: Set<string>,
  seedSeq: number,
): void {
  const edgeKeys = new Set(mergedEdges.map((e) => `${e.fromId}->${e.toId}`));
  let seq = seedSeq;

  for (const aiEdge of aiEdges) {
    const fromId = idRemap.get(aiEdge.fromId) ?? aiEdge.fromId;
    const toId = idRemap.get(aiEdge.toId) ?? aiEdge.toId;
    const key = `${fromId}->${toId}`;
    if (
      fromId === toId ||
      !validNodeIds.has(fromId) ||
      !validNodeIds.has(toId) ||
      edgeKeys.has(key)
    ) {
      continue;
    }
    seq += 1;
    edgeKeys.add(key);
    mergedEdges.push({ ...aiEdge, id: `e-ai-${seq}`, fromId, toId });
  }
}

function mergePreservingExistingGraph(
  ctx: ExistingCanvasContext,
  aiNodes: MindmapNodeData[],
  aiEdges: MindmapEdgeData[],
): { nodes: MindmapNodeData[]; edges: MindmapEdgeData[] } {
  if (ctx.isBlankDefault) {
    return { nodes: aiNodes, edges: aiEdges };
  }

  const mergedNodes = new Map<string, MindmapNodeData>();
  const existingTitles = new Map<string, string>();

  for (const existing of ctx.nodes) {
    if (!shouldKeepExistingNode(existing, ctx)) continue;
    mergedNodes.set(existing.id, existing);
    existingTitles.set(existing.title.toLowerCase(), existing.id);
  }

  const rootExisting = mergedNodes.get(ctx.rootId);
  const aiRoot = aiNodes[0];
  if (rootExisting && isPlaceholderTitle(rootExisting.title) && aiRoot) {
    mergedNodes.set(ctx.rootId, { ...rootExisting, title: aiRoot.title });
  }

  const idRemap = new Map<string, string>();
  if (aiRoot) idRemap.set(aiRoot.id, ctx.rootId);

  let newSeq = Date.now() % 100000;
  for (const aiNode of aiNodes) {
    const existingId =
      (mergedNodes.has(aiNode.id) ? aiNode.id : undefined) ??
      existingTitles.get(aiNode.title.toLowerCase());
    if (existingId) {
      idRemap.set(aiNode.id, existingId);
      continue;
    }
    newSeq += 1;
    const safeId = `n-ai-${newSeq}`;
    idRemap.set(aiNode.id, safeId);
    mergedNodes.set(safeId, { ...aiNode, id: safeId });
    existingTitles.set(aiNode.title.toLowerCase(), safeId);
  }

  const validNodeIds = new Set(mergedNodes.keys());
  const mergedEdges = ctx.edges.filter(
    (e) => validNodeIds.has(e.fromId) && validNodeIds.has(e.toId),
  );
  appendAiEdgesToMerged(mergedEdges, aiEdges, idRemap, validNodeIds, newSeq);

  return {
    nodes: Array.from(mergedNodes.values()),
    edges: mergedEdges,
  };
}

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
  return headings.slice(0, 4);
}

function resolveBranchColor(
  rawColor: unknown,
  fallbackIdx: number,
): MindmapBranchColor {
  const valid = Object.values(MindmapBranchColor) as string[];
  if (typeof rawColor === 'string' && valid.includes(rawColor)) {
    return rawColor as MindmapBranchColor;
  }
  return BRANCH_COLORS[fallbackIdx % BRANCH_COLORS.length];
}

function findMatchingArticleRef(
  nodeTitle: string,
  articles: SourceArticleItem[],
): MindmapArticleRef | undefined {
  const clean = nodeTitle.toLowerCase().trim();
  if (clean.length < 4) return undefined;
  const found = articles.find(
    (a) =>
      a.title.toLowerCase().includes(clean) ||
      clean.includes(a.title.toLowerCase()),
  );
  if (!found) return undefined;
  return { id: found.id, slug: found.slug, title: found.title };
}

function extractCleanRootTitle(prompt: string): string {
  const firstClause = prompt.split(/[:\n.?!]/)[0]?.trim() ?? '';
  const stripped = firstClause
    .replace(
      /^(?:hãy\s+)?(?:phân tích|xây dựng|hệ thống hóa|tóm tắt|vẽ|tạo|lập|mở rộng)\s+(?:sơ đồ tư duy\s+(?:về\s+)?|nhánh\s+|chi tiết\s+|về\s+)?/i,
      '',
    )
    .trim();
  const base = stripped || firstClause;
  if (!base) return '';
  return (base.charAt(0).toUpperCase() + base.slice(1)).slice(0, 68);
}

function extractSentencesOrBullets(prompt: string): string[] {
  return prompt
    .split(/[\n.;,•:]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 5)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .slice(0, 9);
}

function appendArticleBranches(
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[],
  articles: SourceArticleItem[],
): void {
  articles.forEach((art, idx) => {
    const branchId = `n-art-${idx + 1}`;
    const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
    const angle = (idx / Math.max(1, articles.length)) * Math.PI * 2;
    const bx = Math.round(420 + Math.cos(angle) * 250);
    const by = Math.round(240 + Math.sin(angle) * 160);

    nodes.push({
      id: branchId,
      x: bx,
      y: by,
      title: art.title.slice(0, 70),
      badge: 'Tư liệu HISGO',
      dateLabel: art.dateText ?? undefined,
      note: art.summary?.slice(0, 240) ?? undefined,
      color,
      articleRef: { id: art.id, slug: art.slug, title: art.title },
    });
    edges.push({ id: `e-art-${idx + 1}`, fromId: 'n-root', toId: branchId });

    const headings = extractHeadingsFromBlocks(art.contentBlocks);
    headings.slice(0, 3).forEach((h, hIdx) => {
      const subId = `${branchId}-sub-${hIdx + 1}`;
      nodes.push({
        id: subId,
        x: bx + (bx >= 420 ? 150 : -150),
        y: by + (hIdx - 1) * 65,
        title: h.slice(0, 65),
        color,
      });
      edges.push({ id: `e-${subId}`, fromId: branchId, toId: subId });
    });
  });
}

function appendNoteBranches(
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[],
  notes: SourceNoteItem[],
): void {
  if (notes.length === 0) return;
  const groupNodeId = 'n-notes-group';
  nodes.push({
    id: groupNodeId,
    x: 140,
    y: 380,
    title: 'Ghi chú & Đánh dấu cá nhân',
    badge: `${notes.length} ghi chú`,
    color: MindmapBranchColor.TEAL,
  });
  edges.push({ id: 'e-notes-group', fromId: 'n-root', toId: groupNodeId });

  notes.slice(0, 5).forEach((note, idx) => {
    const label = (note.title || note.highlightText || note.content)
      .trim()
      .slice(0, 65);
    if (!label) return;
    const noteId = `n-note-${idx + 1}`;
    nodes.push({
      id: noteId,
      x: 40,
      y: 280 + idx * 60,
      title: label,
      note: note.content.slice(0, 240),
      color: MindmapBranchColor.TEAL,
    });
    edges.push({ id: `e-note-${idx + 1}`, fromId: groupNodeId, toId: noteId });
  });
}

function appendFocusedBranchExpansion(
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[],
  prompt: string,
  attachToParentId: string,
): void {
  const parentNode = nodes.find((n) => n.id === attachToParentId);
  const parentColor = parentNode?.color ?? MindmapBranchColor.GOLD;
  const rawPoints = extractSentencesOrBullets(prompt);
  const branchItems =
    rawPoints.length > 1
      ? rawPoints.slice(1, 5)
      : rawPoints.length === 1
        ? [
            `${rawPoints[0]} — Ý chính 1`,
            `${rawPoints[0]} — Ý chính 2`,
            `${rawPoints[0]} — Ý nghĩa & Liên hệ`,
          ]
        : ['Chi tiết mở rộng 1', 'Chi tiết mở rộng 2'];

  const stamp = Date.now().toString(36).slice(-4);
  branchItems.forEach((item, idx) => {
    const childId = `${attachToParentId}-ext-${stamp}-${idx + 1}`;
    nodes.push({
      id: childId,
      x: (parentNode?.x ?? 420) + 180,
      y: (parentNode?.y ?? 240) + (idx - 1) * 70,
      title: item.slice(0, 65),
      note: item,
      color: parentColor,
    });
    edges.push({
      id: `e-${childId}`,
      fromId: attachToParentId,
      toId: childId,
    });
  });
}

function appendPromptStructuredBranches(
  nodes: MindmapNodeData[],
  edges: MindmapEdgeData[],
  prompt: string,
  rootTitle: string,
  attachToParentId = 'n-root',
): void {
  if (attachToParentId !== 'n-root') {
    appendFocusedBranchExpansion(nodes, edges, prompt, attachToParentId);
    return;
  }
  const pillars: Array<{
    id: string;
    title: string;
    badge: string;
    note: string;
    color: MindmapBranchColor;
    children: Array<{ title: string; note: string }>;
  }> = [
    {
      id: 'n-p1',
      title: 'Bối cảnh & Nguyên nhân',
      badge: 'Trụ cột 1',
      note: `Điều kiện lịch sử, xã hội và nguyên nhân trực tiếp dẫn đến ${rootTitle}.`,
      color: MindmapBranchColor.GOLD,
      children: [
        {
          title: 'Tình hình trong nước & khu vực',
          note: 'Bối cảnh chính trị, kinh tế và xã hội trước khi sự kiện diễn ra.',
        },
        {
          title: 'Nguyên nhân sâu xa & trực tiếp',
          note: 'Mâu thuẫn cơ bản hoặc yêu cầu lịch sử đặt ra.',
        },
      ],
    },
    {
      id: 'n-p2',
      title: 'Nhân vật & Lực lượng',
      badge: 'Trụ cột 2',
      note: `Các nhân vật lãnh đạo chủ chốt và lực lượng tham gia trong ${rootTitle}.`,
      color: MindmapBranchColor.INDIGO,
      children: [
        {
          title: 'Lãnh đạo & Chỉ huy tiêu biểu',
          note: 'Vai trò quyết sách và nghệ thuật tổ chức, chỉ đạo.',
        },
        {
          title: 'Sức mạnh đoàn kết toàn dân',
          note: 'Sự tham gia và đóng góp của các tầng lớp nhân dân.',
        },
      ],
    },
    {
      id: 'n-p3',
      title: 'Diễn biến trọng tâm',
      badge: 'Trụ cột 3',
      note: `Các giai đoạn, mốc sự kiện và bước ngoặt quyết định của ${rootTitle}.`,
      color: MindmapBranchColor.TEAL,
      children: [
        {
          title: 'Mở đầu & Các mốc chính',
          note: 'Khởi phát sự kiện và các đợt hoạt động tiêu biểu.',
        },
        {
          title: 'Bước ngoặt quyết định',
          note: 'Đỉnh cao hoặc thắng lợi then chốt xoay chuyển cục diện.',
        },
      ],
    },
    {
      id: 'n-p4',
      title: 'Kết quả & Ý nghĩa lịch sử',
      badge: 'Trụ cột 4',
      note: `Thành quả đạt được, tác động lâu dài và bài học lịch sử từ ${rootTitle}.`,
      color: MindmapBranchColor.STONE,
      children: [
        {
          title: 'Kết quả & Tác động thực tế',
          note: 'Chuyển biến về độc lập, chủ quyền hoặc phát triển đất nước.',
        },
        {
          title: 'Ý nghĩa & Bài học kinh nghiệm',
          note: 'Giá trị lịch sử đối với dân tộc và hậu thế.',
        },
      ],
    },
  ];

  const extractedPoints = extractSentencesOrBullets(prompt);

  pillars.forEach((pillar, pIdx) => {
    nodes.push({
      id: pillar.id,
      x: pIdx % 2 === 0 ? 150 : 700,
      y: pIdx < 2 ? 110 : 370,
      title: pillar.title,
      badge: pillar.badge,
      note: pillar.note,
      color: pillar.color,
    });
    edges.push({
      id: `e-${pillar.id}`,
      fromId: attachToParentId,
      toId: pillar.id,
    });

    pillar.children.forEach((child, cIdx) => {
      const customPoint = extractedPoints[pIdx * 2 + cIdx + 1];
      const subId = `${pillar.id}-c${cIdx + 1}`;
      nodes.push({
        id: subId,
        x: pIdx % 2 === 0 ? 30 : 840,
        y: (pIdx < 2 ? 80 : 340) + cIdx * 70,
        title: customPoint ? customPoint.slice(0, 65) : child.title,
        note: customPoint || child.note,
        color: pillar.color,
      });
      edges.push({ id: `e-${subId}`, fromId: pillar.id, toId: subId });
    });
  });
}

@Injectable()
export class MindmapAiService {
  private readonly googleAi: GoogleAiService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() googleAi?: GoogleAiService,
  ) {
    this.googleAi = googleAi ?? new GoogleAiService();
  }

  async generatePreview(
    userId: string,
    dto: GenerateMindmapDto,
  ): Promise<GeneratedMindmapPreview> {
    const prompt = dto.prompt?.trim();
    const structure = dto.structure ?? MindmapStructure.MIND_MAP;
    const includeNotes = dto.includeNotes ?? false;
    const articleIds = dto.articleIds ?? [];
    const canvasCtx = parseExistingCanvasContext(
      dto.existingGraph,
      dto.selectedNodeId,
    );

    const [notes, articles] = await Promise.all([
      this.fetchSourceNotes(userId, includeNotes),
      this.fetchSourceArticles(articleIds, prompt || canvasCtx.focusNodeTitle),
    ]);

    if (!prompt && notes.length === 0 && articles.length === 0) {
      throw new BadRequestException(MINDMAP_MESSAGES.NO_AI_SOURCES);
    }

    if (this.googleAi.isConfigured()) {
      const aiResult = await this.callGemini(
        prompt,
        structure,
        canvasCtx,
        notes,
        articles,
      );
      if (aiResult) {
        return {
          ...aiResult,
          template: MindmapTemplateType.SPIDER,
          engine: MindmapAiEngine.GEMINI_FLASH,
          noteCount: notes.length,
          articleCount: articles.length,
        };
      }
    }

    const fallback = this.buildHeuristicGraph(
      prompt,
      structure,
      canvasCtx,
      notes,
      articles,
    );
    return {
      ...fallback,
      template: MindmapTemplateType.SPIDER,
      engine: MindmapAiEngine.HEURISTIC,
      noteCount: notes.length,
      articleCount: articles.length,
    };
  }

  private fetchSourceNotes(
    userId: string,
    includeNotes: boolean,
  ): Promise<SourceNoteItem[]> {
    if (!includeNotes) return Promise.resolve([]);
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: MINDMAP_LIMITS.MAX_AI_NOTES,
      select: {
        id: true,
        title: true,
        content: true,
        highlightText: true,
      },
    });
  }

  private async fetchSourceArticles(
    articleIds: string[],
    prompt?: string,
  ): Promise<SourceArticleItem[]> {
    if (articleIds.length > 0) {
      return this.prisma.article.findMany({
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
      });
    }
    const shortKeyword = prompt ? prompt.slice(0, 80).trim() : '';
    if (shortKeyword && this.prisma.article?.findMany) {
      return this.prisma.article.findMany({
        where: {
          status: ContentStatus.PUBLISHED,
          OR: [
            { title: { contains: shortKeyword, mode: 'insensitive' } },
            { summary: { contains: shortKeyword, mode: 'insensitive' } },
          ],
        },
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          dateText: true,
          contentBlocks: true,
        },
      });
    }
    return [];
  }

  private buildPromptContext(
    prompt: string | undefined,
    canvasCtx: ExistingCanvasContext,
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
  ): string {
    const existingCanvasLines = !canvasCtx.isBlankDefault
      ? [
          `\n--- NGỮ CẢNH SƠ ĐỒ NGƯỜI HỌC ĐÃ SOẠN SẴN TRÊN CANVAS (BẮT BUỘC GIỮ NGUYÊN CÁC NODE NÀY VÀ PHÁT TRIỂN TIẾP) ---`,
          `Node gốc (rootId): "${canvasCtx.rootId}"`,
          `Node người học đang chọn (focusNodeId): "${canvasCtx.focusNodeId}" ("${canvasCtx.focusNodeTitle}")`,
          `Các Nodes hiện có: ${JSON.stringify(
            canvasCtx.nodes.map((n) => ({
              id: n.id,
              title: n.title,
              badge: n.badge,
              dateLabel: n.dateLabel,
              note: n.note,
              color: n.color,
            })),
          )}`,
          `Các Edges hiện có: ${JSON.stringify(
            canvasCtx.edges.map((e) => ({
              id: e.id,
              fromId: e.fromId,
              toId: e.toId,
              label: e.label,
            })),
          )}`,
        ].join('\n')
      : '';

    const noteLines = notes.map(
      (n, i) =>
        `[Ghi chú #${i + 1}] ${n.title || ''} | ${n.highlightText || ''} | ${n.content}`,
    );
    const articleLines = articles.map((a, i) => {
      const headings = extractHeadingsFromBlocks(a.contentBlocks).join('; ');
      return `[Bài viết #${i + 1}] ${a.title} (${a.dateText || ''}) — ${a.summary || ''} — Các mục: ${headings}`;
    });

    return [
      prompt
        ? `YÊU CẦU CỦA NGƯỜI HỌC:\n"""\n${prompt}\n"""`
        : 'Hãy mở rộng và bổ sung các nhánh tiếp theo cho sơ đồ tư duy bên dưới.',
      existingCanvasLines,
      articleLines.length
        ? `\n--- BÀI VIẾT THAM KHẢO TRONG HỆ THỐNG ---\n${articleLines.join('\n')}`
        : '',
      noteLines.length
        ? `\n--- GHI CHÚ CÁ NHÂN CỦA NGƯỜI HỌC ---\n${noteLines.join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async callGemini(
    prompt: string | undefined,
    structure: MindmapStructure,
    canvasCtx: ExistingCanvasContext,
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
  ): Promise<{
    title: string;
    periodLabel?: string;
    graph: MindmapGraphData;
  } | null> {
    const parsed = await this.googleAi.generateJson<{
      title?: unknown;
      periodLabel?: unknown;
      nodes?: RawGeminiNode[];
      edges?: RawGeminiEdge[];
    }>({
      systemPrompt: AI_SYSTEM_PROMPT,
      userPrompt: this.buildPromptContext(prompt, canvasCtx, notes, articles),
      temperature: 0.35,
      timeoutMs: MINDMAP_LIMITS.AI_TIMEOUT_MS,
      contextLabel: 'mindmap',
    });

    if (!parsed) return null;
    return this.parseGeminiMindmapResponse(
      parsed,
      structure,
      canvasCtx,
      articles,
      prompt,
    );
  }

  private parseGeminiMindmapResponse(
    parsed: {
      title?: unknown;
      periodLabel?: unknown;
      nodes?: RawGeminiNode[];
      edges?: RawGeminiEdge[];
    },
    structure: MindmapStructure,
    canvasCtx: ExistingCanvasContext,
    articles: SourceArticleItem[],
    prompt?: string,
  ): {
    title: string;
    periodLabel?: string;
    graph: MindmapGraphData;
  } | null {
    const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const aiNodes: MindmapNodeData[] = rawNodes
      .map((n, i) => {
        const nodeTitle =
          typeof n.title === 'string' ? n.title.trim().slice(0, 120) : '';
        const matchedRef = findMatchingArticleRef(nodeTitle, articles);
        return {
          id: typeof n.id === 'string' && n.id ? n.id : `n-${i}`,
          x: typeof n.x === 'number' ? Math.round(n.x) : 140 + (i % 4) * 200,
          y:
            typeof n.y === 'number'
              ? Math.round(n.y)
              : 100 + Math.floor(i / 4) * 140,
          title: nodeTitle,
          badge: typeof n.badge === 'string' ? n.badge.slice(0, 40) : undefined,
          dateLabel:
            typeof n.dateLabel === 'string'
              ? n.dateLabel.slice(0, 40)
              : undefined,
          note: typeof n.note === 'string' ? n.note.slice(0, 350) : undefined,
          color:
            i === 0
              ? MindmapBranchColor.CRIMSON
              : resolveBranchColor(n.color, i),
          ...(matchedRef ? { articleRef: matchedRef } : {}),
        };
      })
      .filter((n) => n.title.length > 0);

    if (aiNodes.length === 0) return null;
    const aiNodeIds = new Set(aiNodes.map((n) => n.id));
    const aiEdges: MindmapEdgeData[] = (
      Array.isArray(parsed.edges) ? parsed.edges : []
    )
      .map((e, i) => ({
        id: typeof e.id === 'string' && e.id ? e.id : `e-${i}`,
        fromId: typeof e.fromId === 'string' ? e.fromId : '',
        toId: typeof e.toId === 'string' ? e.toId : '',
        label: typeof e.label === 'string' ? e.label.slice(0, 40) : undefined,
      }))
      .filter((e) => aiNodeIds.has(e.fromId) && aiNodeIds.has(e.toId));

    const { nodes, edges } = mergePreservingExistingGraph(
      canvasCtx,
      aiNodes,
      aiEdges,
    );

    const existingRootTitle = !canvasCtx.isBlankDefault
      ? nodes[0]?.title
      : undefined;
    const fallbackTitle = prompt
      ? prompt
          .split(/[\n.?!]/)[0]
          .trim()
          .slice(0, 80)
      : 'Sơ đồ tư duy AI';
    const title =
      existingRootTitle ||
      (typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title.trim().slice(0, MINDMAP_LIMITS.MAX_TITLE_LENGTH)
        : fallbackTitle || 'Sơ đồ tư duy AI');
    const periodLabel =
      typeof parsed.periodLabel === 'string' && parsed.periodLabel.trim()
        ? parsed.periodLabel.trim().slice(0, MINDMAP_LIMITS.MAX_PERIOD_LENGTH)
        : undefined;

    return {
      title,
      periodLabel,
      graph: {
        nodes,
        edges,
        structure,
        mapTheme: MindmapMapTheme.HISGO_HERITAGE,
        balancedBranches: true,
      },
    };
  }

  private buildHeuristicGraph(
    prompt: string | undefined,
    structure: MindmapStructure,
    canvasCtx: ExistingCanvasContext,
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
  ): {
    title: string;
    periodLabel?: string;
    graph: MindmapGraphData;
  } {
    const firstSentence = prompt ? extractCleanRootTitle(prompt) : '';
    const rootTitle =
      (!canvasCtx.isBlankDefault ? canvasCtx.nodes[0]?.title : undefined) ||
      firstSentence ||
      (articles.length === 1 ? articles[0].title : 'Tổng hợp Lịch sử Việt Nam');
    const periodLabel = articles[0]?.dateText ?? undefined;

    const aiNodes: MindmapNodeData[] = [
      {
        id: 'n-root',
        x: 420,
        y: 240,
        title: rootTitle,
        badge: periodLabel || 'Chủ đề trung tâm',
        dateLabel: periodLabel,
        note: prompt ? prompt.slice(0, 280) : undefined,
        color: MindmapBranchColor.CRIMSON,
      },
    ];
    const aiEdges: MindmapEdgeData[] = [];

    const attachParentId =
      !canvasCtx.isBlankDefault && canvasCtx.focusNodeId !== canvasCtx.rootId
        ? canvasCtx.focusNodeId
        : 'n-root';

    if (!canvasCtx.isBlankDefault && attachParentId !== 'n-root') {
      const focusNode = canvasCtx.nodes.find((n) => n.id === attachParentId);
      if (focusNode) aiNodes.push(focusNode);
    }

    if (prompt) {
      appendPromptStructuredBranches(
        aiNodes,
        aiEdges,
        prompt,
        firstSentence || rootTitle,
        attachParentId,
      );
    }
    if (articles.length > 0) {
      appendArticleBranches(aiNodes, aiEdges, articles);
    }
    if (notes.length > 0) {
      appendNoteBranches(aiNodes, aiEdges, notes);
    }

    const { nodes, edges } = mergePreservingExistingGraph(
      canvasCtx,
      aiNodes,
      aiEdges,
    );

    return {
      title: rootTitle.slice(0, MINDMAP_LIMITS.MAX_TITLE_LENGTH),
      periodLabel,
      graph: {
        nodes,
        edges,
        structure,
        mapTheme: MindmapMapTheme.HISGO_HERITAGE,
        balancedBranches: true,
      },
    };
  }
}
