import type { PublicFigureProfileDto, PublicFigureRelationDto, PublicPeriodDto } from "@/services/entities/landing.service";

export type RelationCategory = "FAMILY" | "ALLY" | "RIVAL" | "CONTEMPORARY";

export const RELATION_CATEGORY_LABELS: Record<RelationCategory, string> = {
  FAMILY: "Gia tộc",
  ALLY: "Quân thần",
  RIVAL: "Đối trọng",
  CONTEMPORARY: "Cùng thời",
};

// Relation types not listed here (e.g. OTHER) fall under "Cùng thời".
const CATEGORY_BY_RELATION: Record<string, RelationCategory> = {
  CHILD_OF: "FAMILY",
  PARENT_OF: "FAMILY",
  SPOUSE_OF: "FAMILY",
  SIBLING_OF: "FAMILY",
  SERVED_UNDER: "ALLY",
  ALLIED_WITH: "ALLY",
  LEADER_OF: "ALLY",
  MEMBER_OF: "ALLY",
  FOUNDER_OF: "ALLY",
  VASSAL_OF: "ALLY",
  SUCCESSOR_TO: "ALLY",
  OPPOSED_TO: "RIVAL",
  CONTEMPORARY_OF: "CONTEMPORARY",
};

// Describes the *other* person as seen from the profile being viewed.
// A relation "A —SUCCESSOR_TO→ B" means A succeeded B: from A's profile B is the predecessor.
const TARGET_LABELS: Record<string, { OUTGOING: string; INCOMING: string }> = {
  SUCCESSOR_TO: { OUTGOING: "Người tiền nhiệm", INCOMING: "Người kế nhiệm" },
  SERVED_UNDER: { OUTGOING: "Quân vương / bề trên", INCOMING: "Bề tôi, tướng dưới quyền" },
  CONTEMPORARY_OF: { OUTGOING: "Cùng thời", INCOMING: "Cùng thời" },
  CHILD_OF: { OUTGOING: "Cha / mẹ", INCOMING: "Con" },
  PARENT_OF: { OUTGOING: "Con", INCOMING: "Cha / mẹ" },
  SPOUSE_OF: { OUTGOING: "Phối ngẫu", INCOMING: "Phối ngẫu" },
  SIBLING_OF: { OUTGOING: "Anh chị em", INCOMING: "Anh chị em" },
  ALLIED_WITH: { OUTGOING: "Đồng minh", INCOMING: "Đồng minh" },
  OPPOSED_TO: { OUTGOING: "Đối thủ", INCOMING: "Đối thủ" },
  LEADER_OF: { OUTGOING: "Thuộc quyền lãnh đạo", INCOMING: "Người lãnh đạo" },
  MEMBER_OF: { OUTGOING: "Cấp trên / người đứng đầu", INCOMING: "Thành viên, cấp dưới" },
  VASSAL_OF: { OUTGOING: "Bề trên", INCOMING: "Bề tôi / chư hầu" },
};

export function relationCategory(relation: PublicFigureRelationDto): RelationCategory {
  return CATEGORY_BY_RELATION[relation.relationType] || "CONTEMPORARY";
}

export function relationTargetLabel(relation: PublicFigureRelationDto): string {
  const mapped = TARGET_LABELS[relation.relationType];
  if (mapped) return mapped[relation.direction];
  return relation.relationType;
}

export interface FigureView extends PublicFigureProfileDto {
  eraId: string | null;
  eraTitle: string | null;
  subEraSlug: string | null;
  subEraTitle: string | null;
  lifespanLabel: string;
  sortYear: number;
}

function formatYear(year: number | null): string | null {
  if (year == null) return null;
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

function formatDateLabel(raw: string | null | undefined, year: number | null): string | null {
  if (!raw) return formatYear(year);
  return raw
    .replace(/(\d)(?=\p{Lu}\p{Ll})/gu, "$1 · ")
    .replace(/(\))(?=\p{Lu}\p{Ll})/gu, "$1 · ")
    .replace(/(TCN)(?=\p{Lu}\p{Ll})/gu, "$1 · ");
}

function lifespanOf(figure: PublicFigureProfileDto): string {
  const birth = formatDateLabel(figure.birthDateLabel, figure.birthYear);
  const death = formatDateLabel(figure.deathDateLabel, figure.deathYear);
  if (!birth && !death) return "Chưa rõ năm sinh – mất";
  return `${birth || "?"} – ${death || "?"}`;
}

export function buildFigureViews(figures: PublicFigureProfileDto[], periods: PublicPeriodDto[]): FigureView[] {
  const bySlug = new Map(periods.map((p) => [p.slug, p]));
  const byId = new Map(periods.map((p) => [p.id, p]));
  return figures.map((figure) => {
    const leaf = figure.periodSlug ? bySlug.get(figure.periodSlug) : undefined;
    const top = leaf ? (leaf.parentId ? byId.get(leaf.parentId) : leaf) : undefined;
    const firstEventYear = figure.events[0]?.startYear;
    return {
      ...figure,
      eraId: top?.id ?? null,
      eraTitle: top?.name ?? null,
      subEraSlug: leaf?.slug ?? null,
      subEraTitle: leaf?.name ?? null,
      lifespanLabel: lifespanOf(figure),
      sortYear: figure.birthYear ?? firstEventYear ?? figure.deathYear ?? Number.MAX_SAFE_INTEGER,
    };
  });
}

export const ARTICLE_ERA_LABELS: Record<string, string> = {
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  EARLY_MODERN: "Cận đại",
  MODERN: "Hiện đại",
};

export const ARTICLE_REGION_LABELS: Record<string, string> = {
  VIETNAM: "Việt Nam",
  WORLD: "Thế giới",
};

export const PERSON_ROLE_LABELS: Record<string, string> = {
  MONARCH: "Quân chủ",
  GENERAL: "Tướng lĩnh",
  COMMANDER: "Chỉ huy",
  COMMANDER_IN_CHIEF: "Tổng tư lệnh",
  STRATEGIST: "Chiến lược gia",
  MILITARY_ADVISER: "Quân sư",
  WARRIOR: "Chiến binh",
  POLITICIAN: "Chính trị gia",
  STATESMAN: "Chính khách",
  DIPLOMAT: "Nhà ngoại giao",
  REFORMER: "Nhà cải cách",
  SCHOLAR: "Học giả",
  CULTURAL_FIGURE: "Danh nhân văn hóa",
  POET: "Thi sĩ",
  WRITER: "Nhà văn",
  PHILOSOPHER: "Triết gia",
  SCIENTIST: "Nhà khoa học",
  RELIGIOUS_FIGURE: "Nhân vật tôn giáo",
  REVOLUTIONARY: "Nhà cách mạng",
  PATRIOT: "Nhà yêu nước",
  HERO: "Anh hùng dân tộc",
};

export function personRoleLabel(code: string): string {
  return PERSON_ROLE_LABELS[code] ?? code;
}

export function articleEraLabel(code: string | null | undefined): string | null {
  return code ? (ARTICLE_ERA_LABELS[code] ?? code) : null;
}

export function articleRegionLabel(code: string | null | undefined): string | null {
  return code ? (ARTICLE_REGION_LABELS[code] ?? code) : null;
}

export function periodTitle(periods: PublicPeriodDto[], slug: string | null): string | null {
  if (!slug) return null;
  return periods.find((p) => p.slug === slug)?.name ?? null;
}

export const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export const paletteFor = (id: string) =>
  ["moss", "ochre", "slate", "clay"][[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4];
