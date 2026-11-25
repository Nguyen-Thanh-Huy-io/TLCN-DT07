import { ContentStatus, CommunityTabKey, CommunitySortMode } from '@/constants/enums';
import { CommunityApi } from './api';
import { getInitials } from '@/utils/common';
export { getInitials };

export const CONTENT_BLOCK_META_TYPE = 'meta';

export const CONTENT_BLOCK_METADATA_KIND = 'metadata';

export enum CommunityVideoKind {
  UPLOAD = 'upload',
  YOUTUBE = 'youtube',
}

export interface CommunityImageItem {
  url: string;
  caption?: string | null;
}

export interface CommunityVideoItem {
  url: string;
  kind: CommunityVideoKind;
  caption?: string | null;
}

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
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks: unknown[];
  status: ContentStatus;
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

export interface CommunityReferenceItem {
  title: string;
  source?: string | null;
}

export interface CommunityContentParsed {
  tags: string[];
  period: string | null;
  locations: string | null;
  paragraphs: string[];
  images: CommunityImageItem[];
  videos: CommunityVideoItem[];
  references: CommunityReferenceItem[];
  sharedBlog: SharedBlogEmbed | null;
}

const YOUTUBE_EMBED_ORIGIN = ['https', '//www.youtube.com/embed/'].join(':');

