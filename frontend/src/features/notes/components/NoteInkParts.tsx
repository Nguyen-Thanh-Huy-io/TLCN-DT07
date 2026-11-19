'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Eraser, Highlighter, PenTool, Type, Undo2, X } from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import type { LocatedNote } from '../hooks/useNoteHighlights';
import {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR_STYLES,
  NOTE_INK_TOOL,
  type NoteColorValue,
  type NoteInkItem,
} from '../services/note.service';
import {
  OPTIMISTIC_INK_NOTE_ID_PREFIX,
  type EffectiveBlockInkNote,
} from '../utils/note-cluster.util';
import {
  buildSmoothInkPath,
  denormalizeInkPoints,
  type InkCanvasMetrics,
  type InkPoint,
} from '../utils/note-ink.util';
import { ColorDots } from './NoteReaderParts';
import { NOTE_LAYER_ATTR, type PagePoint } from './NoteStickyMarginLayer';

export enum DrawToolMode {
  PEN = 'PEN',
  HIGHLIGHTER = 'HIGHLIGHTER',
  TEXT = 'TEXT',
  ERASER = 'ERASER',
}

export interface RenderedInkItem {
  noteId: string;
  blockStart: number;
  item: NoteInkItem;
  pathD?: string;
  textPos?: InkPoint;
  stroke: string;
  inkClass: string;
}

export const TEXT_ANNOTATION_MAX_WIDTH = 220;
export const PENDING_TEXT_BOX_WIDTH = 204;
export const HIGHLIGHTER_OPACITY = 0.34;
const PEN_STROKE_WIDTHS = [2.5, 4.5] as const;
const HIGHLIGHTER_WIDTHS = [16, 24] as const;

export interface ActiveDraftStroke {
  blockStart: number;
  tool: DrawToolMode.PEN | DrawToolMode.HIGHLIGHTER;
  color: NoteColorValue;
  width: number;
  points: InkPoint[];
}

export interface DraftPreviewMeta {
  tool: DrawToolMode.PEN | DrawToolMode.HIGHLIGHTER;
  color: NoteColorValue;
  width: number;
  initialD: string;
}

export interface PendingFreeText {
  blockStart: number;
  pageX: number;
  pageY: number;
}

export const CURSOR_BY_TOOL: Record<DrawToolMode, string> = {
  [DrawToolMode.PEN]: 'cursor-crosshair',
  [DrawToolMode.HIGHLIGHTER]: 'cursor-crosshair',
  [DrawToolMode.TEXT]: 'cursor-text',
  [DrawToolMode.ERASER]: 'cursor-cell',
};

export const nextStrokeWidth = (tool: DrawToolMode, isWide: boolean) =>
  tool === DrawToolMode.HIGHLIGHTER
    ? HIGHLIGHTER_WIDTHS[isWide ? 1 : 0]
    : PEN_STROKE_WIDTHS[isWide ? 1 : 0];

