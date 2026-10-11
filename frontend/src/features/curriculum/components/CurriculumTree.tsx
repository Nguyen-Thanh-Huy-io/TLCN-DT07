'use client';
import React, { useState, useMemo } from 'react';
import {
  CurriculumTopicNode,
  CurriculumLessonNode,
  AnyCurriculumNode,
  CurriculumNodeType,
} from '@/types/models/curriculum-tree.type';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface CurriculumTreeProps {
  data: CurriculumTopicNode[];
  selectedNode: AnyCurriculumNode | null;
  onSelectNode: (node: AnyCurriculumNode) => void;
  onAddTopic: (parentId?: string) => void;
  onAddLesson: (topicId: string) => void;
}

export type TreeFilterType = 'ALL' | 'ROOT_ONLY' | 'HAS_LESSONS' | 'NO_QUIZ';

export function CurriculumTree({
  data,
  selectedNode,
  onSelectNode,
  onAddTopic,
  onAddLesson,
}: CurriculumTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<TreeFilterType>('ALL');

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

    if (activeFilter === 'ROOT_ONLY') {
      result = result.map((t) => ({ ...t, subTopics: [], children: [], lessons: [] }));
    } else if (activeFilter === 'HAS_LESSONS') {
      result = result.filter((t) => {
        const subs = t.subTopics || t.children || [];
        const hasSubLessons = subs.some((s) => s.lessons && s.lessons.length > 0);
        return (t.lessons && t.lessons.length > 0) || hasSubLessons;
      });
    } else if (activeFilter === 'NO_QUIZ') {
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
              {totalRootTopics} chủ đề chính • {totalSubTopics} chủ đề con • {totalLessons} bài
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
            placeholder="Tìm theo chủ đề, bài học..."
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

        {/* Quick Filter Pills */}
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
              activeFilter === 'ROOT_ONLY'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              setActiveFilter('ROOT_ONLY');
              collapseAll();
            }}
          >
            Chủ đề chính
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-colors font-medium ${
              activeFilter === 'HAS_LESSONS'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => {
              setActiveFilter('HAS_LESSONS');
              expandAll();
            }}
          >
            Có bài học
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

      {/* Tree Content: Recursive Topic-Centric Nodes */}
      <div className="tree-content flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredData.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            Không tìm thấy chủ đề nào phù hợp.
          </div>
        ) : (
          filteredData.map((rootTopic) => {
            const subs = rootTopic.subTopics || rootTopic.children || [];
            const directLessons = rootTopic.lessons || [];
            const hasChildren = subs.length > 0 || directLessons.length > 0;
            const isExpanded = !!expandedTopics[rootTopic.id];
            const isSelected =
              selectedNode?.type === CurriculumNodeType.TOPIC &&
              selectedNode.id === rootTopic.id;

            return (
              <div key={rootTopic.id} className="topic-root-branch">
                {/* Level 1: Root Topic Node */}
                <div
                  className={`tree-node group level-1 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                  onClick={() => onSelectNode(rootTopic)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {hasChildren ? (
                      <button
                        type="button"
                        className={`p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        onClick={(e) => toggleTopic(rootTopic.id, e)}
                      >
                        <Icon name={IconName.CHEVRON} size={11} />
                      </button>
                    ) : (
                      <span className="w-3.5 inline-block" />
                    )}
                    <Icon
                      name={IconName.FOLDER}
                      size={14}
                      className={isSelected ? 'text-slate-900' : 'text-slate-600'}
                    />
                    <span className="text-xs truncate font-medium" title={rootTopic.name}>
                      {rootTopic.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {subs.length > 0 ? `${subs.length} con` : `${directLessons.length} bài`}
                    </span>
                    <button
                      type="button"
                      title="Thêm chủ đề con thuộc chủ đề này"
                      className="tree-node-action p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTopic(rootTopic.id);
                      }}
                    >
                      <Icon name={IconName.PLUS} size={12} />
                    </button>
                  </div>
                </div>

                {/* Level 2: Sub-topics & Direct Lessons */}
                {isExpanded && hasChildren ? (
                  <div className="subtopics-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                    {/* Render Sub-topics (Cấp 2: Giai đoạn) */}
                    {subs.map((subTopic) => {
                      const isSubExpanded = !!expandedSubTopics[subTopic.id];
                      const isSubSelected =
                        selectedNode?.type === CurriculumNodeType.TOPIC &&
                        selectedNode.id === subTopic.id;
                      const grandChildren = subTopic.subTopics || subTopic.children || [];
                      const subLessons = subTopic.lessons || [];
                      const hasSubChildren = grandChildren.length > 0 || subLessons.length > 0;

                      return (
                        <div key={subTopic.id} className="subtopic-branch">
                          <div
                            className={`tree-node group level-2 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                              isSubSelected
                                ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                            onClick={() => onSelectNode(subTopic)}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {hasSubChildren ? (
                                <button
                                  type="button"
                                  className={`p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform ${
                                    isSubExpanded ? 'rotate-90' : ''
                                  }`}
                                  onClick={(e) => toggleSubTopic(subTopic.id, e)}
                                >
                                  <Icon name={IconName.CHEVRON} size={11} />
                                </button>
                              ) : (
                                <span className="w-3.5 inline-block" />
                              )}
                              <Icon
                                name={IconName.FOLDER}
                                size={12}
                                className={isSubSelected ? 'text-slate-900' : 'text-slate-400'}
                              />
                              <span className="text-[11.5px] truncate font-medium" title={subTopic.name}>
                                {subTopic.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {grandChildren.length > 0
                                  ? `${grandChildren.length} chuyên đề`
                                  : `${subLessons.length} bài`}
                              </span>
                              <button
                                type="button"
                                title="Thêm chuyên đề hoặc bài học vào giai đoạn này"
                                className="tree-node-action p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddTopic(subTopic.id);
                                }}
                              >
                                <Icon name={IconName.PLUS} size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Level 3: Chuyên đề (Grandchildren) & Direct Lessons */}
                          {isSubExpanded && hasSubChildren ? (
                            <div className="grand-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                              {/* 1. Các chủ đề con Cấp 3 (Chuyên đề) */}
                              {grandChildren.map((grand) => {
                                const isGrandExpanded = !!expandedSubTopics[grand.id];
                                const isGrandSelected =
                                  selectedNode?.type === CurriculumNodeType.TOPIC &&
                                  selectedNode.id === grand.id;
                                const grandLessons = grand.lessons || [];

                                return (
                                  <div key={grand.id} className="grandchild-branch">
                                    <div
                                      className={`tree-node group level-3 flex items-center justify-between p-1 px-2 rounded-md cursor-pointer transition-colors ${
                                        isGrandSelected
                                          ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                                          : 'hover:bg-slate-50 text-slate-600'
                                      }`}
                                      onClick={() => onSelectNode(grand)}
                                    >
                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                        {grandLessons.length > 0 ? (
                                          <button
                                            type="button"
                                            className={`p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform ${
                                              isGrandExpanded ? 'rotate-90' : ''
                                            }`}
                                            onClick={(e) => toggleSubTopic(grand.id, e)}
                                          >
                                            <Icon name={IconName.CHEVRON} size={10} />
                                          </button>
                                        ) : (
                                          <span className="w-3 inline-block" />
                                        )}
                                        <Icon
                                          name={IconName.FOLDER}
                                          size={11}
                                          className={
                                            isGrandSelected ? 'text-slate-900' : 'text-slate-400'
                                          }
                                        />
                                        <span
                                          className="text-[11px] truncate"
                                          title={grand.name}
                                        >
                                          {grand.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 ml-1.5">
                                        <span className="text-[9.5px] text-slate-400 font-mono">
                                          {grandLessons.length} bài
                                        </span>
                                        <button
                                          type="button"
                                          title="Thêm bài học vào chuyên đề này"
                                          className="tree-node-action p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onAddLesson(grand.id);
                                          }}
                                        >
                                          <Icon name={IconName.PLUS} size={10} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Bài học thuộc Chuyên đề Cấp 3 */}
                                    {isGrandExpanded && grandLessons.length > 0 ? (
                                      <div className="lessons-container ml-3 pl-2 border-l border-slate-200 my-0.5 space-y-0.5">
                                        {grandLessons.map((lesson) => {
                                          const isLessonSelected =
                                            selectedNode?.type === CurriculumNodeType.LESSON &&
                                            selectedNode.id === lesson.id;

                                          return (
                                            <div
                                              key={lesson.id}
                                              className={`tree-node group level-4 flex items-center justify-between p-1 px-1.5 rounded-md cursor-pointer transition-colors ${
                                                isLessonSelected
                                                  ? 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300'
                                                  : 'hover:bg-slate-50 text-slate-600'
                                              }`}
                                              onClick={() => onSelectNode(lesson)}
                                            >
                                              <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-1">
                                                <Icon
                                                  name={IconName.BOOK}
                                                  size={11}
                                                  className={
                                                    isLessonSelected
                                                      ? 'text-slate-900'
                                                      : 'text-slate-400'
                                                  }
                                                />
                                                <span
                                                  className="text-[10.5px] truncate"
                                                  title={lesson.name || lesson.title}
                                                >
                                                  {lesson.name || lesson.title}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1 ml-1">
                                                {lesson.hasQuiz ? (
                                                  <span className="text-[9px] text-slate-400 font-mono">
                                                    Quiz
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}

                              {/* 2. Các bài học trực tiếp thuộc Giai đoạn (nếu có) */}
                              {subLessons.map((lesson) => {
                                const isLessonSelected =
                                  selectedNode?.type === CurriculumNodeType.LESSON &&
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
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-2">
                                      <Icon
                                        name={IconName.BOOK}
                                        size={12}
                                        className={
                                          isLessonSelected ? 'text-slate-900' : 'text-slate-400'
                                        }
                                      />
                                      <span
                                        className="text-[11.5px] truncate"
                                        title={lesson.name || lesson.title}
                                      >
                                        {lesson.name || lesson.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      {lesson.hasQuiz ? (
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          Quiz
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Render Direct Lessons under Root Topic (if any) */}
                    {directLessons.map((lesson) => {
                      const isLessonSelected =
                        selectedNode?.type === CurriculumNodeType.LESSON &&
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
                              className={isLessonSelected ? 'text-slate-900' : 'text-slate-400'}
                            />
                            <span
                              className="text-[11.5px] truncate"
                              title={lesson.name || lesson.title}
                            >
                              {lesson.name || lesson.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {lesson.hasQuiz ? (
                              <span className="text-[10px] text-slate-400 font-mono">Quiz</span>
                            ) : null}
                          </div>
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

      {/* Footer Quick Action: Thêm Chủ đề mới */}
      <div className="tree-footer pt-2 mt-2 border-t border-slate-100">
        <button
          type="button"
          className="w-full py-1.5 px-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => onAddTopic()}
        >
          <Icon name={IconName.PLUS} size={12} />
          <span>Thêm Chủ đề mới</span>
        </button>
      </div>
    </div>
  );
}
