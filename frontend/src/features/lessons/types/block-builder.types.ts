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

export enum SplitSide {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export type ChapterBlockZone = 'LEFT' | 'RIGHT' | 'FULL';

export interface BaseBlockData {
  id: string;
  type: LessonBlockType;
  width?: BlockWidthType;
  showOnMobile?: boolean; // Bật/tắt hiển thị trên thiết bị di động
  sourceMode?: 'AUTO' | 'MANUAL' | 'HYBRID'; // Nguồn nội dung: Thủ công, Đồ thị tri thức hoặc Kết hợp
  /** Vùng cột hiển thị khi khối nằm trong một StoryChapterUnit (Container) */
  zone?: ChapterBlockZone;
}

export interface TextBlockData extends BaseBlockData {
  type: LessonBlockType.TEXT;
  content: string;
}

export type TimelineSourceMode = 'AUTO' | 'MANUAL' | 'HYBRID';
export type TimelineDateFormat = 'YEAR_ONLY' | 'FULL_DATE';
export type TimelineSortOrder = 'CHRONOLOGICAL' | 'REVERSE_CHRONOLOGICAL';
export type TimelineSceneStyle = 'MUSEUM_SPLIT' | 'CINEMATIC_BACKDROP';

export interface TimelineFilterConfig {
  relationTypes?: string[]; // Vd: 'PARTICIPATED', 'TOOK_PLACE_AT', 'FOUNDED', 'LED'
  startYear?: number;
  endYear?: number;
  statusPublishedOnly?: boolean;
  eventTypes?: string[];
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
  maxEvents?: number;
  filterConfig?: TimelineFilterConfig;
  displayConfig?: TimelineDisplayConfig;
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

export type CalloutVariant = 'INFO' | 'WARNING' | 'HISTORICAL_NOTE' | 'SUCCESS';

export interface CalloutBlockData extends BaseBlockData {
  type: LessonBlockType.CALLOUT;
  variant: CalloutVariant;
  title: string;
  content: string;
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

export interface RelatedPeopleBlockData extends BaseBlockData {
  type: LessonBlockType.RELATED_PEOPLE;
  title: string;
  description?: string;
  sourceMode?: 'AUTO' | 'MANUAL';
  people: Array<{ id: string; name: string; role?: string; avatarUrl?: string }>;
}

export interface RelatedEventsBlockData extends BaseBlockData {
  type: LessonBlockType.RELATED_EVENTS;
  title: string;
  description?: string;
  sourceMode?: 'AUTO' | 'MANUAL';
  events: Array<{ id: string; title: string; year?: string | number }>;
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

export enum StoryChapterLayout {
  TEXT_LEFT_IMAGE_RIGHT = 'TEXT_LEFT_IMAGE_RIGHT', // Văn bản trái – ảnh phải
  IMAGE_LEFT_TEXT_RIGHT = 'IMAGE_LEFT_TEXT_RIGHT', // Ảnh trái – văn bản phải
  FULL_WIDTH_IMAGE = 'FULL_WIDTH_IMAGE',           // Ảnh toàn chiều rộng
  TEXT_ONLY = 'TEXT_ONLY',                         // Chỉ văn bản
}

// ============================================================================
// KIẾN TRÚC 3 LỚP EDITORIAL SPREAD: TEMPLATE -> LAYOUT SLOTS -> CONTENT BLOCKS
// ============================================================================

export type EditorialLayout =
  | 'MAGAZINE_GRID'   // Tạp chí cổ điển (Cột dẫn nhập trái + Bài viết & Ảnh phải + Trích dẫn dưới)
  | 'ASYMMETRIC'      // Tư liệu chủ đạo trái + Bài viết phải
  | 'FULL_WIDTH'      // Điện ảnh toàn cảnh (Ảnh tràn trên + Bài viết chia cột dưới)
  | 'SPLIT'           // Đối xứng 2 bên
  | 'MASONRY';

export type EditorialColumnRatio = '4_8' | '5_7' | '6_6' | '7_5' | '8_4';

export type EditorialMediaRatio = '16_10' | '21_9' | '16_9' | '4_3' | '3_4' | 'AUTO';

export type EditorialSlotSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface EditorialElementOverrides {
  intro?: {
    dropCap?: boolean;
    initialLetterColor?: string;
    firstParagraphHighlight?: boolean;
    paragraphIndent?: boolean;
    fontSizePx?: number;
    textColor?: string;
  };
  heading?: {
    fontFamily?: string;
    level?: 'H1' | 'H2' | 'H3' | 'H4';
    weight?: 'REGULAR' | 'MEDIUM' | 'BOLD';
    transform?: 'NONE' | 'UPPERCASE';
    color?: string;
  };
  article?: {
    textColumns?: 1 | 2 | 3;
    dropCap?: boolean;
    fontSizePx?: number;
    textAlign?: 'LEFT' | 'CENTER' | 'JUSTIFY';
  };
  mainImage?: {
    ratio?: EditorialMediaRatio;
    imageFit?: 'COVER' | 'CONTAIN';
    imagePosition?: 'CENTER' | 'TOP' | 'BOTTOM';
    captionPosition?: 'BOTTOM' | 'OVERLAY' | 'HIDDEN';
  };
  pullQuote?: {
    style?: 'CLASSIC_QUOTES' | 'BORDER_LEFT' | 'MINIMAL';
    accentColor?: string;
    fontSizePx?: number;
  };
}

export interface EditorialSpreadConfig {
  version: 1;

