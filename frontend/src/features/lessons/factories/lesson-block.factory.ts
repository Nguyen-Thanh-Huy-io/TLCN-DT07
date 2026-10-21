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
} from '../types/block-builder.types';
import { RowLayoutStrategy } from '../strategies/row-layout.strategy';
import { BlockWidthStrategy } from '../strategies/block-width.strategy';

let idCounter = 0;
export const generateBlockId = (prefix: string = 'block'): string => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
};

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
          title: 'Timeline — Dòng thời gian',
          subtitle: 'Các mốc lịch sử tiêu biểu',
          orientation: TimelineOrientation.VERTICAL,
          nodes: [
            {
              id: 'node_1',
              year: '1945',
              title: 'Tuyên bố độc lập',
              description: 'Sự kiện đánh dấu bước ngoặt lịch sử mở ra kỷ nguyên mới.',
            },
            {
              id: 'node_2',
              year: '1954',
              title: 'Chiến thắng Điện Biên Phủ',
              description: 'Mốc son chấn động địa cầu, kết thúc thắng lợi cuộc kháng chiến chống Pháp.',
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
            const mediaHtml =
              n.mediaList && n.mediaList.length > 0
                ? `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-top: 10px;">
                    ${n.mediaList
                      .map((m) =>
                        m.type === 'IMAGE'
                          ? `<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
                              <img src="${m.url}" alt="${m.caption || ''}" style="width: 100%; height: 110px; object-fit: cover;" />
                              ${m.caption ? `<div style="font-size: 11px; color: #64748b; padding: 4px 6px; font-style: italic;">${m.caption}</div>` : ''}
                            </div>`
                          : `<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #000000; height: 110px;">
                              <iframe src="${m.url}" style="width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
                            </div>`
                      )
                      .join('')}
                  </div>`
                : '';

            const detailHtml = LessonBlockFactory.renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến');

            return `
            <div style="position: relative; margin-bottom: 20px;">
              <div style="position: absolute; left: -29px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 0 2px #bfdbfe;"></div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; font-family: serif;">
                  <span style="color: #1d4ed8; font-family: sans-serif;">${n.year}</span> — ${n.title}
                </div>
                <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.5;">${n.description}</p>
                ${mediaHtml}
                ${detailHtml}
              </div>
            </div>`;
          })
          .join('');

        return `
          <div class="hisgo-timeline-block my-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs font-sans">
            <h4 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; font-family: serif; display: flex; align-items: center; gap: 6px;">
              <span>⏱️</span><span>${block.title}</span>
            </h4>
            ${block.subtitle ? `<p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">${block.subtitle}</p>` : ''}
            <div style="position: relative; padding-left: 24px; margin: 16px 0; border-left: 2px solid #bfdbfe;">
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

      case LessonBlockType.QUIZ:
        return `
          <div class="my-6 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309;">❓ Câu hỏi ôn tập</span>
            <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 8px 0 12px 0;">${block.question}</p>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              ${block.options
                .map(
                  (opt, i) => `
                <div style="padding: 8px 12px; background: ${opt.isCorrect ? '#ecfdf5' : '#ffffff'}; border: 1px solid ${opt.isCorrect ? '#10b981' : '#e2e8f0'}; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 700;">${String.fromCharCode(65 + i)}.</span>
                  <span>${opt.text}</span>
                  ${opt.isCorrect ? '<span style="font-size: 11px; color: #059669; font-weight: 600; margin-left: auto;">[Đáp án đúng]</span>' : ''}
                </div>`
                )
                .join('')}
            </div>
            ${block.explanation ? `<p style="font-size: 12px; color: #166534; background: #f0fdf4; padding: 8px 12px; border-radius: 6px; margin-top: 10px;">💡 ${block.explanation}</p>` : ''}
          </div>`;

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

      case LessonBlockType.SECTION_ROW:
        return RowLayoutStrategy.compileRowToHtml(block as RowSectionBlockData, (b) =>
          LessonBlockFactory.blockToHtml(b)
        );

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
