import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { extractRagCandidateArticleSlugs } from '../ai-assistant/ai-assistant.rag';
import appConfig from '../common/config/app.config';
import {
  GoogleAiService,
  RagGroundingChunk,
} from '../common/services/google-ai.service';
import { PrismaService } from '../common/services/prisma.service';
import { GenerateMindmapDto, MindmapDetailLevel } from './dto/mindmap.dto';
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
  structure?: MindmapStructure;
  graph: MindmapGraphData;
  engine: MindmapAiEngine;
  noteCount: number;
  articleCount: number;
  usedGoogleSearch?: boolean;
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
  coverImageUrl: string | null;
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
  imageUrl?: unknown;
  externalUrl?: unknown;
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

export function detectHeuristicStructure(prompt?: string): MindmapStructure {
  if (!prompt) return MindmapStructure.MIND_MAP;
  const p = prompt.toLowerCase();
  if (
    p.includes('nguyên nhân') ||
    p.includes('hậu quả') ||
    p.includes('thất bại') ||
    p.includes('thành công') ||
    p.includes('thắng lợi') ||
    p.includes('tại sao') ||
    p.includes('bài học') ||
    p.includes('xương cá')
  ) {
    return MindmapStructure.FISHBONE;
  }
  if (
    p.includes('bộ máy') ||
    p.includes('tổ chức') ||
    p.includes('chính quyền') ||
    p.includes('triều đình') ||
    p.includes('cơ cấu') ||
    p.includes('lục bộ') ||
    p.includes('phân cấp')
  ) {
    return MindmapStructure.ORG_CHART;
  }
  if (
    p.includes('giai đoạn') ||
    p.includes('tiến trình') ||
    p.includes('thời gian') ||
    p.includes('niên đại') ||
    p.includes('các mốc') ||
    p.includes('năm 1') ||
    p.includes('thế kỷ') ||
    p.includes('dòng thời gian')
  ) {
    return MindmapStructure.TIMELINE;
  }
  if (
    p.includes('diễn biến') ||
    p.includes('đợt 1') ||
    p.includes('chiến dịch') ||
    p.includes('bước')
  ) {
    return MindmapStructure.LOGIC_CHART;
  }
  return MindmapStructure.MIND_MAP;
}