  layout: {
    type: EditorialLayout;
    columns: 8 | 12 | 16;
    columnRatio?: EditorialColumnRatio; // Tỷ lệ chia cột: 4:8, 5:7, 6:6, 7:5, 8:4
    textColumns?: 1 | 2 | 3;            // Số cột văn bản mặc định: 1, 2, 3
    gap: 'SM' | 'MD' | 'LG';
    rowGap?: 'SM' | 'MD' | 'LG';
    contentWidth?: 'NARROW' | 'NORMAL' | 'WIDE' | 'FULL';
    horizontalAlign?: 'LEFT' | 'CENTER' | 'RIGHT';
    padding: 'NONE' | 'COMPACT' | 'SPACIOUS';
    paddingTopPx?: number;
    paddingBottomPx?: number;
    paddingLeftPx?: number;
    paddingRightPx?: number;
    childBlockGap?: 'SM' | 'MD' | 'LG';
    alignment: 'TOP' | 'CENTER' | 'BOTTOM';
  };

  typography: {
    headingFont: 'SERIF' | 'SANS';
    headingFontName?: string;           // Playfair Display, Cormorant Garamond, Lora, Be Vietnam Pro...
    bodyFont: 'SERIF' | 'SANS';
    bodyFontName?: string;
    captionFont?: 'SERIF' | 'SANS';
    headingSize: 'SM' | 'MD' | 'LG' | 'XL';
    headingWeight?: 'REGULAR' | 'MEDIUM' | 'BOLD';
    headingTransform?: 'NONE' | 'UPPERCASE';
    headingLetterSpacing?: 'TIGHT' | 'NORMAL' | 'WIDE';
    bodySize: 'SM' | 'MD' | 'LG';
    bodyFontSizePx?: number;            // Cỡ chữ nội dung (12–24px)
    bodyWeight?: 'REGULAR' | 'MEDIUM' | 'BOLD';
    bodyAlign?: 'LEFT' | 'CENTER' | 'JUSTIFY';
    lineHeight: 'NORMAL' | 'RELAXED' | 'LOOSE';
    lineHeightValue?: '1.5' | '1.7' | '1.9';
    dropCap: boolean;
    initialLetterColor?: string;        // Màu chữ cái đầu (VD: #8b261d)
    firstParagraphHighlight?: boolean;  // Nhấn mạnh đoạn đầu
    pullQuoteStyle?: 'CLASSIC_QUOTES' | 'BORDER_LEFT' | 'MINIMAL';
    paragraphIndent?: boolean;          // Thụt đầu dòng
  };

