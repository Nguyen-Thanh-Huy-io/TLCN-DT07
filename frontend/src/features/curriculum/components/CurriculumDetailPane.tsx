'use client';
import React from 'react';
import { AnyCurriculumNode, CurriculumNodeType } from '@/types/models/curriculum-tree.type';
import {
  NodeDetailStrategyFactory,
  DetailStrategyCallbacks,
} from '../strategies/node-detail.strategy';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

const BREADCRUMB_ICON_MAP: Record<CurriculumNodeType, IconName> = {
  [CurriculumNodeType.PERIOD]: IconName.CLOCK,
  [CurriculumNodeType.TOPIC]: IconName.FOLDER,
  [CurriculumNodeType.LESSON]: IconName.BOOK,
};

export interface CurriculumDetailPaneProps {
  selectedNode: AnyCurriculumNode | null;
  ancestors?: AnyCurriculumNode[];
  callbacks: DetailStrategyCallbacks;
}

export function CurriculumDetailPane({
  selectedNode,
  ancestors = [],
  callbacks,
}: CurriculumDetailPaneProps) {
  if (!selectedNode) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5">
          <Icon name={IconName.FOLDER} size={20} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Chưa chọn mục nào
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Chọn một giai đoạn, chủ đề hoặc bài học ở cây bên trái để xem và chỉnh sửa thông tin.
        </p>
      </div>
    );
  }

  const strategy = NodeDetailStrategyFactory.create(selectedNode);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col h-full">
      {/* Ancestor Trail Breadcrumb */}
      {ancestors.length > 0 && (
        <div className="ancestor-trail flex items-center gap-1 text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100 flex-wrap">
          {ancestors.map((item, index) => {
            const isLast = index === ancestors.length - 1;
            return (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <Icon
                    name={IconName.CHEVRON}
                    size={10}
                    className="text-slate-300"
                  />
                )}
                <button
                  type="button"
                  className={`text-xs transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded ${
                    isLast
                      ? 'font-semibold text-slate-900 bg-slate-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => !isLast && callbacks.onSelectNode(item)}
                >
                  <Icon
                    name={BREADCRUMB_ICON_MAP[item.type as CurriculumNodeType] || IconName.BOOK}
                    size={12}
                    className={isLast ? 'text-slate-900' : 'text-slate-400'}
                  />
                  <span>{item.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {strategy.renderHeader()}
      {strategy.renderOverview()}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {strategy.renderChildList(callbacks)}
      </div>
      {strategy.renderActionButtons(callbacks)}
    </div>
  );
}
