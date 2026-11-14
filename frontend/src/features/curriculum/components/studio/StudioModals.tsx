'use client';

import React from 'react';
import { KeyboardKey, ContentStatus, IconName } from '@/constants/enums';
import { Icon } from '@/components/icons/Icon';
import { ChapterItem } from '@/services/entities/learning-path.service';
import { LessonItem } from '@/types/models';
import { TopicPicker, type PickedTopic } from '@/features/topics/components/TopicPicker';

const DISABLED_ARROW_CLASS = 'opacity-30 cursor-not-allowed';

// --- AddLessonsToChapterModal.tsx ---
interface AddLessonsToChapterModalProps {
  isOpen: boolean;
  chapter: ChapterItem | null;
  onClose: () => void;

  // Tạo nhanh bài học mới ngay trong modal
  quickCreateTitle: string;
  onQuickCreateTitleChange: (value: string) => void;
  quickCreateTopic: PickedTopic | null;
  onQuickCreateTopicChange: (topic: PickedTopic | null) => void;
  onQuickCreate: () => void;
  isQuickCreating: boolean;

  // Tìm + chọn + sắp xếp bài học từ thư viện
  allLessons: LessonItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredLessons: LessonItem[];
  selectedLessonIds: string[];
  onToggleLesson: (lessonId: string) => void;
  onMoveSelectedLesson: (lessonId: string, direction: 'UP' | 'DOWN') => void;

  onConfirm: () => void;
  actionLoading: boolean;
}

/** Modal "Quản lý & Sắp xếp Lesson trong chương" — cho phép tạo nhanh bài mới, chọn bài từ
 * thư viện và sắp xếp thứ tự bài học ngay trong modal trước khi lưu. */
