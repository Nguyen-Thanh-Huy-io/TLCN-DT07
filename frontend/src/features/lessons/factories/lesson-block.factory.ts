import { LessonBlockType } from '../types/block-palette.types';
import {
  LessonBlockItem,
  TextBlockData,
  TimelineBlockData,
  CharacterBlockData,
  EventBlockData,
  ImageBlockData,
  VideoBlockData,
  ComparisonTableBlockData,
  QuizBlockData,
  ResourceLinkBlockData,
  MapBlockData,
  RowSectionBlockData,
  TimelineOrientation,
  CalloutBlockData,
  QuoteBlockData,
  HeadingBlockData,
  DividerBlockData,
  RelatedPeopleBlockData,
  RelatedEventsBlockData,
  StoryChapterBlockData,
  StoryChapterLayout,
} from '../types/block-builder.types';
import { RowLayoutStrategy } from '../strategies/row-layout.strategy';
import { BlockWidthStrategy } from '../strategies/block-width.strategy';
import {
  createBlockUUID,
  getChapterLabel,
  StoryChapterLayoutStrategy,
} from '../strategies/story-chapter-layout.strategy';

export const generateBlockId = (prefix: string = 'block'): string => {
  return createBlockUUID(prefix);
};

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
        } as TextBlockData,
        {
          id: createBlockUUID('text'),
          type: LessonBlockType.TEXT,
          zone: 'RIGHT',
          content:
            '<p>Thế kỷ XIII, quân Nguyên – Mông với tham vọng xâm lược Đại Việt lần thứ ba, đã huy động lực lượng hùng hậu, quyết tâm tiêu diệt nhà Trần. Trước tình thế nguy cấp, triều đình nhà Trần đã chủ động chuẩn bị kế sách, trong đó nổi bật là tài năng quân sự của Hưng Đạo Vương Trần Quốc Tuấn.</p>',
        } as TextBlockData,
        {
          id: createBlockUUID('image'),
          type: LessonBlockType.IMAGE,
          zone: 'RIGHT',
          src: '',
          alt: 'Trước trận Bạch Đằng',
          caption:
            'Chiến địa sông Bạch Đằng trong trang sử kháng chiến chống Nguyên – Mông',
        } as ImageBlockData,
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
        } as QuoteBlockData,
        {
          id: createBlockUUID('text'),
          type: LessonBlockType.TEXT,
          zone: 'RIGHT',
          content:
            '<p>Ngày 9 tháng 4 năm 1288, quân ta đã lợi dụng thủy triều lên xuống, bố trí trận địa mai phục, tạo nên thế trận hiểm hóc, tiêu diệt hàng vạn quân địch, buộc quân Nguyên phải rút lui trong thảm bại.</p>',
        } as TextBlockData,
        {
          id: createBlockUUID('image'),
          type: LessonBlockType.IMAGE,
          zone: 'RIGHT',
          src: '',
          alt: 'Trận chiến lịch sử',
          caption: 'Minh họa đoàn chiến thuyền giao chiến trên sông Bạch Đằng',
        } as ImageBlockData,
      ],
    }
  );

  return [chap1, chap2];
}

