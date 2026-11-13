'use client';

import React from 'react';
import { StoryBlock, ReferenceItem } from '../utils/blog-metadata.util';
import { StoryBlockTypeEnum } from '@/constants/enums';
import { resolveBackendAssetUrl } from '@/constants/api-url';

// === BlogStoryBlockItem.tsx ===
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

// === BlogHistoricalMetaModal.tsx ===
interface BlogHistoricalMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  setPeriod: (val: string) => void;
  events: string;
  setEvents: (val: string) => void;
  characters: string;
  setCharacters: (val: string) => void;
  locations: string;
  setLocations: (val: string) => void;
  entities: string;
  setEntities: (val: string) => void;
  historicalContext: string;
  setHistoricalContext: (val: string) => void;
}

export function BlogHistoricalMetaModal({
  isOpen,
  onClose,
  period,
  setPeriod,
  events,
  setEvents,
  characters,
  setCharacters,
  locations,
  setLocations,
  entities,
  setEntities,
  historicalContext,
  setHistoricalContext,
}: BlogHistoricalMetaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,17,15,0.48)] px-4 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--bg-page)] p-5 shadow-[0_25px_60px_rgba(20,35,63,0.18)] md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Thông tin lịch sử</p>
            <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl text-[var(--ink)]">Tùy chọn bổ sung</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label htmlFor="period" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Thời kỳ
            </label>
            <input
              id="period"
              type="text"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="Ví dụ: Đế quốc La Mã, Nhà Trần"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="events" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Sự kiện liên quan
            </label>
            <input
              id="events"
              type="text"
              value={events}
              onChange={(event) => setEvents(event.target.value)}
              placeholder="Các sự kiện, cách nhau bằng dấu phẩy"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="characters" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Nhân vật / đối tượng
            </label>
            <input
              id="characters"
              type="text"
              value={characters}
              onChange={(event) => setCharacters(event.target.value)}
              placeholder="Ví dụ: Trần Hưng Đạo, người dân, chiến sĩ"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="locations" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Địa danh
            </label>
            <input
              id="locations"
              type="text"
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              placeholder="Ví dụ: Thăng Long, Bạch Đằng"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="entities" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Thực thể liên quan
            </label>
            <input
              id="entities"
              type="text"
              value={entities}
              onChange={(event) => setEntities(event.target.value)}
              placeholder="Ví dụ: triều đại, di tích, thành phố"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="historical-context" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Bối cảnh lịch sử
            </label>
            <textarea
              id="historical-context"
              value={historicalContext}
              onChange={(event) => setHistoricalContext(event.target.value)}
              rows={4}
              placeholder="Mô tả ngắn bối cảnh chính trị, văn hóa, đời sống."
              className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// === BlogPreviewModal.tsx ===
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
