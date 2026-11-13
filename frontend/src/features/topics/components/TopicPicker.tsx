'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { TopicApiService } from '@/services/entities/topic.service';
import type { TopicItem } from '@/types/models';

export interface PickedTopic {
  id: string;
  name: string;
  slug?: string;
}

/**
 * Ô chọn 1 Chủ đề / Thời kỳ lịch sử có tìm kiếm. Dùng cho TimelineEditor, ArticleEditor...
 */
export function TopicPicker({
  value,
  onChange,
  placeholder = 'Chọn chủ đề / thời kỳ lịch sử…',
}: {
  value: PickedTopic | null;
  onChange: (topic: PickedTopic | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await TopicApiService.getTopics({ search: query.trim() || undefined, limit: 10 });
        setResults(res.items || []);
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
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
        <span className="truncate font-medium">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          aria-label="Bỏ chọn chủ đề"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {loading && <div className="px-3 py-2 text-xs text-slate-400">Đang tìm…</div>}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">Không tìm thấy chủ đề nào.</div>
          )}
          {!loading &&
            results.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                onClick={() => {
                  onChange({ id: t.id, name: t.name });
                  setOpen(false);
                  setQuery('');
                }}
              >
                <span className="font-medium">{t.name}</span>
                {t.parent && <span className="text-xs text-slate-400">({t.parent.name})</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