/** Tách YouTube video ID an toàn và trả về URL iframe embed hợp lệ (hoặc null). */
export function toYoutubeEmbedUrl(rawUrl: string): string | null {
  const clean = rawUrl.trim();
  if (!clean) return null;
  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
      else if (parsed.pathname.startsWith('/shorts/')) id = parsed.pathname.split('/')[2] ?? null;
      else if (parsed.pathname.startsWith('/embed/')) id = parsed.pathname.split('/')[2] ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return `${YOUTUBE_EMBED_ORIGIN}${id}`;
  } catch {
    return null;
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

export function isMetaBlock(block: unknown): block is Record<string, unknown> {
  const record = asRecord(block);
  if (!record) return false;
  return record.type === CONTENT_BLOCK_META_TYPE || record.kind === CONTENT_BLOCK_METADATA_KIND;
}

export function extractTags(meta: Record<string, unknown>): string[] {
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

export function extractImages(meta: Record<string, unknown>): CommunityImageItem[] {
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

export function extractVideos(meta: Record<string, unknown>): CommunityVideoItem[] {
  const rawVideos = meta.videos;
  if (!Array.isArray(rawVideos)) return [];
  return rawVideos
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item?.url === 'string')
    .map((item) => ({
      url: item.url as string,
      kind:
        item.kind === CommunityVideoKind.YOUTUBE
          ? CommunityVideoKind.YOUTUBE
          : CommunityVideoKind.UPLOAD,
      caption: typeof item.caption === 'string' ? item.caption : null,
    }));
}

export function extractReferences(meta: Record<string, unknown>): CommunityContentParsed['references'] {
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

export function extractSharedBlog(meta: Record<string, unknown>): SharedBlogEmbed | null {
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
    videos: extractVideos(meta),
    references: extractReferences(meta),
    sharedBlog: extractSharedBlog(meta),
  };
}

// === Merged from community-feed.helper.ts ===
const RAW_FILTER_SCAN_LIMIT = 12;
const MAX_SCAN_ROUNDS_PER_BATCH = 3;

export function matchesTabFilter(
  post: CommunityPost,
  parsed: ReturnType<typeof extractCommunityContent>,
  tab: CommunityTabKey,
): boolean {
  if (tab === CommunityTabKey.SHARED_BLOG) return Boolean(parsed.sharedBlog);
  if (tab === CommunityTabKey.MEDIA) {
    return (
      !parsed.sharedBlog &&
      (parsed.images.length > 0 || parsed.videos.length > 0 || Boolean(post.coverImageUrl))
    );
  }
  return true;
}

export interface TabFeedFetchResult {
  posts: CommunityPost[];
  hasMore: boolean;
  rawCursor: string | null;
}

export async function collectMatchingPostsBatch({
  tab,
  targetCount,
  initialCursor = null,
}: {
  tab: CommunityTabKey;
  targetCount: number;
  initialCursor?: string | null;
}): Promise<TabFeedFetchResult> {
  const collected: CommunityPost[] = [];
  let cursor = initialCursor ?? undefined;
  let reachedEnd = false;

  for (let round = 0; round < MAX_SCAN_ROUNDS_PER_BATCH; round += 1) {
    const rawBatch = await CommunityApi.listPosts({
      sort: CommunitySortMode.LATEST,
      cursor,
      limit: RAW_FILTER_SCAN_LIMIT,
    });
    if (rawBatch.length === 0) {
      reachedEnd = true;
      break;
    }

    cursor = rawBatch[rawBatch.length - 1].id;
    for (const post of rawBatch) {
      if (matchesTabFilter(post, extractCommunityContent(post), tab)) {
        collected.push(post);
      }
    }

    if (rawBatch.length < RAW_FILTER_SCAN_LIMIT) {
      reachedEnd = true;
      break;
    }
    if (collected.length >= targetCount) {
      break;
    }
  }

  return {
    posts: collected,
    hasMore: !reachedEnd,
    rawCursor: cursor ?? null,
  };
}

export function matchesPostFilter(
  post: CommunityPost,
  activeTab: CommunityTabKey,
  isAuthorFollowed: (author?: { id: string; username: string; followedByMe?: boolean } | null) => boolean,
  selectedTag: string | null,
  searchQuery: string,
): boolean {
  const parsed = extractCommunityContent(post);
  if (!matchesTabFilter(post, parsed, activeTab)) {
    return false;
  }

  if (activeTab === CommunityTabKey.FOLLOWING && !isAuthorFollowed(post.author)) {
    return false;
  }

  if (selectedTag) {
    const hasTag = parsed.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    if (!hasTag) return false;
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const inTitle = post.title.toLowerCase().includes(q);
    const inExcerpt = (post.excerpt || '').toLowerCase().includes(q);
    const inAuthor = (post.author?.username || '').toLowerCase().includes(q);
    const inTags = parsed.tags.some((t) => t.toLowerCase().includes(q));
    const inSharedTitle = (parsed.sharedBlog?.title || '').toLowerCase().includes(q);
    return inTitle || inExcerpt || inAuthor || inTags || inSharedTitle;
  }

  return true;
}

export function computePopularTags(posts: CommunityPost[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const parsed = extractCommunityContent(post);
    for (const tag of parsed.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

async function fetchSavedTab(userId?: string): Promise<TabFeedFetchResult> {
  if (!userId) {
    return { posts: [], hasMore: false, rawCursor: null };
  }
  const saved = await CommunityApi.listMyBookmarks();
  return { posts: saved, hasMore: false, rawCursor: null };
}

async function fetchFollowingTab(
  userId: string | undefined,
  pageSize: number,
): Promise<TabFeedFetchResult> {
  if (!userId) {
    return { posts: [], hasMore: false, rawCursor: null };
  }
  const followedFeed = await CommunityApi.listPosts({
    followingOnly: true,
    sort: CommunitySortMode.LATEST,
    limit: pageSize,
  });
  return {
    posts: followedFeed,
    hasMore: followedFeed.length >= pageSize,
    rawCursor: followedFeed[followedFeed.length - 1]?.id ?? null,
  };
}

function computeFallbackTrending(posts: CommunityPost[], tab: CommunityTabKey): CommunityPost[] {
  return posts
    .filter((p) => matchesTabFilter(p, extractCommunityContent(p), tab))
    .sort((a, b) => {
      if (tab !== CommunityTabKey.TRENDING) return 0;
      const scoreA = a.likeCount * 2 + a.commentCount * 3 + a.viewCount * 0.1;
      const scoreB = b.likeCount * 2 + b.commentCount * 3 + b.viewCount * 0.1;
      return scoreB - scoreA;
    });
}

async function fetchStandardTab(
  tab: CommunityTabKey,
  initialPosts: CommunityPost[],
  pageSize: number,
): Promise<TabFeedFetchResult> {
  const isClientFiltered =
    tab === CommunityTabKey.SHARED_BLOG || tab === CommunityTabKey.MEDIA;
  if (isClientFiltered) {
    const batch = await collectMatchingPostsBatch({
      tab,
      targetCount: pageSize,
    });
    if (batch.posts.length > 0) {
      return batch;
    }
    return {
      posts: computeFallbackTrending(initialPosts, tab),
      hasMore: false,
      rawCursor: null,
    };
  }

  const fetched = await CommunityApi.listPosts({
    sort: tab === CommunityTabKey.TRENDING ? CommunitySortMode.TRENDING : CommunitySortMode.LATEST,
    limit: pageSize,
  });

  if (fetched.length > 0) {
    return {
      posts: fetched,
      hasMore: fetched.length >= pageSize,
      rawCursor: fetched[fetched.length - 1]?.id ?? null,
    };
  }

  if (tab === CommunityTabKey.ALL) {
    return {
      posts: initialPosts,
      hasMore: false,
      rawCursor: initialPosts[initialPosts.length - 1]?.id ?? null,
    };
  }

  return {
    posts: computeFallbackTrending(initialPosts, tab),
    hasMore: false,
    rawCursor: null,
  };
}

export function updateFollowedAuthorsMap(
  prev: Record<string, boolean>,
  identifier: string,
  following: boolean,
  suggestedMembers: Array<{ id: string; username: string }>,
): Record<string, boolean> {
  const clean = identifier.trim().toLowerCase();
  const next = { ...prev, [clean]: following };
  for (const m of suggestedMembers) {
    if (m.id.toLowerCase() === clean || m.username.toLowerCase() === clean) {
      next[m.id.toLowerCase()] = following;
      next[m.username.toLowerCase()] = following;
    }
  }
  return next;
}

export function updateSuggestedMembersList<T extends { id: string; username: string; followerCount: number; followedByMe?: boolean }>(
  current: T[],
  identifier: string,
  following: boolean,
  followerCount?: number,
): T[] {
  const clean = identifier.trim().toLowerCase();
  return current.map((m) => {
    if (m.id.toLowerCase() === clean || m.username.toLowerCase() === clean) {
      const nextCount =
        typeof followerCount === 'number'
          ? followerCount
          : Math.max(0, m.followerCount + (following ? 1 : -1));
      return { ...m, followedByMe: following, followerCount: nextCount };
    }
    return m;
  });
}

export async function fetchTabFeedPosts(
  tab: CommunityTabKey,
  userId: string | undefined,
  initialPosts: CommunityPost[],
  pageSize: number,
): Promise<TabFeedFetchResult> {
  if (tab === CommunityTabKey.SAVED) {
    return fetchSavedTab(userId);
  }
  if (tab === CommunityTabKey.FOLLOWING) {
    return fetchFollowingTab(userId, pageSize);
  }
  return fetchStandardTab(tab, initialPosts, pageSize);
}

export const AUTHOR_TINTS = [
  { bg: '#E5EFE6', ink: '#1E4620' },
  { bg: '#F2E5C9', ink: '#6B4E16' },
  { bg: '#E3EEF5', ink: '#144E75' },
  { bg: '#F4E1DF', ink: '#7A1F24' },
] as const;

export function getAuthorTint(name: string): { bg: string; ink: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AUTHOR_TINTS[hash % AUTHOR_TINTS.length];
}
