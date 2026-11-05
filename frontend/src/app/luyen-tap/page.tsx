'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import {
  ALL_TOPICS_ID,
  extractAvailableTopics,
  filterQuizLessons,
} from '@/features/quiz/strategies/quiz-filter.strategy';
import { QuizFilterBar } from '@/features/quiz/components/QuizFilterBar';
import { QuizSelectorGrid } from '@/features/quiz/components/QuizSelectorGrid';
import { QuizBriefingCard } from '@/features/quiz/components/QuizBriefingCard';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Trophy,
  XCircle,
  Sparkles,
  ShieldCheck,
  BarChart3,
  User,
  AlertTriangle,
  Play,
  X,
} from 'lucide-react';

interface QuizOptionObject {
  id?: string;
  text?: string;
  isCorrect?: boolean;
}

type QuizOptionItem = string | QuizOptionObject;

interface RawQuizQuestion {
  id: string;
  type: string;
  prompt: string;
  options?: QuizOptionItem[];
  correctAnswer?: string | boolean;
  acceptedAnswers?: string[];
  explanation?: string;
}

interface PublicQuiz {
  id: string;
  title: string;
  description: string | null;
  passingScorePercent: number;
  timeLimitMinutes: number;
  questions: RawQuizQuestion[];
}

interface PublicLessonWithQuiz {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  difficulty: string;
  estimatedReadMinutes: number;
  topic: { id: string; name: string; slug: string } | null;
  quiz: PublicQuiz | null;
}

interface QuizStatisticsData {
  quizTitle: string;
  lessonTitle?: string;
  summary: {
    totalAttempts: number;
    passedAttempts: number;
    passRatePercent: number;
    averageScore: number;
    averageTimeMinutes: string;
  };
  recentAttempts: Array<{
    id: string;
    learnerName: string;
    scorePercent: number;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    isPassed: boolean;
    submittedAt: string;
  }>;
}

function getOptionLabel(opt: QuizOptionItem): string {
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt !== null) {
    return opt.text || opt.id || '';
  }
  return String(opt);
}

function isOptionCorrectAnswer(opt: QuizOptionItem, q: RawQuizQuestion): boolean {
  if (typeof opt === 'object' && opt !== null && typeof opt.isCorrect === 'boolean') {
    return opt.isCorrect;
  }
  const label = getOptionLabel(opt);
  if (typeof q.correctAnswer === 'string') {
    return label.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
  }
  return false;
}

