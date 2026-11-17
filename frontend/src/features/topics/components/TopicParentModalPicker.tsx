'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { TopicItem } from '@/types/models';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';

export interface TopicParentModalPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (parentId: string | null) => void;
  topics: TopicItem[];
  selectedParentId: string | null;
  currentTopicId?: string;
  title?: string;
  subtitle?: string;
  allowRootSelect?: boolean;
  rootLabel?: string;
  rootDescription?: string;
  maxDepth?: number | null;
}

interface TreePickerNode {
  topic: TopicItem;
  depth: number;
  levelName: string;
  breadcrumbPath: string;
  isSelectable: boolean;
  disabledReason?: string;
  children: TreePickerNode[];
}

function collectDescendantTopicIds(topics: TopicItem[], rootId?: string): Set<string> {
  if (!rootId) return new Set<string>();
  const descendants = new Set<string>();
  const visit = (id: string) => {
    descendants.add(id);
    for (const child of topics) {
      if (child.parentId === id && !descendants.has(child.id)) visit(child.id);
    }
  };
  visit(rootId);
  return descendants;
}

function buildTopicTreeNodes(topics: TopicItem[], descendantIds: Set<string>, maxDepth: number | null): TreePickerNode[] {
  const childrenMap = new Map<string, TopicItem[]>();
  const rootTopics: TopicItem[] = [];
  for (const t of topics) {
    if (t.parentId) {
      const arr = childrenMap.get(t.parentId) || [];
      arr.push(t);
      childrenMap.set(t.parentId, arr);
    } else {
      rootTopics.push(t);
    }
  }
  const buildNode = (topic: TopicItem, depth: number, ancestorNames: string[]): TreePickerNode => {
    const isDescendant = descendantIds.has(topic.id);
    const isDepthExceeded = maxDepth !== null && maxDepth > 0 && depth >= maxDepth;
    const isSelectable = !isDescendant && !isDepthExceeded;
    const disabledReason = isDescendant
      ? 'Không thể chọn chính chủ đề này hoặc chủ đề con của nó'
      : isDepthExceeded
        ? 'Đã đạt giới hạn độ sâu phân cấp tối đa'
        : undefined;
    const currentPath = [...ancestorNames, topic.name];
    const rawChildren = childrenMap.get(topic.id) || [];
    return {
      topic,
      depth,
      levelName: depth === 0 ? 'Chủ đề gốc' : 'Chủ đề con',
      breadcrumbPath: currentPath.join(' › '),
      isSelectable,
      disabledReason,
      children: rawChildren.map((c) => buildNode(c, depth + 1, currentPath)),
    };
  };
  return rootTopics.map((r) => buildNode(r, 0, []));
}

function matchesSearch(node: TreePickerNode, normalizedTerm: string): boolean {
  if (!normalizedTerm) return true;
  if (node.topic.name.toLowerCase().includes(normalizedTerm)) return true;
  return node.children.some((c) => matchesSearch(c, normalizedTerm));
}

