'use client';
import React, { useState, useRef } from 'react';
import { LessonMediaItem } from '../types/editor.types';
import { MediaType } from '@/constants/enums';
import { UploadApiService } from '@/services/entities/upload.service';
import { extractErrorMessage } from '@/services/api';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface LessonMediaManagerProps {
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;
  disabled?: boolean;
}

export function LessonMediaManager({
  mediaList,
  onAddMedia,
  onRemoveMedia,
  disabled = false,
}: LessonMediaManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<MediaType | null>(null);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Upload hình ảnh từ máy
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadType(MediaType.IMAGE);
      const res = await UploadApiService.uploadImage(file);
      const caption = window.prompt('Nhập chú thích lịch sử cho ảnh vừa tải:', file.name);

      onAddMedia({
        type: MediaType.IMAGE,
        url: res.url,
        caption: caption || file.name,
        displayOrder: mediaList.length + 1,
      });
    } catch (err) {
      console.error('Upload image failed:', err);
      alert(extractErrorMessage(err, 'Không thể tải ảnh lên máy chủ.'));
    } finally {
      setUploading(false);
      setUploadType(null);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    }
  };

  // Upload tài liệu (PDF, Word, TXT) từ máy
  const handleUploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadType(MediaType.DOCUMENT);
      const res = await UploadApiService.uploadDocument(file);
      const caption = window.prompt('Nhập tên tài liệu / trích dẫn văn kiện:', file.name);

      onAddMedia({
        type: MediaType.DOCUMENT,
        url: res.url,
        caption: caption || file.name,
        displayOrder: mediaList.length + 1,
      });
    } catch (err) {
      console.error('Upload document failed:', err);
      alert(extractErrorMessage(err, 'Không thể tải file tài liệu lên máy chủ.'));
    } finally {
      setUploading(false);
      setUploadType(null);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  // Thêm liên kết video hoặc tài liệu ngoài qua URL
  const handleAddUrl = () => {
    const url = window.prompt('Nhập đường dẫn URL tư liệu (Video YouTube, file PDF online...):');
    if (!url) return;

    const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.endsWith('.mp4');
    const isDoc = url.endsWith('.pdf') || url.endsWith('.docx') || url.endsWith('.doc');

    const detectedType = isDoc ? MediaType.DOCUMENT : isVideo ? MediaType.VIDEO : MediaType.IMAGE;
    const caption = window.prompt(
      detectedType === MediaType.DOCUMENT
        ? 'Nhập tên tài liệu tham khảo:'
        : 'Nhập chú thích tư liệu:'
    );

    onAddMedia({
      type: detectedType,
      url,
      caption: caption || undefined,
      displayOrder: mediaList.length + 1,
    });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageFileInputRef}
        onChange={handleUploadImageFile}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={docFileInputRef}
        onChange={handleUploadDocFile}
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.epub"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
          <Icon name={IconName.GRID} size={13} className="text-slate-500" />
          <span>Tư liệu & Tài liệu ({mediaList.length})</span>
        </h3>
        {uploading && (
          <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
            Đang tải {uploadType === MediaType.DOCUMENT ? 'tài liệu...' : 'ảnh...'}
          </span>
        )}
      </div>

      {/* 3 Nút bấm trực quan thêm file/tư liệu (Không dùng dropdown khó nhìn) */}
      <div className="grid grid-cols-3 gap-1">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => imageFileInputRef.current?.click()}
          className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 rounded-lg text-[11px] font-medium transition flex flex-col items-center gap-0.5 cursor-pointer shadow-2xs text-center"
          title="Tải ảnh hoặc hiện vật lịch sử từ máy"
        >
          <span className="text-sm">🖼️</span>
          <span>Tải ảnh</span>
        </button>

        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => docFileInputRef.current?.click()}
          className="py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-lg text-[11px] font-medium transition flex flex-col items-center gap-0.5 cursor-pointer shadow-2xs text-center"
          title="Đính kèm file PDF, Word, tài liệu nghiên cứu"
        >
          <span className="text-sm">📄</span>
          <span>File tài liệu</span>
        </button>

        <button
          type="button"
          disabled={disabled || uploading}
          onClick={handleAddUrl}
          className="py-1.5 px-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 rounded-lg text-[11px] font-medium transition flex flex-col items-center gap-0.5 cursor-pointer shadow-2xs text-center"
          title="Dán link Video YouTube hoặc URL tài liệu"
        >
          <span className="text-sm">🎬</span>
          <span>Link Video</span>
        </button>
      </div>

      {/* Danh sách tư liệu & tài liệu đính kèm */}
      <div className="space-y-1.5 max-h-44 overflow-y-auto">
        {mediaList.length === 0 ? (
          <div className="text-[11px] text-slate-400 italic text-center py-2.5 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            Chưa có ảnh, video hoặc tài liệu đính kèm.
          </div>
        ) : (
          mediaList.map((item, idx) => {
            const isDoc = item.type === MediaType.DOCUMENT;
            const isVideo = item.type === MediaType.VIDEO;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 px-2 bg-slate-50/90 border border-slate-200 rounded-lg text-xs hover:bg-white transition"
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <span className="text-sm shrink-0">
                    {isDoc ? '📄' : isVideo ? '🎬' : '🖼️'}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-slate-800 font-semibold text-[11px]">
                      {item.caption || (isDoc ? 'Tài liệu tham khảo' : isVideo ? 'Video tư liệu' : 'Ảnh tư liệu')}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {item.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline px-1"
                    title="Mở xem thử"
                  >
                    Xem
                  </a>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemoveMedia(idx)}
                    className="text-slate-400 hover:text-rose-600 font-bold px-1 text-xs cursor-pointer transition"
                    title="Gỡ bỏ"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
