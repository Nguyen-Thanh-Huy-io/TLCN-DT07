'use client';

import React, { RefObject, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { LearnerApiService, type LearnerOverview } from '@/services/entities/learner.service';
import { emitGamificationRefresh } from '@/features/gamification/services/gamification.service';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { MoveDirection } from '@/features/lessons/components/quiz/QuizQuestionEditors';
import type { QuizBlockData } from '@/features/lessons/types/block-builder.types';
import { QuizQuestionType, type QuizQuestion } from '@/features/lessons/types/editor.types';
import {
  LESSON_QUIZ_DEFAULT_TITLE,
  LESSON_QUIZ_PLACEHOLDER_ATTR,
  isLessonAnswerCorrect,
  quizBlockQuestions,
} from '@/features/lessons/utils/lesson-quiz.util';
import {
  prepareQuizSessionForLearner,
  type UserQuizAnswer,
} from '../../strategies/public-curriculum.strategies';
import { QuestionBody } from './HubLessonQuiz';

interface QuizSession {
  questions: QuizQuestion[];
  answers: Record<string, UserQuizAnswer>;
}

/** Mỗi lượt làm: xáo lựa chọn / thứ tự / vế ghép, khởi tạo thứ tự cho câu sắp xếp. */
function newSession(block: QuizBlockData): QuizSession {
  const { preparedQuiz, initialAnswers } = prepareQuizSessionForLearner({ questions: quizBlockQuestions(block) });
  return { questions: preparedQuiz.questions, answers: initialAnswers };
}

function moveItem(order: string[], fromIdx: number, direction: 'UP' | 'DOWN'): string[] {
  const target = direction === MoveDirection.UP ? fromIdx - 1 : fromIdx + 1;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Khối Ôn tập ở trang đọc bài: người học tự làm, bấm Kiểm tra để xem đúng/sai và giải thích — không lưu. */
export function LessonQuizBlockView({ block }: { block: QuizBlockData }) {
  const [session, setSession] = useState(() => newSession(block));
  const [checked, setChecked] = useState(false);
  const { questions, answers } = session;
  if (questions.length === 0) return null;

  const setAnswer = (questionId: string, answer: UserQuizAnswer) => {
    if (checked) return;
    setSession((prev) => ({ ...prev, answers: { ...prev.answers, [questionId]: answer } }));
  };

  const moveOrderingItem = (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => {
    const question = questions.find((q) => q.id === questionId);
    if (checked || !question || question.type !== QuizQuestionType.ORDERING) return;
    const current = answers[questionId];
    const order = Array.isArray(current) ? current : question.items.map((item) => item.id);
    setAnswer(questionId, moveItem(order, fromIdx, direction));
  };

  const results = questions.map((q) => isLessonAnswerCorrect(q, answers[q.id]));
  const correctCount = results.filter(Boolean).length;

  return (
    <div className="not-prose space-y-4 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-amber-700">
          ❓ {block.title || LESSON_QUIZ_DEFAULT_TITLE} · {questions.length} câu
        </p>
        {checked && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-800 shadow-2xs">
            Đúng {correctCount}/{questions.length}
          </span>
        )}
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="m-0 text-sm font-semibold text-stone-900">
              {index + 1}. {question.prompt}
            </p>
            {checked && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  results[index] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {results[index] ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {results[index] ? 'Chính xác' : 'Chưa đúng'}
              </span>
            )}
          </div>
          <QuestionBody
            question={question}
            answer={answers[question.id]}
            submitted={checked}
            setAnswer={setAnswer}
            moveOrderingItem={moveOrderingItem}
          />
          {checked && question.explanation && (
            <p className="mb-0 mt-3 rounded-lg border border-slate-200 border-l-4 border-l-amber-500 bg-white p-3 text-xs text-stone-700">
              {question.explanation}
            </p>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        {checked ? (
          <button
            type="button"
            onClick={() => {
              setSession(newSession(block));
              setChecked(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <RotateCcw size={14} /> Làm lại
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
}

interface QuizIsland {
  element: HTMLElement;
  block: QuizBlockData;
}

/**
 * Nội dung bài học là HTML dựng sẵn (`dangerouslySetInnerHTML`); khối Ôn tập chỉ để lại chỗ giữ chỗ
 * `[data-lesson-quiz="<id>"]`. Hook này tìm các chỗ đó sau mỗi lần HTML đổi và gắn phần làm bài vào bằng portal.
 */
export function useLessonQuizIslands(
  containerRef: React.RefObject<HTMLElement | null>,
  html: string,
  quizBlocks: Map<string, QuizBlockData>,
): React.ReactNode {
  const [islands, setIslands] = useState<QuizIsland[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const found: QuizIsland[] = [];
    container?.querySelectorAll<HTMLElement>(`[${LESSON_QUIZ_PLACEHOLDER_ATTR}]`).forEach((element) => {
      const block = quizBlocks.get(element.getAttribute(LESSON_QUIZ_PLACEHOLDER_ATTR) ?? '');
      if (!block) return;
      element.replaceChildren();
      found.push({ element, block });
    });
    void Promise.resolve().then(() => setIslands(found));
  }, [containerRef, html, quizBlocks]);

  return islands.map(({ element, block }) => {
    const contentKey = `${block.id}:${JSON.stringify(block)}`;
    return createPortal(<LessonQuizBlockView key={contentKey} block={block} />, element, contentKey);
  });
}

// === Merged from useLessonReaderHooks.ts ===
const YOUTUBE_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;
const MISSING_THUMB_WIDTH = 120;

function brokenImageNotice(alt: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'lesson-media-missing';
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', alt || 'Hình ảnh không khả dụng');
  box.innerHTML = '<span>Hình ảnh không còn khả dụng tại nguồn</span>';
  if (alt) {
    const small = document.createElement('small');
    small.textContent = alt;
    box.appendChild(small);
  }
  return box;
}

function youtubeFacade(id: string, title: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'lesson-yt';
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;

  const thumb = document.createElement('img');
  thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  thumb.alt = title || 'Video YouTube';
  thumb.loading = 'lazy';

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'lesson-yt-play';
  play.setAttribute('aria-label', `Phát video${title ? `: ${title}` : ''}`);
  play.innerHTML = '<span></span>';

  box.append(thumb, play);

  thumb.addEventListener('load', () => {
    if (thumb.naturalWidth > MISSING_THUMB_WIDTH) return;
    box.classList.add('is-missing');
    box.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'lesson-yt-missing';
    msg.innerHTML = '<strong>Video không còn khả dụng</strong>';
    const link = document.createElement('a');
    link.href = watchUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'Thử mở trên YouTube ↗';
    msg.appendChild(link);
    box.appendChild(msg);
  });

  play.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = title || 'Video YouTube';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(iframe);
  });

  return box;
}

export function useLessonMedia(container: RefObject<HTMLElement | null>, html: string) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;

    for (const iframe of Array.from(root.querySelectorAll('iframe'))) {
      const id = iframe.getAttribute('src')?.match(YOUTUBE_ID)?.[1];
      if (id) iframe.replaceWith(youtubeFacade(id, iframe.getAttribute('title') || ''));
    }

    const swap = (img: HTMLImageElement) => img.replaceWith(brokenImageNotice(img.alt));
    const cleanups: Array<() => void> = [];
    for (const img of Array.from(root.querySelectorAll('img'))) {
      if (img.closest('.lesson-yt')) continue;
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
        swap(img);
        continue;
      }
      const onError = () => swap(img);
      img.addEventListener('error', onError, { once: true });
      cleanups.push(() => img.removeEventListener('error', onError));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [container, html]);
}

interface ProgressState {
  userId: string | null;
  loaded: boolean;
  overview: LearnerOverview;
}

const EMPTY: LearnerOverview = { enrolledPathIds: [], completedLessonIds: [] };
let state: ProgressState = { userId: null, loaded: false, overview: EMPTY };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(next: ProgressState) {
  state = next;
  listeners.forEach((notify) => notify());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function load(userId: string): Promise<void> {
  if (inflight) return inflight;
  inflight = LearnerApiService.getOverview()
    .then((overview) => setState({ userId, loaded: true, overview }))
    .catch(() => setState({ userId, loaded: true, overview: EMPTY }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useLessonProgress() {
  const user = useAuthSession();
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      if (state.userId !== null || state.loaded) setState({ userId: null, loaded: false, overview: EMPTY });
      return;
    }
    if (state.userId !== userId || !state.loaded) void load(userId);
  }, [userId]);

  const current = snapshot.userId === userId && snapshot.overview ? snapshot.overview : EMPTY;

  const completedLessonIds = useMemo(
    () => (Array.isArray(current?.completedLessonIds) ? current.completedLessonIds : []),
    [current],
  );
  const enrolledPathIds = useMemo(
    () => (Array.isArray(current?.enrolledPathIds) ? current.enrolledPathIds : []),
    [current],
  );

  const isCompleted = useCallback((lessonId: string) => completedLessonIds.includes(lessonId), [completedLessonIds]);
  const isEnrolled = useCallback((pathId: string) => enrolledPathIds.includes(pathId), [enrolledPathIds]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      if (!userId || current.completedLessonIds.includes(lessonId)) return;
      const overview = await LearnerApiService.completeLesson(lessonId);
      setState({ userId, loaded: true, overview });
      emitGamificationRefresh();
    },
    [userId, current],
  );

  const enroll = useCallback(
    async (pathId: string) => {
      if (!userId) return;
      const overview = await LearnerApiService.enroll(pathId);
      setState({ userId, loaded: true, overview });
    },
    [userId],
  );

  const unenroll = useCallback(
    async (pathId: string) => {
      if (!userId) return;
      const overview = await LearnerApiService.unenroll(pathId);
      setState({ userId, loaded: true, overview });
    },
    [userId],
  );

  return {
    user,
    loggedIn: Boolean(user),
    ready: user === null || (Boolean(userId) && snapshot.userId === userId && snapshot.loaded),
    completedIds: completedLessonIds,
    enrolledPathIds: enrolledPathIds,
    isCompleted,
    isEnrolled,
    markCompleted,
    enroll,
    unenroll,
  };
}
