'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, Tag as TagIcon, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export interface BlogPostCardItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
  accent: string;
  featured: boolean;
  tags: string[];
}

interface BlogBrowserProps {
  posts: BlogPostCardItem[];
}

/**
 * Chuẩn hóa chuỗi tiếng Việt không phân biệt hoa thường và dấu
 * (ví dụ: "dien bien phu" khớp "Điện Biên Phủ")
 */
function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const INITIAL_TAG_LIMIT = 8;

export function BlogBrowser({ posts }: BlogBrowserProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  // Tổng hợp danh sách các tag duy nhất kèm số lượng bài viết tương ứng
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        const trimmed = tag.trim();
        if (trimmed) {
          tagCounts.set(trimmed, (tagCounts.get(trimmed) ?? 0) + 1);
        }
      }
    }

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Danh sách tags hiển thị (giới hạn Top 8 trừ khi người dùng nhấn xem thêm)
  const visibleTags = useMemo(() => {
    if (isTagsExpanded || availableTags.length <= INITIAL_TAG_LIMIT) {
      return availableTags;
    }

    const topSlice = availableTags.slice(0, INITIAL_TAG_LIMIT);

    // Nếu người dùng đang chọn 1 tag nằm ngoài top 8, vẫn hiển thị tag đó
    if (
      selectedTag &&
      !topSlice.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase())
    ) {
      const activeTag = availableTags.find(
        (t) => t.name.toLowerCase() === selectedTag.toLowerCase(),
      );
      if (activeTag) {
        return [...topSlice, activeTag];
      }
    }

    return topSlice;
  }, [availableTags, isTagsExpanded, selectedTag]);

  // Lọc bài viết theo từ khóa và thẻ tag
  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());

    return posts.filter((post) => {
      const matchesTag = !selectedTag || post.tags.some(
        (t) => t.toLowerCase() === selectedTag.toLowerCase(),
      );

      const postSearchContent = `${post.title} ${post.excerpt} ${post.author}`;
      const matchesQuery =
        !normalizedQuery ||
        normalizeSearch(postSearchContent).includes(normalizedQuery);

      return matchesTag && matchesQuery;
    });
  }, [posts, query, selectedTag]);

  const isFiltering = query.trim().length > 0 || selectedTag !== null;

  const handleResetFilters = () => {
    setQuery('');
    setSelectedTag(null);
  };

  return (
    <section className="space-y-6">
      {/* Tiêu đề & Ô tìm kiếm */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a4d2d]">
            Bài mới nhất
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-heading)] text-3xl text-[#1f2a2b] md:text-4xl">
            Câu chuyện đang được đọc
          </h2>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full md:w-80">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d5d3d]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên bài viết, tóm tắt..."
            className="w-full rounded-full border border-[#d7c7b2] bg-[#fffdf9] py-2.5 pl-10 pr-10 text-sm text-[#1f2a2b] placeholder-[#8a7a6c] outline-none transition focus:border-[#8a4d2d] focus:ring-1 focus:ring-[#8a4d2d]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7a6c] transition hover:text-[#1f2a2b]"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Thanh lọc thẻ Tag (Chips / Pills) */}
      {availableTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-[#7d5d3d]">
            <TagIcon size={14} />
            <span>Chủ đề:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition ${
              selectedTag === null
                ? 'bg-[#1f2a2b] text-[#f7f1e7] shadow-sm'
                : 'border border-[#d7c7b2] bg-[#fffdf9] text-[#536560] hover:border-[#8a4d2d] hover:text-[#1f2a2b]'
            }`}
          >
            Tất cả
          </button>

          {visibleTags.map((tag) => {
            const isSelected = selectedTag?.toLowerCase() === tag.name.toLowerCase();
            return (
              <button
                key={tag.name}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag.name)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition ${
                  isSelected
                    ? 'bg-[#8a4d2d] text-white shadow-sm'
                    : 'border border-[#d7c7b2] bg-[#fffdf9] text-[#536560] hover:border-[#8a4d2d] hover:text-[#1f2a2b]'
                }`}
              >
                <span>#{tag.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#efe3d8] text-[#7d5d3d]'
                  }`}
                >
                  {tag.count}
                </span>
              </button>
            );
          })}

          {availableTags.length > INITIAL_TAG_LIMIT ? (
            <button
              type="button"
              onClick={() => setIsTagsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#d7c7b2] bg-[#fffdf9] px-3 py-1 text-xs font-semibold text-[#8a4d2d] transition hover:border-[#8a4d2d] hover:bg-[#efe3d8]/40"
            >
              {isTagsExpanded ? (
                <>
                  <ChevronUp size={13} />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <ChevronDown size={13} />
                  <span>+{availableTags.length - INITIAL_TAG_LIMIT} chủ đề khác</span>
                </>
              )}
            </button>
          ) : null}

          {isFiltering ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#8a4d2d] hover:underline"
            >
              <RotateCcw size={12} />
              <span>Đặt lại bộ lọc</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Thông tin số lượng bài viết khi có tìm kiếm / lọc */}
      {isFiltering ? (
        <div className="flex items-center justify-between text-xs text-[#536560]">
          <p>
            Tìm thấy{' '}
            <strong className="font-semibold text-[#1f2a2b]">
              {filteredPosts.length}
            </strong>{' '}
            bài viết{' '}
            {selectedTag ? (
              <span>
                với thẻ <span className="font-semibold text-[#8a4d2d]">#{selectedTag}</span>
              </span>
            ) : null}
            {query.trim() ? (
              <span>
                {' '}cho từ khóa &ldquo;<span className="font-semibold text-[#1f2a2b]">{query.trim()}</span>&rdquo;
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      {/* Kết quả danh sách bài viết */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d7c7b2] bg-[#fffdf9]/80 p-12 text-center shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8a4d2d]">
            Không tìm thấy
          </p>
          <h3 className="mb-3 font-[family-name:var(--font-heading)] text-2xl text-[#1f2a2b]">
            Không có bài viết nào phù hợp
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-[#536560]">
            Không tìm thấy bài viết nào khớp với điều kiện tìm kiếm hoặc thẻ tag hiện tại. Bạn vui lòng thử lại với từ khóa khác.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-full bg-[#1f2a2b] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f1e7] transition hover:bg-[#8a4d2d]"
          >
            <RotateCcw size={14} />
            <span>Xóa bộ lọc & Xem tất cả</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="overflow-hidden rounded-[24px] border border-[#d7c7b2] bg-[#fffdf9] shadow-[0_16px_30px_rgba(31,42,43,0.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(31,42,43,0.08)]"
            >
              <Link href={`/blog/${post.slug}`} className="relative block h-56 overflow-hidden">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${post.accent}`} />
                )}
                {post.tags.length > 0 ? (
                  <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                    #{post.tags[0]}
                  </span>
                ) : null}
              </Link>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d5d3d]">
                  <span>{post.category}</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="mb-3 font-[family-name:var(--font-heading)] text-2xl leading-tight text-[#1f2a2b] transition hover:text-[#8a4d2d]">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="mb-4 text-sm leading-7 text-[#536560] line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-[#efe3d8] pt-3">
                  <Link
                    href={`/blog?author=${encodeURIComponent(post.author)}`}
                    className="text-xs uppercase tracking-[0.12em] text-[#536560] transition hover:text-[#8a4d2d] hover:underline"
                  >
                    {post.author}
                  </Link>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-semibold text-[#8a4d2d] hover:underline"
                  >
                    Đọc bài →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
