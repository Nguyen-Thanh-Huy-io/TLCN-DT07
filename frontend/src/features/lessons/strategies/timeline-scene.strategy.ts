import { TimelineNode } from '../components/blocks/HistoricalTimelineBlock';
import { TimelineSceneStyle } from '../types/block-builder.types';

export interface TimelineSceneStyleOption {
  id: TimelineSceneStyle;
  label: string;
  description: string;
}

export const TIMELINE_SCENE_STYLE_OPTIONS: TimelineSceneStyleOption[] = [
  {
    id: 'MUSEUM_SPLIT',
    label: 'Triển lãm tư liệu (Nhân vật / Hiện vật)',
    description: 'Trình bày văn bản kết hợp khung ảnh tư liệu chuẩn bảo tàng, giữ nguyên chi tiết chân dung và sắc lệnh.',
  },
  {
    id: 'CINEMATIC_BACKDROP',
    label: 'Điện ảnh toàn cảnh (Sự kiện / Chiến dịch)',
    description: 'Trình bày ảnh nền đại cảnh kết hợp dải chuyển sắc sẫm màu theo phong cách kể chuyện lịch sử.',
  },
];

/**
 * Strategy & Synchronizer cho Phân cảnh Dòng thời gian (Composite Story Scene).
 * Đảm bảo tính tương thích ngược 100% giữa dữ liệu cấu trúc cũ (title, description, role)
 * và trình soạn thảo văn bản giàu định dạng hợp nhất (contentHtml).
 */
export class TimelineSceneStrategy {
  /**
   * Chuyển đổi một TimelineNode thành HTML giàu định dạng để hiển thị trong TipTapContent.
   */
  public static resolveNodeContentHtml(node: TimelineNode): string {
    if (node.contentHtml && node.contentHtml.trim().length > 0) {
      return node.contentHtml;
    }

    const safeTitle = (node.title || 'Mốc sự kiện lịch sử').trim();
    const safeDesc = (node.description || '').trim();
    const rolePrefix = node.role ? `<strong>[${node.role}]</strong> ` : '';

    const parts: string[] = [`<h3>${safeTitle}</h3>`];
    if (safeDesc || rolePrefix) {
      parts.push(`<p>${rolePrefix}${safeDesc}</p>`);
    }
    if (node.detailContent && node.detailContent.trim().length > 0) {
      parts.push(node.detailContent);
    }

    return parts.join('');
  }

  /**
   * Đồng bộ ngược từ HTML của TipTapContent về lại `title` và `description`
   * để đảm bảo các bộ lọc chống trùng sự kiện, tìm kiếm và chế độ xem rút gọn luôn chính xác.
   */
  public static syncNodeFromHtml(node: TimelineNode, html: string): TimelineNode {
    if (typeof window === 'undefined') {
      return { ...node, contentHtml: html };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Tìm thẻ tiêu đề đầu tiên (h1, h2, h3, h4, strong) hoặc đoạn văn đầu tiên làm title
    const headingEl = doc.querySelector('h1, h2, h3, h4');
    let extractedTitle = node.title;
    let extractedDesc = '';

    if (headingEl && headingEl.textContent?.trim()) {
      extractedTitle = headingEl.textContent.trim();
      headingEl.remove();
      extractedDesc = (doc.body.textContent || '').trim();
    } else {
      const firstBlock = doc.body.firstElementChild;
      if (firstBlock && firstBlock.textContent?.trim()) {
        extractedTitle = firstBlock.textContent.trim().slice(0, 120);
        firstBlock.remove();
        extractedDesc = (doc.body.textContent || '').trim();
      } else {
        const plain = (doc.body.textContent || '').trim();
        if (plain) {
          extractedTitle = plain.slice(0, 80);
        }
      }
    }

    return {
      ...node,
      contentHtml: html,
      title: extractedTitle || 'Mốc sự kiện',
      description: extractedDesc || node.description || '',
    };
  }
}
