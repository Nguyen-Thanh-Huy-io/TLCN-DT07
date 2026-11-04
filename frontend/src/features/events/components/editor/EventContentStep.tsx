'use client';

import React from 'react';
import {
  ContentBlockEditor,
  type ContentSkeleton,
} from '@/features/entities/components/ContentBlockEditor';

export const EVENT_CONTENT_SKELETONS: ContentSkeleton[] = [
  {
    label: '+ Chèn sườn bài Sự kiện Lịch sử',
    html: [
      '<h2>1. Bối cảnh & Nguyên nhân lịch sử</h2><p></p>',
      '<h2>2. Diễn biến chi tiết & Các giai đoạn</h2><p></p>',
      '<h2>3. Kết quả & Tác động chiến lược</h2><p></p>',
      '<h2>4. Ý nghĩa lịch sử & Bài học kinh nghiệm</h2><p></p>',
    ].join(''),
  },
];

export interface EventContentStepProps {
  title?: string;
  eventDateNote?: string;
  contentBlocks: unknown;
  onContentBlocksChange: (blocks: unknown) => void;
  onPublish?: () => void;
}

export function EventContentStep({
  title,
  eventDateNote,
  contentBlocks,
  onContentBlocksChange,
  onPublish,
}: EventContentStepProps) {
  return (
    <ContentBlockEditor
      value={contentBlocks}
      onChange={onContentBlocksChange}
      skeletons={EVENT_CONTENT_SKELETONS}
      documentTitle={title?.trim() || 'Chưa đặt tên sự kiện'}
      documentSubtitle={eventDateNote || 'Sự kiện lịch sử chi tiết'}
      entityCategory="SỰ KIỆN LỊCH SỬ"
      onPublish={onPublish}
    />
  );
}
