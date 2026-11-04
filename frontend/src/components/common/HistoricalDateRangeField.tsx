'use client';
import React, { useState, useEffect } from 'react';
import {
  TimelineMode,
  FlexibleDateParseResult,
  toRomanNumeral,
  parseRomanNumeral,
} from '@/utils/history-year.utils';
import { DatePrecision, DATE_PRECISION_LABELS } from '@/constants/enums';

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
  DISPLAY_LABEL: 'Thời gian hiển thị trước độc giả (tự động tạo)',
  BTN_CUSTOMIZE: 'Tùy chỉnh',
  BTN_AUTO: 'Tự động',
  START_PLACEHOLDER:
    'DD/MM/YYYY, YYYY hoặc "Khoảng thế kỷ 19", "Thế kỷ X", "Khoảng năm 938"...',
  END_PLACEHOLDER:
    'DD/MM/YYYY, YYYY hoặc "Đầu thế kỷ 20", "Khoảng 1975"...',
  DISPLAY_PLACEHOLDER:
    'Ví dụ: 19/05/1959 – 30/04/1975 hoặc Khoảng thế kỷ XIX',
} as const;

type PrecisionTab = 'YEAR' | 'CENTURY' | 'APPROXIMATE' | 'DAY' | 'FREE_TEXT';

interface CenturyOption {
  value: number;
  label: string;
}

const CENTURY_OPTIONS: CenturyOption[] = Array.from({ length: 21 }, (_, i) => {
  const num = i + 1;
  return {
    value: num,
    label: `Thế kỷ ${toRomanNumeral(num)} (TK ${num})`,
  };
});

