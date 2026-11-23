'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import { KeyboardKey } from '@/constants/enums';
import {
  CommunityVideoKind,
  toYoutubeEmbedUrl,
  type CommunityImageItem,
  type CommunityVideoItem,
} from '../api';

function resolveGridLayout(count: number): string {
  return count <= 1 ? 'grid-cols-1' : 'grid-cols-2 gap-1.5';
}

function ImageLightbox({
  images,
  activeIdx,
  postTitle,
  onChangeIdx,
  onClose,
}: {
  images: CommunityImageItem[];
  activeIdx: number;
  postTitle: string;
  onChangeIdx: (idx: number) => void;
  onClose: () => void;
}) {
  const current = images[activeIdx];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh: ${current.caption || postTitle}`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === KeyboardKey.ESCAPE) onClose();
        if (e.key === KeyboardKey.ARROW_LEFT && images.length > 1) {
          onChangeIdx((activeIdx - 1 + images.length) % images.length);
        }
        if (e.key === KeyboardKey.ARROW_RIGHT && images.length > 1) {
          onChangeIdx((activeIdx + 1) % images.length);
        }
      }}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng xem ảnh"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeIdx((activeIdx - 1 + images.length) % images.length);
          }}
          aria-label="Ảnh trước"
          className="absolute left-3 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-5xl text-center"
      >
        <Image
          src={resolveBackendAssetUrl(current.url)}
          alt={current.caption || postTitle}
          width={1400}
          height={900}
          unoptimized
          className="h-auto max-h-[80vh] w-auto max-w-full rounded-lg object-contain mx-auto"
        />
        {(current.caption || images.length > 1) && (
          <p className="mt-2.5 text-xs text-white/90">
            {images.length > 1 ? `Ảnh ${activeIdx + 1}/${images.length}` : ''}
            {current.caption ? ` · ${current.caption}` : ''}
          </p>
        )}
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeIdx((activeIdx + 1) % images.length);
          }}
          aria-label="Ảnh tiếp theo"
          className="absolute right-3 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}

export function CommunityPostMediaGallery({
  images,
  videos,
  postTitle,
  priorityLcp = false,
  compact = false,
}: {
  images: CommunityImageItem[];
  videos: CommunityVideoItem[];
  postTitle: string;
  priorityLcp?: boolean;
  compact?: boolean;
}) {
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const validImages = images.filter(
    (img) => img.url && !img.url.includes('cld-sample-6.jpg') && !brokenUrls[img.url],
  );
  const primaryVideo = videos[0] ?? null;

  if (validImages.length === 0 && !primaryVideo) return null;

  const visibleImages = validImages.slice(0, 4);
  const hiddenCount = Math.max(0, validImages.length - 4);
  const firstCaption = validImages[0]?.caption;
  const isMindmapSingle =
    validImages.length === 1 && Boolean(firstCaption?.startsWith('Sơ đồ tư duy'));

  const youtubeSrc =
    primaryVideo?.kind === CommunityVideoKind.YOUTUBE
      ? toYoutubeEmbedUrl(primaryVideo.url) || primaryVideo.url
      : null;

  return (
    <div className="mt-4 space-y-3">
      {primaryVideo && (
        <figure className="overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-black">
          {youtubeSrc ? (
            <div className="aspect-video w-full">
              <iframe
                src={youtubeSrc}
                title={primaryVideo.caption || postTitle}
                loading="lazy"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <video
              src={resolveBackendAssetUrl(primaryVideo.url)}
              controls
              playsInline
              preload="metadata"
              className={`${compact ? 'max-h-[340px]' : 'max-h-[460px]'} w-full bg-black`}
            />
          )}
          {primaryVideo.caption && (
            <figcaption className="bg-[#EFE4CF] px-4 py-2 text-[12.5px] text-[#6E5D4B]">
              Nguồn / Chú thích video: {primaryVideo.caption}
            </figcaption>
          )}
        </figure>
      )}

      {validImages.length === 1 && (
        <figure
          className={`overflow-hidden rounded-[8px] border border-[#E5DAC4] ${
            isMindmapSingle ? 'bg-[#FAF5E6]' : 'bg-[#F2E8D5]'
          }`}
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(0)}
            className="block w-full text-left cursor-zoom-in"
            aria-label="Phóng to ảnh"
          >
            <Image
              src={resolveBackendAssetUrl(validImages[0].url)}
              alt={firstCaption || postTitle}
              width={800}
              height={480}
              loading={priorityLcp ? 'eager' : undefined}
              unoptimized
              onError={() =>
                setBrokenUrls((prev) => ({ ...prev, [validImages[0].url]: true }))
              }
              className={`h-auto ${compact ? 'max-h-[360px]' : 'max-h-[480px]'} w-full ${
                isMindmapSingle ? 'object-contain p-2' : 'object-cover'
              }`}
            />
          </button>
          {firstCaption && (
            <figcaption className="bg-[#EFE4CF] px-4 py-2.5 text-[13px] text-[#6E5D4B]">
              Nguồn / Chú thích: {firstCaption}
            </figcaption>
          )}
        </figure>
      )}

      {validImages.length > 1 && (
        <figure className="overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-[#EFE4CF]">
          <div className={`grid ${resolveGridLayout(visibleImages.length)}`}>
            {visibleImages.map((img, idx) => {
              const spanTwo = visibleImages.length === 3 && idx === 0;
              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  className={`relative overflow-hidden bg-[#F2E8D5] cursor-zoom-in ${
                    spanTwo ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/3]'
                  }`}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <Image
                    src={resolveBackendAssetUrl(img.url)}
                    alt={img.caption || `${postTitle} (${idx + 1})`}
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    loading={priorityLcp && idx === 0 ? 'eager' : undefined}
                    unoptimized
                    onError={() => setBrokenUrls((prev) => ({ ...prev, [img.url]: true }))}
                    className="object-cover transition-transform duration-200 hover:scale-[1.02]"
                  />
                  {idx === 3 && hiddenCount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-bold text-white">
                      +{hiddenCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {firstCaption && (
            <figcaption className="bg-[#EFE4CF] px-4 py-2 text-[12.5px] text-[#6E5D4B]">
              Nguồn / Chú thích: {firstCaption}
            </figcaption>
          )}
        </figure>
      )}

      {lightboxIdx !== null && (
        <ImageLightbox
          images={validImages}
          activeIdx={lightboxIdx}
          postTitle={postTitle}
          onChangeIdx={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
