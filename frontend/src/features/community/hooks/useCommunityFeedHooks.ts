'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES, COMMUNITY_ROUTES } from '@/constants/routes';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { CommunityTabKey, CommunitySortMode } from '@/constants/enums';
import {
  COMMUNITY_FEED_PAGE_SIZE,
  CommunityApi,
  CommunityMemberFollowFilter,
  CommunityMemberSort,
  extractErrorMessage,
  type CommunityPost,
  type CommunityMemberSummary,
  type PaginatedCommunityMembers,
} from '../api';
import { collectMatchingPostsBatch } from '../community-content.util';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/constants/api-url';

const DEFAULT_INFINITE_SCROLL_ROOT_MARGIN = '450px 0px';

export interface UseInfiniteScrollObserverParams {
  enabled: boolean;
  isLoading?: boolean;
  triggerKey: string | number;
  rootMargin?: string;
  onLoadMore: () => void;
}

export function useInfiniteScrollObserver({
  enabled,
  isLoading = false,
  triggerKey,
  rootMargin = DEFAULT_INFINITE_SCROLL_ROOT_MARGIN,
  onLoadMore,
}: UseInfiniteScrollObserverParams) {
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!sentinelEl || !enabled || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, enabled, isLoading, rootMargin, triggerKey]);

  return setSentinelEl;
}

