'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, Clock, GripVertical, Plus, X } from 'lucide-react';
import { MatchingItem, MatchingPair, OrderingItem, generateQuizId } from '@/features/lessons/types/editor.types';

export interface MatchingPairsValue {
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  correctPairs: MatchingPair[];
}

export interface MatchingPairsEditorProps {
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  correctPairs: MatchingPair[];
  onChange: (next: MatchingPairsValue) => void;
  compact?: boolean;
  onError?: (msg: string) => void;
}

interface AlignedPairRow {
  leftId: string;
  leftLabel: string;
  rightId: string;
  rightLabel: string;
}

/**
 * Component soạn thảo câu hỏi Ghép nối cặp (MATCHING) tái sử dụng dùng chung
 * cho cả Ngân hàng câu hỏi (`QuestionBankModal`) và Trình soạn thảo Quiz bài học (`MatchingEditor`).
 * Giáo viên nhập trực tiếp từng cặp tương ứng (Vế A ↔ Vế B) trên cùng 1 hàng,
 * hệ thống tự động sinh `leftItems`, `rightItems`, `correctPairs` và xáo trộn cột Vế B khi học sinh làm bài.
 */
export function MatchingPairsEditor({
  leftItems,
  rightItems,
  correctPairs,
  onChange,
  compact = false,
  onError,
}: MatchingPairsEditorProps) {
  // Chuẩn hóa danh sách hàng cặp tương ứng từ leftItems, rightItems & correctPairs
  const rows: AlignedPairRow[] = useMemo(() => {
    const rightById = new Map(rightItems.map((r) => [r.id, r]));
    const pairByLeftId = new Map(correctPairs.map((p) => [p.leftId, p.rightId]));

    return leftItems.map((left, idx) => {
      const matchedRightId = pairByLeftId.get(left.id);
      const rightItem =
        (matchedRightId ? rightById.get(matchedRightId) : undefined) ||
        rightItems[idx] || {
          id: generateQuizId('r'),
          label: '',
        };

      return {
        leftId: left.id,
        leftLabel: left.label,
        rightId: rightItem.id,
        rightLabel: rightItem.label,
      };
    });
  }, [leftItems, rightItems, correctPairs]);

  const emitRows = (nextRows: AlignedPairRow[]) => {
    onChange({
      leftItems: nextRows.map((r) => ({ id: r.leftId, label: r.leftLabel })),
      rightItems: nextRows.map((r) => ({ id: r.rightId, label: r.rightLabel })),
      correctPairs: nextRows.map((r) => ({ leftId: r.leftId, rightId: r.rightId })),
    });
  };

  const handleUpdateLeft = (idx: number, leftLabel: string) => {
    emitRows(rows.map((r, i) => (i === idx ? { ...r, leftLabel } : r)));
  };

  const handleUpdateRight = (idx: number, rightLabel: string) => {
    emitRows(rows.map((r, i) => (i === idx ? { ...r, rightLabel } : r)));
  };

  const handleAddPair = () => {
    emitRows([
      ...rows,
      {
        leftId: generateQuizId('l'),
        leftLabel: '',
        rightId: generateQuizId('r'),
        rightLabel: '',
      },
    ]);
  };

  const handleRemovePair = (idx: number) => {
    if (rows.length <= 2) {
      const msg = 'Câu hỏi ghép nối cần tối thiểu 2 cặp thông tin.';
      if (onError) onError(msg);
      else alert(msg);
      return;
    }
    emitRows(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-bold text-slate-800">
            Các cặp thông tin ghép nối
          </label>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <ArrowLeftRight size={12} />
            <span>{rows.length} cặp ghép nối</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-400">
          Nhập mỗi hàng là <strong>1 cặp đúng Vế A ↔ Vế B</strong> — hệ thống tự xáo trộn Vế B khi làm bài
        </span>
      </div>

      {/* Column Headers */}
      <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_1fr_auto] gap-2.5 px-3 text-[11px] font-semibold text-slate-500">
        <span className="w-14">Thứ tự</span>
        <span>Vế A · Sự kiện, Nhân vật, Mốc thời gian</span>
        <span className="w-6 text-center" />
        <span>Vế B tương ứng · Ý nghĩa, Vai trò, Kết quả</span>
        <span className="w-7" />
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={row.leftId}
            className={`grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all ${
              compact ? 'p-2' : 'p-2.5'
            }`}
          >
            {/* Pair Badge */}
            <span
              className={`inline-flex items-center justify-center rounded-lg font-bold text-xs shrink-0 bg-violet-100 text-violet-800 border border-violet-200 ${
                compact ? 'px-2 py-0.5' : 'px-2.5 py-1 w-14'
              }`}
            >
              {compact ? `#${idx + 1}` : `Cặp ${idx + 1}`}
            </span>

            {/* Left Input (Vế A) */}
            <input
              type="text"
              value={row.leftLabel}
              onChange={(e) => handleUpdateLeft(idx, e.target.value)}
              placeholder={`Nội dung Vế A #${idx + 1}, ví dụ: Đêm 18/12/1972...`}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />

            {/* Connector Icon */}
            <span className="hidden sm:flex items-center justify-center w-6 text-violet-600 font-bold">
              <ArrowLeftRight size={15} />
            </span>

            {/* Right Input (Vế B) */}
            <input
              type="text"
              value={row.rightLabel}
              onChange={(e) => handleUpdateRight(idx, e.target.value)}
              placeholder={`Nội dung Vế B khớp Cặp ${idx + 1}, ví dụ: Bắn rơi tại chỗ siêu pháo đài bay B-52...`}
              className="w-full text-xs sm:text-sm px-2.5 py-1.5 bg-emerald-50/30 border border-emerald-200/80 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
            />

            {/* Delete Pair Button */}
            <button
              type="button"
              onClick={() => handleRemovePair(idx)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer justify-self-end"
              title="Xóa cặp ghép nối này"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddPair}
        className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
      >
        <Plus size={14} />
        <span>Thêm cặp ghép nối</span>
      </button>
    </div>
  );
}

