"use client";

import { ArrowRight } from "lucide-react";
import { Badge, Button, Heading } from "./sk-ui";
import { NodeContent } from "./NodeContent";
import type { SubEra, TimeNode, TimelineEvent } from "./sk-types";

export function HorizontalExplorer({
  visibleNodes,
  selectedNode,
  onSelectNode,
  subs,
  onJumpToSub,
  onDetail,
  onSave,
  saved,
}: {
  visibleNodes: TimeNode[];
  selectedNode: TimeNode | undefined;
  onSelectNode: (id: string) => void;
  subs: SubEra[];
  onJumpToSub: (node: TimeNode) => void;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
}) {
  return (
    <>
      <div className="sk-horizontal-track">
        {visibleNodes.map((n) => (
          <Button
            className={`sk-scrubber-node ${selectedNode?.id === n.id ? "sk-selected" : ""}`}
            key={n.id}
            onClick={() => onSelectNode(n.id)}
          >
            <span>
              <span className="sk-scrubber-dot" />
            </span>
            <strong>{n.dateLabel}</strong>
            <small>{n.events.length} sự kiện</small>
          </Button>
        ))}
      </div>
      {selectedNode && (
        <div className="sk-horizontal-panel">
          <div className="sk-panel-title">
            <Badge>KHÔNG GIAN KHÁM PHÁ</Badge>
            <Heading>{selectedNode.dateLabel}</Heading>
          </div>
          <NodeContent node={selectedNode} onDetail={onDetail} onSave={onSave} saved={saved} workspace />
          <div className="sk-next-phases">
            <span>Khám phá giai đoạn</span>
            {subs
              .filter((s) => s.timeNodes.length > 0)
              .map((s) => (
                <Button key={s.id} onClick={() => onJumpToSub(s.timeNodes[0])}>
                  {s.title}
                  <ArrowRight size={14} />
                </Button>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
