import api from '../api';

export type BlogStatusValue = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type BlogPostTypeValue = 'QUICK_POST' | 'LONG_FORM';

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
  async list(): Promise<BlogPostItem[]> {
    const res = await api.get('/posts');
    return unwrap<BlogPostItem[]>(res);
  },
  async create(payload: Partial<BlogPostItem> & { authorId?: string }): Promise<BlogPostItem> {
    return unwrap(await api.post('/posts', payload));
  },
  async review(
    id: string,
    payload: { status: 'PUBLISHED' | 'REJECTED' | 'DRAFT'; rejectionReason?: string },
  ): Promise<BlogPostItem> {
    return unwrap(await api.patch(`/posts/${id}/review`, payload));
  },
};