export function TopicParentModalPicker({
  isOpen,
  onClose,
  onSelect,
  topics,
  selectedParentId,
  currentTopicId,
  title = 'Chọn Chủ đề (Topic)',
  subtitle = 'Chọn trực tiếp chủ đề cha hoặc chủ đề con trong cây phân loại kiến thức lịch sử',
  allowRootSelect = true,
  rootLabel = 'Không gắn Chủ đề',
  rootDescription = 'Để trống chủ đề (nội dung không gắn vào chủ đề cụ thể)',
  maxDepth = null,
}: TopicParentModalPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(selectedParentId);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen) {
        setTempSelectedId(selectedParentId);
        const exp: Record<string, boolean> = {};
        for (const t of topics) exp[t.id] = true;
        setExpandedMap(exp);
        setSearchTerm('');
      }
    });
  }, [isOpen, selectedParentId, topics]);

  const descendantIds = useMemo(() => collectDescendantTopicIds(topics, currentTopicId), [topics, currentTopicId]);
  const treeNodes = useMemo(() => buildTopicTreeNodes(topics, descendantIds, maxDepth), [topics, descendantIds, maxDepth]);

  const selectedSummary = useMemo(() => {
    if (!tempSelectedId) {
      return { name: rootLabel, hasSelection: false, pathText: rootDescription, levelLabel: 'Không gắn chủ đề' };
    }
    const byId = new Map(topics.map((t) => [t.id, t]));
    const picked = byId.get(tempSelectedId);
    if (!picked) {
      return { name: 'Chủ đề đã chọn', hasSelection: true, pathText: 'Chủ đề đã chọn', levelLabel: 'Chủ đề' };
    }
    const path: string[] = [];
    let curr: TopicItem | undefined = picked;
    const seen = new Set<string>();
    while (curr && !seen.has(curr.id)) {
      seen.add(curr.id);
      path.unshift(curr.name);
      curr = curr.parentId ? byId.get(curr.parentId) : undefined;
    }
    return {
      name: picked.name,
      hasSelection: true,
      pathText: path.join(' › '),
      levelLabel: picked.parentId ? 'Chủ đề con' : 'Chủ đề gốc',
    };
  }, [tempSelectedId, topics, rootLabel, rootDescription]);

  if (!isOpen) return null;

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const visibleRoots = treeNodes.filter((n) => matchesSearch(n, normalizedTerm));
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [id]: prev[id] === false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150" data-testid="chapter-picker-modal">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Icon name={IconName.FOLDER} size={18} className="text-blue-600" />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer" title="Đóng hộp thoại">✕</button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh theo tên chủ đề (hiển thị kèm đường dẫn phân cấp)..."
              className="w-full text-xs py-2 pl-8 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition"
              autoFocus
            />
            <div className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none">
              <Icon name={IconName.SEARCH} size={14} />
            </div>
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {allowRootSelect && !normalizedTerm && (
            <div
              onClick={() => setTempSelectedId(null)}
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition select-none ${
                tempSelectedId === null ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${tempSelectedId === null ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {tempSelectedId === null && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5"><span>{rootLabel}</span></div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{rootDescription}</div>
                </div>
              </div>
              {tempSelectedId === null && <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Đang chọn</span>}
            </div>
          )}

          <div>
            {allowRootSelect && !normalizedTerm && (
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Cây chủ đề kiến thức (bấm vào bất kỳ cấp cha hoặc con để gắn trực tiếp):
              </span>
            )}
            <div className="space-y-1">
              {visibleRoots.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Không tìm thấy chủ đề nào phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                visibleRoots.map((rootNode) => (
                  <TreeNodeItem
                    key={rootNode.topic.id}
                    node={rootNode}
                    tempSelectedId={tempSelectedId}
                    onSelectId={setTempSelectedId}
                    expandedMap={expandedMap}
                    onToggleExpand={toggleExpand}
                    normalizedTerm={normalizedTerm}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chủ đề được gắn</span>
              {selectedSummary.hasSelection && <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">Đã chọn</span>}
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">{selectedSummary.name}</div>
            <div className="text-xs text-slate-600 truncate" title={selectedSummary.pathText}>{selectedSummary.pathText}</div>
            <div className="text-[11px] text-slate-500">Loại vị trí: <strong className="font-semibold text-slate-700">{selectedSummary.levelLabel}</strong></div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button type="button" data-testid="btn-cancel-chapter-picker" onClick={onClose} className="text-xs px-3.5 py-2 font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition cursor-pointer">
              Hủy bỏ
            </button>
            <button
              type="button"
              data-testid="btn-confirm-chapter-picker"
              onClick={() => {
                onSelect(tempSelectedId);
                onClose();
              }}
              disabled={!allowRootSelect && !tempSelectedId}
              className="text-xs px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name={IconName.CHECK} size={14} />
              <span>Xác nhận chọn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreePickerNode;
  tempSelectedId: string | null;
  onSelectId: (id: string) => void;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
  normalizedTerm: string;
}

function resolveNodeStyles(node: TreePickerNode, isSelected: boolean) {
  const rowStyle = !node.isSelectable
    ? 'opacity-60 cursor-not-allowed bg-slate-50/50 text-slate-500'
    : isSelected
      ? 'bg-blue-50/90 border border-blue-300 text-blue-950 font-medium shadow-xs'
      : 'hover:bg-slate-100 text-slate-800 cursor-pointer border border-transparent';
  const radioStyle = !node.isSelectable ? 'border-slate-300 bg-slate-100' : isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300';
  const iconStyle = !node.isSelectable ? 'text-slate-300' : node.depth === 0 ? 'text-amber-500' : 'text-blue-500';
  const levelBadgeStyle = node.depth === 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  return { rowStyle, radioStyle, iconStyle, levelBadgeStyle };
}

function TreeNodeItem({ node, tempSelectedId, onSelectId, expandedMap, onToggleExpand, normalizedTerm }: TreeNodeItemProps) {
  const isSelected = tempSelectedId === node.topic.id;
  const isExpanded = Boolean(normalizedTerm) || expandedMap[node.topic.id] !== false;
  const visibleChildren = node.children.filter((c) => matchesSearch(c, normalizedTerm));
  const hasChildren = node.children.length > 0;
  const showBreadcrumb = Boolean(normalizedTerm) || isSelected;
  const { rowStyle, radioStyle, iconStyle, levelBadgeStyle } = resolveNodeStyles(node, isSelected);

  return (
    <div className="tree-picker-item" data-testid={`chapter-item-${node.topic.id}`}>
      <div
        style={{ paddingLeft: `${node.depth * 22 + 8}px` }}
        data-testid="chapter-item-row"
        onClick={() => { if (node.isSelectable) onSelectId(node.topic.id); }}
        className={`group flex items-start justify-between p-2 rounded-lg text-xs transition select-none ${rowStyle}`}
        title={node.disabledReason || node.breadcrumbPath}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => onToggleExpand(node.topic.id, e)}
              className="mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[9px] hover:bg-slate-200 text-slate-500 font-bold shrink-0"
              title={isExpanded ? 'Thu gọn nhánh con' : 'Mở rộng nhánh con'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-4 inline-block shrink-0" />
          )}

          <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${radioStyle}`}>
            {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
          </div>

          <Icon name={IconName.FOLDER} size={14} className={`mt-0.5 shrink-0 ${iconStyle}`} />

          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold" title={node.topic.name}>{node.topic.name}</div>
            {showBreadcrumb && node.depth > 0 && <div className="mt-0.5 truncate text-[11px] font-normal text-slate-500">{node.breadcrumbPath}</div>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono transition-opacity duration-150 ${isSelected || normalizedTerm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${levelBadgeStyle}`}>
            {node.levelName}
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-0.5">
          {visibleChildren.map((childNode) => (
            <TreeNodeItem
              key={childNode.topic.id}
              node={childNode}
              tempSelectedId={tempSelectedId}
              onSelectId={onSelectId}
              expandedMap={expandedMap}
              onToggleExpand={onToggleExpand}
              normalizedTerm={normalizedTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
