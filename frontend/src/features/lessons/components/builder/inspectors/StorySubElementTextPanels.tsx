'use client';

import { RotateCcw } from 'lucide-react';
import { getChapterLabel } from '../../../strategies/story-chapter-layout.strategy';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';
import type { StorySubElementInspectorProps } from './useStorySubElementInspector';
import type { StorySubElementInspectorFacade } from './useStorySubElementInspector';

export const FONT_OVERRIDE_OPTIONS = [
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

export function IntroTextPanel({ facade, subSelection, edConfig }: { facade: StorySubElementInspectorFacade } & Pick<StorySubElementInspectorProps, 'subSelection' | 'edConfig'>) {
  const { overrides, updateOverride } = facade;
  return (
    <>
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
    </>
  );
}

export function MainHeadingPanel({ facade, block: sc, subSelection, edConfig }: { facade: StorySubElementInspectorFacade } & Pick<StorySubElementInspectorProps, 'block' | 'subSelection' | 'edConfig'>) {
  const { targetChapterIndex, targetChapter, overrides, updateTargetChapter, updateOverride } = facade;
  return (
    <>
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
    </>
  );
}

export function ArticleTextPanel({ facade, subSelection, edConfig }: { facade: StorySubElementInspectorFacade } & Pick<StorySubElementInspectorProps, 'subSelection' | 'edConfig'>) {
  const { overrides, updateOverride } = facade;
  return (
    <>
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
    </>
  );
}
