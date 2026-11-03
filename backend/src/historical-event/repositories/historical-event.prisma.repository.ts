import { Injectable } from '@nestjs/common';
import { ContentStatus, MediaType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { IHistoricalEventRepository } from './historical-event.repository.interface';
import { HistoricalEventListQuery } from '../dto/query-historical-event.dto';
import {
  CreateHistoricalEventDomainModel,
  HistoricalEventEntityModel,
  UpdateHistoricalEventDomainModel,
} from '../models/historical-event.domain-model';

/**
 * Event giờ là 1 HistoricalEntity (type=EVENT) + 1 dòng HistoricalEvent con (entity_id làm
 * khoá) — giống mẫu Person/HistoricalSite. Participants/location/quan hệ Event↔Event đều
 * đi qua HistoricalStatement (không còn HistoricalEventParticipant/HistoricalEventMedia
 * riêng — media dùng chung HistoricalEntityMedia).
 */
@Injectable()
export class HistoricalEventPrismaRepository implements IHistoricalEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get standardEntityInclude() {
    return {
      period: {
        select: { id: true, name: true, startYear: true, endYear: true },
      },
      event: {
        include: {
          parent: {
            include: {
              entity: {
                select: { id: true, name: true, slug: true, startYear: true },
              },
            },
          },
          children: {
            include: {
              entity: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  startYear: true,
                  status: true,
                },
              },
            },
          },
        },
      },
      media: { orderBy: { displayOrder: 'asc' as const } },
    };
  }

  /** Lấy TaxonomyTerm.id của 1 predicate trong nhóm PREDICATE theo code, lỗi nếu không có. */
  private async requirePredicateId(code: string): Promise<string> {
    const term = await this.prisma.taxonomyTerm.findFirst({
      where: { groupCode: 'PREDICATE', code },
    });
    if (!term) {
      throw new Error(`Không tìm thấy TaxonomyTerm PREDICATE.${code}.`);
    }
    return term.id;
  }

  /** Chiếu 1 Entity (type=EVENT, kèm include) về đúng shape HistoricalEventEntityModel cũ. */
  private async toEventModel(entity: any): Promise<HistoricalEventEntityModel> {
    const eventRow = entity.event || {};

    const [participantStatements, locationStatement] = await Promise.all([
      this.prisma.historicalStatement.findMany({
        where: { objectId: entity.id, subject: { type: { not: 'EVENT' } } },
        include: {
          subject: {
            select: { id: true, name: true, slug: true, type: true, imageUrl: true },
          },
          predicate: true,
          references: { include: { reference: true } },
        },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
      }),
      this.prisma.historicalStatement.findFirst({
        where: { subjectId: entity.id, predicate: { code: 'OCCURRED_AT' } },
        include: {
          object: { include: { historicalSite: true } },
        },
      }),
    ]);

    const entities = participantStatements.map((stmt) => ({
      eventId: entity.id,
      entityId: stmt.subjectId,
      role: (stmt.qualifiers as any)?.role || stmt.predicate?.code || 'PARTICIPANT',
      roleLabel: (stmt.qualifiers as any)?.roleLabel || null,
      isPrimary: Boolean(stmt.isPrimary),
      displayOrder: stmt.displayOrder,
      notes: (stmt.qualifiers as any)?.notes || null,
      createdAt: stmt.createdAt,
      entity: stmt.subject,
      references: stmt.references || [],
    }));

    const locationEntity = locationStatement?.object || null;

    return {
      id: entity.id,
      title: entity.name,
      slug: entity.slug,
      dateText: entity.dateText,
      startYear: entity.startYear,
      startMonth: entity.startMonth,
      startDay: entity.startDay,
      endYear: entity.endYear,
      endMonth: entity.endMonth,
      endDay: entity.endDay,
      datePrecision: entity.datePrecision,
      eventDateNote: eventRow.eventDateNote,
      summary: entity.tagline,
      description: entity.description,
      thumbnailUrl: entity.imageUrl,
      displayOrder: entity.displayOrder,
      status: entity.status,
      category: (entity.metadata as any)?.category ?? 'OTHER',
      categoryIds: eventRow.categoryIds || [],
      metadata: entity.metadata,
      topicId: null,
      periodId: entity.periodId,
      siteId: locationEntity?.id ?? null,
      locationId: locationEntity?.id ?? null,
      parentId: eventRow.parentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      period: entity.period,
      location: locationEntity,
      historicalLocation: locationEntity
        ? {
            id: locationEntity.id,
            name: locationEntity.name,
            slug: locationEntity.slug || '',
            address: locationEntity.historicalSite?.address || null,
            type: locationEntity.historicalSite?.siteType || locationEntity.type,
          }
        : null,
      parent: eventRow.parent
        ? {
            id: eventRow.parent.entity.id,
            title: eventRow.parent.entity.name,
            slug: eventRow.parent.entity.slug,
            startYear: eventRow.parent.entity.startYear,
          }
        : null,
      children: (eventRow.children || []).map((c: any) => ({
        id: c.entity.id,
        title: c.entity.name,
        slug: c.entity.slug,
        startYear: c.entity.startYear,
        status: c.entity.status,
      })),
      entities,
      media: entity.media || [],
      _count: { children: (eventRow.children || []).length },
    };
  }

  async create(data: CreateHistoricalEventDomainModel): Promise<HistoricalEventEntityModel> {
    const { entities, media, category, categoryIds, locationId, parentId, ...rest } = data;

    const created = await this.prisma.historicalEntity.create({
      data: {
        type: 'EVENT',
        name: rest.title.trim(),
        slug: rest.slug,
        description: rest.description || null,
        tagline: rest.summary || null,
        imageUrl: rest.thumbnailUrl || null,
        periodId: rest.periodId || null,
        displayOrder: rest.displayOrder ?? 0,
        status: (rest.status as ContentStatus) ?? ContentStatus.PUBLISHED,
        dateText: rest.dateText,
        startYear: rest.startYear,
        startMonth: rest.startMonth,
        startDay: rest.startDay,
        endYear: rest.endYear,
        endMonth: rest.endMonth,
        endDay: rest.endDay,
        datePrecision: rest.datePrecision,
        metadata: {
          ...(rest.metadata || {}),
          ...(category ? { category } : {}),
        } as Prisma.InputJsonValue,
        event: {
          create: {
            parentId: parentId || null,
            categoryIds: categoryIds || [],
            eventDateNote: rest.eventDateNote ?? null,
          },
        },
        ...(media && media.length > 0
          ? {
              media: {
                create: media.map((m, idx) => ({
                  type: m.type ? (m.type as MediaType) : MediaType.IMAGE,
                  url: m.url,
                  caption: m.caption || null,
                  displayOrder: m.displayOrder ?? idx + 1,
                })),
              },
            }
          : {}),
      },
      include: this.standardEntityInclude,
    });

    if (entities && entities.length > 0) {
      await this.syncParticipants(created.id, entities);
    }
    if (locationId) {
      await this.syncLocation(created.id, locationId);
    }

    return this.toEventModel(created);
  }

  private async syncParticipants(
    eventEntityId: string,
    records: Array<{
      entityId: string;
      role?: string;
      roleLabel?: string | null;
      isPrimary?: boolean;
      displayOrder?: number;
      notes?: string | null;
    }>,
  ): Promise<void> {
    await this.prisma.historicalStatement.deleteMany({
      where: {
        objectId: eventEntityId,
        subject: { type: { not: 'EVENT' } },
      },
    });

    const participatedInId = await this.requirePredicateId('PARTICIPATED_IN');

    for (const [idx, r] of records.entries()) {
      const roleCode = r.role?.trim() || 'PARTICIPANT';
      const predicateId =
        (await this.prisma.taxonomyTerm
          .findFirst({ where: { groupCode: 'PREDICATE', code: roleCode } })
          .then((t) => t?.id)) || participatedInId;

      await this.prisma.historicalStatement.create({
        data: {
          subjectId: r.entityId,
          predicateId,
          objectId: eventEntityId,
          isPrimary: Boolean(r.isPrimary),
          displayOrder: r.displayOrder ?? idx,
          qualifiers: {
            role: roleCode,
            roleLabel: r.roleLabel || null,
            notes: r.notes || null,
          },
        },
      });
    }
  }

  private async syncLocation(eventEntityId: string, locationId: string | null): Promise<void> {
    await this.prisma.historicalStatement.deleteMany({
      where: { subjectId: eventEntityId, predicate: { code: 'OCCURRED_AT' } },
    });
    if (!locationId) return;

    const occurredAtId = await this.requirePredicateId('OCCURRED_AT');
    await this.prisma.historicalStatement.create({
      data: {
        subjectId: eventEntityId,
        predicateId: occurredAtId,
        objectId: locationId,
      },
    });
  }

  async update(
    id: string,
    data: UpdateHistoricalEventDomainModel,
  ): Promise<HistoricalEventEntityModel> {
    const { entities, media, category, categoryIds, locationId, parentId, ...rest } = data;

    const existing = await this.prisma.historicalEntity.findUnique({
      where: { id },
      select: { metadata: true },
    });
    const existingMetadata =
      existing?.metadata && typeof existing.metadata === 'object'
        ? (existing.metadata as Record<string, any>)
        : {};

    const updated = await this.prisma.historicalEntity.update({
      where: { id },
      data: {
        ...(rest.title !== undefined ? { name: rest.title.trim() } : {}),
        ...(rest.slug !== undefined ? { slug: rest.slug } : {}),
        ...(rest.description !== undefined ? { description: rest.description } : {}),
        ...(rest.summary !== undefined ? { tagline: rest.summary } : {}),
        ...(rest.thumbnailUrl !== undefined ? { imageUrl: rest.thumbnailUrl } : {}),
        ...(rest.periodId !== undefined ? { periodId: rest.periodId } : {}),
        ...(rest.displayOrder !== undefined ? { displayOrder: rest.displayOrder } : {}),
        ...(rest.status !== undefined ? { status: rest.status as ContentStatus } : {}),
        ...(rest.dateText !== undefined ? { dateText: rest.dateText } : {}),
        ...(rest.startYear !== undefined ? { startYear: rest.startYear } : {}),
        ...(rest.startMonth !== undefined ? { startMonth: rest.startMonth } : {}),
        ...(rest.startDay !== undefined ? { startDay: rest.startDay } : {}),
        ...(rest.endYear !== undefined ? { endYear: rest.endYear } : {}),
        ...(rest.endMonth !== undefined ? { endMonth: rest.endMonth } : {}),
        ...(rest.endDay !== undefined ? { endDay: rest.endDay } : {}),
        ...(rest.datePrecision !== undefined ? { datePrecision: rest.datePrecision } : {}),
        ...(rest.metadata !== undefined || category !== undefined
          ? {
              metadata: {
                ...existingMetadata,
                ...(rest.metadata || {}),
                ...(category !== undefined ? { category } : {}),
              } as Prisma.InputJsonValue,
            }
          : {}),
        event: {
          update: {
            ...(parentId !== undefined ? { parentId } : {}),
            ...(categoryIds !== undefined ? { categoryIds } : {}),
            ...(rest.eventDateNote !== undefined
              ? { eventDateNote: rest.eventDateNote }
              : {}),
          },
        },
        ...(media !== undefined
          ? {
              media: {
                deleteMany: {},
                create: media.map((m, idx) => ({
                  type: m.type ? (m.type as MediaType) : MediaType.IMAGE,
                  url: m.url,
                  caption: m.caption || null,
                  displayOrder: m.displayOrder ?? idx + 1,
                })),
              },
            }
          : {}),
      },
      include: this.standardEntityInclude,
    });

    if (entities !== undefined) {
      await this.syncParticipants(id, entities);
    }
    if (locationId !== undefined) {
      await this.syncLocation(id, locationId);
    }

    return this.toEventModel(updated);
  }

  async findById(id: string): Promise<HistoricalEventEntityModel | null> {
    const entity = await this.prisma.historicalEntity.findUnique({
      where: { id, type: 'EVENT' },
      include: this.standardEntityInclude,
    });
    if (!entity) return null;
    return this.toEventModel(entity);
  }

  async findMany(
    query: HistoricalEventListQuery,
  ): Promise<{ items: HistoricalEventEntityModel[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.HistoricalEntityWhereInput = { type: 'EVENT' };
    const andConditions: Prisma.HistoricalEntityWhereInput[] = [];
    const eventFilter: Prisma.HistoricalEventWhereInput = {};

    if (query.periodId) {
      where.periodId = query.periodId;
    }

    const siteFilterId = query.siteId || query.locationId;
    if (siteFilterId) {
      andConditions.push({
        subjectStatements: {
          some: { predicate: { code: 'OCCURRED_AT' }, objectId: siteFilterId },
        },
      });
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryTermIds) {
      eventFilter.categoryIds = { hasSome: query.categoryTermIds };
    }

    if (query.startYear !== undefined && query.startYear !== null) {
      where.startYear = query.startYear;
    }

    if (query.search) {
      andConditions.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { tagline: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.parentId) {
      eventFilter.parentId = query.parentId;
    } else if (query.topLevelOnly === true || query.topLevelOnly === 'true') {
      eventFilter.parentId = null;
    }

    if (Object.keys(eventFilter).length > 0) {
      where.event = eventFilter;
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, items] = await Promise.all([
      this.prisma.historicalEntity.count({ where }),
      this.prisma.historicalEntity.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { startYear: 'asc' },
          { startMonth: 'asc' },
          { startDay: 'asc' },
          { displayOrder: 'asc' },
        ],
        include: this.standardEntityInclude,
      }),
    ]);

    const mappedItems = await Promise.all(items.map((item) => this.toEventModel(item)));
    return { items: mappedItems, total };
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.historicalEntity.count({
      where: { slug, type: 'EVENT' },
    });
    return count > 0;
  }

  async countChildren(parentId: string): Promise<number> {
    return this.prisma.historicalEvent.count({
      where: { parentId },
    });
  }

  async checkReferences(dto: {
    topicId?: string;
    periodId?: string;
    siteId?: string;
    locationId?: string;
    parentId?: string;
  }): Promise<{
    topicExists: boolean;
    periodExists: boolean;
    locationExists: boolean;
    parentExists: boolean;
  }> {
    const checkSiteId = dto.siteId || dto.locationId;
    const [periodCount, locationCount, parentCount] = await Promise.all([
      dto.periodId
        ? this.prisma.period.count({ where: { id: dto.periodId } })
        : Promise.resolve(1),
      checkSiteId
        ? this.prisma.historicalEntity.count({ where: { id: checkSiteId } })
        : Promise.resolve(1),
      dto.parentId
        ? this.prisma.historicalEvent.count({ where: { entityId: dto.parentId } })
        : Promise.resolve(1),
    ]);

    return {
      topicExists: true,
      periodExists: periodCount > 0,
      locationExists: locationCount > 0,
      parentExists: parentCount > 0,
    };
  }

  async delete(id: string): Promise<HistoricalEventEntityModel> {
    const existing = await this.prisma.historicalEntity.findUnique({
      where: { id },
      include: this.standardEntityInclude,
    });
    const model = existing ? await this.toEventModel(existing) : (existing as any);
    await this.prisma.historicalEntity.delete({ where: { id } });
    return model;
  }

  private static readonly RELATION_EVENT_SELECT = {
    id: true,
    name: true,
    slug: true,
    startYear: true,
    endYear: true,
    imageUrl: true,
  } as const;

  /** Chiếu 1 HistoricalStatement Event↔Event về shape `relation` cũ (HistoricalEventRelation). */
  private static mapStatementToLegacyEventRelation(stmt: any): any {
    return {
      id: stmt.id,
      sourceEventId: stmt.subjectId,
      targetEventId: stmt.objectId,
      relationType: stmt.predicate?.code ?? null,
      description: (stmt.qualifiers as any)?.description ?? null,
      status: stmt.verificationStatus,
      sourceReference: (stmt.qualifiers as any)?.sourceReference ?? null,
      sourceEvent: stmt.subject
        ? { ...stmt.subject, title: stmt.subject.name, thumbnailUrl: stmt.subject.imageUrl }
        : null,
      targetEvent: stmt.object
        ? { ...stmt.object, title: stmt.object.name, thumbnailUrl: stmt.object.imageUrl }
        : null,
    };
  }

  async addRelation(data: {
    sourceEventId: string;
    targetEventId: string;
    relationType: any;
    description?: string;
    status?: any;
    sourceReference?: string;
  }): Promise<any> {
    const term = await this.prisma.taxonomyTerm.findFirst({
      where: { groupCode: 'EVENT_RELATION', code: data.relationType },
    });
    if (!term) {
      throw new Error(
        `Không tìm thấy TaxonomyTerm EVENT_RELATION.${data.relationType}.`,
      );
    }

    const statement = await this.prisma.historicalStatement.create({
      data: {
        subjectId: data.sourceEventId,
        predicateId: term.id,
        objectId: data.targetEventId,
        qualifiers: data.description
          ? { description: data.description, sourceReference: data.sourceReference }
          : undefined,
        verificationStatus: data.status || 'VERIFIED',
      },
      include: {
        predicate: true,
        subject: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        object: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
      },
    });

    return HistoricalEventPrismaRepository.mapStatementToLegacyEventRelation(statement);
  }

  async removeRelation(relationId: string): Promise<any> {
    return this.prisma.historicalStatement.delete({ where: { id: relationId } });
  }

  async findRelationById(relationId: string): Promise<any | null> {
    const statement = await this.prisma.historicalStatement.findUnique({
      where: { id: relationId },
      include: {
        predicate: true,
        subject: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        object: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
      },
    });
    if (!statement) return null;
    return HistoricalEventPrismaRepository.mapStatementToLegacyEventRelation(statement);
  }

  async findRelationsByEventId(eventId: string): Promise<{
    outgoing: any[];
    incoming: any[];
  }> {
    const [outgoingStatements, incomingStatements] = await Promise.all([
      this.prisma.historicalStatement.findMany({
        where: {
          subjectId: eventId,
          predicate: { groupCode: 'EVENT_RELATION' },
        },
        include: {
          predicate: true,
          object: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        },
      }),
      this.prisma.historicalStatement.findMany({
        where: {
          objectId: eventId,
          predicate: { groupCode: 'EVENT_RELATION' },
        },
        include: {
          predicate: true,
          subject: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        },
      }),
    ]);

    return {
      outgoing: outgoingStatements.map((s) =>
        HistoricalEventPrismaRepository.mapStatementToLegacyEventRelation(s),
      ),
      incoming: incomingStatements.map((s) =>
        HistoricalEventPrismaRepository.mapStatementToLegacyEventRelation(s),
      ),
    };
  }
}
