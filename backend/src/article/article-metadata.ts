import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Hồ sơ mô tả TÙY CHỌN của bài viết (`Article.metadata`, JSONB + index GIN).
 *
 *   {
 *     aliases?, sources?,                   ← CHUNG mọi loại bài (aliases đưa vào tìm kiếm)
 *     person?: {...},                         ← bài chuyên mục Nhân vật
 *     site?:   {...},                         ← bài chuyên mục Di tích
 *   }
 *
 * Mọi trường đều không bắt buộc; không nhập thì giao diện công khai tự ẩn ô tương ứng.
 * Niên đại (kể cả năm sinh – mất) chỉ nhập ở cột Article.startYear/endYear/dateText/datePrecision.
 * Sự kiện không có hồ sơ riêng: người tham gia, nơi diễn ra khai bằng ArticleLink; nguyên nhân,
 * kết quả viết trong nội dung bài.
 *
 * Vài trường là MÃ CỐ ĐỊNH vì giao diện lọc / đổi nhãn theo mã — danh sách khớp frontend:
 *   site.siteType  ↔ nhãn loại di tích trong features/articles/components/ArticleProfilePanel.tsx
 *   site.preservation ↔ features/heritage/heritage.types.ts PreservationCategory
 *
 * Không có Kỷ nguyên / Phạm vi: Phạm vi trùng Topic gốc của bài; Kỷ nguyên không có bộ mốc chung đúng
 * cho cả lịch sử Việt Nam lẫn thế giới. Nhóm theo thời gian = Topic + Timeline.
 */

export const SITE_TYPE_CODES = [
  'ANCIENT_CAPITAL',
  'CITADEL',
  'PALACE',
  'BATTLEFIELD',
  'RESISTANCE_BASE',
  'TEMPLE',
  'ARCHAEOLOGICAL_SITE',
  'MONUMENT',
  'OTHER',
] as const;
export const SITE_PRESERVATION_CODES = [
  'INTACT',
  'MUSEUM_MEMORIAL',
  'ARCHAEOLOGICAL_RUIN',
  'RESTORED',
  'ACTIVE_SITE',
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
  roles?: string[];
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
  siteType?: string;
  recognizedYear?: string;
  preservation?: string;
  statusNote?: string;
  managingAgency?: string;
  architecturalStyle?: string;
}

export interface ArticleMetadata {
  aliases?: string[];
  sources?: string[];
  person?: PersonProfile;
  site?: SiteProfile;
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
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string' && v.trim()
        ? Number(v)
        : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

/** Mốc đời riêng: bắt buộc năm (≠ 0, âm = TCN) + tiêu đề; sắp theo thời gian. */
function milestones(v: unknown): PersonMilestone[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const list = v.filter(isObject).map((m, i) => {
    const title = text(m.title);
    const year = typeof m.year === 'number' ? m.year : Number(m.year);
    if (!title || !Number.isInteger(year) || year === 0) {
      throw new BadRequestException(
        `metadata.person.milestones[${i}]: cần năm (khác 0) và tiêu đề`,
      );
    }
    return compact<PersonMilestone>({
      year,
      month: intIn(m.month, 1, 12),
      day: intIn(m.day, 1, 31),
      title,
      note: text(m.note),
    })!;
  });
  list.sort(
    (a, b) =>
      a.year - b.year ||
      (a.month ?? 0) - (b.month ?? 0) ||
      (a.day ?? 0) - (b.day ?? 0),
  );
  return list.length ? list : undefined;
}

function code<T extends readonly string[]>(
  list: T,
  v: unknown,
  field: string,
): T[number] | undefined {
  const value = text(v);
  if (value === undefined) return undefined;
  if ((list as readonly string[]).includes(value)) return value as T[number];
  throw new BadRequestException(
    `metadata.${field}: mã "${value}" không hợp lệ`,
  );
}

/** Bỏ khoá undefined; object rỗng → undefined (không lưu "" hay {}). */
function compact<T extends object>(obj: T): T | undefined {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

const branch = (
  v: unknown,
  name: string,
): Record<string, unknown> | undefined => {
  if (v === undefined || v === null) return undefined;
  if (!isObject(v))
    throw new BadRequestException(`metadata.${name} phải là object`);
  return v;
};

/** Chuẩn hoá metadata gửi lên. Trả null nếu rỗng (xoá metadata của bài). */
export function normalizeArticleMetadata(raw: unknown): ArticleMetadata | null {
  if (raw === null || raw === undefined) return null;
  if (!isObject(raw)) throw new BadRequestException('metadata phải là object');

  const p = branch(raw.person, 'person');
  const s = branch(raw.site, 'site');

  const meta = compact<ArticleMetadata>({
    aliases: textList(raw.aliases),
    sources: textList(raw.sources),
    person: p
      ? compact<PersonProfile>({
          titles: textList(p.titles),
          roles: textList(p.roles),
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
          siteType: code(SITE_TYPE_CODES, s.siteType, 'site.siteType'),
          recognizedYear: text(s.recognizedYear),
          preservation: code(
            SITE_PRESERVATION_CODES,
            s.preservation,
            'site.preservation',
          ),
          statusNote: text(s.statusNote),
          managingAgency: text(s.managingAgency),
          architecturalStyle: text(s.architecturalStyle),
        })
      : undefined,
  });
  return meta ?? null;
}

/** Giá trị ghi vào cột articles.metadata — mọi nơi ghi (API, script ingest) đều phải qua đây. */
export function toArticleMetadataJson(
  raw: unknown,
): Prisma.InputJsonValue | Prisma.NullTypes.DbNull {
  const meta = normalizeArticleMetadata(raw);
  return meta ? (meta as Prisma.InputJsonValue) : Prisma.DbNull;
}
