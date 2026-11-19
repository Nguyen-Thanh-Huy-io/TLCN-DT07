'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Layers } from 'lucide-react';
import { NOTE_KIND_META } from '../constants/note-kind.constants';
import type { LocatedNote } from '../hooks/useNoteHighlights';
import {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR_STYLES,
  NOTE_MARKUP_STYLE,
  type NoteColorValue,
} from '../services/note.service';
import { formatBlockSpanLabel, READER_RIGHT_SIDEBAR_ATTR } from '../utils/note-cluster.util';

export const NOTE_LAYER_ATTR = 'data-note-layer';

const MARKER_SIZE = 24;
const MARKER_GAP = 14;
const STICKY_MIN_GAP = 240;
const STICKY_MAX_WIDTH = 242;
const STICKY_CARD_HEIGHT_ESTIMATE = 92;
const BRACKET_OFFSET_LEFT = 14;
const CURLY_BRACE_WIDTH = 14;

export interface PagePoint {
  top: number;
  left: number;
}

interface CircleRingRect {
  key: string;
  top: number;
  left: number;
  width: number;
  height: number;
  stroke: string;
  highlighted: boolean;
}

interface BracketRect {
  noteId: string;
  top: number;
  left: number;
  braceLeft: number;
  height: number;
  width: number;
  color: NoteColorValue;
  useCurlyBrace: boolean;
  isPreview?: boolean;
}

interface StickyMarginItem {
  note: LocatedNote['note'];
  at: PagePoint;
  width: number;
  fullCard: boolean;
}

interface BlockHoverTrigger {
  top: number;
  left: number;
  blockIndex: number;
}

function measureRightAvailableWidth(box: DOMRect): number {
  const clientWidth = document.documentElement.clientWidth;
  const sidebar = document.querySelector(`[${READER_RIGHT_SIDEBAR_ATTR}]`);
  const sidebarRect = sidebar?.getBoundingClientRect();
  const sidebarVisibleOnRight =
    sidebarRect && sidebarRect.width > 0 && sidebarRect.left >= box.right - 20;
  const rightBoundary = sidebarVisibleOnRight
    ? Math.min(clientWidth - 12, sidebarRect.left - 12)
    : clientWidth - 12;
  return rightBoundary - box.right;
}

function spanRectOfBlocks(elements: HTMLElement[]): { top: number; bottom: number; left: number; width: number } | null {
  if (elements.length === 0) return null;
  const rects = elements.map((el) => el.getBoundingClientRect());
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  return { top, bottom, left, width: Math.max(40, right - left) };
}

function anchorTopOf(item: LocatedNote): number {
  if (item.mode === NOTE_ANCHOR_MODE.BLOCK && item.blockElements?.length) {
    return item.blockElements[0].getBoundingClientRect().top;
  }
  return (item.range.getClientRects()[0] ?? item.range.getBoundingClientRect()).top;
}

const isMarginVisibleNote = (item: LocatedNote): boolean => {
  if (item.mode === NOTE_ANCHOR_MODE.INK) {
    return false;
  }
  if (item.mode === NOTE_ANCHOR_MODE.INLINE && item.note.anchor?.style === NOTE_MARKUP_STYLE.CALLOUT) {
    return false;
  }
  return Boolean(item.note.content.trim()) || item.mode === NOTE_ANCHOR_MODE.BLOCK;
};

function buildCircleRings(
  located: readonly LocatedNote[],
  hoveredNoteId: string | null,
  flashedNoteId: string | null,
  clientWidth: number,
): CircleRingRect[] {
  const rings: CircleRingRect[] = [];
  for (const item of located) {
    if (item.mode !== NOTE_ANCHOR_MODE.INLINE) continue;
    if (item.note.anchor?.style !== NOTE_MARKUP_STYLE.CIRCLE) continue;
    const stroke = NOTE_COLOR_STYLES[item.note.color].stroke;
    const highlighted = hoveredNoteId === item.note.id || flashedNoteId === item.note.id;
    const clientRects = [...item.range.getClientRects()].filter((r) => r.width > 2 && r.height > 2);
    clientRects.forEach((r, idx) => {
      const left = Math.max(0, window.scrollX + r.left - 4);
      const right = Math.min(clientWidth, window.scrollX + r.right + 4);
      const width = Math.max(0, right - left);
      if (width <= 0) return;
      rings.push({
        key: `${item.note.id}-ring-${idx}`,
        top: window.scrollY + r.top - 2,
        left,
        width,
        height: r.height + 4,
        stroke,
        highlighted,
      });
    });
  }
  return rings;
}

