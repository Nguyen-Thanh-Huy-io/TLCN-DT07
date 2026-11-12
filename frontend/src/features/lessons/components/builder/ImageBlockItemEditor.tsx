'use client';

import React, { useRef, useState } from 'react';
import { Upload, Link2, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { UploadApiService } from '@/services/entities/upload.service';
import { extractErrorMessage } from '@/services/api';
import type { ImageBlockData } from '../../types/block-builder.types';

interface ImageBlockItemEditorProps {
  data: ImageBlockData;
  onChange: (updates: Partial<ImageBlockData>) => void;
}

export function ImageBlockItemEditor({ data, onChange }: ImageBlockItemEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, JPEG).');
      return;
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá 10MB cho phép.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const res = await UploadApiService.uploadImage(file);
      if (res?.url) {
        onChange({
          src: res.url,
          alt: data.alt || file.name.replace(/\.[^/.]+$/, ''),
        });
      } else {
        setUploadError('Tải ảnh lên thất bại, vui lòng thử lại.');
      }
    } catch (err) {
      setUploadError(extractErrorMessage(err, 'Lỗi kết nối khi tải ảnh lên.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone & URL Input */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition disabled:opacity-50 shrink-0"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Đang tải lên...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-stone-600" />
              <span>Tải ảnh từ máy</span>
            </>
          )}
        </button>

        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={data.src || ''}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="Hoặc dán URL hình ảnh tư liệu trực tiếp..."
            className="w-full text-sm pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
          />
        </div>
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 font-medium">{uploadError}</p>
      )}

      {/* Preview Section */}
      {data.src ? (
        <div className="relative group border border-stone-200 rounded-xl overflow-hidden bg-stone-50 p-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.src}
            alt={data.alt || 'Ảnh bài học'}
            className="max-h-64 rounded-lg object-contain mx-auto shadow-xs"
          />
          <button
            type="button"
            onClick={() => onChange({ src: '', caption: '', alt: '' })}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition opacity-0 group-hover:opacity-100"
            title="Xóa ảnh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-200 hover:border-amber-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-stone-50/50 hover:bg-amber-50/20"
        >
          <ImageIcon className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <p className="text-sm text-stone-600 font-medium">
            Kéo thả hoặc bấm để chọn ảnh tư liệu tải lên
          </p>
          <p className="text-xs text-stone-400 mt-1">Hỗ trợ JPG, PNG, WEBP tối đa 10MB</p>
        </div>
      )}

      {/* Caption & Alt Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={data.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Nhập chú thích lịch sử (caption)..."
          className="w-full text-xs italic text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-stone-400"
        />
        <input
          type="text"
          value={data.alt || ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Văn bản thay thế (alt text cho SEO)..."
          className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-stone-400"
        />
      </div>
    </div>
  );
}
