'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Check, Folder, BookOpen } from 'lucide-react';
import { TopicItem } from '@/types/models/topic.type';
import { LessonItem } from '@/types/models/lesson.type';

// ============================================================================
// 1. MODAL CHỌN NHIỀU CHỦ ĐỀ (SELECT A CATEGORY - TOPICS ONLY)
// ============================================================================

export interface TopicCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
  selectedTopicIds: string[];
  onChangeSelected: (topicIds: string[]) => void;
}

interface TopicTreeNode {
  id: string;
  name: string;
  depth: number;
  children: TopicTreeNode[];
}

export function TopicCategoryModalPicker({
  isOpen,
  onClose,
  topics,
  selectedTopicIds,
  onChangeSelected,
}: TopicCategoryModalProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Xây dựng cây phân cấp chỉ dành riêng cho Topic (Chủ đề cha -> Chủ đề giai đoạn -> Chuyên đề con)
  const treeNodes = useMemo<TopicTreeNode[]>(() => {
    if (!topics || topics.length === 0) return [];

    const childrenMap = new Map<string, TopicItem[]>();
    const rootTopics: TopicItem[] = [];

    topics.forEach((t) => {
      if (t.parentId) {
        const arr = childrenMap.get(t.parentId) || [];
        arr.push(t);
        childrenMap.set(t.parentId, arr);
      } else {
        rootTopics.push(t);
      }
    });

    const buildNode = (topic: TopicItem, depth: number): TopicTreeNode => {
      const children = (childrenMap.get(topic.id) || []).map((child) =>
        buildNode(child, depth + 1)
      );
      return {
        id: topic.id,
        name: topic.name,
        depth,
        children,
      };
    };

    return rootTopics.map((rt) => buildNode(rt, 0));
  }, [topics]);

  // Mặc định bung mở toàn bộ cây khi mở modal
  useEffect(() => {
    if (isOpen && treeNodes.length > 0) {
      const exp: Record<string, boolean> = {};
      const traverse = (node: TopicTreeNode) => {
        exp[node.id] = true;
        node.children.forEach(traverse);
      };
      treeNodes.forEach(traverse);
      setExpandedNodes(exp);
    }
  }, [isOpen, treeNodes]);

  if (!isOpen) return null;

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const toggleSelectTopic = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      onChangeSelected(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      onChangeSelected([...selectedTopicIds, topicId]);
    }
  };

  const renderTopicNode = (node: TopicTreeNode) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children.length > 0;
    const isSelected = selectedTopicIds.includes(node.id);
    const indentPx = node.depth * 24 + 12;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => toggleSelectTopic(node.id)}
          style={{ paddingLeft: `${indentPx}px` }}
          className={`group flex items-center gap-2 py-2.5 pr-4 text-sm transition-colors cursor-pointer border-l-4 ${
            isSelected
              ? 'border-emerald-700 bg-emerald-100/70 text-slate-900 font-medium'
              : 'border-transparent text-slate-800 hover:bg-slate-50'
          }`}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 rounded hover:bg-black/5 text-slate-600 transition shrink-0 cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <span className="flex-1 leading-snug">{node.name}</span>

          {isSelected && (
            <Check size={15} strokeWidth={2.5} className="text-emerald-700 shrink-0" />
          )}
        </div>

        {hasChildren && isExpanded && <div>{node.children.map(renderTopicNode)}</div>}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header chuẩn mẫu: Select a category + nút X */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white">
          <h3 className="text-lg font-semibold text-slate-900">
            Select a category <span className="text-xs font-normal text-slate-400">(Chọn một hoặc nhiều Chủ đề)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: Cây phân cấp có thanh cuộn bên phải */}
        <div className="px-6 pb-4 max-h-[380px] overflow-y-auto space-y-0.5">
          {treeNodes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 italic">
              Không có dữ liệu chủ đề.
            </div>
          ) : (
            treeNodes.map(renderTopicNode)
          )}
        </div>

        {/* Footer điều khiển */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Đã chọn: <strong className="text-emerald-700">{selectedTopicIds.length}</strong> chủ đề
            {selectedTopicIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChangeSelected([])}
                className="ml-3 text-slate-400 hover:text-rose-600 underline cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Xác nhận ({selectedTopicIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MODAL CHỌN NHIỀU BÀI HỌC (SELECT LESSONS - LESSONS TREE)
// ============================================================================

export interface LessonCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonItem[];
  selectedLessonIds: string[];
  onChangeSelected: (lessonIds: string[]) => void;
}

