'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LearningPathApiService,
  LearningPathItem,
  ChapterItem,
  LearnerApiService,
  NOT_ENROLLED_CODE,
  LEARNER_ERROR_CODES,
  type LibraryLesson,
} from '@/services/entities/learner.service';
import { TopicApiService } from '@/services/entities/topic.service';
import type { LessonItem, TopicItem } from '@/types/models';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { ResourceLinkBlockData, type QuizBlockData } from '@/features/lessons/types/block-builder.types';
import { buildLessonTocAndHtml, LessonTocEntry, normalizeContentToBlocks } from '@/features/lessons/utils/lesson-toc.util';
import { collectQuizBlocks } from '@/features/lessons/utils/lesson-quiz.util';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import { PRACTICE_TOPIC_PARAM } from '@/features/quiz/utils/practice-quiz.helper';
import { PathFilterStrategyRegistry } from '../strategies/public-curriculum.strategies';
import type { EnrichedTopicItem } from '../components/TopicSelectorPopover';
export type { EnrichedTopicItem };

export const PUBLIC_CURRICULUM_ROUTES = {
  CURRICULUM: '/chuong-trinh-hoc',
  PRACTICE: (topicId?: string | null) =>
    topicId ? `/luyen-tap?${PRACTICE_TOPIC_PARAM}=${encodeURIComponent(topicId)}` : '/luyen-tap',
  LESSON_DETAIL: (slug: string, pathId?: string) =>
    pathId ? `/bai-hoc/${slug}?pathId=${encodeURIComponent(pathId)}` : `/bai-hoc/${slug}`,
} as const;

export const PATH_TYPE_META: Record<
  'CHRONOLOGICAL' | 'THEMATIC',
  { label: string; badgeBg: string; badgeText: string; badgeBorder: string; description: string }
> = {
  CHRONOLOGICAL: {
    label: 'Tiến trình lịch sử',
    badgeBg: 'bg-[#6e181b]/10',
    badgeText: 'text-[#6e181b]',
    badgeBorder: 'border-[#6e181b]/30',
    description: 'Học tuần tự theo dòng chảy niên biểu từ buổi đầu dựng nước đến hiện đại',
  },
  THEMATIC: {
    label: 'Chuyên đề chuyên sâu',
    badgeBg: 'bg-[#8a6828]/12',
    badgeText: 'text-[#8a6828]',
    badgeBorder: 'border-[#8a6828]/35',
    description: 'Khám phá theo từng chủ đề quân sự, văn hóa, ngoại giao và danh nhân',
  },
};

export const PUBLIC_DIFFICULTY_META: Record<
  DifficultyLevel | string,
  { label: string; className: string }
> = {
  [DifficultyLevel.EASY]: {
    label: 'Cơ bản',
    className: 'border-emerald-700/30 bg-emerald-900/10 text-emerald-900',
  },
  [DifficultyLevel.MEDIUM]: {
    label: 'Trung bình',
    className: 'border-amber-700/30 bg-amber-900/10 text-amber-900',
  },
  [DifficultyLevel.HARD]: {
    label: 'Chuyên sâu',
    className: 'border-[#6e181b]/30 bg-[#6e181b]/10 text-[#6e181b]',
  },
};

export const DEFAULT_COVER_IMAGES = [
  '/assets/hero.jpg',
  '/assets/citadel.jpg',
  '/assets/temple.jpg',
  '/assets/mountain.jpg',
] as const;

const PUBLISHED_STATUS = 'PUBLISHED';

export function publishedChapterLessons(chapter: ChapterItem) {
  return (chapter.chapterLessons || []).filter((cl) => cl.lesson?.status === PUBLISHED_STATUS);
}

function collectSubtreeTopicIds(topic: TopicItem, set: Set<string>) {
  set.add(topic.id);
  if (topic.children && topic.children.length > 0) {
    for (const child of topic.children) {
      collectSubtreeTopicIds(child, set);
    }
  }
}

