'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, Search, X } from 'lucide-react';
import type { TopicBlock, TopicLeafGroup } from '@/services/entities/landing-graph';

/** Đệ quy vì cây Topic có thể sâu nhiều cấp. */
export interface TocNode {
  id: string;
  title: string;
  subtitle?: string;
  count: number;
  children?: TocNode[];
}

export function jumpToTopicElement(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function buildTopicTocNodes<T>(topicBlocks: TopicBlock<T>[]): TocNode[] {
  return topicBlocks.map((block) => {
    const total = block.leaves.reduce((n, l) => n + l.items.length, 0);
    const singleLeaf = block.leaves.length === 1 && block.leaves[0].id === block.id;
    return {
      id: `topic-${block.id}`,
      title: block.name,
      count: total,
      children: singleLeaf
        ? undefined
        : block.leaves.map((leaf) => ({
            id: `topic-leaf-${leaf.id}`,
            title: leaf.name,
            count: leaf.items.length,
          })),
    };
  });
}

export function TopicBlockSection<T>({
  block,
  itemLabel,
  children,
}: {
  block: TopicBlock<T>;
  itemLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const total = block.leaves.reduce((n, l) => n + l.items.length, 0);
  return (
    <section className="sk-era-section" id={`topic-${block.id}`}>
      <button type="button" className="sk-era-banner sk-button" onClick={() => setOpen((v) => !v)}>
        <span>
          <strong>{block.name}</strong>
          <small>
            {total} {itemLabel} · {block.leaves.length} chủ đề con
          </small>
        </span>
        <ChevronDown size={16} className={open ? '' : 'sk-rotate'} />
      </button>
      {open && children}
    </section>
  );
}

export function TopicLeafHeading<T>({ leaf, itemLabel }: { leaf: TopicLeafGroup<T>; itemLabel: string }) {
  return (
    <div className="sk-sub-heading">
      <div>
        <h3>{leaf.name}</h3>
        <span className="sk-sub-count">
          {leaf.items.length} {itemLabel}
        </span>
      </div>
    </div>
  );
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
  onToggle: (id: string) => void;
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
            onClick={() => onToggle(node.id)}
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
export function TocDrawer({ open, onClose, heading, itemLabel, nodes, activeId, totalCount, onJump }: TocDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => filterNodes(nodes, searchQuery), [nodes, searchQuery]);
  const searching = searchQuery.trim().length > 0;
  const toggle = (id: string) => setToggled((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));

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
              {filtered.length === 0 ? (
                <div className="sk-toc-empty">
                  <p>Không tìm thấy mục nào phù hợp với &ldquo;{searchQuery}&rdquo;</p>
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
