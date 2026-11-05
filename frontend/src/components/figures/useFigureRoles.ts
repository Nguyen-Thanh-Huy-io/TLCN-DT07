"use client";

import { useMemo } from "react";
import { FIGURE_ROLE_LABELS, FigureRole } from "@/constants/enums";
import { usePublicTaxonomyTerms } from "@/features/taxonomy/usePublicTaxonomy";
import {
  figureRoleIcon,
  resolveFigureRoleLabel,
  type FigureRoleOption,
} from "./figure-roles";

/**
 * Hook phân giải vai trò nhân vật:
 * Chỉ lấy danh mục FIGURE_ROLE dành riêng cho nhân vật lịch sử (Vua chúa, Tướng lĩnh, Học giả, Cách mạng...).
 * Không gộp ROLE_TYPE vì ROLE_TYPE dành cho vai trò tham gia sự kiện/phát biểu (Chỉ huy, Phe đối đầu, v.v.).
 */
export function useFigureRoles() {
  const figureTerms = usePublicTaxonomyTerms("FIGURE_ROLE");

  return useMemo(() => {
    // Tạo danh sách các tùy chọn hiển thị theo danh mục FIGURE_ROLE
    const options: FigureRoleOption[] = figureTerms.length
      ? figureTerms.map((t) => ({
          code: t.code,
          label: t.label,
          Icon: figureRoleIcon(t.code),
        }))
      : (Object.keys(FIGURE_ROLE_LABELS) as FigureRole[]).map((code) => ({
          code,
          label: FIGURE_ROLE_LABELS[code],
          Icon: figureRoleIcon(code),
        }));

    const label = (code: string) => resolveFigureRoleLabel(code, figureTerms);

    return { options, label, icon: figureRoleIcon };
  }, [figureTerms]);
}
