import { CommunityTabKey, CommunitySortMode } from '@/constants/enums';
import {
  CommunityApi,
  extractCommunityContent,
  type CommunityPost,
} from '../api';

export function matchesPostFilter(
  post: CommunityPost,
  activeTab: CommunityTabKey,
  isAuthorFollowed: (author?: { id: string; username: string; followedByMe?: boolean } | null) => boolean,
  selectedTag: string | null,
  searchQuery: string,
): boolean {
  const parsed = extractCommunityContent(post);
  if (activeTab === CommunityTabKey.SHARED_BLOG && !parsed.sharedBlog) {
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
  const list = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (list.length > 0) return list;
  return [
    ['Hoàng thành Thăng Long', 1],
    ['Lịch sử Việt Nam', 1],
    ['Khảo cổ học', 1],
  ];
}

async function fetchSavedTab(userId?: string): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
  if (!userId) {
    return { posts: [], hasMore: false };
  }
  const saved = await CommunityApi.listMyBookmarks();
  return { posts: saved, hasMore: false };
}

async function fetchFollowingTab(
  userId: string | undefined,
  initialPosts: CommunityPost[],
): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
  if (userId) {
    const followedFeed = await CommunityApi.listPosts({
      followingOnly: true,
      limit: 24,
    });
    if (followedFeed.length > 0) {
      return { posts: followedFeed, hasMore: false };
    }
  }
  const allAvailable = await CommunityApi.listPosts({ limit: 24 });
  const sourceList = allAvailable.length > 0 ? allAvailable : initialPosts;
  return { posts: sourceList, hasMore: false };
}

function computeFallbackTrending(posts: CommunityPost[], tab: CommunityTabKey): CommunityPost[] {
  return posts
    .filter((p) =>
      tab === CommunityTabKey.SHARED_BLOG ? Boolean(extractCommunityContent(p).sharedBlog) : true,
    )
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
): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
  const fetched = await CommunityApi.listPosts({
    sort: tab === CommunityTabKey.TRENDING ? CommunitySortMode.TRENDING : CommunitySortMode.LATEST,
    limit: tab === CommunityTabKey.SHARED_BLOG ? 24 : pageSize,
  });

  if (fetched.length > 0) {
    if (tab === CommunityTabKey.SHARED_BLOG) {
      const sharedOnly = fetched.filter((p) => Boolean(extractCommunityContent(p).sharedBlog));
      return { posts: sharedOnly, hasMore: false };
    }
    return { posts: fetched, hasMore: fetched.length >= pageSize };
  }

  if (tab === CommunityTabKey.ALL) {
    return { posts: initialPosts, hasMore: false };
  }

  return { posts: computeFallbackTrending(initialPosts, tab), hasMore: false };
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
): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
  if (tab === CommunityTabKey.SAVED) {
    return fetchSavedTab(userId);
  }
  if (tab === CommunityTabKey.FOLLOWING) {
    return fetchFollowingTab(userId, initialPosts);
  }
  return fetchStandardTab(tab, initialPosts, pageSize);
}
