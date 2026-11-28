import type { SpatialCanvasNode } from '../services/concept-canvas.service';
import type { ExportedMindmapImage } from './mindmap-export-image.util';

const POSTER_CONFIG = {
  CARD_WIDTH: 420,
  BASE_CARD_HEIGHT: 292,
  POSTER_PADDING: 64,
  HEADER_HEIGHT: 110,
  FOOTER_HEIGHT: 54,
  MIN_POSTER_WIDTH: 1080,
  MIN_POSTER_HEIGHT: 720,
  SCALE_FACTOR: 2,
  BG_COLOR: '#FBF8F3',
  CARD_BG: '#FFFFFF',
  CARD_BORDER: '#E7DEC9',
  PRIMARY_TEXT: '#1C1917',
  MUTED_TEXT: '#78716C',
  ACCENT_RED: '#991B1B',
  ACCENT_GOLD: '#B45309',
  LINE_STROKE: '#D97706',
} as const;

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

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '…';
  let end = text.length;
  while (end > 1 && ctx.measureText(`${text.slice(0, end).trimEnd()}${ellipsis}`).width > maxWidth) {
    end -= 1;
  }
  return `${text.slice(0, end).trimEnd()}${ellipsis}`;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (lines.length >= maxLines - 1) {
        const rest = words.slice(i).join(' ');
        lines.push(truncateToWidth(ctx, `${current} ${rest}`, maxWidth));
        return lines;
      }
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(truncateToWidth(ctx, current, maxWidth));
  return lines.slice(0, maxLines);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPosterHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  title: string,
  periodLabel?: string,
): void {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, POSTER_CONFIG.HEADER_HEIGHT);

  ctx.strokeStyle = POSTER_CONFIG.CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, POSTER_CONFIG.HEADER_HEIGHT);
  ctx.lineTo(width, POSTER_CONFIG.HEADER_HEIGHT);
  ctx.stroke();

  ctx.fillStyle = POSTER_CONFIG.ACCENT_RED;
  ctx.font = '700 11px sans-serif';
  ctx.fillText('HISGO · BẢN ĐỒ KHÁI NIỆM KHÔNG GIAN AI', 48, 36);

  ctx.fillStyle = POSTER_CONFIG.PRIMARY_TEXT;
  ctx.font = '700 22px sans-serif';
  const displayTitle = title.length > 60 ? `${title.slice(0, 58)}...` : title;
  ctx.fillText(displayTitle, 48, 68);

  if (periodLabel) {
    const badgeText = `Thời kỳ: ${periodLabel}`;
    ctx.font = '600 12px sans-serif';
    const bWidth = ctx.measureText(badgeText).width + 20;
    const bX = width - 48 - bWidth;
    drawRoundedRect(ctx, bX, 48, bWidth, 28, 6);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.fillText(badgeText, bX + 10, 66);
  }
  ctx.restore();
}

