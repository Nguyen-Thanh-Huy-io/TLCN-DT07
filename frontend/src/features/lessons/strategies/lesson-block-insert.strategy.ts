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

      case LessonBlockType.TIMELINE:
        return `
<h3>⏱️ Dòng thời gian mốc son</h3>
<ul>
  <li><strong>Mốc mở màn:</strong> Bắt đầu chiến dịch, mở cuộc tiến công vào cứ điểm...</li>
  <li><strong>Mốc cao trào:</strong> Đột phá phòng tuyến, giành quyền kiểm soát các vị trí trọng yếu...</li>
  <li><strong>Mốc toàn thắng:</strong> Tổng công kích, đối phương đầu hàng vô điều kiện.</li>
</ul>
`;

      case LessonBlockType.MAP:
        return `
<blockquote>
  <p><strong>🗺️ Bản đồ & Địa bàn tác chiến:</strong></p>
  <p>Địa điểm: Điện Biên Phủ, Tây Bắc Việt Nam. Vị trí thung lũng lòng chảo được bao bọc bởi các dãy núi cao hiểm trở, giữ vai trò yết hầu chiến lược.</p>
</blockquote>
`;

      case LessonBlockType.CHARACTER:
        return `
<blockquote>
  <p><strong>👤 Nhân vật lịch sử tiêu biểu:</strong></p>
  <p>Họ tên: Đại tướng Võ Nguyên Giáp. Tổng Tư lệnh kiêm Bí thư Đảng ủy Chiến dịch Điện Biên Phủ với quyết định lịch sử chuyển phương châm từ "Đánh nhanh thắng nhanh" sang "Đánh chắc tiến chắc".</p>
</blockquote>
`;

      case LessonBlockType.EVENT:
        return `
<h3>⚔️ Sự kiện lịch sử trọng điểm</h3>
<p>Bối cảnh, tương quan lực lượng, quyết định chiến lược và diễn biến đột phá làm thay đổi hoàn toàn cục diện chiến trường.</p>
`;

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
<blockquote>
  <p><strong>❓ Câu hỏi củng cố bài học:</strong></p>
  <p>1. Quyết định thay đổi phương châm tác chiến trong chiến dịch Điện Biên Phủ mang ý nghĩa sống còn như thế nào?</p>
  <p>2. Phân tích nguyên nhân thắng lợi và bài học kinh nghiệm về nghệ thuật quân sự.</p>
</blockquote>
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
