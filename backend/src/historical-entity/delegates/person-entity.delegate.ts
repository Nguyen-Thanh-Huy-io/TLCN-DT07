import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TaxonomyService } from '../../taxonomy/taxonomy.service';
import { TAXONOMY_GROUPS } from '../../taxonomy/taxonomy.constant';
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
export class PersonEntityDelegate {
  constructor(private readonly taxonomy: TaxonomyService) {}

  /**
   * Chuẩn hóa và tạo payload cho Person khi khởi tạo HistoricalEntity
   */
  async buildCreatePayload(
    dto: CreateHistoricalEntityDto,
  ): Promise<Prisma.PersonCreateWithoutEntityInput> {
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

    validateHistoricalYearRange(
      resolvedBirthDate.year,
      resolvedDeathDate.year,
      HISTORICAL_ENTITY_ERRORS.INVALID_YEAR_RANGE,
    );

    return {
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
      birthDateLabel: dto.birthDateLabel?.trim() ?? resolvedBirthDate.dateText,
      deathDateLabel: dto.deathDateLabel?.trim() ?? resolvedDeathDate.dateText,
      occupation: dto.occupation?.trim(),
      titles: dto.titles ?? [],
      roles: await this.taxonomy.requireTermCodes(
        TAXONOMY_GROUPS.FIGURE_ROLE,
        dto.roles ?? [],
      ),
      biography: dto.biography?.trim(),
    };
  }

  /**
   * Chuẩn hóa và tạo payload upsert cho Person khi cập nhật HistoricalEntity
   */
  async buildUpsertPayload(
    dto: UpdateHistoricalEntityDto,
    existingRaw: any,
  ): Promise<Prisma.PersonUpdateOneWithoutEntityNestedInput | undefined> {
    const {
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
    } = dto;

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

    validateHistoricalYearRange(
      resolvedBirthDate ? resolvedBirthDate.year : existingRaw.birthYear,
      resolvedDeathDate ? resolvedDeathDate.year : existingRaw.deathYear,
      HISTORICAL_ENTITY_ERRORS.INVALID_YEAR_RANGE,
    );

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

    if (!hasPersonUpdates) {
      return undefined;
    }

    return {
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
          birthDateLabel: bLabel?.trim() ?? resolvedBirthDate?.dateText,
          deathDateLabel: dLabel?.trim() ?? resolvedDeathDate?.dateText,
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
          ...(occupation !== undefined ? { occupation: occupation?.trim() } : {}),
          ...(titles !== undefined ? { titles } : {}),
          ...(roles !== undefined ? { roles } : {}),
          ...(biography !== undefined ? { biography: biography?.trim() } : {}),
        },
      },
    };
  }
}
