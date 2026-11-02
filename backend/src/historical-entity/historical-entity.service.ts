import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  HistoricalEntity,
  HistoricalEntityMedia,
  HistoricalEntityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { TAXONOMY_GROUPS } from '../taxonomy/taxonomy.constant';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { PUBLIC_LANDING_CACHE_KEY } from '../common/constants/cache-keys.constant';
import {
  CreateEntityMediaDto,
  CreateEntityRelationDto,
  CreateHistoricalEntityDto,
  QueryHistoricalEntityDto,
  UpdateHistoricalEntityDto,
} from './dto/historical-entity.dto';
import {
  HISTORICAL_ENTITY_CACHE,
  HISTORICAL_ENTITY_ERRORS,
  HISTORICAL_ENTITY_MESSAGES,
} from './historical-entity.constant';
import {
  HistoricalDateParser,
  validateHistoricalYearRange,
} from '../common/utils/historical-date.parser';
import { PersonEntityDelegate } from './delegates/person-entity.delegate';
import { SiteEntityDelegate } from './delegates/site-entity.delegate';
import { EntityQueryBuilder } from './builders/entity-query.builder';
import { PersonTimelineService } from './timeline/person-timeline.service';
import {
  QueryPersonTimelineDto,
  PersonTimelineResponseDto,
} from './timeline/timeline.dto';

/**
 * Quan hệ Entity-Entity chiếu từ HistoricalStatement — thay cho model
 * `HistoricalEntityRelation` cũ (đã bỏ, xem migration dọn bảng cũ).
 */
export interface EntityRelationView {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  startYear: number | null;
  endYear: number | null;
  note: string | null;
  createdAt: Date;
}

