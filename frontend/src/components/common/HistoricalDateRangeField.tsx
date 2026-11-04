'use client';
import React, { useState, useEffect } from 'react';
import {
  TimelineMode,
  FlexibleDateParseResult,
  toRomanNumeral,
  parseRomanNumeral,
  formatHistoricalYear,
} from '@/utils/history-year.utils';
import { DatePrecision } from '@/constants/enums';

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

type PrecisionMode = 'CENTURY' | 'YEAR' | 'APPROXIMATE' | 'DAY' | 'FREE_TEXT';

interface CenturyOption {
  value: number;
  label: string;
  roman: string;
  searchText: string;
}

const CENTURY_OPTIONS: CenturyOption[] = Array.from({ length: 21 }, (_, i) => {
  const num = i + 1;
  const roman = toRomanNumeral(num);
  return {
    value: num,
    label: `Thế kỷ ${roman} (TK ${num})`,
    roman,
    searchText: `${num} ${roman.toLowerCase()} thế kỷ ${num} tk ${num}`,
  };
});

/**
 * Combobox Chọn Thế Kỷ có tìm kiếm nhanh (Select with Search).
 * Cho phép gõ số (19, 10), số La Mã (XIX, X) hoặc chọn từ danh sách gợi ý.
 */
function CenturyCombobox({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOpt = CENTURY_OPTIONS.find((opt) => opt.value === value) || CENTURY_OPTIONS[18];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return CENTURY_OPTIONS;
    const q = searchQuery.trim().toLowerCase();
    return CENTURY_OPTIONS.filter((opt) => opt.searchText.includes(q));
  }, [searchQuery]);

  const handleSelect = (num: number) => {
    onChange(num);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Ô kích hoạt / gõ tìm kiếm */}
      <div
        className={`w-full text-xs font-semibold px-3 py-2 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition shadow-2xs ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-100'
            : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredOptions[0]) {
                handleSelect(filteredOptions[0].value);
              } else if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            placeholder="Gõ số (19) hoặc La Mã (XIX)..."
            className="w-full text-xs font-semibold bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
            autoFocus
          />
        ) : (
          <span className="text-slate-800 truncate">
            {selectedOpt.label}
          </span>
        )}

        <div className="flex items-center gap-1 ml-1 text-slate-400 text-[10px]">
          <span>▾</span>
        </div>
      </div>

      {/* Popover danh sách gợi ý */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full max-h-52 overflow-y-auto rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Gợi ý thế kỷ (Gõ để lọc nhanh)
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-amber-800 font-bold">
                      {opt.roman}
                    </span>
                    <span>Thế kỷ {opt.roman}</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    TK {opt.value}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-center text-slate-400 text-xs">
              Không tìm thấy thế kỷ phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sub-component điều khiển độc lập cho một mốc thời gian (Bắt đầu hoặc Kết thúc).
 * Cho phép mỗi mốc tự do chọn định dạng của riêng mình (Thế kỷ, Năm, Ước lượng, Ngày/Tháng).
 */
interface SingleDatePointControlProps {
  title: string;
  isRequired?: boolean;
  value: string;
  onChange: (val: string) => void;
  isBce: boolean;
  onIsBceChange: (bce: boolean) => void;
  parsed: FlexibleDateParseResult;
  placeholder?: string;
}

function SingleDatePointControl({
  title,
  isRequired = false,
  value,
  onChange,
  isBce,
  onIsBceChange,
  parsed,
  placeholder,
}: SingleDatePointControlProps) {
  // Nhận diện mode ban đầu dựa trên parsed.precision hoặc text
  const detectMode = (): PrecisionMode => {
    if (!value.trim()) return 'YEAR';
    if (parsed.precision === DatePrecision.CENTURY || /thế\s*k[ỷi]|tk/i.test(value)) {
      return 'CENTURY';
    }
    if (parsed.precision === DatePrecision.APPROXIMATE || /khoảng\s+năm|ước\s*chừng|~/i.test(value)) {
      return 'APPROXIMATE';
    }
    if (parsed.precision === DatePrecision.DAY || parsed.precision === DatePrecision.MONTH || /\//.test(value)) {
      return 'DAY';
    }
    if (/^\d{1,4}$/.test(value.trim())) {
      return 'YEAR';
    }
    return 'FREE_TEXT';
  };

  const [mode, setMode] = useState<PrecisionMode>(detectMode);

  // Trích xuất số thế kỷ từ text hiện tại (hoặc mặc định 19)
  const [centuryNum, setCenturyNum] = useState<number>(() => {
    const match = value.match(/(?:thế\s*k[ỷi]|tk)\s+([ivxlcdm]+|\d+)/i);
    if (match) {
      const raw = match[1];
      return /^\d+$/.test(raw) ? parseInt(raw, 10) : parseRomanNumeral(raw) || 19;
    }
    return 19;
  });

  // Trích xuất phân đoạn thế kỷ
  const [centurySub, setCenturySub] = useState<string>(() => {
    if (/đầu\s+thế\s*k[ỷi]/i.test(value)) return 'dau';
    if (/giữa\s+thế\s*k[ỷi]/i.test(value)) return 'giua';
    if (/cuối\s+thế\s*k[ỷi]/i.test(value)) return 'cuoi';
    if (/khoảng\s+thế\s*k[ỷi]/i.test(value)) return 'khoang';
    return 'khoang';
  });

  // Trích xuất năm ước lượng
  const [approxPrefix, setApproxPrefix] = useState<string>('Khoảng năm');
  const [approxYear, setApproxYear] = useState<string>(() => {
    const num = value.replace(/\D/g, '');
    return num || '938';
  });

  // Đồng bộ khi value bên ngoài thay đổi
  useEffect(() => {
    if (!value.trim()) return;
    const newMode = detectMode();
    setMode(newMode);

    if (newMode === 'CENTURY') {
      const match = value.match(/(?:thế\s*k[ỷi]|tk)\s+([ivxlcdm]+|\d+)/i);
      if (match) {
        const raw = match[1];
        const parsedNum = /^\d+$/.test(raw) ? parseInt(raw, 10) : parseRomanNumeral(raw);
        if (parsedNum) setCenturyNum(parsedNum);
      }
    }
  }, [value]);

  const applyCentury = (num: number, sub: string, bce: boolean) => {
    const roman = toRomanNumeral(num);
    let str = '';
    if (sub === 'dau') str = `Đầu thế kỷ ${roman}`;
    else if (sub === 'giua') str = `Giữa thế kỷ ${roman}`;
    else if (sub === 'cuoi') str = `Cuối thế kỷ ${roman}`;
    else if (sub === 'toan_bo') str = `Thế kỷ ${roman}`;
    else str = `Khoảng thế kỷ ${roman}`;

    if (bce) str += ' TCN';
    onIsBceChange(bce);
    onChange(str);
  };

  const applyApprox = (prefix: string, yVal: string, bce: boolean) => {
    const clean = yVal.replace(/\D/g, '');
    let str = `${prefix} ${clean}`.trim();
    if (bce && clean) str += ' TCN';
    onIsBceChange(bce);
    onChange(str);
  };

  const handleModeChange = (newMode: PrecisionMode) => {
    setMode(newMode);
    if (newMode === 'CENTURY') {
      applyCentury(centuryNum, centurySub, isBce);
    } else if (newMode === 'APPROXIMATE') {
      applyApprox(approxPrefix, approxYear, isBce);
    } else if (newMode === 'YEAR') {
      const clean = value.replace(/\D/g, '') || '1975';
      onChange(clean);
    } else if (newMode === 'DAY') {
      if (!value.includes('/')) {
        onChange('30/04/1975');
      }
    }
  };

  return (
    <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-3">
      {/* Hàng Header: Tên mốc + Dropdown Định dạng + Checkbox TCN */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
          {title} {isRequired && <span className="text-rose-500">*</span>}
        </span>

        <div className="flex items-center gap-3">
          {/* Dropdown Định dạng */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-500">Định dạng:</span>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as PrecisionMode)}
              className="text-xs font-semibold py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="CENTURY">Thế kỷ</option>
              <option value="YEAR">Năm cụ thể</option>
              <option value="APPROXIMATE">Ước lượng</option>
              <option value="DAY">Ngày / Tháng / Năm</option>
              <option value="FREE_TEXT">Gõ tự do</option>
            </select>
          </div>

          {/* Checkbox Trước CN gắn liền với mốc này */}
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={isBce}
              onChange={(e) => {
                const bce = e.target.checked;
                onIsBceChange(bce);
                if (mode === 'CENTURY') {
                  applyCentury(centuryNum, centurySub, bce);
                } else if (mode === 'APPROXIMATE') {
                  applyApprox(approxPrefix, approxYear, bce);
                }
              }}
              className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
            />
            <span>Trước CN</span>
          </label>
        </div>
      </div>

      {/* Khung nhập liệu tương ứng theo định dạng */}
      <div>
        {/* 1. Định dạng: THẾ KỶ */}
        {mode === 'CENTURY' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="block text-[11px] text-slate-500 mb-1">Chọn thế kỷ:</span>
              <CenturyCombobox
                value={centuryNum}
                onChange={(val) => {
                  setCenturyNum(val);
                  applyCentury(val, centurySub, isBce);
                }}
              />
            </div>

            <div>
              <span className="block text-[11px] text-slate-500 mb-1">Phân đoạn ước lượng:</span>
              <select
                value={centurySub}
                onChange={(e) => {
                  setCenturySub(e.target.value);
                  applyCentury(centuryNum, e.target.value, isBce);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="khoang">Khoảng thế kỷ (Ước lệ)</option>
                <option value="toan_bo">Cả thế kỷ (Toàn bộ)</option>
                <option value="dau">Đầu thế kỷ</option>
                <option value="giua">Giữa thế kỷ</option>
                <option value="cuoi">Cuối thế kỷ</option>
              </select>
            </div>
          </div>
        )}

        {/* 2. Định dạng: NĂM CỤ THỂ */}
        {mode === 'YEAR' && (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ví dụ: 1975, 938, 1288..."
              className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>
        )}

        {/* 3. Định dạng: ƯỚC LƯỢNG */}
        {mode === 'APPROXIMATE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="block text-[11px] text-slate-500 mb-1">Tiền tố:</span>
              <select
                value={approxPrefix}
                onChange={(e) => {
                  setApproxPrefix(e.target.value);
                  applyApprox(e.target.value, approxYear, isBce);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="Khoảng năm">Khoảng năm</option>
                <option value="Ước chừng năm">Ước chừng năm</option>
                <option value="Vào khoảng năm">Vào khoảng năm</option>
                <option value="~">Ký hiệu xấp xỉ (~)</option>
              </select>
            </div>

            <div>
              <span className="block text-[11px] text-slate-500 mb-1">Số năm ước lượng:</span>
              <input
                type="text"
                value={approxYear}
                onChange={(e) => {
                  setApproxYear(e.target.value);
                  applyApprox(approxPrefix, e.target.value, isBce);
                }}
                placeholder="Ví dụ: 938"
                className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* 4. Định dạng: NGÀY / THÁNG / NĂM */}
        {mode === 'DAY' && (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="DD/MM/YYYY hoặc MM/YYYY (VD: 30/04/1975 hoặc 05/1959)"
              className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>
        )}

        {/* 5. Định dạng: GÕ TỰ DO */}
        {mode === 'FREE_TEXT' && (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'Gõ niên đại tùy ý (VD: Khoảng thế kỷ 19, Thời Hùng Vương...)'}
              className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>
        )}

        {/* Thông báo lỗi nhẹ nhàng nếu không hợp lệ */}
        {value.trim() && !parsed.valid && (
          <p className="text-[11px] text-rose-500 mt-1 font-medium">
            ⚠️ {parsed.error || 'Định dạng chưa hợp lệ.'}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Component hoàn thiện giao diện Niên đại Lịch sử (Clean Card Wireframe)
 * Tuân thủ 3 nguyên tắc tinh gọn:
 *   1. Bỏ code kỹ thuật, 100% tiếng Việt tự nhiên (Thế kỷ, Năm, Ước lượng, Ngày/Tháng).
 *   2. Mốc bắt đầu và Kết thúc độc lập (Mỗi bên tự chọn định dạng và có checkbox Trước CN riêng).
 *   3. Preview tĩnh thanh lịch: Dòng Xem trước + Trục số Timeline, nút [Sửa hiển thị] toggle tại chỗ.
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
  pointLabel = 'Mốc thời gian diễn ra',
  startLabel = 'Mốc bắt đầu',
  endLabel = 'Mốc kết thúc',
}: HistoricalDateRangeFieldProps) {
  // Tính toán tóm tắt trục số Timeline
  const formatYearLabel = (y: number | null | undefined) => {
    if (y === null || y === undefined) return 'Chưa rõ';
    return y < 0 ? `${Math.abs(y)} TCN` : `${y}`;
  };

  const timelineCoordinateSummary = React.useMemo(() => {
    if (!parsedStart.valid || parsedStart.signedYear === null) {
      return 'Chưa xác định tọa độ trên trục thời gian';
    }

    const startYearStr = formatYearLabel(parsedStart.signedYear);

    if (timelineMode === TimelineMode.RANGE) {
      const endYearStr = parsedEnd.valid && parsedEnd.signedYear !== null
        ? formatYearLabel(parsedEnd.signedYear)
        : formatYearLabel(parsedStart.approxEndYear);
      return `Năm ${startYearStr} ──────► Năm ${endYearStr}`;
    }

    // POINT
    if (parsedStart.approxEndYear) {
      return `Năm ${startYearStr} ───► Năm ${formatYearLabel(parsedStart.approxEndYear)} (Khoảng thế kỷ)`;
    }
    return `Năm ${startYearStr}`;
  }, [timelineMode, parsedStart, parsedEnd]);

  const activeDisplayPreview = displayValue.trim() || parsedStart.displayPoint || 'Chưa có mốc thời gian';

  return (
    <div className="space-y-4">
      {/* 1. Kiểu mốc thời gian (Segmented Control gọn gàng) */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
        <span className="text-xs font-semibold text-slate-700">
          Kiểu mốc thời gian:
        </span>
        <div className="inline-flex p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
          {[
            { mode: TimelineMode.POINT, label: 'Một thời điểm' },
            { mode: TimelineMode.RANGE, label: 'Khoảng thời gian' },
          ].map((tab) => {
            const active = timelineMode === tab.mode;
            return (
              <button
                key={tab.mode}
                type="button"
                onClick={() => onTimelineModeChange(tab.mode)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Khối Mốc Bắt đầu & Mốc Kết thúc (Độc lập 100%) */}
      <div
        className={`grid grid-cols-1 ${
          timelineMode === TimelineMode.RANGE ? 'lg:grid-cols-2' : ''
        } gap-3`}
      >
        {/* Mốc bắt đầu */}
        <SingleDatePointControl
          title={timelineMode === TimelineMode.RANGE ? startLabel : pointLabel}
          isRequired={true}
          value={startDateInput}
          onChange={onStartDateInputChange}
          isBce={startIsBce}
          onIsBceChange={onStartIsBceChange}
          parsed={parsedStart}
        />

        {/* Mốc kết thúc (chỉ hiện khi chọn Khoảng thời gian) */}
        {timelineMode === TimelineMode.RANGE && (
          <SingleDatePointControl
            title={endLabel}
            isRequired={false}
            value={endDateInput}
            onChange={onEndDateInputChange}
            isBce={endIsBce}
            onIsBceChange={onEndIsBceChange}
            parsed={parsedEnd}
          />
        )}
      </div>

      {/* 3. Hiển thị trên Timeline & Bài viết (Clean Card thanh lịch) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Xem trước độc giả:</span>
            {!isCustomDisplayMode ? (
              <span className="font-bold text-slate-900 text-xs">
                &ldquo;{activeDisplayPreview}&rdquo;
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onToggleCustomDisplayMode}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
          >
            {isCustomDisplayMode ? 'Quay về tự động' : 'Sửa hiển thị'}
          </button>
        </div>

        {/* Khi bấm [Sửa hiển thị] -> Hiện ô input cho phép gõ đè tại chỗ */}
        {isCustomDisplayMode && (
          <div className="pt-1">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => onDisplayValueChange(e.target.value)}
              placeholder="Nhập chuỗi văn bản tùy biến hiển thị trước độc giả..."
              className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-400 rounded-lg text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Đang chỉnh sửa tự do. Độc giả sẽ nhìn thấy chính xác chuỗi chữ này.
            </span>
          </div>
        )}

        {/* Dòng Trục số Timeline tĩnh, tối giản */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
          <span className="text-slate-400 font-medium">Trục số:</span>
          <span className="font-mono font-bold text-slate-800">
            {timelineCoordinateSummary}
          </span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">
            (Dùng định vị trên Timeline)
          </span>
        </div>
      </div>
    </div>
  );
}
