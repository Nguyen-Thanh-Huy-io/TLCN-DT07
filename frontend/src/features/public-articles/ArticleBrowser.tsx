'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ArticleCard } from '@/components/hisgo/ArticleCard';
import type { PublicArticleSummary } from '@/services/public/public-content.service';

/** Bỏ dấu + chữ thường để tìm không phân biệt dấu ("tran hung dao" khớp "Trần Hưng Đạo"). */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Lưới bài viết có ô tìm kiếm + lọc theo tag (lọc phía client, danh sách đã sắp theo niên đại). */
export function ArticleBrowser({ articles, emptyText }: { articles: PublicArticleSummary[]; emptyText: string }) {
  const [query, setQuery] = useState('');
  const [tagId, setTagId] = useState<string | null>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    for (const a of articles) {
      for (const t of a.tags) {
        const entry = counts.get(t.id) ?? { id: t.id, name: t.name, count: 0 };
        entry.count += 1;
        counts.set(t.id, entry);
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [articles]);

  const visible = useMemo(() => {
    const q = normalizeSearch(query.trim());
    return articles.filter(
      (a) =>
        (!tagId || a.tags.some((t) => t.id === tagId)) &&
        (!q || normalizeSearch(`${a.title} ${a.summary ?? ''}`).includes(q)),
    );
  }, [articles, query, tagId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trong danh sách…"
            className="w-full rounded-full border border-stone-300 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-[#8C2D19]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              aria-label="Xoá từ khoá"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <span className="text-sm text-stone-500">{visible.length} bài viết</span>
      </div>

      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagId(null)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              tagId === null ? 'bg-[#8C2D19] text-white' : 'border border-stone-300 bg-white text-stone-700'
            }`}
          >
            Tất cả
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTagId(tagId === t.id ? null : t.id)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                tagId === t.id ? 'bg-[#8C2D19] text-white' : 'border border-stone-300 bg-white text-stone-700'
              }`}
            >
              {t.name} <span className="opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center text-stone-500">
          {articles.length === 0 ? emptyText : 'Không có bài viết khớp bộ lọc.'}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
