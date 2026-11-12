'use client';

import React from 'react';
import { CommunityTabKey } from '@/constants/community.constant';
import type { CommunityPost } from '../api';
import { PostCard } from './PostCard';
import { CommunityFeedEmptyState } from './CommunityFeedEmptyState';

interface CommunityFeedListSectionProps {
  errorMsg: string;
  isLoading: boolean;
  filteredPosts: CommunityPost[];
  activeTab: CommunityTabKey;
  isLoggedIn: boolean;
  selectedTag: string | null;
  searchQuery: string;
  onResetFilters: () => void;
  onRetryLoadTab: () => void;
  onSelectTag: (tag: string) => void;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate: (postId: string, bookmarked: boolean) => void;
  isAuthorFollowed: (author?: { id: string; username: string; followedByMe?: boolean } | null) => boolean;
  currentUserId?: string;
  onFollowUpdate: (identifier: string, following: boolean, followerCount?: number) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMorePosts: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function CommunityFeedListSection({
  errorMsg,
  isLoading,
  filteredPosts,
  activeTab,
  isLoggedIn,
  selectedTag,
  searchQuery,
  onResetFilters,
  onRetryLoadTab,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
  isAuthorFollowed,
  currentUserId,
  onFollowUpdate,
  isLoadingMore,
  hasMore,
  onLoadMorePosts,
  sentinelRef,
}: CommunityFeedListSectionProps) {
  if (errorMsg) {
    return (
      <div className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 text-[14px] text-[#7A1F24]">
        <p>{errorMsg}</p>
        <button
          type="button"
          onClick={onRetryLoadTab}
          className="mt-2 font-semibold text-[#14233F] underline"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 md:p-8"
            aria-hidden="true"
          >
            <div className="h-5 w-44 rounded-[4px] bg-[#EFE5D2]" />
            <div className="mt-4 h-7 w-3/4 rounded-[4px] bg-[#EFE5D2]" />
            <div className="mt-3 h-4 w-full rounded-[4px] bg-[#F5EDE0]" />
            <div className="mt-2 h-4 w-2/3 rounded-[4px] bg-[#F5EDE0]" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <CommunityFeedEmptyState
        activeTab={activeTab}
        isLoggedIn={isLoggedIn}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        onResetFilter={onResetFilters}
      />
    );
  }

  const showPagination =
    isLoadingMore ||
    (hasMore &&
      activeTab !== CommunityTabKey.SAVED &&
      activeTab !== CommunityTabKey.SHARED_BLOG);

  return (
    <div className="space-y-6">
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          activeTag={selectedTag}
          onSelectTag={onSelectTag}
          onLikeUpdate={onLikeUpdate}
          onBookmarkUpdate={onBookmarkUpdate}
          isFollowedAuthor={isAuthorFollowed(post.author)}
          isOwnPost={Boolean(currentUserId && post.author?.id === currentUserId)}
          onFollowUpdate={onFollowUpdate}
        />
      ))}

      {showPagination ? (
        <div ref={sentinelRef} className="pt-2 text-center">
          {isLoadingMore ? (
            <span className="text-[14px] text-[#6E5D4B]">Đang tải thêm bài thảo luận...</span>
          ) : (
            <button
              type="button"
              onClick={onLoadMorePosts}
              className="h-10 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-5 text-[14px] font-medium text-[#14233F] hover:border-[#8A5A19]"
            >
              Tải thêm thảo luận
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
