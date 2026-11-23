'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CommunityTabKey, CommunitySortMode } from '@/constants/enums';
import {
  COMMUNITY_FEED_PAGE_SIZE,
  CommunityApi,
  type CommunityPost,
  type CommunityMemberSummary,
} from '../api';
import { collectMatchingPostsBatch } from '../utils/community-feed.helper';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/constants/api-url';
export { useInfiniteScrollObserver } from '@/hooks/useInfiniteScrollObserver';

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
