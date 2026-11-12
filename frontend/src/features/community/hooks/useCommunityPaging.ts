'use client';

import { useCallback, useState } from 'react';
import { CommunityTabKey, CommunitySortMode } from '@/constants/community.constant';
import { CommunityApi, type CommunityPost } from '../api';

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
