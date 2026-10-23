export interface TimelineEvent {
  id: string;
  dateLabel: string;
  /** Ghi chú niên đại đầy đủ (có thể dài) — chỉ hiện ở khung chi tiết. */
  dateNote?: string;
  year: number;
  era: string;
  subEra: string;
  /** Display label (Vietnamese). */
  category: string;
  /** Raw EventCategory code from the API. */
  categoryCode: string;
  scopeGroup: "DOMESTIC" | "WORLD";
  /** Khu vực theo Period.region của giai đoạn chứa sự kiện (vd. "Việt Nam", "Châu Á"). */
  region: string;
  domainGroup: "POLITICS_MILITARY" | "ECONOMY_CULTURE";
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  figures: TimelineFigure[];
  locations: TimelineLocation[];
  /** Năm kết thúc nếu sự kiện kéo dài nhiều năm. */
  endYear?: number;
  /** "257 TCN – 208 TCN · 49 năm" cho sự kiện kéo dài. */
  spanLabel?: string;
  parentId?: string | null;
  /** Quan hệ với sự kiện khác (đồ thị tri thức). */
  relations: Array<{ eventId: string; relationType: string; direction: "OUTGOING" | "INCOMING" }>;
  /** Sự kiện đánh dấu kết thúc (quan hệ "Kết thúc bằng"), nếu có. */
  endedByEventId?: string;
}

/** Mốc kết thúc của một sự kiện kéo dài, đặt ở năm kết thúc trên dòng thời gian. */
export interface TimelineEnding {
  eventId: string;
  title: string;
  startLabel: string;
  endLabel: string;
  /** Kết thúc bằng một sự kiện khác (vd. Hiệp định Genève) — mốc này nằm ở sự kiện đó. */
  viaEventId?: string;
  viaTitle?: string;
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
  /** Sự kiện kéo dài kết thúc tại mốc này (mốc có thể chỉ gồm mốc kết thúc, không có sự kiện mới). */
  endings: TimelineEnding[];
}

export interface SubEra {
  id: string;
  /** Slug thời kỳ → trang chi tiết /giai-doan/[slug]. */
  slug: string;
  eraId: string;
  title: string;
  periodLabel: string;
  summary: string;
  themeColor: string;
  timeNodes: TimeNode[];
}

export interface Era {
  id: string;
  slug: string;
  title: string;
  periodLabel: string;
  overview: string;
  subEras: SubEra[];
}
