'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ActionMenu } from '@/components/common/ActionMenu';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { extractErrorMessage } from '@/services/api';
import { TagApiService } from '@/services/entities/tag.service';
import type { TagItem } from '@/types/models/tag.type';
import {
  ArticleApiService,
  CategoryApiService,
  CONTENT_STATUS_LABELS,
  type ArticleItem,
  type CategoryItem,
  type ContentStatusValue,
} from '@/services/entities/article.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { StatusPill } from './StatusPill';

const PAGE_SIZE = 20;
/** Chuyên mục Blog thuộc trang Cộng đồng, không hiện trong danh sách bài viết CMS. */
const BLOG_CATEGORY_KEY = 'blog';
/** Bài đang được ẩn khỏi danh sách CMS (khớp theo tiêu đề hoặc một phần slug). */
const HIDDEN_ARTICLE = {
  TITLE: 'cổng la mã và không gian quyền lực',
  SLUG_FRAGMENT: 'cong-la-ma',
} as const;

/** Danh sách bài viết trong CMS: lọc chuyên mục / tag / trạng thái, tìm theo tiêu đề, phân trang server. */
export function ArticleList() {
  const router = useRouter();
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const [status, setStatus] = useState<ContentStatusValue | ''>('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [deleting, setDeleting] = useState<ArticleItem | null>(null);

  useEffect(() => {
    CategoryApiService.list().then(setCategories).catch(() => setCategories([]));
    TagApiService.getTags().then(setTags).catch(() => setTags([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ArticleApiService.list({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        tagId: tagId || undefined,
        status: status || undefined,
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
  }, [page, search, categoryId, tagId, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  // Đổi bộ lọc → quay về trang 1.
  useEffect(() => {
    void Promise.resolve().then(() => setPage(1));
  }, [search, categoryId, tagId, status]);

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
  const isBlogCategory = (categoryName?: string | null, categorySlug?: string | null) => {
    const normalizedName = (categoryName || '').trim().toLowerCase();
    const normalizedSlug = (categorySlug || '').trim().toLowerCase();
    return normalizedName === BLOG_CATEGORY_KEY || normalizedSlug === BLOG_CATEGORY_KEY;
  };
  const isHiddenArticle = (article: ArticleItem) => {
    const normalizedTitle = (article.title || '').trim().toLowerCase();
    const normalizedSlug = (article.slug || '').trim().toLowerCase();
    return (
      normalizedTitle === HIDDEN_ARTICLE.TITLE || normalizedSlug.includes(HIDDEN_ARTICLE.SLUG_FRAGMENT)
    );
  };

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
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
          <option value="">Mọi chuyên mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={tagId} onChange={(e) => setTagId(e.target.value)} className={selectClass}>
          <option value="">Mọi tag</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
              items
                .filter((a) => !isBlogCategory(a.category?.name, a.category?.slug))
                .filter((a) => !isHiddenArticle(a))
                .map((a) => (
                  <tr key={a.id} className="cursor-pointer" onClick={() => router.push(APP_ROUTES.ARTICLES.DETAIL(a.id))}>
                    <td>
                      <strong className="text-sm font-semibold text-slate-900">{a.title}</strong>
                      {a.isFeatured && <span className="ml-2 text-xs font-bold text-amber-600">★ Nổi bật</span>}
                      <div className="text-xs text-slate-500">/{a.slug}</div>
                    </td>
                    <td className="text-xs sm:text-sm text-slate-700">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {a.category?.name || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="text-xs sm:text-sm text-slate-700">{a.dateText || a.startYear || '—'}</td>
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
    </div>
  );
}
