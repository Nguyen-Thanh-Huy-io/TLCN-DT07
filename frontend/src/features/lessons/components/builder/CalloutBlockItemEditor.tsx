'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, SmilePlus, X } from 'lucide-react';
import { EmojiPickerButton } from '@/components/common/EmojiPickerButton';
import {
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  InspectorToggleSwitch,
} from '@/components/common/TextStyleControls';
import { TipTapContent } from '../TipTapContent';
import { BlockAudioAttachmentField } from './BlockAudioAttachmentField';
import {
  CalloutBlockData,
  CalloutBoxStyle,
  CalloutVariant,
} from '../../types/block-builder.types';
import {
  CALLOUT_BOX_STYLE_OPTIONS,
  CALLOUT_EMOJI_PRESETS,
  CALLOUT_VARIANT_OPTIONS,
  resolveCalloutBoxStyleOption,
  resolveCalloutIcon,
  resolveCalloutMediaAlignOption,
  resolveCalloutOption,
} from '../../constants/lesson.constants';

export function CalloutColorSwatchPicker({
  variant,
  onSelect,
}: {
  variant?: CalloutVariant;
  onSelect: (variant: CalloutVariant) => void;
}) {
  const activeVariant = resolveCalloutOption(variant).variant;
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Màu sắc hộp ghi chú">
      {CALLOUT_VARIANT_OPTIONS.map((opt) => {
        const isActive = opt.variant === activeVariant;
        return (
          <button
            key={opt.variant}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            title={opt.inspectorLabel}
            onClick={() => onSelect(opt.variant)}
            className={`w-5 h-5 rounded-full transition cursor-pointer ${opt.swatchClass} ${
              isActive
                ? 'ring-2 ring-offset-2 ring-slate-900 scale-105'
                : 'opacity-75 hover:opacity-100 hover:scale-105'
            }`}
          />
        );
      })}
    </div>
  );
}

