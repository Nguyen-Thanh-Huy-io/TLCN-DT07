import { ROW_LAYOUT_CONFIG } from '../constants/row-layout.constants';
import { ColumnData, RowSectionBlockData, LessonBlockItem } from '../types/block-builder.types';

export class RowLayoutStrategy {
  /**
   * Tính toán tỷ lệ 2 cột khi kéo thanh resizer, snap theo bước SNAP_STEP_PERCENT (5%)
   * và đảm bảo không cột nào nhỏ hơn MIN_COLUMN_WIDTH_PERCENT (20%)
   */
  public static computeTwoColumnSnap(
    rawLeftPercent: number
  ): [number, number] {
    const min = ROW_LAYOUT_CONFIG.MIN_COLUMN_WIDTH_PERCENT;
    const max = ROW_LAYOUT_CONFIG.MAX_COLUMN_WIDTH_PERCENT;
    const step = ROW_LAYOUT_CONFIG.SNAP_STEP_PERCENT;

    // Giới hạn trong khoảng [min, max]
    const clamped = Math.max(min, Math.min(max, rawLeftPercent));

    // Làm tròn theo nấc step (ví dụ 5%)
    const snappedLeft = Math.round(clamped / step) * step;
    const snappedRight = 100 - snappedLeft;

    return [snappedLeft, snappedRight];
  }

  /**
   * Phân bổ đều tỷ lệ % cho N cột
   */
  public static distributeEqualWidths(count: number): number[] {
    if (count <= 1) return [100];
    if (count === 2) return [50, 50];
    if (count === 3) return [33.33, 33.33, 33.34];
    if (count === 4) return [25, 25, 25, 25];

    const each = Number((100 / count).toFixed(2));
    const result = Array(count).fill(each);
    const sum = result.reduce((a, b) => a + b, 0);
    result[result.length - 1] += Number((100 - sum).toFixed(2));
    return result;
  }

  /**
   * Sinh giá trị grid-template-columns cho style CSS
   */
  public static getGridTemplateColumns(columns: ColumnData[]): string {
    if (!columns || columns.length <= 1) return '1fr';
    return columns.map((c) => `${c.widthPercent}%`).join(' ');
  }

  /**
   * Xuất mã HTML responsive cho Hàng nhiều cột
   */
  public static compileRowToHtml(
    row: RowSectionBlockData,
    blockToHtmlFn: (b: LessonBlockItem) => string
  ): string {
    const colCount = row.columnCount || row.columns.length || 1;
    const gridStyle = this.getGridTemplateColumns(row.columns);

    const colsHtml = row.columns
      .map((col, idx) => {
        const innerBlocksHtml = col.blocks.map(blockToHtmlFn).join('\n');
        return `
          <div class="hisgo-column col-index-${idx} flex-1 min-w-0 space-y-3">
            ${innerBlocksHtml || '<p class="text-slate-400 italic text-xs">Cột trống</p>'}
          </div>
        `;
      })
      .join('\n');

    return `
      <div 
        class="hisgo-row-section my-6 w-full flex flex-col md:grid gap-4" 
        style="grid-template-columns: ${gridStyle};" 
        data-columns="${colCount}"
      >
        ${colsHtml}
      </div>
    `;
  }
}
