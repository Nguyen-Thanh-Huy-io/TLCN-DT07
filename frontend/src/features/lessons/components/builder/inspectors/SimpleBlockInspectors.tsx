'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { UploadApiService } from '@/services/entities/upload.service';
import { extractErrorMessage } from '@/services/api';
import {
  INSPECTOR_INPUT_CLS,
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  InspectorAccordionSection,
  InspectorFieldRow,
  InspectorToggleSwitch,
} from '@/components/common/TextStyleControls';
import {
  CalloutBlockData,
  CalloutMediaAlign,
  CalloutMediaConfig,
  HeadingBlockData,
  LessonBlockItem,
  QuoteBlockData,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
} from '../../../types/block-builder.types';
import {
  CALLOUT_MEDIA_ALIGN_OPTIONS,
  resolveCalloutMediaAlignOption,
  resolveCalloutOption,
} from '../../../constants/callout.constants';
import {
  CalloutBoxStylePicker,
  CalloutColorSwatchPicker,
  CalloutEmojiControlGroup,
} from '../CalloutBlockItemEditor';

interface SimpleInspectorProps<T extends LessonBlockItem> {
  block: T;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

export function HeadingBlockInspector({
  block: heading,
  onUpdateBlock,
}: SimpleInspectorProps<HeadingBlockData>) {
  return (
    <InspectorAccordionSection title="Kiểu tiêu đề">
      <InspectorFieldRow label="Cấp độ">
        <div className={`grid w-36 grid-cols-4 ${INSPECTOR_SEG_GROUP_CLS}`}>
          {([1, 2, 3, 4] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onUpdateBlock(heading.id, { level: lvl })}
              className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                heading.level === lvl ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}

function CalloutMediaInspectorControls({
  media,
  onChangeMedia,
}: {
  media?: CalloutMediaConfig;
  onChangeMedia: (next?: CalloutMediaConfig) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentAlign = resolveCalloutMediaAlignOption(media?.align).value;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ảnh tối đa 10MB.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const res = await UploadApiService.uploadImage(file);
      if (res?.url) {
        onChangeMedia({ ...media, align: currentAlign, src: res.url });
      } else {
        setUploadError('Tải ảnh lên thất bại.');
      }
    } catch (err) {
      setUploadError(extractErrorMessage(err, 'Lỗi kết nối khi tải ảnh lên.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">Ảnh trong hộp</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          <span>{uploading ? 'Đang tải...' : 'Tải ảnh'}</span>
        </button>
      </div>

      <input
        type="text"
        value={media?.src || ''}
        onChange={(e) => {
          const val = e.target.value;
          onChangeMedia(val.trim() ? { ...media, align: currentAlign, src: val } : undefined);
        }}
        placeholder="Hoặc dán URL ảnh minh họa..."
        aria-label="URL ảnh trong hộp"
        className={INSPECTOR_INPUT_CLS}
      />

      {uploadError && <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>}

      {media?.src && (
        <div className="space-y-2">
          <InspectorFieldRow label="Vị trí ảnh">
            <div className={`grid w-36 grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
              {CALLOUT_MEDIA_ALIGN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeMedia({ ...media, align: opt.value as CalloutMediaAlign })}
                  className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                    currentAlign === opt.value ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </InspectorFieldRow>

          <input
            type="text"
            value={media.caption || ''}
            onChange={(e) => onChangeMedia({ ...media, caption: e.target.value })}
            placeholder="Chú thích ảnh (vd: Hình 1...)"
            aria-label="Chú thích ảnh trong hộp"
            className={INSPECTOR_INPUT_CLS}
          />

          <button
            type="button"
            onClick={() => onChangeMedia(undefined)}
            className="w-full py-1 px-2 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-[11px] font-semibold text-rose-600 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Gỡ ảnh</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function CalloutBlockInspector({
  block: callout,
  onUpdateBlock,
}: SimpleInspectorProps<CalloutBlockData>) {
  const activeOption = resolveCalloutOption(callout.variant);
  return (
    <InspectorAccordionSection title="Hộp ghi chú" subtitle={activeOption.label}>
      <InspectorFieldRow label="Kiểu khung">
        <CalloutBoxStylePicker
          boxStyle={callout.boxStyle}
          onSelect={(boxStyle) => onUpdateBlock(callout.id, { boxStyle })}
        />
      </InspectorFieldRow>

      <InspectorFieldRow label="Màu sắc">
        <CalloutColorSwatchPicker
          variant={callout.variant}
          onSelect={(variant) => onUpdateBlock(callout.id, { variant })}
        />
      </InspectorFieldRow>

      <div className="space-y-1.5">
        <span className="text-slate-600 font-medium block">Biểu tượng</span>
        <CalloutEmojiControlGroup
          icon={callout.icon}
          variant={callout.variant}
          pickerAlign="right"
          onChangeIcon={(icon) => onUpdateBlock(callout.id, { icon })}
        />
      </div>

      <InspectorFieldRow label="Cho phép thu gọn">
        <InspectorToggleSwitch
          checked={Boolean(callout.collapsible)}
          onChange={(next) => onUpdateBlock(callout.id, { collapsible: next })}
          ariaLabel="Cho phép thu gọn hộp ghi chú"
        />
      </InspectorFieldRow>

      <CalloutMediaInspectorControls
        media={callout.media}
        onChangeMedia={(media) => onUpdateBlock(callout.id, { media })}
      />
    </InspectorAccordionSection>
  );
}

export function QuoteBlockInspector({
  block: quote,
  onUpdateBlock,
}: SimpleInspectorProps<QuoteBlockData>) {
  return (
    <InspectorAccordionSection title="Trích dẫn">
      <textarea
        rows={3}
        value={quote.quoteText || ''}
        onChange={(e) => onUpdateBlock(quote.id, { quoteText: e.target.value })}
        placeholder="Lời trích dẫn / danh ngôn…"
        className={`${INSPECTOR_INPUT_CLS} italic font-serif resize-y`}
      />
      <InspectorFieldRow label="Tác giả">
        <input
          type="text"
          value={quote.author || ''}
          onChange={(e) => onUpdateBlock(quote.id, { author: e.target.value })}
          placeholder="VD: Hưng Đạo Đại Vương"
          className={`${INSPECTOR_INPUT_CLS} max-w-[165px]`}
        />
      </InspectorFieldRow>
      <InspectorFieldRow label="Bối cảnh">
        <input
          type="text"
          value={quote.sourceContext || ''}
          onChange={(e) => onUpdateBlock(quote.id, { sourceContext: e.target.value })}
          placeholder="VD: Hội nghị Diên Hồng"
          className={`${INSPECTOR_INPUT_CLS} max-w-[165px]`}
        />
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}

export function RelatedPeopleBlockInspector({
  block: rel,
  onUpdateBlock,
}: SimpleInspectorProps<RelatedPeopleBlockData>) {
  return (
    <InspectorAccordionSection title="Nhân vật liên quan">
      <InspectorFieldRow label="Tiêu đề">
        <input
          type="text"
          value={rel.title || ''}
          onChange={(e) => onUpdateBlock(rel.id, { title: e.target.value })}
          className={`${INSPECTOR_INPUT_CLS} max-w-[165px]`}
        />
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}

export function RelatedEventsBlockInspector({
  block: rel,
  onUpdateBlock,
}: SimpleInspectorProps<RelatedEventsBlockData>) {
  return (
    <InspectorAccordionSection title="Sự kiện liên quan">
      <InspectorFieldRow label="Tiêu đề">
        <input
          type="text"
          value={rel.title || ''}
          onChange={(e) => onUpdateBlock(rel.id, { title: e.target.value })}
          className={`${INSPECTOR_INPUT_CLS} max-w-[165px]`}
        />
      </InspectorFieldRow>
      <InspectorFieldRow label="Mô tả">
        <input
          type="text"
          value={rel.description || ''}
          onChange={(e) => onUpdateBlock(rel.id, { description: e.target.value })}
          className={`${INSPECTOR_INPUT_CLS} max-w-[165px]`}
        />
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}
