export interface TimelineEvent {
  id: string;
  dateLabel: string;
  year: number;
  era: string;
  subEra: string;
  /** Display label (Vietnamese). */
  category: string;
  /** Raw EventCategory code from the API. */
  categoryCode: string;
  scopeGroup: "DOMESTIC" | "WORLD";
  domainGroup: "POLITICS_MILITARY" | "ECONOMY_CULTURE";
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  figures: TimelineFigure[];
  locations: TimelineLocation[];
}

export interface TimelineFigure {
  id: string;
  slug?: string;
  name: string;
  role: string;
  avatarUrl?: string;
  bio: string;
}

export interface TimelineLocation {
  id: string;
  name: string;
  modernName?: string;
  coordinates?: string;
  description: string;
}

/** A node-level entry keeps the titles of the node's events it actually belongs to. */
export type Attributed<T> = T & { eventTitles: string[] };

export interface TimeNode {
  id: string;
  subEraId: string;
  dateLabel: string;
  sortYear: number;
  events: TimelineEvent[];
  figures: Attributed<TimelineFigure>[];
  locations: Attributed<TimelineLocation>[];
}

export interface SubEra {
  id: string;
  eraId: string;
  title: string;
  periodLabel: string;
  summary: string;
  themeColor: string;
  timeNodes: TimeNode[];
}

export interface Era {
  id: string;
  title: string;
  periodLabel: string;
  overview: string;
  subEras: SubEra[];
}
