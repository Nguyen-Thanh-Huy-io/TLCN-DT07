import {
  HistoricalEntity,
  HistoricalEvent,
  HistoricalSite,
  Lesson,
  Period,
  Topic,
} from '@prisma/client';
import { ERA_SUFFIX } from '../public-content.constant';
import {
  PublicEventSummaryDto,
  PublicFigureDto,
  PublicLessonSummaryDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
  PublicTopicDto,
} from '../dto/public-content.dto';

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
      timeLabel: period.timeLabel || buildTimeLabel(period.startYear, period.endYear),
      startYear: period.startYear,
      endYear: period.endYear,
      description: period.description,
      coverImageUrl: period.coverImageUrl,
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

  static toEventSummary(
    event: HistoricalEvent & {
      location?: (HistoricalEntity & { historicalSite?: HistoricalSite | null }) | null;
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
      category: event.category,
      periodSlug: event.period?.slug ?? null,
      figures: participants
        .filter((e) => e.type !== 'LOCATION')
        .map((e) => PublicContentMapper.toFigure(e)),
      locations: participants
        .filter((e) => e.type === 'LOCATION')
        .map((e) => PublicContentMapper.toLocationSummary(e)),
    };
  }

  static toLocationSummary(
    entity: HistoricalEntity & { historicalSite?: HistoricalSite | null },
  ): PublicLocationSummaryDto {
    const site = entity.historicalSite;
    return {
      id: entity.id,
      slug: entity.slug,
      name: entity.name,
      address: site?.address || null,
      latitude: site?.latitude ? Number(site.latitude) : null,
      longitude: site?.longitude ? Number(site.longitude) : null,
      historicalSignificance: entity.tagline || entity.description || null,
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

    const content = (lesson as any).content || (lesson as any).contentRichText || '';

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
      locations: locationEntities.length > 0 ? locationEntities : legacyLocations,
    };
  }
}
