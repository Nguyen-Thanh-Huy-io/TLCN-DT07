import { BadRequestException, Injectable } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { IEventMetadataStrategy } from './event-metadata.strategy.interface';
import { HISTORICAL_EVENT_ERRORS } from '../historical-event.constant';

/**
 * Strategy chuẩn hóa metadata cho TRẬN ĐÁNH / CHIẾN DỊCH / HẢI CHIẾN (BATTLE)
 * Dữ liệu đặc thù: belligerents (các bên tham chiến), commanders (chỉ huy),
 * casualties (thương vong), tactics (chiến thuật).
 */
@Injectable()
export class BattleMetadataStrategy implements IEventMetadataStrategy {
  supports(category: EventCategory): boolean {
    return category === EventCategory.BATTLE;
  }

  getCategory(): EventCategory {
    return EventCategory.BATTLE;
  }

  validateAndNormalize(rawMetadata: unknown): Record<string, any> | null {
    if (!rawMetadata) return null;
    if (typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
      throw new BadRequestException(HISTORICAL_EVENT_ERRORS.INVALID_METADATA_FORMAT);
    }

    const meta = rawMetadata as Record<string, any>;
    return {
      belligerents: Array.isArray(meta.belligerents)
        ? meta.belligerents.map((b) => String(b).trim()).filter(Boolean)
        : [],
      commanders: Array.isArray(meta.commanders)
        ? meta.commanders.map((c) => String(c).trim()).filter(Boolean)
        : [],
      casualties: meta.casualties ? String(meta.casualties).trim() : null,
      tactics: meta.tactics ? String(meta.tactics).trim() : null,
      strength: meta.strength ? String(meta.strength).trim() : null,
    };
  }
}

/**
 * Strategy chuẩn hóa metadata cho HIỆP ƯỚC / HÒA ƯỚC (TREATY)
 * Dữ liệu đặc thù: signatories (các bên ký kết), ratifiedDate (ngày phê chuẩn),
 * termsSummary (tóm tắt điều khoản), territorialChanges (thay đổi biên giới).
 */
@Injectable()
export class TreatyMetadataStrategy implements IEventMetadataStrategy {
  supports(category: EventCategory): boolean {
    return category === EventCategory.TREATY;
  }

  getCategory(): EventCategory {
    return EventCategory.TREATY;
  }

  validateAndNormalize(rawMetadata: unknown): Record<string, any> | null {
    if (!rawMetadata) return null;
    if (typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
      throw new BadRequestException(HISTORICAL_EVENT_ERRORS.INVALID_METADATA_FORMAT);
    }

    const meta = rawMetadata as Record<string, any>;
    return {
      signatories: Array.isArray(meta.signatories)
        ? meta.signatories.map((s) => String(s).trim()).filter(Boolean)
        : [],
      ratifiedDate: meta.ratifiedDate ? String(meta.ratifiedDate).trim() : null,
      termsSummary: meta.termsSummary ? String(meta.termsSummary).trim() : null,
      territorialChanges: meta.territorialChanges
        ? String(meta.territorialChanges).trim()
        : null,
    };
  }
}

/**
 * Strategy chuẩn hóa metadata cho THIÊN TAI / ĐẠI DỊCH (NATURAL_DISASTER)
 * Dữ liệu đặc thù: intensity (cường độ Richter/cấp độ), casualtiesCount (số nạn nhân),
 * affectedArea (vùng ảnh hưởng).
 */
@Injectable()
export class NaturalDisasterMetadataStrategy implements IEventMetadataStrategy {
  supports(category: EventCategory): boolean {
    return category === EventCategory.NATURAL_DISASTER;
  }

  getCategory(): EventCategory {
    return EventCategory.NATURAL_DISASTER;
  }

  validateAndNormalize(rawMetadata: unknown): Record<string, any> | null {
    if (!rawMetadata) return null;
    if (typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
      throw new BadRequestException(HISTORICAL_EVENT_ERRORS.INVALID_METADATA_FORMAT);
    }

    const meta = rawMetadata as Record<string, any>;
    return {
      intensity: meta.intensity ? String(meta.intensity).trim() : null,
      casualtiesCount: meta.casualtiesCount
        ? String(meta.casualtiesCount).trim()
        : null,
      affectedArea: meta.affectedArea ? String(meta.affectedArea).trim() : null,
    };
  }
}

/**
 * Strategy mặc định cho các thể loại khác hoặc khi không yêu cầu schema khắt khe
 */
@Injectable()
export class DefaultEventMetadataStrategy implements IEventMetadataStrategy {
  supports(): boolean {
    return true; // Fallback cho mọi category
  }

  getCategory(): EventCategory {
    return EventCategory.OTHER;
  }

  validateAndNormalize(rawMetadata: unknown): Record<string, any> | null {
    if (!rawMetadata) return null;
    if (typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
      throw new BadRequestException(HISTORICAL_EVENT_ERRORS.INVALID_METADATA_FORMAT);
    }
    return rawMetadata as Record<string, any>;
  }
}
