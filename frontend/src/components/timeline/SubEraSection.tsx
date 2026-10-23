"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge, Heading } from "./sk-ui";
import { TimelineNodeItem } from "./TimelineNodeItem";
import type { SubEra, TimeNode, TimelineEvent } from "./sk-types";

export type SplitMode = "alternating" | "scope" | "domain";

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
  split: SplitMode;
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
            split === "scope" && first
              ? first.scopeGroup === "WORLD"
              : split === "domain" && first
                ? first.domainGroup === "ECONOMY_CULTURE"
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
