import { sanitizeRichHtml } from '@/utils/common';
import { LessonBlockType } from '../types/editor.types';
import {
  BlockWidthType,
  CalloutBlockData,
  CalloutBoxStyle,
  CalloutMediaConfig,
  CalloutVariant,
  LessonBlockItem,
  TimelineBlockData,
  TimelineDateFormat,
  TimelineNode,
  TimelineOrientation,
  TimelineSceneStyle,
  TimelineSortOrder,
} from '../types/block-builder.types';
import {
  LEGACY_BLOCK_TYPE_STORY_CHAPTER,
  resolveCalloutBoxStyleOption,
  resolveCalloutIcon,
  resolveCalloutMediaAlignOption,
  resolveCalloutOption,
} from '../constants/lesson.constants';
import {
  BlockWidthStrategy,
  createBlockUUID,
  escapeHtml,
  migrateLegacyStoryChapterToBlocks,
} from '../strategies/row-layout.strategy';
import {
  textBlockPlugin,
  headingBlockPlugin,
  imageBlockPlugin,
  videoBlockPlugin,
  quoteBlockPlugin,
  characterBlockPlugin,
  mapBlockPlugin,
  comparisonTableBlockPlugin,
  quizBlockPlugin,
  dividerBlockPlugin,
  sectionRowBlockPlugin,
  setRowSectionCompiler,
  resourceLinkBlockPlugin,
} from './simple-block.plugins';

export { escapeHtml };

export function safeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^(?:https?:|\/|#)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '#';
}

/** Chuyển đổi các dạng link YouTube (watch, youtu.be, shorts, live) sang URL /embed/ hợp lệ cho iframe. */
export function normalizeVideoEmbedUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
      }
      const match = parsed.pathname.match(/^\/(shorts|live)\/([^/?#]+)/);
      if (match?.[2]) {
        return `https://www.youtube.com/embed/${encodeURIComponent(match[2])}`;
      }
    }
  } catch {
    // Giữ nguyên URL nếu không phải URL đầy đủ
  }
  return trimmed;
}

export function renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
  if (!detailContent) return '';
  return `<details class="hisgo-detail">
    <summary class="hisgo-detail-summary">▸ ${escapeHtml(label)}</summary>
    <div class="hisgo-detail-body">${detailContent}</div>
  </details>`;
}

export type BlockWidth = BlockWidthType | undefined;

export interface BlockPlugin<T extends LessonBlockItem = LessonBlockItem> {
  readonly type: LessonBlockType;
  createDefault: (id: string, defaultWidth: BlockWidth) => T;
  toHtml: (block: T) => string;
}

export const generateBlockId = (prefix: string = 'block'): string => {
  return createBlockUUID(prefix);
};

// --- callout-block.plugin ---
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

// --- timeline-block.plugin (giữ để biên dịch HTML cho dữ liệu bài học cũ có khối TIMELINE) ---
type TimelineNodeRenderer = (
  node: TimelineNode,
  showImage: boolean,
  showLocation: boolean,
) => string;

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.trim());
}

function renderTimelineMediaListHtml(n: TimelineNode, showImage: boolean): string {
  if (!showImage) return '';
  const items: Array<{ type: 'IMAGE' | 'VIDEO'; url: string; caption?: string }> = [];
  if (Array.isArray(n.mediaList)) {
    for (const m of n.mediaList) {
      if (m?.url?.trim()) {
        items.push({ type: m.type, url: m.url.trim(), caption: m.caption });
      }
    }
  }
  if (n.thumbnailUrl?.trim() && !items.some((i) => i.type === 'IMAGE' && i.url === n.thumbnailUrl?.trim())) {
    items.unshift({ type: 'IMAGE', url: n.thumbnailUrl.trim(), caption: n.mediaCaption });
  }
  if (items.length === 0) return '';

  const htmlParts = items
    .map((item) => {
      if (item.type === 'VIDEO') {
        const safeCaption = item.caption ? `<figcaption class="hisgo-timeline-caption">${escapeHtml(item.caption)}</figcaption>` : '';
        if (isDirectVideoFile(item.url)) {
          return `<figure class="hisgo-timeline-figure hisgo-timeline-figure--video"><video controls preload="metadata" src="${safeUrl(item.url)}" class="w-full rounded-lg"></video>${safeCaption}</figure>`;
        }
        const embedUrl = normalizeVideoEmbedUrl(item.url);
        if (!embedUrl) return '';
        return `<figure class="hisgo-timeline-figure hisgo-timeline-figure--video"><div class="hisgo-video-wrap"><iframe src="${safeUrl(embedUrl)}" class="hisgo-video-iframe" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>${safeCaption}</figure>`;
      }
      return `<figure class="hisgo-timeline-figure hisgo-timeline-figure--vertical"><img src="${safeUrl(item.url)}" alt="${escapeHtml(item.caption || n.title || '')}" />${item.caption ? `<figcaption class="hisgo-timeline-caption">${escapeHtml(item.caption)}</figcaption>` : ''}</figure>`;
    })
    .filter(Boolean);

  return htmlParts.length > 0 ? `<div class="hisgo-timeline-media-list">${htmlParts.join('')}</div>` : '';
}

