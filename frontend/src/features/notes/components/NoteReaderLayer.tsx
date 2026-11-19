'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link2, X } from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import type { NoteFacade } from '../facades/useNoteFacade';
import { useNoteHighlights } from '../hooks/useNoteHighlights';
import {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  type NoteColorValue,
  type NoteItem,
  type NoteMarkupStyleValue,
  type NoteTargetTypeValue,
} from '../services/note.service';
import {
  anchorFromRange,
  buildBlockClusterAnchor,
  buildTextIndex,
  type SelectionAnchor,
} from '../utils/note-anchor.util';
import { formatBlockSpanLabel, NOTE_CALLOUT_ATTR } from '../utils/note-cluster.util';
import { NoteDrawer, NoteReviewAlertBanner } from './NoteDrawer';
import { NoteInkLayer } from './NoteInkLayer';
import {
  BlockComposerPopover,
  NotePopover,
  persistStoredActiveColor,
  QuickPenBar,
  readStoredActiveColor,
  SelectionPopup,
  SelectionPopupView,
  SummaryComposerDialog,
  type NoteDraft,
} from './NoteReaderParts';
import {
  NOTE_LAYER_ATTR,
  NoteStickyMarginLayer,
  type PagePoint,
} from './NoteStickyMarginLayer';

/** Khoảng cách mini pill đặt phía trên đoạn bôi đen; sát mép trên màn hình thì đặt xuống dưới. */
const POPUP_ABOVE_OFFSET = 50;
const POPUP_BELOW_GAP = 10;

const isInsideLayer = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest(`[${NOTE_LAYER_ATTR}]`));

function popupPointFor(rect: DOMRect): PagePoint {
  const placeBelow = rect.top < POPUP_ABOVE_OFFSET + 8 || window.matchMedia('(pointer: coarse)').matches;
  return {
    top: window.scrollY + (placeBelow ? rect.bottom + POPUP_BELOW_GAP : rect.top - POPUP_ABOVE_OFFSET),
    left: window.scrollX + rect.left + rect.width / 2,
  };
}

function belowRectPoint(rect: DOMRect): PagePoint {
  return { top: window.scrollY + rect.bottom + POPUP_BELOW_GAP, left: window.scrollX + rect.left + rect.width / 2 };
}

interface BlockDraftState {
  blockStart: number;
  blockEnd: number;
  at: PagePoint;
}

interface QuickPenState {
  active: boolean;
  style: NoteMarkupStyleValue;
}

interface NoteReaderLayerProps {
  contentRef: React.RefObject<HTMLElement | null>;
  /** Đổi khi nội dung bài đổi, để tính lại vị trí các đoạn đã ghi chú. */
  htmlTrigger: string;
  facade: NoteFacade;
  targetTitle?: string;
  targetType: NoteTargetTypeValue;
  /** Hiển thị cột Sticky Note ngoài lề khi đủ khoảng trống. */
  showMarginSticky?: boolean;
  /** Chỉ bài học: gửi câu hỏi lên phần Hỏi đáp. */
  onAskCommunity?: (note: NoteItem) => Promise<void>;
}

