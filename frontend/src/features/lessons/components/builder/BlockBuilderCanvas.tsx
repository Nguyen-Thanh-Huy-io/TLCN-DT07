'use client';

import React, { useState } from 'react';
import {
  LessonBlockItem,
  RowSectionBlockData,
  MapBlockData,
  ComparisonTableBlockData,
  CalloutBlockData,
  QuoteBlockData,
  HeadingBlockData,
  RelatedPeopleBlockData,
  RelatedEventsBlockData,
  StoryChapterBlockData,
} from '../../types/block-builder.types';
import { LessonBlockType } from '../../types/block-palette.types';
import { BlockWidthStrategy } from '../../strategies/block-width.strategy';
import { AddBlockDivider } from './AddBlockDivider';
import { BlockCardWrapper } from './BlockCardWrapper';
import { TextBlockEditor } from './TextBlockEditor';
import { TimelineBlockItemEditor } from './TimelineBlockItemEditor';
import { CharacterBlockItemEditor } from './CharacterBlockItemEditor';
import { EventBlockItemEditor } from './EventBlockItemEditor';
import { RowSectionBlockEditor } from './RowSectionBlockEditor';
import { MapBlockItemEditor } from './MapBlockItemEditor';
import { ComparisonTableBlockItemEditor } from './ComparisonTableBlockItemEditor';
import { CalloutBlockItemEditor } from './CalloutBlockItemEditor';
import { QuoteBlockItemEditor } from './QuoteBlockItemEditor';
import { StoryChapterBlockEditor } from './StoryChapterBlockEditor';
import { ImageBlockItemEditor } from './ImageBlockItemEditor';
import type { ImageBlockData } from '../../types/block-builder.types';

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
}: BlockBuilderCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDividerAddOrDrop = (type: LessonBlockType, atIndex: number) => {
    if (draggedIndex !== null) {
      let targetIndex = atIndex;
      if (draggedIndex < targetIndex) {
        targetIndex -= 1;
      }
      onMoveBlock(draggedIndex, targetIndex);
      setDraggedIndex(null);
      return;
    }

    onAddBlock(type, atIndex);
  };

  const renderBlockContent = (block: LessonBlockItem) => {
    switch (block.type) {
      case LessonBlockType.TEXT:
        return (
          <TextBlockEditor
            content={block.content}
            onChange={(val) => onUpdateBlock(block.id, { content: val })}
          />
        );

      case LessonBlockType.HEADING: {
        const heading = block as HeadingBlockData;
        const sizeClass =
          heading.level === 1
            ? 'text-2xl font-serif font-bold text-stone-900'
            : heading.level === 3
            ? 'text-base font-serif font-bold text-stone-800'
            : 'text-xl font-serif font-bold text-stone-900';
        return (
          <input
            type="text"
            value={heading.text || ''}
            onChange={(e) => onUpdateBlock(block.id, { text: e.target.value })}
            placeholder="Nhập tiêu đề phân mục..."
            className={`w-full bg-transparent border-0 focus:outline-none ${sizeClass}`}
          />
        );
      }

      case LessonBlockType.DIVIDER:
        return (
          <div className="py-2">
            <hr className="border-t border-stone-200" />
          </div>
        );

      case LessonBlockType.TIMELINE:
        return (
          <TimelineBlockItemEditor
            data={block}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

      case LessonBlockType.CHARACTER:
        return (
          <CharacterBlockItemEditor
            data={block}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

      case LessonBlockType.EVENT:
        return (
          <EventBlockItemEditor
            data={block}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

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

      case LessonBlockType.IMAGE:
        return (
          <ImageBlockItemEditor
            data={block as ImageBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

      case LessonBlockType.VIDEO:
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.src}
              onChange={(e) => onUpdateBlock(block.id, { src: e.target.value })}
              placeholder="Nhập URL video YouTube / tư liệu..."
              className="w-full text-sm px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
            {block.src && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-xl mx-auto">
                <iframe src={block.src} title="Video" className="w-full h-full border-0" allowFullScreen />
              </div>
            )}
          </div>
        );

      case LessonBlockType.MAP:
        return (
          <MapBlockItemEditor
            data={block as MapBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

      case LessonBlockType.COMPARISON_TABLE:
        return (
          <ComparisonTableBlockItemEditor
            data={block as ComparisonTableBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

      case LessonBlockType.CALLOUT:
        return (
          <CalloutBlockItemEditor
            data={block as CalloutBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
          />
        );

      case LessonBlockType.QUOTE:
        return (
          <QuoteBlockItemEditor
            data={block as QuoteBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
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

      case LessonBlockType.STORY_CHAPTER:
        return (
          <StoryChapterBlockEditor
            data={block as StoryChapterBlockData}
            onChange={(updates) => onUpdateBlock(block.id, updates)}
            renderNestedBlock={(childBlock, onUpdateChild) =>
              renderGenericChildBlock(childBlock, onUpdateChild)
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

  const renderGenericChildBlock = (
    childBlock: LessonBlockItem,
    onUpdateChild: (updates: Partial<LessonBlockItem>) => void
  ) => {
    switch (childBlock.type) {
      case LessonBlockType.TEXT:
        return (
          <TextBlockEditor
            content={childBlock.content}
            onChange={(val) => onUpdateChild({ content: val })}
          />
        );
      case LessonBlockType.CHARACTER:
        return (
          <CharacterBlockItemEditor
            data={childBlock}
            onChange={onUpdateChild}
          />
        );
      case LessonBlockType.EVENT:
        return (
          <EventBlockItemEditor
            data={childBlock}
            onChange={onUpdateChild}
          />
        );
      case LessonBlockType.IMAGE:
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={childBlock.src}
              onChange={(e) => onUpdateChild({ src: e.target.value })}
              placeholder="Đường dẫn hình ảnh tư liệu..."
              className="w-full text-sm px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
            {childBlock.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={childBlock.src}
                alt={childBlock.alt || 'Ảnh tư liệu'}
                className="max-h-48 rounded-lg object-contain"
              />
            )}
          </div>
        );
      case LessonBlockType.CALLOUT:
        return (
          <CalloutBlockItemEditor
            data={childBlock as CalloutBlockData}
            onChange={onUpdateChild}
          />
        );
      case LessonBlockType.QUOTE:
        return (
          <QuoteBlockItemEditor
            data={childBlock as QuoteBlockData}
            onChange={onUpdateChild}
          />
        );
      default:
        return (
          <div className="p-3 border border-dashed border-stone-300 rounded-lg text-xs text-stone-500 italic bg-stone-50">
            Khối nội dung con ({childBlock.type})
          </div>
        );
    }
  };

  const renderChildBlockContent = (
    rowId: string,
    colId: string,
    childBlock: LessonBlockItem
  ) => {
    switch (childBlock.type) {
      case LessonBlockType.TEXT:
        return (
          <TextBlockEditor
            content={childBlock.content}
            onChange={(val) =>
              onUpdateBlockInColumn?.(rowId, colId, childBlock.id, { content: val })
            }
          />
        );
      case LessonBlockType.CHARACTER:
        return (
          <CharacterBlockItemEditor
            data={childBlock}
            onChange={(updates) =>
              onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)
            }
          />
        );
      case LessonBlockType.EVENT:
        return (
          <EventBlockItemEditor
            data={childBlock}
            onChange={(updates) =>
              onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)
            }
          />
        );
      case LessonBlockType.TIMELINE:
        return (
          <TimelineBlockItemEditor
            data={childBlock}
            onChange={(updates) =>
              onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)
            }
          />
        );
      case LessonBlockType.IMAGE:
        return (
          <div className="space-y-1.5">
            <input
              type="text"
              value={childBlock.src}
              onChange={(e) =>
                onUpdateBlockInColumn?.(rowId, colId, childBlock.id, { src: e.target.value })
              }
              placeholder="URL hình ảnh..."
              className="w-full text-xs p-1.5 border border-stone-200 rounded-lg"
            />
            {childBlock.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={childBlock.src}
                alt={childBlock.alt || 'Ảnh'}
                className="max-h-36 rounded-lg object-contain mx-auto"
              />
            )}
          </div>
        );
      case LessonBlockType.MAP:
        return (
          <MapBlockItemEditor
            data={childBlock as MapBlockData}
            onChange={(updates) => onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)}
          />
        );
      case LessonBlockType.COMPARISON_TABLE:
        return (
          <ComparisonTableBlockItemEditor
            data={childBlock as ComparisonTableBlockData}
            onChange={(updates) => onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)}
          />
        );
      case LessonBlockType.CALLOUT:
        return (
          <CalloutBlockItemEditor
            data={childBlock as CalloutBlockData}
            onChange={(updates) => onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)}
          />
        );
      case LessonBlockType.QUOTE:
        return (
          <QuoteBlockItemEditor
            data={childBlock as QuoteBlockData}
            onChange={(updates) => onUpdateBlockInColumn?.(rowId, colId, childBlock.id, updates)}
          />
        );
      default:
        return (
          <div className="text-xs text-stone-500 italic p-2 bg-stone-50 rounded">
            Khối {childBlock.type}
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

  return (
    <div data-testid="block-builder-canvas" className="w-full space-y-2">
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
