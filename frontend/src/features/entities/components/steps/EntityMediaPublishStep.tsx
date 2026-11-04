'use client';

import { LessonMediaManager } from '@/features/lessons/components/LessonMediaManager';
import { LessonMediaItem } from '@/features/lessons/types/editor.types';

export interface EntityMediaPublishStepProps {
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;

  isFeatured: boolean;
  onIsFeaturedChange: (v: boolean) => void;
  displayOrder: number;
  onDisplayOrderChange: (v: number) => void;
  metadataJsonText: string;
  onMetadataJsonTextChange: (v: string) => void;
}

/** Bước 4 — Tư liệu & Xuất bản: kho ảnh/tài liệu, cờ nổi bật/thứ tự, metadata JSON mở rộng. */
export function EntityMediaPublishStep({
  mediaList,
  onAddMedia,
  onRemoveMedia,
  isFeatured,
  onIsFeaturedChange,
  displayOrder,
  onDisplayOrderChange,
  metadataJsonText,
  onMetadataJsonTextChange,
}: EntityMediaPublishStepProps) {
  return (
    <div className="space-y-5">
      {/* Tái sử dụng LessonMediaManager */}
      <LessonMediaManager
        mediaList={mediaList}
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
      />

      {/* Cài đặt hiển thị & Metadata mở rộng */}
      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          Cài đặt hiển thị & Phân loại mở rộng
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => onIsFeaturedChange(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
            />
            <span>Đánh dấu nổi bật (Hiển thị tại Landing Page)</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Thứ tự hiển thị:</span>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => onDisplayOrderChange(Number(e.target.value) || 0)}
              className="w-20 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">
            Dữ liệu mở rộng dạng JSON (Metadata: quê quán, kinh đô, bảo tàng lưu giữ...)
          </label>
          <textarea
            rows={3}
            value={metadataJsonText}
            onChange={(e) => onMetadataJsonTextChange(e.target.value)}
            className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
