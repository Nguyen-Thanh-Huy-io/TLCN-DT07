'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Film,
  ImagePlus,
  Link2,
  Loader2,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import {
  CommunityVideoKind,
  toYoutubeEmbedUrl,
  type CommunityImageItem,
  type CommunityVideoItem,
} from '../api';

export const MAX_COMMUNITY_IMAGES = 6;

enum VideoSourceTab {
  UPLOAD = 'upload',
  YOUTUBE = 'youtube',
}

export function ComposerImagesAttachment({
  images,
  imageCaption,
  uploadingImages,
  onUploadImageFiles,
  onRemoveImage,
  onChangeImageCaption,
  onHide,
}: {
  images: CommunityImageItem[];
  imageCaption: string;
  uploadingImages: boolean;
  onUploadImageFiles: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onChangeImageCaption: (caption: string) => void;
  onHide: () => void;
}) {
  return (
    <div className="rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#14233F]">
          <ImagePlus size={15} className="text-[#7A1F24]" />
          <span>
            Hình ảnh đính kèm ({images.length}/{MAX_COMMUNITY_IMAGES})
          </span>
        </span>

        <div className="flex items-center gap-2">
          {images.length < MAX_COMMUNITY_IMAGES && (
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[12px] font-semibold text-[#14233F] hover:border-[#8A5A19]">
              {uploadingImages ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              <span>{uploadingImages ? 'Đang tải…' : 'Chọn ảnh'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImages}
                onChange={(e) => {
                  onUploadImageFiles(e.target.files);
                  e.target.value = '';
                }}
                className="sr-only"
              />
            </label>
          )}
          {images.length === 0 && (
            <button
              type="button"
              onClick={onHide}
              aria-label="Thu gọn khung ảnh"
              className="grid size-7 place-items-center rounded-[5px] text-[#6E5D4B] hover:bg-[#E5DAC4] hover:text-[#14233F] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-[6px] border border-[#D8C8AA] bg-[#FAF5E6]"
              >
                <Image
                  src={resolveBackendAssetUrl(img.url)}
                  alt={`Ảnh đính kèm ${idx + 1}`}
                  fill
                  sizes="200px"
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  aria-label={`Gỡ ảnh ${idx + 1}`}
                  className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-[#14233F]/85 text-[#FAF5E6] hover:bg-[#7A1F24] cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <input
            type="text"
            value={imageCaption}
            onChange={(e) => onChangeImageCaption(e.target.value)}
            placeholder="Chú thích / Nguồn ảnh (tuỳ chọn)..."
            className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
          />
        </div>
      )}
    </div>
  );
}

export function ComposerVideoAttachment({
  video,
  uploadingVideo,
  onUploadVideoFile,
  onChangeVideo,
  onHide,
}: {
  video: CommunityVideoItem | null;
  uploadingVideo: boolean;
  onUploadVideoFile: (file: File | null) => void;
  onChangeVideo: (video: CommunityVideoItem | null) => void;
  onHide: () => void;
}) {
  const [videoTab, setVideoTab] = useState<VideoSourceTab>(VideoSourceTab.UPLOAD);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeErr, setYoutubeErr] = useState('');

  const handleApplyYoutube = () => {
    const embedUrl = toYoutubeEmbedUrl(youtubeInput);
    if (!embedUrl) {
      setYoutubeErr(
        'Link YouTube chưa hợp lệ (hỗ trợ youtube.com/watch?v=..., youtu.be/..., /shorts/...).',
      );
      return;
    }
    setYoutubeErr('');
    onChangeVideo({ url: embedUrl, kind: CommunityVideoKind.YOUTUBE, caption: null });
    setYoutubeInput('');
  };

  return (
    <div className="rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#14233F]">
          <Film size={15} className="text-[#7A1F24]" />
          <span>Video đính kèm</span>
        </span>

        <div className="flex items-center gap-2">
          {!video && (
            <div className="inline-flex rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] p-0.5 text-[11.5px] font-semibold">
              <button
                type="button"
                onClick={() => setVideoTab(VideoSourceTab.UPLOAD)}
                className={`rounded-[4px] px-2.5 py-1 cursor-pointer ${
                  videoTab === VideoSourceTab.UPLOAD
                    ? 'bg-[#7A1F24] text-[#FAF5E6]'
                    : 'text-[#5C4E3C]'
                }`}
              >
                Tải file
              </button>
              <button
                type="button"
                onClick={() => setVideoTab(VideoSourceTab.YOUTUBE)}
                className={`rounded-[4px] px-2.5 py-1 cursor-pointer ${
                  videoTab === VideoSourceTab.YOUTUBE
                    ? 'bg-[#7A1F24] text-[#FAF5E6]'
                    : 'text-[#5C4E3C]'
                }`}
              >
                YouTube
              </button>
            </div>
          )}

          {!video && (
            <button
              type="button"
              onClick={onHide}
              aria-label="Thu gọn khung video"
              className="grid size-7 place-items-center rounded-[5px] text-[#6E5D4B] hover:bg-[#E5DAC4] hover:text-[#14233F] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!video ? (
        videoTab === VideoSourceTab.UPLOAD ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-dashed border-[#CBB894] bg-[#FDF9F0] px-3.5 py-2.5">
            <span className="text-[12px] text-[#5C4E3C]">
              Hỗ trợ <strong>.mp4, .webm, .mov</strong> (≤ 50MB, lưu Cloudinary).
            </span>
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#7A1F24] px-3 text-[12px] font-semibold text-[#FAF5E6] hover:bg-[#651A1E]">
              {uploadingVideo ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
              <span>{uploadingVideo ? 'Đang tải…' : 'Chọn Video'}</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                disabled={uploadingVideo}
                onChange={(e) => {
                  onUploadVideoFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
                className="sr-only"
              />
            </label>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="Dán link YouTube (https://www.youtube.com/watch?v=...)"
                className="h-9 flex-1 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
              <button
                type="button"
                onClick={handleApplyYoutube}
                className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[#14233F] px-3 text-[12px] font-semibold text-[#FAF5E6] hover:opacity-90 cursor-pointer"
              >
                <Link2 size={13} />
                <span>Gắn</span>
              </button>
            </div>
            {youtubeErr && <p className="text-[12px] text-[#7A1F24]">{youtubeErr}</p>}
          </div>
        )
      ) : (
        <div className="mt-3 space-y-2">
          <div className="relative overflow-hidden rounded-[8px] border border-[#D8C8AA] bg-black">
            {video.kind === CommunityVideoKind.YOUTUBE ? (
              <div className="aspect-video w-full">
                <iframe
                  src={video.url}
                  title="Video YouTube xem trước"
                  className="h-full w-full border-0"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={resolveBackendAssetUrl(video.url)}
                controls
                playsInline
                preload="metadata"
                className="max-h-56 w-full"
              />
            )}
            <button
              type="button"
              onClick={() => onChangeVideo(null)}
              className="absolute right-2 top-2 rounded-[5px] bg-[#14233F]/90 px-2.5 py-1 text-[11px] font-semibold text-[#FAF5E6] hover:bg-[#7A1F24] cursor-pointer"
            >
              Gỡ video
            </button>
          </div>
          <input
            type="text"
            value={video.caption ?? ''}
            onChange={(e) => onChangeVideo({ ...video, caption: e.target.value })}
            placeholder="Chú thích / Nguồn video (tuỳ chọn)..."
            className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
          />
        </div>
      )}
    </div>
  );
}

export function ComposerAttachmentsPanel({
  showImageBox,
  showVideoBox,
  mediaImages,
  imageCaption,
  video,
  isUploading,
  isUploadingVideo,
  onToggleImageBox,
  onToggleVideoBox,
  onUploadImageFiles,
  onRemoveImage,
  onChangeImageCaption,
  onUploadVideoFile,
  onChangeVideo,
}: {
  showImageBox: boolean;
  showVideoBox: boolean;
  mediaImages: CommunityImageItem[];
  imageCaption: string;
  video: CommunityVideoItem | null;
  isUploading: boolean;
  isUploadingVideo: boolean;
  onToggleImageBox: () => void;
  onToggleVideoBox: () => void;
  onUploadImageFiles: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onChangeImageCaption: (caption: string) => void;
  onUploadVideoFile: (file: File | null) => void;
  onChangeVideo: (video: CommunityVideoItem | null) => void;
}) {
  const imagesExpanded = showImageBox || mediaImages.length > 0;
  const videoExpanded = showVideoBox || Boolean(video);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#DFD1B8] bg-[#FDF9F0] px-3.5 py-2">
        <span className="text-[13px] font-semibold text-[#5C4E3C]">
          Đính kèm vào bài viết (tuỳ chọn):
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleImageBox}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
              imagesExpanded
                ? 'border-[#7A1F24] bg-[#7A1F24]/10 text-[#7A1F24]'
                : 'border-[#D4C5A6] bg-[#FAF5E6] text-[#14233F] hover:border-[#8A5A19]'
            }`}
          >
            <ImagePlus size={14} />
            <span>
              Hình ảnh{mediaImages.length > 0 ? ` (${mediaImages.length})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleVideoBox}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
              videoExpanded
                ? 'border-[#144E75] bg-[#E3EEF5] text-[#144E75]'
                : 'border-[#D4C5A6] bg-[#FAF5E6] text-[#14233F] hover:border-[#8A5A19]'
            }`}
          >
            <Film size={14} />
            <span>Video{video ? ' (Đã gắn)' : ''}</span>
          </button>
        </div>
      </div>

      {imagesExpanded && (
        <ComposerImagesAttachment
          images={mediaImages}
          imageCaption={imageCaption}
          uploadingImages={isUploading}
          onUploadImageFiles={onUploadImageFiles}
          onRemoveImage={onRemoveImage}
          onChangeImageCaption={onChangeImageCaption}
          onHide={onToggleImageBox}
        />
      )}

      {videoExpanded && (
        <ComposerVideoAttachment
          video={video}
          uploadingVideo={isUploadingVideo}
          onUploadVideoFile={onUploadVideoFile}
          onChangeVideo={onChangeVideo}
          onHide={onToggleVideoBox}
        />
      )}
    </div>
  );
}
