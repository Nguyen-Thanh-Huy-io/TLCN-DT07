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
