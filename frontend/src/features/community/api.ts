/**
 * Lớp dữ liệu cho tính năng Cộng đồng (Diễn đàn thảo luận + chia sẻ bài Blog).
 * Backend dùng chung bảng BlogPost: postType=QUICK_POST là bài thảo luận/câu hỏi ngắn trên
 * Cộng đồng, postType=LONG_FORM là bài chuyên khảo trên Blog (có thể được chia sẻ sang đây).
 * Route backend: backend/src/blog/blog.controller.ts (prefix /posts).
 */

import { INTERNAL_API_BASE_URL } from '@/constants/api-url';
import api, { extractErrorMessage } from '@/services/api';
import type { BlogPostTypeValue, BlogStatusValue } from '@/services/entities/blog.service';

const API_URL = INTERNAL_API_BASE_URL;

const POSTS_BASE_PATH = '/posts';
const SSR_ME_IDENTIFIER = 'me';

const POST_TYPE_QUICK_POST: BlogPostTypeValue = 'QUICK_POST';
const POST_TYPE_LONG_FORM: BlogPostTypeValue = 'LONG_FORM';
const BLOG_STATUS_PUBLISHED: BlogStatusValue = 'PUBLISHED';
const CONTENT_BLOCK_META_TYPE = 'meta';
const CONTENT_BLOCK_METADATA_KIND = 'metadata';

const enc = encodeURIComponent;
const postPath = (postId: string) => `${POSTS_BASE_PATH}/${postId}`;
const userProfilePath = (identifier: string) => `${POSTS_BASE_PATH}/users/${enc(identifier)}/profile`;
const userFollowPath = (identifier: string) => `${POSTS_BASE_PATH}/users/${enc(identifier)}/follow`;

// ============================================================
// Types
// ============================================================

export interface CommunityAuthor {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number;
  followedByMe: boolean;
}

export interface CommunityPreviewComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SharedBlogEmbed {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
}

export interface CommunityPost {
  id: string;
  postType: BlogPostTypeValue;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks: unknown[];
  status: BlogStatusValue;
  isFeatured: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommunityAuthor | null;
  previewComment: CommunityPreviewComment | null;
}

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
  authorId: string;
  title: string;
  content: string;
  period?: string;
  tags: string[];
  imageUrl?: string | null;
  imageCaption?: string;
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

export interface ReportPostResult {
  success: boolean;
  reportId: string;
}

export interface CommunityContentParsed {
  tags: string[];
  period: string | null;
  locations: string | null;
  paragraphs: string[];
  images: Array<{ url: string; caption?: string | null }>;
  references: Array<{ title: string; source?: string | null }>;
  sharedBlog: SharedBlogEmbed | null;
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
    stats: raw.stats,
    topTopics: raw.topTopics ?? [],
    followedByMe: raw.followedByMe ?? false,
    isMe: raw.isMe ?? false,
    posts: (raw.posts ?? []).map(normalizePost),
    bookmarkedPosts: (raw.bookmarkedPosts ?? []).map(normalizePost),
    followers: (raw.followers ?? []).map(normalizeMemberCard),
    following: (raw.following ?? []).map(normalizeMemberCard),
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
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function isMetaBlock(block: unknown): block is Record<string, unknown> {
  const record = asRecord(block);
  if (!record) return false;
  return record.type === CONTENT_BLOCK_META_TYPE || record.kind === CONTENT_BLOCK_METADATA_KIND;
}

function extractTags(meta: Record<string, unknown>): string[] {
  const rawTags = meta.tags;
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      const record = asRecord(tag);
      return typeof record?.name === 'string' ? record.name : '';
    })
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean);
}

function extractImages(meta: Record<string, unknown>): CommunityContentParsed['images'] {
  const rawImages = meta.images;
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item?.url === 'string')
    .map((item) => ({
      url: item.url as string,
      caption: typeof item.caption === 'string' ? item.caption : null,
    }));
}

function extractReferences(meta: Record<string, unknown>): CommunityContentParsed['references'] {
  const rawReferences = meta.references;
  if (!Array.isArray(rawReferences)) return [];
  return rawReferences
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item?.title === 'string')
    .map((item) => ({
      title: item.title as string,
      source: typeof item.source === 'string' ? item.source : null,
    }));
}

function extractSharedBlog(meta: Record<string, unknown>): SharedBlogEmbed | null {
  const record = asRecord(meta.sharedBlog);
  if (!record || typeof record.slug !== 'string' || typeof record.title !== 'string') return null;
  return {
    slug: record.slug,
    title: record.title,
    excerpt: typeof record.excerpt === 'string' ? record.excerpt : null,
    coverImageUrl: typeof record.coverImageUrl === 'string' ? record.coverImageUrl : null,
    authorName: typeof record.authorName === 'string' ? record.authorName : null,
  };
}

