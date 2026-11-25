import { LessonBlockType } from './editor.types';
import type { QuizQuestion } from './editor.types';

export interface TimelineNodeMedia {
  id?: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  caption?: string;
}

export interface TimelineNode {
  id: string;
  year: string;
  dateLabel?: string; // Nhãn ngày/thời gian tuỳ biến (vd: "Thế kỷ X", "Khoảng 1285", "Xuân 1975")
  title: string;
  description: string;
  /** Nội dung văn bản giàu định dạng hợp nhất của phân cảnh (Composite Story Scene) */
  contentHtml?: string;
  eventId?: string;
  locationName?: string; // Địa điểm diễn ra sự kiện
  role?: string; // Vai trò của thực thể trong sự kiện (vd: "Tổng chỉ huy", "Tham gia")
  thumbnailUrl?: string; // Ảnh tư liệu hoặc ảnh nền phân cảnh
  mediaCaption?: string; // Chú thích ảnh tư liệu của phân cảnh
  detailContent?: string;
  mediaList?: TimelineNodeMedia[];
  isManual?: boolean; // Mốc được nhập hoặc bổ sung thủ công
  confidence?: 'EXACT' | 'APPROXIMATE' | 'UNCERTAIN'; // Độ chính xác niên đại
}

export enum BlockWidthType {
  FULL = 'FULL',     // Toàn vùng nội dung (100%)
  HALF = 'HALF',     // 1/2 hàng (50%)
  THIRD = 'THIRD',   // 1/3 hàng (33.33%)
  AUTO = 'AUTO',     // Theo nội dung
}

export enum TimelineOrientation {
  VERTICAL = 'VERTICAL',     // ↕ Trục dọc
}

