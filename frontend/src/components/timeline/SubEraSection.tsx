"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, GraduationCap, Plus } from "lucide-react";
import { Badge, Button, Heading } from "./sk-ui";
import { TimelineNodeItem } from "./TimelineNodeItem";
import { sliceTimeNodes } from "./sk-shared";
import type { SubEra, TimeNode, TimelineEvent } from "./sk-types";

export type SplitMode = "alternating" | "scope" | "domain";

export function SubEraSection({
  subEra: s,
  compact,
  split,
  onQuiz,
  onDetail,
  onDrill,
  onSave,
  saved,
  onActive,
}: {
  subEra: SubEra;
  compact: boolean;
  split: SplitMode;
  onQuiz: (s: SubEra) => void;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onDrill: (s: SubEra) => void;
  onSave: (id: string) => void;
  saved: string[];
  onActive: (id: string) => void;
}) {
  const [pageCount, setPageCount] = useState(1);

  const { nodes, hasMore } = useMemo(() => {
    const pageSize = 2;
    const collected: TimeNode[] = [];
    let more = true;
    for (let page = 0; page < pageCount; page += 1) {
      const result = sliceTimeNodes(s, page, pageSize);
      collected.push(...result.nodes);
      more = result.hasMore;
    }
    return { nodes: collected, hasMore: more };
  }, [s, pageCount]);

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
          <Heading level={3}>{s.title}</Heading>
          <Badge>{s.periodLabel}</Badge>
          <span className="sk-sub-count">{s.timeNodes.length} dấu mốc</span>
        </div>
        {s.quizQuestions && s.quizQuestions.length > 0 && (
          <Button className="sk-quiz-button" onClick={() => onQuiz(s)}>
            <GraduationCap size={15} /> Làm Quiz ôn tập <ArrowUpRight size={13} />
          </Button>
        )}
      </div>
      <div className="sk-nodes">
        <div className="sk-spine" />
        {nodes.map((node, index) => {
          const right =
            split === "scope"
              ? node.events[0].scopeGroup === "WORLD"
              : split === "domain"
                ? node.events[0].domainGroup === "ECONOMY_CULTURE"
                : index % 2 === 1;
          return (
            <TimelineNodeItem
              key={node.id}
              node={node}
              right={right}
              compact={compact}
              onDetail={onDetail}
              onDrill={onDrill}
              onSave={onSave}
              saved={saved}
            />
          );
        })}
        {hasMore && (
          <div className="sk-load-more">
            <Button onClick={() => setPageCount((v) => v + 1)}>
              <Plus size={14} /> Tải thêm mốc thời gian <span>({s.timeNodes.length - nodes.length})</span>
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  );
}
