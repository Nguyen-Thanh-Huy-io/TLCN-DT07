/**
 * Lớp dữ liệu cho tính năng Cộng đồng (Diễn đàn thảo luận + chia sẻ bài Blog).
 * Backend dùng chung bảng BlogPost: postType=QUICK_POST là bài thảo luận/câu hỏi ngắn trên
 * Cộng đồng, postType=LONG_FORM là bài chuyên khảo trên Blog (có thể được chia sẻ sang đây).
 * Route backend: backend/src/blog/blog.controller.ts (prefix /posts).
 */

import api, { extractErrorMessage } from '@/services/api';
import type { BlogPostTypeValue, BlogStatusValue } from '@/services/entities/blog.service';
import { CONTENT_BLOCK_META_TYPE } from './community-content.util';
import type {
  CommunityImageItem,
  CommunityPost,
  CommunityPreviewComment,
  CommunityVideoItem,
  SharedBlogEmbed,
} from './community-content.util';

const POSTS_BASE_PATH = '/posts';

/** Số bài viết tải mỗi đợt khi mở bảng tin hoặc cuộn trang (lazy loading). */
export const COMMUNITY_FEED_PAGE_SIZE = 6;

/** Định danh hồ sơ của chính người đang đăng nhập (/cong-dong/thanh-vien/me). */
export const SSR_ME_IDENTIFIER = 'me';

const POST_TYPE_QUICK_POST: BlogPostTypeValue = 'QUICK_POST';

const POST_TYPE_LONG_FORM: BlogPostTypeValue = 'LONG_FORM';

const BLOG_STATUS_PUBLISHED: BlogStatusValue = 'PUBLISHED';

const enc = encodeURIComponent;

const postPath = (postId: string) => `${POSTS_BASE_PATH}/${postId}`;

const userProfilePath = (identifier: string) => `${POSTS_BASE_PATH}/users/${enc(identifier)}/profile`;

const userFollowStatusPath = (identifier: string) => `${POSTS_BASE_PATH}/users/${enc(identifier)}/follow-status`;

const userFollowPath = (identifier: string) => `${POSTS_BASE_PATH}/users/${enc(identifier)}/follow`;

export interface CommunityMemberSummary {
  id: string;
  username: string;
  displayName: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  // Tùy chọn: chỉ getSuggestedMembers trả 2 trường này; các nơi tạo thẻ thành viên lạc quan (optimistic)
  // trên UI (CommunityProfileView) không có dữ liệu này nên để tùy chọn thay vì bắt buộc.
  totalLikesReceived?: number;
  totalCommentsReceived?: number;
  followedByMe: boolean;
  isMe: boolean;
}

// CommunityProfileView dùng chung các hàm cập nhật trạng thái theo dõi cho cả danh sách
// gợi ý (CommunityMemberSummary) và danh sách followers/following, nên hai type phải khớp field.
export interface CommunityMemberCard extends CommunityMemberSummary {
  followedAt?: string;
}

export enum CommunityMemberSort {
  CONTRIBUTION = 'contribution',
  FOLLOWERS = 'followers',
  NEWEST = 'newest',
}

export enum CommunityMemberFollowFilter {
  ALL = 'all',
  NOT_FOLLOWING = 'not_following',
  FOLLOWING = 'following',
}

export interface ListCommunityMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: CommunityMemberSort;
  filter?: CommunityMemberFollowFilter;
}

