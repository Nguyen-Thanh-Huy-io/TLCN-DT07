import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { CreateHistoricalEventDto } from './dto/create-historical-event.dto';
import { UpdateHistoricalEventDto } from './dto/update-historical-event.dto';
import { QueryHistoricalEventDto } from './dto/query-historical-event.dto';
import {
  HISTORICAL_EVENT_CACHE,
  HISTORICAL_EVENT_ERRORS,
  HISTORICAL_EVENT_MESSAGES,
  HISTORICAL_EVENT_TOKENS,
} from './historical-event.constant';
import type { IHistoricalEventRepository } from './repositories/historical-event.repository.interface';
import { EventMetadataStrategyRegistry } from './strategies/event-metadata-strategy.registry';
import {
  CreateHistoricalEventDomainModel,
  HistoricalEventEntityModel,
  UpdateHistoricalEventDomainModel,
} from './models/historical-event.domain-model';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HistoricalEventService {
  constructor(
    @Inject(HISTORICAL_EVENT_TOKENS.REPOSITORY)
    private readonly repository: IHistoricalEventRepository,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
    private readonly slugService: SlugService,
    private readonly metadataStrategyRegistry: EventMetadataStrategyRegistry,
  ) {}

  private validateYearRange(startYear?: number, endYear?: number | null): void {
    if (
      startYear !== undefined &&
      endYear !== undefined &&
      endYear !== null &&
      endYear < startYear
    ) {
      throw new BadRequestException(HISTORICAL_EVENT_ERRORS.INVALID_YEAR_RANGE);
    }
  }

  private async ensureReferencesExist(dto: {
    topicId?: string;
    periodId?: string;
    siteId?: string;
    locationId?: string;
    parentId?: string;
  }): Promise<void> {
    const refs = await this.repository.checkReferences(dto);

    if (dto.topicId && !refs.topicExists) {
      throw new NotFoundException(
        HISTORICAL_EVENT_ERRORS.TOPIC_NOT_FOUND(dto.topicId),
      );
    }

    if (dto.periodId && !refs.periodExists) {
      throw new NotFoundException(
        HISTORICAL_EVENT_ERRORS.PERIOD_NOT_FOUND(dto.periodId),
      );
    }

    const checkSiteId = dto.siteId || dto.locationId;
    if (checkSiteId && !refs.locationExists) {
      throw new NotFoundException(
        HISTORICAL_EVENT_ERRORS.SITE_NOT_FOUND(checkSiteId),
      );
    }

    if (dto.parentId && !refs.parentExists) {
      throw new NotFoundException(
        `Sự kiện cha với ID ${dto.parentId} không tồn tại trong hệ thống.`,
      );
    }
  }

  /**
   * Tạo mới một sự kiện lịch sử (Master Data dùng chung)
   */
  async create(dto: CreateHistoricalEventDto): Promise<HistoricalEventEntityModel> {
    this.logger.log(
      `Creating historical event: ${dto.title}`,
      'HistoricalEventService',
    );

    this.validateYearRange(dto.startYear, dto.endYear);
    await this.ensureReferencesExist(dto);

    const slug = dto.slug?.trim()
      ? dto.slug.trim()
      : await this.slugService.generateUnique(
          dto.title,
          async (candidate) => await this.repository.existsBySlug(candidate),
        );

    const { entityIds, entityRelations, category, metadata, ...rest } = dto;

    // Áp dụng Strategy Pattern xử lý metadata
    const strategy = this.metadataStrategyRegistry.getStrategy(category as any);
    const normalizedMetadata = strategy.validateAndNormalize(metadata);

    const relationRecords =
      entityRelations && entityRelations.length > 0
        ? Array.from(
            new Map(
              entityRelations
                .filter((r) => Boolean(r.entityId))
                .map((r, idx) => [
                  r.entityId,
                  {
                    entityId: r.entityId,
                    role: r.role?.trim() || 'PARTICIPANT',
                    roleLabel: (r as any).roleLabel?.trim() || null,
                    isPrimary: Boolean((r as any).isPrimary),
                    displayOrder: (r as any).displayOrder ?? idx,
                    notes: (r as any).notes?.trim() || null,
                  },
                ]),
            ).values(),
          )
        : entityIds && entityIds.length > 0
        ? Array.from(new Set(entityIds)).map((entityId, idx) => ({
            entityId,
            role: 'PARTICIPANT',
            roleLabel: null,
            isPrimary: false,
            displayOrder: idx,
            notes: null,
          }))
        : [];

    const locationId = rest.locationId || (rest as any).siteId || null;
    const createModel: CreateHistoricalEventDomainModel = {
      topicId: rest.topicId || null,
      periodId: rest.periodId || null,
      locationId,
      parentId: rest.parentId || null,
      title: rest.title.trim(),
      slug,
      startYear: rest.startYear,
      startMonth: rest.startMonth ?? null,
      startDay: rest.startDay ?? null,
      endYear: rest.endYear ?? null,
      endMonth: rest.endMonth ?? null,
      endDay: rest.endDay ?? null,
      eventDateNote: rest.eventDateNote,
      summary: rest.summary,
      description: rest.description,
      thumbnailUrl: rest.thumbnailUrl,
      displayOrder: rest.displayOrder ?? 0,
      status: rest.status,
      category: category,
      metadata: normalizedMetadata,
      entities: relationRecords,
      media: rest.media,
    };

    const event = await this.repository.create(createModel);

    await this.invalidateCache();
    return event;
  }

  /**
   * Lấy danh sách sự kiện lịch sử (phân trang và lọc)
   */
  async findAll(
    query: QueryHistoricalEventDto,
  ): Promise<IPaginatedResult<HistoricalEventEntityModel>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));

    const cacheKey = `${HISTORICAL_EVENT_CACHE.LIST_PREFIX}:${JSON.stringify(query)}`;
    try {
      const cached =
        await this.redis.get<IPaginatedResult<HistoricalEventEntityModel>>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      this.logger.warn(
        `Redis get error: ${(err as Error).message}`,
        'HistoricalEventService',
      );
    }

    const { items, total } = await this.repository.findMany(query);

    const formattedItems = items.map((item) => this.formatEvent(item));
    const result: IPaginatedResult<HistoricalEventEntityModel> = {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };

    try {
      await this.redis.set(
        cacheKey,
        result,
        HISTORICAL_EVENT_CACHE.TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(
        `Redis set error: ${(err as Error).message}`,
        'HistoricalEventService',
      );
    }

    return result;
  }

  private formatEvent(event: HistoricalEventEntityModel): HistoricalEventEntityModel {
    if (!event) return event;
    const locationEntity = (event as any).location;
    const locName = locationEntity?.name || locationEntity?.historicalSite?.address || (event.metadata as any)?.rawLocation || null;
    return {
      ...event,
      locationId: (event as any).locationId ?? null,
      location: locName,
      historicalLocation: event.historicalLocation || (locationEntity ? {
        id: locationEntity.id,
        name: locationEntity.name,
        slug: locationEntity.slug || '',
        address: locationEntity.historicalSite?.address || null,
        type: locationEntity.historicalSite?.siteType || locationEntity.type || 'LOCATION',
      } : null),
    };
  }

  /**
   * Lấy chi tiết một sự kiện lịch sử theo ID
   */
  async findOne(id: string): Promise<HistoricalEventEntityModel> {
    const cacheKey = `${HISTORICAL_EVENT_CACHE.DETAIL_PREFIX}:${id}`;
    try {
      const cached = await this.redis.get<HistoricalEventEntityModel>(cacheKey);
      if (cached) {
        return this.formatEvent(cached);
      }
    } catch (err) {
      this.logger.warn(
        `Redis get error: ${(err as Error).message}`,
        'HistoricalEventService',
      );
    }

    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundException(HISTORICAL_EVENT_ERRORS.NOT_FOUND(id));
    }

    const formatted = this.formatEvent(event);
    try {
      await this.redis.set(
        cacheKey,
        event,
        HISTORICAL_EVENT_CACHE.TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(
        `Redis set error: ${(err as Error).message}`,
        'HistoricalEventService',
      );
    }

    return formatted;
  }

  /**
   * Cập nhật một sự kiện lịch sử theo ID
   */
  async update(
    id: string,
    dto: UpdateHistoricalEventDto,
  ): Promise<HistoricalEventEntityModel> {
    const existing = await this.findOne(id);

    const startYear =
      dto.startYear !== undefined ? dto.startYear : existing.startYear;
    const endYear = dto.endYear !== undefined ? dto.endYear : existing.endYear;
    this.validateYearRange(startYear, endYear);

    await this.ensureReferencesExist(dto);

    const { entityIds, entityRelations, category, metadata, ...rest } = dto;

    const targetCategory = category ?? existing.category;

    let normalizedMetadata: Record<string, any> | null | undefined = undefined;
    if (metadata !== undefined) {
      const strategy = this.metadataStrategyRegistry.getStrategy(targetCategory as any);
      normalizedMetadata = strategy.validateAndNormalize(metadata);
    }

    const relationRecords =
      entityRelations !== undefined
        ? Array.from(
            new Map(
              entityRelations
                .filter((r) => Boolean(r.entityId))
                .map((r, idx) => [
                  r.entityId,
                  {
                    entityId: r.entityId,
                    role: r.role?.trim() || 'PARTICIPANT',
                    roleLabel: (r as any).roleLabel?.trim() || null,
                    isPrimary: Boolean((r as any).isPrimary),
                    displayOrder: (r as any).displayOrder ?? idx,
                    notes: (r as any).notes?.trim() || null,
                  },
                ]),
            ).values(),
          )
        : entityIds !== undefined
        ? Array.from(new Set(entityIds)).map((entityId, idx) => ({
            entityId,
            role: 'PARTICIPANT',
            roleLabel: null,
            isPrimary: false,
            displayOrder: idx,
            notes: null,
          }))
        : undefined;

    const locationId = rest.locationId !== undefined ? rest.locationId : (rest as any).siteId !== undefined ? (rest as any).siteId : undefined;

    const updateModel: UpdateHistoricalEventDomainModel = {
      ...(rest.title !== undefined ? { title: rest.title.trim() } : {}),
      ...(rest.slug !== undefined ? { slug: rest.slug } : {}),
      ...(rest.startYear !== undefined ? { startYear: rest.startYear } : {}),
      ...(rest.startMonth !== undefined ? { startMonth: rest.startMonth } : {}),
      ...(rest.startDay !== undefined ? { startDay: rest.startDay } : {}),
      ...(rest.endYear !== undefined ? { endYear: rest.endYear } : {}),
      ...(rest.endMonth !== undefined ? { endMonth: rest.endMonth } : {}),
      ...(rest.endDay !== undefined ? { endDay: rest.endDay } : {}),
      ...(rest.eventDateNote !== undefined ? { eventDateNote: rest.eventDateNote } : {}),
      ...(rest.summary !== undefined ? { summary: rest.summary } : {}),
      ...(rest.description !== undefined ? { description: rest.description } : {}),
      ...(rest.thumbnailUrl !== undefined ? { thumbnailUrl: rest.thumbnailUrl } : {}),
      ...(rest.displayOrder !== undefined ? { displayOrder: rest.displayOrder } : {}),
      ...(rest.status !== undefined ? { status: rest.status } : {}),
      ...(rest.topicId !== undefined ? { topicId: rest.topicId } : {}),
      ...(rest.periodId !== undefined ? { periodId: rest.periodId } : {}),
      ...(locationId !== undefined ? { locationId } : {}),
      ...(rest.parentId !== undefined ? { parentId: rest.parentId } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(metadata !== undefined ? { metadata: normalizedMetadata } : {}),
      ...(relationRecords !== undefined ? { entities: relationRecords } : {}),
      ...(rest.media !== undefined ? { media: rest.media } : {}),
    };

    const updated = await this.repository.update(id, updateModel);

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xóa một sự kiện lịch sử (Kiểm tra chặn xóa nếu đang chứa các sự kiện thành phần con)
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    const childCount = await this.repository.countChildren(id);
    if (childCount > 0) {
      throw new BadRequestException(
        HISTORICAL_EVENT_ERRORS.CHILDREN_EXIST_CANNOT_DELETE(childCount),
      );
    }

    await this.repository.delete(id);
    await this.invalidateCache(id);

    return {
      success: true,
      message: HISTORICAL_EVENT_MESSAGES.DELETE_SUCCESS,
    };
  }

  /**
   * Thêm quan hệ ngữ nghĩa / nhân quả giữa 2 sự kiện lịch sử
   */
  async addRelation(
    sourceEventId: string,
    dto: {
      targetEventId: string;
      relationType: any;
      description?: string;
      status?: any;
      sourceReference?: string;
    },
  ): Promise<any> {
    if (sourceEventId === dto.targetEventId) {
      throw new BadRequestException(HISTORICAL_EVENT_ERRORS.RELATION_SELF_LOOP);
    }

    // Đảm bảo cả 2 sự kiện đều tồn tại
    await Promise.all([
      this.findOne(sourceEventId),
      this.findOne(dto.targetEventId),
    ]);

    const relation = await this.repository.addRelation({
      sourceEventId,
      targetEventId: dto.targetEventId,
      relationType: dto.relationType,
      description: dto.description,
      status: dto.status,
      sourceReference: dto.sourceReference,
    });

    await this.invalidateCache(sourceEventId);
    await this.invalidateCache(dto.targetEventId);
    return relation;
  }

  /**
   * Xóa quan hệ giữa 2 sự kiện lịch sử
   */
  async removeRelation(
    relationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const relation = await this.repository.findRelationById(relationId);
    if (!relation) {
      throw new NotFoundException(
        HISTORICAL_EVENT_ERRORS.RELATION_NOT_FOUND(relationId),
      );
    }

    await this.repository.removeRelation(relationId);

    await this.invalidateCache(relation.sourceEventId);
    await this.invalidateCache(relation.targetEventId);

    return {
      success: true,
      message: HISTORICAL_EVENT_MESSAGES.RELATION_DELETED,
    };
  }

  /**
   * Lấy đồ thị quan hệ tri thức & nhân quả của sự kiện (Nodes & Edges)
   */
  async getEventGraph(id: string): Promise<{ nodes: any[]; edges: any[] }> {
    const cacheKey = `${HISTORICAL_EVENT_CACHE.GRAPH_PREFIX}:${id}`;
    try {
      const cached = await this.redis.get<{ nodes: any[]; edges: any[] }>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(`Redis get error: ${(err as Error).message}`, 'HistoricalEventService');
    }

    const currentEvent = await this.findOne(id);
    const { outgoing, incoming } = await this.repository.findRelationsByEventId(id);

    const nodeMap = new Map<string, any>();
    nodeMap.set(currentEvent.id, {
      id: currentEvent.id,
      title: currentEvent.title,
      slug: currentEvent.slug,
      startYear: currentEvent.startYear,
      endYear: currentEvent.endYear,
      category: currentEvent.category,
      thumbnailUrl: currentEvent.thumbnailUrl,
    });

    const edges: any[] = [];

    for (const rel of outgoing) {
      if (rel.targetEvent && !nodeMap.has(rel.targetEventId)) {
        nodeMap.set(rel.targetEventId, {
          id: rel.targetEvent.id,
          title: rel.targetEvent.title,
          slug: rel.targetEvent.slug,
          startYear: rel.targetEvent.startYear,
          endYear: rel.targetEvent.endYear,
          category: rel.targetEvent.category,
          thumbnailUrl: rel.targetEvent.thumbnailUrl,
        });
      }
      edges.push({
        id: rel.id,
        source: rel.sourceEventId,
        target: rel.targetEventId,
        relationType: rel.relationType,
        description: rel.description,
        status: rel.status,
        sourceReference: rel.sourceReference,
      });
    }

    for (const rel of incoming) {
      if (rel.sourceEvent && !nodeMap.has(rel.sourceEventId)) {
        nodeMap.set(rel.sourceEventId, {
          id: rel.sourceEvent.id,
          title: rel.sourceEvent.title,
          slug: rel.sourceEvent.slug,
          startYear: rel.sourceEvent.startYear,
          endYear: rel.sourceEvent.endYear,
          category: rel.sourceEvent.category,
          thumbnailUrl: rel.sourceEvent.thumbnailUrl,
        });
      }
      edges.push({
        id: rel.id,
        source: rel.sourceEventId,
        target: rel.targetEventId,
        relationType: rel.relationType,
        description: rel.description,
        status: rel.status,
        sourceReference: rel.sourceReference,
      });
    }

    const graphData = {
      nodes: Array.from(nodeMap.values()),
      edges,
    };

    try {
      await this.redis.set(cacheKey, graphData, HISTORICAL_EVENT_CACHE.TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Redis set error: ${(err as Error).message}`, 'HistoricalEventService');
    }

    return graphData;
  }

  /**
   * Xóa cache Redis danh sách, chi tiết và đồ thị
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      await this.redis.deleteByPattern(`${HISTORICAL_EVENT_CACHE.LIST_PREFIX}:*`);
      if (id) {
        await this.redis.del(`${HISTORICAL_EVENT_CACHE.DETAIL_PREFIX}:${id}`);
        await this.redis.del(`${HISTORICAL_EVENT_CACHE.GRAPH_PREFIX}:${id}`);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate Redis cache: ${(err as Error).message}`,
        'HistoricalEventService',
      );
    }
  }
}
