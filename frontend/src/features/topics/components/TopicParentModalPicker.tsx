'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { TopicItem } from '@/types/models/topic.type';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

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
  isSelectable: boolean;
  disabledReason?: string;
  children: TreePickerNode[];
}

export function TopicParentModalPicker({
  isOpen,
  onClose,
  onSelect,
  topics,
  selectedParentId,
  currentTopicId,
  title = 'Chọn vị trí phân cấp cho Chủ đề',
  subtitle = 'Chọn chủ đề cha trực thuộc để định vị chính xác vị trí trong cây tri thức',
  allowRootSelect = true,
  rootLabel = '⭐ Đặt làm Chủ đề gốc (Cấp 1)',
  rootDescription = 'Chủ đề độc lập ở cấp cao nhất, không trực thuộc bất kỳ chủ đề nào khác',
  maxDepth = 2,
}: TopicParentModalPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(selectedParentId);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Đồng bộ lựa chọn tạm thời khi mở modal
  useEffect(() => {
    if (isOpen) {
      setTempSelectedId(selectedParentId);
      // Mở rộng tất cả các node mặc định
      const exp: Record<string, boolean> = {};
      topics.forEach((t) => {
        exp[t.id] = true;
      });
      setExpandedMap(exp);
      setSearchTerm('');
    }
  }, [isOpen, selectedParentId, topics]);

  // Tìm tất cả ID con/cháu của currentTopicId để ngăn ngừa chu trình lặp (Anti-Cycle Guard)
  const descendantIds = useMemo(() => {
    if (!currentTopicId) return new Set<string>();
    const descendants = new Set<string>();

    const collectDescendants = (id: string) => {
      descendants.add(id);
      topics
        .filter((t) => t.parentId === id)
        .forEach((child) => collectDescendants(child.id));
    };

    collectDescendants(currentTopicId);
    return descendants;
  }, [currentTopicId, topics]);

  // Xây dựng cây Composite Tree từ danh sách phẳng
  const treeNodes = useMemo(() => {
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

    const buildNode = (topic: TopicItem, depth: number): TreePickerNode => {
      const isDescendant = descendantIds.has(topic.id);
      // Kiểm tra trần cấp độ nếu có thiết lập maxDepth (nếu maxDepth là null thì không giới hạn)
      const isDepthExceeded =
        maxDepth !== null && maxDepth !== undefined && maxDepth > 0 && depth >= maxDepth;

      let isSelectable = true;
      let disabledReason: string | undefined;

      if (isDescendant) {
        isSelectable = false;
        disabledReason = 'Không thể chọn chính nó hoặc chủ đề con của nó';
      } else if (isDepthExceeded) {
        isSelectable = false;
        disabledReason = `Đã đạt trần tối đa (Cấp ${(maxDepth ?? 0) + 1}) - Không thể chứa thêm cấp con`;
      }

      const rawChildren = childrenMap.get(topic.id) || [];
      const childrenNodes = rawChildren.map((c) => buildNode(c, depth + 1));

      return {
        topic,
        depth,
        levelName: depth === 0 ? 'Cấp 1 (Gốc)' : depth === 1 ? 'Cấp 2 (Giai đoạn)' : 'Cấp 3 (Chuyên đề)',
        isSelectable,
        disabledReason,
        children: childrenNodes,
      };
    };

    return rootTopics.map((r) => buildNode(r, 0));
  }, [topics, descendantIds]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Tính toán chuỗi Breadcrumb của cha đang được chọn
  const selectedBreadcrumb = useMemo(() => {
    if (!tempSelectedId) {
      return {
        pathText: 'Chủ đề gốc (Cấp 1) - Không có chủ đề cha',
        targetLevel: 'Cấp 1 (Chủ đề gốc cao nhất)',
      };
    }

    const path: string[] = [];
    let curr: TopicItem | undefined = topics.find((t) => t.id === tempSelectedId);
    let depthCount = 1;

    while (curr) {
      path.unshift(curr.name);
      if (curr.parentId) {
        curr = topics.find((t) => t.id === curr?.parentId);
        depthCount++;
      } else {
        break;
      }
    }

    const targetTierName =
      depthCount === 1 ? 'Cấp 2 (Giai đoạn)' : depthCount === 2 ? 'Cấp 3 (Chuyên đề)' : 'Cấp vượt quá';

    return {
      pathText: path.join(' > '),
      targetLevel: `${targetTierName} trực thuộc`,
    };
  }, [tempSelectedId, topics]);

  if (!isOpen) return null;

  // Lọc cây theo từ khóa tìm kiếm
  const filterNode = (node: TreePickerNode, term: string): boolean => {
    if (!term.trim()) return true;
    const matchesSelf = node.topic.name.toLowerCase().includes(term.toLowerCase());
    const matchesChild = node.children.some((c) => filterNode(c, term));
    return matchesSelf || matchesChild;
  };

  const handleConfirm = () => {
    onSelect(tempSelectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Icon name={IconName.FOLDER} size={18} className="text-blue-600" />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            title="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh theo tên chủ đề..."
              className="w-full text-xs py-2 pl-8 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition"
              autoFocus
            />
            <div className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none">
              <Icon name={IconName.SEARCH} size={14} />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Interactive Tree */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {/* Tùy chọn 1: Chủ đề gốc (Không có cha) - Chỉ hiển thị khi allowRootSelect = true */}
          {allowRootSelect && (
            <div
              onClick={() => setTempSelectedId(null)}
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition select-none ${
                tempSelectedId === null
                  ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    tempSelectedId === null ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}
                >
                  {tempSelectedId === null && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>{rootLabel}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                      Độc lập
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {rootDescription}
                  </div>
                </div>
              </div>
              {tempSelectedId === null && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Đang chọn
                </span>
              )}
            </div>
          )}

          <div className={allowRootSelect ? 'pt-2' : ''}>
            {allowRootSelect && (
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Hoặc chọn trực thuộc một chủ đề hiện có:
              </span>
            )}

            {/* Tree Nodes List */}
            <div className="space-y-1">
              {treeNodes.filter((n) => filterNode(n, searchTerm)).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Không tìm thấy chủ đề nào phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                treeNodes
                  .filter((n) => filterNode(n, searchTerm))
                  .map((rootNode) => (
                    <TreeNodeItem
                      key={rootNode.topic.id}
                      node={rootNode}
                      tempSelectedId={tempSelectedId}
                      onSelectId={(id) => setTempSelectedId(id)}
                      expandedMap={expandedMap}
                      onToggleExpand={toggleExpand}
                      searchTerm={searchTerm}
                      filterNode={filterNode}
                    />
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: Live Placement Breadcrumb & Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Vị trí sau khi áp dụng:
            </span>
            <div className="text-xs text-slate-800 font-medium truncate" title={selectedBreadcrumb.pathText}>
              <span className="text-blue-700 font-semibold">{selectedBreadcrumb.targetLevel}:</span>{' '}
              {selectedBreadcrumb.pathText}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3.5 py-2 font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!allowRootSelect && !tempSelectedId}
              className="text-xs px-4 py-2 font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name={IconName.CHECK} size={14} />
              <span>Xác nhận vị trí</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component phụ hiển thị đệ quy từng node trong cây
interface TreeNodeItemProps {
  node: TreePickerNode;
  tempSelectedId: string | null;
  onSelectId: (id: string) => void;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
  searchTerm: string;
  filterNode: (node: TreePickerNode, term: string) => boolean;
}

function TreeNodeItem({
  node,
  tempSelectedId,
  onSelectId,
  expandedMap,
  onToggleExpand,
  searchTerm,
  filterNode,
}: TreeNodeItemProps) {
  const isSelected = tempSelectedId === node.topic.id;
  const isExpanded = expandedMap[node.topic.id] !== false;
  const hasChildren = node.children.length > 0;

  const indentStyle = {
    paddingLeft: `${node.depth * 22 + 8}px`,
  };

  const rowTooltip = !node.isSelectable
    ? `${node.topic.name}\n[${node.levelName}] - ${node.disabledReason}`
    : `${node.topic.name}\n[${node.levelName}]`;

  return (
    <div className="tree-picker-item">
      <div
        style={indentStyle}
        onClick={() => {
          if (node.isSelectable) {
            onSelectId(node.topic.id);
          }
        }}
        className={`group flex items-center justify-between p-2 rounded-lg text-xs transition select-none ${
          !node.isSelectable
            ? 'opacity-60 cursor-not-allowed bg-slate-50/50 text-slate-500'
            : isSelected
            ? 'bg-blue-50/90 border border-blue-300 text-blue-950 font-medium shadow-xs'
            : 'hover:bg-slate-100 text-slate-800 cursor-pointer'
        }`}
        title={rowTooltip}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          {/* Nút Đóng / Mở nhánh */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => onToggleExpand(node.topic.id, e)}
              className="w-4 h-4 rounded flex items-center justify-center text-[9px] hover:bg-slate-200 text-slate-500 font-bold shrink-0"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-4 inline-block shrink-0" />
          )}

          {/* Radio indicator */}
          <div
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
              !node.isSelectable
                ? 'border-slate-300 bg-slate-100'
                : isSelected
                ? 'border-blue-600 bg-blue-600'
                : 'border-slate-300'
            }`}
          >
            {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
          </div>

          <Icon
            name={IconName.FOLDER}
            size={14}
            className={`shrink-0 ${
              !node.isSelectable
                ? 'text-slate-300'
                : node.depth === 0
                ? 'text-amber-500'
                : node.depth === 1
                ? 'text-blue-500'
                : 'text-slate-400'
            }`}
          />

          {/* Tiêu đề chủ đề với tooltip đầy đủ */}
          <span className="truncate" title={node.topic.name}>
            {node.topic.name}
          </span>
        </div>

        {/* Level badge (ẩn mặc định, chỉ hiện khi hover hoặc được chọn) & Biểu tượng trần cấp độ */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded border font-mono transition-opacity duration-150 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } ${
              node.depth === 0
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : node.depth === 1
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {node.levelName}
          </span>

          {!node.isSelectable && node.disabledReason && (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100/90 hover:bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-200/80 transition select-none cursor-not-allowed shrink-0"
              title={node.disabledReason}
            >
              <svg
                className="w-2.5 h-2.5 text-slate-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="hidden sm:inline">
                {node.disabledReason.includes('trần tối đa') ? 'Trần Cấp 3' : 'Đã khóa'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Render children recursively if expanded */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5">
          {node.children
            .filter((c) => filterNode(c, searchTerm))
            .map((childNode) => (
              <TreeNodeItem
                key={childNode.topic.id}
                node={childNode}
                tempSelectedId={tempSelectedId}
                onSelectId={onSelectId}
                expandedMap={expandedMap}
                onToggleExpand={onToggleExpand}
                searchTerm={searchTerm}
                filterNode={filterNode}
              />
            ))}
        </div>
      )}
    </div>
  );
}