/** Đọc khối "meta" lưu trong contentBlocks của bài viết (xem QuickComposer.handleSubmit và blog.service.ts getCommunityProfile). */
export function extractCommunityContent(post: CommunityPost): CommunityContentParsed {
  const metaBlock = post.contentBlocks.find(isMetaBlock);
  const metadataField = metaBlock ? asRecord(metaBlock.metadata) : null;
  const meta = metadataField ?? metaBlock ?? {};

  const paragraphs = Array.isArray(meta.paragraphs) && meta.paragraphs.length > 0
    ? (meta.paragraphs.filter((p): p is string => typeof p === 'string'))
    : post.excerpt
      ? [post.excerpt]
      : [];

  return {
    tags: extractTags(meta),
    period: typeof meta.period === 'string' ? meta.period : null,
    locations: typeof meta.locations === 'string' ? meta.locations : null,
    paragraphs,
    images: extractImages(meta),
    references: extractReferences(meta),
    sharedBlog: extractSharedBlog(meta),
  };
}

/** Danh sách gợi ý theo dõi dự phòng, hiển thị trước khi gọi API thành công hoặc khi API lỗi. */
export function getFallbackSuggestedMembers(): CommunityMemberSummary[] {
  return [
    {
      id: 'fallback-member-1',
      username: 'dang.quochuy',
      displayName: 'Đặng Quốc Huy',
      role: 'USER',
      bio: 'Nghiên cứu viên Kiến trúc cổ, quan tâm kiến trúc cung đình Á Đông.',
      avatarUrl: null,
      postCount: 12,
      followerCount: 48,
      followingCount: 20,
      totalLikesReceived: 96,
      totalCommentsReceived: 54,
      followedByMe: false,
      isMe: false,
    },
    {
      id: 'fallback-member-2',
      username: 'vu.thanhmai',
      displayName: 'Vũ Thanh Mai',
      role: 'USER',
      bio: 'Thành viên Sử quán, chuyên khảo cổ học Đông Dương.',
      avatarUrl: null,
      postCount: 9,
      followerCount: 35,
      followingCount: 18,
      totalLikesReceived: 70,
      totalCommentsReceived: 40,
      followedByMe: false,
      isMe: false,
    },
    {
      id: 'fallback-member-3',
      username: 'nguyen.vanthinh',
      displayName: 'TS. Nguyễn Văn Thịnh',
      role: 'MODERATOR',
      bio: 'Chuyên gia Hán Nôm, nghiên cứu văn bia và thư tịch cổ.',
      avatarUrl: null,
      postCount: 21,
      followerCount: 102,
      followingCount: 12,
      totalLikesReceived: 210,
      totalCommentsReceived: 130,
      followedByMe: false,
      isMe: false,
    },
    {
      id: 'fallback-member-4',
      username: 'luong.giakhanh',
      displayName: 'Lương Gia Khánh',
      role: 'USER',
      bio: 'Thành viên Sử quán, quan tâm lịch sử đô thị và làng nghề.',
      avatarUrl: null,
      postCount: 7,
      followerCount: 26,
      followingCount: 15,
      totalLikesReceived: 52,
      totalCommentsReceived: 31,
      followedByMe: false,
      isMe: false,
    },
    {
      id: 'fallback-member-5',
      username: 'bui.trongnghia',
      displayName: 'KTS. Bùi Trọng Nghĩa',
      role: 'USER',
      bio: 'Nghiên cứu Bảo tồn Di sản, kỹ thuật xây dựng cổ.',
      avatarUrl: null,
      postCount: 15,
      followerCount: 61,
      followingCount: 9,
      totalLikesReceived: 118,
      totalCommentsReceived: 67,
      followedByMe: false,
      isMe: false,
    },
  ];
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

function unwrapData<T>(res: { data: { data?: T } & T }): T {
  return (res.data?.data ?? res.data) as T;
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
    const res = await api.post(POSTS_BASE_PATH, {
      postType: POST_TYPE_QUICK_POST,
      title: payload.title,
      excerpt: payload.content,
      coverImageUrl: payload.imageUrl ?? null,
      status: BLOG_STATUS_PUBLISHED,
      authorId: payload.authorId,
      contentBlocks: [
        {
          type: CONTENT_BLOCK_META_TYPE,
          tags: payload.tags,
          period: payload.period?.trim() || null,
          images: payload.imageUrl
            ? [{ url: payload.imageUrl, caption: payload.imageCaption || null }]
            : [],
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

  async toggleFollow(identifier: string): Promise<ToggleFollowResult> {
    const res = await api.post(userFollowPath(identifier));
    return unwrapData(res);
  },

  async getComments(postId: string): Promise<unknown[]> {
    const res = await api.get(`${postPath(postId)}/comments`);
    const data = unwrapData<unknown[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async addComment(
    postId: string,
    content: string,
    parentId?: string,
  ): Promise<Record<string, unknown>> {
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

// Giữ extractErrorMessage sẵn re-export cho các component muốn hiển thị lỗi backend thống nhất.
export { extractErrorMessage };
