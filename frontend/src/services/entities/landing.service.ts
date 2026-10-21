import { chaptersData, ChapterItem } from '@/data/chapters';
import { erasData, EraItem } from '@/data/eras';
import { figuresData, FigureItem } from '@/data/figures';
import { timelineData, TimelineNode } from '@/data/timeline';
import { topicsData, TopicItem } from '@/data/topics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const PUBLIC_API_ENDPOINTS = {
  LANDING: '/public/landing',
  PERIOD_DETAIL: (slug: string) => `/public/periods/${encodeURIComponent(slug)}`,
  TOPIC_DETAIL: (slug: string) => `/public/topics/${encodeURIComponent(slug)}`,
  FIGURE_DETAIL: (slug: string) => `/public/figures/${encodeURIComponent(slug)}`,
} as const;

export const PUBLIC_ROUTE_PREFIX = {
  PERIOD: '/giai-doan',
  CHAPTER: '/chuong-su',
  KNOWLEDGE: '/kien-thuc',
  FIGURE: '/nhan-vat',
  EVENT: '/su-kien',
} as const;

const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #1C446C 0%, #356B98 45%, #D4A359 100%)',
  'linear-gradient(135deg, #5B2434 0%, #8C3B4A 50%, #D99B66 100%)',
  'linear-gradient(135deg, #7A2E1D 0%, #B85233 50%, #E2A857 100%)',
  'linear-gradient(135deg, #3D291D 0%, #63432B 50%, #8A643E 100%)',
  'linear-gradient(135deg, #1E3A5F 0%, #3B6998 50%, #89B3D9 100%)',
  'linear-gradient(135deg, #4B3621 0%, #7C5A38 50%, #C59B6D 100%)',
] as const;

const DEFAULT_TOPIC_ICON: TopicItem['icon'] = 'Landmark';

