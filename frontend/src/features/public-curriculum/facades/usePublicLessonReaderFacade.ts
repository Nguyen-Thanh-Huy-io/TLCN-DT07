'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { LearnerApiService, NOT_ENROLLED_CODE } from '@/services/entities/learner.service';
import { useAuthSession } from '@/services/auth/use-auth-session';
import {
  LearningPathApiService,
  LearningPathItem,
} from '@/services/entities/learning-path.service';
import { LessonItem } from '@/types/models';
import { ResourceLinkBlockData } from '@/features/lessons/types/block-builder.types';
import { buildLessonTocAndHtml, LessonTocEntry, normalizeContentToBlocks } from '@/features/lessons/utils/lesson-toc.util';
import { ContentStatus } from '@/constants/enums';

const PUBLISHED_STATUS = ContentStatus.PUBLISHED;

/** GRANTED: đọc được · LOGIN_REQUIRED: chưa đăng nhập · NOT_ENROLLED: chưa đăng ký lộ trình chứa bài. */
export enum LessonAccessState {
  GRANTED = 'GRANTED',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
  NOT_ENROLLED = 'NOT_ENROLLED',
}

export type LessonAccess = LessonAccessState | 'GRANTED' | 'LOGIN_REQUIRED' | 'NOT_ENROLLED';

export interface AdjacentLessonLink {
  id: string;
  title: string;
  slug: string;
  chapterTitle: string;
}

export function usePublicLessonReaderFacade(slug: string, pathId?: string | null) {
  const [lesson, setLesson] = useState<LessonItem | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [access, setAccess] = useState<LessonAccess>('GRANTED');
  const user = useAuthSession();
  const userId = user === undefined ? undefined : (user?.id ?? null);

  const loadData = useCallback(async () => {
    // Chờ biết phiên đăng nhập (undefined lúc hydrate) rồi mới quyết định quyền đọc.
    if (!slug || userId === undefined) return;
    setLoading(true);
    setError(null);
    setLesson(null);

    // Lộ trình chứa bài (công khai) — để hiện đề cương và nút đăng ký kể cả khi bài đang khóa.
    const allPaths = await LearningPathApiService.getLearningPaths().catch(() => []);
    const publishedPaths = (Array.isArray(allPaths) ? allPaths : []).filter(
      (p) => p.status === PUBLISHED_STATUS,
    );
    const containsLesson = (p: LearningPathItem) =>
      (p.chapters || []).some((ch) => (ch.chapterLessons || []).some((cl) => cl.lesson?.slug === slug));
    setLearningPath(
      (pathId && publishedPaths.find((p) => p.id === pathId && containsLesson(p))) ||
        publishedPaths.find(containsLesson) ||
        null,
    );

    if (!userId) {
      setAccess(LessonAccessState.LOGIN_REQUIRED);
      setLoading(false);
      return;
    }

    try {
      const { lesson: lessonData } = await LearnerApiService.getLesson(slug);
      setAccess(LessonAccessState.GRANTED);
      setLesson(lessonData);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { code?: string; message?: string } };
      };
      if (
        axiosErr?.response?.status === 403 &&
        axiosErr?.response?.data?.code === NOT_ENROLLED_CODE
      ) {
        setAccess(LessonAccessState.NOT_ENROLLED);
      } else {
        setError(
          axiosErr?.response?.data?.message ||
            'Không tìm thấy bài học hoặc bài học chưa được xuất bản.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug, pathId, userId]);

  /** Thông tin giới thiệu bài (từ đề cương công khai) để hiện khi bài còn khóa. */
  const lockedPreview = useMemo(() => {
    for (const ch of learningPath?.chapters || []) {
      const found = (ch.chapterLessons || []).find((cl) => cl.lesson?.slug === slug);
      if (found) return found.lesson;
    }
    return null;
  }, [learningPath, slug]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadData();
    });
  }, [loadData]);

  // Biên dịch JSONB Blocks -> Mục lục (TOC) & HTML hiển thị
  const { tocItems, compiledHtml, resourceLinks } = useMemo<{
    tocItems: LessonTocEntry[];
    compiledHtml: string;
    resourceLinks: ResourceLinkBlockData[];
  }>(() => {
    if (!lesson) {
      return { tocItems: [], compiledHtml: '', resourceLinks: [] };
    }
    const { blocks, resourceLinks: links } = normalizeContentToBlocks(
      lesson.content ?? lesson.contentRichText,
    );
    const { tocItems: toc, html } = buildLessonTocAndHtml(blocks);
    return { tocItems: toc, compiledHtml: html, resourceLinks: links };
  }, [lesson]);

  // Tính toán Chương hiện tại, Bài học trước & Bài học tiếp theo trong Lộ trình
  const navigationContext = useMemo(() => {
    if (!learningPath || !lesson) {
      return {
        currentChapter: null,
        prevLesson: null as AdjacentLessonLink | null,
        nextLesson: null as AdjacentLessonLink | null,
        flatLessons: [] as AdjacentLessonLink[],
        currentIndex: -1,
      };
    }

    const flatLessons: AdjacentLessonLink[] = [];
    let currentChapter: { id: string; title: string; index: number } | null = null;

    // for...of (not forEach) so TypeScript tracks the assignment to currentChapter.
    for (const [chIdx, ch] of (learningPath.chapters || []).entries()) {
      for (const cl of ch.chapterLessons || []) {
        if (!cl.lesson || cl.lesson.status !== PUBLISHED_STATUS) continue;
        if (cl.lesson.id === lesson.id || cl.lesson.slug === lesson.slug) {
          currentChapter = { id: ch.id, title: ch.title, index: chIdx + 1 };
        }
        flatLessons.push({
          id: cl.lesson.id,
          title: cl.lesson.title,
          slug: cl.lesson.slug,
          chapterTitle: ch.title,
        });
      }
    }

    const currentIndex = flatLessons.findIndex(
      (item) => item.id === lesson.id || item.slug === lesson.slug,
    );

    return {
      currentChapter,
      prevLesson: currentIndex > 0 ? flatLessons[currentIndex - 1] : null,
      nextLesson:
        currentIndex >= 0 && currentIndex < flatLessons.length - 1
          ? flatLessons[currentIndex + 1]
          : null,
      flatLessons,
      currentIndex,
    };
  }, [learningPath, lesson]);

  return {
    access,
    lockedPreview,
    reload: loadData,
    lesson,
    learningPath,
    loading,
    error,
    tocItems,
    compiledHtml,
    resourceLinks,
    navigationContext,
  };
}