export const createInkItemId = () =>
  `ink_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

interface DrawToolMeta {
  tool: DrawToolMode;
  label: string;
  icon: typeof PenTool;
  showColor: boolean;
  showWidth: boolean;
}

const DRAW_TOOL_META: ReadonlyArray<DrawToolMeta> = [
  { tool: DrawToolMode.PEN, label: 'Bút mực', icon: PenTool, showColor: true, showWidth: true },
  { tool: DrawToolMode.HIGHLIGHTER, label: 'Dạ quang', icon: Highlighter, showColor: true, showWidth: true },
  { tool: DrawToolMode.TEXT, label: 'Chèn chữ', icon: Type, showColor: true, showWidth: false },
  { tool: DrawToolMode.ERASER, label: 'Tẩy nét', icon: Eraser, showColor: false, showWidth: false },
];

const DRAW_TOOL_BY_MODE: Record<DrawToolMode, DrawToolMeta> = {
  [DrawToolMode.PEN]: DRAW_TOOL_META[0],
  [DrawToolMode.HIGHLIGHTER]: DRAW_TOOL_META[1],
  [DrawToolMode.TEXT]: DRAW_TOOL_META[2],
  [DrawToolMode.ERASER]: DRAW_TOOL_META[3],
};

function resolveLocatedBlockIndices(
  located: readonly LocatedNote[],
  readableBlocks: readonly HTMLElement[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const hit of located) {
    if (hit.mode !== NOTE_ANCHOR_MODE.INK || !hit.blockElements?.[0]) continue;
    const idx = readableBlocks.indexOf(hit.blockElements[0]);
    if (idx >= 0) map.set(hit.note.id, idx);
  }
  return map;
}

export function buildRenderedInkItems(
  effectiveNotes: readonly EffectiveBlockInkNote[],
  located: readonly LocatedNote[],
  readableBlocks: readonly HTMLElement[],
  metrics: InkCanvasMetrics,
): RenderedInkItem[] {
  const { canvasBox, contentBox, blockBoxes } = metrics;
  const locatedBlockIndices = resolveLocatedBlockIndices(located, readableBlocks);
  const output: RenderedInkItem[] = [];

  for (const entry of effectiveNotes) {
    const resolvedIdx = locatedBlockIndices.get(entry.noteId) ?? entry.blockStart;
    const blockBox = blockBoxes[resolvedIdx];
    if (!blockBox) continue;

    for (const item of entry.items) {
      const colorStyle = NOTE_COLOR_STYLES[item.color] ?? NOTE_COLOR_STYLES.PINK;
      if (item.tool === NOTE_INK_TOOL.TEXT) {
        output.push({
          noteId: entry.noteId,
          blockStart: resolvedIdx,
          item,
          textPos: {
            x: contentBox.left + (item.nx ?? 0) * contentBox.width - canvasBox.left,
            y: blockBox.top + (item.ny ?? 0) * blockBox.height - canvasBox.top,
          },
          stroke: colorStyle.stroke,
          inkClass: colorStyle.ink,
        });
        continue;
      }

      const pts = denormalizeInkPoints(item.pts, contentBox, blockBox).map((p) => ({
        x: p.x - canvasBox.left,
        y: p.y - canvasBox.top,
      }));
      if (pts.length > 0) {
        output.push({
          noteId: entry.noteId,
          blockStart: resolvedIdx,
          item,
          pathD: buildSmoothInkPath(pts),
          stroke: colorStyle.stroke,
          inkClass: colorStyle.ink,
        });
      }
    }
  }
  return output;
}

interface NoteDrawToolbarProps {
  tool: DrawToolMode;
  color: NoteColorValue;
  wideStroke: boolean;
  canUndo: boolean;
  onSelectTool: (t: DrawToolMode) => void;
  onChangeColor: (c: NoteColorValue) => void;
  onToggleWidth: () => void;
  onUndo: () => void;
  onClose: () => void;
}

/**
 * Thanh công cụ vẽ tự do tối giản 1 dòng cố định ở đáy màn hình:
 * - Căn giữa bằng `inset-x-0 mx-auto w-fit` để không bị co bề rộng 50vw hay tràn ngang.
 * - Các công cụ dùng biểu tượng + tooltip để giảm chữ thừa, chỉ giữ nhãn `Xong`.
 */
export function NoteDrawToolbar({
  tool,
  color,
  wideStroke,
  canUndo,
  onSelectTool,
  onChangeColor,
  onToggleWidth,
  onUndo,
  onClose,
}: NoteDrawToolbarProps) {
  const activeMeta = DRAW_TOOL_BY_MODE[tool];

  return createPortal(
    <div
      {...{ [NOTE_LAYER_ATTR]: '' }}
      role="toolbar"
      aria-label="Thanh vẽ tự do trên bài đọc"
      className="fixed bottom-5 inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100vw-24px)] items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-[#E5D8C1]/80 bg-[#2D1A10]/95 px-2.5 py-1.5 text-[#FFFCF5] shadow-2xl backdrop-blur-md"
    >
      <div className="flex shrink-0 items-center gap-0.5">
        {DRAW_TOOL_META.map(({ tool: key, label, icon: Icon }) => {
          const active = tool === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTool(key)}
              aria-label={label}
              aria-pressed={active}
              title={label}
              className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition ${
                active
                  ? 'bg-[#8B261E] text-white shadow-xs ring-1 ring-white/25'
                  : 'text-stone-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>

      {activeMeta.showColor && (
        <>
          <div className="mx-1 h-4 w-px shrink-0 bg-white/20" />
          <div className="shrink-0 px-1">
            <ColorDots value={color} size="sm" darkSurface onPick={onChangeColor} />
          </div>
        </>
      )}

      {activeMeta.showWidth && (
        <button
          type="button"
          onClick={onToggleWidth}
          title={wideStroke ? 'Nét đậm (bấm đổi nét mảnh)' : 'Nét mảnh (bấm đổi nét đậm)'}
          aria-label={wideStroke ? 'Nét đậm' : 'Nét mảnh'}
          aria-pressed={wideStroke}
          className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition ${
            wideStroke ? 'bg-white/20 text-white' : 'text-stone-300 hover:bg-white/15'
          }`}
        >
          <span
            aria-hidden="true"
            className={`block rounded-full bg-current transition-all ${
              wideStroke ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'
            }`}
          />
        </button>
      )}

      <div className="mx-1 h-4 w-px shrink-0 bg-white/20" />

      <button
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
        title="Hoàn tác nét vừa vẽ (Ctrl+Z)"
        aria-label="Hoàn tác"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Undo2 size={15} />
      </button>

      <button
        type="button"
        onClick={onClose}
        title="Thoát chế độ vẽ (Esc)"
        aria-label="Thoát chế độ vẽ"
        className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-3 text-xs font-semibold text-white transition hover:bg-white/25"
      >
        <X size={13} />
        <span>Xong</span>
      </button>
    </div>,
    document.body,
  );
}

