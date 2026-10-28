import {
  ContentStatus,
  DatePrecision,
  EventCategory,
  EventRelationType,
  HistoricalEntityType,
  VerificationStatus,
} from '@prisma/client';

/**
 * Hằng số cấu hình các nguồn API Lịch sử Mở cho HISGO (Không dùng Magic String)
 */
export const HISTORICAL_API_ENDPOINTS = {
  WIKIDATA: {
    SPARQL_URL: 'https://query.wikidata.org/sparql',
    ENTITY_API_URL: 'https://www.wikidata.org/w/api.php',
  },
  WIKIPEDIA: {
    VI_SUMMARY_URL: 'https://vi.wikipedia.org/api/rest_v1/page/summary',
    EN_SUMMARY_URL: 'https://en.wikipedia.org/api/rest_v1/page/summary',
    VI_SEARCH_URL: 'https://vi.wikipedia.org/w/rest.php/v1/search/title',
  },
  WIKIMEDIA_COMMONS: {
    API_URL: 'https://commons.wikimedia.org/w/api.php',
  },
  EUROPEANA: {
    SEARCH_URL: 'https://api.europeana.eu/record/v2/search.json',
  },
  SMITHSONIAN: {
    SEARCH_URL: 'https://api.si.edu/openaccess/api/v1.0/search',
  },
} as const;

export const HTTP_HEADERS = {
  USER_AGENT: 'HisgoHistoryEducationPlatform/1.0 (https://hisgo.edu.vn; contact@hisgo.edu.vn)',
  ACCEPT_JSON: 'application/json',
  ACCEPT_SPARQL: 'application/sparql-results+json',
} as const;

/**
 * Các thuộc tính (Properties) chuẩn của Wikidata dùng để bóc tách dữ liệu lịch sử
 */
export const WIKIDATA_PROPERTIES = {
  INSTANCE_OF: 'P31',
  COUNTRY: 'P17',
  CITIZENSHIP: 'P27',
  IMAGE: 'P18',
  BIRTH_DATE: 'P569',
  DEATH_DATE: 'P570',
  START_TIME: 'P580',
  END_TIME: 'P582',
  POINT_IN_TIME: 'P585',
  COORDINATES: 'P625',
  PARTICIPANT: 'P710',
  COMMANDER: 'P4791',
  CASUALTIES: 'P1120',
  SIGNATORY: 'P1891',
  LOCATION: 'P276',
  PART_OF: 'P361',
  HAS_CAUSE: 'P828',
  IMMEDIATE_CAUSE_OF: 'P1536',
  OCCUPATION: 'P106',
  INCEPTION: 'P571',
  DISSOLVED: 'P576',
  COLLECTION: 'P195',
} as const;

/**
 * Mã loại nguồn dữ liệu (Strategy Discriminator)
 */
export enum HistoricalDataSourceType {
  WIKIDATA = 'WIKIDATA',
  WIKIPEDIA = 'WIKIPEDIA',
  WIKIMEDIA_COMMONS = 'WIKIMEDIA_COMMONS',
  EUROPEANA = 'EUROPEANA',
  SMITHSONIAN = 'SMITHSONIAN',
}

/**
 * Mã quy tắc quan hệ thực thể chuẩn (Khớp 100% với relation-rules.json)
 */
export const ENTITY_RELATION_CODES = {
  LEADER_OF: 'LEADER_OF',
  MEMBER_OF: 'MEMBER_OF',
  FOUNDER_OF: 'FOUNDER_OF',
  SUCCESSOR_TO: 'SUCCESSOR_TO',
  ALLIED_WITH: 'ALLIED_WITH',
  OPPOSED_TO: 'OPPOSED_TO',
  VASSAL_OF: 'VASSAL_OF',
  SERVED_UNDER: 'SERVED_UNDER',
  CONTEMPORARY_OF: 'CONTEMPORARY_OF',
  SIGNATORY_OF: 'SIGNATORY_OF',
  PARENT_OF: 'PARENT_OF',
  CHILD_OF: 'CHILD_OF',
  SPOUSE_OF: 'SPOUSE_OF',
  SIBLING_OF: 'SIBLING_OF',
  OCCURRED_AT: 'OCCURRED_AT',
  LOCATED_IN: 'LOCATED_IN',
  CAPITAL_OF: 'CAPITAL_OF',
  BORN_IN: 'BORN_IN',
  DIED_IN: 'DIED_IN',
  BURIAL_PLACE: 'BURIAL_PLACE',
  AUTHOR_OF: 'AUTHOR_OF',
  HOUSED_AT: 'HOUSED_AT',
  DISCOVERED_AT: 'DISCOVERED_AT',
  COMMEMORATED_BY: 'COMMEMORATED_BY',
  NAMED_AFTER: 'NAMED_AFTER',
} as const;

