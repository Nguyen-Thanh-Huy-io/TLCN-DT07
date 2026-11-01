'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, X, Check, Search } from 'lucide-react';
import { TopicItem } from '@/types/models/topic.type';
import { LessonItem } from '@/types/models/lesson.type';

/**
 * Cấu trúc Node tổng quát theo Composite Pattern cho mọi cây phân cấp
 * (Dùng chung cho Topic, Lesson, Period, Taxonomy, HistoricalEvent...)
 */
export interface TreeSelectNode {
  id: string;
  label: string;
  /** Cho phép chọn node này hay chỉ dùng làm nhánh gập/mở (mặc định: true) */
  selectable?: boolean;
  /** Nếu là nhánh nhóm (group), khi click có chọn tất cả con bên trong không */
  selectChildrenOnClick?: boolean;
  children?: TreeSelectNode[];
}

export interface TreeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  nodes: TreeSelectNode[];
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
  /** Cho phép chọn nhiều mục (true) hay chỉ 1 mục (false). Mặc định: true */
  multiple?: boolean;
  emptyText?: string;
  unitLabel?: string;
  /** Hiển thị thanh tìm kiếm nhanh trên cây (mặc định: true) */
  searchable?: boolean;
  searchPlaceholder?: string;
}

/**
 * Hàm lọc đệ quy cây phân cấp theo từ khóa tìm kiếm:
 * - Nếu node cha khớp từ khóa -> giữ nguyên toàn bộ nhánh con của nó.
 * - Nếu node con khớp từ khóa -> giữ lại đường dẫn cha dẫn tới node con đó.
 */
function filterTreeNodes(nodes: TreeSelectNode[], keyword: string): TreeSelectNode[] {
  const term = keyword.trim().toLowerCase();
  if (!term) return nodes;

  const result: TreeSelectNode[] = [];

  for (const node of nodes) {
    const selfMatched = node.label.toLowerCase().includes(term);
    if (selfMatched) {
      result.push(node);
      continue;
    }

    if (node.children && node.children.length > 0) {
      const matchedChildren = filterTreeNodes(node.children, term);
      if (matchedChildren.length > 0) {
        result.push({
          ...node,
          children: matchedChildren,
        });
      }
    }
  }

  return result;
}

/**
 * Component Modal chọn cây phân cấp dùng chung toàn hệ thống (Reusable UI Component)
 * Thiết kế theo mẫu chuẩn: Header + Nút đóng (X), Thanh tìm kiếm nhanh,
 * Cây phân cấp gập mở (v / >), Thanh viền dọc xanh lá bên trái khi chọn, và thanh cuộn dọc.
 */
