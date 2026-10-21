'use client';

import React from 'react';
import { LessonMediaManager } from '../LessonMediaManager';
import { LessonMediaItem } from '../../types/editor.types';

interface LessonMediaTabProps {
  thumbnailUrl: string;
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;
  disabled: boolean;
}

/** Tab "Media" trong Panel Thuộc tính: nhắc vị trí sửa Ảnh đại diện (ở đầu trang soạn
 * thảo, không đặt picker trùng lặp ở đây) + quản lý tư liệu/tài liệu đính kèm. */
export function LessonMediaTab({ thumbnailUrl, mediaList, onAddMedia, onRemoveMedia, disabled }: LessonMediaTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
      {thumbnailUrl ? (
        <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailUrl} alt="Ảnh bìa" className="w-12 h-9 object-cover rounded border border-slate-200 shrink-0" />
          <span className="text-[11px] text-slate-500 leading-snug">
            Ảnh bìa đã gắn — đổi ảnh ở khối <b className="text-slate-700">&quot;Ảnh đại diện&quot;</b> đầu trang soạn thảo.
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
          Chưa gắn ảnh bìa — thêm ở khối &quot;Ảnh đại diện&quot; đầu trang soạn thảo.
        </p>
      )}

      <div className="border-t border-slate-100 pt-3">
        <LessonMediaManager mediaList={mediaList} onAddMedia={onAddMedia} onRemoveMedia={onRemoveMedia} disabled={disabled} />
      </div>
    </div>
  );
}