/**
 * Mã vai trò thực thể trong sự kiện (HistoricalEventEntity.role)
 */
export const EVENT_ENTITY_ROLES = {
  COMMANDER: 'COMMANDER',
  PARTICIPANT: 'PARTICIPANT',
  BELLIGERENT: 'BELLIGERENT',
  SIGNATORY: 'SIGNATORY',
  LOCATION: 'LOCATION',
  LEADER: 'LEADER',
  INITIATOR: 'INITIATOR',
  ARTIFACT_USED: 'ARTIFACT_USED',
} as const;

/**
 * Phân loại di tích lịch sử (HistoricalSite.siteType)
 */
export const HISTORICAL_SITE_TYPES = {
  BATTLEFIELD: 'BATTLEFIELD',
  CITADEL: 'CITADEL',
  ANCIENT_CAPITAL: 'ANCIENT_CAPITAL',
  MONUMENT: 'MONUMENT',
  PALACE: 'PALACE',
  TEMPLE: 'TEMPLE',
  MUSEUM: 'MUSEUM',
  ARCHAEOLOGICAL_SITE: 'ARCHAEOLOGICAL_SITE',
  WORLD_HERITAGE: 'WORLD_HERITAGE',
} as const;

export const DATASET_PATHS = {
  PERIODS: 'periods.json',
  ENTITIES: 'entities.json',
  EVENTS: 'events.json',
  RELATIONS: 'relations.json',
} as const;

export const DEFAULT_ENUM_VALUES = {
  STATUS: ContentStatus.PUBLISHED,
  PRECISION: DatePrecision.EXACT_YEAR,
  VERIFICATION: VerificationStatus.VERIFIED,
  EVENT_CATEGORY: EventCategory.OTHER,
  ENTITY_TYPE: HistoricalEntityType.PERSON,
  EVENT_RELATION: EventRelationType.CAUSES,
} as const;

/**
 * Chuẩn hóa khu vực lịch sử (Không dùng Magic String)
 */
export enum HistoricalRegion {
  VIETNAM = 'Việt Nam',
  NATIONWIDE = 'Toàn quốc',
  WORLD = 'Thế giới',
  SOVIET_UNION = 'Liên Xô',
  ASIA = 'Châu Á',
  EUROPE_MEDITERRANEAN = 'Châu Âu & Địa Trung Hải',
  EUROPE_NORTH_AMERICA = 'Châu Âu & Bắc Mỹ',
  SOUTHEAST_ASIA = 'Đông Nam Á',
}

export const HISTORICAL_REGIONS = {
  VIETNAM: HistoricalRegion.VIETNAM,
  NATIONWIDE: HistoricalRegion.NATIONWIDE,
  WORLD: HistoricalRegion.WORLD,
  SOVIET_UNION: HistoricalRegion.SOVIET_UNION,
  ASIA: HistoricalRegion.ASIA,
  EUROPE_MEDITERRANEAN: HistoricalRegion.EUROPE_MEDITERRANEAN,
  EUROPE_NORTH_AMERICA: HistoricalRegion.EUROPE_NORTH_AMERICA,
  SOUTHEAST_ASIA: HistoricalRegion.SOUTHEAST_ASIA,
} as const;

/**
 * Hằng số định danh Slug của các Thời kỳ / Giai đoạn Lịch sử (Không dùng Magic String)
 */
