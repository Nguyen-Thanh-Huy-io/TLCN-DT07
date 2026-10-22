'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutGrid, List, MapPin, Users, X } from 'lucide-react';
import type { PublicPeriodDetailDto } from '@/services/entities/landing.service';
import { PERIOD_ROUTES, categoryLabel, eventYearLabel, groupEventsByStage } from '../period-detail.adapter';

/** Dòng sự kiện của thời kỳ, chia theo giai đoạn, lọc nhiều danh mục cùng lúc. */
export function EventStream({ period }: { period: PublicPeriodDetailDto }) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of period.events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [period.events]);
  const [picked, setPicked] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'cards'>('list');
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const visible = picked.length ? period.events.filter((e) => picked.includes(e.category)) : period.events;
  const groups = groupEventsByStage(period, visible);

  if (period.events.length === 0) {
    return (
      <div className="pd-empty">
        Chưa có sự kiện nào được xuất bản cho thời kỳ này. Xem phần <a href="#cung-thoi">Cùng thời ở nơi khác</a> để
        đặt thời kỳ vào bối cảnh rộng hơn.
      </div>
    );
  }

  return (
    <>
      <div className="pd-stream-toolbar">
        <div className="pd-view-toggle" role="group" aria-label="Kiểu hiển thị sự kiện">
          <button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <List size={14} /> Danh sách
          </button>
          <button type="button" className={view === 'cards' ? 'active' : ''} aria-pressed={view === 'cards'} onClick={() => setView('cards')}>
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
            {view === 'list' ? (
              <ol className="pd-event-list">
                {g.events.map((e) => (
                  <li key={e.id} id={`ev-${e.id}`}>
                    <span className="pd-event-list-year">{eventYearLabel(e)}</span>
                    <div>
                      {e.slug ? <Link href={PERIOD_ROUTES.EVENT(e.slug)}>{e.title}</Link> : <strong>{e.title}</strong>}
                      <small>
                        {categoryLabel(e.category)}
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
                    {e.imageUrl && <img src={e.imageUrl} alt="" />}
                    <div>
                      <span className="pd-tag">{categoryLabel(e.category)}</span>
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
                            {e.locations[0]?.name ?? e.location}
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
