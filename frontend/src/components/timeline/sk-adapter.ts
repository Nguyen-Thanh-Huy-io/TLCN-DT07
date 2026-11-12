import {
  PublicEventSummaryDto,
  PublicFigureDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from "@/services/entities/landing.service";
import type { TaxonomyTermItem } from "@/services/public/public-taxonomy";
import { eventCategoryLabel, eventCategoryRootCode } from "@/features/taxonomy/taxonomy-labels";
import {
  EventDomainGroup,
  TimelineRelationDirection,
  type Attributed,
  type Era,
  type SubEra,
  type TimeNode,
  type TimelineEvent,
  type TimelineFigure,
  type TimelineLocation,
} from "./sk-types";

function toTimelineFigure(figure: PublicFigureDto): TimelineFigure {
  return {
    id: figure.id,
    slug: figure.slug,
    name: figure.name,
    role: figure.tagline || "Nhân vật lịch sử",
    avatarUrl: figure.imageUrl || undefined,
    bio: figure.description || figure.tagline || "Chưa có thông tin chi tiết.",
  };
}

function toTimelineLocation(location: PublicLocationSummaryDto): TimelineLocation {
  return {
    id: location.id,
    name: location.name,
    modernName: location.address || undefined,
    coordinates:
      location.latitude != null && location.longitude != null
        ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
        : undefined,
    description: location.historicalSignificance || location.address || "Chưa có mô tả chi tiết.",
  };
}

function attributeToEvents<T extends { id: string }>(
  events: TimelineEvent[],
  pick: (event: TimelineEvent) => T[],
): Attributed<T>[] {
  const byId = new Map<string, Attributed<T>>();
  for (const event of events) {
    for (const item of pick(event)) {
      const existing = byId.get(item.id);
      if (existing) existing.eventTitles.push(event.title);
      else byId.set(item.id, { ...item, eventTitles: [event.title] });
    }
  }
  return Array.from(byId.values());
}

const THEME_COLORS = ["green", "amber"];

/** Nhánh gốc của cây loại sự kiện thuộc nhóm "Kinh tế – Văn hóa" trên dòng thời gian. */
const CULTURE_ROOTS = new Set(["SOCIETY_CULTURE", "SCIENCE_DISCOVERY"]);
/** Mã loại sự kiện cũ (chưa gắn cây loại) thuộc nhóm "Kinh tế – Văn hóa". */
const LEGACY_CULTURE_CATEGORY = "CULTURE_SCIENCE";
/** Nhãn liên kết sự kiện → sự kiện kết thúc nó (dùng để vẽ đoạn kéo dài trên trục). */
const ENDED_BY_RELATION = "ENDED_BY";

function domainGroupOf(terms: TaxonomyTermItem[], event: PublicEventSummaryDto): EventDomainGroup {
  const root = eventCategoryRootCode(terms, event);
  const isCulture = root ? CULTURE_ROOTS.has(root) : event.category === LEGACY_CULTURE_CATEGORY;
  return isCulture ? EventDomainGroup.ECONOMY_CULTURE : EventDomainGroup.POLITICS_MILITARY;
}

/** Nhãn ngắn hiển thị trên trục/thẻ. Ghi chú niên đại dài (vd. "Theo truyền thuyết...") chỉ hiện ở chi tiết. */
const MAX_DATE_LABEL_LENGTH = 24;

function yearLabel(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : `Năm ${year}`;
}

function dateLabelOf(event: PublicEventSummaryDto): string {
  const note = event.eventDateNote?.trim();
  return note && note.length <= MAX_DATE_LABEL_LENGTH ? note : yearLabel(event.startYear);
}

function toTimelineEvent(
  event: PublicEventSummaryDto,
  eraTitle: string,
  subEraTitle: string,
  categoryTerms: TaxonomyTermItem[],
): TimelineEvent {
  const label = eventCategoryLabel(categoryTerms, event);
  return {
    id: event.id,
    dateLabel: dateLabelOf(event),
    dateNote: event.eventDateNote || undefined,
    year: event.startYear,
    era: eraTitle,
    subEra: subEraTitle,
    category: label,
    categoryCode: event.category,
    domainGroup: domainGroupOf(categoryTerms, event),
    title: event.title,
    slug: event.slug,
    summary: event.description || "Chưa có mô tả cho sự kiện này.",
    content: event.description || "Chưa có nội dung chi tiết cho sự kiện này.",
    imageUrl: event.imageUrl || undefined,
    tags: event.location ? [event.location] : [],
    figures: event.figures.map(toTimelineFigure),
    locations: event.locations.map(toTimelineLocation),
    ...spanOf(event),
    parentId: event.parentId ?? null,
    relations: event.relations ?? [],
    endedByEventId: event.relations?.find(
      (r) =>
        r.relationType === ENDED_BY_RELATION &&
        r.direction === TimelineRelationDirection.OUTGOING,
    )?.eventId,
    actors: event.actors ?? [],
  };
}

/** Sự kiện kéo dài nhiều năm: năm kết thúc + nhãn khoảng thời gian. */
function spanOf(event: PublicEventSummaryDto): Pick<TimelineEvent, "endYear" | "spanLabel"> {
  const end = event.endYear;
  if (end === null || end === undefined || end <= event.startYear) return {};
  // Không có năm 0: từ 1 TCN tới 1 SCN là 1 năm.
  const years = end - event.startYear - (event.startYear < 0 && end > 0 ? 1 : 0);
  return { endYear: end, spanLabel: `${eraYear(event.startYear)} – ${eraYear(end)} · ${years} năm` };
}

const eraYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

/**
 * Đặt mốc kết thúc của các sự kiện kéo dài: ở sự kiện "Kết thúc bằng" nếu có, không thì ở năm kết
 * thúc — trong giai đoạn chứa năm đó (ưu tiên cùng thời kỳ), thêm mốc riêng nếu năm đó chưa có mốc.
 */
type LeafRanges = Map<string, { start: number; end: number }>;
type EraSub = { era: Era; sub: SubEra };
type EventHome = { node: TimeNode; eraId: string; sub: SubEra };
type Ending = TimeNode['endings'][number];

function indexEventHomes(subs: EraSub[]): Map<string, EventHome> {
  const homes = new Map<string, EventHome>();
  for (const { era, sub } of subs)
    for (const node of sub.timeNodes) for (const ev of node.events) homes.set(ev.id, { node, eraId: era.id, sub });
  return homes;
}

/** Giai đoạn chứa năm kết thúc: ưu tiên cùng thời kỳ, rồi bất kỳ thời kỳ nào, cuối cùng là giai đoạn gốc của sự kiện. */
function subEraForYear(subs: EraSub[], leafRanges: LeafRanges, year: number, home: EventHome): SubEra {
  const contains = (s: SubEra) => {
    const r = leafRanges.get(s.id);
    return r ? r.start <= year && year <= r.end : false;
  };
  return (
    subs.find(({ era, sub }) => era.id === home.eraId && contains(sub))?.sub ??
    subs.find(({ sub }) => contains(sub))?.sub ??
    home.sub
  );
}

/** Gắn mốc kết thúc vào mốc cùng năm nếu có, không thì thêm mốc riêng cho năm đó. */
function attachEndingAtYear(target: SubEra, year: number, ending: Ending) {
  const existing = target.timeNodes.find((n) => n.sortYear === year);
  if (existing) {
    existing.endings.push(ending);
    return;
  }
  target.timeNodes.push({
    id: `end-node-${ending.eventId}`,
    subEraId: target.id,
    dateLabel: yearLabel(year),
    sortYear: year,
    events: [],
    figures: [],
    locations: [],
    endings: [ending],
  });
  target.timeNodes.sort((a, b) => a.sortYear - b.sortYear);
}

function placeEndings(eras: Era[], leafRanges: LeafRanges) {
  const subs = eras.flatMap((era) => era.subEras.map((sub) => ({ era, sub })));
  const homes = indexEventHomes(subs);

  for (const [eventId, home] of homes) {
    const ev = home.node.events.find((e) => e.id === eventId)!;
    const startLabel = eraYear(ev.year);
    const via = ev.endedByEventId ? homes.get(ev.endedByEventId) : undefined;
    if (via) {
      const viaEvent = via.node.events.find((e) => e.id === ev.endedByEventId)!;
      via.node.endings.push({
        eventId,
        title: ev.title,
        startLabel,
        endLabel: eraYear(viaEvent.year),
        viaEventId: viaEvent.id,
        viaTitle: viaEvent.title,
      });
      continue;
    }
    if (ev.endYear === undefined) continue;
    const target = subEraForYear(subs, leafRanges, ev.endYear, home);
    attachEndingAtYear(target, ev.endYear, { eventId, title: ev.title, startLabel, endLabel: eraYear(ev.endYear) });
  }
}

export function buildEraDataset(
  periods: PublicPeriodDto[],
  events: PublicEventSummaryDto[],
  categoryTerms: TaxonomyTermItem[] = [],
): Era[] {
  const topPeriods = periods
    .filter((p) => !p.parentId)
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));

  const eventsByPeriodSlug = new Map<string, PublicEventSummaryDto[]>();
  for (const event of events) {
    if (!event.periodSlug) continue;
    const list = eventsByPeriodSlug.get(event.periodSlug) || [];
    list.push(event);
    eventsByPeriodSlug.set(event.periodSlug, list);
  }

  // Khoảng năm của từng giai đoạn — để đặt mốc kết thúc đúng giai đoạn.
  const leafRanges = new Map(
    periods
      .filter((p) => p.parentId)
      .map((p) => [p.id, { start: p.startYear ?? -Infinity, end: p.endYear ?? Infinity }]),
  );

  const eras = topPeriods.map((top): Era => {
    const children = periods
      .filter((p) => p.parentId === top.id)
      .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));
    // Thời kỳ gốc không có giai đoạn con (vd. "Cách mạng tháng Tám") vẫn cần hiện lên —
    // coi chính nó là 1 "leaf" duy nhất, nếu không mọi sự kiện gắn thẳng vào nó sẽ bị bỏ
    // qua hoàn toàn (subEras rỗng → era bị lọc khỏi dòng thời gian, xem cuối hàm).
    const leafPeriods = children.length > 0 ? children : [top];

    const subEras: SubEra[] = leafPeriods.map((leaf, leafIndex): SubEra => {
      const leafEvents = (eventsByPeriodSlug.get(leaf.slug) || []).sort((a, b) => a.startYear - b.startYear);
      const nodesByYear = new Map<number, PublicEventSummaryDto[]>();
      for (const event of leafEvents) {
        const list = nodesByYear.get(event.startYear) || [];
        list.push(event);
        nodesByYear.set(event.startYear, list);
      }

      const timeNodes: TimeNode[] = Array.from(nodesByYear.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, yearEvents]): TimeNode => {
          const events = yearEvents.map((e) => toTimelineEvent(e, top.name, leaf.name, categoryTerms));
          return {
            id: `node-${yearEvents[0].id}`,
            subEraId: leaf.id,
            dateLabel: yearEvents.length > 1 ? yearLabel(year) : dateLabelOf(yearEvents[0]),
            sortYear: year,
            events,
            // A node can bundle unrelated events that share a year, so each entry
            // records which of those events it actually takes part in.
            figures: attributeToEvents(events, (e) => e.figures),
            locations: attributeToEvents(events, (e) => e.locations),
            endings: [],
          };
        });

      return {
        id: leaf.id,
        slug: leaf.slug,
        eraId: top.id,
        title: leaf.name,
        periodLabel: leaf.timeLabel,
        summary: leaf.description || "",
        themeColor: THEME_COLORS[leafIndex % THEME_COLORS.length],
        timeNodes,
      };
    }).filter((subEra) => subEra.timeNodes.length > 0);

    return {
      id: top.id,
      slug: top.slug,
      title: top.name,
      periodLabel: top.timeLabel,
      overview: top.description || "",
      subEras,
    };
  }).filter((era) => era.subEras.length > 0);

  placeEndings(eras, leafRanges);
  return eras;
}
