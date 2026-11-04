'use client';

import React from 'react';
import { TipTapContent } from '../TipTapContent';

interface TextBlockEditorProps {
  content: string;
  onChange: (val: string) => void;
}

/**
 * Khối soạn thảo Văn bản (Rich Text Block) trên Canvas:
 * Giao diện tối giản, tập trung 100% vào nội dung (Distraction-free).
 * Toàn bộ công cụ định dạng Typography được điều khiển từ Cột Phải (Property Inspector).
 */
export function TextBlockEditor({ content, onChange }: TextBlockEditorProps) {
  return (
    <div className="w-full relative group/text-block" data-testid="text-block-editor">
      <TipTapContent
        value={content}
        onChange={onChange}
        compact={true}
        remoteToolbarOnly={true}
        placeholder="Nhập nội dung lịch sử tại đây..."
      />
    </div>
  );
}
