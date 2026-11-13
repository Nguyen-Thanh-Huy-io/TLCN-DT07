'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_COVER_IMAGES } from '../../constants/public-curriculum.constants';
import { LessonToc } from '../hub/LessonToc';
import { LessonRelated } from '../hub/LessonRelated';
import { HubLessonQuiz } from '../hub/HubLessonQuiz';
import { HubSyllabus } from '../hub/HubSyllabus';
import { LessonReaderHeader } from './LessonReaderHeader';
import { LessonReaderNavigationFooter } from './LessonReaderNavigationFooter';
import { LessonReaderArticle } from './LessonReaderArticle';
import { LessonReaderDesktopSidebar } from './LessonReaderDesktopSidebar';
import { LessonItem } from '@/types/models';
import { LearningPathItem } from '@/services/entities/learning-path.service';
import { QuizItem } from '@/features/lessons/types/quiz.types';
import { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import { ResourceLinkBlockData } from '@/features/lessons/types/block-builder.types';
import { UserQuizAnswer } from '../../strategies/public-curriculum.strategies';
import type { RelatedEntities } from '../hub/LessonRelated';

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
