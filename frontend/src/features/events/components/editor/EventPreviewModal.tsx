'use client';

import React from 'react';
import { MediaType } from '@/constants/enums';
import type { LessonMediaItem } from '@/features/lessons/types/editor.types';

export interface EventPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  thumbnailUrl?: string;
  eventDateNote?: string;
  locationLabel?: string;
  summary?: string;
  description?: string;
  sourceReferenceNote?: string;
  mediaList?: LessonMediaItem[];
}

export function EventPreviewModal({
  isOpen,
  onClose,
  title,
  thumbnailUrl,
  eventDateNote,
  locationLabel,
  summary,
  description,
  sourceReferenceNote,
  mediaList = [],
}: EventPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase text-amber-700 font-bold">
              Xem trước thẻ Sự kiện trên Timeline & Thư viện
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {title || 'Chưa nhập tên sự kiện'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition"
          >
            Đóng
          </button>
        </div>

        {thumbnailUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-56">
            <img
              src={thumbnailUrl}
              alt={title || 'Ảnh tư liệu sự kiện'}
              className="w-full h-52 object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
          <span className="font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded">
            {eventDateNote || 'Chưa nhập thời gian'}
          </span>
          {locationLabel && <span>• 📍 {locationLabel}</span>}
        </div>

        {summary && (
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            <b className="block text-slate-900 mb-1">Tóm tắt ngắn:</b>
            <p>{summary}</p>
          </div>
        )}

        {description && (
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <b className="block text-slate-900 mb-1.5">Nội dung chi tiết:</b>
            <div
              className="prose prose-xs max-w-none text-slate-700 space-y-1.5"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        )}

        {sourceReferenceNote && (
          <div className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-2">
            Nguồn sử liệu: {sourceReferenceNote}
          </div>
        )}

        {mediaList.length > 0 && (
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <b className="block text-xs text-slate-900">
              Tư liệu đính kèm ({mediaList.length}):
            </b>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {mediaList.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <span className="truncate text-slate-700 font-medium">
                    {m.type === MediaType.VIDEO
                      ? '🎥 Video'
                      : m.type === MediaType.DOCUMENT
                      ? '📄 Tài liệu'
                      : '🖼 Ảnh'}
                    : {m.caption || m.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
