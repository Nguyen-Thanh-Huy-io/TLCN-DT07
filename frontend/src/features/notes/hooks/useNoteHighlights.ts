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

export interface LocatedNote {
  note: NoteItem;
  range: Range;
  match: AnchorMatch;
  mode: NoteAnchorModeValue;
  blockElements?: HTMLElement[];
}

const supportsHighlights = () => typeof CSS !== 'undefined' && 'highlights' in CSS;

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
