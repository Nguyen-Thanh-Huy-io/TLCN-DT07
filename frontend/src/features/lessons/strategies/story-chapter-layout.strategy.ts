import {
  EditorialColumnRatio,
  EditorialLayout,
  EditorialMediaRatio,
  EditorialSlotItem,
  EditorialSlotSpan,
  EditorialSpreadConfig,
  ImageBlockData,
  LessonBlockItem,
  QuoteBlockData,
  StoryChapterBlockData,
  StoryChapterLayout,
  StoryChapterUnit,
  StorySubChapterItem,
  StorySubjectType,
  TextBlockData,
} from '../types/block-builder.types';
import { LessonBlockType } from '../types/block-palette.types';

/**
 * Sinh ID duy nhất chuẩn UUID v4 (crypto.randomUUID), tuyệt đối không dùng Date.now()
 */
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

/**
 * Chuyển số nguyên dương sang số La Mã bằng thuật toán chuẩn (không giới hạn mảng cố định)
 */
export function toRoman(num: number): string {
  const safeNum = Math.max(1, Math.floor(num));
  const values: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let remaining = safeNum;
  let result = '';

  for (const [value, symbol] of values) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result;
}

/**
 * Tự động sinh nhãn chương từ thứ tự hiện tại (VD: index 0 -> "CHƯƠNG I", index 1 -> "CHƯƠNG II")
 */
export function getChapterLabel(index: number): string {
  return `CHƯƠNG ${toRoman(index + 1)}`;
}

export interface StorySubjectTypeOption {
  id: StorySubjectType;
  label: string;
  badge: string;
  description: string;
}

export const STORY_SUBJECT_TYPE_OPTIONS: StorySubjectTypeOption[] = [
  {
    id: 'EVENT',
    label: 'Sự kiện lịch sử',
    badge: '⚔️ Sự kiện',
    description: 'Kể chuyện về một trận đánh, chiến dịch hoặc sự kiện bước ngoặt.',
  },
  {
    id: 'PERSON',
    label: 'Nhân vật lịch sử',
    badge: '👤 Nhân vật',
    description: 'Tiểu sử, cuộc đời và sự nghiệp của danh nhân, anh hùng dân tộc.',
  },
  {
    id: 'DYNASTY',
    label: 'Triều đại',
    badge: '👑 Triều đại',
    description: 'Quá trình hình thành, hưng thịnh và dấu ấn của một vương triều.',
  },
  {
    id: 'ERA',
    label: 'Giai đoạn lịch sử',
    badge: '⏳ Thời kỳ',
    description: 'Bức tranh toàn cảnh về một thời kỳ hoặc giai đoạn lịch sử dài.',
  },
];

export interface StoryChapterLayoutOption {
  id: StoryChapterLayout;
  label: string;
  description: string;
}

export const STORY_CHAPTER_LAYOUT_OPTIONS: StoryChapterLayoutOption[] = [
  {
    id: StoryChapterLayout.IMAGE_LEFT_TEXT_RIGHT,
    label: 'Ảnh trái – văn bản phải',
    description: 'Khung ảnh tư liệu bên trái kết hợp nội dung và các chương con bên phải.',
  },
  {
    id: StoryChapterLayout.TEXT_LEFT_IMAGE_RIGHT,
    label: 'Văn bản trái – ảnh phải',
    description: 'Cột biên niên sử bên trái đối xứng với khung ảnh tư liệu bên phải.',
  },
  {
    id: StoryChapterLayout.FULL_WIDTH_IMAGE,
    label: 'Ảnh toàn chiều rộng',
    description: 'Trình bày ảnh tư liệu rộng toàn khung kèm chú thích và nội dung phân tích phía dưới.',
  },
  {
    id: StoryChapterLayout.TEXT_ONLY,
    label: 'Chỉ văn bản',
    description: 'Tập trung hoàn toàn vào mạch tự sự và các chương con mà không hiển thị ảnh đại diện.',
  },
];

export interface EditorialSlotBlueprint {
  id: string;
  label: string;
  span: EditorialSlotSpan;
  textColumns?: 1 | 2 | 3;
  dropCap?: boolean;
  mediaRatio?: EditorialMediaRatio;
  defaultBlockTypes: LessonBlockType[];
}

export interface EditorialTemplateDefinition {
  type: EditorialLayout;
  label: string;
  badge: string;
  description: string;
  defaultRatio: EditorialColumnRatio;
  slotBlueprints: EditorialSlotBlueprint[];
}

