'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, Clock3, ExternalLink, ListTree, Menu, X } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import {
  DEFAULT_COVER_IMAGES,
  PUBLIC_CURRICULUM_ROUTES,
  PUBLIC_DIFFICULTY_META,
} from '../constants/public-curriculum.constants';
import { usePublicLessonReaderFacade } from '../facades/usePublicLessonReaderFacade';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubBadge, HubButton } from './hub/HubUi';
import { HubSyllabus, chapterLabel } from './hub/HubSyllabus';
import { HubLessonQuiz } from './hub/HubLessonQuiz';
import { useLessonProgress } from './hub/useLessonProgress';

interface PublicLessonReaderViewProps {
  slug: string;
  pathId?: string | null;
}

export function PublicLessonReaderView({ slug, pathId }: PublicLessonReaderViewProps) {
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
  const { isCompleted, markCompleted } = useLessonProgress();
  const [mobileSyllabus, setMobileSyllabus] = useState(false);
  const router = useRouter();

  // Passing the end-of-lesson quiz counts as finishing the lesson.
  useEffect(() => {
    if (lesson && submittedQuiz && quizEvaluation?.passed) markCompleted(lesson.id);
  }, [lesson, submittedQuiz, quizEvaluation, markCompleted]);

  const { prevLesson, nextLesson, flatLessons, currentIndex, currentChapter } = navigationContext;
  const lessonHref = (s: string) => PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(s, learningPath?.id);
  const backHref = learningPath
    ? `${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${learningPath.id}`
    : PUBLIC_CURRICULUM_ROUTES.CURRICULUM;

  const completeAndContinue = () => {
    if (!lesson) return;
    markCompleted(lesson.id);
    if (nextLesson) router.push(lessonHref(nextLesson.slug));
  };

  const difficulty = lesson?.difficulty ? PUBLIC_DIFFICULTY_META[lesson.difficulty] : null;
  const done = lesson ? isCompleted(lesson.id) : false;

  return (
    <div className="lh-app">
      <Header activeTab="curriculum" />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-lh-line pb-5">
          <Link href={backHref} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.ghost} -ml-3`}>
            <ArrowLeft className="size-4" /> Quay lại lộ trình
          </Link>
          {learningPath && (
            <HubButton variant="outline" className="lg:hidden" onClick={() => setMobileSyllabus(true)}>
              <Menu className="size-4" /> Nội dung
            </HubButton>
          )}
          {learningPath && (
            <div className="hidden text-right lg:block">
              <div className="max-w-sm truncate text-sm font-bold text-lh-ink">{learningPath.title}</div>
              <div className="text-xs text-lh-muted">Tiến độ lưu trên trình duyệt này</div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              <div className="h-10 w-2/3 animate-pulse rounded-xl bg-lh-surface-2" />
              <div className="aspect-[2.2/1] animate-pulse rounded-2xl bg-lh-surface-2" />
              <div className="h-40 animate-pulse rounded-2xl bg-lh-surface-2" />
            </div>
            <div className="hidden h-96 animate-pulse rounded-2xl bg-lh-surface-2 lg:block" />
          </div>
        ) : error || !lesson ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-lh-red/30 bg-lh-red-soft p-10 text-center">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-red">Không tìm thấy bài học</h1>
            <p className="mt-2 text-sm text-lh-muted">{error || 'Bài học bạn yêu cầu không tồn tại hoặc đã bị gỡ.'}</p>
            <Link href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary} mt-5`}>
              <ArrowLeft className="size-4" /> Về Chương trình học
            </Link>
          </div>
        ) : (
          <div className={`grid gap-8 ${learningPath ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.section
                key={lesson.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="min-w-0"
              >
                <div className="mb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <HubBadge tone="brand">
                      <BookOpen className="size-3.5" /> Bài đọc
                    </HubBadge>
                    {currentIndex >= 0 && (
                      <span className="text-xs text-lh-muted">
                        Bài {currentIndex + 1}/{flatLessons.length}
                      </span>
                    )}
                    {currentChapter && (
                      <>
                        <span className="text-lh-muted/40">•</span>
                        <span className="text-xs text-lh-muted">
                          Chương {currentChapter.index}: {chapterLabel(currentChapter.title)}
                        </span>
                      </>
                    )}
                    <span className="text-lh-muted/40">•</span>
                    <span className="flex items-center gap-1 text-xs text-lh-muted">
                      <Clock3 className="size-3.5" /> ~{lesson.estimatedReadMinutes || 3} phút
                    </span>
                    {difficulty && <HubBadge tone="gold">{difficulty.label}</HubBadge>}
                    {done && (
                      <HubBadge tone="brand">
                        <CheckCircle2 className="size-3.5" /> Đã hoàn thành
                      </HubBadge>
                    )}
                  </div>
                  <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight text-lh-ink sm:text-4xl">
                    {lesson.title}
                  </h1>
                  {lesson.description && <p className="mt-2 text-base leading-7 text-lh-muted">{lesson.description}</p>}
                  {(lesson.tags || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(lesson.tags || []).map((tag) => (
                        <span key={tag.id} className="rounded-full bg-lh-surface-2 px-2.5 py-1 text-xs font-semibold text-lh-muted">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-7 overflow-hidden rounded-2xl">
                  <img src={lesson.thumbnailUrl || DEFAULT_COVER_IMAGES[0]} alt={lesson.title} className="aspect-[2.2/1] w-full object-cover" />
                </div>

                {tocItems.length > 1 && (
                  <nav className="mb-7 rounded-2xl border border-lh-line bg-lh-surface p-4" aria-label="Mục lục bài học">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lh-brand">
                      <ListTree className="size-4" /> Mục lục
                    </div>
                    <ol className="grid gap-1 sm:grid-cols-2">
                      {tocItems.map((item, idx) => (
                        <li key={item.id} style={{ paddingLeft: `${Math.max(0, item.level - 1) * 12}px` }}>
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex gap-2 rounded-lg px-2 py-1.5 text-sm text-lh-ink transition hover:bg-lh-surface-2 hover:text-lh-brand"
                          >
                            <span className="font-bold text-lh-gold">{idx + 1}.</span>
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}

                <article className="rounded-2xl border border-lh-line bg-lh-surface p-6 md:p-9">
                  <div
                    className="tiptap-content-box !p-0 leading-relaxed text-lh-ink"
                    dangerouslySetInnerHTML={{
                      __html: compiledHtml || '<p class="italic">Nội dung bài học đang được biên tập viên cập nhật.</p>',
                    }}
                  />
                  {resourceLinks.length > 0 && (
                    <div className="mt-8 border-t border-lh-line pt-6">
                      <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">Sử liệu & liên kết tham khảo</h2>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {resourceLinks.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-lh-line bg-lh-surface-2 p-4 transition hover:border-lh-brand/40"
                          >
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-lh-brand">
                              {link.title} <ExternalLink className="size-3.5" />
                            </span>
                            {link.note && <p className="mt-1 text-xs leading-5 text-lh-muted">{link.note}</p>}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>

                {quiz && quiz.questions?.length > 0 && (
                  <div className="mt-8">
                    <HubLessonQuiz
                      quiz={quiz}
                      evaluation={quizEvaluation}
                      answers={userAnswers}
                      submitted={submittedQuiz}
                      setAnswer={setAnswer}
                      moveOrderingItem={moveOrderingItem}
                      onSubmit={handleSubmitQuiz}
                      onRetry={handleRetryQuiz}
                    />
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-lh-line pt-5 sm:flex-row">
                  {prevLesson ? (
                    <Link href={lessonHref(prevLesson.slug)} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}>
                      <ChevronLeft className="size-4" /> Bài trước
                    </Link>
                  ) : (
                    <span />
                  )}
                  {nextLesson ? (
                    <HubButton onClick={completeAndContinue}>
                      {done ? 'Sang bài tiếp theo' : 'Đánh dấu hoàn thành & tiếp tục'}
                      {done ? <ArrowRight className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </HubButton>
                  ) : (
                    <HubButton onClick={() => lesson && markCompleted(lesson.id)} disabled={done}>
                      {done ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành'} <CheckCircle2 className="size-4" />
                    </HubButton>
                  )}
                </div>
              </motion.section>
            </AnimatePresence>

            {learningPath && (
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <HubSyllabus path={learningPath} activeLessonId={lesson.id} isCompleted={isCompleted} />
                </div>
              </aside>
            )}
          </div>
        )}

        <AnimatePresence>
          {mobileSyllabus && learningPath && (
            <>
              <motion.button
                aria-label="Đóng nội dung"
                onClick={() => setMobileSyllabus(false)}
                className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed bottom-0 right-0 top-0 z-[70] w-[min(92vw,24rem)] overflow-y-auto bg-lh-canvas p-4 shadow-2xl lg:hidden"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-[family-name:var(--font-heading)] text-xl font-bold text-lh-ink">Chương trình học</div>
                  <HubButton variant="ghost" className="size-10 p-0" onClick={() => setMobileSyllabus(false)} aria-label="Đóng">
                    <X className="size-5" />
                  </HubButton>
                </div>
                <HubSyllabus
                  path={learningPath}
                  activeLessonId={lesson?.id}
                  isCompleted={isCompleted}
                  onNavigate={() => setMobileSyllabus(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
