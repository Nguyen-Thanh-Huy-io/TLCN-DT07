'use client';

import type { PublicEventSummaryDto, PublicPeriodDetailDto } from '@/services/entities/landing.service';
import { formatYear, shortPeriodName } from '../period-detail.adapter';

/** Hai sự kiện cách nhau dưới ngưỡng này (% chiều dài thước) gộp thành một chấm. */
const CLUSTER_GAP_PERCENT = 3;
/** Nhãn trục cách hai đầu dưới ngưỡng này thì bỏ để không đè nhãn đầu/cuối. */
const TICK_EDGE_PERCENT = 10;
/** Chấm nằm trong khoảng này tính từ mép được coi là "ở mép" — nhãn năm của chấm thay cho nhãn mép trục. */
const EDGE_DOT_PERCENT = 2;
const TARGET_TICKS = 4;

interface Cluster {
  pos: number;
  events: PublicEventSummaryDto[];
}

/** Bước nhãn trục tròn: 1 / 2 / 5 × 10ⁿ năm. */
function niceStep(span: number): number {
  const raw = span / TARGET_TICKS;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  return (unit < 1.5 ? 1 : unit < 3.5 ? 2 : unit < 7.5 ? 5 : 10) * pow;
}

function yearRange(events: PublicEventSummaryDto[]): string {
  const first = events[0].startYear;
  const last = events[events.length - 1].startYear;
  return first === last ? formatYear(first) : `${formatYear(first)} – ${formatYear(last)}`;
}

/**
 * Thước thời gian tỉ lệ thật: giai đoạn là dải màu, sự kiện là chấm có ghi năm.
 * Sự kiện quá gần nhau được gộp thành một chấm kèm số lượng để không chồng lên nhau.
 */
export function TimeRuler({ period, onPickStage }: { period: PublicPeriodDetailDto; onPickStage: (id: string) => void }) {
  const start = period.startYear ?? Math.min(...period.events.map((e) => e.startYear));
  const end = period.endYear ?? new Date().getFullYear();
  if (!Number.isFinite(start) || end <= start) return null;
  const span = end - start;
  const pos = (year: number) => Math.min(100, Math.max(0, ((year - start) / span) * 100));

  const clusters: Cluster[] = [];
  for (const e of [...period.events].sort((a, b) => a.startYear - b.startYear)) {
    const p = pos(e.startYear);
    const last = clusters[clusters.length - 1];
    if (last && p - pos(last.events[last.events.length - 1].startYear) < CLUSTER_GAP_PERCENT) last.events.push(e);
    else clusters.push({ pos: p, events: [e] });
  }

  const step = niceStep(span);
  const ticks: number[] = [];
  for (let t = Math.ceil(start / step) * step; t < end; t += step) {
    if (pos(t) > TICK_EDGE_PERCENT && pos(t) < 100 - TICK_EDGE_PERCENT) ticks.push(t);
  }

  return (
    <div className="pd-ruler" aria-label="Thước thời gian của thời kỳ">
      {period.children.length > 0 && (
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
      )}
      <div className="pd-ruler-track">
        {clusters.map((c, i) => {
          const alignClass = c.pos < 8 ? 'align-start' : c.pos > 92 ? 'align-end' : 'align-mid';
          return (
            <a
              key={c.events[0].id}
              href={`#ev-${c.events[0].id}`}
              className={`pd-ruler-dot ${c.events.length > 1 ? 'is-group' : ''} ${i % 2 ? 'label-low' : ''} ${alignClass}`}
              style={{ left: `${c.pos}%` }}
              title={c.events.map((e) => `${formatYear(e.startYear)} · ${e.title}`).join('\n')}
              aria-label={`${yearRange(c.events)}: ${c.events.length} sự kiện`}
            >
              {c.events.length > 1 && <b>{c.events.length}</b>}
              <span className="pd-ruler-dot-label">{yearRange(c.events)}</span>
            </a>
          );
        })}
      </div>
      <div className="pd-ruler-ticks">
        {/* Năm ở mép chỉ ghi khi chưa có chấm sự kiện nằm sẵn ở mép đó (tránh lặp nhãn). */}
        {!(clusters[0]?.pos < EDGE_DOT_PERCENT) && <span className="edge-start">{formatYear(start)}</span>}
        {ticks.map((t) => (
          <span key={t} style={{ left: `${pos(t)}%` }}>
            {formatYear(t)}
          </span>
        ))}
        {!(clusters[clusters.length - 1]?.pos > 100 - EDGE_DOT_PERCENT) && (
          <span className="edge-end">{period.endYear == null ? 'Nay' : formatYear(end)}</span>
        )}
      </div>
    </div>
  );
}
