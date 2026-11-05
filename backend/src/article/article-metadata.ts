import { BadRequestException } from '@nestjs/common';

/**
 * Hồ sơ mô tả TÙY CHỌN của bài viết (`Article.metadata`, JSONB + index GIN).
 *
 *   {
 *     aliases?, region?, sources?,          ← CHUNG mọi loại bài (aliases đưa vào tìm kiếm)
 *     person?: {...},                         ← bài chuyên mục Nhân vật
 *     site?:   {...},                         ← bài chuyên mục Di tích
 *     event?:  {...},                         ← bài chuyên mục Sự kiện
 *   }
 *
 * Mọi trường đều không bắt buộc; không nhập thì giao diện công khai tự ẩn ô tương ứng.
 * Liên kết bài ↔ bài (quan hệ nhân vật, vai trò trong sự kiện, nơi diễn ra...) KHÔNG nằm ở đây —
 * xem bảng ArticleLink.
 *
 * Vài trường là MÃ CỐ ĐỊNH vì giao diện lọc / đổi nhãn theo mã — danh sách khớp frontend:
 *   roles          ↔ frontend constants/enums.ts CANONICAL_ROLE_LABELS
 *   site.siteType  ↔ constants/enums.ts LocationType
 *   site.rank      ↔ features/heritage/heritage.types.ts HeritageRank
 *   site.preservation ↔ heritage.types.ts PreservationCategory
 */

export const PERSON_ROLE_CODES = [
  'GENERAL', 'COMMANDER', 'COMMANDER_IN_CHIEF', 'STRATEGIST', 'MILITARY_ADVISER', 'WARRIOR',
  'MONARCH', 'POLITICIAN', 'STATESMAN', 'DIPLOMAT', 'REFORMER',
  'SCHOLAR', 'CULTURAL_FIGURE', 'POET', 'WRITER', 'PHILOSOPHER', 'SCIENTIST',
  'RELIGIOUS_FIGURE', 'REVOLUTIONARY', 'PATRIOT', 'HERO',
] as const;
export const SITE_TYPE_CODES = [
  'ANCIENT_CAPITAL', 'CITADEL', 'PALACE', 'BATTLEFIELD', 'RESISTANCE_BASE', 'TEMPLE',
  'ARCHAEOLOGICAL_SITE', 'MONUMENT', 'OTHER',
] as const;
export const SITE_RANK_CODES = ['UNESCO', 'INTERNATIONAL', 'SPECIAL_NATIONAL', 'NATIONAL', 'PROVINCIAL'] as const;
export const SITE_PRESERVATION_CODES = [
  'INTACT', 'MUSEUM_MEMORIAL', 'ARCHAEOLOGICAL_RUIN', 'RESTORED', 'ACTIVE_SITE',
] as const;

/** Mốc đời RIÊNG của nhân vật (việc nhỏ không đáng thành bài sự kiện). Hiện trong dòng đời. */
export interface PersonMilestone {
  year: number;
  month?: number;
  day?: number;
  title: string;
  note?: string;
}

export interface PersonProfile {
  titles?: string[];
  occupation?: string;
  roles?: string[];
  birthDateLabel?: string;
  deathDateLabel?: string;
  hometown?: string;
  backgroundAndYouth?: string;
  notableWorks?: string[];
  legacyAndHonors?: string;
  anecdotes?: string[];
  famousQuote?: string;
  milestones?: PersonMilestone[];
}

export interface SiteProfile {
  address?: string;
  latitude?: number;
  longitude?: number;
  siteType?: string;
  rank?: string;
  recognizedYear?: string;
  preservation?: string;
  statusNote?: string;
  managingAgency?: string;
  architecturalStyle?: string;
  openingHours?: string;
}

export interface EventProfile {
  dateNote?: string;
  cause?: string;
  outcome?: string;
  belligerents?: string[];
}

export interface ArticleMetadata {
  aliases?: string[];
  region?: string;
  sources?: string[];
  person?: PersonProfile;
  site?: SiteProfile;
  event?: EventProfile;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v);

const text = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

const textList = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const list = [...new Set(v.map(text).filter((s): s is string => Boolean(s)))];
  return list.length ? list : undefined;
};

