import {
  ROW_LAYOUT_CONFIG,
  ROW_LAYOUT_PRESETS,
  type RowLayoutPresetDefinition,
} from '../constants/lesson.constants';
import { LessonBlockType } from '../types/editor.types';
import {
  BlockWidthType,
  ColumnData,
  HeadingBlockData,
  ImageBlockData,
  LessonBlockItem,
  QuoteBlockData,
  RowGapSize,
  RowLayoutPresetId,
  RowSectionBlockData,
  RowVerticalAlign,
  TextBlockData,
} from '../types/block-builder.types';

const LEGACY_ZONE_LEFT = 'LEFT';
const LEGACY_ZONE_RIGHT = 'RIGHT';
const LEGACY_RATIO_4_8 = '4_8';
const LEGACY_RATIO_6_6 = '6_6';

const LEGACY_COLUMN_RATIO_MAP: Record<string, [number, number]> = {
  '4_8': [33.33, 66.67],
  '5_7': [42, 58],
  '6_6': [50, 50],
  '7_5': [58, 42],
  '8_4': [66.67, 33.33],
};

const ROW_GAP_CLASS_MAP: Record<RowGapSize, string> = {
  [RowGapSize.SM]: 'gap-3',
  [RowGapSize.MD]: 'gap-5',
  [RowGapSize.LG]: 'gap-7',
};

const ROW_VERTICAL_ALIGN_CLASS_MAP: Record<RowVerticalAlign, string> = {
  [RowVerticalAlign.TOP]: 'items-start',
  [RowVerticalAlign.CENTER]: 'items-center',
  [RowVerticalAlign.STRETCH]: 'items-stretch',
};

const COLUMN_BASE_CLASS = 'flex-1 min-w-0 space-y-3';
const COLUMN_DIVIDER_CLASS = 'md:border-l md:border-stone-200/80 md:pl-5';
const ROW_WRAPPER_CLASS = 'hisgo-row-container';
const ROW_SECTION_CLASS = 'hisgo-row-section';
const ROW_COLUMN_CLASS = 'hisgo-column';

/** Sinh ID duy nhất chuẩn UUID v4 (crypto.randomUUID), tuyệt đối không dùng Date.now() */
export function createBlockUUID(prefix?: string): string {
  const rawUuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  return prefix ? `${prefix}_${rawUuid}` : rawUuid;
}

export class RowLayoutStrategy {
  /** Tính toán tỷ lệ 2 cột khi kéo thanh resizer, snap theo bước SNAP_STEP_PERCENT (5%) */
  public static computeTwoColumnSnap(rawLeftPercent: number): [number, number] {
    const { MIN_COLUMN_WIDTH_PERCENT: min, MAX_COLUMN_WIDTH_PERCENT: max, SNAP_STEP_PERCENT: step } =
      ROW_LAYOUT_CONFIG;
    const clamped = Math.max(min, Math.min(max, rawLeftPercent));
    const snappedLeft = Math.round(clamped / step) * step;
    return [snappedLeft, 100 - snappedLeft];
  }

  /** Phân bổ đều tỷ lệ % cho N cột */
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

  /** Sinh giá trị grid-template-columns chuẩn `minmax(0, ...fr)` tránh tràn ngang khi có gap */
  public static getGridTemplateColumns(columns: ColumnData[]): string {
    if (!columns || columns.length <= 1) return '1fr';
    return columns.map((c) => `minmax(0, ${c.widthPercent}fr)`).join(' ');
  }

  /** Sinh class CSS cho container lưới cột dựa trên gapSize & verticalAlign */
  public static getRowContainerClasses(row: RowSectionBlockData): string {
    const gapCls = ROW_GAP_CLASS_MAP[row.gapSize ?? RowGapSize.MD] ?? ROW_GAP_CLASS_MAP[RowGapSize.MD];
    const alignCls =
      ROW_VERTICAL_ALIGN_CLASS_MAP[row.verticalAlign ?? RowVerticalAlign.TOP] ??
      ROW_VERTICAL_ALIGN_CLASS_MAP[RowVerticalAlign.TOP];
    return `w-full flex flex-col md:grid ${gapCls} ${alignCls}`;
  }

  /** Sinh class CSS cho từng cột (bao gồm đường kẻ ngăn cột khi bật showColumnDivider) */
  public static getColumnClasses(row: RowSectionBlockData, colIndex: number): string {
    return row.showColumnDivider && colIndex > 0
      ? `${COLUMN_BASE_CLASS} ${COLUMN_DIVIDER_CLASS}`
      : COLUMN_BASE_CLASS;
  }

