'use client';

import { RefObject, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { LearnerApiService, type LearnerOverview } from '@/services/entities/learner.service';
import { useAuthSession } from '@/services/auth/use-auth-session';

// --- useLessonMedia.ts ---
const YOUTUBE_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;
/** YouTube trả ảnh xám 120×90 khi video không tồn tại / đã bị gỡ. */
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

/**
 * Video YouTube dạng "ảnh xem trước → bấm để phát": trang nhẹ hơn (không tải player khi
 * chưa xem) và phát hiện được video đã bị gỡ để báo rõ thay vì khung đen lỗi.
 */
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
    // YouTube từ chối phát (lỗi 153) khi không có referrer.
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(iframe);
  });

  return box;
}

/** Xử lý media trong HTML bài học sau khi render: ảnh hỏng → khung thông báo, YouTube → facade. */
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

// --- useLessonProgress.ts ---
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

  const current = snapshot.userId === userId && snapshot.overview
    ? snapshot.overview
    : EMPTY;

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
    completedIds: completedLessonIds,
    enrolledPathIds: enrolledPathIds,
    isCompleted,
    isEnrolled,
    markCompleted,
    enroll,
    unenroll,
  };
}
