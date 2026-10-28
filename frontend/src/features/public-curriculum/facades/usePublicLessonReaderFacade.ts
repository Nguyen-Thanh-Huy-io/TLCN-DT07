'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { LearnerApiService, NOT_ENROLLED_CODE } from '@/services/entities/learner.service';
import { useAuthSession } from '@/services/auth/useAuthSession';
import {
  LearningPathApiService,
  LearningPathItem,
} from '@/services/entities/learning-path.service';
import { LessonItem } from '@/types/models/lesson.type';
import { QuizItem, QuizQuestionType } from '@/features/lessons/types/quiz.types';
import { LessonBlockType } from '@/features/lessons/types/block-palette.types';
import {
  LessonBlockItem,
  ResourceLinkBlockData,
} from '@/features/lessons/types/block-builder.types';
import { buildLessonTocAndHtml, LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import {
  QuizGradingStrategyRegistry,
  UserQuizAnswer,
} from '../strategies/public-curriculum.strategies';
import { ContentStatus } from '@/constants/enums';
import { MoveDirection } from '@/features/lessons/components/quiz/QuizQuestionEditors';

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

function normalizeContentToBlocks(rawContent: any): {
  blocks: LessonBlockItem[];
  resourceLinks: ResourceLinkBlockData[];
} {
  let items: LessonBlockItem[] = [];
  if (Array.isArray(rawContent)) {
    items = rawContent;
  } else if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else {
        items = [
          {
            id: 'text_fallback',
            type: LessonBlockType.TEXT,
            content: rawContent,
          },
        ];
      }
    } catch {
      items = [
        {
          id: 'text_fallback',
          type: LessonBlockType.TEXT,
          content: rawContent,
        },
      ];
    }
  }

  const blocks: LessonBlockItem[] = [];
  const resourceLinks: ResourceLinkBlockData[] = [];
  for (const item of items) {
    if (item.type === LessonBlockType.RESOURCE_LINK) {
      resourceLinks.push(item as ResourceLinkBlockData);
    } else {
      blocks.push(item);
    }
  }
  return { blocks, resourceLinks };
}

export function usePublicLessonReaderFacade(slug: string, pathId?: string | null) {
  const [lesson, setLesson] = useState<LessonItem | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathItem | null>(null);
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State tương tác làm bài ôn tập của người học
  const [userAnswers, setUserAnswers] = useState<Record<string, UserQuizAnswer>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const [access, setAccess] = useState<LessonAccess>('GRANTED');
  const user = useAuthSession();
  const userId = user === undefined ? undefined : (user?.id ?? null);

  const loadData = useCallback(async () => {
    // Chờ biết phiên đăng nhập (undefined lúc hydrate) rồi mới quyết định quyền đọc.
    if (!slug || userId === undefined) return;
    setLoading(true);
    setError(null);
    setSubmittedQuiz(false);
    setUserAnswers({});
    setLesson(null);
    setQuiz(null);

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
      setAccess('LOGIN_REQUIRED');
      setLoading(false);
      return;
    }

    try {
      const { lesson: lessonData, quiz: quizRes } = await LearnerApiService.getLesson(slug);
      setAccess('GRANTED');
      setLesson(lessonData);
      setQuiz(quizRes);

      // Khởi tạo thứ tự mặc định cho câu hỏi ORDERING để người học có thể bấm đổi chỗ ngay
      if (quizRes?.questions) {
        const initialOrderingAnswers: Record<string, UserQuizAnswer> = {};
        for (const q of quizRes.questions) {
          if (q.type === QuizQuestionType.ORDERING) {
            initialOrderingAnswers[q.id] = q.items.map((it) => it.id);
          }
        }
        setUserAnswers(initialOrderingAnswers);
      }
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.code === NOT_ENROLLED_CODE) {
        setAccess('NOT_ENROLLED');
      } else {
        setError(
          err?.response?.data?.message ||
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
    loadData();
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

  const setAnswer = useCallback((questionId: string, answer: UserQuizAnswer) => {
    if (submittedQuiz) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, [submittedQuiz]);

  const moveOrderingItem = useCallback(
    (questionId: string, fromIdx: number, direction: MoveDirection | 'UP' | 'DOWN') => {
      if (submittedQuiz) return;
      setUserAnswers((prev) => {
        const current = prev[questionId];
        if (!Array.isArray(current)) return prev;
        const targetIdx = direction === MoveDirection.UP ? fromIdx - 1 : fromIdx + 1;
        if (targetIdx < 0 || targetIdx >= current.length) return prev;
        const next = [...current];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(targetIdx, 0, moved);
        return { ...prev, [questionId]: next };
      });
    },
    [submittedQuiz],
  );

  // Chấm điểm toàn bộ Đề ôn tập thông qua QuizGradingStrategyRegistry
  const quizEvaluation = useMemo(() => {
    if (!quiz || !quiz.questions?.length) return null;
    const details = quiz.questions.map((q) => {
      const evaluation = QuizGradingStrategyRegistry.evaluateQuestion(
        q,
        userAnswers[q.id],
      );
      return {
        questionId: q.id,
        ...evaluation,
      };
    });

    const correctCount = details.filter((d) => d.isCorrect).length;
    const totalCount = quiz.questions.length;
    const scorePercent = Math.round((correctCount / totalCount) * 100);
    const passed = scorePercent >= (quiz.passingScorePercent || 70);

    return {
      detailsMap: new Map(details.map((d) => [d.questionId, d])),
      correctCount,
      totalCount,
      scorePercent,
      passed,
    };
  }, [quiz, userAnswers]);

  const handleSubmitQuiz = useCallback(() => {
    setSubmittedQuiz(true);
  }, []);

  const handleRetryQuiz = useCallback(() => {
    setSubmittedQuiz(false);
    if (quiz?.questions) {
      const resetAnswers: Record<string, UserQuizAnswer> = {};
      for (const q of quiz.questions) {
        if (q.type === QuizQuestionType.ORDERING) {
          resetAnswers[q.id] = q.items.map((it) => it.id);
        }
      }
      setUserAnswers(resetAnswers);
    } else {
      setUserAnswers({});
    }
  }, [quiz]);

  return {
    access,
    lockedPreview,
    reload: loadData,
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
  };
}