export interface PaginatedCommunityMembers {
  items: CommunityMemberSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublishedWorkArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  dateLabel?: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface PublishedWorkLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  topicName: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface CommunityMemberProfile {
  user: {
    id: string;
    username: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    bio: string | null;
    avatarUrl: string | null;
    joinedAt: string;
  };
  stats: {
    postCount: number;
    sharedBlogCount: number;
    questionPostCount: number;
    publishedArticlesCount: number;
    publishedLessonsCount: number;
    followerCount: number;
    followingCount: number;
    totalLikesReceived: number;
    totalCommentsReceived: number;
    totalViewsReceived: number;
  };
  topTopics: Array<{ tag: string; count: number }>;
  followedByMe: boolean;
  isMe: boolean;
  posts: CommunityPost[];
  bookmarkedPosts: CommunityPost[];
  followers: CommunityMemberCard[];
  following: CommunityMemberCard[];
  publishedArticles: PublishedWorkArticle[];
  publishedLessons: PublishedWorkLesson[];
}

export interface ListCommunityPostsParams {
  sort?: 'latest' | 'trending';
  cursor?: string;
  limit?: number;
  author?: string;
  followingOnly?: boolean;
}

export interface UpdateCommunityProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CreateQuickPostPayload {
  title: string;
  content: string;
  period?: string;
  tags: string[];
  imageUrl?: string | null;
  imageCaption?: string;
  images?: CommunityImageItem[];
  video?: CommunityVideoItem | null;
  sharedBlog?: SharedBlogEmbed | null;
}

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

export interface ToggleBookmarkResult {
  bookmarked: boolean;
}

export interface ToggleFollowResult {
  following: boolean;
  followerCount: number;
  targetUserId: string;
  targetUsername: string;
}

export interface FollowStatusResult {
  targetUserId: string;
  targetUsername: string;
  followerCount: number;
  following: boolean;
  isMe: boolean;
}

export interface ReportPostResult {
  success: boolean;
  reportId: string;
}

// Hình dạng thô mà backend trả về (field có thể thiếu tùy endpoint, xem blog.service.ts mapPost/mapMemberCard)
interface RawCommunityAuthor {
  id: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  followerCount?: number;
  followedByMe?: boolean;
}

interface RawCommunityPost {
  id: string;
  postType?: BlogPostTypeValue;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  contentBlocks?: unknown;
  status: BlogStatusValue;
  isFeatured?: boolean;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  author?: RawCommunityAuthor | null;
  previewComment?: CommunityPreviewComment | null;
}

interface RawCommunityMemberCard {
  id: string;
  username: string;
  displayName: string;
  role: string;
  bio?: string | null;
  avatarUrl?: string | null;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  followedByMe?: boolean;
  isMe?: boolean;
  followedAt?: string;
}

interface RawCommunityMemberProfile {
  user: CommunityMemberProfile['user'];
  stats: CommunityMemberProfile['stats'];
  topTopics?: Array<{ tag: string; count: number }>;
  followedByMe?: boolean;
  isMe?: boolean;
  posts?: RawCommunityPost[];
  bookmarkedPosts?: RawCommunityPost[];
  followers?: RawCommunityMemberCard[];
  following?: RawCommunityMemberCard[];
  publishedArticles?: PublishedWorkArticle[];
  publishedLessons?: PublishedWorkLesson[];
}

// ============================================================
// Chuẩn hóa dữ liệu thô từ backend
// ============================================================

function normalizePost(raw: RawCommunityPost): CommunityPost {
  return {
    id: raw.id,
    postType: raw.postType ?? POST_TYPE_QUICK_POST,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? null,
    coverImageUrl: raw.coverImageUrl ?? null,
    contentBlocks: Array.isArray(raw.contentBlocks) ? raw.contentBlocks : [],
    status: raw.status,
    isFeatured: raw.isFeatured ?? false,
    likeCount: raw.likeCount ?? 0,
    commentCount: raw.commentCount ?? 0,
    viewCount: raw.viewCount ?? 0,
    likedByMe: raw.likedByMe ?? false,
    bookmarkedByMe: raw.bookmarkedByMe ?? false,
    publishedAt: raw.publishedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
    author: raw.author
      ? {
          id: raw.author.id,
          username: raw.author.username,
          bio: raw.author.bio ?? null,
          avatarUrl: raw.author.avatarUrl ?? null,
          followerCount: raw.author.followerCount ?? 0,
          followedByMe: raw.author.followedByMe ?? false,
        }
      : null,
    previewComment: raw.previewComment ?? null,
  };
}

function normalizeMemberCard(raw: RawCommunityMemberCard): CommunityMemberCard {
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.displayName,
    role: raw.role,
    bio: raw.bio ?? null,
    avatarUrl: raw.avatarUrl ?? null,
    postCount: raw.postCount ?? 0,
    followerCount: raw.followerCount ?? 0,
    followingCount: raw.followingCount ?? 0,
    // Backend không trả tổng lượt thích/bình luận cho thẻ follower/following (chỉ getSuggestedMembers có).
    totalLikesReceived: 0,
    totalCommentsReceived: 0,
    followedByMe: raw.followedByMe ?? false,
    isMe: raw.isMe ?? false,
    followedAt: raw.followedAt,
  };
}