export default function LuyenTapPage() {
  const [lessons, setLessons] = useState<PublicLessonWithQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Thông tin thí sinh
  const [learnerName, setLearnerName] = useState('Thí sinh tự do');

  // Trạng thái bài thi & Tính giờ
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // giây
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bài làm & Nộp
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewExplanation, setViewExplanation] = useState<Record<number, boolean>>({});

  // Modal Thống kê
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsData, setStatsData] = useState<QuizStatisticsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Bộ lọc & Tìm kiếm Đề thi
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(ALL_TOPICS_ID);
  const [isListExpanded, setIsListExpanded] = useState(true);

  const topics = useMemo(() => extractAvailableTopics(lessons), [lessons]);
  const filteredLessons = useMemo(
    () => filterQuizLessons(lessons, { query: filterQuery, topicId: selectedTopicId }),
    [lessons, filterQuery, selectedTopicId]
  );

  useEffect(() => {
    fetch('/api/public/lessons')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list: PublicLessonWithQuiz[] = data.data || [];
        const quizzesOnly = list.filter((l) => l.quiz && l.quiz.questions?.length > 0);
        setLessons(quizzesOnly);
        if (quizzesOnly.length > 0) {
          setActiveLessonId(quizzesOnly[0].id);
        }
      })
      .catch((err) => console.error('Lỗi khi tải bài học luyện tập:', err))
      .finally(() => setLoading(false));
  }, []);

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const activeQuiz = activeLesson?.quiz;
  const questions = activeQuiz?.questions || [];

  // Reset khi đổi đề
  const handleSelectLesson = (lessonId: string) => {
    if (examStarted && !submitted) {
      if (!confirm('Bạn đang trong quá trình làm bài thi. Bạn có chắc chắn muốn đổi đề không?')) {
        return;
      }
    }
    setActiveLessonId(lessonId);
    handleReset();
  };

  const handleStartExam = () => {
    const totalSeconds = (activeQuiz?.timeLimitMinutes || 15) * 60;
    setTimeLeft(totalSeconds);
    setExamStarted(true);
    setSubmitted(false);
    setSelectedAnswers({});
    setViewExplanation({});
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamStarted(false);
    setTimeLeft((activeQuiz?.timeLimitMinutes || 15) * 60);
    setSelectedAnswers({});
    setSubmitted(false);
    setViewExplanation({});
  };

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (examStarted && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
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

  // Format thời gian hiển thị MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qIndex: number, optionVal: string) => {
    if (submitted) return;
    if (!examStarted) {
      handleStartExam();
    }
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionVal }));
  };

  // Tính điểm
  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx];
      if (!userAns) return;

      if (q.type === 'MULTIPLE_CHOICE') {
        const matchedOpt = (q.options || []).find((opt) => getOptionLabel(opt) === userAns);
        if (matchedOpt && isOptionCorrectAnswer(matchedOpt, q)) correct++;
      } else if (q.type === 'TRUE_FALSE') {
        const boolUser = userAns === 'Đúng';
        if (typeof q.correctAnswer === 'boolean') {
          if (boolUser === q.correctAnswer) correct++;
        } else if (typeof q.correctAnswer === 'string') {
          if (userAns.toLowerCase() === q.correctAnswer.toLowerCase()) correct++;
        }
      } else if (q.type === 'FILL_IN_BLANK') {
        const matches = (q.acceptedAnswers || []).some(
          (ans) => ans.trim().toLowerCase() === userAns.trim().toLowerCase()
        );
        if (matches) correct++;
      } else {
        correct++;
      }
    });
    return correct;
  };

  const totalQuestions = questions.length;
  const correctCount = calculateScore();
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = scorePercent >= (activeQuiz?.passingScorePercent || 80);

  // Nộp bài & Lưu vào DB
  const handleSubmitExam = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const totalSeconds = (activeQuiz.timeLimitMinutes || 15) * 60;
    const timeSpent = Math.max(1, totalSeconds - timeLeft);

    try {
      await fetch(`/api/public/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerName: learnerName.trim() || 'Thí sinh tự do',
          scorePercent,
          correctCount,
          totalQuestions,
          timeSpentSeconds: timeSpent,
          isPassed,
          answers: selectedAnswers,
        }),
      });
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Hết giờ làm bài! Hệ thống tự động thu bài và chấm điểm.');
    handleSubmitExam();
  };

  // Mở modal xem thống kê lượt nộp bài
  const handleOpenStatistics = async () => {
    if (!activeQuiz) return;
    setShowStatsModal(true);
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/public/quizzes/${activeQuiz.id}/statistics`);
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
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
            totalCount={lessons.length}
            filteredCount={filteredLessons.length}
            isExpanded={isListExpanded}
            onToggleExpand={() => setIsListExpanded((prev) => !prev)}
          />

          {/* KHI MỞ RỘNG: HIỂN THỊ LƯỚI CARD ĐỀ THI ĐÃ ĐƯỢC LỌC */}
          {isListExpanded ? (
            <QuizSelectorGrid
              lessons={filteredLessons}
              activeLessonId={activeLessonId}
              onSelectLesson={(id) => {
                handleSelectLesson(id);
              }}
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
                      {activeLesson?.topic?.name || 'Chủ đề lịch sử'}
                    </span>
                  </div>
                  <strong className="text-sm md:text-base text-stone-900 truncate block mt-0.5">
                    {activeLesson?.title || 'Chưa chọn đề'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsListExpanded(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Đổi bộ đề khác ({lessons.length} đề)
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
        ) : !activeQuiz || questions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
            <HelpCircle size={48} className="mx-auto text-stone-300 mb-3" />
            <p className="text-base font-medium text-stone-700">Chưa có câu hỏi ôn tập cho chuyên đề này.</p>
          </div>
        ) : !examStarted && !submitted ? (
          /* MÀN HÌNH CHỜ & PHÒNG THI CHUẨN BỊ (BRIEFING) */
          <QuizBriefingCard
            quizTitle={activeQuiz.title}
            topicName={activeLesson?.topic?.name}
            description={activeLesson?.description || activeQuiz.description}
            questionCount={questions.length}
            timeLimitMinutes={activeQuiz.timeLimitMinutes || 15}
            passingScorePercent={activeQuiz.passingScorePercent || 70}
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
                  <span>{activeQuiz.timeLimitMinutes || 15} phút</span>
                  <span>•</span>
                  <span>Đạt: {activeQuiz.passingScorePercent || 70}%</span>
                </div>
              </div>

              {/* Các câu hỏi */}
              <div className="p-5 md:p-6 space-y-6">
                {questions.map((q, idx) => {
                  const isSelected = selectedAnswers[idx];

                  let optionList: string[] = [];
                  if (q.type === 'TRUE_FALSE') {
                    optionList = ['Đúng', 'Sai'];
                  } else if (q.options && q.options.length > 0) {
                    optionList = q.options.map(getOptionLabel);
                  }

                  const checkAnswerCorrect = (val: string) => {
                    if (q.type === 'TRUE_FALSE') {
                      const isTrue = val === 'Đúng';
                      if (typeof q.correctAnswer === 'boolean') return isTrue === q.correctAnswer;
                      if (typeof q.correctAnswer === 'string') return val.toLowerCase() === q.correctAnswer.toLowerCase();
                    } else if (q.type === 'MULTIPLE_CHOICE') {
                      const matched = (q.options || []).find((opt) => getOptionLabel(opt) === val);
                      return matched ? isOptionCorrectAnswer(matched, q) : false;
                    }
                    return false;
                  };

                  const isCurrentCorrect = isSelected ? checkAnswerCorrect(isSelected) : false;
                  const showExpl = submitted || viewExplanation[idx];

                  return (
                    <div
                      key={q.id || idx}
                      id={`question-box-${idx}`}
                      className="p-5 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#8B261E] text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            {q.type === 'MULTIPLE_CHOICE'
                              ? 'Trắc nghiệm'
                              : q.type === 'TRUE_FALSE'
                              ? 'Đúng / Sai'
                              : 'Điền khuyết'}
                          </span>
                        </div>

                        {submitted && (
                          <div>
                            {isCurrentCorrect ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 size={13} /> Chính xác
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                                <XCircle size={13} /> Chưa đúng
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm md:text-base font-medium text-stone-900 mb-3.5 leading-snug">
                        {q.prompt}
                      </h4>

                      {/* Lựa chọn */}
                      {optionList.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-2 mb-2">
                          {optionList.map((optText, optIdx) => {
                            const isOptionSelected = isSelected === optText;
                            const isOptionCorrect = checkAnswerCorrect(optText);

                            let btnStyle = 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800';

                            if (submitted) {
                              if (isOptionCorrect) {
                                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                              } else if (isOptionSelected && !isOptionCorrect) {
                                btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
                              }
                            } else if (isOptionSelected) {
                              btnStyle = 'bg-[#8B261E]/5 border-[#8B261E] text-[#8B261E] font-semibold ring-2 ring-[#8B261E]/20';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={submitted}
                                onClick={() => handleSelectAnswer(idx, optText)}
                                className={`p-3 rounded-lg border text-left text-xs sm:text-sm transition-all duration-150 flex items-center justify-between cursor-pointer ${btnStyle}`}
                              >
                                <span className="leading-relaxed">{optText}</span>
                                {submitted && isOptionCorrect && (
                                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 ml-2" />
                                )}
                                {submitted && isOptionSelected && !isOptionCorrect && (
                                  <XCircle size={15} className="text-rose-500 shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Giải thích */}
                      {q.explanation && (
                        <div className="mt-2.5">
                          {!submitted && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewExplanation((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                              className="text-xs font-semibold text-stone-500 hover:text-[#8B261E] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <HelpCircle size={12} />
                              {showExpl ? 'Ẩn lời giải' : 'Xem gợi ý / giải thích'}
                            </button>
                          )}

                          {showExpl && (
                            <div className="mt-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 leading-relaxed">
                              <span className="font-bold text-amber-900 block mb-0.5">
                                💡 Lời giải thích:
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột bên phải: Bảng điều khiển nộp bài & Đồng hồ bấm giờ (4 cột) */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              {/* Box Đồng hồ đếm ngược */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center justify-center gap-1.5">
                  <Clock size={14} className="text-[#8B261E]" /> Thời gian làm bài
                </div>

                <div
                  className={`text-4xl font-mono font-bold my-2 tracking-tight ${
                    timeLeft <= 60 && examStarted && !submitted
                      ? 'text-rose-600 animate-pulse'
                      : 'text-stone-900'
                  }`}
                >
                  {formatTime(examStarted ? timeLeft : (activeQuiz.timeLimitMinutes || 15) * 60)}
                </div>

                {!examStarted && !submitted && (
                  <button
                    type="button"
                    onClick={handleStartExam}
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

                {submitted && (
                  <div className="text-xs text-stone-500 font-medium">
                    Bài thi đã nộp thành công
                  </div>
                )}
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
                  {questions.map((_, idx) => {
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
                      <strong className="text-emerald-700 font-bold">{correctCount}/{totalQuestions} câu</strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mb-2"
                    >
                      <RotateCcw size={14} /> Làm lại đề này
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenStatistics}
                      className="w-full py-2 rounded-xl border border-stone-200 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BarChart3 size={14} className="text-[#8B261E]" /> Xem Phổ Điểm & Thống Kê
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#8B261E] text-white font-bold text-sm hover:bg-[#721F18] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <ShieldCheck size={16} /> Nộp bài & Xem điểm
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Thống kê Lượt Nộp Bài (Theo dõi ai nộp & điểm số) */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl border border-stone-200 flex flex-col overflow-hidden">
            <div className="p-4 md:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#8B261E]/10 text-[#8B261E] flex items-center justify-center">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-stone-900">
                    Thống Kê Khảo Thí & Danh Sách Nộp Bài
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{activeQuiz?.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {statsLoading ? (
                <div className="py-12 text-center text-stone-500 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#8B261E] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Đang tải dữ liệu thống kê...</p>
                </div>
              ) : statsData ? (
                <>
                  {/* Bảng 3 chỉ số tổng quan */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500 font-medium">Lượt tham gia</div>
                      <div className="text-lg font-bold text-stone-900 mt-0.5">
                        {statsData.summary.totalAttempts}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <div className="text-[11px] text-emerald-700 font-medium">Tỉ lệ đạt chuẩn</div>
                      <div className="text-lg font-bold text-emerald-800 mt-0.5">
                        {statsData.summary.passRatePercent}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                      <div className="text-[11px] text-amber-700 font-medium">Điểm trung bình</div>
                      <div className="text-lg font-bold text-amber-800 mt-0.5">
                        {statsData.summary.averageScore}%
                      </div>
                    </div>
                  </div>

                  {/* Danh sách người nộp bài gần đây */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2.5">
                      Danh sách lượt nộp bài gần đây
                    </h4>

                    {statsData.recentAttempts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                        Chưa có lượt nộp bài nào được ghi nhận cho đề này.
                      </div>
                    ) : (
                      <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                        {statsData.recentAttempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[11px]">
                                {attempt.learnerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-stone-900">{attempt.learnerName}</div>
                                <div className="text-[10px] text-stone-400">
                                  {new Date(attempt.submittedAt).toLocaleTimeString('vi-VN')} &bull;{' '}
                                  {new Date(attempt.submittedAt).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div className="text-[11px] text-stone-500">
                                Làm trong: <strong>{attempt.timeSpentSeconds}s</strong>
                              </div>
                              <div
                                className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                                  attempt.isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {attempt.scorePercent}% ({attempt.correctCount}/{attempt.totalQuestions})
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
