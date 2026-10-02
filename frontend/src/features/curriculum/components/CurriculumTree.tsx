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
      // Default expand all periods
      const initial: Record<string, boolean> = {};
      data.forEach((p) => {
        initial[p.id] = true;
      });
      return initial;
    },
  );

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    () => {
      // Default expand the first topic of each period
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

    // Apply quick filter level
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
    <div className="curriculum-tree-card bg-white border border-gray-200 rounded-lg p-3 flex flex-col h-full shadow-sm">
      {/* Search and tree actions */}
      <div className="tree-header mb-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Cây Phân Cấp Học Tập
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold border border-slate-200">
              {totalPeriods} Giai đoạn • {totalTopics} CĐ • {totalLessons} Bài
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="text-[10px] text-gray-500 hover:text-blue-600 px-1.5 py-0.5 rounded border border-gray-200 hover:border-blue-300"
              onClick={expandAll}
              title="Mở rộng tất cả các nhánh"
            >
              Mở hết
            </button>
            <button
              type="button"
              className="text-[10px] text-gray-500 hover:text-blue-600 px-1.5 py-0.5 rounded border border-gray-200 hover:border-blue-300"
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
            placeholder="Tìm theo giai đoạn, chủ đề, bài học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs py-1.5 pl-7 pr-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 bg-gray-50/50"
          />
          <div className="absolute left-2 top-2 text-gray-400 pointer-events-none">
            <Icon name={IconName.SEARCH} size={13} />
          </div>
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
          <button
            type="button"
            className={`px-2 py-0.5 rounded-full transition-colors font-medium ${
              activeFilter === 'ALL'
                ? 'bg-[#16385f] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 rounded-full transition-colors font-medium ${
              activeFilter === 'PERIODS'
                ? 'bg-[#16385f] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              setActiveFilter('PERIODS');
              collapseAll();
            }}
          >
            🏛️ Giai đoạn
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 rounded-full transition-colors font-medium ${
              activeFilter === 'TOPICS'
                ? 'bg-[#16385f] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              setActiveFilter('TOPICS');
              expandAll();
            }}
          >
            📁 Chủ đề
          </button>
          {missingQuizLessons > 0 && (
            <button
              type="button"
              className={`px-2 py-0.5 rounded-full transition-colors font-medium flex items-center gap-1 ${
                activeFilter === 'NO_QUIZ'
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
              onClick={() => {
                setActiveFilter('NO_QUIZ');
                expandAll();
              }}
              title="Lọc các bài học chưa có câu hỏi trắc nghiệm kiểm tra"
            >
              <span>⚠️ Thiếu Quiz</span>
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
          <div className="p-4 text-center text-xs text-gray-400">
            Không tìm thấy mục nào phù hợp với bộ lọc.
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
                  className={`tree-node group level-1 flex items-center justify-between p-2 rounded-md cursor-pointer transition-all ${
                    isPeriodSelected
                      ? 'bg-[#16385f] text-white font-semibold shadow-sm border-l-4 border-l-[#e2b342]'
                      : 'hover:bg-slate-100/90 text-gray-900 bg-slate-50 font-medium border border-gray-200/60'
                  }`}
                  onClick={() => onSelectNode(period)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`p-0.5 rounded hover:bg-black/10 transition-transform ${
                        isPeriodExpanded ? 'rotate-90' : ''
                      }`}
                      onClick={(e) => togglePeriod(period.id, e)}
                    >
                      <Icon name={IconName.CHEVRON} size={13} />
                    </button>
                    <Icon name={IconName.CLOCK} size={15} className={isPeriodSelected ? 'text-amber-300' : 'text-blue-700'} />
                    <span className="text-xs truncate font-semibold" title={period.name}>
                      {period.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-normal ${
                        isPeriodSelected
                          ? 'bg-[#0d2340] text-amber-200'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {period.topics.length} CĐ
                    </span>
                    <button
                      type="button"
                      title="Thêm chủ đề con thuộc giai đoạn này"
                      className={`tree-node-action p-1 rounded hover:bg-black/20 ${
                        isPeriodSelected ? 'text-white' : 'text-gray-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTopic(period.id);
                      }}
                    >
                      <Icon name={IconName.PLUS} size={13} />
                    </button>
                  </div>
                </div>

                {/* Level 2: Topic Nodes */}
                {isPeriodExpanded && period.topics.length > 0 ? (
                  <div className="topics-container ml-3 pl-2.5 border-l border-slate-200 my-1 space-y-1">
                    {period.topics.map((topic) => {
                      const isTopicExpanded = !!expandedTopics[topic.id];
                      const isTopicSelected =
                        selectedNode?.type === CurriculumNodeType.TOPIC &&
                        selectedNode.id === topic.id;

                      return (
                        <div key={topic.id} className="topic-branch">
                          <div
                            className={`tree-node group level-2 flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-all ${
                              isTopicSelected
                                ? 'bg-[#16385f] text-white font-semibold shadow-sm border-l-4 border-l-[#e2b342]'
                                : 'hover:bg-slate-50 text-gray-800 bg-white border border-gray-100'
                            }`}
                            onClick={() => onSelectNode(topic)}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <button
                                type="button"
                                className={`p-0.5 rounded hover:bg-black/10 transition-transform ${
                                  isTopicExpanded ? 'rotate-90' : ''
                                }`}
                                onClick={(e) => toggleTopic(topic.id, e)}
                              >
                                <Icon name={IconName.CHEVRON} size={12} />
                              </button>
                              <Icon name={IconName.FOLDER} size={14} className={isTopicSelected ? 'text-amber-300' : 'text-amber-600'} />
                              <span
                                className="text-xs truncate"
                                title={topic.name}
                              >
                                {topic.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-normal ${
                                  isTopicSelected
                                    ? 'bg-[#0d2340] text-amber-200'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {topic.lessons.length} bài
                              </span>
                              <button
                                type="button"
                                title="Thêm bài học con vào chủ đề này"
                                className={`tree-node-action p-1 rounded hover:bg-black/20 ${
                                  isTopicSelected
                                    ? 'text-white'
                                    : 'text-gray-500'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddLesson(period.id, topic.id);
                                }}
                              >
                                <Icon name={IconName.PLUS} size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Level 3: Lesson Nodes */}
                          {isTopicExpanded && topic.lessons.length > 0 ? (
                            <div className="lessons-container ml-3 pl-2.5 border-l border-slate-200 my-1 space-y-1">
                              {topic.lessons.map((lesson) => {
                                const isLessonSelected =
                                  selectedNode?.type ===
                                    CurriculumNodeType.LESSON &&
                                  selectedNode.id === lesson.id;

                                return (
                                  <div
                                    key={lesson.id}
                                    className={`tree-node group level-3 flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-all ${
                                      isLessonSelected
                                        ? 'bg-[#16385f] text-white font-semibold shadow-sm border-l-4 border-l-[#e2b342]'
                                        : 'hover:bg-slate-50 text-gray-700 bg-white border border-gray-100'
                                    }`}
                                    onClick={() => onSelectNode(lesson)}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <Icon name={IconName.BOOK} size={13} className={isLessonSelected ? 'text-amber-300' : 'text-emerald-600'} />
                                      <span
                                        className="text-[11px] truncate"
                                        title={lesson.name}
                                      >
                                        {lesson.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      {lesson.hasQuiz ? (
                                        <span
                                          className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                                            isLessonSelected
                                              ? 'bg-emerald-700 text-white'
                                              : 'bg-green-100 text-green-800'
                                          }`}
                                        >
                                          Quiz ✓
                                        </span>
                                      ) : (
                                        <span
                                          className="text-[8px] px-1 py-0.2 rounded font-normal text-amber-600 bg-amber-50 border border-amber-200"
                                          title="Bài học này chưa có Quiz"
                                        >
                                          Chưa có Quiz
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

      {/* Bottom Button to Add Period */}
      <div className="pt-2 mt-2 border-t border-gray-100">
        <button
          type="button"
          className="w-full primary-button !h-8 !text-xs flex items-center justify-center gap-1.5"
          onClick={onAddPeriod}
        >
          <Icon name={IconName.PLUS} size={13} />
          <span>Thêm giai đoạn mới</span>
        </button>
      </div>
    </div>
  );
}
