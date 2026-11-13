'use client';

import React from 'react';
import { CommunityTabKey, COMMUNITY_TAB_LABELS } from '@/constants/enums';

interface CommunityFeedFilterBarProps {
  activeTab: CommunityTabKey;
  selectedTag: string | null;
  searchQuery: string;
  totalPosts: number;
  onResetFilters: () => void;
}

export function CommunityFeedFilterBar({
  activeTab,
  selectedTag,
  searchQuery,
  totalPosts,
  onResetFilters,
}: CommunityFeedFilterBarProps) {
  const hasFilter = Boolean(selectedTag || searchQuery.trim() || activeTab !== CommunityTabKey.ALL);
  if (!hasFilter) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#F1E6D0] px-4 py-2.5 text-[13px] text-[#5C4E3C]">
      <div className="flex flex-wrap items-center gap-2">
        <span>Đang hiển thị:</span>
        <strong className="text-[#14233F]">
          {COMMUNITY_TAB_LABELS[activeTab]}
        </strong>
        {selectedTag ? (
          <span className="rounded-[4px] bg-[#7A1F24] px-2 py-0.5 text-[12px] font-semibold text-[#FAF5E6]">
            #{selectedTag}
          </span>
        ) : null}
        {searchQuery.trim() ? (
          <span className="rounded-[4px] bg-[#FAF5E6] px-2 py-0.5 text-[12px] font-semibold text-[#14233F]">
            Từ khóa: &ldquo;{searchQuery.trim()}&rdquo;
          </span>
        ) : null}
        <span className="text-[#7A6B57] tabular-nums">
          ({totalPosts} bài viết)
        </span>
      </div>

      <button
        type="button"
        onClick={onResetFilters}
        className="font-semibold text-[#7A1F24] hover:underline"
      >
        Đặt lại mặc định
      </button>
    </div>
  );
}
