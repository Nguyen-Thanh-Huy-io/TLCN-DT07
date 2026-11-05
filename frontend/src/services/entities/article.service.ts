import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import type { RevisionPendingResponse } from './content-revision.service';
import type { ArticleMetadata } from '../public/public-content.service';

export type { ArticleMetadata };
import type { ArticleKind } from '../public/article-kind';

/** Trạng thái nội dung (ContentStatus) — bài viết / dòng thời gian. */
export type ContentStatusValue = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export const CONTENT_STATUS_LABELS: Record<ContentStatusValue, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Bị từ chối',
  ARCHIVED: 'Lưu trữ',
};

export type DatePrecisionValue =
  | 'DAY' | 'MONTH' | 'YEAR' | 'DECADE' | 'CENTURY' | 'APPROXIMATE' | 'RANGE' | 'UNKNOWN';

export interface CategoryItem {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  /** null = kế thừa chuyên mục cha. */
  kind: ArticleKind | null;
  displayOrder: number;
  _count?: { articles: number };
}

export interface ArticleTagRef {
  id: string;
  name: string;
  colorHex: string | null;
}

/** Liên kết bài này → bài khác, đúng dạng payload ghi (thay toàn bộ khi lưu). */
export interface ArticleLinkInput {
  targetId: string;
  label?: string | null;
  note?: string | null;
}

/** Bài ở đầu kia liên kết (CMS hiển thị). */
export interface LinkedArticleRef {
  id: string;
  title: string;
  slug: string;
  status: ContentStatusValue;
  category: { id: string; name: string; slug: string; kind?: ArticleKind | null; parentId?: string | null } | null;
}

export interface ArticleLinkView {
  id: string;
  label: string | null;
  note: string | null;
  article: LinkedArticleRef;
}

export interface ArticleItem {
  id: string;
  categoryId: string | null;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  coverCaption: string | null;
  contentBlocks?: unknown;
  metadata?: ArticleMetadata | null;
  /** Chỉ có ở chi tiết (GET /articles/:id). */
  links?: ArticleLinkInput[];
  linksOut?: ArticleLinkView[];
  linksIn?: ArticleLinkView[];
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  datePrecision: DatePrecisionValue | null;
  isFeatured: boolean;
  displayOrder: number;
  status: ContentStatusValue;
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string; icon: string | null } | null;
  tags: ArticleTagRef[];
  tagIds: string[];
  timelineNodes?: Array<{ id: string; title: string; timeline: { id: string; title: string; slug: string } }>;
}

/** Payload ghi — cùng tên trường với CreateArticleDto backend. */
export interface ArticlePayload {
  title: string;
  slug?: string;
  categoryId?: string | null;
  tagIds?: string[];
  summary?: string | null;
  coverImageUrl?: string | null;
  coverCaption?: string | null;
  contentBlocks?: unknown;
  metadata?: ArticleMetadata | null;
  links?: ArticleLinkInput[];
  dateText?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  datePrecision?: DatePrecisionValue | null;
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
