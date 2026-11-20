'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutGrid, List, MapPin, Users, X } from 'lucide-react';
import { type PublicPeriodDetailDto, type PublicEventSummaryDto } from '@/services/entities/landing.service';
import { PERIOD_ROUTES, eventYearLabel, groupEventsByStage, formatYear, shortPeriodName } from '../period-detail.adapter';
import { categoryKeyLabel, eventCategoryKey, eventCategoryLabel, useEventCategories } from '@/hooks/useEventCategories';
import { RemoteImage } from '@/components/common/RemoteImage';

// === EventStream.tsx ===
export enum EventStreamViewMode {
  LIST = 'list',
  CARDS = 'cards',
}

/** Dòng sự kiện của thời kỳ, chia theo giai đoạn, lọc nhiều danh mục cùng lúc. */
export function EventStream({ period }: { period: PublicPeriodDetailDto }) {
  const eventCategories = useEventCategories();
  const categoryLabel = (key: string) => categoryKeyLabel(eventCategories, key);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of period.events) counts.set(eventCategoryKey(e), (counts.get(eventCategoryKey(e)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [period.events]);
  const [picked, setPicked] = useState<string[]>([]);
  const [view, setView] = useState<EventStreamViewMode>(EventStreamViewMode.LIST);
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const visible = picked.length ? period.events.filter((e) => picked.includes(eventCategoryKey(e))) : period.events;
  const groups = groupEventsByStage(period, visible);

  if (period.events.length === 0) {
    return (
      <div className="pd-empty">
        Chưa có sự kiện nào được xuất bản cho thời kỳ này. Xem phần <a href="#cung-thoi">Cùng thời ở nơi khác</a> để
        đặt thời kỳ vào bối cảnh rộng hơn.
      </div>
    );
  }

  const isListView = view === EventStreamViewMode.LIST;

  return (
    <>
      <div className="pd-stream-toolbar">
        <div className="pd-view-toggle" role="group" aria-label="Kiểu hiển thị sự kiện">
          <button
            type="button"
            className={isListView ? 'active' : ''}
            aria-pressed={isListView}
            onClick={() => setView(EventStreamViewMode.LIST)}
          >
            <List size={14} /> Danh sách
          </button>
          <button
            type="button"
            className={view === EventStreamViewMode.CARDS ? 'active' : ''}
            aria-pressed={view === EventStreamViewMode.CARDS}
            onClick={() => setView(EventStreamViewMode.CARDS)}
          >
            <LayoutGrid size={14} /> Thẻ chi tiết
          </button>
        </div>
      </div>
      {categories.length > 1 && (
        <div className="pd-chips" role="group" aria-label="Lọc theo danh mục">
          {categories.map(([c, n]) => (
            <button key={c} type="button" className={picked.includes(c) ? 'active' : ''} aria-pressed={picked.includes(c)} onClick={() => toggle(c)}>
              {categoryLabel(c)} <small>{n}</small>
            </button>
          ))}
          {picked.length > 0 && (
            <button type="button" className="pd-chip-clear" onClick={() => setPicked([])}>
              <X size={13} /> Bỏ lọc
            </button>
          )}
        </div>
      )}
      <div className="pd-stream">
        {groups.map((g) => (
          <section key={g.id} className="pd-stream-group">
            <header>
              <div>
                <h3>{g.title}</h3>
                <span>
                  {g.years} · {g.events.length} sự kiện
                </span>
              </div>
              {g.href && (
                <Link href={g.href}>
                  Xem giai đoạn <ArrowRight size={14} />
                </Link>
              )}
            </header>
            {isListView ? (
              <ol className="pd-event-list">
                {g.events.map((e) => (
                  <li key={e.id} id={`ev-${e.id}`}>
                    <span className="pd-event-list-year">{eventYearLabel(e)}</span>
                    <div>
                      {e.slug ? <Link href={PERIOD_ROUTES.EVENT(e.slug)}>{e.title}</Link> : <strong>{e.title}</strong>}
                      <small>
                        {eventCategoryLabel(eventCategories, e)}
                        {e.figures.length > 0 && ` · ${e.figures.slice(0, 2).map((f) => f.name).join(', ')}`}
                        {(e.locations[0]?.name || e.location) && ` · ${e.locations[0]?.name ?? e.location}`}
                      </small>
                    </div>
                    {e.slug && (
                      <Link href={PERIOD_ROUTES.EVENT(e.slug)} className="pd-event-list-go" aria-label={`Đọc ${e.title}`}>
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
            <ol>
              {g.events.map((e) => (
                <li key={e.id} id={`ev-${e.id}`} className="pd-event">
                  <div className="pd-event-year">{eventYearLabel(e)}</div>
                  <article>
                    {e.imageUrl && <RemoteImage src={e.imageUrl} alt="" />}
                    <div>
                      <span className="pd-tag">{eventCategoryLabel(eventCategories, e)}</span>
                      <h4>{e.slug ? <Link href={PERIOD_ROUTES.EVENT(e.slug)}>{e.title}</Link> : e.title}</h4>
                      {e.description && <p>{e.description}</p>}
                      <div className="pd-event-meta">
                        {e.figures.length > 0 && (
                          <span>
                            <Users size={13} />
                            {e.figures.slice(0, 3).map((f, i) => (
                              <span key={f.id}>
                                {i > 0 && ', '}
                                <Link href={PERIOD_ROUTES.FIGURE(f.slug)}>{f.name}</Link>
                              </span>
                            ))}
                            {e.figures.length > 3 && ` +${e.figures.length - 3}`}
                          </span>
                        )}
                        {(e.locations[0]?.name || e.location) && (
                          <span>
                            <MapPin size={13} />
                            {e.locations[0]?.slug ? (
                              <Link href={PERIOD_ROUTES.LOCATION(e.locations[0].slug)}>{e.locations[0].name}</Link>
                            ) : (
                              e.locations[0]?.name ?? e.location
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
            )}
          </section>
        ))}
        {groups.length === 0 && <div className="pd-empty">Không có sự kiện thuộc danh mục đã chọn.</div>}
      </div>
    </>
  );
}

// === TimeRuler.tsx ===
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
  // Năm là số nguyên: thời kỳ ngắn (vd. 938–939) không được chia vạch lẻ kiểu 938.2.
  return Math.max(1, (unit < 1.5 ? 1 : unit < 3.5 ? 2 : unit < 7.5 ? 5 : 10) * pow);
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