function renderCinematicNode(n: TimelineNode, showImage: boolean, showLocation: boolean): string {
  const safeYear = escapeHtml(n.dateLabel || n.year);
  const firstImage =
    n.thumbnailUrl?.trim() ||
    (Array.isArray(n.mediaList) ? n.mediaList.find((m) => m.type === 'IMAGE' && m.url?.trim())?.url?.trim() : '');
  const bgImg = showImage && firstImage ? safeUrl(firstImage) : '';
  const cardCls = bgImg ? 'hisgo-cinematic-card' : 'hisgo-cinematic-card hisgo-cinematic-card--fallback';
  const cardBgAttr = bgImg
    ? ` style="background-image: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.78) 50%, rgba(15, 23, 42, 0.96) 100%), url('${bgImg}');"`
    : '';
  const extraVideoHtml = showImage && Array.isArray(n.mediaList) && n.mediaList.some((m) => m.type === 'VIDEO' && m.url?.trim())
    ? renderTimelineMediaListHtml({ ...n, thumbnailUrl: '', mediaList: n.mediaList.filter((m) => m.type === 'VIDEO') }, true)
    : '';
  const detailHtml = renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến lịch sử');
  return `
    <div class="${cardCls}"${cardBgAttr}>
      <div class="hisgo-cinematic-meta">
        <span class="hisgo-cinematic-year">${safeYear}</span>
        ${showLocation && n.locationName ? `<span class="hisgo-cinematic-location">📍 ${escapeHtml(n.locationName)}</span>` : ''}
      </div>
      <h5 class="hisgo-cinematic-title">${escapeHtml(n.title)}</h5>
      <p class="hisgo-cinematic-desc">${escapeHtml(n.description)}</p>
      ${showImage && n.mediaCaption ? `<div class="hisgo-cinematic-caption">Tư liệu: ${escapeHtml(n.mediaCaption)}</div>` : ''}
      ${extraVideoHtml}
      ${detailHtml}
    </div>`;
}

function renderMuseumSplitNode(n: TimelineNode, showImage: boolean, showLocation: boolean): string {
  const safeYear = escapeHtml(n.dateLabel || n.year);
  const mediaHtml = renderTimelineMediaListHtml(n, showImage);
  const splitMediaWrap = mediaHtml ? `<div class="hisgo-timeline-split-media">${mediaHtml}</div>` : '';
  const detailHtml = renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến');
  return `
    <div class="hisgo-timeline-node hisgo-timeline-node--split">
      <div class="hisgo-timeline-meta">
        <span class="hisgo-timeline-year hisgo-timeline-year--accent">${safeYear}</span>
        ${showLocation && n.locationName ? `<span class="hisgo-timeline-location">📍 ${escapeHtml(n.locationName)}</span>` : ''}
      </div>
      <div class="hisgo-timeline-split-body">
        <div class="hisgo-timeline-split-text">
          <h5 class="hisgo-timeline-node-title">${escapeHtml(n.title)}</h5>
          <p class="hisgo-timeline-node-desc">${escapeHtml(n.description)}</p>
          ${detailHtml}
        </div>
        ${splitMediaWrap}
      </div>
    </div>`;
}

function renderVerticalNode(n: TimelineNode, showImage: boolean, showLocation: boolean): string {
  const safeYear = escapeHtml(n.dateLabel || n.year);
  const mediaHtml = renderTimelineMediaListHtml(n, showImage);
  const detailHtml = renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến');
  return `
    <div class="hisgo-timeline-node">
      <div class="hisgo-timeline-meta">
        <span class="hisgo-timeline-year">${safeYear}</span>
        ${showLocation && n.locationName ? `<span class="hisgo-timeline-location">📍 ${escapeHtml(n.locationName)}</span>` : ''}
      </div>
      <div class="hisgo-timeline-node-title">${escapeHtml(n.title)}</div>
      <p class="hisgo-timeline-node-desc">${escapeHtml(n.description)}</p>
      ${mediaHtml}
      ${detailHtml}
    </div>`;
}

const TIMELINE_SCENE_RENDERERS: Record<TimelineSceneStyle, TimelineNodeRenderer> = {
  [TimelineSceneStyle.CINEMATIC_BACKDROP]: renderCinematicNode,
  [TimelineSceneStyle.MUSEUM_SPLIT]: renderMuseumSplitNode,
  [TimelineSceneStyle.CHRONO_MINIMAL]: renderVerticalNode,
};

