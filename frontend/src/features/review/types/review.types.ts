import { ContentStatus } from '@/constants/enums';

export interface ReviewPost {
  id: string;
  title: string;
  summary: string;
  author: string;
  createdAt: string;
  status: ReviewTabState;
  rawStatus: string;
  rejectionReason?: string | null;
}

export interface ContentBlockData {
  id?: string;
  type?: string;
  kind?: string;
  heading?: string;
  text?: string;
  caption?: string;
  imageUrl?: string;
}

export interface ArticleReferenceData {
  id?: string;
  title?: string;
  source?: string;
  url?: string;
}

export interface ReviewConfirmAction {
  type: ContentStatus.PUBLISHED | ContentStatus.REJECTED;
  item: ReviewPost;
}

// --- review.constant.ts ---
export enum ReviewTabState {
  PENDING = 'Chờ duyệt',
  APPROVED = 'Đã duyệt',
  REJECTED = 'Bị từ chối',
}

export enum NoticeTone {
  OK = 'ok',
  ERROR = 'error',
}

export const STATUS_LABELS: Record<string, ReviewTabState> = {
  [ContentStatus.PENDING_REVIEW]: ReviewTabState.PENDING,
  [ContentStatus.PUBLISHED]: ReviewTabState.APPROVED,
  [ContentStatus.REJECTED]: ReviewTabState.REJECTED,
};

/** Trạng thái backend mà mỗi tab tải về (`GET /posts/review?status=`). */
export const REVIEW_TAB_STATUS: Record<ReviewTabState, ContentStatus> = {
  [ReviewTabState.PENDING]: ContentStatus.PENDING_REVIEW,
  [ReviewTabState.APPROVED]: ContentStatus.PUBLISHED,
  [ReviewTabState.REJECTED]: ContentStatus.REJECTED,
};

export const REVIEW_TABS = [
  ReviewTabState.PENDING,
  ReviewTabState.APPROVED,
  ReviewTabState.REJECTED,
] as const;

export const BLOCK_TYPE_IMAGE = 'image';
export const BORDER_COLOR_LIGHT = '#e5e7eb';
export const BORDER_LIGHT = `1px solid ${BORDER_COLOR_LIGHT}`;
