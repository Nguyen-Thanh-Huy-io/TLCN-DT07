'use client';

import React, { useEffect, useState } from 'react';
import { Link2, X } from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import type { NoteFacade } from '../facades/useNoteFacade';
import { useNoteHighlights, type LocatedNote } from '../hooks/useNoteHighlights';
import { NOTE_KIND, type NoteAnchorValue, type NoteItem, type NoteTargetTypeValue } from '../services/note.service';
import { anchorFromRange, buildTextIndex, type SelectionAnchor } from '../utils/note-anchor.util';
import { NoteDrawer, NoteFloatingButton } from './NoteDrawer';
import {
  NOTE_LAYER_ATTR,
  NoteMarginMarkers,
  NotePopover,
  SelectionPopup,
  SummaryComposerDialog,
  type NoteDraft,
  type NoteMarker,
  type PagePoint,
} from './NoteReaderParts';

/** Khoảng cách popup đặt phía trên đoạn bôi đen; sát mép trên màn hình thì đặt xuống dưới. */
const POPUP_ABOVE_OFFSET = 96;
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

/** Có icon lề: ghi chú có nội dung (đoạn chỉ tô màu thì không). */
const hasMarker = (note: NoteItem) => Boolean(note.content.trim());

/** Vị trí icon lề; tính lại khi đổi cỡ cửa sổ / cỡ chữ, không tính khi cuộn. */
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
        const left = Math.min(window.scrollX + box.right + MARKER_GAP, window.scrollX + window.innerWidth - MARKER_SIZE - MARKER_GAP / 2);
        let lastTop = -Infinity;
        const next = located
          .filter(({ note }) => hasMarker(note))
          .map(({ note, range }) => ({ note, top: (range.getClientRects()[0] ?? range.getBoundingClientRect()).top }))
          .sort((a, b) => a.top - b.top)
          .map(({ note, top }) => {
            // Nhiều ghi chú cùng dòng thì xếp chồng xuống, không đè lên nhau.
            const pageTop = Math.max(window.scrollY + top, lastTop + MARKER_SIZE + 2);
            lastTop = pageTop;
            return { noteId: note.id, kind: note.kind, color: note.color, at: { top: pageTop, left } };
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
  facade: NoteFacade;
  targetTitle?: string;
  targetType: NoteTargetTypeValue;
  /** Chỉ bài học: gửi câu hỏi lên phần Hỏi đáp. */
  onAskCommunity?: (note: NoteItem) => Promise<void>;
}

/**
 * Ghi chú ngay trên bài đọc: bôi đen → tô sáng / chọn loại ghi chú; đoạn đã ghi chú được tô lại theo loại,
 * bấm vào thì xem / sửa; bài đã cập nhật thì tự dò lại vị trí, đoạn bị sửa / mất thì báo để xem lại.
 */
export function NoteReaderLayer({ contentRef, htmlTrigger, facade, targetTitle, targetType, onAskCommunity }: NoteReaderLayerProps) {
  const { allNotes, addNote, editNote, removeNote, openDrawer, closeDrawer, labelSuggestions } = facade;
  const { summaryTarget, setSummaryTarget, reattachNoteId, setReattachNoteId } = facade;
  const reanchor = (noteId: string, anchor: NoteAnchorValue) => {
    // Lỗi đã được facade ghi log; lần mở bài sau sẽ dò lại.
    void editNote(noteId, { anchor }).catch(() => undefined);
  };
  const { located, lostNoteIds, needsReviewIds, noteAtPoint, flashNote } = useNoteHighlights(contentRef, htmlTrigger, allNotes, reanchor);
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

  const withSaving = async (task: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await task();
    } finally {
      setSaving(false);
    }
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  const saveFromSelection = (draft: NoteDraft) =>
    withSaving(async () => {
      if (!selection) return;
      await addNote({ ...draft, highlightText: selection.anchor.highlightText, anchor: selection.anchor.anchor });
      clearSelection();
    });

  const reattachHere = () =>
    withSaving(async () => {
      if (!selection || !reattachNoteId) return;
      await editNote(reattachNoteId, { highlightText: selection.anchor.highlightText, anchor: selection.anchor.anchor });
      setReattachNoteId(null);
      clearSelection();
    });

  /** Đoạn chỉ khớp gần đúng: lưu đoạn chữ + vị trí hiện tại làm vị trí mới. */
  const confirmPosition = (noteId: string) => {
    const root = contentRef.current;
    const hit = located.find((l) => l.note.id === noteId);
    const fresh = root && hit ? anchorFromRange(buildTextIndex(root), root, hit.range) : null;
    if (fresh) void editNote(noteId, { highlightText: fresh.highlightText, anchor: fresh.anchor });
  };

  return (
    <>
      {selection && (
        <SelectionPopup
          key={`${selection.at.top}-${selection.at.left}`}
          at={selection.at}
          saving={saving}
          labelSuggestions={labelSuggestions}
          reattaching={Boolean(reattachNoteId)}
          onSave={(draft) => void saveFromSelection(draft)}
          onCopy={() => {
            void navigator.clipboard.writeText(`“${selection.anchor.highlightText}”`);
            setSelection(null);
          }}
          onReattachHere={() => void reattachHere()}
          onCancelReattach={() => {
            setReattachNoteId(null);
            clearSelection();
          }}
        />
      )}

      {reattachNoteId && !selection && (
        <div {...{ [NOTE_LAYER_ATTR]: '' }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-xl">
          <Link2 size={15} /> Bôi đen đoạn mới trong bài để gắn lại ghi chú
          <button type="button" onClick={() => setReattachNoteId(null)} aria-label="Huỷ gắn lại" className="ml-1 cursor-pointer text-stone-300 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {active && activeNote && (
        <NotePopover
          key={`${activeNote.id}-${activeNote.updatedAt}`}
          note={activeNote}
          at={active.at}
          needsReview={needsReviewIds.has(activeNote.id)}
          labelSuggestions={labelSuggestions}
          onClose={() => setActive(null)}
          onUpdate={(updates) => editNote(activeNote.id, updates)}
          onConfirmPosition={() => confirmPosition(activeNote.id)}
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

      {summaryTarget && (
        <SummaryComposerDialog
          headingText={summaryTarget.headingText}
          saving={saving}
          labelSuggestions={labelSuggestions}
          onClose={() => setSummaryTarget(null)}
          onSave={(draft) =>
            void withSaving(async () => {
              await addNote({ ...draft, kind: NOTE_KIND.SUMMARY, highlightText: summaryTarget.headingText, anchor: { headingId: summaryTarget.headingId } });
              setSummaryTarget(null);
            })
          }
        />
      )}

      <NoteMarginMarkers markers={markers} onOpen={(noteId, at) => setActive({ noteId, at })} />

      <NoteFloatingButton facade={facade} reviewCount={lostNoteIds.size + needsReviewIds.size} />
      <NoteDrawer
        facade={facade}
        targetTitle={targetTitle}
        targetType={targetType}
        onLocateNote={(noteId) => {
          closeDrawer();
          flashNote(noteId);
        }}
        lostNoteIds={lostNoteIds}
        needsReviewIds={needsReviewIds}
        onReattachNote={(noteId) => {
          closeDrawer();
          setReattachNoteId(noteId);
        }}
        onAskCommunity={onAskCommunity}
      />
    </>
  );
}