/** SVG móc ngoặc nhọn `}` ôm nguyên cụm đoạn, hướng sang thẻ Sticky lề phải. */
function CurlyBraceSvg({ height, stroke, active }: { height: number; stroke: string; active: boolean }) {
  const h = Math.max(32, height);
  const mid = h / 2;
  const d = `M 2 2 C 9 2, 7 ${mid - 8}, 12 ${mid} C 7 ${mid + 8}, 9 ${h - 2}, 2 ${h - 2}`;
  return (
    <svg width={CURLY_BRACE_WIDTH} height={h} viewBox={`0 0 ${CURLY_BRACE_WIDTH} ${h}`} className="overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 2.6 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function computeBracketRects(
  located: readonly LocatedNote[],
  readableBlocks: HTMLElement[],
  previewCluster: { start: number; end: number; color: NoteColorValue } | null | undefined,
  box: DOMRect,
  useCurlyBrace: boolean,
  clientWidth: number,
): BracketRect[] {
  const result: BracketRect[] = [];
  const toRect = (
    noteId: string,
    elements: HTMLElement[],
    color: NoteColorValue,
    isPreview?: boolean,
  ): BracketRect | null => {
    const span = spanRectOfBlocks(elements);
    if (!span) return null;
    const left = Math.max(4, window.scrollX + box.left - BRACKET_OFFSET_LEFT);
    const rawWidth = Math.max(box.width, span.width) + BRACKET_OFFSET_LEFT;
    return {
      noteId,
      top: window.scrollY + span.top,
      left,
      braceLeft: Math.min(window.scrollX + box.right + 2, Math.max(0, clientWidth - CURLY_BRACE_WIDTH - 2)),
      height: Math.max(24, span.bottom - span.top),
      width: Math.max(0, Math.min(rawWidth, clientWidth - left - 2)),
      color,
      useCurlyBrace,
      isPreview,
    };
  };

  for (const item of located) {
    if (item.mode !== NOTE_ANCHOR_MODE.BLOCK || !item.blockElements?.length) continue;
    const rect = toRect(item.note.id, item.blockElements, item.note.color);
    if (rect) result.push(rect);
  }
  if (previewCluster) {
    const slice = readableBlocks.slice(previewCluster.start, previewCluster.end + 1);
    const rect = toRect('__preview__', slice, previewCluster.color, true);
    if (rect) result.push(rect);
  }
  return result;
}

function computeStickyMarginItems(
  located: readonly LocatedNote[],
  fullCard: boolean,
  cardWidth: number,
  marginLeft: number,
): StickyMarginItem[] {
  let lastBottom = -Infinity;
  return located
    .filter(isMarginVisibleNote)
    .map((item) => ({ item, rectTop: anchorTopOf(item) }))
    .sort((a, b) => a.rectTop - b.rectTop)
    .map(({ item, rectTop }) => {
      const slotHeight = fullCard ? STICKY_CARD_HEIGHT_ESTIMATE : MARKER_SIZE + 4;
      const pageTop = Math.max(window.scrollY + rectTop, lastBottom + 6);
      lastBottom = pageTop + (fullCard ? slotHeight - 6 : MARKER_SIZE);
      return {
        note: item.note,
        at: { top: pageTop, left: marginLeft },
        width: cardWidth,
        fullCard,
      };
    });
}

function resolveBlockHoverTrigger(
  disabledHoverButton: boolean,
  hoveredBlockIndex: number | null,
  readableBlocks: HTMLElement[],
  box: DOMRect,
  clientWidth: number,
): BlockHoverTrigger | null {
  if (disabledHoverButton || hoveredBlockIndex === null || !readableBlocks[hoveredBlockIndex]) {
    return null;
  }
  const elRect = readableBlocks[hoveredBlockIndex].getBoundingClientRect();
  const minLeft = clientWidth >= 640 ? 64 : 6;
  return {
    top: window.scrollY + elRect.top + 2,
    left: Math.max(minLeft, Math.min(window.scrollX + box.left - 30, Math.max(minLeft, clientWidth - 28))),
    blockIndex: hoveredBlockIndex,
  };
}

interface NoteStickyMarginLayerProps {
  contentRef: React.RefObject<HTMLElement | null>;
  located: LocatedNote[];
  readableBlocks: HTMLElement[];
  previewCluster?: { start: number; end: number; color: NoteColorValue } | null;
  hoveredBlockIndex: number | null;
  hoveredNoteId: string | null;
  flashedNoteId: string | null;
  showMarginSticky: boolean;
  disabledHoverButton: boolean;
  onHoverNote: (noteId: string | null) => void;
  onOpenNote: (noteId: string, at: PagePoint) => void;
  onStartBlockCluster: (blockIndex: number, at: PagePoint) => void;
}

/**
 * Hiển thị lớp đánh dấu hình học không chạm DOM gốc:
 * 1. Vòng khoanh tròn từ khóa (`CIRCLE`) quanh `Range.getClientRects()`.
 * 2. Móc ngoặc nhọn `}` (hoặc vạch dọc) ôm cụm đoạn văn (`BLOCK`) & preview khi gộp đoạn.
 * 3. Thẻ Sticky Note ngoài lề phải (tự gập thành icon badge khi lề hẹp / có sidebar).
 * 4. Nút `+` mảnh cạnh đoạn văn đang hover để gắn Sticky Note nguyên cụm.
 */
export function NoteStickyMarginLayer({
  contentRef,
  located,
  readableBlocks,
  previewCluster,
  hoveredBlockIndex,
  hoveredNoteId,
  flashedNoteId,
  showMarginSticky,
  disabledHoverButton,
  onHoverNote,
  onOpenNote,
  onStartBlockCluster,
}: NoteStickyMarginLayerProps) {
  const [circleRings, setCircleRings] = useState<CircleRingRect[]>([]);
  const [brackets, setBrackets] = useState<BracketRect[]>([]);
  const [marginItems, setMarginItems] = useState<StickyMarginItem[]>([]);
  const [hoverTrigger, setHoverTrigger] = useState<BlockHoverTrigger | null>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    let frame = 0;

    const computeLayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const clientWidth = document.documentElement.clientWidth;
        const box = root.getBoundingClientRect();
        const availableRight = measureRightAvailableWidth(box);
        const fullCard = showMarginSticky && availableRight >= STICKY_MIN_GAP;
        const cardWidth = fullCard ? Math.min(STICKY_MAX_WIDTH, availableRight - 24) : MARKER_SIZE;
        const marginLeft = fullCard
          ? Math.min(window.scrollX + box.right + MARKER_GAP + 6, Math.max(0, clientWidth - cardWidth - 8))
          : Math.min(window.scrollX + box.right + 8, Math.max(0, clientWidth - MARKER_SIZE - 8));

        setCircleRings(buildCircleRings(located, hoveredNoteId, flashedNoteId, clientWidth));
        setBrackets(computeBracketRects(located, readableBlocks, previewCluster, box, fullCard, clientWidth));
        setMarginItems(computeStickyMarginItems(located, fullCard, cardWidth, marginLeft));
        setHoverTrigger(resolveBlockHoverTrigger(disabledHoverButton, hoveredBlockIndex, readableBlocks, box, clientWidth));
      });
    };

    computeLayout();
    const observer = new ResizeObserver(computeLayout);
    observer.observe(root);
    observer.observe(document.documentElement);
    window.addEventListener('resize', computeLayout);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', computeLayout);
    };
  }, [
    contentRef,
    located,
    readableBlocks,
    previewCluster,
    hoveredBlockIndex,
    hoveredNoteId,
    flashedNoteId,
    showMarginSticky,
    disabledHoverButton,
  ]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {circleRings.map((ring) => (
        <span
          key={ring.key}
          {...{ [NOTE_LAYER_ATTR]: '' }}
          style={{
            position: 'absolute',
            top: ring.top,
            left: ring.left,
            width: ring.width,
            height: ring.height,
            borderColor: ring.stroke,
          }}
          className={`pointer-events-none z-20 rounded-full border-2 transition-transform ${
            ring.highlighted ? 'scale-[1.03] bg-amber-100/20' : ''
          }`}
        />
      ))}

      {brackets.map((b) => {
        const active = b.isPreview || hoveredNoteId === b.noteId || flashedNoteId === b.noteId;
        const style = NOTE_COLOR_STYLES[b.color];
        return (
          <React.Fragment key={`bracket-${b.noteId}`}>
            <div
              {...{ [NOTE_LAYER_ATTR]: '' }}
              style={{ position: 'absolute', top: b.top, left: b.left, height: b.height, width: b.width }}
              className={`pointer-events-none z-20 rounded-r-lg transition-colors duration-150 ${
                active ? `${style.bg} opacity-45` : 'bg-transparent'
              }`}
            >
              {!b.useCurlyBrace && (
                <div
                  onMouseEnter={() => !b.isPreview && onHoverNote(b.noteId)}
                  onMouseLeave={() => !b.isPreview && onHoverNote(null)}
                  onClick={() => {
                    if (!b.isPreview) onOpenNote(b.noteId, { top: b.top + b.height + 8, left: b.left + b.width / 2 });
                  }}
                  className={`pointer-events-auto h-full w-1.5 cursor-pointer rounded-full transition-all ${style.dot} ${
                    active ? 'scale-x-125 shadow-sm' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={b.isPreview ? 'Vùng cụm đang chọn' : 'Xem Sticky Note của cụm đoạn'}
                />
              )}
            </div>

            {b.useCurlyBrace && (
              <div
                {...{ [NOTE_LAYER_ATTR]: '' }}
                style={{ position: 'absolute', top: b.top, left: b.braceLeft, height: b.height }}
                onMouseEnter={() => !b.isPreview && onHoverNote(b.noteId)}
                onMouseLeave={() => !b.isPreview && onHoverNote(null)}
                onClick={() => {
                  if (!b.isPreview) onOpenNote(b.noteId, { top: b.top + b.height / 2, left: b.braceLeft + 120 });
                }}
                title={b.isPreview ? 'Vùng cụm đang chọn' : 'Xem Sticky Note của cụm đoạn'}
                className="z-20 cursor-pointer"
              >
                <CurlyBraceSvg height={b.height} stroke={style.stroke} active={active} />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {hoverTrigger && (
        <button
          type="button"
          {...{ [NOTE_LAYER_ATTR]: '' }}
          onClick={() =>
            onStartBlockCluster(hoverTrigger.blockIndex, {
              top: hoverTrigger.top,
              left: hoverTrigger.left + 160,
            })
          }
          style={{ position: 'absolute', top: hoverTrigger.top, left: hoverTrigger.left }}
          title="Ghi chú sticky cho đoạn / cụm này"
          aria-label="Ghi chú đoạn văn này"
          className="z-30 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[#E5D8C1] bg-[#FFFCF5]/95 text-xs font-bold text-[#8B261E] shadow-xs transition hover:scale-110 hover:bg-[#8B261E] hover:text-white"
        >
          +
        </button>
      )}

      {marginItems.map(({ note, at, width, fullCard }) => {
        const meta = NOTE_KIND_META[note.kind];
        const Icon = meta.icon;
        const colorStyle = NOTE_COLOR_STYLES[note.color];
        const isHighlighted = hoveredNoteId === note.id || flashedNoteId === note.id;

        if (!fullCard) {
          return (
            <button
              key={`marker-${note.id}`}
              type="button"
              {...{ [NOTE_LAYER_ATTR]: '' }}
              onMouseEnter={() => onHoverNote(note.id)}
              onMouseLeave={() => onHoverNote(null)}
              onClick={() => onOpenNote(note.id, { top: at.top + 28, left: at.left })}
              style={{ position: 'absolute', top: at.top, left: at.left }}
              aria-label={`Xem ${meta.label.toLowerCase()}`}
              title={note.labels[0] ? `#${note.labels[0]} — ${meta.label}` : meta.label}
              className={`z-30 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white text-stone-800 shadow-sm transition-transform hover:scale-110 ${colorStyle.dot} ${
                isHighlighted ? 'ring-2 ring-[#8B261E]' : ''
              }`}
            >
              <Icon size={12} />
            </button>
          );
        }

        const spanLabel = formatBlockSpanLabel(note.anchor);
        const primaryGroup = note.labels[0];
        return (
          <button
            key={`sticky-${note.id}`}
            type="button"
            {...{ [NOTE_LAYER_ATTR]: '' }}
            onMouseEnter={() => onHoverNote(note.id)}
            onMouseLeave={() => onHoverNote(null)}
            onClick={() => onOpenNote(note.id, { top: at.top + 48, left: at.left + width / 2 })}
            style={{ position: 'absolute', top: at.top, left: at.left, width }}
            className={`group z-30 cursor-pointer rounded-xl border ${colorStyle.border} ${colorStyle.bg} p-2.5 text-left shadow-sm transition-all hover:shadow-md ${
              isHighlighted ? '-translate-x-0.5 shadow-md ring-2 ring-[#8B261E]' : 'opacity-95'
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-1">
              <div className="flex min-w-0 items-center gap-1">
                <span className={`h-2 w-2 shrink-0 rounded-full ${colorStyle.dot}`} />
                <span className={`truncate text-[10px] font-bold ${colorStyle.ink}`}>
                  {primaryGroup ? `#${primaryGroup}` : meta.label}
                </span>
                {spanLabel && (
                  <span className="shrink-0 rounded bg-white/75 px-1 py-0.5 text-[9px] font-semibold text-stone-500">
                    {spanLabel}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 text-stone-500">
                {note.resolvedAt && <CheckCircle2 size={11} className="text-emerald-600" />}
                {note.labels.length > 1 && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold">
                    <Layers size={9} />+{note.labels.length - 1}
                  </span>
                )}
              </div>
            </div>
            <p className={`line-clamp-3 whitespace-pre-wrap text-[11.5px] italic leading-snug ${note.content ? colorStyle.ink : 'text-stone-400'}`}>
              {note.content || note.highlightText || meta.label}
            </p>
          </button>
        );
      })}
    </>,
    document.body,
  );
}
