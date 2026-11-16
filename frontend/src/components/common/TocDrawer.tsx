'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, Search, X } from 'lucide-react';

/** 1 mục trong Mục lục — đệ quy, không giới hạn số cấp (cây Topic có thể sâu nhiều cấp). */
export interface TocNode {
  id: string;
  title: string;
  /** Phụ đề ngắn cạnh tiêu đề (vd. khoảng năm). */
  subtitle?: string;
  /** Số lượng mục con (bài viết/mốc) — chỉ để hiển thị, không ảnh hưởng cấu trúc. */
  count: number;
  children?: TocNode[];
}

export interface TocDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Tiêu đề drawer, vd. "Mục lục thời kỳ" / "Mục lục chủ đề". */
  heading: string;
  /** Danh từ đếm ở dòng phụ đề + ô tìm kiếm, vd. "mốc sự kiện" / "nhân vật". */
  itemLabel: string;
  nodes: TocNode[];
  /** Id mục đang active (tô sáng), nếu có. */
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

/** Lọc cây theo từ khóa (đệ quy) — giữ nhánh nếu chính nó hoặc hậu duệ khớp. */
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

/** Drawer "Mục lục" trượt từ mép phải — dùng chung cho mọi trang có cây phân cấp (Thời kỳ, Chủ đề...). */
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
