'use client';

import React, { useState } from 'react';
import {
  CalloutBlockData,
  CharacterBlockData,
  ComparisonTableBlockData,
  EventBlockData,
  HeadingBlockData,
  ImageBlockData,
  LessonBlockItem,
  MapBlockData,
  QuizBlockData,
  QuoteBlockData,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
  RowSectionBlockData,
  TextBlockData,
  TimelineBlockData,
  VideoBlockData,
} from '../../types/block-builder.types';
import { LessonBlockType } from '../../types/editor.types';
import { LESSON_BLOCK_DRAG_MIME } from '../../constants/lesson.constants';
import { BlockWidthStrategy } from '../../strategies/row-layout.strategy';
import { AddBlockDivider } from './AddBlockDivider';
import { BlockCardWrapper } from './BlockCardWrapper';
import {
  CalloutBlockItemEditor,
  ComparisonTableBlockItemEditor,
  MapBlockItemEditor,
  QuoteBlockItemEditor,
  TextBlockEditor,
} from './BasicBlockItemEditors';
import { TimelineBlockItemEditor } from './TimelineBlockItemEditor';
import {
  CharacterBlockItemEditor,
  EventBlockItemEditor,
  ImageBlockItemEditor,
} from './RichBlockItemEditors';
import { RowSectionBlockEditor } from './RowSectionBlockEditor';
import { QuizBlockEditor } from './QuizBlockEditor';

type SharedBlockRenderer = (
  block: LessonBlockItem,
  onChange: (updates: Partial<LessonBlockItem>) => void
) => React.ReactNode;

const HEADING_LEVEL_CLASSES: Record<number, string> = {
  1: 'text-2xl font-serif font-bold text-stone-900',
  2: 'text-xl font-serif font-bold text-stone-900',
  3: 'text-base font-serif font-bold text-stone-800',
};

const SHARED_BLOCK_RENDERERS: Partial<Record<LessonBlockType, SharedBlockRenderer>> = {
  [LessonBlockType.TEXT]: (block, onChange) => (
    <TextBlockEditor
      content={(block as TextBlockData).content}
      onChange={(val) => onChange({ content: val })}
    />
  ),
  [LessonBlockType.HEADING]: (block, onChange) => {
    const heading = block as HeadingBlockData;
    const sizeClass = HEADING_LEVEL_CLASSES[heading.level] || HEADING_LEVEL_CLASSES[2];
    return (
      <input
        type="text"
        value={heading.text || ''}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Nhập tiêu đề phân mục..."
        className={`w-full bg-transparent border-0 focus:outline-none ${sizeClass}`}
      />
    );
  },
  [LessonBlockType.DIVIDER]: () => (
    <div className="py-2">
      <hr className="border-t border-stone-200" />
    </div>
  ),
  [LessonBlockType.TIMELINE]: (block, onChange) => (
    <TimelineBlockItemEditor data={block as TimelineBlockData} onChange={onChange} />
  ),
  [LessonBlockType.CHARACTER]: (block, onChange) => (
    <CharacterBlockItemEditor data={block as CharacterBlockData} onChange={onChange} />
  ),
  [LessonBlockType.EVENT]: (block, onChange) => (
    <EventBlockItemEditor data={block as EventBlockData} onChange={onChange} />
  ),
  [LessonBlockType.IMAGE]: (block, onChange) => (
    <ImageBlockItemEditor data={block as ImageBlockData} onChange={onChange} />
  ),
  [LessonBlockType.VIDEO]: (block, onChange) => {
    const video = block as VideoBlockData;
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={video.src || ''}
          onChange={(e) => onChange({ src: e.target.value })}
          placeholder="Nhập URL video YouTube / tư liệu..."
          className="w-full text-sm px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
        {video.src && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-xl mx-auto">
            <iframe src={video.src} title="Video" className="w-full h-full border-0" allowFullScreen />
          </div>
        )}
      </div>
    );
  },
  [LessonBlockType.MAP]: (block, onChange) => (
    <MapBlockItemEditor data={block as MapBlockData} onChange={onChange} />
  ),
  [LessonBlockType.COMPARISON_TABLE]: (block, onChange) => (
    <ComparisonTableBlockItemEditor data={block as ComparisonTableBlockData} onChange={onChange} />
  ),
  [LessonBlockType.CALLOUT]: (block, onChange) => (
    <CalloutBlockItemEditor data={block as CalloutBlockData} onChange={onChange} />
  ),
  [LessonBlockType.QUOTE]: (block, onChange) => (
    <QuoteBlockItemEditor data={block as QuoteBlockData} onChange={onChange} />
  ),
};

