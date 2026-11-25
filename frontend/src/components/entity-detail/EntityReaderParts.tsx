'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  Crown,
  Landmark,
  MapPin,
  PenLine,
  Quote,
  ScrollText,
  Sparkles,
  Swords,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { EntityReaderModel, type EntityIconName } from './entity-reader-adapter';
import { formatPublishedDate, hasMeaningfulUpdate } from '@/utils/common';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import type { PublicEntityRelatedArticleDto } from '@/services/entities/landing.service';
import { AuthorFollowButton } from '@/components/common/AuthorFollowButton';

const ICON_MAP: Record<EntityIconName, LucideIcon> = {
  Crown,
  Sparkles,
  Building2,
  Swords,
  UserRound,
  CalendarDays,
  MapPin,
  BookOpen,
};

export function getEntityIconComponent(iconName: EntityIconName | string): LucideIcon {
  return ICON_MAP[iconName as EntityIconName] || BookOpen;
}

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
          <>
            <Link
              href={PUBLIC_ROUTES.COMMUNITY_MEMBER(author.username)}
              className="font-semibold text-[#8C2D19] hover:underline"
            >
              {author.displayName}
            </Link>
            <AuthorFollowButton authorId={author.id} authorUsername={author.username} />
          </>
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
              <Link
                href={PUBLIC_ROUTES.CONCEPT_CANVAS_EXPLORE(model.name, model.slug)}
                className="inline-flex items-center gap-1 rounded-full border border-[#D4BE94] bg-[#FAF5E6] px-2.5 py-0.5 text-xs font-semibold text-[#7A1F24] transition hover:border-[#7A1F24] hover:bg-[#F3E6C8]"
              >
                <Sparkles size={13} />
                <span>Khám phá trên Canvas AI</span>
              </Link>
            </div>
            <ArticleByline
              author={model.author}
              publishedAt={model.publishedAt}
              updatedAt={model.updatedAt}
            />
            {model.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {model.tags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/bai-viet?tag=${encodeURIComponent(tag.name)}`}
                    className="inline-flex items-center rounded-full border border-[#DFD0AC] bg-[#FAF5E8] px-2.5 py-0.5 text-xs font-semibold text-[#6A4C2C] transition hover:border-[#7A1F24] hover:bg-[#F3E6C8] hover:text-[#7A1F24]"
                    title={`Xem các bài viết gắn thẻ ${tag.name}`}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
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

export const RELATED_BY_TAG_SECTION_ID = 'bai-viet-cung-chu-diem';

export function EntityRelatedByTag({ articles }: { articles: PublicEntityRelatedArticleDto[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="ue-kg-section" id={RELATED_BY_TAG_SECTION_ID}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={20} className="text-[#8C6239]" />
        <h2 className="ue-kg-title m-0">Bài viết cùng chủ điểm</h2>
      </div>
      <p className="ue-kg-desc">Các bài viết cùng chủ đề, chuyên mục hoặc thẻ lịch sử để đọc mở rộng:</p>
      <div className="ue-kg-grid">
        {articles.map((item) => (
          <Link key={item.id} href={item.slug ? PUBLIC_ROUTES.ARTICLE(item.slug) : '#'} className="ue-kg-card group">
            <div>
              {item.categoryName && <span className="ue-kg-badge">{item.categoryName}</span>}
              <h3 className="ue-kg-target group-hover:text-[#8C2D19] transition-colors flex items-center justify-between">
                <span>{item.name}</span>
                <ArrowUpRight size={16} className="text-stone-400 group-hover:text-[#8C2D19] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </h3>
              {item.summary && <p className="ue-kg-note line-clamp-3">{item.summary}</p>}
            </div>
            {item.dateLabel && (
              <div className="text-xs text-stone-500 font-semibold mt-3 pt-2 border-t border-stone-200">
                Niên đại: {item.dateLabel}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
