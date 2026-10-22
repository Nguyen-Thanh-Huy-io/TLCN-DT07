export interface TimelineEvent {
  id: string;
  dateLabel: string;
  year: number;
  era: string;
  subEra: string;
  category: string;
  scopeGroup: "DOMESTIC" | "WORLD";
  domainGroup: "POLITICS_MILITARY" | "ECONOMY_CULTURE";
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  isMilestone?: boolean;
}

export interface TimelineFigure {
  id: string;
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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TimeNode {
  id: string;
  subEraId: string;
  dateLabel: string;
  sortYear: number;
  nodeType: "POINT" | "SPAN";
  endDateLabel?: string;
  isMilestone?: boolean;
  events: TimelineEvent[];
  figures: TimelineFigure[];
  locations: TimelineLocation[];
  subPhases?: SubEra[];
}

export interface SubEra {
  id: string;
  eraId: string;
  title: string;
  periodLabel: string;
  summary: string;
  themeColor: string;
  quizQuestions?: QuizQuestion[];
  timeNodes: TimeNode[];
}

export interface Era {
  id: string;
  title: string;
  periodLabel: string;
  overview: string;
  subEras: SubEra[];
}
