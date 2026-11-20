/**
 * Adapter Pattern: Phân giải Claims dữ liệu có cấu trúc từ Wikidata Entity API
 * Trích xuất ngày sinh (P569), ngày mất (P570), tọa độ (P625), nghề nghiệp (P106)...
 */

export interface IParsedWikidataDates {
  birthDate?: string;
  deathDate?: string;
  formattedYears: string;
}

export interface IParsedWikidataCoords {
  latitude: number;
  longitude: number;
}

interface WikidataTimePayload {
  time: string;
  precision: number;
}

interface WikidataCoordinatePayload {
  latitude: number;
  longitude: number;
}

interface WikidataSnakItem {
  mainsnak?: {
    datavalue?: {
      value?: unknown;
    };
  };
}

const WIKIDATA_ZERO_PAD = '00';

function getClaimTime(claims: Record<string, unknown[]>, propertyId: string): WikidataTimePayload | undefined {
  const item = claims[propertyId]?.[0] as WikidataSnakItem | undefined;
  const val = item?.mainsnak?.datavalue?.value;
  if (val && typeof val === 'object' && 'time' in val && 'precision' in val) {
    return val as WikidataTimePayload;
  }
  return undefined;
}

function getClaimCoordinate(
  claims: Record<string, unknown[]>,
  propertyId: string,
): WikidataCoordinatePayload | undefined {
  const item = claims[propertyId]?.[0] as WikidataSnakItem | undefined;
  const val = item?.mainsnak?.datavalue?.value;
  if (val && typeof val === 'object' && 'latitude' in val && 'longitude' in val) {
    return val as WikidataCoordinatePayload;
  }
  return undefined;
}

export class WikidataClaimsAdapter {
  /**
   * Bóc tách ngày tháng năm sinh (P569) và mất (P570) chuẩn xác từ Wikidata claims
   */
  public static parseDates(claims?: Record<string, unknown[]>): IParsedWikidataDates {
    if (!claims) {
      return { formattedYears: '' };
    }

    const birthClaim = getClaimTime(claims, 'P569');
    const deathClaim = getClaimTime(claims, 'P570');

    const birthDate = this.formatWikidataTime(birthClaim);
    const deathDate = this.formatWikidataTime(deathClaim);

    let formattedYears = '';
    if (birthDate && deathDate) {
      formattedYears = `${birthDate} – ${deathDate}`;
    } else if (birthDate && !deathClaim) {
      formattedYears = `${birthDate} – Nay`;
    } else if (deathDate) {
      formattedYears = `Mất: ${deathDate}`;
    }

    // Nếu không có ngày sinh/mất (thực thể là Sự kiện lịch sử): kiểm tra P580 (bắt đầu), P582 (kết thúc), P585 (thời điểm)
    if (!formattedYears) {
      const startTimeClaim = getClaimTime(claims, 'P580');
      const endTimeClaim = getClaimTime(claims, 'P582');
      const pointTimeClaim = getClaimTime(claims, 'P585');

      const startDate = this.formatWikidataTime(startTimeClaim);
      const endDate = this.formatWikidataTime(endTimeClaim);
      const pointDate = this.formatWikidataTime(pointTimeClaim);

      if (startDate && endDate) {
        formattedYears = `${startDate} – ${endDate}`;
      } else if (pointDate) {
        formattedYears = pointDate;
      } else if (startDate) {
        formattedYears = `Bắt đầu: ${startDate}`;
      } else if (endDate) {
        formattedYears = `Kết thúc: ${endDate}`;
      }
    }

    return {
      birthDate,
      deathDate,
      formattedYears,
    };
  }

  /**
   * Bóc tách tọa độ địa lý (P625) cho di tích / địa danh lịch sử
   */
  public static parseCoordinates(claims?: Record<string, unknown[]>): IParsedWikidataCoords | undefined {
    if (!claims) return undefined;

    const coord = getClaimCoordinate(claims, 'P625');
    if (coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
      return {
        latitude: coord.latitude,
        longitude: coord.longitude,
      };
    }
    return undefined;
  }

  /**
   * Chuyển đổi định dạng time của Wikidata (+1911-08-25T00:00:00Z) thành chuỗi hiển thị chuẩn
   */
  public static formatWikidataTime(timeValue?: { time: string; precision: number }): string | undefined {
    if (!timeValue || !timeValue.time) return undefined;

    const rawTime = timeValue.time.replace(/^\+/, '');
    const parts = rawTime.split('T')[0]?.split('-');
    if (!parts || parts.length < 1) return undefined;

    const year = parts[0]?.replace(/^0+/, '') || '0';
    const month = parts[1];
    const day = parts[2];

    // Precision 9: Năm
    if (timeValue.precision <= 9 || !month || month === WIKIDATA_ZERO_PAD) {
      return year;
    }

    // Precision 10: Tháng / Năm
    if (timeValue.precision === 10 || !day || day === WIKIDATA_ZERO_PAD) {
      return `${parseInt(month, 10)}/${year}`;
    }

    // Precision 11: Ngày / Tháng / Năm
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
  }
}
