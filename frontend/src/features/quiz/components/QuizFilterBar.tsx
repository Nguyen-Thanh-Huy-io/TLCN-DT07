'use client';

import React from 'react';
import { Search, X, ChevronDown, ChevronUp, Layers, BookOpen } from 'lucide-react';
import { ALL_TOPICS_ID, QuizTopicOption } from '../strategies/quiz-filter.strategy';

interface QuizFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  topics: QuizTopicOption[];
  totalCount: number;
  filteredCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const QuizFilterBar: React.FC<QuizFilterBarProps> = ({
  query,
  onQueryChange,
  selectedTopicId,
  onSelectTopic,
  topics,
  totalCount,
  filteredCount,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 md:p-5 mb-6">
      {/* HÀNG TRÊN: Ô TÌM KIẾM & NÚT THU GỌN / MỞ RỘNG */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3.5">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm theo tên bài học, chủ đề, sự kiện..."
            aria-label="Tìm kiếm bộ đề luyện tập"
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50/80 hover:bg-stone-50 focus:bg-white text-stone-900 placeholder-stone-400 text-sm rounded-xl border border-stone-200 focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 transition-all outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* NÚT THU GỌN / MỞ RỘNG VÙNG CHỌN ĐỀ */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-white hover:border-stone-300 text-stone-700 text-xs font-bold transition-all cursor-pointer select-none"
          title={isExpanded ? 'Thu gọn danh sách đề để tập trung làm bài' : 'Mở rộng danh sách chọn bộ đề'}
        >
          <Layers size={14} className="text-[#8B261E]" />
          <span>{isExpanded ? 'Thu gọn danh sách' : 'Mở rộng danh sách'}</span>
          <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded-full">
            {filteredCount}
          </span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* HÀNG DƯỚI: CHIP FILTERS CHỦ ĐỀ LỊCH SỬ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <BookOpen size={13} className="text-stone-400" /> Chủ đề:
        </span>

        {/* CHIP: TẤT CẢ */}
        <button
          type="button"
          onClick={() => onSelectTopic(ALL_TOPICS_ID)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            selectedTopicId === ALL_TOPICS_ID
              ? 'bg-[#8B261E] text-white border-[#8B261E] shadow-xs'
              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-white hover:border-stone-300'
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedTopicId === ALL_TOPICS_ID
                ? 'bg-white/20 text-white'
                : 'bg-stone-200/80 text-stone-500'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* CÁC CHIP CHỦ ĐỀ TỰ ĐỘNG TRÍCH XUẤT */}
        {topics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#8B261E] text-white border-[#8B261E] shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-white hover:border-stone-300'
              }`}
            >
              <span>{topic.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-500'
                }`}
              >
                {topic.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
