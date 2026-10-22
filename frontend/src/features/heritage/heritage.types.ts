/** Cấp xếp hạng di tích. */
export type HeritageRank = 'UNESCO' | 'SPECIAL_NATIONAL' | 'NATIONAL' | 'PROVINCIAL';

/** Loại hình di tích. */
export type HeritageCategory = 'CITADEL_PALACE' | 'TEMPLE_SHRINE' | 'REVOLUTIONARY_BASE' | 'MEMORIAL_STELE';

export type HeritageRegion = 'NORTH' | 'CENTRAL' | 'SOUTH';

/** Hạng mục kiến trúc / hiện vật bên trong khu di tích. */
export interface SubStructureItem {
  id: string;
  name: string;
  type: 'ARCHITECTURE' | 'NATIONAL_TREASURE';
  periodBuilt: string;
  description: string;
  imageUrl: string;
}

export type ConstructionActionType = 'FOUNDED' | 'EXPANDED' | 'DAMAGED' | 'RESTORED';

export interface ConstructionMilestone {
  id: string;
  dateLabel: string;
  dynasty: string;
  actionType: ConstructionActionType;
  description: string;
}

export interface HistoricalHeritage {
  id: string;
  slug: string;
  name: string;
  ancientNames: string[];
  province: string;
  region: HeritageRegion;
  rank: HeritageRank;
  category: HeritageCategory;
  recognizedYear: string;
  foundedEra: string;
  relatedEras: string[];
  shortSummary: string;
  architecturalStyle: string;
  coverImageUrl: string;
  galleryImages: Array<{ url: string; caption: string; periodLabel?: string }>;
  thenAndNowComparison?: {
    ancientImageUrl: string;
    ancientLabel: string;
    modernImageUrl: string;
    modernLabel: string;
  };
  constructionTimeline: ConstructionMilestone[];
  subStructures: SubStructureItem[];
  /** `slug` rỗng = sự kiện chưa có trang trong hệ thống (hiển thị nhưng không liên kết). */
  linkedEvents: Array<{ id: string; title: string; dateLabel: string; slug: string }>;
  /** `slug` có thì liên kết sang /nhan-vat/[slug]. */
  linkedFigures: Array<{ id: string; name: string; role: string; avatarUrl?: string; slug?: string }>;
  visitorInfo: {
    addressText: string;
    openingHours: string;
    preservationStatus: string;
  };
}

export const RANK_LABELS: Record<HeritageRank, string> = {
  UNESCO: 'Di sản Thế giới UNESCO',
  SPECIAL_NATIONAL: 'Di tích Quốc gia Đặc biệt',
  NATIONAL: 'Di tích cấp Quốc gia',
  PROVINCIAL: 'Di tích cấp Tỉnh',
};

export const RANK_SHORT_LABELS: Record<HeritageRank, string> = {
  UNESCO: 'UNESCO',
  SPECIAL_NATIONAL: 'Quốc gia Đặc biệt',
  NATIONAL: 'Cấp Quốc gia',
  PROVINCIAL: 'Cấp Tỉnh',
};

export const CATEGORY_LABELS: Record<HeritageCategory, string> = {
  CITADEL_PALACE: 'Thành lũy & Cung điện',
  TEMPLE_SHRINE: 'Đền, Chùa & Lăng tẩm',
  REVOLUTIONARY_BASE: 'Căn cứ địa & Di tích Cách mạng',
  MEMORIAL_STELE: 'Bia tưởng niệm & Chứng tích',
};

export const REGION_LABELS: Record<HeritageRegion, string> = {
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam',
};

export const ACTION_LABELS: Record<ConstructionActionType, string> = {
  FOUNDED: 'Khởi dựng',
  EXPANDED: 'Mở rộng',
  DAMAGED: 'Biến cố / Tàn phá',
  RESTORED: 'Trùng tu / Bảo tồn',
};
