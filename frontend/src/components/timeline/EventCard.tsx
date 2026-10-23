"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Bookmark, Flag, Globe2, Landmark, Network, Swords, TimerReset, type LucideIcon } from "lucide-react";
import { useTimelineFocus } from "./TimelineFocus";
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
  const { focus, lens, related, setFocus, setLens, reveal, flashId } = useTimelineFocus();
  const reasons = related.get(event.id);
  const isFocus = focus?.id === event.id;
  // Chế độ Liên kết / lăng kính chủ thể: sự kiện liên quan sáng lên, phần còn lại mờ đi.
  const focusClass = !focus && !lens ? "" : isFocus ? "sk-focus-self" : reasons ? "sk-focus-related" : "sk-focus-dim";
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
    <motion.article
      layout
      id={`ev-${event.id}`}
      className={`sk-event-card ${event.imageUrl ? "" : "sk-no-image"} ${focusClass} ${flashId === `ev-${event.id}` ? "sk-flash" : ""}`}
    >
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
          <span>{event.spanLabel ?? event.dateLabel}</span>
        </div>
        {event.actors.length > 0 && (
          <div className="sk-actors">
            {event.actors.slice(0, 3).map((a) => (
              <button
                key={a.id}
                type="button"
                className={`sk-actor-chip ${lens?.id === a.id ? "sk-selected" : ""}`}
                title="Xem mọi sự kiện có chủ thể này trên dòng thời gian"
                onClick={() => setLens(lens?.id === a.id ? null : a)}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
        {reasons && (
          <ul className="sk-related-reasons">
            {reasons.slice(0, 3).map((r) => (
              <li key={r.text} className={r.strong ? "sk-strong" : ""}>
                {r.text}
              </li>
            ))}
            {reasons.length > 3 && <li>+{reasons.length - 3} liên kết khác</li>}
          </ul>
        )}
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
          <div className="sk-card-actions">
            {(event.endYear !== undefined || event.endedByEventId) && (
              <Button
                className="sk-link-button"
                title="Cuộn tới mốc kết thúc của sự kiện này"
                onClick={() => reveal(`end-${event.id}`)}
              >
                <TimerReset size={13} /> Lúc kết thúc
              </Button>
            )}
            <Button
              className={`sk-link-button ${isFocus ? "sk-selected" : ""}`}
              title="Làm sáng các sự kiện liên quan trên dòng thời gian"
              aria-pressed={isFocus}
              onClick={() => setFocus(isFocus ? null : event)}
            >
              <Network size={13} /> {isFocus ? "Tắt liên kết" : "Liên kết"}
            </Button>
            <Button onClick={onOpen}>
              Khám phá <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