export class LessonBlockFactory {
  /**
   * Tạo một Block mới với dữ liệu khởi tạo mặc định theo loại
   */
  public static createDefaultBlock(type: LessonBlockType): LessonBlockItem {
    const id = generateBlockId(type.toLowerCase());
    const defaultWidth = BlockWidthStrategy.getDefaultWidth(type);

    switch (type) {
      case LessonBlockType.TEXT:
        return {
          id,
          type: LessonBlockType.TEXT,
          width: defaultWidth,
          content: '<h3>Đề mục nội dung mới</h3><p>Nhập nội dung văn bản chi tiết về diễn biến, phân tích hoặc đánh giá sự kiện lịch sử tại đây...</p>',
        } as TextBlockData;

      case LessonBlockType.TIMELINE:
        return {
          id,
          type: LessonBlockType.TIMELINE,
          width: defaultWidth,
          title: 'Dòng thời gian lịch sử',
          subtitle: 'Các mốc lịch sử tiêu biểu',
          orientation: TimelineOrientation.VERTICAL,
          sourceMode: 'HYBRID',
          maxEvents: 10,
          filterConfig: {
            statusPublishedOnly: true,
          },
          displayConfig: {
            sceneStyle: 'MUSEUM_SPLIT',
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
        } as TimelineBlockData;

      case LessonBlockType.CHARACTER:
        return {
          id,
          type: LessonBlockType.CHARACTER,
          width: defaultWidth,
          name: 'Đại tướng Võ Nguyên Giáp',
          years: '1911 – 2013',
          summary: 'Tổng Tư lệnh kiêm Bí thư Đảng ủy Chiến dịch Điện Biên Phủ với quyết định lịch sử chuyển phương châm tác chiến sang "Đánh chắc tiến chắc".',
          avatarUrl: '',
        } as CharacterBlockData;

      case LessonBlockType.EVENT:
        return {
          id,
          type: LessonBlockType.EVENT,
          width: defaultWidth,
          title: 'Chiến thắng Điện Biên Phủ',
          timeLocation: '07/05/1954 • Điện Biên Phủ',
          summary: 'Chiến thắng vang dội kết thúc 9 năm kháng chiến chống Pháp, làm nên mốc son lừng lẫy năm châu, chấn động địa cầu.',
          thumbnailUrl: '',
        } as EventBlockData;

      case LessonBlockType.IMAGE:
        return {
          id,
          type: LessonBlockType.IMAGE,
          width: defaultWidth,
          src: '',
          alt: '',
          caption: '',
        } as ImageBlockData;

      case LessonBlockType.VIDEO:
        return {
          id,
          type: LessonBlockType.VIDEO,
          width: defaultWidth,
          src: '',
          sourceType: 'URL',
          caption: '',
        } as VideoBlockData;

      case LessonBlockType.COMPARISON_TABLE:
        return {
          id,
          type: LessonBlockType.COMPARISON_TABLE,
          width: defaultWidth,
          title: 'Bảng so sánh tương quan lực lượng',
          colAName: 'Quân đội Nhân dân Việt Nam',
          colBName: 'Quân đội Viễn chinh Pháp',
          rows: [
            {
              criteria: 'Quân số chủ lực',
              colA: 'Khoảng 55.000 quân',
              colB: '16.200 quân đồn trú',
            },
            {
              criteria: 'Phương châm tác chiến',
              colA: 'Đánh chắc, tiến chắc',
              colB: 'Pháo đài bất khả xâm phạm',
            },
          ],
        } as ComparisonTableBlockData;

      case LessonBlockType.QUIZ:
        return {
          id,
          type: LessonBlockType.QUIZ,
          width: defaultWidth,
          question: 'Quyết định mang tính bước ngoặt chiến lược của Đại tướng Võ Nguyên Giáp trong Chiến dịch Điện Biên Phủ (1954) là gì?',
          options: [
            { id: 'opt_1', text: 'Tiến hành "Đánh nhanh, thắng nhanh" ngay khi tập kết quân', isCorrect: false },
            { id: 'opt_2', text: 'Chuyển phương châm từ "Đánh nhanh, thắng nhanh" sang "Đánh chắc, tiến chắc"', isCorrect: true },
            { id: 'opt_3', text: 'Bao vây cô lập lòng chảo Mường Thanh chờ viện binh', isCorrect: false },
          ],
          explanation: 'Quyết định đổi phương châm đã chuẩn bị công sự vững chắc, bảo đảm chắc thắng mới đánh.',
        } as QuizBlockData;

      case LessonBlockType.RESOURCE_LINK:
        return {
          id,
          type: LessonBlockType.RESOURCE_LINK,
          width: defaultWidth,
          title: 'Đại Việt Sử Ký Toàn Thư / Lịch sử Quân sự Việt Nam',
          url: 'https://vi.wikipedia.org/wiki/Chi%E1%BA%BFn_d%E1%BB%8Bch_%C4%90i%E1%BB%87n_Bi%C3%AAn_Ph%E1%BB%A7',
          note: 'Tài liệu sử liệu tham khảo chuẩn (NXB Quân đội Nhân dân).',
        } as ResourceLinkBlockData;

      case LessonBlockType.MAP:
        return {
          id,
          type: LessonBlockType.MAP,
          width: defaultWidth,
          locationName: 'Thung lũng lòng chảo Điện Biên Phủ',
          description: 'Vị trí thung lũng lòng chảo được bao bọc bởi các dãy núi cao hiểm trở Tây Bắc, giữ vai trò yết hầu chiến lược.',
        } as MapBlockData;

      case LessonBlockType.SECTION_ROW: {
        const col1Id = generateBlockId('col');
        const col2Id = generateBlockId('col');
        return {
          id,
          type: LessonBlockType.SECTION_ROW,
          columnCount: 2,
          columns: [
            {
              id: col1Id,
              widthPercent: 50,
              blocks: [
                {
                  id: generateBlockId('text'),
                  type: LessonBlockType.TEXT,
                  content: '<p>Nội dung trình bày ở cột bên trái...</p>',
                } as TextBlockData,
              ],
            },
            {
              id: col2Id,
              widthPercent: 50,
              blocks: [
                {
                  id: generateBlockId('character'),
                  type: LessonBlockType.CHARACTER,
                  name: 'Đại tướng Võ Nguyên Giáp',
                  years: '1911 – 2013',
                  summary: 'Tổng Tư lệnh chiến dịch Điện Biên Phủ.',
                  avatarUrl: '',
                } as CharacterBlockData,
              ],
            },
          ],
        } as RowSectionBlockData;
      }

      case LessonBlockType.CALLOUT:
        return {
          id,
          type: LessonBlockType.CALLOUT,
          width: defaultWidth,
          variant: 'HISTORICAL_NOTE',
          title: 'Lưu ý từ góc nhìn Sử học',
          content: 'Các nhà nghiên cứu lịch sử nhấn mạnh rằng mốc thời gian này có ý nghĩa chuyển hướng chiến lược toàn cục cho phong trào kháng chiến.',
        } as CalloutBlockData;

      case LessonBlockType.QUOTE:
        return {
          id,
          type: LessonBlockType.QUOTE,
          width: defaultWidth,
          quoteText: 'Đầu tôi chưa rơi xuống đất, xin bệ hạ đừng lo!',
          author: 'Thái sư Trần Thủ Độ',
          sourceContext: 'Kháng chiến chống Nguyên Mông lần thứ nhất (1258)',
        } as QuoteBlockData;

      case LessonBlockType.HEADING:
        return {
          id,
          type: LessonBlockType.HEADING,
          width: defaultWidth,
          level: 2,
          text: 'Tiêu đề phân mục mới',
        } as HeadingBlockData;

      case LessonBlockType.DIVIDER:
        return {
          id,
          type: LessonBlockType.DIVIDER,
          width: defaultWidth,
        } as DividerBlockData;

      case LessonBlockType.RELATED_PEOPLE:
        return {
          id,
          type: LessonBlockType.RELATED_PEOPLE,
          width: defaultWidth,
          title: 'Nhân vật liên quan',
          description: 'Các danh tướng, hoàng thân hoặc nhân vật lịch sử đồng hành',
          sourceMode: 'AUTO',
          people: [
            { id: 'p1', name: 'Trần Thánh Tông', role: 'Hoàng đế thứ 2 nhà Trần' },
            { id: 'p2', name: 'Trần Nhân Tông', role: 'Phật hoàng, lãnh đạo kháng chiến' },
            { id: 'p3', name: 'Yết Kiêu', role: 'Tướng cận vệ, danh tướng thủy quân' },
            { id: 'p4', name: 'Dã Tượng', role: 'Tướng tài chỉ huy tượng binh' },
          ],
        } as RelatedPeopleBlockData;

      case LessonBlockType.RELATED_EVENTS:
        return {
          id,
          type: LessonBlockType.RELATED_EVENTS,
          width: defaultWidth,
          title: 'Sự kiện liên quan',
          description: 'Các mốc chiến dịch và hội nghị lịch sử tiêu biểu',
          sourceMode: 'AUTO',
          events: [
            { id: 'e1', title: 'Hội nghị Diên Hồng', year: 1284 },
            { id: 'e2', title: 'Đại thắng Bạch Đằng', year: 1288 },
            { id: 'e3', title: 'Hội nghị Bình Than', year: 1282 },
          ],
        } as RelatedEventsBlockData;

      case LessonBlockType.STORY_CHAPTER: {
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
        } as StoryChapterBlockData;
      }

      default:
        return {
          id,
          type: LessonBlockType.TEXT,
          content: '<p>Nội dung khối bổ sung...</p>',
        } as TextBlockData;
    }
  }

