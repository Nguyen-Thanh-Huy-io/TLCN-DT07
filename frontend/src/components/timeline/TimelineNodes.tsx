'use client';

import { ArrowRight, Bookmark, Flag, Landmark, Swords, Plus } from 'lucide-react';
import { Heading, Badge, Button } from './TimelineChrome';
import { type TimelineEvent, type TimeNode } from './sk-adapter';
import { RemoteImage } from '@/components/common/CommonUi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// === EventCard.tsx ===
function renderCategoryIcon(event: TimelineEvent) {
  const slug = event.categoryCode.toLowerCase();
  if (/tran-danh|chien-tranh|quan-su|khang-chien/.test(slug)) return <Swords size={12} />;
  if (/cach-mang|khoi-nghia|chinh-tri/.test(slug)) return <Flag size={12} />;
  return <Landmark size={12} />;
}

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
  const category = (
    <Badge className="sk-category">
      {renderCategoryIcon(event)}
      {event.category}
    </Badge>
  );
  const saveButton = (
    <Button
      className={`sk-save-card ${saved ? 'sk-saved' : ''}`}
      aria-label={saved ? 'Bỏ lưu dấu mốc' : 'Lưu dấu mốc'}
      onClick={(e) => {
        e.stopPropagation();
        onSave();
      }}
    >
      <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
    </Button>
  );

  return (
    <motion.article
      layout
      id={`ev-${event.id}`}
      className={`sk-event-card ${event.imageUrl ? '' : 'sk-no-image'}`}
    >
      {event.imageUrl && (
        <div className="sk-card-image" onClick={onOpen}>
          <RemoteImage src={event.imageUrl} alt={event.title} loading="lazy" />
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
          <span>{event.spanLabel ?? event.dateLabel}</span>
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
          <div className="sk-card-actions">
            <Button onClick={onOpen}>
              Khám phá <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// === NodeContent.tsx ===
export function NodeContent({
  node,
  onDetail,
  onSave,
  saved,
  workspace = false,
}: {
  node: TimeNode;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
  workspace?: boolean;
}) {
  const [more, setMore] = useState(false);

  return (
    <div className={`sk-node-card-group ${workspace ? 'sk-workspace-cards' : ''}`}>
      <div className="sk-event-list">
        {node.events.slice(0, more ? undefined : 2).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onOpen={() => onDetail({ event, node })}
            saved={saved.includes(event.id)}
            onSave={() => onSave(event.id)}
          />
        ))}
        {node.events.length > 2 && (
          <Button className="sk-more-events" onClick={() => setMore(!more)}>
            <Plus size={14} />
            {more ? 'Thu gọn bài viết' : `Xem thêm ${node.events.length - 2} bài viết cùng thời điểm`}
          </Button>
        )}
      </div>
    </div>
  );
}

// === TimelineNodeItem.tsx ===
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
  const isOpen = !compact || expanded;
  if (node.events.length === 0) return null;

  return (
    <motion.div
      layout
      className={`sk-timeline-node ${right ? 'sk-right' : 'sk-left'}`}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <Button className="sk-node-dot" aria-label={`Mở ${node.dateLabel}`} onClick={() => setExpanded(!expanded)}>
        <span />
      </Button>
      <div className="sk-node-date">
        <span className="sk-node-date-tag">Niên đại</span>
        <Button onClick={() => setExpanded(!expanded)} className="sk-node-date-btn">
          {node.dateLabel}
        </Button>
        <div className="sk-node-date-meta">
          <span>{node.events.length} bài viết</span>
        </div>
      </div>
      <div className="sk-node-content">
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <NodeContent node={node} onDetail={onDetail} onSave={onSave} saved={saved} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
