import { Prisma } from '@prisma/client';
import { QueryHistoricalEntityDto } from '../dto/historical-entity.dto';
import { StatementRelationAdapter } from '../../common/adapters/statement-relation.adapter';

export class EntityQueryBuilder {
  /**
   * Xây dựng mệnh đề WHERE cho Prisma query
   */
  static buildWhere(query: QueryHistoricalEntityDto): Prisma.HistoricalEntityWhereInput {
    const where: Prisma.HistoricalEntityWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.periodId) {
      where.periodId = query.periodId;
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { tagline: { contains: keyword, mode: 'insensitive' } },
        { aliases: { has: keyword } },
      ];
    }

    return where;
  }

  /**
   * Thứ tự sắp xếp mặc định
   */
  static buildOrderBy(): Prisma.HistoricalEntityOrderByWithRelationInput[] {
    return [{ displayOrder: 'asc' }, { updatedAt: 'desc' }];
  }

  /**
   * Ánh xạ danh sách entity cho findAll (trải phẳng các trường Person & Site)
   */
  static mapListItem(item: any): any {
    return {
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
    };
  }

  /**
   * Ánh xạ chi tiết thực thể cho findOne
   */
  static mapDetailItem(rawInput: any): any {
    const raw = StatementRelationAdapter.adaptEntity(rawInput);

    const metadataPeriodIds =
      raw.metadata &&
      typeof raw.metadata === 'object' &&
      Array.isArray(raw.metadata.periodIds)
        ? raw.metadata.periodIds
        : raw.periodId
          ? [raw.periodId]
          : [];

    return {
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
    };
  }

  /**
   * Cấu hình Prisma include cho chi tiết findOne
   */
  static getDetailInclude(): Prisma.HistoricalEntityInclude {
    return {
      person: true,
      historicalSite: {
        include: { siteTypeTerm: true, preservation: true, rank: true },
      },
      media: {
        orderBy: { displayOrder: 'asc' },
      },
      event: true,
      subjectStatements: {
        include: {
          predicate: true,
          object: {
            include: {
              person: true,
              event: true,
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
          subject: {
            include: {
              person: true,
              event: true,
            },
          },
          references: {
            include: {
              reference: true,
            },
          },
        },
      },
    };
  }
}
