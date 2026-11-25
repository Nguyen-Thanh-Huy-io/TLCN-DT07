'use client';

import React, { useEffect, useState } from 'react';
import { Check, Search, Tag, X } from 'lucide-react';
import { TagApiService } from '@/services/entities/topic.service';
import type { TagItem } from '@/types/models';

export interface TagFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTag: TagItem | null;
  onSelect: (tag: TagItem | null) => void;
  defaultLimit?: number;
}

const LIMIT_OPTIONS = [20, 50, 100] as const;

/** Modal chọn 1 thẻ (Tag) có tìm kiếm server-side, phân trang và chọn số lượng hiển thị trên toàn bộ kho 11,000+ thẻ. */
export function TagFilterModal({
  isOpen,
  onClose,
  selectedTag,
  onSelect,
  defaultLimit = 20,
}: TagFilterModalProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(defaultLimit);
  const [items, setItems] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    void Promise.resolve().then(() => setPage(1));
  }, [search, limit]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      TagApiService.getTagsPaginated({ page, limit, search })
        .then((res) => {
          if (!active) return;
          setItems(res.items);
          setTotal(res.total);
        })
        .catch(() => {
          if (!active) return;
          setItems([]);
          setTotal(0);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, search, page, limit]);

  if (!isOpen) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chọn thẻ để lọc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[82vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag size={16} className="text-slate-600" />
              <span>Lọc theo Thẻ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tìm kiếm trực tiếp trên toàn bộ {total.toLocaleString('vi-VN')} thẻ trong kho
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Gõ tên thẻ cần lọc (vd. Trần Hưng Đạo, Bạch Đằng)..."
              className="w-full h-9 pl-8 pr-8 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Xóa từ khóa"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {selectedTag && (
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 transition flex items-center justify-between cursor-pointer"
            >
              <span>Bỏ lọc thẻ hiện tại (#{selectedTag.name})</span>
              <X size={13} />
            </button>
          )}

          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Đang tìm kiếm thẻ…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Không tìm thấy thẻ nào khớp với &quot;{search}&quot;.
            </div>
          ) : (
            items.map((tag) => {
              const isSelected = selectedTag?.id === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    onSelect(tag);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: tag.colorHex || '#94a3b8' }}
                    />
                    <span className="truncate">#{tag.name}</span>
                  </span>
                  {isSelected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <select
              aria-label="Số thẻ mỗi trang"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-7 rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-700 focus:outline-none"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
            <span>
              Trang {page}/{totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Trang trước"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Trang sau"
            >
              ›
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 h-7 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
