'use client';

import React from 'react';
import { Clock, Play, RotateCcw, BarChart3, ShieldCheck } from 'lucide-react';

interface QuizExamSidebarProps {
  timeLeft: number;
  totalTimeMinutes: number;
  examStarted: boolean;
  submitted: boolean;
  submitting: boolean;
  submitError: string | null;
  onStartExam: () => void;
  onSubmitExam: () => void;
  onResetExam: () => void;
  totalQuestions: number;
  selectedAnswers: Record<number, string>;
  scorePercent: number;
  correctCount: number;
  isStaff: boolean;
  onOpenStatistics: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function QuizExamSidebar({
  timeLeft,
  totalTimeMinutes,
  examStarted,
  submitted,
  submitting,
  submitError,
  onStartExam,
  onSubmitExam,
  onResetExam,
  totalQuestions,
  selectedAnswers,
  scorePercent,
  correctCount,
  isStaff,
  onOpenStatistics,
}: QuizExamSidebarProps) {
  const displaySeconds = examStarted ? timeLeft : totalTimeMinutes * 60;

  return (
    <div className="lg:col-span-4 sticky top-24 space-y-4">
      {/* Box Đồng hồ đếm ngược */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center justify-center gap-1.5">
          <Clock size={14} className="text-[#8B261E]" /> Thời gian làm bài
        </div>

        <div
          className={`text-4xl font-mono font-bold my-2 tracking-tight ${
            timeLeft <= 60 && examStarted && !submitted ? 'text-rose-600 animate-pulse' : 'text-stone-900'
          }`}
        >
          {formatTime(displaySeconds)}
        </div>

        {!examStarted && !submitted && (
          <button
            type="button"
            onClick={onStartExam}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Play size={16} /> Bắt đầu tính giờ làm bài
          </button>
        )}

        {examStarted && !submitted && (
          <div className="text-xs text-emerald-700 font-medium flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            Đang tính giờ thi trực tiếp
          </div>
        )}

        {submitted && <div className="text-xs text-stone-500 font-medium">Bài thi đã nộp thành công</div>}
      </div>

      {/* Bảng điều hướng câu hỏi (Question Grid) */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-stone-700">
          <span>Mục lục câu hỏi</span>
          <span>
            {Object.keys(selectedAnswers).length}/{totalQuestions} đã làm
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`question-box-${idx}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${
                  isAnswered
                    ? 'bg-[#8B261E] text-white border-[#8B261E]'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Kết quả sau khi nộp */}
        {submitted ? (
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
              <span>Điểm số đạt được:</span>
              <strong className="text-base text-stone-900">{scorePercent}%</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600 mb-3">
              <span>Số câu đúng:</span>
              <strong className="text-emerald-700 font-bold">
                {correctCount}/{totalQuestions} câu
              </strong>
            </div>

            <button
              type="button"
              onClick={onResetExam}
              className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mb-2"
            >
              <RotateCcw size={14} /> Làm lại đề này
            </button>

            {isStaff && (
              <button
                type="button"
                onClick={onOpenStatistics}
                className="w-full py-2 rounded-xl border border-stone-200 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Chỉ hiển thị cho Ban biên tập & Quản trị viên"
              >
                <BarChart3 size={14} className="text-[#8B261E]" /> Xem Phổ Điểm & Thống Kê (Editor)
              </button>
            )}
          </div>
        ) : (
          <div>
            {submitError && (
              <p className="mb-2 text-xs font-semibold text-red-600 text-center">{submitError}</p>
            )}
            <button
              type="button"
              onClick={onSubmitExam}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#8B261E] text-white font-bold text-sm hover:bg-[#721F18] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <ShieldCheck size={16} />{' '}
              {submitting ? 'Đang nộp bài…' : submitError ? 'Thử nộp lại' : 'Nộp bài & Xem điểm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
