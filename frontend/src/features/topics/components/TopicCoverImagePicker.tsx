'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { UploadApiService } from '@/services/entities/upload.service';
import { extractErrorMessage } from '@/services/api';

/**
 * Các chế độ chọn ảnh bìa (Strategy Tabs)
 * Không dùng magic string để đảm bảo OCP và Type-safe
 */
export enum CoverImageTab {
  UPLOAD = 'UPLOAD',
  URL = 'URL',
}

export const MAX_COVER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * Chuẩn hóa URL ảnh bìa:
 * Tự động đồng bộ sang port của NEXT_PUBLIC_API_URL (5001) nếu URL được tạo từ cấu hình cũ (5000)
 */
export function resolveCoverImageUrl(url: string): string {
  if (!url) return '';
  const currentApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  if (url.startsWith('http://localhost:5000/uploads/')) {
    return url.replace('http://localhost:5000', currentApiUrl);
  }
  return url;
}

export interface TopicCoverImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  title?: string;
  compact?: boolean;
}

export function TopicCoverImagePicker({
  value,
  onChange,
  disabled = false,
  title = 'Ảnh bìa chủ đề',
  compact = false,
}: TopicCoverImagePickerProps) {
  const [activeTab, setActiveTab] = useState<CoverImageTab>(CoverImageTab.UPLOAD);
  const [isUploading, setIsUploading] = useState(false);
  const [inputUrl, setInputUrl] = useState(value || '');
  const [isReplacing, setIsReplacing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedValue = resolveCoverImageUrl(value || '');

  // Tự động sửa URL nếu URL ban đầu trỏ sai port
  useEffect(() => {
    if (value && value !== resolvedValue) {
      onChange(resolvedValue);
    }
  }, [value, resolvedValue, onChange]);

  // Reset trạng thái lỗi khi đường dẫn ảnh thay đổi
  useEffect(() => {
    setImgError(false);
  }, [resolvedValue]);

  // Đồng bộ inputUrl khi prop value thay đổi từ ngoài
  useEffect(() => {
    setInputUrl(resolvedValue);
  }, [resolvedValue]);

  // Xử lý xác thực và upload file
  const handleProcessFile = async (file: File) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      alert('Định dạng ảnh không hỗ trợ. Vui lòng chọn file PNG, JPG, WEBP hoặc GIF.');
      return;
    }

    if (file.size > MAX_COVER_IMAGE_SIZE_BYTES) {
      alert('Kích thước ảnh vượt quá giới hạn 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await UploadApiService.uploadImage(file);
      if (res?.url) {
        onChange(res.url);
        setIsReplacing(false);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert(extractErrorMessage(err, 'Không thể tải ảnh bìa lên hệ thống.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Kéo thả file
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Xác nhận liên kết URL
  const handleApplyUrl = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      alert('Vui lòng nhập đường dẫn URL ảnh.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      alert('Đường dẫn URL ảnh phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    onChange(trimmed);
    setIsReplacing(false);
  };

  const handleClearImage = () => {
    onChange('');
    setInputUrl('');
    setIsReplacing(false);
  };

  const hasImage = Boolean(value?.trim());

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-xs ${compact ? 'p-3' : 'p-5'}`}>
      {/* Tiêu đề & Nút thao tác nhanh */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-1.5">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {title} <span className="text-slate-400 font-normal lowercase">(tùy chọn)</span>
        </h3>
        {hasImage && !isReplacing && (
          <button
            type="button"
            onClick={handleClearImage}
            disabled={disabled}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-medium transition cursor-pointer"
          >
            Xóa ảnh
          </button>
        )}
        {hasImage && isReplacing && (
          <button
            type="button"
            onClick={() => setIsReplacing(false)}
            className="text-[11px] text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            Hủy thay đổi
          </button>
        )}
      </div>

      {/* Trường hợp 1: Đã có ảnh và không ở chế độ thay đổi ảnh */}
      {hasImage && !isReplacing ? (
        <div className="space-y-3">
          {imgError ? (
            <div className="w-full h-36 flex flex-col items-center justify-center bg-slate-50 border border-amber-200/80 rounded-lg p-3 text-center">
              <svg className="w-6 h-6 text-amber-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-xs font-semibold text-slate-700">Không thể tải hiển thị ảnh</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Liên kết ảnh không phản hồi hoặc đã bị xóa</span>
              <button
                type="button"
                onClick={() => setIsReplacing(true)}
                disabled={disabled}
                className="mt-2 text-[11px] font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                Chọn lại ảnh khác
              </button>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 group bg-slate-100 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedValue}
                alt="Ảnh bìa chủ đề"
                onError={() => setImgError(true)}
                className="w-full h-36 object-cover transition duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplacing(true)}
                  disabled={disabled}
                  className="text-xs font-medium bg-white text-slate-800 px-3 py-1.5 rounded-lg shadow-md hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Icon name={IconName.EDIT} size={13} />
                  <span>Đổi ảnh khác</span>
                </button>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-400 truncate" title={resolvedValue}>
            Nguồn: {resolvedValue}
          </p>
        </div>
      ) : (
        /* Trường hợp 2: Chưa có ảnh hoặc đang bấm "Đổi ảnh khác" */
        <div className="space-y-3">
          {/* Segmented Control Tabs */}
          <div className="flex p-0.5 bg-slate-100/90 border border-slate-200/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab(CoverImageTab.UPLOAD)}
              disabled={disabled || isUploading}
              className={`flex-1 py-1.5 rounded-md font-medium transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === CoverImageTab.UPLOAD
                  ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Tải file lên</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(CoverImageTab.URL)}
              disabled={disabled || isUploading}
              className={`flex-1 py-1.5 rounded-md font-medium transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === CoverImageTab.URL
                  ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Dán liên kết URL</span>
            </button>
          </div>

          {/* Tab 1 Content: Tải file từ thiết bị */}
          {activeTab === CoverImageTab.UPLOAD && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-5 cursor-pointer transition text-center group ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center mb-2 transition">
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>

                <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                  {isUploading ? 'Đang tải ảnh lên...' : 'Nhấp để chọn hoặc kéo thả ảnh vào đây'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Hỗ trợ PNG, JPG, WEBP, GIF (tối đa 5MB)
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={disabled || isUploading}
                />
              </div>
            </div>
          )}

          {/* Tab 2 Content: Dán liên kết URL */}
          {activeTab === CoverImageTab.URL && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                  placeholder="https://example.com/cover-image.jpg"
                  disabled={disabled}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-400 transition"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={disabled || !inputUrl.trim()}
                  className="text-xs font-semibold px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition shrink-0 cursor-pointer shadow-2xs"
                >
                  Áp dụng
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Nhập đường dẫn trực tiếp tới hình ảnh (bắt đầu bằng http:// hoặc https://)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
