'use client';

import { CurriculumTreeFilter } from '@/constants/enums';
import React, { useState, useMemo } from 'react';
import { CurriculumTopicNode, AnyCurriculumNode } from '@/types/models';

export interface CurriculumTreeProps {
  data: CurriculumTopicNode[];
  selectedNode: AnyCurriculumNode | null;
  onSelectNode: (node: AnyCurriculumNode) => void;
  onAddTopic: (parentId?: string) => void;
  onAddLesson: (topicId: string) => void;
}

export function useCurriculumTree({ data }: Pick<CurriculumTreeProps, 'data'>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<CurriculumTreeFilter>(CurriculumTreeFilter.ALL);
  // Quản lý trạng thái mở rộng của các chủ đề gốc
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      data.forEach((t) => {
        initial[t.id] = true;
      });
      return initial;
    },
  );
  // Quản lý trạng thái mở rộng của các chủ đề con (Cấp 2 & Cấp 3)
  const [expandedSubTopics, setExpandedSubTopics] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      data.forEach((t) => {
        const subs = t.subTopics || t.children || [];
        subs.forEach((sub) => {
          initial[sub.id] = true;
          const grands = sub.subTopics || sub.children || [];
          grands.forEach((g) => {
            initial[g.id] = true;
          });
        });
      });
      return initial;
    },
  );
  const toggleTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleSubTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const expandAll = () => {
    const tExp: Record<string, boolean> = {};
    const sExp: Record<string, boolean> = {};
    data.forEach((t) => {
      tExp[t.id] = true;
      const subs = t.subTopics || t.children || [];
      subs.forEach((sub) => {
        sExp[sub.id] = true;
        const grands = sub.subTopics || sub.children || [];
        grands.forEach((g) => {
          sExp[g.id] = true;
        });
      });
    });
    setExpandedTopics(tExp);
    setExpandedSubTopics(sExp);
  };
  const collapseAll = () => {
    setExpandedTopics({});
    setExpandedSubTopics({});
  };
  // Lọc dữ liệu theo từ khóa tìm kiếm & bộ lọc
  const filteredData = useMemo(() => {
    let result = data;

    if (activeFilter === CurriculumTreeFilter.ROOT_ONLY) {
      result = result.map((t) => ({ ...t, subTopics: [], children: [], lessons: [] }));
    } else if (activeFilter === CurriculumTreeFilter.HAS_LESSONS) {
      result = result.filter((t) => {
        const subs = t.subTopics || t.children || [];
        const hasSubLessons = subs.some((s) => s.lessons && s.lessons.length > 0);
        return (t.lessons && t.lessons.length > 0) || hasSubLessons;
      });
    } else if (activeFilter === CurriculumTreeFilter.NO_QUIZ) {
      result = result
        .map((t) => {
          const subs = t.subTopics || t.children || [];
          const filteredSubs = subs
            .map((s) => ({
              ...s,
              lessons: (s.lessons || []).filter((l) => !l.hasQuiz),
            }))
            .filter((s) => s.lessons.length > 0);

          const filteredLessons = (t.lessons || []).filter((l) => !l.hasQuiz);
          if (filteredSubs.length > 0 || filteredLessons.length > 0) {
            return { ...t, subTopics: filteredSubs, children: filteredSubs, lessons: filteredLessons };
          }
          return null;
        })
        .filter(Boolean) as CurriculumTopicNode[];
    }

    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();

    return result
      .map((topic) => {
        const matchesTopic = topic.name.toLowerCase().includes(term);
        const subs = topic.subTopics || topic.children || [];
        const matchingSubs = subs
          .map((sub) => {
            const matchesSub = sub.name.toLowerCase().includes(term);
            const grands = sub.subTopics || sub.children || [];
            const matchingGrands = grands
              .map((grand) => {
                const matchesGrand = grand.name.toLowerCase().includes(term);
                const matchingGrandLessons = (grand.lessons || []).filter((l) =>
                  (l.name || l.title || '').toLowerCase().includes(term),
                );
                if (matchesGrand || matchingGrandLessons.length > 0) {
                  return { ...grand, lessons: matchingGrandLessons };
                }
                return null;
              })
              .filter(Boolean) as CurriculumTopicNode[];

            const matchingSubLessons = (sub.lessons || []).filter((l) =>
              (l.name || l.title || '').toLowerCase().includes(term),
            );
            if (matchesSub || matchingGrands.length > 0 || matchingSubLessons.length > 0) {
              return {
                ...sub,
                subTopics: matchingGrands,
                children: matchingGrands,
                lessons: matchingSubLessons,
              };
            }
            return null;
          })
          .filter(Boolean) as CurriculumTopicNode[];

        const matchingLessons = (topic.lessons || []).filter((l) =>
          (l.name || l.title || '').toLowerCase().includes(term),
        );

        if (matchesTopic || matchingSubs.length > 0 || matchingLessons.length > 0) {
          return {
            ...topic,
            subTopics: matchingSubs,
            children: matchingSubs,
            lessons: matchingLessons,
          };
        }
        return null;
      })
      .filter(Boolean) as CurriculumTopicNode[];
  }, [data, searchTerm, activeFilter]);
  // Thống kê số lượng hỗ trợ 3 cấp chủ đề
  const totalRootTopics = data.length;
  const totalSubTopics = data.reduce((acc, t) => {
    const subs = t.subTopics || t.children || [];
    const grandCount = subs.reduce(
      (gAcc, s) => gAcc + (s.subTopics || s.children || []).length,
      0,
    );
    return acc + subs.length + grandCount;
  }, 0);
  const totalLessons = data.reduce((acc, t) => {
    const subs = t.subTopics || t.children || [];
    let lessonSum = t.lessons?.length || 0;
    subs.forEach((s) => {
      lessonSum += s.lessons?.length || 0;
      const grands = s.subTopics || s.children || [];
      grands.forEach((g) => {
        lessonSum += g.lessons?.length || 0;
      });
    });
    return acc + lessonSum;
  }, 0);
  const missingQuizLessons = data.reduce((acc, t) => {
    const subs = t.subTopics || t.children || [];
    let missingSum = (t.lessons || []).filter((l) => !l.hasQuiz).length;
    subs.forEach((s) => {
      missingSum += (s.lessons || []).filter((l) => !l.hasQuiz).length;
      const grands = s.subTopics || s.children || [];
      grands.forEach((g) => {
        missingSum += (g.lessons || []).filter((l) => !l.hasQuiz).length;
      });
    });
    return acc + missingSum;
  }, 0);

  return {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    expandedTopics,
    expandedSubTopics,
    toggleTopic,
    toggleSubTopic,
    expandAll,
    collapseAll,
    filteredData,
    totalRootTopics,
    totalSubTopics,
    totalLessons,
    missingQuizLessons,
  };
}

export type CurriculumTreeFacade = ReturnType<typeof useCurriculumTree>;
