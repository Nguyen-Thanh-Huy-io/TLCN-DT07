'use client';

import React, { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, Edit2, Layers, Link2, MapPin, MessageSquarePlus, RotateCcw, Tag, Trash2, X } from 'lucide-react';
import { QuickCreateFlashcardBox } from '@/features/flashcards/components/FlashcardsSection';
import { NOTE_KIND_META, NOTE_LABEL_MAX_LENGTH, NOTE_LABELS_MAX } from '../constants/note-kind.constants';
import { KeyboardKey } from '@/constants/enums';
import { NOTE_COLOR_STYLES, NOTE_KIND, type NoteItem, type NoteKindValue, type UpdateNotePayload } from '../services/note.service';
import { formatBlockSpanLabel } from '../utils/note-cluster.util';

const LABEL_SUGGESTIONS_ID = 'hisgo-note-label-suggestions';

// --- NoteLabelInput ---
/** Nhãn tự do: gõ rồi Enter (hoặc dấu phẩy) để thêm, gợi ý từ nhãn đã dùng ở mọi bài. */
export function NoteLabelInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (labels: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const label = draft.trim();
    setDraft('');
    if (!label || value.includes(label) || value.length >= NOTE_LABELS_MAX) return;
    onChange([...value, label]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1.5">
      <Tag size={13} className="text-stone-400" />
      {value.map((label) => (
        <span key={label} className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
          {label}
          <button type="button" aria-label={`Bỏ nhãn ${label}`} onClick={() => onChange(value.filter((l) => l !== label))} className="cursor-pointer text-stone-400 hover:text-rose-600">
            <X size={11} />
          </button>
        </span>
      ))}
      {value.length < NOTE_LABELS_MAX && (
        <input
          value={draft}
          maxLength={NOTE_LABEL_MAX_LENGTH}
          list={LABEL_SUGGESTIONS_ID}
          onChange={(e) => setDraft(e.target.value.replace(KeyboardKey.COMMA, ''))}
          onKeyDown={(e) => {
            if (e.key === KeyboardKey.ENTER || e.key === KeyboardKey.COMMA) {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={value.length ? '' : 'Thêm nhãn (Enter)…'}
          className="min-w-20 flex-1 bg-transparent text-xs outline-none"
        />
      )}
      <datalist id={LABEL_SUGGESTIONS_ID}>
        {suggestions.filter((s) => !value.includes(s)).map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

// --- NoteKindBadge ---
export function NoteKindBadge({ kind, resolved }: { kind: NoteKindValue; resolved?: boolean }) {
  const meta = NOTE_KIND_META[kind];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-stone-700">
      <Icon size={11} /> {meta.label}
      {kind === NOTE_KIND.QUESTION && (
        <span className={resolved ? 'text-emerald-700' : 'text-rose-700'}>· {resolved ? 'đã hiểu' : 'chưa hiểu'}</span>
      )}
    </span>
  );
}

// --- NoteQuote ---
/** Đoạn trích: bấm để cuộn tới chỗ đó; bài đã sửa mất đoạn thì hiện ngữ cảnh gốc và nút gắn lại. */
function NoteQuote({
  note,
  isLost,
  needsReview,
  onLocate,
  onReattach,
}: {
  note: NoteItem;
  isLost: boolean;
  needsReview: boolean;
  onLocate?: () => void;
  onReattach?: () => void;
}) {
  if (!note.highlightText) return null;
  const quote = (
    <span className="block pl-2.5 border-l-2 border-stone-400/50 text-[11px] italic text-stone-600 line-clamp-3">
      {isLost && note.anchor?.prefix && <span className="text-stone-400">…{note.anchor.prefix.slice(-40)}</span>}
      <strong className="font-semibold not-italic text-stone-700">&ldquo;{note.highlightText}&rdquo;</strong>
      {isLost && note.anchor?.suffix && <span className="text-stone-400">{note.anchor.suffix.slice(0, 40)}…</span>}
    </span>
  );
  if (isLost) {
    return (
      <div className="mb-2 space-y-1.5">
        {quote}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
            <AlertTriangle size={10} /> Đoạn gốc đã thay đổi
          </span>
          {onReattach && (
            <button type="button" onClick={onReattach} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B261E] hover:underline cursor-pointer">
              <Link2 size={11} /> Gắn lại
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <button type="button" onClick={onLocate} disabled={!onLocate} className="mb-2 w-full text-left group/quote cursor-pointer disabled:cursor-default" title="Xem trong bài">
      {quote}
      {needsReview && (
        <span className="mt-1 mr-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
          <AlertTriangle size={10} /> Đoạn đã được sửa
        </span>
      )}
      {onLocate && (
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#8B261E] opacity-70 group-hover/quote:opacity-100">
          <MapPin size={11} /> Xem trong bài
        </span>
      )}
    </button>
  );
}

// --- NoteCard ---
interface NoteCardProps {
  note: NoteItem;
  isLost: boolean;
  needsReview: boolean;
  labelSuggestions: string[];
  onLocate?: () => void;
  onReattach?: () => void;
  onUpdate: (updates: UpdateNotePayload) => Promise<unknown>;
  onRemove: () => void;
  /** Chỉ ở bài học: gửi câu hỏi lên phần Hỏi đáp của bài. */
  onAskCommunity?: () => Promise<void>;
}

const actionButton = 'p-1 rounded hover:bg-white/60 text-stone-600 cursor-pointer';

enum AskState {
  IDLE = 'IDLE',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export function NoteCard({ note, isLost, needsReview, labelSuggestions, onLocate, onReattach, onUpdate, onRemove, onAskCommunity }: NoteCardProps) {
  const style = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.YELLOW;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [labels, setLabels] = useState(note.labels);
  const [copied, setCopied] = useState(false);
  const [askState, setAskState] = useState<AskState>(AskState.IDLE);
  const [creatingCard, setCreatingCard] = useState(false);
  const [cardCreated, setCardCreated] = useState(false);
  const isQuestion = note.kind === NOTE_KIND.QUESTION;
  const spanLabel = formatBlockSpanLabel(note.anchor);

  const save = async () => {
    await onUpdate({ content: content.trim(), labels });
    setEditing(false);
  };
  const copy = () => {
    void navigator.clipboard.writeText(`${note.highlightText ? `> "${note.highlightText}"\n\n` : ''}${note.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const ask = async () => {
    if (!onAskCommunity) return;
    setAskState(AskState.SENDING);
    try {
      await onAskCommunity();
      setAskState(AskState.SENT);
    } catch {
      setAskState(AskState.FAILED);
    }
  };

  return (
    <div className={`p-3.5 rounded-xl border ${style.border} ${style.bg} relative group shadow-2xs`}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <NoteKindBadge kind={note.kind} resolved={Boolean(note.resolvedAt)} />
        {spanLabel && (
          <span className="rounded-full bg-[#FAF5EC] px-2 py-0.5 text-[10px] font-semibold text-[#8B261E]">
            {spanLabel}
          </span>
        )}
        {!editing && note.labels.map((label) => (
          <span key={label} className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-stone-600">#{label}</span>
        ))}
      </div>

      <NoteQuote note={note} isLost={isLost} needsReview={needsReview} onLocate={onLocate} onReattach={onReattach} />

      {editing ? (
        <div className="space-y-2 mt-1">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full text-xs p-2 rounded border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-500" />
          <NoteLabelInput value={labels} onChange={setLabels} suggestions={labelSuggestions} />
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 rounded text-[11px] text-stone-600 hover:bg-stone-200 cursor-pointer">Huỷ</button>
            <button type="button" onClick={() => void save()} className="px-2.5 py-1 rounded bg-stone-900 text-white text-[11px] font-bold cursor-pointer">Lưu</button>
          </div>
        </div>
      ) : (
        <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${note.content ? `font-medium ${style.text}` : 'italic text-stone-400'}`}>
          {note.content || 'Chỉ đánh dấu, chưa có ghi chú.'}
        </p>
      )}

      {askState === AskState.SENT && <p className="mt-2 text-[11px] font-semibold text-emerald-700">Đã gửi lên phần Hỏi đáp của bài.</p>}
      {askState === AskState.FAILED && <p className="mt-2 text-[11px] font-semibold text-rose-700">Không gửi được — hãy đăng nhập rồi thử lại.</p>}
      {cardCreated && <p className="mt-2 text-[11px] font-semibold text-teal-800">Đã lưu thành thẻ ghi nhớ ôn tập.</p>}

      {creatingCard && (
        <QuickCreateFlashcardBox
          initialFront={note.highlightText || note.title || ''}
          initialBack={note.content || note.highlightText || ''}
          sourceNoteId={note.id}
          onSaved={() => {
            setCreatingCard(false);
            setCardCreated(true);
          }}
          onCancel={() => setCreatingCard(false)}
        />
      )}

      <div className="mt-3 pt-2 border-t border-stone-200/50 flex items-center justify-between text-[10px] text-stone-500">
        <span>{new Date(note.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
          {isQuestion && (
            <button type="button" onClick={() => void onUpdate({ resolved: !note.resolvedAt })} className={`${actionButton} inline-flex items-center gap-1 font-semibold`}>
              {note.resolvedAt ? <RotateCcw size={12} /> : <CheckCircle2 size={12} className="text-emerald-600" />}
              {note.resolvedAt ? 'Mở lại' : 'Đã hiểu'}
            </button>
          )}
          {isQuestion && !note.resolvedAt && onAskCommunity && askState !== AskState.SENT && (
            <button type="button" onClick={() => void ask()} disabled={askState === AskState.SENDING} className={`${actionButton} inline-flex items-center gap-1 font-semibold`} title="Gửi câu hỏi lên phần Hỏi đáp">
              <MessageSquarePlus size={12} /> Hỏi đáp
            </button>
          )}
          <button type="button" onClick={() => setCreatingCard((v) => !v)} className={`${actionButton} inline-flex items-center gap-1 font-semibold`} title="Tạo thẻ ghi nhớ (Flashcard)">
            <Layers size={12} /> Tạo thẻ
          </button>
          <button type="button" onClick={copy} className={actionButton} title="Sao chép">
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          </button>
          <button type="button" onClick={() => setEditing(true)} className={actionButton} title="Sửa ghi chú">
            <Edit2 size={12} />
          </button>
          <button type="button" onClick={onRemove} className={`${actionButton} hover:bg-rose-100 hover:text-rose-700`} title="Xoá ghi chú">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
