'use client';

import { useMemo } from 'react';
import { openGlobalSearch } from '@/features/search/GlobalSearch';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { LandingData } from '../landing.adapter';
import { LandingHero } from './LandingTopSections';
import { ResumeBar } from './LandingTopSections';
import { CorePillars, EraBento } from './LandingBottomSections';
import { InteractivePreview } from './LandingTopSections';
import { EntitiesSection } from './LandingBottomSections';
import { LearningQuiz } from './LandingBottomSections';
import { JoinBanner, StatsStrip } from './LandingBottomSections';
import '../landing.css';

export function LandingView({ data }: { data: LandingData }) {
  const suggestions = useMemo(() => {
    const eras = data.eras.slice(0, 3).map((era) => ({ label: era.name, href: era.href }));
    const figures = data.figures.slice(0, 2).map((f) => ({ label: f.name, href: f.href }));
    return [...eras, ...figures].slice(0, 5);
  }, [data.eras, data.figures]);

  return (
    <div className="hl-app">
      <Header activeSectionId="explore" />
      <main>
        <LandingHero
          spotlights={data.spotlights}
          stats={data.stats}
          suggestions={suggestions}
          openSearch={openGlobalSearch}
        />
        <ResumeBar courses={data.courses} />
        <CorePillars stats={data.stats} />
        <EraBento eras={data.eras} />
        <InteractivePreview nodes={data.timeline} />
        <EntitiesSection figures={data.figures} locations={data.locations} />
        <LearningQuiz courses={data.courses} quiz={data.quiz} />
        <JoinBanner />
      </main>
      <StatsStrip stats={data.stats} />
      <Footer />
    </div>
  );
}
