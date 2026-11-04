import { LessonBlockType } from '../types/block-palette.types';

export interface IBlockInsertStrategy {
  generateSnippet(type: LessonBlockType, options?: Record<string, unknown>): string;
}

export class LessonBlockInsertStrategy implements IBlockInsertStrategy {
  /**
   * Sinh mã HTML chuẩn cho từng loại khối nội dung Sử Ký
   */
  public generateSnippet(type: LessonBlockType, options?: Record<string, unknown>): string {
    switch (type) {
      case LessonBlockType.TEXT:
        return `
<h3>Đề mục nội dung mới</h3>
<p>Nhập nội dung văn bản chi tiết về diễn biến, phân tích hoặc đánh giá sự kiện lịch sử tại đây...</p>
`;

      case LessonBlockType.IMAGE:
        return `<figure data-type="image-block" data-src="${(options?.src as string) || ''}" data-alt="${(options?.alt as string) || ''}" data-caption="${(options?.caption as string) || ''}"></figure>`;

      case LessonBlockType.VIDEO:
        return `<div data-type="video-block" data-src="${(options?.src as string) || ''}" data-source-type="${(options?.sourceType as string) || 'URL'}" data-caption="${(options?.caption as string) || ''}"></div>`;

      case LessonBlockType.TIMELINE: {
        const defaultNodes = [
          {
            id: 'node_1',
            year: '1945',
            title: 'Tuyên bố độc lập',
            description: 'Sự kiện đánh dấu bước ngoặt lịch sử.',
          },
          {
            id: 'node_2',
            year: '1954',
            title: 'Chiến thắng Điện Biên Phủ',
            description: 'Mốc sự kiện tiếp theo trên dòng thời gian.',
          },
        ];
        const rawNodes = (options?.nodes as unknown[]) || defaultNodes;
        const encodedNodes = JSON.stringify(rawNodes).replace(/"/g, '&quot;');
        return `<div data-type="timeline-block" data-title="${(options?.title as string) || 'Timeline — Dòng thời gian'}" data-subtitle="${(options?.subtitle as string) || 'Các mốc lịch sử tiêu biểu'}" data-nodes="${encodedNodes}"></div>`;
      }

      case LessonBlockType.MAP:
        return `
<blockquote>
  <p><strong>🗺️ Bản đồ & Địa bàn tác chiến:</strong></p>
  <p>Địa điểm: Điện Biên Phủ, Tây Bắc Việt Nam. Vị trí thung lũng lòng chảo được bao bọc bởi các dãy núi cao hiểm trở, giữ vai trò yết hầu chiến lược.</p>
</blockquote>
`;

      case LessonBlockType.CHARACTER:
        return `<div data-type="character-block" data-entity-id="${(options?.entityId as string) || ''}" data-name="${(options?.name as string) || 'Tên nhân vật lịch sử'}" data-years="${(options?.years as string) || 'Năm sinh – năm mất'}" data-summary="${(options?.summary as string) || 'Thông tin giới thiệu ngắn.'}" data-avatar="${(options?.avatarUrl as string) || ''}"></div>`;

      case LessonBlockType.EVENT:
        return `<div data-type="event-block" data-event-id="${(options?.eventId as string) || ''}" data-title="${(options?.title as string) || 'Tên sự kiện lịch sử'}" data-time-location="${(options?.timeLocation as string) || 'Thời gian • Địa điểm'}" data-summary="${(options?.summary as string) || 'Mô tả ngắn về diễn biến và ý nghĩa của sự kiện.'}" data-thumbnail="${(options?.thumbnailUrl as string) || ''}"></div>`;

      case LessonBlockType.COMPARISON_TABLE:
        return `
<p><strong>Bảng so sánh tương quan:</strong></p>
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="text-align: left; padding: 8px;">Tiêu chí so sánh</th>
      <th style="text-align: left; padding: 8px;">Quân đội Nhân dân Việt Nam</th>
      <th style="text-align: left; padding: 8px;">Quân đội Viễn chinh Pháp</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px;"><strong>Quân số chủ lực</strong></td>
      <td style="padding: 8px;">Khoảng 55.000 quân</td>
      <td style="padding: 8px;">16.200 quân đồn trú</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>Phương châm tác chiến</strong></td>
      <td style="padding: 8px;">Đánh chắc, tiến chắc</td>
      <td style="padding: 8px;">Pháo đài bất khả xâm phạm</td>
    </tr>
  </tbody>
</table>
`;

      case LessonBlockType.QUIZ:
        return `
<div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;" data-type="quiz-block">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309;">
      ❓ Câu hỏi trắc nghiệm củng cố bài học
    </span>
  </div>
  <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">
    Quyết định mang tính bước ngoặt chiến lược của Đại tướng Võ Nguyên Giáp trong Chiến dịch Điện Biên Phủ (1954) là gì?
  </p>
  <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
      <span style="width: 22px; height: 22px; border-radius: 50%; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">A</span>
      <span>Tiến hành "Đánh nhanh, thắng nhanh" ngay khi tập kết quân</span>
    </div>
    <div style="padding: 10px 14px; background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; display: flex; align-items: center; gap: 10px;" data-correct="true">
      <span style="width: 22px; height: 22px; border-radius: 50%; background: #10b981; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">B</span>
      <span style="font-weight: 600; color: #065f46;">Chuyển phương châm từ "Đánh nhanh, thắng nhanh" sang "Đánh chắc, tiến chắc" [Đáp án đúng]</span>
    </div>
    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
      <span style="width: 22px; height: 22px; border-radius: 50%; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">C</span>
      <span>Bao vây cô lập lòng chảo Mường Thanh chờ quân tiếp viện</span>
    </div>
    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
      <span style="width: 22px; height: 22px; border-radius: 50%; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">D</span>
      <span>Tổng công kích ban đêm vào sở chỉ huy De Castries</span>
    </div>
  </div>
  <div style="margin-top: 12px; padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 6px; font-size: 12px; color: #166534;">
    <strong>💡 Lời giải lịch sử:</strong> Quyết định đổi phương châm tác chiến đã hoãn ngày nổ súng để kéo pháo ra, chuẩn bị công sự vững chắc, bảo đảm "chắc thắng mới đánh", làm nên chiến thắng "lừng lẫy năm châu, chấn động địa cầu".
  </div>
</div>
`;

      case LessonBlockType.RESOURCE_LINK:
        return `
<p style="font-size: 13px; color: #475569; background-color: #f8fafc; padding: 10px 14px; border-left: 3px solid #2563eb; border-radius: 4px;">
  <strong>📄 Tài liệu sử liệu tham khảo:</strong> Đại Việt Sử Ký Toàn Thư / Lịch sử Quân sự Việt Nam (NXB Quân đội Nhân dân, 2005).
</p>
`;

      default:
        return `<p>Khối nội dung bổ sung...</p>`;
    }
  }
}

export const lessonBlockInsertStrategy = new LessonBlockInsertStrategy();
