'use client';

import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
} from 'lucide-react';

export enum TextAlignMode {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
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

export const TEXT_FONT_SIZES: readonly number[] = [11, 12, 13, 14, 16, 18, 20, 24, 28];

const ALIGN_OPTIONS: ReadonlyArray<{ id: TextAlignMode; label: string; Icon: typeof AlignLeft }> = [
  { id: TextAlignMode.LEFT, label: 'Căn trái', Icon: AlignLeft },
  { id: TextAlignMode.CENTER, label: 'Căn giữa', Icon: AlignCenter },
  { id: TextAlignMode.RIGHT, label: 'Căn phải', Icon: AlignRight },
];

const SELECT_CLS =
  'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer';
const SEG_BTN_IDLE = 'bg-white text-slate-700 hover:bg-slate-50';
const SEG_BTN_ACTIVE = 'bg-indigo-600 text-white';

function nextCaseMode(curr: TextCaseMode | undefined): TextCaseMode {
  if (curr === TextCaseMode.UPPERCASE) return TextCaseMode.CAPITALIZE;
  if (curr === TextCaseMode.CAPITALIZE) return TextCaseMode.NONE;
  return TextCaseMode.UPPERCASE;
}

/** Bộ điều khiển thuộc tính văn bản dùng chung (Font, Cỡ chữ, Màu, B/I/S/Aa, Căn lề). */
export function TextStyleControls({
  value,
  defaultColor = '#1E293B',
  defaultFontSize = 13,
  onChange,
}: {
  value: TextStyleValue;
  defaultColor?: string;
  defaultFontSize?: number;
  onChange: (patch: Partial<TextStyleValue>) => void;
}) {
  const fontSize = value.fontSize ?? defaultFontSize;
  const textColor = value.textColor ?? defaultColor;
  const textAlign = value.textAlign ?? TextAlignMode.LEFT;
  const fontFamily = value.fontFamily ?? HISGO_FONT_FAMILIES[0].value;
  const caseMode = value.textTransform ?? TextCaseMode.NONE;

  const formatButtons = [
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
    {
      key: 'strike',
      active: Boolean(value.strike),
      title: 'Gạch ngang',
      content: <Strikethrough size={14} />,
      onClick: () => onChange({ strike: !value.strike }),
    },
    {
      key: 'case',
      active: caseMode !== TextCaseMode.NONE,
      title: 'Chuyển kiểu chữ (Thường / HOA / Viết Hoa Đầu Từ)',
      content: <span className="text-xs font-bold">Aa</span>,
      onClick: () => onChange({ textTransform: nextCaseMode(caseMode) }),
    },
  ];

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Phông chữ</span>
        <select
          aria-label="Phông chữ"
          value={fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className={`${SELECT_CLS} max-w-[165px]`}
        >
          {HISGO_FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Cỡ &amp; Màu</span>
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Cỡ chữ"
            value={fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className={`${SELECT_CLS} w-20`}
          >
            {TEXT_FONT_SIZES.map((px) => (
              <option key={px} value={px}>
                {px}px
              </option>
            ))}
          </select>
          <input
            type="color"
            aria-label="Màu chữ"
            value={textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="h-8 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
          />
        </div>
      </div>

      {/* Hàng nút B | I | S | Aa */}
      <div className="grid grid-cols-4 divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
        {formatButtons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            title={btn.title}
            onClick={btn.onClick}
            className={`grid h-8 place-items-center transition cursor-pointer ${
              btn.active ? SEG_BTN_ACTIVE : SEG_BTN_IDLE
            }`}
          >
            {btn.content}
          </button>
        ))}
      </div>

      {/* Hàng nút Căn lề Trái | Giữa | Phải */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
        {ALIGN_OPTIONS.map(({ id, label, Icon }) => {
          const active = textAlign === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onChange({ textAlign: id })}
              className={`grid h-8 place-items-center transition cursor-pointer ${
                active ? SEG_BTN_ACTIVE : SEG_BTN_IDLE
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