export enum SplitSide {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface BaseBlockData {
  id: string;
  type: LessonBlockType;
  width?: BlockWidthType;
  showOnMobile?: boolean; // Bật/tắt hiển thị trên thiết bị di động
  /** Chỉ còn MANUAL (chế độ AUTO dựng từ đồ thị tri thức đã bỏ cùng Knowledge Graph 2026-11-05). Dữ liệu cũ có thể còn 'AUTO'/'HYBRID' — coi như MANUAL. */
  sourceMode?: 'MANUAL' | 'AUTO' | 'HYBRID';
}

export interface TextBlockData extends BaseBlockData {
  type: LessonBlockType.TEXT;
  content: string;
}

export type TimelineSourceMode = 'MANUAL' | 'AUTO' | 'HYBRID';

export enum TimelineDateFormat {
  YEAR_ONLY = 'YEAR_ONLY',
}

export enum TimelineSortOrder {
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  REVERSE_CHRONOLOGICAL = 'REVERSE_CHRONOLOGICAL',
}

export enum TimelineSceneStyle {
  MUSEUM_SPLIT = 'MUSEUM_SPLIT',
  CINEMATIC_BACKDROP = 'CINEMATIC_BACKDROP',
  CHRONO_MINIMAL = 'CHRONO_MINIMAL',
}


export interface TimelineDisplayConfig {
  sceneStyle?: TimelineSceneStyle;
  dateFormat?: TimelineDateFormat;
  sortOrder?: TimelineSortOrder;
  showDescription?: boolean;
  showImage?: boolean;
  showLocation?: boolean;
  showRole?: boolean;
  showDetailButton?: boolean;
  itemsPerPage?: number;
}

export interface TimelineBlockData extends BaseBlockData {
  type: LessonBlockType.TIMELINE;
  title: string;
  subtitle: string;
  orientation?: TimelineOrientation;
  sourceMode?: TimelineSourceMode;
  displayConfig?: TimelineDisplayConfig;
  nodes: TimelineNode[];
}

export interface CharacterBlockData extends BaseBlockData {
  type: LessonBlockType.CHARACTER;
  entityId?: string;
  name: string;
  years: string;
  /** Vai trò / chức danh ngắn hiện dưới tên (vd: "Chủ tướng đại thắng Bạch Đằng"). */
  role?: string;
  summary: string;
  avatarUrl?: string;
  wikidataId?: string;
  sourceUrl?: string;
  /** Nội dung chi tiết (tuỳ chọn, HTML dài) — ẩn mặc định, chỉ xổ ra khi bấm "Xem chi
   * tiết" ở bản Xem trước/trang học sinh. Dùng khi tóm tắt 500 ký tự không đủ. */
  detailContent?: string;
}

export interface ImageBlockData extends BaseBlockData {
  type: LessonBlockType.IMAGE;
  src: string;
  alt?: string;
  caption?: string;
}

export interface VideoBlockData extends BaseBlockData {
  type: LessonBlockType.VIDEO;
  src: string;
  sourceType?: string;
  caption?: string;
}

export interface ComparisonTableRow {
  criteria: string;
  colA: string;
  colB: string;
}

export interface ComparisonTableBlockData extends BaseBlockData {
  type: LessonBlockType.COMPARISON_TABLE;
  title?: string;
  colAName: string;
  colBName: string;
  rows: ComparisonTableRow[];
}

export interface QuizOptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** Câu trong khối Ôn tập — cùng dạng câu của Ngân hàng; `sourceQuestionId` = câu gốc khi chép từ Ngân hàng. */
export type LessonQuizQuestion = QuizQuestion & { sourceQuestionId?: string };

/**
 * Khối Ôn tập trong bài học: vài câu tự kiểm tra tại chỗ, không chấm điểm, không lưu.
 * `question` / `options` / `explanation` là dạng cũ (1 câu một đáp án) — chỉ đọc, đọc qua `quizBlockQuestions()`.
 */
export interface QuizBlockData extends BaseBlockData {
  type: LessonBlockType.QUIZ;
  title?: string;
  questions?: LessonQuizQuestion[];
  question?: string;
  options?: QuizOptionItem[];
  explanation?: string;
}

export interface ResourceLinkBlockData extends BaseBlockData {
  type: LessonBlockType.RESOURCE_LINK;
  title: string;
  url: string;
  note?: string;
}

export interface MapBlockData extends BaseBlockData {
  type: LessonBlockType.MAP;
  locationName: string;
  description: string;
}

export enum CalloutVariant {
  HISTORICAL_NOTE = 'HISTORICAL_NOTE',
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  NEUTRAL = 'NEUTRAL',
}

export enum CalloutBoxStyle {
  LEFT_ACCENT = 'LEFT_ACCENT',
  HEADER_BAR = 'HEADER_BAR',
  OUTLINED = 'OUTLINED',
}

export enum CalloutMediaAlign {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface CalloutMediaConfig {
  src: string;
  caption?: string;
  align?: CalloutMediaAlign;
}

export interface CalloutBlockData extends BaseBlockData {
  type: LessonBlockType.CALLOUT;
  variant: CalloutVariant;
  boxStyle?: CalloutBoxStyle;
  icon?: string;
  collapsible?: boolean;
  title: string;
  content: string;
  media?: CalloutMediaConfig;
}

export interface QuoteBlockData extends BaseBlockData {
  type: LessonBlockType.QUOTE;
  quoteText: string;
  author: string;
  sourceContext?: string; // vd: "Hịch tướng sĩ (1285)" hoặc "Lời thề Đông Quan"
}

export interface HeadingBlockData extends BaseBlockData {
  type: LessonBlockType.HEADING;
  level: 1 | 2 | 3 | 4;
  text: string;
}

export interface DividerBlockData extends BaseBlockData {
  type: LessonBlockType.DIVIDER;
}

export enum RowGapSize {
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
}

export enum RowVerticalAlign {
  TOP = 'TOP',
  CENTER = 'CENTER',
  STRETCH = 'STRETCH',
}

export enum RowFrameStyle {
  NONE = 'NONE',
  OUTLINED = 'OUTLINED',
  TINTED = 'TINTED',
}

export enum RowLayoutPresetId {
  MAGAZINE_4_8 = 'MAGAZINE_4_8',
  SYMMETRIC_6_6 = 'SYMMETRIC_6_6',
  MEDIA_LEAD_7_5 = 'MEDIA_LEAD_7_5',
  THREE_COLUMNS = 'THREE_COLUMNS',
  THREE_COL_FEATURE = 'THREE_COL_FEATURE',
  SINGLE_COLUMN = 'SINGLE_COLUMN',
}

export interface ColumnData {
  id: string;
  widthPercent: number; // Tỷ lệ độ rộng cột tính theo %
  blocks: LessonBlockItem[]; // Khối con bên trong cột này (Composite Pattern)
}

export interface RowSectionBlockData extends BaseBlockData {
  type: LessonBlockType.SECTION_ROW;
  columnCount: number; // 1, 2, 3, 4
  columns: ColumnData[];
  layoutPreset?: RowLayoutPresetId;
  gapSize?: RowGapSize;
  verticalAlign?: RowVerticalAlign;
  showColumnDivider?: boolean;
  frameStyle?: RowFrameStyle;
  frameIcon?: string;
  gap?: number;
}

export type LessonBlockItem =
  | TextBlockData
  | HeadingBlockData
  | TimelineBlockData
  | CharacterBlockData
  | ImageBlockData
  | VideoBlockData
  | ComparisonTableBlockData
  | QuizBlockData
  | ResourceLinkBlockData
  | MapBlockData
  | RowSectionBlockData
  | CalloutBlockData
  | QuoteBlockData
  | DividerBlockData;
