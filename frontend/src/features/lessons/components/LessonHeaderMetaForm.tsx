'use client';

import React, { useState } from 'react';
import { DifficultyLevel } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { LessonHeaderMetaFormProps } from '../types/header-meta.types';

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
  const [showTimeFields, setShowTimeFields] = useState(Boolean(data.startDate || data.endDate));

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
      {/* 1. Hàng 1: Tiêu đề bài học & Chủ đề/Thời kỳ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-8 flex flex-col gap-1">
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
            placeholder="Ví dụ: Kháng chiến chống Pháp (1945 - 1954), Chiến thắng Bạch Đằng..."
            className="w-full text-sm md:text-base font-bold text-slate-900 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="select-lesson-topic" className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Chủ đề / Thời kỳ</span>
              <span className="text-rose-500">*</span>
            </label>
            {onOpenTopicPicker && (
              <button
                type="button"
                onClick={onOpenTopicPicker}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Cây tri thức
              </button>
            )}
          </div>
          <select
            id="select-lesson-topic"
            data-testid="select-lesson-topic"
            disabled={disabled}
            value={data.topicId}
            onChange={(e) => onChange('topicId', e.target.value)}
            className="w-full text-xs md:text-sm font-medium text-slate-800 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
          >
            <option value="" disabled>
              -- Chọn Chủ đề / Thời kỳ --
            </option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.periodName ? `(${t.periodName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Hàng 2: Thời gian diễn ra & Độ khó */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1 border-t border-slate-100">
        <div className="md:col-span-8 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Thời gian diễn ra</span>
              <span className="text-[11px] font-normal text-slate-400">
                (Tùy chọn - điền khi là bài sự kiện/chiến dịch)
              </span>
            </span>
            <button
              type="button"
              data-testid="toggle-historical-dates"
              onClick={() => setShowTimeFields(!showTimeFields)}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {showTimeFields ? 'Thu gọn' : '+ Bật nhập thời gian'}
            </button>
          </div>

          {showTimeFields ? (
            <div data-testid="historical-date-fields" className="grid grid-cols-2 gap-2 mt-0.5">
              <div>
                <input
                  data-testid="input-start-date"
                  type="text"
                  disabled={disabled}
                  value={data.startDate}
                  onChange={(e) => onChange('startDate', e.target.value)}
                  placeholder="Bắt đầu: 19/12/1946 hoặc năm 938"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>
              <div>
                <input
                  data-testid="input-end-date"
                  type="text"
                  disabled={disabled}
                  value={data.endDate}
                  onChange={(e) => onChange('endDate', e.target.value)}
                  placeholder="Kết thúc: 07/05/1954 (nếu có)"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-1.5 bg-slate-50 px-3 rounded-lg border border-dashed border-slate-200">
              Không gắn ngày cụ thể (áp dụng chung theo Thời kỳ/Chủ đề). Bấm "Bật nhập thời gian" nếu cần.
            </div>
          )}
        </div>

        <div className="md:col-span-4 flex flex-col gap-1">
          <label htmlFor="select-difficulty" className="text-xs font-bold text-slate-700">
            Độ khó bài học
          </label>
          <div className="relative">
            <select
              id="select-difficulty"
              data-testid="select-difficulty"
              disabled={disabled}
              value={data.difficulty}
              onChange={(e) => onChange('difficulty', e.target.value as DifficultyLevel)}
              className="w-full text-xs md:text-sm font-medium text-slate-800 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white cursor-pointer pl-7"
            >
              <option value={DifficultyLevel.EASY}>
                {DIFFICULTY_LABEL_MAP[DifficultyLevel.EASY]}
              </option>
              <option value={DifficultyLevel.MEDIUM}>
                {DIFFICULTY_LABEL_MAP[DifficultyLevel.MEDIUM]}
              </option>
              <option value={DifficultyLevel.HARD}>
                {DIFFICULTY_LABEL_MAP[DifficultyLevel.HARD]}
              </option>
            </select>
            <span
              className={`absolute left-2.5 top-3 w-2 h-2 rounded-full ${
                data.difficulty === DifficultyLevel.EASY
                  ? 'bg-emerald-500'
                  : data.difficulty === DifficultyLevel.HARD
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 3. Hàng 3: Thẻ phân loại & Mô tả ngắn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-1 border-t border-slate-100">
        {/* Thẻ phân loại */}
        <div className="lg:col-span-6 flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-700">Thẻ phân loại (Tags)</span>
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50/70 border border-slate-200 rounded-lg min-h-[42px]">
            {data.tags.map((tag) => (
              <span
                key={tag}
                data-testid={`tag-chip-${tag}`}
                className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md"
              >
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-400 hover:text-blue-700 font-bold leading-none cursor-pointer"
                    title={`Xóa thẻ ${tag}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {isAddingTag ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === 'Escape') {
                      setIsAddingTag(false);
                      setNewTagInput('');
                    }
                  }}
                  placeholder="Nhập tên thẻ..."
                  className="text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none w-28 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 font-semibold"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  Hủy
                </button>
              </div>
            ) : (
              !disabled && (
                <button
                  type="button"
                  data-testid="btn-add-tag"
                  onClick={() => setIsAddingTag(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-0.5 hover:bg-blue-100/50 rounded transition cursor-pointer"
                >
                  + Thêm thẻ
                </button>
              )
            )}
          </div>
        </div>

        {/* Mô tả ngắn */}
        <div className="lg:col-span-6 flex flex-col gap-1.5">
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
            value={data.shortDescription}
            onChange={(e) => onChange('shortDescription', e.target.value)}
            placeholder="Tóm tắt ngắn gọn bối cảnh và ý nghĩa bài học dùng hiển thị ở thẻ tìm kiếm..."
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>

      {/* 4. Hàng 4: Ảnh đại diện (Tùy chọn) */}
      <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-700">Ảnh đại diện bài học:</span>
          {data.thumbnailUrl ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.thumbnailUrl}
                alt="Thumbnail bài học"
                className="w-14 h-9 object-cover rounded border border-slate-200"
              />
              <button
                type="button"
                onClick={() => onChange('thumbnailUrl', '')}
                className="text-rose-600 hover:text-rose-800 hover:underline text-[11px] font-medium"
              >
                Xóa ảnh
              </button>
            </div>
          ) : (
            <span className="text-slate-400 italic">Chưa gắn ảnh đại diện</span>
          )}
        </div>

        <div className="w-full md:w-72">
          <input
            data-testid="input-thumbnail-url"
            type="text"
            disabled={disabled}
            value={data.thumbnailUrl}
            onChange={(e) => onChange('thumbnailUrl', e.target.value)}
            placeholder="Dán URL ảnh đại diện (https://...)..."
            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
          />
        </div>
      </div>
    </div>
  );
};
