import api from '../api';
import { PublicAuthService, isReviewerRole } from '../auth/public-auth.service';

export type RevisionContentType = 'LESSON' | 'EVENT' | 'ENTITY';

export const REVISION_TYPE_LABELS: Record<RevisionContentType, string> = {
  LESSON: 'Bài học',
  EVENT: 'Sự kiện',
  ENTITY: 'Nhân vật / thực thể',
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
  kind: 'PROPOSAL' | 'SNAPSHOT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
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
  kind: 'text' | 'longtext' | 'list' | 'json';
  before: unknown;
  after: unknown;
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

/** Phiên bản hóa nội dung đã xuất bản (bài học, sự kiện, thực thể). */
export const ContentRevisionApiService = {
  pending: async () => unwrap<ContentRevisionItem[]>(await api.get('/content-revisions/pending')),

  history: async (type: RevisionContentType, id: string) =>
    unwrap<{ liveVersion: number; items: ContentRevisionItem[] }>(
      await api.get(`/content-revisions/content/${typePath(type)}/${id}`),
    ),

  /** Bản sửa đang chờ phủ lên chi tiết (null nếu không có) — form CMS mở tiếp đúng bản sửa. */
  openDraft: async <T>(type: RevisionContentType, id: string) =>
    unwrap<{ revision: ContentRevisionItem; draft: T } | null>(
      await api.get(`/content-revisions/content/${typePath(type)}/${id}/draft`),
    ),

  detail: async (revisionId: string) =>
    unwrap<{ revision: ContentRevisionItem; changes: RevisionChange[] }>(
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
  if (detail.status !== 'PUBLISHED') return { detail, pending: null };
  try {
    const open = await ContentRevisionApiService.openDraft<T>(type, id);
    if (!open) return { detail, pending: null };
    const reviewer = isReviewerRole(PublicAuthService.getCurrentUser()?.role);
    return { detail: reviewer ? detail : open.draft, pending: open.revision };
  } catch {
    return { detail, pending: null };
  }
}
