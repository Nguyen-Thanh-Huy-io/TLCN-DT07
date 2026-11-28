'use client';

import React, { useMemo } from 'react';
import { Award, Flag } from 'lucide-react';
import { LessonProgressionStateEnum } from '@/constants/enums';
import type { LearningPathItem } from '@/services/entities/learner.service';
import { publishedChapterLessons } from '../../facades/usePublicCurriculumFacade';
import {
  DEFAULT_CHAPTER_QUIZ_PASS_SCORE,
  evaluatePathJourney,
  readBestQuizScore,
} from '../../utils/chapter-progression.util';
import { HubBadge, HubProgress } from '../hub/HubReaderParts';
import {
  ChapterQuizStation,
  JourneyLessonRow,
  PathRelationBanners,
  StageExamStation,
} from './LearningJourneyRoadmapParts';

interface LearningJourneyRoadmapProps {
  path: LearningPathItem;
  isCompleted: (lessonId: string) => boolean;
  isQuizPassed?: (quizId: string) => boolean;
  bestQuizScores?: Record<string, number>;
  isEnrolled: boolean;
  onEnroll?: () => void;
  activeLessonId?: string;
}

export function LearningJourneyRoadmap({
  path,
  isCompleted,
  isQuizPassed,
  bestQuizScores,
  activeLessonId,
}: LearningJourneyRoadmapProps) {
  const chapters = useMemo(() => path.chapters || [], [path.chapters]);
  const allLessons = useMemo(
    () =>
      chapters.flatMap((c) => publishedChapterLessons(c).map((cl) => cl.lesson)),
    [chapters],
  );
  const totalCount = allLessons.length;
  const completedCount = allLessons.filter((l) => isCompleted(l.id)).length;
  const percent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const journeyMap = useMemo(
    () =>
      evaluatePathJourney(path, {
        isCompleted,
        isQuizPassed,
        bestQuizScores,
      }),
    [path, isCompleted, isQuizPassed, bestQuizScores],
  );

  const allChaptersPassed = useMemo(
    () =>
      chapters.every((ch) => {
        const evaluated = journeyMap.get(ch.id);
        if (!evaluated) return true;
        const hasLessons = publishedChapterLessons(ch).length > 0;
        const lessonsOk = !hasLessons || evaluated.isLessonsComplete;
        return lessonsOk && evaluated.isRequiredQuizzesPassed;
      }),
    [chapters, journeyMap],
  );

  const stageExam =
    path.stageExamQuizId && path.stageExamQuiz ? path.stageExamQuiz : null;
  const stageExamPassScore =
    path.stageExamPassScore ??
    stageExam?.passingScorePercent ??
    DEFAULT_CHAPTER_QUIZ_PASS_SCORE;
  const stageExamBestScore = stageExam
    ? readBestQuizScore(bestQuizScores, stageExam.id)
    : null;
  const isStageExamPassed = Boolean(
    stageExam &&
      ((stageExamBestScore !== null &&
        stageExamBestScore >= stageExamPassScore) ||
        (path.stageExamPassScore == null && isQuizPassed?.(stageExam.id))),
  );
  const isStageExamLocked = Boolean(
    path.isSequential && !allChaptersPassed && !isStageExamPassed,
  );

  return (
    <div className="space-y-8">
      <PathRelationBanners path={path} />

      <div className="rounded-2xl border border-lh-line bg-lh-surface p-5 shadow-lh-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">
                Hành trình khám phá
              </h3>
              {path.isSequential && (
                <HubBadge tone="gold">Mở khóa tuần tự A → B</HubBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-lh-muted">
              Đã hoàn thành{' '}
              <strong className="text-lh-ink">{completedCount}</strong>/
              {totalCount} bài học
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-lh-brand">{percent}%</div>
              <div className="text-xs text-lh-muted">tiến độ hoàn thành</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <HubProgress value={percent} />
        </div>
      </div>

      <div className="relative pl-6 sm:pl-10">
        <div className="absolute bottom-6 left-6 top-6 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-lh-brand via-lh-brand/40 to-lh-line sm:left-10" />

        <div className="space-y-12">
          {chapters.map((chapter, cIdx) => {
            const chapterLessons = publishedChapterLessons(chapter);
            const chapterDone = chapterLessons.filter((cl) =>
              isCompleted(cl.lesson.id),
            ).length;
            const chapterEval = journeyMap.get(chapter.id);
            const chapterQuizzes = chapterEval?.quizzes ?? [];
            const isChapterComplete = Boolean(chapterEval?.isChapterFullyComplete);

            return (
              <div key={chapter.id} className="relative">
                <div className="relative mb-6 flex items-center gap-4">
                  <div
                    className={`relative z-10 grid size-12 -translate-x-1/2 place-items-center rounded-2xl border-2 shadow-md transition-all ${
                      isChapterComplete
                        ? 'border-lh-gold bg-lh-gold text-white ring-4 ring-lh-gold/20'
                        : 'border-lh-brand bg-lh-surface text-lh-brand'
                    }`}
                  >
                    <Flag className="size-5" />
                  </div>
                  <div className="-ml-3 min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-lh-gold">
                      Chương {cIdx + 1}
                    </div>
                    <h4 className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">
                      {chapter.title}
                    </h4>
                    {chapter.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-lh-muted">
                        {chapter.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-xs font-semibold text-lh-muted">
                    {chapterLessons.length > 0 &&
                      `${chapterDone}/${chapterLessons.length} bài`}
                    {chapterLessons.length > 0 &&
                      chapterQuizzes.length > 0 &&
                      ' · '}
                    {chapterQuizzes.length > 0 && `${chapterQuizzes.length} đề`}
                  </div>
                </div>

                <div className="space-y-4 pl-4 sm:pl-6">
                  {chapterLessons.map(({ lesson }, lIdx) => (
                    <JourneyLessonRow
                      key={lesson.id}
                      lesson={lesson}
                      lessonIndex={lIdx}
                      pathId={path.id}
                      activeLessonId={activeLessonId}
                      statusInfo={
                        chapterEval?.lessons.get(lesson.id) ?? {
                          lessonId: lesson.id,
                          state: LessonProgressionStateEnum.CURRENT_UNLOCKED,
                        }
                      }
                    />
                  ))}
                </div>

                <ChapterQuizStation quizzes={chapterQuizzes} pathId={path.id} />

                {isChapterComplete && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-lh-gold-soft/40 px-4 py-2 text-xs font-bold text-lh-gold pl-6">
                    <Award className="size-4" /> Bạn đã vượt qua toàn bộ thử
                    thách của {chapter.title}!
                  </div>
                )}
              </div>
            );
          })}

          {stageExam && (
            <StageExamStation
              stageExam={stageExam}
              pathId={path.id}
              passScore={stageExamPassScore}
              isPassed={isStageExamPassed}
              isLocked={isStageExamLocked}
            />
          )}
        </div>
      </div>
    </div>
  );
}
