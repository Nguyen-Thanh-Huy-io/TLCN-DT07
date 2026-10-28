'use client';

import { useState, useCallback, useMemo } from 'react';
import { LessonBlockType } from '../types/block-palette.types';
import {
  LessonBlockItem,
  ResourceLinkBlockData,
  RowSectionBlockData,
  TimelineBlockData,
  TimelineOrientation,
  SplitSide,
} from '../types/block-builder.types';
import { MoveDirection } from '../components/quiz/QuizQuestionEditors';
import { LessonBlockFactory, generateBlockId } from '../factories/lesson-block.factory';
import { RowLayoutStrategy } from '../strategies/row-layout.strategy';

export interface UseLessonBlockManagerReturn {
  blocks: LessonBlockItem[];
  setBlocks: React.Dispatch<React.SetStateAction<LessonBlockItem[]>>;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  addBlock: (type: LessonBlockType, targetIndex?: number) => string;
  updateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  moveBlockByDirection: (id: string, direction: MoveDirection | 'UP' | 'DOWN') => void;
  compileToHtml: () => string;
  compileToJson: () => LessonBlockItem[];
  loadFromContent: (content: any) => void;
  blockCount: number;

  // Tài nguyên/Liên kết tham khảo (quản lý riêng ở Panel Thuộc tính, luôn xuất ở cuối bài)
  resourceLinks: ResourceLinkBlockData[];
  addResourceLink: () => string;
  updateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  removeResourceLink: (id: string) => void;

  // Hỗ trợ Hàng nhiều cột (Row & Column Management)
  setRowColumnCount: (rowId: string, count: number) => void;
  setRowRatio: (rowId: string, widthPercents: number[]) => void;
  addBlockToColumn: (rowId: string, columnId: string, type: LessonBlockType, targetIndex?: number) => string;
  updateBlockInColumn: (rowId: string, columnId: string, blockId: string, updates: Partial<LessonBlockItem>) => void;
  removeBlockFromColumn: (rowId: string, columnId: string, blockId: string) => void;
  splitBlockIntoRow: (targetBlockId: string, droppedType: LessonBlockType, side: SplitSide | 'LEFT' | 'RIGHT') => void;
}

/**
 * Đảm bảo mọi khối (và khối con lồng trong cột của SECTION_ROW) có `id` DUY NHẤT.
 * Dữ liệu cũ lưu trước khi có validate id, hoặc dữ liệu import/ghép tay, có thể thiếu
 * `id` hoặc trùng `id` giữa 2 khối — React sẽ cảnh báo "unique key" khi render danh sách
 * (`key={block.id}` trong BlockBuilderCanvas) và có thể hiển thị/cập nhật sai khối.
 */
function ensureUniqueBlockIds(items: LessonBlockItem[], seen: Set<string> = new Set()): LessonBlockItem[] {
  return items.map((block) => {
    let id = block.id;
    if (!id || seen.has(id)) {
      id = generateBlockId(String(block.type || 'block').toLowerCase());
    }
    seen.add(id);

    if (block.type === LessonBlockType.SECTION_ROW) {
      const row = block as RowSectionBlockData;
      return {
        ...row,
        id,
        columns: row.columns.map((col) => ({
          ...col,
          blocks: ensureUniqueBlockIds(col.blocks, seen),
        })),
      };
    }
    return { ...block, id };
  });
}

function parseContentToBlocks(content: any): LessonBlockItem[] | null {
  if (Array.isArray(content) && content.length > 0) {
    return ensureUniqueBlockIds(content);
  }
  if (typeof content === 'string' && content.trim().length > 0) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return ensureUniqueBlockIds(parsed);
      }
    } catch {
      // Chuỗi HTML thông thường
    }
    return [
      {
        id: 'block_init_text',
        type: LessonBlockType.TEXT,
        content: content,
      },
    ];
  }
  return null;
}

/**
 * Tách khối "Tài nguyên/Liên kết tham khảo" (RESOURCE_LINK) ra khỏi danh sách khối thường.
 * Loại khối này không còn được chèn rời rạc trong canvas — được quản lý tập trung ở
 * Panel Thuộc tính (tab Xuất bản) và luôn xuất ra ở cuối bài học. Việc tách này cũng giúp
 * "di cư" tự động các bài học cũ từng chèn RESOURCE_LINK trực tiếp vào nội dung.
 */
