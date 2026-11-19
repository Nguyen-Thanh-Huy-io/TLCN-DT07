export const NOTE_TARGET_TYPE = {
  ARTICLE: 'ARTICLE',
  LESSON: 'LESSON',
} as const;

export type NoteTargetTypeValue =
  (typeof NOTE_TARGET_TYPE)[keyof typeof NOTE_TARGET_TYPE];

export const NOTE_COLOR = {
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
  BLUE: 'BLUE',
  PINK: 'PINK',
  PURPLE: 'PURPLE',
} as const;

export type NoteColorValue = (typeof NOTE_COLOR)[keyof typeof NOTE_COLOR];

/** Khớp enum NoteKind ở backend/prisma/schema/note.prisma. */
export const NOTE_KIND = {
  HIGHLIGHT: 'HIGHLIGHT',
  NOTE: 'NOTE',
  DEFINITION: 'DEFINITION',
  QUESTION: 'QUESTION',
  IMPORTANT: 'IMPORTANT',
  SUMMARY: 'SUMMARY',
} as const;

export type NoteKindValue = (typeof NOTE_KIND)[keyof typeof NOTE_KIND];

/** Khớp enum NoteAnchorMode ở backend/src/note/note.constant.ts. */
export const NOTE_ANCHOR_MODE = {
  INLINE: 'INLINE',
  BLOCK: 'BLOCK',
  HEADING: 'HEADING',
  INK: 'INK',
} as const;

export type NoteAnchorModeValue = (typeof NOTE_ANCHOR_MODE)[keyof typeof NOTE_ANCHOR_MODE];

/** Khớp enum NoteInkTool ở backend/src/note/note.constant.ts. */
export const NOTE_INK_TOOL = {
  PEN: 'PEN',
  HIGHLIGHTER: 'HIGHLIGHTER',
  TEXT: 'TEXT',
} as const;

export type NoteInkToolValue = (typeof NOTE_INK_TOOL)[keyof typeof NOTE_INK_TOOL];

export interface NoteInkItem {
  id: string;
  tool: NoteInkToolValue;
  color: NoteColorValue;
  width?: number;
  pts?: number[];
  blockEnd?: number;
  text?: string;
  nx?: number;
  ny?: number;
}

/** Khớp enum NoteMarkupStyle ở backend/src/note/note.constant.ts. */
export const NOTE_MARKUP_STYLE = {
  HIGHLIGHT: 'HIGHLIGHT',
  UNDERLINE: 'UNDERLINE',
  STRIKETHROUGH: 'STRIKETHROUGH',
  CIRCLE: 'CIRCLE',
  CALLOUT: 'CALLOUT',
} as const;

export type NoteMarkupStyleValue = (typeof NOTE_MARKUP_STYLE)[keyof typeof NOTE_MARKUP_STYLE];

/** Vị trí để tô lại đúng chỗ: đoạn chữ, cụm khối đoạn văn, hoặc tiêu đề mục. */
export interface NoteAnchorValue {
  mode?: NoteAnchorModeValue;
  style?: NoteMarkupStyleValue;
  prefix?: string;
  suffix?: string;
  headingId?: string;
  blockStart?: number;
  blockEnd?: number;
  startHint?: string;
  endHint?: string;
  inkItems?: NoteInkItem[];
}

export interface NoteItem {
  id: string;
  targetType: NoteTargetTypeValue;
  targetId: string;
  userId: string | null;
  guestId: string | null;
  title: string | null;
  content: string;
  highlightText: string | null;
  anchor: NoteAnchorValue | null;
  kind: NoteKindValue;
  labels: string[];
  resolvedAt: string | null;
  contentVersion: number | null;
  color: NoteColorValue;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  } | null;
  target?: {
    title: string;
    slug: string;
  } | null;
}

export const READER_RIGHT_SIDEBAR_ATTR = 'data-reader-right-sidebar';
export const NOTE_CALLOUT_ATTR = 'data-note-callout';
export const NOTE_CLUSTER_UNGROUPED_KEY = '__ungrouped__';
export const NOTE_CLUSTER_UNGROUPED_LABEL = 'Ghi chú chưa phân nhóm';

export interface NoteClusterGroup {
  groupKey: string;
  label: string;
  isUngrouped: boolean;
  notes: NoteItem[];
}

export const isInkAnchor = (anchor?: NoteAnchorValue | null): boolean =>
  Boolean(anchor && (anchor.mode === NOTE_ANCHOR_MODE.INK || Array.isArray(anchor.inkItems)));

export const isBlockClusterAnchor = (anchor?: NoteAnchorValue | null): boolean =>
  !isInkAnchor(anchor) &&
  Boolean(anchor && (anchor.mode === NOTE_ANCHOR_MODE.BLOCK || typeof anchor.blockStart === 'number'));

