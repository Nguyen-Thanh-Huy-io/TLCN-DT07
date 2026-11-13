'use client';

import React from 'react';
import { BookOpen, CheckCircle2, Clock3 } from 'lucide-react';
import { HubBadge } from '../hub/HubUi';
import { chapterLabel } from '../hub/HubSyllabus';
import { LessonItem } from '@/types/models';
import { PUBLIC_DIFFICULTY_META } from '../../constants/public-curriculum.constants';

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