export const EDITORIAL_LAYOUT_TEMPLATES: EditorialTemplateDefinition[] = [
  {
    type: 'MAGAZINE_GRID',
    label: 'Tạp chí cổ điển',
    badge: '4 : 8',
    defaultRatio: '4_8',
    description: 'Cột dẫn nhập chữ cái lớn bên trái + Bài viết & Ảnh lớn bên phải.',
    slotBlueprints: [
      {
        id: 'intro',
        label: 'Mở đầu (Intro)',
        span: 4,
        textColumns: 1,
        dropCap: true,
        defaultBlockTypes: [LessonBlockType.TEXT],
      },
      {
        id: 'article',
        label: 'Bài viết chính (Article)',
        span: 8,
        textColumns: 1,
        dropCap: false,
        defaultBlockTypes: [LessonBlockType.HEADING, LessonBlockType.TEXT],
      },
      {
        id: 'hero',
        label: 'Ảnh toàn cảnh (Hero)',
        span: 12,
        mediaRatio: '16_10',
        defaultBlockTypes: [LessonBlockType.IMAGE],
      },
    ],
  },
  {
    type: 'ASYMMETRIC',
    label: 'Tư liệu đối trọng',
    badge: '7 : 5',
    defaultRatio: '7_5',
    description: 'Bài viết và ảnh bên trái kết hợp cột dẫn nhập và trích dẫn bên phải.',
    slotBlueprints: [
      {
        id: 'hero',
        label: 'Bài viết & Ảnh chính',
        span: 7,
        mediaRatio: '16_10',
        defaultBlockTypes: [LessonBlockType.IMAGE],
      },
      {
        id: 'article',
        label: 'Dẫn nhập & Trích dẫn',
        span: 5,
        textColumns: 1,
        dropCap: true,
        defaultBlockTypes: [LessonBlockType.TEXT, LessonBlockType.QUOTE],
      },
    ],
  },
  {
    type: 'FULL_WIDTH',
    label: 'Điện ảnh toàn khung',
    badge: '12 : 12',
    defaultRatio: '6_6',
    description: 'Ảnh đại cảnh tràn ngang phía trên kết hợp bài viết chia cột phía dưới.',
    slotBlueprints: [
      {
        id: 'hero',
        label: 'Ảnh đại cảnh',
        span: 12,
        mediaRatio: '21_9',
        defaultBlockTypes: [LessonBlockType.IMAGE],
      },
      {
        id: 'article',
        label: 'Diễn biến chuyên sâu',
        span: 12,
        textColumns: 2,
        dropCap: true,
        defaultBlockTypes: [LessonBlockType.TEXT],
      },
    ],
  },
  {
    type: 'SPLIT',
    label: 'Chia đôi cân xứng',
    badge: '6 : 6',
    defaultRatio: '6_6',
    description: 'Hai cột cân đối 50 : 50 dành cho đối chiếu tư liệu và diễn biến.',
    slotBlueprints: [
      {
        id: 'left',
        label: 'Vùng nội dung trái',
        span: 6,
        textColumns: 1,
        dropCap: true,
        defaultBlockTypes: [LessonBlockType.TEXT],
      },
      {
        id: 'right',
        label: 'Vùng tư liệu phải',
        span: 6,
        mediaRatio: '4_3',
        defaultBlockTypes: [LessonBlockType.IMAGE, LessonBlockType.QUOTE],
      },
    ],
  },
];

export const EDITORIAL_COLUMN_RATIO_OPTIONS: Array<{
  id: EditorialColumnRatio;
  label: string;
  leftClass: string;
  rightClass: string;
}> = [
  {
    id: '4_8',
    label: '4 : 8',
    leftClass: 'col-span-12 md:col-span-4',
    rightClass: 'col-span-12 md:col-span-8',
  },
  {
    id: '5_7',
    label: '5 : 7',
    leftClass: 'col-span-12 md:col-span-5',
    rightClass: 'col-span-12 md:col-span-7',
  },
  {
    id: '6_6',
    label: '6 : 6',
    leftClass: 'col-span-12 md:col-span-6',
    rightClass: 'col-span-12 md:col-span-6',
  },
  {
    id: '7_5',
    label: '7 : 5',
    leftClass: 'col-span-12 md:col-span-7',
    rightClass: 'col-span-12 md:col-span-5',
  },
  {
    id: '8_4',
    label: '8 : 4',
    leftClass: 'col-span-12 md:col-span-8',
    rightClass: 'col-span-12 md:col-span-4',
  },
];

