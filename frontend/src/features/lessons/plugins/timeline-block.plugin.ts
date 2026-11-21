import { LessonBlockType } from '../types/editor.types';
import {
  TimelineBlockData,
  TimelineDateFormat,
  TimelineNode,
  TimelineOrientation,
  TimelineSceneStyle,
  TimelineSortOrder,
} from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl, escapeHtml, renderCollapsibleDetail } from './block-plugin.types';

type TimelineNodeRenderer = (
  node: TimelineNode,
  showImage: boolean,
  showLocation: boolean,
) => string;

function renderCinematicNode(
  n: TimelineNode,
  showImage: boolean,
  showLocation: boolean,
): string {
  const safeYear = escapeHtml(n.dateLabel || n.year);
  const bgImg = showImage && n.thumbnailUrl ? safeUrl(n.thumbnailUrl) : '';
  const cardCls = bgImg ? 'hisgo-cinematic-card' : 'hisgo-cinematic-card hisgo-cinematic-card--fallback';
  const cardBgAttr = bgImg
    ? ` style="background-image: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.78) 50%, rgba(15, 23, 42, 0.96) 100%), url('${bgImg}');"`
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
      ${detailHtml}
    </div>`;
}

function renderMuseumSplitNode(
  n: TimelineNode,
  showImage: boolean,
  showLocation: boolean,
): string {
  const safeYear = escapeHtml(n.dateLabel || n.year);
  const thumbHtml =
    showImage && n.thumbnailUrl
      ? `<div class="hisgo-timeline-split-media">
          <figure class="hisgo-timeline-figure">
            <img src="${safeUrl(n.thumbnailUrl)}" alt="${escapeHtml(n.mediaCaption || n.title || '')}" />
            ${n.mediaCaption ? `<figcaption class="hisgo-timeline-caption">${escapeHtml(n.mediaCaption)}</figcaption>` : ''}
          </figure>
        </div>`
      : '';
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
        ${thumbHtml}
      </div>
    </div>`;
}

function renderVerticalNode(
  n: TimelineNode,
  showImage: boolean,
  showLocation: boolean,
): string {
  const safeYear = escapeHtml(n.dateLabel || n.year);
  const thumbHtml =
    showImage && n.thumbnailUrl
      ? `<figure class="hisgo-timeline-figure hisgo-timeline-figure--vertical">
          <img src="${safeUrl(n.thumbnailUrl)}" alt="${escapeHtml(n.mediaCaption || n.title || '')}" />
          ${n.mediaCaption ? `<figcaption class="hisgo-timeline-caption">${escapeHtml(n.mediaCaption)}</figcaption>` : ''}
        </figure>`
      : '';
  const detailHtml = renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến');

  return `
    <div class="hisgo-timeline-node">
      <div class="hisgo-timeline-meta">
        <span class="hisgo-timeline-year">${safeYear}</span>
        ${showLocation && n.locationName ? `<span class="hisgo-timeline-location">📍 ${escapeHtml(n.locationName)}</span>` : ''}
      </div>
      <div class="hisgo-timeline-node-title">${escapeHtml(n.title)}</div>
      <p class="hisgo-timeline-node-desc">${escapeHtml(n.description)}</p>
      ${thumbHtml}
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
    title: 'Dòng thời gian lịch sử',
    subtitle: 'Các mốc lịch sử tiêu biểu',
    orientation: TimelineOrientation.VERTICAL,
    sourceMode: 'MANUAL',
    displayConfig: {
      sceneStyle: TimelineSceneStyle.MUSEUM_SPLIT,
      dateFormat: TimelineDateFormat.YEAR_ONLY,
      sortOrder: TimelineSortOrder.CHRONOLOGICAL,
      showDescription: true,
      showImage: true,
      showLocation: false,
      showRole: true,
      showDetailButton: true,
      itemsPerPage: 4,
    },
    nodes: [
      {
        id: 'node_1',
        year: '1945',
        title: 'Tuyên bố độc lập',
        description: 'Sự kiện đánh dấu bước ngoặt lịch sử mở ra kỷ nguyên mới cho dân tộc Việt Nam.',
        contentHtml:
          '<h3>Tuyên bố độc lập</h3><p>Sự kiện đánh dấu bước ngoặt lịch sử mở ra kỷ nguyên mới cho dân tộc Việt Nam.</p>',
        isManual: false,
      },
      {
        id: 'node_2',
        year: '1954',
        title: 'Chiến thắng Điện Biên Phủ',
        description: 'Mốc son chấn động địa cầu, kết thúc thắng lợi cuộc kháng chiến chống Pháp.',
        contentHtml:
          '<h3>Chiến thắng Điện Biên Phủ</h3><p>Mốc son chấn động địa cầu, kết thúc thắng lợi cuộc kháng chiến chống Pháp.</p>',
        locationName: 'Điện Biên',
        isManual: false,
      },
    ],
  }),

  toHtml: (block: TimelineBlockData): string => {
    const rawNodes = block.nodes || [];
    const cfg = block.displayConfig;
    const nodes =
      cfg?.sortOrder === TimelineSortOrder.REVERSE_CHRONOLOGICAL
        ? [...rawNodes].reverse()
        : rawNodes;
    const sceneStyle = cfg?.sceneStyle || TimelineSceneStyle.MUSEUM_SPLIT;
    const showImage = cfg?.showImage !== false;
    const showLocation = Boolean(cfg?.showLocation);

    const renderNode =
      TIMELINE_SCENE_RENDERERS[sceneStyle] ?? TIMELINE_SCENE_RENDERERS[TimelineSceneStyle.MUSEUM_SPLIT];
    const nodesHtml = nodes.map((n) => renderNode(n, showImage, showLocation)).join('');

    const safeTitle = escapeHtml(block.title);
    const safeSubtitle = block.subtitle ? escapeHtml(block.subtitle) : '';

    return `
      <div class="hisgo-timeline-block">
        <h4 class="hisgo-timeline-title">${safeTitle}</h4>
        ${safeSubtitle ? `<p class="hisgo-timeline-subtitle">${safeSubtitle}</p>` : ''}
        <div class="hisgo-timeline-nodes">${nodesHtml}</div>
      </div>`;
  },
};
