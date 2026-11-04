"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/timeline/sk-ui";
import { useFigureRoles } from "./figure-roles";

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
  countByRole: Map<string, number>;
}) {
  const { options } = useFigureRoles();
  return (
    <aside className="sk-figures-sidebar">
      <span className="sk-sidebar-label">KHÁM PHÁ THEO VAI TRÒ</span>
      <Button className={`sk-role-filter ${roles.length === 0 ? "sk-active" : ""}`} onClick={onClearRoles}>
        <Users size={17} />
        <span>Tất cả nhân vật</span>
        <small>{total}</small>
      </Button>
      {options.map(({ code: r, label, Icon }) => {
        const on = roles.includes(r);
        return (
          <Button key={r} className={`sk-role-filter ${on ? "sk-active" : ""}`} aria-pressed={on} onClick={() => onToggleRole(r)}>
            <Icon size={17} />
            <span className="sk-role-filter-text">{label}</span>
            <small>{countByRole.get(r) ?? 0}</small>
          </Button>
        );
      })}
    </aside>
  );
}
