'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { KEYBOARD_KEYS } from '@/constants/keyboard.constant';

interface ComposerTagsSectionProps {
  tagInput: string;
  onChangeTagInput: (val: string) => void;
  onAddTag: () => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
}

export function ComposerTagsSection({
  tagInput,
  onChangeTagInput,
  onAddTag,
  tags,
  onRemoveTag,
}: ComposerTagsSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor="qc-tags" className="mb-2 block text-[14px] font-medium text-[#14233F]">
          Thẻ chủ đề (nhấn Enter để thêm)
        </label>
        <div className="flex gap-2">
          <input
            id="qc-tags"
            type="text"
            value={tagInput}
            onChange={(e) => onChangeTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KEYBOARD_KEYS.ENTER) {
                e.preventDefault();
                onAddTag();
              }
            }}
            placeholder="Khảo cổ, Bia đá, Nhà Trần..."
            className="h-10 flex-1 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="inline-flex h-10 items-center gap-1 rounded-[6px] border border-[#D4C5A6] bg-[#F2E8D5] px-3 text-[13px] font-medium text-[#14233F] hover:border-[#8A5A19]"
          >
            <Tag size={13} />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-6 items-center gap-1.5 rounded-[4px] border border-[#E2D5B8] bg-[#F2E8D5] px-2 text-[12px] font-medium text-[#14233F]"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                aria-label={`Xóa thẻ ${tag}`}
                className="text-[#7A6B57] hover:text-[#7A1F24]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
