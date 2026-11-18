'use client';

import React from 'react';
import { BarChart3, Clock, Filter, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { formatExamTime } from '../utils/practice-quiz.helper';

/** Còn ≤ 60 giây thì đồng hồ chuyển đỏ nhấp nháy. */
const TIME_WARNING_SECONDS = 60;

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
  answered: boolean[];
  /** Đúng/sai từng câu theo thứ tự hiển thị; chỉ có sau khi nộp. */
  correctness: boolean[] | null;
  scorePercent: number;
  correctCount: number;
  wrongCount: number;
  showWrongOnly: boolean;
  onToggleWrongOnly: () => void;
  onJumpToQuestion: (index: number) => void;
  isStaff: boolean;
  onOpenStatistics: () => void;
}

function gridCellClass(isAnswered: boolean, isCorrect: boolean | undefined): string {
  if (isCorrect === true) return 'bg-emerald-600 text-white border-emerald-600';
  if (isCorrect === false) return 'bg-rose-600 text-white border-rose-600';
  if (isAnswered) return 'bg-[#8B261E] text-white border-[#8B261E]';
  return 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300';
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
  answered,
  correctness,
  scorePercent,
  correctCount,
  wrongCount,
  showWrongOnly,
  onToggleWrongOnly,
  onJumpToQuestion,
  isStaff,
  onOpenStatistics,
}: QuizExamSidebarProps) {
  const displaySeconds = examStarted ? timeLeft : totalTimeMinutes * 60;
  const isTimeRunningOut = timeLeft <= TIME_WARNING_SECONDS && examStarted && !submitted;
  const totalQuestions = answered.length;

  return (
    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
      <div className="hidden lg:block p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center justify-center gap-1.5">
          <Clock size={14} className="text-[#8B261E]" /> Thời gian làm bài
        </div>

        <div
          className={`text-4xl font-mono font-bold my-2 tracking-tight ${
            isTimeRunningOut ? 'text-rose-600 animate-pulse' : 'text-stone-900'
          }`}
        >
          {formatExamTime(displaySeconds)}
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

      <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-stone-700">
          <span>Mục lục câu hỏi</span>
          <span>
            {submitted
              ? `${correctCount} đúng · ${wrongCount} sai`
              : `${answered.filter(Boolean).length}/${totalQuestions} đã làm`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {answered.map((isAnswered, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onJumpToQuestion(idx)}
              className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${gridCellClass(
                isAnswered,
                correctness?.[idx],
              )}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

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

            {wrongCount > 0 && (
              <button
                type="button"
                onClick={onToggleWrongOnly}
                aria-pressed={showWrongOnly}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mb-2 border ${
                  showWrongOnly
                    ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Filter size={14} />
                {showWrongOnly ? 'Xem tất cả câu hỏi' : `Chỉ xem ${wrongCount} câu sai`}
              </button>
            )}

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
