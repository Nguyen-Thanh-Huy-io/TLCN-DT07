'use client';

import { RotateCcw } from 'lucide-react';
import { EditorialMediaRatio } from '../../../types/block-builder.types';
import { EDITORIAL_MEDIA_RATIO_OPTIONS } from '../../../strategies/story-chapter-layout.strategy';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';
import { LessonBlockType } from '../../../types/editor.types';
import type { StorySubElementInspectorProps } from './useStorySubElementInspector';
import type { StorySubElementInspectorFacade } from './useStorySubElementInspector';

export function MainImagePanel({ facade, subSelection, edConfig }: { facade: StorySubElementInspectorFacade } & Pick<StorySubElementInspectorProps, 'subSelection' | 'edConfig'>) {
  const { overrides, targetImageBlock, updateChildBlockInTargetChapter, updateOverride } = facade;
  return (
    <>
      {subSelection.subType === EditorialSubElementType.MAIN_IMAGE && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">
              Cấu hình & Ghi đè Ô Hình ảnh
            </span>
            {overrides.mainImage && (
              <button
                type="button"
                onClick={() => updateOverride('mainImage', undefined)}
                className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Đường dẫn hình ảnh
              </label>
              <input
                type="text"
                value={targetImageBlock?.src ?? ''}
                onChange={(e) =>
                  updateChildBlockInTargetChapter(LessonBlockType.IMAGE, {
                    src: e.target.value,
                  })
                }
                placeholder="Dán đường dẫn ảnh tư liệu..."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Chú thích ảnh
              </label>
              <input
                type="text"
                value={targetImageBlock?.caption ?? ''}
                onChange={(e) =>
                  updateChildBlockInTargetChapter(LessonBlockType.IMAGE, {
                    caption: e.target.value,
                  })
                }
                placeholder="Nhập chú thích dưới ảnh..."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Tỷ lệ ảnh riêng
              </span>
              <select
                value={
                  overrides.mainImage?.ratio || edConfig.media.defaultRatio
                }
                onChange={(e) =>
                  updateOverride('mainImage', {
                    ratio: e.target.value as EditorialMediaRatio,
                  })
                }
                className="w-36 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              >
                {EDITORIAL_MEDIA_RATIO_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Cách hiển thị
              </span>
              <select
                value={
                  overrides.mainImage?.imageFit || edConfig.media.imageFit
                }
                onChange={(e) =>
                  updateOverride('mainImage', {
                    imageFit: e.target.value as 'COVER' | 'CONTAIN',
                  })
                }
                className="w-36 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              >
                <option value="COVER">Lấp đầy khung (Cover)</option>
                <option value="CONTAIN">Vừa khít ảnh (Contain)</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Vị trí chú thích
              </span>
              <select
                value={
                  overrides.mainImage?.captionPosition ||
                  edConfig.media.captionPosition
                }
                onChange={(e) =>
                  updateOverride('mainImage', {
                    captionPosition: e.target.value as
                      | 'BOTTOM'
                      | 'OVERLAY'
                      | 'HIDDEN',
                  })
                }
                className="w-36 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              >
                <option value="BOTTOM">Bên dưới ảnh</option>
                <option value="OVERLAY">Phủ trên nền ảnh</option>
                <option value="HIDDEN">Ẩn chú thích</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PullQuotePanel({ facade, subSelection, edConfig }: { facade: StorySubElementInspectorFacade } & Pick<StorySubElementInspectorProps, 'subSelection' | 'edConfig'>) {
  const { overrides, targetQuoteBlock, updateChildBlockInTargetChapter, updateOverride } = facade;
  return (
    <>
      {subSelection.subType === EditorialSubElementType.PULL_QUOTE && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">
              Cấu hình & Ghi đè Ô Trích dẫn
            </span>
            {overrides.pullQuote && (
              <button
                type="button"
                onClick={() => updateOverride('pullQuote', undefined)}
                className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Nội dung trích dẫn
              </label>
              <textarea
                rows={3}
                value={targetQuoteBlock?.quoteText ?? ''}
                onChange={(e) =>
                  updateChildBlockInTargetChapter(LessonBlockType.QUOTE, {
                    quoteText: e.target.value,
                  })
                }
                className="w-full text-xs italic font-serif p-2.5 bg-white border border-stone-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Tác giả / Nhân vật
              </label>
              <input
                type="text"
                value={targetQuoteBlock?.author ?? ''}
                onChange={(e) =>
                  updateChildBlockInTargetChapter(LessonBlockType.QUOTE, {
                    author: e.target.value,
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Kiểu trích dẫn
              </span>
              <select
                value={
                  overrides.pullQuote?.style ||
                  edConfig.typography.pullQuoteStyle ||
                  'CLASSIC_QUOTES'
                }
                onChange={(e) =>
                  updateOverride('pullQuote', {
                    style: e.target.value as
                      | 'CLASSIC_QUOTES'
                      | 'BORDER_LEFT'
                      | 'MINIMAL',
                  })
                }
                className="w-36 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              >
                <option value="CLASSIC_QUOTES">Ngoặc kép lớn cổ điển</option>
                <option value="BORDER_LEFT">Viền dọc sử liệu</option>
                <option value="MINIMAL">Chữ nghiêng tối giản</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Màu điểm nhấn
              </span>
              <input
                type="color"
                value={overrides.pullQuote?.accentColor || '#8b261d'}
                onChange={(e) =>
                  updateOverride('pullQuote', { accentColor: e.target.value })
                }
                className="w-7 h-7 rounded border border-stone-300 p-0.5 bg-white cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Cỡ chữ trích dẫn (px)
              </span>
              <input
                type="number"
                min={16}
                max={32}
                value={overrides.pullQuote?.fontSizePx || 20}
                onChange={(e) =>
                  updateOverride('pullQuote', {
                    fontSizePx: Number(e.target.value) || 20,
                  })
                }
                className="w-20 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-center"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SubChapterPanel({ block: sc, subSelection, edConfig, onUpdateBlock }: Pick<StorySubElementInspectorProps, 'block' | 'subSelection' | 'edConfig' | 'onUpdateBlock'>) {
  return (
    <>
      {subSelection.subType === EditorialSubElementType.SUB_CHAPTER && (
        <div className="space-y-4">
          {(() => {
            const subIdx = (sc.subChapters || []).findIndex(
              (item, i) => (item.id || String(i)) === subSelection.subId
            );
            const targetSub =
              subIdx >= 0 ? sc.subChapters[subIdx] : sc.subChapters?.[0];
            if (!targetSub) return null;

            const updateSub = (updates: Partial<typeof targetSub>) => {
              const next = (sc.subChapters || []).map((item, i) =>
                i === (subIdx >= 0 ? subIdx : 0)
                  ? { ...item, ...updates }
                  : item
              );
              onUpdateBlock(sc.id, { subChapters: next });
            };

            return (
              <div className="space-y-3 pb-3 border-b border-stone-200">
                <div className="text-xs font-bold text-stone-900">
                  Thuộc tính riêng của mục này
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Đề mục
                  </label>
                  <input
                    type="text"
                    value={targetSub.numberLabel}
                    onChange={(e) =>
                      updateSub({ numberLabel: e.target.value })
                    }
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Tiêu đề mục
                  </label>
                  <input
                    type="text"
                    value={targetSub.title}
                    onChange={(e) => updateSub({ title: e.target.value })}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Ảnh minh họa của mục (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={targetSub.imageUrl || ''}
                    onChange={(e) => updateSub({ imageUrl: e.target.value })}
                    placeholder="Dán đường dẫn ảnh tư liệu..."
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-stone-700">
                    Tỷ lệ ảnh riêng
                  </span>
                  <select
                    value={
                      targetSub.imageRatio || edConfig.media.defaultRatio
                    }
                    onChange={(e) =>
                      updateSub({
                        imageRatio: e.target.value as EditorialMediaRatio,
                      })
                    }
                    className="w-36 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                  >
                    {EDITORIAL_MEDIA_RATIO_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

          <TypographyInspectorPanel />
        </div>
      )}
    </>
  );
}
