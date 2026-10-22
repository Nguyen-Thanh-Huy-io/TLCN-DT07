'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarRange, Compass, Globe2, Landmark, Layers, MapPin, Users } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { PublicPeriodDetailDto, PublicPeriodDto } from '@/services/entities/landing.service';
import { PERIOD_ROUTES, formatYear, regionLabel, shortPeriodName } from '../period-detail.adapter';
import { TimeRuler } from './TimeRuler';
import { EventStream } from './EventStream';
import '../period-detail.css';

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : name.slice(0, 2);
}

function lifeSpan(birth: number | null, death: number | null): string | null {
  if (birth == null && death == null) return null;
  return `${birth != null ? formatYear(birth) : '?'} – ${death != null ? formatYear(death) : '?'}`;
}

/** Đánh dấu mục đang đọc trên thanh điều hướng. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const id of key.split('|')) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);
  return active;
}

function SectionHead({ id, eyebrow, title, aside }: { id: string; eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="pd-section-head" id={`${id}-head`}>
      <div>
        <span className="pd-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function PeriodDetailView({
  period,
  siblings,
}: {
  period: PublicPeriodDetailDto;
  siblings: { prev: PublicPeriodDto | null; next: PublicPeriodDto | null };
}) {
  const region = regionLabel(period.region ?? period.parent?.region ?? null);
  const sections = [
    { id: 'tong-quan', label: 'Tổng quan', show: true },
    { id: 'giai-doan', label: `Giai đoạn (${period.children.length})`, show: period.children.length > 0 },
    { id: 'su-kien', label: `Sự kiện (${period.events.length})`, show: true },
    { id: 'nhan-vat', label: `Nhân vật (${period.figures.length})`, show: period.figures.length > 0 },
    { id: 'dia-danh', label: `Địa danh (${period.locations.length})`, show: period.locations.length > 0 },
    {
      id: 'cung-thoi',
      label: 'Cùng thời ở nơi khác',
      show: period.concurrentPeriods.length + period.concurrentEvents.length > 0,
    },
  ].filter((s) => s.show);
  const active = useActiveSection(sections.map((s) => s.id));
  const scrollToStage = (id: string) => document.getElementById(`stage-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const stats = [
    { icon: CalendarRange, value: period.timeLabel, label: 'Thời gian' },
    { icon: Layers, value: period.children.length, label: 'Giai đoạn' },
    { icon: Landmark, value: period.events.length, label: 'Sự kiện' },
    { icon: Users, value: period.figures.length, label: 'Nhân vật' },
    { icon: MapPin, value: period.locations.length, label: 'Địa danh' },
  ];

  return (
    <div className="pd-app">
      <Header activeTab="timeline" />
      <main>
        <section className="pd-hero">
          {period.coverImageUrl && <img src={period.coverImageUrl} alt="" className="pd-hero-img" />}
          <div className="pd-hero-shade" />
          <div className="pd-container pd-hero-inner">
            <nav className="pd-crumbs" aria-label="Đường dẫn">
              <Link href="/">Trang chủ</Link>
              <span>›</span>
              <Link href={PERIOD_ROUTES.TIMELINE}>Dòng thời gian</Link>
              {period.parent && (
                <>
                  <span>›</span>
                  <Link href={PERIOD_ROUTES.PERIOD(period.parent.slug)}>{shortPeriodName(period.parent.name)}</Link>
                </>
              )}
            </nav>
            <div className="pd-hero-badges">
              <span>
                <Globe2 size={14} /> {region}
              </span>
              <span>{period.parent ? 'Giai đoạn' : 'Thời kỳ'}</span>
            </div>
            <h1>{shortPeriodName(period.name)}</h1>
            <p className="pd-hero-years">{period.timeLabel}</p>
            {period.description && <p className="pd-hero-desc">{period.description}</p>}
            <div className="pd-hero-ctas">
              <a href="#su-kien" className="pd-btn pd-btn-primary">
                Đọc dòng sự kiện <ArrowRight size={16} />
              </a>
              <Link href={PERIOD_ROUTES.TIMELINE} className="pd-btn pd-btn-ghost">
                <Compass size={16} /> Mở Dòng thời gian
              </Link>
            </div>
          </div>
        </section>

        <div className="pd-container pd-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <s.icon size={18} />
              <strong>{s.value}</strong>
              <small>{s.label}</small>
            </div>
          ))}
        </div>

        <div className="pd-container pd-layout">
          {/* Mục lục dính theo khi cuộn: các mục lớn + từng giai đoạn, từng sự kiện để nhảy nhanh. */}
          <aside className="pd-sidebar" aria-label="Mục trong trang">
            <span className="pd-sidebar-label">Trong trang này</span>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={active === s.id ? 'active' : ''}>
                    {s.label}
                  </a>
                  {s.id === 'giai-doan' && (
                    <ol className="pd-sidebar-sub">
                      {period.children.map((c) => (
                        <li key={c.id}>
                          <a href={`#stage-${c.id}`}>
                            <small>{c.timeLabel}</small>
                            {shortPeriodName(c.name)}
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}
                  {s.id === 'su-kien' && period.events.length > 0 && (
                    <ol className="pd-sidebar-sub">
                      {period.events.map((e) => (
                        <li key={e.id}>
                          <a href={`#ev-${e.id}`}>
                            <small>{formatYear(e.startYear)}</small>
                            {e.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          </aside>

        <div className="pd-body">
          <section id="tong-quan" className="pd-section">
            <SectionHead id="tong-quan" eyebrow="Tổng quan" title="Thời kỳ trên trục thời gian" />
            <TimeRuler period={period} onPickStage={scrollToStage} />
            <p className="pd-hint">Mỗi dải màu là một giai đoạn, mỗi chấm là một sự kiện — bấm để đi tới.</p>
          </section>

          {period.children.length > 0 && (
            <section id="giai-doan" className="pd-section">
              <SectionHead id="giai-doan" eyebrow="Cấu trúc thời kỳ" title={`${period.children.length} giai đoạn`} />
              <ol className="pd-stages">
                {period.children.map((c, i) => (
                  <li key={c.id} id={`stage-${c.id}`} className={`tone-${i % 4}`}>
                    <span className="pd-stage-no">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{shortPeriodName(c.name)}</h3>
                      <span className="pd-stage-years">
                        {c.timeLabel}
                        {regionLabel(c.region) !== region && ` · ${regionLabel(c.region)}`}
                      </span>
                      {c.description && <p>{c.description}</p>}
                      <div className="pd-stage-foot">
                        <span>
                          {c.eventCount} sự kiện · {c.figureCount} nhân vật
                        </span>
                        <Link href={PERIOD_ROUTES.PERIOD(c.slug)}>
                          Xem chi tiết <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id="su-kien" className="pd-section">
            <SectionHead id="su-kien" eyebrow="Diễn biến" title="Dòng sự kiện" />
            <EventStream period={period} />
          </section>

          {period.figures.length > 0 && (
            <section id="nhan-vat" className="pd-section">
              <SectionHead id="nhan-vat" eyebrow="Con người" title="Nhân vật trong thời kỳ" />
              <div className="pd-figures">
                {period.figures.map((f) => (
                  <Link key={f.id} href={PERIOD_ROUTES.FIGURE(f.slug)} className="pd-figure">
                    {f.imageUrl ? <img src={f.imageUrl} alt="" /> : <span className="pd-initials">{initials(f.name)}</span>}
                    <div>
                      <strong>{f.name}</strong>
                      {lifeSpan(f.birthYear, f.deathYear) && <small>{lifeSpan(f.birthYear, f.deathYear)}</small>}
                      {f.tagline && <p>{f.tagline}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {period.locations.length > 0 && (
            <section id="dia-danh" className="pd-section">
              <SectionHead
                id="dia-danh"
                eyebrow="Không gian"
                title="Địa danh & di tích"
                aside={
                  <Link href={PERIOD_ROUTES.LOCATIONS} className="pd-link">
                    Tất cả di tích <ArrowRight size={14} />
                  </Link>
                }
              />
              <div className="pd-locations">
                {period.locations.map((l) => (
                  <div key={l.id} className="pd-location">
                    <MapPin size={16} />
                    <div>
                      <strong>{l.name}</strong>
                      {l.address && <small>{l.address}</small>}
                      {l.historicalSignificance && <p>{l.historicalSignificance}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sections.some((s) => s.id === 'cung-thoi') && (
            <section id="cung-thoi" className="pd-section">
              <SectionHead id="cung-thoi" eyebrow="Đối sánh" title={`Cùng thời ${period.timeLabel}, ở nơi khác`} />
              <div className="pd-concurrent">
                {period.concurrentPeriods.length > 0 && (
                  <div>
                    <h3>Thời kỳ song song</h3>
                    {period.concurrentPeriods.map((p) => (
                      <Link key={p.id} href={PERIOD_ROUTES.PERIOD(p.slug)} className="pd-concurrent-period">
                        <span>{regionLabel(p.region)}</span>
                        <strong>{shortPeriodName(p.name)}</strong>
                        <small>{p.timeLabel}</small>
                      </Link>
                    ))}
                  </div>
                )}
                {period.concurrentEvents.length > 0 && (
                  <div>
                    <h3>Sự kiện cùng khoảng thời gian</h3>
                    <ul className="pd-concurrent-events">
                      {period.concurrentEvents.map((e) => (
                        <li key={e.id}>
                          <span>{formatYear(e.startYear)}</span>
                          {e.slug ? <Link href={PERIOD_ROUTES.EVENT(e.slug)}>{e.title}</Link> : e.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {(siblings.prev || siblings.next) && (
            <nav className="pd-pager" aria-label="Thời kỳ liền kề">
              {siblings.prev ? (
                <Link href={PERIOD_ROUTES.PERIOD(siblings.prev.slug)}>
                  <ArrowLeft size={16} />
                  <span>
                    <small>Trước đó</small>
                    {shortPeriodName(siblings.prev.name)}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {siblings.next && (
                <Link href={PERIOD_ROUTES.PERIOD(siblings.next.slug)} className="next">
                  <span>
                    <small>Tiếp theo</small>
                    {shortPeriodName(siblings.next.name)}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </nav>
          )}
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
