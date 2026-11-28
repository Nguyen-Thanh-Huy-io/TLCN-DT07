'use client';

import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import { HorizontalTimelineRuler } from './HorizontalTimelineRuler';
import { Badge, Heading } from './TimelineChrome';
import { TimelineNodeItem } from './TimelineNodes';
import { type SubEra, type TimeNode, type TimelineEvent } from './sk-adapter';

// === EraSection.tsx ===
export function EraSection({
  title,
  slug,
  period,
  index,
  overview,
  defaultOpen = true,
  children,
}: {
  title: string;
  /** Có slug thì hiện liên kết sang trang chi tiết thời kỳ. */
  slug?: string;
  period: string;
  index: number;
  overview: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="sk-era-section" id={`era-${slug || index}`}>
      <div className="sk-era-banner">
        <button
          type="button"
          className="sk-era-banner-main"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="sk-era-banner-icon">
            <Landmark size={22} />
          </span>
          <span className="sk-era-banner-text">
            <small>
              Thời kỳ {String(index + 1).padStart(2, "0")}
              {period ? (
                <>
                  {" "}
                  <i /> {period}
                </>
              ) : null}
            </small>
            <Heading>{title}</Heading>
            {overview && <p>{overview}</p>}
          </span>
        </button>

        <div className="sk-era-banner-actions">
          {slug && (
            <Link href={`/giai-doan/${slug}`} className="sk-era-banner-link" title="Khám phá chi tiết thời kỳ">
              <span>Xem thời kỳ</span>
              <ArrowUpRight size={14} />
            </Link>
          )}
          <button
            type="button"
            className="sk-era-toggle-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Thu gọn thời kỳ" : "Mở rộng thời kỳ"}
          >
            <ChevronDown className={open ? "" : "sk-rotate"} size={20} />
          </button>
        </div>
      </div>
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
const INITIAL_NODES_PER_SUB_ERA = 5;
const STEP_NODES_PER_SUB_ERA = 5;
const LAZY_MOUNT_MARGIN = '600px 0px 600px 0px';
const LAZY_PLACEHOLDER_HEIGHT_PX = 160;

const INITIAL_SUB_ERAS_PER_ERA = 3;
const STEP_SUB_ERAS_PER_ERA = 4;

export function LazySubEraList({
  subEras,
  resetKey,
  renderSubEra,
}: {
  subEras: SubEra[];
  resetKey: string;
  renderSubEra: (subEra: SubEra) => ReactNode;
}) {
  const [limitState, setLimitState] = useState({
    key: resetKey,
    limit: INITIAL_SUB_ERAS_PER_ERA,
  });
  const limit = limitState.key === resetKey ? limitState.limit : INITIAL_SUB_ERAS_PER_ERA;
  const total = subEras.length;
  const visibleSubs = subEras.slice(0, limit);
  const hasMore = total > limit;

  return (
    <>
      {visibleSubs.map((s) => renderSubEra(s))}
      {total > INITIAL_SUB_ERAS_PER_ERA && (
        <div className="sk-load-more pt-5 pb-3 flex flex-wrap items-center justify-center gap-2">
          {hasMore ? (
            <>
              <button
                type="button"
                className="sk-button !rounded-full !px-5 !py-2.5 text-xs font-bold text-[#7A1F24] border border-[#D4AE67] bg-[#FAF5E6] hover:bg-[#F5EEDC] cursor-pointer"
                onClick={() =>
                  setLimitState({
                    key: resetKey,
                    limit: Math.min(limit + STEP_SUB_ERAS_PER_ERA, total),
                  })
                }
              >
                + Xem thêm {Math.min(STEP_SUB_ERAS_PER_ERA, total - limit)} giai đoạn tiếp theo (còn {total - limit})
              </button>
              {total - limit > STEP_SUB_ERAS_PER_ERA && (
                <button
                  type="button"
                  className="sk-button !rounded-full !px-4 !py-2.5 text-xs font-bold text-stone-700 border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer"
                  onClick={() => setLimitState({ key: resetKey, limit: total })}
                >
                  Xem tất cả {total} giai đoạn
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="sk-button !rounded-full !px-4 !py-2 text-xs font-bold text-stone-600 border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer"
              onClick={() => setLimitState({ key: resetKey, limit: INITIAL_SUB_ERAS_PER_ERA })}
            >
              Thu gọn còn {INITIAL_SUB_ERAS_PER_ERA} giai đoạn đầu
            </button>
          )}
        </div>
      )}
    </>
  );
}

export function SubEraSection({
  subEra: s,
  compact,
  onDetail,
  onSave,
  saved,
  onActive,
  hideSubHeading = false,
}: {
  subEra: SubEra;
  compact: boolean;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
  onActive: (id: string) => void;
  hideSubHeading?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const nearViewport = useInView(sectionRef, { once: true, margin: LAZY_MOUNT_MARGIN });
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_NODES_PER_SUB_ERA);
  const totalNodes = s.timeNodes.length;
  const totalStageItems = Math.max(s.totalItemCount ?? 0, totalNodes);
  const hasMore = totalNodes > visibleLimit;
  const isExpanded = visibleLimit > INITIAL_NODES_PER_SUB_ERA;
  const visibleNodes = s.timeNodes.slice(0, visibleLimit);
  const placeholderHeight = LAZY_PLACEHOLDER_HEIGHT_PX;
  const showStagePortalBtn =
    Boolean(s.slug) && (totalStageItems > INITIAL_NODES_PER_SUB_ERA || totalStageItems > totalNodes);

  return (
    <motion.section
      ref={sectionRef}
      id={s.id}
      className={`sk-sub-era sk-theme-${s.themeColor}`}
      onViewportEnter={() => onActive(s.id)}
      viewport={{ amount: 0.2 }}
    >
      {!hideSubHeading && (
        <div className="sk-sub-heading">
          <div>
            <span className="sk-sub-marker" />
            <Link href={`/giai-doan/${s.slug}`} className="sk-sub-link" title="Xem chi tiết giai đoạn">
              <Heading level={3}>{s.title}</Heading>
              <ArrowUpRight size={14} />
            </Link>
            {s.periodLabel && <Badge>{s.periodLabel}</Badge>}
            <span className="sk-sub-count">
              {totalStageItems > totalNodes
                ? `${totalStageItems.toLocaleString('vi-VN')} tư liệu`
                : `${totalNodes} dấu mốc`}
            </span>
          </div>
        </div>
      )}
      <div className="sk-nodes">
        <div className="sk-spine" />
        {nearViewport ? (
          visibleNodes.map((node, index) => {
            const right = index % 2 === 1;
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
          })
        ) : (
          <div aria-hidden="true" style={{ minHeight: placeholderHeight }} />
        )}
      </div>

      {nearViewport && (totalNodes > INITIAL_NODES_PER_SUB_ERA || showStagePortalBtn) && (
        <div className="sk-load-more pt-4 pb-2 flex flex-wrap items-center justify-center gap-2">
          {hasMore && (
            <button
              type="button"
              className="sk-button !rounded-full !px-4 !py-2 text-xs font-bold text-[#7A1F24] border border-[#D4AE67] bg-[#FAF5E6] hover:bg-[#F5EEDC] cursor-pointer"
              onClick={() =>
                setVisibleLimit((prev) =>
                  Math.min(prev + STEP_NODES_PER_SUB_ERA, totalNodes),
                )
              }
            >
              + Xem thêm {Math.min(STEP_NODES_PER_SUB_ERA, totalNodes - visibleLimit)} mốc tiếp theo
            </button>
          )}
          {!hasMore && isExpanded && (
            <button
              type="button"
              className="sk-button !rounded-full !px-4 !py-2 text-xs font-bold text-stone-600 border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer"
              onClick={() => setVisibleLimit(INITIAL_NODES_PER_SUB_ERA)}
            >
              Thu gọn mốc giai đoạn
            </button>
          )}
          {showStagePortalBtn && (
            <Link
              href={`/giai-doan/${s.slug}`}
              className="sk-button !inline-flex !items-center !gap-1.5 !rounded-full !px-4 !py-2 text-xs font-bold text-[#2D1A10] border border-[#E2D5B8] bg-white hover:border-[#7A1F24] hover:text-[#7A1F24] transition"
            >
              <span>Xem tất cả {totalStageItems.toLocaleString('vi-VN')} tư liệu giai đoạn này</span>
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      )}
    </motion.section>
  );
}

// === HorizontalExplorer.tsx (Bảo toàn tương thích ngược qua Facade) ===
export { HorizontalTimelineRuler, HorizontalTimelineRuler as HorizontalExplorer };


