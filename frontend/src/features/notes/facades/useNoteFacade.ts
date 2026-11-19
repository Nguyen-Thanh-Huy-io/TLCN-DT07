'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createNoteApi,
  deleteNoteApi,
  fetchNoteLabels,
  fetchNotes,
  updateNoteApi,
  NOTE_COLOR,
  type CreateNotePayload,
  type NoteItem,
  type NoteKindValue,
  type NoteTargetTypeValue,
  type UpdateNotePayload,
} from '../services/note.service';
import { CommonFilterOption } from '@/constants/enums';

export type NewNoteInput = Omit<CreateNotePayload, 'targetType' | 'targetId' | 'guestId'>;

/** Mục (tiêu đề trong bài) đang được viết tóm tắt từ mục lục. */
export interface SummaryTarget {
  headingId: string;
  headingText: string;
}

export function useNoteFacade(targetType: NoteTargetTypeValue, targetId: string) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<boolean>(false);
  const [kindFilter, setKindFilter] = useState<NoteKindValue | CommonFilterOption.ALL>(CommonFilterOption.ALL);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [labelSuggestions, setLabelSuggestions] = useState<string[]>([]);
  const [summaryTarget, setSummaryTarget] = useState<SummaryTarget | null>(null);
  /** Ghi chú bị lạc đang chờ người học bôi đen đoạn mới để gắn lại. */
  const [reattachNoteId, setReattachNoteId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      setNotes(await fetchNotes(targetType, targetId));
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadNotes();
    });
  }, [loadNotes]);

  useEffect(() => {
    fetchNoteLabels()
      .then(setLabelSuggestions)
      // Gợi ý nhãn chỉ là tiện ích: lỗi thì người học vẫn gõ nhãn mới được.
      .catch(() => setLabelSuggestions([]));
  }, []);

  const openDrawer = useCallback(() => {
    setDrawMode(false);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawMode = useCallback(() => {
    setDrawMode((prev) => {
      const next = !prev;
      if (next) setIsOpen(false);
      return next;
    });
  }, []);

  const rememberLabels = (labels: string[] | undefined) => {
    if (!labels?.length) return;
    setLabelSuggestions((prev) => [...new Set([...prev, ...labels])].sort((a, b) => a.localeCompare(b, 'vi')));
  };

  const addNote = async (input: NewNoteInput) => {
    if (!input.content.trim() && !input.highlightText) return;
    try {
      const newNote = await createNoteApi({ color: NOTE_COLOR.YELLOW, ...input, targetType, targetId });
      setNotes((prev) => [newNote, ...prev]);
      rememberLabels(input.labels);
      return newNote;
    } catch (err) {
      console.error('Lỗi tạo ghi chú:', err);
      throw err;
    }
  };

  const editNote = async (id: string, updates: UpdateNotePayload) => {
    try {
      const updated = await updateNoteApi(id, updates);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      rememberLabels(updates.labels);
      return updated;
    } catch (err) {
      console.error('Lỗi cập nhật ghi chú:', err);
      throw err;
    }
  };

  const removeNote = async (id: string) => {
    try {
      await deleteNoteApi(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Lỗi xoá ghi chú:', err);
      throw err;
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      (kindFilter === CommonFilterOption.ALL || n.kind === kindFilter) &&
      (!labelFilter || n.labels.includes(labelFilter)),
  );
  const usedLabels = [...new Set(notes.flatMap((n) => n.labels))].sort((a, b) => a.localeCompare(b, 'vi'));

  return {
    notes: filteredNotes,
    /** Mọi ghi chú của bài, không theo bộ lọc — dùng để tô lại trong bài. */
    allNotes: notes,
    allNotesCount: notes.length,
    loading,
    isOpen,
    drawMode,
    setDrawMode,
    toggleDrawMode,
    kindFilter,
    setKindFilter,
    labelFilter,
    setLabelFilter,
    /** Nhãn đang có ở bài này (cho bộ lọc) và nhãn đã dùng ở mọi bài (cho gợi ý khi gõ). */
    usedLabels,
    labelSuggestions,
    summaryTarget,
    setSummaryTarget,
    reattachNoteId,
    setReattachNoteId,
    openDrawer,
    closeDrawer,
    addNote,
    editNote,
    removeNote,
    reload: loadNotes,
  };
}

export type NoteFacade = ReturnType<typeof useNoteFacade>;
