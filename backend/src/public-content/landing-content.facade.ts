import { Injectable, NotFoundException } from '@nestjs/common';
import { HistoricalEntityType, LessonStatus } from '@prisma/client';
import { LessonContentStrategyContext } from '../lesson/strategies/content-normalizer.strategy';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import {
  PUBLIC_LANDING_CACHE_KEY,
  PUBLIC_LANDING_CACHE_TTL_SECONDS,
} from '../common/constants/cache-keys.constant';
import {
  LandingResponseDto,
  PublicEventDetailDto,
  PublicEventSummaryDto,
  PublicLibraryLessonDto,
  PublicLocationDetailDto,
  PublicFigureDetailDto,
  PublicFigureDto,
  PublicFigureProfileDto,
  PublicLocationSummaryDto,
  PublicPeriodDetailDto,
  PublicPeriodDto,
  PublicTopicDetailDto,
  PublicTopicDto,
} from './dto/public-content.dto';
import {
  PublicContentMapper,
  textList,
  textOrNull,
} from './mappers/public-content.mapper';
import { toHeritageProfile } from './mappers/heritage-profile.mapper';
import { LandingSectionRegistry } from './strategies/landing-section.registry';
import {
  LandingSection,
  PUBLIC_CONTENT_MESSAGES,
  PUBLIC_CONTENT_STATUS,
} from './public-content.constant';
import { compareHistoricalDates } from '../common/utils/historical-date.parser';

const CONCURRENT_EVENTS_LIMIT = 12;
/** Di tích kèm các giá trị danh mục dùng chung (loại, hiện trạng, xếp hạng). */
const SITE_WITH_TERMS = {
  include: { siteTypeTerm: true, preservation: true, rank: true },
} as const;
/**
 * Include dùng chung cho mọi truy vấn HistoricalEntity(type=EVENT) — location, participants
 * và quan hệ nhân-quả Event↔Event đều chiếu từ subjectStatements/objectStatements
 * (xem PublicContentMapper.toEventSummary).
 */
const EVENT_STATEMENT_INCLUDE = {
  event: true,
  period: { select: { slug: true } },
  subjectStatements: {
    include: {
      predicate: true,
      object: { include: { historicalSite: true } },
    },
  },
  objectStatements: {
    include: {
      predicate: true,
      subject: { include: { historicalSite: true } },
    },
  },
} as const;
const NEARBY_LOCATIONS_LIMIT = 4;
const EARTH_RADIUS_KM = 6371;

/** Khoảng cách theo đường tròn lớn (công thức haversine), đơn vị km. */
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** "Toàn quốc" là cách ghi khác của Việt Nam khi so khu vực. */
function normalizeRegion(region: string | null): string | null {
  return region === 'Toàn quốc' ? 'Việt Nam' : region;
}

/**
 * Facade: điểm vào duy nhất cho dữ liệu landing và các trang chi tiết công khai,
 * che giấu việc gom Period + các section Topic + Nhân vật tiêu biểu + Knowledge Graph + cache.
 */
