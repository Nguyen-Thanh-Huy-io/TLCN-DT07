'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, Search, X } from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import type { PublicTopicRef } from '@/services/public/public-content.service';

/** Đệ quy vì cây Topic có thể sâu nhiều cấp. */
export interface TocNode {
  id: string;
  title: string;
  subtitle?: string;
  count: number;
  children?: TocNode[];
}

function buildTopicChildNodes(
  parentId: string,
  childrenByParent: Map<string, PublicTopicRef[]>,
  leafCountById: Map<string, number>,
  seen: Set<string>,
): TocNode[] {
  const result: TocNode[] = [];
  for (const t of childrenByParent.get(parentId) ?? []) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    const children = buildTopicChildNodes(t.id, childrenByParent, leafCountById, seen);
    const ownCount = leafCountById.get(t.id) ?? 0;
    const childSum = children.reduce((s, c) => s + c.count, 0);
    const total = ownCount + childSum;
    if (total === 0) continue;
    result.push({
      id: `topic-leaf-${t.id}`,
      title: t.name,
      count: total,
      ...(children.length > 0 ? { children } : {}),
    });
  }
  return result;
}

/** Dựng cây Mục lục Chủ đề trực tiếp từ bảng `topicCounts` do Server trả về trên toàn kho bài viết. */
export function buildServerTopicTocNodes(
  topics: PublicTopicRef[],
  topicCounts: Record<string, number>,
): TocNode[] {
  if (topics.length === 0) return [];
  const childrenByParent = new Map<string, PublicTopicRef[]>();
  const roots: PublicTopicRef[] = [];
  for (const t of topics) {
    if (!t.parentId) {
      roots.push(t);
      continue;
    }
    const list = childrenByParent.get(t.parentId) ?? [];
    list.push(t);
    childrenByParent.set(t.parentId, list);
  }
  const leafCountById = new Map<string, number>(
    Object.entries(topicCounts).map(([id, cnt]) => [id, cnt]),
  );
  const result: TocNode[] = [];
  for (const root of roots) {
    const children = buildTopicChildNodes(
      root.id,
      childrenByParent,
      leafCountById,
      new Set([root.id]),
    );
    const ownCount = leafCountById.get(root.id) ?? 0;
    const total = ownCount + children.reduce((sum, c) => sum + c.count, 0);
    if (total === 0) continue;
    result.push({
      id: `topic-leaf-${root.id}`,
      title: root.name,
      count: total,
      ...(children.length > 0 ? { children } : {}),
    });
  }
  return result;
}

export interface TocDrawerProps {
  open: boolean;
  onClose: () => void;
  heading: string;
  itemLabel: string;
  nodes: TocNode[];
  activeId?: string;
  totalCount: number;
  onJump: (id: string) => void;
  onClearActive?: () => void;
  allLabel?: string;
}

function matchesQuery(node: TocNode, q: string): TocNode | null {
  const selfMatch = node.title.toLowerCase().includes(q) || (node.subtitle ?? '').toLowerCase().includes(q);
  const matchedChildren = (node.children ?? [])
    .map((c) => matchesQuery(c, q))
    .filter((c): c is TocNode => c !== null);
  if (selfMatch) return node;
  if (matchedChildren.length > 0) return { ...node, children: matchedChildren };
  return null;
}

function filterNodes(nodes: TocNode[], query: string): TocNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.map((n) => matchesQuery(n, q)).filter((n): n is TocNode => n !== null);
}

function countDescendants(node: TocNode): number {
  return (node.children ?? []).length;
}

