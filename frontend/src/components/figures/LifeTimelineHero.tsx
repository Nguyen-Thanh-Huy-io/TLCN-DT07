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

/** Nền chuyển sắc cố định theo vị trí — Pilot chưa có ảnh riêng cho từng sự kiện. */
const BACKDROPS = [
  "linear-gradient(140deg, #3B2A1E 0%, #6B4A2E 100%)",
  "linear-gradient(140deg, #2A2E1E 0%, #4C5A2E 100%)",
  "linear-gradient(140deg, #1E2A2E 0%, #2E4C5A 100%)",
  "linear-gradient(140deg, #2E1E1E 0%, #5A2E2E 100%)",
  "linear-gradient(140deg, #231E2E 0%, #4A2E5A 100%)",
];

/**
 * Dòng thời gian kiểu "ảnh bìa lớn + cột mốc bấm chọn" (tham khảo dogstudio.co) — bấm 1
 * mốc bên phải đổi ảnh bìa lớn bên trái. Dùng cho trang chi tiết đầy đủ (FigureFullProfile);
 * modal hồ sơ (FigureProfileSheet) vẫn dùng LifeTimeline dạng list gọn cho phù hợp không
 * gian hẹp hơn.
 */
export function LifeTimelineHero({ events }: { events: PublicFigureEventDto[] }) {
  const categoryTerms = usePublicTaxonomyTerms("EVENT_CATEGORY");
  const roleTerms = usePublicTaxonomyTerms("EVENT_ROLE");
  const primaryIndex = Math.max(
    0,
    events.findIndex((e) => e.isPrimary),
  );
  const [active, setActive] = useState(primaryIndex);

  if (events.length === 0) return null;

  const current = events[active];
  const role = current.roleLabel || eventRoleLabel(roleTerms, current.role);

  return (
    <div className="sk-life-hero">
      <div className="sk-life-hero-stage">
        <div className="sk-life-hero-cover" style={{ background: BACKDROPS[active % BACKDROPS.length] }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="sk-life-hero-copy"
            >
              <span className="sk-life-hero-date">{dateLabel(current.startYear, current.eventDateNote)}</span>
              <h3>{current.title}</h3>
              {current.description && <p>{current.description}</p>}
              <div className="sk-life-hero-meta">
                <span>{eventCategoryLabel(categoryTerms, current)}</span>
                <span>{role}</span>
              </div>
              {current.slug && (
                <Link className="sk-life-hero-cta" href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${current.slug}`}>
                  Xem chi tiết sự kiện
                  <span>
                    <ArrowUpRight size={13} />
                  </span>
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sk-life-hero-rail">
          {events.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className={`sk-life-hero-item ${i === active ? "sk-selected" : ""}`}
              onClick={() => setActive(i)}
              aria-current={i === active}
            >
              <span className="sk-life-hero-dot" />
              <span className="sk-life-hero-item-body">
                <small>{dateLabel(e.startYear, e.eventDateNote)}</small>
                <strong>{e.title}</strong>
              </span>
              {e.isPrimary && <Sparkles size={13} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
