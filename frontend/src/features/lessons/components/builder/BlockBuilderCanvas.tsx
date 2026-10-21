'use client';

import React, { useState } from 'react';
import { LessonBlockItem, RowSectionBlockData } from '../../types/block-builder.types';
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
import { MapBlockData, ComparisonTableBlockData } from '../../types/block-builder.types';

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
    // Nếu là thao tác kéo thả sắp xếp khối đã có
    if (draggedIndex !== null) {
      let targetIndex = atIndex;
      if (draggedIndex < targetIndex) {
        targetIndex -= 1;
      }
      onMoveBlock(draggedIndex, targetIndex);
      setDraggedIndex(null);
      return;
    }

    // Nếu là thêm mới từ Menu hoặc Palette
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

      case LessonBlockType.IMAGE:
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.src}
              onChange={(e) => onUpdateBlock(block.id, { src: e.target.value })}
              placeholder="Nhập đường dẫn URL hình ảnh tư liệu..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {block.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.src}
                alt={block.alt || 'Ảnh bài học'}
                className="max-h-60 rounded-xl object-contain mx-auto border border-slate-100"
              />
            )}
            <input
              type="text"
              value={block.caption || ''}
              onChange={(e) => onUpdateBlock(block.id, { caption: e.target.value })}
              placeholder="Nhập chú thích cho hình ảnh (tùy chọn)..."
              className="w-full text-xs italic text-center text-slate-500 bg-transparent border-b border-slate-200 focus:outline-none py-1"
            />
          </div>
        );

      case LessonBlockType.VIDEO:
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.src}
              onChange={(e) => onUpdateBlock(block.id, { src: e.target.value })}
              placeholder="Nhập URL video YouTube / tư liệu..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {block.src && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden max-w-xl mx-auto">
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
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 italic">
            Khối nội dung {block.type}
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
              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg"
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
      default:
        return (
          <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">
            Khối {childBlock.type}
          </div>
        );
    }
  };

  // Tự động phân chia các khối thành các hàng hiển thị (Visual Rows) dựa trên thuộc tính width
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
    <div data-testid="block-builder-canvas" className="w-full space-y-1">
      {/* Vạch chèn trước khối đầu tiên */}
      <AddBlockDivider
        insertIndex={0}
        onAddBlock={(type, atIndex) => handleDividerAddOrDrop(type, atIndex)}
      />

      {visualRows.map((row, rIdx) => {
        const lastBlockInRow = row[row.length - 1];
        const nextInsertIndex = lastBlockInRow.globalIndex + 1;

        return (
          <React.Fragment key={`row-${rIdx}`}>
            <div className="w-full flex flex-wrap gap-3 items-stretch">
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

            {/* Vạch chèn giữa các hàng */}
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
