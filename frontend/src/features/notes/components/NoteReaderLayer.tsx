'use client';

import React, { useEffect, useState } from 'react';
import { KeyboardKey } from '@/constants/enums';
import type { useNoteFacade } from '../facades/useNoteFacade';
import { useNoteHighlights, type LocatedNote } from '../hooks/useNoteHighlights';
import type { NoteColorValue, NoteTargetTypeValue } from '../services/note.service';
import { anchorFromRange, buildTextIndex, type SelectionAnchor } from '../utils/note-anchor.util';
import { NoteDrawer, NoteFloatingButton } from './NoteDrawer';
import {
  NOTE_LAYER_ATTR,
  NoteMarginMarkers,
  NotePopover,
  SelectionPopup,
  type NoteMarker,
  type PagePoint,
} from './NoteReaderParts';

/** Khoảng cách popup đặt phía trên đoạn bôi đen; sát mép trên màn hình thì đặt xuống dưới. */
const POPUP_ABOVE_OFFSET = 56;
const POPUP_BELOW_GAP = 10;
const MARKER_SIZE = 24;
const MARKER_GAP = 8;

const isInsideLayer = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest(`[${NOTE_LAYER_ATTR}]`));

/** Trên điện thoại menu chọn chữ của hệ điều hành nằm phía trên đoạn bôi đen, nên đặt popup xuống dưới. */
function popupPointFor(rect: DOMRect): PagePoint {
  const placeBelow = rect.top < POPUP_ABOVE_OFFSET + MARKER_GAP || window.matchMedia('(pointer: coarse)').matches;
  return {
    top: window.scrollY + (placeBelow ? rect.bottom + POPUP_BELOW_GAP : rect.top - POPUP_ABOVE_OFFSET),
    left: window.scrollX + rect.left + rect.width / 2,
  };
}

/** Neo popover ngay dưới đoạn đã tô, giữa đoạn. */
function belowRange(range: Range): PagePoint {
  const rect = range.getBoundingClientRect();
  return { top: window.scrollY + rect.bottom + POPUP_BELOW_GAP, left: window.scrollX + rect.left + rect.width / 2 };
}

/** Vị trí icon lề cho đoạn có nội dung ghi chú; tính lại khi đổi cỡ cửa sổ / cỡ chữ, không tính khi cuộn. */
function useNoteMarkers(contentRef: React.RefObject<HTMLElement | null>, located: LocatedNote[]): NoteMarker[] {
  const [markers, setMarkers] = useState<NoteMarker[]>([]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    let frame = 0;
    const compute = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = root.getBoundingClientRect();
        const left = Math.min(
          window.scrollX + box.right + MARKER_GAP,
          window.scrollX + window.innerWidth - MARKER_SIZE - MARKER_GAP / 2,
        );
        let lastTop = -Infinity;
        const next = located
          .filter(({ note }) => note.content.trim())
          .map(({ note, range }) => ({ note, top: (range.getClientRects()[0] ?? range.getBoundingClientRect()).top }))
          .sort((a, b) => a.top - b.top)
          .map(({ note, top }) => {
            // Nhiều ghi chú cùng dòng thì xếp chồng xuống, không đè lên nhau.
            const pageTop = Math.max(window.scrollY + top, lastTop + MARKER_SIZE + 2);
            lastTop = pageTop;
            return { noteId: note.id, color: note.color, at: { top: pageTop, left } };
          });
        setMarkers(next);
      });
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(root);
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [contentRef, located]);

  return markers;
}

interface NoteReaderLayerProps {
  contentRef: React.RefObject<HTMLElement | null>;
  /** Đổi khi nội dung bài đổi, để tính lại vị trí các đoạn đã ghi chú. */
  htmlTrigger: string;
  facade: ReturnType<typeof useNoteFacade>;
  targetTitle?: string;
  targetType: NoteTargetTypeValue;
}

/**
 * Ghi chú ngay trên bài đọc: bôi đen → popup tô màu / ghi chú; đoạn đã ghi chú được tô lại, bấm vào thì
 * xem / sửa; đoạn có nội dung ghi chú có icon ở lề; sổ ghi chú cuộn được tới đúng đoạn.
 */
