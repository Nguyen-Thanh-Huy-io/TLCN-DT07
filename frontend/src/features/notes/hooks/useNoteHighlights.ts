'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NOTE_KIND_META } from '../constants/note-kind.constants';
import { NOTE_KIND, type NoteAnchorValue, type NoteColorValue, type NoteItem } from '../services/note.service';
import {
  AnchorMatch,
  anchorFromRange,
  buildTextIndex,
  locateHeading,
  locateHighlight,
  type LocatedAnchor,
  type TextIndex,
} from '../utils/note-anchor.util';

/** Tên vùng tô đăng ký với CSS.highlights; màu khai báo ở globals.css (`::highlight(...)`). */
export const noteHighlightName = (color: NoteColorValue) => `hisgo-note-${color.toLowerCase()}`;
const FLASH_HIGHLIGHT_NAME = 'hisgo-note-flash';
const FLASH_DURATION_MS = 1600;

export interface LocatedNote {
  note: NoteItem;
  range: Range;
  match: AnchorMatch;
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

function locateNote(root: HTMLElement, index: TextIndex, note: NoteItem): LocatedAnchor | null {
  if (note.kind === NOTE_KIND.SUMMARY && note.anchor?.headingId) {
    return locateHeading(root, note.anchor.headingId, note.highlightText);
  }
  return note.highlightText ? locateHighlight(index, note.highlightText, note.anchor) : null;
}

/** Vị trí mới để lưu khi đoạn chỉ dời chỗ (bài đã sửa xung quanh). */
function freshAnchor(root: HTMLElement, index: TextIndex, located: LocatedNote): NoteAnchorValue | null {
  if (located.note.kind === NOTE_KIND.SUMMARY) {
    const heading = located.range.startContainer;
    return heading instanceof Element && heading.id ? { headingId: heading.id } : null;
  }
  return anchorFromRange(index, root, located.range)?.anchor ?? null;
}

/**
 * Tô lại các đoạn đã ghi chú trong bài bằng CSS Custom Highlight API (không thêm phần tử nào vào nội dung).
 * Bài đã đổi: đoạn chỉ dời chỗ thì tự cập nhật vị trí (`onReanchor`), khớp gần đúng thì báo cần xem lại,
 * không tìm thấy thì báo lạc. Chỉ tính lại khi nội dung bài hoặc danh sách ghi chú đổi.
 */
export function useNoteHighlights(
  contentRef: React.RefObject<HTMLElement | null>,
  htmlTrigger: string,
  notes: NoteItem[],
  onReanchor: (noteId: string, anchor: NoteAnchorValue) => void,
) {
  const [located, setLocated] = useState<LocatedNote[]>([]);
  const [lostNoteIds, setLostNoteIds] = useState<ReadonlySet<string>>(() => new Set());
  const locatedRef = useRef<LocatedNote[]>([]);
  const reanchoredRef = useRef<Set<string>>(new Set());
  const onReanchorRef = useRef(onReanchor);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onReanchorRef.current = onReanchor;
  });

  useEffect(() => {
    // Chạy sau khi các hook khác đã sửa nội dung (đánh số chú thích, gắn khối quiz) để vị trí không lệch.
    const timer = setTimeout(() => {
      const root = contentRef.current;
      if (!root) return;
      const index = buildTextIndex(root);
      const found: LocatedNote[] = [];
      const lost = new Set<string>();
      notes.forEach((note) => {
        const hit = locateNote(root, index, note);
        if (hit) found.push({ note, ...hit });
        else if (note.highlightText) lost.add(note.id);
      });
      found
        .filter(({ note, match }) => match === AnchorMatch.MOVED && !reanchoredRef.current.has(note.id))
        .forEach((item) => {
          const anchor = freshAnchor(root, index, item);
          reanchoredRef.current.add(item.note.id);
          if (anchor) onReanchorRef.current(item.note.id, anchor);
        });
      locatedRef.current = found;
      setLocated(found);
      setLostNoteIds(lost);
    });
    return () => clearTimeout(timer);
  }, [contentRef, htmlTrigger, notes]);

  useEffect(() => {
    if (!supportsHighlights()) return;
    const groups = new Map<string, Range[]>();
    const add = (name: string, range: Range) => groups.set(name, [...(groups.get(name) ?? []), range]);
    located.forEach(({ note, range }) => {
      if (note.kind === NOTE_KIND.SUMMARY) return;
      add(noteHighlightName(note.color), range);
      const decoration = NOTE_KIND_META[note.kind]?.decoration;
      if (decoration) add(decoration, range);
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
    const hit = locatedRef.current.find(({ note, range }) => {
      if (note.kind === NOTE_KIND.SUMMARY) return false;
      try {
        return range.isPointInRange(caret.node, caret.offset);
      } catch {
        // Điểm nằm ngoài tài liệu của range (vd. trong iframe) → không phải ghi chú.
        return false;
      }
    });
    return hit ?? null;
  }, []);

  /** Cuộn tới đoạn của ghi chú và nháy sáng; false nếu không tìm thấy đoạn trong bài. */
  const flashNote = useCallback((noteId: string): boolean => {
    const hit = locatedRef.current.find(({ note }) => note.id === noteId);
    if (!hit) return false;
    const target = hit.range.startContainer;
    (target instanceof Element ? target : target.parentElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (supportsHighlights()) {
      CSS.highlights.set(FLASH_HIGHLIGHT_NAME, new Highlight(hit.range));
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => CSS.highlights.delete(FLASH_HIGHLIGHT_NAME), FLASH_DURATION_MS);
    }
    return true;
  }, []);

  const needsReviewIds = new Set(located.filter((l) => l.match === AnchorMatch.FUZZY).map((l) => l.note.id));

  return { located, lostNoteIds, needsReviewIds, noteAtPoint, flashNote };
}
