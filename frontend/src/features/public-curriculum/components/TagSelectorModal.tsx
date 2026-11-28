'use client';

import React, { useState, useId } from 'react';
import { Search, X, Tag as TagIcon, Hash } from 'lucide-react';
import type { LibraryLesson } from '@/services/entities/learner.service';

type TagItem = NonNullable<LibraryLesson['tags']>[number];

interface TagSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagItem[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
}

export function TagSelectorModal({
  isOpen,
  onClose,
  tags,
  selectedTagId,
  onSelectTag,
}: TagSelectorModalProps) {
  const [keyword, setKeyword] = useState('');
  const titleId = useId();

  if (!isOpen) return null;

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredTags = normalizedKeyword
    ? tags.filter((t) => t.name.toLowerCase().includes(normalizedKeyword))
    : tags;

  const handleSelect = (tagId: string | null) => {
    onSelectTag(tagId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop mờ nền */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-2xl transition-all animate-scaleUp">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-lh-line px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-lh-brand/10 text-lh-brand">
              <TagIcon className="size-4" />
            </div>
            <div>
              <h3 id={titleId} className="font-[family-name:var(--font-heading)] text-base font-bold text-lh-ink">
                Tất cả thẻ từ khóa ({tags.length})
              </h3>
              <p className="text-xs text-lh-muted">Chọn hoặc tìm thẻ để lọc nhanh các bài đọc liên quan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-lh-muted hover:bg-lh-surface-2 hover:text-lh-ink transition"
            aria-label="Đóng hộp thoại"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Ô tìm kiếm thẻ tức thì */}
        <div className="border-b border-lh-line/60 p-4 bg-lh-surface-2/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-lh-muted" />
            <input
              type="text"
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm thẻ (ví dụ: Hùng Vương, Bạch Đằng, Đình làng...)"
              className="h-10 w-full rounded-xl border border-lh-line bg-lh-surface pl-10 pr-9 text-sm text-lh-ink outline-none transition placeholder:text-lh-muted focus:border-lh-brand/60 focus:ring-2 focus:ring-lh-brand/10"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lh-muted hover:text-lh-ink"
                aria-label="Xóa từ khóa"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách thẻ dạng Grid có Scroll nội bộ (không bao giờ vỡ hay dài trang) */}
        <div className="max-h-80 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedTagId === null
                  ? 'bg-lh-brand text-white shadow-xs'
                  : 'bg-lh-surface-2 text-lh-muted hover:bg-lh-surface-2/80 hover:text-lh-ink'
              }`}
            >
              Tất cả thẻ
            </button>

            {filteredTags.map((tag) => {
              const isSelected = selectedTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelect(isSelected ? null : tag.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition ${
                    isSelected
                      ? 'bg-lh-brand text-white shadow-xs font-bold'
                      : 'border border-lh-line bg-lh-surface text-lh-ink/80 hover:border-lh-brand/40 hover:bg-lh-surface-2'
                  }`}
                >
                  <Hash className="size-3.5 opacity-60" />
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>

          {filteredTags.length === 0 && (
            <div className="py-8 text-center text-xs text-lh-muted">
              Không tìm thấy thẻ nào khớp với từ khóa &ldquo;{keyword}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between border-t border-lh-line bg-lh-surface-2/50 px-5 py-3">
          <span className="text-xs text-lh-muted">
            Hiển thị {filteredTags.length} / {tags.length} thẻ
          </span>
          {selectedTagId && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="text-xs font-semibold text-lh-brand hover:underline"
            >
              Đặt lại (Bỏ chọn thẻ)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