export function NoteReaderLayer({ contentRef, htmlTrigger, facade, targetTitle, targetType }: NoteReaderLayerProps) {
  const { allNotes, addNote, editNote, removeNote, openDrawer, closeDrawer } = facade;
  const { located, lostNoteIds, noteAtPoint, flashNote } = useNoteHighlights(contentRef, htmlTrigger, allNotes);
  const markers = useNoteMarkers(contentRef, located);
  const [selection, setSelection] = useState<{ anchor: SelectionAnchor; at: PagePoint } | null>(null);
  const [active, setActive] = useState<{ noteId: string; at: PagePoint } | null>(null);
  const [saving, setSaving] = useState(false);
  const activeNote = active ? allNotes.find((n) => n.id === active.noteId) : undefined;

  useEffect(() => {
    const readSelection = (event: Event) => {
      if (isInsideLayer(event.target)) return;
      // Đợi trình duyệt cập nhật vùng chọn sau khi nhả chuột / chạm.
      setTimeout(() => {
        const root = contentRef.current;
        const sel = window.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
          setSelection(null);
          return;
        }
        const range = sel.getRangeAt(0);
        const anchor = anchorFromRange(buildTextIndex(root), root, range);
        setSelection(anchor ? { anchor, at: popupPointFor(range.getBoundingClientRect()) } : null);
        if (anchor) setActive(null);
      });
    };
    const openNoteAtClick = (event: MouseEvent) => {
      if (isInsideLayer(event.target)) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      const hit = noteAtPoint(event.clientX, event.clientY);
      setActive(hit ? { noteId: hit.note.id, at: belowRange(hit.range) } : null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== KeyboardKey.ESCAPE) return;
      setSelection(null);
      setActive(null);
    };
    document.addEventListener('mouseup', readSelection);
    document.addEventListener('touchend', readSelection);
    document.addEventListener('keyup', readSelection);
    document.addEventListener('click', openNoteAtClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mouseup', readSelection);
      document.removeEventListener('touchend', readSelection);
      document.removeEventListener('keyup', readSelection);
      document.removeEventListener('click', openNoteAtClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [contentRef, noteAtPoint]);

  const saveFromSelection = async (content: string, color: NoteColorValue) => {
    if (!selection) return;
    setSaving(true);
    try {
      await addNote(content, undefined, color, selection.anchor.highlightText, selection.anchor.anchor);
      window.getSelection()?.removeAllRanges();
      setSelection(null);
    } finally {
      setSaving(false);
    }
  };

  const locateFromNotebook = (noteId: string) => {
    closeDrawer();
    flashNote(noteId);
  };

  return (
    <>
      {selection && (
        <SelectionPopup
          key={`${selection.at.top}-${selection.at.left}`}
          at={selection.at}
          saving={saving}
          onHighlight={(color) => void saveFromSelection('', color)}
          onSaveNote={(content, color) => void saveFromSelection(content, color)}
          onCopy={() => {
            void navigator.clipboard.writeText(`“${selection.anchor.highlightText}”`);
            setSelection(null);
          }}
        />
      )}

      {active && activeNote && (
        <NotePopover
          key={activeNote.id}
          note={activeNote}
          at={active.at}
          onClose={() => setActive(null)}
          onChangeColor={(color) => void editNote(activeNote.id, { color })}
          onSaveContent={async (content) => {
            await editNote(activeNote.id, { content });
          }}
          onDelete={() => {
            setActive(null);
            void removeNote(activeNote.id);
          }}
          onOpenNotebook={() => {
            setActive(null);
            openDrawer();
          }}
        />
      )}

      <NoteMarginMarkers markers={markers} onOpen={(noteId, at) => setActive({ noteId, at })} />

      <NoteFloatingButton facade={facade} />
      <NoteDrawer
        facade={facade}
        targetTitle={targetTitle}
        targetType={targetType}
        onLocateNote={locateFromNotebook}
        lostNoteIds={lostNoteIds}
      />
    </>
  );
}
