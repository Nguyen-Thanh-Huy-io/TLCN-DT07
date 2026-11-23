'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cssHighlightNamesFor } from '../constants/note-kind.constants';
import {
  NOTE_ANCHOR_MODE,
  type NoteAnchorModeValue,
  type NoteAnchorValue,
  type NoteItem,
} from '../services/note.service';
import {
  AnchorMatch,
  buildTextIndex,
  collectReadableBlocks,
} from '../utils/note-anchor.util';
import { computeFreshAnchor, resolveNoteAnchor } from '../utils/note-anchor.strategy';
import { clearInlineCallouts, mountInlineCallouts } from '../utils/note-callout-dom.util';

const FLASH_HIGHLIGHT_NAME = 'hisgo-note-flash';
const FLASH_DURATION_MS = 1600;
const HIGHLIGHT_STYLE_ID = 'hisgo-note-custom-highlight-styles';
const HIGHLIGHT_STYLES = `
::highlight(hisgo-note-yellow) { background-color: rgb(252 211 77 / 0.45); }
::highlight(hisgo-note-green) { background-color: rgb(110 231 183 / 0.45); }
::highlight(hisgo-note-blue) { background-color: rgb(125 211 252 / 0.45); }
::highlight(hisgo-note-pink) { background-color: rgb(253 164 175 / 0.5); }
::highlight(hisgo-note-purple) { background-color: rgb(216 180 254 / 0.5); }
::highlight(hisgo-note-flash) { background-color: rgb(139 38 30 / 0.35); }
::highlight(hisgo-note-underline-yellow) { text-decoration: underline solid 2.5px rgb(217 119 6); text-underline-offset: 3px; }
::highlight(hisgo-note-underline-green) { text-decoration: underline solid 2.5px rgb(5 150 105); text-underline-offset: 3px; }
::highlight(hisgo-note-underline-blue) { text-decoration: underline solid 2.5px rgb(2 132 199); text-underline-offset: 3px; }
::highlight(hisgo-note-underline-pink) { text-decoration: underline solid 2.5px rgb(225 29 72); text-underline-offset: 3px; }
::highlight(hisgo-note-underline-purple) { text-decoration: underline solid 2.5px rgb(124 58 237); text-underline-offset: 3px; }
::highlight(hisgo-note-strike-yellow) { text-decoration: line-through solid 2px rgb(180 83 9); }
::highlight(hisgo-note-strike-green) { text-decoration: line-through solid 2px rgb(4 120 87); }
::highlight(hisgo-note-strike-blue) { text-decoration: line-through solid 2px rgb(3 105 161); }
::highlight(hisgo-note-strike-pink) { text-decoration: line-through solid 2px rgb(190 18 60); }
::highlight(hisgo-note-strike-purple) { text-decoration: line-through solid 2px rgb(109 40 217); }
::highlight(hisgo-note-kind-important) { text-decoration: underline solid 2px rgb(185 28 28); }
::highlight(hisgo-note-kind-question) { text-decoration: underline wavy 1.5px rgb(190 18 60); }
::highlight(hisgo-note-kind-definition) { text-decoration: underline dotted 2px rgb(29 78 216); }
`;

export interface LocatedNote {
  note: NoteItem;
  range: Range;
  match: AnchorMatch;
  mode: NoteAnchorModeValue;
  blockElements?: HTMLElement[];
}

const supportsHighlights = () => typeof CSS !== 'undefined' && 'highlights' in CSS;

