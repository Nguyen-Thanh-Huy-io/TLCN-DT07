'use client';

import React from 'react';
import { LessonMediaManager } from '../LessonMediaManager';
import { LessonMediaItem } from '../../types/editor.types';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';

interface LessonMediaTabProps {
  thumbnailUrl: string;
  onThumbnailChange?: (url: string) => void;
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;
  disabled: boolean;
}

/** Tab "Media" trong Panel Thuộc tính: quản lý Ảnh đại diện bài học và tài liệu/tư liệu đính kèm. */
export function LessonMediaTab({
  thumbnailUrl,
  onThumbnailChange,
  mediaList,
  onAddMedia,
  onRemoveMedia,
  disabled,
}: LessonMediaTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
      {/* Ảnh đại diện bài học (đặt ở sidebar thuộc tính, giữ canvas bài học thông thoáng) */}
      <div className="space-y-1.5">
        <TopicCoverImagePicker
          value={thumbnailUrl}
          onChange={(url) => onThumbnailChange?.(url)}
          disabled={disabled}
          title="Ảnh đại diện bài học"
          compact
        />
      </div>

      <div className="border-t border-slate-100 pt-3">
        <LessonMediaManager mediaList={mediaList} onAddMedia={onAddMedia} onRemoveMedia={onRemoveMedia} disabled={disabled} />
      </div>
    </div>
  );
}
