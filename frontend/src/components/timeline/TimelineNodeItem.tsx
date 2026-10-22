"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, History, Sparkles } from "lucide-react";
import { Badge, Button } from "./sk-ui";
import { NodeContent } from "./NodeContent";
import type { SubEra, TimeNode, TimelineEvent } from "./sk-types";

export function TimelineNodeItem({
  node,
  right,
  compact,
  onDetail,
  onDrill,
  onSave,
  saved,
}: {
  node: TimeNode;
  right: boolean;
  compact: boolean;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onDrill: (s: SubEra) => void;
  onSave: (id: string) => void;
  saved: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const isOpen = !compact || expanded;

  return (
    <motion.div
      layout
      className={`sk-timeline-node ${right ? "sk-right" : "sk-left"} ${node.isMilestone ? "sk-milestone" : ""} ${
        node.nodeType === "SPAN" ? "sk-span-node" : ""
      }`}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <Button className="sk-node-dot" aria-label={`Mở ${node.dateLabel}`} onClick={() => setExpanded(!expanded)}>
        {node.isMilestone ? <Flag size={15} /> : node.nodeType === "SPAN" ? <History size={14} /> : <span />}
      </Button>
      <div className="sk-node-date">
        <Button onClick={() => setExpanded(!expanded)}>
          {node.dateLabel}
          {node.isMilestone && <Sparkles size={13} />}
        </Button>
        <small>
          {node.events.length} sự kiện <span>·</span> {node.figures.length} nhân vật <span>·</span>{" "}
          {node.locations.length} địa điểm
        </small>
        {node.isMilestone && <span className="sk-milestone-label">DẤU MỐC TRỌNG ĐẠI</span>}
        {node.nodeType === "SPAN" && <Badge>Giai đoạn kéo dài → {node.endDateLabel}</Badge>}
      </div>
      <div className="sk-node-content">
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <NodeContent node={node} onDetail={onDetail} onDrill={onDrill} onSave={onSave} saved={saved} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
