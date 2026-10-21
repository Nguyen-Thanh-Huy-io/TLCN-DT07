import { IEntityDataSourceStrategy } from './entity-source.interface';
import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
  IWikidataClaimsResponse,
  IWikipediaSearchResponse,
  IWikipediaSummaryResponse,
} from '../../types/entity-source.types';
import { ENTITY_SOURCE_CONSTANTS } from '../../constants/entity-source.constants';
import { WikipediaEntityAdapter } from './wikipedia.adapter';
import { WikidataClaimsAdapter, IParsedWikidataDates } from './wikidata-claims.adapter';
import { WikimediaCommonsAdapter } from './wikimedia-commons.adapter';

/**
 * Strategy tra cứu thực thể tích hợp Bộ 3 nguồn Wikimedia:
 * A. Wikipedia: Tìm kiếm theo từ khóa & Lấy đoạn giới thiệu (Lead paragraph / extract)
 * B. Wikidata: Dữ liệu có cấu trúc (Ngày sinh P569, Ngày mất P570, Tọa độ P625, QID)
 * C. Wikimedia Commons: Tư liệu ảnh & Kiểm tra giấy phép bản quyền (License, Artist)
 */
export class WikipediaSourceStrategy implements IEntityDataSourceStrategy {
  public readonly sourceType = EntitySourceType.WIKIPEDIA;

  /**
   * Tìm kiếm gợi ý tiêu đề trang từ Wikipedia tiếng Việt
   */
  public async search(
    keyword: string,
    limit: number = ENTITY_SOURCE_CONSTANTS.WIKIPEDIA_API.DEFAULT_LIMIT,
  ): Promise<IEntitySearchResult[]> {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const url = `${ENTITY_SOURCE_CONSTANTS.WIKIPEDIA_API.BASE_SEARCH_URL}?q=${encodeURIComponent(
        trimmed,
      )}&limit=${limit}`;

      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Api-User-Agent': 'HisgoHistoryApp/1.0 (contact@hisgo.edu.vn)',
        },
      });

      if (!res.ok) {
        console.warn(`Wikipedia search API returned status: ${res.status}`);
        return [];
      }

      const data: IWikipediaSearchResponse = await res.json();
      return WikipediaEntityAdapter.adaptSearchResults(data);
    } catch (error) {
      console.error('Error fetching search results from Wikipedia API:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết thông tin và kết hợp làm giàu dữ liệu từ Bộ 3 Wikimedia:
   * Wikipedia Summary + Wikidata Claims (P569, P570, P625) + Commons Media License
   */
  public async getDetail(title: string): Promise<IEntityDetailPreview | null> {
    const trimmed = title.trim();
    if (!trimmed) {
      return null;
    }

    try {
      // 1. Lấy dữ liệu văn bản tóm tắt từ Wikipedia tiếng Việt (Nguồn A)
      const safeTitle = encodeURIComponent(trimmed.replace(/\s+/g, '_'));
      const summaryUrl = `${ENTITY_SOURCE_CONSTANTS.WIKIPEDIA_API.BASE_SUMMARY_URL}/${safeTitle}`;

      const res = await fetch(summaryUrl, {
        headers: {
          'Accept': 'application/json',
          'Api-User-Agent': 'HisgoHistoryApp/1.0 (contact@hisgo.edu.vn)',
        },
      });

      if (!res.ok) {
        console.warn(`Wikipedia summary API returned status: ${res.status}`);
        return null;
      }

      const summaryData: IWikipediaSummaryResponse = await res.json();
      const basePreview = WikipediaEntityAdapter.adaptEntityDetail(summaryData);

      const wikidataId = summaryData.wikibase_item;
      let structuredDates: IParsedWikidataDates = { formattedYears: '' };
      let coordinates = undefined;

      // 2. Làm giàu dữ liệu có cấu trúc từ Wikidata (Nguồn B) nếu có wikibase_item
      if (wikidataId) {
        try {
          const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims&format=json&origin=*`;
          const wdRes = await fetch(wikidataUrl, {
            headers: {
              'Accept': 'application/json',
              'Api-User-Agent': 'HisgoHistoryApp/1.0 (contact@hisgo.edu.vn)',
            },
          });

          if (wdRes.ok) {
            const wdData: IWikidataClaimsResponse = await wdRes.json();
            const claims = wdData?.entities?.[wikidataId]?.claims;
            if (claims) {
              structuredDates = WikidataClaimsAdapter.parseDates(claims);
              coordinates = WikidataClaimsAdapter.parseCoordinates(claims);
            }
          }
        } catch (wdErr) {
          console.warn(`Could not enrich Wikidata structured claims for ${wikidataId}:`, wdErr);
        }
      }

      // 3. Kiểm tra giấy phép bản quyền tư liệu ảnh từ Wikimedia Commons (Nguồn C)
      let imageLicense = undefined;
      let imageArtist = undefined;
      if (basePreview.avatarUrl) {
        const fileName = WikimediaCommonsAdapter.extractFileNameFromUrl(basePreview.avatarUrl);
        if (fileName) {
          const commonsMeta = await WikimediaCommonsAdapter.fetchImageMetadata(fileName);
          imageLicense = commonsMeta.license;
          imageArtist = commonsMeta.artist;
        }
      }

      // 4. Ánh xạ dữ liệu tổng hợp (Ưu tiên ngày sinh/mất chuẩn xác 100% từ Wikidata)
      const finalYears = structuredDates.formattedYears || basePreview.years;

      return {
        ...basePreview,
        years: finalYears,
        wikidataId,
        birthDate: structuredDates.birthDate,
        deathDate: structuredDates.deathDate,
        coordinates,
        imageLicense,
        imageArtist,
      };
    } catch (error) {
      console.error('Error fetching enriched detail from Wikimedia Trio:', error);
      return null;
    }
  }
}
