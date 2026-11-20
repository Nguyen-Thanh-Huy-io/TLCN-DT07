import { EditorialColumnRatio, EditorialLayout, EditorialMediaRatio, EditorialSlotSpan, StoryChapterLayout, StorySubjectType } from '../types/block-builder.types';
import { LessonBlockType } from '../types/editor.types';
import { EditorialColumnRatioEnum } from '@/constants/lesson-builder.constant';

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

export const COL_SPAN_4 = 'col-span-12 md:col-span-4';

export const COL_SPAN_5 = 'col-span-12 md:col-span-5';

export const COL_SPAN_6 = 'col-span-12 md:col-span-6';

export const COL_SPAN_7 = 'col-span-12 md:col-span-7';

export const COL_SPAN_8 = 'col-span-12 md:col-span-8';

export const EDITORIAL_COLUMN_RATIO_OPTIONS: Array<{
  id: EditorialColumnRatio;
  label: string;
  leftClass: string;
  rightClass: string;
}> = [
  {
    id: EditorialColumnRatioEnum.RATIO_4_8,
    label: '4 : 8',
    leftClass: COL_SPAN_4,
    rightClass: COL_SPAN_8,
  },
  {
    id: EditorialColumnRatioEnum.RATIO_5_7,
    label: '5 : 7',
    leftClass: COL_SPAN_5,
    rightClass: COL_SPAN_7,
  },
  {
    id: EditorialColumnRatioEnum.RATIO_6_6,
    label: '6 : 6',
    leftClass: COL_SPAN_6,
    rightClass: COL_SPAN_6,
  },
  {
    id: EditorialColumnRatioEnum.RATIO_7_5,
    label: '7 : 5',
    leftClass: COL_SPAN_7,
    rightClass: COL_SPAN_5,
  },
  {
    id: EditorialColumnRatioEnum.RATIO_8_4,
    label: '8 : 4',
    leftClass: COL_SPAN_8,
    rightClass: COL_SPAN_4,
  },
];
