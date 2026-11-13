'use client';

import { CurriculumTreeFilter } from '@/constants/enums';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import { useCurriculumTree } from './useCurriculumTree';
import type { CurriculumTreeProps } from './useCurriculumTree';
import { CurriculumTreeHeader, CurriculumTreeContent } from './CurriculumTreeParts';

export type TreeFilterType = CurriculumTreeFilter;

export function CurriculumTree({
  data,
  selectedNode,
  onSelectNode,
  onAddTopic,
  onAddLesson,
}: CurriculumTreeProps) {
  const facade = useCurriculumTree({ data });

  return (
    <div className="curriculum-tree-card bg-white border border-slate-200 rounded-lg p-3 flex flex-col h-full">
      {/* Header with counts and expand/collapse */}
      <CurriculumTreeHeader facade={facade} />

      {/* Tree Content: Recursive Topic-Centric Nodes */}
      <CurriculumTreeContent facade={facade} selectedNode={selectedNode} onSelectNode={onSelectNode} onAddTopic={onAddTopic} onAddLesson={onAddLesson} />

      {/* Footer Quick Action: Thêm Chủ đề mới */}
      <div className="tree-footer pt-2 mt-2 border-t border-slate-100">
        <button
          type="button"
          className="w-full py-1.5 px-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => onAddTopic()}
        >
          <Icon name={IconName.PLUS} size={12} />
          <span>Thêm Chủ đề mới</span>
        </button>
      </div>
    </div>
  );
}

export type { CurriculumTreeProps } from './useCurriculumTree';
