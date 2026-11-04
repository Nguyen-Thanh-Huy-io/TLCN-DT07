/**
 * Hồ sơ di sản mở rộng của một di tích, lưu trong HistoricalEntity.metadata.heritage
 * (không cần migration). Mọi trường đều tùy chọn; dữ liệu sai kiểu bị bỏ qua.
 *
 * metadata.heritage = {
 *   recognizedYear, architecturalStyle, openingHours,
 *   constructionTimeline: [{ dateLabel, dynasty, actionType, description }],
 *   subStructures: [{ name, type, periodBuilt, description, imageUrl }],
 *   thenAndNow: { ancientImageUrl, ancientLabel, modernImageUrl, modernLabel }
 * }
 */
export const HERITAGE_METADATA_KEY = 'heritage';

/** Chuỗi không rỗng sau khi cắt khoảng trắng, ngược lại null (tự định nghĩa để không import vòng với public-content.mapper). */
function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const ACTION_TYPES = ['FOUNDED', 'EXPANDED', 'DAMAGED', 'RESTORED'] as const;
const STRUCTURE_TYPES = ['ARCHITECTURE', 'NATIONAL_TREASURE'] as const;

export interface HeritageMilestone {
  id: string;
  dateLabel: string;
  dynasty: string;
  actionType: (typeof ACTION_TYPES)[number];
  description: string;
}

export interface HeritageSubStructure {
  id: string;
  name: string;
  type: (typeof STRUCTURE_TYPES)[number];
  periodBuilt: string;
  description: string;
  imageUrl: string | null;
}

export interface HeritageThenAndNow {
  ancientImageUrl: string;
  ancientLabel: string;
  modernImageUrl: string;
  modernLabel: string;
}

export interface HeritageProfile {
  recognizedYear: string | null;
  architecturalStyle: string | null;
  openingHours: string | null;
  constructionTimeline: HeritageMilestone[];
  subStructures: HeritageSubStructure[];
  thenAndNow: HeritageThenAndNow | null;
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};

const asArray = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.map(asRecord) : [];

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function toHeritageProfile(metadata: unknown): HeritageProfile {
  const raw = asRecord(asRecord(metadata)[HERITAGE_METADATA_KEY]);
  const thenAndNow = asRecord(raw.thenAndNow);
  const ancientImageUrl = textOrNull(thenAndNow.ancientImageUrl);
  const modernImageUrl = textOrNull(thenAndNow.modernImageUrl);

  return {
    recognizedYear: textOrNull(raw.recognizedYear),
    architecturalStyle: textOrNull(raw.architecturalStyle),
    openingHours: textOrNull(raw.openingHours),
    constructionTimeline: asArray(raw.constructionTimeline)
      .filter((m) => textOrNull(m.dateLabel) && textOrNull(m.description))
      .map((m, i) => ({
        id: `m${i}`,
        dateLabel: textOrNull(m.dateLabel) as string,
        dynasty: textOrNull(m.dynasty) ?? '',
        actionType: oneOf(m.actionType, ACTION_TYPES, 'EXPANDED'),
        description: textOrNull(m.description) as string,
      })),
    subStructures: asArray(raw.subStructures)
      .filter((s) => textOrNull(s.name))
      .map((s, i) => ({
        id: `s${i}`,
        name: textOrNull(s.name) as string,
        type: oneOf(s.type, STRUCTURE_TYPES, 'ARCHITECTURE'),
        periodBuilt: textOrNull(s.periodBuilt) ?? '',
        description: textOrNull(s.description) ?? '',
        imageUrl: textOrNull(s.imageUrl),
      })),
    thenAndNow:
      ancientImageUrl && modernImageUrl
        ? {
            ancientImageUrl,
            ancientLabel: textOrNull(thenAndNow.ancientLabel) ?? 'Tư liệu xưa',
            modernImageUrl,
            modernLabel:
              textOrNull(thenAndNow.modernLabel) ?? 'Diện mạo ngày nay',
          }
        : null,
  };
}
