import { formatYear, shortPeriodName } from '@/features/search/search-index';
import { type PublicEventSummaryDto, type PublicLocationSummaryDto, type PublicPeriodDto } from '@/services/entities/landing.service';

// === heritage.types.ts ===
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
  /** Mã loại di tích chuẩn hóa. */
  siteType?: string;
  /** Số sự kiện gắn với di tích (biết trước khi tải chi tiết). */
  eventCount?: number;
  /** false = mới có thông tin tóm tắt, chi tiết (sự kiện, hạng mục...) chưa tải. */
  detailLoaded?: boolean;
  /** Nội dung tường thuật dạng khối (Block Builder); null/undefined = chưa có bài viết chi tiết. */
  contentBlocks?: unknown;
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

/** Hiện trạng chuẩn hóa — đúng 5 nhóm, đồng bộ SITE_PRESERVATION_CODES ở backend/src/article/article-metadata.ts. */
export type PreservationCategory = 'INTACT' | 'MUSEUM_MEMORIAL' | 'ARCHAEOLOGICAL_RUIN' | 'RESTORED' | 'ACTIVE_SITE';

export const PRESERVATION_LABELS: Record<PreservationCategory, string> = {
  INTACT: '🏛️ Bảo tồn nguyên vẹn',
  MUSEUM_MEMORIAL: '🕯️ Bảo tàng & Khu tưởng niệm',
  ARCHAEOLOGICAL_RUIN: '🏺 Phế tích & Khảo cổ',
  RESTORED: '🛠️ Đã trùng tu / Phục dựng',
  ACTIVE_SITE: '🚀 Công trình đang hoạt động',
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

// === heritage.adapter.ts ===
/** Loại di tích chi tiết của hệ thống → nhóm loại hình hiển thị. */
const CATEGORY_BY_SITE_TYPE: Record<string, HeritageCategory> = {
  ANCIENT_CAPITAL: 'CITADEL_PALACE',
  CITADEL: 'CITADEL_PALACE',
  PALACE: 'CITADEL_PALACE',
  TEMPLE: 'TEMPLE_SHRINE',
  RESISTANCE_BASE: 'REVOLUTIONARY_BASE',
};

/** Địa phương = phần cuối của địa chỉ (tỉnh / thành / vùng), bỏ tiền tố hành chính kiểu Việt Nam nếu có. */
function provinceOf(address: string | null): string {
  const last = address?.split(',').pop()?.trim();
  if (!last) return 'Chưa rõ địa phương';
  const name = last.replace(/^(tỉnh|thành phố|tp\.?)\s*/i, '').trim();
  return /^hồ chí minh$/i.test(name) ? 'TP. Hồ Chí Minh' : name;
}

function periodHelpers(periods: PublicPeriodDto[]) {
  const bySlug = new Map(periods.map((p) => [p.slug, p]));
  const byId = new Map(periods.map((p) => [p.id, p]));
  const rootOf = (slug: string | null | undefined) => {
    let p = slug ? bySlug.get(slug) : undefined;
    while (p?.parentId && byId.has(p.parentId)) p = byId.get(p.parentId);
    return p;
  };
  return { bySlug, rootOf };
}

/** Thông tin tóm tắt cho thẻ di tích (chưa có sự kiện, hạng mục, biên niên). */
export function toHeritageSummaries(
  sites: PublicLocationSummaryDto[],
  events: PublicEventSummaryDto[],
  periods: PublicPeriodDto[],
): HistoricalHeritage[] {
  const { bySlug, rootOf } = periodHelpers(periods);
  return sites.map((site) => {
    const siteEvents = events.filter((e) => e.locations.some((l) => l.id === site.id));
    const ownPeriod = site.periodSlug ? bySlug.get(site.periodSlug) : undefined;
    const eras = [...new Set(siteEvents.map((e) => rootOf(e.periodSlug)).filter(Boolean).map((p) => shortPeriodName(p!.name)))];
    const firstEvent = [...siteEvents].sort((a, b) => a.startYear - b.startYear)[0];
    return {
      id: site.id,
      slug: site.slug,
      name: site.name,
      ancientNames: site.ancientNames ?? [],
      province: provinceOf(site.address),
      category: CATEGORY_BY_SITE_TYPE[site.siteType ?? ''] ?? 'MEMORIAL_STELE',
      recognizedYear: '',
      // Thời kỳ khởi dựng: niên đại xây dựng nếu có, rồi thời kỳ gắn với di tích, rồi sự kiện sớm nhất.
      foundedEra:
        site.constructionLabel ||
        (ownPeriod ? shortPeriodName(ownPeriod.name) : firstEvent ? `Từ năm ${formatYear(firstEvent.startYear)}` : 'Chưa rõ'),
      relatedEras: eras,
      shortSummary: site.historicalSignificance ?? '',
      architecturalStyle: '',
      coverImageUrl: site.imageUrl ?? null,
      galleryImages: site.imageUrl ? [{ url: site.imageUrl, caption: site.name }] : [],
      constructionTimeline: [],
      subStructures: [],
      linkedEvents: [],
      linkedFigures: [],
      siteTypeLabel: site.siteTypeLabel,
      siteType: site.siteType,
      eventCount: siteEvents.length,
      detailLoaded: false,
      managingUnit: site.managingUnit ?? null,
      statusNote: site.statusNote ?? null,
      visitorInfo: {
        addressText: site.address ?? '',
        openingHours: '',
        preservationStatus: site.preservationCategory ? PRESERVATION_LABELS[site.preservationCategory as PreservationCategory] : '',
      },
    };
  });
}
