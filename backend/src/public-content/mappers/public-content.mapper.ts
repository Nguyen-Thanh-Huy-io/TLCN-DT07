import {
  HistoricalEntity,
  HistoricalEntityRelation,
  HistoricalEvent,
  HistoricalEventEntity,
  HistoricalSite,
  Lesson,
  Period,
  Person,
  Topic,
} from '@prisma/client';
import {
  ERA_SUFFIX,
  FIGURE_PROFILE_METADATA_KEY,
} from '../public-content.constant';
import {
  PublicEventSummaryDto,
  PublicFigureDto,
  PublicFigureProfileDto,
  PublicLessonSummaryDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
  PublicTopicDto,
} from '../dto/public-content.dto';
import { SITE_TYPES, normalizeSiteType } from '../site-type.constant';
import { toHeritageProfile } from './heritage-profile.mapper';

export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} ${ERA_SUFFIX.BCE}` : `${year}`;
}

export function buildTimeLabel(
  startYear: number | null,
  endYear: number | null,
): string {
  if (startYear === null || startYear === undefined) {
    return endYear !== null && endYear !== undefined
      ? `(Đến ${formatYear(endYear)})`
      : '(Thời kỳ không xác định)';
  }
  const end = endYear === null ? ERA_SUFFIX.PRESENT : formatYear(endYear);
  return `(${formatYear(startYear)} - ${end})`;
}

// metadata is free-form JSONB edited by hand in the CMS, so every value is checked before use.
export function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        .map((v) => v.trim())
    : [];
}

export function estimateReadMinutes(contentRichText?: string | null): number {
  if (!contentRichText) return 1;
  const plainText = contentRichText.replace(/<[^>]*>/g, '').trim();
  if (!plainText) return 1;
  const wordCount = plainText.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export class PublicContentMapper {
  static toPeriod(period: Period): PublicPeriodDto {
    return {
      id: period.id,
      parentId: period.parentId,
      slug: period.slug,
      name: period.name,
      timeLabel:
        period.timeLabel || buildTimeLabel(period.startYear, period.endYear),
      startYear: period.startYear,
      endYear: period.endYear,
      description: period.description,
      coverImageUrl: period.coverImageUrl,
      region: period.region,
    };
  }

  static toTopic(topic: Topic): PublicTopicDto {
    return {
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      eyebrow: topic.eyebrow,
      icon: topic.icon,
      description: topic.description,
      coverImageUrl: topic.coverImageUrl,
    };
  }

  static toFigure(entity: any): PublicFigureDto {
    return {
      id: entity.id,
      slug: entity.slug,
      name: entity.name,
      tagline: entity.tagline,
      description: entity.description,
      imageUrl: entity.imageUrl,
      birthYear: entity.person?.birthYear ?? entity.birthYear ?? null,
      deathYear: entity.person?.deathYear ?? entity.deathYear ?? null,
    };
  }

  static toFigureProfile(
    entity: HistoricalEntity & {
      person: Person | null;
      period: { slug: string } | null;
      eventEntities: Array<
        HistoricalEventEntity & {
          event: HistoricalEvent & { period: { slug: string } | null };
        }
      >;
      outgoingRelations: Array<
        HistoricalEntityRelation & { targetEntity: HistoricalEntity }
      >;
      incomingRelations: Array<
        HistoricalEntityRelation & { sourceEntity: HistoricalEntity }
      >;
    },
  ): PublicFigureProfileDto {
    const metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata[FIGURE_PROFILE_METADATA_KEY] ?? {}) as Record<
      string,
      unknown
    >;

    return {
      ...PublicContentMapper.toFigure(entity),
      roles: entity.person?.roles ?? [],
      legacy: {
        hometown: textOrNull(profile.hometown),
        backgroundAndYouth: textOrNull(profile.backgroundAndYouth),
        notableWorks: textList(profile.notableWorks),
        legacyAndHonors: textOrNull(profile.legacyAndHonors),
        anecdotes: textList(profile.anecdotes),
        famousQuote: textOrNull(profile.famousQuote),
      },
      aliases: entity.aliases,
      birthDateLabel: entity.person?.birthDateLabel ?? null,
      deathDateLabel: entity.person?.deathDateLabel ?? null,
      biography: entity.person?.biography ?? null,
      occupation: entity.person?.occupation ?? null,
      titles: entity.person?.titles ?? [],
      sources: textList(metadata.sources),
      periodSlug: entity.period?.slug ?? null,
      events: entity.eventEntities
        .map((ee) => ({
          id: ee.event.id,
          slug: ee.event.slug,
          title: ee.event.title,
          startYear: ee.event.startYear,
          eventDateNote: ee.event.eventDateNote,
          description: ee.event.description,
          category: ee.event.category,
          periodSlug: ee.event.period?.slug ?? null,
          role: ee.role,
          roleLabel: ee.roleLabel,
          isPrimary: ee.isPrimary,
        }))
        .sort((a, b) => a.startYear - b.startYear),
      relationships: [
        ...entity.outgoingRelations.map((rel) => ({
          figureId: rel.targetEntity.id,
          slug: rel.targetEntity.slug,
          name: rel.targetEntity.name,
          relationType: rel.relationType,
          direction: 'OUTGOING' as const,
          note: rel.note,
          startYear: rel.startYear,
          endYear: rel.endYear,
        })),
        ...entity.incomingRelations.map((rel) => ({
          figureId: rel.sourceEntity.id,
          slug: rel.sourceEntity.slug,
          name: rel.sourceEntity.name,
          relationType: rel.relationType,
          direction: 'INCOMING' as const,
          note: rel.note,
          startYear: rel.startYear,
          endYear: rel.endYear,
        })),
      ],
    };
  }

  static toEventSummary(
    event: HistoricalEvent & {
      location?:
        (HistoricalEntity & { historicalSite?: HistoricalSite | null }) | null;
      site?: (HistoricalSite & { entity?: HistoricalEntity }) | null;
      historicalLocation?: any;
      period?: { slug: string } | null;
      entities?: Array<{
        entity: HistoricalEntity & { historicalSite?: HistoricalSite | null };
      }>;
    },
  ): PublicEventSummaryDto {
    const locName =
      event.location?.name ||
      event.location?.historicalSite?.address ||
      event.site?.entity?.name ||
      event.site?.address ||
      event.historicalLocation?.name ||
      (event.metadata as any)?.rawLocation ||
      null;

    const participants = (event.entities || []).map((ee) => ee.entity);

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      startYear: event.startYear,
      eventDateNote: event.eventDateNote,
      location: locName,
      description: event.description,
      imageUrl: event.thumbnailUrl,
      category: event.category,
      periodSlug: event.period?.slug ?? null,
      figures: participants
        .filter((e) => e.type === 'PERSON')
        .map((e) => PublicContentMapper.toFigure(e)),
      locations: participants
        .filter((e) => e.type === 'LOCATION')
        .map((e) => PublicContentMapper.toLocationSummary(e)),
    };
  }

  static toLocationSummary(
    entity: HistoricalEntity & {
      historicalSite?: HistoricalSite | null;
      period?: { slug: string } | null;
      _count?: { media: number };
    },
  ): PublicLocationSummaryDto {
    const site = entity.historicalSite;
    const siteType = normalizeSiteType(site?.siteType);
    const heritage = toHeritageProfile(entity.metadata);
    return {
      id: entity.id,
      slug: entity.slug,
      name: entity.name,
      address: site?.address || null,
      latitude: site?.latitude ? Number(site.latitude) : null,
      longitude: site?.longitude ? Number(site.longitude) : null,
      historicalSignificance: entity.tagline || entity.description || null,
      imageUrl: entity.imageUrl,
      siteType,
      siteTypeLabel: SITE_TYPES[siteType],
      recognitionLevel: site?.recognitionLevel ?? null,
      constructionLabel: site?.constructionLabel ?? null,
      periodSlug: entity.period?.slug ?? null,
      ancientNames: entity.aliases ?? [],
      preservationStatus: site?.preservationStatus ?? null,
      digital: {
        hasImage: Boolean(entity.imageUrl),
        galleryCount: entity._count?.media ?? 0,
        hasThenAndNow: Boolean(heritage.thenAndNow),
        hasChronicle: heritage.constructionTimeline.length > 0,
        hasStructures: heritage.subStructures.length > 0,
      },
    };
  }

  static toLessonSummary(
    lesson: Lesson & {
      lessonEvents?: Array<{ event: HistoricalEvent }>;
      lessonEntities?: Array<{
        entity: HistoricalEntity & { historicalSite?: HistoricalSite | null };
      }>;
      lessonLocations?: Array<{ location: any }>;
    },
  ): PublicLessonSummaryDto {
    const locationEntities = (lesson.lessonEntities || [])
      .filter((le) => le.entity?.type === 'LOCATION')
      .map((le) => PublicContentMapper.toLocationSummary(le.entity));

    const legacyLocations = (lesson.lessonLocations || []).map((ll) => ({
      id: ll.location?.id,
      slug: ll.location?.slug,
      name: ll.location?.name,
      address: ll.location?.address || null,
      latitude: ll.location?.latitude || null,
      longitude: ll.location?.longitude || null,
      historicalSignificance: ll.location?.historicalSignificance || null,
    }));

    const content =
      (lesson as any).content || (lesson as any).contentRichText || '';

    return {
      id: lesson.id,
      title: lesson.title,
      contentRichText: content,
      sourceReferenceNote: (lesson as any).sourceReferenceNote || null,
      estimatedReadMinutes: estimateReadMinutes(content),
      events: ((lesson as any).lessonEvents || []).map((le: any) =>
        PublicContentMapper.toEventSummary(le.event as any),
      ),
      entities: ((lesson as any).lessonEntities || [])
        .filter((le: any) => le.entity?.type !== 'LOCATION')
        .map((le: any) => PublicContentMapper.toFigure(le.entity)),
      locations:
        locationEntities.length > 0 ? locationEntities : legacyLocations,
    };
  }
}
