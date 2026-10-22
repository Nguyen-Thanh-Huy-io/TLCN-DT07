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

interface Draft {
  id: string | null;
  code: string;
  label: string;
  inverseLabel: string;
  icon: string;
  displayOrder: string;
  aliases: string;
  isActive: boolean;
}

const EMPTY_DRAFT: Draft = { id: null, code: '', label: '', inverseLabel: '', icon: '', displayOrder: '0', aliases: '', isActive: true };

const toDraft = (t: TaxonomyTermItem): Draft => ({
  id: t.id,
  code: t.code,
  label: t.label,
  inverseLabel: t.inverseLabel ?? '',
  icon: t.icon ?? '',
  displayOrder: String(t.displayOrder),
  aliases: t.aliases.join(', '),
  isActive: t.isActive,
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
                {group.terms.map((t) => (
                  <tr key={t.id} className={`border-b border-slate-50 last:border-b-0 ${t.isActive ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{t.displayOrder}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900">
                        {t.icon && t.icon.length <= 3 ? `${t.icon} ` : ''}
                        {t.label}
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
