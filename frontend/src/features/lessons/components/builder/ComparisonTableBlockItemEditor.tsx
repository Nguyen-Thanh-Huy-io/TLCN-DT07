'use client';

import React from 'react';
import { ComparisonTableBlockData, ComparisonTableRow } from '../../types/block-builder.types';

interface ComparisonTableBlockItemEditorProps {
  data: ComparisonTableBlockData;
  onChange: (updates: Partial<ComparisonTableBlockData>) => void;
}

/**
 * Editor cho khối "Bảng so sánh" — so sánh 2 đối tượng/phe/giai đoạn theo từng tiêu chí.
 * Cho phép đổi tên 2 cột, thêm/xóa/sửa từng dòng tiêu chí.
 */
export function ComparisonTableBlockItemEditor({ data, onChange }: ComparisonTableBlockItemEditorProps) {
  const updateRow = (idx: number, updates: Partial<ComparisonTableRow>) => {
    const rows = data.rows.map((row, i) => (i === idx ? { ...row, ...updates } : row));
    onChange({ rows });
  };

  const addRow = () => {
    onChange({
      rows: [...data.rows, { criteria: 'Tiêu chí mới', colA: '', colB: '' }],
    });
  };

  const removeRow = (idx: number) => {
    if (data.rows.length <= 1) {
      alert('Bảng so sánh cần có ít nhất một dòng tiêu chí.');
      return;
    }
    onChange({ rows: data.rows.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-2.5" data-testid="comparison-table-block-editor">
      <input
        type="text"
        value={data.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Tiêu đề bảng so sánh (tùy chọn)..."
        className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={data.colAName}
          onChange={(e) => onChange({ colAName: e.target.value })}
          placeholder="Tên cột A..."
          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={data.colBName}
          onChange={(e) => onChange({ colBName: e.target.value })}
          placeholder="Tên cột B..."
          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {data.rows.map((row, idx) => (
          <div
            key={idx}
            data-testid={`comparison-row-${idx}`}
            className="p-2 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={row.criteria}
                onChange={(e) => updateRow(idx, { criteria: e.target.value })}
                placeholder="Tiêu chí..."
                className="flex-1 min-w-0 text-xs font-semibold p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                title="Xóa dòng"
                className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={row.colA}
                onChange={(e) => updateRow(idx, { colA: e.target.value })}
                placeholder="Nội dung cột A..."
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <input
                type="text"
                value={row.colB}
                onChange={(e) => updateRow(idx, { colB: e.target.value })}
                placeholder="Nội dung cột B..."
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-1.5 cursor-pointer transition"
      >
        + Thêm dòng tiêu chí
      </button>
    </div>
  );
}
