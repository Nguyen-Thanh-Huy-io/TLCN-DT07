'use client';

import { useCallback, useState, useEffect } from 'react';
import { CommunityTabKey, CommunitySortMode } from '@/constants/enums';
import { CommunityApi, type CommunityPost, type CommunityMemberSummary } from '../api';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/constants/api-url';

const PAGE_SIZE = 8;

interface UseCommunityPagingParams {
  posts: CommunityPost[];
  activeTab: CommunityTabKey;
  hasMore: boolean;
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCommunityPaging({
  posts,
  activeTab,
  hasMore,
  setPosts,
  setHasMore,
}: UseCommunityPagingParams) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMorePosts = useCallback(async () => {
    if (
      isLoadingMore ||
      !hasMore ||
      activeTab === CommunityTabKey.SAVED ||
      activeTab === CommunityTabKey.SHARED_BLOG ||
      posts.length === 0
    ) {
      return;
    }

    const lastPost = posts[posts.length - 1];
    if (!lastPost || lastPost.id.startsWith('seed-post-')) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextBatch = await CommunityApi.listPosts({
        sort: activeTab === CommunityTabKey.TRENDING ? CommunitySortMode.TRENDING : CommunitySortMode.LATEST,
        cursor: lastPost.id,
        limit: PAGE_SIZE,
      });

      if (nextBatch.length === 0) {
        setHasMore(false);
      } else {
        setPosts((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          const uniqueNext = nextBatch.filter((item) => !existingIds.has(item.id));
          return [...current, ...uniqueNext];
        });
        setHasMore(nextBatch.length >= PAGE_SIZE);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeTab, hasMore, isLoadingMore, posts, setHasMore, setPosts]);

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
