"use client";

import { ChevronDown, ChevronsUpDown, Layers, Sparkles } from "lucide-react";
import { Button, Heading } from "./sk-ui";
import type { Era } from "./sk-types";

export function Minimap({
  eras,
  active,
  totalEvents,
  onJumpEra,
  onJumpSubEra,
}: {
  eras: Era[];
  active: string;
  totalEvents: number;
  onJumpEra: (era: Era) => void;
  onJumpSubEra: (subEraId: string) => void;
}) {
  return (
    <aside className="sk-minimap">
      <div className="sk-minimap-title">
        <Layers size={16} /> CÁC THỜI KỲ <ChevronsUpDown size={13} />
      </div>
      {eras.map((e, i) => (
        <div className="sk-tree-era" key={e.id}>
          <Button className="sk-tree-parent" onClick={() => onJumpEra(e)}>
            <span className="sk-era-number">0{i + 1}</span>
            <span>
              <strong>{e.title}</strong>
              <small>{e.periodLabel}</small>
            </span>
            <ChevronDown size={14} />
          </Button>
          <div className="sk-tree-children">
            {e.subEras.map((s) => (
              <Button
                key={s.id}
                className={active === s.id ? "sk-active" : ""}
                onClick={() => onJumpSubEra(s.id)}
              >
                <span className="sk-tree-dot" />
                <span>
                  {s.title}
                  <small>{s.periodLabel}</small>
                </span>
                {active === s.id && <span className="sk-active-dot" />}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <div className="sk-sidebar-note">
        <div className="sk-note-icon">
          <Sparkles size={20} />
        </div>
        <Heading level={3}>Lịch sử không hề xa.</Heading>
        <p>Chọn một dấu mốc và bắt đầu hành trình của riêng bạn.</p>
        <span>Học từ quá khứ, hiểu về hôm nay.</span>
      </div>
      <div className="sk-sidebar-bottom">
        <span className="sk-status-dot" /> Đang khám phá {totalEvents} dấu mốc
      </div>
    </aside>
  );
}