  /**
   * Chuyển đổi khối thành chuỗi HTML chuẩn để hiển thị trong chế độ xem trước bài học
   */
  public static blockToHtml(block: LessonBlockItem): string {
    switch (block.type) {
      case LessonBlockType.TEXT:
        return block.content;

      case LessonBlockType.TIMELINE: {
        const nodesHtml = block.nodes
          .map((n) => {
            const thumbHtml = n.thumbnailUrl
              ? `<figure style="margin: 10px 0; border-radius: 10px; overflow: hidden; border: 1px solid #e7e5e4; background: #fafaf9;">
                  <img src="${n.thumbnailUrl}" alt="${n.mediaCaption || n.title || ''}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
                  ${n.mediaCaption ? `<figcaption style="font-size: 13px; color: #57534e; padding: 6px 10px; font-style: italic;">${n.mediaCaption}</figcaption>` : ''}
                </figure>`
              : '';

            const narrativeHtml = n.contentHtml
              ? `<div style="font-size: 15px; color: #1c1917; line-height: 1.65;">${n.contentHtml}</div>`
              : `<div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; font-family: serif;">${n.title}</div>
                 <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">${n.description}</p>`;

            const detailHtml = LessonBlockFactory.renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến');

            return `
            <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e7e5e4;">
              <div style="margin-bottom: 8px;">
                <span style="display: inline-block; background: #1c1917; color: #ffffff; font-family: serif; font-weight: 700; font-size: 13px; padding: 3px 10px; border-radius: 6px;">${n.year}</span>
              </div>
              ${narrativeHtml}
              ${thumbHtml}
              ${detailHtml}
            </div>`;
          })
          .join('');

        return `
          <div class="hisgo-timeline-block my-6 p-5 bg-white border border-stone-200 rounded-2xl font-sans">
            <h4 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 4px 0; font-family: serif;">
              ${block.title}
            </h4>
            ${block.subtitle ? `<p style="font-size: 15px; color: #57534e; margin: 0 0 16px 0;">${block.subtitle}</p>` : ''}
            <div style="padding-left: 20px; margin: 16px 0; border-left: 2px solid #d6d3d1;">
              ${nodesHtml}
            </div>
          </div>`;
      }

      case LessonBlockType.CHARACTER:
        return `
          <div class="hisgo-character-block my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #ffffff; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; overflow: hidden;">
              ${block.avatarUrl ? `<img src="${block.avatarUrl}" alt="${block.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : '👤'}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Nhân vật lịch sử</div>
              <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${block.name}</h4>
              <span style="font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eff6ff; padding: 2px 8px; rounded: 4px;">${block.years}</span>
              <p style="font-size: 13px; color: #475569; margin: 8px 0 0 0; line-height: 1.6;">${block.summary}</p>
              ${LessonBlockFactory.renderCollapsibleDetail(block.detailContent)}
            </div>
          </div>`;

      case LessonBlockType.EVENT:
        return `
          <div class="hisgo-event-block my-6 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">MỐC LỊCH SỬ</span>
            <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; font-family: serif;">${block.title}</h3>
            <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px;">${block.timeLocation}</div>
            <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">${block.summary}</p>
            ${LessonBlockFactory.renderCollapsibleDetail(block.detailContent)}
          </div>`;

      case LessonBlockType.IMAGE:
        return block.src
          ? `<figure class="my-6 text-center"><img src="${block.src}" alt="${block.alt || ''}" class="max-w-full rounded-xl mx-auto shadow-xs" /><figcaption class="text-xs text-slate-500 italic mt-2">${block.caption || ''}</figcaption></figure>`
          : '';

      case LessonBlockType.VIDEO:
        return block.src
          ? `<div class="my-6 aspect-video rounded-xl overflow-hidden bg-black max-w-2xl mx-auto"><iframe src="${block.src}" class="w-full h-full border-0" allowfullscreen></iframe></div>`
          : '';

      case LessonBlockType.COMPARISON_TABLE:
        return `
          <div class="my-6 overflow-x-auto">
            <p><strong>${block.title || 'Bảng so sánh tương quan:'}</strong></p>
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th>Tiêu chí</th>
                  <th>${block.colAName}</th>
                  <th>${block.colBName}</th>
                </tr>
              </thead>
              <tbody>
                ${block.rows
                  .map(
                    (r) => `
                  <tr>
                    <td><strong>${r.criteria}</strong></td>
                    <td>${r.colA}</td>
                    <td>${r.colB}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`;

      case LessonBlockType.QUIZ: {
        const correctOpt = block.options.find((o) => o.isCorrect);
        const correctLetter = correctOpt
          ? String.fromCharCode(65 + block.options.indexOf(correctOpt))
          : '';
        return `
          <div class="my-6 p-5 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-xs font-sans">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span style="font-size: 15px;">❓</span>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309;">Câu hỏi tự kiểm tra nhanh</span>
            </div>
            <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 6px 0 14px 0; line-height: 1.5;">${block.question}</p>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13.5px;">
              ${block.options
                .map(
                  (opt, i) => `
                <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center; gap: 10px;">
                  <span style="font-weight: 700; color: #b45309; min-width: 20px;">${String.fromCharCode(65 + i)}.</span>
                  <span style="color: #334155;">${opt.text}</span>
                </div>`
                )
                .join('')}
            </div>
            <details style="margin-top: 14px; padding: 10px 14px; background: #fefce8; border: 1px dashed #ca8a04; border-radius: 10px; font-size: 13px;">
              <summary style="cursor: pointer; font-weight: 600; color: #854d0e; list-style: none;">
                ▸ Bấm để xem đáp án đúng & giải thích chi tiết
              </summary>
              <div style="margin-top: 8px; border-top: 1px solid #fef08a; padding-top: 8px; color: #713f12; line-height: 1.6;">
                <div><strong style="color: #15803d;">✓ Đáp án đúng:</strong> <strong>${correctLetter}. ${correctOpt?.text || ''}</strong></div>
                ${block.explanation ? `<div style="margin-top: 4px; color: #4b5563;">💡 <em>${block.explanation}</em></div>` : ''}
              </div>
            </details>
          </div>`;
      }

      case LessonBlockType.RESOURCE_LINK:
        return `
          <div class="my-4 p-3 bg-slate-50 border-l-4 border-blue-600 rounded-r-lg text-xs">
            <strong>📄 Sử liệu tham khảo: </strong>
            <a href="${block.url}" target="_blank" rel="noreferrer" class="text-blue-600 font-semibold hover:underline">${block.title}</a>
            ${block.note ? `<p class="text-slate-500 mt-1 mb-0">${block.note}</p>` : ''}
          </div>`;

      case LessonBlockType.MAP:
        return `
          <blockquote class="my-4 border-l-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-r-lg text-xs text-slate-700">
            <strong>🗺️ Địa bàn tác chiến:</strong> ${block.locationName}
            <p class="mt-1 mb-0 text-slate-600">${block.description}</p>
          </blockquote>`;

      case LessonBlockType.CALLOUT: {
        const callout = block as CalloutBlockData;
        const borderColors = {
          HISTORICAL_NOTE: '#d97706',
          INFO: '#2563eb',
          WARNING: '#dc2626',
          SUCCESS: '#059669',
        };
        const bgColors = {
          HISTORICAL_NOTE: '#fef3c7',
          INFO: '#eff6ff',
          WARNING: '#fef2f2',
          SUCCESS: '#ecfdf5',
        };
        const icons = {
          HISTORICAL_NOTE: '📜',
          INFO: '💡',
          WARNING: '⚠️',
          SUCCESS: '✨',
        };
        const color = borderColors[callout.variant] || '#d97706';
        const bg = bgColors[callout.variant] || '#fef3c7';
        const icon = icons[callout.variant] || '📜';
        return `
          <div style="margin: 18px 0; padding: 14px 18px; background: ${bg}; border-left: 4px solid ${color}; border-radius: 8px; font-family: inherit;">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>${icon}</span> <span>${callout.title || 'Lưu ý lịch sử'}</span>
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.6;">${callout.content || ''}</div>
          </div>`;
      }

      case LessonBlockType.QUOTE: {
        const quote = block as QuoteBlockData;
        return `
          <blockquote style="margin: 22px 0; padding: 16px 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0;">
            <p style="font-family: Georgia, Cambria, serif; font-style: italic; font-size: 15px; color: #1e293b; margin: 0 0 10px 0; line-height: 1.7;">“${quote.quoteText || ''}”</p>
            <div style="font-size: 12px; font-weight: 600; color: #78350f; text-align: right;">
              — <span>${quote.author || 'Khuyết danh'}</span>
              ${quote.sourceContext ? `<span style="font-weight: normal; color: #92400e; font-style: italic;"> (${quote.sourceContext})</span>` : ''}
            </div>
          </blockquote>`;
      }

      case LessonBlockType.HEADING: {
        const heading = block as HeadingBlockData;
        const tag = `h${heading.level || 2}`;
        return `<${tag} style="font-weight: 700; color: #0f172a; margin: 24px 0 12px 0;">${heading.text || ''}</${tag}>`;
      }

      case LessonBlockType.DIVIDER:
        return `<hr style="margin: 28px 0; border: none; border-top: 1px solid #e2e8f0;" />`;

      case LessonBlockType.RELATED_PEOPLE: {
        const rel = block as RelatedPeopleBlockData;
        return `
          <div style="margin: 24px 0; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafaf9;">
            <div style="font-size: 14px; font-weight: 700; color: #1c1917; margin-bottom: 4px;">👥 ${rel.title}</div>
            ${rel.description ? `<p style="font-size: 12px; color: #78716c; margin-top: 0; margin-bottom: 12px;">${rel.description}</p>` : ''}
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${rel.people.map((p) => `
                <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 12px; font-weight: 600; color: #292524;">
                  <span>👤</span> <span>${p.name}</span>
                  ${p.role ? `<span style="font-size: 11px; font-weight: normal; color: #a8a29e;">• ${p.role}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>`;
      }

      case LessonBlockType.RELATED_EVENTS: {
        const rel = block as RelatedEventsBlockData;
        return `
          <div style="margin: 24px 0; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafaf9;">
            <div style="font-size: 14px; font-weight: 700; color: #1c1917; margin-bottom: 4px;">⚔️ ${rel.title}</div>
            ${rel.description ? `<p style="font-size: 12px; color: #78716c; margin-top: 0; margin-bottom: 12px;">${rel.description}</p>` : ''}
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${rel.events.map((e) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 12px;">
                  <span style="font-weight: 600; color: #292524;">⚔️ ${e.title}</span>
                  ${e.year ? `<span style="font-size: 11px; font-family: monospace; color: #b45309; font-weight: 700;">Năm ${e.year}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>`;
      }

      case LessonBlockType.SECTION_ROW:
        return RowLayoutStrategy.compileRowToHtml(block as RowSectionBlockData, (b) =>
          LessonBlockFactory.blockToHtml(b)
        );

      case LessonBlockType.STORY_CHAPTER: {
        const sc = block as StoryChapterBlockData;
        const cfg = sc.displayConfig || {
          showChapterNumber: true,
          showTime: true,
          showLocation: true,
          showReferenceSource: true,
        };
        const chapters = StoryChapterLayoutStrategy.normalizeStoryChapters(sc)
          .slice()
          .sort((a, b) => a.order - b.order);

        const tocHtml =
          sc.showToc !== false && chapters.length > 1
            ? `<nav style="margin-bottom: 24px; padding: 12px 16px; background: #f5f1ea; border: 1px solid #e7e5e4; border-radius: 10px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #78716c; margin-bottom: 8px;">Mục lục chương (${chapters.length} chương)</div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                  ${chapters
                    .map(
                      (ch, i) => `
                    <a href="#story-chap-${ch.id}" style="text-decoration: none; padding: 4px 10px; background: #ffffff; border: 1px solid #d6d3d1; border-radius: 6px; font-size: 12px; color: #1c1917; font-weight: 600;">
                      ${getChapterLabel(i)}: ${ch.title}
                    </a>`
                    )
                    .join('')}
                </div>
              </nav>`
            : '';

        const chaptersHtml = chapters
          .map((ch, idx) => {
            const chapterNumberLabel = getChapterLabel(idx);
            const blocksHtml = (ch.blocks || [])
              .map((child) => LessonBlockFactory.blockToHtml(child))
              .join('');

            return `
              <article id="story-chap-${ch.id}" style="${idx > 0 ? 'margin-top: 32px; padding-top: 28px; border-top: 1px solid #d6d3d1;' : ''}">
                ${cfg.showChapterNumber ? `<div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #57534e; margin-bottom: 6px; font-family: serif;">${chapterNumberLabel}${ch.subtitle ? ` • ${ch.subtitle}` : ''}</div>` : ''}
                <h2 style="font-size: 28px; font-weight: 700; font-family: serif; color: #1c1917; margin: 0 0 12px 0;">${ch.title}</h2>
                <div style="margin-top: 12px;">${blocksHtml}</div>
              </article>`;
          })
          .join('');

        return `
          <section class="hisgo-story-chapter my-8 p-7 bg-[#faf7f2] border border-stone-200 rounded-2xl">
            ${tocHtml}
            ${chaptersHtml}
            ${cfg.showReferenceSource && sc.referenceSource ? `<div style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #d6d3d1; font-size: 13px; color: #57534e; font-style: italic;">Nguồn tham khảo: ${sc.referenceSource}</div>` : ''}
          </section>`;
      }

      default:
        return '';
    }
  }

  /** HTML <details>/<summary> gốc (tự thu/mở, không cần JS) cho nội dung chi tiết tuỳ
   * chọn của Timeline node / khối Nhân vật / khối Sự kiện — ẩn mặc định, chỉ xổ ra khi
   * người đọc bấm mở, không chiếm chỗ hiển thị ngay từ đầu. */
  private static renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
    if (!detailContent) return '';
    return `<details style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #334155; line-height: 1.6;">
      <summary style="cursor: pointer; font-weight: 600; color: #1d4ed8; list-style: none;">▸ ${label}</summary>
      <div style="margin-top: 6px;">${detailContent}</div>
    </details>`;
  }
}
