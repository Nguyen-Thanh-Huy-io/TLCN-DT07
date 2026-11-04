import { Injectable } from '@nestjs/common';
import { HistoricalEntityType, Prisma } from '@prisma/client';
import { TaxonomyService } from '../../taxonomy/taxonomy.service';
import {
  CreateHistoricalEntityDto,
  UpdateHistoricalEntityDto,
} from '../dto/historical-entity.dto';
import {
  HistoricalDateParser,
  validateHistoricalYearRange,
} from '../../common/utils/historical-date.parser';
import { HISTORICAL_ENTITY_ERRORS } from '../historical-entity.constant';

@Injectable()
export class SiteEntityDelegate {
  constructor(private readonly taxonomy: TaxonomyService) {}

  /**
   * Kiểm tra xem DTO tạo mới có cấu hình Di tích không
   */
  shouldCreateSite(dto: CreateHistoricalEntityDto, entityType: HistoricalEntityType): boolean {
    return Boolean(dto.siteType) || entityType === HistoricalEntityType.LOCATION;
  }

  /**
   * Chuẩn hóa và tạo payload cho HistoricalSite khi khởi tạo
   */
  buildCreatePayload(
    dto: CreateHistoricalEntityDto,
  ): Prisma.HistoricalSiteCreateWithoutEntityInput {
    const resolvedConstructionDate = HistoricalDateParser.resolveRangeFields({
      dateText: dto.constructionDateText,
      legacyLabel: dto.constructionLabel,
      startYear: dto.constructionYear,
      startMonth: dto.constructionMonth,
      startDay: dto.constructionDay,
      endYear: dto.constructionEndYear,
      datePrecision: dto.datePrecision,
    });

    validateHistoricalYearRange(
      resolvedConstructionDate.startYear,
      resolvedConstructionDate.endYear,
      HISTORICAL_ENTITY_ERRORS.INVALID_YEAR_RANGE,
    );

    return {
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
        dto.constructionLabel?.trim() ?? resolvedConstructionDate.dateText,
      preservationStatus: dto.preservationStatus?.trim(),
      recognitionLevel: dto.recognitionLevel?.trim(),
      managingAgency: dto.managingAgency?.trim(),
      statusNote: dto.statusNote?.trim() || null,
    };
  }

  /**
   * Chuẩn hóa và tạo payload upsert cho HistoricalSite khi cập nhật
   */
  buildUpsertPayload(
    dto: UpdateHistoricalEntityDto,
    existingRaw: any,
  ): {
    hasSiteUpdates: boolean;
    payload?: Prisma.HistoricalSiteUpdateOneWithoutEntityNestedInput;
  } {
    const {
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
    } = dto;

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
          datePrecision: dto.datePrecision,
        })
      : null;

    validateHistoricalYearRange(
      resolvedConstructionDate
        ? resolvedConstructionDate.startYear
        : existingRaw.constructionYear,
      resolvedConstructionDate
        ? resolvedConstructionDate.endYear
        : existingRaw.constructionEndYear,
      HISTORICAL_ENTITY_ERRORS.INVALID_YEAR_RANGE,
    );

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

    if (!hasSiteUpdates) {
      return { hasSiteUpdates: false };
    }

    const payload: Prisma.HistoricalSiteUpdateOneWithoutEntityNestedInput = {
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
            constructionLabel?.trim() ?? resolvedConstructionDate?.dateText,
          preservationStatus: preservationStatus?.trim(),
          recognitionLevel: recognitionLevel?.trim(),
          managingAgency: managingAgency?.trim(),
          statusNote: statusNote?.trim() || null,
        },
        update: {
          ...(siteType !== undefined ? { siteType: siteType.trim() } : {}),
          ...(address !== undefined ? { address: address?.trim() } : {}),
          ...(latitude !== undefined
            ? {
                latitude:
                  latitude !== null ? new Prisma.Decimal(latitude) : null,
              }
            : {}),
          ...(longitude !== undefined
            ? {
                longitude:
                  longitude !== null ? new Prisma.Decimal(longitude) : null,
              }
            : {}),
          ...(resolvedConstructionDate
            ? {
                constructionDateText: resolvedConstructionDate.dateText,
                constructionYear: resolvedConstructionDate.startYear,
                constructionMonth: resolvedConstructionDate.startMonth,
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
    };

    return { hasSiteUpdates: true, payload };
  }

  /**
   * Đồng bộ danh mục cho Di tích
   */
  async syncSiteTerms(entityId: string): Promise<void> {
    await this.taxonomy.syncSiteTerms(entityId);
  }
}
