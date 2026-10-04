'use client';
import React from 'react';
import { AnyCurriculumNode } from '@/types/models/curriculum-tree.type';
import {
  NodeDetailStrategyFactory,
  DetailStrategyCallbacks,
} from '../strategies/node-detail.strategy';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

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
      <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[420px] shadow-sm">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
          <Icon name={IconName.FOLDER} size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Chưa chọn mục nào
        </h3>
        <p className="text-xs text-slate-600 font-medium mt-1.5 max-w-sm leading-relaxed">
          Nhấp vào một Giai đoạn, Chủ đề hoặc Bài học ở cây phân cấp bên trái để xem thông tin chi tiết và thao tác quản lý.
        </p>
      </div>
    );
  }

  const strategy = NodeDetailStrategyFactory.create(selectedNode);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col h-full shadow-sm">
      {/* Ancestor Trail Breadcrumb */}
      {ancestors.length > 0 && (
        <div className="ancestor-trail flex items-center gap-1.5 text-xs text-slate-600 mb-3 pb-2 border-b border-slate-100 flex-wrap">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1">
            Vị trí:
          </span>
          {ancestors.map((item, index) => {
            const isLast = index === ancestors.length - 1;
            return (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
                )}
                <button
                  type="button"
                  className={`text-xs hover:text-blue-700 transition-colors flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                    isLast
                      ? 'font-bold text-blue-900 bg-blue-50/90 border border-blue-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  onClick={() => !isLast && callbacks.onSelectNode(item)}
                >
                  <Icon
                    name={
                      item.type === 'PERIOD'
                        ? IconName.CLOCK
                        : item.type === 'TOPIC'
                        ? IconName.FOLDER
                        : IconName.BOOK
                    }
                    size={13}
                    className={isLast ? 'text-blue-700' : 'text-slate-500'}
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
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {strategy.renderChildList(callbacks)}
      </div>
      {strategy.renderActionButtons(callbacks)}
    </div>
  );
}