export const EDITORIAL_MEDIA_RATIO_OPTIONS: Array<{
  id: EditorialMediaRatio;
  label: string;
  aspectClass: string;
}> = [
  { id: '16_10', label: 'Tư liệu ngang (16:10)', aspectClass: 'aspect-[16/10]' },
  { id: '21_9', label: 'Điện ảnh rộng (21:9)', aspectClass: 'aspect-[21/9]' },
  { id: '16_9', label: 'Tiêu chuẩn (16:9)', aspectClass: 'aspect-video' },
  { id: '4_3', label: 'Cổ điển (4:3)', aspectClass: 'aspect-[4/3]' },
  { id: '3_4', label: 'Chân dung (3:4)', aspectClass: 'aspect-[3/4]' },
  { id: 'AUTO', label: 'Tỷ lệ tự nhiên', aspectClass: 'aspect-auto' },
];

export const EDITORIAL_SLOT_SPAN_OPTIONS: EditorialSlotSpan[] = [
  3, 4, 5, 6, 7, 8, 9, 12,
];

const SLOT_SPAN_CLASS_MAP: Record<EditorialSlotSpan, string> = {
  1: 'col-span-12 md:col-span-1',
  2: 'col-span-12 md:col-span-2',
  3: 'col-span-12 md:col-span-3',
  4: 'col-span-12 md:col-span-4',
  5: 'col-span-12 md:col-span-5',
  6: 'col-span-12 md:col-span-6',
  7: 'col-span-12 md:col-span-7',
  8: 'col-span-12 md:col-span-8',
  9: 'col-span-12 md:col-span-9',
  10: 'col-span-12 md:col-span-10',
  11: 'col-span-12 md:col-span-11',
  12: 'col-span-12 md:col-span-12',
};

export interface AllowedNestedBlockOption {
  type: LessonBlockType;
  label: string;
}

export const STORY_CHAPTER_ALLOWED_NESTED_BLOCKS: AllowedNestedBlockOption[] = [
  { type: LessonBlockType.TEXT, label: 'Văn bản tự sự' },
  { type: LessonBlockType.HEADING, label: 'Tiêu đề mục' },
  { type: LessonBlockType.IMAGE, label: 'Hình ảnh tư liệu' },
  { type: LessonBlockType.QUOTE, label: 'Trích dẫn nổi bật' },
  { type: LessonBlockType.CALLOUT, label: 'Hộp ghi chú sử gia' },
  { type: LessonBlockType.CHARACTER, label: 'Hồ sơ thực thể' },
  { type: LessonBlockType.EVENT, label: 'Thẻ sự kiện' },
  { type: LessonBlockType.DIVIDER, label: 'Đường phân cách' },
];

export class StoryChapterLayoutStrategy {
  public static getLayoutLabel(layout: StoryChapterLayout): string {
    const found = STORY_CHAPTER_LAYOUT_OPTIONS.find((opt) => opt.id === layout);
    return found ? found.label : 'Ảnh trái – văn bản phải';
  }

  public static getTemplateDefinition(
    type: EditorialLayout = 'MAGAZINE_GRID'
  ): EditorialTemplateDefinition {
    return (
      EDITORIAL_LAYOUT_TEMPLATES.find((t) => t.type === type) ||
      EDITORIAL_LAYOUT_TEMPLATES[0]
    );
  }