const intIn = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

/** Mốc đời riêng: bắt buộc năm (≠ 0, âm = TCN) + tiêu đề; sắp theo thời gian. */
function milestones(v: unknown): PersonMilestone[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const list = v.filter(isObject).map((m, i) => {
    const title = text(m.title);
    const year = typeof m.year === 'number' ? m.year : Number(m.year);
    if (!title || !Number.isInteger(year) || year === 0) {
      throw new BadRequestException(`metadata.person.milestones[${i}]: cần năm (khác 0) và tiêu đề`);
    }
    return compact<PersonMilestone>({
      year,
      month: intIn(m.month, 1, 12),
      day: intIn(m.day, 1, 31),
      title,
      note: text(m.note),
    })!;
  });
  list.sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0) || (a.day ?? 0) - (b.day ?? 0));
  return list.length ? list : undefined;
}

const coordinate = (v: unknown, max: number, field: string): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || Math.abs(n) > max) {
    throw new BadRequestException(`metadata.site.${field} phải là số trong khoảng ±${max}`);
  }
  return n;
};

function code<T extends readonly string[]>(list: T, v: unknown, field: string): T[number] | undefined {
  const value = text(v);
  if (value === undefined) return undefined;
  if ((list as readonly string[]).includes(value)) return value as T[number];
  throw new BadRequestException(`metadata.${field}: mã "${value}" không hợp lệ`);
}

/** Bỏ khoá undefined; object rỗng → undefined (không lưu "" hay {}). */
function compact<T extends object>(obj: T): T | undefined {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

const branch = (v: unknown, name: string): Record<string, unknown> | undefined => {
  if (v === undefined || v === null) return undefined;
  if (!isObject(v)) throw new BadRequestException(`metadata.${name} phải là object`);
  return v;
};

/** Chuẩn hoá metadata gửi lên. Trả null nếu rỗng (xoá metadata của bài). */
export function normalizeArticleMetadata(raw: unknown): ArticleMetadata | null {
  if (raw === null || raw === undefined) return null;
  if (!isObject(raw)) throw new BadRequestException('metadata phải là object');

  const p = branch(raw.person, 'person');
  const s = branch(raw.site, 'site');
  const e = branch(raw.event, 'event');

  const roles = textList(p?.roles)?.map((r) => code(PERSON_ROLE_CODES, r, 'person.roles')!);

  const meta = compact<ArticleMetadata>({
    aliases: textList(raw.aliases),
    region: text(raw.region),
    sources: textList(raw.sources),
    person: p
      ? compact<PersonProfile>({
          titles: textList(p.titles),
          occupation: text(p.occupation),
          roles: roles?.length ? roles : undefined,
          birthDateLabel: text(p.birthDateLabel),
          deathDateLabel: text(p.deathDateLabel),
          hometown: text(p.hometown),
          backgroundAndYouth: text(p.backgroundAndYouth),
          notableWorks: textList(p.notableWorks),
          legacyAndHonors: text(p.legacyAndHonors),
          anecdotes: textList(p.anecdotes),
          famousQuote: text(p.famousQuote),
          milestones: milestones(p.milestones),
        })
      : undefined,
    site: s
      ? compact<SiteProfile>({
          address: text(s.address),
          latitude: coordinate(s.latitude, 90, 'latitude'),
          longitude: coordinate(s.longitude, 180, 'longitude'),
          siteType: code(SITE_TYPE_CODES, s.siteType, 'site.siteType'),
          rank: code(SITE_RANK_CODES, s.rank, 'site.rank'),
          recognizedYear: text(s.recognizedYear),
          preservation: code(SITE_PRESERVATION_CODES, s.preservation, 'site.preservation'),
          statusNote: text(s.statusNote),
          managingAgency: text(s.managingAgency),
          architecturalStyle: text(s.architecturalStyle),
          openingHours: text(s.openingHours),
        })
      : undefined,
    event: e
      ? compact<EventProfile>({
          dateNote: text(e.dateNote),
          cause: text(e.cause),
          outcome: text(e.outcome),
          belligerents: textList(e.belligerents),
        })
      : undefined,
  });
  return meta ?? null;
}
