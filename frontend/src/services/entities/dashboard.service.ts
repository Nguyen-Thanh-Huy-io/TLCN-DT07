import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import { ContentStatus, UserRole, UserStatus } from '@/constants/enums';

/** Khớp DashboardContentType ở backend/src/dashboard/dashboard.constant.ts. */
export enum DashboardContentType {
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  TIMELINE = 'TIMELINE',
  QUIZ = 'QUIZ',
}

/** Khớp ReviewQueueType ở backend/src/dashboard/dashboard.constant.ts. */
export enum ReviewQueueType {
  REVISION = 'REVISION',
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  BLOG = 'BLOG',
  REPORT = 'REPORT',
}

export enum DashboardActivityType {
  LESSON = 'LESSON',
  TOPIC = 'TOPIC',
  ARTICLE = 'ARTICLE',
}

export interface ContentStat {
  type: DashboardContentType;
  total: number;
  /** null với loại không có trạng thái (Đề thi). */
  byStatus: Record<ContentStatus, number> | null;
}

export interface MyRejectedItem {
  id: string;
  type: ReviewQueueType.ARTICLE | ReviewQueueType.LESSON;
  title: string;
  rejectionReason: string | null;
  updatedAt: string;
}

export interface MyWork {
  drafts: number;
  pending: number;
  rejectedCount: number;
  rejected: MyRejectedItem[];
}

export interface RecentActivityItem {
  id: string;
  title: string;
  type: DashboardActivityType;
  status: ContentStatus;
  authorName: string;
  updatedAt: string;
}

export type ReviewCounts = Record<ReviewQueueType, number>;

export interface DashboardOverviewData {
  contentStats: ContentStat[];
  reviewCounts: ReviewCounts;
  myWork: MyWork;
  recentActivities: RecentActivityItem[];
}

export interface ReviewQueueItem {
  id: string;
  type: ReviewQueueType;
  title: string;
  submitterName: string;
  submittedAt: string;
}

export interface ReviewQueueData {
  counts: ReviewCounts;
  total: number;
  /** Chờ lâu nhất trước. */
  items: ReviewQueueItem[];
}

export class DashboardApiService {
  /** Lỗi được ném ra để màn hình báo lỗi thật (không có dữ liệu mẫu dự phòng). */
  static async getOverview(): Promise<DashboardOverviewData> {
    const res = await api.get<{ data: DashboardOverviewData }>('/dashboard/overview');
    return res.data.data;
  }

  /** Hàng chờ duyệt gộp mọi loại — chỉ người duyệt gọi được. */
  static async getReviewQueue(): Promise<ReviewQueueData> {
    const res = await api.get<{ data: ReviewQueueData }>('/dashboard/review-queue');
    return res.data.data;
  }
}

// --- Merged from blog.service.ts ---
const POSTS_PATH = '/posts';
const REVIEW_QUEUE_PATH = `${POSTS_PATH}/review`;
const REVIEW_QUEUE_LIMIT = 100;

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks?: unknown;
  status: ContentStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; username: string } | null;
}

const unwrapBlog = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const BlogApiService = {
  async listForReview(status: ContentStatus): Promise<BlogPostItem[]> {
    const res = await api.get(REVIEW_QUEUE_PATH, { params: { status, limit: REVIEW_QUEUE_LIMIT } });
    return unwrapBlog<BlogPostItem[]>(res);
  },
  async create(payload: Partial<BlogPostItem>): Promise<BlogPostItem> {
    return unwrapBlog(await api.post(POSTS_PATH, payload));
  },
  async review(
    id: string,
    payload: { status: ContentStatus; rejectionReason?: string },
  ): Promise<BlogPostItem> {
    return unwrapBlog(await api.patch(`${POSTS_PATH}/${id}/review`, payload));
  },
};

// --- Merged from discussion.service.ts ---
export type DiscussionTargetType = 'LESSON';

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

// --- Merged from user.service.ts ---
export interface UserItem {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
}

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class UserApiService {
  static async getUsers(query: UserListQuery): Promise<PaginatedResult<UserItem>> {
    const res = await api.get('/users', { params: query });
    return parsePaginatedResponse<UserItem>(res.data);
  }

  static async changeRole(id: string, role: UserRole): Promise<void> {
    await api.patch(`/users/${id}`, { role });
  }
}
