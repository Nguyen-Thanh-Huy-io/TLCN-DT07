"use client";

import { Landmark, Users } from "lucide-react";
import { Button } from "@/components/timeline/sk-ui";
import type { FilterOption } from "./FiguresFilterBar";

export function FiguresSidebar({
  eras,
  era,
  onEra,
  total,
  countByEra,
}: {
  eras: FilterOption[];
  era: string;
  onEra: (id: string) => void;
  total: number;
  countByEra: Map<string, number>;
}) {
  return (
    <aside className="sk-figures-sidebar">
      <span className="sk-sidebar-label">KHÁM PHÁ THEO THỜI KỲ</span>
      <Button className={`sk-role-filter ${!era ? "sk-active" : ""}`} onClick={() => onEra("")}>
        <Users size={17} />
        <span>Tất cả nhân vật</span>
        <small>{total}</small>
      </Button>
      {eras.map((e) => (
        <Button
          key={e.id}
          className={`sk-role-filter ${era === e.id ? "sk-active" : ""}`}
          onClick={() => onEra(era === e.id ? "" : e.id)}
        >
          <Landmark size={17} />
          <span className="sk-role-filter-text">{e.title}</span>
          <small>{countByEra.get(e.id) ?? 0}</small>
        </Button>
      ))}
    </aside>
  );
}
