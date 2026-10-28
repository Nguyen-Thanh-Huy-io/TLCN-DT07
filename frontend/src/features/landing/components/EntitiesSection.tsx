'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Layers3, MapPin, Users } from 'lucide-react';
import { LANDING_ROUTES } from '../landing.adapter';
import type { LandingFigure, LandingLocation } from '../landing.types';
import { HlBadge, HlButton, SectionHead } from './LandingUi';

export enum EntitySectionTab {
  FIGURES = 'figures',
  LOCATIONS = 'locations',
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : name.slice(0, 2);
}

export function EntitiesSection({ figures, locations }: { figures: LandingFigure[]; locations: LandingLocation[] }) {
  const [tab, setTab] = useState<EntitySectionTab>(EntitySectionTab.FIGURES);
  if (figures.length === 0 && locations.length === 0) return null;

  const isFiguresTab = tab === EntitySectionTab.FIGURES;

  return (
    <section className="hl-section hl-entities-section" id="characters">
      <div className="hl-container">
        <SectionHead
          eyebrow="Con người & Không gian"
          title="Những dấu ấn còn mãi"
          description="Gặp những con người làm nên thời đại và những địa danh còn lưu dấu sự kiện."
          action={
            <HlButton href={isFiguresTab ? LANDING_ROUTES.FIGURES : LANDING_ROUTES.LOCATIONS} variant="ghost">
              {isFiguresTab ? 'Tất cả nhân vật' : 'Tất cả di tích'}
              <ArrowRight />
            </HlButton>
          }
        />
        <div className="hl-tabs">
          <button
            type="button"
            className={isFiguresTab ? 'active' : ''}
            onClick={() => setTab(EntitySectionTab.FIGURES)}
          >
            <Users />
            Nhân vật tiêu biểu
          </button>
          <button
            type="button"
            className={tab === EntitySectionTab.LOCATIONS ? 'active' : ''}
            onClick={() => setTab(EntitySectionTab.LOCATIONS)}
          >
            <MapPin />
            Di tích & Địa danh
          </button>
        </div>
        <AnimatePresence mode="wait">
          {isFiguresTab ? (
            <motion.div className="hl-figure-grid" key={EntitySectionTab.FIGURES} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {figures.map((f) => (
                <article className="hl-figure-card" key={f.id}>
                  <div className="hl-figure-top">
                    {f.imageUrl ? (
                      <img src={f.imageUrl} alt={f.name} />
                    ) : (
                      <span className="hl-figure-initials">{initials(f.name)}</span>
                    )}
                    <div>
                      {f.years && <HlBadge>{f.years}</HlBadge>}
                      <h3>{f.name}</h3>
                      {f.roles.length > 0 && (
                        <div>
                          {f.roles.map((r) => (
                            <span key={r}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {f.quote && <blockquote>“{f.quote}”</blockquote>}
                  <div className="hl-figure-foot">
                    <span>
                      <Layers3 />
                      {f.eventCount} sự kiện liên quan
                    </span>
                    <Link href={f.href}>
                      Mở hồ sơ
                      <ArrowRight />
                    </Link>
                  </div>
                </article>
              ))}
            </motion.div>
          ) : (
            <motion.div className="hl-location-grid" key={EntitySectionTab.LOCATIONS} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {locations.map((l) => (
                <Link href={l.href} className="hl-location-card" key={l.id}>
                  <HlBadge>{l.eventCount} sự kiện gắn với nơi này</HlBadge>
                  <h3>{l.name}</h3>
                  {l.significance && <p>{l.significance}</p>}
                  {l.address && (
                    <small>
                      <MapPin />
                      {l.address}
                    </small>
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
