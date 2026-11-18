'use client';

import React, { useState } from 'react';
import { AlertTriangle, Bookmark, Highlighter, Plus, Sparkles, X } from 'lucide-react';
import { CommonFilterOption } from '@/constants/enums';
import type { NoteFacade } from '../facades/useNoteFacade';
import { NOTE_KIND_META, isOpenQuestion } from '../constants/note-kind.constants';
import { NOTE_KIND, NOTE_TARGET_TYPE, type NoteItem, type NoteKindValue, type NoteTargetTypeValue } from '../services/note.service';
import { NoteCard, NoteLabelInput } from './NoteDrawerParts';

// === NoteFloatingButton ===
interface NoteFloatingButtonProps {
  facade: NoteFacade;
  /** Số ghi chú cần xem lại vì bài đã cập nhật (đoạn bị sửa hoặc mất). */
  reviewCount?: number;
}

export function NoteFloatingButton({ facade, reviewCount = 0 }: NoteFloatingButtonProps) {
  const { allNotesCount, openDrawer, isOpen } = facade;
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {reviewCount > 0 && (
        <button
          type="button"
          onClick={openDrawer}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-md cursor-pointer"
        >
          <AlertTriangle size={13} /> Bài đã cập nhật — {reviewCount} ghi chú cần xem lại
        </button>
      )}
      <button
        type="button"
        onClick={openDrawer}
        className="group relative flex items-center gap-2 px-3.5 py-3 rounded-full bg-[#8B261E] text-white shadow-xl hover:bg-[#721F18] hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-white/30"
        title="Mở sổ ghi chú cá nhân"
      >
        <Bookmark size={18} />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">Ghi chú</span>
        {allNotesCount > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#8B261E] font-bold text-[11px] flex items-center justify-center shadow-xs">
            {allNotesCount}
          </span>
        )}
      </button>
    </div>
  );
}

// === NoteDrawer ===
interface NoteDrawerProps {
  facade: NoteFacade;
  targetTitle?: string;
  targetType: NoteTargetTypeValue;
  /** Cuộn tới đoạn của ghi chú trong bài; không truyền thì không có nút "Xem trong bài". */
  onLocateNote?: (noteId: string) => void;
  /** Ghi chú có đoạn trích nhưng không còn tìm thấy trong bài (bài đã sửa). */
  lostNoteIds?: ReadonlySet<string>;
  /** Ghi chú chỉ khớp gần đúng (đoạn bị sửa nhẹ). */
  needsReviewIds?: ReadonlySet<string>;
  /** Bắt đầu gắn lại ghi chú bị lạc vào đoạn mới. */
  onReattachNote?: (noteId: string) => void;
  /** Chỉ bài học: gửi câu hỏi lên phần Hỏi đáp. */
  onAskCommunity?: (note: NoteItem) => Promise<void>;
}

/** Câu hỏi chưa hiểu lên đầu, còn lại giữ thứ tự mới nhất trước. */
const byOpenQuestionFirst = (a: NoteItem, b: NoteItem) => Number(isOpenQuestion(b)) - Number(isOpenQuestion(a));

const chip = (active: boolean) =>
  `shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
    active ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
  }`;

const ALL_KINDS = Object.values(NOTE_KIND);

