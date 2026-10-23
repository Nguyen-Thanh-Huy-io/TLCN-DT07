'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import {
  TaxonomyApiService,
  type TaxonomyGroupItem,
  type TaxonomyTermItem,
} from '@/services/entities/taxonomy.service';
import { FIELD_TYPE_LABELS, fieldsOf, flattenTree, type TaxonomyFieldDef } from './taxonomy-tree';

interface Draft {
  id: string | null;
  code: string;
  label: string;
  inverseLabel: string;
  icon: string;
  displayOrder: string;
  aliases: string;
  isActive: boolean;
  parentId: string;
  /** Trường thông tin riêng (meta.fields) — nhóm loại sự kiện. */
  fields: TaxonomyFieldDef[];
  meta: Record<string, any> | null;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  code: '',
  label: '',
  inverseLabel: '',
  icon: '',
  displayOrder: '0',
  aliases: '',
  isActive: true,
  parentId: '',
  fields: [],
  meta: null,
};

/** Nhóm có trường thông tin riêng khai báo theo từng giá trị (kế thừa theo cây). */
const GROUPS_WITH_FIELDS = new Set(['EVENT_CATEGORY']);

const toDraft = (t: TaxonomyTermItem): Draft => ({
  id: t.id,
  code: t.code,
  label: t.label,
  inverseLabel: t.inverseLabel ?? '',
  icon: t.icon ?? '',
  displayOrder: String(t.displayOrder),
  aliases: t.aliases.join(', '),
  isActive: t.isActive,
  parentId: t.parentId ?? '',
  fields: fieldsOf(t),
  meta: t.meta,
});

const FIELD = 'h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50';

/**
 * CMS "Danh mục dùng chung": loại di tích, hiện trạng, xếp hạng... — thay cho enum cứng trong code.
 * Biên tập viên chỉ xem; người duyệt / superadmin thêm, sửa, ẩn, xóa (giá trị đang dùng chỉ ẩn được).
 */
