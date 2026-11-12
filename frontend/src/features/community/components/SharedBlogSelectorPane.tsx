'use client';

import React from 'react';
import Image from 'next/image';
import { BookOpen, ExternalLink, Link2 } from 'lucide-react';
import { type SharedBlogEmbed } from '../api';

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
