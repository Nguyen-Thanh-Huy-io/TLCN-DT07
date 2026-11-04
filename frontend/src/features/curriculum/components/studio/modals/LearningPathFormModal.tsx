'use client';

import React from 'react';

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
