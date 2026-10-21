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

export class WikidataClaimsAdapter {
  /**
   * Bóc tách ngày tháng năm sinh (P569) và mất (P570) chuẩn xác từ Wikidata claims
   */
  public static parseDates(claims?: Record<string, any[]>): IParsedWikidataDates {
    if (!claims) {
      return { formattedYears: '' };
    }

    const birthClaim = claims.P569?.[0]?.mainsnak?.datavalue?.value;
    const deathClaim = claims.P570?.[0]?.mainsnak?.datavalue?.value;

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
      const startTimeClaim = claims.P580?.[0]?.mainsnak?.datavalue?.value;
      const endTimeClaim = claims.P582?.[0]?.mainsnak?.datavalue?.value;
      const pointTimeClaim = claims.P585?.[0]?.mainsnak?.datavalue?.value;

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
  public static parseCoordinates(claims?: Record<string, any[]>): IParsedWikidataCoords | undefined {
    if (!claims) return undefined;

    const coordClaim = claims.P625?.[0]?.mainsnak?.datavalue?.value;
    if (coordClaim && typeof coordClaim.latitude === 'number' && typeof coordClaim.longitude === 'number') {
      return {
        latitude: coordClaim.latitude,
        longitude: coordClaim.longitude,
      };
    }
    return undefined;
  }

  /**
   * Chuyển đổi định dạng time của Wikidata (+1911-08-25T00:00:00Z) thành chuỗi hiển thị chuẩn
   */
  public static formatWikidataTime(timeValue?: { time: string; precision: number }): string | undefined {
    if (!timeValue?.time) return undefined;

    const rawTime = timeValue.time; // Vd: "+1911-08-25T00:00:00Z"
    const precision = timeValue.precision ?? 11;

    // Bóc tách năm, tháng, ngày qua regex
    const match = rawTime.match(/^[+-]?(\d{1,4})-(\d{2})-(\d{2})/);
    if (!match) return undefined;

    const year = parseInt(match[1], 10);
    const month = match[2];
    const day = match[3];

    // Precision 11: Đến ngày (Day) -> DD/MM/YYYY
    if (precision >= 11 && day !== '00' && month !== '00') {
      return `${day}/${month}/${year}`;
    }

    // Precision 10: Đến tháng (Month) -> MM/YYYY
    if (precision === 10 && month !== '00') {
      return `${month}/${year}`;
    }

    // Precision 9: Chỉ đến năm (Year) -> YYYY
    return `${year}`;
  }
}
