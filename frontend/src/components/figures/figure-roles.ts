import {
  Crown,
  Feather,
  Flag,
  Landmark,
  Swords,
  UserRound,
  ShieldAlert,
  Scroll,
  BookOpen,
  Award,
  type LucideIcon,
} from "lucide-react";
import { CANONICAL_ROLE_LABELS, FIGURE_ROLE_LABELS, FigureRole } from "@/constants/enums";
import type { TaxonomyTermItem } from "@/services/entities/taxonomy.service";

/** Biểu tượng theo mã vai trò; hỗ trợ cả vai trò nhân vật và vai trò quân sự/chiến lược. */
export const ROLE_ICONS: Record<string, LucideIcon> = {
  [FigureRole.MONARCH]: Crown,
  [FigureRole.GENERAL]: Swords,
  [FigureRole.SCHOLAR]: Feather,
  [FigureRole.REVOLUTIONARY]: Flag,
  [FigureRole.POLITICIAN]: Landmark,
  COMMANDER: Swords,
  COMMANDER_IN_CHIEF: Swords,
  STRATEGIST: Scroll,
  MILITARY_ADVISER: Scroll,
  WARRIOR: ShieldAlert,
  HERO: Award,
  POET: Feather,
  WRITER: BookOpen,
  LEADER: Crown,
};

export interface FigureRoleOption {
  code: string;
  label: string;
  Icon: LucideIcon;
}

export const figureRoleIcon = (code: string): LucideIcon => {
  const normalized = (code || '').trim().toUpperCase();
  return ROLE_ICONS[normalized] ?? UserRound;
};

/** Mã vai trò của nhân vật (bỏ trùng, bỏ rỗng). */
export function figureRoles(roles: string[] | null | undefined): string[] {
  return [...new Set((roles ?? []).filter(Boolean))];
}

/**
 * Hàm phân giải nhãn vai trò độc lập (Strategy Pattern):
 * 1. Tra cứu trong danh mục Taxonomy (theo code và theo mảng aliases)
 * 2. Tra cứu từ điển ánh xạ ngữ nghĩa CANONICAL_ROLE_LABELS
 * 3. Chuẩn hóa chuỗi code SNAKE_CASE sang Title Case nếu là mã tùy chỉnh chưa có trong từ điển
 */
export function resolveFigureRoleLabel(
  code: string,
  taxonomyTerms: TaxonomyTermItem[] = []
): string {
  if (!code) return '';
  const cleanCode = code.trim();
  const upper = cleanCode.toUpperCase();
  const lower = cleanCode.toLowerCase();

  // 1. Tra cứu trực tiếp theo mã code chính xác trong Taxonomy
  const directMatch = taxonomyTerms.find(
    (t) => t.code.toUpperCase() === upper
  );
  if (directMatch?.label) return directMatch.label;

  // 2. Tra cứu qua mảng bí danh (aliases) của các term trong Taxonomy (ví dụ: STRATEGIST là alias của MILITARY_ADVISER)
  const aliasMatch = taxonomyTerms.find((t) =>
    t.aliases?.some((a) => a.trim().toLowerCase() === lower || a.trim().toUpperCase() === upper)
  );
  if (aliasMatch?.label) return aliasMatch.label;

  // 3. Tra cứu qua Từ điển ánh xạ ngữ nghĩa chuẩn hóa tập trung
  if (CANONICAL_ROLE_LABELS[upper]) {
    return CANONICAL_ROLE_LABELS[upper];
  }

  // 4. Tra cứu qua bảng nhãn FigureRole cũ
  if (FIGURE_ROLE_LABELS[cleanCode as FigureRole]) {
    return FIGURE_ROLE_LABELS[cleanCode as FigureRole];
  }

  // 5. Nếu chuỗi đã chứa dấu tiếng Việt hoặc khoảng trắng (người dùng tự gõ nhãn), giữ nguyên
  if (/[\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanCode)) {
    return cleanCode;
  }

  // 6. Nếu là mã dạng SNAKE_CASE mới, format thành chuỗi đọc được thay vì in hoa trơ trọi
  return cleanCode
    .split(/[_\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