interface UseCommunityPagingParams {
  posts: CommunityPost[];
  activeTab: CommunityTabKey;
  hasMore: boolean;
  rawCursorRef: React.MutableRefObject<string | null>;
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

function appendUniquePosts(
  current: CommunityPost[],
  incoming: CommunityPost[],
): CommunityPost[] {
  if (incoming.length === 0) return current;
  const existingIds = new Set(current.map((item) => item.id));
  const uniqueNext = incoming.filter((item) => !existingIds.has(item.id));
  return uniqueNext.length > 0 ? [...current, ...uniqueNext] : current;
}

export function useCommunityPaging({
  posts,
  activeTab,
  hasMore,
  rawCursorRef,
  setPosts,
  setHasMore,
}: UseCommunityPagingParams) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const postsRef = useRef(posts);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const loadMorePosts = useCallback(async () => {
    if (
      loadingRef.current ||
      !hasMore ||
      activeTab === CommunityTabKey.SAVED ||
      postsRef.current.length === 0
    ) {
      return;
    }

    const lastVisible = postsRef.current[postsRef.current.length - 1];
    const cursorId = rawCursorRef.current ?? lastVisible?.id;
    if (!cursorId || cursorId.startsWith('seed-post-')) {
      setHasMore(false);
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);
    try {
      if (
        activeTab === CommunityTabKey.MEDIA ||
        activeTab === CommunityTabKey.SHARED_BLOG
      ) {
        const result = await collectMatchingPostsBatch({
          tab: activeTab,
          targetCount: COMMUNITY_FEED_PAGE_SIZE,
          initialCursor: cursorId,
        });
        rawCursorRef.current = result.rawCursor;
        setPosts((current) => appendUniquePosts(current, result.posts));
        setHasMore(result.hasMore);
        return;
      }

      const nextBatch = await CommunityApi.listPosts({
        sort:
          activeTab === CommunityTabKey.TRENDING
            ? CommunitySortMode.TRENDING
            : CommunitySortMode.LATEST,
        followingOnly: activeTab === CommunityTabKey.FOLLOWING || undefined,
        cursor: cursorId,
        limit: COMMUNITY_FEED_PAGE_SIZE,
      });

      if (nextBatch.length === 0) {
        setHasMore(false);
      } else {
        rawCursorRef.current = nextBatch[nextBatch.length - 1].id;
        setPosts((current) => appendUniquePosts(current, nextBatch));
        setHasMore(nextBatch.length >= COMMUNITY_FEED_PAGE_SIZE);
      }
    } catch {
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [activeTab, hasMore, rawCursorRef, setHasMore, setPosts]);

  return { isLoadingMore, loadMorePosts };
}

// --- useCommunityRealtimeSocket.ts ---
const SOCKET_URL = API_BASE_URL;

interface UseCommunityRealtimeSocketParams {
  activeTab: CommunityTabKey;
  userId?: string;
  loadTabFeed: (tab: CommunityTabKey) => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  setSuggestedMembers: React.Dispatch<React.SetStateAction<CommunityMemberSummary[]>>;
  setRealtimeNotice: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useCommunityRealtimeSocket({
  activeTab,
  userId,
  loadTabFeed,
  setPosts,
  setSuggestedMembers,
  setRealtimeNotice,
}: UseCommunityRealtimeSocketParams) {
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('post:hidden', (payload: { postId?: string }) => {
      const hiddenId = payload?.postId;
      if (!hiddenId) return;

      setPosts((current) => {
        const target = current.find((p) => p.id === hiddenId);
        if (target && userId && target.author?.id === userId) {
          setRealtimeNotice(
            `Bài viết "${target.title}" đã bị hệ thống AI tạm ẩn do phát hiện dấu hiệu vi phạm quy tắc cộng đồng.`,
          );
        }
        return current.filter((p) => p.id !== hiddenId);
      });
    });

    socket.on('post:restored', () => {
      void loadTabFeed(activeTab);
    });

    socket.on('post:like-updated', (payload: { postId?: string; likeCount?: number }) => {
      if (!payload?.postId || typeof payload.likeCount !== 'number') return;
      setPosts((current) =>
        current.map((item) =>
          item.id === payload.postId ? { ...item, likeCount: Math.max(0, payload.likeCount!) } : item,
        ),
      );
    });

    socket.on(
      'user:follow-updated',
      (payload: { targetUserId?: string; followerCount?: number }) => {
        if (!payload?.targetUserId || typeof payload.followerCount !== 'number') return;
        setSuggestedMembers((current) =>
          current.map((m) =>
            m.id === payload.targetUserId
              ? { ...m, followerCount: Math.max(0, payload.followerCount!) }
              : m,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [activeTab, loadTabFeed, setPosts, setRealtimeNotice, setSuggestedMembers, userId]);
}

// === Merged from useCommunityMembers.ts ===
const PAGE_LIMIT = 18;
const SEARCH_DEBOUNCE_MS = 300;

export function useCommunityMembers(initialData: PaginatedCommunityMembers) {
  const router = useRouter();
  const sessionUser = useAuthSession();

  const [members, setMembers] = useState<CommunityMemberSummary[]>(initialData.items);
  const [total, setTotal] = useState<number>(initialData.total);
  const [page, setPage] = useState<number>(initialData.page || 1);
  const [totalPages, setTotalPages] = useState<number>(initialData.totalPages);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [followFilter, setFollowFilter] = useState<CommunityMemberFollowFilter>(
    CommunityMemberFollowFilter.ALL,
  );
  const [sort, setSort] = useState<CommunityMemberSort>(
    CommunityMemberSort.CONTRIBUTION,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingFollowIds, setPendingFollowIds] = useState<Record<string, boolean>>({});
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [debouncedSearch, searchInput]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await CommunityApi.listMembers({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        sort,
        filter: followFilter,
      });
      setMembers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setErrorMsg(
        extractErrorMessage(err, 'Không thể tải danh sách thành viên Cộng đồng.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, followFilter, page, sort]);

  useEffect(() => {
    const isInitialDefaultGuest =
      !hasHydratedRef.current &&
      !sessionUser?.id &&
      page === 1 &&
      !debouncedSearch &&
      followFilter === CommunityMemberFollowFilter.ALL &&
      sort === CommunityMemberSort.CONTRIBUTION;

    hasHydratedRef.current = true;
    if (isInitialDefaultGuest) return;

    let active = true;
    void Promise.resolve().then(() => {
      if (active) void fetchMembers();
    });
    return () => {
      active = false;
    };
  }, [debouncedSearch, fetchMembers, followFilter, page, sessionUser, sort]);

  const handleSelectFilter = (nextFilter: CommunityMemberFollowFilter) => {
    setFollowFilter(nextFilter);
    setPage(1);
  };

  const handleSelectSort = (nextSort: CommunityMemberSort) => {
    setSort(nextSort);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setFollowFilter(CommunityMemberFollowFilter.ALL);
    setSort(CommunityMemberSort.CONTRIBUTION);
    setPage(1);
  };

  const handleToggleFollow = async (member: CommunityMemberSummary) => {
    if (!sessionUser?.id) {
      router.push(
        `${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(COMMUNITY_ROUTES.MEMBERS)}`,
      );
      return;
    }
    if (member.isMe || pendingFollowIds[member.id]) return;

    const nextFollowed = !member.followedByMe;
    const optimisticDelta = nextFollowed ? 1 : -1;

    setPendingFollowIds((prev) => ({ ...prev, [member.id]: true }));
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id
          ? {
              ...item,
              followedByMe: nextFollowed,
              followerCount: Math.max(0, item.followerCount + optimisticDelta),
            }
          : item,
      ),
    );

    try {
      const res = await CommunityApi.toggleFollow(member.username);
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                followedByMe: res.following,
                followerCount:
                  typeof res.followerCount === 'number'
                    ? res.followerCount
                    : item.followerCount,
              }
            : item,
        ),
      );
    } catch (err) {
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                followedByMe: member.followedByMe,
                followerCount: member.followerCount,
              }
            : item,
        ),
      );
      setErrorMsg(
        extractErrorMessage(err, 'Không thể cập nhật trạng thái theo dõi lúc này.'),
      );
    } finally {
      setPendingFollowIds((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
    }
  };

  return {
    sessionUser,
    members,
    total,
    page,
    totalPages,
    searchInput,
    debouncedSearch,
    followFilter,
    sort,
    isLoading,
    errorMsg,
    pendingFollowIds,
    setSearchInput,
    setPage,
    handleSelectFilter,
    handleSelectSort,
    handleResetFilters,
    handleToggleFollow,
    retryFetch: fetchMembers,
  };
}
