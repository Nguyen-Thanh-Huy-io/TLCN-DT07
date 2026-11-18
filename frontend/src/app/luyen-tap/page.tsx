'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
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
import {
  ActiveQuizSummary,
  PracticeExamDialog,
  PracticeQuestionCard,
  QuizBriefingCard,
  QuizFilterBar,
  QuizSelectorGrid,
} from '@/features/quiz/components/PracticeQuizParts';
import { QuizExamSidebar } from '@/features/quiz/components/QuizExamSidebar';
import { QuizStatisticsModal } from '@/features/quiz/components/QuizStatisticsModal';
import {
  DEFAULT_TIME_LIMIT_MINUTES,
  usePracticeExam,
  type PracticeExam,
} from '@/features/quiz/facades/usePracticeExam';
import { normalizeQuizQuestionForDisplay } from '@/features/public-curriculum/strategies/public-curriculum.strategies';
import { QuizApiService, type PracticeQuizItem } from '@/services/entities/quiz.service';
import { extractErrorMessage } from '@/services/api';
import { Clock, Sparkles, HelpCircle } from 'lucide-react';

/** Khớp với DEFAULT_QUIZ_PASSING_SCORE_PERCENT ở backend/src/quiz/quiz.constant.ts — chỉ dùng khi dữ liệu cũ thiếu trường này. */
const DEFAULT_PASSING_SCORE_PERCENT = 80;

const questionBoxId = (index: number) => `question-box-${index}`;

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
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Đã đăng nhập thì lượt làm gắn tài khoản (server lấy từ token); khách mới cần tự nhập tên.
  const accountName = sessionUser ? sessionUser.displayName || sessionUser.username : null;
  const [guestName, setGuestName] = useState('');

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
  // Đề công khai không có đáp án; chuẩn hoá để hiển thị (trường đáp án để trống tới khi nộp bài).
  const briefingQuestions = useMemo(
    () => (activeQuiz?.questions ?? []).map(normalizeQuizQuestionForDisplay),
    [activeQuiz],
  );

  const exam = usePracticeExam({
    quiz: activeQuiz,
    briefingQuestions,
    guestLearnerName: accountName ? undefined : guestName.trim() || undefined,
  });

  const handleSelectQuiz = (quizId: string) =>
    exam.confirmDiscard(() => {
      setActiveQuizId(quizId);
      exam.reset();
    }, 'Đổi đề');

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-[family-name:var(--font-body)] text-stone-800">
      <Header activeTab="quiz" />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#1C2826] to-[#2C3E35] text-stone-100 py-10 md:py-14 px-4 border-b border-[#3E5246]">
        <div className="max-w-6xl mx-auto relative z-10">
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
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
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
            <ActiveQuizSummary
              quiz={activeQuiz}
              totalQuizCount={quizzes.length}
              onExpand={() => setIsListExpanded(true)}
            />
          )}
        </div>

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
        ) : !activeQuiz || exam.questions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
            <HelpCircle size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="text-base font-medium text-stone-700">Chưa có đề luyện tập nào.</p>
          </div>
        ) : (
          <PracticeExamStage
            quiz={activeQuiz}
            exam={exam}
            accountName={accountName}
            guestName={guestName}
            onGuestNameChange={setGuestName}
            isStaff={isStaff}
            onOpenStatistics={() => setShowStatsModal(true)}
          />
        )}
      </main>

      <QuizStatisticsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        quizId={activeQuiz?.id}
        quizTitle={activeQuiz?.title}
      />

      <PracticeExamDialog dialog={exam.dialog} onClose={exam.closeDialog} />

      <Footer />
    </div>
  );
}

interface PracticeExamStageProps {
  quiz: PracticeQuizItem;
  exam: PracticeExam;
  accountName: string | null;
  guestName: string;
  onGuestNameChange: (name: string) => void;
  isStaff: boolean;
  onOpenStatistics: () => void;
}

/** Màn chuẩn bị trước giờ làm, hoặc phòng thi (câu hỏi + bảng điều khiển) khi đã bắt đầu / đã nộp. */
function PracticeExamStage({
  quiz,
  exam,
  accountName,
  guestName,
  onGuestNameChange,
  isStaff,
  onOpenStatistics,
}: PracticeExamStageProps) {
  const { questions, result, submitted } = exam;
  const timeLimitMinutes = quiz.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES;
  const passingScorePercent = quiz.passingScorePercent ?? DEFAULT_PASSING_SCORE_PERCENT;
  const isCorrectAt = (index: number) => Boolean(result?.results[questions[index]?.id]);
  const visibleQuestions = questions
    .map((question, index) => ({ question, index }))
    .filter(({ index }) => !exam.showWrongOnly || !isCorrectAt(index));

  const handleJumpToQuestion = (index: number) => {
    if (exam.showWrongOnly && isCorrectAt(index)) exam.setShowWrongOnly(false);
    // Đợi React vẽ lại câu vừa bỏ lọc rồi mới cuộn tới.
    setTimeout(() => {
      document.getElementById(questionBoxId(index))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  if (!exam.examStarted && !submitted) {
    return (
      <QuizBriefingCard
        quizTitle={quiz.title}
        topicName={topicLabelOf(quiz)}
        description={quiz.description}
        questionCount={questions.length}
        timeLimitMinutes={timeLimitMinutes}
        passingScorePercent={passingScorePercent}
        accountName={accountName}
        guestName={guestName}
        onGuestNameChange={onGuestNameChange}
        onStartExam={exam.start}
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 bg-gradient-to-r from-stone-50 to-[#FAF7F2] border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#8B261E]/10 text-[#8B261E] uppercase tracking-wider">
              {exam.showWrongOnly ? `Xem lại ${exam.wrongCount} câu sai` : 'Đề kiểm tra trắc nghiệm'}
            </span>
            <h3 className="text-lg md:text-xl font-serif font-bold text-stone-900 mt-1">{quiz.title}</h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 bg-white px-3 py-1.5 rounded-lg border border-stone-200">
            <Clock size={14} className="text-[#8B261E]" />
            <span>{timeLimitMinutes} phút</span>
            <span>•</span>
            <span>Đạt: {passingScorePercent}%</span>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-6">
          {visibleQuestions.map(({ question, index }) => (
            <PracticeQuestionCard
              key={question.id}
              domId={questionBoxId(index)}
              question={question}
              index={index}
              answer={exam.answers[question.id]}
              submitted={submitted}
              isCorrect={result?.results[question.id]}
              setAnswer={exam.setAnswer}
              moveOrderingItem={exam.moveOrderingItem}
            />
          ))}
        </div>
      </div>

      <QuizExamSidebar
        timeLeft={exam.timeLeft}
        totalTimeMinutes={timeLimitMinutes}
        examStarted={exam.examStarted}
        submitted={submitted}
        submitting={exam.submitting}
        submitError={exam.submitError}
        onStartExam={exam.start}
        onSubmitExam={exam.requestSubmit}
        onResetExam={exam.reset}
        answered={exam.answered}
        correctness={result ? questions.map((_, index) => isCorrectAt(index)) : null}
        scorePercent={result?.scorePercent ?? 0}
        correctCount={result?.correctCount ?? 0}
        wrongCount={exam.wrongCount}
        showWrongOnly={exam.showWrongOnly}
        onToggleWrongOnly={() => exam.setShowWrongOnly((prev) => !prev)}
        onJumpToQuestion={handleJumpToQuestion}
        isStaff={isStaff}
        onOpenStatistics={onOpenStatistics}
      />
    </div>
  );
}
