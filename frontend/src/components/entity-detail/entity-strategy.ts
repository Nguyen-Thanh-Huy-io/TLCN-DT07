import {
  Crown,
  Sparkles,
  Building2,
  Swords,
  UserRound,
  CalendarDays,
  MapPin,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export type EntityIconName =
  | 'Crown'
  | 'Sparkles'
  | 'Building2'
  | 'Swords'
  | 'UserRound'
  | 'CalendarDays'
  | 'MapPin'
  | 'BookOpen';

export interface EntityTypeConfig {
  typeKey: string;
  badgeLabel: string;
  heroEyebrow: string;
  timeLabelTitle: string;
  lifespanLabel: string;
  lifespanUnit: string;
  heroPortraitBadge: string;
  iconName: EntityIconName;
  themeColor: string;
  themeBg: string;
  routePrefix: string;
  /** Bài liền trước / liền sau cùng chuyên mục theo niên đại. */
  previousLabel: string;
  nextLabel: string;
}

const GENERIC_ADJACENT = { previousLabel: 'Bài trước', nextLabel: 'Bài tiếp theo' } as const;

const STRATEGIES: Record<string, EntityTypeConfig> = {
  DYNASTY: {
    typeKey: 'DYNASTY',
    badgeLabel: 'Triều đại',
    heroEyebrow: 'KỶ NGUYÊN & TRIỀU ĐẠI ĐẠI VIỆT',
    timeLabelTitle: 'Niên đại trị vì',
    lifespanLabel: 'Thời gian trị vì',
    lifespanUnit: 'năm',
    heroPortraitBadge: 'BẢN ĐỒ & ẤN TÍN VƯƠNG TRIỀU',
    iconName: 'Crown',
    themeColor: '#B8860B',
    themeBg: '#FFFDF5',
    routePrefix: '/thuc-the',
    previousLabel: 'Triều đại trước',
    nextLabel: 'Triều đại tiếp theo',
  },
  ARTIFACT: {
    typeKey: 'ARTIFACT',
    badgeLabel: 'Bảo vật & Cổ vật',
    heroEyebrow: 'BẢO VẬT & HIỆN VẬT LỊCH SỬ',
    timeLabelTitle: 'Niên đại chế tác',
    lifespanLabel: 'Niên đại lưu truyền',
    lifespanUnit: 'năm',
    heroPortraitBadge: 'BẢO VẬT HOÀNG GIA',
    iconName: 'Sparkles',
    themeColor: '#2E6B56',
    themeBg: '#F4FAF7',
    routePrefix: '/thuc-the',
    ...GENERIC_ADJACENT,
  },
  ORGANIZATION: {
    typeKey: 'ORGANIZATION',
    badgeLabel: 'Quốc hiệu & Thiết chế',
    heroEyebrow: 'QUỐC HIỆU & TỔ CHỨC LỊCH SỬ',
    timeLabelTitle: 'Giai đoạn tồn tại',
    lifespanLabel: 'Thời gian duy trì',
    lifespanUnit: 'năm',
    heroPortraitBadge: 'THIẾT CHẾ & THIẾT CHẾ TRIỀU ĐÌNH',
    iconName: 'Building2',
    themeColor: '#1E3A5F',
    themeBg: '#F3F7FA',
    routePrefix: '/thuc-the',
    ...GENERIC_ADJACENT,
  },
  MILITARY_FORCE: {
    typeKey: 'MILITARY_FORCE',
    badgeLabel: 'Lực lượng quân sự',
    heroEyebrow: 'LỰC LƯỢNG & ĐỘI QUÂN LỊCH SỬ',
    timeLabelTitle: 'Thời gian hoạt động',
    lifespanLabel: 'Thời gian chinh chiến',
    lifespanUnit: 'năm',
    heroPortraitBadge: 'QUÂN BỘ & THỦY BINH ĐẠI VIỆT',
    iconName: 'Swords',
    themeColor: '#8B0000',
    themeBg: '#FDF5F5',
    routePrefix: '/thuc-the',
    ...GENERIC_ADJACENT,
  },
  PERSON: {
    typeKey: 'PERSON',
    badgeLabel: 'Nhân vật lịch sử',
    heroEyebrow: 'HỒ SƠ NHÂN VẬT LỊCH SỬ',
    timeLabelTitle: 'Sinh – Mất',
    lifespanLabel: 'Hưởng thọ',
    lifespanUnit: 'tuổi',
    heroPortraitBadge: 'CHÂN DUNG DANH NHÂN LỊCH SỬ',
    iconName: 'UserRound',
    themeColor: '#8C2D19',
    themeBg: '#FAF5EE',
    routePrefix: '/nhan-vat',
    previousLabel: 'Nhân vật trước',
    nextLabel: 'Nhân vật tiếp theo',
  },
  EVENT: {
    typeKey: 'EVENT',
    badgeLabel: 'Sự kiện lịch sử',
    heroEyebrow: 'BIẾN CỐ & SỰ KIỆN LỊCH SỬ',
    timeLabelTitle: 'Thời gian diễn ra',
    lifespanLabel: 'Thời lượng sự kiện',
    lifespanUnit: 'năm',
    heroPortraitBadge: 'KÝ HỌA CHIẾN TÍCH LỊCH SỬ',
    iconName: 'CalendarDays',
    themeColor: '#8C2D19',
    themeBg: '#FDF5EE',
    routePrefix: '/su-kien',
    previousLabel: 'Sự kiện trước',
    nextLabel: 'Sự kiện tiếp theo',
  },
  LOCATION: {
    typeKey: 'LOCATION',
    badgeLabel: 'Di tích & Địa danh',
    heroEyebrow: 'DI TÍCH & ĐỊA DANH LỊCH SỬ',
    timeLabelTitle: 'Niên đại khởi dựng',
    lifespanLabel: 'Tồn tại đến nay',
    lifespanUnit: 'năm',
    heroPortraitBadge: 'DANH THẮNG & DI TÍCH KHẢO CỔ',
    iconName: 'MapPin',
    themeColor: '#2F4F4F',
    themeBg: '#F4F7F7',
    routePrefix: '/di-tich',
    previousLabel: 'Di tích trước',
    nextLabel: 'Di tích tiếp theo',
  },
};

const DEFAULT_STRATEGY: EntityTypeConfig = {
  typeKey: 'OTHER',
  badgeLabel: 'Thực thể lịch sử',
  heroEyebrow: 'TƯ LIỆU THỰC THỂ LỊCH SỬ',
  timeLabelTitle: 'Thời gian xác định',
  lifespanLabel: 'Thời gian lưu dấu',
  lifespanUnit: 'năm',
  heroPortraitBadge: 'TƯ LIỆU BẢO TÀNG SỐ',
  iconName: 'BookOpen',
  themeColor: '#5C4033',
  themeBg: '#FAF7F2',
  routePrefix: '/thuc-the',
  ...GENERIC_ADJACENT,
};

const ICON_MAP: Record<EntityIconName, LucideIcon> = {
  Crown,
  Sparkles,
  Building2,
  Swords,
  UserRound,
  CalendarDays,
  MapPin,
  BookOpen,
};

/**
 * Trả về LucideIcon component tương ứng với iconName để render ở Client Component.
 */
export function getEntityIconComponent(iconName: EntityIconName | string): LucideIcon {
  return ICON_MAP[iconName as EntityIconName] || BookOpen;
}

/**
 * Strategy Pattern: Trả về quy tắc hiển thị và nhãn phù hợp cho từng loại thực thể (OCP).
 * Đối tượng trả về hoàn toàn là plain serializable object, an toàn khi truyền qua Server-to-Client boundary.
 */
export function getEntityTypeStrategy(type: string | null | undefined): EntityTypeConfig {
  if (!type) return DEFAULT_STRATEGY;
  return STRATEGIES[type.toUpperCase()] || DEFAULT_STRATEGY;
}
