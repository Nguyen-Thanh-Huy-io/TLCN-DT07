'use client';

import React from 'react';
import { Search, X, ArrowRight, BookOpen, HelpCircle, Clock, SearchX, Trophy, ShieldCheck, Play, User, Info, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { ALL_TOPICS_ID, QuizTopicOption, formatExamTime, topicLabelOf } from '../utils/practice-quiz.helper';
import type { PracticeQuizItem } from '@/services/entities/quiz.service';
import { QUIZ_QUESTION_TYPE_META, type QuizQuestion } from '@/features/lessons/types/quiz.types';
import { QuestionBody } from '@/features/public-curriculum/components/hub/HubLessonQuiz';
import type { UserQuizAnswer } from '@/features/public-curriculum/strategies/public-curriculum.strategies';
import type { ExamDialog } from '../facades/usePracticeExam';
import { KeyboardKey } from '@/constants/enums';

// --- QuizFilterBar ---
interface QuizFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  topics: QuizTopicOption[];
  totalCount: number;
  filteredCount: number;
  disabled: boolean;
}

export function QuizFilterBar({
  query,
  onQueryChange,
  selectedTopicId,
  onSelectTopic,
  topics,
  totalCount,
  filteredCount,
  disabled,
}: QuizFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm đề theo tên hoặc chủ đề..."
          aria-label="Tìm kiếm đề luyện tập"
          className="w-full pl-10 pr-9 py-2.5 bg-white text-stone-900 placeholder-stone-400 text-sm rounded-xl border border-stone-200 focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 outline-none disabled:opacity-60"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="relative sm:w-72">
        <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <select
          value={selectedTopicId}
          disabled={disabled}
          onChange={(e) => onSelectTopic(e.target.value)}
          aria-label="Lọc theo chủ đề"
          className="w-full appearance-none pl-10 pr-9 py-2.5 bg-white text-stone-900 text-sm rounded-xl border border-stone-200 focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 outline-none cursor-pointer disabled:opacity-60"
        >
          <option value={ALL_TOPICS_ID}>Tất cả chủ đề ({totalCount})</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name} ({topic.count})
            </option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
      </div>

      {!disabled && filteredCount !== totalCount && (
        <p className="sm:hidden text-xs text-stone-500">
          Đang hiện {filteredCount}/{totalCount} đề
        </p>
      )}
    </div>
  );
}

// --- QuizSelectorGrid ---
const SKELETON_CARD_COUNT = 6;

export function QuizGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Đang tải đề luyện tập">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
        <div key={idx} className="h-44 rounded-2xl border border-stone-200 bg-white p-5 animate-pulse">
          <div className="h-3 w-24 rounded bg-stone-200" />
          <div className="mt-3 h-4 w-4/5 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-3/5 rounded bg-stone-200" />
          <div className="mt-8 h-3 w-full rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

interface QuizSelectorGridProps {
  quizzes: PracticeQuizItem[];
  onOpenQuiz: (id: string) => void;
  onClearFilters: () => void;
}

