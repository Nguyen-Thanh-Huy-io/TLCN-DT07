'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { LearnerApiService, type LearnerOverview } from '@/services/entities/learner.service';
import { useAuthSession } from '@/services/auth/useAuthSession';

/**
 * Tiến độ học của tài khoản đang đăng nhập, lấy từ backend (/me/learning).
 * Một store dùng chung cho mọi component để danh mục, đề cương và trang đọc bài
 * cùng cập nhật ngay khi người học đăng ký lộ trình hoặc hoàn thành bài.
 */
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

  const current = snapshot.userId === userId ? snapshot.overview : EMPTY;

  const isCompleted = useCallback((lessonId: string) => current.completedLessonIds.includes(lessonId), [current]);
  const isEnrolled = useCallback((pathId: string) => current.enrolledPathIds.includes(pathId), [current]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      if (!userId || current.completedLessonIds.includes(lessonId)) return;
      const overview = await LearnerApiService.completeLesson(lessonId);
      setState({ userId, loaded: true, overview });
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
    /** undefined = chưa biết phiên (đang hydrate). */
    user,
    loggedIn: Boolean(user),
    ready: user === null || (Boolean(userId) && snapshot.userId === userId && snapshot.loaded),
    completedIds: current.completedLessonIds,
    enrolledPathIds: current.enrolledPathIds,
    isCompleted,
    isEnrolled,
    markCompleted,
    enroll,
    unenroll,
  };
}
