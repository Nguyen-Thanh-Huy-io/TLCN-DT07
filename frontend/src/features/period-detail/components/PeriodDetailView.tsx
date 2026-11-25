'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarRange,
  ChevronDown,
  Compass,
  FolderTree,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { PublicPeriodDetailDto, PublicPeriodDto } from '@/services/entities/landing.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { useEventCategories } from '@/hooks/useEventCategories';
import { resolvePeriodEventCategory } from '../utils/period-category-filter.strategy';
import { PERIOD_ROUTES, formatYear, shortPeriodName, TimeRuler, EventStream } from './PeriodDetailParts';
import '../period-detail.css';
import { RemoteImage } from '@/components/common/CommonUi';

export enum PeriodSectionId {
  OVERVIEW = 'tong-quan',
  STAGES = 'giai-doan',
  EVENTS = 'su-kien',
  CONCURRENT = 'cung-thoi',
}

function resolvePeriodTimeLabel(period: PublicPeriodDetailDto): string {
  if (period.timeLabel?.trim()) return period.timeLabel.trim();
  const years: number[] = [];
  if (period.startYear != null && period.startYear !== 0) years.push(period.startYear);
  if (period.endYear != null && period.endYear !== 0) years.push(period.endYear);
  for (const c of period.children) {
    if (c.startYear != null && c.startYear !== 0) years.push(c.startYear);
    if (c.endYear != null && c.endYear !== 0) years.push(c.endYear);
  }
  for (const e of period.events) {
    if (e.startYear != null && e.startYear !== 0) years.push(e.startYear);
  }
  if (years.length === 0) return '';
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  return minY === maxY ? formatYear(minY) : `${formatYear(minY)} – ${formatYear(maxY)}`;
}