export function QuizSelectorGrid({ quizzes, onOpenQuiz, onClearFilters }: QuizSelectorGridProps) {
  if (quizzes.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-stone-300">
        <SearchX size={36} className="mx-auto text-stone-300 mb-2.5" />
        <p className="text-sm font-semibold text-stone-700">Không có đề nào khớp với từ khoá hoặc chủ đề đã chọn.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 px-4 py-1.5 text-xs font-bold text-[#8B261E] bg-[#8B261E]/10 hover:bg-[#8B261E]/20 rounded-full cursor-pointer"
        >
          Xoá bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((quiz) => (
        <button
          key={quiz.id}
          type="button"
          onClick={() => onOpenQuiz(quiz.id)}
          className="group text-left p-5 rounded-2xl border border-stone-200 bg-white hover:border-[#8B261E]/50 hover:shadow-md transition-all flex flex-col cursor-pointer"
        >
          <span className="text-xs font-semibold text-[#8B261E] line-clamp-2">{topicLabelOf(quiz)}</span>
          <span className="mt-1.5 text-base font-serif font-bold text-stone-900 leading-snug line-clamp-2">
            {quiz.title}
          </span>

          <span className="mt-auto pt-4 flex items-center justify-between gap-2">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1">
                <HelpCircle size={13} /> {quiz.questions.length} câu
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {quiz.timeLimitMinutes} phút
              </span>
              <span className="inline-flex items-center gap-1">
                <Trophy size={13} /> Đạt {quiz.passingScorePercent}%
              </span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#8B261E]/10 text-[#8B261E] text-xs font-bold group-hover:bg-[#8B261E] group-hover:text-white transition-colors">
              Làm bài <ArrowRight size={13} />
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

// --- QuizBriefingCard ---
interface QuizBriefingCardProps {
  quizTitle: string;
  topicName?: string | null;
  description?: string | null;
  questionCount: number;
  timeLimitMinutes: number;
  passingScorePercent: number;
  /** Tên tài khoản đang đăng nhập; null = khách, cần tự nhập tên. */
  accountName: string | null;
  guestName: string;
  onGuestNameChange: (name: string) => void;
  onStartExam: () => void;
}

/** Khớp @MaxLength của learnerName trong SubmitQuizAttemptDto (backend). */
const GUEST_NAME_MAX_LENGTH = 150;

function BriefingStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold font-serif text-stone-900">{value}</div>
      <div className="text-[11px] font-semibold text-stone-500">{label}</div>
    </div>
  );
}

export function QuizBriefingCard({
  quizTitle,
  topicName,
  description,
  questionCount,
  timeLimitMinutes,
  passingScorePercent,
  accountName,
  guestName,
  onGuestNameChange,
  onStartExam,
}: QuizBriefingCardProps) {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 md:p-8">
      <p className="text-xs font-semibold text-[#8B261E]">{topicName}</p>
      <h2 className="mt-1 text-2xl font-serif font-bold text-stone-900 leading-tight">{quizTitle}</h2>
      {description && <p className="mt-2 text-sm text-stone-600 leading-relaxed">{description}</p>}

      <div className="grid grid-cols-3 gap-3 my-6">
        <BriefingStat icon={<HelpCircle size={18} className="text-[#8B261E]" />} value={`${questionCount}`} label="câu hỏi" />
        <BriefingStat icon={<Clock size={18} className="text-amber-600" />} value={`${timeLimitMinutes}'`} label="thời gian" />
        <BriefingStat icon={<Trophy size={18} className="text-emerald-600" />} value={`${passingScorePercent}%`} label="để đạt" />
      </div>

      {accountName ? (
        <p className="flex items-center gap-2 text-sm text-stone-700 mb-4">
          <User size={16} className="text-[#8B261E] shrink-0" />
          <span>
            Làm bài với tài khoản <strong className="text-stone-900">{accountName}</strong>
          </span>
        </p>
      ) : (
        <div className="mb-4">
          <label htmlFor="practice-guest-name" className="block text-xs font-semibold text-stone-600 mb-1.5">
            Tên của bạn (không bắt buộc)
          </label>
          <input
            id="practice-guest-name"
            type="text"
            maxLength={GUEST_NAME_MAX_LENGTH}
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            placeholder="Họ tên hoặc biệt danh"
            className="w-full px-4 py-2.5 bg-white rounded-lg border border-stone-300 text-stone-900 text-sm focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 outline-none"
          />
        </div>
      )}

      <button
        type="button"
        onClick={onStartExam}
        className="w-full py-3 px-6 rounded-xl bg-[#8B261E] hover:bg-[#731F18] text-white font-bold text-base shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Play size={18} /> Bắt đầu làm bài
      </button>

      <p className="mt-4 flex items-start gap-2 text-xs text-stone-500">
        <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
        Đồng hồ chạy ngay khi bấm bắt đầu; hết giờ hệ thống tự thu bài.
      </p>
    </div>
  );
}

// --- ExamMobileBar ---
interface ExamMobileBarProps {
  timeLeft: number;
  answeredCount: number;
  totalQuestions: number;
  submitted: boolean;
  submitting: boolean;
  onSubmit: () => void;
  scorePercent: number;
  correctCount: number;
  wrongCount: number;
  showWrongOnly: boolean;
  onToggleWrongOnly: () => void;
}

/** Thanh dính đáy màn hình điện thoại: khung bên phải của desktop nằm cuối trang nên không thấy giờ. */
export function ExamMobileBar({
  timeLeft,
  answeredCount,
  totalQuestions,
  submitted,
  submitting,
  onSubmit,
  scorePercent,
  correctCount,
  wrongCount,
  showWrongOnly,
  onToggleWrongOnly,
}: ExamMobileBarProps) {
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-stone-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      {submitted ? (
        <>
          <div className="flex-1 text-sm">
            <strong className="text-stone-900">{scorePercent}%</strong>
            <span className="text-stone-500"> · {correctCount}/{totalQuestions} câu đúng</span>
          </div>
          {wrongCount > 0 && (
            <button
              type="button"
              onClick={onToggleWrongOnly}
              aria-pressed={showWrongOnly}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold cursor-pointer"
            >
              <Filter size={13} /> {showWrongOnly ? 'Xem tất cả' : `${wrongCount} câu sai`}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex-1">
            <div className="font-mono text-lg font-bold text-stone-900 leading-none">{formatExamTime(timeLeft)}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {answeredCount}/{totalQuestions} câu đã làm
            </div>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8B261E] text-white text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck size={15} /> {submitting ? 'Đang nộp…' : 'Nộp bài'}
          </button>
        </>
      )}
    </div>
  );
}

// --- PracticeQuestionCard ---
interface PracticeQuestionCardProps {
  question: QuizQuestion;
  /** Mục lục câu hỏi cuộn tới phần tử có id này. */
  domId: string;
  index: number;
  answer: UserQuizAnswer | undefined;
  submitted: boolean;
  /** Kết quả đúng/sai do server chấm; chưa nộp bài thì undefined. */
  isCorrect: boolean | undefined;
  setAnswer: (questionId: string, answer: UserQuizAnswer) => void;
  moveOrderingItem: (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => void;
}

export function PracticeQuestionCard({
  question,
  domId,
  index,
  answer,
  submitted,
  isCorrect,
  setAnswer,
  moveOrderingItem,
}: PracticeQuestionCardProps) {
  return (
    <div
      id={domId}
      className="p-5 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:border-stone-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#8B261E] text-white flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {QUIZ_QUESTION_TYPE_META[question.type]?.label ?? question.type}
          </span>
        </div>
        {submitted && isCorrect !== undefined && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${
              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {isCorrect ? 'Chính xác' : 'Chưa đúng'}
          </span>
        )}
      </div>

      <h4 className="text-sm md:text-base font-medium text-stone-900 leading-snug">{question.prompt}</h4>

      <QuestionBody
        question={question}
        answer={answer}
        submitted={submitted}
        setAnswer={setAnswer}
        moveOrderingItem={moveOrderingItem}
      />

      {submitted && question.explanation && (
        <p className="mt-4 rounded-lg bg-amber-50/70 border border-amber-200/70 p-3 text-xs sm:text-sm text-stone-700">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

// --- PracticeExamDialog ---
const DIALOG_TONE_CLASS: Record<ExamDialog['tone'], string> = {
  warning: 'bg-[#8B261E] hover:bg-[#731F18]',
  danger: 'bg-rose-600 hover:bg-rose-700',
};

/** Hộp thoại của phòng thi, thay cho alert/confirm của trình duyệt. */
export function PracticeExamDialog({ dialog, onClose }: { dialog: ExamDialog | null; onClose: () => void }) {
  if (!dialog) return null;
  const confirm = () => {
    onClose();
    dialog.onConfirm();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={dialog.cancelLabel ? onClose : undefined}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="practice-exam-dialog-title"
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === KeyboardKey.ESCAPE && dialog.cancelLabel) onClose();
        }}
      >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 shrink-0 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <Info size={18} />
          </span>
          <div>
            <h3 id="practice-exam-dialog-title" className="text-base font-serif font-bold text-stone-900">
              {dialog.title}
            </h3>
            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{dialog.message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {dialog.cancelLabel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-sm font-bold hover:bg-stone-50 cursor-pointer"
            >
              {dialog.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={confirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-bold cursor-pointer ${DIALOG_TONE_CLASS[dialog.tone]}`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
