'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, FolderTree, Search, X } from 'lucide-react';
import type { CategoryItem } from '@/services/entities/article.service';
import { renderCategoryIcon } from './CategoryManagerParts';

interface CategoryTreeNode {
  category: CategoryItem;
  depth: number;
  breadcrumbPath: string;
  isSelectable: boolean;
  disabledReason?: string;
  children: CategoryTreeNode[];
}

function collectDescendantCategoryIds(categories: CategoryItem[], rootId?: string): Set<string> {
  if (!rootId) return new Set<string>();
  const descendants = new Set<string>();
  const visit = (id: string) => {
    descendants.add(id);
    for (const item of categories) {
      if (item.parentId === id && !descendants.has(item.id)) visit(item.id);
    }
  };
  visit(rootId);
  return descendants;
}

function buildCategoryTree(categories: CategoryItem[], descendantIds: Set<string>): CategoryTreeNode[] {
  const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'vi'));
  const byId = new Map(sorted.map((c) => [c.id, c]));
  const childrenMap = new Map<string, CategoryItem[]>();
  const roots: CategoryItem[] = [];

  for (const c of sorted) {
    if (c.parentId && byId.has(c.parentId)) {
      const list = childrenMap.get(c.parentId) ?? [];
      list.push(c);
      childrenMap.set(c.parentId, list);
    } else {
      roots.push(c);
    }
  }

  const buildNode = (cat: CategoryItem, depth: number, ancestors: string[]): CategoryTreeNode => {
    const isDescendant = descendantIds.has(cat.id);
    const path = [...ancestors, cat.name];
    const rawChildren = childrenMap.get(cat.id) ?? [];
    return {
      category: cat,
      depth,
      breadcrumbPath: path.join(' › '),
      isSelectable: !isDescendant,
      disabledReason: isDescendant ? 'Không thể chọn chính chuyên mục này hoặc nhánh con của nó' : undefined,
      children: rawChildren.map((child) => buildNode(child, depth + 1, path)),
    };
  };

  return roots.map((r) => buildNode(r, 0, []));
}

function matchesCategorySearch(node: CategoryTreeNode, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  if (node.category.name.toLowerCase().includes(normalizedQuery) || node.category.slug.toLowerCase().includes(normalizedQuery)) return true;
  return node.children.some((c) => matchesCategorySearch(c, normalizedQuery));
}

export function buildCategoryBreadcrumb(categories: CategoryItem[], categoryId: string | null | undefined): string | null {
  if (!categoryId) return null;
  const byId = new Map(categories.map((c) => [c.id, c]));
  const target = byId.get(categoryId);
  if (!target) return null;
  const parts: string[] = [];
  let curr: CategoryItem | undefined = target;
  const seen = new Set<string>();
  while (curr && !seen.has(curr.id)) {
    seen.add(curr.id);
    parts.unshift(curr.name);
    curr = curr.parentId ? byId.get(curr.parentId) : undefined;
  }
  return parts.join(' › ');
}

