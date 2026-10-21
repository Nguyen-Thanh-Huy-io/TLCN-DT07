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
  // Lưu ý: khối "Tài liệu/Liên kết tham khảo" (RESOURCE_LINK) đã được chuyển sang
  // quản lý tập trung ở Panel Thuộc tính > tab "Xuất bản" (luôn hiển thị cố định ở
  // cuối bài học) thay vì chèn rời rạc giữa nội dung — xem LessonEditor.tsx.

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
  // Lưu ý: khối "Câu hỏi ôn tập" (QUIZ) đã được chuyển sang quản lý tập trung ở Panel
  // Thuộc tính > tab "Đề ôn tập" (1 đề gồm nhiều câu, luôn ở cuối bài học — xem phần
  // "hướng B" đã chốt) thay vì chèn rời rạc giữa nội dung. Giữ nguyên type/factory
  // trong code cho tương lai, chỉ ẩn khỏi palette để tránh 2 nơi cùng tên "Quiz".
];
