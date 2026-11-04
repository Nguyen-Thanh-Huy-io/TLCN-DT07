'use client';

import React from 'react';
import { LessonHeaderMetaFormProps } from '../types/header-meta.types';

export const LessonHeaderMetaForm: React.FC<LessonHeaderMetaFormProps> = ({
  data,
  onChange,
  topics,
  disabled = false,
  className = '',
}) => {
  const maxDescLength = 200;
  const currentDescLength = (data.shortDescription || data.description || '').length;
  const currentTopic = topics?.find((t) => t.id === data.topicId);

  return (
    <div
      data-testid="lesson-header-meta-form"
      className={`space-y-3 font-sans ${className}`}
    >
      {/* 1. Nhãn phân nhóm / Chủ đề bài học */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/70">
            {currentTopic ? `Chủ đề: ${currentTopic.name}` : 'BÀI HỌC LỊCH SỬ'}
          </span>
          {currentTopic?.periodName && (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              • {currentTopic.periodName}
            </span>
          )}
        </div>

        <span
          data-testid="desc-counter"
          className={`text-[11px] font-mono ${
            currentDescLength > maxDescLength ? 'text-rose-600 font-bold' : 'text-slate-400'
          }`}
        >
          {currentDescLength}/{maxDescLength} ký tự
        </span>
      </div>

      {/* 2. Tiêu đề bài học - Dạng headline biên tập thoáng đãng, sang trọng */}
      <div className="relative group">
        <input
          id="input-lesson-title"
          data-testid="input-lesson-title"
          type="text"
          disabled={disabled}
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Nhập tiêu đề bài học (Ví dụ: Chiến dịch Điện Biên Phủ năm 1954)..."
          className="w-full text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-amber-500 pb-1.5 focus:outline-none transition-colors bg-transparent placeholder:text-slate-300 placeholder:font-serif leading-tight"
        />
      </div>

      {/* 3. Mô tả ngắn (Giới thiệu & xem trước) */}
      <div className="relative">
        <textarea
          id="textarea-short-desc"
          data-testid="textarea-short-desc"
          rows={2}
          disabled={disabled}
          value={data.description || data.shortDescription || data.summary || ''}
          onChange={(e) => {
            onChange('shortDescription', e.target.value);
            onChange('description', e.target.value);
            onChange('summary', e.target.value);
          }}
          placeholder="Tóm tắt ngắn gọn bối cảnh và ý nghĩa bài học dùng hiển thị ở thẻ tìm kiếm & danh mục xem trước..."
          className="w-full text-sm sm:text-base text-slate-600 font-medium p-1 border-b border-transparent hover:border-slate-200 focus:border-amber-400 focus:outline-none transition-colors bg-transparent placeholder:text-slate-400 resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};
