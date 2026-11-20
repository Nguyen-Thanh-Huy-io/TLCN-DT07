'use client';

import React from 'react';
import { Settings2, Trash2, FileText } from 'lucide-react';
import {
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  InspectorFieldRow,
  InspectorToggleSwitch,
} from '@/components/common/TextStyleControls';
import {
  BlockWidthType,
  CalloutBlockData,
  HeadingBlockData,
  LessonBlockItem,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
  RowSectionBlockData,
  TimelineBlockData,
} from '../../types/block-builder.types';
import { LessonBlockType } from '../../types/editor.types';
import { BlockWidthStrategy } from '../../strategies/row-layout.strategy';
import { getBlockLabel } from '../../constants/lesson.constants';
import { BLOCK_TYPE_ICONS } from './BlockLibraryPalette';
import { TypographyInspectorPanel } from './inspectors/TypographyInspectorPanel';
import { TimelineBlockInspector } from './inspectors/TimelineBlockInspector';
import { RowSectionBlockInspector } from './inspectors/RowSectionBlockInspector';
import {
  CalloutBlockInspector,
  HeadingBlockInspector,
  RelatedEventsBlockInspector,
  RelatedPeopleBlockInspector,
} from './inspectors/SimpleBlockInspectors';

export interface BlockPropertyInspectorProps {
  block: LessonBlockItem | null;
  blockIndex?: number;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveBlock: (id: string) => void;
  onChangeRowColumnCount?: (rowId: string, count: number) => void;
  onUpdateRowRatio?: (rowId: string, widths: number[]) => void;
  onClose?: () => void;
  className?: string;
  compact?: boolean;
  accentColor?: string;
}

type BlockInspectorStrategyMap = Partial<
  Record<
    LessonBlockType,
    (props: BlockPropertyInspectorProps & { block: LessonBlockItem }) => React.ReactNode
  >
>;

/**
 * Bảng đăng ký Strategy cho từng loại Khối (Tuân thủ Open/Closed Principle — OCP & SRP).
 */
const BLOCK_INSPECTOR_STRATEGIES: BlockInspectorStrategyMap = {
  [LessonBlockType.TEXT]: ({ compact, accentColor }) => (
    <TypographyInspectorPanel compact={compact} accentColor={accentColor} />
  ),
  [LessonBlockType.TIMELINE]: ({ block, onUpdateBlock }) => (
    <TimelineBlockInspector
      block={block as TimelineBlockData}
      onUpdateBlock={onUpdateBlock}
    />
  ),
  [LessonBlockType.SECTION_ROW]: ({
    block,
    onUpdateBlock,
    onChangeRowColumnCount,
    onUpdateRowRatio,
  }) => (
    <RowSectionBlockInspector
      block={block as RowSectionBlockData}
      onUpdateBlock={onUpdateBlock}
      onChangeRowColumnCount={onChangeRowColumnCount}
      onUpdateRowRatio={onUpdateRowRatio}
    />
  ),
  [LessonBlockType.HEADING]: ({ block, onUpdateBlock, compact, accentColor }) =>
    compact ? (
      <TypographyInspectorPanel compact={compact} accentColor={accentColor} />
    ) : (
      <HeadingBlockInspector block={block as HeadingBlockData} onUpdateBlock={onUpdateBlock} />
    ),
  [LessonBlockType.CALLOUT]: ({ block, onUpdateBlock }) => (
    <CalloutBlockInspector
      block={block as CalloutBlockData}
      onUpdateBlock={onUpdateBlock}
    />
  ),
  [LessonBlockType.RELATED_PEOPLE]: ({ block, onUpdateBlock }) => (
    <RelatedPeopleBlockInspector
      block={block as RelatedPeopleBlockData}
      onUpdateBlock={onUpdateBlock}
    />
  ),
  [LessonBlockType.RELATED_EVENTS]: ({ block, onUpdateBlock }) => (
    <RelatedEventsBlockInspector
      block={block as RelatedEventsBlockData}
      onUpdateBlock={onUpdateBlock}
    />
  ),
};

export function BlockPropertyInspector(props: BlockPropertyInspectorProps) {
  const {
    block,
    blockIndex,
    onUpdateBlock,
    onRemoveBlock,
    className,
    compact,
  } = props;

  if (!block) {
    return (
      <aside className={className || 'w-full bg-white border-l border-slate-200 p-6 flex flex-col items-center justify-center text-center text-slate-600 shrink-0 select-none'}>
        <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
          <Settings2 className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <strong className="text-sm font-bold text-slate-800">
          Chưa chọn khối nào
        </strong>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
          Nhấp vào một khối trên trang để tùy chỉnh hình dáng, văn bản và bố cục.
        </p>
      </aside>
    );
  }

  const isShowOnMobile = block.showOnMobile !== false;
  const BlockIcon = BLOCK_TYPE_ICONS[block.type] || FileText;
  const renderStrategy = BLOCK_INSPECTOR_STRATEGIES[block.type];
  const availableWidths = BlockWidthStrategy.getAvailableWidths(block.type);
  const currentWidth = block.width || BlockWidthStrategy.getDefaultWidth(block.type);

  return (
    <aside className={className || 'w-full bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 h-full overflow-y-auto select-none'}>
      <div className="p-4 space-y-3.5 text-xs text-slate-700">
        {/* Định danh khối đang chọn */}
        <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <BlockIcon className="w-4 h-4" strokeWidth={1.85} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-slate-800 truncate">
              {getBlockLabel(block.type)}
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              {blockIndex !== undefined
                ? `Khối #${blockIndex + 1}`
                : `Mã: ${block.id.slice(0, 8)}`}
            </div>
          </div>
        </div>

        {/* Bộ chọn Tỉ lệ chiều rộng khối (chuẩn 2 cột ngang + Segmented Strip của Mindmap) */}
        {availableWidths.length > 1 && (
          <div className="pb-3 border-b border-slate-100">
            <InspectorFieldRow label="Độ rộng thẻ">
              <div className={`grid w-36 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
                {availableWidths.map((w: BlockWidthType) => {
                  const opt = BlockWidthStrategy.getWidthOption(w);
                  const active = currentWidth === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onUpdateBlock(block.id, { width: w })}
                      className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                        active ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
                      }`}
                    >
                      {opt.label.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </InspectorFieldRow>
          </div>
        )}

        {/* Nội dung Inspector ủy quyền qua Strategy Registry */}
        <div>
          {renderStrategy ? (
            renderStrategy({ ...props, block })
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              Nội dung của khối{' '}
              <strong className="text-slate-700">{getBlockLabel(block.type)}</strong>{' '}
              được chỉnh sửa trực tiếp ngay trên khung tài liệu ở giữa.
            </p>
          )}
        </div>

        {!compact && (
          <div className="pt-3 border-t border-slate-100">
            <InspectorFieldRow label="Hiển thị trên di động">
              <InspectorToggleSwitch
                ariaLabel="Hiển thị trên di động"
                checked={isShowOnMobile}
                onChange={(next) =>
                  onUpdateBlock(block.id, { showOnMobile: next })
                }
              />
            </InspectorFieldRow>
          </div>
        )}
      </div>

      {/* Footer Inspector: Nút Xóa khối */}
      <div className="px-4 py-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onRemoveBlock(block.id)}
          className="w-full py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-xs font-bold text-rose-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa khối này</span>
        </button>
      </div>
    </aside>
  );
}