  media: {
    defaultRatio: EditorialMediaRatio;
    imageFit: 'COVER' | 'CONTAIN';
    imagePosition?: 'CENTER' | 'TOP' | 'BOTTOM';
    showCaption?: boolean;
    captionPosition: 'BOTTOM' | 'OVERLAY' | 'HIDDEN';
  };

  appearance?: {
    backgroundColor?: string;           // VD: #faf7f2, #ffffff, #f5f5f4, #1c1917
    backgroundImageUrl?: string;
    overlayOpacity?: number;            // 0..80
    showRegionDividers?: boolean;       // Đường phân cách giữa các vùng
    borderStyle?: 'NONE' | 'SOLID' | 'DASHED';
    borderWidthPx?: number;
    borderColor?: string;
    borderRadius?: 'NONE' | 'MD' | 'LG' | 'XL';
    shadow?: 'NONE' | 'SM' | 'MD' | 'LG';
    scrollAnimation?: 'NONE' | 'FADE_UP' | 'REVEAL';
    stickySection?: boolean;
    hideOnDesktop?: boolean;
    hideOnTablet?: boolean;
    hideOnMobile?: boolean;
  };

  responsive: {
    tabletColumns: 8;
    mobileColumns: 4;
    stackOnMobile: boolean;
    mobileOrder?: 'DEFAULT' | 'IMAGE_FIRST' | 'TEXT_FIRST';
  };
}

export interface EditorialSlotItem {
  id: string;                   // VD: "intro", "article", "hero", "sidebar"
  label: string;                // Tên hiển thị vùng chứa (VD: "Mở đầu (Intro)", "Bài viết chính", "Ảnh toàn cảnh")
  span: EditorialSlotSpan;      // Số cột chiếm trên lưới 12 cột (1..12)
  textColumns?: 1 | 2 | 3;      // Số cột báo chí riêng cho vùng văn bản trong Slot này
  dropCap?: boolean;            // Áp dụng chữ cái đầu lớn (Drop Cap) cho đoạn văn mở đầu của Slot này
  mediaRatio?: EditorialMediaRatio; // Tỷ lệ ảnh riêng cho Slot này (ghi đè media.defaultRatio)
  blocks: LessonBlockItem[];    // Danh sách Content Blocks (Text, Image, Quote, Heading...) nằm trong Slot
}

export interface StoryChapterDisplayConfig {
  showChapterNumber: boolean;   // Số thứ tự chương
  showTime: boolean;            // Hiển thị thời gian
  showLocation: boolean;        // Hiển thị địa điểm
  showReferenceSource: boolean; // Hiển thị nguồn tham khảo
}

export type StorySubjectType = 'EVENT' | 'PERSON' | 'DYNASTY' | 'ERA';

export type StoryChapterLayoutConfig = EditorialSpreadConfig;

/**
 * Cấp 2 trong kiến trúc Story -> Chapters[] -> Content Blocks[]:
 * StoryChapterUnit là một Container thuần túy (Pure Container) chứa cấu hình dàn trang riêng (config),
 * thứ tự sắp xếp (order — dùng để tính động số chương CHƯƠNG I, CHƯƠNG II... khi render),
 * và danh sách các Content Blocks (blocks: LessonBlockItem[]) bên trong.
 * Không lưu cứng chapterNumber, leadText, contentHtml, imageUrl hay pullQuoteText trên Chapter.
 */
export interface StoryChapterUnit {
  id: string;
  order: number;

  title: string;
  subtitle?: string;

  config: StoryChapterLayoutConfig;
  overrides?: EditorialElementOverrides;

