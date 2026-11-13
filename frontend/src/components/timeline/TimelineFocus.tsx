"use client";

import { createContext, useContext } from "react";
import {
  type TimelineActor,
  type TimelineEvent,
  TimelineActorType,
} from "./sk-types";

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
type AddRelated = (id: string, reason: RelatedReason) => void;

function addDirectRelations(focus: TimelineEvent, add: AddRelated) {
  for (const r of focus.relations) {
    add(r.eventId, { text: `${r.relationType} “${focus.title}”`, strong: true });
  }
}

function addHierarchy(focus: TimelineEvent, all: TimelineEvent[], byId: Map<string, TimelineEvent>, add: AddRelated) {
  if (focus.parentId) {
    const parentTitle = byId.get(focus.parentId)?.title ?? "sự kiện lớn";
    add(focus.parentId, { text: "Sự kiện lớn chứa sự kiện này", strong: true });
    for (const e of all) if (e.parentId === focus.parentId) add(e.id, { text: `Cùng thuộc “${parentTitle}”`, strong: false });
  }
  for (const e of all) if (e.parentId === focus.id) add(e.id, { text: "Diễn ra trong sự kiện này", strong: true });
}

function addSharedBy(
  all: TimelineEvent[],
  ids: Set<string>,
  pick: (e: TimelineEvent) => Array<{ id: string; name: string }>,
  label: string,
  add: AddRelated,
) {
  for (const e of all) for (const x of pick(e)) if (ids.has(x.id)) add(e.id, { text: `${label} ${x.name}`, strong: false });
}

function addSharedEntities(focus: TimelineEvent, all: TimelineEvent[], add: AddRelated) {
  // Chủ thể nhỏ (tổ chức, lực lượng, hiện vật) là liên kết gián tiếp. Triều đại / quốc gia nối tới
  // quá nhiều sự kiện nên không lan qua — xem bằng lăng kính chủ thể thay vào đó.
  const actorIds = new Set(focus.actors.filter((a) => a.type !== TimelineActorType.DYNASTY).map((a) => a.id));
  addSharedBy(all, actorIds, (e) => e.actors, 'Cùng chủ thể', add);
  addSharedBy(all, new Set(focus.figures.map((f) => f.id)), (e) => e.figures, 'Cùng nhân vật', add);
  addSharedBy(all, new Set(focus.locations.map((l) => l.id)), (e) => e.locations, 'Cùng địa danh', add);
}

export function computeRelated(
  focus: TimelineEvent,
  all: TimelineEvent[],
): Map<string, RelatedReason[]> {
  const byId = new Map(all.map((e) => [e.id, e]));
  const out = new Map<string, RelatedReason[]>();
  const add: AddRelated = (id, reason) => {
    if (id === focus.id || !byId.has(id)) return;
    const list = out.get(id) ?? [];
    if (!list.some((r) => r.text === reason.text)) list.push(reason);
    out.set(id, list);
  };

  addDirectRelations(focus, add);
  addHierarchy(focus, all, byId, add);
  addSharedEntities(focus, all, add);
  return out;
}

/** Lăng kính chủ thể: sự kiện có chủ thể này, lý do là vai trò của chủ thể trong sự kiện. */
export function computeLens(actor: TimelineActor, all: TimelineEvent[]) {
  const out = new Map<string, RelatedReason[]>();
  for (const e of all) {
    const hit = e.actors.find((a) => a.id === actor.id);
    if (hit) out.set(e.id, [{ text: hit.roleLabel || hit.role, strong: true }]);
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
