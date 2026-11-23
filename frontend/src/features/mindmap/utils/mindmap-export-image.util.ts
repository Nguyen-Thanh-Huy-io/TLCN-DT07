import {
  MindmapBorderStyle,
  MindmapNodeShape,
  type BranchPaletteToken,
  type MapThemeConfig,
} from '../constants/mindmap.constants';
import type { MindmapGraph, MindmapNode } from '../services/mindmap.service';
import {
  NodeVisualVariant,
  type MindmapLayoutResult,
  type NodeLayoutPlacement,
} from './mindmap-layout.strategy';
import {
  resolveEffectiveTheme,
  resolveNodePalette,
  type MindmapTreeModel,
} from './mindmap-tree.util';

export interface ExportedMindmapImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface ContentBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const EXPORT_PAD = 48;
const FOOTER_HEIGHT = 44;
const MIN_CANVAS_W = 800;
const MIN_CANVAS_H = 440;

function computeBounds(placements: Iterable<NodeLayoutPlacement>): ContentBounds {
  const list = Array.from(placements);
  if (list.length === 0) {
    return { minX: 0, minY: 0, width: 640, height: 320 };
  }
  const minX = Math.min(...list.map((p) => p.x));
  const minY = Math.min(...list.map((p) => p.y));
  const maxX = Math.max(...list.map((p) => p.x + p.width));
  const maxY = Math.max(...list.map((p) => p.y + p.height));
  return {
    minX,
    minY,
    width: Math.max(120, maxX - minX),
    height: Math.max(80, maxY - minY),
  };
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dotColor: string,
): void {
  ctx.save();
  ctx.fillStyle = dotColor;
  const step = 20;
  for (let x = step; x < width; x += step) {
    for (let y = step; y < height - FOOTER_HEIGHT; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function applyDashForStyle(
  ctx: CanvasRenderingContext2D,
  isCrossLink?: boolean,
  style?: MindmapBorderStyle,
): void {
  if (isCrossLink || style === MindmapBorderStyle.DASHED) {
    ctx.setLineDash([6, 4]);
    return;
  }
  if (style === MindmapBorderStyle.DOTTED) {
    ctx.setLineDash([2, 4]);
    return;
  }
  ctx.setLineDash([]);
}

function drawRoundedRectPath(
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

function drawEdges(
  ctx: CanvasRenderingContext2D,
  graph: MindmapGraph,
  tree: MindmapTreeModel,
  layout: MindmapLayoutResult,
  theme: MapThemeConfig,
): void {
  if (layout.spineLine) {
    ctx.save();
    ctx.strokeStyle = theme.branchPalette[0].stroke;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(layout.spineLine.x1, layout.spineLine.y1);
    ctx.lineTo(layout.spineLine.x2, layout.spineLine.y2);
    ctx.stroke();
    ctx.restore();
  }

  for (const edge of graph.edges) {
    const geom = layout.routedEdges.get(edge.id);
    const toNode = tree.nodeMap.get(edge.toId);
    if (!geom || !toNode) continue;

    const fromNode = tree.nodeMap.get(edge.fromId);
    const parentStyle = fromNode?.style;
    const stroke =
      parentStyle?.childStrokeColor || resolveNodePalette(toNode, tree, theme).stroke;
    const strokeW = parentStyle?.childStrokeWidth ?? (edge.isCrossLink ? 1.8 : 2);

    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    applyDashForStyle(ctx, edge.isCrossLink, parentStyle?.childStrokeStyle);
    ctx.stroke(new Path2D(geom.d));
    if (geom.underlineSegment) {
      ctx.stroke(new Path2D(geom.underlineSegment));
    }

    if (edge.label) {
      ctx.setLineDash([]);
      ctx.font = '600 10px sans-serif';
      const labelW = Math.max(48, Math.ceil(ctx.measureText(edge.label).width + 16));
      drawRoundedRectPath(ctx, geom.midX - labelW / 2, geom.midY - 10, labelW, 20, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.label, geom.midX, geom.midY);
    }
    ctx.restore();
  }
}

function resolveExportNodeColors(
  variant: NodeVisualVariant,
  node: MindmapNode,
  theme: MapThemeConfig,
  palette: BranchPaletteToken,
): { bg: string | null; text: string; border: string | null; radius: number } {
  if (variant === NodeVisualVariant.STICKY) {
    return { bg: '#FEF3C7', text: '#451A03', border: '#F59E0B', radius: 12 };
  }
  if (variant === NodeVisualVariant.ROOT) {
    return {
      bg: node.colorOverride ? palette.nodeBg : theme.rootBg,
      text: node.colorOverride ? palette.nodeText : theme.rootText,
      border: node.colorOverride ? palette.nodeBorder : theme.rootBorder,
      radius: 12,
    };
  }
  if (variant === NodeVisualVariant.UNDERLINE || variant === NodeVisualVariant.PLAIN) {
    return { bg: null, text: palette.leafText, border: null, radius: 6 };
  }
  const radius =
    variant === NodeVisualVariant.PILL || variant === NodeVisualVariant.CIRCLE ? 999 : 8;
  return { bg: palette.nodeBg, text: palette.nodeText, border: palette.nodeBorder, radius };
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length >= maxLines - 1) {
        const rest = words.slice(i + 1).join(' ');
        if (rest) current = `${current} ${rest}`;
        break;
      }
    }
  }
  lines.push(current);
  return lines.slice(0, maxLines);
}

function drawSingleNode(
  ctx: CanvasRenderingContext2D,
  node: MindmapNode,
  placement: NodeLayoutPlacement,
  theme: MapThemeConfig,
  palette: BranchPaletteToken,
): void {
  const base = resolveExportNodeColors(placement.variant, node, theme, palette);
  const custom = node.style;
  const fillColor = custom?.fillColor || base.bg;
  const textColor = custom?.textColor || base.text;
  const borderColor = custom?.borderColor || base.border;
  const hideBorder = custom?.borderStyle === MindmapBorderStyle.NONE;
  const radius =
    custom?.borderRadius !== undefined
      ? custom.borderRadius
      : node.shape === MindmapNodeShape.PILL
        ? placement.height / 2
        : base.radius;

  ctx.save();
  drawRoundedRectPath(ctx, placement.x, placement.y, placement.width, placement.height, radius);
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (!hideBorder && borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = custom?.borderWidth ?? 1;
    applyDashForStyle(ctx, false, custom?.borderStyle);
    ctx.stroke();
  }

  const isRoot = placement.variant === NodeVisualVariant.ROOT;
  const fontSize = custom?.fontSize ?? (isRoot ? 15 : 13);
  const weight = custom?.bold || isRoot ? '700' : '600';
  const style = custom?.italic ? 'italic' : 'normal';
  ctx.font = `${style} ${weight} ${fontSize}px sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const padX = isRoot ? 16 : 12;
  const lines = wrapLines(
    ctx,
    node.title || 'Chưa đặt tên',
    Math.max(40, placement.width - padX * 2),
    4,
  );
  const lineHeight = fontSize * 1.3;
  const totalTextH = lines.length * lineHeight;
  const startY = placement.y + (placement.height - totalTextH) / 2 + lineHeight / 2;
  const centerX = placement.x + placement.width / 2;

  lines.forEach((line, idx) => {
    ctx.fillText(line, centerX, startY + idx * lineHeight);
  });
  ctx.restore();
}

function drawFooterBar(
  ctx: CanvasRenderingContext2D,
  logicalW: number,
  logicalH: number,
  title: string,
  periodLabel?: string | null,
): void {
  const barY = logicalH - FOOTER_HEIGHT;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 35, 63, 0.05)';
  ctx.fillRect(0, barY, logicalW, FOOTER_HEIGHT);
  ctx.strokeStyle = 'rgba(184, 137, 63, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, barY);
  ctx.lineTo(logicalW, barY);
  ctx.stroke();

  const leftText = periodLabel ? `${title} · ${periodLabel}` : title;
  ctx.font = '700 13px sans-serif';
  ctx.fillStyle = '#2D1A10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(leftText.slice(0, 70), 20, barY + FOOTER_HEIGHT / 2);

  ctx.font = '700 12px sans-serif';
  ctx.fillStyle = '#7A1F24';
  ctx.textAlign = 'right';
  ctx.fillText('HISGO · Sơ đồ tư duy Lịch sử', logicalW - 20, barY + FOOTER_HEIGHT / 2);
  ctx.restore();
}

function toSafeFilename(title: string): string {
  const ascii = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `hisgo-mindmap-${ascii || 'so-do'}.png`;
}

/**
 * Kết xuất sơ đồ tư duy hiện tại từ Canvas thành ảnh PNG sắc nét (để đính kèm bài đăng Cộng đồng hoặc tải về).
 */
export async function exportMindmapToPngFile(input: {
  title: string;
  periodLabel?: string | null;
  graph: MindmapGraph;
  tree: MindmapTreeModel;
  layout: MindmapLayoutResult;
}): Promise<ExportedMindmapImage> {
  const { title, periodLabel, graph, tree, layout } = input;
  const theme = resolveEffectiveTheme(graph);
  const bounds = computeBounds(layout.placements.values());

  const logicalW = Math.max(MIN_CANVAS_W, Math.ceil(bounds.width + EXPORT_PAD * 2));
  const logicalH = Math.max(MIN_CANVAS_H, Math.ceil(bounds.height + EXPORT_PAD * 2 + FOOTER_HEIGHT));
  const scale = logicalW > 1800 || logicalH > 1200 ? 1.5 : 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalW * scale);
  canvas.height = Math.round(logicalH * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ xuất ảnh Canvas 2D.');
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = graph.customBgColor || theme.canvasBg;
  ctx.fillRect(0, 0, logicalW, logicalH);

  if (graph.showGrid) {
    drawDotGrid(ctx, logicalW, logicalH, theme.gridDotColor);
  }

  const offsetX = Math.round((logicalW - bounds.width) / 2 - bounds.minX);
  const offsetY = Math.round((logicalH - FOOTER_HEIGHT - bounds.height) / 2 - bounds.minY);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawEdges(ctx, graph, tree, layout, theme);
  for (const node of graph.nodes) {
    const placement = layout.placements.get(node.id);
    if (!placement) continue;
    drawSingleNode(ctx, node, placement, theme, resolveNodePalette(node, tree, theme));
  }
  ctx.restore();

  drawFooterBar(ctx, logicalW, logicalH, title.trim() || 'Sơ đồ tư duy Lịch sử', periodLabel);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Không thể chuyển sơ đồ thành tệp ảnh PNG.'));
    }, 'image/png');
  });

  const file = new File([blob], toSafeFilename(title), { type: 'image/png' });
  const previewUrl = URL.createObjectURL(blob);
  return { file, previewUrl, width: logicalW, height: logicalH };
}
