import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
  IWikipediaSearchResponse,
  IWikipediaSummaryResponse,
} from '../../types/entity-source.types';
import { ENTITY_SOURCE_CONSTANTS } from '../../constants/entity-source.constants';

/**
 * Adapter Pattern: Chuyển đổi và chuẩn hóa cấu trúc dữ liệu thô từ Wikipedia REST API
 * sang cấu trúc dữ liệu chuẩn mực của hệ sinh thái HISGO.
 */
export class WikipediaEntityAdapter {
  /**
   * Chuyển đổi danh sách kết quả tìm kiếm từ Wikipedia REST API
   */
  public static adaptSearchResults(
    data: IWikipediaSearchResponse,
  ): IEntitySearchResult[] {
    if (!data?.pages || !Array.isArray(data.pages)) {
      return [];
    }

    return data.pages.map((page) => {
      let thumb = page.thumbnail?.url || '';
      if (thumb.startsWith('//')) {
        thumb = 'https:' + thumb;
      }

      return {
        id: String(page.id || page.key),
        title: page.title,
        description: page.description || page.excerpt || '',
        thumbnailUrl: thumb,
        sourceType: EntitySourceType.WIKIPEDIA,
        rawKey: page.key,
      };
    });
  }

  /**
   * Chuyển đổi tóm tắt chi tiết trang Wikipedia thành thông tin xem trước bài học
   */
  public static adaptEntityDetail(
    summary: IWikipediaSummaryResponse,
  ): IEntityDetailPreview {
    const rawExtract = summary.extract || summary.description || '';
    // Ưu tiên 1: Bóc tách năm từ description (vì Wikipedia luôn đặt năm sinh - năm mất của nhân vật trong description)
    let years = this.extractYearsFromText(summary.description || '', summary.title);
    if (!years) {
      years = this.extractYearsFromText(rawExtract, summary.title);
    }

    const trimmedSummary = this.trimToMaxCharacters(
      rawExtract,
      ENTITY_SOURCE_CONSTANTS.WIKIPEDIA_API.MAX_SUMMARY_LENGTH,
    );

    let avatarUrl = summary.thumbnail?.source || summary.originalimage?.source || '';
    if (avatarUrl.startsWith('//')) {
      avatarUrl = 'https:' + avatarUrl;
    }

    return {
      name: summary.title,
      years,
      summary: trimmedSummary,
      avatarUrl,
      tagline: summary.description || '',
      sourceUrl: summary.content_urls?.desktop?.page || '',
      sourceType: EntitySourceType.WIKIPEDIA,
    };
  }

  /**
   * Bóc tách năm sinh - năm mất hoặc mốc thời gian từ văn bản tóm tắt
   * Hỗ trợ các mẫu tiếng Việt: (1911 – 2013), (sinh 1911), (1890 – 1969)...
   */
  public static extractYearsFromText(text: string, title?: string): string {
    if (!text) return '';

    // Mẫu 1: Dạng nằm trong ngoặc tròn (1911 – 2013) hoặc (1911-2013) hoặc (1911—2013)
    const parenRangeMatch = text.match(
      /\((\d{1,4}(?:\s*TCN)?)\s*[-–—]\s*(\d{1,4}(?:\s*TCN)?|nay|Nay)?\)/,
    );
    if (parenRangeMatch) {
      const start = parenRangeMatch[1];
      const end = parenRangeMatch[2] ? parenRangeMatch[2].trim() : 'Nay';
      return `${start} – ${end}`;
    }

    // Mẫu 2: Dạng năm không nằm trong ngoặc nhưng ở 100 ký tự đầu: "1911 – 2013"
    const prefix = text.slice(0, 120);
    const rangeMatch = prefix.match(/\b(\d{4})\s*[-–—]\s*(\d{4})\b/);
    if (rangeMatch) {
      return `${rangeMatch[1]} – ${rangeMatch[2]}`;
    }

    // Mẫu 3: Dạng sinh năm / mất năm
    const birthMatch = prefix.match(/(?:sinh|năm sinh)\s*(?:ngày\s*\d+\s*tháng\s*\d+\s*năm\s*)?(\d{4})/i);
    const deathMatch = prefix.match(/(?:mất|từ trần|hy sinh|qua đời)\s*(?:năm\s*)?(\d{4})/i);
    if (birthMatch && deathMatch) {
      return `${birthMatch[1]} – ${deathMatch[1]}`;
    }
    if (birthMatch) {
      return `${birthMatch[1]} – Nay`;
    }

    // Mẫu 4: Dạng năm của sự kiện (Vd: "năm 1954", "năm 1945")
    const eventYearMatch = prefix.match(/(?:năm|tháng\s*\d+\s*năm)\s*(\d{4})/i);
    if (eventYearMatch) {
      return `Năm ${eventYearMatch[1]}`;
    }

    return '';
  }

  /**
   * Cắt gọt chuỗi an toàn đến dấu câu gần nhất nhưng không vượt quá maxChars
   */
  public static trimToMaxCharacters(text: string, maxChars: number): string {
    if (!text || text.length <= maxChars) {
      return text;
    }

    // Cắt ngắn tạm thời
    const truncated = text.substring(0, maxChars);
    // Tìm vị trí dấu chấm hoặc dấu chấm than/hỏi cuối cùng trong đoạn cắt
    const lastPunctuation = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('.\n'),
      truncated.lastIndexOf('; '),
    );

    // Nếu tìm thấy dấu chấm kết câu cách mép cuối không quá 80 ký tự thì ngắt ở đó
    if (lastPunctuation > maxChars - 120) {
      return truncated.substring(0, lastPunctuation + 1).trim();
    }

    // Nếu không có dấu câu phù hợp, cắt đến từ cuối cùng và thêm dấu "..."
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace).trim() + '...';
    }

    return truncated + '...';
  }
}
