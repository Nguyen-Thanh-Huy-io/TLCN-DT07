'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { LessonItem } from '@/types/models/lesson.type';
import {
  LessonTimelineStrategy,
  LESSON_ORDER_CONSTANTS,
} from '../strategies/lesson-timeline.strategy';

export interface LessonOrderFieldProps {
  displayOrder: number;
  onChange: (order: number) => void;
  topicLessons: LessonItem[];
  loading?: boolean;
  currentLessonId?: string | null;
  currentTitle?: string;
  disabled?: boolean;
  topicName?: string;
  hideHeader?: boolean;
}

export function LessonOrderField({
  displayOrder,
  onChange,
  topicLessons,
  loading = false,
  currentLessonId,
  currentTitle,
  disabled = false,
  topicName,
  hideHeader = false,
}: LessonOrderFieldProps) {
  // Mặc định luôn thu gọn danh sách theo yêu cầu
  const [showList, setShowList] = useState(false);

  // Tính toán timeline và câu diễn giải vị trí thông qua Strategy Pattern
  const { previewTimeline, orderExplanationText, maxNextOrder, otherLessonsCount } = useMemo(() => {
    return LessonTimelineStrategy.calculateTimeline(
      topicLessons,
      displayOrder,
      currentLessonId,
      currentTitle
    );
  }, [topicLessons, displayOrder, currentLessonId, currentTitle]);

  // Giới hạn giá trị hiển thị chặt chẽ trong khoảng [1, maxNextOrder]
  const targetOrder = Math.min(maxNextOrder, Math.max(1, Number(displayOrder || 1)));

  // Tự động điều chỉnh lại giá trị nếu đang lớn hơn vị trí tối đa cho phép (chống nhảy lên 5, 6 khi chỉ có 1-2 bài)
  useEffect(() => {
    if (displayOrder > maxNextOrder) {
      onChange(maxNextOrder);
    }
  }, [displayOrder, maxNextOrder, onChange]);

  return (
    <div className={`flex flex-col gap-2 ${hideHeader ? '' : 'pt-2 border-t border-slate-100'}`}>
      {/* Tiêu đề mục & Số lượng bài học trong chủ đề */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            {LESSON_ORDER_CONSTANTS.FIELD_LABEL}
          </label>
          <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            {loading ? 'Đang tính...' : `Chủ đề có ${topicLessons.length} bài`}
          </span>
        </div>
      )}

      {/* Cụm điều khiển thứ tự: Ô Stepper có giới hạn trần trên và hai nút phụ nhỏ gọn */}
      <div className="flex items-center gap-2">
        {/* Stepper nhập thứ tự có chặn min={1} và max={maxNextOrder} */}
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, targetOrder - 1))}
            disabled={disabled || targetOrder <= 1}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs cursor-pointer select-none"
            title={targetOrder <= 1 ? 'Đã là vị trí đầu tiên (#01)' : 'Giảm thứ tự'}
          >
            –
          </button>
          <input
            type="number"
            min={1}
            max={maxNextOrder}
            value={targetOrder}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (isNaN(val)) {
                onChange(1);
              } else {
                onChange(Math.min(maxNextOrder, Math.max(1, val)));
              }
            }}
            disabled={disabled}
            className="w-11 text-center font-mono text-xs font-bold py-1 border-none focus:outline-none bg-transparent text-blue-700"
            title={`Vị trí hợp lệ trong chủ đề: từ 1 đến ${maxNextOrder}`}
          />
          <button
            type="button"
            onClick={() => onChange(Math.min(maxNextOrder, targetOrder + 1))}
            disabled={disabled || targetOrder >= maxNextOrder}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-xs cursor-pointer select-none"
            title={
              targetOrder >= maxNextOrder
                ? `Đã đạt vị trí cuối cùng cho phép (#${maxNextOrder})`
                : 'Tăng thứ tự'
            }
          >
            +
          </button>
        </div>

        {/* Hai nút phụ nhỏ gọn: Về đầu & Về cuối (Disable tự động khi ở giới hạn) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(1)}
            disabled={disabled || targetOrder === 1}
            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 rounded-md font-medium border border-slate-200 transition cursor-pointer select-none"
            title="Chuyển về vị trí đầu tiên (#01)"
          >
            {LESSON_ORDER_CONSTANTS.BTN_FIRST}
          </button>
          <button
            type="button"
            onClick={() => onChange(maxNextOrder)}
            disabled={disabled || targetOrder === maxNextOrder}
            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 rounded-md font-medium border border-slate-200 transition cursor-pointer select-none"
            title={`Chuyển về vị trí cuối cùng (#${String(maxNextOrder).padStart(2, '0')})`}
          >
            {LESSON_ORDER_CONSTANTS.BTN_LAST}
          </button>
        </div>

        {/* Giới hạn số lượng cho phép */}
        <span className="text-[10px] text-slate-400 font-medium">
          (1 - {maxNextOrder})
        </span>
      </div>

      {/* Câu giải thích vị trí tự nhiên đồng bộ phong cách TopicEditor */}
      <div className="text-xs text-slate-600 font-medium leading-relaxed">
        {orderExplanationText}
      </div>

      {/* Accordion: Mặc định thu gọn, chỉ mở khi người dùng muốn kiểm tra */}
      <div className="mt-0.5">
        <button
          type="button"
          onClick={() => setShowList(!showList)}
          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer transition select-none"
        >
          <span>
            {showList
              ? LESSON_ORDER_CONSTANTS.TOGGLE_COLLAPSE
              : `${LESSON_ORDER_CONSTANTS.TOGGLE_EXPAND} (${previewTimeline.length} mục)`}
          </span>
        </button>

        {showList && (
          <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-150">
            {topicName && (
              <div className="text-[11px] text-slate-500 mb-1.5 pb-1 border-b border-slate-200/80 truncate">
                Chủ đề: <strong className="text-slate-800">{topicName}</strong>
              </div>
            )}

            {/* Danh sách có chiều cao tối đa khoảng 180-220px (max-h-[200px]), cuộn bên trong */}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {previewTimeline.map((item) => {
                const isTarget = item.isCurrent;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isTarget) {
                        onChange(Math.min(maxNextOrder, item.displayOrder));
                      }
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition text-xs select-none ${
                      isTarget
                        ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer'
                    }`}
                    title={
                      isTarget
                        ? 'Vị trí của bài học bạn đang nhập'
                        : `Click để chèn vào vị trí #${String(item.displayOrder).padStart(2, '0')}`
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`font-mono font-bold text-xs shrink-0 ${
                          isTarget ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        #{String(item.displayOrder).padStart(2, '0')}
                      </span>
                      <span className="truncate text-xs" title={item.title}>
                        {item.title}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isTarget ? (
                        <span className="text-[10px] bg-white text-blue-700 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                          {currentLessonId
                            ? LESSON_ORDER_CONSTANTS.BADGE_EDIT
                            : LESSON_ORDER_CONSTANTS.BADGE_NEW}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 hover:text-blue-600 font-medium">
                          {LESSON_ORDER_CONSTANTS.ACTION_PLACE_HERE}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-200/70 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Đổi thứ tự bên trên &rarr; Danh sách tự nhảy</span>
              <span className="text-slate-400">
                {otherLessonsCount} bài đã lưu
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
