'use client';
import React, { useState } from 'react';
import { LessonItem } from '@/types/models/lesson.type';

export interface LessonOrderFieldProps {
  displayOrder: number;
  onChange: (order: number) => void;
  topicLessons: LessonItem[];
  loading?: boolean;
  currentLessonId?: string | null;
  currentTitle?: string;
  disabled?: boolean;
}

export function LessonOrderField({
  displayOrder,
  onChange,
  topicLessons,
  loading = false,
  currentLessonId,
  currentTitle,
  disabled = false,
}: LessonOrderFieldProps) {
  const [showList, setShowList] = useState(false);

  const totalInTopic = topicLessons.length;
  const maxOrder = topicLessons.reduce((max, l) => Math.max(max, l.displayOrder || 0), 0);
  const nextOrder = maxOrder + 1;

  return (
    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
          Thứ tự bài học
        </label>
        <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {loading ? 'Đang tính...' : `Chủ đề có ${totalInTopic} bài`}
        </span>
      </div>

      {/* Hàng điều khiển tinh gọn: Input stepper & phím tắt */}
      <div className="flex items-center gap-2">
        <div className="relative w-20 shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
            #
          </span>
          <input
            type="number"
            min={1}
            value={displayOrder || ''}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            placeholder="1"
            disabled={disabled}
            className="w-full text-xs pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white font-bold text-slate-900 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => onChange(1)}
            disabled={disabled}
            className="flex-1 px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium border border-slate-200 transition cursor-pointer text-center"
            title="Đặt làm bài học đầu tiên trong chủ đề"
          >
            Đầu (#1)
          </button>
          <button
            type="button"
            onClick={() => onChange(nextOrder)}
            disabled={disabled}
            className="flex-1 px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium border border-slate-200 transition cursor-pointer text-center"
            title="Đặt ở vị trí tiếp nối cuối cùng"
          >
            Cuối (#{nextOrder})
          </button>
        </div>
      </div>

      {/* Xem thứ tự hiện có dạng accordion gọn gàng */}
      {totalInTopic > 0 && (
        <div className="mt-0.5">
          <button
            type="button"
            onClick={() => setShowList(!showList)}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>{showList ? '▲ Thu gọn danh sách bài' : '▼ Xem vị trí các bài cùng chủ đề'}</span>
          </button>

          {showList && (
            <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg max-h-36 overflow-y-auto space-y-1 text-xs">
              {topicLessons.map((l) => {
                const isCurrent = l.id === currentLessonId;
                return (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between p-1 px-1.5 rounded text-[11px] ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-900 font-bold border border-blue-200'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="truncate pr-1">
                      <strong>#{l.displayOrder ?? '?'}:</strong> {l.title}
                    </span>
                    {isCurrent && <span className="text-[10px] text-blue-700 shrink-0 font-bold">(Đang sửa)</span>}
                  </div>
                );
              })}
              {!currentLessonId && (
                <div className="flex items-center justify-between p-1 px-1.5 rounded text-[11px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  <span className="truncate pr-1">
                    <strong>#{displayOrder}:</strong> {currentTitle || '(Bài mới này)'}
                  </span>
                  <span className="text-[10px] text-emerald-600 shrink-0">Vị trí bài này</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
