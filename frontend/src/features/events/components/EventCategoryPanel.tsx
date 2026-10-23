'use client';

import React, { useMemo, useState } from 'react';
import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { collectFields, flattenTree, pathLabel, type TaxonomyFieldDef } from '@/features/taxonomy/taxonomy-tree';

interface EventCategoryPanelProps {
  /** Nhóm EVENT_CATEGORY (cả giá trị đang ẩn để hiện đúng loại cũ đã gắn). */
  group?: TaxonomyGroupItem;
  /** Id loại đã chọn — phần tử đầu là loại chính. */
  value: string[];
  onChange: (ids: string[]) => void;
  metadata: Record<string, any>;
  onMetadataChange: (metadata: Record<string, any>) => void;
}

const INPUT =
  'w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500';

const listText = (value: unknown) => (Array.isArray(value) ? value.join('\n') : value ? String(value) : '');

/**
 * Chọn loại sự kiện theo cây "Danh mục dùng chung" (chọn được nhiều loại, loại đầu là loại chính)
 * và nhập các trường thông tin riêng — trường khai báo ở từng nút, nút con kế thừa nút cha.
 */
export function EventCategoryPanel({ group, value, onChange, metadata, onMetadataChange }: EventCategoryPanelProps) {
  const [query, setQuery] = useState('');
  const terms = useMemo(() => group?.terms ?? [], [group]);
  const rows = useMemo(() => flattenTree(terms), [terms]);
  const fields = useMemo(() => collectFields(terms, value), [terms, value]);
  const hasChildren = useMemo(() => new Set(terms.map((t) => t.parentId).filter(Boolean)), [terms]);

  const q = query.trim().toLocaleLowerCase('vi');
  const visible = rows.filter(
    ({ term }) =>
      (term.isActive || value.includes(term.id)) &&
      (!q || pathLabel(terms, term.id).toLocaleLowerCase('vi').includes(q) || term.aliases.some((a) => a.includes(q))),
  );

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const makePrimary = (id: string) => onChange([id, ...value.filter((v) => v !== id)]);

  const setField = (field: TaxonomyFieldDef, raw: string) => {
    // Danh sách giữ nguyên chữ đang gõ (để xuống dòng được); backend tách thành mảng khi lưu.
    let next: unknown = raw;
    if (field.type === 'number') next = raw === '' ? null : Number(raw);
    onMetadataChange({ ...metadata, [field.key]: next });
  };

  if (!group) {
    return <div className="h-24 animate-pulse rounded-xl bg-slate-100" aria-label="Đang tải loại sự kiện" />;
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id, i) => (
            <span
              key={id}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                i === 0 ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {i === 0 ? '★ ' : ''}
              {pathLabel(terms, id) || id}
              {i > 0 && (
                <button type="button" className="text-slate-400 hover:text-amber-700" onClick={() => makePrimary(id)} title="Đặt làm loại chính">
                  ☆
                </button>
              )}
              <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => toggle(id)} aria-label="Bỏ loại này">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm loại sự kiện..."
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1.5">
          {visible.map(({ term, depth }) => {
            const checked = value.includes(term.id);
            const isGroupNode = hasChildren.has(term.id);
            return (
              <label
                key={term.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 ${checked ? 'bg-amber-50/60' : ''}`}
                style={{ paddingLeft: `${0.5 + (q ? 0 : depth) * 1.1}rem` }}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(term.id)} />
                <span className={isGroupNode ? 'font-bold text-slate-900' : 'text-slate-700'}>
                  {q ? pathLabel(terms, term.id) : term.label}
                </span>
                {fieldsOf(term) > 0 && <span className="text-[10px] text-slate-400">+{fieldsOf(term)} trường</span>}
                {!term.isActive && <span className="text-[10px] text-slate-400">(đang ẩn)</span>}
                {value[0] === term.id && <span className="ml-auto text-[10px] font-bold text-amber-700">Loại chính</span>}
              </label>
            );
          })}
          {visible.length === 0 && <p className="px-2 py-3 text-xs text-slate-400">Không có loại phù hợp.</p>}
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        Chọn loại cụ thể nhất (nút con). Loại đầu tiên là loại chính, dùng cho màu và nhãn trên thẻ; bấm ☆ để đổi. Thiếu loại?
        Thêm ở mục &quot;Danh mục dùng chung&quot;.
      </p>

      {fields.length > 0 && (
        <div className="space-y-3 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5">
          <div className="text-xs font-bold text-slate-900">Thông tin riêng theo loại</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className={`block ${field.type === 'textarea' || field.type === 'list' ? 'sm:col-span-2' : ''}`}>
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">
                  {field.label}
                  {field.type === 'list' && <span className="font-normal text-slate-400"> — mỗi dòng một mục</span>}
                </span>
                {field.type === 'textarea' || field.type === 'list' ? (
                  <textarea
                    rows={3}
                    value={field.type === 'list' ? listText(metadata[field.key]) : (metadata[field.key] ?? '')}
                    onChange={(e) => setField(field, e.target.value)}
                    className={INPUT}
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={metadata[field.key] ?? ''}
                    onChange={(e) => setField(field, e.target.value)}
                    className={INPUT}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const fieldsOf = (term: { meta: Record<string, any> | null }) =>
  Array.isArray(term.meta?.fields) ? term.meta.fields.length : 0;
