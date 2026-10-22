"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge, Button, Heading, Modal } from "./sk-ui";
import { EntityList } from "./EntityList";
import type { TimeNode, TimelineEvent } from "./sk-types";

export function EventDetailModal({
  detail,
  onClose,
  onSelect,
  onStep,
}: {
  detail: { event: TimelineEvent; node: TimeNode } | null;
  onClose: () => void;
  onSelect: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <Modal open={!!detail} onClose={onClose} title="Câu chuyện lịch sử" sheet>
      {detail && (
        <>
          {detail.event.imageUrl && (
            <img className="sk-detail-image" src={detail.event.imageUrl} alt={detail.event.title} />
          )}
          <div className="sk-detail-body">
            <Badge>{detail.event.category}</Badge>
            <span className="sk-detail-date">{detail.event.dateLabel}</span>
            <Heading level={1}>{detail.event.title}</Heading>
            <div className="sk-detail-text">{detail.event.content}</div>
            <Heading level={3}>Nhân vật & địa danh</Heading>
            <EntityList figures={detail.event.figures || []} locations={detail.event.locations || []} tab="figures" />
            <EntityList figures={detail.event.figures || []} locations={detail.event.locations || []} tab="locations" />
            <Heading level={3}>Cùng thời điểm</Heading>
            {detail.node.events
              .filter((ev) => ev.id !== detail.event.id)
              .map((ev) => (
                <Button
                  className="sk-related-event"
                  key={ev.id}
                  onClick={() => onSelect({ event: ev, node: detail.node })}
                >
                  {ev.title}
                  <ArrowUpRight size={16} />
                </Button>
              ))}
            {detail.node.events.length === 1 && (
              <p className="sk-muted">Bạn đang xem sự kiện tiêu biểu tại dấu mốc này.</p>
            )}
            <div className="sk-drawer-navigation">
              <Button onClick={() => onStep(-1)}>
                <ArrowLeft size={16} /> Sự kiện trước
              </Button>
              <Button onClick={() => onStep(1)}>
                Sự kiện tiếp theo <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