export function InkSvgPaths({
  renderedItems,
  drawMode,
  draftPreview,
  draftPathRef,
}: {
  renderedItems: readonly RenderedInkItem[];
  drawMode: boolean;
  draftPreview: DraftPreviewMeta | null;
  draftPathRef: React.RefObject<SVGPathElement | null>;
}) {
  return (
    <>
      {renderedItems.map((entry) => {
        if (!entry.pathD) return null;
        const isHi = entry.item.tool === NOTE_INK_TOOL.HIGHLIGHTER;
        return (
          <path
            key={entry.item.id}
            d={entry.pathD}
            fill="none"
            stroke={entry.stroke}
            strokeWidth={entry.item.width ?? (isHi ? 18 : 3)}
            strokeOpacity={isHi ? HIGHLIGHTER_OPACITY : 0.92}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={isHi ? { mixBlendMode: 'multiply' } : undefined}
          />
        );
      })}

      {drawMode && draftPreview && (
        <path
          ref={draftPathRef}
          d={draftPreview.initialD}
          fill="none"
          stroke={NOTE_COLOR_STYLES[draftPreview.color].stroke}
          strokeWidth={draftPreview.width}
          strokeOpacity={
            draftPreview.tool === DrawToolMode.HIGHLIGHTER ? HIGHLIGHTER_OPACITY : 0.92
          }
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </>
  );
}

export function InkFreeTextItems({
  renderedItems,
  canvasWidth,
  drawMode,
  tool,
  onEraseTextItem,
  onOpenNote,
}: {
  renderedItems: readonly RenderedInkItem[];
  canvasWidth: number;
  drawMode: boolean;
  tool: DrawToolMode;
  onEraseTextItem: (entry: RenderedInkItem) => void;
  onOpenNote: (noteId: string, at: PagePoint) => void;
}) {
  const passThroughPointer =
    drawMode && (tool === DrawToolMode.PEN || tool === DrawToolMode.HIGHLIGHTER);

  return (
    <>
      {renderedItems.map((entry) => {
        if (!entry.textPos || !entry.item.text) return null;
        const safeTextLeft = Math.max(
          0,
          Math.min(entry.textPos.x, Math.max(0, canvasWidth - TEXT_ANNOTATION_MAX_WIDTH)),
        );
        return (
          <button
            key={entry.item.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (drawMode && tool === DrawToolMode.ERASER) {
                onEraseTextItem(entry);
                return;
              }
              if (entry.noteId.startsWith(OPTIMISTIC_INK_NOTE_ID_PREFIX)) return;
              const rect = e.currentTarget.getBoundingClientRect();
              onOpenNote(entry.noteId, {
                top: window.scrollY + rect.bottom + 8,
                left: window.scrollX + rect.left + rect.width / 2,
              });
            }}
            style={{
              position: 'absolute',
              left: safeTextLeft,
              top: entry.textPos.y - 10,
            }}
            title="Nhấn để xem hoặc sửa chữ bổ sung"
            className={`${
              passThroughPointer ? 'pointer-events-none' : 'pointer-events-auto'
            } max-w-[220px] cursor-pointer rounded bg-[#FFFCF5]/85 px-1.5 py-0.5 text-left text-xs font-semibold italic leading-tight shadow-2xs transition hover:ring-1 hover:ring-[#8B261E] ${entry.inkClass}`}
          >
            {entry.item.text}
          </button>
        );
      })}
    </>
  );
}

export function PendingInkTextInput({
  left,
  top,
  color,
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  left: number;
  top: number;
  color: NoteColorValue;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{ position: 'absolute', left, top }}
      className="pointer-events-auto z-40 flex items-center gap-1 rounded-lg border border-[#8B261E]/40 bg-[#FFFCF5] px-2 py-1 shadow-lg"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === KeyboardKey.ENTER) {
            e.preventDefault();
            onCommit();
          } else if (e.key === KeyboardKey.ESCAPE) {
            onCancel();
          }
        }}
        onBlur={onCommit}
        placeholder="Gõ chữ bổ sung..."
        className={`w-44 bg-transparent text-xs font-semibold italic outline-none ${NOTE_COLOR_STYLES[color].ink}`}
      />
    </div>
  );
}