/** Đánh dấu mục đang đọc trên thanh điều hướng. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    for (const id of key.split('|')) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);
  return active;
}

function SectionHead({
  id,
  title,
  subtitle,
  aside,
}: {
  id: string;
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="pd-section-head" id={`${id}-head`}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="pd-section-subtitle">{subtitle}</p>}
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
  const hasConcurrent = period.concurrentPeriods.length > 0;
  const sections = [
    { id: PeriodSectionId.OVERVIEW, label: 'Tổng quan', show: true },
    {
      id: PeriodSectionId.STAGES,
      label: `Giai đoạn (${period.children.length})`,
      show: period.children.length > 0,
    },
    {
      id: PeriodSectionId.EVENTS,
      label: `Biên niên & Bài viết (${period.events.length.toLocaleString('vi-VN')})`,
      show: true,
    },
    {
      id: PeriodSectionId.CONCURRENT,
      label: `Cùng thời (${period.concurrentPeriods.length})`,
      show: hasConcurrent,
    },
  ].filter((s) => s.show);

  const active = useActiveSection(sections.map((s) => s.id));
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const scrollToStage = (id: string) =>
    document.getElementById(`stage-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const eventCategories = useEventCategories();
  const resolvedTimeLabel = resolvePeriodTimeLabel(period);
  const categoryCount = useMemo(() => {
    const leafIds = new Set(
      period.events.map((e) => resolvePeriodEventCategory(eventCategories, e).leafId),
    );
    return leafIds.size;
  }, [period.events, eventCategories]);

  const stats = [
    {
      icon: CalendarRange,
      value: resolvedTimeLabel,
      label: 'Thời gian',
      show: Boolean(resolvedTimeLabel),
    },
    {
      icon: Layers,
      value: period.children.length.toLocaleString('vi-VN'),
      label: 'Giai đoạn con',
      show: period.children.length > 0,
    },
    {
      icon: BookOpen,
      value: period.events.length.toLocaleString('vi-VN'),
      label: 'Mốc & Bài viết',
      show: true,
    },
    {
      icon: FolderTree,
      value: categoryCount.toLocaleString('vi-VN'),
      label: 'Chuyên mục',
      show: categoryCount > 1,
    },
  ].filter((s) => s.show);

  return (
    <div className="pd-app">
      <Header activeTab="timeline" />
      <main>
        <section className="pd-hero">
          {period.coverImageUrl && (
            <RemoteImage src={period.coverImageUrl} alt="" className="pd-hero-img" />
          )}
          <div className="pd-hero-shade" />
          <div className="pd-container pd-hero-inner">
            <nav className="pd-crumbs" aria-label="Đường dẫn">
              <Link href="/">Trang chủ</Link>
              <span>›</span>
              <Link href={PERIOD_ROUTES.TIMELINE}>Dòng thời gian</Link>
              {period.parent && (
                <>
                  <span>›</span>
                  <Link href={PERIOD_ROUTES.PERIOD(period.parent.slug)}>
                    {shortPeriodName(period.parent.name)}
                  </Link>
                </>
              )}
            </nav>
            <div className="pd-hero-badges">
              <span>{period.parent ? 'Giai đoạn' : 'Thời kỳ'}</span>
            </div>
            <h1>{shortPeriodName(period.name)}</h1>
            {resolvedTimeLabel && <p className="pd-hero-years">{resolvedTimeLabel}</p>}
            {period.description && <p className="pd-hero-desc">{period.description}</p>}
            <div className="pd-hero-ctas">
              <a href={`#${PeriodSectionId.EVENTS}`} className="pd-btn pd-btn-primary">
                Khám phá tư liệu <ArrowRight size={16} />
              </a>
              <Link
                href={PUBLIC_ROUTES.CONCEPT_CANVAS_EXPLORE(shortPeriodName(period.name))}
                className="pd-btn pd-btn-ai"
              >
                <Sparkles size={16} /> Khám phá trên Canvas AI
              </Link>
              <Link href={PERIOD_ROUTES.TIMELINE} className="pd-btn pd-btn-ghost">
                <Compass size={16} /> Mở Dòng thời gian
              </Link>
            </div>
          </div>
        </section>

        <div
          className="pd-container pd-stats"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, stats.length)}, minmax(0, 1fr))` }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <s.icon size={18} />
              <strong>{s.value}</strong>
              <small>{s.label}</small>
            </div>
          ))}
        </div>

        <div className="pd-container pd-layout">
          <aside className="pd-sidebar" aria-label="Mục trong trang">
            <span className="pd-sidebar-label">Trong trang này</span>
            <ol>
              {sections.map((s) => {
                const hasSub = s.id === PeriodSectionId.STAGES && period.children.length > 0;
                const open = hasSub && (toggled[s.id] ?? active === s.id);
                return (
                  <li key={s.id}>
                    <div className="pd-sidebar-row">
                      <a href={`#${s.id}`} className={active === s.id ? 'active' : ''}>
                        {s.label}
                      </a>
                      {hasSub && (
                        <button
                          type="button"
                          className={`pd-sidebar-toggle ${open ? 'open' : ''}`}
                          aria-expanded={open}
                          aria-label={open ? `Thu gọn ${s.label}` : `Mở danh sách ${s.label}`}
                          onClick={() => setToggled((t) => ({ ...t, [s.id]: !open }))}
                        >
                          <ChevronDown size={15} />
                        </button>
                      )}
                    </div>
                    {open && s.id === PeriodSectionId.STAGES && (
                      <ol className="pd-sidebar-sub">
                        {period.children.map((c) => (
                          <li key={c.id}>
                            <a href={`#stage-${c.id}`}>
                              {c.timeLabel && <small>{c.timeLabel}</small>}
                              {shortPeriodName(c.name)}
                            </a>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="pd-body">
            <section id={PeriodSectionId.OVERVIEW} className="pd-section">
              <SectionHead
                id={PeriodSectionId.OVERVIEW}
                title="Tổng quan trên trục thời gian"
                subtitle="Phân bổ các giai đoạn và mật độ tư liệu lịch sử theo dòng niên đại"
              />
              <TimeRuler period={period} onPickStage={scrollToStage} />
              <p className="pd-hint">
                Mỗi dải màu là một giai đoạn, mỗi chấm là cụm mốc &amp; bài viết — bấm để di chuyển nhanh.
              </p>
            </section>

            {period.children.length > 0 && (
              <section id={PeriodSectionId.STAGES} className="pd-section">
                <SectionHead
                  id={PeriodSectionId.STAGES}
                  title={`Các giai đoạn trực thuộc (${period.children.length})`}
                  subtitle="Phân chia các chặng phát triển và bước ngoặt lịch sử trong thời kỳ"
                />
                <ol className="pd-stages">
                  {period.children.map((c, i) => (
                    <li key={c.id} id={`stage-${c.id}`} className={`tone-${i % 4}`}>
                      <span className="pd-stage-no">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <h3>{shortPeriodName(c.name)}</h3>
                        {c.timeLabel && <span className="pd-stage-years">{c.timeLabel}</span>}
                        {c.description && <p>{c.description}</p>}
                        <div className="pd-stage-foot">
                          <span>{c.eventCount.toLocaleString('vi-VN')} mốc &amp; bài viết</span>
                          <div className="pd-stage-actions">
                            <Link
                              href={PUBLIC_ROUTES.CONCEPT_CANVAS_EXPLORE(shortPeriodName(c.name))}
                              className="pd-stage-ai-link"
                              title={`Khám phá "${shortPeriodName(c.name)}" trên Canvas AI`}
                            >
                              <Sparkles size={13} /> Canvas AI
                            </Link>
                            <Link href={PERIOD_ROUTES.PERIOD(c.slug)}>
                              Xem chi tiết <ArrowRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section id={PeriodSectionId.EVENTS} className="pd-section">
              <SectionHead
                id={PeriodSectionId.EVENTS}
                title="Biên niên & Bài viết theo chuyên mục"
                subtitle="Toàn bộ mốc thời gian và bài viết tra cứu thuộc thời kỳ, lọc linh hoạt theo chuyên mục"
              />
              <EventStream period={period} />
            </section>

            {hasConcurrent && (
              <section id={PeriodSectionId.CONCURRENT} className="pd-section">
                <SectionHead
                  id={PeriodSectionId.CONCURRENT}
                  title={resolvedTimeLabel ? `Thời kỳ song song (${resolvedTimeLabel})` : 'Thời kỳ song song'}
                  subtitle="Đối chiếu bối cảnh lịch sử cùng cấp độ diễn ra đồng thời"
                />
                <div className="pd-concurrent-grid">
                  {period.concurrentPeriods.map((p) => (
                    <Link
                      key={p.id}
                      href={PERIOD_ROUTES.PERIOD(p.slug)}
                      className="pd-concurrent-card"
                    >
                      <div className="pd-concurrent-card-body">
                        {p.timeLabel && <small className="pd-concurrent-years">{p.timeLabel}</small>}
                        <strong>{shortPeriodName(p.name)}</strong>
                        {p.description && <p>{p.description}</p>}
                      </div>
                      <span className="pd-concurrent-go">
                        Khám phá <ArrowRight size={14} />
                      </span>
                    </Link>
                  ))}
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
