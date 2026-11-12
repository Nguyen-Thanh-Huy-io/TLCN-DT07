import { ContentStatus } from '@/constants/enums';

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

export const REVIEW_TABS = [
  ReviewTabState.PENDING,
  ReviewTabState.APPROVED,
  ReviewTabState.REJECTED,
] as const;

export const BLOCK_TYPE_IMAGE = 'image';
export const BORDER_COLOR_LIGHT = '#e5e7eb';
export const BORDER_LIGHT = `1px solid ${BORDER_COLOR_LIGHT}`;
