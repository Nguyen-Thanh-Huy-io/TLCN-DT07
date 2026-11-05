'use client';

import React from 'react';
import { HelpCircle, Clock, CheckCircle2, SearchX } from 'lucide-react';
import { QuizFilterableItem } from '../strategies/quiz-filter.strategy';

interface QuizSelectorGridProps<T extends QuizFilterableItem> {
  lessons: T[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onClearFilters?: () => void;
}

export function QuizSelectorGrid<T extends QuizFilterableItem>({
  lessons,
  activeLessonId,
  onSelectLesson,
  onClearFilters,
}: QuizSelectorGridProps<T>) {
  if (lessons.length === 0) {
    return (
      <div data-testid="quiz-empty-state" className="p-8 text-center bg-white rounded-2xl border border-dashed border-stone-300 mb-6">
        <SearchX size={36} className="mx-auto text-stone-300 mb-2.5" />
        <p className="text-sm font-semibold text-stone-700">
          Không tìm thấy bộ đề nào khớp với từ khóa hoặc chủ đề đã chọn.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3 px-4 py-1.5 text-xs font-bold text-[#8B261E] bg-[#8B261E]/10 hover:bg-[#8B261E]/20 rounded-full transition-all cursor-pointer"
          >
            Xóa bộ lọc để xem tất cả
          </button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="quiz-selector-grid" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {lessons.map((lesson) => {
        const isSelected = lesson.id === activeLessonId;
        const questionCount = lesson.quiz?.questions?.length || 0;
        const timeLimit = lesson.quiz?.timeLimitMinutes || 15;

        return (
          <button
            key={lesson.id}
            type="button"
            data-testid="quiz-card"
            onClick={() => onSelectLesson(lesson.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer relative ${
              isSelected
                ? 'bg-white border-[#8B261E] ring-2 ring-[#8B261E]/20 shadow-md translate-y-[-1px]'
                : 'bg-stone-50/90 border-stone-200/90 hover:bg-white hover:border-stone-300 hover:shadow-xs'
            }`}
          >
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-[#8B261E] bg-[#8B261E]/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Đang chọn
              </span>
            )}

            <div>
              <div className="text-[11px] font-bold text-[#8B261E] uppercase tracking-wider mb-1.5 line-clamp-1 pr-16">
                {lesson.topic?.name || 'Chủ đề Lịch sử'}
              </div>
              <div className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                {lesson.title}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1 font-medium">
                <HelpCircle size={12} className="text-stone-400" />
                {questionCount} câu hỏi
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Clock size={12} className="text-stone-400" />
                {timeLimit} phút
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
