'use client';
import React, { useState } from 'react';
import { HisgoStudioView } from '@/features/curriculum/components/HisgoStudioView';
import { CurriculumExplorer } from '@/features/curriculum/components/CurriculumExplorer';

export default function CurriculumPage() {
  const [viewMode, setViewMode] = useState<'STUDIO' | 'TOPIC_TREE'>('STUDIO');

  return (
    <div className="space-y-4">
      {/* Top Switcher giữa Studio Biên soạn Lộ trình và Cây Chủ đề Phân cấp */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-switch-studio"
            onClick={() => setViewMode('STUDIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'STUDIO'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            HISGO Studio &bull; Lộ trình &amp; Cấu trúc chương
          </button>
          <button
            type="button"
            id="btn-switch-tree"
            onClick={() => setViewMode('TOPIC_TREE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'TOPIC_TREE'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Cây phân cấp Chủ đề (Topic Tree)
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          Chế độ hiện tại: {viewMode === 'STUDIO' ? 'HISGO Studio 4 bước' : 'Cây danh mục'}
        </span>
      </div>

      {viewMode === 'STUDIO' ? <HisgoStudioView /> : <CurriculumExplorer />}
    </div>
  );
}
