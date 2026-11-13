'use client';

import { X, ImagePlus, Trash2, Upload } from 'lucide-react';
import { ImageBlockData, EditorialMediaRatio } from '../../../types/block-builder.types';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { EditorialMediaRatioEnum } from '@/constants/lesson-builder.constant';
import type { StoryChapterContentBlockProps } from './StoryChapterRenderer';
import { HOVER_DARK_BG, ACTIVE_LIGHT_BADGE, ACTIVE_BLUE_BADGE } from './StoryChapterTextBlocks';

export const CAPTION_POS_OVERLAY = 'OVERLAY';

export const CAPTION_POS_BOTTOM = 'BOTTOM';

export function handleUploadImageFile(
  file: File | undefined,
  onLoaded: (dataUrl: string) => void
) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onLoaded(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

export function ImageBlockRenderer(props: StoryChapterContentBlockProps) {
  const {
    chapter,
    chapterNumber,
    block,
    zone,
    blocksCount,
    effectiveImageRatio,
    mediaAspectClass,
    imageFitClass,
    effectiveCaptionPos,
    openImageBlockId,
    setDraggedBlockId,
    setOpenImageBlockId,
    onDropBlockOnTarget,
    onUpdateChildBlock,
    onRemoveChildBlock,
    onSelectSub,
    isSubSelected,
    getSubRingClass,
    onUpdateChapterOverride,
  } = props;

  const imgBlock = block as ImageBlockData;
  const isImgOpen = openImageBlockId === block.id;

  return (
    <div
      key={block.id}
      draggable
      onDragStart={() => setDraggedBlockId(block.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDropBlockOnTarget(block.id, zone)}
      onClick={(e) =>
        onSelectSub(
          e,
          EditorialSubElementType.MAIN_IMAGE,
          `${chapterNumber} • Khối Hình ảnh (Image Block)`,
          chapter.id
        )
      }
      className={`relative group/cblock space-y-2 pt-1 cursor-pointer ${getSubRingClass(
        EditorialSubElementType.MAIN_IMAGE,
        chapter.id
      )}`}
    >
      {isSubSelected(EditorialSubElementType.MAIN_IMAGE, chapter.id) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-1"
        >
          {(
            [
              { id: EditorialMediaRatioEnum.RATIO_16_10, label: '16:10' },
              { id: EditorialMediaRatioEnum.RATIO_4_3, label: '4:3' },
              { id: EditorialMediaRatioEnum.RATIO_21_9, label: '21:9' },
              { id: EditorialMediaRatioEnum.AUTO, label: 'Tự nhiên' },
            ] as Array<{ id: EditorialMediaRatio; label: string }>
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('mainImage', { ratio: r.id })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                effectiveImageRatio === r.id ? ACTIVE_BLUE_BADGE : HOVER_DARK_BG
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="text-stone-500">|</span>
          {(
            [
              { id: 'COVER', label: 'Lấp đầy' },
              { id: 'CONTAIN', label: 'Vừa khung' },
            ] as const
          ).map((fit) => (
            <button
              key={fit.id}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('mainImage', { imageFit: fit.id })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                chapter.overrides?.mainImage?.imageFit === fit.id
                  ? ACTIVE_LIGHT_BADGE
                  : HOVER_DARK_BG
              }`}
            >
              {fit.label}
            </button>
          ))}
        </div>
      )}
      <figure className="relative group/fig rounded-lg overflow-hidden bg-stone-200/70 border border-stone-300/80">
        {imgBlock.src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgBlock.src}
            alt={imgBlock.alt || imgBlock.caption || chapter.title}
            className={`w-full ${mediaAspectClass} ${imageFitClass}`}
          />
        ) : (
          <div
            onClick={() => setOpenImageBlockId(block.id)}
            className={`w-full ${mediaAspectClass} bg-gradient-to-br from-stone-200 via-[#e7dfd3] to-stone-300 flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:opacity-95 transition-opacity`}
          >
            <ImagePlus className="w-8 h-8 text-stone-700 mb-2" />
            <span className="text-sm font-serif font-bold text-stone-800">
              Nhấp để chỉnh sửa hoặc đính kèm ảnh tư liệu
            </span>
            <span className="text-xs text-stone-600 mt-1">
              Tỷ lệ khung ảnh: {effectiveImageRatio.replace('_', ':')}
            </span>
          </div>
        )}

        {effectiveCaptionPos === CAPTION_POS_OVERLAY && imgBlock.caption && (
          <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs italic px-4 py-2.5">
            {imgBlock.caption}
          </figcaption>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/fig:opacity-100 transition-opacity font-sans">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenImageBlockId(isImgOpen ? null : block.id);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-900/85 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>{imgBlock.src ? 'Đổi ảnh' : 'Chọn ảnh'}</span>
          </button>
          {blocksCount > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveChildBlock(block.id);
              }}
              title="Xóa khối ảnh này"
              className="p-1.5 rounded-lg bg-stone-900/85 text-white hover:bg-rose-700 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </figure>

      {effectiveCaptionPos === CAPTION_POS_BOTTOM &&
        chapter.config?.media.showCaption !== false && (
          <input
            type="text"
            value={imgBlock.caption || ''}
            onChange={(e) =>
              onUpdateChildBlock(block.id, { caption: e.target.value })
            }
            placeholder="Nhập chú thích ảnh tư liệu (tùy chọn)..."
            className="w-full text-xs italic text-stone-600 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5"
          />
        )}

      {isImgOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3 bg-white border border-stone-300 rounded-xl space-y-2 font-sans shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Đường dẫn hoặc tải ảnh tư liệu ({chapterNumber})
            </span>
            <button
              type="button"
              onClick={() => setOpenImageBlockId(null)}
              className="text-stone-600 hover:text-stone-950 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={imgBlock.src || ''}
              onChange={(e) =>
                onUpdateChildBlock(block.id, { src: e.target.value })
              }
              placeholder="Dán đường dẫn ảnh (https://...)"
              className="flex-1 min-w-[180px] text-sm px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
            <label className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải ảnh lên</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleUploadImageFile(e.target.files?.[0], (url) =>
                    onUpdateChildBlock(block.id, { src: url })
                  )
                }
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
