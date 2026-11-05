'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LearningPathApiService,
  LearningPathItem,
  ChapterItem,
} from '@/services/entities/learning-path.service';
import { LearnerApiService, type LibraryLesson } from '@/services/entities/learner.service';
import { TopicApiService } from '@/services/entities/topic.service';
import type { TopicItem } from '@/types/models/topic.type';
import { LearningPathFilterType } from '../constants/public-curriculum.constants';
import { PathFilterStrategyRegistry } from '../strategies/public-curriculum.strategies';

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
  const [filterType, setFilterType] = useState<LearningPathFilterType>(
    LearningPathFilterType.ALL,
  );
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
        const defaultPath =
          (initialPathId && safePaths.find((p) => p.id === initialPathId)) ||
          safePaths[0];
        setSelectedPathId(defaultPath.id);
        setExpandedChapterIds(
          (defaultPath.chapters || []).map((ch) => ch.id),
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Không thể tải dữ liệu chương trình học lịch sử. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, [initialPathId]);

  useEffect(() => {
    loadCurriculum();
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
        selectedTopicId ? 'TOPIC' : filterType,
        searchKeyword,
        selectedTopicId,
        selectedTopicSubtreeIds,
      ),
    [paths, filterType, searchKeyword, selectedTopicId, selectedTopicSubtreeIds],
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
    selectedTopicId,
    setSelectedTopicId,
    filterType,
    setFilterType,
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
