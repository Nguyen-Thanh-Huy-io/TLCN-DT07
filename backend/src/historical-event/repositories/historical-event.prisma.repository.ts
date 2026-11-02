import { Injectable } from '@nestjs/common';
import { ContentStatus, EventCategory, MediaType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { IHistoricalEventRepository } from './historical-event.repository.interface';
import { StatementRelationAdapter } from '../../common/adapters/statement-relation.adapter';
import { HistoricalEventListQuery } from '../dto/query-historical-event.dto';
import {
  CreateHistoricalEventDomainModel,
  HistoricalEventEntityModel,
  UpdateHistoricalEventDomainModel,
} from '../models/historical-event.domain-model';

@Injectable()
export class HistoricalEventPrismaRepository implements IHistoricalEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get standardIncludes() {
    return {
      period: {
        select: { id: true, name: true, startYear: true, endYear: true },
      },
      parent: {
        select: {
          id: true,
          title: true,
          slug: true,
          startYear: true,
        },
      },
      _count: {
        select: { children: true },
      },
      location: {
        include: {
          historicalSite: true,
        },
      },
      participants: {
        include: {
          entity: {
            select: { id: true, name: true, slug: true, type: true },
          },
          roleTerm: true,
        },
        orderBy: [{ isPrimary: 'desc' as const }, { displayOrder: 'asc' as const }],
      },
      media: {
        orderBy: { displayOrder: 'asc' as const },
      },
    };
  }

  /**
   * Chiếu `HistoricalEventParticipant[]` (bảng chuẩn hoá) về đúng shape `entities[]` cũ
   * (`HistoricalEventEntity`) mà mapper/frontend đang đọc — tránh phải sửa toàn bộ phía
   * đọc chỉ vì đổi bảng lưu trữ bên dưới.
   */
  private static mapParticipantsToLegacyEntities(participants: any[]): any[] {
    return (participants || []).map((p) => ({
      eventId: p.eventId,
      entityId: p.entityId,
      role: p.roleTerm?.code || 'PARTICIPANT',
      roleId: p.roleTermId,
      roleLabel: p.roleLabelOverride || p.roleTerm?.label || null,
      isPrimary: p.isPrimary,
      displayOrder: p.displayOrder,
      notes: p.notes,
      createdAt: p.createdAt,
      entity: p.entity,
    }));
  }

  async create(data: CreateHistoricalEventDomainModel): Promise<HistoricalEventEntityModel> {
    const { entities, media, category, status, topicId, ...rest } = data;
    const relationRecords = entities && entities.length > 0 ? entities : [];
    const mediaRecords = media && media.length > 0 ? media : [];

    const prismaCreateData: Prisma.HistoricalEventUncheckedCreateInput = {
      ...rest,
      category: category ? (category as EventCategory) : EventCategory.OTHER,
      status: status ? (status as ContentStatus) : ContentStatus.PUBLISHED,
      metadata: rest.metadata ? (rest.metadata as Prisma.InputJsonValue) : undefined,
    };

    const created = await this.prisma.historicalEvent.create({
      data: {
        ...prismaCreateData,
        ...(relationRecords.length > 0
          ? {
              participants: {
                create: relationRecords.map((r, idx) => ({
                  entityId: r.entityId,
                  roleTermId: (r as any).roleTermId || null,
                  roleLabelOverride: (r as any).roleLabel || null,
                  isPrimary: Boolean((r as any).isPrimary),
                  displayOrder: (r as any).displayOrder ?? idx,
                  notes: (r as any).notes || null,
                })),
              },
            }
          : {}),
        ...(mediaRecords.length > 0
          ? {
              media: {
                create: mediaRecords.map((m, idx) => ({
                  type: m.type ? (m.type as MediaType) : MediaType.IMAGE,
                  url: m.url,
                  caption: m.caption || null,
                  displayOrder: m.displayOrder ?? idx + 1,
                })),
              },
            }
          : {}),
      },
      include: this.standardIncludes,
    });
    return {
      ...created,
      entities: HistoricalEventPrismaRepository.mapParticipantsToLegacyEntities(
        (created as any).participants,
      ),
    } as unknown as HistoricalEventEntityModel;
  }

  async update(
    id: string,
    data: UpdateHistoricalEventDomainModel,
  ): Promise<HistoricalEventEntityModel> {
    const { entities, media, category, status, metadata, topicId, ...rest } = data;
    const shouldSyncEntities = entities !== undefined;
    const relationRecords = entities && entities.length > 0 ? entities : [];
    const shouldSyncMedia = media !== undefined;
    const mediaRecords = media && media.length > 0 ? media : [];

    const prismaUpdateData: Prisma.HistoricalEventUncheckedUpdateInput = {
      ...rest,
      ...(category !== undefined ? { category: category as EventCategory } : {}),
      ...(status !== undefined ? { status: status as ContentStatus } : {}),
      ...(metadata !== undefined
        ? { metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull }
        : {}),
    };

    const updated = await this.prisma.historicalEvent.update({
      where: { id },
      data: {
        ...prismaUpdateData,
        ...(shouldSyncEntities
          ? {
              participants: {
                deleteMany: {},
                create: relationRecords.map((r, idx) => ({
                  entityId: r.entityId,
                  roleTermId: (r as any).roleTermId || null,
                  roleLabelOverride: (r as any).roleLabel || null,
                  isPrimary: Boolean((r as any).isPrimary),
                  displayOrder: (r as any).displayOrder ?? idx,
                  notes: (r as any).notes || null,
                })),
              },
            }
          : {}),
        ...(shouldSyncMedia
          ? {
              media: {
                deleteMany: {},
                create: mediaRecords.map((m, idx) => ({
                  type: m.type ? (m.type as MediaType) : MediaType.IMAGE,
                  url: m.url,
                  caption: m.caption || null,
                  displayOrder: m.displayOrder ?? idx + 1,
                })),
              },
            }
          : {}),
      },
      include: this.standardIncludes,
    });
    return {
      ...updated,
      entities: HistoricalEventPrismaRepository.mapParticipantsToLegacyEntities(
        (updated as any).participants,
      ),
    } as unknown as HistoricalEventEntityModel;
  }

  async findById(id: string): Promise<HistoricalEventEntityModel | null> {
    const item = await this.prisma.historicalEvent.findUnique({
      where: { id },
      include: {
        ...this.standardIncludes,
        children: {
          select: {
            id: true,
            title: true,
            slug: true,
            startYear: true,
            status: true,
          },
          orderBy: [
            { startYear: 'asc' },
            { startMonth: 'asc' },
            { startDay: 'asc' },
            { displayOrder: 'asc' },
          ],
        },
        subjectStatements: {
          include: {
            predicate: true,
            objectEntity: {
              select: { id: true, name: true, slug: true, type: true },
            },
            objectEvent: {
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
            references: {
              include: {
                reference: true,
              },
            },
          },
        },
        objectStatements: {
          include: {
            predicate: true,
            subjectEntity: {
              select: { id: true, name: true, slug: true, type: true },
            },
            subjectEvent: {
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
            references: {
              include: {
                reference: true,
              },
            },
          },
        },
        participants: {
          include: {
            entity: {
              select: { id: true, name: true, slug: true, type: true, imageUrl: true },
            },
            roleTerm: true,
            references: {
              include: {
                reference: true,
              },
            },
          },
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
        },
      },
    });

    const adapted = StatementRelationAdapter.adaptEvent(item);
    return adapted as unknown as HistoricalEventEntityModel | null;
  }

  async findMany(
    query: HistoricalEventListQuery,
  ): Promise<{ items: HistoricalEventEntityModel[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.HistoricalEventWhereInput = {};
    const andConditions: Prisma.HistoricalEventWhereInput[] = [];

    if (query.periodId) {
      where.periodId = query.periodId;
    }

    const siteFilterId = query.siteId || query.locationId;
    if (siteFilterId) {
      where.locationId = siteFilterId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryTermIds) {
      // Mã loại không tồn tại → mảng rỗng → không khớp sự kiện nào.
      where.categoryIds = { hasSome: query.categoryTermIds };
    }

    if (query.startYear !== undefined && query.startYear !== null) {
      where.startYear = query.startYear;
    }

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { summary: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    } else if (
      query.topLevelOnly === true ||
      query.topLevelOnly === 'true'
    ) {
      where.parentId = null;
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, items] = await Promise.all([
      this.prisma.historicalEvent.count({ where }),
      this.prisma.historicalEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { startYear: 'asc' },
          { startMonth: 'asc' },
          { startDay: 'asc' },
          { displayOrder: 'asc' },
        ],
        include: this.standardIncludes,
      }),
    ]);

    const mappedItems = items.map((item) => ({
      ...item,
      entities: HistoricalEventPrismaRepository.mapParticipantsToLegacyEntities(
        (item as any).participants,
      ),
    }));
    return { items: mappedItems as unknown as HistoricalEventEntityModel[], total };
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.historicalEvent.count({
      where: { slug },
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
    const [periodCount, locationCount, parentCount] =
      await Promise.all([
        dto.periodId
          ? this.prisma.period.count({ where: { id: dto.periodId } })
          : Promise.resolve(1),
        checkSiteId
          ? this.prisma.historicalEntity.count({
              where: { id: checkSiteId },
            })
          : Promise.resolve(1),
        dto.parentId
          ? this.prisma.historicalEvent.count({
              where: { id: dto.parentId },
            })
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
    const deleted = await this.prisma.historicalEvent.delete({
      where: { id },
    });
    return deleted as unknown as HistoricalEventEntityModel;
  }

  private static readonly RELATION_EVENT_SELECT = {
    id: true,
    title: true,
    slug: true,
    startYear: true,
    endYear: true,
    category: true,
    thumbnailUrl: true,
  } as const;

  /** Chiếu 1 HistoricalStatement Event↔Event về shape `relation` cũ (HistoricalEventRelation). */
  private static mapStatementToLegacyEventRelation(stmt: any): any {
    return {
      id: stmt.id,
      sourceEventId: stmt.subjectEventId,
      targetEventId: stmt.objectEventId,
      relationType: stmt.predicate?.code ?? null,
      description: (stmt.qualifiers as any)?.description ?? null,
      status: stmt.verificationStatus,
      sourceReference: (stmt.qualifiers as any)?.sourceReference ?? null,
      sourceEvent: stmt.subjectEvent,
      targetEvent: stmt.objectEvent,
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
        subjectEventId: data.sourceEventId,
        predicateId: term.id,
        objectEventId: data.targetEventId,
        qualifiers: data.description
          ? { description: data.description, sourceReference: data.sourceReference }
          : undefined,
        verificationStatus: data.status || 'VERIFIED',
      },
      include: {
        predicate: true,
        subjectEvent: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        objectEvent: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
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
        subjectEvent: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        objectEvent: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
      },
    });
    if (!statement || !statement.subjectEventId || !statement.objectEventId) return null;
    return HistoricalEventPrismaRepository.mapStatementToLegacyEventRelation(statement);
  }

  async findRelationsByEventId(eventId: string): Promise<{
    outgoing: any[];
    incoming: any[];
  }> {
    const [outgoingStatements, incomingStatements] = await Promise.all([
      this.prisma.historicalStatement.findMany({
        where: { subjectEventId: eventId, objectEventId: { not: null } },
        include: {
          predicate: true,
          objectEvent: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
        },
      }),
      this.prisma.historicalStatement.findMany({
        where: { objectEventId: eventId, subjectEventId: { not: null } },
        include: {
          predicate: true,
          subjectEvent: { select: HistoricalEventPrismaRepository.RELATION_EVENT_SELECT },
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

