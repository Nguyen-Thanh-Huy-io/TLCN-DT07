import {
  HistoricalEntity,
  HistoricalEvent,
  HistoricalEventParticipant,
  HistoricalSite,
  HistoricalStatement,
  TaxonomyTerm,
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
import { normalizeRank } from '../../taxonomy/taxonomy.constant';
import {
  PRESERVATION_CATEGORIES,
  normalizePreservation,
} from '../preservation-status.constant';
import { compareHistoricalDates } from '../../common/utils/historical-date.parser';

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
  static toPeriod(
    period: Period & { regionTerm?: TaxonomyTerm | null },
  ): PublicPeriodDto {
    return {
      id: period.id,
      parentId: period.parentId,
      slug: period.slug,
      name: period.name,
      timeLabel:
        period.dateText ||
        period.timeLabel ||
        buildTimeLabel(period.startYear, period.endYear),
      startYear: period.startYear,
      endYear: period.endYear,
      description: period.description,
      coverImageUrl: period.coverImageUrl,
      // Nhãn theo danh mục REGION ("Toàn quốc" → "Việt Nam"); chưa gắn thì dùng chữ gốc.
      region: period.regionTerm?.label ?? period.region,
      regionCode: period.regionTerm?.code ?? null,
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
      eventParticipations: Array<
        HistoricalEventParticipant & {
          roleTerm: TaxonomyTerm | null;
          event: HistoricalEvent & { period: { slug: string } | null };
        }
      >;
      subjectStatements: Array<
        HistoricalStatement & {
          predicate: TaxonomyTerm;
          objectEntity: HistoricalEntity | null;
        }
      >;
      objectStatements: Array<
        HistoricalStatement & {
          predicate: TaxonomyTerm;
          subjectEntity: HistoricalEntity | null;
        }
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
      birthDateLabel:
        entity.person?.birthDateText ?? entity.person?.birthDateLabel ?? null,
      deathDateLabel:
        entity.person?.deathDateText ?? entity.person?.deathDateLabel ?? null,
      biography: entity.person?.biography ?? null,
      occupation: entity.person?.occupation ?? null,
      titles: entity.person?.titles ?? [],
      sources: textList(metadata.sources),
      periodSlug: entity.period?.slug ?? null,
      events: entity.eventParticipations
        .map((ep) => ({
          id: ep.event.id,
          slug: ep.event.slug,
          title: ep.event.title,
          startYear: ep.event.startYear ?? null,
          eventDateNote:
            ep.event.dateText ?? ep.event.eventDateNote ?? null,
          description: ep.event.description,
          category: ep.event.category,
          categoryIds: ep.event.categoryIds ?? [],
          periodSlug: ep.event.period?.slug ?? null,
          role: ep.roleTerm?.code ?? 'PARTICIPANT',
          roleLabel: ep.roleLabelOverride ?? ep.roleTerm?.label ?? null,
          isPrimary: ep.isPrimary,
        }))
        .sort(compareHistoricalDates),
      relationships: [
        ...entity.subjectStatements
          .filter((rel) => rel.objectEntity)
          .map((rel) => ({
            figureId: rel.objectEntity!.id,
            slug: rel.objectEntity!.slug,
            name: rel.objectEntity!.name,
            relationType: rel.predicate.code,
            direction: 'OUTGOING' as const,
            note: (rel.qualifiers as any)?.note ?? null,
            startYear: rel.validFromYear,
            endYear: rel.validToYear,
          })),
        ...entity.objectStatements
          .filter((rel) => rel.subjectEntity)
          .map((rel) => ({
            figureId: rel.subjectEntity!.id,
            slug: rel.subjectEntity!.slug,
            name: rel.subjectEntity!.name,
            relationType: rel.predicate.code,
            direction: 'INCOMING' as const,
            note: (rel.qualifiers as any)?.note ?? null,
            startYear: rel.validFromYear,
            endYear: rel.validToYear,
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
      participants?: Array<{
        entity: HistoricalEntity & { historicalSite?: HistoricalSite | null };
        roleTerm?: TaxonomyTerm | null;
        roleLabelOverride?: string | null;
      }>;
      subjectStatements?: Array<{
        objectEventId: string | null;
        predicate: { code: string };
      }>;
      objectStatements?: Array<{
        subjectEventId: string | null;
        predicate: { code: string };
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

    const participants = (event.participants || []).map((p) => p.entity);

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      startYear: event.startYear ?? null,
      eventDateNote: event.dateText ?? event.eventDateNote ?? null,
      location: locName,
      description: event.description,
      imageUrl: event.thumbnailUrl,
      category: event.category,
      categoryIds: event.categoryIds ?? [],
      endYear: event.endYear ?? null,
      parentId: event.parentId ?? null,
      actors: (event.participants ?? [])
        .filter((p) => !['PERSON', 'LOCATION'].includes(p.entity.type))
        .map((p) => ({
          id: p.entity.id,
          name: p.entity.name,
          slug: p.entity.slug ?? null,
          type: p.entity.type,
          role: p.roleTerm?.code ?? 'PARTICIPANT',
          roleLabel: p.roleLabelOverride ?? p.roleTerm?.label ?? null,
          startYear: p.entity.startYear ?? null,
          endYear: p.entity.endYear ?? null,
        })),
      relations: [
        ...(event.subjectStatements ?? [])
          .filter((r) => r.objectEventId)
          .map((r) => ({
            eventId: r.objectEventId as string,
            relationType: r.predicate.code,
            direction: 'OUTGOING' as const,
          })),
        ...(event.objectStatements ?? [])
          .filter((r) => r.subjectEventId)
          .map((r) => ({
            eventId: r.subjectEventId as string,
            relationType: r.predicate.code,
            direction: 'INCOMING' as const,
          })),
      ],
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
      historicalSite?:
        | (HistoricalSite & {
            siteTypeTerm?: TaxonomyTerm | null;
            preservation?: TaxonomyTerm | null;
            rank?: TaxonomyTerm | null;
          })
        | null;
      period?: { slug: string } | null;
      _count?: { media: number };
    },
  ): PublicLocationSummaryDto {
    const site = entity.historicalSite;
    const heritage = toHeritageProfile(entity.metadata);
    // Ưu tiên giá trị danh mục dùng chung (taxonomy_terms); chưa gắn thì quy đổi từ cột chữ cũ.
    const fallbackType = normalizeSiteType(site?.siteType);
    const siteType = site?.siteTypeTerm?.code ?? fallbackType;
    const fallbackPreservation = normalizePreservation(
      site?.preservationStatus,
    );
    const preservation = site?.preservation
      ? {
          category: site.preservation.code,
          label: site.preservation.label,
          note: site.statusNote,
        }
      : {
          category: fallbackPreservation.category,
          label: fallbackPreservation.category
            ? PRESERVATION_CATEGORIES[fallbackPreservation.category]
            : null,
          note: fallbackPreservation.note,
        };
    const rankCode = site?.rank?.code ?? normalizeRank(site?.recognitionLevel);
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
      siteTypeLabel: site?.siteTypeTerm?.label ?? SITE_TYPES[fallbackType],
      rankCode,
      rankLabel: site?.rank?.label ?? null,
      recognitionLevel: site?.recognitionLevel ?? null,
      constructionLabel:
        site?.constructionDateText ?? site?.constructionLabel ?? null,
      periodSlug: entity.period?.slug ?? null,
      ancientNames: entity.aliases ?? [],
      preservationStatus: site?.preservationStatus ?? null,
      preservationCategory: preservation.category,
      preservationLabel: preservation.label,
      statusNote: preservation.note,
      managingUnit: site?.managingAgency ?? null,
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
