import { Injectable, NotFoundException } from '@nestjs/common';
import { HistoricalEntityType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import {
  PUBLIC_LANDING_CACHE_KEY,
  PUBLIC_LANDING_CACHE_TTL_SECONDS,
} from '../common/constants/cache-keys.constant';
import {
  LandingResponseDto,
  PublicEventSummaryDto,
  PublicFigureDetailDto,
  PublicFigureDto,
  PublicLocationSummaryDto,
  PublicPeriodDetailDto,
  PublicPeriodDto,
  PublicTopicDetailDto,
  PublicTopicDto,
} from './dto/public-content.dto';
import { PublicContentMapper } from './mappers/public-content.mapper';
import { LandingSectionRegistry } from './strategies/landing-section.registry';
import {
  LandingSection,
  PUBLIC_CONTENT_MESSAGES,
  PUBLIC_CONTENT_STATUS,
} from './public-content.constant';

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
      include: { historicalSite: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return entities.map((entity) =>
      PublicContentMapper.toLocationSummary(entity),
    );
  }

  /** Danh sách Sự kiện lịch sử công khai, sắp xếp theo mốc thời gian. */
  async getEvents(): Promise<PublicEventSummaryDto[]> {
    const events = await this.prisma.historicalEvent.findMany({
      where: { status: PUBLIC_CONTENT_STATUS },
      include: { location: { include: { historicalSite: true } } },
      orderBy: [{ startYear: 'asc' }, { displayOrder: 'asc' }],
    });
    return events.map((event) => PublicContentMapper.toEventSummary(event));
  }

  async getPeriodBySlug(slug: string): Promise<PublicPeriodDetailDto> {
    const period = await this.prisma.period.findFirst({
      where: { slug, status: PUBLIC_CONTENT_STATUS },
      include: {
        historicalEntities: {
          where: { status: PUBLIC_CONTENT_STATUS },
          orderBy: [{ displayOrder: 'asc' }],
        },
        historicalEvents: {
          where: { status: PUBLIC_CONTENT_STATUS },
          include: { location: { include: { historicalSite: true } } },
          orderBy: [{ startYear: 'asc' }, { displayOrder: 'asc' }],
        },
      },
    });

    if (!period) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.PERIOD_NOT_FOUND(slug),
      );
    }

    const sortedEvents = [...period.historicalEvents].sort(
      (a, b) => a.startYear - b.startYear || a.displayOrder - b.displayOrder,
    );

    return {
      ...PublicContentMapper.toPeriod(period),
      topics: [],
      figures: period.historicalEntities.map((e) =>
        PublicContentMapper.toFigure(e),
      ),
      events: sortedEvents.map((ev) => PublicContentMapper.toEventSummary(ev)),
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
      throw new NotFoundException(PUBLIC_CONTENT_MESSAGES.TOPIC_NOT_FOUND(slug));
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
        eventEntities: {
          include: {
            event: {
              include: { location: { include: { historicalSite: true } } },
            },
          },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(
        PUBLIC_CONTENT_MESSAGES.FIGURE_NOT_FOUND(slug),
      );
    }

    const relatedEvents = entity.eventEntities
      .map((ee) => ee.event)
      .filter((e) => e.status === PUBLIC_CONTENT_STATUS)
      .sort((a, b) => a.startYear - b.startYear);

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

