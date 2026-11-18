'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoteColorValue, NoteItem } from '../services/note.service';
import { buildTextIndex, locateHighlight } from '../utils/note-anchor.util';

/** Tên vùng tô đăng ký với CSS.highlights; màu khai báo ở globals.css (`::highlight(...)`). */
export const noteHighlightName = (color: NoteColorValue) => `hisgo-note-${color.toLowerCase()}`;
const FLASH_HIGHLIGHT_NAME = 'hisgo-note-flash';
const FLASH_DURATION_MS = 1600;

export interface LocatedNote {
  note: NoteItem;
  range: Range;
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
 * Tô lại các đoạn đã ghi chú trong bài bằng CSS Custom Highlight API: không thêm phần tử nào vào nội
 * dung nên React / khối quiz không bị ảnh hưởng. Chỉ tính lại khi nội dung bài hoặc danh sách ghi chú đổi.
 */
export function useNoteHighlights(
  contentRef: React.RefObject<HTMLElement | null>,
  htmlTrigger: string,
  notes: NoteItem[],
) {
  const [located, setLocated] = useState<LocatedNote[]>([]);
  const [lostNoteIds, setLostNoteIds] = useState<ReadonlySet<string>>(() => new Set());
  const locatedRef = useRef<LocatedNote[]>([]);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Chạy sau khi các hook khác đã sửa nội dung (đánh số chú thích, gắn khối quiz) để vị trí không lệch.
    const timer = setTimeout(() => {
      const root = contentRef.current;
      if (!root) return;
      const index = buildTextIndex(root);
      const found: LocatedNote[] = [];
      const lost = new Set<string>();
      notes.forEach((note) => {
        if (!note.highlightText) return;
        const range = locateHighlight(index, note.highlightText, note.anchor);
        if (range) found.push({ note, range });
        else lost.add(note.id);
      });
      locatedRef.current = found;
      setLocated(found);
      setLostNoteIds(lost);
    });
    return () => clearTimeout(timer);
  }, [contentRef, htmlTrigger, notes]);

  useEffect(() => {
    if (!supportsHighlights()) return;
    const byColor = new Map<string, Range[]>();
    located.forEach(({ note, range }) => {
      const name = noteHighlightName(note.color);
      byColor.set(name, [...(byColor.get(name) ?? []), range]);
    });
    byColor.forEach((ranges, name) => CSS.highlights.set(name, new Highlight(...ranges)));
    return () => byColor.forEach((_, name) => CSS.highlights.delete(name));
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
    const hit = locatedRef.current.find(({ range }) => {
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
    hit.range.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (supportsHighlights()) {
      CSS.highlights.set(FLASH_HIGHLIGHT_NAME, new Highlight(hit.range));
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => CSS.highlights.delete(FLASH_HIGHLIGHT_NAME), FLASH_DURATION_MS);
    }
    return true;
  }, []);

  return { located, lostNoteIds, noteAtPoint, flashNote };
}
