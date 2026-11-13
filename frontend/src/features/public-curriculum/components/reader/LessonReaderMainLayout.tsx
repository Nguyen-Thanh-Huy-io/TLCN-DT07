'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_COVER_IMAGES, PUBLIC_DIFFICULTY_META, PUBLIC_CURRICULUM_ROUTES } from '../../constants/public-curriculum.constants';
import { LessonToc } from '../hub/HubReaderParts';
import { LessonRelated, type RelatedEntities } from '../hub/HubReaderParts';
import { HubLessonQuiz } from '../hub/HubLessonQuiz';
import { DiscussionSection } from '@/features/discussions/components/DiscussionSection';
import { HubSyllabus, chapterLabel } from '../hub/HubReaderParts';
import { LessonItem } from '@/types/models';
import { LearningPathItem } from '@/services/entities/learning-path.service';
import { QuizItem } from '@/features/lessons/types/quiz.types';
import { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import { ResourceLinkBlockData } from '@/features/lessons/types/block-builder.types';
import { UserQuizAnswer } from '../../strategies/public-curriculum.strategies';
import { LessonAccessState } from '../../facades/usePublicLessonReaderFacade';
import { HubLessonGate } from '../hub/HubReaderParts';
import { X, ExternalLink, BookOpen, CheckCircle2, Clock3, ArrowRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { HubButton, HubBadge, HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS } from '../hub/HubReaderParts';
import { sanitizeRichHtml } from '@/utils/common';

interface LessonReaderMainLayoutProps {
  readerColumns: string;
  learningPath: LearningPathItem | null;
  syllabusOpen: boolean;
  onToggleSyllabus: () => void;
  lesson: LessonItem;
  isCompleted: (id: string) => boolean;
  currentIndex: number;
  flatLessonsCount: number;
  currentChapter: { index: number; title: string } | null;
  done: boolean;
  tocItems: LessonTocEntry[];
  contentRef: React.RefObject<HTMLDivElement | null>;
  compiledHtml: string;
  resourceLinks: ResourceLinkBlockData[];
  quiz: QuizItem | null;
  quizEvaluation: {
    detailsMap: Map<string, { isCorrect: boolean; correctSummary: string }>;
    correctCount: number;
    totalCount: number;
    scorePercent: number;
    passed: boolean;
  } | null;
  userAnswers: Record<string, UserQuizAnswer>;
  submittedQuiz: boolean;
  setAnswer: (questionId: string, answer: UserQuizAnswer) => void;
  moveOrderingItem: (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => void;
  onSubmitQuiz: () => void;
  onRetryQuiz: () => void;
  prevLessonHref?: string | null;
  nextLesson?: boolean;
  onCompleteAndContinue: () => void;
  onMarkCompleted: () => void;
  hasRightSidebar: boolean;
  hasToc: boolean;
  hasRelated: boolean;
  related: RelatedEntities;
  SyllabusColumnComponent: React.ComponentType<{
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }>;
}

export function LessonReaderMainLayout({
  readerColumns,
  learningPath,
  syllabusOpen,
  onToggleSyllabus,
  lesson,
  isCompleted,
  currentIndex,
  flatLessonsCount,
  currentChapter,
  done,
  tocItems,
  contentRef,
  compiledHtml,
  resourceLinks,
  quiz,
  quizEvaluation,
  userAnswers,
  submittedQuiz,
  setAnswer,
  moveOrderingItem,
  onSubmitQuiz,
  onRetryQuiz,
  prevLessonHref,
  nextLesson,
  onCompleteAndContinue,
  onMarkCompleted,
  hasRightSidebar,
  hasToc,
  hasRelated,
  related,
  SyllabusColumnComponent,
}: LessonReaderMainLayoutProps) {
  return (
    <div className={`grid gap-8 ${readerColumns}`}>
      {learningPath && (
        <SyllabusColumnComponent open={syllabusOpen} onToggle={onToggleSyllabus}>
          <HubSyllabus path={learningPath} activeLessonId={lesson.id} isCompleted={isCompleted} />
        </SyllabusColumnComponent>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={lesson.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className={`min-w-0 ${!hasRightSidebar ? 'mx-auto w-full max-w-4xl' : ''}`}
        >
          <LessonReaderHeader
            lesson={lesson}
            currentIndex={currentIndex}
            flatLessonsCount={flatLessonsCount}
            currentChapter={currentChapter}
            done={done}
          />

          <div className="mb-7 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lesson.thumbnailUrl || DEFAULT_COVER_IMAGES[0]}
              alt={lesson.title}
              className="aspect-[2.2/1] w-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith(DEFAULT_COVER_IMAGES[0])) img.src = DEFAULT_COVER_IMAGES[0];
              }}
            />
          </div>

          <div className="xl:hidden">
            <LessonToc items={tocItems} />
          </div>

          <LessonReaderArticle
            contentRef={contentRef}
            compiledHtml={compiledHtml}
            resourceLinks={resourceLinks}
          />

          <div className="xl:hidden">
            <LessonRelated html={compiledHtml} />
          </div>

          {quiz && quiz.questions?.length > 0 && (
            <div className="mt-8">
              <HubLessonQuiz
                quiz={quiz}
                evaluation={quizEvaluation}
                answers={userAnswers}
                submitted={submittedQuiz}
                setAnswer={setAnswer}
                moveOrderingItem={moveOrderingItem}
                onSubmit={onSubmitQuiz}
                onRetry={onRetryQuiz}
              />
            </div>
          )}

          <LessonReaderNavigationFooter
            prevLessonHref={prevLessonHref}
            nextLesson={Boolean(nextLesson)}
            done={done}
            onCompleteAndContinue={onCompleteAndContinue}
            onMarkCompleted={onMarkCompleted}
          />

          <DiscussionSection targetType="LESSON" targetId={lesson.id} />
        </motion.section>
      </AnimatePresence>

      <LessonReaderDesktopSidebar
        hasRightSidebar={hasRightSidebar}
        hasToc={hasToc}
        hasRelated={hasRelated}
        tocItems={tocItems}
        compiledHtml={compiledHtml}
        related={related}
      />
    </div>
  );
}

// --- LessonGateSection.tsx ---
export interface LessonGatePreview {
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
}

interface LessonGateSectionProps {
  access: Exclude<LessonAccessState, LessonAccessState.GRANTED>;
  learningPath: LearningPathItem | null;
  syllabusOpen: boolean;
  onToggleSyllabus: () => void;
  isCompleted: (id: string) => boolean;
  lockedPreview: LessonGatePreview | null;
  onEnroll: (pathId: string) => Promise<void>;
  onReload: () => Promise<void>;
  SyllabusColumnComponent: React.ComponentType<{
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }>;
}

export function LessonGateSection({
  access,
  learningPath,
  syllabusOpen,
  onToggleSyllabus,
  isCompleted,
  lockedPreview,
  onEnroll,
  onReload,
  SyllabusColumnComponent,
}: LessonGateSectionProps) {
  const gridClass = learningPath
    ? syllabusOpen
      ? 'lg:grid-cols-[17rem_minmax(0,1fr)]'
      : 'lg:grid-cols-[3rem_minmax(0,1fr)]'
    : '';

  return (
    <div className={`grid gap-8 ${gridClass}`}>
      {learningPath && (
        <SyllabusColumnComponent open={syllabusOpen} onToggle={onToggleSyllabus}>
          <HubSyllabus path={learningPath} isCompleted={isCompleted} />
        </SyllabusColumnComponent>
      )}
      <HubLessonGate
        access={access}
        preview={lockedPreview}
        learningPath={learningPath}
        onEnroll={async (pathId) => {
          await onEnroll(pathId);
          await onReload();
        }}
      />
    </div>
  );
}

// --- LessonMobileSyllabusDrawer.tsx ---
interface LessonMobileSyllabusDrawerProps {
  isOpen: boolean;
  learningPath: LearningPathItem | null;
  activeLessonId?: string;
  isCompleted: (id: string) => boolean;
  onClose: () => void;
}

export function LessonMobileSyllabusDrawer({
  isOpen,
  learningPath,
  activeLessonId,
  isCompleted,
  onClose,
}: LessonMobileSyllabusDrawerProps) {
  if (!learningPath) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            aria-label="Đóng nội dung"
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 top-0 z-[70] w-[min(92vw,24rem)] overflow-y-auto bg-lh-canvas p-4 shadow-2xl lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="font-[family-name:var(--font-heading)] text-xl font-bold text-lh-ink">
                Chương trình học
              </div>
              <HubButton
                variant="ghost"
                className="size-10 p-0"
                onClick={onClose}
                aria-label="Đóng"
              >
                <X className="size-5" />
              </HubButton>
            </div>
            <HubSyllabus
              path={learningPath}
              activeLessonId={activeLessonId}
              isCompleted={isCompleted}
              onNavigate={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// --- LessonReaderArticle.tsx ---
interface LessonReaderArticleProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  compiledHtml: string;
  resourceLinks: ResourceLinkBlockData[];
}

export function LessonReaderArticle({
  contentRef,
  compiledHtml,
  resourceLinks,
}: LessonReaderArticleProps) {
  return (
    <article className="rounded-2xl border border-lh-line bg-lh-surface p-6 md:p-9">
      <div
        ref={contentRef}
        className="tiptap-content-box !p-0 leading-relaxed text-lh-ink"
        dangerouslySetInnerHTML={{
          __html: sanitizeRichHtml(
            compiledHtml ||
              '<p class="italic">Nội dung bài học đang được biên tập viên cập nhật.</p>',
          ),
        }}
      />
      {resourceLinks.length > 0 && (
        <div className="mt-8 border-t border-lh-line pt-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">
            Sử liệu & liên kết tham khảo
          </h2>
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
  );
}

// --- LessonReaderDesktopSidebar.tsx ---
interface LessonReaderDesktopSidebarProps {
  hasRightSidebar: boolean;
  hasToc: boolean;
  hasRelated: boolean;
  tocItems: LessonTocEntry[];
  compiledHtml: string;
  related: RelatedEntities;
}

export function LessonReaderDesktopSidebar({
  hasRightSidebar,
  hasToc,
  hasRelated,
  tocItems,
  compiledHtml,
  related,
}: LessonReaderDesktopSidebarProps) {
  if (!hasRightSidebar) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 grid max-h-[calc(100vh-7rem)] gap-6 overflow-y-auto pb-4 pr-1">
        {hasToc && <LessonToc items={tocItems} compact />}
        {hasRelated && <LessonRelated html={compiledHtml} compact precomputed={related} />}
      </div>
    </aside>
  );
}

// --- LessonReaderHeader.tsx ---
interface LessonReaderHeaderProps {
  lesson: LessonItem;
  currentIndex: number;
  flatLessonsCount: number;
  currentChapter: { index: number; title: string } | null;
  done: boolean;
}

export function LessonReaderHeader({
  lesson,
  currentIndex,
  flatLessonsCount,
  currentChapter,
  done,
}: LessonReaderHeaderProps) {
  const difficulty = lesson.difficulty ? PUBLIC_DIFFICULTY_META[lesson.difficulty] : null;

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <HubBadge tone="brand">
          <BookOpen className="size-3.5" /> Bài đọc
        </HubBadge>
        {currentIndex >= 0 && (
          <span className="text-xs text-lh-muted">
            Bài {currentIndex + 1}/{flatLessonsCount}
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

      {lesson.description && (
        <p className="mt-2 text-base leading-7 text-lh-muted">{lesson.description}</p>
      )}

      {(lesson.tags || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(lesson.tags || []).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-lh-surface-2 px-2.5 py-1 text-xs font-semibold text-lh-muted"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- LessonReaderLoadingSkeleton.tsx ---
export function LessonReaderLoadingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-lh-surface-2" />
        <div className="aspect-[2.2/1] animate-pulse rounded-2xl bg-lh-surface-2" />
        <div className="h-40 animate-pulse rounded-2xl bg-lh-surface-2" />
      </div>
      <div className="hidden h-96 animate-pulse rounded-2xl bg-lh-surface-2 lg:block" />
    </div>
  );
}

// --- LessonReaderNavigationFooter.tsx ---
interface LessonReaderNavigationFooterProps {
  prevLessonHref?: string | null;
  nextLesson?: boolean;
  done: boolean;
  onCompleteAndContinue: () => void;
  onMarkCompleted: () => void;
}

export function LessonReaderNavigationFooter({
  prevLessonHref,
  nextLesson,
  done,
  onCompleteAndContinue,
  onMarkCompleted,
}: LessonReaderNavigationFooterProps) {
  return (
    <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-lh-line pt-5 sm:flex-row">
      {prevLessonHref ? (
        <Link
          href={prevLessonHref}
          className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}
        >
          <ChevronLeft className="size-4" /> Bài trước
        </Link>
      ) : (
        <span />
      )}

      {nextLesson ? (
        <HubButton onClick={onCompleteAndContinue}>
          {done ? 'Sang bài tiếp theo' : 'Đánh dấu hoàn thành & tiếp tục'}
          {done ? <ArrowRight className="size-4" /> : <CheckCircle2 className="size-4" />}
        </HubButton>
      ) : (
        <HubButton onClick={onMarkCompleted} disabled={done}>
          {done ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành'} <CheckCircle2 className="size-4" />
        </HubButton>
      )}
    </div>
  );
}

// --- LessonReaderNotFound.tsx ---
export function LessonReaderNotFound({ error }: { error?: string | null }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-lh-red/30 bg-lh-red-soft p-10 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-red">
        Không tìm thấy bài học
      </h1>
      <p className="mt-2 text-sm text-lh-muted">
        {error || 'Bài học bạn yêu cầu không tồn tại hoặc đã bị gỡ.'}
      </p>
      <Link
        href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM}
        className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary} mt-5`}
      >
        <ArrowLeft className="size-4" /> Về Chương trình học
      </Link>
    </div>
  );
}
