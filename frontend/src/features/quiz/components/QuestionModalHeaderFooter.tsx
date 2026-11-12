'use client';

import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { QuizQuestionType } from '@/features/lessons/types/quiz.types';

interface QuestionModalHeaderProps {
  isEdit: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function QuestionModalHeader({
  isEdit,
  isMaximized,
  onToggleMaximize,
  onClose,
}: QuestionModalHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>{isEdit ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}</span>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            CMS Rich Text Editor
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Soạn thảo câu hỏi trắc nghiệm chuẩn sư phạm, hỗ trợ định dạng văn bản chuyên sâu và tải ảnh tư liệu
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleMaximize}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isMaximized ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng cửa sổ"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

interface QuestionModalFooterProps {
  type: QuizQuestionType;
  isEdit: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function getQuestionTypeFooterLabel(type: QuizQuestionType): string {
  switch (type) {
    case QuizQuestionType.MATCHING:
      return 'Loại 5: Ghép nối cặp thông tin (Matching Pairs) • Lưu vào Ngân hàng trung tâm';
    case QuizQuestionType.ORDERING:
      return 'Loại 4: Sắp xếp dòng thời gian (Timeline Order) • Lưu vào Ngân hàng trung tâm';
    case QuizQuestionType.TRUE_FALSE:
      return 'Loại 3: Câu hỏi Đúng / Sai (True / False) • Lưu vào Ngân hàng trung tâm';
    case QuizQuestionType.MULTIPLE_CHOICE:
      return 'Loại 2: Trắc nghiệm nhiều đáp án đúng (Multiple Choice / Check Box) • Lưu vào Ngân hàng trung tâm';
    default:
      return 'Loại 1: Trắc nghiệm 1 đáp án (Single Choice / Radio Button) • Lưu vào Ngân hàng trung tâm';
  }
}

export function QuestionModalFooter({
  type,
  isEdit,
  submitting,
  onClose,
  onSubmit,
}: QuestionModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
      <span className="text-[11px] text-slate-500 hidden sm:inline">
        {getQuestionTypeFooterLabel(type)}
      </span>

      <div className="flex items-center gap-2.5 ml-auto">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
        </button>
      </div>
    </div>
  );
}
