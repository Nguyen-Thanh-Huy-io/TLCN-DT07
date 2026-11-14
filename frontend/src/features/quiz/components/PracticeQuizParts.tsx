'use client';

import React from 'react';
import { Search, X, ChevronDown, ChevronUp, Layers, BookOpen, HelpCircle, Clock, CheckCircle2, SearchX, Trophy, ShieldCheck, Play, User, Sparkles, Info, XCircle, RotateCcw, BarChart3 } from 'lucide-react';
import {
  ALL_TOPICS_ID,
  QuizTopicOption,
  QuizFilterableItem,
} from '../utils/practice-quiz.helper';
import { QUIZ_QUESTION_TYPE_META, type QuizQuestion } from '@/features/lessons/types/quiz.types';
import { QuestionBody } from '@/features/public-curriculum/components/hub/HubLessonQuiz';
import type { UserQuizAnswer } from '@/features/public-curriculum/strategies/public-curriculum.strategies';

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
            placeholder="Tìm theo tên bài học, chủ đề, sự kiện..."
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
interface QuizSelectorGridProps<T extends QuizFilterableItem> {
  lessons: T[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onClearFilters?: () => void;
}

export function QuizSelectorGrid<T extends QuizFilterableItem>({
  lessons,
  activeLessonId,
  onSelectLesson,
  onClearFilters,
}: QuizSelectorGridProps<T>) {
  if (lessons.length === 0) {
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
      {lessons.map((lesson) => {
        const isSelected = lesson.id === activeLessonId;
        const questionCount = lesson.quiz?.questions?.length || 0;
        const timeLimit = lesson.quiz?.timeLimitMinutes || 15;

        return (
          <button
            key={lesson.id}
            type="button"
            data-testid="quiz-card"
            onClick={() => onSelectLesson(lesson.id)}
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
                {lesson.topic?.name || 'Chủ đề Lịch sử'}
              </div>
              <div className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                {lesson.title}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1 font-medium">
                <HelpCircle size={12} className="text-stone-400" />
                {questionCount} câu hỏi
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Clock size={12} className="text-stone-400" />
                {timeLimit} phút
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
  learnerName: string;
  onLearnerNameChange: (name: string) => void;
  onStartExam: () => void;
}

export const QuizBriefingCard: React.FC<QuizBriefingCardProps> = ({
  quizTitle,
  topicName,
  description,
  questionCount,
  timeLimitMinutes,
  passingScorePercent,
  learnerName,
  onLearnerNameChange,
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
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <User size={14} className="text-[#8B261E]" /> Tên thí sinh tham gia:
        </label>
        <input
          type="text"
          value={learnerName}
          onChange={(e) => onLearnerNameChange(e.target.value)}
          placeholder="Nhập họ và tên hoặc biệt danh..."
          className="w-full px-4 py-2.5 bg-white rounded-lg border border-stone-300 text-stone-900 text-sm focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 outline-none transition-all mb-4"
        />

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
  index,
  answer,
  submitted,
  isCorrect,
  setAnswer,
  moveOrderingItem,
}: PracticeQuestionCardProps) {
  return (
    <div
      id={`question-box-${index}`}
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

// --- QuizExamSidebar.tsx ---
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
  answered: boolean[];
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
  answered,
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
            {answered.filter(Boolean).length}/{totalQuestions} đã làm
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const isAnswered = Boolean(answered[idx]);
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