function splitResourceLinks(
  items: LessonBlockItem[]
): { blocks: LessonBlockItem[]; resourceLinks: ResourceLinkBlockData[] } {
  const blocks: LessonBlockItem[] = [];
  const resourceLinks: ResourceLinkBlockData[] = [];
  for (const item of items) {
    if (item.type === LessonBlockType.RESOURCE_LINK) {
      resourceLinks.push(item as ResourceLinkBlockData);
    } else {
      blocks.push(item);
    }
  }
  return { blocks, resourceLinks };
}

export function useLessonBlockManager(initialContent?: any): UseLessonBlockManagerReturn {
  // Phân tích dữ liệu khởi tạo (hỗ trợ cả JSON Array lẫn HTML String)
  const initialSplit = useMemo<{ blocks: LessonBlockItem[]; resourceLinks: ResourceLinkBlockData[] }>(() => {
    const parsed = parseContentToBlocks(initialContent);
    if (parsed) return splitResourceLinks(parsed);

    // Mặc định tạo 1 khối văn bản giới thiệu
    return {
      blocks: [
        {
          id: 'block_default_text',
          type: LessonBlockType.TEXT,
          content: `
            <h2>1. Bối cảnh lịch sử</h2>
            <p>Cuộc kháng chiến chống thực dân Pháp của nhân dân Việt Nam bước sang giai đoạn quyết định. Dưới sự lãnh đạo sáng suốt, quân và dân ta kiên cường chuẩn bị mọi điều kiện cho trận quyết chiến chiến lược.</p>
          `,
        },
        // Dùng id/dữ liệu cố định (không gọi generateBlockId/Date.now()) vì khối này được
        // tạo ngay trong lần render đầu tiên (cả SSR và lần render đầu phía client) — nếu
        // dùng id phụ thuộc thời gian thì server/client sẽ ra 2 giá trị khác nhau, gây lỗi
        // hydration mismatch (React không patch được, phải render lại toàn bộ cây con).
        {
          id: 'block_default_timeline',
          type: LessonBlockType.TIMELINE,
          title: 'Timeline — Dòng thời gian',
          subtitle: 'Các mốc lịch sử tiêu biểu',
          orientation: TimelineOrientation.VERTICAL,
          nodes: [
            {
              id: 'node_1',
              year: '1945',
              title: 'Tuyên bố độc lập',
              description: 'Sự kiện đánh dấu bước ngoặt lịch sử mở ra kỷ nguyên mới.',
            },
            {
              id: 'node_2',
              year: '1954',
              title: 'Chiến thắng Điện Biên Phủ',
              description: 'Mốc son chấn động địa cầu, kết thúc thắng lợi cuộc kháng chiến chống Pháp.',
            },
          ],
        } as TimelineBlockData,
      ],
      resourceLinks: [],
    };
  }, []);

  const [blocks, setBlocks] = useState<LessonBlockItem[]>(initialSplit.blocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(initialSplit.blocks[0]?.id || null);
  const [resourceLinks, setResourceLinks] = useState<ResourceLinkBlockData[]>(initialSplit.resourceLinks);

  // Nạp lại blocks từ nội dung truyền vào (ví dụ nạp từ Template hoặc API)
  const loadFromContent = useCallback((content: any) => {
    const parsed = parseContentToBlocks(content);
    if (parsed && parsed.length > 0) {
      const split = splitResourceLinks(parsed);
      setBlocks(split.blocks);
      setResourceLinks(split.resourceLinks);
      setActiveBlockId(split.blocks[0]?.id || null);
    }
  }, []);

  // Thêm một liên kết tài nguyên tham khảo mới (luôn hiển thị ở cuối bài học)
  const addResourceLink = useCallback((): string => {
    const newLink = LessonBlockFactory.createDefaultBlock(LessonBlockType.RESOURCE_LINK) as ResourceLinkBlockData;
    setResourceLinks((prev) => [...prev, newLink]);
    return newLink.id;
  }, []);

  // Cập nhật một liên kết tài nguyên
  const updateResourceLink = useCallback((id: string, updates: Partial<ResourceLinkBlockData>) => {
    setResourceLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...updates } : link)));
  }, []);

  // Xóa một liên kết tài nguyên
  const removeResourceLink = useCallback((id: string) => {
    setResourceLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  // Thêm khối mới (vào vị trí targetIndex hoặc cuối danh sách)
  const addBlock = useCallback((type: LessonBlockType, targetIndex?: number): string => {
    const newBlock = LessonBlockFactory.createDefaultBlock(type);

    setBlocks((prev) => {
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= prev.length) {
        const copy = [...prev];
        copy.splice(targetIndex, 0, newBlock);
        return copy;
      }
      return [...prev, newBlock];
    });

    setActiveBlockId(newBlock.id);
    return newBlock.id;
  }, []);

  // Cập nhật nội dung một khối
  const updateBlock = useCallback((id: string, updates: Partial<LessonBlockItem>) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? ({ ...block, ...updates } as LessonBlockItem) : block))
    );
  }, []);

  // Xóa một khối
  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) {
        alert('Bài học cần có ít nhất một khối nội dung.');
        return prev;
      }
      return prev.filter((b) => b.id !== id);
    });
  }, []);

  // Di chuyển khối theo chỉ số
  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const copy = [...prev];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedItem);
      return copy;
    });
  }, []);

  // Di chuyển khối Lên / Xuống
  const moveBlockByDirection = useCallback(
    (id: string, direction: MoveDirection | 'UP' | 'DOWN') => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx === -1) return;
      const targetIdx = direction === MoveDirection.UP ? idx - 1 : idx + 1;
      moveBlock(idx, targetIdx);
    },
    [blocks, moveBlock]
  );

  // Xuất HTML toàn bài học cho Chế độ Xem trước và học sinh
  // (Liên kết tài nguyên tham khảo luôn được nối vào cuối cùng, sau toàn bộ nội dung)
  const compileToHtml = useCallback((): string => {
    return [...blocks, ...resourceLinks].map((b) => LessonBlockFactory.blockToHtml(b)).join('\n');
  }, [blocks, resourceLinks]);

  // Xuất cấu trúc JSON (gộp lại resourceLinks ở cuối để lưu đồng bộ cùng content)
  const compileToJson = useCallback((): LessonBlockItem[] => {
    return [...blocks, ...resourceLinks];
  }, [blocks, resourceLinks]);

  // Cập nhật số lượng cột cho Hàng (1, 2, 3, 4)
  const setRowColumnCount = useCallback((rowId: string, count: number) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== rowId || block.type !== LessonBlockType.SECTION_ROW) return block;
        const row = block as RowSectionBlockData;
        const targetCount = Math.max(1, Math.min(4, count));
        if (row.columnCount === targetCount) return block;

        const newWidths = RowLayoutStrategy.distributeEqualWidths(targetCount);
        let newColumns = [...row.columns];

        if (targetCount > row.columns.length) {
          // Thêm cột mới
          while (newColumns.length < targetCount) {
            const colId = generateBlockId('col');
            newColumns.push({
              id: colId,
              widthPercent: newWidths[newColumns.length] || 25,
              blocks: [],
            });
          }
        } else if (targetCount < row.columns.length) {
          // Giảm số cột: gộp khối từ các cột thừa vào cột cuối cùng còn lại
          const keptColumns = newColumns.slice(0, targetCount);
          const removedColumns = newColumns.slice(targetCount);
          const orphanedBlocks = removedColumns.flatMap((c) => c.blocks);
          if (orphanedBlocks.length > 0 && keptColumns.length > 0) {
            keptColumns[keptColumns.length - 1].blocks = [
              ...keptColumns[keptColumns.length - 1].blocks,
              ...orphanedBlocks,
            ];
          }
          newColumns = keptColumns;
        }

        // Cập nhật lại widthPercent cho từng cột
        newColumns = newColumns.map((col, idx) => ({
          ...col,
          widthPercent: newWidths[idx] || 100,
        }));

        return {
          ...row,
          columnCount: targetCount,
          columns: newColumns,
        };
      })
    );
  }, []);

  // Cập nhật tỷ lệ phần trăm các cột theo preset hoặc kéo resizer
  const setRowRatio = useCallback((rowId: string, widthPercents: number[]) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== rowId || block.type !== LessonBlockType.SECTION_ROW) return block;
        const row = block as RowSectionBlockData;
        const updatedCols = row.columns.map((col, idx) => ({
          ...col,
          widthPercent: widthPercents[idx] ?? col.widthPercent,
        }));
        return {
          ...row,
          columns: updatedCols,
        };
      })
    );
  }, []);

  // Thêm khối con vào một cột cụ thể
  const addBlockToColumn = useCallback(
    (rowId: string, columnId: string, type: LessonBlockType, targetIndex?: number): string => {
      const newChild = LessonBlockFactory.createDefaultBlock(type);
      setBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== rowId || block.type !== LessonBlockType.SECTION_ROW) return block;
          const row = block as RowSectionBlockData;
          const updatedColumns = row.columns.map((col) => {
            if (col.id !== columnId) return col;
            const childList = [...col.blocks];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= childList.length) {
              childList.splice(targetIndex, 0, newChild);
            } else {
              childList.push(newChild);
            }
            return { ...col, blocks: childList };
          });
          return { ...row, columns: updatedColumns };
        })
      );
      setActiveBlockId(newChild.id);
      return newChild.id;
    },
    []
  );

  // Cập nhật khối con bên trong một cột
  const updateBlockInColumn = useCallback(
    (rowId: string, columnId: string, blockId: string, updates: Partial<LessonBlockItem>) => {
      setBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== rowId || block.type !== LessonBlockType.SECTION_ROW) return block;
          const row = block as RowSectionBlockData;
          const updatedColumns = row.columns.map((col) => {
            if (col.id !== columnId) return col;
            const childList = col.blocks.map((b) =>
              b.id === blockId ? ({ ...b, ...updates } as LessonBlockItem) : b
            );
            return { ...col, blocks: childList };
          });
          return { ...row, columns: updatedColumns };
        })
      );
    },
    []
  );

  // Xóa khối con khỏi một cột
  const removeBlockFromColumn = useCallback((rowId: string, columnId: string, blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== rowId || block.type !== LessonBlockType.SECTION_ROW) return block;
        const row = block as RowSectionBlockData;
        const updatedColumns = row.columns.map((col) => {
          if (col.id !== columnId) return col;
          return { ...col, blocks: col.blocks.filter((b) => b.id !== blockId) };
        });
        return { ...row, columns: updatedColumns };
      })
    );
  }, []);

  // Tách một khối thành Hàng 2 Cột khi kéo thả vào mép trái / mép phải (Side-by-side split)
  const splitBlockIntoRow = useCallback(
    (targetBlockId: string, droppedType: LessonBlockType, side: SplitSide | 'LEFT' | 'RIGHT') => {
      setBlocks((prev) => {
        const targetIdx = prev.findIndex((b) => b.id === targetBlockId);
        if (targetIdx === -1) return prev;

        const targetBlock = prev[targetIdx];
        const newBlock = LessonBlockFactory.createDefaultBlock(droppedType);

        const col1Id = generateBlockId('col');
        const col2Id = generateBlockId('col');

        const leftBlock = side === SplitSide.LEFT ? newBlock : targetBlock;
        const rightBlock = side === SplitSide.LEFT ? targetBlock : newBlock;

        const rowSectionBlock: RowSectionBlockData = {
          id: generateBlockId('section_row'),
          type: LessonBlockType.SECTION_ROW,
          columnCount: 2,
          columns: [
            {
              id: col1Id,
              widthPercent: 50,
              blocks: [leftBlock],
            },
            {
              id: col2Id,
              widthPercent: 50,
              blocks: [rightBlock],
            },
          ],
        };

        const copy = [...prev];
        copy[targetIdx] = rowSectionBlock;
        return copy;
      });
    },
    []
  );

  return {
    blocks,
    setBlocks,
    activeBlockId,
    setActiveBlockId,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    moveBlockByDirection,
    compileToHtml,
    compileToJson,
    loadFromContent,
    blockCount: blocks.length,
    resourceLinks,
    addResourceLink,
    updateResourceLink,
    removeResourceLink,
    setRowColumnCount,
    setRowRatio,
    addBlockToColumn,
    updateBlockInColumn,
    removeBlockFromColumn,
    splitBlockIntoRow,
  };
}
