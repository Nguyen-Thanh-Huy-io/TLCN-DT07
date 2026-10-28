export enum MentionType {
  FIGURE = "FIGURE",
  LOCATION = "LOCATION",
}

export enum RelationDirection {
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING",
}

export interface EntityMention {
  id: string;
  type: MentionType | string;
  name: string;
  roleLabel: string | null;
  summary: string | null;
  imageUrl: string | null;
  href: string;
  isPrimary: boolean;
}

export interface ChildEventLink {
  id: string;
  title: string;
  href: string;
  dateLabel: string;
}

export interface EventRelationLink {
  id: string;
  title: string;
  href: string;
  dateLabel: string;
  relationType: string;
  relationLabel: string;
  description: string | null;
  direction: RelationDirection | "INCOMING" | "OUTGOING";
}

export interface ArticleSection {
  id: string;
  title: string;
  paragraphs: string[];
  children?: ChildEventLink[];
  participants?: EntityMention[];
  sources?: string[];
  relations?: EventRelationLink[];
}

export interface AdjacentEvent {
  title: string;
  href: string;
  dateLabel: string;
}

export interface EventReaderModel {
  title: string;
  dateLabel: string;
  dateNote: string | null;
  categoryLabel: string;
  periodName: string | null;
  periodHref: string | null;
  parent: { title: string; href: string } | null;
  lead: string | null;
  imageUrl: string | null;
  locationLabel: string | null;
  readMinutes: number;
  mentions: EntityMention[];
  sections: ArticleSection[];
  previous: AdjacentEvent | null;
  next: AdjacentEvent | null;
}
