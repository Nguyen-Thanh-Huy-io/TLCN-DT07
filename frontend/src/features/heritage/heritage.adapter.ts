import { LocationType } from '@/constants/enums';
import { formatYear, shortPeriodName } from '@/features/search/search-index';
import type {
  PublicEventSummaryDto,
  PublicLocationDetailDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import type { DigitalFeature, HeritageCategory, HeritageRank, HistoricalHeritage } from './heritage.types';
import { regionLabel } from '@/utils/region.utils';

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
    // Thời kỳ gốc + giai đoạn con của di tích và của các sự kiện tại đó (dùng cho bộ lọc Thời kỳ → Triều đại).
    const periodSlugs = [site.periodSlug, ...siteEvents.map((e) => e.periodSlug)].filter((s): s is string => Boolean(s));
    const eraIds = [...new Set(periodSlugs.map((s) => rootOf(s)?.id).filter((v): v is string => Boolean(v)))];
    const subEraIds = [
      ...new Set(periodSlugs.map((s) => bySlug.get(s)).filter((p) => p?.parentId).map((p) => p!.id)),
    ];
    const figures = new Map<string, string>();
    for (const e of siteEvents) for (const f of e.figures) figures.set(f.id, f.name);
    const d = site.digital;
    const digital: DigitalFeature[] = [
      ...(d?.hasImage || site.imageUrl ? (['HAS_IMAGE'] as const) : []),
      ...(d && d.galleryCount > 0 ? (['HAS_GALLERY'] as const) : []),
      ...(d?.hasThenAndNow ? (['HAS_THEN_NOW'] as const) : []),
      ...(d?.hasChronicle ? (['HAS_CHRONICLE'] as const) : []),
      ...(d?.hasStructures ? (['HAS_STRUCTURES'] as const) : []),
    ];
    return {
      id: site.id,
      slug: site.slug,
      name: site.name,
      ancientNames: site.ancientNames ?? [],
      province: provinceOf(site.address),
      // Khu vực: theo thời kỳ gắn với di tích, không có thì theo thời kỳ của các sự kiện diễn ra tại đó.
      region: regionLabel((ownPeriod ? rootOf(ownPeriod.slug) : undefined)?.region ?? siteEvents.map((e) => rootOf(e.periodSlug)).find(Boolean)?.region ?? null),
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
      siteType: site.siteType,
      facets: {
        eraIds,
        subEraIds,
        figures: [...figures].map(([id, name]) => ({ id, name })),
        events: siteEvents.map((e) => ({ id: e.id, title: e.title })),
        preservation: site.preservationStatus ?? null,
        digital,
      },
      eventCount: siteEvents.length,
      detailLoaded: false,
      visitorInfo: { addressText: site.address ?? '', openingHours: '', preservationStatus: site.preservationStatus ?? '' },
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
