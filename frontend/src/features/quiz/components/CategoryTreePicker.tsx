'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, BookOpen, Folder, Check } from 'lucide-react';
import { TopicItem } from '@/types/models/topic.type';
import { LessonItem } from '@/types/models/lesson.type';

export interface CategoryTreePickerProps {
  topics: TopicItem[];
  lessons: LessonItem[];
  selectedTopicId: string;
  selectedLessonId: string;
  onSelectTopic: (topicId: string) => void;
  onSelectLesson: (lessonId: string, parentTopicId?: string) => void;
  onClear: () => void;
  className?: string;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  type: 'TOPIC' | 'LESSON';
  depth: number;
  topicId?: string;
  lessonId?: string;
  parentTopicId?: string;
  children: CategoryTreeNode[];
}

/**
 * Liên kết bài học vào chuyên đề / chủ đề phù hợp dựa trên nội dung & từ khóa lịch sử
 */
function matchLessonToTopicId(lesson: LessonItem, topics: TopicItem[]): string | undefined {
  const titleLower = lesson.title.toLowerCase();

  // 1. Kiểm tra đối sánh từ khóa đặc thù với các chủ đề con
  for (const t of topics) {
    const tLower = t.name.toLowerCase();
    if (tLower.includes('đồng khởi') && titleLower.includes('đồng khởi')) return t.id;
    if (tLower.includes('ấp bắc') && titleLower.includes('ấp bắc')) return t.id;
    if (tLower.includes('mậu thân') && titleLower.includes('mậu thân')) return t.id;
    if (
      tLower.includes('điện biên phủ trên không') &&
      titleLower.includes('điện biên phủ trên không')
    )
      return t.id;
    if (tLower.includes('hiệp định paris') && titleLower.includes('hiệp định paris')) return t.id;
    if (tLower.includes('quảng trị') && titleLower.includes('quảng trị')) return t.id;
    if (tLower.includes('tây nguyên') && titleLower.includes('tây nguyên')) return t.id;
    if (
      tLower.includes('hồ chí minh') &&
      (titleLower.includes('hồ chí minh') || titleLower.includes('mùa xuân 1975'))
    )
      return t.id;
    if (
      tLower.includes('chi viện') &&
      (titleLower.includes('trường sơn') || titleLower.includes('chi viện'))
    )
      return t.id;
  }

  // 2. Nếu là các chủ đề giai đoạn chung
  for (const t of topics) {
    const tLower = t.name.toLowerCase();
    if (tLower.includes('1954 - 1960') && titleLower.includes('1954 - 1960')) return t.id;
    if (tLower.includes('1961 - 1965') && titleLower.includes('1963')) return t.id;
    if (tLower.includes('1965 - 1968') && titleLower.includes('1968')) return t.id;
    if (tLower.includes('1969 - 1973') && (titleLower.includes('1972') || titleLower.includes('1973')))
      return t.id;
    if (tLower.includes('1973 - 1975') && titleLower.includes('1975')) return t.id;
  }

  return undefined;
}

