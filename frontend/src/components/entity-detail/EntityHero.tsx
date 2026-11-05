'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { getEntityIconComponent } from './entity-strategy';

interface EntityHeroProps {
  model: EntityReaderModel;
}

export const EntityHero: React.FC<EntityHeroProps> = ({ model }) => {
  const IconComponent = getEntityIconComponent(model.strategy.iconName);

  return (
    <section className="ue-hero">
      <div className="ue-container">
        {/* HERO GRID 2 CỘT */}
        <div className="ue-hero-grid">
          {/* CỘT TRÁI: TIÊU ĐỀ, MÔ TẢ & THẺ CHỈ SỐ NHANH */}
          <div className="ue-hero-left">
            <div
              className="ue-hero-badge"
              style={{
                color: model.strategy.themeColor,
                backgroundColor: model.strategy.themeBg,
              }}
            >
              <IconComponent size={14} />
              <span>{model.strategy.badgeLabel}</span>
            </div>

            <p className="ue-hero-eyebrow">{model.strategy.heroEyebrow}</p>
            <h1 className="ue-hero-title">{model.name}</h1>

            <div className="ue-hero-meta">
              <span className="ue-meta-item">
                <CalendarDays size={16} />
                <span>{model.dateLabel}</span>
              </span>

              {model.periodName && model.periodHref && (
                <span className="ue-meta-item">
                  <Landmark size={16} />
                  <Link href={model.periodHref} className="hover:underline">
                    {model.periodName}
                  </Link>
                </span>
              )}

              <span className="ue-meta-item">
                <Clock size={16} />
                <span>{model.readMinutes} phút đọc</span>
              </span>
            </div>

            {model.tagline && (
              <p className="ue-hero-lead">{model.tagline}</p>
            )}

            {/* QUICK STATS: CÁC KHỐI SỐ LIỆU NỔI BẬT */}
            {model.quickStats && model.quickStats.length > 0 && (
              <div className="ue-stats-grid">
                {model.quickStats.map((stat) => (
                  <div key={stat.id} className="ue-stat-card">
                    <span className="ue-stat-value">{stat.value}</span>
                    <span className="ue-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: HÌNH ẢNH BẢN ĐỒ & HỒ SƠ TÓM LƯỢC TỔNG QUAN */}
          <div className="ue-hero-right-pane">
            {model.imageUrl && (
              <figure className="ue-hero-figure">
                <img
                  src={model.imageUrl}
                  alt={model.name}
                  className="ue-hero-image"
                />
                {model.imageCaption && (
                  <figcaption className="ue-hero-caption">
                    {model.imageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* HỒ SƠ TÓM LƯỢC ĐƯỢC GỘP LÊN HERO */}
            {model.facts && model.facts.length > 0 && (
              <div className="ue-hero-infobox">
                <div className="ue-hero-infobox-header">
                  <Info size={15} />
                  <span>HỒ SƠ TÓM LƯỢC</span>
                </div>
                <div className="ue-hero-facts-list">
                  {model.facts.map((fact) => (
                    <div key={fact.id} className="ue-hero-fact-row">
                      <span className="ue-hero-fact-label">{fact.label}</span>
                      <div className="ue-hero-fact-value">
                        {fact.href ? (
                          <Link href={fact.href}>{fact.value}</Link>
                        ) : (
                          <span>{fact.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