  public static createDefaultEditorialConfig(
    type: EditorialLayout = 'MAGAZINE_GRID'
  ): EditorialSpreadConfig {
    return {
      version: 1,
      layout: {
        type,
        columns: 12,
        columnRatio: '4_8',
        textColumns: 1,
        gap: 'MD',
        rowGap: 'MD',
        contentWidth: 'FULL',
        horizontalAlign: 'CENTER',
        padding: 'SPACIOUS',
        paddingTopPx: 32,
        paddingBottomPx: 32,
        paddingLeftPx: 32,
        paddingRightPx: 32,
        childBlockGap: 'MD',
        alignment: 'TOP',
      },
      typography: {
        headingFont: 'SERIF',
        headingFontName: 'var(--font-merriweather), Georgia, serif',
        bodyFont: 'SANS',
        bodyFontName: 'var(--font-be-vietnam-pro), sans-serif',
        captionFont: 'SERIF',
        headingSize: 'LG',
        headingWeight: 'BOLD',
        headingTransform: 'NONE',
        headingLetterSpacing: 'TIGHT',
        bodySize: 'MD',
        bodyFontSizePx: 16,
        bodyWeight: 'REGULAR',
        bodyAlign: 'LEFT',
        lineHeight: 'RELAXED',
        lineHeightValue: '1.7',
        dropCap: true,
        initialLetterColor: '#8b261d',
        firstParagraphHighlight: false,
        pullQuoteStyle: 'CLASSIC_QUOTES',
        paragraphIndent: false,
      },
      media: {
        defaultRatio: '16_10',
        imageFit: 'COVER',
        imagePosition: 'CENTER',
        showCaption: true,
        captionPosition: 'BOTTOM',
      },
      appearance: {
        backgroundColor: '#faf7f2',
        overlayOpacity: 0,
        showRegionDividers: true,
        borderStyle: 'SOLID',
        borderWidthPx: 1,
        borderColor: '#e7e5e4',
        borderRadius: 'XL',
        shadow: 'NONE',
        scrollAnimation: 'NONE',
        stickySection: false,
        hideOnDesktop: false,
        hideOnTablet: false,
        hideOnMobile: false,
      },
      responsive: {
        tabletColumns: 8,
        mobileColumns: 4,
        stackOnMobile: true,
        mobileOrder: 'DEFAULT',
      },
    };
  }

  public static getColumnRatioSpanClasses(
    ratio: EditorialColumnRatio = '4_8'
  ): { leftClass: string; rightClass: string } {
    const found = EDITORIAL_COLUMN_RATIO_OPTIONS.find((r) => r.id === ratio);
    return found
      ? { leftClass: found.leftClass, rightClass: found.rightClass }
      : {
          leftClass: 'col-span-12 md:col-span-4',
          rightClass: 'col-span-12 md:col-span-8',
        };
  }

  public static applyTemplateToSlots(
    targetLayout: EditorialLayout,
    currentSlots: EditorialSlotItem[] = [],
    createBlockFn: (type: LessonBlockType) => LessonBlockItem
  ): EditorialSlotItem[] {
    const template = StoryChapterLayoutStrategy.getTemplateDefinition(targetLayout);

    return template.slotBlueprints.map((bp, idx) => {
      const existingById = currentSlots.find((s) => s.id === bp.id);
      const existingByIdx = currentSlots[idx];
      const matched = existingById || existingByIdx;

      if (matched && matched.blocks && matched.blocks.length > 0) {
        return {
          ...matched,
          id: bp.id,
          label: bp.label,
          span: bp.span,
          textColumns: bp.textColumns ?? matched.textColumns ?? 1,
          dropCap: bp.dropCap ?? matched.dropCap ?? false,
          mediaRatio: bp.mediaRatio ?? matched.mediaRatio,
        };
      }

      return {
        id: bp.id,
        label: bp.label,
        span: bp.span,
        textColumns: bp.textColumns ?? 1,
        dropCap: bp.dropCap ?? false,
        mediaRatio: bp.mediaRatio,
        blocks: bp.defaultBlockTypes.map((t) => createBlockFn(t)),
      };
    });
  }

  public static getSlotSpanClass(span: EditorialSlotSpan = 6): string {
    return SLOT_SPAN_CLASS_MAP[span] || 'col-span-12 md:col-span-6';
  }

  public static getGapClass(
    gap: EditorialSpreadConfig['layout']['gap'] = 'MD'
  ): string {
    switch (gap) {
      case 'SM':
        return 'gap-4';
      case 'LG':
        return 'gap-10';
      case 'MD':
      default:
        return 'gap-7';
    }
  }

  public static getPaddingClass(
    padding: EditorialSpreadConfig['layout']['padding'] = 'SPACIOUS'
  ): string {
    switch (padding) {
      case 'NONE':
        return 'p-3';
      case 'COMPACT':
        return 'p-5 bg-[#faf7f2] rounded-xl border border-stone-200/80';
      case 'SPACIOUS':
      default:
        return 'p-7 sm:p-9 bg-[#faf7f2] rounded-2xl border border-stone-200/90';
    }
  }

  public static getAlignmentClass(
    alignment: EditorialSpreadConfig['layout']['alignment'] = 'TOP'
  ): string {
    switch (alignment) {
      case 'CENTER':
        return 'items-center';
      case 'BOTTOM':
        return 'items-end';
      case 'TOP':
      default:
        return 'items-start';
    }
  }

