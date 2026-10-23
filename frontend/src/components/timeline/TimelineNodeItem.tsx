"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { Button } from "./sk-ui";
import { NodeContent } from "./NodeContent";
import { useTimelineFocus } from "./TimelineFocus";
import type { TimeNode, TimelineEvent } from "./sk-types";

/** Các sự kiện kéo dài kết thúc tại mốc này, kèm nút quay về lúc bắt đầu. */
function EndingList({ node }: { node: TimeNode }) {
  const { reveal, flashId, focus } = useTimelineFocus();
  if (!node.endings.length) return null;
  return (
    <ul className="sk-endings">
      {node.endings.map((end) => (
        <li
          key={end.eventId}
          id={`end-${end.eventId}`}
          className={`${flashId === `end-${end.eventId}` ? "sk-flash" : ""} ${focus && focus.id !== end.eventId ? "sk-focus-dim" : ""}`}
        >
          <span className="sk-ending-mark" aria-hidden />
          <div>
            <strong>Kết thúc: {end.title}</strong>
            <small>
              {end.startLabel} – {end.endLabel}
              {end.viaTitle && <> · kết thúc bằng “{end.viaTitle}”</>}
            </small>
          </div>
          <Button className="sk-link-button" onClick={() => reveal(`ev-${end.eventId}`)}>
            <Undo2 size={13} /> Về lúc bắt đầu
          </Button>
        </li>
      ))}
    </ul>
  );
}


export function TimelineNodeItem({
  node,
  right,
  compact,
  onDetail,
  onSave,
  saved,
}: {
  node: TimeNode;
  right: boolean;
  compact: boolean;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { focus, lens, related } = useTimelineFocus();
  const isOpen = !compact || expanded;
  // Chế độ Liên kết: mốc không chứa sự kiện liên quan thì mờ; mốc nằm trong khoảng thời gian của
  // sự kiện đang chọn (sự kiện kéo dài) có thanh đánh dấu dọc trục.
  const touched =
    (!focus && !lens) ||
    node.events.some((e) => e.id === focus?.id || related.has(e.id)) ||
    node.endings.some((e) => e.eventId === focus?.id || related.has(e.eventId));
  // Khoảng thời gian: của sự kiện kéo dài đang chọn, hoặc thời gian tồn tại của chủ thể đang xem.
  const range: [number, number] | null =
    focus?.endYear !== undefined
      ? [focus.year, focus.endYear]
      : lens && (lens.startYear !== null || lens.endYear !== null)
        ? [lens.startYear ?? -Infinity, lens.endYear ?? Infinity]
        : null;
  const inSpan = Boolean(range && node.sortYear > range[0] && node.sortYear < range[1]);
  const endOnly = node.events.length === 0;

  if (endOnly) {
    return (
      <div className={`sk-timeline-node sk-end-node ${right ? "sk-right" : "sk-left"} ${touched ? "" : "sk-node-dim"} ${inSpan ? "sk-span-node" : ""}`}>
        <span className="sk-node-dot sk-end-dot" aria-hidden />
        <div className="sk-node-date">
          <span className="sk-end-date">{node.dateLabel}</span>
        </div>
        <div className="sk-node-content">
          <EndingList node={node} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={`sk-timeline-node ${right ? "sk-right" : "sk-left"} ${touched ? "" : "sk-node-dim"} ${inSpan ? "sk-span-node" : ""}`}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <Button className="sk-node-dot" aria-label={`Mở ${node.dateLabel}`} onClick={() => setExpanded(!expanded)}>
        <span />
      </Button>
      <div className="sk-node-date">
        <Button onClick={() => setExpanded(!expanded)}>{node.dateLabel}</Button>
        <small>
          {node.events.length} sự kiện <span>·</span> {node.figures.length} nhân vật <span>·</span>{" "}
          {node.locations.length} địa điểm
        </small>
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
              <NodeContent node={node} onDetail={onDetail} onSave={onSave} saved={saved} />
            </motion.div>
          )}
        </AnimatePresence>
        <EndingList node={node} />
      </div>
    </motion.div>
  );
}
