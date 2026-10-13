import { BlockPaletteItem, LessonBlockGroup, LessonBlockType } from '../types/block-palette.types';

export const LESSON_BLOCK_ITEMS: BlockPaletteItem[] = [
  // 1. Nhóm 1: Nội dung cơ bản (img2.png)
  {
    type: LessonBlockType.TEXT,
    label: 'Văn bản',
    description: 'Đoạn văn, tiêu đề, danh sách...',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.IMAGE,
    label: 'Hình ảnh',
    description: 'Ảnh đơn, thư viện ảnh',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.VIDEO,
    label: 'Video',
    description: 'Video từ YouTube, Vimeo, upload',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.RESOURCE_LINK,
    label: 'Tài liệu',
    description: 'PDF, Word, tài liệu đính kèm',
    group: LessonBlockGroup.BASIC,
  },

  // 2. Nhóm 2: Khối chuyên biệt (img2.png)
  {
    type: LessonBlockType.TIMELINE,
    label: 'Timeline',
    description: 'Dòng thời gian sự kiện',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.MAP,
    label: 'Bản đồ',
    description: 'Bản đồ, địa điểm, tuyến đường',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.CHARACTER,
    label: 'Nhân vật',
    description: 'Hồ sơ nhân vật, liên kết',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.EVENT,
    label: 'Sự kiện',
    description: 'Thông tin sự kiện, mốc quan trọng',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.COMPARISON_TABLE,
    label: 'Bảng so sánh',
    description: 'So sánh thông tin, số liệu',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.QUIZ,
    label: 'Câu hỏi ôn tập',
    description: 'Trắc nghiệm, câu hỏi tự luận',
    group: LessonBlockGroup.SPECIALIZED,
  },
];
