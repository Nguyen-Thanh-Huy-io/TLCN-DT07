'use client';
import React from 'react';

export interface EntityRelationOption {
  id: string;
  name: string;
  tagline?: string | null;
}

export interface EntityRelationRowValue {
  entityId: string;
  role: string;
}

export interface EntityRelationRepeaterFieldProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  entityPlaceholder: string;
  roleLabel?: string;
  rolePlaceholder: string;
  roleExampleText?: string;
  roleSuggestions: readonly string[];
  addButtonLabel: string;
  options: EntityRelationOption[];
  rows: EntityRelationRowValue[];
  onChangeRows: (rows: EntityRelationRowValue[]) => void;
  datalistId: string;
}

const DEFAULT_TEXTS = {
  ROLE_LABEL: 'Loại quan hệ',
  REMOVE_ROW_TITLE: 'Xóa mục này',
} as const;

/**
 * Component tái sử dụng chuẩn SOLID (SRP/OCP) cho các mục:
 * - B. Nhân vật tham gia (+ Thêm nhân vật)
 * - C. Lực lượng tham gia (+ Thêm lực lượng)
 * - D. Hiện vật và phương tiện (+ Thêm hiện vật)
 * Mỗi dòng gồm: Ô chọn Thực thể + Ô nhập/chọn Loại quan hệ (Role) + Nút xóa.
 */
export function EntityRelationRepeaterField({
  sectionTitle,
  sectionSubtitle,
  entityPlaceholder,
  roleLabel = DEFAULT_TEXTS.ROLE_LABEL,
  rolePlaceholder,
  roleExampleText,
  roleSuggestions,
  addButtonLabel,
  options,
  rows,
  onChangeRows,
  datalistId,
}: EntityRelationRepeaterFieldProps) {
  const handleAddRow = () => {
    onChangeRows([...rows, { entityId: '', role: '' }]);
  };

  const handleUpdateRow = (
    index: number,
    patch: Partial<EntityRelationRowValue>,
  ) => {
    const next = rows.map((row, idx) =>
      idx === index ? { ...row, ...patch } : row,
    );
    onChangeRows(next);
  };

  const handleRemoveRow = (index: number) => {
    onChangeRows(rows.filter((_, idx) => idx !== index));
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
      <div>
        <h4 className="text-xs font-bold text-slate-900">{sectionTitle}</h4>
        {sectionSubtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5">{sectionSubtitle}</p>
        )}
      </div>

      <datalist id={datalistId}>
        {roleSuggestions.map((roleOpt) => (
          <option key={roleOpt} value={roleOpt} />
        ))}
      </datalist>

      {rows.length > 0 && (
        <div className="space-y-2.5">
          {rows.map((row, idx) => {
            const chosenEntity = options.find((o) => o.id === row.entityId);
            return (
              <div
                key={`${idx}-${row.entityId}`}
                className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Cột 1: Chọn Nhân vật / Lực lượng / Hiện vật */}
                  <div className="md:col-span-6">
                    <select
                      value={row.entityId}
                      title={chosenEntity?.name || entityPlaceholder}
                      onChange={(e) =>
                        handleUpdateRow(idx, { entityId: e.target.value })
                      }
                      className="w-full text-xs font-semibold text-slate-900 px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">{entityPlaceholder}</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id} title={opt.name}>
                          {opt.name}
                          {opt.tagline ? ` — ${opt.tagline}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cột 2: Loại quan hệ / Vai trò */}
                  <div className="md:col-span-5">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {roleLabel}
                    </span>
                    <input
                      type="text"
                      list={datalistId}
                      value={row.role}
                      onChange={(e) =>
                        handleUpdateRow(idx, { role: e.target.value })
                      }
                      placeholder={rolePlaceholder}
                      className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Cột 3: Xóa dòng */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      title={DEFAULT_TEXTS.REMOVE_ROW_TITLE}
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 font-bold text-sm flex items-center justify-center transition cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {roleExampleText && idx === 0 && (
                  <div className="text-[11px] text-slate-400">
                    {roleExampleText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rows.length === 0 && roleExampleText && (
        <div className="text-[11px] text-slate-400">{roleExampleText}</div>
      )}

      <div>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 transition cursor-pointer"
        >
          <span>{addButtonLabel}</span>
        </button>
      </div>
    </div>
  );
}