const MARKUP_PREFIX_BY_STYLE: Record<string, string> = {
  [NOTE_MARKUP_STYLE.HIGHLIGHT]: 'hisgo-note',
  [NOTE_MARKUP_STYLE.UNDERLINE]: 'hisgo-note-underline',
  [NOTE_MARKUP_STYLE.STRIKETHROUGH]: 'hisgo-note-strike',
  [NOTE_MARKUP_STYLE.CALLOUT]: 'hisgo-note-underline',
};

const KIND_DECORATION_MAP: Partial<Record<NoteKindValue, string>> = {
  [NOTE_KIND.DEFINITION]: 'hisgo-note-kind-definition',
  [NOTE_KIND.QUESTION]: 'hisgo-note-kind-question',
  [NOTE_KIND.IMPORTANT]: 'hisgo-note-kind-important',
};

/**
 * Danh sách tên vùng CSS Custom Highlight cần áp lên 1 ghi chú nội tuyến.
 */
export function resolveNoteMarkupHighlightNames(note: {
  kind: NoteKindValue;
  color: NoteColorValue;
  anchor?: NoteAnchorValue | null;
}): string[] {
  if (isInkAnchor(note.anchor) || isBlockClusterAnchor(note.anchor) || note.kind === NOTE_KIND.SUMMARY) {
    return [];
  }
  const styleKey = note.anchor?.style ?? NOTE_MARKUP_STYLE.HIGHLIGHT;
  if (styleKey === NOTE_MARKUP_STYLE.CIRCLE) {
    return [];
  }
  const cssPrefix = MARKUP_PREFIX_BY_STYLE[styleKey] ?? MARKUP_PREFIX_BY_STYLE[NOTE_MARKUP_STYLE.HIGHLIGHT];
  const names = [`${cssPrefix}-${note.color.toLowerCase()}`];
  const decoration = KIND_DECORATION_MAP[note.kind];
  if (decoration && styleKey === NOTE_MARKUP_STYLE.HIGHLIGHT) {
    names.push(decoration);
  }
  return names;
}

/** Mô tả ngắn phạm vi cụm đoạn hoặc lớp vẽ tự do (ví dụ "Đoạn 3", "Cụm đoạn 3–5", "Vẽ trên Đoạn 2"). */
export function formatBlockSpanLabel(anchor?: NoteAnchorValue | null): string | null {
  if (!anchor || typeof anchor.blockStart !== 'number') return null;
  const startNum = anchor.blockStart + 1;
  if (isInkAnchor(anchor)) {
    const count = anchor.inkItems?.length ?? 0;
    return count > 0 ? `Vẽ · Đoạn ${startNum} (${count} nét)` : `Vẽ · Đoạn ${startNum}`;
  }
  const endNum = typeof anchor.blockEnd === 'number' && anchor.blockEnd >= anchor.blockStart
    ? anchor.blockEnd + 1
    : startNum;
  return startNum === endNum ? `Đoạn ${startNum}` : `Cụm đoạn ${startNum}–${endNum}`;
}

/**
 * Gom danh sách ghi chú thành các cụm theo `#nhãn`; ghi chú chưa có nhãn vào cuối.
 */
export function groupNotesByCluster(notes: readonly NoteItem[]): NoteClusterGroup[] {
  const buckets = new Map<string, NoteItem[]>();
  const ungrouped: NoteItem[] = [];

  for (const note of notes) {
    if (!note.labels || note.labels.length === 0) {
      ungrouped.push(note);
      continue;
    }
    for (const rawLabel of note.labels) {
      const label = rawLabel.trim();
      if (!label) continue;
      const list = buckets.get(label) ?? [];
      list.push(note);
      buckets.set(label, list);
    }
  }

  const groups: NoteClusterGroup[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'vi'))
    .map(([label, groupNotes]) => ({
      groupKey: label,
      label: `#${label}`,
      isUngrouped: false,
      notes: groupNotes,
    }));

  if (ungrouped.length > 0) {
    groups.push({
      groupKey: NOTE_CLUSTER_UNGROUPED_KEY,
      label: NOTE_CLUSTER_UNGROUPED_LABEL,
      isUngrouped: true,
      notes: ungrouped,
    });
  }

  return groups;
}

const ERASER_HIT_RADIUS_PX = 16;

export interface InkBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Tổng hợp text + kind + color chuẩn để lưu danh sách inkItems cho 1 khối đoạn. */
export function buildInkNotePayload(
  blockStart: number,
  startHint: string,
  highlightExcerpt: string,
  items: NoteInkItem[],
  fallbackColor: NoteColorValue,
): {
  kind: NoteKindValue;
  content: string;
  color: NoteColorValue;
  highlightText: string;
  anchor: NoteAnchorValue;
} {
  const texts = items
    .filter((i) => i.tool === NOTE_INK_TOOL.TEXT && i.text?.trim())
    .map((i) => i.text!.trim());
  const content = texts.join(' · ');
  const dominantColor = items[items.length - 1]?.color ?? fallbackColor;
  return {
    kind: content ? NOTE_KIND.NOTE : NOTE_KIND.HIGHLIGHT,
    content,
    color: dominantColor,
    highlightText: highlightExcerpt,
    anchor: {
      mode: NOTE_ANCHOR_MODE.INK,
      blockStart,
      startHint,
      inkItems: items,
    },
  };
}

