export type TimelineItemType =
  | 'BIRTH'
  | 'DEATH'
  | 'FOUNDING'
  | 'DISSOLUTION'
  | 'EVENT_PARTICIPATION'
  | 'STATEMENT';

export type TimelineDirection = 'OUTGOING' | 'INCOMING' | 'BIDIRECTIONAL';

export interface TimelinePredicate {
  id: string;
  code: string;
  label: string;
  inverseLabel?: string | null;
}

export interface TimelineEventSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnailUrl?: string | null;
  dateText?: string | null;
}

export interface TimelineReferenceSummary {
  id: string;
  title: string;
  author?: string | null;
  pageNumber?: string | null;
  quote?: string | null;
}

export interface PersonTimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  year: number | null;
  month?: number | null;
  day?: number | null;
  dateText?: string | null;
  datePrecision?: string | null;
  role?: string | null;
  roleLabel?: string | null;
  description?: string | null;
  direction?: TimelineDirection;
  predicate?: TimelinePredicate | null;
  event?: TimelineEventSummary | null;
  references?: TimelineReferenceSummary[];
  isPrimary: boolean;
}

export interface PersonTimelineResponse {
  entityId: string;
  entityName: string;
  entityType: string;
  slug: string;
  imageUrl?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  totalMilestones: number;
  items: PersonTimelineItem[];
}
