import { sanitizeRichHtml } from '@/utils/common';
import {
  resolveCalloutBoxStyleOption,
  resolveCalloutIcon,
  resolveCalloutMediaAlignOption,
  resolveCalloutOption,
} from '../constants/callout.constants';
import {
  CalloutBlockData,
  CalloutBoxStyle,
  CalloutMediaConfig,
  CalloutVariant,
} from '../types/block-builder.types';
import { LessonBlockType } from '../types/editor.types';
import { BlockPlugin, BlockWidth, escapeHtml, safeUrl } from './block-plugin.types';

const HTML_TAG_REGEX = /<[a-z][\s\S]*>/i;

function renderCalloutBodyHtml(rawContent?: string): string {
  const trimmed = (rawContent || '').trim();
  if (!trimmed) return '';
  if (HTML_TAG_REGEX.test(trimmed)) {
    return sanitizeRichHtml(trimmed);
  }
  return escapeHtml(trimmed).replace(/\n/g, '<br />');
}

function renderCalloutMediaHtml(media?: CalloutMediaConfig): string {
  const src = media?.src?.trim();
  if (!src) return '';
  const alignMeta = resolveCalloutMediaAlignOption(media?.align);
  const captionText = media?.caption?.trim() || '';
  const altText = captionText || 'Ảnh minh họa';
  return `<figure class="hisgo-callout-media ${alignMeta.cssModifier}"><img src="${safeUrl(src)}" alt="${escapeHtml(altText)}" class="hisgo-callout-media-img" />${captionText ? `<figcaption class="hisgo-callout-media-caption">${escapeHtml(captionText)}</figcaption>` : ''}</figure>`;
}

function buildCalloutClassName(...modifiers: Array<string | undefined>): string {
  return ['hisgo-callout', ...modifiers].filter(Boolean).join(' ');
}

export const calloutBlockPlugin: BlockPlugin<CalloutBlockData> = {
  type: LessonBlockType.CALLOUT,
  createDefault: (id: string, defaultWidth: BlockWidth): CalloutBlockData => ({
    id,
    type: LessonBlockType.CALLOUT,
    width: defaultWidth,
    variant: CalloutVariant.HISTORICAL_NOTE,
    boxStyle: CalloutBoxStyle.LEFT_ACCENT,
    title: '',
    content: '',
  }),
  toHtml: (block: CalloutBlockData): string => {
    const meta = resolveCalloutOption(block.variant);
    const boxStyleMeta = resolveCalloutBoxStyleOption(block.boxStyle);
    const icon = resolveCalloutIcon(block);
    const titleText = (block.title || '').trim();
    const innerBodyHtml = `${renderCalloutMediaHtml(block.media)}${renderCalloutBodyHtml(block.content)}`;
    const iconHtml = icon
      ? `<span class="hisgo-callout-icon" aria-hidden="true">${escapeHtml(icon)}</span>`
      : '';
    const bodySectionHtml = innerBodyHtml ? `<div class="hisgo-callout-body">${innerBodyHtml}</div>` : '';

    if (block.collapsible) {
      const cls = buildCalloutClassName('hisgo-callout--collapsible', meta.cssModifier, boxStyleMeta.cssModifier);
      return `
      <details class="${cls}">
        <summary class="hisgo-callout-summary">${iconHtml}<span class="hisgo-callout-title-text">${escapeHtml(titleText || 'Xem ghi chú')}</span></summary>
        ${bodySectionHtml}
      </details>`;
    }

    if (titleText || boxStyleMeta.value === CalloutBoxStyle.HEADER_BAR) {
      const cls = buildCalloutClassName(meta.cssModifier, boxStyleMeta.cssModifier);
      const displayTitle = titleText || 'Thông tin bổ sung';
      return `
      <div class="${cls}">
        <div class="hisgo-callout-title">${iconHtml}<span>${escapeHtml(displayTitle)}</span></div>
        ${bodySectionHtml}
      </div>`;
    }

    const compactCls = buildCalloutClassName('hisgo-callout--compact', meta.cssModifier, boxStyleMeta.cssModifier);
    return `
      <div class="${compactCls}">
        ${iconHtml}<div class="hisgo-callout-body">${innerBodyHtml}</div>
      </div>`;
  },
};