  public static getHeadingTypographyClass(
    typo?: EditorialSpreadConfig['typography']
  ): string {
    const fontClass = typo?.headingFont === 'SANS' ? 'font-sans' : 'font-serif';
    const sizeMap: Record<string, string> = {
      SM: 'text-2xl',
      MD: 'text-3xl',
      LG: 'text-[32px]',
      XL: 'text-4xl',
    };
    const sizeClass = sizeMap[typo?.headingSize || 'LG'] || 'text-[32px]';
    return `${fontClass} ${sizeClass}`;
  }

  public static getBodyTypographyClass(
    typo?: EditorialSpreadConfig['typography']
  ): string {
    const fontClass = typo?.bodyFont === 'SERIF' ? 'font-serif' : 'font-sans';
    return fontClass;
  }

  public static getMediaAspectClass(
    ratio: EditorialMediaRatio = '16_10'
  ): string {
    const found = EDITORIAL_MEDIA_RATIO_OPTIONS.find(
      (item) => item.id === ratio
    );
    return found ? found.aspectClass : 'aspect-[16/10]';
  }

  public static getTextColumnClass(cols?: 1 | 2 | 3): string {
    if (cols === 2) return 'editorial-columns-2';
    if (cols === 3) return 'editorial-columns-3';
    return '';
  }

  public static getRomanNumeral(index: number): string {
    return toRoman(index + 1);
  }

  public static getChapterLabel(index: number): string {
    return getChapterLabel(index);
  }

  /**
   * Tạo một StoryChapterUnit thuần Container (không phụ thuộc index === 0 hay dữ liệu mẫu cố định).
   * Mỗi chương mặc định chứa các ContentBlock con:
   * - Cột trái (zone: 'LEFT'): Khối văn bản dẫn nhập (TEXT)
   * - Cột phải (zone: 'RIGHT'): Khối văn bản diễn biến chính (TEXT) + Khối hình ảnh tư liệu (IMAGE)
   */
  public static createChapterContainer(
    order: number,
    layoutType: EditorialLayout = 'MAGAZINE_GRID',
    options?: {
      id?: string;
      title?: string;
      subtitle?: string;
      columnRatio?: EditorialColumnRatio;
      blocks?: LessonBlockItem[];
    }
  ): StoryChapterUnit {
    const cfg =
      StoryChapterLayoutStrategy.createDefaultEditorialConfig(layoutType);
    if (options?.columnRatio) {
      cfg.layout.columnRatio = options.columnRatio;
    } else if (layoutType === 'ASYMMETRIC') {
      cfg.layout.columnRatio = '4_8';
    } else if (layoutType === 'SPLIT') {
      cfg.layout.columnRatio = '6_6';
    }

    const defaultBlocks: LessonBlockItem[] = options?.blocks ?? [
      {
        id: createBlockUUID('text'),
        type: LessonBlockType.TEXT,
        zone: 'LEFT',
        content:
          '<p>Nhập đoạn mở đầu dẫn nhập bối cảnh hoặc luận điểm khái quát của chương tại đây...</p>',
      } as TextBlockData,
      {
        id: createBlockUUID('text'),
        type: LessonBlockType.TEXT,
        zone: 'RIGHT',
        content:
          '<p>Nhập nội dung phân tích chi tiết, diễn biến lịch sử và tư liệu của chương...</p>',
      } as TextBlockData,
      {
        id: createBlockUUID('image'),
        type: LessonBlockType.IMAGE,
        zone: 'RIGHT',
        src: '',
        alt: '',
        caption: '',
      } as ImageBlockData,
    ];

    return {
      id: options?.id || createBlockUUID('chapter'),
      order,
      title: options?.title ?? 'Tiêu đề chương mới',
      subtitle: options?.subtitle ?? '',
      config: cfg,
      blocks: defaultBlocks,
    };
  }

  /**
   * Sắp xếp danh sách chương theo `order` tăng dần và chuẩn hóa lại `order: 0, 1, 2...`.
   * Số chương (CHƯƠNG I, CHƯƠNG II...) được tính tự động khi render qua `getChapterLabel(index)`.
   */
  public static sortAndReindexChapters(
    chapters: StoryChapterUnit[]
  ): StoryChapterUnit[] {
    return [...chapters]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((chap, idx) => ({
        ...chap,
        order: idx,
      }));
  }

