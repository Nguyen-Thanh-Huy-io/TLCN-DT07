import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  HistoricalEntity,
  HistoricalEntityMedia,
  HistoricalEntityRelation,
  HistoricalEntityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { TAXONOMY_GROUPS } from '../taxonomy/taxonomy.constant';
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

  async create(dto: CreateHistoricalEntityDto): Promise<HistoricalEntity> {
    this.logger.log(
      `Creating historical entity: ${dto.name}`,
      'HistoricalEntityService',
    );

    const entityType = dto.type ?? HistoricalEntityType.PERSON;

    // 1. Chuẩn hóa thời gian tồn tại của HistoricalEntity (Triều đại / Tổ chức / Thực thể)
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

    // 2. Chuẩn hóa ngày sinh & ngày mất tách riêng cho Person
    const resolvedBirthDate = HistoricalDateParser.resolveSinglePointFields({
      dateText: dto.birthDateText,
      legacyLabel: dto.birthDateLabel,
      year: dto.birthYear,
      month: dto.birthMonth,
      day: dto.birthDay,
      precision: dto.birthPrecision,
    });
    const resolvedDeathDate = HistoricalDateParser.resolveSinglePointFields({
      dateText: dto.deathDateText,
      legacyLabel: dto.deathDateLabel,
      year: dto.deathYear,
      month: dto.deathMonth,
      day: dto.deathDay,
      precision: dto.deathPrecision,
    });
    this.validateYearRange(resolvedBirthDate.year, resolvedDeathDate.year);

    // 3. Chuẩn hóa thời gian xây dựng cho HistoricalSite (Di tích)
    const resolvedConstructionDate = HistoricalDateParser.resolveRangeFields({
      dateText: dto.constructionDateText,
      legacyLabel: dto.constructionLabel,
      startYear: dto.constructionYear,
      startMonth: dto.constructionMonth,
      startDay: dto.constructionDay,
      endYear: dto.constructionEndYear,
      datePrecision: dto.datePrecision,
    });
    this.validateYearRange(
      resolvedConstructionDate.startYear,
      resolvedConstructionDate.endYear,
    );

    await this.ensurePeriodExists(dto.periodId);

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
        ...(entityType === HistoricalEntityType.PERSON
          ? {
              person: {
                create: {
                  birthDateText: resolvedBirthDate.dateText,
                  birthYear: resolvedBirthDate.year,
                  birthMonth: resolvedBirthDate.month,
                  birthDay: resolvedBirthDate.day,
                  birthPrecision: resolvedBirthDate.precision,
                  deathDateText: resolvedDeathDate.dateText,
                  deathYear: resolvedDeathDate.year,
                  deathMonth: resolvedDeathDate.month,
                  deathDay: resolvedDeathDate.day,
                  deathPrecision: resolvedDeathDate.precision,
                  birthDateLabel:
                    dto.birthDateLabel?.trim() ?? resolvedBirthDate.dateText,
                  deathDateLabel:
                    dto.deathDateLabel?.trim() ?? resolvedDeathDate.dateText,
                  occupation: dto.occupation?.trim(),
                  titles: dto.titles ?? [],
                  roles: await this.taxonomy.requireTermCodes(
                    TAXONOMY_GROUPS.FIGURE_ROLE,
                    dto.roles ?? [],
                  ),
                  biography: dto.biography?.trim(),
                },
              },
            }
          : {}),
        ...(dto.siteType || entityType === HistoricalEntityType.LOCATION
          ? {
              historicalSite: {
                create: {
                  siteType: dto.siteType?.trim() || 'HISTORICAL_SITE',
                  address: dto.address?.trim(),
                  latitude:
                    dto.latitude !== undefined && dto.latitude !== null
                      ? new Prisma.Decimal(dto.latitude)
                      : undefined,
                  longitude:
                    dto.longitude !== undefined && dto.longitude !== null
                      ? new Prisma.Decimal(dto.longitude)
                      : undefined,
                  constructionDateText: resolvedConstructionDate.dateText,
                  constructionYear: resolvedConstructionDate.startYear,
                  constructionMonth: resolvedConstructionDate.startMonth,
                  constructionDay: resolvedConstructionDate.startDay,
                  constructionEndYear: resolvedConstructionDate.endYear,
                  datePrecision: resolvedConstructionDate.datePrecision,
                  constructionLabel:
                    dto.constructionLabel?.trim() ??
                    resolvedConstructionDate.dateText,
                  preservationStatus: dto.preservationStatus?.trim(),
                  recognitionLevel: dto.recognitionLevel?.trim(),
                  managingAgency: dto.managingAgency?.trim(),
                  statusNote: dto.statusNote?.trim() || null,
                },
              },
            }
          : {}),
      },
    });

    // Form CMS còn nhập chữ tự do cho loại / hiện trạng / xếp hạng — quy đổi sang danh mục dùng chung.
    await this.taxonomy.syncSiteTerms(created.id);
    await this.invalidateCache();
    return created;
  }

  async findAll(query: QueryHistoricalEntityDto): Promise<IPaginatedEntities> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.HistoricalEntityWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.periodId) where.periodId = query.periodId;
    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { tagline: { contains: keyword, mode: 'insensitive' } },
        { aliases: { has: keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.historicalEntity.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
        include: {
          person: true,
          historicalSite: true,
        },
      }),
      this.prisma.historicalEntity.count({ where }),
    ]);

    const mappedItems = items.map((item: any) => ({
      ...item,
      periodIds:
        item.metadata &&
        typeof item.metadata === 'object' &&
        Array.isArray(item.metadata.periodIds)
          ? item.metadata.periodIds
          : item.periodId
            ? [item.periodId]
            : [],
      birthDateText:
        item.person?.birthDateText ?? item.person?.birthDateLabel ?? null,
      birthYear: item.person?.birthYear ?? null,
      birthMonth: item.person?.birthMonth ?? null,
      birthDay: item.person?.birthDay ?? null,
      birthPrecision: item.person?.birthPrecision ?? null,
      deathDateText:
        item.person?.deathDateText ?? item.person?.deathDateLabel ?? null,
      deathYear: item.person?.deathYear ?? null,
      deathMonth: item.person?.deathMonth ?? null,
      deathDay: item.person?.deathDay ?? null,
      deathPrecision: item.person?.deathPrecision ?? null,
      birthDateLabel:
        item.person?.birthDateLabel ?? item.person?.birthDateText ?? null,
      deathDateLabel:
        item.person?.deathDateLabel ?? item.person?.deathDateText ?? null,
      siteType: item.historicalSite?.siteType ?? null,
      address: item.historicalSite?.address ?? null,
      latitude: item.historicalSite?.latitude
        ? Number(item.historicalSite.latitude)
        : null,
      longitude: item.historicalSite?.longitude
        ? Number(item.historicalSite.longitude)
        : null,
      constructionDateText:
        item.historicalSite?.constructionDateText ??
        item.historicalSite?.constructionLabel ??
        null,
      constructionYear: item.historicalSite?.constructionYear ?? null,
      constructionMonth: item.historicalSite?.constructionMonth ?? null,
      constructionDay: item.historicalSite?.constructionDay ?? null,
      constructionEndYear: item.historicalSite?.constructionEndYear ?? null,
      constructionLabel:
        item.historicalSite?.constructionLabel ??
        item.historicalSite?.constructionDateText ??
        null,
    }));

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<HistoricalEntity> {
    const cacheKey = `${HISTORICAL_ENTITY_CACHE.DETAIL_PREFIX}:${id}`;
    const cached = await this.redis.get<HistoricalEntity>(cacheKey);
    if (cached) return cached;

    const entity = await this.prisma.historicalEntity.findUnique({
      where: { id },
      include: {
        person: true,
        historicalSite: {
          include: { siteTypeTerm: true, preservation: true, rank: true },
        },
        outgoingRelations: {
          include: {
            targetEntity: {
              include: {
                person: true,
              },
            },
          },
        },
        incomingRelations: {
          include: {
            sourceEntity: {
              include: {
                person: true,
              },
            },
          },
        },
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        eventEntities: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
                startYear: true,
                endYear: true,
                category: true,
                thumbnailUrl: true,
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        primaryEvents: {
          select: {
            id: true,
            title: true,
            slug: true,
            startYear: true,
            endYear: true,
            category: true,
            thumbnailUrl: true,
          },
        },
      },
    });
    if (!entity) {
      throw new NotFoundException(HISTORICAL_ENTITY_ERRORS.NOT_FOUND(id));
    }

    const raw = entity as any;
    const metadataPeriodIds =
      raw.metadata &&
      typeof raw.metadata === 'object' &&
      Array.isArray(raw.metadata.periodIds)
        ? raw.metadata.periodIds
        : raw.periodId
          ? [raw.periodId]
          : [];

    const mappedEntity: any = {
      ...raw,
      periodIds: metadataPeriodIds,
      birthDateText:
        raw.person?.birthDateText ?? raw.person?.birthDateLabel ?? null,
      birthYear: raw.person?.birthYear ?? null,
      birthMonth: raw.person?.birthMonth ?? null,
      birthDay: raw.person?.birthDay ?? null,
      birthPrecision: raw.person?.birthPrecision ?? null,
      deathDateText:
        raw.person?.deathDateText ?? raw.person?.deathDateLabel ?? null,
      deathYear: raw.person?.deathYear ?? null,
      deathMonth: raw.person?.deathMonth ?? null,
      deathDay: raw.person?.deathDay ?? null,
      deathPrecision: raw.person?.deathPrecision ?? null,
      birthDateLabel:
        raw.person?.birthDateLabel ?? raw.person?.birthDateText ?? null,
      deathDateLabel:
        raw.person?.deathDateLabel ?? raw.person?.deathDateText ?? null,
      occupation: raw.person?.occupation ?? null,
      titles: raw.person?.titles ?? [],
      roles: raw.person?.roles ?? [],
      biography: raw.person?.biography ?? null,
      siteType: raw.historicalSite?.siteType ?? null,
      address: raw.historicalSite?.address ?? null,
      latitude: raw.historicalSite?.latitude
        ? Number(raw.historicalSite.latitude)
        : null,
      longitude: raw.historicalSite?.longitude
        ? Number(raw.historicalSite.longitude)
        : null,
      constructionDateText:
        raw.historicalSite?.constructionDateText ??
        raw.historicalSite?.constructionLabel ??
        null,
      constructionYear: raw.historicalSite?.constructionYear ?? null,
      constructionMonth: raw.historicalSite?.constructionMonth ?? null,
      constructionDay: raw.historicalSite?.constructionDay ?? null,
      constructionEndYear: raw.historicalSite?.constructionEndYear ?? null,
      constructionLabel:
        raw.historicalSite?.constructionLabel ??
        raw.historicalSite?.constructionDateText ??
        null,
      preservationStatus: raw.historicalSite?.preservationStatus ?? null,
      recognitionLevel: raw.historicalSite?.recognitionLevel ?? null,
      managingAgency: raw.historicalSite?.managingAgency ?? null,
      statusNote: raw.historicalSite?.statusNote ?? null,
      siteTypeCode: raw.historicalSite?.siteTypeTerm?.code ?? null,
      preservationCode: raw.historicalSite?.preservation?.code ?? null,
      rankCode: raw.historicalSite?.rank?.code ?? null,
      outgoingRelations: raw.outgoingRelations?.map((rel: any) => ({
        ...rel,
        targetEntity: {
          ...rel.targetEntity,
          birthYear: rel.targetEntity?.person?.birthYear ?? null,
          deathYear: rel.targetEntity?.person?.deathYear ?? null,
        },
      })),
      incomingRelations: raw.incomingRelations?.map((rel: any) => ({
        ...rel,
        sourceEntity: {
          ...rel.sourceEntity,
          birthYear: rel.sourceEntity?.person?.birthYear ?? null,
          deathYear: rel.sourceEntity?.person?.deathYear ?? null,
        },
      })),
      eventEntities: raw.eventEntities || [],
      primaryEvents: raw.primaryEvents || [],
    };

    await this.redis.set(
      cacheKey,
      mappedEntity,
      HISTORICAL_ENTITY_CACHE.TTL_SECONDS,
    );
    return mappedEntity;
  }

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
      birthDateText: bDateText,
      birthYear: bYear,
      birthMonth: bMonth,
      birthDay: bDay,
      birthPrecision: bPrecision,
      deathDateText: dDateText,
      deathYear: dYear,
      deathMonth: dMonth,
      deathDay: dDay,
      deathPrecision: dPrecision,
      birthDateLabel: bLabel,
      deathDateLabel: dLabel,
      occupation,
      titles,
      roles: rawRoles,
      biography,
      siteType,
      address,
      latitude,
      longitude,
      constructionDateText: cDateText,
      constructionYear,
      constructionMonth,
      constructionDay,
      constructionEndYear,
      constructionLabel,
      preservationStatus,
      recognitionLevel,
      managingAgency,
      statusNote,
      ...baseDto
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

    // 2. Chuẩn hóa ngày sinh / ngày mất của Person nếu có cập nhật
    const hasBirthDateUpdates =
      bDateText !== undefined ||
      bLabel !== undefined ||
      bYear !== undefined ||
      bMonth !== undefined ||
      bDay !== undefined ||
      bPrecision !== undefined;

    const resolvedBirthDate = hasBirthDateUpdates
      ? HistoricalDateParser.resolveSinglePointFields({
          dateText:
            bDateText !== undefined
              ? bDateText
              : bLabel !== undefined
                ? bLabel
                : existingRaw.birthDateText,
          legacyLabel: bLabel ?? existingRaw.birthDateLabel,
          year:
            bYear !== undefined
              ? bYear
              : existingRaw.birthYear !== null &&
                  bDateText === undefined &&
                  bLabel === undefined
                ? existingRaw.birthYear
                : undefined,
          month:
            bMonth !== undefined
              ? bMonth
              : existingRaw.birthMonth !== null &&
                  bDateText === undefined &&
                  bLabel === undefined
                ? existingRaw.birthMonth
                : undefined,
          day:
            bDay !== undefined
              ? bDay
              : existingRaw.birthDay !== null &&
                  bDateText === undefined &&
                  bLabel === undefined
                ? existingRaw.birthDay
                : undefined,
          precision: bPrecision,
        })
      : null;

    const hasDeathDateUpdates =
      dDateText !== undefined ||
      dLabel !== undefined ||
      dYear !== undefined ||
      dMonth !== undefined ||
      dDay !== undefined ||
      dPrecision !== undefined;

    const resolvedDeathDate = hasDeathDateUpdates
      ? HistoricalDateParser.resolveSinglePointFields({
          dateText:
            dDateText !== undefined
              ? dDateText
              : dLabel !== undefined
                ? dLabel
                : existingRaw.deathDateText,
          legacyLabel: dLabel ?? existingRaw.deathDateLabel,
          year:
            dYear !== undefined
              ? dYear
              : existingRaw.deathYear !== null &&
                  dDateText === undefined &&
                  dLabel === undefined
                ? existingRaw.deathYear
                : undefined,
          month:
            dMonth !== undefined
              ? dMonth
              : existingRaw.deathMonth !== null &&
                  dDateText === undefined &&
                  dLabel === undefined
                ? existingRaw.deathMonth
                : undefined,
          day:
            dDay !== undefined
              ? dDay
              : existingRaw.deathDay !== null &&
                  dDateText === undefined &&
                  dLabel === undefined
                ? existingRaw.deathDay
                : undefined,
          precision: dPrecision,
        })
      : null;

    this.validateYearRange(
      resolvedBirthDate ? resolvedBirthDate.year : existingRaw.birthYear,
      resolvedDeathDate ? resolvedDeathDate.year : existingRaw.deathYear,
    );

    // 3. Chuẩn hóa thời gian xây dựng của HistoricalSite nếu có cập nhật
    const hasConstructionDateUpdates =
      cDateText !== undefined ||
      constructionLabel !== undefined ||
      constructionYear !== undefined ||
      constructionMonth !== undefined ||
      constructionDay !== undefined ||
      constructionEndYear !== undefined;

    const resolvedConstructionDate = hasConstructionDateUpdates
      ? HistoricalDateParser.resolveRangeFields({
          dateText:
            cDateText !== undefined
              ? cDateText
              : constructionLabel !== undefined
                ? constructionLabel
                : existingRaw.constructionDateText,
          legacyLabel: constructionLabel ?? existingRaw.constructionLabel,
          startYear:
            constructionYear !== undefined
              ? constructionYear
              : existingRaw.constructionYear !== null &&
                  cDateText === undefined &&
                  constructionLabel === undefined
                ? existingRaw.constructionYear
                : undefined,
          startMonth:
            constructionMonth !== undefined
              ? constructionMonth
              : existingRaw.constructionMonth !== null &&
                  cDateText === undefined &&
                  constructionLabel === undefined
                ? existingRaw.constructionMonth
                : undefined,
          startDay:
            constructionDay !== undefined
              ? constructionDay
              : existingRaw.constructionDay !== null &&
                  cDateText === undefined &&
                  constructionLabel === undefined
                ? existingRaw.constructionDay
                : undefined,
          endYear:
            constructionEndYear !== undefined
              ? constructionEndYear
              : existingRaw.constructionEndYear !== null &&
                  cDateText === undefined &&
                  constructionLabel === undefined
                ? existingRaw.constructionEndYear
                : undefined,
          datePrecision: eDatePrecision,
        })
      : null;

    this.validateYearRange(
      resolvedConstructionDate
        ? resolvedConstructionDate.startYear
        : existingRaw.constructionYear,
      resolvedConstructionDate
        ? resolvedConstructionDate.endYear
        : existingRaw.constructionEndYear,
    );

    if (dto.periodId) {
      await this.ensurePeriodExists(dto.periodId);
    }

    // Vai trò nhân vật theo danh mục FIGURE_ROLE (mã / nhãn / alias → mã chuẩn).
    const roles =
      rawRoles === undefined
        ? undefined
        : await this.taxonomy.requireTermCodes(
            TAXONOMY_GROUPS.FIGURE_ROLE,
            rawRoles,
          );

    const hasPersonUpdates =
      hasBirthDateUpdates ||
      hasDeathDateUpdates ||
      occupation !== undefined ||
      titles !== undefined ||
      roles !== undefined ||
      biography !== undefined;

    const hasSiteUpdates =
      siteType !== undefined ||
      address !== undefined ||
      latitude !== undefined ||
      longitude !== undefined ||
      hasConstructionDateUpdates ||
      preservationStatus !== undefined ||
      recognitionLevel !== undefined ||
      managingAgency !== undefined ||
      statusNote !== undefined;

    let updatedMetadata: any = undefined;
    if (baseDto.metadata !== undefined || dto.periodIds !== undefined) {
      const currentMeta =
        existingRaw.metadata && typeof existingRaw.metadata === 'object'
          ? existingRaw.metadata
          : {};
      const newMeta =
        baseDto.metadata !== undefined ? baseDto.metadata : currentMeta;
      const combined = { ...newMeta };
      if (dto.periodIds !== undefined) {
        combined.periodIds = dto.periodIds;
      }
      updatedMetadata =
        Object.keys(combined).length > 0
          ? (combined as Prisma.InputJsonValue)
          : Prisma.JsonNull;
    }

    const { periodIds: _discardPeriodIds, ...cleanedBaseDto } = baseDto as any;

    const updated = await this.prisma.historicalEntity.update({
      where: { id },
      data: {
        ...cleanedBaseDto,
        name: baseDto.name ? baseDto.name.trim() : undefined,
        tagline:
          baseDto.tagline !== undefined ? baseDto.tagline?.trim() : undefined,
        description:
          baseDto.description !== undefined
            ? baseDto.description?.trim()
            : undefined,
        imageCaption:
          baseDto.imageCaption !== undefined
            ? baseDto.imageCaption?.trim()
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
        ...(hasPersonUpdates
          ? {
              person: {
                upsert: {
                  create: {
                    birthDateText: resolvedBirthDate?.dateText,
                    birthYear: resolvedBirthDate?.year,
                    birthMonth: resolvedBirthDate?.month,
                    birthDay: resolvedBirthDate?.day,
                    birthPrecision: resolvedBirthDate?.precision,
                    deathDateText: resolvedDeathDate?.dateText,
                    deathYear: resolvedDeathDate?.year,
                    deathMonth: resolvedDeathDate?.month,
                    deathDay: resolvedDeathDate?.day,
                    deathPrecision: resolvedDeathDate?.precision,
                    birthDateLabel:
                      bLabel?.trim() ?? resolvedBirthDate?.dateText,
                    deathDateLabel:
                      dLabel?.trim() ?? resolvedDeathDate?.dateText,
                    occupation: occupation?.trim(),
                    titles: titles ?? [],
                    roles: roles ?? [],
                    biography: biography?.trim(),
                  },
                  update: {
                    ...(resolvedBirthDate
                      ? {
                          birthDateText: resolvedBirthDate.dateText,
                          birthYear: resolvedBirthDate.year,
                          birthMonth: resolvedBirthDate.month,
                          birthDay: resolvedBirthDate.day,
                          birthPrecision: resolvedBirthDate.precision,
                          birthDateLabel:
                            bLabel !== undefined
                              ? bLabel?.trim()
                              : resolvedBirthDate.dateText,
                        }
                      : {}),
                    ...(resolvedDeathDate
                      ? {
                          deathDateText: resolvedDeathDate.dateText,
                          deathYear: resolvedDeathDate.year,
                          deathMonth: resolvedDeathDate.month,
                          deathDay: resolvedDeathDate.day,
                          deathPrecision: resolvedDeathDate.precision,
                          deathDateLabel:
                            dLabel !== undefined
                              ? dLabel?.trim()
                              : resolvedDeathDate.dateText,
                        }
                      : {}),
                    ...(occupation !== undefined
                      ? { occupation: occupation?.trim() }
                      : {}),
                    ...(titles !== undefined ? { titles } : {}),
                    ...(roles !== undefined ? { roles } : {}),
                    ...(biography !== undefined
                      ? { biography: biography?.trim() }
                      : {}),
                  },
                },
              },
            }
          : {}),
        ...(hasSiteUpdates
          ? {
              historicalSite: {
                upsert: {
                  create: {
                    siteType: siteType?.trim() || 'HISTORICAL_SITE',
                    address: address?.trim(),
                    latitude:
                      latitude !== undefined && latitude !== null
                        ? new Prisma.Decimal(latitude)
                        : undefined,
                    longitude:
                      longitude !== undefined && longitude !== null
                        ? new Prisma.Decimal(longitude)
                        : undefined,
                    constructionDateText: resolvedConstructionDate?.dateText,
                    constructionYear: resolvedConstructionDate?.startYear,
                    constructionMonth: resolvedConstructionDate?.startMonth,
                    constructionDay: resolvedConstructionDate?.startDay,
                    constructionEndYear: resolvedConstructionDate?.endYear,
                    datePrecision: resolvedConstructionDate?.datePrecision,
                    constructionLabel:
                      constructionLabel?.trim() ??
                      resolvedConstructionDate?.dateText,
                    preservationStatus: preservationStatus?.trim(),
                    recognitionLevel: recognitionLevel?.trim(),
                    managingAgency: managingAgency?.trim(),
                    statusNote: statusNote?.trim() || null,
                  },
                  update: {
                    ...(siteType !== undefined
                      ? { siteType: siteType.trim() }
                      : {}),
                    ...(address !== undefined
                      ? { address: address?.trim() }
                      : {}),
                    ...(latitude !== undefined
                      ? {
                          latitude:
                            latitude !== null
                              ? new Prisma.Decimal(latitude)
                              : null,
                        }
                      : {}),
                    ...(longitude !== undefined
                      ? {
                          longitude:
                            longitude !== null
                              ? new Prisma.Decimal(longitude)
                              : null,
                        }
                      : {}),
                    ...(resolvedConstructionDate
                      ? {
                          constructionDateText:
                            resolvedConstructionDate.dateText,
                          constructionYear: resolvedConstructionDate.startYear,
                          constructionMonth:
                            resolvedConstructionDate.startMonth,
                          constructionDay: resolvedConstructionDate.startDay,
                          constructionEndYear: resolvedConstructionDate.endYear,
                          datePrecision: resolvedConstructionDate.datePrecision,
                          constructionLabel:
                            constructionLabel !== undefined
                              ? constructionLabel?.trim()
                              : resolvedConstructionDate.dateText,
                        }
                      : {}),
                    ...(preservationStatus !== undefined
                      ? { preservationStatus: preservationStatus?.trim() }
                      : {}),
                    ...(recognitionLevel !== undefined
                      ? { recognitionLevel: recognitionLevel?.trim() }
                      : {}),
                    ...(managingAgency !== undefined
                      ? { managingAgency: managingAgency?.trim() }
                      : {}),
                    ...(statusNote !== undefined
                      ? { statusNote: statusNote?.trim() || null }
                      : {}),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        person: true,
        historicalSite: true,
      },
    });

    if (hasSiteUpdates) await this.taxonomy.syncSiteTerms(id);
    await this.invalidateCache(id);
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);
    await this.prisma.historicalEntity.delete({ where: { id } });
    await this.invalidateCache(id);
    return {
      success: true,
      message: HISTORICAL_ENTITY_MESSAGES.DELETED,
    };
  }

  // ==========================================
  // Quan Hệ Hồi Quy N-N (Knowledge Graph Edge)
  // ==========================================
  async addRelation(
    sourceEntityId: string,
    dto: CreateEntityRelationDto,
  ): Promise<HistoricalEntityRelation> {
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

    const relation = await this.prisma.historicalEntityRelation.create({
      data: {
        sourceEntityId,
        targetEntityId: dto.targetEntityId,
        relationType: await this.taxonomy.requireTermCode(
          TAXONOMY_GROUPS.ENTITY_RELATION,
          dto.relationType,
        ),
        startYear: dto.startYear,
        endYear: dto.endYear,
        note: dto.note?.trim(),
      },
    });

    await this.invalidateCache(sourceEntityId);
    await this.invalidateCache(dto.targetEntityId);
    return relation;
  }

  async removeRelation(
    relationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const relation = await this.prisma.historicalEntityRelation.findUnique({
      where: { id: relationId },
    });
    if (!relation) {
      throw new NotFoundException(
        HISTORICAL_ENTITY_ERRORS.RELATION_NOT_FOUND(relationId),
      );
    }

    await this.prisma.historicalEntityRelation.delete({
      where: { id: relationId },
    });

    await this.invalidateCache(relation.sourceEntityId);
    await this.invalidateCache(relation.targetEntityId);
    return {
      success: true,
      message: HISTORICAL_ENTITY_MESSAGES.RELATION_DELETED,
    };
  }

  async getEntityGraph(id: string): Promise<IEntityGraphData> {
    const cacheKey = `${HISTORICAL_ENTITY_CACHE.GRAPH_PREFIX}:${id}`;
    const cached = await this.redis.get<IEntityGraphData>(cacheKey);
    if (cached) return cached;

    const entity = await this.findOne(id);
    const [outgoing, incoming] = await Promise.all([
      this.prisma.historicalEntityRelation.findMany({
        where: { sourceEntityId: id },
        include: { targetEntity: { include: { person: true } } },
      }),
      this.prisma.historicalEntityRelation.findMany({
        where: { targetEntityId: id },
        include: { sourceEntity: { include: { person: true } } },
      }),
    ]);

    const nodeMap = new Map<string, any>();
    const rawEntity = entity as any;
    nodeMap.set(entity.id, {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      imageUrl: entity.imageUrl,
      birthYear: rawEntity.birthYear ?? null,
      deathYear: rawEntity.deathYear ?? null,
    });

    const edges: any[] = [];

    for (const rel of outgoing) {
      if (!nodeMap.has(rel.targetEntityId)) {
        nodeMap.set(rel.targetEntityId, {
          id: rel.targetEntity.id,
          name: rel.targetEntity.name,
          type: rel.targetEntity.type,
          imageUrl: rel.targetEntity.imageUrl,
          birthYear: (rel.targetEntity as any).person?.birthYear ?? null,
          deathYear: (rel.targetEntity as any).person?.deathYear ?? null,
        });
      }
      edges.push({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        relationType: rel.relationType,
        startYear: rel.startYear,
        endYear: rel.endYear,
        note: rel.note,
      });
    }

    for (const rel of incoming) {
      if (!nodeMap.has(rel.sourceEntityId)) {
        nodeMap.set(rel.sourceEntityId, {
          id: rel.sourceEntity.id,
          name: rel.sourceEntity.name,
          type: rel.sourceEntity.type,
          imageUrl: rel.sourceEntity.imageUrl,
          birthYear: (rel.sourceEntity as any).person?.birthYear ?? null,
          deathYear: (rel.sourceEntity as any).person?.deathYear ?? null,
        });
      }
      edges.push({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        relationType: rel.relationType,
        startYear: rel.startYear,
        endYear: rel.endYear,
        note: rel.note,
      });
    }

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

  // ==========================================
  // Tư Liệu Đa Phương Tiện (Media / Document)
  // ==========================================
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

  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`${HISTORICAL_ENTITY_CACHE.DETAIL_PREFIX}:${id}`);
        await this.redis.del(`${HISTORICAL_ENTITY_CACHE.GRAPH_PREFIX}:${id}`);
      }
      await this.redis.deleteByPattern(
        `${HISTORICAL_ENTITY_CACHE.LIST_PREFIX}:*`,
      );
      await this.redis.deleteByPattern(
        `${HISTORICAL_ENTITY_CACHE.GRAPH_PREFIX}:*`,
      );
      await this.redis.del(PUBLIC_LANDING_CACHE_KEY);
    } catch (err) {
      this.logger.warn(
        `Failed to clear historical entity cache: ${(err as Error).message}`,
        'HistoricalEntityService',
      );
    }
  }
}
