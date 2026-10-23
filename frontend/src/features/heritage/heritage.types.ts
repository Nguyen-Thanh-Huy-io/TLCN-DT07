/** Cấp xếp hạng di tích. */
export type HeritageRank = 'UNESCO' | 'INTERNATIONAL' | 'SPECIAL_NATIONAL' | 'NATIONAL' | 'PROVINCIAL' | 'UNRANKED';

/** Loại hình di tích. */
export type HeritageCategory = 'CITADEL_PALACE' | 'TEMPLE_SHRINE' | 'REVOLUTIONARY_BASE' | 'MEMORIAL_STELE';


/** Hạng mục kiến trúc / hiện vật bên trong khu di tích. */
export interface SubStructureItem {
  id: string;
  name: string;
  type: 'ARCHITECTURE' | 'NATIONAL_TREASURE';
  periodBuilt: string;
  description: string;
  imageUrl: string | null;
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
  /** Địa phương (tỉnh / thành / vùng) lấy từ địa chỉ. */
  province: string;
  /** Quốc gia / khu vực dùng chung toàn hệ thống (Việt Nam, Châu Á, Châu Âu...) — xem utils/region.utils. */
  region: string;
  rank: HeritageRank;
  category: HeritageCategory;
  /** Rỗng = chưa có dữ liệu năm công nhận. */
  recognizedYear: string;
  foundedEra: string;
  relatedEras: string[];
  shortSummary: string;
  architecturalStyle: string;
  /** null = chưa có ảnh (hiện nền + biểu tượng loại hình). */
  coverImageUrl: string | null;
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
  /** Loại di tích chi tiết (từ dữ liệu hệ thống), vd. "Chiến trường", "Cố đô / Kinh thành". */
  siteTypeLabel?: string;
  /** Mã loại di tích chuẩn hóa (LocationType) — dùng cho bộ lọc "Loại hình di tích". */
  siteType?: string;
  /** Dữ liệu tính sẵn để lọc ở danh sách (trước khi tải chi tiết). */
  facets?: HeritageFacets;
  /** Số sự kiện gắn với di tích (biết trước khi tải chi tiết). */
  eventCount?: number;
  /** false = mới có thông tin tóm tắt, chi tiết (sự kiện, hạng mục...) chưa tải. */
  detailLoaded?: boolean;
  /** Đơn vị quản lý (bảo tàng, cơ quan...) và ghi chú hiện trạng — hiển thị, không dùng để lọc. */
  managingUnit?: string | null;
  statusNote?: string | null;
  visitorInfo: {
    addressText: string;
    openingHours: string;
    /** Nhãn hiện trạng chuẩn hóa (rỗng = chưa có). */
    preservationStatus: string;
  };
}

export type DigitalFeature = 'HAS_IMAGE' | 'HAS_GALLERY' | 'HAS_THEN_NOW' | 'HAS_CHRONICLE' | 'HAS_STRUCTURES';

export const DIGITAL_FEATURE_LABELS: Record<DigitalFeature, string> = {
  HAS_IMAGE: 'Có ảnh di tích',
  HAS_GALLERY: 'Có thư viện ảnh',
  HAS_THEN_NOW: 'Có đối chiếu Xưa – Nay',
  HAS_CHRONICLE: 'Có biên niên xây dựng – trùng tu',
  HAS_STRUCTURES: 'Có hạng mục / hiện vật',
};

/** Hiện trạng chuẩn hóa — bộ lọc cố định đúng 5 nhóm (đồng bộ backend preservation-status.constant). */
export type PreservationCategory = 'INTACT' | 'MUSEUM_MEMORIAL' | 'ARCHAEOLOGICAL_RUIN' | 'RESTORED' | 'ACTIVE_SITE';

export const PRESERVATION_LABELS: Record<PreservationCategory, string> = {
  INTACT: '🏛️ Bảo tồn nguyên vẹn',
  MUSEUM_MEMORIAL: '🕯️ Bảo tàng & Khu tưởng niệm',
  ARCHAEOLOGICAL_RUIN: '🏺 Phế tích & Khảo cổ',
  RESTORED: '🛠️ Đã trùng tu / Phục dựng',
  ACTIVE_SITE: '🚀 Công trình đang hoạt động',
};

export interface HeritageFacets {
  /** Thời kỳ gốc và giai đoạn con (id Period) của di tích và các sự kiện tại đó. */
  eraIds: string[];
  subEraIds: string[];
  figures: Array<{ id: string; name: string }>;
  events: Array<{ id: string; title: string }>;
  /** Mã hiện trạng chuẩn hóa (null = chưa có thông tin). */
  preservation: PreservationCategory | null;
  digital: DigitalFeature[];
}

export const RANK_LABELS: Record<HeritageRank, string> = {
  UNESCO: 'Di sản Thế giới UNESCO',
  INTERNATIONAL: 'Di tích được công nhận quốc tế',
  SPECIAL_NATIONAL: 'Di tích cấp quốc gia đặc biệt',
  NATIONAL: 'Di tích cấp quốc gia',
  PROVINCIAL: 'Di tích cấp địa phương',
  UNRANKED: 'Chưa có thông tin xếp hạng',
};

export const RANK_SHORT_LABELS: Record<HeritageRank, string> = {
  UNESCO: 'UNESCO',
  INTERNATIONAL: 'Công nhận quốc tế',
  SPECIAL_NATIONAL: 'Quốc gia đặc biệt',
  NATIONAL: 'Cấp quốc gia',
  PROVINCIAL: 'Cấp địa phương',
  UNRANKED: 'Chưa xếp hạng',
};

export const CATEGORY_LABELS: Record<HeritageCategory, string> = {
  CITADEL_PALACE: 'Thành lũy & Cung điện',
  TEMPLE_SHRINE: 'Đền, Chùa & Lăng tẩm',
  REVOLUTIONARY_BASE: 'Căn cứ địa & Di tích Cách mạng',
  MEMORIAL_STELE: 'Chiến trường, Tưởng niệm & Chứng tích',
};

export const ACTION_LABELS: Record<ConstructionActionType, string> = {
  FOUNDED: 'Khởi dựng',
  EXPANDED: 'Mở rộng',
  DAMAGED: 'Biến cố / Tàn phá',
  RESTORED: 'Trùng tu / Bảo tồn',
};
