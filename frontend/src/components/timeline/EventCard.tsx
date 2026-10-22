"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bookmark, Globe2, Landmark, Sparkles, Swords } from "lucide-react";
import { Heading, Badge, Button } from "./sk-ui";
import type { TimelineEvent } from "./sk-types";

export function EventCard({
  event,
  onOpen,
  saved,
  onSave,
}: {
  event: TimelineEvent;
  onOpen: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <motion.article layout className={`sk-event-card ${event.isMilestone ? "sk-featured" : ""}`}>
      <div className="sk-card-image" onClick={onOpen}>
        {event.imageUrl && <img src={event.imageUrl} alt={event.title} loading="lazy" />}
        <div className="sk-image-overlay" />
        <Badge className="sk-category">
          {event.category === "Quân sự" ? <Swords size={12} /> : <Landmark size={12} />}
          {event.category}
        </Badge>
        <Button
          className={`sk-save-card ${saved ? "sk-saved" : ""}`}
          aria-label={saved ? "Bỏ lưu sự kiện" : "Lưu sự kiện"}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
        </Button>
        {event.isMilestone && (
          <span className="sk-image-milestone">
            <Sparkles size={11} /> BƯỚC NGOẶT LỊCH SỬ
          </span>
        )}
      </div>
      <div className="sk-card-body">
        <div className="sk-card-meta">
          <span>
            <Globe2 size={11} />
            {event.scopeGroup === "DOMESTIC" ? "Trong nước" : "Thế giới"}
          </span>
          <span>{event.dateLabel}</span>
        </div>
        <Button className="sk-card-title" onClick={onOpen}>
          <Heading level={3}>{event.title}</Heading>
          <ArrowRight size={17} />
        </Button>
        <p>{event.summary}</p>
        <div className="sk-card-footer">
          <div className="sk-tags">
            {event.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
          <Button onClick={onOpen}>
            Khám phá <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
