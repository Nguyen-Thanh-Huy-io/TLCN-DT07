import api from '../api';

export type BlogStatusValue = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type BlogPostTypeValue = 'QUICK_POST' | 'LONG_FORM';

const POSTS_PATH = '/posts';
const REVIEW_QUEUE_PATH = `${POSTS_PATH}/review`;
/** Bằng giới hạn tối đa backend cho phép (`BLOG_REVIEW_MAX_LIMIT`). */
const REVIEW_QUEUE_LIMIT = 100;

export interface BlogPostItem {
  id: string;
  postType?: BlogPostTypeValue;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks?: unknown;
  status: BlogStatusValue;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; username: string } | null;
}

const unwrap = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const BlogApiService = {
  /** Hàng đợi duyệt (mọi trạng thái) — chỉ Admin/Superadmin; bảng tin công khai chỉ có bài đã xuất bản. */
  async list(): Promise<BlogPostItem[]> {
    const res = await api.get(REVIEW_QUEUE_PATH, { params: { limit: REVIEW_QUEUE_LIMIT } });
    return unwrap<BlogPostItem[]>(res);
  },
  async create(payload: Partial<BlogPostItem>): Promise<BlogPostItem> {
    return unwrap(await api.post(POSTS_PATH, payload));
  },
  async review(
    id: string,
    payload: { status: 'PUBLISHED' | 'REJECTED' | 'DRAFT'; rejectionReason?: string },
  ): Promise<BlogPostItem> {
    return unwrap(await api.patch(`${POSTS_PATH}/${id}/review`, payload));
  },
};