export function TreeSelectModal({
  isOpen,
  onClose,
  title = 'Select a category',
  subtitle,
  nodes,
  selectedIds,
  onChangeSelected,
  multiple = true,
  emptyText = 'Không có dữ liệu danh mục.',
  unitLabel = 'mục',
  searchable = true,
  searchPlaceholder = 'Tìm kiếm nhanh theo tên chủ đề, bài học...',
}: TreeSelectModalProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = useMemo(
    () => filterTreeNodes(nodes, searchTerm),
    [nodes, searchTerm]
  );

  // Mặc định bung mở toàn bộ các nhánh khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      if (nodes.length > 0) {
        const exp: Record<string, boolean> = {};
        const traverse = (list: TreeSelectNode[]) => {
          list.forEach((n) => {
            if (n.children && n.children.length > 0) {
              exp[n.id] = true;
              traverse(n.children);
            }
          });
        };
        traverse(nodes);
        setExpandedNodes(exp);
      }
    }
  }, [isOpen, nodes]);

  if (!isOpen) return null;

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Thu thập tất cả ID con có thể chọn bên trong 1 nhánh
  const collectSelectableChildIds = (node: TreeSelectNode): string[] => {
    const ids: string[] = [];
    const walk = (n: TreeSelectNode) => {
      if (n.selectable !== false && (!n.children || n.children.length === 0 || !n.selectChildrenOnClick)) {
        ids.push(n.id);
      }
      n.children?.forEach(walk);
    };
    node.children?.forEach(walk);
    return ids;
  };

  const handleNodeClick = (node: TreeSelectNode) => {
    // Trường hợp nhánh nhóm dùng để chọn nhanh tất cả các phần tử con
    if (node.selectChildrenOnClick && node.children && node.children.length > 0) {
      if (!multiple) {
        setExpandedNodes((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
        return;
      }
      const childIds = collectSelectableChildIds(node);
      if (childIds.length === 0) return;
      const allSelected = childIds.every((id) => selectedIds.includes(id));
      if (allSelected) {
        onChangeSelected(selectedIds.filter((id) => !childIds.includes(id)));
      } else {
        onChangeSelected(Array.from(new Set([...selectedIds, ...childIds])));
      }
      return;
    }

    // Trường hợp node chỉ làm thư mục đóng/mở, không cho phép chọn
    if (node.selectable === false) {
      setExpandedNodes((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
      return;
    }

    // Trường hợp chọn đơn (Single-select)
    if (!multiple) {
      onChangeSelected([node.id]);
      onClose();
      return;
    }

    // Trường hợp chọn nhiều (Multi-select)
    if (selectedIds.includes(node.id)) {
      onChangeSelected(selectedIds.filter((id) => id !== node.id));
    } else {
      onChangeSelected([...selectedIds, node.id]);
    }
  };

  const isNodeHighlighted = (node: TreeSelectNode): boolean => {
    if (selectedIds.includes(node.id)) return true;
    if (node.selectChildrenOnClick && node.children && node.children.length > 0) {
      const childIds = collectSelectableChildIds(node);
      return childIds.length > 0 && childIds.every((id) => selectedIds.includes(id));
    }
    return false;
  };

  const renderNode = (node: TreeSelectNode, depth: number) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    // Khi đang tìm kiếm, tự động bung mở các nhánh khớp từ khóa
    const isExpanded = searchTerm.trim().length > 0 ? true : !!expandedNodes[node.id];
    const isSelected = isNodeHighlighted(node);
    const indentPx = depth * 24 + 12;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => handleNodeClick(node)}
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

          <span className="flex-1 leading-snug">{node.label}</span>

          {selectedIds.includes(node.id) && (
            <Check size={15} strokeWidth={2.5} className="text-emerald-700 shrink-0" />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>
        )}
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
        {/* 1. Header chuẩn mẫu: Select a category + nút X */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white">
          <h3 className="text-lg font-semibold text-slate-900">
            {title}{' '}
            {subtitle && (
              <span className="text-xs font-normal text-slate-400">({subtitle})</span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1.5. Thanh tìm kiếm nhanh trên cây phân cấp */}
        {searchable && (
          <div className="px-6 pb-3 bg-white">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 placeholder:text-slate-400 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title="Xóa từ khóa"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Body: Cây phân cấp có thanh cuộn dọc bên phải */}
        <div className="px-6 pb-4 max-h-[360px] overflow-y-auto space-y-0.5">
          {filteredNodes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 italic">
              {searchTerm.trim()
                ? `Không tìm thấy kết quả phù hợp với "${searchTerm}"`
                : emptyText}
            </div>
          ) : (
            filteredNodes.map((node) => renderNode(node, 0))
          )}
        </div>

        {/* 3. Footer điều khiển */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Đã chọn: <strong className="text-emerald-700">{selectedIds.length}</strong> {unitLabel}
            {selectedIds.length > 0 && (
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
            Xác nhận ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE TRIGGER BOX (Ô BẤM MỞ MODAL CHỌN CÂY + HIỂN THỊ CHIPS ĐÃ CHỌN)
// ============================================================================

export interface TreeSelectTriggerItem {
  id: string;
  label: string;
}

export interface TreeSelectTriggerProps {
  onClick: () => void;
  selectedItems: TreeSelectTriggerItem[];
  onRemoveItem?: (id: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  badgeColor?: 'emerald' | 'blue';
}

export function TreeSelectTrigger({
  onClick,
  selectedItems,
  onRemoveItem,
  placeholder = 'Bấm để chọn danh mục...',
  icon,
  badgeColor = 'emerald',
}: TreeSelectTriggerProps) {
  const chipStyle =
    badgeColor === 'blue'
      ? 'bg-blue-50 border-blue-200 text-blue-900'
      : 'bg-emerald-50 border-emerald-200 text-emerald-900';

  const removeBtnStyle =
    badgeColor === 'blue'
      ? 'text-blue-600 hover:text-rose-600'
      : 'text-emerald-600 hover:text-rose-600';

  const addMoreStyle =
    badgeColor === 'blue' ? 'text-blue-700' : 'text-emerald-700';

  return (
    <div
      onClick={onClick}
      className="w-full min-h-[38px] px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl flex flex-wrap items-center gap-1.5 cursor-pointer transition-colors group"
    >
      {selectedItems.length === 0 ? (
        <div className="flex items-center justify-between w-full text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            {icon}
            <span>{placeholder}</span>
          </span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      ) : (
        <>
          {selectedItems.map((item) => (
            <span
              key={item.id}
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium max-w-full ${chipStyle}`}
            >
              <span className="truncate max-w-[180px]" title={item.label}>
                {item.label}
              </span>
              {onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className={`${removeBtnStyle} ml-0.5 cursor-pointer`}
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          <span className={`text-[10px] font-semibold ${addMoreStyle} ml-auto shrink-0`}>
            + Chọn thêm
          </span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// ADAPTER HELPERS: CHUYỂN ĐỔI DỮ LIỆU TOPIC / LESSON SANG TREE SELECT NODE
// ============================================================================

/**
 * Chuyển đổi danh sách phẳng TopicItem[] thành cây phân cấp TreeSelectNode[]
 */
export function buildTopicTreeNodes(topics: TopicItem[]): TreeSelectNode[] {
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

  const buildNode = (topic: TopicItem): TreeSelectNode => {
    const children = (childrenMap.get(topic.id) || []).map(buildNode);
    return {
      id: topic.id,
      label: topic.name,
      selectable: true,
      children,
    };
  };

  return rootTopics.map(buildNode);
}

/**
 * Chuyển đổi danh sách LessonItem[] thành danh sách cây Bài học trực tiếp (không trộn lẫn tên Giai đoạn của Topic)
 */
export function buildLessonTreeNodes(lessons: LessonItem[]): TreeSelectNode[] {
  if (!lessons || lessons.length === 0) return [];

  return [
    {
      id: 'root-lessons',
      label: `Danh sách Bài học hiện có (${lessons.length} bài học)`,
      selectable: false,
      selectChildrenOnClick: true,
      children: lessons.map((ls) => ({
        id: ls.id,
        label: ls.title,
        selectable: true,
      })),
    },
  ];
}
