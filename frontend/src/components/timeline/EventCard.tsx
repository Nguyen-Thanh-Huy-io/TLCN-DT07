"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Bookmark, Flag, Globe2, Landmark, Swords, type LucideIcon } from "lucide-react";
import { Heading, Badge, Button } from "./sk-ui";
import type { TimelineEvent } from "./sk-types";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  BATTLE: Swords,
  WAR: Swords,
  REVOLUTION: Flag,
  CULTURE_SCIENCE: BookOpen,
};

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
  const CategoryIcon = CATEGORY_ICONS[event.categoryCode] ?? Landmark;
  const category = (
    <Badge className="sk-category">
      <CategoryIcon size={12} />
      {event.category}
    </Badge>
  );
  const saveButton = (
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
  );

  return (
    <motion.article layout className={`sk-event-card ${event.imageUrl ? "" : "sk-no-image"}`}>
      {event.imageUrl && (
        <div className="sk-card-image" onClick={onOpen}>
          <img src={event.imageUrl} alt={event.title} loading="lazy" />
          <div className="sk-image-overlay" />
          {category}
          {saveButton}
        </div>
      )}
      <div className="sk-card-body">
        {!event.imageUrl && (
          <div className="sk-card-head">
            {category}
            {saveButton}
          </div>
        )}
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
