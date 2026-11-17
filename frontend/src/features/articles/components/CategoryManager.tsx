'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import {
  CategoryApiService,
  orderCategoriesByHierarchy,
  type CategoryItem,
} from '@/services/entities/article.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import {
  CategoryFormCard,
  CategoryStatusFilter,
  renderCategoryIcon,
  toCategorySlug,
  type CategoryDraft,
} from './CategoryManagerParts';

export { CategoryStatusFilter, toCategorySlug };

const EMPTY_DRAFT: CategoryDraft = {
  parentId: '',
  name: '',
  slug: '',
  slugTouched: false,
  articleCount: 0,
  description: '',
  icon: 'crown',
  displayOrder: 1,
  isActive: true,
};

const STATUS_FILTER_TABS = [
  [CategoryStatusFilter.ALL, 'Tất cả'],
  [CategoryStatusFilter.ACTIVE, 'Đang hoạt động'],
  [CategoryStatusFilter.HIDDEN, 'Đã ẩn'],
  [CategoryStatusFilter.EMPTY, 'Chưa có bài viết'],
] as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

export function CategoryManager() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>(CategoryStatusFilter.ALL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await CategoryApiService.list());
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được chuyên mục.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  const stats = useMemo(() => {
    const totalCategories = items.length;
    const totalArticles = items.reduce((sum, c) => sum + (c._count?.articles ?? 0), 0);
    const emptyCategories = items.filter((c) => (c._count?.articles ?? 0) === 0).length;
    return { totalCategories, totalArticles, emptyCategories };
  }, [items]);

  const existingSlugs = useMemo(
    () => new Set(items.filter((c) => c.id !== draft?.id).map((c) => c.slug)),
    [items, draft?.id],
  );

  const rootCategories = useMemo(
    () =>
      items
        .filter((c) => !c.parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'vi'))
        .map((c) => ({ id: c.id, name: c.name })),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'vi'));
    const ordered = orderCategoriesByHierarchy(sorted);
    return ordered.filter((c) => {
      const isActive = c.isActive !== false;
      const count = c._count?.articles ?? 0;
      if (statusFilter === CategoryStatusFilter.ACTIVE && !isActive) return false;
      if (statusFilter === CategoryStatusFilter.HIDDEN && isActive) return false;
      if (statusFilter === CategoryStatusFilter.EMPTY && count > 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const handleOpenCreate = (parentId = '') => {
    const siblings = items.filter((c) => (c.parentId ?? '') === parentId);
    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((c) => c.displayOrder)) + 1 : 1;
    setDraft({ ...EMPTY_DRAFT, parentId, displayOrder: nextOrder });
    setError(null);
  };

  const handleOpenEdit = (c: CategoryItem) => {
    setDraft({
      id: c.id,
      parentId: c.parentId ?? '',
      name: c.name,
      slug: c.slug,
      slugTouched: true,
      originalSlug: c.slug,
      articleCount: c._count?.articles ?? 0,
      description: c.description ?? '',
      icon: c.icon ?? 'crown',
      displayOrder: c.displayOrder,
      isActive: c.isActive !== false,
    });
    setError(null);
  };

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: draft.name.trim(),
      slug: (draft.slug.trim() || toCategorySlug(draft.name)).trim() || undefined,
      parentId: draft.parentId || null,
      description: draft.description.trim() || null,
      icon: draft.icon.trim() || null,
      displayOrder: Math.max(0, Math.trunc(Number(draft.displayOrder) || 0)),
      isActive: draft.isActive,
    };
    try {
      if (draft.id) await CategoryApiService.update(draft.id, payload);
      else await CategoryApiService.create(payload);
      setDraft(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Lưu chuyên mục thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CategoryItem) => {
    setError(null);
    try {
      await CategoryApiService.update(c.id, { isActive: c.isActive === false });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Cập nhật trạng thái chuyên mục thất bại.'));
    }
  };

  const remove = async (c: CategoryItem) => {
    if (!window.confirm(`Xoá chuyên mục "${c.name}"?`)) return;
    setError(null);
    try {
      await CategoryApiService.remove(c.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Xoá chuyên mục thất bại.'));
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
            CMS
          </span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">Quản lý chuyên mục</h1>
          <p className="mt-1 text-sm text-slate-500">Phân loại và tổ chức các bài viết trên HISGO.</p>
        </div>
        <button type="button" onClick={() => handleOpenCreate()} className="primary-button !h-10 !px-4 !text-sm font-bold">
          <Plus size={16} /> Thêm chuyên mục
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { value: pad2(stats.totalCategories), label: 'Chuyên mục', tone: 'text-slate-900' },
          { value: pad2(stats.totalArticles), label: 'Bài viết', tone: 'text-slate-900' },
          { value: pad2(stats.emptyCategories), label: 'Chuyên mục trống', tone: 'text-amber-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className={`text-3xl font-bold tracking-tight ${card.tone}`}>{card.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>}

      {draft && (
        <CategoryFormCard
          draft={draft}
          rootCategories={rootCategories}
          saving={saving}
          existingSlugs={existingSlugs}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setDraft(null)}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-sm font-bold text-slate-900">Danh sách chuyên mục</h2>
            {STATUS_FILTER_TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  statusFilter === key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên chuyên mục..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-7 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Tên chuyên mục</th>
                <th className="px-4 py-3">Đường dẫn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Bài viết</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải danh sách chuyên mục…</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Không có chuyên mục nào phù hợp.</td>
                </tr>
              ) : (
                filteredItems.map((c) => {
                  const count = c._count?.articles ?? 0;
                  const isActive = c.isActive !== false;
                  const publicHref = PUBLIC_ROUTES.CATEGORY(c.slug);
                  const parentCat = c.parentId ? items.find((p) => p.id === c.parentId) : null;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className={`flex items-start gap-3 ${parentCat ? 'pl-6' : ''}`}>
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            {renderCategoryIcon(c.icon)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {parentCat && <span className="font-mono text-xs text-slate-400">↳</span>}
                              <strong className="font-semibold text-slate-900">{c.name}</strong>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">#{c.displayOrder}</span>
                              {parentCat && (
                                <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                                  Thuộc: {parentCat.name}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">{c.description || 'Chuyên mục nội dung'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <a
                          href={publicHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
                        >
                          <span>{publicHref}</span>
                          <ExternalLink size={11} className="text-slate-400" />
                        </a>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                          </span>
                          {count === 0 && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Chưa có bài viết
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{count}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!c.parentId && (
                            <button
                              type="button"
                              title={`Thêm chuyên mục con cho "${c.name}"`}
                              onClick={() => handleOpenCreate(c.id)}
                              className="rounded-lg border border-slate-200 p-1.5 text-blue-600 hover:bg-blue-50"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            title={isActive ? 'Ẩn chuyên mục' : 'Hiện chuyên mục'}
                            onClick={() => toggleActive(c)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title={count > 0 ? 'Chuyên mục còn bài viết nên không thể xoá' : 'Xoá'}
                            disabled={count > 0}
                            onClick={() => remove(c)}
                            className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
