'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, BookOpen, Check, CheckCircle2, Copy, Edit2, Link2, RotateCcw, Trash2, X } from 'lucide-react';
import { NOTE_KIND_META, SELECTION_NOTE_KINDS } from '../constants/note-kind.constants';
import {
  NOTE_COLOR,
  NOTE_COLOR_STYLES,
  NOTE_KIND,
  type NoteColorValue,
  type NoteItem,
  type NoteKindValue,
  type UpdateNotePayload,
} from '../services/note.service';
import { NoteKindBadge, NoteLabelInput } from './NoteDrawerParts';

/** Toạ độ theo trang (đã cộng scroll) để khung bám theo chữ khi cuộn. */
export interface PagePoint {
  top: number;
  left: number;
}

/** Đánh dấu phần tử thuộc lớp ghi chú, để thao tác bên trong không bị coi là bôi đen / bấm ra ngoài. */
export const NOTE_LAYER_ATTR = 'data-note-layer';

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

const POPUP_WIDTH = 320;
const VIEWPORT_GUTTER = 8;

const clampLeft = (left: number, width: number) =>
  Math.max(VIEWPORT_GUTTER, Math.min(left, window.scrollX + window.innerWidth - width - VIEWPORT_GUTTER));

function FloatingCard({ at, width = POPUP_WIDTH, children }: { at: PagePoint; width?: number; children: React.ReactNode }) {
  return createPortal(
    <div
      {...{ [NOTE_LAYER_ATTR]: '' }}
      style={{ position: 'absolute', top: at.top, left: clampLeft(at.left - width / 2, width), width }}
      className="z-50 rounded-xl border border-stone-200 bg-white shadow-xl p-2.5 text-stone-800"
    >
      {children}
    </div>,
    document.body,
  );
}

function ColorDots({ value, onPick }: { value?: NoteColorValue; onPick: (color: NoteColorValue) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Object.values(NOTE_COLOR).map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          title={`Tô màu ${COLOR_LABELS[color]}`}
          aria-label={`Tô màu ${COLOR_LABELS[color]}`}
          className={`w-6 h-6 rounded-full ${NOTE_COLOR_STYLES[color].dot} cursor-pointer transition-transform hover:scale-110 ${
            value === color ? 'ring-2 ring-offset-1 ring-stone-800' : ''
          }`}
        />
      ))}
    </div>
  );
}

const iconButton = 'inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer';
const primaryButton = 'px-3 py-1.5 rounded-lg bg-[#8B261E] text-white text-xs font-bold hover:bg-[#731F18] disabled:opacity-50 cursor-pointer';
const textArea =
  'w-full text-sm p-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B261E]/25 focus:border-[#8B261E]';

export interface NoteDraft {
  kind: NoteKindValue;
  content: string;
  color: NoteColorValue;
  labels: string[];
}