function TocNodeRow({
  node,
  depth,
  activeId,
  forceOpen,
  toggled,
  onToggle,
  onJump,
  onClose,
}: {
  node: TocNode;
  depth: number;
  activeId?: string;
  forceOpen: boolean;
  toggled: Record<string, boolean>;
  onToggle: (id: string, currentOpen: boolean) => void;
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = forceOpen || (toggled[node.id] ?? depth === 0);
  const isActive = node.id === activeId;
  const containsActive = Boolean(activeId && hasActiveDescendant(node, activeId));

  return (
    <div
      className={`sk-tree-era ${isOpen ? 'sk-open' : ''} ${isActive || containsActive ? 'sk-current-era-active' : ''}`}
    >
      <div className="sk-tree-parent-row">
        <button
          type="button"
          className="sk-tree-parent sk-button"
          onClick={() => {
            onJump(node.id);
            onClose();
          }}
          title={`Xem: ${node.title}`}
        >
          <span className="sk-tree-text">
            <strong>{node.title}</strong>
            <small>
              {node.subtitle ? `${node.subtitle} · ` : ''}
              {node.count} mục
              {hasChildren ? ` · ${countDescendants(node)} chủ đề con` : ''}
            </small>
          </span>
        </button>
        {hasChildren && (
          <button
            type="button"
            className="sk-tree-toggle sk-button"
            aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
            onClick={() => onToggle(node.id, isOpen)}
          >
            <ChevronDown size={14} className={isOpen ? '' : 'sk-rotate'} />
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="sk-tree-children">
          {node.children!.map((child) => (
            <TocNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              forceOpen={forceOpen}
              toggled={toggled}
              onToggle={onToggle}
              onJump={onJump}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasActiveDescendant(node: TocNode, activeId: string): boolean {
  return (node.children ?? []).some((c) => c.id === activeId || hasActiveDescendant(c, activeId));
}

/** Dùng chung cho mọi trang có cây phân cấp (Thời kỳ, Chủ đề...). */
export function TocDrawer({
  open,
  onClose,
  heading,
  itemLabel,
  nodes,
  activeId,
  totalCount,
  onJump,
  onClearActive,
  allLabel = 'Xem tất cả',
}: TocDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => filterNodes(nodes, searchQuery), [nodes, searchQuery]);
  const searching = searchQuery.trim().length > 0;
  const toggle = (id: string, currentOpen: boolean) =>
    setToggled((prev) => ({ ...prev, [id]: !currentOpen }));

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sk-toc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="sk-toc-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            aria-label={heading}
          >
            <div className="sk-toc-header">
              <div className="sk-toc-title">
                <BookOpen size={18} className="text-emerald-700" />
                <div>
                  <h3>{heading}</h3>
                  <small>
                    {filtered.length}/{nodes.length} mục · {totalCount} {itemLabel}
                  </small>
                </div>
              </div>
              <button type="button" className="sk-toc-close-btn" onClick={onClose} aria-label="Đóng mục lục">
                <X size={18} />
              </button>
            </div>

            <div className="sk-toc-search-wrap">
              <div className="sk-toc-search-input">
                <Search size={15} className="sk-toc-search-icon" />
                <input
                  type="text"
                  placeholder={`Tìm ${itemLabel}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="sk-toc-clear-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="sk-toc-body">
              {onClearActive && !searching && nodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearActive();
                    onClose();
                  }}
                  className={`mb-2.5 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
                    !activeId
                      ? 'border-[#7A1F24] bg-[#7A1F24]/10 text-[#7A1F24]'
                      : 'border-[#E2D5B8] bg-[#FAF6EA] text-[#4A3A28] hover:border-[#B8893F]'
                  }`}
                >
                  <span>{allLabel}</span>
                  <span className="font-semibold opacity-75">
                    {totalCount} {itemLabel}
                  </span>
                </button>
              )}
              {filtered.length === 0 ? (
                <div className="sk-toc-empty">
                  <p>
                    {nodes.length === 0 && !searching
                      ? `Chưa có ${itemLabel} nào được xuất bản trong mục lục này.`
                      : `Không tìm thấy mục nào phù hợp với “${searchQuery}”`}
                  </p>
                </div>
              ) : (
                filtered.map((node) => (
                  <TocNodeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    activeId={activeId}
                    forceOpen={searching}
                    toggled={toggled}
                    onToggle={toggle}
                    onJump={onJump}
                    onClose={onClose}
                  />
                ))
              )}
            </div>

            <div className="sk-toc-footer">
              <span className="sk-status-dot" />
              <span>Hệ thống dữ liệu lịch sử HISGO</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
