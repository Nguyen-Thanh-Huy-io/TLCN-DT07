"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { Button } from "./sk-ui";
import type { Era } from "./sk-types";

/** "Giai đoạn Trưng Nữ Vương (40 - 43)" → "Giai đoạn Trưng Nữ Vương": năm đã có ở chip riêng. */
export function shortTitle(title: string): string {
  return title.replace(/\s*\([^()]*\d[^()]*\)\s*$/, "").trim() || title;
}

/** Tên giai đoạn trong cột hẹp: bỏ tiền tố lặp lại ("Thời kỳ", "Giai đoạn"...) — tên đầy đủ ở tooltip. */
function sidebarName(title: string): string {
  const short = shortTitle(title).replace(/^(Thời kỳ|Thời đại|Giai đoạn)\s+/i, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** "2879 TCN – 208 TCN" → "2879–208 TCN" khi hai đầu cùng hậu tố, để chip năm gọn. */
function compactPeriod(label: string): string {
  const cleaned = label.replace(/[()]/g, "").trim();
  const match = cleaned.match(/^(\d+)\s*(TCN|CN)?\s*[–-]\s*(\d+|Nay)\s*(TCN|CN)?$/);
  if (!match) return cleaned;
  const [, from, fromEra, to, toEra] = match;
  if (fromEra && fromEra === toEra) return `${from}–${to} ${toEra}`;
  return `${from}${fromEra ? ` ${fromEra}` : ""}–${to}${toEra ? ` ${toEra}` : ""}`;
}

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
  // Chỉ mở thời kỳ đang xem; người dùng có thể mở/thu thêm bằng tay.
  const activeEraId = useMemo(() => eras.find((e) => e.subEras.some((s) => s.id === active))?.id, [eras, active]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (eraId: string) => toggled[eraId] ?? (eraId === (activeEraId ?? eras[0]?.id));

  return (
    <aside className="sk-minimap">
      <div className="sk-minimap-title">
        <Layers size={16} /> Các thời kỳ
      </div>
      {eras.length === 0 && <p className="sk-minimap-empty">Không có thời kỳ nào khớp bộ lọc.</p>}
      {eras.map((e, i) => {
        const open = isOpen(e.id);
        const nodeCount = e.subEras.reduce((n, s) => n + s.timeNodes.length, 0);
        return (
          <div className={`sk-tree-era ${open ? "sk-open" : ""}`} key={e.id}>
            <div className="sk-tree-parent-row">
              <Button className="sk-tree-parent" onClick={() => onJumpEra(e)} title={e.title}>
                <span className="sk-era-number">{String(i + 1).padStart(2, "0")}</span>
                <span className="sk-tree-text">
                  <strong>{shortTitle(e.title)}</strong>
                  <small>
                    {compactPeriod(e.periodLabel)} · {e.subEras.length} giai đoạn · {nodeCount} mốc
                  </small>
                </span>
              </Button>
              <Button
                className="sk-tree-toggle"
                aria-label={open ? "Thu gọn thời kỳ" : "Mở thời kỳ"}
                aria-expanded={open}
                onClick={() => setToggled((t) => ({ ...t, [e.id]: !open }))}
              >
                <ChevronDown size={14} />
              </Button>
            </div>
            {open && (
              <div className="sk-tree-children">
                {e.subEras.map((s) => (
                  <Button
                    key={s.id}
                    className={active === s.id ? "sk-active" : ""}
                    onClick={() => onJumpSubEra(s.id)}
                    title={`${s.title} — ${s.timeNodes.length} mốc`}
                  >
                    <span className="sk-tree-dot" />
                    <span className="sk-tree-name">
                      {sidebarName(s.title)}
                      <small>
                        {compactPeriod(s.periodLabel)} · {s.timeNodes.length} mốc
                      </small>
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="sk-sidebar-bottom">
        <span className="sk-status-dot" /> Đang khám phá {totalEvents} dấu mốc
      </div>
    </aside>
  );
}
