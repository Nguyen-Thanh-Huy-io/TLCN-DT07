'use client';

import React from 'react';
import { Search, X, ChevronDown, ChevronUp, Layers, BookOpen, HelpCircle, Clock, CheckCircle2, SearchX, Trophy, ShieldCheck, Play, User, Sparkles, Info, XCircle } from 'lucide-react';
import { ALL_TOPICS_ID, QuizTopicOption, topicLabelOf } from '../utils/practice-quiz.helper';
import type { PracticeQuizItem } from '@/services/entities/quiz.service';
import { QUIZ_QUESTION_TYPE_META, type QuizQuestion } from '@/features/lessons/types/quiz.types';
import { QuestionBody } from '@/features/public-curriculum/components/hub/HubLessonQuiz';
import type { UserQuizAnswer } from '@/features/public-curriculum/strategies/public-curriculum.strategies';
import type { ExamDialog } from '../facades/usePracticeExam';
import { KeyboardKey } from '@/constants/enums';

// --- QuizFilterBar.tsx ---
interface QuizFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  topics: QuizTopicOption[];
  totalCount: number;
  filteredCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const QuizFilterBar: React.FC<QuizFilterBarProps> = ({
  query,
  onQueryChange,
  selectedTopicId,
  onSelectTopic,
  topics,
  totalCount,
  filteredCount,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 md:p-5 mb-6">
      {/* HÀNG TRÊN: Ô TÌM KIẾM & NÚT THU GỌN / MỞ RỘNG */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3.5">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm theo tên đề, chủ đề, sự kiện..."
            aria-label="Tìm kiếm bộ đề luyện tập"
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50/80 hover:bg-stone-50 focus:bg-white text-stone-900 placeholder-stone-400 text-sm rounded-xl border border-stone-200 focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 transition-all outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* NÚT THU GỌN / MỞ RỘNG VÙNG CHỌN ĐỀ */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-white hover:border-stone-300 text-stone-700 text-xs font-bold transition-all cursor-pointer select-none"
          title={isExpanded ? 'Thu gọn danh sách đề để tập trung làm bài' : 'Mở rộng danh sách chọn bộ đề'}
        >
          <Layers size={14} className="text-[#8B261E]" />
          <span>{isExpanded ? 'Thu gọn danh sách' : 'Mở rộng danh sách'}</span>
          <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded-full">
            {filteredCount}
          </span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* HÀNG DƯỚI: CHIP FILTERS CHỦ ĐỀ LỊCH SỬ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <BookOpen size={13} className="text-stone-400" /> Chủ đề:
        </span>

        {/* CHIP: TẤT CẢ */}
        <button
          type="button"
          onClick={() => onSelectTopic(ALL_TOPICS_ID)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            selectedTopicId === ALL_TOPICS_ID
              ? 'bg-[#8B261E] text-white border-[#8B261E] shadow-xs'
              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-white hover:border-stone-300'
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedTopicId === ALL_TOPICS_ID
                ? 'bg-white/20 text-white'
                : 'bg-stone-200/80 text-stone-500'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* CÁC CHIP CHỦ ĐỀ TỰ ĐỘNG TRÍCH XUẤT */}
        {topics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#8B261E] text-white border-[#8B261E] shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-white hover:border-stone-300'
              }`}
            >
              <span>{topic.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-500'
                }`}
              >
                {topic.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- QuizSelectorGrid.tsx ---
interface QuizSelectorGridProps {
  quizzes: PracticeQuizItem[];
  activeQuizId: string | null;
  onSelectQuiz: (id: string) => void;
  onClearFilters?: () => void;
}

export function QuizSelectorGrid({
  quizzes,
  activeQuizId,
  onSelectQuiz,
  onClearFilters,
}: QuizSelectorGridProps) {
  if (quizzes.length === 0) {
    return (
      <div data-testid="quiz-empty-state" className="p-8 text-center bg-white rounded-2xl border border-dashed border-stone-300 mb-6">
        <SearchX size={36} className="mx-auto text-stone-300 mb-2.5" />
        <p className="text-sm font-semibold text-stone-700">
          Không tìm thấy bộ đề nào khớp với từ khóa hoặc chủ đề đã chọn.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3 px-4 py-1.5 text-xs font-bold text-[#8B261E] bg-[#8B261E]/10 hover:bg-[#8B261E]/20 rounded-full transition-all cursor-pointer"
          >
            Xóa bộ lọc để xem tất cả
          </button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="quiz-selector-grid" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {quizzes.map((quiz) => {
        const isSelected = quiz.id === activeQuizId;

        return (
          <button
            key={quiz.id}
            type="button"
            data-testid="quiz-card"
            onClick={() => onSelectQuiz(quiz.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer relative ${
              isSelected
                ? 'bg-white border-[#8B261E] ring-2 ring-[#8B261E]/20 shadow-md translate-y-[-1px]'
                : 'bg-stone-50/90 border-stone-200/90 hover:bg-white hover:border-stone-300 hover:shadow-xs'
            }`}
          >
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-[#8B261E] bg-[#8B261E]/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Đang chọn
              </span>
            )}

            <div>
              <div className="text-[11px] font-bold text-[#8B261E] uppercase tracking-wider mb-1.5 line-clamp-1 pr-16">
                {topicLabelOf(quiz)}
              </div>
              <div className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                {quiz.title}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1 font-medium">
                <HelpCircle size={12} className="text-stone-400" />
                {quiz.questions.length} câu hỏi
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Clock size={12} className="text-stone-400" />
                {quiz.timeLimitMinutes} phút
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- QuizBriefingCard.tsx ---
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

export const QuizBriefingCard: React.FC<QuizBriefingCardProps> = ({
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
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden p-6 md:p-8">
      {/* HEADER PHÒNG CHỜ */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8B261E]/10 text-[#8B261E] uppercase tracking-wider mb-3">
          <Sparkles size={13} /> {topicName || 'Chuyên đề Khảo thí Lịch sử'}
        </span>

        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight mb-3">
          {quizTitle}
        </h2>

        {description && (
          <p className="text-stone-600 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* THÔNG SỐ BỘ ĐỀ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-3xl mx-auto mb-8">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <HelpCircle size={20} className="mx-auto text-[#8B261E] mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            {questionCount}
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Câu hỏi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <Clock size={20} className="mx-auto text-amber-600 mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            {timeLimitMinutes} phút
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Thời lượng
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <Trophy size={20} className="mx-auto text-emerald-600 mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            {passingScorePercent}%
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Chuẩn đạt
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <ShieldCheck size={20} className="mx-auto text-sky-600 mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            Tự động
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Chấm điểm tức thì
          </div>
        </div>
      </div>

      {/* THÔNG TIN THÍ SINH & NÚT BẮT ĐẦU */}
      <div className="max-w-md mx-auto bg-[#FAF7F2] p-5 rounded-xl border border-stone-200 mb-6">
        {accountName ? (
          <p className="flex items-center gap-2 text-sm text-stone-700 mb-4">
            <User size={16} className="text-[#8B261E] shrink-0" />
            <span>
              Làm bài với tài khoản <strong className="text-stone-900">{accountName}</strong>
            </span>
          </p>
        ) : (
          <>
            <label
              htmlFor="practice-guest-name"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <User size={14} className="text-[#8B261E]" /> Tên thí sinh (không bắt buộc):
            </label>
            <input
              id="practice-guest-name"
              type="text"
              maxLength={GUEST_NAME_MAX_LENGTH}
              value={guestName}
              onChange={(e) => onGuestNameChange(e.target.value)}
              placeholder="Nhập họ và tên hoặc biệt danh..."
              className="w-full px-4 py-2.5 bg-white rounded-lg border border-stone-300 text-stone-900 text-sm focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 outline-none transition-all mb-4"
            />
          </>
        )}

        <button
          type="button"
          onClick={onStartExam}
          className="w-full py-3 px-6 rounded-xl bg-[#8B261E] hover:bg-[#731F18] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play size={18} /> Bắt đầu làm bài thi
        </button>
      </div>

      {/* LƯU Ý PHÒNG THI */}
      <div className="max-w-xl mx-auto flex items-start gap-2 text-xs text-stone-500 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
        <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
        <p>
          Thời gian làm bài sẽ bắt đầu đếm ngược ngay khi bạn bấm <strong>&ldquo;Bắt đầu làm bài thi&rdquo;</strong>.
          Hệ thống sẽ tự động thu bài khi hết giờ hoặc khi bạn bấm nộp bài.
        </p>
      </div>
    </div>
  );
};

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

// --- ActiveQuizSummary ---
/** Thẻ đề đang làm khi thu gọn danh sách đề, kèm nút mở lại để đổi đề. */
export function ActiveQuizSummary({
  quiz,
  totalQuizCount,
  onExpand,
}: {
  quiz: PracticeQuizItem | undefined;
  totalQuizCount: number;
  onExpand: () => void;
}) {
  return (
    <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#8B261E] ring-4 ring-[#8B261E]/20" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8B261E] uppercase tracking-wider bg-[#8B261E]/10 px-2 py-0.5 rounded">
              Đang khảo thí
            </span>
            <span className="text-xs text-stone-500 font-medium">
              {quiz ? topicLabelOf(quiz) : 'Chủ đề lịch sử'}
            </span>
          </div>
          <strong className="text-sm md:text-base text-stone-900 truncate block mt-0.5">
            {quiz?.title || 'Chưa chọn đề'}
          </strong>
        </div>
      </div>

      <button
        type="button"
        onClick={onExpand}
        className="shrink-0 px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
      >
        Đổi bộ đề khác ({totalQuizCount} đề)
      </button>
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
