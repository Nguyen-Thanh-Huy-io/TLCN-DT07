'use client';

import { ArrowLeft } from 'lucide-react';
import { useStorySubElementInspector } from './useStorySubElementInspector';
import type { StorySubElementInspectorProps } from './useStorySubElementInspector';
import { IntroTextPanel, MainHeadingPanel, ArticleTextPanel } from './StorySubElementTextPanels';
import { MainImagePanel, PullQuotePanel, SubChapterPanel } from './StorySubElementMediaPanels';

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
  const facade = useStorySubElementInspector({ block: sc, subSelection, onUpdateBlock });

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
      <IntroTextPanel facade={facade} subSelection={subSelection} edConfig={edConfig} />

      {/* 2. Ô TIÊU ĐỀ CHƯƠNG (MAIN_HEADING) */}
      <MainHeadingPanel facade={facade} block={sc} subSelection={subSelection} edConfig={edConfig} />

      {/* 3. Ô VĂN BẢN CHÍNH (ARTICLE_TEXT) */}
      <ArticleTextPanel facade={facade} subSelection={subSelection} edConfig={edConfig} />

      {/* 4. Ô HÌNH ẢNH CHÍNH (MAIN_IMAGE) */}
      <MainImagePanel facade={facade} subSelection={subSelection} edConfig={edConfig} />

      {/* 5. Ô TRÍCH DẪN NỔI BẬT (PULL_QUOTE) */}
      <PullQuotePanel facade={facade} subSelection={subSelection} edConfig={edConfig} />

      {/* 6. MỤC DIỄN BIẾN PHỤ (SUB_CHAPTER) */}
      <SubChapterPanel block={sc} subSelection={subSelection} edConfig={edConfig} onUpdateBlock={onUpdateBlock} />
    </div>
  );
}
