'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, ChevronDown, Circle } from 'lucide-react';
import type { LearningPathItem } from '@/services/entities/learning-path.service';
import { PUBLIC_CURRICULUM_ROUTES, PUBLIC_DIFFICULTY_META } from '../../constants/public-curriculum.constants';
import { publishedChapterLessons } from '../../facades/usePublicCurriculumFacade';
import { HubProgress } from './HubUi';

export function chapterLabel(title: string): string {
  return title.replace(/^\s*Chương\s+\d+\s*[:.\-–]\s*/i, '');
}

export function pathLessons(path: LearningPathItem) {
  return (path.chapters || []).flatMap((ch) => publishedChapterLessons(ch).map((cl) => cl.lesson));
}

export function HubSyllabus({
  path,
  activeLessonId,
  isCompleted,
  onNavigate,
  openChapterIds,
  onToggleChapter,
}: {
  path: LearningPathItem;
  activeLessonId?: string;
  isCompleted: (lessonId: string) => boolean;
  onNavigate?: () => void;
  /** Controlled accordion (catalog page); omit to let the syllabus manage it. */
  openChapterIds?: string[];
  onToggleChapter?: (chapterId: string) => void;
}) {
  const [localOpen, setLocalOpen] = useState<string[]>(() => (path.chapters || []).map((c) => c.id));
  const open = openChapterIds ?? localOpen;
  const toggle =
    onToggleChapter ??
    ((id: string) => setLocalOpen((items) => (items.includes(id) ? items.filter((x) => x !== id) : [...items, id])));

  const lessons = pathLessons(path);
  const done = lessons.filter((l) => isCompleted(l.id)).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-lh-card">
      <div className="border-b border-lh-line p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-lh-brand">Nội dung lộ trình</div>
            <div className="mt-1 text-sm font-semibold text-lh-ink">
              {done}/{lessons.length} bài hoàn thành
            </div>
          </div>
          <span className="grid size-11 place-items-center rounded-full bg-lh-brand-soft text-sm font-extrabold text-lh-brand">
            {percent}%
          </span>
        </div>
        <div className="mt-3">
          <HubProgress value={percent} />
        </div>
      </div>
      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
        {(path.chapters || []).map((chapter, chapterIndex) => {
          const chapterLessons = publishedChapterLessons(chapter);
          const isOpen = open.includes(chapter.id);
          const chapterDone = chapterLessons.filter((cl) => isCompleted(cl.lesson.id)).length;
          return (
            <div key={chapter.id} className="border-b border-lh-line last:border-0">
              <button
                type="button"
                onClick={() => toggle(chapter.id)}
                className="flex w-full cursor-pointer items-start gap-3 p-4 text-left transition hover:bg-lh-surface-2"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-lh-surface-2 text-xs font-bold text-lh-muted">
                  {String(chapterIndex + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-5 text-lh-ink">{chapterLabel(chapter.title)}</span>
                  <span className="mt-1 block text-xs text-lh-muted">
                    {chapterDone}/{chapterLessons.length} bài
                  </span>
                </span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDown className="size-4 text-lh-muted" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2">
                      {chapterLessons.length === 0 && (
                        <p className="px-4 pb-3 text-xs italic text-lh-muted">Chương này chưa có bài học được xuất bản.</p>
                      )}
                      {chapterLessons.map(({ lesson }, index) => {
                        const active = lesson.id === activeLessonId;
                        const completed = isCompleted(lesson.id);
                        const difficulty = lesson.difficulty ? PUBLIC_DIFFICULTY_META[lesson.difficulty] : null;
                        return (
                          <Link
                            key={lesson.id}
                            href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(lesson.slug, path.id)}
                            onClick={onNavigate}
                            className={`group flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition ${
                              active ? 'border-lh-brand bg-lh-brand-soft/60' : 'border-transparent hover:bg-lh-surface-2'
                            }`}
                          >
                            <span
                              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                                completed
                                  ? 'bg-lh-brand text-white'
                                  : active
                                    ? 'bg-lh-brand-soft text-lh-brand ring-1 ring-lh-brand/20'
                                    : 'bg-lh-surface-2 text-lh-muted'
                              }`}
                            >
                              {completed ? (
                                <Check className="size-3.5" />
                              ) : active ? (
                                <Circle className="size-2.5 fill-current" />
                              ) : (
                                <BookOpen className="size-3" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm font-semibold leading-5 ${active ? 'text-lh-brand' : 'text-lh-ink'}`}>
                                {index + 1}. {lesson.title}
                              </span>
                              <span className="mt-1 flex items-center gap-2 text-xs text-lh-muted">
                                <BookOpen className="size-3.5" /> Bài đọc
                                {difficulty && (
                                  <>
                                    <span>•</span> {difficulty.label}
                                  </>
                                )}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