export function CategoryTreePicker({
  topics,
  lessons,
  selectedTopicId,
  selectedLessonId,
  onSelectTopic,
  onSelectLesson,
  onClear,
  className = '',
}: CategoryTreePickerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Xây dựng cây phân cấp Category Tree (Topics -> Sub-Topics -> Lessons)
  const treeNodes = useMemo<CategoryTreeNode[]>(() => {
    if (!topics || topics.length === 0) return [];

    // Phân loại topics theo parentId
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

    // Gom nhóm bài học theo topicId
    const lessonMap = new Map<string, LessonItem[]>();
    const unassignedLessons: LessonItem[] = [];

    lessons.forEach((ls) => {
      const matchedTopicId = matchLessonToTopicId(ls, topics);
      if (matchedTopicId) {
        const arr = lessonMap.get(matchedTopicId) || [];
        arr.push(ls);
        lessonMap.set(matchedTopicId, arr);
      } else {
        unassignedLessons.push(ls);
      }
    });

    const buildTopicNode = (topic: TopicItem, depth: number): CategoryTreeNode => {
      const subTopics = childrenMap.get(topic.id) || [];
      const directLessons = lessonMap.get(topic.id) || [];

      const topicChildren: CategoryTreeNode[] = subTopics.map((sub) =>
        buildTopicNode(sub, depth + 1)
      );

      const lessonChildren: CategoryTreeNode[] = directLessons.map((ls) => ({
        id: `ls-${ls.id}`,
        name: ls.title,
        type: 'LESSON',
        depth: depth + 1,
        lessonId: ls.id,
        parentTopicId: topic.id,
        children: [],
      }));

      return {
        id: `tp-${topic.id}`,
        name: topic.name,
        type: 'TOPIC',
        depth,
        topicId: topic.id,
        children: [...topicChildren, ...lessonChildren],
      };
    };

    const result = rootTopics.map((rt) => buildTopicNode(rt, 0));

    // Nếu có bài học chưa gán vào cây, thêm vào nhánh Bài học khác ở cuối
    if (unassignedLessons.length > 0) {
      result.push({
        id: 'tp-unassigned',
        name: 'Bài học khác',
        type: 'TOPIC',
        depth: 0,
        children: unassignedLessons.map((ls) => ({
          id: `ls-${ls.id}`,
          name: ls.title,
          type: 'LESSON',
          depth: 1,
          lessonId: ls.id,
          children: [],
        })),
      });
    }

    return result;
  }, [topics, lessons]);

  // Mở rộng tất cả các node mặc định để người dùng dễ theo dõi
  useEffect(() => {
    if (treeNodes.length > 0) {
      const exp: Record<string, boolean> = {};
      const traverse = (node: CategoryTreeNode) => {
        // Mặc định mở rộng cấp 0 và cấp 1
        if (node.depth <= 1) exp[node.id] = true;
        node.children.forEach(traverse);
      };
      treeNodes.forEach(traverse);
      setExpandedNodes((prev) => ({ ...exp, ...prev }));
    }
  }, [treeNodes]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleNodeClick = (node: CategoryTreeNode) => {
    if (node.type === 'LESSON' && node.lessonId) {
      onSelectLesson(node.lessonId, node.parentTopicId);
    } else if (node.type === 'TOPIC' && node.topicId) {
      onSelectTopic(node.topicId);
    }
  };

  // Tìm tên hiển thị của item đang chọn
  const activeLabel = useMemo(() => {
    if (selectedLessonId) {
      const ls = lessons.find((l) => l.id === selectedLessonId);
      if (ls) return { text: ls.title, type: 'Bài học' };
    }
    if (selectedTopicId) {
      const tp = topics.find((t) => t.id === selectedTopicId);
      if (tp) return { text: tp.name, type: 'Chủ đề' };
    }
    return null;
  }, [selectedLessonId, selectedTopicId, lessons, topics]);

  const renderNode = (node: CategoryTreeNode) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children.length > 0;

    const isSelected =
      (node.type === 'LESSON' && node.lessonId === selectedLessonId) ||
      (node.type === 'TOPIC' && !selectedLessonId && node.topicId === selectedTopicId);

    // Thụt lề theo độ sâu (indentation)
    const indentPadding = `${node.depth * 14 + 6}px`;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => handleNodeClick(node)}
          style={{ paddingLeft: indentPadding }}
          className={`group flex items-center gap-1.5 py-1.5 pr-2.5 text-xs transition-colors cursor-pointer border-l-[3px] ${
            isSelected
              ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold shadow-2xs'
              : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title={node.name}
        >
          {/* Chevron expand/collapse toggle */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 rounded-sm hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition shrink-0 cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown size={13} strokeWidth={2.5} />
              ) : (
                <ChevronRight size={13} strokeWidth={2.5} />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Node Icon */}
          {node.type === 'TOPIC' ? (
            <Folder
              size={13}
              className={`shrink-0 ${isSelected ? 'text-emerald-700' : 'text-blue-500'}`}
            />
          ) : (
            <BookOpen
              size={13}
              className={`shrink-0 ${isSelected ? 'text-emerald-700' : 'text-amber-600'}`}
            />
          )}

          {/* Label Text */}
          <span className="truncate flex-1 text-[11.5px] leading-snug">{node.name}</span>

          {/* Selected checkmark */}
          {isSelected && (
            <span className="text-emerald-700 shrink-0">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </div>

        {/* Children nodes */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden ${className}`}
    >
      {/* 1. Header (Select a category) */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <h4 className="text-xs font-bold text-slate-800 tracking-tight">Select a category</h4>
        <button
          type="button"
          onClick={onClear}
          title="Bỏ chọn danh mục (Đặt về chung)"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. Hierarchical Tree Content Area */}
      <div className="overflow-y-auto max-h-56 sm:max-h-60 p-1 divide-y divide-slate-50/50">
        {treeNodes.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 italic">
            Đang tải cây danh mục...
          </div>
        ) : (
          treeNodes.map(renderNode)
        )}
      </div>

      {/* 3. Footer indicator showing current selected category */}
      {activeLabel && (
        <div className="px-3 py-1.5 bg-emerald-50/50 border-t border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-emerald-700 px-1 py-0.5 rounded bg-emerald-100/60 shrink-0">
              {activeLabel.type}
            </span>
            <span className="truncate font-semibold text-emerald-950">{activeLabel.text}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline shrink-0 cursor-pointer"
          >
            Hủy chọn
          </button>
        </div>
      )}
    </div>
  );
}
