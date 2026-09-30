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

export const PAGE_META: Record<NavigationPageKey, PageMetaItem> = {
  dashboard: {
    title: 'Tổng quan',
    subtitle: 'Quản lý nội dung học tập trên HISGO',
  },
  curriculum: {
    title: 'Cây chương trình học',
    subtitle: 'Cấu trúc phân cấp Giai đoạn ➔ Chủ đề ➔ Bài học & Quiz',
  },
  knowledge: {
    title: 'Từ điển tri thức',
    subtitle: 'Kho lưu trữ Địa danh, Nhân vật, Sự kiện và Thẻ phân loại',
  },
  periods: {
    title: 'Giai đoạn lịch sử',
    subtitle: 'Quản lý các giai đoạn lịch sử trong hệ thống',
  },
  topics: {
    title: 'Chủ đề lịch sử',
    subtitle: 'Tổ chức chủ đề theo từng giai đoạn lịch sử',
  },
  lessons: {
    title: 'Bài học',
    subtitle: 'Quản lý nội dung bài học lịch sử',
  },
  events: {
    title: 'Sự kiện lịch sử',
    subtitle: 'Quản lý các mốc sự kiện theo chủ đề',
  },
  locations: {
    title: 'Địa danh lịch sử',
    subtitle: 'Quản lý các địa danh, di tích và kinh đô lịch sử',
  },
  entities: {
    title: 'Nhân vật lịch sử',
    subtitle: 'Quản lý các nhân vật, triều đại và tổ chức lịch sử',
  },
  tags: {
    title: 'Thẻ',
    subtitle: 'Quản lý nhãn phân loại nội dung',
  },
  review: {
    title: 'Duyệt bài học',
    subtitle: 'Kiểm tra chất lượng trước khi xuất bản',
  },
  users: {
    title: 'Người dùng',
    subtitle: 'Quản lý tài khoản và phân quyền hệ thống',
  },
};