interface BlockBuilderCanvasProps {
  blocks: LessonBlockItem[];
  activeBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: LessonBlockType, atIndex: number) => void;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  onMoveByDirection: (id: string, direction: 'UP' | 'DOWN') => void;

  // Hỗ trợ Hàng nhiều cột (Row & Column Callbacks)
  onUpdateRowRatio?: (rowId: string, widths: number[]) => void;
  onChangeRowColumnCount?: (rowId: string, count: number) => void;
  onAddBlockToColumn?: (rowId: string, columnId: string, type: LessonBlockType, atIndex?: number) => void;
  onUpdateBlockInColumn?: (rowId: string, columnId: string, blockId: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveBlockFromColumn?: (rowId: string, columnId: string, blockId: string) => void;
  /** Chủ đề của bài học — khối Ôn tập dùng để lọc câu khi lấy từ Ngân hàng. */
  quizTopicId?: string;
}

export function BlockBuilderCanvas({
  blocks,
  activeBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  onMoveByDirection,
  onUpdateRowRatio,
  onChangeRowColumnCount,
  onAddBlockToColumn,
  onUpdateBlockInColumn,
  onRemoveBlockFromColumn,
  quizTopicId,
}: BlockBuilderCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDividerAddOrDrop = (type: LessonBlockType, atIndex: number) => {
    if (draggedIndex !== null) {
      const targetIndex = draggedIndex < atIndex ? atIndex - 1 : atIndex;
      onMoveBlock(draggedIndex, targetIndex);
      setDraggedIndex(null);
      return;
    }
    onAddBlock(type, atIndex);
  };

  const renderChildBlockContent = (rowId: string, colId: string, childBlock: LessonBlockItem) => {
    const renderer = SHARED_BLOCK_RENDERERS[childBlock.type];
    if (renderer) {
      return renderer(childBlock, (updates) =>
        onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)
      );
    }
    return (
      <div className="text-xs text-stone-500 italic p-2 bg-stone-50 rounded">
        Khối {childBlock.type}
      </div>
    );
  };

  const renderBlockContent = (block: LessonBlockItem) => {
    const sharedRenderer = SHARED_BLOCK_RENDERERS[block.type];
    if (sharedRenderer) {
      return sharedRenderer(block, (updates) => onUpdateBlock(block.id, updates));
    }

    switch (block.type) {
      case LessonBlockType.RELATED_PEOPLE: {
        const rel = block as RelatedPeopleBlockData;
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {rel.title || 'Nhân vật liên quan'}
              </h3>
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-blue-50 text-blue-800">
                DỮ LIỆU ĐỘNG
              </span>
            </div>
            <p className="text-sm text-stone-600 max-w-[65ch]">
              {rel.people?.length
                ? rel.people.map((p) => p.name).join(', ')
                : 'Tự động trích xuất danh sách nhân vật lịch sử liên kết từ đồ thị tri thức.'}
            </p>
          </div>
        );
      }
      case LessonBlockType.RELATED_EVENTS: {
        const relEv = block as RelatedEventsBlockData;
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {relEv.title || 'Sự kiện liên quan'}
              </h3>
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-blue-50 text-blue-800">
                DỮ LIỆU ĐỘNG
              </span>
            </div>
            <p className="text-sm text-stone-600 max-w-[65ch]">
              {relEv.events?.length
                ? relEv.events.map((ev) => `${ev.title} (${ev.year || ''})`).join(' · ')
                : 'Tự động hiển thị các sự kiện lịch sử có liên kết với thực thể này.'}
            </p>
          </div>
        );
      }
      case LessonBlockType.QUIZ:
        return (
          <QuizBlockEditor
            data={block as QuizBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
            topicId={quizTopicId}
          />
        );
      case LessonBlockType.SECTION_ROW:
        return (
          <RowSectionBlockEditor
            data={block as RowSectionBlockData}
            onUpdateRowRatio={(widths) => onUpdateRowRatio?.(block.id, widths)}
            onChangeColumnCount={(count) => onChangeRowColumnCount?.(block.id, count)}
            onAddBlockToColumn={(colId, type, atIndex) =>
              onAddBlockToColumn?.(block.id, colId, type, atIndex)
            }
            onUpdateBlockInColumn={(colId, childBlockId, updates) =>
              onUpdateBlockInColumn?.(block.id, colId, childBlockId, updates)
            }
            onRemoveBlockFromColumn={(colId, childBlockId) =>
              onRemoveBlockFromColumn?.(block.id, colId, childBlockId)
            }
            renderChildBlock={(childBlock, colId) =>
              renderChildBlockContent(block.id, colId, childBlock)
            }
          />
        );
      default:
        return (
          <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-500 italic">
            Khối nội dung {block.type}
          </div>
        );
    }
  };

  interface VisualRowItem {
    block: LessonBlockItem;
    globalIndex: number;
  }

  const visualRows: VisualRowItem[][] = [];
  let currentRow: VisualRowItem[] = [];
  let currentRowWidth = 0;

  blocks.forEach((block, idx) => {
    const fraction = BlockWidthStrategy.getWidthFraction(block.width);
    if (currentRow.length > 0 && currentRowWidth + fraction > 1.001) {
      visualRows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push({ block, globalIndex: idx });
    currentRowWidth += fraction;
    if (fraction >= 1.0) {
      visualRows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
  });
  if (currentRow.length > 0) {
    visualRows.push(currentRow);
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    const blockType = e.dataTransfer.getData(LESSON_BLOCK_DRAG_MIME) as LessonBlockType;
    if (!blockType) return;
    e.preventDefault();
    onAddBlock(blockType, blocks.length);
  };

  return (
    <div
      data-testid="block-builder-canvas"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(LESSON_BLOCK_DRAG_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={handleCanvasDrop}
      className="w-full min-h-[360px] space-y-2"
    >
      <AddBlockDivider
        insertIndex={0}
        onAddBlock={(type, atIndex) => handleDividerAddOrDrop(type, atIndex)}
      />

      {visualRows.map((row, rIdx) => {
        const lastBlockInRow = row[row.length - 1];
        const nextInsertIndex = lastBlockInRow.globalIndex + 1;

        return (
          <React.Fragment key={`row-${rIdx}`}>
            <div className="w-full flex flex-wrap gap-4 items-stretch">
              {row.map(({ block, globalIndex }) => (
                <BlockCardWrapper
                  key={block.id}
                  block={block}
                  index={globalIndex}
                  totalBlocks={blocks.length}
                  isSelected={activeBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onMoveUp={() => onMoveByDirection(block.id, 'UP')}
                  onMoveDown={() => onMoveByDirection(block.id, 'DOWN')}
                  onDelete={() => onRemoveBlock(block.id)}
                  onUpdateWidth={(w) => onUpdateBlock(block.id, { width: w })}
                  onDragStart={(e) => {
                    setDraggedIndex(globalIndex);
                    e.dataTransfer.setData('application/x-block-index', String(globalIndex));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  {renderBlockContent(block)}
                </BlockCardWrapper>
              ))}
            </div>

            <AddBlockDivider
              insertIndex={nextInsertIndex}
              onAddBlock={(type, atIndex) => handleDividerAddOrDrop(type, atIndex)}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
