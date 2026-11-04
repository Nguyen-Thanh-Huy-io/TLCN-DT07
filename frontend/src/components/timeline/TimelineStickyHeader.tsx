"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Layers, Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Era } from "./sk-types";
import { shortTitle } from "./Minimap";

function sidebarName(title: string): string {
  const short = shortTitle(title).replace(/^(Thời kỳ|Thời đại|Giai đoạn)\s+/i, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function compactPeriod(label: string): string {
  const cleaned = label.replace(/[()]/g, "").trim();
  const match = cleaned.match(/^(\d+)\s*(TCN|CN)?\s*[–-]\s*(\d+|Nay)\s*(TCN|CN)?$/);
  if (!match) return cleaned;
  const [, from, fromEra, to, toEra] = match;
  if (fromEra && fromEra === toEra) return `${from}–${to} ${toEra}`;
  return `${from}${fromEra ? ` ${fromEra}` : ""}–${to}${toEra ? ` ${toEra}` : ""}`;
}

export interface TimelineStickyHeaderProps {
  eras: Era[];
  activeSubEraId: string;
  totalEvents: number;
  onJumpEra: (era: Era) => void;
  onJumpSubEra: (subEraId: string) => void;
  onToggleDock?: () => void;
  isDocked?: boolean;
}

export function TimelineStickyHeader({
  eras,
  activeSubEraId,
  totalEvents,
  onJumpEra,
  onJumpSubEra,
  onToggleDock,
  isDocked = false,
}: TimelineStickyHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toggledEras, setToggledEras] = useState<Record<string, boolean>>({});

  // Nhận diện thời kỳ lớn và giai đoạn nhỏ đang active theo tiến trình cuộn
  const currentInfo = useMemo(() => {
    for (let ei = 0; ei < eras.length; ei++) {
      const era = eras[ei];
      const subIdx = era.subEras.findIndex((s) => s.id === activeSubEraId);
      if (subIdx !== -1) {
        return {
          eraIndex: ei + 1,
          era,
          subEra: era.subEras[subIdx],
        };
      }
    }
    const first = eras[0];
    return {
      eraIndex: 1,
      era: first,
      subEra: first?.subEras[0],
    };
  }, [eras, activeSubEraId]);

  const toggleEraAccordion = (eraId: string) => {
    setToggledEras((prev) => ({
      ...prev,
      [eraId]: !(prev[eraId] ?? (eraId === currentInfo.era?.id)),
    }));
  };

  const isEraOpen = (eraId: string) => {
    return toggledEras[eraId] ?? (eraId === currentInfo.era?.id);
  };

  if (!currentInfo.era) return null;

  return (
    <div className="sk-sticky-header-wrapper">
      <div className="sk-sticky-timeline-bar" role="navigation" aria-label="Vị trí thời kỳ hiện tại">
        {/* Breadcrumb theo dõi cuộn: Thời kỳ lớn › Giai đoạn nhỏ */}
        <div className="sk-sticky-breadcrumb">
          <span className="sk-sticky-era-badge" title={`Thời kỳ số ${currentInfo.eraIndex}`}>
            {String(currentInfo.eraIndex).padStart(2, "0")}
          </span>

          <button
            type="button"
            className="sk-sticky-crumb-btn"
            onClick={() => onJumpEra(currentInfo.era)}
            title={`Cuộn đến đầu: ${currentInfo.era.title}`}
          >
            <strong className="sk-sticky-crumb-title">{shortTitle(currentInfo.era.title)}</strong>
            <span className="sk-sticky-crumb-period">({compactPeriod(currentInfo.era.periodLabel)})</span>
          </button>

          {currentInfo.subEra && (
            <>
              <ChevronRight size={13} className="sk-sticky-sep" aria-hidden="true" />
              <button
                type="button"
                className="sk-sticky-crumb-btn sk-sticky-sub-crumb"
                onClick={() => onJumpSubEra(currentInfo.subEra.id)}
                title={`Cuộn đến giai đoạn: ${currentInfo.subEra.title}`}
              >
                <span className="sk-sticky-sub-title">{sidebarName(currentInfo.subEra.title)}</span>
                <span className="sk-sticky-crumb-period">· {compactPeriod(currentInfo.subEra.periodLabel)}</span>
              </button>
            </>
          )}
        </div>

        {/* Nút tác vụ bên phải: Đổi thời kỳ (Dropdown Popover) & Tùy chọn Ghim */}
        <div className="sk-sticky-actions">
          <button
            type="button"
            className={`sk-sticky-menu-trigger ${isMenuOpen ? "sk-active" : ""}`}
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-expanded={isMenuOpen}
            title="Mở danh mục các thời kỳ để nhảy nhanh"
          >
            <Layers size={13} className="text-emerald-700" />
            <span>Thời kỳ ({currentInfo.eraIndex}/{eras.length})</span>
            <ChevronDown size={13} className={`sk-chevron-icon ${isMenuOpen ? "sk-rotated" : ""}`} />
          </button>

          {onToggleDock && (
            <button
              type="button"
              className="sk-sticky-dock-trigger"
              onClick={onToggleDock}
              title={isDocked ? "Thu gọn sang thanh bám đỉnh" : "Ghim cố định thành cột bên trái"}
            >
              <Compass size={13} />
              <span className="sk-dock-text">{isDocked ? "Bỏ ghim" : "Ghim cột bên"}</span>
            </button>
          )}

          {/* Menu Dropdown đổ xuống ngay dưới nút bấm */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div
                  className="sk-sticky-dropdown-backdrop"
                  onClick={() => setIsMenuOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  className="sk-sticky-dropdown-popover"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="sk-sticky-popover-header">
                    <div>
                      <strong>Danh mục các thời kỳ lịch sử</strong>
                      <small>Tổng cộng {totalEvents} dấu mốc</small>
                    </div>
                    <button
                      type="button"
                      className="sk-sticky-popover-close"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Đóng danh mục"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="sk-sticky-popover-list">
                    {eras.map((e, i) => {
                      const open = isEraOpen(e.id);
                      const isCurrent = e.id === currentInfo.era.id;
                      const nodeCount = e.subEras.reduce((n, s) => n + s.timeNodes.length, 0);

                      return (
                        <div
                          key={e.id}
                          className={`sk-tree-era ${open ? "sk-open" : ""} ${
                            isCurrent ? "sk-current-era-active" : ""
                          }`}
                        >
                          <div className="sk-tree-parent-row">
                            <button
                              type="button"
                              className="sk-tree-parent sk-button"
                              onClick={() => {
                                onJumpEra(e);
                                setIsMenuOpen(false);
                              }}
                              title={`Tới: ${e.title}`}
                            >
                              <span className="sk-era-number">{String(i + 1).padStart(2, "0")}</span>
                              <span className="sk-tree-text">
                                <strong>{shortTitle(e.title)}</strong>
                                <small>
                                  {compactPeriod(e.periodLabel)} · {e.subEras.length} giai đoạn · {nodeCount} mốc
                                </small>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="sk-tree-toggle sk-button"
                              aria-label={open ? "Thu gọn" : "Mở rộng"}
                              onClick={() => toggleEraAccordion(e.id)}
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {open && (
                            <div className="sk-tree-children">
                              {e.subEras.map((s) => {
                                const isSubActive = activeSubEraId === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className={`sk-button ${isSubActive ? "sk-active" : ""}`}
                                    onClick={() => {
                                      onJumpSubEra(s.id);
                                      setIsMenuOpen(false);
                                    }}
                                  >
                                    <span className="sk-tree-dot" />
                                    <span className="sk-tree-name">
                                      {sidebarName(s.title)}
                                      <small>
                                        {compactPeriod(s.periodLabel)} · {s.timeNodes.length} mốc
                                      </small>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
