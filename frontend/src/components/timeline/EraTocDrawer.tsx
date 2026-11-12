"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, Search, X } from "lucide-react";
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

export interface EraTocDrawerProps {
  open: boolean;
  onClose: () => void;
  eras: Era[];
  activeSubEraId: string;
  totalEvents: number;
  onJumpEra: (era: Era) => void;
  onJumpSubEra: (subEraId: string) => void;
}

export function EraTocDrawer({
  open,
  onClose,
  eras,
  activeSubEraId,
  totalEvents,
  onJumpEra,
  onJumpSubEra,
}: EraTocDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [toggledEras, setToggledEras] = useState<Record<string, boolean>>({});

  // Lọc danh sách theo từ khóa tìm kiếm (hỗ trợ hàng trăm thời kỳ)
  const filteredEras = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return eras;

    return eras
      .map((era) => {
        const eraMatch =
          era.title.toLowerCase().includes(q) ||
          era.periodLabel.toLowerCase().includes(q);

        const matchedSubEras = era.subEras.filter(
          (sub) =>
            sub.title.toLowerCase().includes(q) ||
            sub.periodLabel.toLowerCase().includes(q),
        );

        if (eraMatch) {
          return era;
        }

        if (matchedSubEras.length > 0) {
          return {
            ...era,
            subEras: matchedSubEras,
          };
        }

        return null;
      })
      .filter((era): era is Era => era !== null);
  }, [eras, searchQuery]);

  const toggleEraAccordion = (eraId: string) => {
    setToggledEras((prev) => ({
      ...prev,
      [eraId]: !prev[eraId],
    }));
  };

  const isEraOpen = (eraId: string) => {
    // Nếu đang tìm kiếm thì luôn mở rộng để thấy kết quả
    if (searchQuery.trim().length > 0) return true;
    return toggledEras[eraId] ?? true;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop tối mờ */}
          <motion.div
            className="sk-toc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer trượt từ mép phải */}
          <motion.aside
            className="sk-toc-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            aria-label="Mục lục các thời kỳ lịch sử"
          >
            {/* Header Drawer */}
            <div className="sk-toc-header">
              <div className="sk-toc-title">
                <BookOpen size={18} className="text-emerald-700" />
                <div>
                  <h3>Mục lục thời kỳ</h3>
                  <small>
                    {filteredEras.length}/{eras.length} thời kỳ · {totalEvents} mốc sự kiện
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="sk-toc-close-btn"
                onClick={onClose}
                aria-label="Đóng mục lục"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ô tìm kiếm nhanh cho hàng trăm thời kỳ */}
            <div className="sk-toc-search-wrap">
              <div className="sk-toc-search-input">
                <Search size={15} className="sk-toc-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm thời kỳ, triều đại, niên đại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="sk-toc-clear-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách các thời kỳ */}
            <div className="sk-toc-body">
              {filteredEras.length === 0 ? (
                <div className="sk-toc-empty">
                  <p>Không tìm thấy thời kỳ nào phù hợp với &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : (
                filteredEras.map((e, i) => {
                  const openAcc = isEraOpen(e.id);
                  const isCurrentEra = e.subEras.some((s) => s.id === activeSubEraId);
                  const nodeCount = e.subEras.reduce((n, s) => n + s.timeNodes.length, 0);

                  return (
                    <div
                      key={e.id}
                      className={`sk-tree-era ${openAcc ? "sk-open" : ""} ${
                        isCurrentEra ? "sk-current-era-active" : ""
                      }`}
                    >
                      <div className="sk-tree-parent-row">
                        <button
                          type="button"
                          className="sk-tree-parent sk-button"
                          onClick={() => {
                            onJumpEra(e);
                            onClose();
                          }}
                          title={`Xem: ${e.title}`}
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
                          aria-label={openAcc ? "Thu gọn thời kỳ" : "Mở rộng thời kỳ"}
                          onClick={() => toggleEraAccordion(e.id)}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {openAcc && (
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
                                  onClose();
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
                })
              )}
            </div>

            {/* Footer Drawer */}
            <div className="sk-toc-footer">
              <span className="sk-status-dot" />
              <span>Hệ thống dữ liệu lịch sử HISGO</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
