'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyboardKey } from '@/constants/enums';
import type { LocatedNote } from '../hooks/useNoteHighlights';
import { useInkSyncQueue } from '../hooks/useInkSyncQueue';
import type { NewNoteInput } from '../facades/useNoteFacade';
import {
  NOTE_COLOR,
  NOTE_INK_TOOL,
  type NoteColorValue,
  type NoteInkItem,
  type NoteItem,
  type UpdateNotePayload,
} from '../services/note.service';
import { INK_HISTORY_ACTION, hitTestInkItem } from '../utils/note-cluster.util';
import {
  appendInkPoint,
  buildSmoothInkPath,
  computeInkCanvasMetrics,
  findNearestBlockIndex,
  normalizeInkPoints,
  type InkCanvasMetrics,
  type InkPoint,
} from '../utils/note-ink.util';
import {
  CURSOR_BY_TOOL,
  DrawToolMode,
  InkFreeTextItems,
  InkSvgPaths,
  NoteDrawToolbar,
  PENDING_TEXT_BOX_WIDTH,
  PendingInkTextInput,
  buildRenderedInkItems,
  createInkItemId,
  nextStrokeWidth,
  type ActiveDraftStroke,
  type DraftPreviewMeta,
  type PendingFreeText,
} from './NoteInkParts';
import { NOTE_LAYER_ATTR, type PagePoint } from './NoteStickyMarginLayer';

const MARGIN_BLEED_LEFT = 120;
const MARGIN_BLEED_RIGHT = 240;
const MARGIN_BLEED_TOP = 32;

interface NoteInkLayerProps {
  contentRef: React.RefObject<HTMLElement | null>;
  located: LocatedNote[];
  readableBlocks: HTMLElement[];
  allNotes: NoteItem[];
  drawMode: boolean;
  onExitDrawMode: () => void;
  onAddNote: (input: NewNoteInput) => Promise<NoteItem | undefined>;
  onEditNote: (id: string, updates: UpdateNotePayload) => Promise<NoteItem | undefined>;
  onRemoveNote: (id: string) => Promise<void>;
  onOpenNote: (noteId: string, at: PagePoint) => void;
}

/**
 * Lớp vẽ tự do & chèn chữ bổ sung trực tiếp lên bài đọc:
 * - Kéo bút 60fps bằng `draftPathRef` trực tiếp trên DOM SVG (không re-render cả cây).
 * - Trạng thái lạc quan `useInkSyncQueue` giúp nét vẽ hiển thị tức thì 0ms khi nhấc bút.
 */