  /** Tăng/giảm số cột bất biến: gộp khối từ các cột dư vào cột cuối còn lại */
  public static resizeColumnsImmutably(
    columns: ColumnData[],
    targetCount: number,
    widths: number[]
  ): ColumnData[] {
    const clampedCount = Math.max(
      ROW_LAYOUT_CONFIG.MIN_COLUMN_COUNT,
      Math.min(ROW_LAYOUT_CONFIG.MAX_COLUMN_COUNT, targetCount)
    );
    const nextColumns = columns.slice(0, clampedCount).map((col) => ({
      ...col,
      blocks: [...col.blocks],
    }));

    while (nextColumns.length < clampedCount) {
      nextColumns.push({
        id: createBlockUUID('col'),
        widthPercent: widths[nextColumns.length] ?? 25,
        blocks: [],
      });
    }

    if (columns.length > clampedCount && nextColumns.length > 0) {
      const orphanedBlocks = columns.slice(clampedCount).flatMap((c) => c.blocks);
      if (orphanedBlocks.length > 0) {
        const lastIdx = nextColumns.length - 1;
        const existingIds = new Set(nextColumns[lastIdx].blocks.map((b) => b.id));
        const uniqueOrphans = orphanedBlocks.filter((b) => !existingIds.has(b.id));
        nextColumns[lastIdx] = {
          ...nextColumns[lastIdx],
          blocks: [...nextColumns[lastIdx].blocks, ...uniqueOrphans],
        };
      }
    }

    return nextColumns.map((col, idx) => ({
      ...col,
      widthPercent: widths[idx] ?? col.widthPercent,
    }));
  }

  /** Xuất mã HTML responsive cho Hàng nhiều cột */
  public static compileRowToHtml(
    row: RowSectionBlockData,
    blockToHtmlFn: (b: LessonBlockItem) => string
  ): string {
    const colCount = row.columnCount || row.columns.length || 1;
    const gridStyle = this.getGridTemplateColumns(row.columns);
    const containerClasses = this.getRowContainerClasses(row);
    const colWidthsAttr = row.columns.map((c) => Math.round(c.widthPercent)).join(',');
    const gapAttr = row.gapSize ?? RowGapSize.MD;
    const presetAttr = row.layoutPreset ? ` data-preset="${row.layoutPreset}"` : '';

    const colsHtml = row.columns
      .map((col, idx) => {
        const innerBlocksHtml = col.blocks.map(blockToHtmlFn).join('\n');
        const colClasses = this.getColumnClasses(row, idx);
        return `
          <div class="${ROW_COLUMN_CLASS} col-index-${idx} ${colClasses}">
            ${innerBlocksHtml || '<p class="text-slate-400 italic text-xs">Cột trống</p>'}
          </div>
        `;
      })
      .join('\n');

    return `
      <div class="${ROW_WRAPPER_CLASS} my-6">
        <div 
          class="${ROW_SECTION_CLASS} ${containerClasses}" 
          style="grid-template-columns: ${gridStyle};" 
          data-columns="${colCount}"
          data-column-widths="${colWidthsAttr}"
          data-gap="${gapAttr}"${presetAttr}
        >
          ${colsHtml}
        </div>
      </div>
    `;
  }
}

export class RowLayoutPresetRegistry {
  public static getAll(): RowLayoutPresetDefinition[] {
    return ROW_LAYOUT_PRESETS;
  }

  public static getById(id: RowLayoutPresetId): RowLayoutPresetDefinition | undefined {
    return ROW_LAYOUT_PRESETS.find((p) => p.id === id);
  }

  public static detectMatchingPreset(row: RowSectionBlockData): RowLayoutPresetId | null {
    const colCount = row.columnCount || row.columns.length;
    const found = ROW_LAYOUT_PRESETS.find((preset) => {
      if (colCount !== preset.columnCount || row.columns.length !== preset.widths.length) {
        return false;
      }
      if (Boolean(row.showColumnDivider) !== preset.showColumnDivider) {
        return false;
      }
      return preset.widths.every(
        (w, idx) => Math.abs(Math.round(row.columns[idx]?.widthPercent ?? 0) - Math.round(w)) <= 1
      );
    });
    return found?.id ?? null;
  }

