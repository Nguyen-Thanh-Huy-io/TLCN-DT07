'use client';

import React from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import {
  EditorialElementOverrides,
  EditorialMediaRatio,
  EditorialSpreadConfig,
  ImageBlockData,
  LessonBlockItem,
  QuoteBlockData,
  StoryChapterBlockData,
  StoryChapterUnit,
} from '../../../types/block-builder.types';
import {
  EDITORIAL_MEDIA_RATIO_OPTIONS,
  getChapterLabel,
  StoryChapterLayoutStrategy,
} from '../../../strategies/story-chapter-layout.strategy';
import { ActiveSubElementSelection, EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';
import { LessonBlockType } from '../../../types/editor.types';

interface StorySubElementInspectorProps {
  block: StoryChapterBlockData;
  subSelection: ActiveSubElementSelection;
  edConfig: EditorialSpreadConfig;
  onBackToSpread: () => void;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

const FONT_OVERRIDE_OPTIONS = [
  { value: '', label: 'Mặc định theo toàn khối' },
  {
    value: 'var(--font-merriweather), Georgia, serif',
    label: 'Cổ điển (Playfair / Merriweather)',
  },
  {
    value: 'var(--font-noto-serif), Cambria, serif',
    label: 'Biên niên sử (Cormorant / Noto Serif)',
  },
  {
    value: 'var(--font-be-vietnam-pro), sans-serif',
    label: 'Hiện đại (Be Vietnam Pro / Inter)',
  },
] as const;

/**
 * Inspector Cấp 2: Hiển thị và cho phép Ghi đè (Override) thuộc tính riêng của từng Ô/Khối con
 * khi người dùng nhấp trực tiếp vào ô đó trên trang Editorial Spread.
 */
export function StorySubElementInspector({
  block: sc,
  subSelection,
  edConfig,
  onBackToSpread,
  onUpdateBlock,
}: StorySubElementInspectorProps) {
  const chapters: StoryChapterUnit[] =
    StoryChapterLayoutStrategy.normalizeStoryChapters(sc);
  const targetChapterIndex = Math.max(
    0,
    chapters.findIndex((c) => c.id === subSelection.subId)
  );
  const targetChapter = chapters[targetChapterIndex] || chapters[0];
  const overrides: EditorialElementOverrides =
    targetChapter?.overrides || sc.overrides || {};

  const updateTargetChapter = (updates: Partial<StoryChapterUnit>) => {
    if (!targetChapter) return;
    const nextChapters = chapters.map((c) =>
      c.id === targetChapter.id ? { ...c, ...updates } : c
    );
    const first = nextChapters[0];
    onUpdateBlock(sc.id, {
      chapters: nextChapters,
      ...(first
        ? {
            chapterNumber: getChapterLabel(0),
            title: first.title,
            subtitle: first.subtitle || '',
            overrides: first.overrides,
          }
        : {}),
    });
  };

  const targetImageBlock = (targetChapter?.blocks || []).find(
    (b): b is ImageBlockData => b.type === LessonBlockType.IMAGE
  );
  const targetQuoteBlock = (targetChapter?.blocks || []).find(
    (b): b is QuoteBlockData => b.type === LessonBlockType.QUOTE
  );

  const updateChildBlockInTargetChapter = (
    blockType: LessonBlockType,
    updates: Partial<LessonBlockItem>
  ) => {
    if (!targetChapter) return;
    const nextBlocks = (targetChapter.blocks || []).map((b) =>
      b.type === blockType ? ({ ...b, ...updates } as LessonBlockItem) : b
    );
    updateTargetChapter({ blocks: nextBlocks });
  };

  const updateOverride = <K extends keyof EditorialElementOverrides>(
    key: K,
    updates: Partial<NonNullable<EditorialElementOverrides[K]>> | undefined
  ) => {
    const nextOverrides: EditorialElementOverrides = {
      ...overrides,
      [key]: updates ? { ...(overrides[key] || {}), ...updates } : undefined,
    };
    updateTargetChapter({ overrides: nextOverrides });
  };

  return (
    <div className="space-y-4">
      {/* Thanh điều hướng ngữ cảnh: Cho biết đang sửa ô con nào & Nút quay về cấu hình toàn khối */}
      <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Đang chọn ô thành phần
          </span>
          <button
            type="button"
            onClick={onBackToSpread}
            className="text-xs font-bold text-stone-800 hover:text-blue-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Toàn khối</span>
          </button>
        </div>
        <div className="text-xs font-bold text-stone-900 truncate">
          {subSelection.label}
        </div>
      </div>

      {/* 1. Ô DẪN NHẬP & DROP CAP (INTRO_TEXT) */}
      {subSelection.subType === EditorialSubElementType.INTRO_TEXT && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">
              Ghi đè riêng cho Ô Dẫn nhập
            </span>
            {overrides.intro && (
              <button
                type="button"
                onClick={() => updateOverride('intro', undefined)}
                className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                title="Khôi phục theo mặc định toàn khối"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Chữ cái đầu lớn (Drop Cap)
              </span>
              <input
                type="checkbox"
                checked={
                  overrides.intro?.dropCap !== undefined
                    ? overrides.intro.dropCap
                    : edConfig.typography.dropCap !== false
                }
                onChange={(e) =>
                  updateOverride('intro', { dropCap: e.target.checked })
                }
                className="rounded text-blue-600 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Màu chữ cái đầu
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={
                    overrides.intro?.initialLetterColor ||
                    edConfig.typography.initialLetterColor ||
                    '#8b261d'
                  }
                  onChange={(e) =>
                    updateOverride('intro', {
                      initialLetterColor: e.target.value,
                    })
                  }
                  className="w-6 h-6 rounded border border-stone-300 p-0.5 bg-white cursor-pointer"
                />
                <span className="text-xs font-mono text-stone-600 uppercase">
                  {overrides.intro?.initialLetterColor ||
                    edConfig.typography.initialLetterColor ||
                    '#8b261d'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Nhấn đậm đoạn mở đầu
              </span>
              <input
                type="checkbox"
                checked={
                  overrides.intro?.firstParagraphHighlight ??
                  edConfig.typography.firstParagraphHighlight ??
                  false
                }
                onChange={(e) =>
                  updateOverride('intro', {
                    firstParagraphHighlight: e.target.checked,
                  })
                }
                className="rounded text-blue-600 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Thụt đầu dòng đoạn văn
              </span>
              <input
                type="checkbox"
                checked={
                  overrides.intro?.paragraphIndent ??
                  edConfig.typography.paragraphIndent ??
                  false
                }
                onChange={(e) =>
                  updateOverride('intro', {
                    paragraphIndent: e.target.checked,
                  })
                }
                className="rounded text-blue-600 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Cỡ chữ riêng (px)
              </span>
              <input
                type="number"
                min={12}
                max={24}
                value={
                  overrides.intro?.fontSizePx ||
                  edConfig.typography.bodyFontSizePx ||
                  16
                }
                onChange={(e) =>
                  updateOverride('intro', {
                    fontSizePx: Number(e.target.value) || 16,
                  })
                }
                className="w-20 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Ô TIÊU ĐỀ CHƯƠNG (MAIN_HEADING) */}
      {subSelection.subType === EditorialSubElementType.MAIN_HEADING && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">
              Ghi đè riêng cho Ô Tiêu đề
            </span>
            {overrides.heading && (
              <button
                type="button"
                onClick={() => updateOverride('heading', undefined)}
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
                Số chương tự động & Tiêu đề phụ
              </label>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-serif font-bold text-stone-800 shrink-0">
                  {getChapterLabel(targetChapterIndex)}
                </span>
                <input
                  type="text"
                  value={targetChapter?.subtitle || ''}
                  onChange={(e) =>
                    updateTargetChapter({ subtitle: e.target.value })
                  }
                  placeholder="Tiêu đề phụ..."
                  className="flex-1 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Nội dung tiêu đề
              </label>
              <input
                type="text"
                value={targetChapter?.title || sc.title || ''}
                onChange={(e) =>
                  updateTargetChapter({ title: e.target.value })
                }
                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Phông chữ riêng cho tiêu đề này
              </label>
              <select
                value={overrides.heading?.fontFamily || ''}
                onChange={(e) =>
                  updateOverride('heading', {
                    fontFamily: e.target.value || undefined,
                  })
                }
                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              >
                {FONT_OVERRIDE_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Kiểu chữ hoa
              </span>
              <select
                value={
                  overrides.heading?.transform ||
                  edConfig.typography.headingTransform ||
                  'NONE'
                }
                onChange={(e) =>
                  updateOverride('heading', {
                    transform: e.target.value as 'NONE' | 'UPPERCASE',
                  })
                }
                className="w-32 text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
              >
                <option value="NONE">Bình thường</option>
                <option value="UPPERCASE">IN HOA TOÀN BỘ</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Màu chữ tiêu đề
              </span>
              <input
                type="color"
                value={overrides.heading?.color || '#0c0a09'}
                onChange={(e) =>
                  updateOverride('heading', { color: e.target.value })
                }
                className="w-7 h-7 rounded border border-stone-300 p-0.5 bg-white cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Ô VĂN BẢN CHÍNH (ARTICLE_TEXT) */}
      {subSelection.subType === EditorialSubElementType.ARTICLE_TEXT && (
        <div className="space-y-4">
          <div className="space-y-3 pb-3 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">
                Ghi đè riêng cho Ô Bài viết
              </span>
              {overrides.article && (
                <button
                  type="button"
                  onClick={() => updateOverride('article', undefined)}
                  className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Mặc định</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Số cột riêng của ô này
              </span>
              <div className="w-32 grid grid-cols-3 gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                {([1, 2, 3] as const).map((colNum) => {
                  const current =
                    overrides.article?.textColumns ||
                    edConfig.layout.textColumns ||
                    1;
                  return (
                    <button
                      key={colNum}
                      type="button"
                      onClick={() =>
                        updateOverride('article', { textColumns: colNum })
                      }
                      className={`py-1 text-xs font-bold rounded-md cursor-pointer ${
                        current === colNum
                          ? 'bg-white text-blue-600 border border-blue-500'
                          : 'text-stone-600'
                      }`}
                    >
                      {colNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-700">
                Bật Drop Cap cho đoạn đầu
              </span>
              <input
                type="checkbox"
                checked={Boolean(overrides.article?.dropCap)}
                onChange={(e) =>
                  updateOverride('article', { dropCap: e.target.checked })
                }
                className="rounded text-blue-600 w-4 h-4"
              />
            </div>
          </div>

          <TypographyInspectorPanel />
        </div>
      )}

      {/* 4. Ô HÌNH ẢNH CHÍNH (MAIN_IMAGE) */}
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

      {/* 5. Ô TRÍCH DẪN NỔI BẬT (PULL_QUOTE) */}
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

      {/* 6. MỤC DIỄN BIẾN PHỤ (SUB_CHAPTER) */}
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
    </div>
  );
}