interface LessonGroupNode {
  id: string;
  label: string;
  lessons: LessonItem[];
}

/**
 * Phân nhóm bài học theo giai đoạn lịch sử để hiển thị dạng cây gập mở giống mẫu
 */
function groupLessonsIntoTree(lessons: LessonItem[]): LessonGroupNode[] {
  const groups: LessonGroupNode[] = [
    {
      id: 'grp-1954-1960',
      label: 'Giai đoạn 1954 - 1960: Phong trào Đồng Khởi & Chi viện Trường Sơn',
      lessons: [],
    },
    {
      id: 'grp-1961-1968',
      label: 'Giai đoạn 1961 - 1968: Chiến tranh đặc biệt & Tổng tiến công Tết Mậu Thân',
      lessons: [],
    },
    {
      id: 'grp-1969-1973',
      label: 'Giai đoạn 1969 - 1973: Quảng Trị, Điện Biên Phủ trên không & Hiệp định Paris',
      lessons: [],
    },
    {
      id: 'grp-1973-1975',
      label: 'Giai đoạn 1973 - 1975: Chiến dịch Tây Nguyên & Đại thắng Mùa Xuân 1975',
      lessons: [],
    },
    {
      id: 'grp-other',
      label: 'Các bài học lịch sử khác',
      lessons: [],
    },
  ];

  lessons.forEach((ls) => {
    const t = ls.title.toLowerCase();
    if (t.includes('đồng khởi') || t.includes('trường sơn') || t.includes('1959') || t.includes('1960')) {
      groups[0].lessons.push(ls);
    } else if (t.includes('ấp bắc') || t.includes('mậu thân') || t.includes('1963') || t.includes('1968')) {
      groups[1].lessons.push(ls);
    } else if (
      t.includes('điện biên phủ trên không') ||
      t.includes('quảng trị') ||
      t.includes('paris') ||
      t.includes('1972') ||
      t.includes('1973')
    ) {
      groups[2].lessons.push(ls);
    } else if (t.includes('tây nguyên') || t.includes('mùa xuân 1975') || t.includes('hồ chí minh') || t.includes('1975')) {
      groups[3].lessons.push(ls);
    } else {
      groups[4].lessons.push(ls);
    }
  });

  return groups.filter((g) => g.lessons.length > 0);
}

