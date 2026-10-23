"use client";

import { useMemo } from "react";
import { Crown, Feather, Flag, Landmark, Swords, UserRound, type LucideIcon } from "lucide-react";
import { FIGURE_ROLE_LABELS, FigureRole } from "@/constants/enums";
import { usePublicTaxonomyTerms } from "@/features/taxonomy/usePublicTaxonomy";

/** Biểu tượng theo mã vai trò; vai trò mới thêm trong "Danh mục dùng chung" dùng biểu tượng chung. */
const ROLE_ICONS: Record<string, LucideIcon> = {
  [FigureRole.MONARCH]: Crown,
  [FigureRole.GENERAL]: Swords,
  [FigureRole.SCHOLAR]: Feather,
  [FigureRole.REVOLUTIONARY]: Flag,
  [FigureRole.POLITICIAN]: Landmark,
};

export interface FigureRoleOption {
  code: string;
  label: string;
  Icon: LucideIcon;
}

const FALLBACK_OPTIONS: FigureRoleOption[] = (Object.keys(FIGURE_ROLE_LABELS) as FigureRole[]).map((code) => ({
  code,
  label: FIGURE_ROLE_LABELS[code],
  Icon: ROLE_ICONS[code],
}));

export const figureRoleIcon = (code: string): LucideIcon => ROLE_ICONS[code] ?? UserRound;

/** Mã vai trò của nhân vật (bỏ trùng, bỏ rỗng). */
export function figureRoles(roles: string[] | null | undefined): string[] {
  return [...new Set((roles ?? []).filter(Boolean))];
}

/**
 * Vai trò nhân vật theo nhóm FIGURE_ROLE của "Danh mục dùng chung" (thứ tự, nhãn do CMS quản lý);
 * chưa tải được thì dùng nhãn enum cũ để giao diện không trống.
 */
export function useFigureRoles() {
  const terms = usePublicTaxonomyTerms("FIGURE_ROLE");
  return useMemo(() => {
    const options: FigureRoleOption[] = terms.length
      ? terms.map((t) => ({ code: t.code, label: t.label, Icon: figureRoleIcon(t.code) }))
      : FALLBACK_OPTIONS;
    const byCode = new Map(options.map((o) => [o.code, o]));
    const label = (code: string) => byCode.get(code)?.label ?? FIGURE_ROLE_LABELS[code as FigureRole] ?? code;
    return { options, label, icon: figureRoleIcon };
  }, [terms]);
}
