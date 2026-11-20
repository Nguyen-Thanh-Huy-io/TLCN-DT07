'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit2,
  Layers,
  Link2,
  Minus,
  PenLine,
  Plus,
  RotateCcw,
  StickyNote,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { QuickCreateFlashcardBox } from '@/features/flashcards/components/QuickCreateFlashcardBox';
import {
  ALL_QUICK_PEN_STYLES,
  BLOCK_STICKY_NOTE_KINDS,
  MARKUP_STYLE_OPTIONS,
  NOTE_ACTIVE_COLOR_STORAGE_KEY,
  NOTE_KIND_META,
  NOTE_MARKUP_STYLE_META,
  SELECTION_NOTE_KINDS,
} from '../constants/note-kind.constants';
import {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR,
  NOTE_COLOR_STYLES,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  type NoteColorValue,
  type NoteItem,
  type NoteKindValue,
  type NoteMarkupStyleValue,
  type UpdateNotePayload,
} from '../services/note.service';
import { formatBlockSpanLabel, isBlockClusterAnchor, isInkAnchor } from '../utils/note-cluster.util';
import { NoteKindBadge, NoteLabelInput } from './NoteDrawerParts';
import { NOTE_LAYER_ATTR, type PagePoint } from './NoteStickyMarginLayer';

export type { PagePoint };

const COLOR_LABELS: Record<NoteColorValue, string> = {
  YELLOW: 'vàng',
  GREEN: 'xanh lá',
  BLUE: 'xanh dương',
  PINK: 'hồng',
  PURPLE: 'tím',
};

/** Màu mặc định khi chọn loại (người học vẫn đổi được). */
export const DEFAULT_KIND_COLOR: Record<NoteKindValue, NoteColorValue> = {
  HIGHLIGHT: NOTE_COLOR.YELLOW,
  NOTE: NOTE_COLOR.GREEN,
  DEFINITION: NOTE_COLOR.BLUE,
  QUESTION: NOTE_COLOR.PINK,
  IMPORTANT: NOTE_COLOR.PINK,
  SUMMARY: NOTE_COLOR.PURPLE,
};

const POPUP_CARD_WIDTH = 308;
const PILL_ESTIMATE_WIDTH = 420;
const VIEWPORT_GUTTER = 8;

export const readStoredActiveColor = (): NoteColorValue => {
  if (typeof window === 'undefined') return NOTE_COLOR.YELLOW;
  try {
    const saved = localStorage.getItem(NOTE_ACTIVE_COLOR_STORAGE_KEY) as NoteColorValue | null;
    if (saved && Object.values(NOTE_COLOR).includes(saved)) return saved;
  } catch {
    // Bỏ qua lỗi storage ở chế độ ẩn danh.
  }
  return NOTE_COLOR.YELLOW;
};

export const persistStoredActiveColor = (color: NoteColorValue) => {
  try {
    localStorage.setItem(NOTE_ACTIVE_COLOR_STORAGE_KEY, color);
  } catch {
    // Bỏ qua lỗi storage ở chế độ ẩn danh.
  }
};

const clampLeft = (left: number, width: number) => {
  const clientWidth = document.documentElement.clientWidth;
  const minLeft = clientWidth >= 640 ? Math.max(VIEWPORT_GUTTER, 64) : VIEWPORT_GUTTER;
  return Math.max(minLeft, Math.min(left, window.scrollX + clientWidth - width - VIEWPORT_GUTTER));
};

function FloatingCard({
  at,
  width = POPUP_CARD_WIDTH,
  children,
}: {
  at: PagePoint;
  width?: number;
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      {...{ [NOTE_LAYER_ATTR]: '' }}
      style={{ position: 'absolute', top: at.top, left: clampLeft(at.left - width / 2, width), width }}
      className="z-50 max-w-[calc(100vw-16px)] rounded-xl border border-stone-200 bg-white p-2.5 text-stone-800 shadow-xl"
    >
      {children}
    </div>,
    document.body,
  );
}

const COLOR_DOT_SIZE_CLS = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
} as const;

type ColorDotSize = keyof typeof COLOR_DOT_SIZE_CLS;