export function LessonCategoryModalPicker({
  isOpen,
  onClose,
  lessons,
  selectedLessonIds,
  onChangeSelected,
}: LessonCategoryModalProps) {
  const [rootExpanded, setRootExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const lessonGroups = useMemo(() => groupLessonsIntoTree(lessons), [lessons]);

  useEffect(() => {
    if (isOpen) {
      setRootExpanded(true);
      const exp: Record<string, boolean> = {};
      lessonGroups.forEach((g) => {
        exp[g.id] = true;
      });
      setExpandedGroups(exp);
    }
  }, [isOpen, lessonGroups]);

  if (!isOpen) return null;

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleSelectLesson = (lessonId: string) => {
    if (selectedLessonIds.includes(lessonId)) {
      onChangeSelected(selectedLessonIds.filter((id) => id !== lessonId));
    } else {
      onChangeSelected([...selectedLessonIds, lessonId]);
    }
  };

  const toggleSelectAllInGroup = (groupLessons: LessonItem[]) => {
    const groupIds = groupLessons.map((l) => l.id);
    const allSelected = groupIds.every((id) => selectedLessonIds.includes(id));
    if (allSelected) {
      onChangeSelected(selectedLessonIds.filter((id) => !groupIds.includes(id)));
    } else {
      const next = Array.from(new Set([...selectedLessonIds, ...groupIds]));
      onChangeSelected(next);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header chuẩn mẫu: Select lessons + nút X */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white">
          <h3 className="text-lg font-semibold text-slate-900">
            Select lessons <span className="text-xs font-normal text-slate-400">(Chọn một hoặc nhiều Bài học liên kết)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: Cây phân cấp Bài học chuẩn giao diện mẫu */}
        <div className="px-6 pb-4 max-h-[380px] overflow-y-auto space-y-0.5 select-none">
          {lessons.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 italic">
              Không có dữ liệu bài học.
            </div>
          ) : (
            <div>
              {/* Root Node */}
              <div
                onClick={() => setRootExpanded((prev) => !prev)}
                className={`flex items-center gap-2 py-2.5 px-3 text-sm font-medium cursor-pointer border-l-4 transition-colors ${
                  selectedLessonIds.length > 0
                    ? 'border-emerald-700 bg-emerald-100/70 text-slate-900'
                    : 'border-transparent text-slate-800 hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRootExpanded((prev) => !prev);
                  }}
                  className="p-0.5 rounded hover:bg-black/5 text-slate-600 transition shrink-0 cursor-pointer"
                >
                  {rootExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span className="flex-1">Danh sách Bài học Lịch sử ({lessons.length} bài)</span>
              </div>

              {/* Group Nodes & Leaf Lessons */}
              {rootExpanded &&
                lessonGroups.map((group) => {
                  const isGroupExpanded = !!expandedGroups[group.id];
                  const allGroupSelected = group.lessons.every((l) =>
                    selectedLessonIds.includes(l.id)
                  );

                  return (
                    <div key={group.id}>
                      {/* Nhánh giai đoạn */}
                      <div
                        onClick={() => toggleSelectAllInGroup(group.lessons)}
                        style={{ paddingLeft: '32px' }}
                        className={`flex items-center gap-2 py-2 pr-4 text-sm cursor-pointer border-l-4 transition-colors ${
                          allGroupSelected
                            ? 'border-emerald-700 bg-emerald-100/50 text-slate-900 font-medium'
                            : 'border-transparent text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => toggleGroup(group.id, e)}
                          className="p-0.5 rounded hover:bg-black/5 text-slate-600 transition shrink-0 cursor-pointer"
                        >
                          {isGroupExpanded ? (
                            <ChevronDown size={15} />
                          ) : (
                            <ChevronRight size={15} />
                          )}
                        </button>
                        <span className="flex-1 leading-snug">{group.label}</span>
                      </div>

                      {/* Các bài học cụ thể bên trong nhánh */}
                      {isGroupExpanded &&
                        group.lessons.map((ls) => {
                          const isSelected = selectedLessonIds.includes(ls.id);
                          return (
                            <div
                              key={ls.id}
                              onClick={() => toggleSelectLesson(ls.id)}
                              style={{ paddingLeft: '64px' }}
                              className={`flex items-center justify-between gap-2 py-2 pr-4 text-sm cursor-pointer border-l-4 transition-colors ${
                                isSelected
                                  ? 'border-emerald-700 bg-emerald-100/70 text-slate-900 font-medium'
                                  : 'border-transparent text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              <span className="leading-snug">{ls.title}</span>
                              {isSelected && (
                                <Check
                                  size={15}
                                  strokeWidth={2.5}
                                  className="text-emerald-700 shrink-0"
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer điều khiển */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Đã chọn: <strong className="text-emerald-700">{selectedLessonIds.length}</strong> bài học
            {selectedLessonIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChangeSelected([])}
                className="ml-3 text-slate-400 hover:text-rose-600 underline cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Xác nhận ({selectedLessonIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
