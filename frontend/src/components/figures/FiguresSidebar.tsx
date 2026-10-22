"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/timeline/sk-ui";
import { FIGURE_ROLE_LABELS, FigureRole } from "@/constants/enums";
import { FIGURE_ROLE_ICONS, FIGURE_ROLE_ORDER } from "./figure-roles";

/** Lối tắt lọc theo vai trò — đồng bộ với nhóm "Vai trò" trong hộp thoại bộ lọc, chọn được nhiều. */
export function FiguresSidebar({
  roles,
  onToggleRole,
  onClearRoles,
  total,
  countByRole,
}: {
  roles: string[];
  onToggleRole: (role: string) => void;
  onClearRoles: () => void;
  total: number;
  countByRole: Map<FigureRole, number>;
}) {
  return (
    <aside className="sk-figures-sidebar">
      <span className="sk-sidebar-label">KHÁM PHÁ THEO VAI TRÒ</span>
      <Button className={`sk-role-filter ${roles.length === 0 ? "sk-active" : ""}`} onClick={onClearRoles}>
        <Users size={17} />
        <span>Tất cả nhân vật</span>
        <small>{total}</small>
      </Button>
      {FIGURE_ROLE_ORDER.map((r) => {
        const Icon = FIGURE_ROLE_ICONS[r];
        const on = roles.includes(r);
        return (
          <Button key={r} className={`sk-role-filter ${on ? "sk-active" : ""}`} aria-pressed={on} onClick={() => onToggleRole(r)}>
            <Icon size={17} />
            <span className="sk-role-filter-text">{FIGURE_ROLE_LABELS[r]}</span>
            <small>{countByRole.get(r) ?? 0}</small>
          </Button>
        );
      })}
    </aside>
  );
}
