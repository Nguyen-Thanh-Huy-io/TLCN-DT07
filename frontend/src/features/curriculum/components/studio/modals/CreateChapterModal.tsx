'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { LessonItem } from '@/types/models/lesson.type';

interface CreateChapterModalProps {
  isOpen: boolean;
  pathTitle?: string;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;

  // Chọn + sắp xếp bài học ngay trong lúc tạo chương — trước đây phải tạo chương rỗng
  // xong mới mở riêng 1 modal khác để gom bài, thêm xong lại phải kéo-thả riêng để sắp
  // xếp. Gộp cả 3 bước vào đúng 1 chỗ cho đỡ rối.
  searchTerm: string;
  onSearchChange: (value: string) => void;
  /** Toàn bộ bài học trong thư viện (KHÔNG lọc theo search) — dùng để tra tên hiển thị
   * cho danh sách "Đã chọn", vì 1 bài đã chọn có thể không còn khớp từ khóa tìm kiếm
   * hiện tại nhưng vẫn phải hiển thị đúng trong danh sách sắp xếp. */
  allLessons: LessonItem[];
  filteredLessons: LessonItem[];
  selectedLessonIds: string[];
  onToggleLesson: (lessonId: string) => void;
  onMoveSelectedLesson: (lessonId: string, direction: 'UP' | 'DOWN') => void;
}

/** Form "Thêm Chương mới" — chuẩn chỉnh: nhập tên/mô tả, CHỌN bài học có sẵn từ thư viện
 * ngay tại đây, và SẮP XẾP thứ tự các bài đã chọn (▲▼) trước khi tạo — 1 lần bấm "Tạo
 * chương" là có chương đầy đủ nội dung đúng thứ tự, không cần quay lại thao tác thêm lần
 * 2. (Muốn gom thêm bài hoặc đổi thứ tự sau khi đã tạo thì vẫn dùng ChapterList như cũ.) */
export function CreateChapterModal({
  isOpen,
  pathTitle,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  onClose,
  onSubmit,
  loading,
  searchTerm,
  onSearchChange,
  allLessons,
  filteredLessons,
  selectedLessonIds,
  onToggleLesson,
  onMoveSelectedLesson,
}: CreateChapterModalProps) {
  if (!isOpen) return null;

  const selectedLessons = selectedLessonIds
    .map((id) => allLessons.find((l) => l.id === id))
    .filter((l): l is LessonItem => Boolean(l));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Thêm Chương mới</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lộ trình: <strong>{pathTitle}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chương *</label>
              <input
                type="text"
                placeholder="Ví dụ: Chương 1. Việt Nam sau năm 1945"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="form-input !h-8 !text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
              <input
                type="text"
                placeholder="Tóm tắt trọng tâm kiến thức của chương..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="form-input !h-8 !text-xs w-full"
              />
            </div>
          </div>

          {/* Danh sách bài học ĐÃ CHỌN, sắp xếp được ngay — hiện trước để thấy kết quả rõ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bài học trong chương (theo đúng thứ tự này)
            </label>
            {selectedLessons.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                Chưa chọn bài học nào — tick chọn ở danh sách thư viện bên dưới.
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedLessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-2 px-3 bg-emerald-50/50 border border-emerald-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-emerald-700 w-5 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveSelectedLesson(lesson.id, 'UP')}
                        className={`p-1 rounded text-slate-500 hover:bg-white ${
                          idx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Chuyển lên"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === selectedLessons.length - 1}
                        onClick={() => onMoveSelectedLesson(lesson.id, 'DOWN')}
                        className={`p-1 rounded text-slate-500 hover:bg-white ${
                          idx === selectedLessons.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Chuyển xuống"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleLesson(lesson.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Bỏ khỏi chương"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thư viện bài học để chọn thêm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn bài học từ thư viện
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Tìm bài học..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-input !h-8 !text-xs !pl-8 w-full"
              />
              <span className="absolute left-2.5 top-2 text-slate-400">
                <Icon name={IconName.SEARCH} size={13} />
              </span>
            </div>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {filteredLessons.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">Không có bài học nào trong thư viện.</div>
              ) : (
                filteredLessons.map((lesson) => {
                  const isChecked = selectedLessonIds.includes(lesson.id);
                  return (
                    <label
                      key={lesson.id}
                      className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleLesson(lesson.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-900 truncate">{lesson.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          lesson.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {lesson.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3 shrink-0">
          <button type="button" onClick={onClose} className="secondary-button !h-8 !text-xs !px-3">
            Hủy
          </button>
          <button
            type="button"
            id="btn-confirm-create-chapter"
            disabled={loading}
            onClick={onSubmit}
            className="primary-button !h-8 !text-xs !px-4"
          >
            {loading ? 'Đang tạo...' : `Tạo chương${selectedLessons.length > 0 ? ` (${selectedLessons.length} bài)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

