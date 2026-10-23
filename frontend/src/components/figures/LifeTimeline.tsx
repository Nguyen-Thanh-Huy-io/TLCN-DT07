"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, History, Shield, Sparkles } from "lucide-react";
import { Badge, Heading } from "@/components/timeline/sk-ui";
import { eventCategoryLabel, eventRoleLabel } from "@/features/taxonomy/taxonomy-labels";
import { usePublicTaxonomyTerms } from "@/features/taxonomy/usePublicTaxonomy";
import { PUBLIC_ROUTE_PREFIX, type PublicPeriodDto } from "@/services/entities/landing.service";
import { periodTitle, type FigureView } from "./figure-utils";

function dateLabel(startYear: number, note: string | null) {
  if (note) return note;
  return startYear < 0 ? `${Math.abs(startYear)} TCN` : `Năm ${startYear}`;
}

export function LifeTimeline({ figure, periods }: { figure: FigureView; periods: PublicPeriodDto[] }) {
  const categoryTerms = usePublicTaxonomyTerms("EVENT_CATEGORY");
  const roleTerms = usePublicTaxonomyTerms("EVENT_ROLE");
  return (
    <div className="sk-life-timeline">
      <div className="sk-profile-section-heading">
        <div>
          <Heading level={3}>Một cuộc đời, những dấu mốc</Heading>
          <p>Các sự kiện nhân vật tham gia, theo dữ liệu đã liên kết.</p>
        </div>
        <Badge>
          <Check size={12} /> {figure.events.length} sự kiện
        </Badge>
      </div>
      {figure.events.length ? (
        figure.events.map((e) => {
          const subEra = periodTitle(periods, e.periodSlug);
          const role = e.roleLabel || eventRoleLabel(roleTerms, e.role);
          return (
            <motion.article
              key={e.id}
              className="sk-life-node"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="sk-life-node-point">
                <History size={13} />
              </div>
              <div className="sk-life-node-heading">
                <Heading level={3}>{dateLabel(e.startYear, e.eventDateNote)}</Heading>
                {subEra && <Badge>{subEra}</Badge>}
              </div>
              <div className="sk-life-node-role">
                <Shield size={12} />
                {role}
              </div>
              <div className="sk-life-events">
                <div className="sk-life-event">
                  <div>
                    <Badge>{eventCategoryLabel(categoryTerms, e)}</Badge>
                    {e.isPrimary && (
                      <span>
                        <Sparkles size={11} /> VAI TRÒ CHÍNH
                      </span>
                    )}
                  </div>
                  <Heading level={3}>{e.title}</Heading>
                  {e.description && <p>{e.description}</p>}
                </div>
              </div>
              {e.slug && (
                <Link className="sk-button sk-open-main-timeline" href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${e.slug}`}>
                  Xem chi tiết sự kiện <ArrowUpRight size={14} />
                </Link>
              )}
            </motion.article>
          );
        })
      ) : (
        <div className="sk-empty">
          <History size={28} />
          <Heading>Chưa có sự kiện được liên kết</Heading>
          <p>Hồ sơ sẽ cập nhật khi nhân vật được gắn vào sự kiện trong hệ thống.</p>
        </div>
      )}
    </div>
  );
}
