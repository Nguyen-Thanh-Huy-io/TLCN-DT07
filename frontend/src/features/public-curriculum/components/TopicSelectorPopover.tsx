'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Landmark, ChevronDown, Search, Check, X, BookOpen, Layers } from 'lucide-react';
import type { TopicItem } from '@/types/models';

export interface EnrichedTopicItem extends TopicItem {
  curriculumPathCount?: number;
  curriculumLessonCount?: number;
  eyebrow?: string;
}

interface TopicSelectorPopoverProps {
  topics: EnrichedTopicItem[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string | null) => void;
}

export function TopicSelectorPopover({
  topics,
  selectedTopicId,
  onSelectTopic,
}: TopicSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) || null,
    [topics, selectedTopicId],
  );

  // Đóng popover khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Lọc chủ đề theo từ khóa tìm kiếm
  const filteredTopics = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.eyebrow && t.eyebrow.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)),
    );
  }, [topics, searchKeyword]);

  const handleSelect = (topicId: string | null) => {
    onSelectTopic(topicId);
    setIsOpen(false);
    setSearchKeyword('');
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Nút bấm kích hoạt Popover */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-lh-brand/20 sm:w-auto sm:min-w-[260px] ${
          selectedTopic
            ? 'border-lh-brand/50 bg-lh-brand-soft/40 text-lh-brand font-bold'
            : 'border-lh-line bg-lh-surface-2/60 text-lh-ink font-semibold hover:border-lh-brand/30 hover:bg-lh-surface'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Chọn chủ đề lịch sử"
      >
        <div className="flex items-center gap-2 truncate">
          <Landmark className="size-4 shrink-0 text-lh-brand" />
          <span className="truncate">
            {selectedTopic ? selectedTopic.name : 'Tất cả chủ đề lịch sử'}
          </span>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-lh-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-lh-brand' : ''
          }`}
        />
      </button>

      {/* Popover Menu dạng thả xuống có tìm kiếm và phân cấp */}
      {isOpen && (
        <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-lh-line bg-lh-surface p-3 shadow-2xl sm:w-96">
          {/* Ô tìm kiếm chủ đề */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-lh-muted" />
            <input
              type="text"
              autoFocus
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm nhanh chủ đề..."
              className="h-8 w-full rounded-lg border border-lh-line bg-lh-surface-2/60 pl-8 pr-7 text-xs text-lh-ink outline-none transition placeholder:text-lh-muted focus:border-lh-brand/50 focus:bg-lh-surface focus:ring-1 focus:ring-lh-brand/20"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-lh-muted hover:text-lh-ink"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Danh sách chủ đề có cuộn gọn gàng */}
          <div className="max-h-72 overflow-y-auto divide-y divide-lh-line/60 pr-1">
            {/* Lựa chọn Tất cả chủ đề */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                selectedTopicId === null
                  ? 'bg-lh-brand-soft text-lh-brand font-bold'
                  : 'text-lh-ink hover:bg-lh-surface-2'
              }`}
            >
              <span>Tất cả chủ đề lịch sử</span>
              {selectedTopicId === null && <Check className="size-3.5 text-lh-brand" />}
            </button>

            {/* Các chủ đề thực tế */}
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopicId === topic.id;
              const pathCount = topic.curriculumPathCount || 0;
              const lessonCount = topic.curriculumLessonCount || 0;

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelect(topic.id)}
                  className={`flex w-full cursor-pointer items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                    isSelected
                      ? 'bg-lh-brand-soft text-lh-brand'
                      : 'text-lh-ink hover:bg-lh-surface-2'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                      {topic.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-lh-muted">
                      {topic.eyebrow && <span>{topic.eyebrow} •</span>}
                      {pathCount > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Layers className="size-2.5 text-lh-gold" /> {pathCount} lộ trình
                        </span>
                      )}
                      {lessonCount > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          • <BookOpen className="size-2.5 text-lh-brand" /> {lessonCount} bài học
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="mt-0.5 size-3.5 shrink-0 text-lh-brand" />}
                </button>
              );
            })}

            {!filteredTopics.length && (
              <div className="py-6 text-center text-xs text-lh-muted">
                Không tìm thấy chủ đề phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
