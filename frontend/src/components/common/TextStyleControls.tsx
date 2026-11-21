'use client';

import React, { useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react';

export enum TextAlignMode {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify',
}

export enum TextCaseMode {
  NONE = 'none',
  UPPERCASE = 'uppercase',
  CAPITALIZE = 'capitalize',
}

export interface TextStyleValue {
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  textTransform?: TextCaseMode;
  textAlign?: TextAlignMode;
}

export const HISGO_FONT_FAMILIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'var(--font-be-vietnam-pro), sans-serif', label: 'Hiện đại (Be Vietnam)' },
  { value: 'var(--font-merriweather), serif', label: 'Cổ điển (Merriweather)' },
  { value: 'var(--font-noto-serif), serif', label: 'Biên niên sử (Noto)' },
  { value: 'monospace', label: 'Hành chính (Mono)' },
];

export const TEXT_FONT_SIZES: readonly number[] = [11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36];

export const INSPECTOR_SELECT_CLS =
  'rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-45';

export const INSPECTOR_INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white';

export const INSPECTOR_SEG_GROUP_CLS =
  'divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200';

export const INSPECTOR_SEG_BTN_IDLE = 'bg-white text-slate-700 hover:bg-slate-50';
export const INSPECTOR_SEG_BTN_ACTIVE = 'bg-indigo-600 text-white font-semibold';

export const INSPECTOR_COLOR_INPUT_CLS =
  'h-7 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5 disabled:opacity-40';

const BASE_ALIGN_OPTIONS: ReadonlyArray<{
  id: TextAlignMode;
  label: string;
  Icon: typeof AlignLeft;
}> = [
  { id: TextAlignMode.LEFT, label: 'Căn trái', Icon: AlignLeft },
  { id: TextAlignMode.CENTER, label: 'Căn giữa', Icon: AlignCenter },
  { id: TextAlignMode.RIGHT, label: 'Căn phải', Icon: AlignRight },
];

const JUSTIFY_ALIGN_OPTION = {
  id: TextAlignMode.JUSTIFY,
  label: 'Căn đều hai bên',
  Icon: AlignJustify,
} as const;

function nextCaseMode(curr: TextCaseMode | undefined): TextCaseMode {
  if (curr === TextCaseMode.UPPERCASE) return TextCaseMode.CAPITALIZE;
  if (curr === TextCaseMode.CAPITALIZE) return TextCaseMode.NONE;
  return TextCaseMode.UPPERCASE;
}

