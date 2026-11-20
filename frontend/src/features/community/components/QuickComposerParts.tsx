'use client';

import React from 'react';
import Image from 'next/image';
import { ImagePlus, MessageSquarePlus, Share2, Tag, BookOpen, ExternalLink, Link2 } from 'lucide-react';
import { ComposerMode, KEYBOARD_KEYS } from '@/constants/enums';
import { type SharedBlogEmbed } from '../api';

export function resolvePostTitlesAndContent(
  mode: ComposerMode,
  title: string,
  content: string,
  selectedBlog: SharedBlogEmbed | null,
  customCardCaption: string,
) {
  const cleanTitle =
    title.trim() ||
    (selectedBlog ? `Chia sẻ bài chuyên khảo: ${selectedBlog.title}` : '');
  const cleanContent =
    content.trim() ||
    (selectedBlog
      ? customCardCaption.trim() ||
        `Mình chia sẻ lại bài viết "${selectedBlog.title}" từ HISGO Blog để mọi người cùng tham khảo và thảo luận.`
      : '');
  return { cleanTitle, cleanContent };
}

export function buildFilterBlogs(
  availableBlogs: SharedBlogEmbed[],
  blogSearchOrUrl: string,
  username?: string,
) {
  const q = blogSearchOrUrl.trim().toLowerCase();
  const slugFromUrl = q.includes('/blog/')
    ? q.split('/blog/')[1]?.split(/[?#]/)[0]?.replace(/\/+$/, '')
    : null;

  const sorted = [...availableBlogs].sort((a, b) => {
    const aMine = username && a.authorName?.toLowerCase() === username.toLowerCase() ? 1 : 0;
    const bMine = username && b.authorName?.toLowerCase() === username.toLowerCase() ? 1 : 0;
    return bMine - aMine;
  });

  if (!q) return sorted;
  return sorted.filter(
    (b) =>
      (slugFromUrl && b.slug.toLowerCase() === slugFromUrl) ||
      b.title.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.authorName || '').toLowerCase().includes(q),
  );
}

export function applyInitialBlogSelection(
  blogs: SharedBlogEmbed[],
  slug: string | null,
  currentTitle: string,
  setMode: (m: ComposerMode) => void,
  setSelectedBlog: (b: SharedBlogEmbed | null) => void,
  setCustomCardCaption: (c: string) => void,
  setTitle: (t: string) => void,
) {
  if (!slug) return;
  const found = blogs.find((b) => b.slug === slug);
  if (found) {
    setMode(ComposerMode.SHARE_BLOG);
    setSelectedBlog(found);
    setCustomCardCaption(found.excerpt || '');
    if (!currentTitle.trim()) {
      setTitle(`Chia sẻ bài viết: ${found.title}`);
    }
  }
}

// --- ComposerImageUploadSection.tsx ---
export interface ComposerImageUploadSectionProps {
  imageUrl: string | null;
  onRemoveImage: () => void;
  imageCaption: string;
  onChangeImageCaption: (val: string) => void;
  isUploading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ComposerImageUploadSection({
  imageUrl,
  onRemoveImage,
  imageCaption,
  onChangeImageCaption,
  isUploading,
  onFileChange,
}: ComposerImageUploadSectionProps) {
  return (
    <div className="rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#14233F]">
          <ImagePlus size={15} className="text-[#8A5A19]" />
          <span>Ảnh tư liệu / Bản đồ đính kèm câu hỏi (tùy chọn)</span>
        </span>
        <label className="inline-flex h-8 cursor-pointer items-center rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[12px] font-medium text-[#14233F] hover:border-[#8A5A19]">
          <span>
            {isUploading ? 'Đang tải ảnh...' : imageUrl ? 'Đổi ảnh khác' : 'Chọn tệp ảnh'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={isUploading}
            className="sr-only"
          />
        </label>
      </div>

      {imageUrl ? (
        <div className="mt-3 space-y-2">
          <div className="relative overflow-hidden rounded-[6px] border border-[#E2D5B8] bg-[#FDF9F0]">
            <Image
              src={imageUrl}
              alt="Ảnh tư liệu đính kèm"
              width={600}
              height={200}
              unoptimized
              className="max-h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute right-2 top-2 rounded-[4px] bg-[#14233F] px-2 py-1 text-[11px] font-medium text-[#FAF5E6]"
            >
              Gỡ ảnh
            </button>
          </div>
          <input
            type="text"
            value={imageCaption}
            onChange={(e) => onChangeImageCaption(e.target.value)}
            placeholder="Ghi chú nguồn ảnh (ví dụ: Viện Viễn Đông Bác cổ - EFEO, 1925)"
            className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
          />
        </div>
      ) : null}
    </div>
  );
}

// --- ComposerModeSwitcher.tsx ---
export interface ComposerModeSwitcherProps {
  mode: ComposerMode;
  onChangeMode: (mode: ComposerMode) => void;
}

export function ComposerModeSwitcher({ mode, onChangeMode }: ComposerModeSwitcherProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-1">
      <button
        type="button"
        onClick={() => onChangeMode(ComposerMode.QUESTION)}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-[6px] text-[13px] font-semibold transition-colors ${
          mode === ComposerMode.QUESTION
            ? 'bg-[#7A1F24] text-[#FAF5E6]'
            : 'text-[#5C4E3C] hover:text-[#14233F]'
        }`}
      >
        <MessageSquarePlus size={14} />
        <span>Đặt câu hỏi / Bài ngắn</span>
      </button>
      <button
        type="button"
        onClick={() => onChangeMode(ComposerMode.SHARE_BLOG)}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-[6px] text-[13px] font-semibold transition-colors ${
          mode === ComposerMode.SHARE_BLOG
            ? 'bg-[#7A1F24] text-[#FAF5E6]'
            : 'text-[#5C4E3C] hover:text-[#14233F]'
        }`}
      >
        <Share2 size={14} />
        <span>Chia sẻ bài từ Blog</span>
      </button>
    </div>
  );
}

// --- ComposerTagsSection.tsx ---
export interface ComposerTagsSectionProps {
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

// --- SharedBlogSelectorPane.tsx ---
export interface SharedBlogSelectorPaneProps {
  selectedBlog: SharedBlogEmbed | null;
  onSelectBlog: (blog: SharedBlogEmbed) => void;
  onClearBlog: () => void;
  loadingBlogs: boolean;
  blogSearchOrUrl: string;
  setBlogSearchOrUrl: (val: string) => void;
  customCardCaption: string;
  setCustomCardCaption: (val: string) => void;
  filteredBlogs: SharedBlogEmbed[];
}

export function SharedBlogSelectorPane({
  selectedBlog,
  onSelectBlog,
  onClearBlog,
  loadingBlogs,
  blogSearchOrUrl,
  setBlogSearchOrUrl,
  customCardCaption,
  setCustomCardCaption,
  filteredBlogs,
}: SharedBlogSelectorPaneProps) {
  return (
    <div className="space-y-3 rounded-[8px] border border-[#D8C8AA] bg-[#F2E8D5] p-4">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#14233F]">
          <Link2 size={15} className="text-[#7A1F24]" />
          <span>Chọn bài chuyên khảo trên HISGO Blog để chia sẻ</span>
        </label>
        {selectedBlog && (
          <button
            type="button"
            onClick={onClearBlog}
            className="text-[12px] font-semibold text-[#7A1F24] hover:underline"
          >
            Đổi bài Blog khác
          </button>
        )}
      </div>

      {!selectedBlog ? (
        <>
          <input
            type="text"
            value={blogSearchOrUrl}
            onChange={(e) => setBlogSearchOrUrl(e.target.value)}
            placeholder="Tìm theo tên bài Blog hoặc dán đường dẫn /blog/..."
            className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
          />

          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {loadingBlogs ? (
              <p className="py-4 text-center text-[13px] text-[#6E5D4B]">
                Đang tải danh sách bài viết từ Blog...
              </p>
            ) : filteredBlogs.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#6E5D4B]">
                Không tìm thấy bài Blog phù hợp.
              </p>
            ) : (
              filteredBlogs.map((blog) => (
                <button
                  key={blog.slug}
                  type="button"
                  onClick={() => onSelectBlog(blog)}
                  className="flex w-full items-center gap-3 rounded-[6px] border border-[#E2D5B8] bg-[#FDF9F0] p-2.5 text-left transition-colors hover:border-[#7A1F24]"
                >
                  {blog.coverImageUrl ? (
                    <Image
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      width={64}
                      height={48}
                      unoptimized
                      className="h-12 w-16 shrink-0 rounded-[4px] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[4px] bg-[#EADBC0] text-[#7A1F24]">
                      <BookOpen size={16} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#14233F]">
                      {blog.title}
                    </p>
                    <p className="truncate text-[12px] text-[#6E5D4B]">
                      Tác giả: {blog.authorName || 'HISGO Blog'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-[4px] bg-[#F2E5C9] px-2 py-1 text-[11px] font-semibold text-[#6B4E16]">
                    Chọn
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* Bản xem trước thẻ chia sẻ kiểu Facebook */
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[8px] border border-[#D4C5A6] bg-[#FAF5E6]">
            {selectedBlog.coverImageUrl ? (
              <Image
                src={selectedBlog.coverImageUrl}
                alt={selectedBlog.title}
                width={600}
                height={160}
                unoptimized
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-24 items-center justify-between bg-[#2C1E16] px-4 text-[#FAF5E6]">
                <span className="text-[12px] font-semibold uppercase tracking-wider">
                  HISGO BLOG · CHUYÊN KHẢO LỊCH SỬ
                </span>
                <ExternalLink size={16} />
              </div>
            )}
            <div className="p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A19]">
                HISGO.VN/BLOG · {selectedBlog.authorName || 'CHUYÊN KHẢO'}
              </p>
              <h4 className="mt-1 text-[15px] font-bold text-[#14233F]">
                {selectedBlog.title}
              </h4>
              <p className="mt-1 line-clamp-2 text-[12px] text-[#5C4E3C]">
                {customCardCaption || selectedBlog.excerpt || 'Nhấp để đọc toàn văn trên trang Blog.'}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#5C4E3C]">
              Lời chú thích nhỏ hiển thị trong thẻ bài Blog (tùy chỉnh nếu muốn)
            </label>
            <input
              type="text"
              maxLength={240}
              value={customCardCaption}
              onChange={(e) => setCustomCardCaption(e.target.value)}
              placeholder="Tóm tắt ngắn gọn hiển thị dưới tiêu đề thẻ Blog..."
              className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