  public static applyPreset(row: RowSectionBlockData, presetId: RowLayoutPresetId): RowSectionBlockData {
    const preset = this.getById(presetId);
    if (!preset) return row;

    return {
      ...row,
      columnCount: preset.columnCount,
      columns: RowLayoutStrategy.resizeColumnsImmutably(row.columns, preset.columnCount, preset.widths),
      layoutPreset: preset.id,
      gapSize: preset.gapSize,
      showColumnDivider: preset.showColumnDivider,
    };
  }
}

function isPlainRecord(val: unknown): val is Record<string, unknown> {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function stripLegacyZone(raw: Record<string, unknown>): LessonBlockItem {
  const rest = { ...raw };
  delete rest.zone;
  const rawType = String(rest.type || LessonBlockType.TEXT).toUpperCase();
  const id =
    typeof rest.id === 'string' && rest.id.trim()
      ? rest.id
      : createBlockUUID(rawType.toLowerCase());
  return { ...rest, id, type: rawType as LessonBlockType } as LessonBlockItem;
}

function nonEmptyStr(val: unknown): string | null {
  return typeof val === 'string' && val.trim() ? val.trim() : null;
}

function createHeadingFromTitle(title: unknown): HeadingBlockData | null {
  const text = nonEmptyStr(title);
  if (!text) return null;
  return { id: createBlockUUID('heading'), type: LessonBlockType.HEADING, width: BlockWidthType.FULL, level: 2, text };
}

function createMigratedTwoColumnRow(
  leftBlocks: LessonBlockItem[],
  rightBlocks: LessonBlockItem[],
  ratioKey: string
): RowSectionBlockData {
  const widths = LEGACY_COLUMN_RATIO_MAP[ratioKey] ?? [50, 50];
  const preset =
    ratioKey === LEGACY_RATIO_4_8
      ? RowLayoutPresetId.MAGAZINE_4_8
      : ratioKey === LEGACY_RATIO_6_6
      ? RowLayoutPresetId.SYMMETRIC_6_6
      : undefined;

  return {
    id: createBlockUUID('section_row'),
    type: LessonBlockType.SECTION_ROW,
    width: BlockWidthType.FULL,
    columnCount: 2,
    columns: [
      { id: createBlockUUID('col'), widthPercent: widths[0], blocks: leftBlocks },
      { id: createBlockUUID('col'), widthPercent: widths[1], blocks: rightBlocks },
    ],
    layoutPreset: preset,
    gapSize: ratioKey === LEGACY_RATIO_4_8 ? RowGapSize.LG : RowGapSize.MD,
    verticalAlign: RowVerticalAlign.TOP,
    showColumnDivider: ratioKey === LEGACY_RATIO_4_8,
  };
}

function extractChapterRatioKey(chap: Record<string, unknown>): string {
  const config = isPlainRecord(chap.config) ? chap.config : null;
  const layout = config && isPlainRecord(config.layout) ? config.layout : null;
  return typeof layout?.columnRatio === 'string' ? layout.columnRatio : LEGACY_RATIO_4_8;
}

function migrateChapterUnit(chap: Record<string, unknown>): LessonBlockItem[] {
  const result: LessonBlockItem[] = [];
  const heading = createHeadingFromTitle(chap.title);
  if (heading) result.push(heading);

  const rawBlocks = Array.isArray(chap.blocks) ? chap.blocks.filter(isPlainRecord) : [];
  const leftBlocks: LessonBlockItem[] = [];
  const rightBlocks: LessonBlockItem[] = [];
  const fullBlocks: LessonBlockItem[] = [];

  for (const rawChild of rawBlocks) {
    const clean = stripLegacyZone(rawChild);
    if (rawChild.zone === LEGACY_ZONE_LEFT) leftBlocks.push(clean);
    else if (rawChild.zone === LEGACY_ZONE_RIGHT) rightBlocks.push(clean);
    else fullBlocks.push(clean);
  }

  result.push(...fullBlocks);
  if (leftBlocks.length > 0 && rightBlocks.length > 0) {
    result.push(createMigratedTwoColumnRow(leftBlocks, rightBlocks, extractChapterRatioKey(chap)));
  } else {
    result.push(...leftBlocks, ...rightBlocks);
  }
  return result;
}

function buildFlatLeftBlocks(rawBlock: Record<string, unknown>): LessonBlockItem[] {
  const leftBlocks: LessonBlockItem[] = [];
  const lead = nonEmptyStr(rawBlock.leadText);
  if (lead) {
    leftBlocks.push({ id: createBlockUUID('text'), type: LessonBlockType.TEXT, content: lead } as TextBlockData);
  }
  const quote = nonEmptyStr(rawBlock.pullQuoteText);
  if (quote) {
    leftBlocks.push({
      id: createBlockUUID('quote'),
      type: LessonBlockType.QUOTE,
      quoteText: quote,
      author: nonEmptyStr(rawBlock.pullQuoteAuthor) ?? 'Tư liệu lịch sử',
    } as QuoteBlockData);
  }
  return leftBlocks;
}

function buildFlatRightBlocks(rawBlock: Record<string, unknown>): LessonBlockItem[] {
  const rightBlocks: LessonBlockItem[] = [];
  const body = nonEmptyStr(rawBlock.contentHtml);
  if (body) {
    rightBlocks.push({ id: createBlockUUID('text'), type: LessonBlockType.TEXT, content: body } as TextBlockData);
  }
  const imgSrc = nonEmptyStr(rawBlock.imageUrl);
  if (imgSrc) {
    rightBlocks.push({
      id: createBlockUUID('image'),
      type: LessonBlockType.IMAGE,
      src: imgSrc,
      alt: nonEmptyStr(rawBlock.title) ?? '',
      caption: nonEmptyStr(rawBlock.imageCaption) ?? undefined,
    } as ImageBlockData);
  }
  return rightBlocks;
}

function migrateFlatLegacyStory(rawBlock: Record<string, unknown>): LessonBlockItem[] {
  const result: LessonBlockItem[] = [];
  const heading = createHeadingFromTitle(rawBlock.title || rawBlock.storyTitle);
  if (heading) result.push(heading);

  const leftBlocks = buildFlatLeftBlocks(rawBlock);
  const rightBlocks = buildFlatRightBlocks(rawBlock);
  if (leftBlocks.length > 0 && rightBlocks.length > 0) {
    result.push(createMigratedTwoColumnRow(leftBlocks, rightBlocks, LEGACY_RATIO_4_8));
  } else {
    result.push(...leftBlocks, ...rightBlocks);
  }

  const nestedList = Array.isArray(rawBlock.nestedBlocks) ? rawBlock.nestedBlocks.filter(isPlainRecord) : [];
  result.push(...nestedList.map(stripLegacyZone));
  return result;
}

/** Adapter chuyển đổi ngược dữ liệu `STORY_CHAPTER` cũ thành chuỗi khối chuẩn `[HEADING, SECTION_ROW]`. */
export function migrateLegacyStoryChapterToBlocks(rawBlock: Record<string, unknown>): LessonBlockItem[] {
  const rawChapters = Array.isArray(rawBlock.chapters) ? rawBlock.chapters.filter(isPlainRecord) : [];
  if (rawChapters.length > 0) {
    return [...rawChapters]
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .flatMap(migrateChapterUnit);
  }
  return migrateFlatLegacyStory(rawBlock);
}

export interface IBlockWidthOption {
  type: BlockWidthType;
  label: string;
  shortLabel: string;
  cssClass: string;
}

export class BlockWidthStrategy {
  private static readonly WIDTH_DEFINITIONS: Record<BlockWidthType, IBlockWidthOption> = {
    [BlockWidthType.FULL]: { type: BlockWidthType.FULL, label: '100%', shortLabel: '100%', cssClass: 'w-full' },
    [BlockWidthType.HALF]: { type: BlockWidthType.HALF, label: '50%', shortLabel: '50%', cssClass: 'w-full md:w-[calc(50%-8px)]' },
    [BlockWidthType.THIRD]: { type: BlockWidthType.THIRD, label: '33%', shortLabel: '33%', cssClass: 'w-full md:w-[calc(33.333%-11px)]' },
    [BlockWidthType.AUTO]: { type: BlockWidthType.AUTO, label: 'Tự động', shortLabel: 'Tự động', cssClass: 'w-auto max-w-full' },
  };

  private static readonly AVAILABLE_WIDTHS_MAP: Partial<Record<LessonBlockType, BlockWidthType[]>> = {
    [LessonBlockType.CHARACTER]: [BlockWidthType.HALF, BlockWidthType.THIRD, BlockWidthType.FULL],
    [LessonBlockType.EVENT]: [BlockWidthType.HALF, BlockWidthType.THIRD, BlockWidthType.FULL],
    [LessonBlockType.IMAGE]: [BlockWidthType.HALF, BlockWidthType.FULL],
    [LessonBlockType.VIDEO]: [BlockWidthType.FULL, BlockWidthType.HALF],
    [LessonBlockType.RESOURCE_LINK]: [BlockWidthType.AUTO, BlockWidthType.HALF, BlockWidthType.FULL],
  };

  private static readonly DEFAULT_WIDTH_MAP: Partial<Record<LessonBlockType, BlockWidthType>> = {
    [LessonBlockType.CHARACTER]: BlockWidthType.HALF,
    [LessonBlockType.EVENT]: BlockWidthType.HALF,
    [LessonBlockType.IMAGE]: BlockWidthType.HALF,
    [LessonBlockType.RESOURCE_LINK]: BlockWidthType.AUTO,
  };

  private static readonly WIDTH_FRACTION_MAP: Record<BlockWidthType, number> = {
    [BlockWidthType.HALF]: 0.5,
    [BlockWidthType.THIRD]: 0.3334,
    [BlockWidthType.AUTO]: 0.5,
    [BlockWidthType.FULL]: 1.0,
  };

  public static getAvailableWidths(blockType: LessonBlockType): BlockWidthType[] {
    return this.AVAILABLE_WIDTHS_MAP[blockType] ?? [BlockWidthType.FULL];
  }

  public static getDefaultWidth(blockType: LessonBlockType): BlockWidthType {
    return this.DEFAULT_WIDTH_MAP[blockType] ?? BlockWidthType.FULL;
  }

  public static getWidthFraction(width: BlockWidthType = BlockWidthType.FULL): number {
    return this.WIDTH_FRACTION_MAP[width] ?? 1.0;
  }

  public static getCssClass(width: BlockWidthType = BlockWidthType.FULL): string {
    return this.WIDTH_DEFINITIONS[width]?.cssClass || this.WIDTH_DEFINITIONS[BlockWidthType.FULL].cssClass;
  }

  public static getWidthOption(width: BlockWidthType): IBlockWidthOption {
    return this.WIDTH_DEFINITIONS[width] || this.WIDTH_DEFINITIONS[BlockWidthType.FULL];
  }
}

export enum PlacementLocation {
  ROOT = 'ROOT',
  COLUMN = 'COLUMN',
}

export interface PlacementContext {
  location: PlacementLocation | 'ROOT' | 'COLUMN';
  columnWidthPercent?: number;
}

export interface PlacementValidationResult {
  allowed: boolean;
  reason?: string;
}

type PlacementRule = (blockType: LessonBlockType, context: PlacementContext) => PlacementValidationResult | null;

export class BlockPlacementRuleEngine {
  private static readonly rules: PlacementRule[] = [
    (blockType, ctx) =>
      blockType === LessonBlockType.SECTION_ROW && ctx.location === PlacementLocation.COLUMN
        ? {
            allowed: false,
            reason:
              'Hàng nhiều cột chỉ được đặt ở cấp ngoài cùng (Root), không được lồng trong cột con để tránh vỡ giao diện trên điện thoại.',
          }
        : null,
    (blockType, ctx) =>
      blockType === LessonBlockType.TIMELINE &&
      ctx.location === PlacementLocation.COLUMN &&
      ctx.columnWidthPercent !== undefined &&
      ctx.columnWidthPercent < 50
        ? { allowed: false, reason: 'Khối Timeline yêu cầu độ rộng tối thiểu 50% để hiển thị trục mốc lịch sử.' }
        : null,
    (blockType, ctx) =>
      blockType === LessonBlockType.QUIZ && ctx.location === PlacementLocation.COLUMN
        ? { allowed: false, reason: 'Khối Câu hỏi ôn tập (Quiz) cần đặt toàn chiều rộng trang bài học.' }
        : null,
    (blockType, ctx) =>
      blockType === LessonBlockType.COMPARISON_TABLE &&
      ctx.location === PlacementLocation.COLUMN &&
      ctx.columnWidthPercent !== undefined &&
      ctx.columnWidthPercent < 40
        ? { allowed: false, reason: 'Bảng so sánh cần độ rộng tối thiểu 40% để các cột số liệu không bị ép chữ.' }
        : null,
  ];

  /** Kiểm tra tính hợp lệ khi chèn hoặc kéo thả một khối vào vị trí chỉ định */
  public static validate(blockType: LessonBlockType, context: PlacementContext): PlacementValidationResult {
    for (const rule of this.rules) {
      const result = rule(blockType, context);
      if (result && !result.allowed) return result;
    }
    return { allowed: true };
  }
}
