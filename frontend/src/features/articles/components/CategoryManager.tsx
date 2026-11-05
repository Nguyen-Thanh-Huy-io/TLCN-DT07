'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { CategoryApiService, type CategoryItem } from '@/services/entities/article.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { ARTICLE_KIND_LABELS, resolveCategoryKind, type ArticleKind } from '@/services/public/article-kind';

interface Draft {
  id?: string;
  name: string;
  slug: string;
  parentId: string;
  /** '' = kế thừa chuyên mục cha. */
  kind: ArticleKind | '';
  icon: string;
  description: string;
  displayOrder: number;
}

const EMPTY: Draft = { name: '', slug: '', parentId: '', kind: '', icon: '', description: '', displayOrder: 0 };

/**
 * Chuyên mục bài viết — số lượng nhỏ nên quản lý trên 1 trang: bảng + form sửa ngay dòng.
 * "Loại bài" của chuyên mục quyết định hồ sơ bài viết (nhân vật / sự kiện / di tích...) và cách giao
 * diện công khai hiển thị; chuyên mục con để trống thì kế thừa chuyên mục cha.
 * Lưu ý: slug "nhan-vat", "su-kien", "di-tich", "trieu-dai" là đường dẫn của các trang lối tắt công khai.
 */
export function CategoryManager() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

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
    load();
  }, [load]);

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setError(null);
    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      parentId: draft.parentId || null,
      kind: draft.kind || null,
      icon: draft.icon.trim() || null,
      description: draft.description.trim() || null,
      displayOrder: Number(draft.displayOrder) || 0,
    };
    try {
      if (draft.id) await CategoryApiService.update(draft.id, payload);
      else await CategoryApiService.create(payload);
      setDraft(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Lưu chuyên mục thất bại.'));
    }
  };

  const remove = async (c: CategoryItem) => {
    if (!window.confirm(`Xoá chuyên mục "${c.name}"?`)) return;
    try {
      await CategoryApiService.remove(c.id);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Xoá chuyên mục thất bại.'));
    }
  };

  const input = 'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm';
  const roots = items.filter((c) => !c.parentId);
  const ordered = roots.flatMap((r) => [r, ...items.filter((c) => c.parentId === r.id)]);
  const orphans = items.filter((c) => c.parentId && !items.some((p) => p.id === c.parentId));

  const renderForm = () =>
    draft && (
      <tr className="bg-amber-50/60">
        <td>
          <input className={input} autoFocus placeholder="Tên chuyên mục *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={`${input} mt-1`} placeholder="Mô tả" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </td>
        <td>
          <input className={input} placeholder="tự sinh nếu trống" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        </td>
        <td>
          <select className={input} value={draft.parentId} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
            <option value="">— Gốc —</option>
            {roots
              .filter((r) => r.id !== draft.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
        </td>
        <td>
          <select className={input} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Draft['kind'] })}>
            <option value="">{draft.parentId ? '— Kế thừa cha —' : '— Khác —'}</option>
            {(Object.keys(ARTICLE_KIND_LABELS) as ArticleKind[]).map((k) => (
              <option key={k} value={k}>
                {ARTICLE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </td>
        <td>
          <input className={input} placeholder="User, Swords…" value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
        </td>
        <td>
          <input className={`${input} w-16`} type="number" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })} />
        </td>
        <td />
        <td>
          <div className="flex gap-1">
            <button type="button" onClick={save} className="rounded-md bg-slate-900 p-1.5 text-white" title="Lưu">
              <Check size={14} />
            </button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-md border border-slate-200 p-1.5" title="Huỷ">
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    );

  return (
    <div className="panel management-panel">
      <div className="toolbar">
        <span className="text-sm text-slate-600">Mỗi bài viết thuộc đúng 1 chuyên mục. Chuyên mục còn bài viết thì không xoá được.</span>
        <button type="button" className="primary-button !h-9 !px-3.5 !text-sm font-bold ml-auto" onClick={() => setDraft({ ...EMPTY })}>
          <Plus size={15} /> Thêm chuyên mục
        </button>
      </div>
      {error && <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th>TÊN</th>
              <th>ĐƯỜNG DẪN</th>
              <th>CHA</th>
              <th>LOẠI BÀI</th>
              <th>ICON</th>
              <th>THỨ TỰ</th>
              <th>SỐ BÀI</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {draft && !draft.id && renderForm()}
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            ) : (
              [...ordered, ...orphans].map((c) =>
                draft?.id === c.id ? (
                  <React.Fragment key={c.id}>{renderForm()}</React.Fragment>
                ) : (
                  <tr key={c.id}>
                    <td>
                      <strong className={`text-sm ${c.parentId ? 'pl-5 font-medium' : 'font-semibold'} text-slate-900`}>
                        {c.parentId ? '— ' : ''}
                        {c.name}
                      </strong>
                      {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
                    </td>
                    <td>
                      <a href={PUBLIC_ROUTES.CATEGORY(c.slug)} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:underline">
                        /chuyen-muc/{c.slug}
                      </a>
                    </td>
                    <td className="text-xs text-slate-600">{items.find((p) => p.id === c.parentId)?.name ?? '—'}</td>
                    <td className="text-xs text-slate-600">
                      {ARTICLE_KIND_LABELS[resolveCategoryKind(items, c.id)]}
                      {!c.kind && c.parentId && <span className="text-slate-400"> (kế thừa)</span>}
                    </td>
                    <td className="text-xs text-slate-600">{c.icon ?? '—'}</td>
                    <td className="text-xs text-slate-600">{c.displayOrder}</td>
                    <td className="text-xs font-medium text-slate-700">{c._count?.articles ?? 0}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Sửa"
                          className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50"
                          onClick={() =>
                            setDraft({
                              id: c.id,
                              name: c.name,
                              slug: c.slug,
                              parentId: c.parentId ?? '',
                              kind: c.kind ?? '',
                              icon: c.icon ?? '',
                              description: c.description ?? '',
                              displayOrder: c.displayOrder,
                            })
                          }
                        >
                          <Pencil size={14} />
                        </button>
                        <button type="button" title="Xoá" className="rounded-md border border-slate-200 p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(c)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