  blocks: LessonBlockItem[];
}

export interface StorySubChapterItem {
  id: string;
  numberLabel: string;          // VD: "II. DIỄN BIẾN CHÍNH"
  title: string;                // Tiêu đề chương con
  timeLabel?: string;           // Thời gian của chương con
  locationName?: string;        // Địa điểm của chương con
  contentHtml: string;          // Nội dung chi tiết Rich Text của chương con
  imageUrl?: string;            // Ảnh đại diện của chương con (tuỳ chọn)
  imageCaption?: string;        // Chú thích ảnh của chương con
  imageRatio?: EditorialMediaRatio; // Ghi đè tỷ lệ ảnh riêng cho mục này
  textColumns?: 1 | 2 | 3;      // Ghi đè số cột văn bản riêng cho mục này
  layout?: StoryChapterLayout;  // Bố cục riêng của chương con
}

export interface StoryChapterBlockData extends BaseBlockData {
  type: LessonBlockType.STORY_CHAPTER;
  // Định danh Câu chuyện tổng thể (Story-level: Sự kiện, Nhân vật, Triều đại hoặc Giai đoạn lịch sử)
  storyTitle?: string;          // Tên câu chuyện tổng thể
  subjectType?: StorySubjectType; // Chủ đề: Sự kiện | Nhân vật | Triều đại | Giai đoạn
  showToc?: boolean;            // Hiển thị mục lục điều hướng chương tự động
  autoNumberChapters?: boolean; // Tự động đánh số chương La Mã (I, II, III...)
  // Danh sách các Chương độc lập bên trong Story (Story -> Chapters[] -> Content Blocks[])
  chapters?: StoryChapterUnit[];
  // Các trường tương thích ngược (Chương 1 mặc định)
  chapterNumber: string;        // VD: "I. BỐI CẢNH LỊCH SỬ"
  title: string;                // Tiêu đề chương (VD: "Trước trận Bạch Đằng")
  subtitle: string;             // Tiêu đề phụ
  leadText: string;             // Đoạn mở đầu cột trái có Drop Cap
  leadSecondaryText?: string;   // Đoạn bổ trợ cột trái bên dưới đường kẻ ngắn
  contentHtml: string;          // Nội dung chi tiết (Rich Text)
  pullQuoteText?: string;       // Lời trích dẫn nổi bật góc dưới trái (VD: "Bạch Đằng giang, ngàn đời vang danh...")
  pullQuoteAuthor?: string;     // Tác giả trích dẫn (VD: "Trần Quốc Tuấn")
  // Metadata lịch sử
  timeLabel: string;            // Thời gian diễn ra
  locationName: string;         // Địa điểm diễn ra
  referenceSource: string;      // Nguồn tham khảo sử liệu
  // 2. Nhóm Hình ảnh đại diện
  imageUrl: string;             // Ảnh đại diện chương
  imageCaption: string;         // Chú thích ảnh
  // 3. Kiến trúc 3 cấp Editorial Spread: Mặc định toàn khối (config) + Ghi đè từng ô con (overrides) + Responsive
  layout: StoryChapterLayout;
  config?: EditorialSpreadConfig;
  overrides?: EditorialElementOverrides;
  slots?: EditorialSlotItem[];
  // 4. Nhóm Hiển thị
  displayConfig: StoryChapterDisplayConfig;
  // 5. Chương con đánh số (01, 02...) & Khối nội dung lồng bổ sung
  subChapters: StorySubChapterItem[];
  nestedBlocks: LessonBlockItem[];
}

export type LessonBlockItem =
  | TextBlockData
  | HeadingBlockData
  | TimelineBlockData
  | CharacterBlockData
  | EventBlockData
  | ImageBlockData
  | VideoBlockData
  | ComparisonTableBlockData
  | QuizBlockData
  | ResourceLinkBlockData
  | MapBlockData
  | RowSectionBlockData
  | CalloutBlockData
  | QuoteBlockData
  | DividerBlockData
  | RelatedPeopleBlockData
  | RelatedEventsBlockData
  | StoryChapterBlockData;
