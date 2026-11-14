'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isStaffRole } from '@/services/auth/public-auth.service';
import {
  ALL_TOPICS_ID,
  PRACTICE_TOPIC_PARAM,
  extractAvailableTopics,
  filterPracticeQuizzes,
  topicLabelOf,
} from '@/features/quiz/utils/practice-quiz.helper';
import { QuizFilterBar } from '@/features/quiz/components/PracticeQuizParts';
import { QuizSelectorGrid } from '@/features/quiz/components/PracticeQuizParts';
import { QuizBriefingCard } from '@/features/quiz/components/PracticeQuizParts';
import { PracticeQuestionCard } from '@/features/quiz/components/PracticeQuizParts';
import { QuizExamSidebar } from '@/features/quiz/components/PracticeQuizParts';
import { QuizStatisticsModal } from '@/features/quiz/components/QuizStatisticsModal';
import { QuizQuestionType, type QuizQuestion } from '@/features/lessons/types/quiz.types';
import {
  prepareQuizSessionForLearner,
  type UserQuizAnswer,
} from '@/features/public-curriculum/strategies/public-curriculum.strategies';
import {
  QuizApiService,
  type PracticeQuizItem,
  type QuizAttemptResult,
  type QuizStatisticsData,
} from '@/services/entities/quiz.service';
import { extractErrorMessage } from '@/services/api';
import { MoveDirection } from '@/features/lessons/components/quiz/QuizQuestionEditors';
import {
  Clock,
  Sparkles,
  User,
  HelpCircle,
} from 'lucide-react';

/** Khớp với DEFAULT_QUIZ_PASSING_SCORE_PERCENT ở backend/src/quiz/quiz.constant.ts — chỉ dùng khi dữ liệu cũ thiếu trường này. */
const DEFAULT_PASSING_SCORE_PERCENT = 80;
const DEFAULT_TIME_LIMIT_MINUTES = 15;

export default function LuyenTapPage() {
  return (
    <Suspense fallback={null}>
      <LuyenTapContent />
    </Suspense>
  );
}

