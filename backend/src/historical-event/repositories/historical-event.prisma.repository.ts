import { Injectable } from '@nestjs/common';
import { ContentStatus, EventCategory, MediaType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { IHistoricalEventRepository } from './historical-event.repository.interface';
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
      entities: {
        include: {
          entity: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
      },
      media: {
        orderBy: { displayOrder: 'asc' as const },
      },
    };
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

    return this.prisma.historicalEvent.create({
      data: {
        ...prismaCreateData,
        ...(relationRecords.length > 0
          ? {
              entities: {
                create: relationRecords.map((r, idx) => ({
                  entityId: r.entityId,
                  role: r.role || 'PARTICIPANT',
                  roleLabel: (r as any).roleLabel || null,
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
    }) as unknown as HistoricalEventEntityModel;
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

    return this.prisma.historicalEvent.update({
      where: { id },
      data: {
        ...prismaUpdateData,
        ...(shouldSyncEntities
          ? {
              entities: {
                deleteMany: {},
                create: relationRecords.map((r, idx) => ({
                  entityId: r.entityId,
                  role: r.role || 'PARTICIPANT',
                  roleLabel: (r as any).roleLabel || null,
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
    }) as unknown as HistoricalEventEntityModel;
  }

  async findById(id: string): Promise<HistoricalEventEntityModel | null> {
    const item = await this.prisma.historicalEvent.findUnique({
      where: { id },
      include: {
        ...this.standardIncludes,
        outgoingRelations: {
          include: {
            targetEvent: {
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
        },
        incomingRelations: {
          include: {
            sourceEvent: {
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
        },
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
      },
    });

    return item as unknown as HistoricalEventEntityModel | null;
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

    return { items: items as unknown as HistoricalEventEntityModel[], total };
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

  async addRelation(data: {
    sourceEventId: string;
    targetEventId: string;
    relationType: any;
    description?: string;
    status?: any;
    sourceReference?: string;
  }): Promise<any> {
    return this.prisma.historicalEventRelation.create({
      data: {
        sourceEventId: data.sourceEventId,
        targetEventId: data.targetEventId,
        relationType: data.relationType,
        description: data.description?.trim(),
        status: data.status,
        sourceReference: data.sourceReference?.trim(),
      },
      include: {
        sourceEvent: {
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
        targetEvent: {
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
  }

  async removeRelation(relationId: string): Promise<any> {
    return this.prisma.historicalEventRelation.delete({
      where: { id: relationId },
    });
  }

  async findRelationById(relationId: string): Promise<any | null> {
    return this.prisma.historicalEventRelation.findUnique({
      where: { id: relationId },
      include: {
        sourceEvent: {
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
        targetEvent: {
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
  }

  async findRelationsByEventId(eventId: string): Promise<{
    outgoing: any[];
    incoming: any[];
  }> {
    const [outgoing, incoming] = await Promise.all([
      this.prisma.historicalEventRelation.findMany({
        where: { sourceEventId: eventId },
        include: {
          targetEvent: {
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
      }),
      this.prisma.historicalEventRelation.findMany({
        where: { targetEventId: eventId },
        include: {
          sourceEvent: {
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
      }),
    ]);

    return { outgoing, incoming };
  }
}

