'use client';

import React from 'react';
import { MessageSquarePlus, Share2 } from 'lucide-react';
import { ComposerMode } from '@/constants/enums';

interface ComposerModeSwitcherProps {
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
