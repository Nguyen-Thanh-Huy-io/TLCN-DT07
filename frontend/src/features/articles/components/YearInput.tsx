'use client';

import React from 'react';

/**
 * Ô nhập năm lịch sử: người dùng gõ số dương + tích "TCN"; giá trị lưu là số âm cho TCN
 * (quy ước toàn hệ thống: -179 = 179 TCN, không có năm 0).
 */
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
