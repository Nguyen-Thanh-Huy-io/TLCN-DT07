'use client';

import React from 'react';
import {
  GripVertical,
  Check,
  CircleDot,
  CheckSquare,
  X,
  Plus,
  Lightbulb,
  BarChart3,
  Clock,
  Filter,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { QuizQuestionType } from '@/features/lessons/types/editor.types';
import { OptionExplanationBox } from '@/components/common/EmojiPickerButton';
import { formatExamTime } from '../utils/practice-quiz.helper';
import { OptionItemState } from './question-modal.helper';

interface QuestionOptionsEditorProps {
  type: QuizQuestionType;
  options: OptionItemState[];
  expandedNotes: Record<string, boolean>;
  onToggleOptionCorrect: (optId: string) => void;
  onUpdateOptionText: (optId: string, text: string) => void;
  onUpdateOptionExplanation: (optId: string, explanation: string) => void;
  onToggleOptionNote: (optId: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optId: string) => void;
}

export function QuestionOptionsEditor({
  type,
  options,
  expandedNotes,
  onToggleOptionCorrect,
  onUpdateOptionText,
  onUpdateOptionExplanation,
  onToggleOptionNote,
  onAddOption,
  onRemoveOption,
}: QuestionOptionsEditorProps) {
  const isMultiple = type === QuizQuestionType.MULTIPLE_CHOICE;
  const correctCount = options.filter((o) => o.isCorrect).length;

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-bold text-slate-800">
            Các phương án lựa chọn
          </label>
          {isMultiple ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <CheckSquare size={12} />
              <span>
                Nhiều đáp án: Đang chọn {correctCount}/{options.length} đáp án đúng
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CircleDot size={12} />
              <span>Chế độ 1 đáp án đúng duy nhất</span>
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {isMultiple ? (
            <>
              Tích chọn nút <strong>Đúng</strong> tại <strong>một hoặc nhiều</strong> phương án
            </>
          ) : (
            <>
              Tích chọn nút <strong>Đúng</strong> tại phương án đúng duy nhất
            </>
          )}
        </span>
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const labelLetter = String.fromCharCode(65 + idx);
          const isNoteOpen = expandedNotes[opt.id];

          return (
            <div
              key={opt.id}
              className={`p-2.5 rounded-xl border transition-all ${
                opt.isCorrect
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-slate-400 cursor-grab hover:text-slate-600 shrink-0">
                  <GripVertical size={15} />
                </span>

                <button
                  type="button"
                  onClick={() => onToggleOptionCorrect(opt.id)}
                  className="cursor-pointer shrink-0 border-0 bg-transparent p-0"
                >
                  {isMultiple ? (
                    opt.isCorrect ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-slate-300 block hover:border-blue-500" />
                    )
                  ) : opt.isCorrect ? (
                    <CircleDot size={16} className="text-blue-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 block hover:border-blue-500" />
                  )}
                </button>

                <span className="text-xs font-bold text-slate-500 w-4 shrink-0">
                  {labelLetter}.
                </span>

                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => onUpdateOptionText(opt.id, e.target.value)}
                  placeholder={`Nội dung lựa chọn ${labelLetter}...`}
                  className="flex-1 text-xs sm:text-sm p-1 bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => onToggleOptionNote(opt.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                    opt.explanation
                      ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold'
                      : isNoteOpen
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  title="Ghi chú giải thích vì sao đáp án này đúng hoặc sai"
                >
                  <Lightbulb
                    size={12}
                    className={opt.explanation ? 'text-amber-600' : 'text-slate-400'}
                  />
                  <span>{opt.explanation ? 'Có giải thích' : '+ Giải thích'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleOptionCorrect(opt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                    opt.isCorrect
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {opt.isCorrect ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    <span className="w-3 h-3 rounded-xs border border-slate-300" />
                  )}
                  <span>Đúng</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveOption(opt.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Xóa lựa chọn này"
                >
                  <X size={15} />
                </button>
              </div>

              {isNoteOpen && (
                <OptionExplanationBox
                  labelLetter={labelLetter}
                  isCorrect={opt.isCorrect}
                  value={opt.explanation}
                  onChange={(val) => onUpdateOptionExplanation(opt.id, val)}
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddOption}
        className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
      >
        <Plus size={14} />
        <span>Thêm phương án lựa chọn</span>
      </button>
    </div>
  );
}

// === Merged from QuizExamSidebar.tsx ===
const TIME_WARNING_SECONDS = 60;

export interface QuizExamSidebarProps {
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
