import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import type { ContentStatusValue } from './article.service';

export interface TimelineNodeItem {
  id?: string;
  articleId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  displayOrder?: number;
  /** Chỉ có khi đọc từ API (để hiển thị tên bài viết đã gắn + bài nào đang gắn với bài đó). */
  article?: {
    id: string;
    title: string;
    slug: string;
    status: ContentStatusValue;
    /** Bài khác liên kết tới bài của mốc (vd. nhân vật "Chỉ huy" → sự kiện). */
    linksIn?: Array<{ label: string | null; source: TimelineLinkedArticle }>;
    /** Bài của mốc liên kết tới (vd. sự kiện "Diễn ra tại" → di tích). */
    linksOut?: Array<{ label: string | null; target: TimelineLinkedArticle }>;
  } | null;
}

export interface TimelineLinkedArticle {
  id: string;
  title: string;
  category: { id: string; name: string } | null;
}

export interface TimelineItem {
  id: string;
  topicId?: string | null;
  topic?: { id: string; name: string; slug: string } | null;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  status: ContentStatusValue;
  createdAt: string;
  updatedAt: string;
  nodes?: TimelineNodeItem[];
  _count?: { nodes: number };
}

export interface TimelinePayload {
  topicId?: string | null;
  title: string;
  slug?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  displayOrder?: number;
  status?: ContentStatusValue;
  /** Thay toàn bộ mốc; thứ tự = vị trí trong mảng. */
  nodes?: Array<Omit<TimelineNodeItem, 'id' | 'displayOrder' | 'article'>>;
}

const unwrap = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const TimelineApiService = {
  async list(query: { page?: number; limit?: number; search?: string; status?: ContentStatusValue } = {}): Promise<PaginatedResult<TimelineItem>> {
    return parsePaginatedResponse<TimelineItem>((await api.get('/timelines', { params: query })).data);
  },
  async get(id: string): Promise<TimelineItem> {
    return unwrap(await api.get(`/timelines/${id}`));
  },
  async create(payload: TimelinePayload): Promise<TimelineItem> {
    return unwrap(await api.post('/timelines', payload));
  },
  async update(id: string, payload: Partial<TimelinePayload>): Promise<TimelineItem> {
    return unwrap(await api.patch(`/timelines/${id}`, payload));
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/timelines/${id}`);
  },
};
