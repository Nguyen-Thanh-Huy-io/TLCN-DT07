"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { eventCategoryLabel, eventRoleLabel } from "@/features/taxonomy/taxonomy-labels";
import { usePublicTaxonomyTerms } from "@/features/taxonomy/usePublicTaxonomy";
import { PUBLIC_ROUTE_PREFIX, type PublicFigureEventDto } from "@/services/entities/landing.service";

function dateLabel(startYear: number, note: string | null) {
  if (note) return note;
  return startYear < 0 ? `${Math.abs(startYear)} TCN` : `Năm ${startYear}`;
}

/**
 * Dòng thời gian dạng trục dọc thật — mốc nối liền nhau bằng 1 đường kẻ, bấm 1 mốc mở
 * rộng panel chi tiết ngay tại chỗ (accordion), không còn là khối ảnh-bìa-đổi-theo-click.
 */
export function LifeTimelineAxis({ events }: { events: PublicFigureEventDto[] }) {
  const categoryTerms = usePublicTaxonomyTerms("EVENT_CATEGORY");
  const roleTerms = usePublicTaxonomyTerms("EVENT_ROLE");
  const sorted = [...events].sort((a, b) => a.startYear - b.startYear);
  const primaryId = sorted.find((e) => e.isPrimary)?.id ?? sorted[0]?.id;
  const [openId, setOpenId] = useState<string | null>(primaryId ?? null);

  if (sorted.length === 0) return null;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const rangeLabel =
    first.startYear === last.startYear
      ? dateLabel(first.startYear, first.eventDateNote)
      : `${dateLabel(first.startYear, null).replace("Năm ", "")} – ${dateLabel(last.startYear, null).replace("Năm ", "")}`;

  return (
    <div className="fig-axis">
      <div className="fig-axis-range">{sorted.length} dấu mốc · {rangeLabel}</div>
      <ol className="fig-axis-line">
        {sorted.map((e) => {
          const open = openId === e.id;
          const role = e.roleLabel || eventRoleLabel(roleTerms, e.role);
          return (
            <li key={e.id} className={`fig-axis-item ${open ? "fig-axis-open" : ""}`}>
              <button type="button" className="fig-axis-marker" onClick={() => setOpenId(open ? null : e.id)} aria-expanded={open}>
                <span className="fig-axis-dot">{e.isPrimary && <Sparkles size={11} />}</span>
              </button>
              <button type="button" className="fig-axis-head" onClick={() => setOpenId(open ? null : e.id)} aria-expanded={open}>
                <span className="fig-axis-year">{dateLabel(e.startYear, e.eventDateNote)}</span>
                <span className="fig-axis-title">{e.title}</span>
                <span className="fig-axis-tag">{eventCategoryLabel(categoryTerms, e)}</span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    className="fig-axis-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {e.description && <p>{e.description}</p>}
                    <div className="fig-axis-panel-meta">
                      <span>{role}</span>
                      {e.periodSlug && <span>{e.periodSlug}</span>}
                    </div>
                    {e.slug && (
                      <Link className="fig-axis-link" href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${e.slug}`}>
                        Xem chi tiết sự kiện <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
