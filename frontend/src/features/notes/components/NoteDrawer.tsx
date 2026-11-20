'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bookmark, Highlighter, Layers, List, Plus, Sparkles, X } from 'lucide-react';
import { CommonFilterOption, KeyboardKey } from '@/constants/enums';
import type { NoteFacade } from '../facades/useNoteFacade';
import { NOTE_KIND_META, isOpenQuestion } from '../constants/note-kind.constants';
import {
  NOTE_KIND,
  NOTE_TARGET_TYPE,
  type NoteItem,
  type NoteKindValue,
  type NoteTargetTypeValue,
} from '../services/note.service';
import { groupNotesByCluster } from '../utils/note-cluster.util';
import { NoteCard, NoteLabelInput } from './NoteDrawerParts';

// === NoteReviewAlertBanner ===
interface NoteReviewAlertBannerProps {
  facade: NoteFacade;
  /** Số ghi chú cần xem lại vì bài đã cập nhật (đoạn bị sửa hoặc mất). */
  reviewCount?: number;
}

export function NoteReviewAlertBanner({ facade, reviewCount = 0 }: NoteReviewAlertBannerProps) {
  const { openDrawer, isOpen } = facade;
  if (isOpen || reviewCount <= 0) return null;

  return (
    <div className="fixed bottom-16 inset-x-0 z-40 mx-auto w-fit max-w-[calc(100vw-24px)]">
      <button
        type="button"
        onClick={openDrawer}
        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-md"
      >
        <AlertTriangle size={13} /> Bài đã cập nhật — {reviewCount} ghi chú cần xem lại
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

enum NoteDrawerViewMode {
  LIST = 'LIST',
  CLUSTER = 'CLUSTER',
}

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
  const [viewMode, setViewMode] = useState<NoteDrawerViewMode>(NoteDrawerViewMode.LIST);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

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

  const sortedNotes = [...notes].sort(byOpenQuestionFirst);
  const clusterGroups = groupNotesByCluster(sortedNotes);

  const renderCard = (note: NoteItem, keyPrefix = '') => (
    <NoteCard
      key={`${keyPrefix}${note.id}-${note.updatedAt}`}
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
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto absolute inset-0 bg-stone-900/35 backdrop-blur-[2px] md:hidden"
            onClick={closeDrawer}
            aria-label="Đóng sổ ghi chú"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#E5D8C1] bg-[#FAF7F2] shadow-[-12px_0_35px_rgba(45,26,16,0.12)]"
            aria-label="Sổ ghi chú cá nhân"
          >
            <div className="flex items-center justify-between border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B261E]/10 text-[#8B261E]">
                  <Bookmark size={18} />
                </div>
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-900">
                    Sổ Ghi Chú Cá Nhân
                    <span className="rounded-full bg-[#8B261E] px-1.5 text-[10px] text-white">{allNotesCount}</span>
                  </h3>
                  <p className="max-w-[240px] truncate text-[11px] text-stone-500">
                    {targetTitle || (targetType === NOTE_TARGET_TYPE.ARTICLE ? 'Bài viết lịch sử' : 'Bài học')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Đóng sổ ghi chú"
                title="Đóng (Esc)"
                className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <form onSubmit={handleCreateNote} className="space-y-2.5 rounded-xl border border-stone-200/90 bg-white p-4 shadow-2xs">
                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#8B261E]">
                  <Plus size={14} /> Ghi chú chung cho bài
                </span>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Suy nghĩ, kiến thức cần nhớ về cả bài..."
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50/50 p-3 text-xs focus:border-[#8B261E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B261E]/30 sm:text-sm"
                />
                <NoteLabelInput value={newLabels} onChange={setNewLabels} suggestions={labelSuggestions} />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-stone-400">
                    <Highlighter size={12} /> Bôi đen chữ hoặc bấm + cạnh đoạn
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !newContent.trim()}
                    className="cursor-pointer rounded-lg bg-[#8B261E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#721F18] disabled:opacity-50"
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu ghi chú'}
                  </button>
                </div>
              </form>

              {allNotesCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-stone-500">Hiển thị ghi chú</span>
                    <div className="inline-flex rounded-lg bg-stone-200/75 p-0.5 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setViewMode(NoteDrawerViewMode.LIST)}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 ${
                          viewMode === NoteDrawerViewMode.LIST ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                        }`}
                      >
                        <List size={12} /> Danh sách
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode(NoteDrawerViewMode.CLUSTER)}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 ${
                          viewMode === NoteDrawerViewMode.CLUSTER ? 'bg-white text-[#8B261E] shadow-2xs' : 'text-stone-600'
                        }`}
                      >
                        <Layers size={12} /> Theo cụm nhóm
                      </button>
                    </div>
                  </div>

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
                <div className="py-12 text-center text-xs text-stone-400">Đang tải ghi chú...</div>
              ) : notes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 bg-white/60 px-4 py-12 text-center text-stone-500">
                  <Sparkles size={28} className="mx-auto mb-2 text-stone-300" />
                  <p className="text-xs font-semibold text-stone-700">{allNotesCount ? 'Không có ghi chú khớp bộ lọc' : 'Chưa có ghi chú nào'}</p>
                  <p className="mt-1 text-[11px] text-stone-400">Bôi đen chữ hoặc rê chuột cạnh đoạn văn bấm + để tạo sticky…</p>
                </div>
              ) : viewMode === NoteDrawerViewMode.CLUSTER ? (
                <div className="space-y-4">
                  {clusterGroups.map((group) => (
                    <section key={group.groupKey} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-stone-200/80 pb-1">
                        <span className={`text-xs font-bold ${group.isUngrouped ? 'text-stone-500' : 'text-[#8B261E]'}`}>
                          {group.label}
                        </span>
                        <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                          {group.notes.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {group.notes.map((note) => renderCard(note, `${group.groupKey}-`))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedNotes.map((note) => renderCard(note))}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
