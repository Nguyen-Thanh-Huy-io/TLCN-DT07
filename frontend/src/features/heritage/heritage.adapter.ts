import { LocationType } from '@/constants/enums';
import { formatYear, shortPeriodName } from '@/features/search/search-index';
import type {
  PublicEventSummaryDto,
  PublicLocationDetailDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import type { HeritageCategory, HeritageRank, HeritageRegion, HistoricalHeritage } from './heritage.types';

/** Loại di tích chi tiết của hệ thống → nhóm loại hình hiển thị. */
const CATEGORY_BY_SITE_TYPE: Record<string, HeritageCategory> = {
  [LocationType.ANCIENT_CAPITAL]: 'CITADEL_PALACE',
  [LocationType.CITADEL]: 'CITADEL_PALACE',
  [LocationType.PALACE]: 'CITADEL_PALACE',
  [LocationType.TEMPLE]: 'TEMPLE_SHRINE',
  [LocationType.RESISTANCE_BASE]: 'REVOLUTIONARY_BASE',
};

/** Xếp hạng lưu dạng chữ tự do ("Di tích Quốc gia đặc biệt", "UNESCO"...) → mã. */
function rankOf(level: string | null | undefined): HeritageRank {
  const t = (level ?? '').toLocaleLowerCase('vi');
  if (!t) return 'UNRANKED';
  if (t.includes('unesco') || t.includes('thế giới')) return 'UNESCO';
  if (t.includes('đặc biệt')) return 'SPECIAL_NATIONAL';
  if (t.includes('quốc gia')) return 'NATIONAL';
  if (t.includes('tỉnh') || t.includes('thành phố')) return 'PROVINCIAL';
  return 'UNRANKED';
}

/** Tỉnh / thành = phần cuối của địa chỉ, bỏ tiền tố hành chính. */
function provinceOf(address: string | null): string {
  const last = address?.split(',').pop()?.trim();
  if (!last) return 'Chưa rõ tỉnh thành';
  // Bỏ tiền tố hành chính để "TP. Hà Nội" và "Hà Nội" là một mục lọc; riêng TP. Hồ Chí Minh giữ tên đầy đủ.
  const name = last.replace(/^(tỉnh|thành phố|tp\.?)\s*/i, '').trim();
  return /^hồ chí minh$/i.test(name) ? 'TP. Hồ Chí Minh' : name;
}

const NORTH_PROVINCES = /hà nội|hải phòng|quảng ninh|bắc ninh|bắc giang|hải dương|hưng yên|thái bình|nam định|ninh bình|hà nam|vĩnh phúc|phú thọ|thái nguyên|tuyên quang|hà giang|cao bằng|lạng sơn|lào cai|yên bái|điện biên|lai châu|sơn la|hòa bình|bắc kạn/;
const CENTRAL_PROVINCES = /thanh hóa|nghệ an|hà tĩnh|quảng bình|quảng trị|huế|đà nẵng|quảng nam|quảng ngãi|bình định|phú yên|khánh hòa|ninh thuận|bình thuận|kon tum|gia lai|đắk lắk|đắk nông|lâm đồng/;

/**
 * Vùng miền: theo vĩ độ nếu có tọa độ (ranh giới xấp xỉ Bắc Bộ ~20°B, Nam Bộ ~11.5°B),
 * không có thì đoán theo tên tỉnh trong địa chỉ.
 */
function regionOf(site: PublicLocationSummaryDto): HeritageRegion {
  if (site.latitude != null) return site.latitude >= 20 ? 'NORTH' : site.latitude >= 11.5 ? 'CENTRAL' : 'SOUTH';
  const addr = (site.address ?? '').toLocaleLowerCase('vi');
  if (!addr) return 'UNKNOWN';
  if (NORTH_PROVINCES.test(addr)) return 'NORTH';
  if (CENTRAL_PROVINCES.test(addr)) return 'CENTRAL';
  return 'SOUTH';
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

/** Thông tin tóm tắt cho thẻ / bộ lọc (chưa có sự kiện, hạng mục, biên niên). */
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
      region: regionOf(site),
      rank: rankOf(site.recognitionLevel),
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
      eventCount: siteEvents.length,
      detailLoaded: false,
      visitorInfo: { addressText: site.address ?? '', openingHours: '', preservationStatus: '' },
    };
  });
}

/** Bổ sung phần chi tiết (sự kiện, nhân vật, hồ sơ di sản) vào một di tích đã có tóm tắt. */
export function withHeritageDetail(base: HistoricalHeritage, d: PublicLocationDetailDto): HistoricalHeritage {
  const h = d.heritage;
  const gallery = [
    ...(d.imageUrl ? [{ url: d.imageUrl, caption: d.imageCaption || d.name }] : []),
    ...d.media.filter((m) => m.type === 'IMAGE').map((m) => ({ url: m.url, caption: m.caption ?? d.name })),
  ];
  return {
    ...base,
    recognizedYear: h.recognizedYear ?? '',
    architecturalStyle: h.architecturalStyle ?? '',
    shortSummary: d.description || base.shortSummary,
    foundedEra: d.constructionLabel || (d.constructionYear != null ? formatYear(d.constructionYear) : base.foundedEra),
    galleryImages: gallery,
    thenAndNowComparison: h.thenAndNow ?? undefined,
    constructionTimeline: h.constructionTimeline,
    subStructures: h.subStructures,
    linkedEvents: d.events.map((e) => ({
      id: e.id,
      title: e.title,
      dateLabel: e.eventDateNote && e.eventDateNote.length <= 24 ? e.eventDateNote : formatYear(e.startYear),
      slug: e.slug ?? '',
    })),
    linkedFigures: d.figures.map((f) => ({
      id: f.id,
      name: f.name,
      role: f.tagline ?? '',
      avatarUrl: f.imageUrl ?? undefined,
      slug: f.slug,
    })),
    detailLoaded: true,
    visitorInfo: {
      addressText: d.address ?? '',
      openingHours: h.openingHours ?? '',
      preservationStatus: d.preservationStatus ?? '',
    },
  };
}
