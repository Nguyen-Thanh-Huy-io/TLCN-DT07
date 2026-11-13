import { TimelineNode, TimelineOrientation, TimelineSceneStyle } from '../types/block-builder.types';

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


export interface ITimelineOrientationOption {
  orientation: TimelineOrientation;
  label: string;
  icon: string;
  description: string;
  containerClass: string;
  nodeCardClass: string;
  nodeDotClass: string;
}

export class TimelineLayoutStrategy {
  private static readonly ORIENTATIONS: Record<TimelineOrientation, ITimelineOrientationOption> = {
    [TimelineOrientation.VERTICAL]: {
      orientation: TimelineOrientation.VERTICAL,
      label: 'Dọc (Mặc định)',
      icon: '↕',
      description: 'Trục dọc truyền thống, thích hợp đọc chi tiết từ trên xuống',
      containerClass: 'relative pl-6 sm:pl-8 border-l-2 border-blue-200 ml-3 sm:ml-4 space-y-4 my-3',
      nodeCardClass: 'relative group/node bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl p-4 transition shadow-2xs hover:shadow-xs',
      nodeDotClass: 'absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-300',
    },
    [TimelineOrientation.HORIZONTAL]: {
      orientation: TimelineOrientation.HORIZONTAL,
      label: 'Ngang (Cuộn)',
      icon: '↔',
      description: 'Trục ngang trải rộng, cuộn từ trái sang phải xem toàn cảnh niên biểu',
      containerClass: 'relative overflow-x-auto flex flex-row gap-4 pt-6 pb-4 px-2 scrollbar-thin scrollbar-thumb-blue-200 border-t-2 border-blue-200 mt-6',
      nodeCardClass: 'relative group/node bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl p-4 transition shadow-2xs hover:shadow-xs min-w-[300px] max-w-[340px] shrink-0',
      nodeDotClass: 'absolute left-6 -top-[31px] w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-300',
    },
  };

  public static getOption(orientation: TimelineOrientation = TimelineOrientation.VERTICAL): ITimelineOrientationOption {
    return this.ORIENTATIONS[orientation] || this.ORIENTATIONS[TimelineOrientation.VERTICAL];
  }

  public static isHorizontal(orientation?: TimelineOrientation): boolean {
    return orientation === TimelineOrientation.HORIZONTAL;
  }
}