export function ColorDots({
  value,
  size = 'md',
  darkSurface = false,
  onPick,
}: {
  value?: NoteColorValue;
  size?: ColorDotSize;
  darkSurface?: boolean;
  onPick: (color: NoteColorValue) => void;
}) {
  const sizeCls = COLOR_DOT_SIZE_CLS[size];
  const activeRingCls = darkSurface
    ? 'ring-2 ring-white ring-offset-1 ring-offset-[#2D1A10]'
    : 'ring-2 ring-stone-800 ring-offset-1';
  return (
    <div className="flex items-center gap-1.5">
      {Object.values(NOTE_COLOR).map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          title={`Tô màu ${COLOR_LABELS[color]}`}
          aria-label={`Tô màu ${COLOR_LABELS[color]}`}
          className={`${sizeCls} rounded-full ${NOTE_COLOR_STYLES[color].dot} cursor-pointer transition-transform hover:scale-110 ${
            value === color ? activeRingCls : ''
          }`}
        />
      ))}
    </div>
  );
}

const iconButton =
  'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100';
const primaryButton =
  'cursor-pointer rounded-lg bg-[#8B261E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#731F18] disabled:opacity-50';
const textAreaCls =
  'w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs sm:text-sm focus:border-[#8B261E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B261E]/25';

export interface NoteDraft {
  kind: NoteKindValue;
  content: string;
  color: NoteColorValue;
  labels: string[];
  style?: NoteMarkupStyleValue;
}

export interface ClusterSpanControls {
  count: number;
  spanLabel: string | null;
  canExpand: boolean;
  canShrink: boolean;
  onExpand: () => void;
  onShrink: () => void;
}