// --- Merged from TimelineOrderingItemsEditor.tsx ---
export interface TimelineOrderingItemsEditorProps {
  items: OrderingItem[];
  onChange: (nextItems: OrderingItem[]) => void;
  compact?: boolean;
  onError?: (msg: string) => void;
}

export function TimelineOrderingItemsEditor({
  items,
  onChange,
  compact = false,
  onError,
}: TimelineOrderingItemsEditorProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleUpdateLabel = (itemId: string, label: string) => {
    onChange(items.map((item) => (item.id === itemId ? { ...item, label } : item)));
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length || fromIdx === toIdx) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  };

  const handleAddItem = () => {
    onChange([...items, { id: generateQuizId('item'), label: '' }]);
  };

  const handleRemoveItem = (itemId: string) => {
    if (items.length <= 2) {
      const msg = 'Câu hỏi sắp xếp dòng thời gian cần tối thiểu 2 mốc sự kiện.';
      if (onError) onError(msg);
      else alert(msg);
      return;
    }
    onChange(items.filter((item) => item.id !== itemId));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-bold text-slate-800">
            Các mốc sự kiện theo dòng thời gian
          </label>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            <span>{items.length} mốc sự kiện</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Nhập hoặc <strong>kéo thả / bấm ▲▼</strong> theo đúng thứ tự thời gian từ trước đến sau
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const isDragging = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx && draggedIdx !== idx;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverIdx !== idx) setDragOverIdx(idx);
              }}
              onDragLeave={() => {
                if (dragOverIdx === idx) setDragOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIdx !== null && draggedIdx !== idx) handleMoveItem(draggedIdx, idx);
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              className={`flex items-center gap-2.5 rounded-xl border transition-all ${compact ? 'p-2' : 'p-2.5'} ${
                isDragging
                  ? 'opacity-50 border-blue-400 bg-blue-50/30'
                  : isDragOver
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 shrink-0" title="Kéo thả để đổi thứ tự mốc thời gian">
                <GripVertical size={15} />
              </span>
              <span className={`inline-flex items-center justify-center rounded-lg font-bold text-xs shrink-0 bg-amber-100 text-amber-800 border border-amber-200 ${compact ? 'w-6 h-6' : 'px-2.5 py-1'}`}>
                {compact ? idx + 1 : `Mốc ${idx + 1}`}
              </span>
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleUpdateLabel(item.id, e.target.value)}
                placeholder={`Nội dung mốc sự kiện thứ ${idx + 1}, ví dụ: 18/12/1972 - Mỹ mở cuộc tập kích B-52...`}
                className="flex-1 text-xs sm:text-sm p-1 bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveItem(idx, idx - 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Đưa mốc này lên trước"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMoveItem(idx, idx + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Đưa mốc này xuống sau"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title="Xóa mốc sự kiện này"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
      >
        <Plus size={14} />
        <span>Thêm mốc sự kiện</span>
      </button>
    </div>
  );
}