export function usePublicCurriculumFacade(initialPathId?: string | null) {
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [libraryLessons, setLibraryLessons] = useState<LibraryLesson[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    initialPathId || null,
  );
  const [expandedChapterIds, setExpandedChapterIds] = useState<string[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const loadCurriculum = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathsRes, lessonsRes, topicsRes] = await Promise.all([
        LearningPathApiService.getLearningPaths(),
        LearnerApiService.getLibrary(),
        TopicApiService.getTopicTree().catch(() => [] as TopicItem[]),
      ]);

      // /learning-paths trả cả bản nháp cho CMS; trang công khai chỉ hiện lộ trình đã xuất bản.
      const safePaths = (Array.isArray(pathsRes) ? pathsRes : []).filter((p) => p.status === PUBLISHED_STATUS);
      setPaths(safePaths);
      setLibraryLessons(lessonsRes);
      setTopics(Array.isArray(topicsRes) ? topicsRes : []);

      if (safePaths.length > 0) {
        const chronologicalPaths = safePaths.filter((p) => p.pathType === 'CHRONOLOGICAL');
        const defaultChronological =
          chronologicalPaths.find((p) => !p.prerequisitePathId) || chronologicalPaths[0];
        const defaultPath =
          (initialPathId && safePaths.find((p) => p.id === initialPathId)) ||
          defaultChronological ||
          safePaths[0];
        setSelectedPathId(defaultPath.id);
        setExpandedChapterIds(
          (defaultPath.chapters || []).map((ch) => ch.id),
        );
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr?.response?.data?.message ||
          'Không thể tải dữ liệu chương trình học lịch sử. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, [initialPathId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadCurriculum();
    });
  }, [loadCurriculum]);

  const selectedTopicSubtreeIds = useMemo(() => {
    if (!selectedTopicId) return new Set<string>();
    const target = topics.find((t) => t.id === selectedTopicId);
    const set = new Set<string>();
    if (target) {
      collectSubtreeTopicIds(target, set);
    } else {
      set.add(selectedTopicId);
    }
    return set;
  }, [selectedTopicId, topics]);

  const filteredPaths = useMemo(
    () =>
      PathFilterStrategyRegistry.filter(
        paths,
        searchKeyword,
        selectedTopicId,
        selectedTopicSubtreeIds,
      ),
    [paths, searchKeyword, selectedTopicId, selectedTopicSubtreeIds],
  );

  const activePath = useMemo(() => {
    if (!filteredPaths.length) return null;
    return (
      filteredPaths.find((p) => p.id === selectedPathId) || filteredPaths[0]
    );
  }, [filteredPaths, selectedPathId]);

  const handleSelectPath = useCallback((path: LearningPathItem) => {
    setSelectedPathId(path.id);
    setExpandedChapterIds((path.chapters || []).map((c) => c.id));
  }, []);

  const toggleChapterAccordion = useCallback((chapterId: string) => {
    setExpandedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId],
    );
  }, []);

  const expandAllChapters = useCallback(() => {
    if (!activePath) return;
    setExpandedChapterIds((activePath.chapters || []).map((c) => c.id));
  }, [activePath]);

  const collapseAllChapters = useCallback(() => {
    setExpandedChapterIds([]);
  }, []);

  // Tổng hợp danh sách tất cả Tag có trong thư viện bài học
  const availableTags = useMemo<LibraryLesson['tags']>(() => {
    const tagMap = new Map<string, LibraryLesson['tags'][number]>();
    for (const lesson of libraryLessons) {
      for (const tag of lesson.tags) {
        if (tag && tag.id && !tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      }
    }
    return Array.from(tagMap.values());
  }, [libraryLessons]);

  const filteredLibraryLessons = useMemo(
    () =>
      PathFilterStrategyRegistry.filterLessons(
        libraryLessons,
        searchKeyword,
        selectedTagId,
        selectedTopicId,
        selectedTopicSubtreeIds,
      ),
    [libraryLessons, searchKeyword, selectedTagId, selectedTopicId, selectedTopicSubtreeIds],
  );

  // Thống kê tổng quan toàn bộ chương trình
  const stats = useMemo(() => {
    const totalPaths = paths.length;
    const totalChapters = paths.reduce(
      (sum, p) => sum + (p.chapters?.length || 0),
      0,
    );
    const totalLessons = Math.max(
      libraryLessons.length,
      paths.reduce(
        (sum, p) =>
          sum +
          (p.chapters || []).reduce(
            (cSum, ch) => cSum + publishedChapterLessons(ch).length,
            0,
          ),
        0,
      ),
    );
    return { totalPaths, totalChapters, totalLessons };
  }, [paths, libraryLessons]);

  // Lọc và làm giàu danh sách chủ đề: Chỉ giữ lại các chủ đề thực sự có lộ trình hoặc bài học
  const activeTopics = useMemo<EnrichedTopicItem[]>(() => {
    const flatTopics: TopicItem[] = [];
    const traverse = (items: TopicItem[], parentName?: string) => {
      for (const item of items) {
        flatTopics.push({
          ...item,
          parent: item.parent || (parentName ? { id: item.parentId || '', name: parentName } : null),
        });
        if (item.children && item.children.length > 0) {
          traverse(item.children, item.name);
        }
      }
    };
    traverse(topics);

    const enriched: EnrichedTopicItem[] = [];
    const seenIds = new Set<string>();

    for (const topic of flatTopics) {
      if (seenIds.has(topic.id)) continue;
      seenIds.add(topic.id);

      const subtreeIds = new Set<string>();
      collectSubtreeTopicIds(topic, subtreeIds);

      // Đếm số lộ trình thuộc chủ đề này (hoặc chủ đề con)
      const curriculumPathCount = paths.filter(
        (p) => p.topicId && subtreeIds.has(p.topicId),
      ).length;

      // Đếm số bài học thuộc chủ đề này (hoặc chủ đề con)
      const curriculumLessonCount = libraryLessons.filter(
        (l) => l.topicId && subtreeIds.has(l.topicId),
      ).length;

      // Chỉ giữ lại chủ đề nào có ít nhất 1 lộ trình hoặc 1 bài học
      if (curriculumPathCount > 0 || curriculumLessonCount > 0) {
        enriched.push({
          ...topic,
          curriculumPathCount,
          curriculumLessonCount,
          eyebrow: topic.parent?.name,
        });
      }
    }

    return enriched;
  }, [topics, paths, libraryLessons]);

  return {
    paths,
    filteredPaths,
    activePath,
    libraryLessons,
    filteredLibraryLessons,
    availableTags,
    loading,
    error,
    stats,
    topics,
    activeTopics,
    selectedTopicId,
    setSelectedTopicId,
    searchKeyword,
    setSearchKeyword,
    selectedTagId,
    setSelectedTagId,
    expandedChapterIds,
    handleSelectPath,
    toggleChapterAccordion,
    expandAllChapters,
    collapseAllChapters,
    reload: loadCurriculum,
  };
}

