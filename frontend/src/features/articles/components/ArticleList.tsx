'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderTree, Star, Tag, X } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { ActionMenu, ConfirmDeleteModal } from '@/components/common/CommonUi';
import { TreeSelectModal, type TreeSelectNode } from '@/components/common/TreeSelectModal';
import { TagFilterModal } from '@/components/common/TagFilterModal';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isSuperadminRole } from '@/services/auth/public-auth.service';
import type { TagItem } from '@/types/models';
import {
  ArticleApiService,
  CategoryApiService,
  CONTENT_STATUS_LABELS,
  type ArticleItem,
  type CategoryItem,
  type ContentStatusValue,
} from '@/services/entities/article.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

const TONES: Record<ContentStatusValue, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-stone-200 text-stone-600',
};

export function StatusPill({ status }: { status: ContentStatusValue }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[status] ?? TONES.DRAFT}`}>
      {CONTENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function YearInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const isBce = value !== null && value < 0;
  const display = value === null ? '' : String(Math.abs(value));

  const emit = (raw: string, bce: boolean) => {
    const n = Number.parseInt(raw, 10);
    if (!raw.trim() || Number.isNaN(n) || n === 0) return onChange(null);
    onChange(bce ? -Math.abs(n) : Math.abs(n));
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={display}
          onChange={(e) => emit(e.target.value, isBce)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
        <label className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600">
          <input type="checkbox" checked={isBce} disabled={value === null} onChange={(e) => emit(display, e.target.checked)} />
          TCN
        </label>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

function buildCategoryTreeNodes(categories: CategoryItem[]): TreeSelectNode[] {
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

  const toNode = (c: CategoryItem): TreeSelectNode => {
    const kids = childrenMap.get(c.id) ?? [];
    return {
      id: c.id,
      label: c.name,
      selectable: true,
      children: kids.length > 0 ? kids.map(toNode) : undefined,
    };
  };

  return roots.map(toNode);
}

/** Danh sách bài viết trong CMS: lọc chuyên mục / tag / trạng thái, tìm theo tiêu đề, phân trang server. */
export function ArticleList() {
  const router = useRouter();
  const user = useAuthSession();
  const isSuperadmin = Boolean(user && isSuperadminRole(user.role));
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [status, setStatus] = useState<ContentStatusValue | ''>('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<ArticleItem | null>(null);

  useEffect(() => {
    CategoryApiService.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  const categoryTreeNodes = useMemo(() => buildCategoryTreeNodes(categories), [categories]);
  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === categoryId)?.name ?? null,
    [categories, categoryId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ArticleApiService.list({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        tagId: selectedTag?.id || undefined,
        status: status || undefined,
        featured: featuredOnly || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được danh sách bài viết.'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, selectedTag, status, featuredOnly]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  // Đổi bộ lọc → quay về trang 1.
  useEffect(() => {
    void Promise.resolve().then(() => setPage(1));
  }, [search, categoryId, selectedTag, status, featuredOnly]);

  const handleToggleFeatured = async (article: ArticleItem) => {
    if (!isSuperadmin || togglingFeaturedId) return;
    const nextValue = !article.isFeatured;
    setTogglingFeaturedId(article.id);
    setError(null);
    setItems((prev) => prev.map((item) => (item.id === article.id ? { ...item, isFeatured: nextValue } : item)));
    try {
      await ArticleApiService.setFeatured(article.id, nextValue);
      if (featuredOnly && !nextValue) {
        void load();
      }
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === article.id ? { ...item, isFeatured: article.isFeatured } : item)));
      setError(extractErrorMessage(err, 'Không cập nhật được trạng thái nổi bật.'));
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await ArticleApiService.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleting(null);
      setError(extractErrorMessage(err, 'Xoá bài viết thất bại.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectClass = 'h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs sm:text-sm text-slate-700';

  return (
    <div className="panel management-panel">
      <div className="toolbar flex-wrap gap-2">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={15} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, tóm tắt…"
            className="text-slate-800 placeholder:text-slate-500 font-medium text-xs sm:text-sm"
          />
        </label>
        <div className="inline-flex items-center">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className={`inline-flex h-9 max-w-[190px] items-center gap-1.5 rounded-lg border px-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              selectedCategoryName
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={selectedCategoryName ? `Chuyên mục: ${selectedCategoryName}` : 'Chọn chuyên mục để lọc'}
          >
            <FolderTree size={14} className="shrink-0 opacity-80" />
            <span className="truncate">{selectedCategoryName ?? 'Chuyên mục'}</span>
          </button>
          {categoryId && (
            <button
              type="button"
              onClick={() => setCategoryId('')}
              aria-label="Bỏ lọc chuyên mục"
              title="Bỏ lọc chuyên mục"
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="inline-flex items-center">
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className={`inline-flex h-9 max-w-[175px] items-center gap-1.5 rounded-lg border px-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              selectedTag
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={selectedTag ? `Thẻ: #${selectedTag.name}` : 'Tìm & chọn thẻ để lọc'}
          >
            <Tag size={14} className="shrink-0 opacity-80" />
            <span className="truncate">{selectedTag ? `#${selectedTag.name}` : 'Thẻ (Tag)'}</span>
          </button>
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              aria-label="Bỏ lọc thẻ"
              title="Bỏ lọc thẻ"
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatusValue | '')} className={selectClass}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFeaturedOnly((v) => !v)}
          aria-pressed={featuredOnly}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs sm:text-sm font-semibold transition-colors ${
            featuredOnly
              ? 'border-amber-500 bg-amber-100 text-amber-900 shadow-2xs ring-1 ring-amber-400/50'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Lọc bài viết đang hiển thị nổi bật trên Trang chủ"
        >
          <Star size={14} className={featuredOnly ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
          Nổi bật
        </button>
        <button
          type="button"
          className="primary-button !h-9 !px-3.5 !text-xs sm:!text-sm font-bold ml-auto"
          onClick={() => router.push(APP_ROUTES.ARTICLES.CREATE)}
        >
          <Icon name={IconName.PLUS} size={15} />
          Viết bài mới
        </button>
      </div>

      {error && <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th>TIÊU ĐỀ</th>
              <th>CHUYÊN MỤC</th>
              <th>NIÊN ĐẠI</th>
              <th>TAG</th>
              <th>TRẠNG THÁI</th>
              <th>CẬP NHẬT</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Không có bài viết phù hợp.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="cursor-pointer" onClick={() => router.push(APP_ROUTES.ARTICLES.DETAIL(a.id))}>
                  <td>
                    <div className="flex items-start gap-2">
                      {isSuperadmin && (
                        <button
                          type="button"
                          disabled={togglingFeaturedId === a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleFeatured(a);
                          }}
                          title={a.isFeatured ? 'Bỏ ghim nổi bật khỏi Trang chủ' : 'Ghim nổi bật lên Trang chủ'}
                          aria-label={a.isFeatured ? 'Bỏ ghim nổi bật' : 'Ghim nổi bật'}
                          className={`mt-0.5 shrink-0 rounded p-0.5 transition-colors disabled:opacity-40 ${
                            a.isFeatured
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-slate-300 hover:bg-slate-100 hover:text-amber-500'
                          }`}
                        >
                          <Star size={15} className={a.isFeatured ? 'fill-amber-500' : ''} />
                        </button>
                      )}
                      <div className="min-w-0">
                        <strong className="text-sm font-semibold text-slate-900">{a.title}</strong>
                        {!isSuperadmin && a.isFeatured && (
                          <span className="ml-2 text-xs font-bold text-amber-600">★ Nổi bật</span>
                        )}
                        <div className="text-xs text-slate-500">/{a.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs sm:text-sm text-slate-700">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {a.category?.name || 'Chưa phân loại'}
                    </span>
                  </td>
                  <td className="text-xs sm:text-sm text-slate-700 whitespace-nowrap">{a.dateText || a.startYear || '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {a.tags.map((t) => (
                        <span key={t.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusPill status={a.status} />
                  </td>
                  <td className="text-xs text-slate-500">{new Date(a.updatedAt).toLocaleDateString('vi-VN')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      onEdit={() => router.push(APP_ROUTES.ARTICLES.DETAIL(a.id))}
                      onView={() => window.open(PUBLIC_ROUTES.ARTICLE(a.slug), '_blank')}
                      onDelete={() => setDeleting(a)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="text-xs sm:text-sm text-slate-700 font-medium">
          {total} bài viết · trang {page}/{totalPages}
        </span>
        <div>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ‹
          </button>
          <button type="button" className="selected">
            {page}
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            ›
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={deleting?.title || ''}
        itemTypeLabel="bài viết"
      />

      <TreeSelectModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Lọc theo Chuyên mục"
        subtitle="Chọn một chuyên mục gốc hoặc nhánh con để lọc danh sách bài viết"
        nodes={categoryTreeNodes}
        selectedIds={categoryId ? [categoryId] : []}
        onChangeSelected={(ids) => setCategoryId(ids[0] ?? '')}
        multiple={false}
        emptyText="Chưa có chuyên mục nào."
        unitLabel="chuyên mục"
        searchPlaceholder="Tìm nhanh chuyên mục..."
      />

      <TagFilterModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        selectedTag={selectedTag}
        onSelect={setSelectedTag}
      />
    </div>
  );
}
