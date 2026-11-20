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
  buildTopicFilterOptions,
  filterPracticeQuizzes,
  topicWithDescendants,
  topicLabelOf,
} from '@/features/quiz/utils/practice-quiz.helper';
import {
  ExamMobileBar,
  PracticeExamDialog,
  PracticeQuestionCard,
  QuizBriefingCard,
  QuizFilterBar,
  QuizGridSkeleton,
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
import { fetchTopics, type PublicTopicRef } from '@/services/public/public-content.service';
import { ArrowLeft, Clock, HelpCircle } from 'lucide-react';

/** Khớp với DEFAULT_QUIZ_PASSING_SCORE_PERCENT ở backend/src/quiz/quiz.constant.ts — chỉ dùng khi dữ liệu cũ thiếu trường này. */
const DEFAULT_PASSING_SCORE_PERCENT = 80;

const questionBoxId = (index: number) => `question-box-${index}`;
const scrollToTop = () => window.scrollTo({ top: 0 });

export default function LuyenTapPage() {
  return (
    <Suspense fallback={null}>
      <LuyenTapContent />
    </Suspense>
  );
}

/** Hai màn: chọn đề (danh sách) và làm bài (chuẩn bị → làm → kết quả) của một đề. */
function LuyenTapContent() {
  const sessionUser = useAuthSession();
  const isStaff = isStaffRole(sessionUser?.role);
  const initialTopicId = useSearchParams().get(PRACTICE_TOPIC_PARAM) || ALL_TOPICS_ID;

  const [quizzes, setQuizzes] = useState<PracticeQuizItem[]>([]);
  const [topicTree, setTopicTree] = useState<PublicTopicRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Đã đăng nhập thì lượt làm gắn tài khoản (server lấy từ token); khách mới cần tự nhập tên.
  const accountName = sessionUser ? sessionUser.displayName || sessionUser.username : null;
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    Promise.all([
      QuizApiService.getPracticeQuizzes(),
      // Cây chủ đề chỉ để lọc; lỗi thì ô lọc rơi về danh sách phẳng các chủ đề gắn ở đề.
      fetchTopics().catch((): PublicTopicRef[] => []),
    ])
      .then(([quizList, topicList]) => {
        setQuizzes(quizList);
        setTopicTree(topicList);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, 'Không tải được danh sách đề luyện tập.')))
      .finally(() => setLoading(false));
  }, []);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);
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

  const openQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    exam.reset();
    scrollToTop();
  };

  const backToList = () =>
    exam.confirmDiscard(() => {
      setActiveQuizId(null);
      exam.reset();
      scrollToTop();
    }, 'Về danh sách đề');

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-[family-name:var(--font-body)] text-stone-800">
      <Header activeTab="quiz" />

      {activeQuiz ? (
        <main className="flex-1 max-w-6xl mx-auto px-4 pt-6 pb-28 lg:pb-10 w-full">
          <button
            type="button"
            onClick={backToList}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-[#8B261E] cursor-pointer"
          >
            <ArrowLeft size={16} /> Danh sách đề
          </button>
          <PracticeExamStage
            quiz={activeQuiz}
            exam={exam}
            accountName={accountName}
            guestName={guestName}
            onGuestNameChange={setGuestName}
            isStaff={isStaff}
            onOpenStatistics={() => setShowStatsModal(true)}
          />
        </main>
      ) : (
        <QuizListScreen
          quizzes={quizzes}
          topicTree={topicTree}
          loading={loading}
          loadError={loadError}
          initialTopicId={initialTopicId}
          onOpenQuiz={openQuiz}
        />
      )}

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

interface QuizListScreenProps {
  quizzes: PracticeQuizItem[];
  topicTree: PublicTopicRef[];
  loading: boolean;
  loadError: string | null;
  initialTopicId: string;
  onOpenQuiz: (quizId: string) => void;
}

function QuizListScreen({ quizzes, topicTree, loading, loadError, initialTopicId, onOpenQuiz }: QuizListScreenProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);
  const topics = useMemo(() => buildTopicFilterOptions(topicTree, quizzes), [topicTree, quizzes]);
  const filteredQuizzes = useMemo(() => {
    const topicIds = selectedTopicId === ALL_TOPICS_ID ? null : topicWithDescendants(topicTree, selectedTopicId);
    return filterPracticeQuizzes(quizzes, { query: filterQuery, topicIds });
  }, [quizzes, topicTree, filterQuery, selectedTopicId]);

  const renderBody = () => {
    if (loading) return <QuizGridSkeleton />;
    if (loadError) {
      return (
        <div role="alert" className="p-10 text-center bg-white rounded-2xl border border-rose-200">
          <HelpCircle size={40} className="mx-auto text-rose-300 mb-3" />
          <p className="text-sm font-medium text-rose-700">{loadError}</p>
        </div>
      );
    }
    if (quizzes.length === 0) {
      return (
        <div className="p-10 text-center bg-white rounded-2xl border border-stone-200">
          <HelpCircle size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-sm font-medium text-stone-700">Chưa có đề luyện tập nào.</p>
        </div>
      );
    }
    return (
      <QuizSelectorGrid
        quizzes={filteredQuizzes}
        onOpenQuiz={onOpenQuiz}
        onClearFilters={() => {
          setFilterQuery('');
          setSelectedTopicId(ALL_TOPICS_ID);
        }}
      />
    );
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-3 w-full">
        <div className="border-b border-[#E2D5B8] pb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A1F24] mb-2">
            <span className="w-5 h-[1.5px] bg-[#7A1F24]" />
            Khảo thí & Ôn luyện
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1A10] tracking-tight">
            Luyện tập lịch sử
          </h1>
          <p className="mt-1.5 text-[#6E5F55] text-sm max-w-xl">
            Chọn đề thi để ôn luyện, làm bài có bấm giờ và xem ngay kết quả kèm lời giải chi tiết.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <QuizFilterBar
          query={filterQuery}
          onQueryChange={setFilterQuery}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          topics={topics}
          totalCount={quizzes.length}
          filteredCount={filteredQuizzes.length}
          disabled={loading || Boolean(loadError)}
        />
        {renderBody()}
      </main>
    </>
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
  const toggleWrongOnly = () => exam.setShowWrongOnly((prev) => !prev);

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
        <div className="p-5 md:p-6 bg-gradient-to-r from-stone-50 to-[#FAF7F2] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#8B261E]">
              {exam.showWrongOnly ? `Đang xem lại ${exam.wrongCount} câu sai` : topicLabelOf(quiz)}
            </p>
            <h1 className="text-lg md:text-xl font-serif font-bold text-stone-900 mt-0.5">{quiz.title}</h1>
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
        onToggleWrongOnly={toggleWrongOnly}
        onJumpToQuestion={handleJumpToQuestion}
        isStaff={isStaff}
        onOpenStatistics={onOpenStatistics}
      />

      <ExamMobileBar
        timeLeft={exam.timeLeft}
        answeredCount={exam.answered.filter(Boolean).length}
        totalQuestions={questions.length}
        submitted={submitted}
        submitting={exam.submitting}
        onSubmit={exam.requestSubmit}
        scorePercent={result?.scorePercent ?? 0}
        correctCount={result?.correctCount ?? 0}
        wrongCount={exam.wrongCount}
        showWrongOnly={exam.showWrongOnly}
        onToggleWrongOnly={toggleWrongOnly}
      />
    </div>
  );
}