function normalizeProfile(raw: RawCommunityMemberProfile): CommunityMemberProfile {
  return {
    user: raw.user,
    stats: {
      ...raw.stats,
      publishedArticlesCount: raw.stats.publishedArticlesCount ?? (raw.publishedArticles?.length ?? 0),
      publishedLessonsCount: raw.stats.publishedLessonsCount ?? (raw.publishedLessons?.length ?? 0),
    },
    topTopics: raw.topTopics ?? [],
    followedByMe: raw.followedByMe ?? false,
    isMe: raw.isMe ?? false,
    posts: (raw.posts ?? []).map(normalizePost),
    bookmarkedPosts: (raw.bookmarkedPosts ?? []).map(normalizePost),
    followers: (raw.followers ?? []).map(normalizeMemberCard),
    following: (raw.following ?? []).map(normalizeMemberCard),
    publishedArticles: raw.publishedArticles ?? [],
    publishedLessons: raw.publishedLessons ?? [],
  };
}

/** Hồ sơ dự phòng khi SSR không thể/không nên gọi API (ví dụ "me" cần token chỉ có ở client). */
function buildFallbackProfile(identifier: string): CommunityMemberProfile {
  const isMe = identifier === SSR_ME_IDENTIFIER;
  const safeUsername = isMe ? 'thanh-vien' : identifier;
  return {
    user: {
      id: safeUsername,
      username: safeUsername,
      displayName: 'Thành viên Cộng đồng HISGO',
      firstName: null,
      lastName: null,
      role: 'USER',
      bio: null,
      avatarUrl: null,
      joinedAt: new Date().toISOString(),
    },
    stats: {
      postCount: 0,
      sharedBlogCount: 0,
      questionPostCount: 0,
      publishedArticlesCount: 0,
      publishedLessonsCount: 0,
      followerCount: 0,
      followingCount: 0,
      totalLikesReceived: 0,
      totalCommentsReceived: 0,
      totalViewsReceived: 0,
    },
    topTopics: [],
    followedByMe: false,
    isMe,
    posts: [],
    bookmarkedPosts: [],
    followers: [],
    following: [],
    publishedArticles: [],
    publishedLessons: [],
  };
}

function buildListPostsQuery(params: ListCommunityPostsParams): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params.sort) query.sort = params.sort;
  if (params.cursor) query.cursor = params.cursor;
  if (params.limit) query.limit = params.limit;
  if (params.author) query.author = params.author;
  if (params.followingOnly) query.followingOnly = 'true';
  return query;
}

function buildListMembersQuery(
  params: ListCommunityMembersParams,
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  const search = params.search?.trim();
  if (search) query.search = search;
  if (params.sort) query.sort = params.sort;
  if (params.filter) query.filter = params.filter;
  return query;
}

function unwrapData<T>(res: { data: { data?: T } & T }): T {
  return (res.data?.data ?? res.data) as T;
}

