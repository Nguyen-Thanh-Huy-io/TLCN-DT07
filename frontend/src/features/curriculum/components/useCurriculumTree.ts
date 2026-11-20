'use client';

import { CurriculumTreeFilter } from '@/constants/enums';
import React, { useState, useMemo } from 'react';
import { CurriculumTopicNode, CurriculumLessonNode, AnyCurriculumNode } from '@/types/models';

export interface CurriculumTreeProps {
  data: CurriculumTopicNode[];
  selectedNode: AnyCurriculumNode | null;
  onSelectNode: (node: AnyCurriculumNode) => void;
  onAddTopic: (parentId?: string) => void;
  onAddLesson: (topicId: string) => void;
}

export const childTopicsOf = (topic: CurriculumTopicNode): CurriculumTopicNode[] =>
  topic.subTopics || topic.children || [];

const allTopicIds = (nodes: CurriculumTopicNode[]): string[] =>
  nodes.flatMap((t) => [t.id, ...allTopicIds(childTopicsOf(t))]);

const countTopics = (nodes: CurriculumTopicNode[]): number =>
  nodes.reduce((sum, t) => sum + 1 + countTopics(childTopicsOf(t)), 0);

const countLessons = (
  nodes: CurriculumTopicNode[],
  predicate: (lesson: CurriculumLessonNode) => boolean = () => true,
): number =>
  nodes.reduce(
    (sum, t) => sum + (t.lessons || []).filter(predicate).length + countLessons(childTopicsOf(t), predicate),
    0,
  );

/** Giữ chủ đề khi chính nó khớp hoặc còn chủ đề con / bài học khớp ở bất kỳ cấp nào. */
function pruneTree(
  nodes: CurriculumTopicNode[],
  keepLesson: (lesson: CurriculumLessonNode) => boolean,
  keepTopic: (topic: CurriculumTopicNode) => boolean,
): CurriculumTopicNode[] {
  return nodes.flatMap((t) => {
    const children = pruneTree(childTopicsOf(t), keepLesson, keepTopic);
    const lessons = (t.lessons || []).filter(keepLesson);
    if (!keepTopic(t) && children.length === 0 && lessons.length === 0) return [];
    return [{ ...t, subTopics: children, children, lessons }];
  });
}

function applyFilter(data: CurriculumTopicNode[], filter: CurriculumTreeFilter): CurriculumTopicNode[] {
  switch (filter) {
    case CurriculumTreeFilter.ROOT_ONLY:
      return data.map((t) => ({ ...t, subTopics: [], children: [], lessons: [] }));
    case CurriculumTreeFilter.HAS_LESSONS:
      return data.filter((t) => countLessons([t]) > 0);
    case CurriculumTreeFilter.NO_QUIZ:
      return pruneTree(data, (l) => !l.hasQuiz, () => false);
    default:
      return data;
  }
}

function applySearch(data: CurriculumTopicNode[], searchTerm: string): CurriculumTopicNode[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return data;
  return pruneTree(
    data,
    (l) => (l.name || l.title || '').toLowerCase().includes(term),
    (t) => t.name.toLowerCase().includes(term),
  );
}

const expandedMapOf = (nodes: CurriculumTopicNode[]): Record<string, boolean> =>
  Object.fromEntries(allTopicIds(nodes).map((id) => [id, true]));

export function useCurriculumTree({ data }: Pick<CurriculumTreeProps, 'data'>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<CurriculumTreeFilter>(CurriculumTreeFilter.ALL);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => expandedMapOf(data));

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const expandAll = () => setExpanded(expandedMapOf(data));
  const collapseAll = () => setExpanded({});

  const filteredData = useMemo(
    () => applySearch(applyFilter(data, activeFilter), searchTerm),
    [data, searchTerm, activeFilter],
  );

  const totalRootTopics = data.length;
  const totalSubTopics = countTopics(data) - data.length;
  const totalLessons = countLessons(data);
  const missingQuizLessons = countLessons(data, (l) => !l.hasQuiz);

  return {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    expanded,
    toggleNode,
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