export function buildAiSystemPrompt(
  structure: MindmapStructure,
  autoDetect = false,
  detailLevel: MindmapDetailLevel = MindmapDetailLevel.DETAILED,
): string {
  let structureInstruction = '';
  if (autoDetect) {
    structureInstruction = `CẤU TRÚC LINH HOẠT - TỰ ĐỘNG LỰA CHỌN (AUTO-DETECT):
Dựa vào bản chất và mục tiêu của yêu cầu từ người học, BẮT BUỘC chọn ra 1 trong các cấu trúc sau và trả về trường "structure" trong JSON:
- "FISHBONE": Khi chủ đề phân tích nguyên nhân - kết quả, bài học kinh nghiệm, nguyên nhân thắng lợi/thất bại (Đầu cá là kết quả/sự kiện, các xương lớn là nhóm nguyên nhân cốt lõi, xương nhỏ là chứng cứ/diễn biến).
- "TIMELINE": Khi chủ đề là tiến trình lịch sử, các giai đoạn, niên đại nối tiếp theo năm tháng tăng dần (VD: 1954-1960, 1961-1965, 1965-1968, 1969-1973, 1973-1975).
- "ORG_CHART": Khi chủ đề là bộ máy nhà nước, cơ cấu chính quyền, quân đội, giai cấp, tôn giáo (Phân cấp từ trên xuống).
- "LOGIC_CHART": Khi chủ đề là diễn biến chiến dịch, các bước tác chiến logic từ trái sang phải.
- "MIND_MAP": Khi chủ đề là tổng quan đa diện (chính trị, kinh tế, xã hội, văn hóa) hoặc chủ đề khái quát chung.`;
  } else {
    switch (structure) {
      case MindmapStructure.TIMELINE:
        structureInstruction = `CẤU TRÚC BẮT BUỘC [TIMELINE - DÒNG THỜI GIAN]:
- Node trung tâm (id: "n-root", color: "CRIMSON"): Chủ đề tổng thể hoặc tên cuộc kháng chiến/triều đại/giai đoạn.
- CÁC NHÁNH CON TRỰC TIẾP TỪ n-root: Bắt buộc là các mốc thời gian hoặc giai đoạn lịch sử được SẮP XẾP THEO THỨ TỰ TĂNG DẦN (VD: 1954-1960, 1961-1965, 1965-1968, 1969-1973, 1973-1975).
- Mỗi mốc thời gian BẮT BUỘC phải có "dateLabel" chuẩn xác (năm hoặc ngày/tháng/năm).
- "title" của mỗi nhánh con là tên sự kiện then chốt của mốc đó, "note" tóm tắt diễn biến và kết quả.`;
        break;
      case MindmapStructure.FISHBONE:
        structureInstruction = `CẤU TRÚC BẮT BUỘC [FISHBONE - SƠ ĐỒ XƯƠNG CÁ (NGUYÊN NHÂN - KẾT QUẢ)]:
- Node trung tâm (id: "n-root", color: "CRIMSON"): Đại diện cho ĐẦU CÁ (Kết quả/Sự kiện lớn cần phân tích nguyên nhân, VD: "Thắng lợi Khởi nghĩa Lam Sơn").
- CÁC NHÁNH CHÍNH (Xương lớn): Phân loại các nhóm nguyên nhân cốt lõi (VD: Đường lối quân sự, Nghệ thuật tác chiến, Lòng dân hậu phương, Tinh thần chỉ huy).
- Các nhánh con (Xương nhỏ): Đi sâu vào các minh chứng, sự kiện cụ thể của nhóm nguyên nhân đó.`;
        break;
      case MindmapStructure.ORG_CHART:
        structureInstruction = `CẤU TRÚC BẮT BUỘC [ORG_CHART - SƠ ĐỒ TỔ CHỨC / PHÂN CẤP]:
- Node trung tâm (id: "n-root", color: "CRIMSON"): Cơ quan lãnh đạo tối cao hoặc người đứng đầu (VD: Hoàng đế / Trung ương).
- CÁC NHÁNH CHÍNH: Các cấp cơ quan thừa hành, giám sát trực thuộc (VD: Lục Bộ, Lục Khoa, Đạo Thừa Tuyên).
- Các nhánh con: Các đơn vị hành chính cấp dưới hoặc chức vụ chuyên trách.`;
        break;
      case MindmapStructure.LOGIC_CHART:
        structureInstruction = `CẤU TRÚC BẮT BUỘC [LOGIC_CHART - CÂY LOGIC NGANG / TIẾN TRÌNH CHIẾN DỊCH]:
- Node trung tâm (id: "n-root", color: "CRIMSON"): Mục tiêu chiến lược / Tên chiến dịch lớn (VD: Chiến dịch Điện Biên Phủ 1954).
- CÁC NHÁNH CHÍNH: Các bước tiến triển logic hoặc các đợt tiến công theo thứ tự đợt 1 -> đợt 2 -> đợt 3 -> kết cục thắng lợi.`;
        break;
      default:
        structureInstruction = `CẤU TRÚC BẮT BUỘC [MIND_MAP - SƠ ĐỒ TƯ DUY TỎA ĐỀU]:
- Node trung tâm (id: "n-root", color: "CRIMSON") ở giữa.
- 4-5 nhánh chính bao quát các mặt: Bối cảnh chính trị, Quân sự - Kháng chiến, Kinh tế - Xã hội, Văn hóa - Tư tưởng.
- Mỗi nhánh chính tỏa ra 2-3 nhánh con chi tiết kèm dateLabel và note tóm lược.`;
        break;
    }
  }

  const detailInstruction =
    detailLevel === MindmapDetailLevel.CONCISE
      ? `MỨC ĐỘ CHI TIẾT [TÓM LƯỢC SÚC TÍCH]:
Tập trung cô đọng vào 3-4 nhánh chính quan trọng nhất, mỗi nhánh 1-2 nhánh con súc tích, ngắn gọn, phù hợp cho việc ghi nhớ nhanh và ôn thi.`
      : `MỨC ĐỘ CHI TIẾT [CHUYÊN SÂU TOÀN DIỆN]:
Mở rộng 4-6 nhánh chính, phân tích đa chiều và sâu sắc kèm mốc năm, địa danh, nhân vật tiêu biểu và ý nghĩa lịch sử sâu sắc.`;

  return `Bạn là trợ lý thiết kế Sơ đồ tư duy Lịch sử Việt Nam chuyên nghiệp của nền tảng HISGO (tương tự Canva Magic Write / XMind AI Co-Pilot).
Nhiệm vụ: từ yêu cầu / đoạn văn bản sử liệu người học nhập vào ("Bạn muốn xây dựng cái gì?") và NGỮ CẢNH SƠ ĐỒ HIỆN TẠI trên Canvas (nếu người học đã vẽ dở một số node), hãy thiết kế hoặc mở rộng tiếp Sơ đồ tư duy chuẩn xác theo Sách giáo khoa Lịch sử Việt Nam (GDPT 2018) và chính sử.

${structureInstruction}

${detailInstruction}

QUY TẮC QUAN TRỌNG VỀ NGỮ CẢNH CANVAS HIỆN TẠI:
1. Nếu người học ĐÃ SOẠN SẴN các node có nội dung trên Canvas:
   - BẮT BUỘC GIỮ NGUYÊN toàn bộ các node và edges mà người học đã soạn (giữ đúng "id" và "title" cũ của họ trong mảng "nodes" và "edges" trả về).
   - Đọc kỹ các nhánh người học đã viết để KHÔNG SINH TRÙNG LẶP và bổ sung/phát triển tiếp các nhánh mới còn thiếu (hoặc triển khai sâu nhánh con cho "Node đang được người học chọn" nếu họ yêu cầu mở rộng nhánh đó).
   - Nối các node mới tạo vào đúng "fromId" của node cha tương ứng trong đồ thị hiện có.
2. Nếu Canvas đang mới tinh (chưa có nội dung thực tế):
   - Dựng cây sơ đồ tư duy phân cấp theo đúng [CẤU TRÚC] nêu trên.
   - Nhánh chính xoay vòng màu "GOLD", "TEAL", "INDIGO", "STONE".
   - Luôn bổ sung "dateLabel" (năm/thời gian) và "note" (tóm tắt ý nghĩa 1-2 câu súc tích).
   - DẪN CHỨNG & TƯ LIỆU: Bổ sung dẫn chứng lịch sử xác thực (mốc năm, số liệu, nhân vật, tài liệu sử sách, địa danh). Nếu trong phần [BÀI VIẾT THAM KHẢO TRONG HỆ THỐNG] có các bài viết, hãy ưu tiên dùng tên bài viết và tiêu đề các mục của bài viết làm tiêu đề nhánh để hệ thống tự động liên kết nguồn đọc và hình ảnh tư liệu cho người học.
3. Trả về đúng JSON thuần túy (không markdown):
{
  "title": "Tên sơ đồ tư duy ngắn gọn (tối đa 70 ký tự)",
  "periodLabel": "Niên đại lịch sử (VD: 1954 – 1975 hoặc 1225 – 1400)",
  "structure": "MIND_MAP|ORG_CHART|LOGIC_CHART|FISHBONE|TIMELINE",
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
}

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
    const cleanTitle = (existing.title || '').trim().toLowerCase();
    if (cleanTitle) {
      existingTitles.set(cleanTitle, existing.id);
    }
  }

  const rootExisting = mergedNodes.get(ctx.rootId);
  const aiRoot = aiNodes[0];
  if (rootExisting && isPlaceholderTitle(rootExisting.title) && aiRoot) {
    mergedNodes.set(ctx.rootId, { ...rootExisting, title: aiRoot.title });
  }

  // Xác định node cha mục tiêu: nếu người dùng đang chọn 1 nhánh con/nhánh chính khác root,
  // thì mọi nhánh con mới do AI sinh ra phải được nối trực tiếp vào node đang chọn đó!
  const isBranchExpansion =
    Boolean(ctx.focusNodeId) &&
    ctx.focusNodeId !== ctx.rootId &&
    mergedNodes.has(ctx.focusNodeId);
  const targetParentId = isBranchExpansion ? ctx.focusNodeId : ctx.rootId;
  const targetParentNode = mergedNodes.get(targetParentId);

  const idRemap = new Map<string, string>();
  if (aiRoot) {
    idRemap.set(aiRoot.id, targetParentId);
  }

  let newSeq = Date.now() % 100000;
  const parentX = targetParentNode?.x ?? 420;
  const parentY = targetParentNode?.y ?? 240;
  const isRightSide = parentX >= 420;
  const inheritColor = targetParentNode?.color;
  const childAiNodes = isBranchExpansion ? aiNodes.slice(1) : aiNodes;
  const totalChildren = isBranchExpansion ? childAiNodes.length : 0;

  for (let idx = 0; idx < aiNodes.length; idx++) {
    const aiNode = aiNodes[idx];
    if (isBranchExpansion && aiNode.id === aiRoot?.id) {
      // Đã remap aiRoot sang targetParentId, không add aiRoot thành node mới
      continue;
    }

    const cleanAiTitle = (aiNode.title || '').trim().toLowerCase();
    const existingId =
      (mergedNodes.has(aiNode.id) ? aiNode.id : undefined) ??
      (cleanAiTitle ? existingTitles.get(cleanAiTitle) : undefined);

    if (existingId) {
      idRemap.set(aiNode.id, existingId);
      continue;
    }

    newSeq += 1;
    const safeId = `n-ai-${newSeq}`;
    idRemap.set(aiNode.id, safeId);

    // Tính toán toạ độ vị trí và màu sắc tự nhiên theo nhánh cha đang chọn
    let nodeX = aiNode.x;
    let nodeY = aiNode.y;
    let nodeColor = aiNode.color;

    if (isBranchExpansion && targetParentNode) {
      const childIdx = Math.max(0, idx - 1);
      const xOffset = isRightSide ? 220 : -220;
      nodeX = parentX + xOffset;
      nodeY = parentY + Math.round((childIdx - (totalChildren - 1) / 2) * 75);
      if (inheritColor) {
        nodeColor = inheritColor;
      }
    }

    mergedNodes.set(safeId, {
      ...aiNode,
      id: safeId,
      x: nodeX,
      y: nodeY,
      color: nodeColor,
    });
    if (cleanAiTitle) {
      existingTitles.set(cleanAiTitle, safeId);
    }
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

function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSearchKeywords(prompt?: string): string[] {
  if (!prompt) return [];
  const firstSentence = prompt.split(/[:\n.?!]/)[0]?.trim() ?? '';
  const cleanPrompt = firstSentence
    .replace(
      /^(?:hãy\s+)?(?:phân tích|xây dựng|hệ thống hóa|tóm tắt|vẽ|tạo|lập|mở rộng|tìm hiểu|trình bày|giới thiệu)\s+(?:sơ đồ tư duy\s+(?:về\s+)?|nhánh\s+|chi tiết\s+|về\s+)?/i,
      '',
    )
    .replace(
      /(?:nguyên nhân|hậu quả|kết quả|ý nghĩa|bài học|diễn biến|tiến trình|thời kỳ|giai đoạn|lịch sử|của|trong|cho tôi|giúp tôi)/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  const keywords: string[] = [];
  if (cleanPrompt.length >= 3) {
    keywords.push(cleanPrompt);
  }

  const words = cleanPrompt.split(' ').filter((w) => w.length >= 2);
  if (words.length >= 2) {
    keywords.push(words.slice(0, 4).join(' '));
  }
  return Array.from(new Set(keywords.filter((k) => k.length >= 3)));
}

function findMatchingArticleRef(
  nodeTitle: string,
  articles: SourceArticleItem[],
): MindmapArticleRef | undefined {
  const cleanNode = normalizeForMatching(nodeTitle);
  if (cleanNode.length < 3) return undefined;

  let bestMatch: SourceArticleItem | undefined;
  let bestScore = 0;

  for (const art of articles) {
    const cleanArt = normalizeForMatching(art.title);
    if (cleanArt === cleanNode) {
      return {
        id: art.id,
        slug: art.slug,
        title: art.title,
        coverImageUrl: art.coverImageUrl,
      };
    }

    if (
      cleanNode.length >= 5 &&
      (cleanArt.includes(cleanNode) || cleanNode.includes(cleanArt))
    ) {
      return {
        id: art.id,
        slug: art.slug,
        title: art.title,
        coverImageUrl: art.coverImageUrl,
      };
    }

    const nodeTokens = new Set(
      cleanNode.split(' ').filter((w) => w.length >= 3),
    );
    const artTokens = cleanArt.split(' ').filter((w) => w.length >= 3);
    let matchedCount = 0;
    for (const token of artTokens) {
      if (nodeTokens.has(token)) {
        matchedCount += 1;
      }
    }

    if (matchedCount >= 2 && matchedCount > bestScore) {
      bestScore = matchedCount;
      bestMatch = art;
    }
  }

  if (bestMatch && bestScore >= 2) {
    return {
      id: bestMatch.id,
      slug: bestMatch.slug,
      title: bestMatch.title,
      coverImageUrl: bestMatch.coverImageUrl,
    };
  }

  return undefined;
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
      imageUrl: art.coverImageUrl ?? undefined,
      color,
      articleRef: {
        id: art.id,
        slug: art.slug,
        title: art.title,
        coverImageUrl: art.coverImageUrl,
      },
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
  articles: SourceArticleItem[] = [],
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
    const pillarMatched = findMatchingArticleRef(pillar.title, articles);
    nodes.push({
      id: pillar.id,
      x: pIdx % 2 === 0 ? 150 : 700,
      y: pIdx < 2 ? 110 : 370,
      title: pillar.title,
      badge: pillar.badge,
      note: pillar.note,
      color: pillar.color,
      imageUrl: pillarMatched?.coverImageUrl ?? undefined,
      articleRef: pillarMatched,
    });
    edges.push({
      id: `e-${pillar.id}`,
      fromId: attachToParentId,
      toId: pillar.id,
    });

    pillar.children.forEach((child, cIdx) => {
      const customPoint = extractedPoints[pIdx * 2 + cIdx + 1];
      const childTitle = customPoint ? customPoint.slice(0, 65) : child.title;
      const childMatched = findMatchingArticleRef(childTitle, articles);
      const subId = `${pillar.id}-c${cIdx + 1}`;
      nodes.push({
        id: subId,
        x: pIdx % 2 === 0 ? 30 : 840,
        y: (pIdx < 2 ? 80 : 340) + cIdx * 70,
        title: childTitle,
        note: customPoint || child.note,
        color: pillar.color,
        imageUrl: childMatched?.coverImageUrl ?? undefined,
        articleRef: childMatched,
      });
      edges.push({ id: `e-${subId}`, fromId: pillar.id, toId: subId });
    });
  });
}

@Injectable()
export class MindmapAiService {
  private readonly logger = new Logger(MindmapAiService.name);
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
    try {
      const canvasCtx = parseExistingCanvasContext(
        dto.existingGraph,
        dto.selectedNodeId,
      );

      // Nếu người dùng không nhập prompt nhưng đang chọn 1 nhánh cụ thể,
      // tự động lấy tiêu đề nhánh đó làm trọng tâm mở rộng
      let prompt = dto.prompt?.trim();
      if (
        !prompt &&
        canvasCtx.focusNodeTitle &&
        canvasCtx.focusNodeId !== canvasCtx.rootId
      ) {
        prompt = `Phân tích và mở rộng nhánh con chi tiết cho: "${canvasCtx.focusNodeTitle}"`;
      }

      const autoDetectStructure = Boolean(dto.autoDetectStructure);
      const initialStructure = autoDetectStructure
        ? detectHeuristicStructure(prompt)
        : (dto.structure ?? MindmapStructure.MIND_MAP);
      const structure = initialStructure;
      const includeNotes = dto.includeNotes ?? false;
      const articleIds = dto.articleIds ?? [];

      const [notes, articles] = await Promise.all([
        this.fetchSourceNotes(userId, includeNotes),
        this.fetchSourceArticles(articleIds, prompt || canvasCtx.focusNodeTitle),
      ]);

      if (!prompt && notes.length === 0 && articles.length === 0) {
        throw new BadRequestException(MINDMAP_MESSAGES.NO_AI_SOURCES);
      }

      if (this.googleAi.isConfigured()) {
        try {
          const aiResult = await this.callGeminiWithGrounding(
            prompt,
            structure,
            canvasCtx,
            notes,
            articles,
            dto,
          );
          if (aiResult) {
            return {
              ...aiResult,
              template: MindmapTemplateType.SPIDER,
              structure: aiResult.graph.structure,
              engine: aiResult.engine,
              noteCount: notes.length,
              articleCount: articles.length,
              usedGoogleSearch: Boolean(dto.useGoogleSearch),
            };
          }
        } catch (error) {
          this.logger.warn(
            `Gemini AI generation failed for prompt: "${prompt?.slice(0, 80)}". Gracefully falling back to heuristic graph. Reason: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      const resolvedStructure = autoDetectStructure
        ? detectHeuristicStructure(prompt)
        : structure;
      const fallback = this.buildHeuristicGraph(
        prompt,
        resolvedStructure,
        canvasCtx,
        notes,
        articles,
      );
      return {
        ...fallback,
        template: MindmapTemplateType.SPIDER,
        structure: resolvedStructure,
        engine: MindmapAiEngine.HEURISTIC,
        noteCount: notes.length,
        articleCount: articles.length,
        usedGoogleSearch: false,
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(
        `Critical unexpected error in generatePreview: ${err instanceof Error ? err.stack : String(err)}`,
      );
      // Graceful fallback để không bao giờ trả HTTP 500
      const safeCanvas = parseExistingCanvasContext(dto.existingGraph, dto.selectedNodeId);
      const safeFallback = this.buildHeuristicGraph(
        dto.prompt?.trim() || safeCanvas.focusNodeTitle || 'Sơ đồ tư duy',
        MindmapStructure.MIND_MAP,
        safeCanvas,
        [],
        [],
      );
      return {
        ...safeFallback,
        template: MindmapTemplateType.SPIDER,
        structure: MindmapStructure.MIND_MAP,
        engine: MindmapAiEngine.HEURISTIC,
        noteCount: 0,
        articleCount: 0,
        usedGoogleSearch: false,
      };
    }
  }

  private async fetchSourceNotes(
    userId: string,
    includeNotes: boolean,
  ): Promise<SourceNoteItem[]> {
    if (!includeNotes) return Promise.resolve([]);
    try {
      return await this.prisma.note.findMany({
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
    } catch (error) {
      this.logger.warn(`fetchSourceNotes failed: ${error}`);
      return [];
    }
  }

  private async fetchSourceArticles(
    articleIds: string[],
    prompt?: string,
  ): Promise<SourceArticleItem[]> {
    try {
      if (articleIds.length > 0) {
        return await this.prisma.article.findMany({
          where: { id: { in: articleIds }, status: ContentStatus.PUBLISHED },
          take: MINDMAP_LIMITS.MAX_AI_ARTICLES,
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            dateText: true,
            coverImageUrl: true,
            contentBlocks: true,
          },
        });
      }

      const keywords = extractSearchKeywords(prompt);
      const orConditions: Array<{
        title?: { contains: string; mode: 'insensitive' };
        summary?: { contains: string; mode: 'insensitive' };
      }> = [];

      for (const kw of keywords) {
        orConditions.push({ title: { contains: kw, mode: 'insensitive' } });
        orConditions.push({ summary: { contains: kw, mode: 'insensitive' } });
      }

      const shortKeyword = prompt ? prompt.slice(0, 80).trim() : '';
      if (orConditions.length === 0 && shortKeyword) {
        orConditions.push({ title: { contains: shortKeyword, mode: 'insensitive' } });
        orConditions.push({ summary: { contains: shortKeyword, mode: 'insensitive' } });
      }

      if (orConditions.length > 0 && this.prisma.article?.findMany) {
        return await this.prisma.article.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            OR: orConditions,
          },
          take: MINDMAP_LIMITS.MAX_AI_ARTICLES,
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            dateText: true,
            coverImageUrl: true,
            contentBlocks: true,
          },
        });
      }
    } catch (error) {
      this.logger.warn(`fetchSourceArticles failed: ${error}`);
      return [];
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

    const isBranchExpansion =
      !canvasCtx.isBlankDefault &&
      Boolean(canvasCtx.focusNodeId) &&
      canvasCtx.focusNodeId !== canvasCtx.rootId;

    const branchExpansionLines = isBranchExpansion
      ? [
          `\n--- CHỈ DẪN QUAN TRỌNG: MỞ RỘNG TỪ NHÁNH ĐANG CHỌN ---`,
          `Người học đang chọn nhánh: "${canvasCtx.focusNodeTitle}" (ID: "${canvasCtx.focusNodeId}").`,
          `Yêu cầu bạn tập trung phân tích, chia nhỏ và mở rộng các nhánh con ĐI TỪ nhánh này.`,
          `Trong JSON trả về:`,
          `- Node gốc ("n-root" hoặc node đầu tiên) chính là nhánh "${canvasCtx.focusNodeTitle}".`,
          `- Mọi nhánh con cấp 1 bạn sinh mới phải có edge xuất phát từ "n-root" (ví dụ fromId: "n-root", toId: "n-1").`,
          `- Tuyệt đối KHÔNG thay thế lại toàn bộ cây chính trên canvas, chỉ tập trung mở rộng nhánh được chọn!`,
        ].join('\n')
      : '';

    return [
      prompt
        ? `YÊU CẦU CỦA NGƯỜI HỌC:\n"""\n${prompt}\n"""`
        : 'Hãy mở rộng và bổ sung các nhánh tiếp theo cho sơ đồ tư duy bên dưới.',
      branchExpansionLines,
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

  private async callGeminiWithGrounding(
    prompt: string | undefined,
    structure: MindmapStructure,
    canvasCtx: ExistingCanvasContext,
    notes: SourceNoteItem[],
    articles: SourceArticleItem[],
    dto?: GenerateMindmapDto,
  ): Promise<{
    title: string;
    periodLabel?: string;
    graph: MindmapGraphData;
    engine: MindmapAiEngine;
  } | null> {
    const autoDetect = Boolean(dto?.autoDetectStructure);
    const useGoogleSearch = Boolean(dto?.useGoogleSearch);
    const detailLevel = dto?.detailLevel ?? MindmapDetailLevel.DETAILED;
    const ragCorpus = appConfig.google_cloud_rag_corpus?.trim();
    const systemPrompt = buildAiSystemPrompt(structure, autoDetect, detailLevel);
    const userPrompt = this.buildPromptContext(prompt, canvasCtx, notes, articles);

    // 1. Thử gọi qua Vertex AI RAG nếu corpus được cấu hình hoặc nếu bật Google Search
    if (ragCorpus || useGoogleSearch) {
      const groundedResult = await this.googleAi.generateGroundedJson<{
        title?: unknown;
        periodLabel?: unknown;
        structure?: unknown;
        nodes?: RawGeminiNode[];
        edges?: RawGeminiEdge[];
      }>({
        systemPrompt,
        userPrompt,
        ragCorpus: ragCorpus || undefined,
        enableGoogleSearch: useGoogleSearch,
        disableUngroundedFallback: false,
        temperature: 0.35,
        timeoutMs: MINDMAP_LIMITS.AI_TIMEOUT_MS,
        contextLabel: useGoogleSearch ? 'mindmap-google-search' : 'mindmap-rag',
      });

      if (groundedResult?.data) {
        // Hydrate các bài viết từ RAG chunks nếu có
        const ragChunks = groundedResult.groundingChunks ?? [];
        const extraSlugs = extractRagCandidateArticleSlugs(ragChunks);
        let combinedArticles = articles;
        if (extraSlugs.length > 0 && this.prisma.article?.findMany) {
          const fetched = await this.prisma.article.findMany({
            where: { slug: { in: extraSlugs }, status: ContentStatus.PUBLISHED },
            take: 4,
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              dateText: true,
              coverImageUrl: true,
              contentBlocks: true,
            },
          });
          const existingIds = new Set(articles.map((a) => a.id));
          const newOnes = fetched.filter((f) => !existingIds.has(f.id));
          combinedArticles = [...articles, ...newOnes];
        }

        const resolvedStructure = this.resolveEffectiveStructure(
          groundedResult.data.structure,
          structure,
          autoDetect,
          prompt,
        );

        const parsed = this.parseGeminiMindmapResponse(
          groundedResult.data,
          resolvedStructure,
          canvasCtx,
          combinedArticles,
          prompt,
          ragChunks,
        );
        if (parsed) {
          return {
            ...parsed,
            engine: MindmapAiEngine.GEMINI_FLASH,
          };
        }
      }
    }

    // 2. Fallback trực tiếp Gemini Direct nếu không có RAG corpus hoặc RAG fail
    const directResult = await this.googleAi.generateJson<{
      title?: unknown;
      periodLabel?: unknown;
      structure?: unknown;
      nodes?: RawGeminiNode[];
      edges?: RawGeminiEdge[];
    }>({
      systemPrompt,
      userPrompt,
      temperature: 0.35,
      timeoutMs: MINDMAP_LIMITS.AI_TIMEOUT_MS,
      contextLabel: 'mindmap-direct',
    });

    if (!directResult) return null;
    const resolvedStructure = this.resolveEffectiveStructure(
      directResult.structure,
      structure,
      autoDetect,
      prompt,
    );
    const parsed = this.parseGeminiMindmapResponse(
      directResult,
      resolvedStructure,
      canvasCtx,
      articles,
      prompt,
    );
    return parsed ? { ...parsed, engine: MindmapAiEngine.GEMINI_FLASH } : null;
  }

  private resolveEffectiveStructure(
    rawStructure: unknown,
    fallback: MindmapStructure,
    autoDetect: boolean,
    prompt?: string,
  ): MindmapStructure {
    if (!autoDetect) return fallback;
    const valid = Object.values(MindmapStructure) as string[];
    if (typeof rawStructure === 'string' && valid.includes(rawStructure)) {
      return rawStructure as MindmapStructure;
    }
    return detectHeuristicStructure(prompt);
  }

  private parseGeminiMindmapResponse(
    parsed: {
      title?: unknown;
      periodLabel?: unknown;
      nodes?: RawGeminiNode[];
      edges?: RawGeminiEdge[];
    } | null | undefined,
    structure: MindmapStructure,
    canvasCtx: ExistingCanvasContext,
    articles: SourceArticleItem[],
    prompt?: string,
    groundingChunks?: RagGroundingChunk[],
  ): {
    title: string;
    periodLabel?: string;
    graph: MindmapGraphData;
  } | null {
    if (!parsed || typeof parsed !== 'object') return null;
    const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const aiNodes: MindmapNodeData[] = rawNodes
      .map((n, i) => {
        const nodeTitle =
          typeof n.title === 'string' ? n.title.trim().slice(0, 120) : '';
        const matchedRef = findMatchingArticleRef(nodeTitle, articles);
        const baseImageUrl =
          typeof n.imageUrl === 'string' && n.imageUrl.trim()
            ? n.imageUrl.trim()
            : matchedRef?.coverImageUrl || undefined;
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
          imageUrl: baseImageUrl,
          color:
            i === 0
              ? MindmapBranchColor.CRIMSON
              : resolveBranchColor(n.color, i),
          ...(matchedRef ? { articleRef: matchedRef } : {}),
        };
      })
      .filter((n) => n.title.length > 0);

    if (aiNodes.length === 0) return null;

    // Tự động gắn ảnh và bài viết cho Root node nếu chưa có
    if (aiNodes[0]) {
      if (!aiNodes[0].imageUrl && articles[0]?.coverImageUrl) {
        aiNodes[0].imageUrl = articles[0].coverImageUrl;
      }
      if (!aiNodes[0].articleRef && articles[0]) {
        aiNodes[0].articleRef = {
          id: articles[0].id,
          slug: articles[0].slug,
          title: articles[0].title,
          coverImageUrl: articles[0].coverImageUrl,
        };
      }
    }

    // Nếu có web URIs từ Google Search Grounding, trích xuất nguồn dẫn chứng gắn vào node
    const webChunks = (groundingChunks || []).filter(
      (c): c is RagGroundingChunk & { uri: string } =>
        typeof c.uri === 'string' && c.uri.startsWith('http'),
    );
    if (webChunks.length > 0) {
      if (aiNodes[0] && !aiNodes[0].externalUrl) {
        aiNodes[0].externalUrl = webChunks[0].uri;
      }
      webChunks.slice(1, 4).forEach((chunk, chunkIdx) => {
        const targetNode = aiNodes[chunkIdx + 1];
        if (targetNode && !targetNode.externalUrl && !targetNode.articleRef) {
          targetNode.externalUrl = chunk.uri;
          if (chunk.title && !targetNode.badge) {
            targetNode.badge = chunk.title.slice(0, 35);
          }
        }
      });
    }
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

    const primaryArticle = articles[0];
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
        imageUrl: primaryArticle?.coverImageUrl ?? undefined,
        articleRef: primaryArticle
          ? {
              id: primaryArticle.id,
              slug: primaryArticle.slug,
              title: primaryArticle.title,
              coverImageUrl: primaryArticle.coverImageUrl,
            }
          : undefined,
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
        articles,
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
