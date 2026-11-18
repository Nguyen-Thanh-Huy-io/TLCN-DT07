'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, Copy, Edit2, StickyNote, Trash2, X } from 'lucide-react';
import { NOTE_COLOR, NOTE_COLOR_STYLES, type NoteColorValue, type NoteItem } from '../services/note.service';

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

const POPUP_WIDTH = 288;
const VIEWPORT_GUTTER = 8;

/** Giữ khung nổi nằm trong bề ngang màn hình. */
const clampLeft = (left: number, width: number) =>
  Math.max(VIEWPORT_GUTTER, Math.min(left, window.scrollX + window.innerWidth - width - VIEWPORT_GUTTER));

function FloatingCard({ at, width = POPUP_WIDTH, children }: { at: PagePoint; width?: number; children: React.ReactNode }) {
  return createPortal(
    <div
      {...{ [NOTE_LAYER_ATTR]: '' }}
      style={{ position: 'absolute', top: at.top, left: clampLeft(at.left - width / 2, width), width }}
      className="z-50 rounded-xl border border-stone-200 bg-white shadow-xl p-2.5 text-stone-800"
      onMouseDown={(e) => e.stopPropagation()}
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

function NoteTextArea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder="Ghi chú của bạn về đoạn này..."
      className="w-full text-sm p-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B261E]/25 focus:border-[#8B261E]"
    />
  );
}

const iconButton =
  'inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer';
const primaryButton =
  'px-3 py-1.5 rounded-lg bg-[#8B261E] text-white text-xs font-bold hover:bg-[#731F18] disabled:opacity-50 cursor-pointer';

// --- SelectionPopup ---
interface SelectionPopupProps {
  at: PagePoint;
  saving: boolean;
  onHighlight: (color: NoteColorValue) => void;
  onSaveNote: (content: string, color: NoteColorValue) => void;
  onCopy: () => void;
}

/** Hiện ngay trên đoạn vừa bôi đen: tô màu nhanh, viết ghi chú, sao chép trích dẫn. */
export function SelectionPopup({ at, saving, onHighlight, onSaveNote, onCopy }: SelectionPopupProps) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState<NoteColorValue>(NOTE_COLOR.YELLOW);

  if (!composing) {
    return (
      <FloatingCard at={at} width={300}>
        <div className="flex items-center justify-between gap-2">
          <ColorDots onPick={onHighlight} />
          <span className="w-px h-6 bg-stone-200" />
          <button type="button" className={iconButton} onClick={() => setComposing(true)}>
            <StickyNote size={14} /> Ghi chú
          </button>
          <button type="button" className={iconButton} onClick={onCopy} title="Sao chép trích dẫn" aria-label="Sao chép trích dẫn">
            <Copy size={14} />
          </button>
        </div>
      </FloatingCard>
    );
  }

  return (
    <FloatingCard at={at}>
      <div className="space-y-2">
        <NoteTextArea value={draft} onChange={setDraft} />
        <div className="flex items-center justify-between">
          <ColorDots value={color} onPick={setColor} />
          <button
            type="button"
            className={primaryButton}
            disabled={saving || !draft.trim()}
            onClick={() => onSaveNote(draft.trim(), color)}
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
    </FloatingCard>
  );
}

// --- NotePopover ---
interface NotePopoverProps {
  note: NoteItem;
  at: PagePoint;
  onClose: () => void;
  onChangeColor: (color: NoteColorValue) => void;
  onSaveContent: (content: string) => Promise<void>;
  onDelete: () => void;
  onOpenNotebook: () => void;
}

/** Bấm vào đoạn đã tô / icon lề: xem, sửa, đổi màu, xoá ghi chú ngay tại chỗ. */
export function NotePopover({ note, at, onClose, onChangeColor, onSaveContent, onDelete, onOpenNotebook }: NotePopoverProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

  return (
    <FloatingCard at={at}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <ColorDots value={note.color} onPick={onChangeColor} />
        <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
          <X size={15} />
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <NoteTextArea value={draft} onChange={setDraft} />
          <div className="flex justify-end gap-1.5">
            <button type="button" className={iconButton} onClick={() => setEditing(false)}>
              Huỷ
            </button>
            <button
              type="button"
              className={primaryButton}
              onClick={() => void onSaveContent(draft.trim()).then(() => setEditing(false))}
            >
              <Check size={13} className="inline -mt-0.5" /> Lưu
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${note.content ? 'text-stone-800' : 'italic text-stone-400'}`}>
            {note.content || 'Chỉ tô màu, chưa có ghi chú.'}
          </p>
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button type="button" className={iconButton} onClick={() => setEditing(true)}>
                <Edit2 size={13} /> {note.content ? 'Sửa' : 'Thêm ghi chú'}
              </button>
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

// --- NoteMarginMarkers ---
export interface NoteMarker {
  noteId: string;
  color: NoteColorValue;
  at: PagePoint;
}

/** Icon ở lề phải cho đoạn có nội dung ghi chú (đoạn chỉ tô màu thì không), để nhìn qua là biết. */
export function NoteMarginMarkers({ markers, onOpen }: { markers: NoteMarker[]; onOpen: (noteId: string, at: PagePoint) => void }) {
  if (markers.length === 0) return null;
  return createPortal(
    <>
      {markers.map((marker) => (
        <button
          key={marker.noteId}
          type="button"
          {...{ [NOTE_LAYER_ATTR]: '' }}
          onClick={() => onOpen(marker.noteId, { top: marker.at.top + 28, left: marker.at.left })}
          style={{ position: 'absolute', top: marker.at.top, left: marker.at.left }}
          aria-label="Xem ghi chú của đoạn này"
          className={`z-30 w-6 h-6 rounded-full border border-white shadow-sm flex items-center justify-center text-stone-800 cursor-pointer hover:scale-110 transition-transform ${
            NOTE_COLOR_STYLES[marker.color].dot
          }`}
        >
          <StickyNote size={12} />
        </button>
      ))}
    </>,
    document.body,
  );
}
