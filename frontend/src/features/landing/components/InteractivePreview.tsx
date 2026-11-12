'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, ExternalLink, MapPin } from 'lucide-react';
import { LANDING_ROUTES, spreadEvenly } from '../landing.adapter';
import type { LandingTimelineNode } from '../landing.types';
import { HlButton, SectionHead } from './LandingUi';

const MAX_NODES = 8;

function MiniTimeline({ nodes }: { nodes: LandingTimelineNode[] }) {
  const visible = useMemo(() => spreadEvenly(nodes, MAX_NODES), [nodes]);
  const [index, setIndex] = useState(0);
  const selected = visible[Math.min(index, visible.length - 1)];

  if (!selected) return <p className="hl-preview-empty">Chưa có sự kiện để hiển thị.</p>;

  return (
    <div className="hl-timeline-preview">
      <div className="hl-timeline-track">
        <div className="hl-timeline-line" />
        {visible.map((n, i) => (
          <button type="button" key={n.id} onClick={() => setIndex(i)} className={n.id === selected.id ? 'active' : ''}>
            <span>{n.yearLabel}</span>
            <i />
            <small>{n.title}</small>
          </button>
        ))}
      </div>
      <motion.div key={selected.id} className="hl-timeline-detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hl-big-year">{selected.yearLabel}</div>
        <div>
          <h3>{selected.title}</h3>
          <p>{selected.summary}</p>
          <div className="hl-detail-meta">
            {selected.figure && (
              <span>
                <Crown />
                {selected.figure}
              </span>
            )}
            {selected.location && (
              <span>
                <MapPin />
                {selected.location}
              </span>
            )}
          </div>
        </div>
        <HlButton href={selected.href}>
          Đọc sự kiện
          <ExternalLink />
        </HlButton>
      </motion.div>
    </div>
  );
}

export function InteractivePreview({ nodes }: { nodes: LandingTimelineNode[] }) {
  return (
    <section className="hl-section hl-container">
      <SectionHead
        title="Lịch sử không chỉ để đọc, mà để trải nghiệm"
        description="Tương tác trực quan cùng niên biểu đa tầng và những dấu mốc quan trọng theo dòng thời gian."
      />
      <div className="hl-preview-shell">
        <MiniTimeline nodes={nodes} />
      </div>
      <p className="hl-preview-note">
        Muốn xem đầy đủ? <Link href={LANDING_ROUTES.TIMELINE}>Mở trang Dòng thời gian</Link> để khám phá toàn bộ niên biểu.
      </p>
    </section>
  );
}
