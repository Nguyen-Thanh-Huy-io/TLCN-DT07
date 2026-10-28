'use client';

import { useRegionOrder } from '@/features/taxonomy/usePublicTaxonomy';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Columns3, Crown, ExternalLink, History, MapPin } from 'lucide-react';
import { LANDING_ROUTES, formatYear, spreadEvenly } from '../landing.adapter';
import { sortedRegions } from '@/utils/region.utils';
import type { LandingTimelineNode, ParallelBand } from '../landing.types';
import { HlBadge, HlButton, SectionHead, cn } from './LandingUi';

const ALL_REGIONS = 'Tất cả';
const MAX_NODES = 8;
const AXIS_TICKS = [-2500, -1500, -500, 500, 1000, 1500, 2000];

export enum InteractivePreviewTab {
  TIMELINE = 'timeline',
  PARALLEL = 'parallel',
}

function MiniTimeline({ nodes }: { nodes: LandingTimelineNode[] }) {
  const regions = useMemo(() => [ALL_REGIONS, ...new Set(nodes.map((n) => n.region))], [nodes]);
  const [region, setRegion] = useState(ALL_REGIONS);
  const visible = useMemo(
    () => spreadEvenly(region === ALL_REGIONS ? nodes : nodes.filter((n) => n.region === region), MAX_NODES),
    [nodes, region],
  );
  const [index, setIndex] = useState(0);
  const selected = visible[Math.min(index, visible.length - 1)];

  if (!selected) return <p className="hl-preview-empty">Chưa có sự kiện để hiển thị.</p>;

  return (
    <motion.div key="timeline" className="hl-timeline-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {regions.length > 2 && (
        <div className="hl-region-filter" role="group" aria-label="Lọc theo khu vực">
          {regions.map((r) => (
            <button
              type="button"
              key={r}
              className={r === region ? 'active' : ''}
              onClick={() => {
                setRegion(r);
                setIndex(0);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
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
          <HlBadge>{selected.region}</HlBadge>
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
    </motion.div>
  );
}

/** Đặt các thời kỳ của từng khu vực trên cùng một trục năm để thấy chúng diễn ra song song. */
function ParallelEras({ bands }: { bands: ParallelBand[] }) {
  const regionOrder = useRegionOrder();
  const rows = useMemo(() => {
    // Mỗi khu vực một hàng, theo thứ tự chuẩn dùng chung (Việt Nam trước).
    return sortedRegions(
      bands.map((b) => b.region),
      regionOrder,
    ).map(
      (region) => [region, bands.filter((b) => b.region === region)] as const,
    );
  }, [bands, regionOrder]);
  const min = Math.min(...bands.map((b) => b.start));
  const max = Math.max(...bands.map((b) => b.end));
  const span = Math.max(1, max - min);
  const pos = (year: number) => ((year - min) / span) * 100;
  const [activeId, setActiveId] = useState(bands[0]?.id);
  const active = bands.find((b) => b.id === activeId) ?? bands[0];

  if (!active) return <p className="hl-preview-empty">Chưa có thời kỳ để đối sánh.</p>;

  return (
    <motion.div key="parallel" className="hl-parallel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="hl-parallel-scroll">
        <div className="hl-parallel-chart">
          <div className="hl-parallel-axis">
            {AXIS_TICKS.filter((t) => t > min && t < max).map((t) => (
              <span key={t} style={{ left: `${pos(t)}%` }}>
                {formatYear(t)}
              </span>
            ))}
          </div>
          {rows.map(([region, items]) => (
            <div className="hl-parallel-row" key={region}>
              <strong>{region}</strong>
              <div className="hl-parallel-lane">
                {items.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    className={cn('hl-parallel-band', b.id === active.id && 'active')}
                    style={{ left: `${pos(b.start)}%`, width: `${Math.max(1.5, pos(b.end) - pos(b.start))}%` }}
                    onClick={() => setActiveId(b.id)}
                    onMouseEnter={() => setActiveId(b.id)}
                    title={`${b.name} (${b.years})`}
                  >
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hl-parallel-detail">
        <div>
          <HlBadge>{active.region}</HlBadge>
          <h3>{active.name}</h3>
          <p>{active.years}</p>
        </div>
        <div className="hl-parallel-actions">
          <HlButton href={active.href} variant="outline">
            Xem thời kỳ <ExternalLink />
          </HlButton>
          <HlButton href={LANDING_ROUTES.TIMELINE}>Mở Dòng thời gian</HlButton>
        </div>
      </div>
    </motion.div>
  );
}

export function InteractivePreview({ nodes, bands }: { nodes: LandingTimelineNode[]; bands: ParallelBand[] }) {
  const [tab, setTab] = useState<InteractivePreviewTab>(InteractivePreviewTab.TIMELINE);
  return (
    <section className="hl-section hl-container">
      <SectionHead
        eyebrow="Chạm để trải nghiệm"
        title="Lịch sử không chỉ để đọc"
        description="Thử tương tác với niên biểu, hoặc đặt các khu vực cạnh nhau để thấy những gì diễn ra cùng lúc."
      />
      <div className="hl-tabs">
        <button
          type="button"
          className={tab === InteractivePreviewTab.TIMELINE ? 'active' : ''}
          onClick={() => setTab(InteractivePreviewTab.TIMELINE)}
        >
          <History />
          Mini Timeline
        </button>
        <button
          type="button"
          className={tab === InteractivePreviewTab.PARALLEL ? 'active' : ''}
          onClick={() => setTab(InteractivePreviewTab.PARALLEL)}
        >
          <Columns3 />
          Đối sánh khu vực
        </button>
      </div>
      <div className="hl-preview-shell">
        <AnimatePresence mode="wait">
          {tab === InteractivePreviewTab.TIMELINE ? (
            <MiniTimeline key="t" nodes={nodes} />
          ) : (
            <ParallelEras key="p" bands={bands} />
          )}
        </AnimatePresence>
      </div>
      <p className="hl-preview-note">
        Muốn xem đầy đủ? <Link href={LANDING_ROUTES.TIMELINE}>Mở trang Dòng thời gian</Link> để lọc theo quốc gia / khu vực.
      </p>
    </section>
  );
}