export interface PublicPeriodDto {
  id: string;
  slug: string;
  name: string;
  timeLabel: string;
  startYear: number;
  endYear: number | null;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PublicTopicDto {
  id: string;
  slug: string;
  name: string;
  eyebrow: string | null;
  icon: TopicItem['icon'] | null;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PublicFigureDto {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
}

export interface LandingPageContent {
  timelineNodes: TimelineNode[];
  eras: EraItem[];
  chapters: ChapterItem[];
  knowledgeTopics: TopicItem[];
  figures: FigureItem[];
}

function buildInitials(title: string): string {
  const words = title
    .replace(/[^a-zA-ZÀ-ỹ0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'LS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function pickGradient(index: number): string {
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

export class LandingContentMapper {
  static toTimelineNode(period: PublicPeriodDto): TimelineNode {
    return {
      id: period.id,
      slug: period.slug,
      title: period.name,
      period: period.timeLabel,
      image: period.coverImageUrl || '/assets/timeline/van-lang.jpg',
      alt: period.name,
      letter: buildInitials(period.name),
    };
  }

  static toEraItem(period: PublicPeriodDto, index: number): EraItem {
    return {
      id: period.id,
      slug: period.slug,
      title: period.name,
      period: period.timeLabel,
      image: period.coverImageUrl || '/assets/eras/dung-nuoc.jpg',
      alt: period.name,
      href: `${PUBLIC_ROUTE_PREFIX.PERIOD}/${period.slug}`,
      gradient: pickGradient(index),
    };
  }

  static toChapterItem(topic: PublicTopicDto, index: number): ChapterItem {
    return {
      id: topic.id,
      slug: topic.slug,
      eyebrow: topic.eyebrow || topic.name.toUpperCase(),
      title: topic.name,
      description: topic.description || '',
      image: topic.coverImageUrl || '/assets/chapters/van-lang-au-lac.jpg',
      alt: topic.name,
      href: `${PUBLIC_ROUTE_PREFIX.CHAPTER}/${topic.slug}`,
      gradient: pickGradient(index),
    };
  }

  static toKnowledgeItem(topic: PublicTopicDto): TopicItem {
    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.name,
      icon: topic.icon || DEFAULT_TOPIC_ICON,
      href: `${PUBLIC_ROUTE_PREFIX.KNOWLEDGE}/${topic.slug}`,
    };
  }

  static toFigureItem(figure: PublicFigureDto, index: number): FigureItem {
    return {
      id: figure.id,
      slug: figure.slug,
      name: figure.name,
      tagline: figure.tagline || figure.description || '',
      image: figure.imageUrl || '/assets/figures/hung-vuong.jpg',
      alt: figure.name,
      href: `${PUBLIC_ROUTE_PREFIX.FIGURE}/${figure.slug}`,
      letter: buildInitials(figure.name),
      gradient: pickGradient(index),
    };
  }
}

export async function fetchLandingContent(): Promise<LandingPageContent> {
  try {
    const serverApiUrl = API_URL.replace('://localhost', '://127.0.0.1');
    const response = await fetch(
      `${serverApiUrl}${PUBLIC_API_ENDPOINTS.LANDING}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const body = await response.json();
    const payload = body?.data ?? body;

    const periods: PublicPeriodDto[] = Array.isArray(payload?.periods)
      ? payload.periods
      : [];
    const chapters: PublicTopicDto[] = Array.isArray(payload?.chapters)
      ? payload.chapters
      : [];
    const knowledge: PublicTopicDto[] = Array.isArray(payload?.knowledge)
      ? payload.knowledge
      : [];
    const figures: PublicFigureDto[] = Array.isArray(payload?.figures)
      ? payload.figures
      : [];

    return {
      timelineNodes:
        periods.length > 0
          ? periods.map((p) => LandingContentMapper.toTimelineNode(p))
          : timelineData,
      eras:
        periods.length > 0
          ? periods.map((p, i) => LandingContentMapper.toEraItem(p, i))
          : erasData,
      chapters:
        chapters.length > 0
          ? chapters.map((c, i) => LandingContentMapper.toChapterItem(c, i))
          : chaptersData,
      knowledgeTopics:
        knowledge.length > 0
          ? knowledge.map((k) => LandingContentMapper.toKnowledgeItem(k))
          : topicsData,
      figures:
        figures.length > 0
          ? figures.map((f, i) => LandingContentMapper.toFigureItem(f, i))
          : figuresData,
    };
  } catch {
    return {
      timelineNodes: timelineData,
      eras: erasData,
      chapters: chaptersData,
      knowledgeTopics: topicsData,
      figures: figuresData,
    };
  }
}

export interface PublicLocationSummaryDto {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  historicalSignificance: string | null;
}

export interface PublicEventSummaryDto {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  eventDateNote: string | null;
  location: string | null;
  description: string | null;
}

export interface PublicEventRelationDto {
  relationType: string;
  description: string | null;
  event: PublicEventSummaryDto;
}

export interface PublicEventDetailDto extends PublicEventSummaryDto {
  period: PublicPeriodDto | null;
  parent: PublicEventSummaryDto | null;
  children: PublicEventSummaryDto[];
  outgoingRelations: PublicEventRelationDto[];
  incomingRelations: PublicEventRelationDto[];
}

export interface PublicLessonSummaryDto {
  id: string;
  title: string;
  contentRichText: string | null;
  sourceReferenceNote: string | null;
  estimatedReadMinutes: number;
  events: PublicEventSummaryDto[];
  entities: PublicFigureDto[];
  locations: PublicLocationSummaryDto[];
}

export interface PublicChildTopicDto extends PublicTopicDto {
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicPeriodDetailDto extends PublicPeriodDto {
  topics: PublicTopicDto[];
  figures: PublicFigureDto[];
  events: PublicEventSummaryDto[];
}

export interface PublicTopicDetailDto extends PublicTopicDto {
  period: PublicPeriodDto | null;
  children: PublicChildTopicDto[];
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicFigureDetailDto extends PublicFigureDto {
  period: PublicPeriodDto | null;
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

async function fetchPublicDetail<T>(endpoint: string): Promise<T | null> {
  try {
    const serverApiUrl = API_URL.replace('://localhost', '://127.0.0.1');
    const response = await fetch(`${serverApiUrl}${endpoint}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const body = await response.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}

export function fetchPeriodBySlug(
  slug: string,
): Promise<PublicPeriodDetailDto | null> {
  return fetchPublicDetail<PublicPeriodDetailDto>(
    PUBLIC_API_ENDPOINTS.PERIOD_DETAIL(slug),
  );
}

export function fetchTopicBySlug(
  slug: string,
): Promise<PublicTopicDetailDto | null> {
  return fetchPublicDetail<PublicTopicDetailDto>(
    PUBLIC_API_ENDPOINTS.TOPIC_DETAIL(slug),
  );
}

export function fetchFigureBySlug(
  slug: string,
): Promise<PublicFigureDetailDto | null> {
  return fetchPublicDetail<PublicFigureDetailDto>(
    PUBLIC_API_ENDPOINTS.FIGURE_DETAIL(slug),
  );
}

export async function fetchFigures(): Promise<PublicFigureDto[]> {
  try {
    const serverApiUrl = API_URL.replace('://localhost', '://127.0.0.1');
    const response = await fetch(`${serverApiUrl}/public/figures`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const body = await response.json();
    const payload = body?.data ?? body;
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

export async function fetchLocations(): Promise<PublicLocationSummaryDto[]> {
  try {
    const serverApiUrl = API_URL.replace('://localhost', '://127.0.0.1');
    const response = await fetch(`${serverApiUrl}/public/locations`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const body = await response.json();
    const payload = body?.data ?? body;
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

export function fetchEventBySlug(
  slug: string,
): Promise<PublicEventDetailDto | null> {
  return fetchPublicDetail<PublicEventDetailDto>(
    `/public/events/${encodeURIComponent(slug)}`,
  );
}

export async function fetchEvents(): Promise<PublicEventSummaryDto[]> {
  try {
    const serverApiUrl = API_URL.replace('://localhost', '://127.0.0.1');
    const response = await fetch(`${serverApiUrl}/public/events`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const body = await response.json();
    const payload = body?.data ?? body;
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

