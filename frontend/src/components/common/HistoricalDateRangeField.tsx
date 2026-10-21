'use client';
import React from 'react';
import {
  TimelineMode,
  FlexibleDateParseResult,
} from '@/utils/history-year.utils';

export interface HistoricalDateRangeFieldProps {
  timelineMode: TimelineMode;
  onTimelineModeChange: (mode: TimelineMode) => void;

  startDateInput: string;
  onStartDateInputChange: (val: string) => void;
  startIsBce: boolean;
  onStartIsBceChange: (isBce: boolean) => void;
  parsedStart: FlexibleDateParseResult;

  endDateInput: string;
  onEndDateInputChange: (val: string) => void;
  endIsBce: boolean;
  onEndIsBceChange: (isBce: boolean) => void;
  parsedEnd: FlexibleDateParseResult;

  displayValue: string;
  onDisplayValueChange: (val: string) => void;
  isCustomDisplayMode: boolean;
  onToggleCustomDisplayMode: () => void;

  /** Nhãn tùy chỉnh khi tái sử dụng cho Nhân vật (Năm sinh / Năm mất) hoặc Triều đại (Bắt đầu / Kết thúc) */
  pointLabel?: string;
  startLabel?: string;
  endLabel?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  displayPlaceholder?: string;
}

const DEFAULT_LABELS = {
  MODE_TITLE: 'Kiểu mốc thời gian',
  MODE_POINT: 'Một thời điểm',
  MODE_RANGE: 'Khoảng thời gian',
  POINT_LABEL: 'Thời điểm diễn ra',
  START_LABEL: 'Mốc bắt đầu',
  END_LABEL: 'Mốc kết thúc',
  BCE_FULL: 'Trước CN (TCN)',
  BCE_SHORT: 'TCN',
  DISPLAY_LABEL: 'Thời gian hiển thị (tự động tạo)',
  BTN_CUSTOMIZE: 'Tùy chỉnh',
  BTN_AUTO: 'Tự động',
  START_PLACEHOLDER: 'DD/MM/YYYY hoặc YYYY (VD: 19/05/1959 hoặc 1959)',
  END_PLACEHOLDER: 'DD/MM/YYYY hoặc YYYY (VD: 30/04/1975)',
  DISPLAY_PLACEHOLDER:
    'Ví dụ: 19/05/1959 – 30/04/1975 hoặc Khoảng thế kỷ III TCN',
} as const;

/**
 * Component tái sử dụng chuẩn SOLID (SRP/OCP) cho nhập liệu Thời gian lịch sử.
 * Gồm 3 cụm điều khiển gọn gàng:
 * A. Segmented Control: [ Một thời điểm ] | [ Khoảng thời gian ]
 * B. Ô nhập linh hoạt (DD/MM/YYYY, MM/YYYY hoặc YYYY) + Checkbox [ ] Trước CN (TCN)
 * C. Thời gian hiển thị (tự động tạo) + nút [Tùy chỉnh]
 */
