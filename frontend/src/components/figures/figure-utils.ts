import type { PublicFigureProfileDto, PublicFigureRelationDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { TimelineRelationDirection } from "@/components/timeline/sk-types";

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

const FAMILY_RELATION_PATTERN = /cha|mẹ|con|vợ|chồng|phối ngẫu|anh|chị|em|chú|bác|ông|bà|cháu|họ hàng|gia tộc/i;
const RIVAL_RELATION_PATTERN = /đối thủ|đối trọng|đánh bại|chống|kẻ thù|phản/i;
const ALLY_RELATION_PATTERN = /phụng sự|kế vị|tiền nhiệm|đồng minh|tướng|vua|chúa|môn đệ|thầy|học trò|cùng hội|sáng lập/i;

export function relationCategory(relation: PublicFigureRelationDto): RelationCategory {
  const mapped = CATEGORY_BY_RELATION[relation.relationType];
  if (mapped) return mapped;
  const label = relation.relationType ?? "";
  if (FAMILY_RELATION_PATTERN.test(label)) return "FAMILY";
  if (RIVAL_RELATION_PATTERN.test(label)) return "RIVAL";
  if (ALLY_RELATION_PATTERN.test(label)) return "ALLY";
  return "CONTEMPORARY";
}

/**
 * Nhãn quan hệ hiển thị trên sơ đồ và danh sách:
 * - Nếu là mã cố định cũ trong TARGET_LABELS → đổi sang nhãn theo chiều.
 * - Với nhãn chữ tự do (ArticleLink.label, khai báo theo chiều Nguồn → Đích):
 *   OUTGOING (nhân vật đang xem → người kia): "Nhãn →"
 *   INCOMING (người kia → nhân vật đang xem): "← Nhãn"
 */
export function relationTargetLabel(relation: PublicFigureRelationDto): string {
  const mapped = TARGET_LABELS[relation.relationType];
  if (mapped) return mapped[relation.direction];
  return relation.direction === TimelineRelationDirection.INCOMING ? `← ${relation.relationType}` : `${relation.relationType} →`;
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

/** Năm sinh – mất chỉ lấy từ cột năm của bài (startYear/endYear). */
function lifespanOf(figure: PublicFigureProfileDto): string {
  const birth = formatYear(figure.birthYear);
  const death = formatYear(figure.deathYear);
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

export const paletteFor = (id: string) =>
  ["moss", "ochre", "slate", "clay"][[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4];
