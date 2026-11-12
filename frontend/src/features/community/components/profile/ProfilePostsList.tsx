'use client';

import React from 'react';
import type { CommunityPost } from '../../api';
import { PostCard } from '../PostCard';
import type { ProfileTabKey } from './profile.types';

export interface ProfilePostsListProps {
  activeTab: ProfileTabKey;
  filteredPosts: CommunityPost[];
  selectedTopic: string | null;
  searchQuery: string;
  onClearFilters: () => void;
  onSelectTag: (tag: string) => void;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate: (postId: string, bookmarked: boolean) => void;
}

export function ProfilePostsList({
  activeTab,
  filteredPosts,
  selectedTopic,
  searchQuery,
  onClearFilters,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
}: ProfilePostsListProps) {
  if (filteredPosts.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
        <h2 className="text-[16px] font-semibold text-[#14233F]">
          {activeTab === 'saved'
            ? 'Chưa có bài viết nào trong danh sách đã lưu'
            : 'Không có bài thảo luận nào khớp với bộ lọc hiện tại'}
        </h2>
        <p className="mt-1.5 text-[14px] text-[#5C4E3C]">
          {selectedTopic || searchQuery
            ? 'Hãy xóa bộ lọc chủ đề hoặc từ khóa tìm kiếm để xem toàn bộ đóng góp.'
            : 'Thành viên này chưa đăng bài thảo luận nào trong mục này.'}
        </p>
        {(selectedTopic || searchQuery) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F1E6D0] px-4 text-[13px] font-medium text-[#14233F]"
          >
            Hiển thị toàn bộ bài viết
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          activeTag={selectedTopic}
          onSelectTag={onSelectTag}
          onLikeUpdate={onLikeUpdate}
          onBookmarkUpdate={onBookmarkUpdate}
          showFollowButton={false}
        />
      ))}
    </div>
  );
}
