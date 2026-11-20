'use client';

import React from 'react';
import {
  INSPECTOR_INPUT_CLS,
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  INSPECTOR_SELECT_CLS,
  InspectorAccordionSection,
  InspectorFieldRow,
} from '@/components/common/TextStyleControls';
import {
  CalloutBlockData,
  CalloutVariant,
  HeadingBlockData,
  LessonBlockItem,
  QuoteBlockData,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
} from '../../../types/block-builder.types';
import { CALLOUT_VARIANT_OPTIONS } from '../../../constants/lesson.constants';

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

export function CalloutBlockInspector({
  block: callout,
  onUpdateBlock,
}: SimpleInspectorProps<CalloutBlockData>) {
  return (
    <InspectorAccordionSection title="Hộp ghi chú">
      <InspectorFieldRow label="Sắc thái">
        <select
          aria-label="Sắc thái hộp thoại"
          value={callout.variant}
          onChange={(e) =>
            onUpdateBlock(callout.id, {
              variant: e.target.value as CalloutVariant,
            })
          }
          className={`${INSPECTOR_SELECT_CLS} w-44`}
        >
          {CALLOUT_VARIANT_OPTIONS.map((opt) => (
            <option key={opt.variant} value={opt.variant}>
              {opt.inspectorLabel}
            </option>
          ))}
        </select>
      </InspectorFieldRow>
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
