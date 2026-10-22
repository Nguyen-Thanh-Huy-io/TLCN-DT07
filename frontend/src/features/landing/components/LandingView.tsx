'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { LandingData } from '../landing.types';
import { CommandSearch } from './CommandSearch';
import { LandingHero } from './LandingHero';
import { ResumeBar } from './ResumeBar';
import { CorePillars, EraBento } from './ExploreSections';
import { InteractivePreview } from './InteractivePreview';
import { EntitiesSection } from './EntitiesSection';
import { LearningQuiz } from './LearningQuiz';
import { JoinBanner, StatsStrip } from './JoinBanner';
import '../landing.css';

export function LandingView({ data }: { data: LandingData }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Gợi ý nhanh: một thời kỳ mỗi khu vực + vài nhân vật, để không chỉ nghiêng về một vùng.
  const suggestions = useMemo(() => {
    const perRegion = new Map<string, { label: string; href: string }>();
    for (const era of data.eras) if (!perRegion.has(era.region)) perRegion.set(era.region, { label: era.name, href: era.href });
    const figures = data.figures.slice(0, 2).map((f) => ({ label: f.name, href: f.href }));
    return [...perRegion.values(), ...figures].slice(0, 5);
  }, [data.eras, data.figures]);

  return (
    <div className="hl-app">
      <Header activeSectionId="explore" />
      <main>
        <LandingHero
          spotlights={data.spotlights}
          regions={data.regions}
          stats={data.stats}
          suggestions={suggestions}
          openSearch={() => setSearchOpen(true)}
        />
        <ResumeBar courses={data.courses} />
        <CorePillars stats={data.stats} />
        <EraBento eras={data.eras} />
        <InteractivePreview nodes={data.timeline} bands={data.bands} />
        <EntitiesSection figures={data.figures} locations={data.locations} />
        <LearningQuiz courses={data.courses} quiz={data.quiz} />
        <JoinBanner />
      </main>
      <StatsStrip stats={data.stats} />
      <Footer />
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} entries={data.search} />
    </div>
  );
}
