'use client';

import React, { useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { LessonBlockType } from '../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../strategies/lesson-block-insert.strategy';

interface TipTapPlusDropdownProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onUploadClick: () => void;
  onAddImageUrl: () => void;
  onAddYoutube: () => void;
  onSetLink: () => void;
  uploading: boolean;
}

export function TipTapPlusDropdown({
  editor,
  isOpen,
  onClose,
  onToggle,
  onUploadClick,
  onAddImageUrl,
  onAddYoutube,
  onSetLink,
  uploading,
}: TipTapPlusDropdownProps) {
  const plusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const insertSpecialBlock = (blockType: LessonBlockType) => {
    onClose();
    editor.chain().focus().insertContent(lessonBlockInsertStrategy.generateSnippet(blockType)).run();
  };

  return (
    <div className="relative inline-block text-left" ref={plusMenuRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-7 h-7 rounded-md font-bold text-sm flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
        }`}
        title="Chèn nội dung & công cụ nâng cao"
      >
        +
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Phương tiện & Đa phương tiện
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              onClose();
              onUploadClick();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-slate-400">🖼</span>
            <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddImageUrl();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-slate-400">🔗</span>
            <span>Chèn ảnh từ URL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddYoutube();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-rose-500">▶</span>
            <span>Nhúng video YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSetLink();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-blue-500">📎</span>
            <span>Gắn liên kết tham khảo</span>
          </button>

          <div className="my-1 border-t border-slate-100" />
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Chèn khối nội dung
          </div>

          <button
            type="button"
            onClick={() => insertSpecialBlock(LessonBlockType.CHARACTER)}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-700 hover:text-purple-800 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-purple-600">👤</span>
            <span>Khối Nhân vật</span>
          </button>

          <button
            type="button"
            onClick={() => insertSpecialBlock(LessonBlockType.EVENT)}
            className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-slate-700 hover:text-amber-800 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-amber-600">🏛</span>
            <span>Khối Sự kiện</span>
          </button>

          <button
            type="button"
            onClick={() => insertSpecialBlock(LessonBlockType.TIMELINE)}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-blue-600">⏱</span>
            <span>Khối Dòng thời gian</span>
          </button>
        </div>
      )}
    </div>
  );
}
