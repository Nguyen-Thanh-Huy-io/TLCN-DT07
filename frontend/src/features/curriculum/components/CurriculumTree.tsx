'use client';
import React, { useState, useMemo } from 'react';
import {
  CurriculumPeriodNode,
  CurriculumTopicNode,
  AnyCurriculumNode,
  CurriculumNodeType,
} from '@/types/models/curriculum-tree.type';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface CurriculumTreeProps {
  data: CurriculumPeriodNode[];
  selectedNode: AnyCurriculumNode | null;
  onSelectNode: (node: AnyCurriculumNode) => void;
  onAddPeriod: () => void;
  onAddTopic: (periodId: string) => void;
  onAddLesson: (periodId: string, topicId: string) => void;
}

export type TreeFilterType = 'ALL' | 'PERIODS' | 'TOPICS' | 'NO_QUIZ';

export function CurriculumTree({
  data,
  selectedNode,
  onSelectNode,
  onAddPeriod,
  onAddTopic,
  onAddLesson,
}: CurriculumTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<TreeFilterType>('ALL');

  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      data.forEach((p) => {
        initial[p.id] = true;
      });
      return initial;
    },
  );

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      data.forEach((p) => {
        if (p.topics.length > 0) {
          initial[p.topics[0].id] = true;
        }
      });
      return initial;
    },
  );

  const togglePeriod = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPeriods((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const pExp: Record<string, boolean> = {};
    const tExp: Record<string, boolean> = {};
    data.forEach((p) => {
      pExp[p.id] = true;
      p.topics.forEach((t) => {
        tExp[t.id] = true;
      });
    });
    setExpandedPeriods(pExp);
    setExpandedTopics(tExp);
  };

  const collapseAll = () => {
    setExpandedPeriods({});
    setExpandedTopics({});
  };

  // Filter tree based on search term & filter type
  const filteredData = useMemo(() => {
    let result = data;

    if (activeFilter === 'NO_QUIZ') {
      result = result
        .map((p) => ({
          ...p,
          topics: p.topics
            .map((t) => ({
              ...t,
              lessons: t.lessons.filter((l) => !l.hasQuiz),
            }))
            .filter((t) => t.lessons.length > 0),
        }))
        .filter((p) => p.topics.length > 0);
    }

    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();

    return result
      .map((period) => {
        const matchesPeriod = period.name.toLowerCase().includes(term);
        const matchingTopics = period.topics
          .map((topic) => {
            const matchesTopic = topic.name.toLowerCase().includes(term);
            const matchingLessons = topic.lessons.filter((lesson) =>
              lesson.name.toLowerCase().includes(term),
            );

            if (matchesTopic || matchingLessons.length > 0) {
              return { ...topic, lessons: matchingLessons };
            }
            return null;
          })
          .filter(Boolean) as CurriculumTopicNode[];

        if (matchesPeriod || matchingTopics.length > 0) {
          return { ...period, topics: matchingTopics };
        }
        return null;
      })
      .filter(Boolean) as CurriculumPeriodNode[];
  }, [data, searchTerm, activeFilter]);

  const totalPeriods = data.length;
  const totalTopics = data.reduce((acc, p) => acc + p.topics.length, 0);
  const totalLessons = data.reduce(
    (acc, p) => acc + p.topics.reduce((a, t) => a + t.lessons.length, 0),
    0,
  );
  const missingQuizLessons = data.reduce(
    (acc, p) =>
      acc +
      p.topics.reduce(
        (a, t) => a + t.lessons.filter((l) => !l.hasQuiz).length,
        0,
      ),
    0,
  );

  return (
    <div className="curriculum-tree-card bg-white border border-slate-200 rounded-lg p-3 flex flex-col h-full">
      {/* Header with counts and expand/collapse */}
      <div className="tree-header mb-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 tracking-tight">
              Sơ đồ cây học tập
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {totalPeriods} giai đoạn • {totalTopics} chủ đề • {totalLessons} bài
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="text-[11px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded border border-slate-200 bg-white transition-colors"
              onClick={expandAll}
              title="Mở rộng tất cả"
            >
              Mở hết
            </button>
            <button
              type="button"
              className="text-[11px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded border border-slate-200 bg-white transition-colors"
              onClick={collapseAll}
              title="Thu gọn tất cả"
            >
              Thu gọn
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Tìm theo giai đoạn, chủ đề, bài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs py-1.5 pl-7 pr-6 border border-slate-200 rounded-md focus:outline-none focus:border-slate-800 bg-slate-50/70 text-slate-900 placeholder:text-slate-400"
          />
          <div className="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
            <Icon name={IconName.SEARCH} size={12} />
          </div>
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* Quick Filter Pills (No emojis) */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-colors font-medium ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setActiveFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-colors font-medium ${
              activeFilter === 'PERIODS'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              setActiveFilter('PERIODS');
              collapseAll();
            }}
          >
            Giai đoạn
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-colors font-medium ${
              activeFilter === 'TOPICS'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              setActiveFilter('TOPICS');
              expandAll();
            }}
          >
            Chủ đề
          </button>
          {missingQuizLessons > 0 && (
            <button
              type="button"
              className={`px-2 py-0.5 rounded transition-colors font-medium flex items-center gap-1 ${
                activeFilter === 'NO_QUIZ'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
              onClick={() => {
                setActiveFilter('NO_QUIZ');
                expandAll();
              }}
              title="Lọc các bài học chưa có câu hỏi trắc nghiệm kiểm tra"
            >
              <span>Thiếu Quiz</span>
              <span className="bg-amber-200 text-amber-900 text-[9px] px-1 rounded-full font-bold">
                {missingQuizLessons}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="tree-content flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredData.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
            Không tìm thấy mục nào phù hợp.
          </div>
        ) : (
          filteredData.map((period) => {
            const isPeriodExpanded = !!expandedPeriods[period.id];
            const isPeriodSelected =
              selectedNode?.type === CurriculumNodeType.PERIOD &&
              selectedNode.id === period.id;

            return (
              <div key={period.id} className="period-branch">
                {/* Level 1: Period Node */}
                <div
                  className={`tree-node group level-1 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                    isPeriodSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                  onClick={() => onSelectNode(period)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform ${
                        isPeriodExpanded ? 'rotate-90' : ''
                      }`}
                      onClick={(e) => togglePeriod(period.id, e)}
                    >
                      <Icon name={IconName.CHEVRON} size={11} />
                    </button>
                    <Icon
                      name={IconName.CLOCK}
                      size={14}
                      className={isPeriodSelected ? 'text-slate-900' : 'text-slate-500'}
                    />
                    <span className="text-xs truncate font-medium" title={period.name}>
                      {period.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {period.topics.length} chủ đề
                    </span>
                    <button
                      type="button"
                      title="Thêm chủ đề con thuộc giai đoạn này"
                      className="tree-node-action p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTopic(period.id);
                      }}
                    >
                      <Icon name={IconName.PLUS} size={12} />
                    </button>
                  </div>
                </div>

                {/* Level 2: Topic Nodes */}
                {isPeriodExpanded && period.topics.length > 0 ? (
                  <div className="topics-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                    {period.topics.map((topic) => {
                      const isTopicExpanded = !!expandedTopics[topic.id];
                      const isTopicSelected =
                        selectedNode?.type === CurriculumNodeType.TOPIC &&
                        selectedNode.id === topic.id;

                      return (
                        <div key={topic.id} className="topic-branch">
                          <div
                            className={`tree-node group level-2 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                              isTopicSelected
                                ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                            onClick={() => onSelectNode(topic)}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <button
                                type="button"
                                className={`p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform ${
                                  isTopicExpanded ? 'rotate-90' : ''
                                }`}
                                onClick={(e) => toggleTopic(topic.id, e)}
                              >
                                <Icon name={IconName.CHEVRON} size={11} />
                              </button>
                              <Icon
                                name={IconName.FOLDER}
                                size={13}
                                className={isTopicSelected ? 'text-slate-900' : 'text-slate-500'}
                              />
                              <span className="text-xs truncate" title={topic.name}>
                                {topic.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {topic.lessons.length} bài
                              </span>
                              <button
                                type="button"
                                title="Thêm bài học con vào chủ đề này"
                                className="tree-node-action p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddLesson(period.id, topic.id);
                                }}
                              >
                                <Icon name={IconName.PLUS} size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Level 2.5: Sub-topic Nodes */}
                          {isTopicExpanded &&
                          topic.subTopics &&
                          topic.subTopics.length > 0 ? (
                            <div className="subtopics-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                              {topic.subTopics.map((subTopic) => {
                                const isSubTopicSelected =
                                  selectedNode?.type ===
                                    CurriculumNodeType.TOPIC &&
                                  selectedNode.id === subTopic.id;
                                return (
                                  <div
                                    key={subTopic.id}
                                    className={`tree-node group level-2-sub flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                                      isSubTopicSelected
                                        ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                    onClick={() => onSelectNode(subTopic)}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <Icon
                                        name={IconName.FOLDER}
                                        size={12}
                                        className={
                                          isSubTopicSelected
                                            ? 'text-slate-900'
                                            : 'text-slate-400'
                                        }
                                      />
                                      <span
                                        className="text-[11.5px] truncate"
                                        title={subTopic.name}
                                      >
                                        {subTopic.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {subTopic.lessons.length} bài
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}

                          {/* Level 3: Lesson Nodes */}
                          {isTopicExpanded && topic.lessons.length > 0 ? (
                            <div className="lessons-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                              {topic.lessons.map((lesson) => {
                                const isLessonSelected =
                                  selectedNode?.type ===
                                    CurriculumNodeType.LESSON &&
                                  selectedNode.id === lesson.id;

                                return (
                                  <div
                                    key={lesson.id}
                                    className={`tree-node group level-3 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                                      isLessonSelected
                                        ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                    onClick={() => onSelectNode(lesson)}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-3">
                                      <Icon
                                        name={IconName.BOOK}
                                        size={12}
                                        className={
                                          isLessonSelected
                                            ? 'text-slate-900'
                                            : 'text-slate-400'
                                        }
                                      />
                                      <span
                                        className="text-[11.5px] truncate"
                                        title={lesson.name}
                                      >
                                        {lesson.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      {lesson.hasQuiz ? (
                                        <span
                                          className="text-[10px] text-slate-400 font-mono"
                                          title="Đã có câu hỏi trắc nghiệm"
                                        >
                                          Quiz
                                        </span>
                                      ) : (
                                        <span
                                          className="text-[10px] text-amber-700 font-mono bg-amber-50 px-1 rounded"
                                          title="Chưa có câu hỏi trắc nghiệm"
                                        >
                                          No Quiz
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Quick Action */}
      <div className="tree-footer pt-2 mt-2 border-t border-slate-100">
        <button
          type="button"
          className="w-full py-1.5 px-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          onClick={onAddPeriod}
        >
          <Icon name={IconName.PLUS} size={12} />
          <span>Thêm Giai đoạn mới</span>
        </button>
      </div>
    </div>
  );
}
