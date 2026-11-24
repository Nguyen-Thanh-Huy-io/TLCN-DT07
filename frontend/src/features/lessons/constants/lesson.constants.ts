import { BlockPaletteItem, LessonBlockGroup, LessonBlockType } from '../types/editor.types';
import {
  CalloutBoxStyle,
  CalloutMediaAlign,
  CalloutVariant,
  RowFrameStyle,
  RowGapSize,
  RowLayoutPresetId,
} from '../types/block-builder.types';

const ADD_BLOCK_BELOW_LABEL = '+ Thêm khối bên dưới';

export const LEGACY_BLOCK_TYPE_STORY_CHAPTER = 'STORY_CHAPTER';

/** MIME type dùng cho HTML5 Drag-and-Drop khi kéo khối từ thanh công cụ sang Canvas. */
export const LESSON_BLOCK_DRAG_MIME = 'application/x-lesson-block';

export const CHARACTER_BLOCK_CONSTANTS = {
  NODE_NAME: 'characterBlock',
  TITLE: 'Nhân vật',
  DEFAULT_NAME: 'Tên nhân vật lịch sử',
  DEFAULT_YEARS: 'Năm sinh – năm mất',
  DEFAULT_SUMMARY: 'Thông tin giới thiệu ngắn.',
  PICK_HINT: 'Khi chưa chọn nhân vật, hiển thị nút chọn từ kho dữ liệu.',
  BTN_PICK_ENTITY: 'Chọn từ kho dữ liệu',
  BTN_CHANGE_ENTITY: 'Đổi nhân vật',
  BTN_DELETE_BLOCK: 'Xóa khối nhân vật',
  BTN_ADD_BELOW: ADD_BLOCK_BELOW_LABEL,
  NAME_PLACEHOLDER: 'Nhập tên nhân vật lịch sử...',
  YEARS_PLACEHOLDER: 'Năm sinh – năm mất (Ví dụ: 1911 – 2013)...',
  SUMMARY_PLACEHOLDER: 'Nhập tiểu sử, chức vụ, vai trò nổi bật...',
} as const;

export const EVENT_BLOCK_CONSTANTS = {
  NODE_NAME: 'eventBlock',
  TITLE: 'Sự kiện',
  SUB_LABEL: 'MỐC LỊCH SỬ',
  DEFAULT_NAME: 'Tên sự kiện lịch sử',
  DEFAULT_TIME_LOCATION: 'Thời gian • Địa điểm',
  DEFAULT_SUMMARY: 'Mô tả ngắn về diễn biến và ý nghĩa của sự kiện.',
  DIFFERENCE_NOTE: 'Khác với khối Văn bản: đây là dữ liệu liên kết đến thực thể Event, không phải nội dung nhập tự do.',
  BTN_PICK_EVENT: 'Chọn từ kho dữ liệu',
  BTN_CHANGE_EVENT: 'Đổi sự kiện',
  BTN_DELETE_BLOCK: 'Xóa khối sự kiện',
  BTN_ADD_BELOW: ADD_BLOCK_BELOW_LABEL,
  NAME_PLACEHOLDER: 'Nhập tên sự kiện lịch sử...',
  TIME_LOC_PLACEHOLDER: 'Thời gian • Địa điểm (Ví dụ: 07/05/1954 • Điện Biên)...',
  SUMMARY_PLACEHOLDER: 'Nhập mô tả diễn biến chính và ý nghĩa của sự kiện...',
} as const;

export interface BlockCatalogEntry {
  type: LessonBlockType;
  label: string;
  description: string;
  group?: LessonBlockGroup;
  lessonOnly?: boolean;
  showInPalette: boolean;
}

