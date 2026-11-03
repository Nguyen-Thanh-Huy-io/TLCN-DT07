import {
  HistoricalEntity,
  HistoricalEvent,
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
      subjectStatements: Array<
        HistoricalStatement & {
          predicate: TaxonomyTerm;
          object:
            | (HistoricalEntity & {
                event?: HistoricalEvent | null;
                period?: { slug: string } | null;
              })
            | null;
        }
      >;
      objectStatements: Array<
        HistoricalStatement & {
          predicate: TaxonomyTerm;
          subject: (HistoricalEntity & { event?: HistoricalEvent | null }) | null;
        }
      >;
    },
  ): PublicFigureProfileDto {
    const metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata[FIGURE_PROFILE_METADATA_KEY] ?? {}) as Record<
      string,
      unknown
    >;

    // Tham gia sự kiện giờ là 1 HistoricalStatement có object.type === 'EVENT'
    // (Event cũng là 1 HistoricalEntity) — không còn bảng HistoricalEventParticipant riêng.
    const eventStatements = entity.subjectStatements.filter(
      (rel) => rel.object?.type === 'EVENT',
    );
    const entityRelationStatements = [
      ...entity.subjectStatements.filter((rel) => rel.object && rel.object.type !== 'EVENT'),
    ];

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
      events: eventStatements
        .map((rel) => {
          const ev = rel.object!;
          return {
            id: ev.id,
            slug: ev.slug,
            title: ev.name,
            startYear: ev.startYear ?? null,
            eventDateNote: ev.dateText ?? ev.event?.eventDateNote ?? null,
            description: ev.description,
            category: (ev.metadata as any)?.category ?? 'OTHER',
            categoryIds: ev.event?.categoryIds ?? [],
            periodSlug: ev.period?.slug ?? null,
            role: (rel.qualifiers as any)?.role ?? rel.predicate.code ?? 'PARTICIPANT',
            roleLabel: (rel.qualifiers as any)?.roleLabel ?? null,
            isPrimary: rel.isPrimary,
          };
        })
        .sort(compareHistoricalDates),
      relationships: [
        ...entityRelationStatements.map((rel) => ({
          figureId: rel.object!.id,
          slug: rel.object!.slug,
          name: rel.object!.name,
          relationType: rel.predicate.code,
          direction: 'OUTGOING' as const,
          note: (rel.qualifiers as any)?.note ?? null,
          startYear: rel.validFromYear,
          endYear: rel.validToYear,
        })),
        ...entity.objectStatements
          .filter((rel) => rel.subject && rel.subject.type !== 'EVENT')
          .map((rel) => ({
            figureId: rel.subject!.id,
            slug: rel.subject!.slug,
            name: rel.subject!.name,
            relationType: rel.predicate.code,
            direction: 'INCOMING' as const,
            note: (rel.qualifiers as any)?.note ?? null,
            startYear: rel.validFromYear,
            endYear: rel.validToYear,
          })),
      ],
    };
  }

  /**
   * Event giờ là 1 HistoricalEntity (type=EVENT) — location/participants/quan hệ
   * Event↔Event đều chiếu từ subjectStatements/objectStatements:
   *  - OCCURRED_AT (subject=event, object=Location) → location.
   *  - object.type === 'EVENT' trên subjectStatements / subject.type === 'EVENT' trên
   *    objectStatements → quan hệ nhân-quả Event↔Event (nhóm EVENT_RELATION).
   *  - Còn lại trên objectStatements (subject không phải EVENT) → người/thực thể tham gia.
   */
  static toEventSummary(
    event: HistoricalEntity & {
      event?: (HistoricalEvent & { parentId?: string | null; categoryIds?: string[] }) | null;
      period?: { slug: string } | null;
      subjectStatements?: Array<{
        objectId: string | null;
        predicate: { code: string };
        object?:
          | (HistoricalEntity & { historicalSite?: HistoricalSite | null })
          | null;
      }>;
      objectStatements?: Array<{
        subjectId: string | null;
        isPrimary?: boolean;
        qualifiers?: any;
        predicate: { code: string };
        subject?:
          | (HistoricalEntity & { historicalSite?: HistoricalSite | null })
          | null;
      }>;
    },
  ): PublicEventSummaryDto {
    const subjectStmts = event.subjectStatements ?? [];
    const objectStmts = event.objectStatements ?? [];

    const locationStmt = subjectStmts.find(
      (s) => s.predicate.code === 'OCCURRED_AT' && s.object,
    );
    const locationEntity = locationStmt?.object ?? null;
    const locName =
      locationEntity?.name ||
      locationEntity?.historicalSite?.address ||
      (event.metadata as any)?.rawLocation ||
      null;

    const participantStmts = objectStmts.filter(
      (s) => s.subject && s.subject.type !== 'EVENT',
    );
    const participants = participantStmts.map((s) => s.subject!);

    return {
      id: event.id,
      slug: event.slug,
      title: event.name,
      startYear: event.startYear ?? null,
      eventDateNote: event.dateText ?? event.event?.eventDateNote ?? null,
      location: locName,
      description: event.description,
      imageUrl: event.imageUrl,
      category: (event.metadata as any)?.category ?? 'OTHER',
      categoryIds: event.event?.categoryIds ?? [],
      endYear: event.endYear ?? null,
      parentId: event.event?.parentId ?? null,
      actors: participantStmts
        .filter((s) => !['PERSON', 'LOCATION'].includes(s.subject!.type))
        .map((s) => ({
          id: s.subject!.id,
          name: s.subject!.name,
          slug: s.subject!.slug ?? null,
          type: s.subject!.type,
          role: (s.qualifiers as any)?.role ?? s.predicate.code ?? 'PARTICIPANT',
          roleLabel: (s.qualifiers as any)?.roleLabel ?? null,
          startYear: s.subject!.startYear ?? null,
          endYear: s.subject!.endYear ?? null,
        })),
      relations: [
        ...subjectStmts
          .filter((r) => r.object?.type === 'EVENT' && r.objectId)
          .map((r) => ({
            eventId: r.objectId as string,
            relationType: r.predicate.code,
            direction: 'OUTGOING' as const,
          })),
        ...objectStmts
          .filter((r) => r.subject?.type === 'EVENT' && r.subjectId)
          .map((r) => ({
            eventId: r.subjectId as string,
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
