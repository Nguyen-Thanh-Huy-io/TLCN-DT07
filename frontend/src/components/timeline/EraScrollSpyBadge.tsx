"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Layers, X, Compass, ExternalLink } from "lucide-react";
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

interface EraScrollSpyBadgeProps {
  eras: Era[];
  activeSubEraId: string;
  totalEvents: number;
  onJumpEra: (era: Era) => void;
  onJumpSubEra: (subEraId: string) => void;
  onToggleDock?: () => void;
  isDocked?: boolean;
}

export function EraScrollSpyBadge({
  eras,
  activeSubEraId,
  totalEvents,
  onJumpEra,
  onJumpSubEra,
  onToggleDock,
  isDocked = false,
}: EraScrollSpyBadgeProps) {
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [toggledEras, setToggledEras] = useState<Record<string, boolean>>({});

  // Tìm Era lớn và SubEra nhỏ đang active theo vị trí cuộn
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
    // Mặc định era đầu tiên nếu chưa bắt được
    const firstEra = eras[0];
    return {
      eraIndex: 1,
      era: firstEra,
      subEra: firstEra?.subEras[0],
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
    <>
      {/* 1. FLOATING PILL / BADGE BÁM THEO CUỘN (GÓC TRÁI MÀN HÌNH) */}
      <div className="sk-floating-era-container">
        <motion.div
          className="sk-floating-era-pill"
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            className="sk-floating-era-main-btn"
            onClick={() => setIsOpenDrawer((prev) => !prev)}
            title="Bấm để xem danh sách toàn bộ các thời kỳ & nhảy nhanh"
          >
            {/* Huy hiệu số thứ tự thời kỳ lớn */}
            <span className="sk-floating-era-num">
              {String(currentInfo.eraIndex).padStart(2, "0")}
            </span>

            {/* Thông tin Thời kỳ to & Thời kỳ nhỏ */}
            <div className="sk-floating-era-text">
              <div className="sk-floating-era-parent">
                <span className="sk-floating-era-tag">Thời kỳ:</span>
                <strong>{shortTitle(currentInfo.era.title)}</strong>
                <span className="sk-floating-era-period">
                  ({compactPeriod(currentInfo.era.periodLabel)})
                </span>
              </div>

              {currentInfo.subEra && (
                <div className="sk-floating-era-child">
                  <span className="sk-floating-era-arrow">↳</span>
                  <span className="sk-floating-sub-name">
                    {sidebarName(currentInfo.subEra.title)}
                  </span>
                  <span className="sk-floating-sub-period">
                    · {compactPeriod(currentInfo.subEra.periodLabel)}
                  </span>
                </div>
              )}
            </div>

            {/* Biểu tượng mở Drawer */}
            <div className="sk-floating-era-action">
              <span className="sk-floating-explore-hint">Các thời kỳ</span>
              {isOpenDrawer ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </button>
        </motion.div>
      </div>

      {/* 2. FLOATING DRAWER / POPOVER DANH MỤC THỜI KỲ (KHÔNG CHIẾM DIỆN TÍCH NGANG) */}
      <AnimatePresence>
        {isOpenDrawer && (
          <>
            <motion.div
              className="sk-floating-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpenDrawer(false)}
            />

            <motion.div
              className="sk-floating-drawer"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sk-floating-drawer-header">
                <div className="sk-floating-drawer-title">
                  <Layers size={18} className="text-emerald-700" />
                  <span>Danh mục các thời kỳ lịch sử</span>
                </div>
                <div className="sk-floating-drawer-actions">
                  {onToggleDock && (
                    <button
                      type="button"
                      className="sk-floating-dock-btn"
                      onClick={() => {
                        setIsOpenDrawer(false);
                        onToggleDock();
                      }}
                      title={isDocked ? "Thu gọn thành dạng nổi" : "Ghim cố định sang cột bên trái"}
                    >
                      <Compass size={14} />
                      <span>{isDocked ? "Bỏ ghim" : "Ghim cột bên"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="sk-floating-close-btn"
                    onClick={() => setIsOpenDrawer(false)}
                    aria-label="Đóng danh mục thời kỳ"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="sk-floating-drawer-content">
                {eras.length === 0 && (
                  <p className="sk-minimap-empty">Không có thời kỳ nào khớp bộ lọc hiện tại.</p>
                )}

                {eras.map((e, i) => {
                  const open = isEraOpen(e.id);
                  const isCurrentEra = e.id === currentInfo.era.id;
                  const nodeCount = e.subEras.reduce((n, s) => n + s.timeNodes.length, 0);

                  return (
                    <div
                      className={`sk-tree-era ${open ? "sk-open" : ""} ${
                        isCurrentEra ? "sk-current-era-active" : ""
                      }`}
                      key={e.id}
                    >
                      <div className="sk-tree-parent-row">
                        <button
                          type="button"
                          className="sk-tree-parent sk-button"
                          onClick={() => {
                            onJumpEra(e);
                            setIsOpenDrawer(false);
                          }}
                          title={`Xem thời kỳ: ${e.title}`}
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
                          aria-label={open ? "Thu gọn thời kỳ" : "Mở thời kỳ"}
                          aria-expanded={open}
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
                                  setIsOpenDrawer(false);
                                }}
                                title={`${s.title} — ${s.timeNodes.length} mốc`}
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

              <div className="sk-floating-drawer-footer">
                <span className="sk-status-dot" />
                <span>Đang khám phá tổng số {totalEvents} dấu mốc lịch sử</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
