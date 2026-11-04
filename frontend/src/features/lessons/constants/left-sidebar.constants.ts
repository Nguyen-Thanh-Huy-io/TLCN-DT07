import { QuickSettingItem, QuickSettingKey, LessonCategoryType, LessonTypeConfig } from '../types/left-sidebar.types';

export const QUICK_SETTING_ITEMS: QuickSettingItem[] = [
  {
    key: QuickSettingKey.EVENT_INFO,
    label: 'Thông tin sự kiện',
    iconName: 'calendar',
    description: 'Chủ đề, thời gian, địa điểm và tóm tắt sự kiện',
  },
  {
    key: QuickSettingKey.CHARACTERS,
    label: 'Nhân vật liên quan',
    iconName: 'user',
    description: 'Các nhân vật lịch sử gắn liền với bài học',
  },
  {
    key: QuickSettingKey.LOCATIONS,
    label: 'Địa điểm liên quan',
    iconName: 'mapPin',
    description: 'Vị trí địa lý, chiến trường và di tích',
  },
  {
    key: QuickSettingKey.TIMELINE,
    label: 'Timeline diễn biến',
    iconName: 'clock',
    description: 'Dòng thời gian các mốc lịch sử chính',
  },
  {
    key: QuickSettingKey.MEDIA_DOCS,
    label: 'Tài liệu & tư liệu',
    iconName: 'folder',
    description: 'Hình ảnh, video, bản đồ và tài liệu đính kèm',
  },
  {
    key: QuickSettingKey.QUESTIONS,
    label: 'Câu hỏi ôn tập',
    iconName: 'check',
    description: 'Định hướng câu hỏi tương tác mở rộng',
  },
];

export const LESSON_TYPE_CONFIGS: Record<LessonCategoryType, LessonTypeConfig> = {
  [LessonCategoryType.EVENT]: {
    type: LessonCategoryType.EVENT,
    label: 'SỰ KIỆN',
    badgeTone: 'blue',
    guidanceText:
      'Đây là bài học dạng Sự kiện: Hãy đảm bảo cung cấp đầy đủ thông tin về thời gian, địa điểm, nguyên nhân, diễn biến, kết quả và ý nghĩa.',
  },
  [LessonCategoryType.CHARACTER]: {
    type: LessonCategoryType.CHARACTER,
    label: 'NHÂN VẬT',
    badgeTone: 'amber',
    guidanceText:
      'Đây là bài học dạng Nhân vật: Tập trung làm nổi bật tiểu sử, vai trò lãnh đạo, đóng góp và di sản lịch sử để lại.',
  },
  [LessonCategoryType.LOCATION]: {
    type: LessonCategoryType.LOCATION,
    label: 'ĐỊA ĐIỂM',
    badgeTone: 'emerald',
    guidanceText:
      'Đây là bài học dạng Địa điểm / Di tích: Chú trọng vị trí địa lý, giá trị chiến lược và các sự kiện lịch sử đã diễn ra.',
  },
  [LessonCategoryType.TOPIC]: {
    type: LessonCategoryType.TOPIC,
    label: 'CHUYÊN ĐỀ',
    badgeTone: 'purple',
    guidanceText:
      'Đây là bài học dạng Chuyên đề: Khái quát bức tranh lịch sử xuyên suốt theo tiến trình thời gian và các mốc chuyển biến lớn.',
  },
};
