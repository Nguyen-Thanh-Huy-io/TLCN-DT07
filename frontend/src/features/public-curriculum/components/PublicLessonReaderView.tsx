'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import {
  QuizQuestion,
  QuizQuestionType,
  QUIZ_QUESTION_TYPE_META,
} from '@/features/lessons/types/quiz.types';
import {
  DEFAULT_COVER_IMAGES,
  PUBLIC_CURRICULUM_ROUTES,
  PUBLIC_DIFFICULTY_META,
} from '../constants/public-curriculum.constants';
import { usePublicLessonReaderFacade } from '../facades/usePublicLessonReaderFacade';

interface PublicLessonReaderViewProps {
  slug: string;
  pathId?: string | null;
}

export function PublicLessonReaderView({
  slug,
  pathId,
}: PublicLessonReaderViewProps) {
  const {
    lesson,
    learningPath,
    quiz,
    loading,
    error,
    tocItems,
    compiledHtml,
    resourceLinks,
    navigationContext,
    userAnswers,
    setAnswer,
    moveOrderingItem,
    submittedQuiz,
    quizEvaluation,
    handleSubmitQuiz,
    handleRetryQuiz,
  } = usePublicLessonReaderFacade(slug, pathId);

  const [tocOpen, setTocOpen] = useState(true);

  const renderInteractiveQuestion = (q: QuizQuestion, index: number) => {
    const evalDetail = quizEvaluation?.detailsMap.get(q.id);
    const currentAnswer = userAnswers[q.id];

    return (
      <div
        key={q.id}
        className={`rounded-2xl border p-5 transition ${
          submittedQuiz
            ? evalDetail?.isCorrect
              ? 'border-emerald-600/40 bg-emerald-50/70'
              : 'border-red-600/40 bg-red-50/60'
            : 'border-[#d7c5a1] bg-[#fffdf9]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6e181b] text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="rounded-md border border-[#d7c5a1] bg-[#f8f3e8] px-2 py-0.5 text-[11px] font-semibold text-[#6e181b]">
              {QUIZ_QUESTION_TYPE_META[q.type]?.shortLabel || 'Câu hỏi'}
            </span>
          </div>

          {submittedQuiz && evalDetail && (
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                evalDetail.isCorrect
                  ? 'bg-emerald-700 text-white'
                  : 'bg-red-700 text-white'
              }`}
            >
              {evalDetail.isCorrect ? '✓ Chính xác' : '✕ Chưa đúng'}
            </span>
          )}
        </div>

        <p className="mt-3 font-[family-name:var(--font-heading)] text-base font-bold text-[#231b15] md:text-lg">
          {q.prompt}
        </p>

        {/* 1. TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
        {q.type === QuizQuestionType.MULTIPLE_CHOICE && (
          <div className="mt-3.5 space-y-2">
            {q.options.map((opt, optIdx) => {
              const isSelected = currentAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submittedQuiz}
                  onClick={() => setAnswer(q.id, opt.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                    submittedQuiz
                      ? opt.isCorrect
                        ? 'border-emerald-600 bg-emerald-100/90 font-semibold text-emerald-950'
                        : isSelected
                          ? 'border-red-500 bg-red-100/80 text-red-950'
                          : 'border-[#e3d3b3] bg-white/70 text-[#504640]'
                      : isSelected
                        ? 'border-[#6e181b] bg-[#6e181b]/10 font-semibold text-[#501013]'
                        : 'border-[#d7c5a1] bg-white hover:bg-[#f8f3e8] text-[#231b15]'
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. ĐÚNG / SAI */}
        {q.type === QuizQuestionType.TRUE_FALSE && (
          <div className="mt-3.5 grid grid-cols-2 gap-3 sm:max-w-md">
            {[
              { val: true, label: 'Đúng' },
              { val: false, label: 'Sai' },
            ].map((choice) => {
              const isSelected = currentAnswer === choice.val;
              return (
                <button
                  key={String(choice.val)}
                  type="button"
                  disabled={submittedQuiz}
                  onClick={() => setAnswer(q.id, choice.val)}
                  className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-[#6e181b] bg-[#6e181b] text-white'
                      : 'border-[#d7c5a1] bg-white text-[#231b15] hover:bg-[#f8f3e8]'
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. ĐIỀN TỪ VÀO CHỖ TRỐNG */}
        {q.type === QuizQuestionType.FILL_IN_BLANK && (
          <div className="mt-3.5 max-w-md">
            <input
              type="text"
              disabled={submittedQuiz}
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              className="h-10 w-full rounded-xl border border-[#d7c5a1] bg-white px-3.5 text-sm text-[#231b15] outline-none focus:border-[#6e181b]"
            />
          </div>
        )}

        {/* 4. SẮP XẾP THỨ TỰ */}
        {q.type === QuizQuestionType.ORDERING && (
          <div className="mt-3.5 space-y-2">
            {((Array.isArray(currentAnswer)
              ? currentAnswer
              : q.items.map((i) => i.id)) as string[]).map((itemId, idx, arr) => {
              const itemObj = q.items.find((i) => i.id === itemId);
              return (
                <div
                  key={itemId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#d7c5a1] bg-white px-3.5 py-2.5 text-sm text-[#231b15]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#6e181b]">
                      #{idx + 1}
                    </span>
                    <span>{itemObj?.label || itemId}</span>
                  </div>
                  {!submittedQuiz && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveOrderingItem(q.id, idx, 'UP')}
                        className="cursor-pointer rounded border border-[#d7c5a1] px-2 py-0.5 text-xs disabled:opacity-40 hover:bg-[#f8f3e8]"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === arr.length - 1}
                        onClick={() => moveOrderingItem(q.id, idx, 'DOWN')}
                        className="cursor-pointer rounded border border-[#d7c5a1] px-2 py-0.5 text-xs disabled:opacity-40 hover:bg-[#f8f3e8]"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 5. GHÉP ĐÔI TƯƠNG ỨNG */}
        {q.type === QuizQuestionType.MATCHING && (
          <div className="mt-3.5 space-y-2.5">
            {q.leftItems.map((left) => {
              const pairMap =
                currentAnswer &&
                typeof currentAnswer === 'object' &&
                !Array.isArray(currentAnswer)
                  ? (currentAnswer as Record<string, string>)
                  : {};
              return (
                <div
                  key={left.id}
                  className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center rounded-xl border border-[#d7c5a1] bg-white p-3"
                >
                  <span className="text-sm font-medium text-[#231b15]">
                    {left.label}
                  </span>
                  <span className="hidden text-[#83766d] sm:inline">↔</span>
                  <select
                    disabled={submittedQuiz}
                    value={pairMap[left.id] || ''}
                    onChange={(e) =>
                      setAnswer(q.id, {
                        ...pairMap,
                        [left.id]: e.target.value,
                      })
                    }
                    className="h-9 rounded-lg border border-[#d7c5a1] bg-[#fcfaf5] px-2.5 text-sm text-[#231b15] outline-none"
                  >
                    <option value="">-- Chọn vế ghép --</option>
                    {q.rightItems.map((right) => (
                      <option key={right.id} value={right.id}>
                        {right.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* HIỂN THỊ ĐÁP ÁN CHUẨN & GIẢI THÍCH SAU KHI NỘP BÀI */}
        {submittedQuiz && evalDetail && (
          <div className="mt-4 rounded-xl border border-[#d7c5a1] bg-white/90 p-3.5 text-xs text-[#302622]">
            {!evalDetail.isCorrect && evalDetail.correctSummary && (
              <p className="mb-1.5 font-semibold text-emerald-800">
                ✓ Đáp án đúng: {evalDetail.correctSummary}
              </p>
            )}
            {q.explanation && (
              <p className="leading-5 text-[#504640]">
                💡 <strong>Giải thích sử liệu:</strong> {q.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.75),transparent_28%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-3 py-4 md:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden border border-[#d7c5a1] bg-[rgba(249,245,236,0.94)] shadow-[0_24px_65px_rgba(80,47,17,0.08)]">
        <Header activeTab="curriculum" />

        <main className="p-4 md:p-8 lg:p-10">
          {loading ? (
            <div className="rounded-[18px] border border-[#d7c5a1] bg-[#f8f3e8] p-12 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#6e181b] border-t-transparent" />
              <p className="font-[family-name:var(--font-heading)] text-lg text-[#501013]">
                Đang mở bài học lịch sử...
              </p>
            </div>
          ) : error || !lesson ? (
            <div className="rounded-[18px] border border-red-300 bg-red-50/90 p-10 text-center">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#6e181b]">
                Không tìm thấy bài học
              </h2>
              <p className="mt-2 text-sm text-[#504640]">
                {error || 'Bài học bạn yêu cầu không tồn tại hoặc đã bị gỡ.'}
              </p>
              <Link
                href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6e181b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#501013]"
              >
                ← Quay về Chương trình học
              </Link>
            </div>
          ) : (
            <>
              {/* 1. BREADCRUMB & HEADER BÀI HỌC */}
              <section className="rounded-[18px] border border-[#d7c5a1] bg-[#f8f3e8] p-6 md:p-8">
                <nav
                  className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#83766d]"
                  aria-label="Đường dẫn bài học"
                >
                  <Link href="/" className="hover:text-[#6e181b]">
                    Trang chủ
                  </Link>
                  <span>›</span>
                  <Link
                    href={
                      learningPath
                        ? `${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${learningPath.id}`
                        : PUBLIC_CURRICULUM_ROUTES.CURRICULUM
                    }
                    className="hover:text-[#6e181b]"
                  >
                    {learningPath ? learningPath.title : 'Chương trình học'}
                  </Link>
                  {navigationContext.currentChapter && (
                    <>
                      <span>›</span>
                      <span className="text-[#504640]">
                        {/^\s*chương\s+\d+/i.test(
                          navigationContext.currentChapter.title,
                        )
                          ? navigationContext.currentChapter.title
                          : `Chương ${navigationContext.currentChapter.index}: ${navigationContext.currentChapter.title}`}
                      </span>
                    </>
                  )}
                  <span>›</span>
                  <strong className="font-semibold text-[#6e181b]">
                    {lesson.title}
                  </strong>
                </nav>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      {lesson.difficulty &&
                        PUBLIC_DIFFICULTY_META[lesson.difficulty] && (
                          <span
                            className={`rounded-full border px-3 py-0.5 font-semibold ${
                              PUBLIC_DIFFICULTY_META[lesson.difficulty]
                                .className
                            }`}
                          >
                            Độ khó:{' '}
                            {PUBLIC_DIFFICULTY_META[lesson.difficulty].label}
                          </span>
                        )}
                      <span className="rounded-full border border-[#d7c5a1] bg-white/80 px-3 py-0.5 font-medium text-[#504640]">
                        ⏱ ~{lesson.estimatedReadMinutes || 3} phút đọc
                      </span>
                      {navigationContext.flatLessons.length > 0 &&
                        navigationContext.currentIndex >= 0 && (
                          <span className="rounded-full border border-[#d7c5a1] bg-[#efe5d0] px-3 py-0.5 font-semibold text-[#6e181b]">
                            Bài {navigationContext.currentIndex + 1} /{' '}
                            {navigationContext.flatLessons.length} trong lộ
                            trình
                          </span>
                        )}
                    </div>

                    <h1 className="mt-3 font-[family-name:var(--font-heading)] text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1.12] text-[#3a1012]">
                      {lesson.title}
                    </h1>

                    {lesson.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#504640] md:text-base">
                        {lesson.description}
                      </p>
                    )}

                    {/* Danh sách Tags gắn với bài học */}
                    {(lesson.tags || []).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(lesson.tags || []).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full border border-[#d7c5a1] bg-white/85 px-3 py-1 text-xs font-semibold text-[#6e181b]"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#d7c5a1] bg-white shadow-sm">
                    <img
                      src={lesson.thumbnailUrl || DEFAULT_COVER_IMAGES[0]}
                      alt={lesson.title}
                      className="h-52 w-full object-cover"
                    />
                  </div>
                </div>
              </section>

              {/* 2. BỐ CỤC ĐỌC BÀI: MỤC LỤC BÊN TRÁI + NỘI DUNG CHÍNH BÊN PHẢI */}
              <div className="mt-8 grid gap-7 lg:grid-cols-[280px_1fr] lg:items-start">
                {/* CỘT TRÁI: MỤC LỤC BÀI HỌC & DANH SÁCH BÀI CÙNG LỘ TRÌNH */}
                <aside className="space-y-5 lg:sticky lg:top-24">
                  {tocItems.length > 0 && (
                    <div className="rounded-[16px] border border-[#d7c5a1] bg-[#f8f3e8] p-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#d7c5a1] pb-2.5">
                        <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-[#501013]">
                          📜 Mục lục bài học
                        </h2>
                        <button
                          type="button"
                          onClick={() => setTocOpen(!tocOpen)}
                          className="cursor-pointer text-xs font-medium text-[#6e181b] hover:underline"
                        >
                          {tocOpen ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>

                      {tocOpen && (
                        <nav className="mt-3 space-y-1.5 text-xs">
                          {tocItems.map((item, idx) => (
                            <a
                              key={item.id}
                              href={`#${item.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(item.id);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              style={{
                                paddingLeft: `${Math.max(0, item.level - 1) * 10}px`,
                              }}
                              className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-[#302622] transition hover:bg-[#efe5d0] hover:text-[#6e181b]"
                            >
                              <span className="font-mono text-[11px] font-bold text-[#8a6828]">
                                {idx + 1}.
                              </span>
                              <span className="leading-snug">{item.text}</span>
                            </a>
                          ))}
                        </nav>
                      )}
                    </div>
                  )}

                  {/* Khung điều hướng các bài trong cùng Lộ trình */}
                  {learningPath && navigationContext.flatLessons.length > 0 && (
                    <div className="rounded-[16px] border border-[#d7c5a1] bg-[#f8f3e8] p-4 shadow-2xs">
                      <div className="border-b border-[#d7c5a1] pb-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8a6828]">
                          Lộ trình đang theo học
                        </div>
                        <Link
                          href={`${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${learningPath.id}`}
                          className="mt-0.5 block font-[family-name:var(--font-heading)] text-base font-bold text-[#501013] hover:text-[#6e181b]"
                        >
                          {learningPath.title}
                        </Link>
                      </div>

                      <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1 text-xs">
                        {navigationContext.flatLessons.map((item, idx) => {
                          const isCurrent = item.slug === lesson.slug;
                          return (
                            <Link
                              key={item.id}
                              href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(
                                item.slug,
                                learningPath.id,
                              )}
                              className={`flex items-start gap-2 rounded-lg px-2.5 py-2 transition ${
                                isCurrent
                                  ? 'bg-[#6e181b] font-semibold text-white'
                                  : 'text-[#302622] hover:bg-[#efe5d0]'
                              }`}
                            >
                              <span className="shrink-0 font-mono text-[11px] opacity-80">
                                {idx + 1}.
                              </span>
                              <span className="line-clamp-2 leading-snug">
                                {item.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </aside>

                {/* CỘT PHẢI: NỘI DUNG BÀI HỌC ĐA PHƯƠNG TIỆN + TƯ LIỆU + ĐỀ ÔN TẬP */}
                <div className="min-w-0 space-y-8">
                  <article className="rounded-[18px] border border-[#d7c5a1] bg-[#fffdf9] p-6 shadow-xs md:p-9">
                    <div
                      className="tiptap-content-box !p-0 leading-relaxed text-[#231b15]"
                      dangerouslySetInnerHTML={{
                        __html:
                          compiledHtml ||
                          '<p class="italic text-[#83766d]">Nội dung bài học đang được biên tập viên cập nhật.</p>',
                      }}
                    />

                    {/* Liên kết Sử liệu tham khảo cuối bài */}
                    {resourceLinks.length > 0 && (
                      <div className="mt-8 border-t border-[#e3d3b3] pt-6">
                        <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#501013]">
                          📚 Sử liệu & Liên kết tham khảo
                        </h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {resourceLinks.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex flex-col justify-between rounded-xl border border-[#d7c5a1] bg-[#f8f3e8] p-3.5 transition hover:bg-[#efe5d0]"
                            >
                              <div className="text-sm font-semibold text-[#6e181b]">
                                {link.title} ↗
                              </div>
                              {link.note && (
                                <p className="mt-1 text-xs text-[#6a5f53]">
                                  {link.note}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>

                  {/* 3. KHU VỰC ĐỀ ÔN TẬP CUỐI BÀI TƯƠNG TÁC (INTERACTIVE QUIZ) */}
                  {quiz && quiz.questions && quiz.questions.length > 0 && (
                    <section
                      id="on-tap-cuoi-bai"
                      className="rounded-[18px] border-2 border-[#d7c5a1] bg-[#f8f3e8] p-6 shadow-xs md:p-8"
                    >
                      <div className="flex flex-col justify-between gap-3 border-b border-[#d7c5a1] pb-4 sm:flex-row sm:items-center">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6e181b]">
                            Kiểm tra kiến thức lịch sử
                          </span>
                          <h2 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#3a1012]">
                            {quiz.title || 'Đề ôn tập cuối bài học'}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-full border border-[#d7c5a1] bg-white px-3 py-1 font-semibold text-[#501013]">
                            {quiz.questions.length} câu hỏi
                          </span>
                          <span className="rounded-full border border-[#d7c5a1] bg-white px-3 py-1 font-medium text-[#6a5f53]">
                            Điểm đạt: {quiz.passingScorePercent || 70}%
                          </span>
                        </div>
                      </div>

                      {/* Bảng tổng kết kết quả khi người học đã nộp bài */}
                      {submittedQuiz && quizEvaluation && (
                        <div
                          className={`mt-5 flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
                            quizEvaluation.passed
                              ? 'border-emerald-600/50 bg-emerald-50 text-emerald-950'
                              : 'border-amber-600/50 bg-amber-50 text-amber-950'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider">
                              {quizEvaluation.passed
                                ? '🎉 Chúc mừng! Bạn đã vượt qua bài ôn tập'
                                : '📖 Cần ôn tập thêm để nắm vững kiến thức'}
                            </div>
                            <div className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold">
                              Đúng {quizEvaluation.correctCount} /{' '}
                              {quizEvaluation.totalCount} câu (
                              {quizEvaluation.scorePercent}%)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRetryQuiz}
                            className="cursor-pointer rounded-xl border border-[#6e181b] bg-white px-4 py-2.5 text-xs font-bold text-[#6e181b] transition hover:bg-[#6e181b] hover:text-white"
                          >
                            Làm lại đề ôn tập
                          </button>
                        </div>
                      )}

                      <div className="mt-6 space-y-5">
                        {quiz.questions.map((q, idx) =>
                          renderInteractiveQuestion(q, idx),
                        )}
                      </div>

                      {!submittedQuiz && (
                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            className="cursor-pointer rounded-xl bg-[#6e181b] px-6 py-3 text-sm font-bold text-[#fffbeb] shadow-sm transition hover:bg-[#501013]"
                          >
                            Nộp bài & Xem đáp án chi tiết
                          </button>
                        </div>
                      )}
                    </section>
                  )}

                  {/* 4. ĐIỀU HƯỚNG BÀI TRƯỚC / BÀI TIẾP THEO TRONG LỘ TRÌNH */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {navigationContext.prevLesson ? (
                      <Link
                        href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(
                          navigationContext.prevLesson.slug,
                          learningPath?.id,
                        )}
                        className="group flex flex-col justify-between rounded-2xl border border-[#d7c5a1] bg-[#f8f3e8] p-4 transition hover:border-[#6e181b] hover:bg-[#fffdf9]"
                      >
                        <span className="text-xs font-semibold text-[#83766d]">
                          ← Bài học trước
                        </span>
                        <span className="mt-1 font-[family-name:var(--font-heading)] text-lg font-bold text-[#231b15] group-hover:text-[#6e181b]">
                          {navigationContext.prevLesson.title}
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}

                    {navigationContext.nextLesson && (
                      <Link
                        href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(
                          navigationContext.nextLesson.slug,
                          learningPath?.id,
                        )}
                        className="group flex flex-col justify-between rounded-2xl border border-[#d7c5a1] bg-[#f8f3e8] p-4 text-right transition hover:border-[#6e181b] hover:bg-[#fffdf9]"
                      >
                        <span className="text-xs font-semibold text-[#83766d]">
                          Bài học tiếp theo →
                        </span>
                        <span className="mt-1 font-[family-name:var(--font-heading)] text-lg font-bold text-[#231b15] group-hover:text-[#6e181b]">
                          {navigationContext.nextLesson.title}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