/** Khung nhóm thuộc tính đóng/mở (Accordion) chuẩn Mindmap dùng chung cho toàn bộ Inspector. */
export function InspectorAccordionSection({
  title,
  subtitle,
  defaultOpen = true,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-100 pb-3.5 last:border-b-0">
      <div className="flex items-center justify-between gap-2 py-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-left cursor-pointer min-w-0"
        >
          <ChevronDown
            size={13}
            className={`shrink-0 text-slate-500 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          <span className="text-[13px] font-bold text-slate-800 truncate">{title}</span>
          {subtitle && (
            <span className="text-[11px] font-medium text-slate-400 truncate">{subtitle}</span>
          )}
        </button>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {open && <div className="mt-2.5 space-y-2.5 text-xs text-slate-700">{children}</div>}
    </section>
  );
}

/** Hàng thuộc tính 2 cột ngang chuẩn Mindmap (Nhãn bên trái — Điều khiển gọn bên phải). */
export function InspectorFieldRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-600 font-medium">{label}</span>
      {children}
    </div>
  );
}

/** Công tắc bật/tắt chuẩn Mindmap (Indigo Switch). */
export function InspectorToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-40 ${
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block size-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export interface TextStyleControlsProps {
  value: TextStyleValue;
  defaultColor?: string;
  defaultFontSize?: number;
  onChange: (patch: Partial<TextStyleValue>) => void;
  showUnderline?: boolean;
  showCaseTransform?: boolean;
  allowJustify?: boolean;
  disabled?: boolean;
  onButtonMouseDown?: (e: React.MouseEvent) => void;
  topSlot?: React.ReactNode;
}

function buildFormatButtons({
  value,
  caseMode,
  showUnderline,
  showCaseTransform,
  onChange,
}: {
  value: TextStyleValue;
  caseMode: TextCaseMode;
  showUnderline: boolean;
  showCaseTransform: boolean;
  onChange: (patch: Partial<TextStyleValue>) => void;
}) {
  return [
    {
      key: 'bold',
      active: Boolean(value.bold),
      title: 'In đậm',
      content: <Bold size={14} />,
      onClick: () => onChange({ bold: !value.bold }),
    },
    {
      key: 'italic',
      active: Boolean(value.italic),
      title: 'In nghiêng',
      content: <Italic size={14} />,
      onClick: () => onChange({ italic: !value.italic }),
    },
    ...(showUnderline
      ? [
          {
            key: 'underline',
            active: Boolean(value.underline),
            title: 'Gạch chân',
            content: <Underline size={14} />,
            onClick: () => onChange({ underline: !value.underline }),
          },
        ]
      : []),
    {
      key: 'strike',
      active: Boolean(value.strike),
      title: 'Gạch ngang',
      content: <Strikethrough size={14} />,
      onClick: () => onChange({ strike: !value.strike }),
    },
    ...(showCaseTransform
      ? [
          {
            key: 'case',
            active: caseMode !== TextCaseMode.NONE,
            title: 'Chuyển kiểu chữ (Thường / HOA / Viết Hoa Đầu Từ)',
            content: <span className="text-xs font-bold">Aa</span>,
            onClick: () => onChange({ textTransform: nextCaseMode(caseMode) }),
          },
        ]
      : []),
  ];
}

/** Bộ điều khiển thuộc tính văn bản dùng chung cho cả Mindmap và Block Builder. */
export function TextStyleControls({
  value,
  defaultColor = '#1E293B',
  defaultFontSize = 13,
  onChange,
  showUnderline = false,
  showCaseTransform = true,
  allowJustify = false,
  disabled = false,
  onButtonMouseDown,
  topSlot,
}: TextStyleControlsProps) {
  const fontSize = value.fontSize ?? defaultFontSize;
  const textColor = value.textColor ?? defaultColor;
  const textAlign = value.textAlign ?? TextAlignMode.LEFT;
  const fontFamily = value.fontFamily ?? HISGO_FONT_FAMILIES[0].value;
  const caseMode = value.textTransform ?? TextCaseMode.NONE;

  const sizeOptions = TEXT_FONT_SIZES.includes(fontSize)
    ? TEXT_FONT_SIZES
    : [...TEXT_FONT_SIZES, fontSize].sort((a, b) => a - b);

  const formatButtons = buildFormatButtons({
    value,
    caseMode,
    showUnderline,
    showCaseTransform,
    onChange,
  });

  const alignOptions = allowJustify
    ? [...BASE_ALIGN_OPTIONS, JUSTIFY_ALIGN_OPTION]
    : BASE_ALIGN_OPTIONS;

  return (
    <div className="space-y-2.5 text-xs">
      {topSlot}

      <InspectorFieldRow label="Phông chữ">
        <select
          aria-label="Phông chữ"
          disabled={disabled}
          value={fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className={`${INSPECTOR_SELECT_CLS} w-40 max-w-[165px]`}
        >
          {HISGO_FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </InspectorFieldRow>

      <InspectorFieldRow label="Cỡ & Màu">
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Cỡ chữ"
            disabled={disabled}
            value={fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className={`${INSPECTOR_SELECT_CLS} w-20`}
          >
            {sizeOptions.map((px) => (
              <option key={px} value={px}>
                {px}px
              </option>
            ))}
          </select>
          <input
            type="color"
            aria-label="Màu chữ"
            disabled={disabled}
            value={textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className={INSPECTOR_COLOR_INPUT_CLS}
          />
        </div>
      </InspectorFieldRow>

      {/* Thanh nút liền khối B | I | (U) | S | (Aa) */}
      <div
        style={{ gridTemplateColumns: `repeat(${formatButtons.length}, minmax(0, 1fr))` }}
        className={`grid ${INSPECTOR_SEG_GROUP_CLS}`}
      >
        {formatButtons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            disabled={disabled}
            title={btn.title}
            onMouseDown={onButtonMouseDown}
            onClick={btn.onClick}
            className={`grid h-8 place-items-center transition cursor-pointer disabled:opacity-40 ${
              btn.active ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
            }`}
          >
            {btn.content}
          </button>
        ))}
      </div>

      {/* Thanh nút liền khối Căn lề */}
      <div
        style={{ gridTemplateColumns: `repeat(${alignOptions.length}, minmax(0, 1fr))` }}
        className={`grid ${INSPECTOR_SEG_GROUP_CLS}`}
      >
        {alignOptions.map(({ id, label, Icon }) => {
          const active = textAlign === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              title={label}
              onMouseDown={onButtonMouseDown}
              onClick={() => onChange({ textAlign: id })}
              className={`grid h-8 place-items-center transition cursor-pointer disabled:opacity-40 ${
                active ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
