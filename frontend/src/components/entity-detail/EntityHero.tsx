'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Landmark,
  ScrollText,
  Sparkles,
  Quote,
} from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { getEntityIconComponent, EntityIconName } from './entity-strategy';

interface EntityHeroProps {
  model: EntityReaderModel;
}

function BadgeIcon({ iconName }: { iconName: EntityIconName }) {
  return React.createElement(getEntityIconComponent(iconName), {
    size: 14,
    className: 'ue-hero-badge-icon',
  });
}

export const EntityHero: React.FC<EntityHeroProps> = ({ model }) => {
  return (
    <section className="ue-hero">
      {/* HỌA TIẾT NỀN HOA VĂN BẢO TÀNG SỐ */}
      <div className="ue-hero-pattern-overlay" aria-hidden="true" />

      <div className="ue-container relative z-10">
        {/* HERO GRID 2 CỘT CÂN ĐỐI */}
        <div className="ue-hero-grid">
          {/* CỘT TRÁI: TIÊU ĐỀ, MÔ TẢ & THẺ CHỈ SỐ NHANH */}
          <div className="ue-hero-left">
            <div className="ue-hero-badge-wrap">
              <div
                className="ue-hero-badge"
                style={{
                  color: model.strategy.themeColor,
                  backgroundColor: model.strategy.themeBg,
                  borderColor: `${model.strategy.themeColor}33`,
                }}
              >
                <BadgeIcon iconName={model.strategy.iconName} />
                <span>{model.strategy.badgeLabel}</span>
              </div>

              {model.hanziName && (
                <span className="ue-hero-hanzi-badge" title="Tên chữ Hán / Miếu hiệu">
                  {model.hanziName}
                </span>
              )}
            </div>

            <p className="ue-hero-eyebrow">{model.strategy.heroEyebrow}</p>
            
            <div className="ue-hero-title-group">
              <h1 className="ue-hero-title">{model.name}</h1>
              {model.hanziName && (
                <span className="ue-hero-title-hanzi">{model.hanziName}</span>
              )}
            </div>

            <div className="ue-hero-meta">
              <span className="ue-meta-item">
                <CalendarDays size={16} className="text-[#8C2D19]" />
                <span className="font-medium">{model.dateLabel}</span>
              </span>

              {model.periodName && model.periodHref && (
                <span className="ue-meta-item">
                  <Landmark size={16} className="text-[#8C6239]" />
                  <Link href={model.periodHref} className="hover:underline text-[#8C2D19] font-medium">
                    {model.periodName}
                  </Link>
                </span>
              )}

              <span className="ue-meta-item">
                <Clock size={16} className="text-[#8C6239]" />
                <span>{model.readMinutes} phút khảo cứu</span>
              </span>
            </div>

            {/* ĐOẠN DẪN NHẬP / TRÍCH LƯỢC CỦA HỒ SƠ */}
            {model.tagline && (
              <div className="ue-hero-lead-card">
                <Quote size={20} className="ue-hero-lead-quote-icon" />
                <p className="ue-hero-lead-text">{model.tagline}</p>
              </div>
            )}

            {/* QUICK STATS: CÁC KHỐI SỐ LIỆU NỔI BẬT ĐƯỢC CHUẨN HÓA LOGIC */}
            {model.quickStats && model.quickStats.length > 0 && (
              <div
                className={`ue-stats-grid ${
                  model.quickStats.length === 3 ? 'ue-stats-grid-3' : ''
                }`}
              >
                {model.quickStats.map((stat) => (
                  <div key={stat.id} className="ue-stat-card">
                    <span
                      className={`ue-stat-value ${
                        stat.value.length > 14 ? 'ue-stat-value-long' : ''
                      }`}
                      title={stat.value}
                    >
                      {stat.value}
                    </span>
                    <span className="ue-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: KHUNG CHÂN DUNG HOÀNG GIA / HIỆN VẬT & HỒ SƠ TÓM LƯỢC */}
          <div className="ue-hero-right-pane">
            {model.imageUrl ? (
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
            ) : (
              /* KHUNG CHÂN DUNG BIỂU TRƯNG HOÀNG GIA KHI CHƯA CÓ ẢNH CHỤP */
              <div className="ue-hero-portrait-fallback">
                <div className="ue-portrait-inner">
                  <div className="ue-portrait-ornament-corner top-left" />
                  <div className="ue-portrait-ornament-corner top-right" />
                  <div className="ue-portrait-ornament-corner bottom-left" />
                  <div className="ue-portrait-ornament-corner bottom-right" />

                  <div className="ue-portrait-header">
                    <Sparkles size={14} className="text-[#B8860B]" />
                    <span className="ue-portrait-category">
                      {model.strategy.heroPortraitBadge}
                    </span>
                    <Sparkles size={14} className="text-[#B8860B]" />
                  </div>

                  {/* HUY HIỆU CON DẤU / CHỮ HÁN THƯ PHÁP CỔ */}
                  <div className="ue-portrait-emblem">
                    <div className="ue-portrait-seal">
                      <span className="ue-portrait-seal-text">
                        {model.hanziName || model.name.slice(0, 2)}
                      </span>
                    </div>
                  </div>

                  <h3 className="ue-portrait-name">{model.name}</h3>
                  <p className="ue-portrait-period">
                    {model.periodName ?? 'Đại Việt Sử Ký Toàn Thư'}
                  </p>
                  
                  <div className="ue-portrait-timeline-pill">
                    <span>{model.dateLabel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* HỒ SƠ TÓM LƯỢC SANG TRỌNG PHONG CÁCH THƯ TỊCH CỔ */}
            {model.facts && model.facts.length > 0 && (
              <div className="ue-hero-infobox">
                <div className="ue-hero-infobox-header">
                  <div className="flex items-center gap-2">
                    <ScrollText size={16} className="text-[#8C2D19]" />
                    <span>HỒ SƠ TÓM LƯỢC</span>
                  </div>
                  <span className="ue-infobox-archive-tag">Tư liệu số</span>
                </div>

                <div className="ue-hero-facts-list">
                  {model.facts.map((fact) => (
                    <div key={fact.id} className="ue-hero-fact-row">
                      <span className="ue-hero-fact-label">{fact.label}</span>
                      <div className="ue-hero-fact-value">
                        {fact.href ? (
                          <Link href={fact.href} className="hover:underline">
                            {fact.value}
                          </Link>
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
