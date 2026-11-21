import {
  CalloutBoxStyle,
  CalloutMediaAlign,
  CalloutVariant,
} from '../types/block-builder.types';

export interface CalloutVariantOption {
  variant: CalloutVariant;
  label: string;
  inspectorLabel: string;
  icon: string;
  cssModifier: string;
  editorBorderClass: string;
  editorSurfaceClass: string;
  headerBarClass: string;
  swatchClass: string;
}

export const CALLOUT_VARIANT_OPTIONS: ReadonlyArray<CalloutVariantOption> = [
  {
    variant: CalloutVariant.HISTORICAL_NOTE,
    label: 'Hổ phách',
    inspectorLabel: 'Hổ phách (Ghi chú)',
    icon: '📜',
    cssModifier: 'hisgo-callout--historical-note',
    editorBorderClass: 'border-amber-200/80 border-l-4 border-l-amber-500',
    editorSurfaceClass: 'bg-amber-50/45',
    headerBarClass: 'bg-amber-600 text-white',
    swatchClass: 'bg-amber-500',
  },
  {
    variant: CalloutVariant.INFO,
    label: 'Xanh lam',
    inspectorLabel: 'Xanh lam (Thông tin)',
    icon: '💡',
    cssModifier: 'hisgo-callout--info',
    editorBorderClass: 'border-sky-200/80 border-l-4 border-l-blue-600',
    editorSurfaceClass: 'bg-sky-50/45',
    headerBarClass: 'bg-sky-700 text-white',
    swatchClass: 'bg-blue-600',
  },
  {
    variant: CalloutVariant.WARNING,
    label: 'Đỏ son',
    inspectorLabel: 'Đỏ son (Lưu ý / Tranh luận)',
    icon: '⚠️',
    cssModifier: 'hisgo-callout--warning',
    editorBorderClass: 'border-rose-200/80 border-l-4 border-l-rose-600',
    editorSurfaceClass: 'bg-rose-50/45',
    headerBarClass: 'bg-rose-700 text-white',
    swatchClass: 'bg-rose-600',
  },
  {
    variant: CalloutVariant.SUCCESS,
    label: 'Xanh rêu',
    inspectorLabel: 'Xanh rêu (Điểm sáng / Ý nghĩa)',
    icon: '✨',
    cssModifier: 'hisgo-callout--success',
    editorBorderClass: 'border-emerald-200/80 border-l-4 border-l-emerald-600',
    editorSurfaceClass: 'bg-emerald-50/45',
    headerBarClass: 'bg-emerald-700 text-white',
    swatchClass: 'bg-emerald-600',
  },
  {
    variant: CalloutVariant.NEUTRAL,
    label: 'Trung tính',
    inspectorLabel: 'Xám đá (Trung tính)',
    icon: '📌',
    cssModifier: 'hisgo-callout--neutral',
    editorBorderClass: 'border-slate-200 border-l-4 border-l-slate-500',
    editorSurfaceClass: 'bg-slate-50/70',
    headerBarClass: 'bg-slate-700 text-white',
    swatchClass: 'bg-slate-500',
  },
];

export const CALLOUT_EMOJI_PRESETS: ReadonlyArray<string> = [
  '📌', '💡', '📜', '⚠️', '✨', '📖', '⚔️', '🏛️', '🗓️', '🔍', '💬', '⭐',
];

export interface CalloutBoxStyleOption {
  value: CalloutBoxStyle;
  label: string;
  cssModifier: string;
}

export const CALLOUT_BOX_STYLE_OPTIONS: ReadonlyArray<CalloutBoxStyleOption> = [
  { value: CalloutBoxStyle.LEFT_ACCENT, label: 'Viền trái', cssModifier: '' },
  {
    value: CalloutBoxStyle.HEADER_BAR,
    label: 'Thanh tiêu đề',
    cssModifier: 'hisgo-callout--header-bar',
  },
  {
    value: CalloutBoxStyle.OUTLINED,
    label: 'Đóng khung',
    cssModifier: 'hisgo-callout--outlined',
  },
];

export interface CalloutMediaAlignOption {
  value: CalloutMediaAlign;
  label: string;
  cssModifier: string;
  editorFloatClass: string;
}

export const CALLOUT_MEDIA_ALIGN_OPTIONS: ReadonlyArray<CalloutMediaAlignOption> = [
  {
    value: CalloutMediaAlign.LEFT,
    label: 'Bên trái',
    cssModifier: 'hisgo-callout-media--left',
    editorFloatClass: 'md:float-left md:mr-4',
  },
  {
    value: CalloutMediaAlign.RIGHT,
    label: 'Bên phải',
    cssModifier: 'hisgo-callout-media--right',
    editorFloatClass: 'md:float-right md:ml-4',
  },
];

export function resolveCalloutOption(variant?: CalloutVariant): CalloutVariantOption {
  const target = variant || CalloutVariant.HISTORICAL_NOTE;
  return CALLOUT_VARIANT_OPTIONS.find((opt) => opt.variant === target) ?? CALLOUT_VARIANT_OPTIONS[0];
}

export function resolveCalloutIcon(block: { variant?: CalloutVariant; icon?: string }): string {
  if (block.icon !== undefined) {
    return block.icon.trim();
  }
  return resolveCalloutOption(block.variant).icon;
}

export function resolveCalloutBoxStyleOption(boxStyle?: CalloutBoxStyle): CalloutBoxStyleOption {
  const target = boxStyle || CalloutBoxStyle.LEFT_ACCENT;
  return CALLOUT_BOX_STYLE_OPTIONS.find((opt) => opt.value === target) ?? CALLOUT_BOX_STYLE_OPTIONS[0];
}

export function resolveCalloutMediaAlignOption(align?: CalloutMediaAlign): CalloutMediaAlignOption {
  const target = align || CalloutMediaAlign.RIGHT;
  return CALLOUT_MEDIA_ALIGN_OPTIONS.find((opt) => opt.value === target) ?? CALLOUT_MEDIA_ALIGN_OPTIONS[1];
}