export const timelineBlockPlugin: BlockPlugin<TimelineBlockData> = {
  type: LessonBlockType.TIMELINE,
  createDefault: (id: string, defaultWidth: BlockWidth): TimelineBlockData => ({
    id,
    type: LessonBlockType.TIMELINE,
    width: defaultWidth,
    title: '',
    subtitle: '',
    orientation: TimelineOrientation.VERTICAL,
    sourceMode: 'MANUAL',
    displayConfig: {
      sceneStyle: TimelineSceneStyle.CHRONO_MINIMAL,
      dateFormat: TimelineDateFormat.YEAR_ONLY,
      sortOrder: TimelineSortOrder.CHRONOLOGICAL,
      showDescription: true,
      showImage: true,
      showLocation: false,
      showRole: true,
      showDetailButton: true,
      itemsPerPage: 4,
    },
    nodes: [],
  }),
  toHtml: (block: TimelineBlockData): string => {
    const rawNodes = block.nodes || [];
    const cfg = block.displayConfig;
    const nodes =
      cfg?.sortOrder === TimelineSortOrder.REVERSE_CHRONOLOGICAL
        ? [...rawNodes].reverse()
        : rawNodes;
    const sceneStyle = cfg?.sceneStyle || TimelineSceneStyle.CHRONO_MINIMAL;
    const showImage = cfg?.showImage !== false;
    const showLocation = Boolean(cfg?.showLocation);
    const renderNode =
      TIMELINE_SCENE_RENDERERS[sceneStyle] ?? TIMELINE_SCENE_RENDERERS[TimelineSceneStyle.CHRONO_MINIMAL];
    const nodesHtml = nodes.map((n) => renderNode(n, showImage, showLocation)).join('');
    const safeTitle = block.title?.trim() ? escapeHtml(block.title) : '';
    const safeSubtitle = block.subtitle?.trim() ? escapeHtml(block.subtitle) : '';
    return `
      <div class="hisgo-timeline-block">
        ${safeTitle ? `<h4 class="hisgo-timeline-title">${safeTitle}</h4>` : ''}
        ${safeSubtitle ? `<p class="hisgo-timeline-subtitle">${safeSubtitle}</p>` : ''}
        <div class="hisgo-timeline-nodes">${nodesHtml}</div>
      </div>`;
  },
};

const LEGACY_TABLE_TYPE = 'TABLE';
const LEGACY_COMPARISON_TABLE_TYPE = 'COMPARISON_TABLE';

export class LessonBlockRegistry {
  private static plugins = new Map<LessonBlockType, BlockPlugin<LessonBlockItem>>();

  static {
    const allPlugins: BlockPlugin<LessonBlockItem>[] = [
      textBlockPlugin as BlockPlugin<LessonBlockItem>,
      headingBlockPlugin as BlockPlugin<LessonBlockItem>,
      imageBlockPlugin as BlockPlugin<LessonBlockItem>,
      videoBlockPlugin as BlockPlugin<LessonBlockItem>,
      quoteBlockPlugin as BlockPlugin<LessonBlockItem>,
      calloutBlockPlugin as BlockPlugin<LessonBlockItem>,
      timelineBlockPlugin as BlockPlugin<LessonBlockItem>,
      characterBlockPlugin as BlockPlugin<LessonBlockItem>,
      mapBlockPlugin as BlockPlugin<LessonBlockItem>,
      comparisonTableBlockPlugin as BlockPlugin<LessonBlockItem>,
      quizBlockPlugin as BlockPlugin<LessonBlockItem>,
      dividerBlockPlugin as BlockPlugin<LessonBlockItem>,
      sectionRowBlockPlugin as BlockPlugin<LessonBlockItem>,
      resourceLinkBlockPlugin as BlockPlugin<LessonBlockItem>,
    ];

    for (const plugin of allPlugins) {
      LessonBlockRegistry.plugins.set(plugin.type, plugin);
    }

    setRowSectionCompiler((b) => LessonBlockRegistry.blockToHtml(b));
  }

  public static registerPlugin(plugin: BlockPlugin<LessonBlockItem>): void {
    this.plugins.set(plugin.type, plugin);
  }

  public static getPlugin(type: LessonBlockType): BlockPlugin<LessonBlockItem> | undefined {
    return this.plugins.get(type);
  }

  public static createDefaultBlock(type: LessonBlockType): LessonBlockItem {
    const plugin = this.plugins.get(type);
    const id = createBlockUUID(type.toLowerCase());
    const defaultWidth = BlockWidthStrategy.getDefaultWidth(type);

    if (!plugin) {
      return textBlockPlugin.createDefault(id, defaultWidth);
    }
    return plugin.createDefault(id, defaultWidth);
  }

  public static blockToHtml(block: LessonBlockItem): string {
    const rawType = String(block.type || '').toUpperCase();
    if (rawType === LEGACY_BLOCK_TYPE_STORY_CHAPTER) {
      return migrateLegacyStoryChapterToBlocks(block as unknown as Record<string, unknown>)
        .map((migrated) => this.blockToHtml(migrated))
        .join('\n');
    }
    let plugin = this.plugins.get(rawType as LessonBlockType);
    if (!plugin && (rawType === LEGACY_TABLE_TYPE || rawType === LEGACY_COMPARISON_TABLE_TYPE)) {
      plugin = this.plugins.get(LessonBlockType.COMPARISON_TABLE);
    }
    if (!plugin) {
      return '';
    }
    return plugin.toHtml(block);
  }

  public static renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
    return renderCollapsibleDetail(detailContent, label);
  }
}