/** Ô viết nội dung + chọn loại + màu + nhãn, dùng chung cho popup chữ, sticky cụm đoạn và tóm tắt mục. */
export function NoteComposer({
  initialKind,
  initialColor,
  initialStyle = NOTE_MARKUP_STYLE.HIGHLIGHT,
  availableKinds,
  allowStylePicker = false,
  clusterControls,
  saving,
  labelSuggestions,
  onSave,
  onCancel,
}: {
  initialKind: NoteKindValue;
  initialColor?: NoteColorValue;
  initialStyle?: NoteMarkupStyleValue;
  availableKinds?: readonly NoteKindValue[];
  allowStylePicker?: boolean;
  clusterControls?: ClusterSpanControls;
  saving: boolean;
  labelSuggestions: string[];
  onSave: (draft: NoteDraft) => void;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<NoteKindValue>(initialKind);
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColorValue>(initialColor ?? DEFAULT_KIND_COLOR[initialKind]);
  const [style, setStyle] = useState<NoteMarkupStyleValue>(initialStyle);
  const [labels, setLabels] = useState<string[]>([]);

  const meta = NOTE_KIND_META[kind];
  const requiresText = Boolean(meta.placeholder);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {availableKinds && availableKinds.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1">
            {availableKinds.map((k) => {
              const kMeta = NOTE_KIND_META[k];
              const KIcon = kMeta.icon;
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                    active ? 'bg-[#8B261E] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <KIcon size={10} /> {kMeta.label}
                </button>
              );
            })}
          </div>
        ) : (
          <NoteKindBadge kind={kind} />
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} aria-label="Huỷ" className="cursor-pointer p-1 text-stone-400 hover:text-stone-700">
            <X size={14} />
          </button>
        )}
      </div>

      {clusterControls && (
        <div className="flex items-center justify-between rounded-lg bg-[#FAF5EC] px-2.5 py-1.5 text-[11px] font-semibold text-[#5C2A1E]">
          <span>{clusterControls.spanLabel || `${clusterControls.count} đoạn`}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!clusterControls.canShrink}
              onClick={clusterControls.onShrink}
              title="Thu gọn 1 đoạn"
              className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-white text-stone-700 shadow-2xs hover:bg-stone-100 disabled:opacity-35"
            >
              <Minus size={11} />
            </button>
            <button
              type="button"
              disabled={!clusterControls.canExpand}
              onClick={clusterControls.onExpand}
              title="Gộp thêm đoạn dưới vào cụm"
              className="inline-flex cursor-pointer items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#8B261E] shadow-2xs hover:bg-stone-100 disabled:opacity-35"
            >
              <Plus size={11} /> Gộp đoạn dưới
            </button>
          </div>
        </div>
      )}

      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder={meta.placeholder ?? 'Ghi chú ngắn (tùy chọn với Quan trọng)...'}
        className={textAreaCls}
      />
      <NoteLabelInput value={labels} onChange={setLabels} suggestions={labelSuggestions} />

      {allowStylePicker && (
        <div className="flex items-center gap-1 text-[10px] text-stone-500">
          <span>Kiểu nét:</span>
          {MARKUP_STYLE_OPTIONS.map((opt) => {
            const OptIcon = NOTE_MARKUP_STYLE_META[opt].icon;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setStyle(opt)}
                title={NOTE_MARKUP_STYLE_META[opt].label}
                className={`inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${
                  style === opt ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <OptIcon size={11} />
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <ColorDots value={color} size="sm" onPick={setColor} />
        <button
          type="button"
          className={primaryButton}
          disabled={saving || (requiresText && !content.trim())}
          onClick={() => onSave({ kind, content: content.trim(), color, labels, style })}
        >
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}

/** Ô nhập 1 dòng siêu gọn để điền chữ bổ sung ngay sau từ/cụm (kiểu mực viết tay trong vở). */
function InlineCalloutComposer({
  initialColor,
  saving,
  onSave,
  onCancel,
}: {
  initialColor: NoteColorValue;
  saving: boolean;
  onSave: (draft: NoteDraft) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [color, setColor] = useState<NoteColorValue>(initialColor);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    onSave({
      kind: NOTE_KIND.NOTE,
      content: trimmed,
      color,
      labels: [],
      style: NOTE_MARKUP_STYLE.CALLOUT,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-[#8B261E]">
        <span className="inline-flex items-center gap-1">
          <PenLine size={12} /> Điền chữ bổ sung vào dòng
        </span>
        <button type="button" onClick={onCancel} aria-label="Huỷ" className="cursor-pointer p-0.5 text-stone-400 hover:text-stone-700">
          <X size={13} />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === KeyboardKey.ENTER) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Vd: nhưng Mỹ chưa làm được..."
          className={`flex-1 rounded-lg border border-stone-200 bg-[#FFFBF2] px-2.5 py-1.5 text-xs italic outline-none focus:border-[#8B261E] ${NOTE_COLOR_STYLES[color].ink}`}
        />
        <button
          type="button"
          disabled={saving || !text.trim()}
          onClick={submit}
          className={primaryButton}
        >
          {saving ? '…' : 'Gắn'}
        </button>
      </div>
      <div className="flex items-center justify-between text-[10px] text-stone-400">
        <ColorDots value={color} size="sm" onPick={setColor} />
        <span>Enter để gắn nhanh</span>
      </div>
    </div>
  );
}

export enum SelectionPopupView {
  PILL = 'PILL',
  CALLOUT = 'CALLOUT',
  COMPOSER = 'COMPOSER',
  FLASHCARD = 'FLASHCARD',
}

interface SelectionPopupProps {
  at: PagePoint;
  selectedText: string;
  initialView?: SelectionPopupView;
  activeColor: NoteColorValue;
  onChangeActiveColor: (color: NoteColorValue) => void;
  saving: boolean;
  labelSuggestions: string[];
  reattaching: boolean;
  onSave: (draft: NoteDraft) => void;
  onEnableQuickPen: (style?: NoteMarkupStyleValue) => void;
  onCopy: () => void;
  onReattachHere: () => void;
  onCancelReattach: () => void;
  onClose: () => void;
}

/**
 * Thanh Mini Pill 1 dòng gọn gàng khi bôi đen chữ:
 * [Màu ▾] | [Tô] [U̲] [O] [S̶] | [✍ Điền] | [Ghi chú] [Thẻ] [Copy] | [⚡]
 */
export function SelectionPopup({
  at,
  selectedText,
  initialView = SelectionPopupView.PILL,
  activeColor,
  onChangeActiveColor,
  saving,
  labelSuggestions,
  reattaching,
  onSave,
  onEnableQuickPen,
  onCopy,
  onReattachHere,
  onCancelReattach,
  onClose,
}: SelectionPopupProps) {
  const [view, setView] = useState<SelectionPopupView>(initialView);
  const [paletteOpen, setPaletteOpen] = useState(false);

  if (reattaching) {
    return (
      <FloatingCard at={at} width={260}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" className={primaryButton} onClick={onReattachHere}>
            <Link2 size={13} className="inline -mt-0.5" /> Gắn ghi chú vào đây
          </button>
          <button type="button" className={iconButton} onClick={onCancelReattach}>
            Huỷ
          </button>
        </div>
      </FloatingCard>
    );
  }

  if (view === SelectionPopupView.CALLOUT) {
    return (
      <FloatingCard at={at}>
        <InlineCalloutComposer
          initialColor={activeColor}
          saving={saving}
          onSave={onSave}
          onCancel={onClose}
        />
      </FloatingCard>
    );
  }

  if (view === SelectionPopupView.COMPOSER) {
    return (
      <FloatingCard at={at}>
        <NoteComposer
          initialKind={NOTE_KIND.NOTE}
          initialColor={activeColor}
          availableKinds={SELECTION_NOTE_KINDS}
          allowStylePicker
          saving={saving}
          labelSuggestions={labelSuggestions}
          onSave={onSave}
          onCancel={() => setView(SelectionPopupView.PILL)}
        />
      </FloatingCard>
    );
  }

  if (view === SelectionPopupView.FLASHCARD) {
    return (
      <FloatingCard at={at} width={332}>
        <div className="mb-1.5 flex items-center justify-between border-b border-stone-100 pb-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B261E]">
            <Layers size={13} /> Tạo thẻ ghi nhớ nhanh
          </span>
          <button type="button" onClick={onClose} aria-label="Đóng" className="cursor-pointer p-1 text-stone-400 hover:text-stone-700">
            <X size={14} />
          </button>
        </div>
        <QuickCreateFlashcardBox
          initialFront={selectedText}
          initialBack=""
          onSaved={onClose}
          onCancel={() => setView(SelectionPopupView.PILL)}
        />
      </FloatingCard>
    );
  }

  const quickMarkup = (style: NoteMarkupStyleValue) =>
    onSave({ kind: NOTE_KIND.HIGHLIGHT, content: '', color: activeColor, labels: [], style });

  return createPortal(
    <div
      {...{ [NOTE_LAYER_ATTR]: '' }}
      style={{
        position: 'absolute',
        top: at.top,
        left: clampLeft(at.left - PILL_ESTIMATE_WIDTH / 2, PILL_ESTIMATE_WIDTH),
      }}
      className="z-50 inline-flex max-w-[calc(100vw-16px)] flex-wrap items-center gap-0.5 rounded-full border border-stone-200 bg-white px-2 py-1 text-stone-800 shadow-lg"
    >
      {paletteOpen && (
        <div className="absolute bottom-full left-1 mb-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 shadow-lg">
          <ColorDots
            value={activeColor}
            size="sm"
            onPick={(color) => {
              onChangeActiveColor(color);
              setPaletteOpen(false);
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setPaletteOpen((v) => !v)}
        title={`Đổi màu đánh dấu (hiện tại: ${COLOR_LABELS[activeColor]})`}
        aria-label="Chọn màu đánh dấu"
        className="inline-flex cursor-pointer items-center gap-0.5 rounded-full p-1 hover:bg-stone-100"
      >
        <span className={`h-4 w-4 rounded-full ${NOTE_COLOR_STYLES[activeColor].dot} ring-1 ring-stone-300`} />
        <ChevronDown size={11} className="text-stone-500" />
      </button>

      <div className="mx-0.5 h-4 w-px bg-stone-200" />

      {MARKUP_STYLE_OPTIONS.map((style) => {
        const { icon: Icon, label } = NOTE_MARKUP_STYLE_META[style];
        return (
          <button
            key={style}
            type="button"
            disabled={saving}
            onClick={() => quickMarkup(style)}
            title={label}
            aria-label={label}
            className="cursor-pointer rounded-full p-1.5 text-stone-700 hover:bg-stone-100 hover:text-[#8B261E]"
          >
            <Icon size={14} />
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setView(SelectionPopupView.CALLOUT)}
        title="Điền chữ bổ sung ngay tại dòng"
        className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-100 hover:text-[#8B261E]"
      >
        <PenLine size={13} /> Điền
      </button>

      <div className="mx-0.5 h-4 w-px bg-stone-200" />

      <button
        type="button"
        onClick={() => setView(SelectionPopupView.COMPOSER)}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 hover:text-[#8B261E]"
      >
        <StickyNote size={13} /> Ghi chú
      </button>

      <button
        type="button"
        onClick={() => setView(SelectionPopupView.FLASHCARD)}
        title="Lưu thành thẻ ghi nhớ"
        aria-label="Lưu thành thẻ ghi nhớ"
        className="cursor-pointer rounded-full p-1.5 text-stone-600 hover:bg-stone-100 hover:text-[#8B261E]"
      >
        <Layers size={13} />
      </button>

      <button
        type="button"
        onClick={onCopy}
        title="Sao chép trích dẫn"
        aria-label="Sao chép trích dẫn"
        className="cursor-pointer rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      >
        <Copy size={13} />
      </button>

      <button
        type="button"
        onClick={() => onEnableQuickPen()}
        title="Bật bút tô liên tiếp (bôi đen từ nào tô ngay từ đó)"
        aria-label="Bật chế độ tô nhanh liên tiếp"
        className="cursor-pointer rounded-full p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
      >
        <Zap size={13} />
      </button>
    </div>,
    document.body,
  );
}

/** Thanh nổi nhỏ gọn ở đáy màn hình khi bật Bút tô ngẫu nhiên liên tiếp. */
export function QuickPenBar({
  activeColor,
  activeStyle,
  onChangeColor,
  onChangeStyle,
  onClose,
}: {
  activeColor: NoteColorValue;
  activeStyle: NoteMarkupStyleValue;
  onChangeColor: (color: NoteColorValue) => void;
  onChangeStyle: (style: NoteMarkupStyleValue) => void;
  onClose: () => void;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return createPortal(
    <div
      {...{ [NOTE_LAYER_ATTR]: '' }}
      role="toolbar"
      aria-label="Thanh bút tô nhanh liên tiếp"
      className="fixed bottom-5 inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100vw-24px)] items-center gap-1 whitespace-nowrap rounded-full border border-[#E5D8C1] bg-[#2D1A10] px-3 py-1.5 text-[#FFFCF5] shadow-2xl"
    >
      {paletteOpen && (
        <div className="absolute bottom-full left-2 mb-2 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 shadow-lg">
          <ColorDots
            value={activeColor}
            size="sm"
            onPick={(color) => {
              onChangeColor(color);
              setPaletteOpen(false);
            }}
          />
        </div>
      )}

      <span className="inline-flex items-center gap-1 pr-1 text-[11px] font-bold text-amber-300">
        <Zap size={12} /> Tô nhanh
      </span>

      <button
        type="button"
        onClick={() => setPaletteOpen((v) => !v)}
        aria-label="Đổi màu bút tô nhanh"
        className="inline-flex cursor-pointer items-center gap-0.5 rounded-full bg-white/10 p-1 hover:bg-white/20"
      >
        <span className={`h-3.5 w-3.5 rounded-full ${NOTE_COLOR_STYLES[activeColor].dot}`} />
        <ChevronDown size={10} />
      </button>

      <div className="mx-1 h-4 w-px bg-white/20" />

      {ALL_QUICK_PEN_STYLES.map((style) => {
        const { icon: Icon, label } = NOTE_MARKUP_STYLE_META[style];
        const selected = activeStyle === style;
        return (
          <button
            key={style}
            type="button"
            onClick={() => onChangeStyle(style)}
            title={label}
            aria-label={label}
            aria-pressed={selected}
            className={`cursor-pointer rounded-full p-1.5 transition ${
              selected ? 'bg-[#8B261E] text-white shadow-xs' : 'text-stone-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Icon size={13} />
          </button>
        );
      })}

      <div className="mx-1 h-4 w-px bg-white/20" />

      <button
        type="button"
        onClick={onClose}
        title="Tắt bút tô nhanh (Esc)"
        aria-label="Tắt bút tô nhanh"
        className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-stone-300 hover:bg-white/15 hover:text-white"
      >
        <X size={12} /> Tắt
      </button>
    </div>,
    document.body,
  );
}

// --- BlockComposerPopover ---
export function BlockComposerPopover({
  at,
  saving,
  labelSuggestions,
  clusterControls,
  onSave,
  onClose,
}: {
  at: PagePoint;
  saving: boolean;
  labelSuggestions: string[];
  clusterControls: ClusterSpanControls;
  onSave: (draft: NoteDraft) => void;
  onClose: () => void;
}) {
  return (
    <FloatingCard at={at}>
      <NoteComposer
        initialKind={NOTE_KIND.SUMMARY}
        initialColor={NOTE_COLOR.BLUE}
        availableKinds={BLOCK_STICKY_NOTE_KINDS}
        clusterControls={clusterControls}
        saving={saving}
        labelSuggestions={labelSuggestions}
        onSave={onSave}
        onCancel={onClose}
      />
    </FloatingCard>
  );
}

// --- NotePopover ---
interface NotePopoverProps {
  note: NoteItem;
  at: PagePoint;
  needsReview: boolean;
  labelSuggestions: string[];
  onClose: () => void;
  onUpdate: (updates: UpdateNotePayload) => Promise<unknown>;
  onConfirmPosition: () => void;
  onDelete: () => void;
  onOpenNotebook: () => void;
}

enum NotePopoverMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  FLASHCARD = 'FLASHCARD',
}

function NotePopoverViewBody({
  note,
  canChangeStyle,
  activeStyle,
  supportsResolved,
  onUpdate,
  onEdit,
  onCreateCard,
  onDelete,
  onOpenNotebook,
}: {
  note: NoteItem;
  canChangeStyle: boolean;
  activeStyle: NoteMarkupStyleValue;
  supportsResolved: boolean;
  onUpdate: (updates: UpdateNotePayload) => Promise<unknown>;
  onEdit: () => void;
  onCreateCard: () => void;
  onDelete: () => void;
  onOpenNotebook: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <ColorDots value={note.color} size="sm" onPick={(color) => void onUpdate({ color })} />
        {canChangeStyle && (
          <div className="flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
            {MARKUP_STYLE_OPTIONS.map((style) => {
              const StyleIcon = NOTE_MARKUP_STYLE_META[style].icon;
              return (
                <button
                  key={style}
                  type="button"
                  title={NOTE_MARKUP_STYLE_META[style].label}
                  onClick={() => void onUpdate({ anchor: { ...(note.anchor ?? {}), style } })}
                  className={`cursor-pointer rounded p-1 ${
                    activeStyle === style ? 'bg-white text-[#8B261E] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <StyleIcon size={12} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${note.content ? 'text-stone-800' : 'italic text-stone-400'}`}>
        {note.content || 'Chỉ đánh dấu, chưa có ghi chú.'}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 border-t border-stone-100 pt-2">
        <div className="flex flex-wrap items-center gap-0.5">
          <button type="button" className={iconButton} onClick={onEdit}>
            <Edit2 size={12} /> {note.content ? 'Sửa' : 'Ghi chú'}
          </button>
          {supportsResolved && (
            <button type="button" className={iconButton} onClick={() => void onUpdate({ resolved: !note.resolvedAt })}>
              {note.resolvedAt ? <RotateCcw size={12} /> : <CheckCircle2 size={12} className="text-emerald-600" />}
              {note.resolvedAt ? 'Mở lại' : 'Đã hiểu'}
            </button>
          )}
          <button type="button" className={iconButton} onClick={onCreateCard} title="Lưu thành thẻ ghi nhớ">
            <Layers size={12} /> Thẻ
          </button>
          <button type="button" className={`${iconButton} hover:text-rose-700`} onClick={onDelete} aria-label="Xoá ghi chú">
            <Trash2 size={12} />
          </button>
        </div>
        <button type="button" className={iconButton} onClick={onOpenNotebook}>
          <BookOpen size={12} /> Sổ
        </button>
      </div>
    </>
  );
}

/** Bấm vào đoạn đã tô / sticky cụm / chữ bổ sung: xem, sửa, đổi màu/nét, đánh dấu đã hiểu, tạo thẻ, xoá tại chỗ. */
export function NotePopover({
  note,
  at,
  needsReview,
  labelSuggestions,
  onClose,
  onUpdate,
  onConfirmPosition,
  onDelete,
  onOpenNotebook,
}: NotePopoverProps) {
  const [mode, setMode] = useState<NotePopoverMode>(NotePopoverMode.VIEW);
  const [content, setContent] = useState(note.content);
  const [labels, setLabels] = useState(note.labels);

  const isBlock = isBlockClusterAnchor(note.anchor);
  const isInk = isInkAnchor(note.anchor);
  const spanLabel = formatBlockSpanLabel(note.anchor);
  const canChangeStyle = !isBlock && !isInk && note.anchor?.mode !== NOTE_ANCHOR_MODE.HEADING;
  const activeStyle = note.anchor?.style ?? NOTE_MARKUP_STYLE.HIGHLIGHT;
  const supportsResolved = note.kind === NOTE_KIND.QUESTION || isBlock;

  return (
    <FloatingCard at={at}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <NoteKindBadge kind={note.kind} resolved={Boolean(note.resolvedAt)} />
          {spanLabel && (
            <span className="rounded-full bg-[#FAF5EC] px-2 py-0.5 text-[10px] font-semibold text-[#8B261E]">
              {spanLabel}
            </span>
          )}
          {note.labels.map((label) => (
            <span key={label} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
              #{label}
            </span>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng" className="cursor-pointer p-1 text-stone-400 hover:text-stone-700">
          <X size={15} />
        </button>
      </div>

      {needsReview && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
          <span className="inline-flex items-center gap-1">
            <AlertTriangle size={12} /> Đoạn đã được sửa
          </span>
          <button type="button" onClick={onConfirmPosition} className="cursor-pointer font-bold hover:underline">
            Giữ ở đây
          </button>
        </div>
      )}

      {mode === NotePopoverMode.EDIT && (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={NOTE_KIND_META[note.kind].placeholder ?? 'Ghi chú của bạn...'}
            className={textAreaCls}
          />
          <NoteLabelInput value={labels} onChange={setLabels} suggestions={labelSuggestions} />
          <div className="flex justify-end gap-1.5">
            <button type="button" className={iconButton} onClick={() => setMode(NotePopoverMode.VIEW)}>
              Huỷ
            </button>
            <button
              type="button"
              className={primaryButton}
              onClick={() => void onUpdate({ content: content.trim(), labels }).then(() => setMode(NotePopoverMode.VIEW))}
            >
              <Check size={13} className="inline -mt-0.5" /> Lưu
            </button>
          </div>
        </div>
      )}

      {mode === NotePopoverMode.FLASHCARD && (
        <QuickCreateFlashcardBox
          initialFront={note.highlightText || note.title || ''}
          initialBack={note.content || note.highlightText || ''}
          sourceNoteId={note.id}
          onSaved={() => setMode(NotePopoverMode.VIEW)}
          onCancel={() => setMode(NotePopoverMode.VIEW)}
        />
      )}

      {mode === NotePopoverMode.VIEW && (
        <NotePopoverViewBody
          note={note}
          canChangeStyle={canChangeStyle}
          activeStyle={activeStyle}
          supportsResolved={supportsResolved}
          onUpdate={onUpdate}
          onEdit={() => setMode(NotePopoverMode.EDIT)}
          onCreateCard={() => setMode(NotePopoverMode.FLASHCARD)}
          onDelete={onDelete}
          onOpenNotebook={onOpenNotebook}
        />
      )}
    </FloatingCard>
  );
}

// --- SummaryComposerDialog ---
/** Hộp viết tóm tắt cho một mục (mở từ mục lục trong bảng "Trong bài"). */
export function SummaryComposerDialog({
  headingText,
  saving,
  labelSuggestions,
  onSave,
  onClose,
}: {
  headingText: string;
  saving: boolean;
  labelSuggestions: string[];
  onSave: (draft: NoteDraft) => void;
  onClose: () => void;
}) {
  return createPortal(
    <div {...{ [NOTE_LAYER_ATTR]: '' }} className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Tóm tắt mục" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <p className="text-xs font-semibold text-stone-500">Tóm tắt mục</p>
        <h3 className="mb-3 font-serif text-base font-bold text-stone-900">{headingText}</h3>
        <NoteComposer initialKind={NOTE_KIND.SUMMARY} saving={saving} labelSuggestions={labelSuggestions} onSave={onSave} onCancel={onClose} />
      </div>
    </div>,
    document.body,
  );
}