export interface IPaginatedEntities {
  items: HistoricalEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IEntityGraphData {
  nodes: Array<{
    id: string;
    name: string;
    type: HistoricalEntityType;
    imageUrl?: string | null;
    birthYear?: number | null;
    deathYear?: number | null;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    relationType: string;
    startYear?: number | null;
    endYear?: number | null;
    note?: string | null;
  }>;
}

@Injectable()
export class HistoricalEntityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
    private readonly slugService: SlugService,
    private readonly taxonomy: TaxonomyService,
    private readonly personDelegate: PersonEntityDelegate,
    private readonly siteDelegate: SiteEntityDelegate,
    private readonly timelineService: PersonTimelineService,
  ) {}

  private validateYearRange(
    startYear?: number | null,
    endYear?: number | null,
  ): void {
    validateHistoricalYearRange(
      startYear,
      endYear,
      HISTORICAL_ENTITY_ERRORS.INVALID_YEAR_RANGE,
    );
  }

  private validateRelationYearRange(
    startYear?: number | null,
    endYear?: number | null,
  ): void {
    validateHistoricalYearRange(
      startYear,
      endYear,
      HISTORICAL_ENTITY_ERRORS.RELATION_INVALID_YEAR_RANGE,
    );
  }

  private async ensurePeriodExists(periodId?: string | null): Promise<void> {
    if (!periodId) return;
    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException(
        HISTORICAL_ENTITY_ERRORS.PERIOD_NOT_FOUND(periodId),
      );
    }
  }

  /**
   * Tạo mới thực thể lịch sử (Nhân vật, Di tích, Triều đại...)
   */
  async create(dto: CreateHistoricalEntityDto): Promise<HistoricalEntity> {
    this.logger.log(
      `Creating historical entity: ${dto.name}`,
      'HistoricalEntityService',
    );

    const entityType = dto.type ?? HistoricalEntityType.PERSON;

    // 1. Chuẩn hóa thời gian tồn tại của HistoricalEntity
    const resolvedEntityDate = HistoricalDateParser.resolveRangeFields({
      dateText: dto.dateText,
      startYear: dto.startYear,
      endYear: dto.endYear,
      datePrecision: dto.datePrecision,
    });
    this.validateYearRange(
      resolvedEntityDate.startYear,
      resolvedEntityDate.endYear,
    );

    await this.ensurePeriodExists(dto.periodId);

    // 2. Chuẩn hóa payload con qua Delegate Pattern (Person & Site)
    const personCreatePayload =
      entityType === HistoricalEntityType.PERSON
        ? await this.personDelegate.buildCreatePayload(dto)
        : undefined;

    const siteCreatePayload = this.siteDelegate.shouldCreateSite(dto, entityType)
      ? this.siteDelegate.buildCreatePayload(dto)
      : undefined;

    const slug = await this.slugService.generateUnique(
      dto.name,
      async (candidate) =>
        (await this.prisma.historicalEntity.count({
          where: { slug: candidate },
        })) > 0,
    );

    const finalMetadata: Record<string, any> = {
      ...(dto.metadata || {}),
    };
    if (dto.periodIds && Array.isArray(dto.periodIds)) {
      finalMetadata.periodIds = dto.periodIds;
    }

    const created = await this.prisma.historicalEntity.create({
      data: {
        periodId: dto.periodId || null,
        name: dto.name.trim(),
        slug,
        type: entityType,
        tagline: dto.tagline?.trim(),
        description: dto.description?.trim(),
        aliases: dto.aliases ?? [],
        imageUrl: dto.imageUrl,
        imageCaption: dto.imageCaption?.trim(),
        metadata:
          Object.keys(finalMetadata).length > 0
            ? (finalMetadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        isFeatured: dto.isFeatured ?? false,
        displayOrder: dto.displayOrder ?? 0,
        dateText: resolvedEntityDate.dateText,
        startYear: resolvedEntityDate.startYear,
        endYear: resolvedEntityDate.endYear,
        datePrecision: resolvedEntityDate.datePrecision,
        status: dto.status ?? ContentStatus.DRAFT,
        ...(personCreatePayload ? { person: { create: personCreatePayload } } : {}),
        ...(siteCreatePayload ? { historicalSite: { create: siteCreatePayload } } : {}),
      },
    });

    if (siteCreatePayload) {
      await this.siteDelegate.syncSiteTerms(created.id);
    }
    await this.invalidateCache();
    return created;
  }

  /**
   * Lấy danh sách thực thể phân trang kèm bộ lọc
   */
  async findAll(query: QueryHistoricalEntityDto): Promise<IPaginatedEntities> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = EntityQueryBuilder.buildWhere(query);
    const orderBy = EntityQueryBuilder.buildOrderBy();

    const [items, total] = await Promise.all([
      this.prisma.historicalEntity.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          person: true,
          historicalSite: true,
        },
      }),
      this.prisma.historicalEntity.count({ where }),
    ]);

    const mappedItems = items.map((item) => EntityQueryBuilder.mapListItem(item));

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Xem chi tiết thực thể theo ID (kèm cache Redis)
   */
  async findOne(id: string): Promise<HistoricalEntity> {
    const cacheKey = `${HISTORICAL_ENTITY_CACHE.DETAIL_PREFIX}:${id}`;
    const cached = await this.redis.get<HistoricalEntity>(cacheKey);
    if (cached) return cached;

    const entity = await this.prisma.historicalEntity.findUnique({
      where: { id },
      include: EntityQueryBuilder.getDetailInclude(),
    });
    if (!entity) {
      throw new NotFoundException(HISTORICAL_ENTITY_ERRORS.NOT_FOUND(id));
    }

    const mappedEntity = EntityQueryBuilder.mapDetailItem(entity);

    await this.redis.set(
      cacheKey,
      mappedEntity,
      HISTORICAL_ENTITY_CACHE.TTL_SECONDS,
    );
    return mappedEntity;
  }

  /**
   * Cập nhật thông tin thực thể
   */
  async update(
    id: string,
    dto: UpdateHistoricalEntityDto,
  ): Promise<HistoricalEntity> {
    const existing = await this.findOne(id);
    const existingRaw = existing as any;

    const {
      dateText: eDateText,
      startYear: eStartYear,
      endYear: eEndYear,
      datePrecision: eDatePrecision,
      ...baseFields
    } = dto;

    // 1. Chuẩn hóa thời gian tồn tại của HistoricalEntity nếu có cập nhật
    const hasEntityDateUpdates =
      eDateText !== undefined ||
      eStartYear !== undefined ||
      eEndYear !== undefined ||
      eDatePrecision !== undefined;

    const resolvedEntityDate = hasEntityDateUpdates
      ? HistoricalDateParser.resolveRangeFields({
          dateText: eDateText !== undefined ? eDateText : existingRaw.dateText,
          startYear:
            eStartYear !== undefined
              ? eStartYear
              : existingRaw.startYear !== null && eDateText === undefined
                ? existingRaw.startYear
                : undefined,
          endYear:
            eEndYear !== undefined
              ? eEndYear
              : existingRaw.endYear !== null && eDateText === undefined
                ? existingRaw.endYear
                : undefined,
          datePrecision: eDatePrecision,
        })
      : null;

    this.validateYearRange(
      resolvedEntityDate ? resolvedEntityDate.startYear : existingRaw.startYear,
      resolvedEntityDate ? resolvedEntityDate.endYear : existingRaw.endYear,
    );

    if (dto.periodId) {
      await this.ensurePeriodExists(dto.periodId);
    }

    // 2. Chuẩn hóa Person & Site cập nhật qua Delegate
    const personUpsert = await this.personDelegate.buildUpsertPayload(
      dto,
      existingRaw,
    );
    const { hasSiteUpdates, payload: siteUpsert } =
      this.siteDelegate.buildUpsertPayload(dto, existingRaw);

    // 3. Chuẩn hóa metadata và periodIds
    let updatedMetadata: any = undefined;
    if (dto.metadata !== undefined || dto.periodIds !== undefined) {
      const currentMeta =
        existingRaw.metadata && typeof existingRaw.metadata === 'object'
          ? existingRaw.metadata
          : {};
      const newMeta = dto.metadata !== undefined ? dto.metadata : currentMeta;
      const combined = { ...newMeta };
      if (dto.periodIds !== undefined) {
        combined.periodIds = dto.periodIds;
      }
      updatedMetadata =
        Object.keys(combined).length > 0
          ? (combined as Prisma.InputJsonValue)
          : Prisma.JsonNull;
    }

    const {
      periodIds: _discardPeriodIds,
      birthDateText: _b1,
      birthYear: _b2,
      birthMonth: _b3,
      birthDay: _b4,
      birthPrecision: _b5,
      deathDateText: _d1,
      deathYear: _d2,
      deathMonth: _d3,
      deathDay: _d4,
      deathPrecision: _d5,
      birthDateLabel: _bl,
      deathDateLabel: _dl,
      occupation: _occ,
      titles: _tit,
      roles: _rol,
      biography: _bio,
      siteType: _st,
      address: _addr,
      latitude: _lat,
      longitude: _lng,
      constructionDateText: _ct,
      constructionYear: _cy,
      constructionMonth: _cm,
      constructionDay: _cd,
      constructionEndYear: _ce,
      constructionLabel: _cl,
      preservationStatus: _ps,
      recognitionLevel: _rl,
      managingAgency: _ma,
      statusNote: _sn,
      ...cleanedBaseDto
    } = baseFields as any;

    const updated = await this.prisma.historicalEntity.update({
      where: { id },
      data: {
        ...cleanedBaseDto,
        name: cleanedBaseDto.name ? cleanedBaseDto.name.trim() : undefined,
        tagline:
          cleanedBaseDto.tagline !== undefined
            ? cleanedBaseDto.tagline?.trim()
            : undefined,
        description:
          cleanedBaseDto.description !== undefined
            ? cleanedBaseDto.description?.trim()
            : undefined,
        imageCaption:
          cleanedBaseDto.imageCaption !== undefined
            ? cleanedBaseDto.imageCaption?.trim()
            : undefined,
        metadata: updatedMetadata,
        ...(resolvedEntityDate
          ? {
              dateText: resolvedEntityDate.dateText,
              startYear: resolvedEntityDate.startYear,
              endYear: resolvedEntityDate.endYear,
              datePrecision: resolvedEntityDate.datePrecision,
            }
          : {}),
        ...(personUpsert ? { person: personUpsert } : {}),
        ...(siteUpsert ? { historicalSite: siteUpsert } : {}),
      },
      include: {
        person: true,
        historicalSite: true,
      },
    });

    if (hasSiteUpdates) {
      await this.siteDelegate.syncSiteTerms(id);
    }
    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xoá thực thể lịch sử
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.historicalEntity.delete({
      where: { id },
    });

    await this.invalidateCache(id);
    return {
      success: true,
      message: HISTORICAL_ENTITY_MESSAGES.DELETED,
    };
  }

  /**
   * Thêm quan hệ đồ tri thức N-N giữa 2 thực thể (kèm dual-write sang HistoricalStatement)
   */
  async addRelation(
    sourceEntityId: string,
    dto: CreateEntityRelationDto,
  ): Promise<EntityRelationView> {
    if (sourceEntityId === dto.targetEntityId) {
      throw new BadRequestException(
        HISTORICAL_ENTITY_ERRORS.RELATION_SELF_LOOP,
      );
    }
    this.validateRelationYearRange(dto.startYear, dto.endYear);

    await Promise.all([
      this.findOne(sourceEntityId),
      this.findOne(dto.targetEntityId),
    ]);

    const relationTypeCode = await this.taxonomy.requireTermCode(
      TAXONOMY_GROUPS.ENTITY_RELATION,
      dto.relationType,
    );
    const term = await this.prisma.taxonomyTerm.findFirst({
      where: { groupCode: TAXONOMY_GROUPS.ENTITY_RELATION, code: relationTypeCode },
    });
    if (!term) {
      throw new NotFoundException(
        `Không tìm thấy TaxonomyTerm ENTITY_RELATION.${relationTypeCode}.`,
      );
    }

    const statement = await this.prisma.historicalStatement.create({
      data: {
        subjectEntityId: sourceEntityId,
        predicateId: term.id,
        objectEntityId: dto.targetEntityId,
        validFromYear: dto.startYear || null,
        validToYear: dto.endYear || null,
        qualifiers: dto.note ? { note: dto.note } : undefined,
        verificationStatus: 'VERIFIED',
      },
    });

    await this.invalidateCache(sourceEntityId);
    await this.invalidateCache(dto.targetEntityId);
    return {
      id: statement.id,
      sourceEntityId,
      targetEntityId: dto.targetEntityId,
      relationType: relationTypeCode,
      startYear: dto.startYear ?? null,
      endYear: dto.endYear ?? null,
      note: dto.note ?? null,
      createdAt: statement.createdAt,
    };
  }

  /**
   * Xoá mối quan hệ giữa 2 thực thể
   */
  async removeRelation(
    relationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const statement = await this.prisma.historicalStatement.findUnique({
      where: { id: relationId },
    });
    if (!statement) {
      throw new NotFoundException(
        HISTORICAL_ENTITY_ERRORS.RELATION_NOT_FOUND(relationId),
      );
    }

    await this.prisma.historicalStatement.delete({ where: { id: relationId } });

    if (statement.subjectEntityId) await this.invalidateCache(statement.subjectEntityId);
    if (statement.objectEntityId) await this.invalidateCache(statement.objectEntityId);
    return {
      success: true,
      message: HISTORICAL_ENTITY_MESSAGES.RELATION_DELETED,
    };
  }

  /**
   * Lấy Timeline tổng hợp động của thực thể (kết hợp Master Data và Knowledge Graph)
   */
  async getTimeline(
    id: string,
    query?: QueryPersonTimelineDto,
  ): Promise<PersonTimelineResponseDto> {
    return this.timelineService.getTimeline(id, query);
  }

  /**
   * Lấy đồ thị quan hệ của một Entity
   */
  async getEntityGraph(id: string): Promise<IEntityGraphData> {
    const cacheKey = `${HISTORICAL_ENTITY_CACHE.GRAPH_PREFIX}:${id}`;
    const cached = await this.redis.get<IEntityGraphData>(cacheKey);
    if (cached) return cached;

    const rootEntity = await this.findOne(id);
    const rootRaw = rootEntity as any;

    const nodeMap = new Map<
      string,
      {
        id: string;
        name: string;
        type: HistoricalEntityType;
        imageUrl?: string | null;
        birthYear?: number | null;
        deathYear?: number | null;
      }
    >();

    nodeMap.set(rootEntity.id, {
      id: rootEntity.id,
      name: rootEntity.name,
      type: rootEntity.type,
      imageUrl: rootEntity.imageUrl,
      birthYear: rootRaw.birthYear ?? null,
      deathYear: rootRaw.deathYear ?? null,
    });

    // Đồ thị quan hệ lấy từ HistoricalStatement — gồm cả quan hệ nhập qua CMS cũ
    // (nhóm taxonomy ENTITY_RELATION) và quan hệ tri thức mới (nhóm PREDICATE), miễn là
    // Subject/Object đều là Entity (loại trừ statement có Object là Event hoặc literal).
    const [outgoing, incoming] = await Promise.all([
      this.prisma.historicalStatement.findMany({
        where: { subjectEntityId: id, objectEntityId: { not: null } },
        include: {
          predicate: true,
          objectEntity: { include: { person: true } },
        },
      }),
      this.prisma.historicalStatement.findMany({
        where: { objectEntityId: id, subjectEntityId: { not: null } },
        include: {
          predicate: true,
          subjectEntity: { include: { person: true } },
        },
      }),
    ]);

    for (const rel of outgoing) {
      const target = rel.objectEntity!;
      if (!nodeMap.has(target.id)) {
        nodeMap.set(target.id, {
          id: target.id,
          name: target.name,
          type: target.type,
          imageUrl: target.imageUrl,
          birthYear: (target as any).person?.birthYear ?? null,
          deathYear: (target as any).person?.deathYear ?? null,
        });
      }
    }

    for (const rel of incoming) {
      const source = rel.subjectEntity!;
      if (!nodeMap.has(source.id)) {
        nodeMap.set(source.id, {
          id: source.id,
          name: source.name,
          type: source.type,
          imageUrl: source.imageUrl,
          birthYear: (source as any).person?.birthYear ?? null,
          deathYear: (source as any).person?.deathYear ?? null,
        });
      }
    }

    const edges = [
      ...outgoing.map((rel) => ({
        id: rel.id,
        source: rel.subjectEntityId as string,
        target: rel.objectEntityId as string,
        relationType: rel.predicate?.code ?? null,
        startYear: rel.validFromYear,
        endYear: rel.validToYear,
        note: (rel.qualifiers as any)?.note ?? null,
      })),
      ...incoming.map((rel) => ({
        id: rel.id,
        source: rel.subjectEntityId as string,
        target: rel.objectEntityId as string,
        relationType: rel.predicate?.code ?? null,
        startYear: rel.validFromYear,
        endYear: rel.validToYear,
        note: (rel.qualifiers as any)?.note ?? null,
      })),
    ];

    const graphData: IEntityGraphData = {
      nodes: Array.from(nodeMap.values()),
      edges,
    };

    await this.redis.set(
      cacheKey,
      graphData,
      HISTORICAL_ENTITY_CACHE.TTL_SECONDS,
    );
    return graphData;
  }

  /**
   * Thêm tư liệu hình ảnh / tài liệu cho Entity
   */
  async addMedia(
    entityId: string,
    dto: CreateEntityMediaDto,
  ): Promise<HistoricalEntityMedia> {
    await this.findOne(entityId);

    const media = await this.prisma.historicalEntityMedia.create({
      data: {
        entityId,
        type: dto.type,
        url: dto.url.trim(),
        caption: dto.caption?.trim(),
        displayOrder: dto.displayOrder ?? 0,
      },
    });

    await this.invalidateCache(entityId);
    return media;
  }

  /**
   * Xoá tư liệu hình ảnh / tài liệu
   */
  async removeMedia(
    mediaId: string,
  ): Promise<{ success: boolean; message: string }> {
    const media = await this.prisma.historicalEntityMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) {
      throw new NotFoundException(
        HISTORICAL_ENTITY_ERRORS.MEDIA_NOT_FOUND(mediaId),
      );
    }

    await this.prisma.historicalEntityMedia.delete({
      where: { id: mediaId },
    });

    await this.invalidateCache(media.entityId);
    return {
      success: true,
      message: HISTORICAL_ENTITY_MESSAGES.MEDIA_DELETED,
    };
  }

  /**
   * Xoá cache Redis khi có cập nhật
   */
  private async invalidateCache(id?: string): Promise<void> {
    const keysToDelete: string[] = [PUBLIC_LANDING_CACHE_KEY];

    if (id) {
      keysToDelete.push(
        `${HISTORICAL_ENTITY_CACHE.DETAIL_PREFIX}:${id}`,
        `${HISTORICAL_ENTITY_CACHE.GRAPH_PREFIX}:${id}`,
      );
    }

    await Promise.all(keysToDelete.map((key) => this.redis.del(key)));
    await this.redis.deleteByPattern(HISTORICAL_ENTITY_CACHE.LIST_PATTERN);
  }
}
