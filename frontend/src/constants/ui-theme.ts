import { ContentStatus, DifficultyLevel, IconName } from './enums';
import { NavigationPageKey } from './routes';

export enum NavGroupId {
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  KNOWLEDGE = 'KNOWLEDGE',
  SYSTEM = 'SYSTEM',
}

export const NAV_GROUP_TITLES: Record<NavGroupId, string> = {
  [NavGroupId.DASHBOARD]: 'TỔNG QUAN & BÁO CÁO',
  [NavGroupId.LEARNING]: 'QUẢN TRỊ BÀI HỌC & QUIZ',
  [NavGroupId.KNOWLEDGE]: 'KHO DỮ LIỆU LỊCH SỬ',
  [NavGroupId.SYSTEM]: 'HỆ THỐNG & PHÂN QUYỀN',
};

export const NAV_ITEM_LABELS = {
  DASHBOARD: 'Dashboard tổng quan',
  LESSONS: 'Quản lý bài học',
  QUIZZES: 'Đề thi & Ngân hàng câu hỏi',
  ARTICLES: 'Bài viết',
  CATEGORIES: 'Chuyên mục',
  TIMELINES: 'Dòng thời gian',
  TAGS: 'Tag',
  USERS: 'Quản lý người dùng và phân quyền',
  GAMIFICATION: 'Gamification & Huy hiệu',
  REVIEW: 'Hàng chờ duyệt',
} as const;

export interface NavItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly page: NavigationPageKey;
  readonly route: string;
  readonly groupId: NavGroupId;
  readonly hierarchyTag?: string;
  readonly badgeCount?: number;
  readonly subtitle?: string;
}

export interface NavGroupConfig {
  readonly id: NavGroupId;
  readonly label: string;
  readonly items: NavItemConfig[];
  readonly description?: string;
}

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
  gamification: {
    title: 'Gamification & Huy hiệu',
    subtitle: 'Quản lý huy hiệu thành tựu và theo dõi nhịp học tập của học viên',
  },
  quizzes: {
    title: 'Đề thi & Ngân hàng câu hỏi',
    subtitle: 'Soạn câu hỏi theo chủ đề và ghép thành đề thi có chấm điểm',
  },
};
