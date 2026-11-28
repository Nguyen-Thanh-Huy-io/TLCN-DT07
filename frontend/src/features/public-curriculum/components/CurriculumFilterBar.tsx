'use client';

import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import type { TopicItem } from '@/types/models';
import {
  TopicSelectorPopover,
  type EnrichedTopicItem,
} from './TopicSelectorPopover';

interface CurriculumFilterBarProps {
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
  topics: (EnrichedTopicItem | TopicItem)[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string | null) => void;
  resultCount?: number;
}

export function CurriculumFilterBar({
  searchKeyword,
  onSearchChange,
  topics,
  selectedTopicId,
  onSelectTopic,
  resultCount,
}: CurriculumFilterBarProps) {
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const hasActiveFilter = Boolean(searchKeyword.trim() || selectedTopicId);

  const handleClearAll = () => {
    onSearchChange('');
    onSelectTopic(null);
  };

  return (
    <div className="rounded-2xl border border-lh-line bg-lh-surface p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* 1. Ô tìm kiếm từ khóa */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-lh-muted" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên lộ trình, chương, bài học..."
            className="h-10 w-full rounded-xl border border-lh-line bg-lh-surface-2/60 pl-10 pr-9 text-sm text-lh-ink outline-none transition placeholder:text-lh-muted focus:border-lh-brand/50 focus:bg-lh-surface focus:ring-2 focus:ring-lh-brand/10"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lh-muted hover:text-lh-ink"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* 2. Dropdown Popover phân cấp chọn Chủ đề Lịch sử */}
        <TopicSelectorPopover
          topics={topics as EnrichedTopicItem[]}
          selectedTopicId={selectedTopicId}
          onSelectTopic={onSelectTopic}
        />

        {/* 3. Nút xóa bộ lọc nhanh khi đang có filter */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-lh-line bg-lh-surface-2/80 px-3 py-2 text-xs font-semibold text-lh-muted transition hover:bg-lh-surface hover:text-lh-brand"
          >
            <RotateCcw className="size-3.5" /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Dòng trạng thái lọc & Badge đang lọc */}
      {hasActiveFilter && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-lh-line/60 pt-2.5 text-xs text-lh-muted">
          <span>Đang lọc:</span>
          {selectedTopic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lh-brand-soft px-2.5 py-0.5 font-bold text-lh-brand">
              Chủ đề: {selectedTopic.name}
              <button
                type="button"
                onClick={() => onSelectTopic(null)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-lh-brand/10"
                aria-label="Bỏ chọn chủ đề"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {searchKeyword.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lh-surface-2 px-2.5 py-0.5 font-semibold text-lh-ink">
              Từ khóa: &quot;{searchKeyword.trim()}&quot;
            </span>
          )}
          {typeof resultCount === 'number' && (
            <span className="ml-auto font-medium text-lh-muted">
              Tìm thấy <strong className="text-lh-brand">{resultCount}</strong> kết quả
            </span>
          )}
        </div>
      )}
    </div>
  );
}
