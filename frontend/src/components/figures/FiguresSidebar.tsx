"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/timeline/sk-ui";
import { FIGURE_ROLE_LABELS, FigureRole } from "@/constants/enums";
import { FIGURE_ROLE_ICONS, FIGURE_ROLE_ORDER } from "./figure-roles";

export function FiguresSidebar({
  role,
  onRole,
  total,
  countByRole,
}: {
  role: string;
  onRole: (role: string) => void;
  total: number;
  countByRole: Map<FigureRole, number>;
}) {
  return (
    <aside className="sk-figures-sidebar">
      <span className="sk-sidebar-label">KHÁM PHÁ THEO VAI TRÒ</span>
      <Button className={`sk-role-filter ${!role ? "sk-active" : ""}`} onClick={() => onRole("")}>
        <Users size={17} />
        <span>Tất cả nhân vật</span>
        <small>{total}</small>
      </Button>
      {FIGURE_ROLE_ORDER.map((r) => {
        const Icon = FIGURE_ROLE_ICONS[r];
        return (
          <Button
            key={r}
            className={`sk-role-filter ${role === r ? "sk-active" : ""}`}
            onClick={() => onRole(role === r ? "" : r)}
          >
            <Icon size={17} />
            <span className="sk-role-filter-text">{FIGURE_ROLE_LABELS[r]}</span>
            <small>{countByRole.get(r) ?? 0}</small>
          </Button>
        );
      })}
    </aside>
  );
}
