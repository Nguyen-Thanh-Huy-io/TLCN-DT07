'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ArticleApiService, type ArticleItem } from '@/services/entities/article.service';

export interface PickedArticle {
  id: string;
  title: string;
  slug?: string;
}

/**
 * Ô chọn 1 bài viết có tìm kiếm (gọi /articles?search=, debounce). Dùng cho mốc dòng thời gian
 * và các khối liên kết bài viết trong Block Builder.
 */
export function ArticlePicker({
  value,
  onChange,
  placeholder = 'Tìm bài viết để liên kết…',
}: {
  value: PickedArticle | null;
  onChange: (article: (PickedArticle & Partial<ArticleItem>) | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setResults((await ArticleApiService.list({ search: query.trim() || undefined, limit: 10, sort: 'title' })).items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{value.title}</span>
        <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-red-600" title="Bỏ liên kết">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Search size={14} className="text-slate-400" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full text-sm outline-none"
        />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-slate-500">Đang tìm…</li>}
          {!loading && results.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Không có bài viết phù hợp.</li>}
          {results.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ ...a });
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-800">{a.title}</span>
                <span className="text-xs text-slate-500">
                  {[a.category?.name, a.dateText || a.startYear, a.status !== 'PUBLISHED' ? 'chưa xuất bản' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
