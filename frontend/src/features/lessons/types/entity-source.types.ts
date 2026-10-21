/**
 * Định nghĩa các kiểu dữ liệu cho nguồn tra cứu thực thể lịch sử
 * Hỗ trợ Bộ 3 Wikimedia: Wikipedia (Text), Wikidata (Structured Data), Commons (Media)
 * Tuân thủ SOLID và tách biệt giao diện hiển thị với chi tiết nguồn cấp dữ liệu
 */

export enum EntitySourceType {
  HISGO = 'HISGO',
  WIKIPEDIA = 'WIKIPEDIA',
}

export interface IEntitySearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  sourceType: EntitySourceType;
  rawKey?: string;
  wikidataId?: string; // Mã định danh Wikidata QID (Vd: Q179910)
}

export interface IEntityDetailPreview {
  name: string;
  years: string;
  summary: string;
  avatarUrl: string;
  tagline?: string;
  sourceUrl?: string;
  sourceType: EntitySourceType;
  entityId?: string; // ID nếu là thực thể nội bộ HISGO

  // Dữ liệu có cấu trúc từ Wikidata (B)
  wikidataId?: string;
  birthDate?: string;
  deathDate?: string;
  occupation?: string;
  nationality?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Dữ liệu bản quyền tư liệu ảnh từ Wikimedia Commons (C)
  imageLicense?: string;
  imageArtist?: string;
}

export interface IWikipediaSearchResponse {
  pages?: Array<{
    id: number;
    key: string;
    title: string;
    excerpt?: string;
    description?: string;
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
  }>;
}

export interface IWikipediaSummaryResponse {
  type?: string;
  title: string;
  displaytitle?: string;
  description?: string;
  extract?: string;
  extract_html?: string;
  wikibase_item?: string; // Mã QID của Wikidata (Vd: Q179910)
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
}

export interface IWikidataClaimsResponse {
  entities?: Record<
    string,
    {
      id: string;
      claims?: Record<string, any[]>;
      labels?: Record<string, { value: string }>;
      descriptions?: Record<string, { value: string }>;
    }
  >;
}