export const findBlockInkNote = (notes: readonly NoteItem[], blockStart: number): NoteItem | undefined =>
  notes.find(
    (n) => n.anchor?.mode === NOTE_ANCHOR_MODE.INK && n.anchor?.blockStart === blockStart,
  );

/** Kiểm tra xem đầu tẩy tại (pageX, pageY) có chạm vào nét vẽ hoặc hộp chữ hay không. */
export function hitTestInkItem(
  item: NoteInkItem,
  pageX: number,
  pageY: number,
  contentBox: InkBounds,
  blockBox: InkBounds,
): boolean {
  const safeW = Math.max(1, contentBox.width);
  const safeH = Math.max(24, blockBox.height);
  if (item.tool === NOTE_INK_TOOL.TEXT) {
    const tx = contentBox.left + (item.nx ?? 0) * safeW;
    const ty = blockBox.top + (item.ny ?? 0) * safeH;
    const estW = Math.max(64, Math.min(260, (item.text?.length ?? 4) * 7.5));
    return pageX >= tx - 8 && pageX <= tx + estW + 8 && pageY >= ty - 8 && pageY <= ty + 30;
  }

  const pts = item.pts;
  if (!pts || pts.length < 2) return false;
  const hitRadius = ERASER_HIT_RADIUS_PX + (item.width ?? 3) / 2;
  const thresholdSq = hitRadius * hitRadius;
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const dx = pageX - (contentBox.left + pts[i] * safeW);
    const dy = pageY - (blockBox.top + pts[i + 1] * safeH);
    if (dx * dx + dy * dy <= thresholdSq) return true;
  }
  return false;
}

export const INK_HISTORY_ACTION = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
} as const;

export type InkHistoryActionValue = (typeof INK_HISTORY_ACTION)[keyof typeof INK_HISTORY_ACTION];

export interface InkHistoryEntry {
  action: InkHistoryActionValue;
  blockStart: number;
  item: NoteInkItem;
}

const UNDO_STRATEGY_MAP: Record<
  InkHistoryActionValue,
  (items: readonly NoteInkItem[], item: NoteInkItem) => NoteInkItem[]
> = {
  [INK_HISTORY_ACTION.ADD]: (items, item) => items.filter((i) => i.id !== item.id),
  [INK_HISTORY_ACTION.REMOVE]: (items, item) =>
    items.some((i) => i.id === item.id) ? [...items] : [...items, item],
};

/** Áp dụng hoàn tác một thao tác vẽ/tẩy theo Strategy từng loại hành động. */
export function applyInkHistoryUndo(
  currentItems: readonly NoteInkItem[],
  entry: InkHistoryEntry,
): NoteInkItem[] {
  return UNDO_STRATEGY_MAP[entry.action](currentItems, entry.item);
}

export interface EffectiveBlockInkNote {
  blockStart: number;
  noteId: string;
  items: readonly NoteInkItem[];
  isOptimistic: boolean;
}

export const OPTIMISTIC_INK_NOTE_ID_PREFIX = 'optimistic-ink-';

/**
 * Gộp danh sách ghi chú vẽ tay từ server với trạng thái lạc quan đang chờ lưu theo từng khối đoạn,
 * bảo đảm nét vừa vẽ hiển thị tức thì (0ms) không bị biến mất trong lúc chờ API.
 */
export function mergeEffectiveBlockInkNotes(
  allNotes: readonly NoteItem[],
  optimisticBlocks: Readonly<Record<number, readonly NoteInkItem[]>>,
): EffectiveBlockInkNote[] {
  const result: EffectiveBlockInkNote[] = [];
  const primaryNoteIdByBlock = new Map<number, string>();

  for (const note of allNotes) {
    if (note.anchor?.mode !== NOTE_ANCHOR_MODE.INK) continue;
    const blockStart = note.anchor.blockStart;
    if (typeof blockStart !== 'number') continue;

    if (!primaryNoteIdByBlock.has(blockStart)) {
      primaryNoteIdByBlock.set(blockStart, note.id);
      const override = optimisticBlocks[blockStart];
      if (override !== undefined) {
        result.push({
          blockStart,
          noteId: note.id,
          items: override,
          isOptimistic: true,
        });
        continue;
      }
    }

    result.push({
      blockStart,
      noteId: note.id,
      items: note.anchor.inkItems ?? [],
      isOptimistic: false,
    });
  }

  for (const [rawBlock, items] of Object.entries(optimisticBlocks)) {
    const blockStart = Number(rawBlock);
    if (!Number.isInteger(blockStart) || blockStart < 0) continue;
    if (primaryNoteIdByBlock.has(blockStart)) continue;
    result.push({
      blockStart,
      noteId: `${OPTIMISTIC_INK_NOTE_ID_PREFIX}${blockStart}`,
      items,
      isOptimistic: true,
    });
  }

  return result;
}
