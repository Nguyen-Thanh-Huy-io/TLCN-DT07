export interface InkPoint {
  x: number;
  y: number;
}

export interface RectBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const domRectToPageBox = (r: DOMRect): RectBox => ({
  left: window.scrollX + r.left,
  top: window.scrollY + r.top,
  width: Math.max(1, r.width),
  height: Math.max(24, r.height),
});

/**
 * Tính khung lớp phủ SVG vẽ tay giới hạn tuyệt đối trong `[0, clientWidth]`
 * để nét vẽ hoặc chữ bổ sung sát lề không làm tràn chiều ngang tạo thanh cuộn.
 */
export function clampInkCanvasBox(
  contentBox: RectBox,
  clientWidth: number,
  bleedLeft: number,
  bleedRight: number,
  bleedTop: number,
): RectBox {
  const safeClientWidth = Math.max(0, clientWidth);
  const canvasLeft = Math.max(0, Math.min(contentBox.left - bleedLeft, safeClientWidth));
  const maxRight = Math.min(safeClientWidth, contentBox.left + contentBox.width + bleedRight);
  return {
    left: canvasLeft,
    top: Math.max(0, contentBox.top - bleedTop),
    width: Math.max(0, maxRight - canvasLeft),
    height: contentBox.height + bleedTop * 2,
  };
}

export interface InkCanvasMetrics {
  canvasBox: RectBox;
  contentBox: RectBox;
  blockBoxes: RectBox[];
}

export function computeInkCanvasMetrics(
  root: HTMLElement,
  readableBlocks: readonly HTMLElement[],
  bleedLeft: number,
  bleedRight: number,
  bleedTop: number,
): InkCanvasMetrics {
  const cBox = domRectToPageBox(root.getBoundingClientRect());
  const blockBoxes = readableBlocks.map((el) => domRectToPageBox(el.getBoundingClientRect()));
  const clientWidth =
    typeof document !== 'undefined' ? document.documentElement.clientWidth : cBox.left + cBox.width;
  return {
    canvasBox: clampInkCanvasBox(cBox, clientWidth, bleedLeft, bleedRight, bleedTop),
    contentBox: cBox,
    blockBoxes,
  };
}

/** Chuyển tập điểm thành đường cong SVG mượt (Quadratic Bezier qua trung điểm). */
export function buildSmoothInkPath(points: readonly InkPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${(p.x + 0.5).toFixed(1)} ${(p.y + 0.5).toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

/** Chỉ giữ lại điểm cách điểm trước tối thiểu `minDist` px để giảm dung lượng JSON. */
export function appendInkPoint(points: InkPoint[], next: InkPoint, minDist = 3): InkPoint[] {
  const prev = points[points.length - 1];
  if (!prev) return [next];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  if (dx * dx + dy * dy < minDist * minDist) return points;
  return [...points, next];
}

/** Chuẩn hoá toạ độ pixel trang -> mảng số phẳng [nx0, ny0, ...] theo khung cột nội dung & khối đoạn neo. */
export function normalizeInkPoints(
  points: readonly InkPoint[],
  contentBox: RectBox,
  blockBox: RectBox,
): number[] {
  const safeW = Math.max(1, contentBox.width);
  const safeH = Math.max(24, blockBox.height);
  const flat: number[] = [];
  for (const p of points) {
    flat.push(
      Math.round(((p.x - contentBox.left) / safeW) * 10000) / 10000,
      Math.round(((p.y - blockBox.top) / safeH) * 10000) / 10000,
    );
  }
  return flat;
}

/** Khôi phục tập điểm pixel trang từ toạ độ chuẩn hoá theo khung cột & khối đoạn hiện tại. */
export function denormalizeInkPoints(
  pts: readonly number[] | undefined,
  contentBox: RectBox,
  blockBox: RectBox,
): InkPoint[] {
  if (!pts || pts.length < 2) return [];
  const safeW = Math.max(1, contentBox.width);
  const safeH = Math.max(24, blockBox.height);
  const points: InkPoint[] = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    points.push({
      x: contentBox.left + pts[i] * safeW,
      y: blockBox.top + pts[i + 1] * safeH,
    });
  }
  return points;
}

/** Tìm chỉ số đoạn văn gần điểm clientY nhất (trả -1 nếu bài không có khối nào). */
export function findNearestBlockIndex(blocks: readonly HTMLElement[], clientY: number): number {
  if (blocks.length === 0) return -1;
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < blocks.length; i++) {
    const rect = blocks[i].getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) return i;
    const dist = clientY < rect.top ? rect.top - clientY : clientY - rect.bottom;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}
