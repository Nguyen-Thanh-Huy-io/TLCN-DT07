'use client';

import Link from 'next/link';
import { ArrowRight, Award, CalendarDays, Compass, ExternalLink, Hammer, Landmark, MapPin, Navigation, ShieldCheck, Users } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { EVENT_CATEGORY_LABELS, EventCategory } from '@/constants/enums';
import { formatYear, shortPeriodName } from '@/features/search/search-index';
import type { PublicLocationDetailDto } from '@/services/entities/landing.service';
import { regionLabel } from '@/utils/region.utils';
import { SITE_TYPE_ICONS, SiteImage, siteTypeLabel } from './site-ui';
import '@/features/period-detail/period-detail.css';
import './sites.css';

/** Nửa cạnh khung bản đồ quanh di tích, theo độ. */
const MAP_SPAN_DEG = 0.02;

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : name.slice(0, 2);
}

function lifeSpan(birth: number | null, death: number | null): string | null {
  if (birth == null && death == null) return null;
  return `${birth != null ? formatYear(birth) : '?'} – ${death != null ? formatYear(death) : '?'}`;
}

function SiteMap({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const bbox = [lon - MAP_SPAN_DEG, lat - MAP_SPAN_DEG, lon + MAP_SPAN_DEG, lat + MAP_SPAN_DEG].join(',');
  return (
    <div className="st-map">
      <iframe
        title={`Bản đồ ${name}`}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
      />
      <div className="st-map-actions">
        <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`} target="_blank" rel="noreferrer">
          <Navigation size={14} /> Chỉ đường (Google Maps)
        </a>
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`} target="_blank" rel="noreferrer">
          <ExternalLink size={14} /> Xem bản đồ lớn
        </a>
      </div>
    </div>
  );
}

