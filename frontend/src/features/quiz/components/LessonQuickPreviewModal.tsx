'use client';

import React from 'react';
import { BookOpen, ExternalLink, X, Clock, Layers } from 'lucide-react';
import Link from 'next/link';

export interface LessonQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
    slug?: string;
    description?: string | null;
    topicTitle?: string;
  } | null;
}

export function LessonQuickPreviewModal({
  isOpen,
  onClose,
  lesson,
}: LessonQuickPreviewModalProps) {
  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 text-red-700">
              <BookOpen size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Thông tin bài học tham chiếu
              </span>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                {lesson.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1.5">
              <Layers size={13} className="text-slate-500" />
              {lesson.topicTitle || 'Chuyên đề lịch sử'}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Giới thiệu tóm tắt
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              {lesson.description || 'Chưa có thông tin mô tả giới thiệu cho bài học này.'}
            </p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Đây là bảng xem nhanh tóm tắt bài học phục vụ việc tham chiếu đề thi. Bạn có thể mở trực tiếp trang soạn thảo bài học để cập nhật nội dung chi tiết.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Đóng
          </button>

          <Link
            href={`/lessons/${lesson.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Mở bài học chi tiết</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
