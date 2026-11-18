import { ContentStatus, DifficultyLevel } from './enums';
import { NavigationPageKey } from './routes';

export type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'gray';

export const STATUS_TONE_MAP: Record<ContentStatus, BadgeTone> = {
  [ContentStatus.DRAFT]: 'gray',
  [ContentStatus.PENDING_REVIEW]: 'amber',
  [ContentStatus.PUBLISHED]: 'green',
  [ContentStatus.REJECTED]: 'red',
  [ContentStatus.ARCHIVED]: 'gray',
};

export const STATUS_LABEL_MAP: Record<ContentStatus, string> = {
  [ContentStatus.DRAFT]: 'Bản nháp',
  [ContentStatus.PENDING_REVIEW]: 'Chờ duyệt',
  [ContentStatus.PUBLISHED]: 'Xuất bản',
  [ContentStatus.REJECTED]: 'Từ chối',
  [ContentStatus.ARCHIVED]: 'Lưu trữ',
};

export const DIFFICULTY_TONE_MAP: Record<DifficultyLevel, BadgeTone> = {
  [DifficultyLevel.EASY]: 'green',
  [DifficultyLevel.MEDIUM]: 'blue',
  [DifficultyLevel.HARD]: 'red',
};

export const DIFFICULTY_LABEL_MAP: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'Dễ',
  [DifficultyLevel.MEDIUM]: 'Trung bình',
  [DifficultyLevel.HARD]: 'Khó',
};


export interface PageMetaItem {
  title: string;
  subtitle: string;
}

const REVIEW_HUB_TITLE = 'Hàng chờ duyệt';

export const PAGE_META: Record<NavigationPageKey, PageMetaItem> = {
  cms: {
    title: 'Tổng quan',
    subtitle: 'Quản lý nội dung học tập và chỉ số vận hành trên HISGO',
  },
  dashboard: {
    title: 'Tổng quan',
    subtitle: 'Quản lý nội dung học tập trên HISGO',
  },
  curriculum: {
    title: 'Cây chương trình học',
    subtitle: 'Cấu trúc phân cấp Chủ đề ➔ Bài học & Quiz',
  },
  topics: {
    title: 'Chủ đề lịch sử',
    subtitle: 'Tổ chức chủ đề phân cấp cha – con',
  },
  lessons: {
    title: 'Bài học',
    subtitle: 'Quản lý nội dung bài học lịch sử',
  },
  articles: {
    title: 'Bài viết',
    subtitle: 'Nhân vật, sự kiện, di tích, triều đại… theo chuyên mục và tag',
  },
  categories: {
    title: 'Chuyên mục',
    subtitle: 'Phân loại bài viết, quyết định trang công khai hiển thị bài',
  },
  timelines: {
    title: 'Dòng thời gian',
    subtitle: 'Trình tự các mốc lịch sử, mốc có thể trỏ tới bài viết',
  },
  tags: {
    title: 'Thẻ',
    subtitle: 'Quản lý nhãn phân loại nội dung',
  },
  review: {
    title: REVIEW_HUB_TITLE,
    subtitle: 'Mọi việc cần duyệt ở một nơi',
  },
  // Hai trang cũ chỉ còn chuyển hướng về Hàng chờ duyệt.
  'blog-review': {
    title: REVIEW_HUB_TITLE,
    subtitle: 'Blog',
  },
  moderation: {
    title: REVIEW_HUB_TITLE,
    subtitle: 'Báo cáo cộng đồng',
  },
  users: {
    title: 'Người dùng',
    subtitle: 'Quản lý tài khoản và phân quyền hệ thống',
  },
  media: {
    title: 'Quản lý nguồn tư liệu và media',
    subtitle: 'Kho lưu trữ tập trung hình ảnh, tư liệu số và video lịch sử',
  },
  quizzes: {
    title: 'Đề thi & Ngân hàng câu hỏi',
    subtitle: 'Soạn câu hỏi theo chủ đề và ghép thành đề thi có chấm điểm',
  },
  analytics: {
    title: 'Thống kê học tập và hoạt động',
    subtitle: 'Chỉ số tiến độ người học, hiệu suất bài học và nhật ký hệ thống',
  },
  settings: {
    title: 'Cài đặt hệ thống',
    subtitle: 'Cấu hình tham số hệ thống, kiểm duyệt và danh mục dùng chung',
  },
};
