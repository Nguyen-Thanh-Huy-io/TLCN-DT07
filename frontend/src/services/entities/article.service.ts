import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import type { RevisionPendingResponse } from './content-revision.service';
import type { ArticleMetadata } from '../public/public-content.service';

export type { ArticleMetadata };

/** Trạng thái nội dung (ContentStatus) — bài viết / dòng thời gian. */
export type ContentStatusValue = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export const CONTENT_STATUS_LABELS: Record<ContentStatusValue, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Bị từ chối',
  ARCHIVED: 'Lưu trữ',
};

export interface CategoryItem {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive?: boolean;
  displayOrder: number;
  _count?: { articles: number };
}

/** API trả phẳng theo displayOrder/name chung, không theo cây — sắp lại để con luôn đứng ngay sau cha. */
export function orderCategoriesByHierarchy(categories: CategoryItem[]): CategoryItem[] {
  const roots = categories.filter((c) => !c.parentId);
  const ordered = roots.flatMap((r) => [r, ...categories.filter((c) => c.parentId === r.id)]);
  const orphans = categories.filter((c) => c.parentId && !categories.some((p) => p.id === c.parentId));
  return [...ordered, ...orphans];
}

export interface ArticleTagRef {
  id: string;
  name: string;
  colorHex: string | null;
}

/** Mốc timeline trỏ tới 1 bài (năm + dòng thời gian chứa mốc). */
export interface ArticleNodeRef {
  id: string;
  title: string;
  description: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  timeline: { id: string; title: string; slug: string };
}

export interface ArticleItem {
  /** Tên người tạo — chỉ có ở API danh sách; "—" với bài tạo trước khi lưu người tạo. */
  creatorName?: string;
  id: string;
  categoryId: string | null;
  topicId: string | null;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  coverCaption: string | null;
  contentBlocks?: unknown;
  metadata?: ArticleMetadata | null;
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  isFeatured: boolean;
  displayOrder: number;
  status: ContentStatusValue;
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string; icon: string | null } | null;
  topic: { id: string; name: string; slug: string } | null;
  tags: ArticleTagRef[];
  tagIds: string[];
  /** Mốc timeline trỏ tới bài này (chỉ có ở chi tiết). */
  timelineNodes?: ArticleNodeRef[];
}

/** Payload ghi — cùng tên trường với CreateArticleDto backend. */
export interface ArticlePayload {
  title: string;
  slug?: string;
  categoryId?: string | null;
  topicId?: string | null;
  tagIds?: string[];
  summary?: string | null;
  coverImageUrl?: string | null;
  coverCaption?: string | null;
  contentBlocks?: unknown;
  metadata?: ArticleMetadata | null;
  dateText?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  isFeatured?: boolean;
  displayOrder?: number;
  status?: ContentStatusValue;
}

export interface ArticleQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
  status?: ContentStatusValue;
  sort?: 'updated' | 'year' | 'title';
}

const unwrap = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const ArticleApiService = {
  async list(query: ArticleQuery = {}): Promise<PaginatedResult<ArticleItem>> {
    const res = await api.get('/articles', { params: query });
    return parsePaginatedResponse<ArticleItem>(res.data);
  },
  async get(id: string): Promise<ArticleItem> {
    return unwrap(await api.get(`/articles/${id}`));
  },
  async create(payload: ArticlePayload): Promise<ArticleItem> {
    return unwrap(await api.post('/articles', payload));
  },
  /** Nội dung đang xuất bản + biên tập viên sửa → trả RevisionPendingResponse (xem isRevisionPending). */
  async update(id: string, payload: Partial<ArticlePayload>): Promise<ArticleItem | RevisionPendingResponse> {
    return unwrap(await api.patch(`/articles/${id}`, payload));
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/articles/${id}`);
  },
  async review(id: string, payload: { status: 'PUBLISHED' | 'REJECTED' | 'DRAFT'; rejectionReason?: string }): Promise<ArticleItem> {
    return unwrap(await api.patch(`/articles/${id}/review`, payload));
  },
};

export const CategoryApiService = {
  async list(): Promise<CategoryItem[]> {
    const data = unwrap<CategoryItem[]>(await api.get('/categories'));
    return Array.isArray(data) ? data : [];
  },
  async create(payload: Partial<CategoryItem>): Promise<CategoryItem> {
    return unwrap(await api.post('/categories', payload));
  },
  async update(id: string, payload: Partial<CategoryItem>): Promise<CategoryItem> {
    return unwrap(await api.patch(`/categories/${id}`, payload));
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
