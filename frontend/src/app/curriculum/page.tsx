'use client';
import React, { useState } from 'react';
import { HisgoStudioView } from '@/features/curriculum/components/HisgoStudioView';
import { CurriculumExplorer } from '@/features/curriculum/components/CurriculumExplorer';
import { CurriculumViewMode } from '@/constants/enums';

const VIEW_COMPONENTS: Record<CurriculumViewMode, React.ReactElement> = {
  [CurriculumViewMode.STUDIO]: <HisgoStudioView />,
  [CurriculumViewMode.TOPIC_TREE]: <CurriculumExplorer />,
};

const VIEW_MODE_LABELS: Record<CurriculumViewMode, string> = {
  [CurriculumViewMode.STUDIO]: 'HISGO Studio 4 bước',
  [CurriculumViewMode.TOPIC_TREE]: 'Cây danh mục',
};

const INACTIVE_TAB_CLASSES = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';

export default function CurriculumPage() {
  const [viewMode, setViewMode] = useState<CurriculumViewMode>(CurriculumViewMode.STUDIO);

  return (
    <div className="space-y-4">
      {/* Top Switcher giữa Studio Biên soạn Lộ trình và Cây Chủ đề Phân cấp */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-switch-studio"
            onClick={() => setViewMode(CurriculumViewMode.STUDIO)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === CurriculumViewMode.STUDIO
                ? 'bg-emerald-800 text-white shadow-2xs'
                : INACTIVE_TAB_CLASSES
            }`}
          >
            HISGO Studio &bull; Lộ trình &amp; Cấu trúc chương
          </button>
          <button
            type="button"
            id="btn-switch-tree"
            onClick={() => setViewMode(CurriculumViewMode.TOPIC_TREE)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === CurriculumViewMode.TOPIC_TREE
                ? 'bg-slate-900 text-white shadow-2xs'
                : INACTIVE_TAB_CLASSES
            }`}
          >
            Cây phân cấp Chủ đề (Topic Tree)
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          Chế độ hiện tại: {VIEW_MODE_LABELS[viewMode]}
        </span>
      </div>

      {VIEW_COMPONENTS[viewMode]}
    </div>
  );
}
