import { IconName } from './icons';
import { NavigationPageKey } from './routes';

/**
 * Navigation Group Identifiers (No magic strings)
 */
export enum NavGroupId {
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  KNOWLEDGE = 'KNOWLEDGE',
  SYSTEM = 'SYSTEM',
}

/**
 * Display names for navigation groups (Phân nhóm trực quan cho 7.1)
 */
export const NAV_GROUP_TITLES: Record<NavGroupId, string> = {
  [NavGroupId.DASHBOARD]: 'TỔNG QUAN & BÁO CÁO',
  [NavGroupId.LEARNING]: 'QUẢN TRỊ BÀI HỌC & QUIZ',
  [NavGroupId.KNOWLEDGE]: 'KHO DỮ LIỆU LỊCH SỬ',
  [NavGroupId.SYSTEM]: 'HỆ THỐNG & PHÂN QUYỀN',
};

export const NAV_ITEM_LABELS = {
  DASHBOARD: 'Dashboard tổng quan',
  ANALYTICS: 'Thống kê học tập và hoạt động',
  LESSONS: 'Quản lý bài học',
  QUESTIONS: 'Ngân hàng câu hỏi',
  QUIZZES: 'Quản lý bộ Quiz',
  MEDIA: 'Quản lý nguồn tư liệu và media',
  ARTICLES: 'Bài viết',
  CATEGORIES: 'Chuyên mục',
  TIMELINES: 'Dòng thời gian',
  TAGS: 'Tag',
  USERS: 'Quản lý người dùng và phân quyền',
  SETTINGS: 'Cài đặt hệ thống',
  REVIEW: 'Duyệt bài học',
  BLOG_REVIEW: 'Duyệt Blog',
} as const;

/**
 * Navigation item specification
 */
export interface NavItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly page: NavigationPageKey;
  readonly route: string;
  readonly groupId: NavGroupId;
  readonly hierarchyTag?: string; // e.g. "Cấp 1", "Cấp 2", "Cấp 3"
  readonly badgeCount?: number;   // e.g. 8 pending items
  readonly subtitle?: string;
}

/**
 * Navigation group specification
 */
export interface NavGroupConfig {
  readonly id: NavGroupId;
  readonly label: string;
  readonly items: NavItemConfig[];
  readonly description?: string;
}
