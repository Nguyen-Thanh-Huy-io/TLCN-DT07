export interface LandingSpotlight {
  id: string;
  yearLabel: string;
  era: string;
  region: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  figures: string[];
  href: string;
}

export interface LandingEra {
  id: string;
  name: string;
  years: string;
  region: string;
  subEras: string[];
  eventCount: number;
  figureCount: number;
  imageUrl: string | null;
  size: 'wide' | 'tall' | 'normal';
  href: string;
}

export interface LandingTimelineNode {
  id: string;
  year: number;
  yearLabel: string;
  title: string;
  summary: string;
  figure: string | null;
  location: string | null;
  region: string;
  href: string;
}

export interface ParallelBand {
  id: string;
  name: string;
  years: string;
  region: string;
  start: number;
  end: number;
  href: string;
}

export interface LandingFigure {
  id: string;
  name: string;
  years: string | null;
  roles: string[];
  quote: string | null;
  eventCount: number;
  imageUrl: string | null;
  href: string;
}

export interface LandingLocation {
  id: string;
  name: string;
  address: string | null;
  significance: string | null;
  eventCount: number;
  href: string;
}

export interface LandingCourse {
  id: string;
  title: string;
  kind: string;
  chapters: number;
  lessons: Array<{ id: string; slug: string }>;
  imageUrl: string;
}

export interface LandingQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  href: string;
}

export interface LandingStats {
  events: number;
  figures: number;
  locations: number;
  paths: number;
  regions: number;
}

export interface LandingData {
  regions: string[];
  spotlights: LandingSpotlight[];
  eras: LandingEra[];
  timeline: LandingTimelineNode[];
  bands: ParallelBand[];
  figures: LandingFigure[];
  locations: LandingLocation[];
  courses: LandingCourse[];
  quiz: LandingQuiz | null;
  stats: LandingStats;
}