function drawPosterFooter(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const y = height - POSTER_CONFIG.FOOTER_HEIGHT;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, y, width, POSTER_CONFIG.FOOTER_HEIGHT);

  ctx.strokeStyle = POSTER_CONFIG.CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  ctx.fillStyle = POSTER_CONFIG.MUTED_TEXT;
  ctx.font = '600 12px sans-serif';
  ctx.fillText('Nền tảng Học & Khám phá Lịch sử Việt Nam — hisgo.vn', 48, y + 32);

  const nowText = `Trích xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  ctx.textAlign = 'right';
  ctx.fillText(nowText, width - 48, y + 32);
  ctx.restore();
}

function drawConnectingLines(
  ctx: CanvasRenderingContext2D,
  nodes: readonly SpatialCanvasNode[],
): void {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  ctx.save();
  ctx.strokeStyle = POSTER_CONFIG.LINE_STROKE;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  for (const node of nodes) {
    if (!node.parentId) continue;
    const parent = nodeMap.get(node.parentId);
    if (!parent) continue;

    const startX = parent.x + POSTER_CONFIG.CARD_WIDTH;
    const startY = parent.y + POSTER_CONFIG.BASE_CARD_HEIGHT / 2;
    const endX = node.x;
    const endY = node.y + POSTER_CONFIG.BASE_CARD_HEIGHT / 2;

    const midX = (startX + endX) / 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCardHeader(
  ctx: CanvasRenderingContext2D,
  node: SpatialCanvasNode,
  x: number,
  y: number,
): void {
  const active = node.versions[node.versionIndex];
  const engineText = active?.periodLabel ? active.periodLabel : 'TƯ LIỆU SỬ HỌC';

  ctx.font = '700 10.5px sans-serif';
  const maxBadgeTextWidth = POSTER_CONFIG.CARD_WIDTH - 56;
  const displayBadge = truncateToWidth(ctx, engineText, maxBadgeTextWidth);
  const badgeWidth = Math.min(POSTER_CONFIG.CARD_WIDTH - 40, ctx.measureText(displayBadge).width + 16);

  drawRoundedRect(ctx, x + 20, y + 18, badgeWidth, 22, 6);
  ctx.fillStyle = '#FEF2F2';
  ctx.fill();
  ctx.strokeStyle = '#FECACA';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = POSTER_CONFIG.ACCENT_RED;
  ctx.fillText(displayBadge, x + 28, y + 33);

  ctx.fillStyle = POSTER_CONFIG.PRIMARY_TEXT;
  ctx.font = '700 15px sans-serif';
  const titleLines = wrapTextLines(ctx, node.prompt, POSTER_CONFIG.CARD_WIDTH - 40, 2);
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, x + 20, y + 62 + idx * 20);
  });
}

function drawCardBody(
  ctx: CanvasRenderingContext2D,
  node: SpatialCanvasNode,
  x: number,
  y: number,
): void {
  const active = node.versions[node.versionIndex];
  if (!active?.text) return;

  const clean = stripConceptMarkdown(active.text);
  ctx.fillStyle = '#44403C';
  ctx.font = '400 12.5px sans-serif';

  const bodyLines = wrapTextLines(ctx, clean, POSTER_CONFIG.CARD_WIDTH - 40, 7);
  bodyLines.forEach((line, idx) => {
    ctx.fillText(line, x + 20, y + 108 + idx * 19);
  });

  const matched = active.matchedArticles?.[0];
  if (matched) {
    const bottomY = y + POSTER_CONFIG.BASE_CARD_HEIGHT - 38;
    drawRoundedRect(ctx, x + 20, bottomY, POSTER_CONFIG.CARD_WIDTH - 40, 26, 6);
    ctx.fillStyle = '#F5F5F4';
    ctx.fill();

    ctx.fillStyle = POSTER_CONFIG.ACCENT_GOLD;
    ctx.font = '600 11px sans-serif';
    const tag = `📖 Bài viết: ${matched.title}`;
    const truncatedTag = truncateToWidth(ctx, tag, POSTER_CONFIG.CARD_WIDTH - 60);
    ctx.fillText(truncatedTag, x + 30, bottomY + 17);
  }
}

function drawSingleCard(
  ctx: CanvasRenderingContext2D,
  node: SpatialCanvasNode,
): void {
  const { x, y } = node;
  const w = POSTER_CONFIG.CARD_WIDTH;
  const h = POSTER_CONFIG.BASE_CARD_HEIGHT;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = POSTER_CONFIG.CARD_BG;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = POSTER_CONFIG.CARD_BORDER;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  drawCardHeader(ctx, node, x, y);
  drawCardBody(ctx, node, x, y);
  ctx.restore();
}

export async function exportConceptCanvasPoster(
  spatialNodes: readonly SpatialCanvasNode[],
): Promise<ExportedMindmapImage> {
  const validNodes = spatialNodes.filter((n) => n.versions.length > 0);
  if (validNodes.length === 0) {
    throw new Error('Chưa có nhánh khái niệm nào hoàn tất để xuất ảnh.');
  }

  const root = validNodes[0];
  const rootVersion = root.versions[root.versionIndex];

  const minX = Math.min(...validNodes.map((n) => n.x));
  const minY = Math.min(...validNodes.map((n) => n.y));
  const maxX = Math.max(...validNodes.map((n) => n.x + POSTER_CONFIG.CARD_WIDTH));
  const maxY = Math.max(...validNodes.map((n) => n.y + POSTER_CONFIG.BASE_CARD_HEIGHT));

  const contentW = maxX - minX;
  const contentH = maxY - minY;

  const totalW = Math.max(
    POSTER_CONFIG.MIN_POSTER_WIDTH,
    contentW + POSTER_CONFIG.POSTER_PADDING * 2,
  );
  const totalH = Math.max(
    POSTER_CONFIG.MIN_POSTER_HEIGHT,
    contentH +
      POSTER_CONFIG.HEADER_HEIGHT +
      POSTER_CONFIG.FOOTER_HEIGHT +
      POSTER_CONFIG.POSTER_PADDING * 2,
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(totalW * POSTER_CONFIG.SCALE_FACTOR);
  canvas.height = Math.round(totalH * POSTER_CONFIG.SCALE_FACTOR);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ xuất ảnh Canvas 2D.');
  }

  ctx.scale(POSTER_CONFIG.SCALE_FACTOR, POSTER_CONFIG.SCALE_FACTOR);

  ctx.fillStyle = POSTER_CONFIG.BG_COLOR;
  ctx.fillRect(0, 0, totalW, totalH);

  drawPosterHeader(ctx, totalW, root.prompt, rootVersion?.periodLabel);

  const offsetX = Math.round((totalW - contentW) / 2 - minX);
  const offsetY = Math.round(
    POSTER_CONFIG.HEADER_HEIGHT +
      (totalH - POSTER_CONFIG.HEADER_HEIGHT - POSTER_CONFIG.FOOTER_HEIGHT - contentH) / 2 -
      minY,
  );

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawConnectingLines(ctx, validNodes);
  validNodes.forEach((node) => drawSingleCard(ctx, node));
  ctx.restore();

  drawPosterFooter(ctx, totalW, totalH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Không thể kết xuất ảnh PNG từ Bản đồ khái niệm.'));
    }, 'image/png');
  });

  const asciiName = root.prompt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  const file = new File([blob], `hisgo-khai-niem-${asciiName || 'canvas'}.png`, {
    type: 'image/png',
  });
  const previewUrl = URL.createObjectURL(blob);
  return { file, previewUrl, width: totalW, height: totalH };
}

export async function downloadSpatialCanvasAsPng(
  spatialNodes: readonly SpatialCanvasNode[],
): Promise<void> {
  const exported = await exportConceptCanvasPoster(spatialNodes);
  const anchor = document.createElement('a');
  anchor.href = exported.previewUrl;
  anchor.download = exported.file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(exported.previewUrl), 2000);
}
