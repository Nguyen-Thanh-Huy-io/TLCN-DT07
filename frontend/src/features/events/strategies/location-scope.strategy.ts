import { MapPin, Globe, HelpCircle, LucideIcon } from 'lucide-react';

export enum EventLocationKind {
  SPECIFIC_SITE = 'SPECIFIC_SITE', // Địa danh / Di tích cụ thể
  STRATEGIC_SCOPE = 'STRATEGIC_SCOPE', // Phạm vi chiến lược / Toàn quốc / Miền
  UNSPECIFIED = 'UNSPECIFIED', // Chưa xác định địa điểm cụ thể
}

export interface EventLocationResult {
  kind: EventLocationKind;
  displayName: string;
  detailAddress?: string | null;
  icon: LucideIcon;
  badgeTone: 'emerald' | 'blue' | 'neutral';
  tooltip: string;
}

interface LocationInput {
  historicalLocation?: {
    name: string;
    address?: string | null;
    type?: string | null;
  } | null;
  metadata?: Record<string, any> | null;
}

export class EventLocationScopeStrategy {
  /** Các từ khóa nhận diện phạm vi chiến lược / quy mô không gian lớn thay vì 1 tọa độ đơn lẻ */
  private static readonly SCOPE_KEYWORDS = [
    'toàn quốc',
    'cả nước',
    'miền bắc',
    'miền nam',
    'miền trung',
    'đồng bằng sông hồng',
    'đồng bằng bắc bộ',
    'nam bộ',
    'bắc bộ',
    'trung bộ',
    'tây nguyên',
    'quốc tế',
    'đông dương',
    'toàn cầu',
    'nhiều tỉnh thành',
  ];

  /** Các chuỗi rỗng / vô nghĩa cần coi là Chưa xác định */
  private static readonly UNKNOWN_KEYWORDS = [
    'chưa rõ',
    'chưa xác định',
    'không rõ',
    'toàn quốc / chưa rõ',
    'n/a',
    'unknown',
  ];

  public static resolve(input: LocationInput): EventLocationResult {
    const rawName = (
      input.historicalLocation?.name ||
      (input.metadata?.rawLocation as string) ||
      (input.metadata?.location as string) ||
      ''
    ).trim();

    // 1. Kiểm tra nếu rỗng hoặc chuỗi mang nghĩa chưa rõ
    if (!rawName || this.UNKNOWN_KEYWORDS.some((kw) => rawName.toLowerCase() === kw)) {
      return {
        kind: EventLocationKind.UNSPECIFIED,
        displayName: 'Chưa xác định địa điểm',
        icon: HelpCircle,
        badgeTone: 'neutral',
        tooltip: 'Chưa có thông tin địa danh hoặc tọa độ di tích diễn ra sự kiện.',
      };
    }

    const lower = rawName.toLowerCase();

    // 2. Kiểm tra nếu là phạm vi chiến lược / toàn quốc
    const isScope = this.SCOPE_KEYWORDS.some((kw) => lower.includes(kw));
    if (isScope) {
      return {
        kind: EventLocationKind.STRATEGIC_SCOPE,
        displayName: rawName,
        icon: Globe,
        badgeTone: 'blue',
        tooltip: 'Sự kiện có phạm vi diễn biến trên diện rộng hoặc quy mô chiến lược.',
      };
    }

    // 3. Địa điểm cụ thể (Di tích / Tọa độ / Địa phương)
    return {
      kind: EventLocationKind.SPECIFIC_SITE,
      displayName: rawName,
      detailAddress: input.historicalLocation?.address || null,
      icon: MapPin,
      badgeTone: 'emerald',
      tooltip: input.historicalLocation?.address
        ? `Địa chỉ di tích: ${input.historicalLocation.address}`
        : 'Địa danh lịch sử diễn ra sự kiện.',
    };
  }
}
