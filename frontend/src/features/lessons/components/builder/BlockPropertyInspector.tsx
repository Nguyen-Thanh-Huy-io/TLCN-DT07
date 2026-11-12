'use client';

import React from 'react';
import { Settings2, X, Trash2, FileText } from 'lucide-react';
import {
  CalloutBlockData,
  HeadingBlockData,
  LessonBlockItem,
  QuoteBlockData,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
  RowSectionBlockData,
  StoryChapterBlockData,
  TimelineBlockData,
} from '../../types/block-builder.types';
import { LessonBlockType } from '../../types/block-palette.types';
import { BLOCK_TYPE_ICONS } from './BlockLibraryPalette';
import { TypographyInspectorPanel } from './inspectors/TypographyInspectorPanel';
import { TimelineBlockInspector } from './inspectors/TimelineBlockInspector';
import { StoryChapterBlockInspector } from './inspectors/StoryChapterBlockInspector';
import { RowSectionBlockInspector } from './inspectors/RowSectionBlockInspector';
import {
  CalloutBlockInspector,
  HeadingBlockInspector,
  QuoteBlockInspector,
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

const BLOCK_TYPE_VI_LABELS: Record<string, string> = {
  [LessonBlockType.TEXT]: 'Văn bản',
  [LessonBlockType.HEADING]: 'Tiêu đề mục',
  [LessonBlockType.TIMELINE]: 'Dòng thời gian',
  [LessonBlockType.CALLOUT]: 'Hộp ghi chú',
  [LessonBlockType.QUOTE]: 'Trích dẫn',
  [LessonBlockType.IMAGE]: 'Hình ảnh',
  [LessonBlockType.VIDEO]: 'Phim tư liệu',
  [LessonBlockType.RESOURCE_LINK]: 'Tài liệu đính kèm',
  [LessonBlockType.CHARACTER]: 'Hồ sơ thực thể',
  [LessonBlockType.EVENT]: 'Thẻ sự kiện',
  [LessonBlockType.MAP]: 'Bản đồ lịch sử',
  [LessonBlockType.COMPARISON_TABLE]: 'Bảng so sánh',
  [LessonBlockType.QUIZ]: 'Câu hỏi trắc nghiệm',
  [LessonBlockType.RELATED_PEOPLE]: 'Nhân vật liên quan',
  [LessonBlockType.RELATED_EVENTS]: 'Sự kiện liên quan',
  [LessonBlockType.DIVIDER]: 'Đường phân cách',
  [LessonBlockType.SECTION_ROW]: 'Bố cục nhiều cột',
  [LessonBlockType.STORY_CHAPTER]: 'Chương truyện lịch sử',
};

type BlockInspectorStrategyMap = Partial<
  Record<
    LessonBlockType,
    (props: BlockPropertyInspectorProps & { block: LessonBlockItem }) => React.ReactNode
  >
>;

/**
 * Bảng đăng ký Strategy cho từng loại Khối (Tuân thủ Open/Closed Principle — OCP & SRP).
 * Khi thêm loại khối mới, chỉ cần đăng ký Inspector tương ứng mà không phình to Component vỏ.
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
  [LessonBlockType.STORY_CHAPTER]: ({ block, onUpdateBlock }) => (
    <StoryChapterBlockInspector
      block={block as StoryChapterBlockData}
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
  [LessonBlockType.QUOTE]: ({ block, onUpdateBlock }) => (
    <QuoteBlockInspector
      block={block as QuoteBlockData}
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
    onClose,
    className,
    compact,
  } = props;

  if (!block) {
    return (
      <aside className={className || "w-full bg-white border-l border-stone-200 p-6 flex flex-col items-center justify-center text-center text-stone-700 shrink-0 select-none"}>
        <span className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-3 text-white">
          <Settings2 className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <strong className="text-base font-bold text-stone-900">
          Thuộc tính khối
        </strong>
        <p className="text-xs text-stone-600 mt-1 max-w-[220px] leading-relaxed">
          Nhấp vào bất kỳ khối nào trên trang để tùy chỉnh thông số và định dạng riêng.
        </p>
      </aside>
    );
  }

  const isShowOnMobile = block.showOnMobile !== false;
  const BlockIcon = BLOCK_TYPE_ICONS[block.type] || FileText;
  const renderStrategy = BLOCK_INSPECTOR_STRATEGIES[block.type];

  return (
    <aside className={className || "w-full bg-white border-l border-stone-200 flex flex-col justify-between shrink-0 h-full overflow-y-auto select-none"}>
      <div className="p-4 space-y-4">
        {/* Header Inspector */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-stone-900 tracking-tight">
              Thuộc tính khối
            </span>
            <Settings2 className="w-4 h-4 text-stone-700" strokeWidth={1.75} />
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-stone-700 hover:text-stone-950 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Định danh khối đang chọn */}
        <div className="pb-3 border-b border-stone-200 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <BlockIcon className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-stone-900 truncate">
              {BLOCK_TYPE_VI_LABELS[block.type] || 'Khối nội dung'}
            </div>
            <div className="text-xs text-stone-600">
              {blockIndex !== undefined
                ? `Khối #${blockIndex + 1}`
                : `Mã: ${block.id.slice(0, 8)}`}
            </div>
          </div>
        </div>

        {/* Nội dung Inspector ủy quyền qua Strategy Registry */}
        <div>
          {renderStrategy ? (
            renderStrategy({ ...props, block })
          ) : (
            <p className="text-base text-stone-700 leading-relaxed">
              Khối{' '}
              <strong>{BLOCK_TYPE_VI_LABELS[block.type] || 'Nội dung'}</strong>{' '}
              đang được chọn. Bạn có thể chỉnh sửa trực tiếp trên trang tài liệu
              ở giữa.
            </p>
          )}
        </div>

        {!compact && (
          <div className="flex items-center justify-between py-3 border-t border-b border-stone-200">
            <span className="text-sm font-medium text-stone-800">
              Hiển thị trên di động
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateBlock(block.id, { showOnMobile: !isShowOnMobile })
              }
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                isShowOnMobile ? 'bg-stone-900' : 'bg-stone-300'
              }`}
            >
              <span
                className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                  isShowOnMobile ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Footer Inspector: Nút Xóa khối */}
      <div className="p-4 border-t border-stone-200">
        <button
          type="button"
          onClick={() => onRemoveBlock(block.id)}
          className="text-sm font-semibold text-rose-700 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa khối này</span>
        </button>
      </div>
    </aside>
  );
}