@Injectable()
export class LandingContentFacade {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly registry: LandingSectionRegistry,
  ) {}

  async getLanding(): Promise<LandingResponseDto> {
    const cached = await this.redis.get<LandingResponseDto>(
      PUBLIC_LANDING_CACHE_KEY,
    );
    if (cached) {
      return cached;
    }

    const [periods, chapters, knowledge, figures] = await Promise.all([
      this.getPeriods(),
      this.getSection(LandingSection.CHAPTERS),
      this.getSection(LandingSection.KNOWLEDGE),
      this.getFigures(),
    ]);
    const landing: LandingResponseDto = {
      periods,
      chapters,
      knowledge,
      figures,
    };

    await this.redis.set(
      PUBLIC_LANDING_CACHE_KEY,
      landing,
      PUBLIC_LANDING_CACHE_TTL_SECONDS,
    );
    return landing;
  }

  async getPeriods(): Promise<PublicPeriodDto[]> {
    const periods = await this.prisma.period.findMany({
      where: { status: PUBLIC_CONTENT_STATUS },
      orderBy: [{ displayOrder: 'asc' }, { startYear: 'asc' }],
      include: { regionTerm: true },
    });
    return periods.map((period) => PublicContentMapper.toPeriod(period));
  }

  async getFigures(): Promise<PublicFigureDto[]> {
    const entities = await this.prisma.historicalEntity.findMany({
      where: {
        type: HistoricalEntityType.PERSON,
        isFeatured: true,
        status: PUBLIC_CONTENT_STATUS,
      },
      orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
    });
    return entities.map((entity) => PublicContentMapper.toFigure(entity));
  }

  /** Danh bạ nhân vật: toàn bộ nhân vật đã xuất bản kèm sự kiện tham gia & quan hệ với nhân vật khác. */
  async getFigureDirectory(): Promise<PublicFigureProfileDto[]> {
    const publishedPerson = {
      type: HistoricalEntityType.PERSON,
      status: PUBLIC_CONTENT_STATUS,
    };
    const entities = await this.prisma.historicalEntity.findMany({
      where: publishedPerson,
      include: {
        person: true,
        period: { select: { slug: true } },
        // Tham gia sự kiện (object.type=EVENT) và quan hệ với nhân vật khác (object khác
        // EVENT) đều nằm trong subjectStatements/objectStatements — xem toFigureProfile.
        subjectStatements: {
          where: { object: { status: PUBLIC_CONTENT_STATUS } },
          include: {
            predicate: true,
            object: { include: { event: true, period: { select: { slug: true } } } },
          },
        },
        objectStatements: {
          where: { subject: publishedPerson },
          include: { predicate: true, subject: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return entities.map((entity) =>
      PublicContentMapper.toFigureProfile(entity),
    );
  }

  getSection(section: LandingSection): Promise<PublicTopicDto[]> {
    return this.registry.resolve(section).fetch();
  }

  /** Danh sách Di tích / Địa danh lịch sử công khai (HistoricalEntity type=LOCATION). */
  async getLocations(): Promise<PublicLocationSummaryDto[]> {
    const entities = await this.prisma.historicalEntity.findMany({
      where: {
        type: HistoricalEntityType.LOCATION,
        status: PUBLIC_CONTENT_STATUS,
      },
      include: {
        historicalSite: SITE_WITH_TERMS,
        period: { select: { slug: true } },
        _count: { select: { media: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return entities.map((entity) =>
      PublicContentMapper.toLocationSummary(entity),
    );
  }

  /**
   * Chi tiết 1 di tích: sự kiện diễn ra tại đây (địa điểm chính hoặc có gắn di tích),
   * nhân vật tham gia các sự kiện đó, thư viện ảnh và các di tích lân cận theo khoảng cách.
   */
  async getLocationBySlug(slug: string): Promise<PublicLocationDetailDto> {
    const entity = await this.prisma.historicalEntity.findFirst({
      where: {
        slug,
        type: HistoricalEntityType.LOCATION,
        status: PUBLIC_CONTENT_STATUS,
      },
      include: {
        historicalSite: SITE_WITH_TERMS,
        period: true,
        media: { orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!entity) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.LOCATION_NOT_FOUND(slug),
      );
    }

    const [events, others] = await Promise.all([
      this.prisma.historicalEntity.findMany({
        where: {
          type: HistoricalEntityType.EVENT,
          status: PUBLIC_CONTENT_STATUS,
          OR: [
            { subjectStatements: { some: { predicate: { code: 'OCCURRED_AT' }, objectId: entity.id } } },
            { objectStatements: { some: { subjectId: entity.id } } },
          ],
        },
        include: EVENT_STATEMENT_INCLUDE,
        orderBy: [{ startYear: 'asc' }, { displayOrder: 'asc' }],
      }),
      this.prisma.historicalEntity.findMany({
        where: {
          type: HistoricalEntityType.LOCATION,
          status: PUBLIC_CONTENT_STATUS,
          NOT: { id: entity.id },
          historicalSite: { latitude: { not: null }, longitude: { not: null } },
        },
        include: {
          historicalSite: SITE_WITH_TERMS,
          period: { select: { slug: true } },
          _count: { select: { media: true } },
        },
      }),
    ]);

    const figures = new Map<string, PublicFigureDto>();
    for (const event of events) {
      for (const stmt of event.objectStatements) {
        const participant = stmt.subject;
        if (participant && participant.type === HistoricalEntityType.PERSON) {
          figures.set(
            participant.id,
            PublicContentMapper.toFigure(participant),
          );
        }
      }
    }

    const summary = PublicContentMapper.toLocationSummary(entity);
    const nearby =
      summary.latitude != null && summary.longitude != null
        ? others
            .map((o) => {
              const s = PublicContentMapper.toLocationSummary(o);
              return {
                ...s,
                distanceKm: Math.round(
                  distanceKm(
                    summary.latitude as number,
                    summary.longitude as number,
                    s.latitude as number,
                    s.longitude as number,
                  ),
                ),
              };
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, NEARBY_LOCATIONS_LIMIT)
        : [];

    const site = entity.historicalSite;
    return {
      ...summary,
      tagline: entity.tagline,
      description: entity.description,
      imageCaption: entity.imageCaption,
      constructionYear: site?.constructionYear ?? null,
      preservationStatus: site?.preservationStatus ?? null,
      managingAgency: site?.managingAgency ?? null,
      period: entity.period
        ? PublicContentMapper.toPeriod(entity.period)
        : null,
      media: entity.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        caption: m.caption,
      })),
      events: events.map((e) => PublicContentMapper.toEventSummary(e)),
      figures: [...figures.values()],
      nearby,
      heritage: toHeritageProfile(entity.metadata),
    };
  }

  /** Danh sách Sự kiện lịch sử công khai, sắp xếp theo mốc thời gian. */
  async getEvents(): Promise<PublicEventSummaryDto[]> {
    const events = await this.prisma.historicalEntity.findMany({
      where: { type: HistoricalEntityType.EVENT, status: PUBLIC_CONTENT_STATUS },
      include: EVENT_STATEMENT_INCLUDE,
      orderBy: [{ startYear: 'asc' }, { displayOrder: 'asc' }],
    });
    return events.map((event) => PublicContentMapper.toEventSummary(event));
  }

  /** Thư viện bài học công khai: chỉ bài đã xuất bản, không kèm nội dung (đọc bài cần đăng nhập). */
  async getLibraryLessons(): Promise<PublicLibraryLessonDto[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { status: LessonStatus.PUBLISHED },
      include: { lessonTags: { include: { tag: true } } },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return lessons.map((lesson) => {
      const words = LessonContentStrategyContext.extractPlainText(
        lesson.content,
      )
        .split(/\s+/)
        .filter(Boolean).length;
      return {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        thumbnailUrl: lesson.thumbnailUrl,
        difficulty: lesson.difficulty,
        estimatedReadMinutes: Math.max(1, Math.ceil(words / 200)),
        tags: lesson.lessonTags.map((lt) => ({
          id: lt.tag.id,
          name: lt.tag.name,
          colorHex: lt.tag.colorHex,
        })),
      };
    });
  }

  /** Chi tiết 1 Sự kiện lịch sử: giai đoạn, sự kiện cha/con, sự kiện liên quan (đồ thị nhân-quả). */
  async getEventBySlug(slug: string): Promise<PublicEventDetailDto> {
    const event = await this.prisma.historicalEntity.findFirst({
      where: { slug, type: HistoricalEntityType.EVENT, status: PUBLIC_CONTENT_STATUS },
      include: {
        ...EVENT_STATEMENT_INCLUDE,
        period: true,
        event: {
          include: {
            parent: { include: { entity: true } },
            children: {
              include: { entity: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.EVENT_NOT_FOUND(slug),
      );
    }

    const outgoingRelations = event.subjectStatements
      .filter((rel) => rel.object?.type === 'EVENT' && rel.object?.status === PUBLIC_CONTENT_STATUS)
      .map((rel) => ({
        relationType: rel.predicate?.code ?? null,
        description: (rel.qualifiers as any)?.description ?? null,
        event: PublicContentMapper.toEventSummary(rel.object as any),
      }));

    const incomingRelations = event.objectStatements
      .filter((rel) => rel.subject?.type === 'EVENT' && rel.subject?.status === PUBLIC_CONTENT_STATUS)
      .map((rel) => ({
        relationType: rel.predicate?.code ?? null,
        description: (rel.qualifiers as any)?.description ?? null,
        event: PublicContentMapper.toEventSummary(rel.subject as any),
      }));

    const participantStmts = event.objectStatements.filter(
      (s) => s.subject && s.subject.type !== 'EVENT',
    );

    const metadata = (event.metadata ?? {}) as Record<string, unknown>;
    const parentEntity = event.event?.parent?.entity ?? null;
    const childEntities = event.event?.children.map((c) => c.entity) ?? [];

    return {
      ...PublicContentMapper.toEventSummary(event),
      summary: event.tagline,
      startMonth: event.startMonth,
      startDay: event.startDay,
      endYear: event.endYear,
      endMonth: event.endMonth,
      endDay: event.endDay,
      cause: textOrNull(metadata.cause),
      outcome: textOrNull(metadata.outcome),
      sources: textList(metadata.sources),
      participants: participantStmts.map((s) => ({
        entityId: s.subjectId as string,
        role: (s.qualifiers as any)?.role ?? s.predicate.code ?? 'PARTICIPANT',
        roleLabel: (s.qualifiers as any)?.roleLabel ?? null,
        isPrimary: Boolean(s.isPrimary),
      })),
      period: event.period ? PublicContentMapper.toPeriod(event.period) : null,
      parent:
        parentEntity && parentEntity.status === PUBLIC_CONTENT_STATUS
          ? PublicContentMapper.toEventSummary(parentEntity)
          : null,
      children: childEntities
        .filter((c) => c.status === PUBLIC_CONTENT_STATUS)
        .map((child) => PublicContentMapper.toEventSummary(child)),
      outgoingRelations,
      incomingRelations,
    };
  }

  /**
   * Chi tiết thời kỳ: gom dữ liệu của chính thời kỳ và mọi giai đoạn con
   * (sự kiện thường gắn vào giai đoạn con), kèm bối cảnh "cùng thời ở khu vực khác".
   */
  async getPeriodBySlug(slug: string): Promise<PublicPeriodDetailDto> {
    const periods = await this.prisma.period.findMany({
      where: { status: PUBLIC_CONTENT_STATUS },
      orderBy: [{ displayOrder: 'asc' }, { startYear: 'asc' }],
      include: { regionTerm: true },
    });
    const period = periods.find((p) => p.slug === slug);
    if (!period) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.PERIOD_NOT_FOUND(slug),
      );
    }

    const byId = new Map(periods.map((p) => [p.id, p]));
    const rootOf = (id: string | null) => {
      let current = id ? byId.get(id) : undefined;
      while (current?.parentId && byId.has(current.parentId)) {
        current = byId.get(current.parentId);
      }
      return current;
    };
    const scopeIds = [period.id];
    for (let i = 0; i < scopeIds.length; i++) {
      for (const p of periods) {
        if (p.parentId === scopeIds[i]) scopeIds.push(p.id);
      }
    }
    const ownRegion = normalizeRegion(rootOf(period.id)?.region ?? null);
    const currentYear = new Date().getFullYear();
    // Thời kỳ thiếu năm bắt đầu thì không tìm được "cùng thời" — dùng khoảng rỗng.
    const rangeStart = period.startYear ?? currentYear + 1;
    const rangeEnd = period.endYear ?? currentYear;

    const [events, scopedEntities, nearbyEvents] = await Promise.all([
      this.prisma.historicalEntity.findMany({
        where: {
          type: HistoricalEntityType.EVENT,
          status: PUBLIC_CONTENT_STATUS,
          periodId: { in: scopeIds },
        },
        include: EVENT_STATEMENT_INCLUDE,
        orderBy: [{ startYear: 'asc' }, { displayOrder: 'asc' }],
      }),
      this.prisma.historicalEntity.findMany({
        where: { status: PUBLIC_CONTENT_STATUS, periodId: { in: scopeIds } },
        include: { person: true, historicalSite: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.historicalEntity.findMany({
        where: {
          type: HistoricalEntityType.EVENT,
          status: PUBLIC_CONTENT_STATUS,
          startYear: { gte: rangeStart, lte: rangeEnd },
          NOT: { periodId: { in: scopeIds } },
        },
        include: EVENT_STATEMENT_INCLUDE,
        orderBy: [{ startYear: 'asc' }, { displayOrder: 'asc' }],
      }),
    ]);

    // Nhân vật / địa danh: gắn trực tiếp với thời kỳ + xuất hiện trong sự kiện của thời kỳ.
    const figures = new Map<string, PublicFigureDto>();
    const locations = new Map<string, PublicLocationSummaryDto>();
    for (const entity of scopedEntities) {
      if (entity.type === HistoricalEntityType.PERSON) {
        figures.set(entity.id, PublicContentMapper.toFigure(entity));
      } else if (entity.type === HistoricalEntityType.LOCATION) {
        locations.set(entity.id, PublicContentMapper.toLocationSummary(entity));
      }
    }
    for (const event of events) {
      for (const stmt of event.objectStatements) {
        const entity = stmt.subject;
        if (!entity) continue;
        if (
          entity.type === HistoricalEntityType.PERSON &&
          !figures.has(entity.id)
        ) {
          figures.set(entity.id, PublicContentMapper.toFigure(entity));
        }
        if (
          entity.type === HistoricalEntityType.LOCATION &&
          !locations.has(entity.id)
        ) {
          locations.set(
            entity.id,
            PublicContentMapper.toLocationSummary(entity),
          );
        }
      }
      const locationStmt = event.subjectStatements.find(
        (s) => s.predicate.code === 'OCCURRED_AT' && s.object,
      );
      const eventLocation = locationStmt?.object ?? null;
      if (eventLocation && !locations.has(eventLocation.id)) {
        locations.set(
          eventLocation.id,
          PublicContentMapper.toLocationSummary(eventLocation),
        );
      }
    }

    const children = periods
      .filter((p) => p.parentId === period.id)
      .sort(compareHistoricalDates)
      .map((child) => ({
        ...PublicContentMapper.toPeriod(child),
        eventCount: events.filter((e) => e.periodId === child.id).length,
        figureCount: scopedEntities.filter(
          (e) =>
            e.periodId === child.id && e.type === HistoricalEntityType.PERSON,
        ).length,
      }));

    const concurrentPeriods = periods
      .filter(
        (p) =>
          !p.parentId &&
          p.id !== rootOf(period.id)?.id &&
          normalizeRegion(p.region) !== ownRegion &&
          p.startYear != null &&
          p.startYear <= rangeEnd &&
          (p.endYear ?? currentYear) >= rangeStart,
      )
      .map((p) => PublicContentMapper.toPeriod(p));

    const concurrentEvents = nearbyEvents
      .filter(
        (e) =>
          normalizeRegion(rootOf(e.periodId)?.region ?? null) !== ownRegion,
      )
      .slice(0, CONCURRENT_EVENTS_LIMIT)
      .map((e) => PublicContentMapper.toEventSummary(e));

    const parent = period.parentId ? byId.get(period.parentId) : undefined;

    return {
      ...PublicContentMapper.toPeriod(period),
      topics: [],
      figures: [...figures.values()],
      events: events.map((ev) => PublicContentMapper.toEventSummary(ev)),
      parent: parent ? PublicContentMapper.toPeriod(parent) : null,
      children,
      locations: [...locations.values()],
      concurrentPeriods,
      concurrentEvents,
    };
  }

  async getTopicBySlug(slug: string): Promise<PublicTopicDetailDto> {
    const topic = await this.prisma.topic.findFirst({
      where: { slug, status: PUBLIC_CONTENT_STATUS },
      include: {
        children: {
          where: { status: PUBLIC_CONTENT_STATUS },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.TOPIC_NOT_FOUND(slug),
      );
    }

    return {
      ...PublicContentMapper.toTopic(topic),
      period: null,
      children: topic.children.map((child) => ({
        ...PublicContentMapper.toTopic(child),
        events: [],
        lessons: [],
      })),
      events: [],
      lessons: [],
    };
  }

  async getFigureBySlug(slug: string): Promise<PublicFigureDetailDto> {
    const entity = await this.prisma.historicalEntity.findFirst({
      where: { slug, status: PUBLIC_CONTENT_STATUS },
      include: {
        period: true,
        subjectStatements: {
          where: { object: { type: HistoricalEntityType.EVENT } },
          include: { object: { include: EVENT_STATEMENT_INCLUDE } },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.FIGURE_NOT_FOUND(slug),
      );
    }

    const relatedEvents = entity.subjectStatements
      .map((ee) => ee.object!)
      .filter((e) => e.status === PUBLIC_CONTENT_STATUS)
      .sort(compareHistoricalDates);

    return {
      ...PublicContentMapper.toFigure(entity),
      period: entity.period
        ? PublicContentMapper.toPeriod(entity.period)
        : null,
      events: relatedEvents.map((e) => PublicContentMapper.toEventSummary(e)),
      lessons: [],
    };
  }
}
