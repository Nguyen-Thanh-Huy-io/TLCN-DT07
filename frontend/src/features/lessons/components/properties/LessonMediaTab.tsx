'use client';

import React from 'react';
import { LessonMediaManager } from '../LessonMediaManager';
import { LessonMediaItem } from '../../types/editor.types';

interface LessonMediaTabProps {
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;
  disabled: boolean;
}

/** Tab "Tài liệu đính kèm" trong Panel Thuộc tính: quản lý file PDF, tài liệu nghiên cứu và tư liệu tham khảo đính kèm bài học. */
export function LessonMediaTab({
  mediaList,
  onAddMedia,
  onRemoveMedia,
  disabled,
}: LessonMediaTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3 animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Tài liệu & Tệp đính kèm
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Tải lên tài liệu PDF, tư liệu lịch sử hoặc file tham khảo cho học sinh.
          </p>
        </div>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          {mediaList.length} tệp
        </span>
      </div>

      <LessonMediaManager
        mediaList={mediaList}
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
        disabled={disabled}
      />
    </div>
  );
}
