import type {
  PublicEventSummaryDto,
  PublicFigureProfileDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import type { LearningPathItem } from '@/services/entities/learning-path.service';
import type { LibraryLesson } from '@/services/entities/learner.service';
import { regionLabel, sortedRegions } from '@/utils/region.utils';
import { formatYear, shortPeriodName } from '@/features/search/search-index';
import type {
  LandingCourse,
  LandingData,
  LandingEra,
  LandingFigure,
  LandingLocation,
  LandingQuiz,
  LandingSpotlight,
  LandingTimelineNode,
  ParallelBand,
} from './landing.types';

export interface LandingSource {
  periods: PublicPeriodDto[];
  events: PublicEventSummaryDto[];
  figures: PublicFigureProfileDto[];
  locations: PublicLocationSummaryDto[];
  lessons: LibraryLesson[];
  paths: LearningPathItem[];
}

export const LANDING_ROUTES = {
  TIMELINE: '/dong-thoi-gian',
  CURRICULUM: '/chuong-trinh-hoc',
  FIGURES: '/nhan-vat',
  LOCATIONS: '/di-tich',
  EVENT: (slug: string) => `/su-kien/${slug}`,
  FIGURE: (slug: string) => `/nhan-vat/${slug}`,
  PERIOD: (slug: string) => `/giai-doan/${slug}`,
  LESSON: (slug: string) => `/bai-hoc/${slug}`,
} as const;

const COURSE_COVERS = ['/assets/hero.jpg', '/assets/citadel.jpg', '/assets/temple.jpg', '/assets/mountain.jpg'];
const ERA_SIZES: LandingEra['size'][] = ['wide', 'tall', 'normal', 'wide', 'normal', 'normal'];
const PATH_KIND_LABELS: Record<LearningPathItem['pathType'], string> = {
  CHRONOLOGICAL: 'Theo dòng thời gian',
  THEMATIC: 'Theo chủ đề',
};

export { regionLabel, formatYear, shortPeriodName };

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Map slug thời kỳ → thời kỳ gốc (cấp cao nhất) để gom số liệu theo kỷ nguyên. */
function rootResolver(periods: PublicPeriodDto[]) {
  const byId = new Map(periods.map((p) => [p.id, p]));
  const bySlug = new Map(periods.map((p) => [p.slug, p]));
  return (slug: string | null | undefined): PublicPeriodDto | null => {
    let current = slug ? bySlug.get(slug) : undefined;
    while (current?.parentId && byId.has(current.parentId)) current = byId.get(current.parentId);
    return current ?? null;
  };
}

function countBy<T>(items: T[], key: (item: T) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Lấy n phần tử rải đều trên mảng đã sắp xếp. */
export function spreadEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) => items[Math.round((i * (items.length - 1)) / (n - 1))]);
}

function eventRegion(event: PublicEventSummaryDto, rootOf: ReturnType<typeof rootResolver>): string {
  return regionLabel(rootOf(event.periodSlug)?.region);
}

function buildSpotlights(events: PublicEventSummaryDto[], rootOf: ReturnType<typeof rootResolver>): LandingSpotlight[] {
  const withSlug = events.filter((e) => e.slug);
  // Ưu tiên sự kiện có ảnh, rồi rải theo khu vực để tâm điểm không chỉ một vùng.
  const ranked = [...withSlug].sort((a, b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)));
  const picked: PublicEventSummaryDto[] = [];
  const seenRegions = new Set<string>();
  for (const e of ranked) {
    const region = eventRegion(e, rootOf);
    if (picked.length < 4 && (!seenRegions.has(region) || e.imageUrl)) {
      picked.push(e);
      seenRegions.add(region);
    }
  }
  return picked.map((e) => {
    const root = rootOf(e.periodSlug);
    return {
      id: e.id,
      yearLabel: formatYear(e.startYear),
      era: root ? shortPeriodName(root.name) : '',
      region: eventRegion(e, rootOf),
      title: e.title,
      summary: truncate(e.description, 190),
      imageUrl: e.imageUrl,
      figures: e.figures.slice(0, 3).map((f) => f.name),
      href: LANDING_ROUTES.EVENT(e.slug as string),
    };
  });
}

function buildEras(
  periods: PublicPeriodDto[],
  events: PublicEventSummaryDto[],
  figures: PublicFigureProfileDto[],
  rootOf: ReturnType<typeof rootResolver>,
): LandingEra[] {
  const roots = periods.filter((p) => !p.parentId).sort((a, b) => a.startYear - b.startYear);
  const eventCounts = countBy(events, (e) => rootOf(e.periodSlug)?.id ?? null);
  const figureCounts = countBy(figures, (f) => rootOf(f.periodSlug)?.id ?? null);
  return roots.map((root, i) => ({
    id: root.id,
    name: shortPeriodName(root.name),
    years: root.timeLabel,
    region: regionLabel(root.region),
    subEras: periods
      .filter((p) => p.parentId === root.id)
      .sort((a, b) => a.startYear - b.startYear)
      .slice(0, 3)
      .map((p) => truncate(shortPeriodName(p.name).split(':')[0], 26)),
    eventCount: eventCounts.get(root.id) ?? 0,
    figureCount: figureCounts.get(root.id) ?? 0,
    imageUrl: root.coverImageUrl,
    size: ERA_SIZES[i % ERA_SIZES.length],
    href: LANDING_ROUTES.PERIOD(root.slug),
  }));
}