/**
 * Component chuẩn hóa Nhập liệu Thời gian Lịch sử theo Enum DatePrecision.
 * Đảm bảo:
 *   1. Xử lý ngầm: Tự động trích xuất số năm đại diện trên Timeline, endYear và datePrecision.
 *   2. Hiển thị trực quan: Cung cấp bộ chọn theo chuẩn Enum + Bảng phản hồi (Live Visual Mapping Card)
 *      giúp người biên tập thấy rõ ràng hệ thống đã quy đổi ra sao.
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
  // Tab chuẩn hóa độ chính xác đang chọn
  const [activeTab, setActiveTab] = useState<PrecisionTab>(() => {
    if (parsedStart.precision === DatePrecision.CENTURY) return 'CENTURY';
    if (parsedStart.precision === DatePrecision.APPROXIMATE) return 'APPROXIMATE';
    if (parsedStart.precision === DatePrecision.DAY) return 'DAY';
    return 'YEAR';
  });

  // State điều khiển cho bộ chọn Thế kỷ
  const [centuryNum, setCenturyNum] = useState<number>(19);
  const [centurySubPeriod, setCenturySubPeriod] = useState<string>('khoảng');

  // State điều khiển cho bộ chọn Năm ước lượng
  const [approxPrefix, setApproxPrefix] = useState<string>('Khoảng năm');
  const [approxYear, setApproxYear] = useState<string>('938');

  // Tự động nhận diện tab phù hợp khi parsedStart thay đổi từ ngoài vào
  useEffect(() => {
    if (!startDateInput.trim()) return;
    if (parsedStart.precision === DatePrecision.CENTURY) {
      setActiveTab('CENTURY');
    } else if (parsedStart.precision === DatePrecision.APPROXIMATE) {
      setActiveTab('APPROXIMATE');
    } else if (parsedStart.precision === DatePrecision.DAY) {
      setActiveTab('DAY');
    } else if (parsedStart.precision === DatePrecision.YEAR) {
      setActiveTab('YEAR');
    }
  }, [parsedStart.precision, startDateInput]);

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

  // Cập nhật khi người dùng chọn trong giao diện chuyên biệt Thế kỷ
  const applyCenturySelection = (num: number, sub: string, bce: boolean) => {
    const roman = toRomanNumeral(num);
    let text = '';
    if (sub === 'khoảng') {
      text = `Khoảng thế kỷ ${roman}`;
    } else if (sub === 'đầu') {
      text = `Đầu thế kỷ ${roman}`;
    } else if (sub === 'giữa') {
      text = `Giữa thế kỷ ${roman}`;
    } else if (sub === 'cuối') {
      text = `Cuối thế kỷ ${roman}`;
    } else {
      text = `Thế kỷ ${roman}`;
    }

    if (bce) {
      text += ' TCN';
    }
    onStartIsBceChange(bce);
    onStartDateInputChange(text);
  };

  // Cập nhật khi người dùng chọn trong giao diện chuyên biệt Năm ước lượng
  const applyApproximateSelection = (prefix: string, yearVal: string, bce: boolean) => {
    const cleanYear = yearVal.replace(/\D/g, '');
    let text = `${prefix} ${cleanYear}`.trim();
    if (bce && cleanYear) {
      text += ' TCN';
    }
    onStartIsBceChange(bce);
    onStartDateInputChange(text);
  };

  return (
    <div className="space-y-4">
      {/* 1. Switch chọn kiểu mốc thời gian: Một thời điểm | Khoảng thời gian */}
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

      {/* 2. Thanh chuẩn hóa Độ chính xác niên đại (Date Precision Selector) */}
      <div className="p-3 bg-amber-50/40 border border-amber-200/70 rounded-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <span>🏷️ Chuẩn độ chính xác niên đại:</span>
          </span>
          <div className="inline-flex flex-wrap gap-1 p-0.5 bg-white/90 rounded-xl border border-amber-200/80">
            {[
              { id: 'CENTURY' as PrecisionTab, label: 'Thế kỷ (CENTURY)' },
              { id: 'YEAR' as PrecisionTab, label: 'Năm cụ thể (YEAR)' },
              { id: 'APPROXIMATE' as PrecisionTab, label: 'Ước lượng (APPROX)' },
              { id: 'DAY' as PrecisionTab, label: 'Ngày/Tháng (DAY)' },
              { id: 'FREE_TEXT' as PrecisionTab, label: 'Gõ tự do' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'CENTURY') {
                      applyCenturySelection(centuryNum, centurySubPeriod, startIsBce);
                    } else if (tab.id === 'APPROXIMATE') {
                      applyApproximateSelection(approxPrefix, approxYear, startIsBce);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2A. Bộ chọn chuyên biệt: THẾ KỶ (CENTURY) */}
        {activeTab === 'CENTURY' && (
          <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Chọn Thế kỷ:
              </label>
              <select
                value={centuryNum}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCenturyNum(val);
                  applyCenturySelection(val, centurySubPeriod, startIsBce);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600"
              >
                {CENTURY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phân đoạn:
              </label>
              <select
                value={centurySubPeriod}
                onChange={(e) => {
                  setCenturySubPeriod(e.target.value);
                  applyCenturySelection(centuryNum, e.target.value, startIsBce);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600"
              >
                <option value="khoảng">Khoảng thế kỷ (Ước lệ)</option>
                <option value="toan_bo">Toàn bộ thế kỷ</option>
                <option value="đầu">Đầu thế kỷ</option>
                <option value="giữa">Giữa thế kỷ</option>
                <option value="cuối">Cuối thế kỷ</option>
              </select>
            </div>

            <div className="sm:col-span-3 pt-4 sm:pt-3">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={startIsBce}
                  onChange={(e) => {
                    onStartIsBceChange(e.target.checked);
                    applyCenturySelection(centuryNum, centurySubPeriod, e.target.checked);
                  }}
                  className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                />
                <span>{DEFAULT_LABELS.BCE_FULL}</span>
              </label>
            </div>
          </div>
        )}

        {/* 2B. Bộ chọn chuyên biệt: NĂM ƯỚC LƯỢNG (APPROXIMATE) */}
        {activeTab === 'APPROXIMATE' && (
          <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tiền tố ước lượng:
              </label>
              <select
                value={approxPrefix}
                onChange={(e) => {
                  setApproxPrefix(e.target.value);
                  applyApproximateSelection(e.target.value, approxYear, startIsBce);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600"
              >
                <option value="Khoảng năm">Khoảng năm (VD: Khoảng năm 938)</option>
                <option value="Ước chừng năm">Ước chừng năm</option>
                <option value="Vào khoảng năm">Vào khoảng năm</option>
                <option value="~">Ký hiệu xấp xỉ (~)</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Số năm ước lượng:
              </label>
              <input
                type="text"
                value={approxYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setApproxYear(val);
                  applyApproximateSelection(approxPrefix, val, startIsBce);
                }}
                placeholder="Ví dụ: 938, 1288..."
                className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="sm:col-span-3 pt-4 sm:pt-3">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={startIsBce}
                  onChange={(e) => {
                    onStartIsBceChange(e.target.checked);
                    applyApproximateSelection(approxPrefix, approxYear, e.target.checked);
                  }}
                  className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                />
                <span>{DEFAULT_LABELS.BCE_FULL}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. Ô Nhập liệu Linh hoạt + Checkbox TCN */}
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
            <span className="text-[11px] text-rose-600 mt-1 block font-medium">
              ⚠️ {parsedStart.error}
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
              <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                ⚠️ {parsedEnd.error}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Khung Phản hồi Trực quan Kết quả Ánh xạ Ngầm (Live Visual Mapping Card) */}
      {startDateInput.trim() && parsedStart.valid && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đã xác lập niên đại thành công:</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-300/80">
              {DATE_PRECISION_LABELS[parsedStart.precision || DatePrecision.YEAR]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700 border-t border-emerald-200/50">
            <div>
              <span className="text-slate-500">📍 Mốc số học Timeline: </span>
              <span className="font-mono font-bold text-slate-900">
                {parsedStart.signedYear !== null && parsedStart.signedYear < 0
                  ? `${Math.abs(parsedStart.signedYear)} TCN`
                  : `Năm ${parsedStart.signedYear}`}
                {parsedStart.approxEndYear !== undefined && parsedStart.approxEndYear !== null
                  ? ` – ${
                      parsedStart.approxEndYear < 0
                        ? `${Math.abs(parsedStart.approxEndYear)} TCN`
                        : `Năm ${parsedStart.approxEndYear}`
                    }`
                  : ''}
              </span>
            </div>

            <div>
              <span className="text-slate-500">🏷️ Hiển thị trước độc giả: </span>
              <span className="font-semibold text-emerald-950">
                &ldquo;{displayValue || parsedStart.displayPoint}&rdquo;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Thời gian hiển thị trước độc giả + nút [Tùy chỉnh] */}
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
        <p className="text-[11px] text-slate-400 mt-1">
          {isCustomDisplayMode
            ? 'Đang ở chế độ Tùy chỉnh: Bạn có thể chỉnh sửa chuỗi chữ hiển thị theo ý muốn.'
            : 'Chuỗi này sẽ tự động hiển thị trên thẻ card danh sách và trang chi tiết bài viết.'}
        </p>
      </div>
    </div>
  );
}
