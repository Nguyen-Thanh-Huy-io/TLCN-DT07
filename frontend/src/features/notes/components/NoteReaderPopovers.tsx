'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Layers,
  RotateCcw,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { QuickCreateFlashcardBox } from '@/features/flashcards/components/QuickCreateFlashcardBox';
import {
  ALL_QUICK_PEN_STYLES,
  BLOCK_STICKY_NOTE_KINDS,
  MARKUP_STYLE_OPTIONS,
  NOTE_KIND_META,
  NOTE_MARKUP_STYLE_META,
} from '../constants/note-kind.constants';
import {
  NOTE_ANCHOR_MODE,
  NOTE_COLOR,
  NOTE_COLOR_STYLES,
  NOTE_KIND,
  NOTE_MARKUP_STYLE,
  type NoteColorValue,
  type NoteItem,
  type NoteMarkupStyleValue,
  type UpdateNotePayload,
} from '../services/note.service';
import { formatBlockSpanLabel, isBlockClusterAnchor, isInkAnchor } from '../utils/note-cluster.util';
import { NoteKindBadge, NoteLabelInput } from './NoteDrawerParts';
import {
  ColorDots,
  FloatingCard,
  NoteComposer,
  NOTE_ICON_BUTTON_CLS,
  NOTE_PRIMARY_BUTTON_CLS,
  NOTE_TEXTAREA_CLS,
  type ClusterSpanControls,
  type NoteDraft,
} from './NoteReaderParts';
import { NOTE_LAYER_ATTR, type PagePoint } from './NoteStickyMarginLayer';

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
          <button type="button" className={NOTE_ICON_BUTTON_CLS} onClick={onEdit}>
            <Edit2 size={12} /> {note.content ? 'Sửa' : 'Ghi chú'}
          </button>
          {supportsResolved && (
            <button type="button" className={NOTE_ICON_BUTTON_CLS} onClick={() => void onUpdate({ resolved: !note.resolvedAt })}>
              {note.resolvedAt ? <RotateCcw size={12} /> : <CheckCircle2 size={12} className="text-emerald-600" />}
              {note.resolvedAt ? 'Mở lại' : 'Đã hiểu'}
            </button>
          )}
          <button type="button" className={NOTE_ICON_BUTTON_CLS} onClick={onCreateCard} title="Lưu thành thẻ ghi nhớ">
            <Layers size={12} /> Thẻ
          </button>
          <button type="button" className={`${NOTE_ICON_BUTTON_CLS} hover:text-rose-700`} onClick={onDelete} aria-label="Xoá ghi chú">
            <Trash2 size={12} />
          </button>
        </div>
        <button type="button" className={NOTE_ICON_BUTTON_CLS} onClick={onOpenNotebook}>
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
            className={NOTE_TEXTAREA_CLS}
          />
          <NoteLabelInput value={labels} onChange={setLabels} suggestions={labelSuggestions} />
          <div className="flex justify-end gap-1.5">
            <button type="button" className={NOTE_ICON_BUTTON_CLS} onClick={() => setMode(NotePopoverMode.VIEW)}>
              Huỷ
            </button>
            <button
              type="button"
              className={NOTE_PRIMARY_BUTTON_CLS}
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
