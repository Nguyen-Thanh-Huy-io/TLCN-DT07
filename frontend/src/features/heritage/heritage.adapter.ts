import { formatYear, shortPeriodName } from '@/features/search/search-index';
import type {
  PublicEventSummaryDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import {
  PRESERVATION_LABELS,
  type HeritageCategory,
  type HistoricalHeritage,
  type PreservationCategory,
} from './heritage.types';

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