function ensureHighlightStyles(): void {
  if (!supportsHighlights() || document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = HIGHLIGHT_STYLES;
  document.head.append(style);
}

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  if (typeof document.caretPositionFromPoint === 'function') {
    const pos = document.caretPositionFromPoint(x, y);
    return pos ? { node: pos.offsetNode, offset: pos.offset } : null;
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * Tô lại các đoạn đã ghi chú bằng CSS Custom Highlight API, chèn chip chữ bổ sung `[data-note-callout]`
 * một cách an toàn và định vị các Sticky Note neo theo khối đoạn (`BLOCK`) và mục tiêu đề (`HEADING`).
 */
export function useNoteHighlights(
  contentRef: React.RefObject<HTMLElement | null>,
  htmlTrigger: string,
  notes: NoteItem[],
  onReanchor: (noteId: string, anchor: NoteAnchorValue) => void,
) {
  const [located, setLocated] = useState<LocatedNote[]>([]);
  const [readableBlocks, setReadableBlocks] = useState<HTMLElement[]>([]);
  const [lostNoteIds, setLostNoteIds] = useState<ReadonlySet<string>>(() => new Set());
  const [flashedNoteId, setFlashedNoteId] = useState<string | null>(null);
  const locatedRef = useRef<LocatedNote[]>([]);
  const reanchoredRef = useRef<Set<string>>(new Set());
  const onReanchorRef = useRef(onReanchor);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onReanchorRef.current = onReanchor;
  });

  useEffect(() => {
    const rootRef = contentRef.current;
    const timer = setTimeout(() => {
      const root = contentRef.current;
      if (!root) return;
      clearInlineCallouts(root);

      const index = buildTextIndex(root);
      const blocks = collectReadableBlocks(root);
      const ctx = { root, index, blocks };

      const found: LocatedNote[] = [];
      const lost = new Set<string>();
      notes.forEach((note) => {
        const hit = resolveNoteAnchor(ctx, note);
        if (hit) found.push({ note, ...hit });
        else if (note.highlightText || typeof note.anchor?.blockStart === 'number') lost.add(note.id);
      });

      mountInlineCallouts(root, found);

      found
        .filter(({ note, match }) => match === AnchorMatch.MOVED && !reanchoredRef.current.has(note.id))
        .forEach((item) => {
          const anchor = computeFreshAnchor(ctx, item.note, item);
          reanchoredRef.current.add(item.note.id);
          if (anchor) onReanchorRef.current(item.note.id, anchor);
        });

      locatedRef.current = found;
      setReadableBlocks(blocks);
      setLocated(found);
      setLostNoteIds(lost);
    });
    return () => {
      clearTimeout(timer);
      if (rootRef) clearInlineCallouts(rootRef);
    };
  }, [contentRef, htmlTrigger, notes]);

  useEffect(() => {
    ensureHighlightStyles();
  }, []);

  useEffect(() => {
    if (!supportsHighlights()) return;
    const groups = new Map<string, Range[]>();
    const add = (name: string, range: Range) => groups.set(name, [...(groups.get(name) ?? []), range]);

    located.forEach(({ note, range, mode }) => {
      if (mode !== NOTE_ANCHOR_MODE.INLINE) return;
      cssHighlightNamesFor(note).forEach((name) => add(name, range));
    });

    groups.forEach((ranges, name) => CSS.highlights.set(name, new Highlight(...ranges)));
    return () => groups.forEach((_, name) => CSS.highlights.delete(name));
  }, [located]);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (supportsHighlights()) CSS.highlights.delete(FLASH_HIGHLIGHT_NAME);
    },
    [],
  );

  /** Đoạn ghi chú đã tô ở điểm (x, y) trên màn hình, nếu có. */
  const noteAtPoint = useCallback((x: number, y: number): LocatedNote | null => {
    const caret = caretAt(x, y);
    if (!caret) return null;
    const hit = locatedRef.current.find(({ mode, range }) => {
      if (mode !== NOTE_ANCHOR_MODE.INLINE) return false;
      try {
        return range.isPointInRange(caret.node, caret.offset);
      } catch {
        return false;
      }
    });
    return hit ?? null;
  }, []);

  /** Cuộn tới đoạn (hoặc cụm đoạn) của ghi chú và nháy sáng; false nếu không tìm thấy vị trí. */
  const flashNote = useCallback((noteId: string): boolean => {
    const hit = locatedRef.current.find(({ note }) => note.id === noteId);
    if (!hit) return false;
    const scrollTarget = hit.blockElements?.[0]
      ?? (hit.range.startContainer instanceof Element ? hit.range.startContainer : hit.range.startContainer.parentElement);
    scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setFlashedNoteId(noteId);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlashedNoteId(null);
      if (supportsHighlights()) CSS.highlights.delete(FLASH_HIGHLIGHT_NAME);
    }, FLASH_DURATION_MS);

    if (hit.mode !== NOTE_ANCHOR_MODE.BLOCK && supportsHighlights()) {
      CSS.highlights.set(FLASH_HIGHLIGHT_NAME, new Highlight(hit.range));
    }
    return true;
  }, []);

  const needsReviewIds = new Set(located.filter((l) => l.match === AnchorMatch.FUZZY).map((l) => l.note.id));

  return {
    located,
    readableBlocks,
    lostNoteIds,
    needsReviewIds,
    flashedNoteId,
    noteAtPoint,
    flashNote,
  };
}