export function CalloutBoxStylePicker({
  boxStyle,
  onSelect,
}: {
  boxStyle?: CalloutBoxStyle;
  onSelect: (style: CalloutBoxStyle) => void;
}) {
  const active = resolveCalloutBoxStyleOption(boxStyle).value;
  return (
    <div className={`grid grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`} role="radiogroup" aria-label="Kiểu khung hộp ghi chú">
      {CALLOUT_BOX_STYLE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={active === opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-2 py-1 text-[11px] transition cursor-pointer ${
            active === opt.value ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function CalloutEmojiControlGroup({
  icon,
  variant,
  pickerAlign = 'left',
  onChangeIcon,
  onAfterPresetPick,
}: {
  icon?: string;
  variant?: CalloutVariant;
  pickerAlign?: 'left' | 'right';
  onChangeIcon: (nextIcon: string | undefined) => void;
  onAfterPresetPick?: () => void;
}) {
  const activeEmoji = resolveCalloutIcon({ variant, icon });
  return (
    <div className="space-y-2">
      <div className="flex items-center flex-wrap gap-1.5">
        <EmojiPickerButton
          value={icon}
          displayEmoji={activeEmoji}
          triggerLabel="Chọn emoji..."
          allowResetDefault={true}
          align={pickerAlign}
          ariaLabel="Mở thư viện chọn biểu tượng"
          onChange={(next) => {
            onChangeIcon(next);
            if (next) onAfterPresetPick?.();
          }}
        />
        <button
          type="button"
          onClick={() => onChangeIcon('')}
          className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shrink-0 ${
            icon === ''
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Ẩn
        </button>
        {icon !== undefined && (
          <button
            type="button"
            onClick={() => onChangeIcon(undefined)}
            className="px-2 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer shrink-0"
          >
            Mặc định
          </button>
        )}
      </div>
      <div className="grid grid-cols-6 gap-1">
        {CALLOUT_EMOJI_PRESETS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onChangeIcon(emoji);
              onAfterPresetPick?.();
            }}
            className={`h-7 rounded-md text-sm grid place-items-center transition cursor-pointer border ${
              activeEmoji === emoji
                ? 'bg-indigo-50 border-indigo-300'
                : 'bg-white border-transparent hover:bg-slate-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CalloutBlockItemEditor({
  data,
  onChange,
}: {
  data: CalloutBlockData;
  onChange: (updates: Partial<CalloutBlockData>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const currentVariant = resolveCalloutOption(data.variant);
  const boxStyleOpt = resolveCalloutBoxStyleOption(data.boxStyle);
  const isHeaderBar = boxStyleOpt.value === CalloutBoxStyle.HEADER_BAR;
  const isOutlined = boxStyleOpt.value === CalloutBoxStyle.OUTLINED;
  const resolvedIcon = resolveCalloutIcon(data);
  const mediaSrc = data.media?.src?.trim();
  const mediaAlignMeta = resolveCalloutMediaAlignOption(data.media?.align);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [pickerOpen]);

  const containerCls = isHeaderBar
    ? `@container min-w-0 rounded-xl border border-slate-200 transition-colors relative ${currentVariant.editorSurfaceClass}`
    : isOutlined
      ? '@container min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3.5 space-y-2 transition-colors relative'
      : `@container min-w-0 rounded-xl border px-3.5 py-3 @[360px]:px-4 @[360px]:py-3.5 space-y-2 transition-colors relative ${currentVariant.editorBorderClass} ${currentVariant.editorSurfaceClass}`;
  const headerCls = isHeaderBar
    ? `flex items-center gap-2 min-w-0 px-3.5 py-2 rounded-t-[11px] ${currentVariant.headerBarClass}`
    : 'flex items-center gap-2 min-w-0';
  const triggerBtnCls = isHeaderBar
    ? 'w-7 h-7 rounded-lg bg-white/90 hover:bg-white border border-white/40 grid place-items-center transition cursor-pointer shadow-2xs'
    : isOutlined
      ? 'w-7 h-7 rounded-full bg-white hover:bg-slate-50 border border-slate-300 ring-2 ring-white grid place-items-center transition cursor-pointer shadow-sm'
      : 'w-7 h-7 rounded-lg bg-white/85 hover:bg-white border border-slate-200/80 grid place-items-center transition cursor-pointer shadow-2xs';
  const titleInputCls = isHeaderBar
    ? 'min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-bold text-white placeholder:text-white/75 placeholder:font-normal focus:outline-none'
    : 'min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none';
  const bodyWrapperCls = `${isHeaderBar ? 'px-3.5 py-3 @[360px]:px-4' : resolvedIcon && !mediaSrc ? 'pl-9' : ''} flow-root`;

  return (
    <div className={containerCls}>
      <div className={headerCls}>
        <div ref={pickerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            title="Đổi màu sắc, kiểu khung hoặc biểu tượng"
            aria-label="Đổi màu sắc, kiểu khung hoặc biểu tượng"
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
            className={triggerBtnCls}
          >
            {resolvedIcon ? <span className="text-base leading-none">{resolvedIcon}</span> : <SmilePlus className="w-4 h-4 text-slate-400" />}
          </button>

          {pickerOpen && (
            <div role="dialog" aria-label="Tùy chỉnh hộp ghi chú" className="absolute left-0 top-9 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg space-y-3 text-slate-800">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">Kiểu khung</div>
                <CalloutBoxStylePicker boxStyle={data.boxStyle} onSelect={(boxStyle) => onChange({ boxStyle })} />
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">Màu sắc</div>
                <CalloutColorSwatchPicker variant={data.variant} onSelect={(variant) => onChange({ variant })} />
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">Biểu tượng</div>
                <CalloutEmojiControlGroup icon={data.icon} variant={data.variant} onChangeIcon={(icon) => onChange({ icon })} onAfterPresetPick={() => setPickerOpen(false)} />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600">Cho phép thu gọn</span>
                <InspectorToggleSwitch checked={Boolean(data.collapsible)} onChange={(next) => onChange({ collapsible: next })} ariaLabel="Cho phép thu gọn hộp ghi chú" />
              </div>
            </div>
          )}
        </div>

        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Tiêu đề hộp ghi chú (có thể để trống)..."
          aria-label="Tiêu đề hộp ghi chú"
          className={titleInputCls}
        />

        {data.collapsible && (
          <span className={`shrink-0 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isHeaderBar ? 'bg-white/20 border-white/30 text-white' : 'bg-white/85 border-slate-200 text-slate-600'}`}>
            <ChevronDown className="w-3 h-3" />
            <span>Thu gọn</span>
          </span>
        )}
      </div>

      <div className={bodyWrapperCls}>
        {mediaSrc && (
          <figure className={`relative z-10 w-full md:w-[44%] mb-2.5 ${mediaAlignMeta.editorFloatClass} rounded-lg border border-slate-200 bg-white/95 p-1.5`}>
            <button
              type="button"
              onClick={() => onChange({ media: undefined })}
              title="Gỡ ảnh minh họa"
              aria-label="Gỡ ảnh minh họa"
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white grid place-items-center transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaSrc} alt={data.media?.caption || 'Ảnh minh họa'} className="w-full h-auto rounded-md block object-cover" />
            <input
              type="text"
              value={data.media?.caption || ''}
              onChange={(e) => onChange({ media: { ...data.media, src: mediaSrc, caption: e.target.value } })}
              placeholder="Chú thích ảnh (vd: Hình 1...)"
              aria-label="Chú thích ảnh minh họa"
              className="mt-1.5 w-full bg-transparent text-[11px] text-center text-slate-600 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 rounded px-1 py-0.5"
            />
          </figure>
        )}

        <TipTapContent
          value={data.content || ''}
          onChange={(val) => onChange({ content: val })}
          compact={true}
          remoteToolbarOnly={true}
          minHeightClass="!p-0 !bg-transparent !overflow-visible min-h-[52px]"
          placeholder="Nhập nội dung ghi chú (hỗ trợ in đậm, danh sách, Ctrl+K gắn liên kết)..."
        />

        <BlockAudioAttachmentField
          audioUrl={data.audioUrl}
          audioLabel={data.audioLabel}
          onChange={onChange}
          defaultPlaceholder="Ví dụ: Ghi chú âm thanh / giọng đọc thuyết minh..."
        />
      </div>
    </div>
  );
}
