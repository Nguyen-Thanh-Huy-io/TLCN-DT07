import api from '../api';
import { PublicAuthService, isReviewerRole } from '../auth/public-auth.service';
import { RevisionFieldKind, ContentStatus } from '@/constants/enums';

export { RevisionFieldKind };

export enum RevisionKind {
  PROPOSAL = 'PROPOSAL',
}

export enum RevisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type RevisionContentType =
  | 'LESSON'
  | 'ARTICLE'
  | 'TOPIC'
  | 'LEARNING_PATH'
  | 'CHAPTER';

export const REVISION_TYPE_LABELS: Record<RevisionContentType, string> = {
  LESSON: 'Bài học',
  ARTICLE: 'Bài viết',
  TOPIC: 'Chủ đề',
  LEARNING_PATH: 'Lộ trình học',
  CHAPTER: 'Chương',
};

export interface RevisionPerson {
  id: string;
  username: string;
  role: string;
}

export interface ContentRevisionItem {
  id: string;
  contentType: RevisionContentType;
  contentId: string;
  /** PROPOSAL: bản sửa chờ duyệt · SNAPSHOT: phiên bản cũ trong lịch sử */
  kind: RevisionKind | 'PROPOSAL' | 'SNAPSHOT';
  status: RevisionStatus | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  version: number;
  title: string;
  payload: Record<string, unknown>;
  authorId: string | null;
  reviewerId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: RevisionPerson | null;
  reviewer: RevisionPerson | null;
}

export interface RevisionChange {
  key: string;
  label: string;
  /** Cách hiển thị (đồng bộ REVISION_FIELDS phía backend). */
  kind: RevisionFieldKind | `${RevisionFieldKind}`;
  ref?: string;
  before: unknown;
  after: unknown;
}

/** id / mã → tên (giai đoạn, thực thể, giá trị danh mục...); khóa "field:<key>" là nhãn trường metadata. */
export type RevisionLabels = Record<string, string>;

export interface RevisionHistoryItem extends ContentRevisionItem {
  /** Nhãn các trường lần thay đổi này đụng tới. */
  changedFields: string[];
}

/** Phản hồi khi biên tập viên lưu nội dung đang xuất bản: thành bản sửa chờ duyệt. */
export interface RevisionPendingResponse {
  revisionPending: true;
  message: string;
  revision: ContentRevisionItem;
}

export const isRevisionPending = (res: unknown): res is RevisionPendingResponse =>
  Boolean(res && typeof res === 'object' && (res as { revisionPending?: unknown }).revisionPending === true);

const unwrap = <T>(res: { data?: { data?: T } & T }) => (res.data?.data ?? res.data) as T;
const typePath = (type: RevisionContentType) => type.toLowerCase();

/** Phiên bản hóa nội dung đã xuất bản (bài học, bài viết, chủ đề, lộ trình, chương). */
export const ContentRevisionApiService = {
  pending: async () => unwrap<ContentRevisionItem[]>(await api.get('/content-revisions/pending')),

  history: async (type: RevisionContentType, id: string) =>
    unwrap<{ liveVersion: number; items: RevisionHistoryItem[] }>(
      await api.get(`/content-revisions/content/${typePath(type)}/${id}`),
    ),

  /** Bản sửa đang chờ phủ lên chi tiết (null nếu không có) — form CMS mở tiếp đúng bản sửa. */
  openDraft: async <T>(type: RevisionContentType, id: string) =>
    unwrap<{ revision: ContentRevisionItem; draft: T } | null>(
      await api.get(`/content-revisions/content/${typePath(type)}/${id}/draft`),
    ),

  detail: async (revisionId: string) =>
    unwrap<{ revision: ContentRevisionItem; changes: RevisionChange[]; labels: RevisionLabels }>(
      await api.get(`/content-revisions/${revisionId}`),
    ),

  approve: async (revisionId: string, note?: string) =>
    unwrap<ContentRevisionItem>(await api.post(`/content-revisions/${revisionId}/approve`, { note })),

  reject: async (revisionId: string, note: string) =>
    unwrap<ContentRevisionItem>(await api.post(`/content-revisions/${revisionId}/reject`, { note })),

  restore: async (revisionId: string) =>
    unwrap<{ restoredVersion: number }>(await api.post(`/content-revisions/${revisionId}/restore`, {})),
};

/**
 * Nạp chi tiết cho form CMS: nội dung đang xuất bản mà có bản sửa chờ duyệt thì biên tập viên mở
 * bản sửa đó (lưu tiếp sẽ ghi đè bản sửa, không mất phần đã sửa trước). Người duyệt vẫn thấy bản
 * đang xuất bản — lưu thẳng không được vô tình áp dụng bản sửa chưa duyệt — và duyệt từ dải thông báo.
 */
export async function withPendingDraft<T extends { status?: string | null }>(
  type: RevisionContentType,
  id: string,
  detail: T,
): Promise<{ detail: T; pending: ContentRevisionItem | null }> {
  if (!detail || typeof detail !== 'object' || detail.status !== ContentStatus.PUBLISHED) {
    return { detail, pending: null };
  }
  try {
    const open = await ContentRevisionApiService.openDraft<T>(type, id);
    if (!open) return { detail, pending: null };
    const reviewer = isReviewerRole(PublicAuthService.getCurrentUser()?.role);
    const resolvedDraft = open.draft && typeof open.draft === 'object' && !Array.isArray(open.draft)
      ? { ...detail, ...open.draft }
      : detail;
    return { detail: reviewer ? detail : resolvedDraft, pending: open.revision ?? null };
  } catch {
    return { detail, pending: null };
  }
}

// === Merged from account.service.ts ===
export interface MyProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
  provider: string;
  createdAt: string;
  userProfile: {
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface UpdateMyProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

const unwrapAccount = <T>(body: unknown): T => {
  let current: unknown = body;
  for (let i = 0; i < 3; i += 1) {
    if (current && typeof current === 'object' && 'data' in current) current = (current as { data: unknown }).data;
    else break;
  }
  return current as T;
};

async function postPublic(path: string, payload: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await api.post(path, payload);
    const body = res.data;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return { ok: true, message: message || '' };
  } catch (err) {
    const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    return { ok: false, message: message || 'Không thể kết nối tới máy chủ.' };
  }
}

export class AccountApiService {
  static async getProfile(): Promise<MyProfile> {
    const res = await api.get('/me/profile');
    return unwrapAccount<MyProfile>(res.data);
  }

  static async updateProfile(payload: UpdateMyProfilePayload): Promise<MyProfile> {
    const res = await api.patch('/me/profile', payload);
    return unwrapAccount<MyProfile>(res.data);
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/me/change-password', { currentPassword, newPassword });
  }

  static async logoutAllDevices(): Promise<void> {
    await api.post('/me/logout-all');
  }

  static resendVerification(email: string) {
    return postPublic('/auth/resend-verification-email', { email });
  }

  static verifyEmail(email: string, code: string) {
    return postPublic('/auth/verify-email', { email, code });
  }
}
