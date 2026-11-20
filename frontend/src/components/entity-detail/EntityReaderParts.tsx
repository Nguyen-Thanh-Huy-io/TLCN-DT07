'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Landmark, PenLine, ScrollText, Quote } from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { getEntityIconComponent, EntityIconName } from './entity-strategy';
import { formatPublishedDate, hasMeaningfulUpdate } from '@/utils/common';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

interface EntityHeroProps {
  model: EntityReaderModel;
}

function BadgeIcon({ iconName }: { iconName: EntityIconName }) {
  return React.createElement(getEntityIconComponent(iconName), {
    size: 14,
    className: 'ue-hero-badge-icon',
  });
}

function ArticleByline({
  author,
  publishedAt,
  updatedAt,
}: {
  author: EntityReaderModel['author'];
  publishedAt: string | null;
  updatedAt: string | null;
}) {
  const publishedStr = formatPublishedDate(publishedAt ?? updatedAt);
  const updatedStr = hasMeaningfulUpdate(publishedAt, updatedAt)
    ? formatPublishedDate(updatedAt)
    : null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6E5A49]">
      <span className="inline-flex items-center gap-1.5">
        <PenLine size={13} className="text-[#8C6239]" />
        <span>Biên soạn:</span>
        {author?.username ? (
          <Link
            href={PUBLIC_ROUTES.COMMUNITY_MEMBER(author.username)}
            className="font-semibold text-[#8C2D19] hover:underline"
          >
            {author.displayName}
          </Link>
        ) : (
          <span className="font-semibold text-[#4A3828]">Ban biên tập HISGO</span>
        )}
      </span>
      {publishedStr && <span>· Đăng ngày {publishedStr}</span>}
      {updatedStr && <span>· Cập nhật {updatedStr}</span>}
    </div>
  );
}

export const EntityHero: React.FC<EntityHeroProps> = ({ model }) => {
  return (
    <section className="ue-hero">
      {/* HỌA TIẾT NỀN HOA VĂN BẢO TÀNG SỐ */}
      <div className="ue-hero-pattern-overlay" aria-hidden="true" />

      <div className="ue-container relative z-10">
        {/* HERO GRID 2 CỘT CÂN ĐỐI */}
        <div className="ue-hero-grid">
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
            <div className="ue-hero-title-group">
              <h1 className="ue-hero-title">{model.name}</h1>
              {model.hanziName && <span className="ue-hero-title-hanzi">{model.hanziName}</span>}
            </div>
            <div className="ue-hero-meta">
              {model.hasKnownDate && (
                <span className="ue-meta-item">
                  <CalendarDays size={16} className="text-[#8C2D19]" />
                  <span className="font-medium">{model.dateLabel}</span>
                </span>
              )}
              {model.periodName && model.periodHref && (
                <span className="ue-meta-item">
                  <Landmark size={16} className="text-[#8C6239]" />
                  <Link href={model.periodHref} className="font-medium text-[#8C2D19] hover:underline">
                    {model.periodName}
                  </Link>
                </span>
              )}
              <span className="ue-meta-item">
                <Clock size={16} className="text-[#8C6239]" />
                <span>{model.readMinutes} phút khảo cứu</span>
              </span>
            </div>
            <ArticleByline
              author={model.author}
              publishedAt={model.publishedAt}
              updatedAt={model.updatedAt}
            />
            {model.tagline && (
              <div className="ue-hero-lead-card">
                <Quote size={20} className="ue-hero-lead-quote-icon" />
                <p className="ue-hero-lead-text">{model.tagline}</p>
              </div>
            )}
            {model.quickStats && model.quickStats.length > 0 && (
              <div className={`ue-stats-grid ${model.quickStats.length === 3 ? 'ue-stats-grid-3' : ''}`}>
                {model.quickStats.map((stat) => (
                  <div key={stat.id} className="ue-stat-card">
                    <span
                      className={`ue-stat-value ${stat.value.length > 14 ? 'ue-stat-value-long' : ''}`}
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

          <div className="ue-hero-right-pane">
            {model.imageUrl ? (
              <figure className="ue-hero-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={model.imageUrl} alt={model.name} className="ue-hero-image" />
                {model.imageCaption && <figcaption className="ue-hero-caption">{model.imageCaption}</figcaption>}
              </figure>
            ) : (
              <div className="ue-hero-portrait-fallback">
                <div className="ue-portrait-inner">
                  <div className="ue-portrait-ornament-corner top-left" />
                  <div className="ue-portrait-ornament-corner top-right" />
                  <div className="ue-portrait-ornament-corner bottom-left" />
                  <div className="ue-portrait-ornament-corner bottom-right" />
                  <div className="ue-portrait-emblem">
                    <div className="ue-portrait-seal">
                      {model.hanziName ? (
                        <span className="ue-portrait-seal-text">{model.hanziName}</span>
                      ) : (
                        React.createElement(getEntityIconComponent(model.strategy.iconName), {
                          size: 40,
                          className: 'ue-portrait-seal-text',
                        })
                      )}
                    </div>
                  </div>
                  <h3 className="ue-portrait-name">{model.name}</h3>
                  {model.periodName && <p className="ue-portrait-period">{model.periodName}</p>}
                  {model.hasKnownDate && (
                    <div className="ue-portrait-timeline-pill">
                      <span>{model.dateLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
