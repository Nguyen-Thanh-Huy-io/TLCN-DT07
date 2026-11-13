'use client';

import { ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Landmark, ChevronLeft, ChevronRight, BookOpen, Search, X } from 'lucide-react';
import { Button, Heading, Badge, shortTitle } from './TimelineChrome';
import { TimelineNodeItem, NodeContent } from './TimelineNodes';
import { EventDomainGroup, SK_SELECTED_CLASS, type SubEra, type TimeNode, type TimelineEvent, type Era } from './sk-types';
import { KeyboardKey } from '@/constants/enums';

// === EraSection.tsx ===
export function EraSection({
  title,
  slug,
  period,
  index,
  overview,
  children,
}: {
  title: string;
  /** Có slug thì hiện liên kết sang trang chi tiết thời kỳ. */
  slug?: string;
  period: string;
  index: number;
  overview: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="sk-era-section" id={`era-${slug || index}`}>
      <Button className="sk-era-banner" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="sk-era-banner-icon">
          <Landmark size={23} />
        </span>
        <span className="sk-era-banner-text">
          <small>
            Thời kỳ {String(index + 1).padStart(2, "0")} <i /> {period}
          </small>
          <Heading>{title}</Heading>
          {overview && <p>{overview}</p>}
        </span>
        <ChevronDown className={open ? "" : "sk-rotate"} size={20} />
      </Button>
      {slug && (
        <Link href={`/giai-doan/${slug}`} className="sk-era-link">
          Xem chi tiết thời kỳ <ArrowUpRight size={14} />
        </Link>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="sk-era-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// === SubEraSection.tsx ===
export enum SplitMode {
  ALTERNATING = "alternating",
  DOMAIN = "domain",
}

export type SplitModeType = SplitMode | "alternating" | "domain";

export function SubEraSection({
  subEra: s,
  compact,
  split,
  onDetail,
  onSave,
  saved,
  onActive,
}: {
  subEra: SubEra;
  compact: boolean;
  split: SplitMode | string;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
  onActive: (id: string) => void;
}) {
  return (
    <motion.section
      id={s.id}
      className={`sk-sub-era sk-theme-${s.themeColor}`}
      onViewportEnter={() => onActive(s.id)}
      viewport={{ amount: 0.2 }}
    >
      <div className="sk-sub-heading">
        <div>
          <span className="sk-sub-marker" />
          <Link href={`/giai-doan/${s.slug}`} className="sk-sub-link" title="Xem chi tiết giai đoạn">
            <Heading level={3}>{s.title}</Heading>
            <ArrowUpRight size={14} />
          </Link>
          <Badge>{s.periodLabel}</Badge>
          <span className="sk-sub-count">{s.timeNodes.length} dấu mốc</span>
        </div>
      </div>
      <div className="sk-nodes">
        <div className="sk-spine" />
        {s.timeNodes.map((node, index) => {
          const first = node.events[0];
          const right =
            split === SplitMode.DOMAIN && first
              ? first.domainGroup === EventDomainGroup.ECONOMY_CULTURE
              : index % 2 === 1;
          return (
            <TimelineNodeItem
              key={node.id}
              node={node}
              right={right}
              compact={compact}
              onDetail={onDetail}
              onSave={onSave}
              saved={saved}
            />
          );
        })}
      </div>
    </motion.section>
  );
}

// === HorizontalExplorer.tsx ===
/**
 * Trục ngang theo mô hình 3 tầng:
 *  - Tầng trên (thanh trượt): dải tên giai đoạn + mỗi mốc chỉ có chấm, năm và tiêu đề ngắn 1 dòng.
 *  - Tầng dưới (workspace): toàn bộ sự kiện / nhân vật / địa điểm của mốc đang chọn,
 *    nằm trong khung lớn bên dưới nên không bao giờ chồng chữ lên trục.
 */
export function HorizontalExplorer({
  visibleNodes,
  selectedNode,
  onSelectNode,
  subs,
  onDetail,
  onSave,
  saved,
}: {
  visibleNodes: TimeNode[];
  selectedNode: TimeNode | undefined;
  onSelectNode: (id: string) => void;
  subs: SubEra[];
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Gom các mốc đang hiển thị theo giai đoạn để vẽ dải nhãn phía trên trục.
  const groups = useMemo(() => {
    const visible = new Set(visibleNodes.map((n) => n.id));
    return subs
      .map((s) => ({ sub: s, nodes: s.timeNodes.filter((n) => visible.has(n.id)) }))
      .filter((g) => g.nodes.length > 0);
  }, [subs, visibleNodes]);

  const ordered = useMemo(() => groups.flatMap((g) => g.nodes), [groups]);
  const index = selectedNode ? ordered.findIndex((n) => n.id === selectedNode.id) : -1;
  const selectedSub = groups.find((g) => g.nodes.some((n) => n.id === selectedNode?.id))?.sub;

  const step = (delta: number) => {
    const next = ordered[Math.min(ordered.length - 1, Math.max(0, index + delta))];
    if (next) onSelectNode(next.id);
  };

  // Giữ mốc đang chọn ở giữa thanh trượt.
  useEffect(() => {
    if (!selectedNode) return;
    trackRef.current
      ?.querySelector<HTMLElement>(`[data-node-id="${selectedNode.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedNode]);

  return (
    <>
      <div className="sk-scrubber">
        <Button className="sk-scrubber-arrow" aria-label="Mốc trước" disabled={index <= 0} onClick={() => step(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <div
          className="sk-horizontal-track"
          ref={trackRef}
          role="listbox"
          aria-label="Các mốc thời gian"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === KeyboardKey.ARROW_RIGHT) {
              e.preventDefault();
              step(1);
            } else if (e.key === KeyboardKey.ARROW_LEFT) {
              e.preventDefault();
              step(-1);
            }
          }}
        >
          {groups.map(({ sub, nodes }) => (
            <div className={`sk-scrubber-group sk-theme-${sub.themeColor}`} key={sub.id}>
              <button
                type="button"
                className={`sk-scrubber-band ${selectedSub?.id === sub.id ? SK_SELECTED_CLASS : ""}`}
                title={sub.title}
                onClick={() => onSelectNode(nodes[0].id)}
              >
                {shortTitle(sub.title)}
              </button>
              <div className="sk-scrubber-nodes">
                {nodes.map((n) => {
                  const first = n.events[0];
                  const more = n.events.length - 1;
                  const isSelected = selectedNode?.id === n.id;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-node-id={n.id}
                      className={`sk-scrubber-node ${isSelected ? SK_SELECTED_CLASS : ""}`}
                      key={n.id}
                      title={n.events.map((ev) => ev.title).join("\n")}
                      onClick={() => onSelectNode(n.id)}
                    >
                      <span className="sk-scrubber-dot" />
                      <strong>{n.dateLabel}</strong>
                      <small>{first?.title}</small>
                      {more > 0 && <em>+{more} sự kiện</em>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Button
          className="sk-scrubber-arrow"
          aria-label="Mốc tiếp theo"
          disabled={index < 0 || index >= ordered.length - 1}
          onClick={() => step(1)}
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode.id}
            className="sk-horizontal-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sk-panel-title">
              <div>
                <Badge>{selectedSub ? shortTitle(selectedSub.title) : "Không gian khám phá"}</Badge>
                <Heading>{selectedNode.dateLabel}</Heading>
              </div>
              <div className="sk-panel-nav">
                <span>
                  Mốc {index + 1}/{ordered.length}
                </span>
                <Button aria-label="Mốc trước" disabled={index <= 0} onClick={() => step(-1)}>
                  <ChevronLeft size={16} /> Trước
                </Button>
                <Button aria-label="Mốc tiếp theo" disabled={index >= ordered.length - 1} onClick={() => step(1)}>
                  Sau <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <NodeContent node={selectedNode} onDetail={onDetail} onSave={onSave} saved={saved} workspace />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// === EraTocDrawer.tsx ===
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