export function HistoricalDateRangeField({
  timelineMode,
  onTimelineModeChange,
  startDateInput,
  onStartDateInputChange,
  startIsBce,
  onStartIsBceChange,
  parsedStart,
  endDateInput,
  onEndDateInputChange,
  endIsBce,
  onEndIsBceChange,
  parsedEnd,
  displayValue,
  onDisplayValueChange,
  isCustomDisplayMode,
  onToggleCustomDisplayMode,
  pointLabel = DEFAULT_LABELS.POINT_LABEL,
  startLabel = DEFAULT_LABELS.START_LABEL,
  endLabel = DEFAULT_LABELS.END_LABEL,
  startPlaceholder = DEFAULT_LABELS.START_PLACEHOLDER,
  endPlaceholder = DEFAULT_LABELS.END_PLACEHOLDER,
  displayPlaceholder = DEFAULT_LABELS.DISPLAY_PLACEHOLDER,
}: HistoricalDateRangeFieldProps) {
  const handleStartInput = (rawVal: string) => {
    if (rawVal.startsWith('-')) {
      onStartIsBceChange(true);
      onStartDateInputChange(rawVal.slice(1));
    } else {
      onStartDateInputChange(rawVal);
    }
  };

  const handleEndInput = (rawVal: string) => {
    if (rawVal.startsWith('-')) {
      onEndIsBceChange(true);
      onEndDateInputChange(rawVal.slice(1));
    } else {
      onEndDateInputChange(rawVal);
    }
  };

  return (
    <div className="space-y-4">
      {/* A. Segmented Control / Switch chọn kiểu mốc thời gian */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs font-semibold text-slate-700">
          {DEFAULT_LABELS.MODE_TITLE}
        </span>
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          {[
            { mode: TimelineMode.POINT, label: DEFAULT_LABELS.MODE_POINT },
            { mode: TimelineMode.RANGE, label: DEFAULT_LABELS.MODE_RANGE },
          ].map((tab) => {
            const active = timelineMode === tab.mode;
            return (
              <button
                key={tab.mode}
                type="button"
                onClick={() => onTimelineModeChange(tab.mode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Gộp Ngày - Tháng - Năm vào một ô linh hoạt + Checkbox TCN */}
      <div
        className={`grid grid-cols-1 ${
          timelineMode === TimelineMode.RANGE ? 'sm:grid-cols-2' : ''
        } gap-4`}
      >
        {/* Mốc bắt đầu */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700">
              {timelineMode === TimelineMode.RANGE ? startLabel : pointLabel}{' '}
              <b className="text-rose-500">*</b>
            </span>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={startIsBce}
                onChange={(e) => onStartIsBceChange(e.target.checked)}
                className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
              />
              <span>{DEFAULT_LABELS.BCE_FULL}</span>
            </label>
          </div>
          <input
            type="text"
            value={startDateInput}
            onChange={(e) => handleStartInput(e.target.value)}
            placeholder={startPlaceholder}
            className={`w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none transition ${
              startDateInput.trim() && !parsedStart.valid
                ? 'border-rose-400 focus:border-rose-500'
                : 'border-slate-200 focus:border-amber-500'
            }`}
          />
          {startDateInput.trim() && !parsedStart.valid && (
            <span className="text-[11px] text-rose-600 mt-1 block">
              {parsedStart.error}
            </span>
          )}
        </div>

        {/* Mốc kết thúc (nếu chọn Khoảng thời gian) */}
        {timelineMode === TimelineMode.RANGE && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                {endLabel}
              </span>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={endIsBce}
                  onChange={(e) => onEndIsBceChange(e.target.checked)}
                  className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                />
                <span>{DEFAULT_LABELS.BCE_SHORT}</span>
              </label>
            </div>
            <input
              type="text"
              value={endDateInput}
              onChange={(e) => handleEndInput(e.target.value)}
              placeholder={endPlaceholder}
              className={`w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none transition ${
                endDateInput.trim() && !parsedEnd.valid
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 focus:border-amber-500'
              }`}
            />
            {endDateInput.trim() && !parsedEnd.valid && (
              <span className="text-[11px] text-rose-600 mt-1 block">
                {parsedEnd.error}
              </span>
            )}
          </div>
        )}
      </div>

      {/* C. Thời gian hiển thị (tự động tạo) + nút [Tùy chỉnh] */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-700">
            {DEFAULT_LABELS.DISPLAY_LABEL}
          </span>
          <button
            type="button"
            onClick={onToggleCustomDisplayMode}
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            {isCustomDisplayMode
              ? DEFAULT_LABELS.BTN_AUTO
              : DEFAULT_LABELS.BTN_CUSTOMIZE}
          </button>
        </div>
        <input
          type="text"
          value={displayValue}
          readOnly={!isCustomDisplayMode}
          onChange={(e) => onDisplayValueChange(e.target.value)}
          placeholder={displayPlaceholder}
          className={`w-full text-xs font-semibold px-3.5 py-2.5 border rounded-xl transition ${
            isCustomDisplayMode
              ? 'bg-white border-amber-400 text-slate-900 focus:outline-none focus:border-amber-600'
              : 'bg-slate-100/80 border-slate-200 text-slate-600 cursor-default focus:outline-none'
          }`}
        />
      </div>
    </div>
  );
}