export interface CategoryPickerProps {
  categories: CategoryItem[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  excludeCategoryId?: string;
  placeholder?: string;
  emptyDescription?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  allowEmpty?: boolean;
  emptyOptionLabel?: string;
  emptyOptionDescription?: string;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  excludeCategoryId,
  placeholder = 'Chưa chọn chuyên mục',
  emptyDescription = 'Chọn chuyên mục phù hợp để phân loại bài viết',
  modalTitle = 'Chọn chuyên mục',
  modalSubtitle = 'Chọn trực tiếp bất kỳ chuyên mục gốc hoặc nhánh con phù hợp',
  allowEmpty = true,
  emptyOptionLabel = 'Chưa chọn chuyên mục',
  emptyOptionDescription = 'Để trống chuyên mục cho bài viết này',
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempId, setTempId] = useState<string | null>(value);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const selectableCategories = useMemo(() => categories.filter((c) => c.isActive !== false || c.id === value), [categories, value]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen) {
        setTempId(value);
        const exp: Record<string, boolean> = {};
        for (const c of selectableCategories) exp[c.id] = true;
        setExpandedMap(exp);
        setSearchTerm('');
      }
    });
  }, [isOpen, value, selectableCategories]);

  const selectedCategory = useMemo(() => categories.find((c) => c.id === value) ?? null, [categories, value]);
  const selectedBreadcrumb = useMemo(() => buildCategoryBreadcrumb(categories, value), [categories, value]);
  const descendantIds = useMemo(() => collectDescendantCategoryIds(selectableCategories, excludeCategoryId), [selectableCategories, excludeCategoryId]);
  const treeNodes = useMemo(() => buildCategoryTree(selectableCategories, descendantIds), [selectableCategories, descendantIds]);
  const tempCategory = useMemo(() => categories.find((c) => c.id === tempId) ?? null, [categories, tempId]);
  const tempBreadcrumb = useMemo(() => buildCategoryBreadcrumb(categories, tempId), [categories, tempId]);

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const visibleRoots = treeNodes.filter((n) => matchesCategorySearch(n, normalizedQuery));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [id]: prev[id] === false }));
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedCategory && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
              {renderCategoryIcon(selectedCategory.icon)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{selectedCategory ? selectedCategory.name : placeholder}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{selectedBreadcrumb ?? emptyDescription}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {selectedCategory && allowEmpty && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              title="Bỏ chọn chuyên mục"
              aria-label="Bỏ chọn chuyên mục"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs transition hover:border-blue-300 hover:text-blue-800 cursor-pointer"
          >
            <FolderTree size={13} />
            <span>{selectedCategory ? 'Đổi chuyên mục' : 'Chọn chuyên mục'}</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150" data-testid="category-picker-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[86vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">{modalTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{modalSubtitle}</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer" title="Đóng">✕</button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm chuyên mục..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  autoFocus
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {allowEmpty && !normalizedQuery && (
                <div
                  onClick={() => setTempId(null)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs transition cursor-pointer select-none ${
                    tempId === null ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{emptyOptionLabel}</div>
                    <div className="mt-0.5 text-[11px] font-normal text-slate-500">{emptyOptionDescription}</div>
                  </div>
                  {tempId === null && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Đang chọn</span>}
                </div>
              )}

              <div className="space-y-1">
                {visibleRoots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-400">
                    Không tìm thấy chuyên mục phù hợp với &ldquo;{searchTerm}&rdquo;
                  </div>
                ) : (
                  visibleRoots.map((node) => (
                    <CategoryTreeNodeRow
                      key={node.category.id}
                      node={node}
                      tempId={tempId}
                      onSelectId={setTempId}
                      expandedMap={expandedMap}
                      onToggleExpand={toggleExpand}
                      normalizedQuery={normalizedQuery}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Chuyên mục đang chọn</span>
                <div className="truncate text-xs font-bold text-slate-900">{tempCategory ? tempCategory.name : emptyOptionLabel}</div>
                {tempBreadcrumb && <div className="truncate text-[11px] text-slate-500" title={tempBreadcrumb}>{tempBreadcrumb}</div>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer">
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(tempId);
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryTreeNodeRow({
  node,
  tempId,
  onSelectId,
  expandedMap,
  onToggleExpand,
  normalizedQuery,
}: {
  node: CategoryTreeNode;
  tempId: string | null;
  onSelectId: (id: string) => void;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
  normalizedQuery: string;
}) {
  const isSelected = tempId === node.category.id;
  const isExpanded = Boolean(normalizedQuery) || expandedMap[node.category.id] !== false;
  const visibleChildren = node.children.filter((c) => matchesCategorySearch(c, normalizedQuery));
  const hasChildren = node.children.length > 0;
  const showPath = (Boolean(normalizedQuery) || isSelected) && node.depth > 0;

  const rowCls = !node.isSelectable
    ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-transparent'
    : isSelected
      ? 'border-blue-300 bg-blue-50/90 text-blue-950 font-semibold shadow-2xs'
      : 'border-transparent hover:bg-slate-100 text-slate-800 cursor-pointer';

  return (
    <div>
      <div
        style={{ paddingLeft: `${node.depth * 22 + 8}px` }}
        onClick={() => { if (node.isSelectable) onSelectId(node.category.id); }}
        className={`flex items-start justify-between rounded-lg border p-2 text-xs transition select-none ${rowCls}`}
        title={node.disabledReason || node.breadcrumbPath}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
          {hasChildren ? (
            <button type="button" onClick={(e) => onToggleExpand(node.category.id, e)} className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-slate-500 hover:bg-slate-200">
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="inline-block w-4 shrink-0" />
          )}
          <span className="mt-0.5 shrink-0">{renderCategoryIcon(node.category.icon)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{node.category.name}</div>
            {showPath && <div className="mt-0.5 truncate text-[11px] font-normal text-slate-500">{node.breadcrumbPath}</div>}
          </div>
        </div>
        {isSelected && <span className="ml-2 shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Đang chọn</span>}
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-0.5">
          {visibleChildren.map((child) => (
            <CategoryTreeNodeRow
              key={child.category.id}
              node={child}
              tempId={tempId}
              onSelectId={onSelectId}
              expandedMap={expandedMap}
              onToggleExpand={onToggleExpand}
              normalizedQuery={normalizedQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
