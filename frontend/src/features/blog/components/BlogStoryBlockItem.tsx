'use client';

import React from 'react';
import { StoryBlock } from '../types/blog-create.types';
import { StoryBlockTypeEnum } from '@/constants/enums';
import { resolveBackendAssetUrl } from '@/constants/api-url';

interface BlogStoryBlockItemProps {
  block: StoryBlock;
  index: number;
  onUpdateBlock: (id: string, field: 'heading' | 'text' | 'caption', value: string) => void;
  onBlockImageChange: (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBlock: (id: string) => void;
}

export function BlogStoryBlockItem({
  block,
  index,
  onUpdateBlock,
  onBlockImageChange,
  onRemoveBlock,
}: BlogStoryBlockItemProps) {
  const isParagraph = block.type === StoryBlockTypeEnum.PARAGRAPH;

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Khối {index + 1} · {isParagraph ? 'Đoạn văn' : 'Hình ảnh'}
        </span>
        <button
          type="button"
          onClick={() => onRemoveBlock(block.id)}
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
        >
          Xóa
        </button>
      </div>

      {isParagraph ? (
        <div className="space-y-3">
          <input
            type="text"
            value={block.heading ?? ''}
            onChange={(event) => onUpdateBlock(block.id, 'heading', event.target.value)}
            placeholder="Tiêu đề nhỏ cho đoạn này"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
          />
          <textarea
            value={block.text ?? ''}
            onChange={(event) => onUpdateBlock(block.id, 'text', event.target.value)}
            rows={6}
            placeholder="Viết nội dung đoạn văn của bài: mô tả sự kiện, không gian, nhân vật hoặc cảm giác lịch sử..."
            className="w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-3 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {block.imageUrl ? (
            <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-page)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveBackendAssetUrl(block.imageUrl)}
                alt={block.caption || 'Hình ảnh bài viết'}
                className="h-40 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-page)] text-center text-[var(--text-muted)]">
              <div>
                <div className="text-2xl">📷</div>
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">Thêm ảnh cho khối này</p>
              </div>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(event) => onBlockImageChange(block.id, event)}
            className="block w-full text-sm text-[var(--text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bg-page)] file:px-3 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.18em] file:text-[var(--ink)]"
          />

          <input
            type="text"
            value={block.caption ?? ''}
            onChange={(event) => onUpdateBlock(block.id, 'caption', event.target.value)}
            placeholder="Chú thích ảnh hoặc nguồn tham khảo"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-center text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
          />
        </div>
      )}
    </div>
  );
}