export const PERIOD_SLUGS = {
  // Việt Nam: Cấp 1
  VN_FOUNDING_ERA: 'thoi-ky-dung-nuoc-va-giu-nuoc-2879-tcn-938',
  VN_FEUDAL_ERA: 'thoi-ky-phong-kien-viet-nam-939-1883',
  VN_MODERN_ERA: 'thoi-ky-hien-dai-viet-nam-1883-nay',

  // Việt Nam: Cấp 2
  VN_HONG_BANG: 'thoi-hong-bang-xich-quy-van-lang-au-lac',
  VN_DOMINATION_1: 'thoi-ky-bac-thuoc-lan-1-208-tcn-39',
  VN_TRUNG_SISTERS: 'giai-doan-trung-nu-vuong-40-43',
  VN_DOMINATION_2: 'thoi-ky-bac-thuoc-lan-2-43-543',
  VN_EARLY_LY: 'thoi-ky-nha-tien-ly-544-602',
  VN_DOMINATION_3: 'thoi-ky-bac-thuoc-lan-3-602-905',
  VN_AUTONOMY: 'thoi-ky-tu-chu-905-938',
  VN_NGO_DINH_TIEN_LE: 'nha-ngo-nha-dinh-nha-tien-le-939-1009',
  VN_LY_DYNASTY: 'trieu-dai-nha-ly-1009-1225',
  VN_TRAN_DYNASTY: 'trieu-dai-nha-tran-1225-1400',
  VN_HO_POST_TRAN_DOMINATION_4: 'nha-ho-nha-hau-tran-va-bac-thuoc-lan-4-1400-1428',
  VN_EARLY_LE: 'nha-hau-le-le-so-1428-1527',
  VN_NORTH_SOUTH_COURTS: 'thoi-ky-bac-trieu-nam-trieu-1527-1592',
  VN_TRINH_NGUYEN: 'thoi-ky-trinh-nguyen-phan-tranh-1593-1778',
  VN_TAY_SON: 'trieu-dai-nha-tay-son-1778-1802',
  VN_NGUYEN_INDEPENDENT: 'thoi-ky-thong-nhat-nha-nguyen-doc-lap-1802-1883',
  VN_FRENCH_COLONIAL: 'nha-nguyen-thoi-ky-phap-thuoc-1883-1945',
  VN_ANTI_FRENCH_WAR: 'viet-nam-dan-chu-cong-hoa-khang-chien-chong-phap-1945-1954',
  VN_ANTI_US_WAR: 'khang-chien-chong-my-cuu-nuoc-1954-1975',
  VN_SRVN_DOI_MOI: 'cong-hoa-xa-hoi-chu-nghia-viet-nam-1976-nay',

  // Thế giới: Cấp 1
  WORLD_MEDIEVAL_ERA: 'thoi-ky-trung-dai-the-gioi',
  WORLD_EARLY_MODERN_ERA: 'thoi-ky-can-dai-the-gioi',
  WORLD_MODERN_ERA: 'thoi-ky-hien-dai-the-gioi',

  // Thế giới: Cấp 2
  WORLD_MEDIEVAL_EAST: 'trung-dai-phuong-dong-duong-tong-nguyen-minh',
  WORLD_MEDIEVAL_EUROPE: 'trung-dai-chau-au-thap-tu-chinh-va-phuc-hung',
  WORLD_BOURGEOIS_REVOLUTIONS: 'can-dai-cach-mang-tu-san-va-napoleon',
  WORLD_INDUSTRIAL_MEIJI: 'can-dai-cach-mang-cong-nghiep-va-minh-tri-duy-tan',
  WORLD_TWO_WORLD_WARS: 'hien-dai-hai-cuoc-chien-tranh-the-gioi-1914-1945',
  WORLD_COLD_WAR_MULTIPOLAR: 'hien-dai-chien-tranh-lanh-va-the-gioi-da-cuc-1945-nay',

  // Liên Xô: Cấp 2 (Trực thuộc Thời kỳ Hiện đại Thế giới)
  SOVIET_REVOLUTION_GREAT_PATRIOTIC_WAR:
    'lien-xo-cach-mang-thang-muoi-va-chien-tranh-ve-quoc-1917-1945',
  SOVIET_COLD_WAR_SPACE_ERA:
    'lien-xo-chien-tranh-lanh-ky-nguyen-vu-tru-va-cai-to-1945-1991',
} as const;

