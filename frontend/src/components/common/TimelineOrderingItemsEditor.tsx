'use client';

import React, { useState } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Plus, X, Clock } from 'lucide-react';
import { OrderingItem } from '@/features/lessons/types/quiz.types';
import { generateQuizId } from '@/features/lessons/factories/quiz-question.factory';

export interface TimelineOrderingItemsEditorProps {
  items: OrderingItem[];
  onChange: (nextItems: OrderingItem[]) => void;
  compact?: boolean;
  onError?: (msg: string) => void;
}

/**
 * Component soạn thảo câu hỏi Sắp xếp Dòng thời gian (ORDERING) tái sử dụng dùng chung
 * cho cả Ngân hàng câu hỏi (`QuestionBankModal`) và Trình soạn thảo Quiz bài học (`OrderingEditor`).
 * Hỗ trợ kéo thả trực tiếp (HTML5 Drag & Drop) và nút di chuyển Lên/Xuống.
 */
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
            Các mốc sự kiện theo dòng thời gian{' '}
            <span className="text-blue-600 font-normal">(Timeline Milestones)</span>
          </label>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            <span>{items.length} mốc sự kiện</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-400">
          Nhập hoặc <strong>kéo thả / bấm ▲▼</strong> theo đúng thứ tự thời gian thật (từ trước đến sau)
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
                if (draggedIdx !== null && draggedIdx !== idx) {
                  handleMoveItem(draggedIdx, idx);
                }
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              className={`flex items-center gap-2.5 rounded-xl border transition-all ${
                compact ? 'p-2' : 'p-2.5'
              } ${
                isDragging
                  ? 'opacity-50 border-blue-400 bg-blue-50/30'
                  : isDragOver
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Drag Grip Handle */}
              <span
                className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 shrink-0"
                title="Kéo thả để đổi thứ tự mốc thời gian"
              >
                <GripVertical size={15} />
              </span>

              {/* Step Order Badge */}
              <span
                className={`inline-flex items-center justify-center rounded-lg font-bold text-xs shrink-0 bg-amber-100 text-amber-800 border border-amber-200 ${
                  compact ? 'w-6 h-6' : 'px-2.5 py-1'
                }`}
              >
                {compact ? idx + 1 : `Mốc ${idx + 1}`}
              </span>

              {/* Milestone Label Input */}
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleUpdateLabel(item.id, e.target.value)}
                placeholder={`Nội dung mốc sự kiện thứ ${idx + 1} (ví dụ: 18/12/1972 - Mỹ mở cuộc tập kích B-52)...`}
                className="flex-1 text-xs sm:text-sm p-1 bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
              />

              {/* Move Up / Down Buttons */}
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

              {/* Delete Milestone Button */}
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
        <span>Thêm mốc sự kiện (Add Milestone)</span>
      </button>
    </div>
  );
}
