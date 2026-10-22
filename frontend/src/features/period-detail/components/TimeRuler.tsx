'use client';

import type { PublicPeriodDetailDto } from '@/services/entities/landing.service';
import { formatYear, shortPeriodName } from '../period-detail.adapter';

const TICK_COUNT = 5;

/** Thước thời gian tỉ lệ thật: các giai đoạn là dải màu, mỗi sự kiện là một chấm. */
export function TimeRuler({ period, onPickStage }: { period: PublicPeriodDetailDto; onPickStage: (id: string) => void }) {
  const start = period.startYear ?? Math.min(...period.events.map((e) => e.startYear));
  const end = period.endYear ?? new Date().getFullYear();
  if (!Number.isFinite(start) || end <= start) return null;
  const span = end - start;
  const pos = (year: number) => Math.min(100, Math.max(0, ((year - start) / span) * 100));
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => Math.round(start + (span * i) / (TICK_COUNT - 1)));

  return (
    <div className="pd-ruler" aria-label="Thước thời gian của thời kỳ">
      <div className="pd-ruler-bands">
        {period.children.map((c, i) => {
          const s = c.startYear ?? start;
          const e = c.endYear ?? end;
          return (
            <button
              type="button"
              key={c.id}
              className={`pd-ruler-band tone-${i % 4}`}
              style={{ left: `${pos(s)}%`, width: `${Math.max(1.2, pos(e) - pos(s))}%` }}
              onClick={() => onPickStage(c.id)}
              title={`${c.name} (${c.timeLabel})`}
            >
              <span>{shortPeriodName(c.name)}</span>
            </button>
          );
        })}
      </div>
      <div className="pd-ruler-track">
        {period.events.map((e) => (
          <a
            key={e.id}
            href={`#ev-${e.id}`}
            className="pd-ruler-dot"
            style={{ left: `${pos(e.startYear)}%` }}
            title={`${formatYear(e.startYear)} · ${e.title}`}
            aria-label={`${formatYear(e.startYear)}: ${e.title}`}
          />
        ))}
      </div>
      <div className="pd-ruler-ticks">
        {ticks.map((t, i) => (
          <span key={`${t}-${i}`} style={{ left: `${pos(t)}%` }}>
            {formatYear(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
