import type { PublicFigureProfileDto, PublicFigureRelationDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { ENTITY_RELATION_TYPE_LABELS, EntityRelationType } from "@/constants/enums";

export type RelationCategory = "FAMILY" | "ALLY" | "RIVAL" | "CONTEMPORARY";

export const RELATION_CATEGORY_LABELS: Record<RelationCategory, string> = {
  FAMILY: "Gia tộc",
  ALLY: "Đồng minh / Kế tục",
  RIVAL: "Đối địch",
  CONTEMPORARY: "Liên hệ khác",
};

const CATEGORY_BY_RELATION: Record<string, RelationCategory> = {
  CHILD_OF: "FAMILY",
  PARENT_OF: "FAMILY",
  SPOUSE_OF: "FAMILY",
  SIBLING_OF: "FAMILY",
  ALLIED_WITH: "ALLY",
  LEADER_OF: "ALLY",
  MEMBER_OF: "ALLY",
  FOUNDER_OF: "ALLY",
  VASSAL_OF: "ALLY",
  SUCCESSOR_TO: "ALLY",
  OPPOSED_TO: "RIVAL",
};

// Describes the *other* person as seen from the profile being viewed.
// A relation "A —SUCCESSOR_TO→ B" means A succeeded B: from A's profile B is the predecessor.
const TARGET_LABELS: Record<string, { OUTGOING: string; INCOMING: string }> = {
  SUCCESSOR_TO: { OUTGOING: "Người tiền nhiệm", INCOMING: "Người kế nhiệm" },
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
  const base = ENTITY_RELATION_TYPE_LABELS[relation.relationType as EntityRelationType] || relation.relationType;
  return relation.direction === "INCOMING" ? `${base} (chiều ngược)` : base;
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

function lifespanOf(figure: PublicFigureProfileDto): string {
  const birth = figure.birthDateLabel || formatYear(figure.birthYear);
  const death = figure.deathDateLabel || formatYear(figure.deathYear);
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

export function periodTitle(periods: PublicPeriodDto[], slug: string | null): string | null {
  if (!slug) return null;
  return periods.find((p) => p.slug === slug)?.name ?? null;
}

export const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export const paletteFor = (id: string) =>
  ["moss", "ochre", "slate", "clay"][[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4];