export const BLOCK_CATALOG: Record<LessonBlockType, BlockCatalogEntry> = {
  [LessonBlockType.TEXT]: {
    type: LessonBlockType.TEXT,
    label: 'Văn bản',
    description: 'Đoạn văn, văn bản định dạng chi tiết',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  [LessonBlockType.HEADING]: {
    type: LessonBlockType.HEADING,
    label: 'Tiêu đề mục',
    description: 'Tiêu đề phân cấp chương mục',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  [LessonBlockType.IMAGE]: {
    type: LessonBlockType.IMAGE,
    label: 'Hình ảnh',
    description: 'Hình ảnh tư liệu lịch sử',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  [LessonBlockType.VIDEO]: {
    type: LessonBlockType.VIDEO,
    label: 'Phim tư liệu',
    description: 'Phim tài liệu, băng ghi hình lịch sử',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  [LessonBlockType.QUOTE]: {
    type: LessonBlockType.QUOTE,
    label: 'Trích dẫn',
    description: 'Danh ngôn, lời hịch hào hùng',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  [LessonBlockType.DIVIDER]: {
    type: LessonBlockType.DIVIDER,
    label: 'Đường phân cách',
    description: 'Đường kẻ phân tách nội dung',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  [LessonBlockType.CALLOUT]: {
    type: LessonBlockType.CALLOUT,
    label: 'Hộp ghi chú',
    description: 'Hộp ghi chú bối cảnh, lưu ý sử gia',
    group: LessonBlockGroup.BASIC,
    showInPalette: true,
  },
  // Gộp "Nhân vật liên quan" vào "Hồ sơ thực thể" và gộp "Thẻ sự kiện" vào "Sự kiện liên quan"
  // trên bảng chọn khối mới; plugin/renderer cũ vẫn giữ trong Registry để tương thích dữ liệu đã lưu.
  [LessonBlockType.CHARACTER]: {
    type: LessonBlockType.CHARACTER,
    label: 'Hồ sơ thực thể',
    description: 'Hồ sơ nhân vật, tổ chức, triều đại, địa danh liên quan',
    group: LessonBlockGroup.SPECIALIZED,
    showInPalette: true,
  },
  [LessonBlockType.TIMELINE]: {
    type: LessonBlockType.TIMELINE,
    label: 'Dòng thời gian',
    description: 'Dòng thời gian các mốc sự kiện',
    group: LessonBlockGroup.SPECIALIZED,
    showInPalette: false,
  },
  [LessonBlockType.RELATED_EVENTS]: {
    type: LessonBlockType.RELATED_EVENTS,
    label: 'Sự kiện liên quan',
    description: 'Thẻ diễn biến và các sự kiện lịch sử gắn kết',
    group: LessonBlockGroup.SPECIALIZED,
    showInPalette: true,
  },
  [LessonBlockType.MAP]: {
    type: LessonBlockType.MAP,
    label: 'Bản đồ lịch sử',
    description: 'Địa bàn chiến sự, di tích bản đồ',
    group: LessonBlockGroup.SPECIALIZED,
    showInPalette: true,
  },
  [LessonBlockType.COMPARISON_TABLE]: {
    type: LessonBlockType.COMPARISON_TABLE,
    label: 'Bảng so sánh',
    description: 'Bảng so sánh tương quan lực lượng',
    group: LessonBlockGroup.SPECIALIZED,
    showInPalette: true,
  },
  [LessonBlockType.SECTION_ROW]: {
    type: LessonBlockType.SECTION_ROW,
    label: 'Bố cục nhiều cột',
    description: 'Chia bố cục đa cột kèm mẫu sẵn (Tạp chí 4:8, Đối xứng 6:6, 3 cột...)',
    group: LessonBlockGroup.ADVANCED,
    showInPalette: false,
  },
  [LessonBlockType.QUIZ]: {
    type: LessonBlockType.QUIZ,
    label: 'Ôn tập',
    description: 'Vài câu tự kiểm tra tại chỗ (soạn mới hoặc lấy từ Ngân hàng)',
    group: LessonBlockGroup.ADVANCED,
    lessonOnly: true,
    showInPalette: true,
  },
  [LessonBlockType.RESOURCE_LINK]: {
    type: LessonBlockType.RESOURCE_LINK,
    label: 'Tài liệu đính kèm',
    description: 'Liên kết sử liệu tham khảo ở cuối bài học',
    showInPalette: false,
  },
  [LessonBlockType.EVENT]: {
    type: LessonBlockType.EVENT,
    label: 'Thẻ sự kiện',
    description: 'Thẻ sự kiện lịch sử đơn lẻ',
    showInPalette: false,
  },
  [LessonBlockType.RELATED_PEOPLE]: {
    type: LessonBlockType.RELATED_PEOPLE,
    label: 'Nhân vật liên quan',
    description: 'Danh sách nhân vật lịch sử liên quan',
    showInPalette: false,
  },
};

export const LESSON_BLOCK_ITEMS: BlockPaletteItem[] = Object.values(BLOCK_CATALOG)
  .filter((entry): entry is BlockCatalogEntry & { group: LessonBlockGroup } =>
    entry.showInPalette && Boolean(entry.group)
  )
  .map(({ type, label, description, group, lessonOnly }) => ({
    type,
    label,
    description,
    group,
    lessonOnly,
  }));

export function getBlockLabel(
  type: LessonBlockType | string,
  fallback: string = 'Khối nội dung'
): string {
  return BLOCK_CATALOG[type as LessonBlockType]?.label ?? fallback;
}

export interface CalloutVariantOption {
  variant: CalloutVariant;
  label: string;
  inspectorLabel: string;
  icon: string;
  cssModifier: string;
  editorBorderClass: string;
  editorSurfaceClass: string;
  headerBarClass: string;
  swatchClass: string;
}

export const CALLOUT_VARIANT_OPTIONS: ReadonlyArray<CalloutVariantOption> = [
  {
    variant: CalloutVariant.HISTORICAL_NOTE,
    label: 'Hổ phách',
    inspectorLabel: 'Hổ phách (Ghi chú)',
    icon: '📜',
    cssModifier: 'hisgo-callout--historical-note',
    editorBorderClass: 'border-amber-200/80 border-l-4 border-l-amber-500',
    editorSurfaceClass: 'bg-amber-50/45',
    headerBarClass: 'bg-amber-600 text-white',
    swatchClass: 'bg-amber-500',
  },
  {
    variant: CalloutVariant.INFO,
    label: 'Xanh lam',
    inspectorLabel: 'Xanh lam (Thông tin)',
    icon: '💡',
    cssModifier: 'hisgo-callout--info',
    editorBorderClass: 'border-sky-200/80 border-l-4 border-l-blue-600',
    editorSurfaceClass: 'bg-sky-50/45',
    headerBarClass: 'bg-sky-700 text-white',
    swatchClass: 'bg-blue-600',
  },
  {
    variant: CalloutVariant.WARNING,
    label: 'Đỏ son',
    inspectorLabel: 'Đỏ son (Lưu ý / Tranh luận)',
    icon: '⚠️',
    cssModifier: 'hisgo-callout--warning',
    editorBorderClass: 'border-rose-200/80 border-l-4 border-l-rose-600',
    editorSurfaceClass: 'bg-rose-50/45',
    headerBarClass: 'bg-rose-700 text-white',
    swatchClass: 'bg-rose-600',
  },
  {
    variant: CalloutVariant.SUCCESS,
    label: 'Xanh rêu',
    inspectorLabel: 'Xanh rêu (Điểm sáng / Ý nghĩa)',
    icon: '✨',
    cssModifier: 'hisgo-callout--success',
    editorBorderClass: 'border-emerald-200/80 border-l-4 border-l-emerald-600',
    editorSurfaceClass: 'bg-emerald-50/45',
    headerBarClass: 'bg-emerald-700 text-white',
    swatchClass: 'bg-emerald-600',
  },
  {
    variant: CalloutVariant.NEUTRAL,
    label: 'Trung tính',
    inspectorLabel: 'Xám đá (Trung tính)',
    icon: '📌',
    cssModifier: 'hisgo-callout--neutral',
    editorBorderClass: 'border-slate-200 border-l-4 border-l-slate-500',
    editorSurfaceClass: 'bg-slate-50/70',
    headerBarClass: 'bg-slate-700 text-white',
    swatchClass: 'bg-slate-500',
  },
];

export const CALLOUT_EMOJI_PRESETS: ReadonlyArray<string> = [
  '📌', '💡', '📜', '⚠️', '✨', '📖', '⚔️', '🏛️', '🗓️', '🔍', '💬', '⭐',
];

export interface CalloutBoxStyleOption {
  value: CalloutBoxStyle;
  label: string;
  cssModifier: string;
}

export const CALLOUT_BOX_STYLE_OPTIONS: ReadonlyArray<CalloutBoxStyleOption> = [
  { value: CalloutBoxStyle.LEFT_ACCENT, label: 'Viền trái', cssModifier: '' },
  { value: CalloutBoxStyle.HEADER_BAR, label: 'Thanh tiêu đề', cssModifier: 'hisgo-callout--header-bar' },
  { value: CalloutBoxStyle.OUTLINED, label: 'Đóng khung', cssModifier: 'hisgo-callout--outlined' },
];

export interface CalloutMediaAlignOption {
  value: CalloutMediaAlign;
  label: string;
  cssModifier: string;
  editorFloatClass: string;
}

export const CALLOUT_MEDIA_ALIGN_OPTIONS: ReadonlyArray<CalloutMediaAlignOption> = [
  { value: CalloutMediaAlign.LEFT, label: 'Bên trái', cssModifier: 'hisgo-callout-media--left', editorFloatClass: 'md:float-left md:mr-4' },
  { value: CalloutMediaAlign.RIGHT, label: 'Bên phải', cssModifier: 'hisgo-callout-media--right', editorFloatClass: 'md:float-right md:ml-4' },
];

export function resolveCalloutOption(variant?: CalloutVariant): CalloutVariantOption {
  const target = variant || CalloutVariant.HISTORICAL_NOTE;
  return CALLOUT_VARIANT_OPTIONS.find((opt) => opt.variant === target) ?? CALLOUT_VARIANT_OPTIONS[0];
}

export function resolveCalloutIcon(block: { variant?: CalloutVariant; icon?: string }): string {
  if (block.icon !== undefined) return block.icon.trim();
  return resolveCalloutOption(block.variant).icon;
}

export function resolveCalloutBoxStyleOption(boxStyle?: CalloutBoxStyle): CalloutBoxStyleOption {
  const target = boxStyle || CalloutBoxStyle.LEFT_ACCENT;
  return CALLOUT_BOX_STYLE_OPTIONS.find((opt) => opt.value === target) ?? CALLOUT_BOX_STYLE_OPTIONS[0];
}

export function resolveCalloutMediaAlignOption(align?: CalloutMediaAlign): CalloutMediaAlignOption {
  const target = align || CalloutMediaAlign.RIGHT;
  return CALLOUT_MEDIA_ALIGN_OPTIONS.find((opt) => opt.value === target) ?? CALLOUT_MEDIA_ALIGN_OPTIONS[1];
}

export const ROW_LAYOUT_CONFIG = {
  MIN_COLUMN_COUNT: 1,
  MAX_COLUMN_COUNT: 4,
  MIN_COLUMN_WIDTH_PERCENT: 20,
  MAX_COLUMN_WIDTH_PERCENT: 80,
  SNAP_STEP_PERCENT: 5,
  DEFAULT_GAP_PX: 16,
} as const;

export interface RowLayoutPresetDefinition {
  id: RowLayoutPresetId;
  label: string;
  description: string;
  columnCount: number;
  widths: number[];
  gapSize: RowGapSize;
  showColumnDivider: boolean;
}

export const ROW_LAYOUT_PRESETS: RowLayoutPresetDefinition[] = [
  {
    id: RowLayoutPresetId.MAGAZINE_4_8,
    label: 'Tạp chí (4:8)',
    description: 'Cột dẫn trái gọn + nội dung chính rộng',
    columnCount: 2,
    widths: [33.33, 66.67],
    gapSize: RowGapSize.LG,
    showColumnDivider: true,
  },
  {
    id: RowLayoutPresetId.SYMMETRIC_6_6,
    label: 'Chia đôi (6:6)',
    description: 'Hai cột cân đối song song',
    columnCount: 2,
    widths: [50, 50],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
  {
    id: RowLayoutPresetId.MEDIA_LEAD_7_5,
    label: 'Chính – Phụ (7:5)',
    description: 'Bài viết chính rộng + tư liệu bên phải',
    columnCount: 2,
    widths: [60, 40],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
  {
    id: RowLayoutPresetId.THREE_COLUMNS,
    label: '3 cột đều',
    description: 'Trình bày 3 thẻ hoặc 3 mốc song song',
    columnCount: 3,
    widths: [33.33, 33.33, 33.34],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
  {
    id: RowLayoutPresetId.THREE_COL_FEATURE,
    label: 'Tiêu điểm giữa',
    description: 'Cột phụ 2 bên + nội dung trung tâm',
    columnCount: 3,
    widths: [25, 50, 25],
    gapSize: RowGapSize.MD,
    showColumnDivider: true,
  },
  {
    id: RowLayoutPresetId.SINGLE_COLUMN,
    label: '1 cột đơn',
    description: 'Gom các khối thành 1 khung dọc',
    columnCount: 1,
    widths: [100],
    gapSize: RowGapSize.MD,
    showColumnDivider: false,
  },
];

export interface RowFrameStyleOption {
  value: RowFrameStyle;
  label: string;
  title: string;
  cssModifier: string;
  editorClass: string;
}

export const ROW_FRAME_STYLE_OPTIONS: ReadonlyArray<RowFrameStyleOption> = [
  { value: RowFrameStyle.NONE, label: 'Không', title: 'Không khung', cssModifier: '', editorClass: '' },
  {
    value: RowFrameStyle.OUTLINED,
    label: 'Khung',
    title: 'Đóng khung viền',
    cssModifier: 'hisgo-row-container--outlined',
    editorClass: 'rounded-2xl border border-slate-300 bg-white p-4 sm:p-5 relative',
  },
  {
    value: RowFrameStyle.TINTED,
    label: 'Nền',
    title: 'Nền nổi nhẹ',
    cssModifier: 'hisgo-row-container--tinted',
    editorClass: 'rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 sm:p-5 relative',
  },
];

export function resolveRowFrameOption(style?: RowFrameStyle): RowFrameStyleOption {
  const target = style || RowFrameStyle.NONE;
  return ROW_FRAME_STYLE_OPTIONS.find((opt) => opt.value === target) ?? ROW_FRAME_STYLE_OPTIONS[0];
}