export function NoteDrawer({
  facade,
  targetTitle,
  targetType,
  onLocateNote,
  lostNoteIds,
  needsReviewIds,
  onReattachNote,
  onAskCommunity,
}: NoteDrawerProps) {
  const {
    notes,
    allNotes,
    allNotesCount,
    loading,
    isOpen,
    kindFilter,
    setKindFilter,
    labelFilter,
    setLabelFilter,
    usedLabels,
    labelSuggestions,
    closeDrawer,
    addNote,
    editNote,
    removeNote,
  } = facade;
  const [newContent, setNewContent] = useState('');
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const kindsInUse = ALL_KINDS.filter((kind: NoteKindValue) => allNotes.some((n) => n.kind === kind));
  const openQuestions = allNotes.filter(isOpenQuestion).length;

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      setSubmitting(true);
      await addNote({ content: newContent.trim(), kind: NOTE_KIND.NOTE, labels: newLabels });
      setNewContent('');
      setNewLabels([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={closeDrawer} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] border-l border-stone-200 shadow-2xl flex flex-col">
          <div className="px-5 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8B261E]/10 text-[#8B261E] flex items-center justify-center">
                <Bookmark size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  Sổ Ghi Chú Cá Nhân
                  <span className="px-1.5 rounded-full bg-[#8B261E] text-white text-[10px]">{allNotesCount}</span>
                </h3>
                <p className="text-[11px] text-stone-500 line-clamp-1 max-w-[240px]">
                  {targetTitle || (targetType === NOTE_TARGET_TYPE.ARTICLE ? 'Bài viết lịch sử' : 'Bài học')}
                </p>
              </div>
            </div>
            <button type="button" onClick={closeDrawer} aria-label="Đóng" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <form onSubmit={handleCreateNote} className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B261E] flex items-center gap-1">
                <Plus size={14} /> Ghi chú chung cho bài
              </span>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Suy nghĩ, kiến thức cần nhớ về cả bài..."
                rows={3}
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B261E]/30 focus:border-[#8B261E]"
              />
              <NoteLabelInput value={newLabels} onChange={setNewLabels} suggestions={labelSuggestions} />
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Highlighter size={12} /> Bôi đen chữ trên bài để ghi chú tại chỗ
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#8B261E] text-white font-bold text-xs hover:bg-[#721F18] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
              </div>
            </form>

            {allNotesCount > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button type="button" onClick={() => setKindFilter(CommonFilterOption.ALL)} className={chip(kindFilter === CommonFilterOption.ALL)}>
                    Tất cả ({allNotesCount})
                  </button>
                  {kindsInUse.map((kind) => {
                    const Icon = NOTE_KIND_META[kind].icon;
                    const count = allNotes.filter((n) => n.kind === kind).length;
                    const openSuffix = kind === NOTE_KIND.QUESTION && openQuestions > 0 ? ` · ${openQuestions} chưa hiểu` : '';
                    return (
                      <button key={kind} type="button" onClick={() => setKindFilter(kind)} className={chip(kindFilter === kind)}>
                        <Icon size={11} /> {NOTE_KIND_META[kind].label} ({count}{openSuffix})
                      </button>
                    );
                  })}
                </div>
                {usedLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {usedLabels.map((label) => (
                      <button key={label} type="button" onClick={() => setLabelFilter(labelFilter === label ? null : label)} className={chip(labelFilter === label)}>
                        #{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-stone-400 text-xs">Đang tải ghi chú...</div>
            ) : notes.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-stone-200 text-stone-500 bg-white/60">
                <Sparkles size={28} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-semibold text-stone-700">{allNotesCount ? 'Không có ghi chú khớp bộ lọc' : 'Chưa có ghi chú nào'}</p>
                <p className="text-[11px] text-stone-400 mt-1">Bôi đen một đoạn trong bài để tô sáng, ghi chú, đặt câu hỏi…</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...notes].sort(byOpenQuestionFirst).map((note) => (
                  <NoteCard
                    key={`${note.id}-${note.updatedAt}`}
                    note={note}
                    isLost={Boolean(lostNoteIds?.has(note.id))}
                    needsReview={Boolean(needsReviewIds?.has(note.id))}
                    labelSuggestions={labelSuggestions}
                    onLocate={onLocateNote ? () => onLocateNote(note.id) : undefined}
                    onReattach={onReattachNote ? () => onReattachNote(note.id) : undefined}
                    onUpdate={(updates) => editNote(note.id, updates)}
                    onRemove={() => void removeNote(note.id)}
                    onAskCommunity={onAskCommunity ? () => onAskCommunity(note) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
