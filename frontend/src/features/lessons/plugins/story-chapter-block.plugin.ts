import { LessonBlockType } from '../types/block-palette.types';
import {
  StoryChapterBlockData,
  StoryChapterLayout,
  LessonBlockItem,
} from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';
import {
  createBlockUUID,
  getChapterLabel,
  StoryChapterLayoutStrategy,
} from '../strategies/story-chapter-layout.strategy';

let childBlockCompiler: (block: LessonBlockItem) => string = () => '';
export function setStoryChapterChildCompiler(fn: (block: LessonBlockItem) => string) {
  childBlockCompiler = fn;
}

function createSampleStoryChapters() {
  const chap1 = StoryChapterLayoutStrategy.createChapterContainer(
    0,
    'MAGAZINE_GRID',
    {
      title: 'Trước trận Bạch Đằng',
      subtitle: 'Bối cảnh lịch sử',
      columnRatio: '4_8',
      blocks: [
        {
          id: createBlockUUID('text'),
          type: LessonBlockType.TEXT,
          zone: 'LEFT',
          content:
            '<p>Ngày 9 tháng 4 năm 1288, trên dòng sông Bạch Đằng, quân dân Đại Việt dưới sự chỉ huy của Hưng Đạo Vương Trần Quốc Tuấn đã làm nên một chiến thắng lẫy lừng trong lịch sử dân tộc.</p><p>Chiến thắng Bạch Đằng không chỉ là một trận đánh quân sự vĩ đại, mà còn là biểu tượng của trí tuệ, bản lĩnh và ý chí quật cường của dân tộc Việt Nam qua nhiều thế kỷ.</p>',
        },
        {
          id: createBlockUUID('text'),
          type: LessonBlockType.TEXT,
          zone: 'RIGHT',
          content:
            '<p>Thế kỷ XIII, quân Nguyên – Mông với tham vọng xâm lược Đại Việt lần thứ ba, đã huy động lực lượng hùng hậu, quyết tâm tiêu diệt nhà Trần. Trước tình thế nguy cấp, triều đình nhà Trần đã chủ động chuẩn bị kế sách, trong đó nổi bật là tài năng quân sự của Hưng Đạo Vương Trần Quốc Tuấn.</p>',
        },
        {
          id: createBlockUUID('image'),
          type: LessonBlockType.IMAGE,
          zone: 'RIGHT',
          src: '',
          alt: 'Trước trận Bạch Đằng',
          caption: 'Chiến địa sông Bạch Đằng trong trang sử kháng chiến chống Nguyên – Mông',
        },
      ],
    }
  );

  const chap2 = StoryChapterLayoutStrategy.createChapterContainer(
    1,
    'ASYMMETRIC',
    {
      title: 'Trận chiến lịch sử',
      subtitle: 'Diễn biến chính',
      columnRatio: '4_8',
      blocks: [
        {
          id: createBlockUUID('quote'),
          type: LessonBlockType.QUOTE,
          zone: 'LEFT',
          quoteText: 'Bạch Đằng giang, ngàn đời vang danh...',
          author: 'Trần Quốc Tuấn',
        },
        {
          id: createBlockUUID('text'),
          type: LessonBlockType.TEXT,
          zone: 'RIGHT',
          content:
            '<p>Ngày 9 tháng 4 năm 1288, quân ta đã lợi dụng thủy triều lên xuống, bố trí trận địa mai phục, tạo nên thế trận hiểm hóc, tiêu diệt hàng vạn quân địch, buộc quân Nguyên phải rút lui trong thảm bại.</p>',
        },
        {
          id: createBlockUUID('image'),
          type: LessonBlockType.IMAGE,
          zone: 'RIGHT',
          src: '',
          alt: 'Trận chiến lịch sử',
          caption: 'Minh họa đoàn chiến thuyền giao chiến trên sông Bạch Đằng',
        },
      ],
    }
  );

  return [chap1, chap2];
}