export function SiteDetailView({ site }: { site: PublicLocationDetailDto }) {
  const TypeIcon = SITE_TYPE_ICONS[site.siteType ?? 'OTHER'] ?? MapPin;
  const hasCoords = site.latitude != null && site.longitude != null;
  const facts = [
    { icon: TypeIcon, label: 'Loại di tích', value: siteTypeLabel(site.siteType) },
    site.recognitionLevel && { icon: Award, label: 'Xếp hạng', value: site.recognitionLevel },
    (site.constructionLabel || site.constructionYear != null) && {
      icon: Hammer,
      label: 'Niên đại xây dựng',
      value: site.constructionLabel || formatYear(site.constructionYear as number),
    },
    site.preservationStatus && { icon: ShieldCheck, label: 'Tình trạng bảo tồn', value: site.preservationStatus },
    site.managingAgency && { icon: Landmark, label: 'Đơn vị quản lý', value: site.managingAgency },
    site.period && { icon: Compass, label: 'Thời kỳ', value: shortPeriodName(site.period.name), href: `/giai-doan/${site.period.slug}` },
  ].filter(Boolean) as Array<{ icon: typeof MapPin; label: string; value: string; href?: string }>;

  const gallery = site.media.filter((m) => m.type === 'IMAGE');

  return (
    <div className="pd-app">
      <Header activeTab="di-tich" />
      <main>
        <section className="pd-hero">
          {site.imageUrl && <SiteImage src={site.imageUrl} alt="" siteType={site.siteType} className="pd-hero-img" />}
          <div className="pd-hero-shade" />
          <div className="pd-container pd-hero-inner">
            <nav className="pd-crumbs" aria-label="Đường dẫn">
              <Link href="/">Trang chủ</Link>
              <span>›</span>
              <Link href="/di-tich">Di tích</Link>
            </nav>
            <div className="pd-hero-badges">
              <span>
                <TypeIcon size={14} /> {siteTypeLabel(site.siteType)}
              </span>
              {site.period && <span>{regionLabel(site.period.region)}</span>}
              {site.recognitionLevel && <span>{site.recognitionLevel}</span>}
            </div>
            <h1>{site.name}</h1>
            {site.address && (
              <p className="pd-hero-years">
                <MapPin size={18} className="st-inline-icon" /> {site.address}
              </p>
            )}
            {(site.tagline || site.description) && <p className="pd-hero-desc">{site.tagline || site.description}</p>}
            <div className="pd-hero-ctas">
              {site.events.length > 0 && (
                <a href="#su-kien" className="pd-btn pd-btn-primary">
                  Điều gì đã xảy ra ở đây <ArrowRight size={16} />
                </a>
              )}
              {hasCoords && (
                <a href="#ban-do" className="pd-btn pd-btn-ghost">
                  <MapPin size={16} /> Xem trên bản đồ
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="pd-container pd-stats">
          <div>
            <CalendarDays size={18} />
            <strong>{site.events.length}</strong>
            <small>Sự kiện tại đây</small>
          </div>
          <div>
            <Users size={18} />
            <strong>{site.figures.length}</strong>
            <small>Nhân vật liên quan</small>
          </div>
          <div>
            <TypeIcon size={18} />
            <strong>{siteTypeLabel(site.siteType)}</strong>
            <small>Loại di tích</small>
          </div>
          <div>
            <Compass size={18} />
            <strong>{site.period ? shortPeriodName(site.period.name) : '—'}</strong>
            <small>Thời kỳ</small>
          </div>
          <div>
            <MapPin size={18} />
            <strong>{site.nearby.length}</strong>
            <small>Di tích lân cận</small>
          </div>
        </div>

        <div className="pd-container st-detail">
          <div className="st-detail-main">
            {site.description && site.tagline && (
              <section className="pd-section">
                <div className="pd-section-head">
                  <div>
                    <span className="pd-eyebrow">Giới thiệu</span>
                    <h2>Về {site.name}</h2>
                  </div>
                </div>
                <p className="st-prose">{site.description}</p>
              </section>
            )}

            <section id="su-kien" className="pd-section">
              <div className="pd-section-head">
                <div>
                  <span className="pd-eyebrow">Diễn biến</span>
                  <h2>Sự kiện tại {site.name}</h2>
                </div>
              </div>
              {site.events.length ? (
                <ol className="pd-event-list">
                  {site.events.map((e) => (
                    <li key={e.id}>
                      <span className="pd-event-list-year">{formatYear(e.startYear)}</span>
                      <div>
                        {e.slug ? <Link href={`/su-kien/${e.slug}`}>{e.title}</Link> : <strong>{e.title}</strong>}
                        <small>
                          {EVENT_CATEGORY_LABELS[e.category as EventCategory] ?? e.category}
                          {e.figures.length > 0 && ` · ${e.figures.slice(0, 3).map((f) => f.name).join(', ')}`}
                        </small>
                      </div>
                      {e.slug && (
                        <Link href={`/su-kien/${e.slug}`} className="pd-event-list-go" aria-label={`Đọc ${e.title}`}>
                          <ArrowRight size={16} />
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="pd-empty">Chưa có sự kiện nào được gắn với di tích này.</div>
              )}
            </section>

            {site.figures.length > 0 && (
              <section className="pd-section">
                <div className="pd-section-head">
                  <div>
                    <span className="pd-eyebrow">Con người</span>
                    <h2>Nhân vật gắn với nơi này</h2>
                  </div>
                </div>
                <div className="pd-figures">
                  {site.figures.map((f) => (
                    <Link key={f.id} href={`/nhan-vat/${f.slug}`} className="pd-figure">
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

            {gallery.length > 0 && (
              <section className="pd-section">
                <div className="pd-section-head">
                  <div>
                    <span className="pd-eyebrow">Tư liệu hình ảnh</span>
                    <h2>Thư viện ảnh</h2>
                  </div>
                </div>
                <div className="st-gallery">
                  {gallery.map((m) => (
                    <figure key={m.id}>
                      <SiteImage src={m.url} alt={m.caption ?? site.name} siteType={site.siteType} />
                      {m.caption && <figcaption>{m.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="st-detail-side">
            <div className="st-panel">
              <h3>Thông tin di tích</h3>
              <dl className="st-facts">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt>
                      <f.icon size={14} /> {f.label}
                    </dt>
                    <dd>{f.href ? <Link href={f.href}>{f.value}</Link> : f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="ban-do" className="st-panel">
              <h3>Vị trí</h3>
              {hasCoords ? (
                <SiteMap lat={site.latitude as number} lon={site.longitude as number} name={site.name} />
              ) : (
                <p className="st-muted">Chưa có tọa độ cho di tích này.</p>
              )}
            </div>

            {site.nearby.length > 0 && (
              <div className="st-panel">
                <h3>Di tích lân cận</h3>
                <ul className="st-nearby">
                  {site.nearby.map((n) => (
                    <li key={n.id}>
                      <Link href={`/di-tich/${n.slug}`}>
                        <SiteImage src={n.imageUrl} alt="" siteType={n.siteType} />
                        <span>
                          <strong>{n.name}</strong>
                          <small>
                            {siteTypeLabel(n.siteType)} · cách ~{n.distanceKm.toLocaleString('vi-VN')} km
                          </small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