export interface RawCommentAuthor {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface RawCommunityComment {
  id: string;
  parentId?: string | null;
  authorId?: string;
  author?: RawCommentAuthor;
  authorName?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  likesCount?: number;
  likes?: number;
  likeCount?: number;
  likedByMe?: boolean;
}

// ============================================================
// CommunityApi — gọi API /posts qua axios instance chung (client-side)
// ============================================================

export const CommunityApi = {
  async listPosts(params: ListCommunityPostsParams = {}): Promise<CommunityPost[]> {
    const res = await api.get(POSTS_BASE_PATH, { params: buildListPostsQuery(params) });
    const data = unwrapData<RawCommunityPost[]>(res);
    return Array.isArray(data) ? data.map(normalizePost) : [];
  },

  async listMyBookmarks(): Promise<CommunityPost[]> {
    const res = await api.get(`${POSTS_BASE_PATH}/bookmarks/me`);
    const data = unwrapData<RawCommunityPost[]>(res);
    return Array.isArray(data) ? data.map(normalizePost) : [];
  },

  async listShareableBlogs(): Promise<SharedBlogEmbed[]> {
    const res = await api.get(POSTS_BASE_PATH, {
      params: { type: POST_TYPE_LONG_FORM, limit: 50, sort: 'latest' },
    });
    const data = unwrapData<RawCommunityPost[]>(res);
    const list = Array.isArray(data) ? data : [];
    return list
      .filter((item) => item.status === BLOG_STATUS_PUBLISHED)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt ?? null,
        coverImageUrl: item.coverImageUrl ?? null,
        authorName: item.author?.username ?? null,
      }));
  },

  async createQuickPost(payload: CreateQuickPostPayload): Promise<CommunityPost> {
    const normalizedImages: CommunityImageItem[] =
      payload.images && payload.images.length > 0
        ? payload.images
        : payload.imageUrl
          ? [{ url: payload.imageUrl, caption: payload.imageCaption || null }]
          : [];
    const videos = payload.video ? [payload.video] : [];

    const res = await api.post(POSTS_BASE_PATH, {
      postType: POST_TYPE_QUICK_POST,
      title: payload.title,
      excerpt: payload.content,
      coverImageUrl: normalizedImages[0]?.url ?? null,
      status: BLOG_STATUS_PUBLISHED,
      contentBlocks: [
        {
          type: CONTENT_BLOCK_META_TYPE,
          tags: payload.tags,
          period: payload.period?.trim() || null,
          images: normalizedImages,
          videos,
          paragraphs: [payload.content],
          references: [],
          sharedBlog: payload.sharedBlog ?? null,
        },
      ],
    });
    return normalizePost(unwrapData<RawCommunityPost>(res));
  },

  async toggleLike(postId: string): Promise<ToggleLikeResult> {
    const res = await api.post(`${postPath(postId)}/like`);
    return unwrapData(res);
  },

  async toggleBookmark(postId: string): Promise<ToggleBookmarkResult> {
    const res = await api.post(`${postPath(postId)}/bookmark`);
    return unwrapData(res);
  },

  async reportPost(postId: string, reason?: string): Promise<ReportPostResult> {
    const res = await api.post(`${postPath(postId)}/report`, reason ? { reason } : {});
    return unwrapData(res);
  },

  async incrementView(postId: string): Promise<void> {
    try {
      await api.patch(`${postPath(postId)}/view`);
    } catch {
      // Không chặn luồng đọc bài nếu tăng view lỗi (fire-and-forget, giống backend)
    }
  },

  async getMyCommunityProfile(): Promise<CommunityMemberProfile> {
    const res = await api.get(`${POSTS_BASE_PATH}/users/me/profile`);
    return normalizeProfile(unwrapData<RawCommunityMemberProfile>(res));
  },

  async getCommunityProfile(identifier: string): Promise<CommunityMemberProfile> {
    const res = await api.get(userProfilePath(identifier));
    return normalizeProfile(unwrapData<RawCommunityMemberProfile>(res));
  },

  async updateMyCommunityProfile(payload: UpdateCommunityProfilePayload): Promise<CommunityMemberProfile> {
    const res = await api.patch(`${POSTS_BASE_PATH}/users/me/profile`, payload);
    return normalizeProfile(unwrapData<RawCommunityMemberProfile>(res));
  },

  async getSuggestedMembers(limit = 6): Promise<CommunityMemberSummary[]> {
    const res = await api.get(`${POSTS_BASE_PATH}/users/suggested`, { params: { limit } });
    const data = unwrapData<CommunityMemberSummary[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async listMembers(
    params: ListCommunityMembersParams = {},
  ): Promise<PaginatedCommunityMembers> {
    const res = await api.get(`${POSTS_BASE_PATH}/users`, {
      params: buildListMembersQuery(params),
    });
    const data = unwrapData<PaginatedCommunityMembers>(res);
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total: Number(data?.total) || 0,
      page: Number(data?.page) || 1,
      limit: Number(data?.limit) || 18,
      totalPages: Number(data?.totalPages) || 0,
    };
  },

  async getFollowStatus(identifier: string): Promise<FollowStatusResult> {
    const res = await api.get(userFollowStatusPath(identifier));
    return unwrapData(res);
  },

  async toggleFollow(identifier: string): Promise<ToggleFollowResult> {
    const res = await api.post(userFollowPath(identifier));
    return unwrapData(res);
  },

  async getComments(postId: string): Promise<RawCommunityComment[]> {
    const res = await api.get(`${postPath(postId)}/comments`);
    const data = unwrapData<RawCommunityComment[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async addComment(
    postId: string,
    content: string,
    parentId?: string,
  ): Promise<RawCommunityComment> {
    const res = await api.post(`${postPath(postId)}/comments`, {
      content,
      parentId: parentId || undefined,
    });
    return unwrapData(res);
  },

  async likeComment(postId: string, commentId: string): Promise<void> {
    await api.post(`${postPath(postId)}/comments/${commentId}/like`);
  },

  async updateComment(
    postId: string,
    commentId: string,
    content: string,
  ): Promise<void> {
    await api.patch(`${postPath(postId)}/comments/${commentId}`, { content });
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await api.delete(`${postPath(postId)}/comments/${commentId}`);
  },
};

// ============================================================
// Hàm fetch phía Server Component (SSR) — dùng fetch thuần, không có token (giống public-content.service.ts)
// ============================================================

export async function fetchCommunityFeedSSR(
  params: ListCommunityPostsParams = {},
): Promise<CommunityPost[]> {
  const query = buildListPostsQuery(params);

  try {
    const res = await api.get(POSTS_BASE_PATH, { params: query });
    const data = unwrapData<RawCommunityPost[]>(res);
    return Array.isArray(data) ? data.map(normalizePost) : [];
  } catch {
    return [];
  }
}

export async function fetchCommunityProfileSSR(identifier: string): Promise<CommunityMemberProfile> {
  // Hồ sơ của chính mình cần token (chỉ có ở client/localStorage) nên SSR không gọi API,
  // trả về khung dự phòng; CommunityProfileView sẽ tự làm mới qua CommunityApi ngay khi mount.
  if (identifier === SSR_ME_IDENTIFIER) {
    return buildFallbackProfile(identifier);
  }

  try {
    const res = await api.get(userProfilePath(identifier));
    const data = unwrapData<RawCommunityMemberProfile>(res);
    return normalizeProfile(data);
  } catch {
    return buildFallbackProfile(identifier);
  }
}

export async function fetchCommunityMembersSSR(
  params: ListCommunityMembersParams = {},
): Promise<PaginatedCommunityMembers> {
  try {
    const res = await api.get(`${POSTS_BASE_PATH}/users`, {
      params: buildListMembersQuery(params),
    });
    const data = unwrapData<PaginatedCommunityMembers>(res);
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total: Number(data?.total) || 0,
      page: Number(data?.page) || 1,
      limit: Number(data?.limit) || 18,
      totalPages: Number(data?.totalPages) || 0,
    };
  } catch {
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 18,
      totalPages: 0,
    };
  }
}

// Giữ extractErrorMessage sẵn re-export cho các component muốn hiển thị lỗi backend thống nhất.
export { extractErrorMessage };

export {
  CommunityVideoKind,
  extractCommunityContent,
  toYoutubeEmbedUrl,
} from './community-content.util';
export type {
  CommunityImageItem,
  CommunityPost,
  CommunityReferenceItem,
  CommunityVideoItem,
  SharedBlogEmbed,
} from './community-content.util';