/** Ô viết nội dung + màu + nhãn, dùng chung cho popup bôi đen và hộp tóm tắt mục. */
function NoteComposer({
  kind,
  saving,
  labelSuggestions,
  onSave,
  onCancel,
}: {
  kind: NoteKindValue;
  saving: boolean;
  labelSuggestions: string[];
  onSave: (draft: NoteDraft) => void;
  onCancel?: () => void;
}) {
  const meta = NOTE_KIND_META[kind];
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColorValue>(DEFAULT_KIND_COLOR[kind]);
  const [labels, setLabels] = useState<string[]>([]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <NoteKindBadge kind={kind} />
        {onCancel && (
          <button type="button" onClick={onCancel} aria-label="Huỷ" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
            <X size={14} />
          </button>
        )}
      </div>
      <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder={meta.placeholder ?? ''} className={textArea} />
      <NoteLabelInput value={labels} onChange={setLabels} suggestions={labelSuggestions} />
      <div className="flex items-center justify-between">
        <ColorDots value={color} onPick={setColor} />
        <button type="button" className={primaryButton} disabled={saving || !content.trim()} onClick={() => onSave({ kind, content: content.trim(), color, labels })}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}

// --- SelectionPopup ---
interface SelectionPopupProps {
  at: PagePoint;
  saving: boolean;
  labelSuggestions: string[];
  /** Đang gắn lại một ghi chú bị lạc: chỉ hiện nút gắn vào đoạn vừa chọn. */
  reattaching: boolean;
  onSave: (draft: NoteDraft) => void;
  onCopy: () => void;
  onReattachHere: () => void;
  onCancelReattach: () => void;
}

/** Hiện ngay trên đoạn vừa bôi đen: tô sáng nhanh, chọn loại ghi chú, sao chép trích dẫn. */
export function SelectionPopup({ at, saving, labelSuggestions, reattaching, onSave, onCopy, onReattachHere, onCancelReattach }: SelectionPopupProps) {
  const [composingKind, setComposingKind] = useState<NoteKindValue | null>(null);

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

  if (composingKind) {
    return (
      <FloatingCard at={at}>
        <NoteComposer kind={composingKind} saving={saving} labelSuggestions={labelSuggestions} onSave={onSave} onCancel={() => setComposingKind(null)} />
      </FloatingCard>
    );
  }

  const mark = (kind: NoteKindValue, color: NoteColorValue) => onSave({ kind, content: '', color, labels: [] });
  return (
    <FloatingCard at={at}>
      <div className="flex items-center justify-between gap-2">
        <ColorDots onPick={(color) => mark(NOTE_KIND.HIGHLIGHT, color)} />
        <button type="button" className={iconButton} onClick={onCopy} title="Sao chép trích dẫn" aria-label="Sao chép trích dẫn">
          <Copy size={14} />
        </button>
      </div>
      <div className="mt-2 pt-2 border-t border-stone-100 grid grid-cols-4 gap-1">
        {SELECTION_NOTE_KINDS.map((kind) => {
          const { icon: Icon, label, placeholder } = NOTE_KIND_META[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => (placeholder ? setComposingKind(kind) : mark(kind, DEFAULT_KIND_COLOR[kind]))}
              className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <Icon size={15} /> {label}
            </button>
          );
        })}
      </div>
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
  /** Đoạn chỉ khớp gần đúng: người học xác nhận vị trí hiện tại là đúng. */
  onConfirmPosition: () => void;
  onDelete: () => void;
  onOpenNotebook: () => void;
}

/** Bấm vào đoạn đã tô / icon lề: xem, sửa, đổi màu, đánh dấu đã hiểu, xoá ngay tại chỗ. */
export function NotePopover({ note, at, needsReview, labelSuggestions, onClose, onUpdate, onConfirmPosition, onDelete, onOpenNotebook }: NotePopoverProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [labels, setLabels] = useState(note.labels);

  return (
    <FloatingCard at={at}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1">
          <NoteKindBadge kind={note.kind} resolved={Boolean(note.resolvedAt)} />
          {note.labels.map((label) => (
            <span key={label} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">#{label}</span>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
          <X size={15} />
        </button>
      </div>

      {needsReview && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] text-amber-900">
          <span className="inline-flex items-center gap-1"><AlertTriangle size={12} /> Đoạn đã được sửa</span>
          <button type="button" onClick={onConfirmPosition} className="font-bold hover:underline cursor-pointer">Giữ ở đây</button>
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder={NOTE_KIND_META[note.kind].placeholder ?? 'Ghi chú của bạn...'} className={textArea} />
          <NoteLabelInput value={labels} onChange={setLabels} suggestions={labelSuggestions} />
          <div className="flex justify-end gap-1.5">
            <button type="button" className={iconButton} onClick={() => setEditing(false)}>Huỷ</button>
            <button type="button" className={primaryButton} onClick={() => void onUpdate({ content: content.trim(), labels }).then(() => setEditing(false))}>
              <Check size={13} className="inline -mt-0.5" /> Lưu
            </button>
          </div>
        </div>
      ) : (
        <>
          <ColorDots value={note.color} onPick={(color) => void onUpdate({ color })} />
          <p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${note.content ? 'text-stone-800' : 'italic text-stone-400'}`}>
            {note.content || 'Chỉ đánh dấu, chưa có ghi chú.'}
          </p>
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              <button type="button" className={iconButton} onClick={() => setEditing(true)}>
                <Edit2 size={13} /> {note.content ? 'Sửa' : 'Thêm ghi chú'}
              </button>
              {note.kind === NOTE_KIND.QUESTION && (
                <button type="button" className={iconButton} onClick={() => void onUpdate({ resolved: !note.resolvedAt })}>
                  {note.resolvedAt ? <RotateCcw size={13} /> : <CheckCircle2 size={13} className="text-emerald-600" />}
                  {note.resolvedAt ? 'Mở lại' : 'Đã hiểu'}
                </button>
              )}
              <button type="button" className={`${iconButton} hover:text-rose-700`} onClick={onDelete} aria-label="Xoá ghi chú">
                <Trash2 size={13} />
              </button>
            </div>
            <button type="button" className={iconButton} onClick={onOpenNotebook}>
              <BookOpen size={13} /> Sổ ghi chú
            </button>
          </div>
        </>
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
        <h3 className="mb-3 text-base font-serif font-bold text-stone-900">{headingText}</h3>
        <NoteComposer kind={NOTE_KIND.SUMMARY} saving={saving} labelSuggestions={labelSuggestions} onSave={onSave} onCancel={onClose} />
      </div>
    </div>,
    document.body,
  );
}

// --- NoteMarginMarkers ---
export interface NoteMarker {
  noteId: string;
  kind: NoteKindValue;
  color: NoteColorValue;
  at: PagePoint;
}

/** Icon ở lề phải theo loại, cho đoạn có nội dung ghi chú / mục có tóm tắt (đoạn chỉ tô màu thì không). */
export function NoteMarginMarkers({ markers, onOpen }: { markers: NoteMarker[]; onOpen: (noteId: string, at: PagePoint) => void }) {
  if (markers.length === 0) return null;
  return createPortal(
    <>
      {markers.map((marker) => {
        const { icon: Icon, label } = NOTE_KIND_META[marker.kind];
        return (
          <button
            key={marker.noteId}
            type="button"
            {...{ [NOTE_LAYER_ATTR]: '' }}
            onClick={() => onOpen(marker.noteId, { top: marker.at.top + 28, left: marker.at.left })}
            style={{ position: 'absolute', top: marker.at.top, left: marker.at.left }}
            aria-label={`Xem ${label.toLowerCase()} của đoạn này`}
            title={label}
            className={`z-30 w-6 h-6 rounded-full border border-white shadow-sm flex items-center justify-center text-stone-800 cursor-pointer hover:scale-110 transition-transform ${
              NOTE_COLOR_STYLES[marker.color].dot
            }`}
          >
            <Icon size={12} />
          </button>
        );
      })}
    </>,
    document.body,
  );
}