function buildTimeline(events: PublicEventSummaryDto[], rootOf: ReturnType<typeof rootResolver>): LandingTimelineNode[] {
  return [...events]
    .filter((e) => e.slug)
    .sort((a, b) => a.startYear - b.startYear)
    .map((e) => ({
      id: e.id,
      year: e.startYear,
      yearLabel: formatYear(e.startYear),
      title: e.title,
      summary: truncate(e.description, 220),
      figure: e.figures[0]?.name ?? null,
      location: e.locations[0]?.name ?? e.location,
      region: eventRegion(e, rootOf),
      href: LANDING_ROUTES.EVENT(e.slug as string),
    }));
}

function buildBands(periods: PublicPeriodDto[]): ParallelBand[] {
  const currentYear = new Date().getFullYear();
  return periods
    .filter((p) => !p.parentId)
    .map((p) => ({
      id: p.id,
      name: shortPeriodName(p.name),
      years: p.timeLabel,
      region: regionLabel(p.region),
      start: p.startYear,
      end: p.endYear ?? currentYear,
      href: LANDING_ROUTES.PERIOD(p.slug),
    }))
    .sort((a, b) => a.start - b.start);
}

function figureYears(f: PublicFigureProfileDto): string | null {
  const birth = f.birthDateLabel ?? (f.birthYear != null ? formatYear(f.birthYear) : null);
  const death = f.deathDateLabel ?? (f.deathYear != null ? formatYear(f.deathYear) : null);
  if (!birth && !death) return null;
  return `${birth ?? '?'} — ${death ?? '?'}`;
}

function buildFigures(figures: PublicFigureProfileDto[]): LandingFigure[] {
  return [...figures]
    .sort((a, b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)) || b.events.length - a.events.length)
    .slice(0, 8)
    .map((f) => ({
      id: f.id,
      name: f.name,
      years: figureYears(f),
      roles: (f.roles.length ? f.roles : f.titles).slice(0, 2),
      quote: f.legacy?.famousQuote || f.tagline,
      eventCount: f.events.length,
      imageUrl: f.imageUrl,
      href: LANDING_ROUTES.FIGURE(f.slug),
    }));
}

function buildLocations(locations: PublicLocationSummaryDto[], events: PublicEventSummaryDto[]): LandingLocation[] {
  const counts = countBy(
    events.flatMap((e) => e.locations),
    (l) => l.id,
  );
  return [...locations]
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      name: l.name,
      address: l.address,
      significance: truncate(l.historicalSignificance, 120),
      eventCount: counts.get(l.id) ?? 0,
      href: LANDING_ROUTES.LOCATIONS,
    }));
}

function buildCourses(paths: LearningPathItem[]): LandingCourse[] {
  return paths
    .filter((p) => p.status === 'PUBLISHED')
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 3)
    .map((p, i) => {
      const lessons = (p.chapters || []).flatMap((ch) =>
        (ch.chapterLessons || [])
          .filter((cl) => cl.lesson?.status === 'PUBLISHED')
          .map((cl) => ({ id: cl.lesson.id, slug: cl.lesson.slug })),
      );
      return {
        id: p.id,
        title: p.title,
        kind: PATH_KIND_LABELS[p.pathType] ?? 'Lộ trình',
        chapters: (p.chapters || []).length,
        lessons,
        imageUrl: p.coverImageUrl || COURSE_COVERS[i % COURSE_COVERS.length],
      };
    });
}

/** Câu hỏi mỗi ngày sinh từ dữ liệu sự kiện thật — đổi theo ngày, giống nhau cho mọi người trong ngày. */
export function buildDailyQuiz(events: PublicEventSummaryDto[], day: Date): LandingQuiz | null {
  const pool = events.filter((e) => e.slug);
  const years = [...new Set(pool.map((e) => e.startYear))];
  if (pool.length === 0 || years.length < 4) return null;
  const dayIndex = Math.floor(day.getTime() / 86_400_000);
  const event = pool[dayIndex % pool.length];
  const distractors = years
    .filter((y) => y !== event.startYear)
    .sort((a, b) => Math.abs(a - event.startYear) - Math.abs(b - event.startYear))
    .slice(0, 3);
  const options = [event.startYear, ...distractors].sort((a, b) => a - b);
  return {
    question: `Sự kiện “${event.title}” bắt đầu vào năm nào?`,
    options: options.map(formatYear),
    correctIndex: options.indexOf(event.startYear),
    explanation: truncate(event.description, 200),
    href: LANDING_ROUTES.EVENT(event.slug as string),
  };
}

export function buildLandingData(source: LandingSource, today: Date = new Date()): LandingData {
  const rootOf = rootResolver(source.periods);
  const bands = buildBands(source.periods);
  const regions = sortedRegions(bands.map((b) => b.region));
  const courses = buildCourses(source.paths);
  return {
    regions,
    spotlights: buildSpotlights(source.events, rootOf),
    eras: buildEras(source.periods, source.events, source.figures, rootOf),
    timeline: buildTimeline(source.events, rootOf),
    bands,
    figures: buildFigures(source.figures),
    locations: buildLocations(source.locations, source.events),
    courses,
    quiz: buildDailyQuiz(source.events, today),
    stats: {
      events: source.events.length,
      figures: source.figures.length,
      locations: source.locations.length,
      paths: source.paths.filter((p) => p.status === 'PUBLISHED').length,
      regions: regions.length,
    },
  };
}
