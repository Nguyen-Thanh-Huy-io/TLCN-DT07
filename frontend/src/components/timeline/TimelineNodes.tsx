'use client';

import { ArrowRight, Bookmark, Flag, Landmark, Layers, Swords, Plus } from 'lucide-react';
import { Heading, Button } from './TimelineChrome';
import { type TimelineEvent, type TimeNode } from './sk-adapter';
import { RemoteImage } from '@/components/common/CommonUi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// === EventCard.tsx ===
function renderCategoryIcon(event: TimelineEvent) {
  const slug = event.categoryCode.toLowerCase();
  if (/tran-danh|chien-tranh|quan-su|khang-chien/.test(slug)) return <Swords size={13} />;
  if (/cach-mang|khoi-nghia|chinh-tri/.test(slug)) return <Flag size={13} />;
  return <Landmark size={13} />;
}

export function EventCard({
  event,
  onOpen,
  saved,
  onSave,
  siblingCount = 1,
}: {
  event: TimelineEvent;
  onOpen: () => void;
  saved: boolean;
  onSave: () => void;
  siblingCount?: number;
}) {
  const periodText = event.spanLabel ?? event.dateLabel;
  const relatedLabel =
    siblingCount > 1 ? `${siblingCount} sự kiện cùng mốc` : event.category;

  return (
    <motion.article
      layout
      id={`ev-${event.id}`}
      onClick={onOpen}
      className="sk-event-card sk-card-compact"
    >
      <div className="sk-compact-top">
        {event.imageUrl && (
          <div className="sk-compact-thumb">
            <RemoteImage src={event.imageUrl} alt={event.title} loading="lazy" />
          </div>
        )}
        <div className="sk-compact-head">
          <div className="sk-compact-meta-row">
            <span className="sk-compact-pill">{periodText}</span>
            <Button
              type="button"
              className={`sk-compact-save ${saved ? 'sk-saved' : ''}`}
              aria-label={saved ? 'Bỏ lưu dấu mốc' : 'Lưu dấu mốc'}
              title={saved ? 'Bỏ lưu dấu mốc' : 'Lưu dấu mốc'}
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
            </Button>
          </div>
          <Heading level={3} className="sk-compact-title">
            {event.title}
          </Heading>
        </div>
      </div>

      {event.summary && (
        <blockquote className="sk-compact-quote">
          <p>“{event.summary}”</p>
        </blockquote>
      )}

      <div className="sk-compact-footer">
        <span className="sk-compact-meta-left">
          {siblingCount > 1 ? <Layers size={13} /> : renderCategoryIcon(event)}
          <span>{relatedLabel}</span>
        </span>
        <Button
          type="button"
          className="sk-compact-open"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Mở hồ sơ <ArrowRight size={14} />
        </Button>
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
            siblingCount={node.events.length}
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
