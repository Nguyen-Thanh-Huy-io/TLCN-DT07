import {
  HISTORICAL_API_ENDPOINTS,
  HistoricalDataSourceType,
  HTTP_HEADERS,
} from '../constants/ingestion.constants';
import { IHistoricalDataSourceStrategy } from '../interfaces/ingestion.interface';

export interface IWikidataSparqlQueryInput {
  sparql: string;
  timeoutMs?: number;
}

export interface IWikidataSparqlRow {
  item: string;
  itemLabel: string;
  itemDescription?: string;
  startYear?: number;
  endYear?: number;
  birthYear?: number;
  deathYear?: number;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  viWikiTitle?: string;
  enWikiTitle?: string;
  countryLabel?: string;
}

/**
 * 1. Strategy truy vấn Wikidata SPARQL & Entity API (Ưu tiên số 1 cho HISGO)
 */
export class WikidataSparqlStrategy
  implements IHistoricalDataSourceStrategy<IWikidataSparqlQueryInput, IWikidataSparqlRow[]>
{
  public readonly sourceType = HistoricalDataSourceType.WIKIDATA;

  public async fetchData(query: IWikidataSparqlQueryInput): Promise<IWikidataSparqlRow[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), query.timeoutMs ?? 12000);

    try {
      const url = `${HISTORICAL_API_ENDPOINTS.WIKIDATA.SPARQL_URL}?query=${encodeURIComponent(
        query.sparql,
      )}&format=json`;

      const res = await fetch(url, {
        headers: {
          Accept: HTTP_HEADERS.ACCEPT_SPARQL,
          'User-Agent': HTTP_HEADERS.USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const bindings: any[] = data?.results?.bindings || [];

      return bindings.map((b) => ({
        item: this.extractQid(b.item?.value),
        itemLabel: b.itemLabel?.value || '',
        itemDescription: b.itemDescription?.value,
        startYear: this.parseYear(b.startTime?.value || b.pointInTime?.value),
        endYear: this.parseYear(b.endTime?.value),
        birthYear: this.parseYear(b.birthDate?.value),
        deathYear: this.parseYear(b.deathDate?.value),
        latitude: this.parseCoord(b.coord?.value, 'lat'),
        longitude: this.parseCoord(b.coord?.value, 'lon'),
        imageUrl: b.image?.value,
        viWikiTitle: b.viArticleName?.value,
        enWikiTitle: b.enArticleName?.value,
        countryLabel: b.countryLabel?.value,
      }));
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractQid(uri?: string): string {
    if (!uri) return '';
    const parts = uri.split('/');
    return parts[parts.length - 1] || '';
  }

  private parseYear(isoStr?: string): number | undefined {
    if (!isoStr) return undefined;
    const isBce = isoStr.startsWith('-');
    const cleaned = isoStr.replace(/^[+-]/, '');
    const yearStr = cleaned.split('-')[0];
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) return undefined;
    return isBce ? -year : year;
  }

  private parseCoord(wkt?: string, part?: 'lat' | 'lon'): number | undefined {
    if (!wkt) return undefined;
    // Point(105.8407 21.0347) -> lon lat
    const match = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (!match) return undefined;
    return part === 'lon' ? parseFloat(match[1]) : parseFloat(match[2]);
  }
}

export interface IWikipediaSummaryQuery {
  title: string;
  lang?: 'vi' | 'en';
}

export interface IWikipediaSummaryOutput {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  wikidataId?: string;
}

/**
 * 2. Strategy lấy nội dung bài viết lịch sử từ Wikipedia REST API (Ưu tiên số 2)
 */
export class WikipediaRestStrategy
  implements IHistoricalDataSourceStrategy<IWikipediaSummaryQuery, IWikipediaSummaryOutput | null>
{
  public readonly sourceType = HistoricalDataSourceType.WIKIPEDIA;

  public async fetchData(query: IWikipediaSummaryQuery): Promise<IWikipediaSummaryOutput | null> {
    const baseUrl =
      query.lang === 'en'
        ? HISTORICAL_API_ENDPOINTS.WIKIPEDIA.EN_SUMMARY_URL
        : HISTORICAL_API_ENDPOINTS.WIKIPEDIA.VI_SUMMARY_URL;

    const safeTitle = encodeURIComponent(query.title.trim().replace(/\s+/g, '_'));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${baseUrl}/${safeTitle}`, {
        headers: {
          Accept: HTTP_HEADERS.ACCEPT_JSON,
          'User-Agent': HTTP_HEADERS.USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const data = await res.json();

      return {
        title: data.title || query.title,
        extract: data.extract || '',
        description: data.description,
        thumbnailUrl: data.thumbnail?.source || data.originalimage?.source,
        wikidataId: data.wikibase_item,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export interface ICommonsLicenseOutput {
  fileName: string;
  url?: string;
  license: string;
  artist?: string;
  isOpenLicense: boolean;
}

/**
 * 3. Strategy kiểm tra bản quyền và lấy tư liệu ảnh từ Wikimedia Commons (Ưu tiên số 3)
 */
export class WikimediaCommonsStrategy
  implements IHistoricalDataSourceStrategy<string, ICommonsLicenseOutput | null>
{
  public readonly sourceType = HistoricalDataSourceType.WIKIMEDIA_COMMONS;

  public async fetchData(fileNameOrUrl: string): Promise<ICommonsLicenseOutput | null> {
    const cleanName = this.extractFileName(fileNameOrUrl);
    if (!cleanName) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${HISTORICAL_API_ENDPOINTS.WIKIMEDIA_COMMONS.API_URL}?action=query&titles=File:${encodeURIComponent(
        cleanName,
      )}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

      const res = await fetch(url, {
        headers: {
          Accept: HTTP_HEADERS.ACCEPT_JSON,
          'User-Agent': HTTP_HEADERS.USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return null;

      const firstKey = Object.keys(pages)[0];
      const info = pages[firstKey]?.imageinfo?.[0];
      if (!info) return null;

      const ext = info.extmetadata || {};
      const license = ext.LicenseShortName?.value || ext.UsageTerms?.value || 'Public Domain';
      const artist = (ext.Artist?.value || '').replace(/<[^>]*>/g, '').trim();

      return {
        fileName: cleanName,
        url: info.url,
        license,
        artist,
        isOpenLicense: /public domain|cc0|cc-by|cc by/i.test(license),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractFileName(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http')) {
      const parts = trimmed.split('/');
      return decodeURIComponent(parts[parts.length - 1].split('?')[0]);
    }
    return trimmed.replace(/^File:/i, '');
  }
}

export interface IMuseumArtifactQuery {
  keyword: string;
  apiKey?: string;
  limit?: number;
}

export interface IMuseumArtifactItem {
  title: string;
  description: string;
  imageUrl?: string;
  museumSource: string;
  license: string;
}

/**
 * 4. Strategy lấy hiện vật bảo tàng từ Smithsonian Open Access & Europeana (Ưu tiên số 4)
 */
export class MuseumOpenAccessStrategy
  implements IHistoricalDataSourceStrategy<IMuseumArtifactQuery, IMuseumArtifactItem[]>
{
  public readonly sourceType = HistoricalDataSourceType.SMITHSONIAN;

  public async fetchData(query: IMuseumArtifactQuery): Promise<IMuseumArtifactItem[]> {
    const apiKey = query.apiKey || process.env.SMITHSONIAN_API_KEY || 'DEMO_KEY';
    const limit = query.limit ?? 10;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `${HISTORICAL_API_ENDPOINTS.SMITHSONIAN.SEARCH_URL}?q=${encodeURIComponent(
        query.keyword,
      )}&rows=${limit}&api_key=${apiKey}`;

      const res = await fetch(url, {
        headers: {
          Accept: HTTP_HEADERS.ACCEPT_JSON,
          'User-Agent': HTTP_HEADERS.USER_AGENT,
        },
        signal: controller.signal,
      });

      if (!res.ok) return [];
      const data = await res.json();
      const rows: any[] = data?.response?.rows || [];

      return rows.map((r) => ({
        title: r.title || query.keyword,
        description:
          r.content?.freetext?.notes?.[0]?.content ||
          r.content?.descriptiveNonRepeating?.data_source ||
          'Hiện vật lưu trữ tại Viện Bảo tàng Smithsonian (CC0 Open Access).',
        imageUrl: r.content?.descriptiveNonRepeating?.online_media?.media?.[0]?.content,
        museumSource: r.content?.descriptiveNonRepeating?.data_source || 'Smithsonian Institution',
        license: 'CC0 Public Domain',
      }));
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Registry quản lý các Data Source Strategy (OCP)
 */
export class HistoricalDataSourceRegistry {
  private readonly strategies = new Map<
    HistoricalDataSourceType,
    IHistoricalDataSourceStrategy
  >();

  constructor() {
    this.register(new WikidataSparqlStrategy());
    this.register(new WikipediaRestStrategy());
    this.register(new WikimediaCommonsStrategy());
    this.register(new MuseumOpenAccessStrategy());
  }

  public register(strategy: IHistoricalDataSourceStrategy): void {
    this.strategies.set(strategy.sourceType, strategy);
  }

  public get<T extends IHistoricalDataSourceStrategy>(type: HistoricalDataSourceType): T {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Chưa đăng ký Strategy cho nguồn dữ liệu: ${type}`);
    }
    return strategy as T;
  }
}
