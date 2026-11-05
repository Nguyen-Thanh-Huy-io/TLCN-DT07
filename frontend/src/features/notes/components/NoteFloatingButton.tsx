'use client';

import React from 'react';
import { Bookmark, Highlighter } from 'lucide-react';
import { useNoteFacade } from '../facades/useNoteFacade';

interface NoteFloatingButtonProps {
  facade: ReturnType<typeof useNoteFacade>;
}

export function NoteFloatingButton({ facade }: NoteFloatingButtonProps) {
  const { allNotesCount, selectedHighlight, openDrawer, isOpen } = facade;

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip gợi ý khi có đoạn bôi đen */}
      {selectedHighlight && (
        <button
          type="button"
          onClick={() => openDrawer(true)}
          className="px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs font-medium shadow-lg hover:bg-stone-800 transition-all flex items-center gap-1.5 animate-bounce cursor-pointer border border-white/20"
        >
          <Highlighter size={13} className="text-[#E5B869]" /> Tạo ghi chú từ đoạn chọn
        </button>
      )}

      {/* Nút bấm sổ ghi chú */}
      <button
        type="button"
        onClick={() => openDrawer(false)}
        className="group relative flex items-center gap-2 px-3.5 py-3 rounded-full bg-[#8B261E] text-white shadow-xl hover:bg-[#721F18] hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-white/30"
        title="Mở sổ ghi chú cá nhân"
      >
        <Bookmark size={18} className="transition-transform group-hover:rotate-6" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">Ghi chú</span>

        {allNotesCount > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#8B261E] font-bold text-[11px] flex items-center justify-center shadow-xs">
            {allNotesCount}
          </span>
        )}
      </button>
    </div>
  );
}
