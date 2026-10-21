'use client';

import React, { useState } from 'react';
import { DifficultyLevel } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { LessonHeaderMetaFormProps } from '../types/header-meta.types';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';

export const LessonHeaderMetaForm: React.FC<LessonHeaderMetaFormProps> = ({
  data,
  onChange,
  topics,
  onOpenTopicPicker,
  disabled = false,
  className = '',
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      onChange('tags', [...data.tags, trimmed]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(
      'tags',
      data.tags.filter((t) => t !== tagToRemove)
    );
  };

  const maxDescLength = 200;
  const currentDescLength = (data.shortDescription || '').length;

  return (
    <div
      data-testid="lesson-header-meta-form"
      className={`bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-2xs space-y-4 font-sans ${className}`}
    >
      {/* 1. Hàng 1: Tiêu đề bài học */}
      <div className="flex flex-col gap-1">
        <label htmlFor="input-lesson-title" className="text-xs font-bold text-slate-800 flex items-center gap-1">
          <span>Tiêu đề bài học</span>
          <span className="text-rose-500">*</span>
        </label>
        <input
          id="input-lesson-title"
          data-testid="input-lesson-title"
          type="text"
          disabled={disabled}
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Ví dụ: Chiến dịch Điện Biên Phủ, Nghệ thuật quân sự Đại Việt..."
          className="w-full text-sm md:text-base font-bold text-slate-900 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white placeholder:font-normal placeholder:text-slate-400"
        />
      </div>

      {/* 2. Hàng 2: Mô tả ngắn (Giới thiệu & xem trước) */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label htmlFor="textarea-short-desc" className="text-xs font-bold text-slate-700">
            Mô tả ngắn (Giới thiệu & xem trước)
          </label>
          <span
            data-testid="desc-counter"
            className={`text-[11px] font-mono ${
              currentDescLength > maxDescLength ? 'text-rose-600 font-bold' : 'text-slate-400'
            }`}
          >
            {currentDescLength}/{maxDescLength}
          </span>
        </div>
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
          placeholder="Tóm tắt ngắn gọn bối cảnh và ý nghĩa bài học dùng hiển thị ở thẻ tìm kiếm..."
          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white placeholder:text-slate-400 resize-none"
        />
      </div>

      {/* 4. Hàng 4: Ảnh đại diện (Tùy chọn) — dùng chung component picker đã có sẵn
          (TopicCoverImagePicker: tải file lên hoặc dán URL, xem trước, báo lỗi ảnh hỏng)
          thay cho 1 ô input URL trần trụi không đồng bộ với các picker ảnh khác trong app. */}
      <div className="pt-2 border-t border-slate-100">
        <TopicCoverImagePicker
          value={data.thumbnailUrl}
          onChange={(url) => onChange('thumbnailUrl', url)}
          disabled={disabled}
          title="Ảnh đại diện bài học"
          compact
        />
      </div>
    </div>
  );
};
