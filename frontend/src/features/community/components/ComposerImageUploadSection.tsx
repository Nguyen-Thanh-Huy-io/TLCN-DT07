'use client';

import React from 'react';
import Image from 'next/image';
import { ImagePlus } from 'lucide-react';

interface ComposerImageUploadSectionProps {
  imageUrl: string | null;
  onRemoveImage: () => void;
  imageCaption: string;
  onChangeImageCaption: (val: string) => void;
  isUploading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ComposerImageUploadSection({
  imageUrl,
  onRemoveImage,
  imageCaption,
  onChangeImageCaption,
  isUploading,
  onFileChange,
}: ComposerImageUploadSectionProps) {
  return (
    <div className="rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#14233F]">
          <ImagePlus size={15} className="text-[#8A5A19]" />
          <span>Ảnh tư liệu / Bản đồ đính kèm câu hỏi (tùy chọn)</span>
        </span>
        <label className="inline-flex h-8 cursor-pointer items-center rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[12px] font-medium text-[#14233F] hover:border-[#8A5A19]">
          <span>
            {isUploading ? 'Đang tải ảnh...' : imageUrl ? 'Đổi ảnh khác' : 'Chọn tệp ảnh'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={isUploading}
            className="sr-only"
          />
        </label>
      </div>

      {imageUrl ? (
        <div className="mt-3 space-y-2">
          <div className="relative overflow-hidden rounded-[6px] border border-[#E2D5B8] bg-[#FDF9F0]">
            <Image
              src={imageUrl}
              alt="Ảnh tư liệu đính kèm"
              width={600}
              height={200}
              unoptimized
              className="max-h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute right-2 top-2 rounded-[4px] bg-[#14233F] px-2 py-1 text-[11px] font-medium text-[#FAF5E6]"
            >
              Gỡ ảnh
            </button>
          </div>
          <input
            type="text"
            value={imageCaption}
            onChange={(e) => onChangeImageCaption(e.target.value)}
            placeholder="Ghi chú nguồn ảnh (ví dụ: Viện Viễn Đông Bác cổ - EFEO, 1925)"
            className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
          />
        </div>
      ) : null}
    </div>
  );
}