export function TaxonomyManager() {
  const user = useAuthSession();
  const canEdit = Boolean(user && isReviewerRole(user.role));
  const [groups, setGroups] = useState<TaxonomyGroupItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await TaxonomyApiService.getGroups();
      setGroups(data);
      setActiveGroup((g) => g || data[0]?.code || '');
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không tải được danh mục.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const group = useMemo(() => groups.find((g) => g.code === activeGroup), [groups, activeGroup]);
  const isRelationGroup = Boolean(group?.code.includes('RELATION'));
  const hasFields = Boolean(group && GROUPS_WITH_FIELDS.has(group.code));
  const rows = useMemo(
    () => (group ? (group.hierarchical ? flattenTree(group.terms) : group.terms.map((term) => ({ term, depth: 0 }))) : []),
    [group],
  );
  const updateField = (index: number, patch: Partial<TaxonomyFieldDef>) =>
    draft && setDraft({ ...draft, fields: draft.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) });

  const save = async () => {
    if (!draft || !group) return;
    if (!draft.code.trim() || !draft.label.trim()) {
      setNotice({ tone: 'error', text: 'Cần nhập mã và nhãn hiển thị.' });
      return;
    }
    const payload = {
      label: draft.label.trim(),
      inverseLabel: draft.inverseLabel.trim() || undefined,
      icon: draft.icon.trim() || undefined,
      displayOrder: Number(draft.displayOrder) || 0,
      aliases: draft.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      isActive: draft.isActive,
      ...(group.hierarchical ? { parentId: draft.parentId || null } : {}),
      ...(hasFields
        ? {
            meta: {
              ...(draft.meta ?? {}),
              fields: draft.fields
                .map((f) => ({ ...f, key: f.key.trim(), label: f.label.trim() || f.key.trim() }))
                .filter((f) => f.key),
            },
          }
        : {}),
    };
    setSaving(true);
    try {
      if (draft.id) await TaxonomyApiService.updateTerm(draft.id, payload);
      else await TaxonomyApiService.createTerm({ ...payload, groupCode: group.code, code: draft.code.trim().toUpperCase() });
      setNotice({ tone: 'ok', text: draft.id ? 'Đã lưu thay đổi.' : 'Đã thêm giá trị mới.' });
      setDraft(null);
      await load();
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không lưu được giá trị danh mục.') });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (term: TaxonomyTermItem) => {
    try {
      await TaxonomyApiService.updateTerm(term.id, { isActive: !term.isActive });
      await load();
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không đổi được trạng thái.') });
    }
  };

  const remove = async (term: TaxonomyTermItem) => {
    try {
      await TaxonomyApiService.deleteTerm(term.id);
      setNotice({ tone: 'ok', text: `Đã xóa "${term.label}".` });
      await load();
    } catch (err) {
      // Giá trị đang được dùng: backend trả lời gợi ý ẩn thay vì xóa.
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không xóa được giá trị này.') });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pb-8 sm:px-6">
      <p className="text-sm text-slate-500">
        Thêm giá trị mới ở đây, không cần sửa code.{' '}
        {!canEdit && <strong className="text-amber-700">Bạn đang ở chế độ chỉ xem — chỉ người duyệt được chỉnh sửa.</strong>}
      </p>

      {notice && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${
            notice.tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" className="text-xs font-semibold opacity-70 hover:opacity-100" onClick={() => setNotice(null)}>
            Đóng
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {groups.map((g) => (
          <button
            key={g.code}
            type="button"
            onClick={() => {
              setActiveGroup(g.code);
              setDraft(null);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              g.code === activeGroup ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {g.label} <span className="opacity-60">{g.terms.length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
      ) : group ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{group.label}</div>
              {group.description && <div className="text-xs text-slate-500">{group.description}</div>}
              <div className="text-[11px] text-slate-400">Mã nhóm: {group.code}</div>
            </div>
            {canEdit && (
              <button type="button" className="primary-button !h-8 !text-xs !px-3" onClick={() => setDraft(EMPTY_DRAFT)}>
                + Thêm giá trị
              </button>
            )}
          </div>

          {draft && (
            <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:grid-cols-6">
              <label className="text-xs font-semibold text-slate-600 sm:col-span-1">
                Mã
                <input className={FIELD} value={draft.code} disabled={Boolean(draft.id)} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="CITADEL" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Nhãn hiển thị
                <input className={FIELD} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </label>
              {isRelationGroup && (
                <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                  Nhãn chiều ngược
                  <input className={FIELD} value={draft.inverseLabel} onChange={(e) => setDraft({ ...draft, inverseLabel: e.target.value })} />
                </label>
              )}
              <label className="text-xs font-semibold text-slate-600 sm:col-span-1">
                Biểu tượng
                <input className={FIELD} value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="castle / 🏛️" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-1">
                Thứ tự
                <input className={FIELD} type="number" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: e.target.value })} />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-4">
                Cách ghi khác (alias) — phân cách bằng dấu phẩy
                <input
                  className={FIELD}
                  value={draft.aliases}
                  onChange={(e) => setDraft({ ...draft, aliases: e.target.value })}
                  placeholder="thành cổ, thành lũy..."
                />
              </label>
              {group.hierarchical && (
                <label className="text-xs font-semibold text-slate-600 sm:col-span-3">
                  Thuộc nhóm cha
                  <select className={FIELD} value={draft.parentId} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
                    <option value="">— Cấp gốc —</option>
                    {flattenTree(group.terms)
                      .filter(({ term }) => term.id !== draft.id)
                      .map(({ term, depth }) => (
                        <option key={term.id} value={term.id}>
                          {'\u00a0\u00a0'.repeat(depth)}
                          {term.label}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {hasFields && (
                <div className="space-y-2 sm:col-span-6">
                  <div className="text-xs font-semibold text-slate-600">
                    Trường thông tin riêng <span className="font-normal text-slate-400">— nút con tự kế thừa trường của nút cha</span>
                  </div>
                  {draft.fields.map((field, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_9rem_auto]">
                      <input className={FIELD} placeholder="Mã (vd. casualties)" value={field.key} onChange={(e) => updateField(i, { key: e.target.value })} />
                      <input className={FIELD} placeholder="Nhãn hiển thị" value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} />
                      <select className={FIELD} value={field.type} onChange={(e) => updateField(i, { type: e.target.value as TaxonomyFieldDef['type'] })}>
                        {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="px-2 text-xs font-semibold text-slate-400 hover:text-rose-600"
                        onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, k) => k !== i) })}
                      >
                        Bỏ
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                    onClick={() => setDraft({ ...draft, fields: [...draft.fields, { key: '', label: '', type: 'text' }] })}
                  >
                    + Thêm trường
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 self-end text-xs font-semibold text-slate-600 sm:col-span-1">
                <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                Đang dùng
              </label>
              <div className="flex items-end gap-2 sm:col-span-6">
                <button type="button" className="primary-button !h-8 !text-xs !px-3" disabled={saving} onClick={save}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" className="secondary-button !h-8 !text-xs !px-3" onClick={() => setDraft(null)}>
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-4 py-2 w-12">#</th>
                  <th className="px-4 py-2">Nhãn / Mã</th>
                  <th className="px-4 py-2">Cách ghi khác</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  {canEdit && <th className="px-4 py-2 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ term: t, depth }) => (
                  <tr key={t.id} className={`border-b border-slate-50 last:border-b-0 ${t.isActive ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{t.displayOrder}</td>
                    <td className="px-4 py-2.5" style={{ paddingLeft: `${1 + depth * 1.25}rem` }}>
                      <div className="font-semibold text-slate-900">
                        {depth > 0 && <span className="text-slate-300">└ </span>}
                        {t.icon && t.icon.length <= 3 ? `${t.icon} ` : ''}
                        {t.label}
                        {fieldsOf(t).length > 0 && (
                          <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            +{fieldsOf(t).length} trường
                          </span>
                        )}
                        {t.inverseLabel && <span className="font-normal text-slate-500"> ↔ {t.inverseLabel}</span>}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{t.code}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {t.aliases.map((a) => (
                          <span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {t.isActive ? <span className="text-emerald-700">Đang dùng</span> : <span className="text-slate-500">Đang ẩn</span>}
                    </td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs">
                        <button type="button" className="px-1.5 font-semibold text-slate-600 hover:text-emerald-700" onClick={() => setDraft(toDraft(t))}>
                          Sửa
                        </button>
                        <button type="button" className="px-1.5 font-semibold text-slate-600 hover:text-amber-700" onClick={() => toggleActive(t)}>
                          {t.isActive ? 'Ẩn' : 'Hiện'}
                        </button>
                        <button type="button" className="px-1.5 font-semibold text-slate-400 hover:text-rose-600" onClick={() => remove(t)}>
                          Xóa
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Chưa có nhóm danh mục nào.</p>
      )}
    </div>
  );
}
