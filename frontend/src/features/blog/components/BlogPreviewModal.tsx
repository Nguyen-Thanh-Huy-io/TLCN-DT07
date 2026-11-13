'use client';

import React from 'react';
import { StoryBlock, ReferenceItem } from '../types/blog-create.types';
import { StoryBlockTypeEnum } from '@/constants/enums';
import { resolveBackendAssetUrl } from '@/constants/api-url';

interface BlogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverImageUrl?: string;
  title: string;
  excerpt: string;
  tags: string[];
  blocks: StoryBlock[];
  references: ReferenceItem[];
}

const renderParagraphs = (value: string) =>
  value
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

export function BlogPreviewModal({
  isOpen,
  onClose,
  coverImageUrl,
  title,
  excerpt,
  tags,
  blocks,
  references,
}: BlogPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(18,17,15,0.62)] px-4 py-8 backdrop-blur-[2px]">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-page)] shadow-[0_24px_60px_rgba(20,35,63,0.18)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Xem trước bài viết</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5 md:p-8">
          <article className="space-y-8">
            {coverImageUrl ? (
              <div className="overflow-hidden rounded-[20px] border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveBackendAssetUrl(coverImageUrl)}
                  alt={title || 'Ảnh bìa'}
                  className="h-64 w-full object-cover md:h-80"
                />
              </div>
            ) : null}

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                  >
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            ) : null}

            <h2 className="mt-1 max-w-3xl font-[family-name:var(--font-heading)] text-[2.2rem] font-black leading-[0.95] tracking-[-0.04em] text-[var(--ink)] md:text-[3.2rem]">
              {title || 'Tiêu đề bài viết'}
            </h2>

            {renderParagraphs(excerpt || 'Tóm tắt ngắn sẽ hiển thị ở đây.').map((paragraph, index) => (
              <p
                key={`excerpt-${index}`}
                className="mt-2 text-[1.05rem] leading-[1.9] text-[var(--text-body)] md:text-[1.12rem]"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {paragraph}
              </p>
            ))}

            <div className="space-y-8 text-[1.06rem] leading-[1.9] text-[var(--text-body)] md:text-[1.15rem]">
              {blocks.length > 0 ? (
                blocks.map((block) =>
                  block.type === StoryBlockTypeEnum.PARAGRAPH ? (
                    <div key={block.id} className="space-y-4">
                      {block.heading ? (
                        <h3 className="mt-2 font-[family-name:var(--font-heading)] text-[1.8rem] font-black leading-[1.08] tracking-[-0.03em] text-[var(--ink)] md:text-[2.2rem]">
                          {block.heading}
                        </h3>
                      ) : null}
                      <div className="space-y-4">
                        {renderParagraphs(block.text || 'Đoạn văn sẽ xuất hiện ở đây.').map((paragraph, index) => (
                          <p
                            key={`${block.id}-paragraph-${index}`}
                            className="leading-[1.9] tracking-[-0.01em]"
                            style={{ whiteSpace: 'pre-wrap' }}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <figure key={block.id} className="space-y-2 text-center">
                      {block.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={resolveBackendAssetUrl(block.imageUrl)}
                          alt={block.caption || 'Hình ảnh trong bài viết'}
                          className="mx-auto h-56 w-full rounded-[20px] object-cover md:h-72"
                        />
                      ) : null}
                      {block.caption ? (
                        <figcaption className="text-center text-sm italic text-[var(--text-muted)]">
                          {block.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  )
                )
              ) : (
                <p>Chưa có nội dung để xem trước.</p>
              )}
            </div>

            {references.some((reference) => reference.title || reference.source || reference.url) ? (
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Tài liệu tham khảo</p>
                <ul className="space-y-2 text-[0.95rem] leading-7 text-[var(--text-body)]">
                  {references
                    .filter((reference) => reference.title || reference.source || reference.url)
                    .map((reference, index) => (
                      <li key={`${reference.id || index}`} className="list-disc pl-5">
                        {reference.url ? (
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--ink)] underline-offset-2 hover:underline"
                          >
                            {reference.title || 'Nguồn tham khảo'}
                          </a>
                        ) : (
                          <span>{reference.title || 'Nguồn tham khảo'}</span>
                        )}
                        {reference.source ? (
                          <span className="text-[var(--text-muted)]"> — {reference.source}</span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </div>
  );
}
