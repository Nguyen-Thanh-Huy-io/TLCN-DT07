'use client';
import { KeyboardKey } from '@/constants/enums';

import React, { useState, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { VIDEO_BLOCK_CONSTANTS, VideoSourceType } from '../../constants/block-node.constants';
import { AddBlockBelowMenu } from './AddBlockBelowMenu';
import { LessonBlockType } from '../../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../../strategies/lesson-block-insert.strategy';

export function VideoBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor, getPos } = props;
  const { src, sourceType = VideoSourceType.URL, caption } = node.attrs;

  const [activeTab, setActiveTab] = useState<VideoSourceType>(sourceType || VideoSourceType.URL);
  const [urlInput, setUrlInput] = useState('');
  const [embedInput, setEmbedInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý upload video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > VIDEO_BLOCK_CONSTANTS.MAX_FILE_SIZE_BYTES) {
      alert('Dung lượng video vượt quá 50MB cho phép.');
      return;
    }

    setIsUploading(true);
    const videoUrl = URL.createObjectURL(file);
    updateAttributes({
      src: videoUrl,
      sourceType: VideoSourceType.UPLOAD,
    });
    setIsUploading(false);
  };

  // Xử lý áp dụng URL
  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    let finalUrl = urlInput.trim();
    // Chuyển đổi YouTube link sang embed link nếu cần
    if (finalUrl.includes('youtube.com/watch?v=')) {
      const videoId = finalUrl.split('v=')[1]?.split('&')[0];
      if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    updateAttributes({
      src: finalUrl,
      sourceType: VideoSourceType.URL,
    });
    setUrlInput('');
  };

  // Xử lý áp dụng Embed iframe
  const handleApplyEmbed = () => {
    if (!embedInput.trim()) return;
    let embedSrc = embedInput.trim();
    const match = embedInput.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      embedSrc = match[1];
    }
    updateAttributes({
      src: embedSrc,
      sourceType: VideoSourceType.EMBED,
    });
    setEmbedInput('');
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

  // Kiểm tra xem src có phải là youtube/embed iframe không
  const isEmbedOrIframe = src && (src.includes('embed') || src.includes('youtube') || src.includes('vimeo'));

  return (
    <NodeViewWrapper className="video-block-wrapper my-4">
      <div
        data-testid="block-video-container"
        className="border border-slate-200/90 rounded-2xl bg-white shadow-xs p-4 transition-all hover:border-slate-300 relative group"
      >
        {/* Header khối */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-50 text-purple-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span
              data-testid="block-video-title"
              className="text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              {VIDEO_BLOCK_CONSTANTS.TITLE}
            </span>
          </div>

          <button
            type="button"
            onClick={deleteNode}
            title="Xóa khối video"
            data-testid="btn-delete-video-block"
            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Trạng thái 1: Chưa có Video (Chọn nguồn source_type: Upload | URL | Embed) */}
        {!src ? (
          <div
            data-testid="video-block-placeholder"
            className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4"
          >
            {/* Lựa chọn source_type: Upload | URL | Embed */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <span className="text-xs font-semibold text-slate-600">
                {VIDEO_BLOCK_CONSTANTS.LABEL_SOURCE_TYPE}:
              </span>
              <div
                data-testid="video-source-type-tabs"
                className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs"
              >
                {Object.values(VideoSourceType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    data-testid={`tab-video-source-${type}`}
                    onClick={() => {
                      setActiveTab(type);
                      updateAttributes({ sourceType: type });
                    }}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      activeTab === type
                        ? 'bg-white text-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Nội dung tương ứng theo từng tab */}
            {activeTab === VideoSourceType.UPLOAD && (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-lg bg-white">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="video/mp4, video/webm"
                  className="hidden"
                  data-testid="input-file-video"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="btn-upload-video"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{isUploading ? 'Đang tải...' : VIDEO_BLOCK_CONSTANTS.BTN_UPLOAD}</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-2">
                  {VIDEO_BLOCK_CONSTANTS.UPLOAD_HINT}
                </p>
              </div>
            )}

            {activeTab === VideoSourceType.URL && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === KeyboardKey.ENTER && handleApplyUrl()}
                  placeholder={VIDEO_BLOCK_CONSTANTS.INPUT_URL_PLACEHOLDER}
                  data-testid="input-video-url"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  data-testid="btn-apply-video-url"
                  className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                >
                  {VIDEO_BLOCK_CONSTANTS.BTN_APPLY_URL}
                </button>
              </div>
            )}

            {activeTab === VideoSourceType.EMBED && (
              <div className="space-y-2">
                <textarea
                  value={embedInput}
                  onChange={(e) => setEmbedInput(e.target.value)}
                  placeholder={VIDEO_BLOCK_CONSTANTS.INPUT_EMBED_PLACEHOLDER}
                  rows={2}
                  data-testid="textarea-video-embed"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleApplyEmbed}
                    data-testid="btn-apply-video-embed"
                    className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                  >
                    {VIDEO_BLOCK_CONSTANTS.BTN_APPLY_EMBED}
                  </button>
                </div>
              </div>
            )}

            {/* Ô caption : Optional */}
            <div>
              <input
                type="text"
                value={caption || ''}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder={VIDEO_BLOCK_CONSTANTS.CAPTION_PLACEHOLDER}
                data-testid="input-video-caption"
                className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        ) : (
          /* Trạng thái 2: Đã có Video (Player + Caption) */
          <div data-testid="video-block-preview" className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center group/vid">
              {isEmbedOrIframe ? (
                <iframe
                  src={src}
                  title={caption || 'Video tài liệu'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                  data-testid="video-iframe-element"
                />
              ) : (
                <video
                  src={src}
                  controls
                  className="w-full h-full object-contain"
                  data-testid="video-player-element"
                >
                  Trình duyệt không hỗ trợ thẻ video.
                </video>
              )}

              <div className="absolute top-2 right-2 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => updateAttributes({ src: '' })}
                  data-testid="btn-change-video"
                  className="px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700 rounded transition cursor-pointer"
                >
                  Thay video
                </button>
              </div>
            </div>

            {/* Ô caption : Optional */}
            <div>
              <input
                type="text"
                value={caption || ''}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder={VIDEO_BLOCK_CONSTANTS.CAPTION_PLACEHOLDER}
                data-testid="input-video-caption-active"
                className="w-full text-center text-xs text-slate-600 italic bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none py-1"
              />
            </div>
          </div>
        )}

        {/* Nút + Thêm khối bên dưới */}
        <AddBlockBelowMenu
          onSelectBlock={handleAddBlockBelow}
          buttonLabel={VIDEO_BLOCK_CONSTANTS.BTN_ADD_BELOW}
        />
      </div>
    </NodeViewWrapper>
  );
}