// === Merged from usePublicLessonReaderFacade.ts ===
export enum LessonAccessState {
  GRANTED = 'GRANTED',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
  NOT_ENROLLED = 'NOT_ENROLLED',
  LOCKED_SEQUENTIAL = 'LOCKED_SEQUENTIAL',
}

export type LessonAccess = LessonAccessState | 'GRANTED' | 'LOGIN_REQUIRED' | 'NOT_ENROLLED' | 'LOCKED_SEQUENTIAL';

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
  const [lockedReason, setLockedReason] = useState<string | null>(null);

  const [access, setAccess] = useState<LessonAccess>('GRANTED');
  const user = useAuthSession();
  const userId = user === undefined ? undefined : (user?.id ?? null);

  const loadData = useCallback(async () => {
    if (!slug || userId === undefined) return;
    setLoading(true);
    setError(null);
    setLockedReason(null);
    setLesson(null);

    const allPaths = await LearningPathApiService.getLearningPaths().catch(() => []);
    const publishedPaths = (Array.isArray(allPaths) ? allPaths : []).filter(
      (p) => p.status === ContentStatus.PUBLISHED,
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
      const { lesson: lessonData } = await LearnerApiService.getLesson(slug, pathId || undefined);
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
      } else if (
        axiosErr?.response?.status === 403 &&
        (axiosErr?.response?.data?.code === LEARNER_ERROR_CODES.LESSON_LOCKED_SEQUENTIAL ||
          axiosErr?.response?.data?.code === LEARNER_ERROR_CODES.CHAPTER_QUIZ_LOCKED)
      ) {
        setAccess(LessonAccessState.LOCKED_SEQUENTIAL);
        setLockedReason(
          axiosErr.response.data.message ||
            'Bài học này đang bị khóa. Bạn cần hoàn thành bài học trước đó trong lộ trình trước khi tiếp tục.',
        );
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

  const { tocItems, compiledHtml, resourceLinks, quizBlocks } = useMemo<{
    tocItems: LessonTocEntry[];
    compiledHtml: string;
    resourceLinks: ResourceLinkBlockData[];
    quizBlocks: Map<string, QuizBlockData>;
  }>(() => {
    if (!lesson) {
      return { tocItems: [], compiledHtml: '', resourceLinks: [], quizBlocks: new Map() };
    }
    const { blocks, resourceLinks: links } = normalizeContentToBlocks(
      lesson.content ?? lesson.contentRichText,
    );
    const { tocItems: toc, html } = buildLessonTocAndHtml(blocks);
    return { tocItems: toc, compiledHtml: html, resourceLinks: links, quizBlocks: collectQuizBlocks(blocks) };
  }, [lesson]);

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

    for (const [chIdx, ch] of (learningPath.chapters || []).entries()) {
      for (const cl of ch.chapterLessons || []) {
        if (!cl.lesson || cl.lesson.status !== ContentStatus.PUBLISHED) continue;
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
    lockedReason,
    lockedPreview,
    reload: loadData,
    lesson,
    learningPath,
    loading,
    error,
    tocItems,
    compiledHtml,
    resourceLinks,
    quizBlocks,
    navigationContext,
  };
}
