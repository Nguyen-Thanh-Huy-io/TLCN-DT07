import { LessonBlockType } from './block-palette.types';
import { TimelineNode } from '../components/blocks/HistoricalTimelineBlock';

export enum BlockWidthType {
  FULL = 'FULL',     // Toàn vùng nội dung (100%)
  HALF = 'HALF',     // 1/2 hàng (50%)
  THIRD = 'THIRD',   // 1/3 hàng (33.33%)
  AUTO = 'AUTO',     // Theo nội dung
}

export enum TimelineOrientation {
  VERTICAL = 'VERTICAL',     // ↕ Trục dọc
  HORIZONTAL = 'HORIZONTAL', // ↔ Trục ngang
}

export interface BaseBlockData {
  id: string;
  type: LessonBlockType;
  width?: BlockWidthType;
}

export interface TextBlockData extends BaseBlockData {
  type: LessonBlockType.TEXT;
  content: string;
}

export interface TimelineBlockData extends BaseBlockData {
  type: LessonBlockType.TIMELINE;
  title: string;
  subtitle: string;
  orientation?: TimelineOrientation;
  nodes: TimelineNode[];
}

export interface CharacterBlockData extends BaseBlockData {
  type: LessonBlockType.CHARACTER;
  entityId?: string;
  name: string;
  years: string;
  summary: string;
  avatarUrl?: string;
  wikidataId?: string;
  sourceUrl?: string;
  /** Nội dung chi tiết (tuỳ chọn, HTML dài) — ẩn mặc định, chỉ xổ ra khi bấm "Xem chi
   * tiết" ở bản Xem trước/trang học sinh. Dùng khi tóm tắt 500 ký tự không đủ. */
  detailContent?: string;
}

export interface EventBlockData extends BaseBlockData {
  type: LessonBlockType.EVENT;
  eventId?: string;
  title: string;
  timeLocation: string;
  summary: string;
  thumbnailUrl?: string;
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

export interface QuizBlockData extends BaseBlockData {
  type: LessonBlockType.QUIZ;
  question: string;
  options: QuizOptionItem[];
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

export interface ColumnData {
  id: string;
  widthPercent: number; // Tỷ lệ độ rộng cột tính theo %
  blocks: LessonBlockItem[]; // Khối con bên trong cột này (Composite Pattern)
}

export interface RowSectionBlockData extends BaseBlockData {
  type: LessonBlockType.SECTION_ROW;
  columnCount: number; // 1, 2, 3, 4
  columns: ColumnData[];
  gap?: number;
}

export type LessonBlockItem =
  | TextBlockData
  | TimelineBlockData
  | CharacterBlockData
  | EventBlockData
  | ImageBlockData
  | VideoBlockData
  | ComparisonTableBlockData
  | QuizBlockData
  | ResourceLinkBlockData
  | MapBlockData
  | RowSectionBlockData;