export const storyChapterBlockPlugin: BlockPlugin<StoryChapterBlockData> = {
  type: LessonBlockType.STORY_CHAPTER,

  createDefault: (id: string, defaultWidth: BlockWidth): StoryChapterBlockData => {
    const sampleChapters = createSampleStoryChapters();
    const firstChap = sampleChapters[0];

    return {
      id,
      type: LessonBlockType.STORY_CHAPTER,
      width: defaultWidth,
      storyTitle: 'Chiến thắng Bạch Đằng năm 1288',
      subjectType: 'EVENT',
      showToc: true,
      autoNumberChapters: true,
      chapters: sampleChapters,
      chapterNumber: getChapterLabel(0),
      title: firstChap.title,
      subtitle: firstChap.subtitle || 'Thế kỷ XIII • Sông Bạch Đằng',
      leadText: '',
      contentHtml: '',
      timeLabel: '09/04/1288',
      locationName: 'Sông Bạch Đằng',
      referenceSource: 'Đại Việt Sử Ký Toàn Thư — Quốc sử quán triều Nguyễn',
      imageUrl: '',
      imageCaption: '',
      layout: StoryChapterLayout.IMAGE_LEFT_TEXT_RIGHT,
      config: firstChap.config,
      displayConfig: {
        showChapterNumber: true,
        showTime: true,
        showLocation: true,
        showReferenceSource: true,
      },
      subChapters: [],
      nestedBlocks: [],
    };
  },

  toHtml: (block: StoryChapterBlockData): string => {
    const sc = block;
    const cfg = sc.displayConfig || {
      showChapterNumber: true,
      showTime: true,
      showLocation: true,
      showReferenceSource: true,
    };
    const chapters = StoryChapterLayoutStrategy.normalizeStoryChapters(sc)
      .slice()
      .sort((a, b) => a.order - b.order);

    // Thanh điều hướng chương (Quick Chapter Navigator) dạng Pills tinh tế
    const tocHtml =
      sc.showToc !== false && chapters.length > 1
        ? `<nav class="story-quick-nav mb-8 p-3.5 bg-stone-100/70 border border-stone-200/80 rounded-xl">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin-bottom: 8px;">Mục lục chương (${chapters.length} chương)</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${chapters
                .map(
                  (ch, i) => `
                <a href="#story-chap-${ch.id}" style="text-decoration: none; padding: 5px 12px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 9999px; font-size: 12px; color: #292524; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.15s ease;">
                  ${getChapterLabel(i)}: ${escapeHtml(ch.title)}
                </a>`
                )
                .join('')}
            </div>
          </nav>`
        : '';

    const chaptersHtml = chapters
      .map((ch, idx) => {
        const chapterNumberLabel = getChapterLabel(idx);

        // Bóc tách khối theo Zone (LEFT / RIGHT / FULL) để dàn trang báo chí nghệ thuật
        const leftBlocks = (ch.blocks || []).filter((b) => b.zone === 'LEFT');
        const rightBlocks = (ch.blocks || []).filter((b) => b.zone === 'RIGHT');
        const fullBlocks = (ch.blocks || []).filter((b) => !b.zone || b.zone === 'FULL');

        const hasTwoColumns = leftBlocks.length > 0 && rightBlocks.length > 0;
        const ratioKey = ch.config?.layout?.columnRatio || '6_6';
        const ratioGridClass =
          ratioKey === '4_8'
            ? { left: 'md:col-span-5 lg:col-span-4', right: 'md:col-span-7 lg:col-span-8' }
            : ratioKey === '5_7'
            ? { left: 'md:col-span-5', right: 'md:col-span-7' }
            : ratioKey === '7_5'
            ? { left: 'md:col-span-7', right: 'md:col-span-5' }
            : ratioKey === '8_4'
            ? { left: 'md:col-span-8', right: 'md:col-span-4' }
            : { left: 'md:col-span-6', right: 'md:col-span-6' };

        const renderZoneBlocks = (bList: LessonBlockItem[]) =>
          bList.map((child) => childBlockCompiler(child)).join('\n');

        let bodyHtml = '';
        if (hasTwoColumns) {
          bodyHtml = `
            ${fullBlocks.length > 0 ? `<div class="story-full-zone space-y-4 mb-6">${renderZoneBlocks(fullBlocks)}</div>` : ''}
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start my-4">
              <div class="col-span-12 ${ratioGridClass.left} space-y-4">
                ${renderZoneBlocks(leftBlocks)}
              </div>
              <div class="col-span-12 ${ratioGridClass.right} space-y-4">
                ${renderZoneBlocks(rightBlocks)}
              </div>
            </div>
          `;
        } else {
          bodyHtml = `<div class="space-y-4">${renderZoneBlocks(ch.blocks || [])}</div>`;
        }

        const safeTitle = escapeHtml(ch.title);
        const safeSubtitle = ch.subtitle ? escapeHtml(ch.subtitle) : '';

        return `
          <article id="story-chap-${ch.id}" class="story-chapter-spread" style="${idx > 0 ? 'margin-top: 40px; padding-top: 36px; border-top: 1px solid #e7e5e4;' : ''}">
            ${cfg.showChapterNumber ? `<div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #a16207; margin-bottom: 6px; font-family: var(--font-merriweather), 'Noto Serif', serif;">${chapterNumberLabel}${safeSubtitle ? ` • ${safeSubtitle}` : ''}</div>` : ''}
            <h2 style="font-size: 26px; sm:font-size: 28px; font-weight: 700; font-family: var(--font-merriweather), 'Noto Serif', serif; color: #1c1917; margin: 0 0 16px 0; line-height: 1.35;">${safeTitle}</h2>
            <div class="story-chapter-body">${bodyHtml}</div>
          </article>`;
      })
      .join('');

    const safeRef = sc.referenceSource ? escapeHtml(sc.referenceSource) : '';

    return `
      <section class="hisgo-story-chapter my-8 p-6 sm:p-9 bg-[#faf7f2] border border-stone-200/90 rounded-2xl shadow-2xs">
        ${tocHtml}
        ${chaptersHtml}
        ${cfg.showReferenceSource && safeRef ? `<div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed #d6d3d1; font-size: 13px; color: #78716c; font-style: italic;">Nguồn tham khảo: ${safeRef}</div>` : ''}
      </section>`;
  },
};
