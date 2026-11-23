import { CommunityTabKey, CommunitySortMode } from '@/constants/enums';
import {
  CommunityApi,
  extractCommunityContent,
  type CommunityPost,
} from '../api';

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

/**
 * Quét theo cursor ở client tối đa vài đợt để gom đủ bài khớp tab Media / Chia sẻ Blog,
 * đảm bảo cuộn xuống vẫn tải nối tiếp được khi danh sách bài dài hơn 1 trang.
 */
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

export { getInitials } from '@/utils/common';
