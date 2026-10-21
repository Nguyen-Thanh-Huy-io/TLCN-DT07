'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LearningPathApiService,
  LearningPathItem,
} from '@/services/entities/learning-path.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models/lesson.type';
import { TagItem } from '@/types/models/tag.type';
import { LearningPathFilterType } from '../constants/public-curriculum.constants';
import { PathFilterStrategyRegistry } from '../strategies/public-curriculum.strategies';

export function usePublicCurriculumFacade(initialPathId?: string | null) {
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [libraryLessons, setLibraryLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [pathsRes, lessonsRes] = await Promise.all([
        LearningPathApiService.getLearningPaths(),
        LessonApiService.getLessons({ limit: 50 }),
      ]);

      const safePaths = Array.isArray(pathsRes) ? pathsRes : [];
      setPaths(safePaths);
      setLibraryLessons(lessonsRes.items || []);

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

  const filteredPaths = useMemo(
    () => PathFilterStrategyRegistry.filter(paths, filterType, searchKeyword),
    [paths, filterType, searchKeyword],
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
  const availableTags = useMemo<TagItem[]>(() => {
    const tagMap = new Map<string, TagItem>();
    for (const lesson of libraryLessons) {
      const tags =
        lesson.tags ||
        (lesson.lessonTags || [])
          .map((lt) => lt.tag)
          .filter((t): t is TagItem => Boolean(t));
      for (const tag of tags) {
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
      ),
    [libraryLessons, searchKeyword, selectedTagId],
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
            (cSum, ch) => cSum + (ch.chapterLessons?.length || 0),
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