export function AddLessonsToChapterModal({
  isOpen,
  chapter,
  onClose,
  quickCreateTitle,
  onQuickCreateTitleChange,
  quickCreateTopic,
  onQuickCreateTopicChange,
  onQuickCreate,
  isQuickCreating,
  allLessons,
  searchTerm,
  onSearchChange,
  filteredLessons,
  selectedLessonIds,
  onToggleLesson,
  onMoveSelectedLesson,
  onConfirm,
  actionLoading,
}: AddLessonsToChapterModalProps) {
  if (!isOpen || !chapter) return null;

  const selectedLessons = selectedLessonIds
    .map((id) => allLessons.find((l) => l.id === id))
    .filter((l): l is LessonItem => Boolean(l));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Thêm Lesson từ thư viện vào chương</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chương: <strong>{chapter.title}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        {/* Tạo nhanh bài học mới ngay tại đây — gõ tên rồi Enter/bấm Tạo, bài học mới
            (bản nháp trống) sẽ được gom thẳng vào chương này, không cần rời trang. */}
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
          <input
            type="text"
            placeholder="Nhập tên bài học mới rồi nhấn Enter để tạo nhanh..."
            value={quickCreateTitle}
            onChange={(e) => onQuickCreateTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KeyboardKey.ENTER) {
                e.preventDefault();
                onQuickCreate();
              }
            }}
            disabled={isQuickCreating}
            className="form-input !h-8 !text-xs flex-1"
          />
          <button
            type="button"
            onClick={onQuickCreate}
            disabled={isQuickCreating || !quickCreateTitle.trim() || !quickCreateTopic}
            className="primary-button !h-8 !text-xs !px-3 shrink-0"
          >
            <Icon name={IconName.PLUS} size={13} />
            <span>{isQuickCreating ? 'Đang tạo...' : 'Tạo bài học'}</span>
          </button>
        </div>
        <TopicPicker
          value={quickCreateTopic}
          onChange={onQuickCreateTopicChange}
          placeholder="Bài học mới thuộc chủ đề nào (bắt buộc)..."
        />
        <p className="text-xs text-slate-500">
          Bài học được tạo ở dạng bản nháp trống — mở lại trong &quot;Thư viện Lesson&quot; để soạn nội dung chi tiết.
        </p>

        {/* Danh sách bài học ĐÃ CHỌN và sắp xếp thứ tự trong modal */}
        {selectedLessons.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto border border-emerald-200 bg-emerald-50/30 rounded-lg p-2.5">
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1">
              Thứ tự bài học trong chương ({selectedLessons.length} bài)
            </div>
            {selectedLessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-1.5 px-2.5 bg-white border border-emerald-200 rounded-md"
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
                    className={`p-1 rounded text-slate-500 hover:bg-slate-100 ${
                      idx === 0 ? DISABLED_ARROW_CLASS : ''
                    }`}
                    title="Chuyển lên"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === selectedLessons.length - 1}
                    onClick={() => onMoveSelectedLesson(lesson.id, 'DOWN')}
                    className={`p-1 rounded text-slate-500 hover:bg-slate-100 ${
                      idx === selectedLessons.length - 1 ? DISABLED_ARROW_CLASS : ''
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

        <div className="relative">
          <input
            type="text"
            placeholder="Hoặc tìm bài học có sẵn trong thư viện..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input !h-8 !text-xs !pl-8 w-full"
          />
          <span className="absolute left-2.5 top-2 text-slate-400">
            <Icon name={IconName.SEARCH} size={13} />
          </span>
        </div>

        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-80">
          {filteredLessons.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Không có bài học nào trong thư viện.</div>
          ) : (
            filteredLessons.map((lesson) => {
              const isChecked = selectedLessonIds.includes(lesson.id);
              return (
                <label
                  key={lesson.id}
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                    isChecked ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleLesson(lesson.id)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 line-clamp-1">{lesson.title}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      lesson.status === ContentStatus.PUBLISHED ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {lesson.status === ContentStatus.PUBLISHED ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-xs text-slate-500">
            Đã chọn: <strong>{selectedLessonIds.length}</strong> bài học
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="secondary-button !h-8 !text-xs !px-3">
              Hủy
            </button>
            <button
              type="button"
              id="btn-confirm-add-lessons"
              disabled={actionLoading}
              onClick={onConfirm}
              className="primary-button !h-8 !text-xs !px-4"
            >
              {actionLoading ? 'Đang lưu...' : 'Xác nhận thêm vào chương'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CreateChapterModal.tsx ---
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
              <div className="text-xs text-slate-500 italic p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
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
                          idx === 0 ? DISABLED_ARROW_CLASS : ''
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
                          idx === selectedLessons.length - 1 ? DISABLED_ARROW_CLASS : ''
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
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          lesson.status === ContentStatus.PUBLISHED ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {lesson.status === ContentStatus.PUBLISHED ? 'Đã xuất bản' : 'Bản nháp'}
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

// --- LearningPathFormModal.tsx ---
interface LearningPathFormModalProps {
  isOpen: boolean;
  heading: string;
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder?: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitLoadingLabel: string;
  loading: boolean;
  submitId?: string;
}

/** Form Tạo lộ trình học mới / Sửa lộ trình đang có — cùng 1 bộ field (tên, mô tả) nên
 * dùng chung 1 component, chỉ khác tiêu đề/nhãn nút và hành vi submit.
 * Lưu ý: đã bỏ field "Phân loại lộ trình" (Niên đại/Chuyên đề) — trường này tồn tại
 * nhưng không được dùng để lọc/hiển thị gì ở phía Lộ trình (chỉ có ý nghĩa thật ở phía
 * Chủ đề/Topic, nơi nó điều khiển 2 "lăng kính xem" của Cây phân cấp Chủ đề), nên chỉ
 * gây rối mà không có tác dụng khi đặt trong form Lộ trình. */
export function LearningPathFormModal({
  isOpen,
  heading,
  title,
  onTitleChange,
  titlePlaceholder,
  description,
  onDescriptionChange,
  onClose,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
  loading,
  submitId,
}: LearningPathFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900">{heading}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lộ trình *</label>
            <input
              type="text"
              placeholder={titlePlaceholder}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="form-input !h-8 !text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả tóm tắt</label>
            <textarea
              rows={3}
              placeholder="Mô tả nội dung lộ trình..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="form-input !text-xs w-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
          <button type="button" onClick={onClose} className="secondary-button !h-8 !text-xs !px-3">
            Hủy
          </button>
          <button
            type="button"
            id={submitId}
            disabled={loading}
            onClick={onSubmit}
            className="primary-button !h-8 !text-xs !px-4"
          >
            {loading ? submitLoadingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
