'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Globe2, Play, Search, Sparkles } from 'lucide-react';
import { LANDING_ROUTES } from '../landing.adapter';
import type { LandingSpotlight, LandingStats } from '../landing.types';
import { HlBadge, HlButton, HlCover } from './LandingUi';

export function LandingHero({
  spotlights,
  regions,
  stats,
  suggestions,
  openSearch,
}: {
  spotlights: LandingSpotlight[];
  regions: string[];
  stats: LandingStats;
  suggestions: Array<{ label: string; href: string }>;
  openSearch: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const item = spotlights[slide];
  const change = (delta: number) => setSlide((s) => (s + delta + spotlights.length) % spotlights.length);

  return (
    <section className="hl-hero" id="top">
      <div className="hl-container hl-hero-grid">
        <motion.div
          className="hl-hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <p className="hl-hero-lead">Nền tảng khám phá lịch sử tương tác</p>
          <h1>
            Chạm vào quá khứ.
            <br />
            <em>Hiểu sâu hiện tại.</em>
          </h1>
          <p>
            Khám phá dòng chảy lịch sử Việt Nam và thế giới qua niên biểu đa tầng, những nhân vật làm nên thời
            đại và các lộ trình học có cấu trúc, đặt mỗi sự kiện trong bối cảnh khu vực của nó.
          </p>
          <button className="hl-hero-search" onClick={openSearch} type="button">
            <Search />
            <span>Tìm kiếm sự kiện, nhân vật, thời kỳ, năm...</span>
            <kbd>Ctrl K</kbd>
          </button>
          {suggestions.length > 0 && (
            <div className="hl-suggestions">
              <span>Gợi ý:</span>
              {suggestions.map((s) => (
                <Link key={s.href} href={s.href}>
                  #{s.label}
                </Link>
              ))}
            </div>
          )}
          <div className="hl-hero-ctas">
            <HlButton href={LANDING_ROUTES.TIMELINE}>
              <Compass />
              Khám phá Dòng thời gian
              <ArrowRight />
            </HlButton>
            <HlButton href={LANDING_ROUTES.CURRICULUM} variant="outline">
              <Play />
              Bắt đầu lộ trình học
            </HlButton>
          </div>
          <div className="hl-trust-row">
            <span className="hl-region-chips">
              <Globe2 />
              {regions.slice(0, 4).map((r) => (
                <span key={r}>{r}</span>
              ))}
              {regions.length > 4 && <span>+{regions.length - 4}</span>}
            </span>
            <span>
              <strong>
                {stats.events} sự kiện · {stats.figures} nhân vật
              </strong>
              <br />
              trải trên {stats.regions} vùng lịch sử
            </span>
          </div>
        </motion.div>

        {item && (
          <motion.div
            className="hl-spotlight-shell"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="hl-spotlight-top">
              <h2 className="hl-spotlight-heading">
                <Sparkles size={14} />
                Tâm điểm lịch sử
              </h2>
              <span className="hl-live-dot">{item.region}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.article
                key={item.id}
                className="hl-spotlight-card"
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.3 }}
              >
                <HlCover src={item.imageUrl} alt={item.title} fallbackText={item.yearLabel} />
                <div className="hl-spotlight-overlay" />
                <div className="hl-spotlight-year">
                  <strong>{item.yearLabel}</strong>
                  <span>{item.era}</span>
                </div>
                <div className="hl-spotlight-content">
                  <HlBadge>{item.region}</HlBadge>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  {item.figures.length > 0 && (
                    <div className="hl-spotlight-figures">
                      <span>Nhân vật:</span>
                      {item.figures.map((f) => (
                        <HlBadge key={f}>{f}</HlBadge>
                      ))}
                    </div>
                  )}
                  <Link href={item.href}>
                    Đọc diễn biến chi tiết <ArrowRight />
                  </Link>
                </div>
              </motion.article>
            </AnimatePresence>
            {spotlights.length > 1 && (
              <div className="hl-spotlight-nav">
                <span>
                  {String(slide + 1).padStart(2, '0')} / {String(spotlights.length).padStart(2, '0')}
                </span>
                <div className="hl-dots">
                  {spotlights.map((s, i) => (
                    <button
                      type="button"
                      aria-label={`Chuyển đến mục ${i + 1}`}
                      className={i === slide ? 'active' : ''}
                      key={s.id}
                      onClick={() => setSlide(i)}
                    />
                  ))}
                </div>
                <div>
                  <button type="button" onClick={() => change(-1)} aria-label="Trước">
                    <ChevronLeft />
                  </button>
                  <button type="button" onClick={() => change(1)} aria-label="Sau">
                    <ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
