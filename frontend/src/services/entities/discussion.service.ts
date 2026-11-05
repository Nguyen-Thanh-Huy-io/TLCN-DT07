import api, { parsePaginatedResponse, type PaginatedResult } from '../api';

export type DiscussionTargetType = 'LESSON' | 'ARTICLE';

export interface DiscussionAuthor {
  id: string;
  username: string;
  role: string;
  userProfile?: {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface DiscussionReplyItem {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  isOfficial: boolean;
  createdAt: string;
  user: DiscussionAuthor;
}

export interface DiscussionThreadItem {
  id: string;
  targetType: DiscussionTargetType;
  targetId: string;
  learningPathId?: string | null;
  userId: string;
  title: string;
  content: string;
  isAnswered: boolean;
  upvotesCount: number;
  createdAt: string;
  user: DiscussionAuthor;
  replies?: DiscussionReplyItem[];
  _count?: { replies: number };
}

export interface CreateThreadPayload {
  targetType: DiscussionTargetType;
  targetId: string;
  learningPathId?: string;
  title: string;
  content: string;
}

export class DiscussionApiService {
  static async list(params: {
    targetType?: DiscussionTargetType;
    targetId?: string;
    learningPathId?: string;
    isAnswered?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<DiscussionThreadItem>> {
    const res = await api.get('/discussions', { params });
    return parsePaginatedResponse<DiscussionThreadItem>(res.data);
  }

  static async get(id: string): Promise<DiscussionThreadItem> {
    const res = await api.get(`/discussions/${id}`);
    return res.data?.data ?? res.data;
  }

  static async create(payload: CreateThreadPayload): Promise<DiscussionThreadItem> {
    const res = await api.post('/discussions', payload);
    return res.data?.data ?? res.data;
  }

  static async reply(threadId: string, content: string): Promise<DiscussionReplyItem> {
    const res = await api.post(`/discussions/${threadId}/replies`, { content });
    return res.data?.data ?? res.data;
  }

  static async remove(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`/discussions/${id}`);
    return res.data?.data ?? res.data;
  }
}