export function NoteReaderLayer({
  contentRef,
  htmlTrigger,
  facade,
  targetTitle,
  targetType,
  showMarginSticky = true,
  onAskCommunity,
}: NoteReaderLayerProps) {
  const {
    allNotes,
    drawMode,
    setDrawMode,
    labelSuggestions,
    summaryTarget,
    setSummaryTarget,
    reattachNoteId,
    setReattachNoteId,
    addNote,
    editNote,
    removeNote,
    openDrawer,
    closeDrawer,
  } = facade;

  const {
    located,
    readableBlocks,
    lostNoteIds,
    needsReviewIds,
    flashedNoteId,
    noteAtPoint,
    flashNote,
  } = useNoteHighlights(contentRef, htmlTrigger, allNotes, (noteId, anchor) => void editNote(noteId, { anchor }));

  const [selection, setSelection] = useState<{ anchor: SelectionAnchor; at: PagePoint; initialView?: SelectionPopupView } | null>(null);
  const [active, setActive] = useState<{ noteId: string; at: PagePoint } | null>(null);
  const [blockDraft, setBlockDraft] = useState<BlockDraftState | null>(null);
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeColor, setActiveColor] = useState<NoteColorValue>(() => readStoredActiveColor());
  const [quickPen, setQuickPen] = useState<QuickPenState>({ active: false, style: NOTE_MARKUP_STYLE.HIGHLIGHT });

  const quickPenRef = useRef(quickPen);
  const drawModeRef = useRef(drawMode);
  const activeColorRef = useRef(activeColor);
  const reattachRef = useRef(reattachNoteId);
  const addNoteRef = useRef(addNote);

  useEffect(() => {
    quickPenRef.current = quickPen;
    drawModeRef.current = drawMode;
    activeColorRef.current = activeColor;
    reattachRef.current = reattachNoteId;
    addNoteRef.current = addNote;
  });

  const activeNote = active ? allNotes.find((n) => n.id === active.noteId) ?? null : null;

  const changeActiveColor = (color: NoteColorValue) => {
    setActiveColor(color);
    persistStoredActiveColor(color);
  };

  useEffect(() => {
    const handleQuickSelection = async (anchor: SelectionAnchor, rect: DOMRect) => {
      const pen = quickPenRef.current;
      if (pen.style === NOTE_MARKUP_STYLE.CALLOUT) {
        setSelection({ anchor, at: popupPointFor(rect), initialView: SelectionPopupView.CALLOUT });
        return;
      }
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      await addNoteRef.current({
        kind: NOTE_KIND.HIGHLIGHT,
        content: '',
        color: activeColorRef.current,
        labels: [],
        highlightText: anchor.highlightText,
        anchor: { mode: NOTE_ANCHOR_MODE.INLINE, style: pen.style, ...anchor.anchor },
      });
    };

    const readSelection = (event: Event) => {
      if (drawModeRef.current || isInsideLayer(event.target)) return;
      requestAnimationFrame(() => {
        const root = contentRef.current;
        const sel = window.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
          setSelection(null);
          return;
        }
        const range = sel.getRangeAt(0);
        const anchor = anchorFromRange(buildTextIndex(root), root, range);
        if (!anchor) {
          setSelection(null);
          return;
        }
        setActive(null);
        setBlockDraft(null);

        if (quickPenRef.current.active && !reattachRef.current) {
          void handleQuickSelection(anchor, range.getBoundingClientRect());
          return;
        }
        setSelection({ anchor, at: popupPointFor(range.getBoundingClientRect()) });
      });
    };

    const openNoteAtClick = (event: MouseEvent) => {
      const targetEl = event.target instanceof Element ? event.target : null;
      const calloutEl = targetEl?.closest(`[${NOTE_CALLOUT_ATTR}]`);
      if (calloutEl) {
        event.preventDefault();
        event.stopPropagation();
        const noteId = calloutEl.getAttribute(NOTE_CALLOUT_ATTR);
        if (noteId) {
          setSelection(null);
          setBlockDraft(null);
          setActive({ noteId, at: belowRectPoint(calloutEl.getBoundingClientRect()) });
        }
        return;
      }
      if (isInsideLayer(event.target)) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      const hit = noteAtPoint(event.clientX, event.clientY);
      setActive(hit ? { noteId: hit.note.id, at: belowRectPoint(hit.range.getBoundingClientRect()) } : null);
      if (!hit) setBlockDraft(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== KeyboardKey.ESCAPE) return;
      setSelection(null);
      setActive(null);
      setBlockDraft(null);
      setQuickPen((prev) => (prev.active ? { ...prev, active: false } : prev));
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

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    let frame = 0;

    const handleMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const idx = readableBlocks.findIndex((el) => el === target || el.contains(target));
        setHoveredBlockIndex(idx >= 0 ? idx : null);
      });
    };

    const handleLeave = (event: MouseEvent) => {
      if (isInsideLayer(event.relatedTarget)) return;
      setHoveredBlockIndex(null);
    };

    root.addEventListener('mousemove', handleMove);
    root.addEventListener('mouseleave', handleLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('mousemove', handleMove);
      root.removeEventListener('mouseleave', handleLeave);
    };
  }, [contentRef, readableBlocks]);

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
      await addNote({
        kind: draft.kind,
        content: draft.content,
        color: draft.color,
        labels: draft.labels,
        highlightText: selection.anchor.highlightText,
        anchor: {
          mode: NOTE_ANCHOR_MODE.INLINE,
          ...(draft.style ? { style: draft.style } : {}),
          ...selection.anchor.anchor,
        },
      });
      clearSelection();
    });

  const saveFromBlockCluster = (draft: NoteDraft) =>
    withSaving(async () => {
      if (!blockDraft) return;
      const built = buildBlockClusterAnchor(
        readableBlocks,
        blockDraft.blockStart,
        blockDraft.blockEnd,
        draft.style,
      );
      await addNote({
        kind: draft.kind,
        content: draft.content,
        color: draft.color,
        labels: draft.labels,
        highlightText: built.highlightText,
        anchor: built.anchor,
      });
      setBlockDraft(null);
    });

  const reattachHere = () =>
    withSaving(async () => {
      if (!selection || !reattachNoteId) return;
      await editNote(reattachNoteId, {
        highlightText: selection.anchor.highlightText,
        anchor: { mode: NOTE_ANCHOR_MODE.INLINE, ...selection.anchor.anchor },
      });
      setReattachNoteId(null);
      clearSelection();
    });

  const confirmPosition = (noteId: string) => {
    const hit = located.find((l) => l.note.id === noteId);
    if (!hit) return;
    if (hit.mode === NOTE_ANCHOR_MODE.BLOCK && hit.blockElements?.length) {
      const firstIdx = readableBlocks.indexOf(hit.blockElements[0]);
      const lastIdx = readableBlocks.indexOf(hit.blockElements[hit.blockElements.length - 1]);
      if (firstIdx >= 0 && lastIdx >= firstIdx) {
        const built = buildBlockClusterAnchor(readableBlocks, firstIdx, lastIdx, hit.note.anchor?.style);
        void editNote(noteId, { highlightText: built.highlightText, anchor: built.anchor });
      }
      return;
    }
    const root = contentRef.current;
    const fresh = root ? anchorFromRange(buildTextIndex(root), root, hit.range) : null;
    if (fresh) {
      void editNote(noteId, {
        highlightText: fresh.highlightText,
        anchor: {
          ...fresh.anchor,
          ...(hit.note.anchor?.style ? { style: hit.note.anchor.style } : {}),
        },
      });
    }
  };

  return (
    <>
      {selection && (
        <SelectionPopup
          key={`${selection.at.top}-${selection.at.left}-${selection.initialView ?? SelectionPopupView.PILL}`}
          at={selection.at}
          selectedText={selection.anchor.highlightText}
          initialView={selection.initialView}
          activeColor={activeColor}
          onChangeActiveColor={changeActiveColor}
          saving={saving}
          labelSuggestions={labelSuggestions}
          reattaching={Boolean(reattachNoteId)}
          onSave={(draft) => void saveFromSelection(draft)}
          onEnableQuickPen={(style) => {
            setQuickPen((prev) => ({ active: true, style: style ?? prev.style }));
            clearSelection();
          }}
          onCopy={() => {
            void navigator.clipboard.writeText(`“${selection.anchor.highlightText}”`);
            clearSelection();
          }}
          onReattachHere={() => void reattachHere()}
          onCancelReattach={() => {
            setReattachNoteId(null);
            clearSelection();
          }}
          onClose={clearSelection}
        />
      )}

      {quickPen.active && (
        <QuickPenBar
          activeColor={activeColor}
          activeStyle={quickPen.style}
          onChangeColor={changeActiveColor}
          onChangeStyle={(style) => setQuickPen((prev) => ({ ...prev, style }))}
          onClose={() => setQuickPen((prev) => ({ ...prev, active: false }))}
        />
      )}

      {blockDraft && (
        <BlockComposerPopover
          at={blockDraft.at}
          saving={saving}
          labelSuggestions={labelSuggestions}
          clusterControls={{
            count: blockDraft.blockEnd - blockDraft.blockStart + 1,
            spanLabel: formatBlockSpanLabel({
              blockStart: blockDraft.blockStart,
              blockEnd: blockDraft.blockEnd,
            }),
            canExpand: blockDraft.blockEnd < readableBlocks.length - 1,
            canShrink: blockDraft.blockEnd > blockDraft.blockStart,
            onExpand: () =>
              setBlockDraft((prev) =>
                prev ? { ...prev, blockEnd: Math.min(readableBlocks.length - 1, prev.blockEnd + 1) } : null,
              ),
            onShrink: () =>
              setBlockDraft((prev) =>
                prev ? { ...prev, blockEnd: Math.max(prev.blockStart, prev.blockEnd - 1) } : null,
              ),
          }}
          onSave={(draft) => void saveFromBlockCluster(draft)}
          onClose={() => setBlockDraft(null)}
        />
      )}

      {reattachNoteId && !selection && (
        <div
          {...{ [NOTE_LAYER_ATTR]: '' }}
          className="fixed top-20 inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100vw-24px)] items-center gap-2 whitespace-nowrap rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-xl"
        >
          <Link2 size={15} /> Bôi đen đoạn mới trong bài để gắn lại ghi chú
          <button
            type="button"
            onClick={() => setReattachNoteId(null)}
            aria-label="Huỷ gắn lại"
            className="ml-1 cursor-pointer text-stone-300 hover:text-white"
          >
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
              await addNote({
                kind: draft.kind,
                content: draft.content,
                color: draft.color,
                labels: draft.labels,
                highlightText: summaryTarget.headingText,
                anchor: { mode: NOTE_ANCHOR_MODE.HEADING, headingId: summaryTarget.headingId },
              });
              setSummaryTarget(null);
            })
          }
        />
      )}

      <NoteInkLayer
        contentRef={contentRef}
        located={located}
        readableBlocks={readableBlocks}
        allNotes={allNotes}
        drawMode={drawMode}
        onExitDrawMode={() => setDrawMode(false)}
        onAddNote={addNote}
        onEditNote={editNote}
        onRemoveNote={removeNote}
        onOpenNote={(noteId, at) => {
          setSelection(null);
          setBlockDraft(null);
          setActive({ noteId, at });
        }}
      />

      <NoteStickyMarginLayer
        contentRef={contentRef}
        located={located}
        readableBlocks={readableBlocks}
        previewCluster={
          blockDraft ? { start: blockDraft.blockStart, end: blockDraft.blockEnd, color: NOTE_COLOR.BLUE } : null
        }
        hoveredBlockIndex={hoveredBlockIndex}
        hoveredNoteId={hoveredNoteId}
        flashedNoteId={flashedNoteId}
        showMarginSticky={showMarginSticky}
        disabledHoverButton={Boolean(selection || blockDraft || reattachNoteId || quickPen.active || drawMode)}
        onHoverNote={setHoveredNoteId}
        onOpenNote={(noteId, at) => {
          setSelection(null);
          setBlockDraft(null);
          setActive({ noteId, at });
        }}
        onStartBlockCluster={(blockStart, at) => {
          clearSelection();
          setActive(null);
          const blockRect = readableBlocks[blockStart]?.getBoundingClientRect();
          const rootRect = contentRef.current?.getBoundingClientRect();
          const point = blockRect && rootRect
            ? {
                top: window.scrollY + blockRect.top + 8,
                left: window.scrollX + rootRect.left + Math.min(220, rootRect.width / 2),
              }
            : at;
          setBlockDraft({ blockStart, blockEnd: blockStart, at: point });
        }}
      />

      <NoteReviewAlertBanner facade={facade} reviewCount={lostNoteIds.size + needsReviewIds.size} />
      <NoteDrawer
        facade={facade}
        targetTitle={targetTitle}
        targetType={targetType}
        onLocateNote={(noteId) => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            closeDrawer();
          }
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
