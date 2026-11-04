'use client';
import { KeyboardKey } from '@/constants/enums';

import React, { useState, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { IMAGE_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { AddBlockBelowMenu } from './AddBlockBelowMenu';
import { LessonBlockType } from '../../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../../strategies/lesson-block-insert.strategy';

// Ảnh tư liệu mẫu từ Thư viện media
const SAMPLE_MEDIA_LIBRARY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
    title: 'Bản đồ Chiến dịch Lịch sử',
  },
  {
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
    title: 'Tư liệu Quân đội Nhân dân',
  },
  {
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    title: 'Hồ sơ Di tích Lịch sử',
  },
];

export function ImageBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor, getPos } = props;
  const { src, alt, caption } = node.attrs;

  const [urlInput, setUrlInput] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý chọn file từ máy
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMAGE_BLOCK_CONSTANTS.MAX_FILE_SIZE_BYTES) {
      alert('Dung lượng tệp vượt quá 10MB cho phép.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result as string;
      updateAttributes({
        src: resultUrl,
        alt: file.name.replace(/\.[^/.]+$/, ''),
      });
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Không thể đọc tệp ảnh.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý áp dụng URL
  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    updateAttributes({
      src: urlInput.trim(),
    });
    setUrlInput('');
  };

  // Thêm khối nội dung ngay bên dưới
  const handleAddBlockBelow = (type: LessonBlockType) => {
    if (!editor) return;
    const snippet = lessonBlockInsertStrategy.generateSnippet(type);
    const currentPos = typeof getPos === 'function' ? getPos() : null;
    if (typeof currentPos === 'number') {
      const nextPos = currentPos + node.nodeSize;
      editor.chain().focus().insertContentAt(nextPos, snippet).run();
    } else {
      editor.chain().focus().insertContent(snippet).run();
    }
  };

  return (
    <NodeViewWrapper className="image-block-wrapper my-4">
      <div
        data-testid="block-image-container"
        className="border border-slate-200/90 rounded-2xl bg-white shadow-xs p-4 transition-all hover:border-slate-300 relative group"
      >
        {/* Thanh Header khối */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <span
              data-testid="block-image-title"
              className="text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              {IMAGE_BLOCK_CONSTANTS.TITLE}
            </span>
          </div>

          <button
            type="button"
            onClick={deleteNode}
            title="Xóa khối hình ảnh"
            data-testid="btn-delete-image-block"
            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Trạng thái 1: Chưa có ảnh (Placeholder Card theo mô tả của người dùng) */}
        {!src ? (
          <div
            data-testid="image-block-placeholder"
            className="flex flex-col items-center justify-center p-6 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-xl text-center"
          >
            {/* Tiêu đề & định dạng */}
            <h4
              data-testid="image-block-subtitle"
              className="text-sm font-bold text-slate-800 mb-1"
            >
              {IMAGE_BLOCK_CONSTANTS.SUBTITLE}
            </h4>
            <p
              data-testid="image-block-format-hint"
              className="text-xs text-slate-500 mb-4 font-medium"
            >
              {IMAGE_BLOCK_CONSTANTS.FORMAT_HINT}
            </p>

            {/* Nút Tải ảnh lên */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept={IMAGE_BLOCK_CONSTANTS.ACCEPTED_FORMATS}
              className="hidden"
              data-testid="input-file-image"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="btn-upload-image"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{isUploading ? 'Đang tải lên...' : IMAGE_BLOCK_CONSTANTS.BTN_UPLOAD}</span>
            </button>

            {/* Phân cách Hoặc */}
            <div className="flex items-center w-full max-w-xs my-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="px-2.5 text-[11px] font-semibold text-slate-400 uppercase">
                {IMAGE_BLOCK_CONSTANTS.DIVIDER_TEXT}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Nhập URL hình ảnh */}
            <div className="flex items-center w-full max-w-sm gap-1.5 mb-2.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === KeyboardKey.ENTER && handleApplyUrl()}
                placeholder={IMAGE_BLOCK_CONSTANTS.INPUT_URL_PLACEHOLDER}
                data-testid="input-image-url"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                data-testid="btn-apply-image-url"
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
              >
                {IMAGE_BLOCK_CONSTANTS.BTN_APPLY_URL}
              </button>
            </div>

            {/* Chọn từ thư viện media */}
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              data-testid="btn-open-media-library"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline transition cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>[{IMAGE_BLOCK_CONSTANTS.BTN_MEDIA_LIBRARY}]</span>
            </button>
          </div>
        ) : (
          /* Trạng thái 2: Đã có ảnh (Preview + Chú thích) */
          <div data-testid="image-block-preview" className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center group/img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || 'Tư liệu lịch sử'}
                data-testid="image-preview-element"
                className="max-h-[380px] w-full object-contain"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => updateAttributes({ src: '' })}
                  data-testid="btn-change-image"
                  className="px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700 rounded transition cursor-pointer"
                >
                  Thay ảnh
                </button>
              </div>
            </div>

            {/* Ô chú thích ảnh (Caption) */}
            <div>
              <input
                type="text"
                value={caption || ''}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder={IMAGE_BLOCK_CONSTANTS.CAPTION_PLACEHOLDER}
                data-testid="input-image-caption"
                className="w-full text-center text-xs text-slate-600 italic bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-1"
              />
            </div>

            {/* Ô Alt text */}
            <div>
              <input
                type="text"
                value={alt || ''}
                onChange={(e) => updateAttributes({ alt: e.target.value })}
                placeholder={IMAGE_BLOCK_CONSTANTS.ALT_PLACEHOLDER}
                data-testid="input-image-alt"
                className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Modal Thư viện Media Nhanh */}
        {showMediaModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              data-testid="modal-media-library"
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h5 className="text-sm font-bold text-slate-800">Thư viện ảnh tư liệu sử học</h5>
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2.5 my-4">
                {SAMPLE_MEDIA_LIBRARY_IMAGES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`media-lib-item-${idx}`}
                    onClick={() => {
                      updateAttributes({
                        src: item.url,
                        caption: item.title,
                        alt: item.title,
                      });
                      setShowMediaModal(false);
                    }}
                    className="group rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-200 transition text-left cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.title} className="w-full h-20 object-cover" />
                    <p className="p-1 text-[10px] font-semibold text-slate-700 truncate">
                      {item.title}
                    </p>
                  </button>
                ))}
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nút + Thêm khối bên dưới */}
        <AddBlockBelowMenu
          onSelectBlock={handleAddBlockBelow}
          buttonLabel={IMAGE_BLOCK_CONSTANTS.BTN_ADD_BELOW}
        />
      </div>
    </NodeViewWrapper>
  );
}
