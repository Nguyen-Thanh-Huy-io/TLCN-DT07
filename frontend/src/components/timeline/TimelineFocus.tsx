"use client";

import { createContext, useContext } from "react";
import type { TaxonomyTermItem } from "@/services/entities/taxonomy.service";
import { relationLabel } from "@/features/taxonomy/taxonomy-labels";
import { EVENT_RELATION_TYPE_LABELS } from "@/constants/enums";
import type { TimelineActor, TimelineEvent } from "./sk-types";

/** Lý do một sự kiện liên quan tới sự kiện đang chọn. strong = liên kết trực tiếp. */
export interface RelatedReason {
  text: string;
  strong: boolean;
}

export interface TimelineFocusState {
  /** Sự kiện đang bật chế độ "Liên kết" (null = tắt). */
  focus: TimelineEvent | null;
  /** Lăng kính chủ thể: sáng mọi sự kiện có chủ thể này (null = tắt). */
  lens: TimelineActor | null;
  setLens: (actor: TimelineActor | null) => void;
  related: Map<string, RelatedReason[]>;
  setFocus: (event: TimelineEvent | null) => void;
  /** Cuộn tới một mục (sự kiện / mốc kết thúc) và nhấp nháy để dễ thấy. */
  reveal: (domId: string) => void;
  flashId: string | null;
}

export const TimelineFocusContext = createContext<TimelineFocusState>({
  focus: null,
  lens: null,
  setLens: () => undefined,
  related: new Map(),
  setFocus: () => undefined,
  reveal: () => undefined,
  flashId: null,
});

export const useTimelineFocus = () => useContext(TimelineFocusContext);

/**
 * Sự kiện liên quan tới sự kiện đang chọn (đồ thị tri thức đặt lên dòng thời gian):
 *  - trực tiếp: quan hệ giữa sự kiện (nguyên nhân, tiền đề, kết thúc bằng...), sự kiện cha / con;
 *  - gián tiếp: cùng sự kiện cha, cùng nhân vật, cùng địa danh.
 * Liên kết gián tiếp chỉ đi một bước qua nhân vật / địa danh — không lan tiếp để tránh "cái gì
 * cũng liên quan".
 */
export function computeRelated(
  focus: TimelineEvent,
  all: TimelineEvent[],
  relationTerms: TaxonomyTermItem[],
): Map<string, RelatedReason[]> {
  const byId = new Map(all.map((e) => [e.id, e]));
  const out = new Map<string, RelatedReason[]>();
  const add = (id: string, reason: RelatedReason) => {
    if (id === focus.id || !byId.has(id)) return;
    const list = out.get(id) ?? [];
    if (!list.some((r) => r.text === reason.text)) list.push(reason);
    out.set(id, list);
  };

  for (const r of focus.relations) {
    // Nhãn đọc từ phía sự kiện kia: "là nguyên nhân của" ↔ "bắt nguồn trực tiếp từ".
    const label = relationLabel(relationTerms, r.relationType, r.direction === "OUTGOING" ? "INCOMING" : "OUTGOING", EVENT_RELATION_TYPE_LABELS);
    add(r.eventId, { text: `${label} “${focus.title}”`, strong: true });
  }
  if (focus.parentId) {
    add(focus.parentId, { text: "Sự kiện lớn chứa sự kiện này", strong: true });
    for (const e of all) if (e.parentId === focus.parentId) add(e.id, { text: `Cùng thuộc “${byId.get(focus.parentId)?.title ?? "sự kiện lớn"}”`, strong: false });
  }
  for (const e of all) if (e.parentId === focus.id) add(e.id, { text: "Diễn ra trong sự kiện này", strong: true });

  // Chủ thể nhỏ (tổ chức, lực lượng, hiện vật) là liên kết gián tiếp. Triều đại / quốc gia nối tới
  // quá nhiều sự kiện nên không lan qua — xem bằng lăng kính chủ thể thay vào đó.
  const actorIds = new Map(focus.actors.filter((a) => a.type !== "DYNASTY").map((a) => [a.id, a.name]));
  for (const e of all) for (const a of e.actors) if (actorIds.has(a.id)) add(e.id, { text: `Cùng chủ thể ${a.name}`, strong: false });

  const figureIds = new Map(focus.figures.map((f) => [f.id, f.name]));
  const locationIds = new Map(focus.locations.map((l) => [l.id, l.name]));
  for (const e of all) {
    for (const f of e.figures) if (figureIds.has(f.id)) add(e.id, { text: `Cùng nhân vật ${f.name}`, strong: false });
    for (const l of e.locations) if (locationIds.has(l.id)) add(e.id, { text: `Cùng địa danh ${l.name}`, strong: false });
  }
  return out;
}

/** Lăng kính chủ thể: sự kiện có chủ thể này, lý do là vai trò của chủ thể trong sự kiện. */
export function computeLens(actor: TimelineActor, all: TimelineEvent[], roleName: (code: string) => string) {
  const out = new Map<string, RelatedReason[]>();
  for (const e of all) {
    const hit = e.actors.find((a) => a.id === actor.id);
    if (hit) out.set(e.id, [{ text: hit.roleLabel || roleName(hit.role), strong: true }]);
  }
  return out;
}

const eraYear = (y: number) => (y < 0 ? `${Math.abs(y)} TCN` : String(y));

/** "544 – 602" / "1922 – 1991" / "từ 1945". */
export function lifespanLabel(actor: Pick<TimelineActor, "startYear" | "endYear">): string | null {
  if (actor.startYear === null && actor.endYear === null) return null;
  if (actor.endYear === null) return `từ ${eraYear(actor.startYear!)}`;
  if (actor.startYear === null) return `đến ${eraYear(actor.endYear)}`;
  return `${eraYear(actor.startYear)} – ${eraYear(actor.endYear)}`;
}