  /**
   * Chuẩn hóa dữ liệu StoryChapterBlockData sang mô hình Container chuẩn (Story -> Chapters[] -> Content Blocks[]).
   * Tự động chuyển đổi dữ liệu phẳng cũ (leadText, contentHtml, imageUrl, pullQuoteText) thành các Content Blocks con.
   */
  public static normalizeStoryChapters(
    data: StoryChapterBlockData
  ): StoryChapterUnit[] {
    if (data.chapters && data.chapters.length > 0) {
      return StoryChapterLayoutStrategy.sortAndReindexChapters(
        data.chapters.map((ch, idx) => ({
          ...ch,
          order: typeof ch.order === 'number' ? ch.order : idx,
          blocks: Array.isArray(ch.blocks) ? ch.blocks : [],
        }))
      );
    }

    const chapter1Config =
      data.config ||
      StoryChapterLayoutStrategy.createDefaultEditorialConfig('MAGAZINE_GRID');

    const chap1Blocks: LessonBlockItem[] = [];
    if (data.leadText || data.leadSecondaryText) {
      const leadHtml = [
        data.leadText ? `<p>${data.leadText}</p>` : '',
        data.leadSecondaryText ? `<p>${data.leadSecondaryText}</p>` : '',
      ]
        .filter(Boolean)
        .join('');
      chap1Blocks.push({
        id: `${data.id}_intro_text`,
        type: LessonBlockType.TEXT,
        zone: 'LEFT',
        content: leadHtml,
      } as TextBlockData);
    }

    if (data.contentHtml) {
      chap1Blocks.push({
        id: `${data.id}_main_text`,
        type: LessonBlockType.TEXT,
        zone: 'RIGHT',
        content: data.contentHtml,
      } as TextBlockData);
    }

    chap1Blocks.push({
      id: `${data.id}_main_img`,
      type: LessonBlockType.IMAGE,
      zone: 'RIGHT',
      src: data.imageUrl || '',
      alt: data.title || '',
      caption: data.imageCaption || '',
    } as ImageBlockData);

    if (data.nestedBlocks && data.nestedBlocks.length > 0) {
      data.nestedBlocks.forEach((b) => {
        chap1Blocks.push({ ...b, zone: b.zone || 'RIGHT' });
      });
    }

    const primaryChapter: StoryChapterUnit = {
      id: `${data.id}_chap_1`,
      order: 0,
      title: data.title || 'Trước trận Bạch Đằng',
      subtitle: data.subtitle || 'Bối cảnh lịch sử',
      config: chapter1Config,
      overrides: data.overrides,
      blocks: chap1Blocks,
    };

    const convertedSubChapters: StoryChapterUnit[] = (
      data.subChapters || []
    ).map((sub, idx) => {
      const subCfg =
        StoryChapterLayoutStrategy.createDefaultEditorialConfig('ASYMMETRIC');
      subCfg.layout.columnRatio = '4_8';

      const subBlocks: LessonBlockItem[] = [
        {
          id: `${sub.id || idx}_quote`,
          type: LessonBlockType.QUOTE,
          zone: 'LEFT',
          quoteText:
            data.pullQuoteText || 'Bạch Đằng giang, ngàn đời vang danh...',
          author: data.pullQuoteAuthor || 'Trần Quốc Tuấn',
        } as QuoteBlockData,
        {
          id: `${sub.id || idx}_text`,
          type: LessonBlockType.TEXT,
          zone: 'RIGHT',
          content:
            sub.contentHtml ||
            '<p>Nhập nội dung phân tích chi tiết cho chương này...</p>',
        } as TextBlockData,
      ];

      if (sub.imageUrl) {
        subBlocks.push({
          id: `${sub.id || idx}_img`,
          type: LessonBlockType.IMAGE,
          zone: 'RIGHT',
          src: sub.imageUrl,
          alt: sub.title,
          caption: sub.imageCaption || '',
        } as ImageBlockData);
      }

      return {
        id: sub.id || `${data.id}_chap_${idx + 2}`,
        order: idx + 1,
        title: sub.title || 'Diễn biến chính',
        subtitle: sub.numberLabel,
        config: subCfg,
        blocks: subBlocks,
      };
    });

    return [primaryChapter, ...convertedSubChapters];
  }

  public static formatSubChapterNumber(index: number): string {
    return `${toRoman(index + 2)}. DIỄN BIẾN CHÍNH`;
  }

  public static reindexSubChapters(
    items: StorySubChapterItem[]
  ): StorySubChapterItem[] {
    return items.map((item, idx) => ({
      ...item,
      numberLabel:
        item.numberLabel?.trim() ||
        StoryChapterLayoutStrategy.formatSubChapterNumber(idx),
    }));
  }
}