export function NoteInkLayer({
  contentRef,
  located,
  readableBlocks,
  allNotes,
  drawMode,
  onExitDrawMode,
  onAddNote,
  onEditNote,
  onRemoveNote,
  onOpenNote,
}: NoteInkLayerProps) {
  const [tool, setTool] = useState<DrawToolMode>(DrawToolMode.PEN);
  const [color, setColor] = useState<NoteColorValue>(NOTE_COLOR.PINK);
  const [wideStroke, setWideStroke] = useState(false);
  const [metrics, setMetrics] = useState<InkCanvasMetrics | null>(null);
  const [draftPreview, setDraftPreview] = useState<DraftPreviewMeta | null>(null);
  const [pendingText, setPendingText] = useState<PendingFreeText | null>(null);
  const [draftTextValue, setDraftTextValue] = useState('');

  const draftStrokeRef = useRef<ActiveDraftStroke | null>(null);
  const draftPathRef = useRef<SVGPathElement | null>(null);
  const erasingRef = useRef(false);
  const erasedIdsRef = useRef<Set<string>>(new Set());
  const committingTextRef = useRef(false);

  const {
    effectiveBlockNotes,
    undoCount,
    getBlockItems,
    pushHistory,
    commitBlockItems,
    undoLast,
  } = useInkSyncQueue({
    allNotes,
    readableBlocks,
    fallbackColor: color,
    onAddNote,
    onEditNote,
    onRemoveNote,
  });

  const refreshMetrics = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;
    setMetrics(
      computeInkCanvasMetrics(
        root,
        readableBlocks,
        MARGIN_BLEED_LEFT,
        MARGIN_BLEED_RIGHT,
        MARGIN_BLEED_TOP,
      ),
    );
  }, [contentRef, readableBlocks]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refreshMetrics);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(document.documentElement);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [contentRef, refreshMetrics]);

  const exitDrawModeCleanly = useCallback(() => {
    draftStrokeRef.current = null;
    erasingRef.current = false;
    erasedIdsRef.current.clear();
    setDraftPreview(null);
    setPendingText(null);
    setDraftTextValue('');
    onExitDrawMode();
  }, [onExitDrawMode]);

  useEffect(() => {
    if (!drawMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) {
        if (pendingText) {
          setPendingText(null);
          setDraftTextValue('');
        } else {
          exitDrawModeCleanly();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLast();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawMode, pendingText, undoLast, exitDrawModeCleanly]);

  const eraseAt = (pageX: number, pageY: number) => {
    if (!metrics) return;
    for (const entry of effectiveBlockNotes) {
      const bBox = metrics.blockBoxes[entry.blockStart];
      if (!bBox || entry.items.length === 0) continue;
      const hit = entry.items.find(
        (item) =>
          !erasedIdsRef.current.has(item.id) &&
          hitTestInkItem(item, pageX, pageY, metrics.contentBox, bBox),
      );
      if (hit) {
        erasedIdsRef.current.add(hit.id);
        pushHistory({ action: INK_HISTORY_ACTION.REMOVE, blockStart: entry.blockStart, item: hit });
        const latestItems = getBlockItems(entry.blockStart);
        commitBlockItems(
          entry.blockStart,
          latestItems.filter((i) => i.id !== hit.id),
        );
        break;
      }
    }
  };

  const commitPendingText = () => {
    if (committingTextRef.current) return;
    committingTextRef.current = true;
    try {
      if (!pendingText || !metrics) {
        setPendingText(null);
        return;
      }
      const text = draftTextValue.trim();
      const bBox = metrics.blockBoxes[pendingText.blockStart];
      const target = pendingText;
      setPendingText(null);
      setDraftTextValue('');
      if (!text || !bBox) return;

      const newItem: NoteInkItem = {
        id: createInkItemId(),
        tool: NOTE_INK_TOOL.TEXT,
        color,
        text,
        nx: Math.round(((target.pageX - metrics.contentBox.left) / metrics.contentBox.width) * 10000) / 10000,
        ny: Math.round(((target.pageY - bBox.top) / bBox.height) * 10000) / 10000,
      };
      const prevItems = getBlockItems(target.blockStart);
      pushHistory({ action: INK_HISTORY_ACTION.ADD, blockStart: target.blockStart, item: newItem });
      commitBlockItems(target.blockStart, [...prevItems, newItem]);
    } finally {
      committingTextRef.current = false;
    }
  };

  const handleSelectTool = (nextTool: DrawToolMode) => {
    draftStrokeRef.current = null;
    setDraftPreview(null);
    setTool(nextTool);
    setPendingText(null);
    if (nextTool === DrawToolMode.HIGHLIGHTER && color === NOTE_COLOR.PINK) {
      setColor(NOTE_COLOR.YELLOW);
    } else if ((nextTool === DrawToolMode.PEN || nextTool === DrawToolMode.TEXT) && color === NOTE_COLOR.YELLOW) {
      setColor(NOTE_COLOR.PINK);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawMode || !metrics || e.button !== 0) return;
    const { pageX, pageY } = e;

    if (tool === DrawToolMode.ERASER) {
      erasingRef.current = true;
      erasedIdsRef.current.clear();
      e.currentTarget.setPointerCapture(e.pointerId);
      eraseAt(pageX, pageY);
      return;
    }

    const blockIdx = findNearestBlockIndex(readableBlocks, e.clientY);
    if (blockIdx < 0) return;

    if (tool === DrawToolMode.TEXT) {
      e.preventDefault();
      if (pendingText) commitPendingText();
      setPendingText({ blockStart: blockIdx, pageX, pageY });
      setDraftTextValue('');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const width = nextStrokeWidth(tool, wideStroke);
    const startPoint: InkPoint = { x: pageX, y: pageY };
    draftStrokeRef.current = { blockStart: blockIdx, tool, color, width, points: [startPoint] };
    setDraftPreview({
      tool,
      color,
      width,
      initialD: buildSmoothInkPath([
        { x: startPoint.x - metrics.canvasBox.left, y: startPoint.y - metrics.canvasBox.top },
      ]),
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawMode || !metrics) return;
    if (erasingRef.current && tool === DrawToolMode.ERASER) {
      eraseAt(e.pageX, e.pageY);
      return;
    }
    const active = draftStrokeRef.current;
    if (!active) return;
    const nextPoints = appendInkPoint(active.points, { x: e.pageX, y: e.pageY });
    if (nextPoints === active.points) return;
    active.points = nextPoints;

    const { left, top } = metrics.canvasBox;
    const localPoints = nextPoints.map((p) => ({ x: p.x - left, y: p.y - top }));
    draftPathRef.current?.setAttribute('d', buildSmoothInkPath(localPoints));
  };

  const finishStroke = () => {
    if (erasingRef.current) {
      erasingRef.current = false;
      erasedIdsRef.current.clear();
      return;
    }
    const strokeToSave = draftStrokeRef.current;
    draftStrokeRef.current = null;
    setDraftPreview(null);
    if (!strokeToSave || !metrics) return;

    const bBox = metrics.blockBoxes[strokeToSave.blockStart];
    if (!bBox || strokeToSave.points.length === 0) return;

    const newItem: NoteInkItem = {
      id: createInkItemId(),
      tool:
        strokeToSave.tool === DrawToolMode.HIGHLIGHTER
          ? NOTE_INK_TOOL.HIGHLIGHTER
          : NOTE_INK_TOOL.PEN,
      color: strokeToSave.color,
      width: strokeToSave.width,
      pts: normalizeInkPoints(strokeToSave.points, metrics.contentBox, bBox),
    };
    const prevItems = getBlockItems(strokeToSave.blockStart);
    pushHistory({ action: INK_HISTORY_ACTION.ADD, blockStart: strokeToSave.blockStart, item: newItem });
    commitBlockItems(strokeToSave.blockStart, [...prevItems, newItem]);
  };

  const renderedItems = useMemo(
    () => (metrics ? buildRenderedInkItems(effectiveBlockNotes, located, readableBlocks, metrics) : []),
    [effectiveBlockNotes, located, readableBlocks, metrics],
  );

  if (typeof document === 'undefined' || !metrics) return null;

  const { canvasBox } = metrics;
  const svgCursor = CURSOR_BY_TOOL[tool];

  return createPortal(
    <>
      <div
        {...{ [NOTE_LAYER_ATTR]: '' }}
        style={{
          position: 'absolute',
          top: canvasBox.top,
          left: canvasBox.left,
          width: canvasBox.width,
          height: canvasBox.height,
        }}
        className="pointer-events-none z-25 overflow-hidden"
      >
        <svg
          width={canvasBox.width}
          height={canvasBox.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          style={{ touchAction: drawMode ? 'none' : 'auto' }}
          className={`block h-full w-full ${drawMode ? `pointer-events-auto ${svgCursor}` : 'pointer-events-none'}`}
        >
          <InkSvgPaths
            renderedItems={renderedItems}
            drawMode={drawMode}
            draftPreview={draftPreview}
            draftPathRef={draftPathRef}
          />
        </svg>

        <InkFreeTextItems
          renderedItems={renderedItems}
          canvasWidth={canvasBox.width}
          drawMode={drawMode}
          tool={tool}
          onOpenNote={onOpenNote}
          onEraseTextItem={(entry) => {
            const latestItems = getBlockItems(entry.blockStart);
            pushHistory({
              action: INK_HISTORY_ACTION.REMOVE,
              blockStart: entry.blockStart,
              item: entry.item,
            });
            commitBlockItems(
              entry.blockStart,
              latestItems.filter((i) => i.id !== entry.item.id),
            );
          }}
        />

        {drawMode && pendingText && (
          <PendingInkTextInput
            left={Math.max(
              0,
              Math.min(
                pendingText.pageX - canvasBox.left,
                Math.max(0, canvasBox.width - PENDING_TEXT_BOX_WIDTH),
              ),
            )}
            top={pendingText.pageY - canvasBox.top - 14}
            color={color}
            value={draftTextValue}
            onChange={setDraftTextValue}
            onCommit={commitPendingText}
            onCancel={() => {
              setPendingText(null);
              setDraftTextValue('');
            }}
          />
        )}
      </div>

      {drawMode && (
        <NoteDrawToolbar
          tool={tool}
          color={color}
          wideStroke={wideStroke}
          canUndo={undoCount > 0}
          onSelectTool={handleSelectTool}
          onChangeColor={setColor}
          onToggleWidth={() => setWideStroke((v) => !v)}
          onUndo={undoLast}
          onClose={exitDrawModeCleanly}
        />
      )}
    </>,
    document.body,
  );
}
