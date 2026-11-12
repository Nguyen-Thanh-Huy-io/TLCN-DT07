import { BlockPaletteItem, LessonBlockGroup, LessonBlockType } from '../types/block-palette.types';

/**
 * Danh sách khối hiển thị trong bảng chọn (Palette) của trình soạn thảo bài học.
 * Lưu ý: `LessonBlockType.QUIZ` và `LessonBlockType.RESOURCE_LINK` được quản lý ở tab riêng
 * (Ngân hàng câu hỏi & Tư liệu đính kèm) nên không hiển thị trong Palette chèn khối trực tiếp,
 * nhưng vẫn giữ plugin đăng ký để tương thích ngược với dữ liệu bài học cũ.
 */
export const LESSON_BLOCK_ITEMS: BlockPaletteItem[] = [
  // 1. Nhóm 1: Nội dung cơ bản
  {
    type: LessonBlockType.TEXT,
    label: 'Văn bản',
    description: 'Đoạn văn, văn bản định dạng chi tiết',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.HEADING,
    label: 'Tiêu đề mục',
    description: 'Tiêu đề phân cấp chương mục',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.IMAGE,
    label: 'Hình ảnh',
    description: 'Hình ảnh tư liệu lịch sử',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.VIDEO,
    label: 'Phim tư liệu',
    description: 'Phim tài liệu, băng ghi hình lịch sử',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.QUOTE,
    label: 'Trích dẫn',
    description: 'Danh ngôn, lời hịch hào hùng',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.DIVIDER,
    label: 'Đường phân cách',
    description: 'Đường kẻ phân tách nội dung',
    group: LessonBlockGroup.BASIC,
  },
  {
    type: LessonBlockType.CALLOUT,
    label: 'Hộp ghi chú',
    description: 'Hộp ghi chú bối cảnh, lưu ý sử gia',
    group: LessonBlockGroup.BASIC,
  },

  // 2. Nhóm 2: Tri thức lịch sử
  {
    type: LessonBlockType.STORY_CHAPTER,
    label: 'Chương truyện lịch sử',
    description: 'Khối chương truyện đa tầng chứa tiêu đề, ảnh tư liệu, chương con và khối lồng nhau',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.CHARACTER,
    label: 'Hồ sơ thực thể',
    description: 'Hồ sơ nhân vật, niên đại, tóm tắt',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.TIMELINE,
    label: 'Dòng thời gian',
    description: 'Dòng thời gian các mốc sự kiện',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.RELATED_PEOPLE,
    label: 'Nhân vật liên quan',
    description: 'Mạng lưới nhân vật liên quan',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.RELATED_EVENTS,
    label: 'Sự kiện liên quan',
    description: 'Các sự kiện lịch sử gắn kết',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.EVENT,
    label: 'Thẻ sự kiện',
    description: 'Thẻ diễn biến sự kiện trọng đại',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.MAP,
    label: 'Bản đồ lịch sử',
    description: 'Địa bàn chiến sự, di tích bản đồ',
    group: LessonBlockGroup.SPECIALIZED,
  },
  {
    type: LessonBlockType.COMPARISON_TABLE,
    label: 'Bảng so sánh',
    description: 'Bảng so sánh tương quan lực lượng',
    group: LessonBlockGroup.SPECIALIZED,
  },

  // 3. Nhóm 3: Nâng cao
  {
    type: LessonBlockType.SECTION_ROW,
    label: 'Bố cục nhiều cột',
    description: 'Chia bố cục hàng 2 cột, 3 cột linh hoạt',
    group: LessonBlockGroup.ADVANCED,
  },
];