function LuyenTapContent() {
  const sessionUser = useAuthSession();
  const isStaff = isStaffRole(sessionUser?.role);
  const initialTopicId = useSearchParams().get(PRACTICE_TOPIC_PARAM) || ALL_TOPICS_ID;

  const [quizzes, setQuizzes] = useState<PracticeQuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // Thông tin thí sinh
  const [learnerName, setLearnerName] = useState('Thí sinh tự do');

  useEffect(() => {
    if (sessionUser?.displayName || sessionUser?.username) {
      void Promise.resolve().then(() => {
        setLearnerName(sessionUser.displayName || sessionUser.username);
      });
    }
  }, [sessionUser]);

  // Trạng thái bài thi & Tính giờ
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // giây
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef<() => void>(() => {});

  // Bài làm & Nộp
  const [answers, setAnswers] = useState<Record<string, UserQuizAnswer>>({});
  // Câu hỏi đã xáo lựa chọn / thứ tự cho lượt làm bài hiện tại (giống trang đọc bài học).
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[] | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const submitted = result !== null;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modal Thống kê
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsData, setStatsData] = useState<QuizStatisticsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Bộ lọc & Tìm kiếm Đề thi
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const [isListExpanded, setIsListExpanded] = useState(true);

  const topics = useMemo(() => extractAvailableTopics(quizzes), [quizzes]);
  const filteredQuizzes = useMemo(
    () => filterPracticeQuizzes(quizzes, { query: filterQuery, topicId: selectedTopicId }),
    [quizzes, filterQuery, selectedTopicId]
  );

  useEffect(() => {
    QuizApiService.getPracticeQuizzes()
      .then((list) => {
        setQuizzes(list);
        const preferred = filterPracticeQuizzes(list, { query: '', topicId: initialTopicId });
        setActiveQuizId((preferred[0] ?? list[0])?.id ?? null);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, 'Không tải được danh sách đề luyện tập.')))
      .finally(() => setLoading(false));
  }, [initialTopicId]);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || quizzes[0];
  const questions = sessionQuestions ?? activeQuiz?.questions ?? [];

  const handleReset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamStarted(false);
    setTimeLeft((activeQuiz?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES) * 60);
    setAnswers({});
    setSessionQuestions(null);
    setResult(null);
    setSubmitError(null);
  }, [activeQuiz]);

  // Reset khi đổi đề
  const handleSelectQuiz = (quizId: string) => {
    if (examStarted && !submitted) {
      if (!confirm('Bạn đang trong quá trình làm bài thi. Bạn có chắc chắn muốn đổi đề không?')) {
        return;
      }
    }
    setActiveQuizId(quizId);
    handleReset();
  };

  const handleStartExam = () => {
    const totalSeconds = (activeQuiz?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES) * 60;
    setTimeLeft(totalSeconds);
    setExamStarted(true);
    setResult(null);
    const { preparedQuiz, initialAnswers } = prepareQuizSessionForLearner({
      questions: activeQuiz?.questions ?? [],
    });
    setSessionQuestions(preparedQuiz.questions);
    setAnswers(initialAnswers);
  };

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (examStarted && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            autoSubmitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, submitted]);

  const handleSetAnswer = (questionId: string, answer: UserQuizAnswer) => {
    if (submitted) return;
    if (!examStarted) {
      handleStartExam();
    }
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleMoveOrderingItem = (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => {
    const question = questions.find((q) => q.id === questionId);
    if (submitted || !question || question.type !== QuizQuestionType.ORDERING) return;
    const current = answers[questionId];
    const order = Array.isArray(current) ? [...current] : question.items.map((item) => item.id);
    const targetIdx = direction === MoveDirection.UP ? fromIdx - 1 : fromIdx + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const [moved] = order.splice(fromIdx, 1);
    order.splice(targetIdx, 0, moved);
    handleSetAnswer(questionId, order);
  };

  const totalQuestions = questions.length;
  const correctCount = result?.correctCount ?? 0;
  const scorePercent = result?.scorePercent ?? 0;

  // Nộp bài & Lưu vào DB
  const handleSubmitExam = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setSubmitError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    const totalSeconds = (activeQuiz.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES) * 60;
    const timeSpent = Math.max(1, totalSeconds - timeLeft);

    try {
      const graded = await QuizApiService.submitQuizAttempt(activeQuiz.id, {
        learnerName: learnerName.trim() || 'Thí sinh tự do',
        timeSpentSeconds: timeSpent,
        answers,
      });
      setResult(graded);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Nộp bài không thành công. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Hết giờ làm bài! Hệ thống tự động thu bài và chấm điểm.');
    handleSubmitExam();
  };
  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmit;
  });

  // Mở modal xem thống kê lượt nộp bài (chỉ dành cho Ban biên tập / Quản trị viên)
  const handleOpenStatistics = async () => {
    if (!activeQuiz) return;
    setShowStatsModal(true);
    setStatsLoading(true);
    try {
      const actualStats = await QuizApiService.getQuizStatistics(activeQuiz.id);
      setStatsData(actualStats);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
      setStatsData(null);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-[family-name:var(--font-body)] text-stone-800">
      <Header activeTab="quiz" />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1C2826] to-[#2C3E35] text-stone-100 py-10 md:py-14 px-4 border-b border-[#3E5246]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#E5B869]/20 text-[#E5B869] text-xs font-bold tracking-wider uppercase mb-3 border border-[#E5B869]/30">
              <Sparkles size={13} className="text-[#E5B869]" /> KHẢO THÍ & ÔN TẬP TÍNH GIỜ
            </div>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Phòng Khảo Thí & Luyện Tập Lịch Sử
            </h1>
            <p className="mt-2 text-stone-300 text-xs md:text-sm max-w-xl leading-relaxed">
              Luyện thi trắc nghiệm bấm giờ thực chiến. Hệ thống tự động tính điểm, lưu lịch sử bài thi và thống kê phổ điểm theo thời gian thực.
            </p>
          </div>

          {/* Ô nhập thông tin thí sinh */}
          <div className="w-full md:w-auto p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E5B869] text-stone-900 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#E5B869]">Thí sinh tham dự</div>
              <input
                type="text"
                disabled={examStarted && !submitted}
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="bg-transparent text-white font-medium text-sm focus:outline-none border-b border-white/30 focus:border-[#E5B869] pb-0.5"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* KHU VỰC BỘ LỌC & CHỌN BỘ ĐỀ LUYỆN TẬP TINH GỌN */}
        <div className="mb-6">
          <QuizFilterBar
            query={filterQuery}
            onQueryChange={setFilterQuery}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            topics={topics}
            totalCount={quizzes.length}
            filteredCount={filteredQuizzes.length}
            isExpanded={isListExpanded}
            onToggleExpand={() => setIsListExpanded((prev) => !prev)}
          />

          {/* KHI MỞ RỘNG: HIỂN THỊ LƯỚI CARD ĐỀ THI ĐÃ ĐƯỢC LỌC */}
          {isListExpanded ? (
            <QuizSelectorGrid
              quizzes={filteredQuizzes}
              activeQuizId={activeQuiz?.id ?? null}
              onSelectQuiz={handleSelectQuiz}
              onClearFilters={() => {
                setFilterQuery('');
                setSelectedTopicId(ALL_TOPICS_ID);
              }}
            />
          ) : (
            /* KHI THU GỌN: CHỈ HIỂN THỊ THẺ TÓM TẮT ĐỀ THI ĐANG LÀM KÈM NÚT ĐỔI ĐỀ */
            <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#8B261E] ring-4 ring-[#8B261E]/20" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B261E] uppercase tracking-wider bg-[#8B261E]/10 px-2 py-0.5 rounded">
                      Đang khảo thí
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {activeQuiz ? topicLabelOf(activeQuiz) : 'Chủ đề lịch sử'}
                    </span>
                  </div>
                  <strong className="text-sm md:text-base text-stone-900 truncate block mt-0.5">
                    {activeQuiz?.title || 'Chưa chọn đề'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsListExpanded(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Đổi bộ đề khác ({quizzes.length} đề)
              </button>
            </div>
          )}
        </div>

        {/* Khu vực làm bài & Bảng điều khiển thi */}
        {loading ? (
          <div className="py-20 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#8B261E] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Đang tải đề thi...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="p-12 text-center bg-white rounded-2xl border border-rose-200 shadow-xs">
            <HelpCircle size={48} className="mx-auto text-rose-300 mb-3" />
            <p className="text-base font-medium text-rose-700">{loadError}</p>
          </div>
        ) : !activeQuiz || questions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
            <HelpCircle size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="text-base font-medium text-stone-700">Chưa có đề luyện tập nào.</p>
          </div>
        ) : !examStarted && !submitted ? (
          /* MÀN HÌNH CHỜ & PHÒNG THI CHUẨN BỊ (BRIEFING) */
          <QuizBriefingCard
            quizTitle={activeQuiz.title}
            topicName={topicLabelOf(activeQuiz)}
            description={activeQuiz.description}
            questionCount={questions.length}
            timeLimitMinutes={activeQuiz.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES}
            passingScorePercent={activeQuiz.passingScorePercent ?? DEFAULT_PASSING_SCORE_PERCENT}
            learnerName={learnerName}
            onLearnerNameChange={setLearnerName}
            onStartExam={handleStartExam}
          />
        ) : (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Cột chính: Danh sách câu hỏi (8 cột) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
              {/* Header đề thi */}
              <div className="p-5 md:p-6 bg-gradient-to-r from-stone-50 to-[#FAF7F2] border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#8B261E]/10 text-[#8B261E] uppercase tracking-wider">
                    Đề kiểm tra trắc nghiệm
                  </span>
                  <h3 className="text-lg md:text-xl font-serif font-bold text-stone-900 mt-1">
                    {activeQuiz.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 bg-white px-3 py-1.5 rounded-lg border border-stone-200">
                  <Clock size={14} className="text-[#8B261E]" />
                  <span>{activeQuiz.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES} phút</span>
                  <span>•</span>
                  <span>Đạt: {activeQuiz.passingScorePercent ?? DEFAULT_PASSING_SCORE_PERCENT}%</span>
                </div>
              </div>

              {/* Các câu hỏi */}
              <div className="p-5 md:p-6 space-y-6">
                {questions.map((q, idx) => (
                  <PracticeQuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    answer={answers[q.id]}
                    submitted={submitted}
                    isCorrect={result?.results[q.id]}
                    setAnswer={handleSetAnswer}
                    moveOrderingItem={handleMoveOrderingItem}
                  />
                ))}
              </div>
            </div>

            {/* Cột bên phải: Bảng điều khiển nộp bài & Đồng hồ bấm giờ (4 cột) */}
            <QuizExamSidebar
              timeLeft={timeLeft}
              totalTimeMinutes={activeQuiz.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES}
              examStarted={examStarted}
              submitted={submitted}
              submitting={submitting}
              submitError={submitError}
              onStartExam={handleStartExam}
              onSubmitExam={handleSubmitExam}
              onResetExam={handleReset}
              totalQuestions={totalQuestions}
              answered={questions.map((q) => answers[q.id] !== undefined)}
              scorePercent={scorePercent}
              correctCount={correctCount}
              isStaff={isStaff}
              onOpenStatistics={handleOpenStatistics}
            />
          </div>
        )}
      </main>

      <QuizStatisticsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        quizTitle={activeQuiz?.title}
        loading={statsLoading}
        data={statsData}
      />

      <Footer />
    </div>
  );
}
