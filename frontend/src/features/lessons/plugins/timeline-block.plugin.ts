import { LessonBlockType } from '../types/editor.types';
import { TimelineBlockData, TimelineOrientation } from '../types/block-builder.types';
import { BLOCK_SURFACE_THEME, BlockPlugin, BlockWidth, safeUrl, escapeHtml, renderCollapsibleDetail } from './block-plugin.types';

export enum TimelineSceneStyle {
  CINEMATIC_BACKDROP = 'CINEMATIC_BACKDROP',
  MUSEUM_SPLIT = 'MUSEUM_SPLIT',
  CHRONO_MINIMAL = 'CHRONO_MINIMAL',
}

export enum TimelineSortOrder {
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  REVERSE_CHRONOLOGICAL = 'REVERSE_CHRONOLOGICAL',
}

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
      dateFormat: 'YEAR_ONLY',
      sortOrder: 'CHRONOLOGICAL',
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
    const sceneStyle = cfg?.sceneStyle || 'MUSEUM_SPLIT';
    const showImage = cfg?.showImage !== false;
    const showLocation = Boolean(cfg?.showLocation);

    let nodesHtml = '';

    if (sceneStyle === TimelineSceneStyle.CINEMATIC_BACKDROP) {
      // BỐ CỤC ĐIỆN ẢNH TOÀN CẢNH (CINEMATIC BACKDROP)
      nodesHtml = nodes
        .map((n) => {
          const safeYear = escapeHtml(n.dateLabel || n.year);
          const bgImg = showImage && n.thumbnailUrl ? safeUrl(n.thumbnailUrl) : '';
          const cardBgStyle = bgImg
            ? `background: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.78) 50%, rgba(15, 23, 42, 0.96) 100%), url('${bgImg}') center / cover no-repeat;`
            : `background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);`;

          const detailHtml = renderCollapsibleDetail(
            n.detailContent,
            'Xem chi tiết diễn biến lịch sử',
          );

          return `
          <div class="hisgo-cinematic-card" style="position: relative; margin-bottom: 24px; border-radius: 16px; overflow: hidden; padding: 28px 24px 24px; color: #ffffff; box-shadow: 0 14px 30px -6px rgba(15, 23, 42, 0.38); border: 1px solid rgba(255, 255, 255, 0.12); ${cardBgStyle} min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end;">
            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; background: #C5A059; color: #181206; font-family: var(--font-playfair), 'Merriweather', Georgia, serif; font-weight: 800; font-size: 13px; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 2px 8px rgba(197, 160, 89, 0.4);">${safeYear}</span>
              ${showLocation && n.locationName ? `<span style="font-size: 12px; color: rgba(255, 255, 255, 0.85); background: rgba(0, 0, 0, 0.4); padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.15);">📍 ${escapeHtml(n.locationName)}</span>` : ''}
            </div>

            <h5 style="font-size: 21px; font-weight: 800; color: #FFFDF8; margin: 0 0 8px 0; font-family: var(--font-playfair), 'Merriweather', Georgia, serif; line-height: 1.3; text-shadow: 0 2px 6px rgba(0,0,0,0.6);">
              ${escapeHtml(n.title)}
            </h5>

            <p style="font-size: 15px; color: #E2E8F0; margin: 0 0 10px 0; line-height: 1.68; text-shadow: 0 1px 4px rgba(0,0,0,0.7); max-width: 760px;">
              ${escapeHtml(n.description)}
            </p>

            ${showImage && n.mediaCaption ? `<div style="font-size: 12px; color: #CBD5E1; font-style: italic; margin-top: 4px; opacity: 0.9;">Tư liệu: ${escapeHtml(n.mediaCaption)}</div>` : ''}
            ${detailHtml}
          </div>`;
        })
        .join('');
    } else if (sceneStyle === TimelineSceneStyle.MUSEUM_SPLIT) {
      // BỐ CỤC TRIỂN LÃM SONG SONG (MUSEUM SPLIT)
      nodesHtml = nodes
        .map((n) => {
          const safeYear = escapeHtml(n.dateLabel || n.year);
          const thumbHtml = showImage && n.thumbnailUrl
            ? `<div style="flex: 1; min-width: 240px; max-width: 340px;">
                <figure style="margin: 0; border-radius: 12px; overflow: hidden; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">
                  <img src="${safeUrl(n.thumbnailUrl)}" alt="${escapeHtml(n.mediaCaption || n.title || '')}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
                  ${n.mediaCaption ? `<figcaption style="font-size: 12px; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; padding: 6px 10px; font-style: italic; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border-top: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL};">${escapeHtml(n.mediaCaption)}</figcaption>` : ''}
                </figure>
              </div>`
            : '';

          const detailHtml = renderCollapsibleDetail(
            n.detailContent,
            'Xem chi tiết diễn biến',
          );

          return `
          <div style="margin-bottom: 28px; padding-bottom: 22px; border-bottom: 1px dashed ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL};">
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; background: #8C2D19; color: #ffffff; font-family: var(--font-playfair), 'Merriweather', Georgia, serif; font-weight: 700; font-size: 13px; padding: 3px 12px; border-radius: 6px;">${safeYear}</span>
              ${showLocation && n.locationName ? `<span style="font-size: 12px; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED};">📍 ${escapeHtml(n.locationName)}</span>` : ''}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: start; margin-top: 10px;">
              <div style="flex: 1.5; min-width: 260px;">
                <h5 style="font-size: 18px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin: 0 0 6px 0; font-family: var(--font-playfair), 'Merriweather', Georgia, serif;">
                  ${escapeHtml(n.title)}
                </h5>
                <p style="font-size: 15px; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; margin: 0; line-height: 1.68;">
                  ${escapeHtml(n.description)}
                </p>
                ${detailHtml}
              </div>
              ${thumbHtml}
            </div>
          </div>`;
        })
        .join('');
    } else {
      // BỐ CỤC DỌC CƠ BẢN
      nodesHtml = nodes
        .map((n) => {
          const safeYear = escapeHtml(n.dateLabel || n.year);
          const thumbHtml = showImage && n.thumbnailUrl
            ? `<figure style="margin: 10px 0; border-radius: 10px; overflow: hidden; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">
                <img src="${safeUrl(n.thumbnailUrl)}" alt="${escapeHtml(n.mediaCaption || n.title || '')}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
                ${n.mediaCaption ? `<figcaption style="font-size: 13px; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; padding: 6px 10px; font-style: italic;">${escapeHtml(n.mediaCaption)}</figcaption>` : ''}
              </figure>`
            : '';

          const detailHtml = renderCollapsibleDetail(
            n.detailContent,
            'Xem chi tiết diễn biến',
          );

          return `
          <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL};">
            <div style="margin-bottom: 8px;">
              <span style="display: inline-block; background: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; color: #ffffff; font-family: var(--font-playfair), 'Merriweather', Georgia, serif; font-weight: 700; font-size: 13px; padding: 3px 10px; border-radius: 6px;">${safeYear}</span>
            </div>
            <div style="font-size: 17px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin-bottom: 4px; font-family: var(--font-playfair), 'Merriweather', Georgia, serif;">${escapeHtml(n.title)}</div>
            <p style="font-size: 15px; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; margin: 0; line-height: 1.6;">${escapeHtml(n.description)}</p>
            ${thumbHtml}
            ${detailHtml}
          </div>`;
        })
        .join('');
    }

    const safeTitle = escapeHtml(block.title);
    const safeSubtitle = block.subtitle ? escapeHtml(block.subtitle) : '';

    return `
      <div class="hisgo-timeline-block my-8 p-6 bg-white border border-slate-200 rounded-2xl font-sans">
        <h4 style="font-size: 21px; font-weight: 800; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin: 0 0 4px 0; font-family: var(--font-playfair), 'Merriweather', Georgia, serif;">
          ${safeTitle}
        </h4>
        ${safeSubtitle ? `<p style="font-size: 14.5px; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; margin: 0 0 20px 0; font-style: italic;">${safeSubtitle}</p>` : ''}
        <div style="margin: 16px 0;">
          ${nodesHtml}
        </div>
      </div>`;
    },
};
