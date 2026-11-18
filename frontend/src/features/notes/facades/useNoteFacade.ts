'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createNoteApi,
  deleteNoteApi,
  fetchNotes,
  updateNoteApi,
} from '../services/note.service';
import {
  NOTE_COLOR,
  NoteAnchorValue,
  NoteColorValue,
  NoteItem,
  NoteTargetTypeValue,
  UpdateNotePayload,
} from '../services/note.service';
import { CommonFilterOption } from '@/constants/enums';

export function useNoteFacade(
  targetType: NoteTargetTypeValue,
  targetId: string
) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [colorFilter, setColorFilter] = useState<NoteColorValue | CommonFilterOption.ALL>(CommonFilterOption.ALL);

  const loadNotes = useCallback(async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const items = await fetchNotes(targetType, targetId);
      setNotes(items);
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

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addNote = async (
    content: string,
    title?: string,
    color: NoteColorValue = NOTE_COLOR.YELLOW,
    highlightText?: string,
    anchor?: NoteAnchorValue
  ) => {
    if (!content.trim() && !highlightText) return;

    try {
      const newNote = await createNoteApi({
        targetType,
        targetId,
        content,
        title,
        color,
        highlightText,
        anchor,
      });

      setNotes((prev) => [newNote, ...prev]);
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

  const filteredNotes = notes.filter((n) => {
    if (colorFilter === CommonFilterOption.ALL) return true;
    return n.color === colorFilter;
  });

  return {
    notes: filteredNotes,
    /** Mọi ghi chú của bài, không theo bộ lọc màu — dùng để tô lại trong bài. */
    allNotes: notes,
    allNotesCount: notes.length,
    loading,
    isOpen,
    colorFilter,
    setColorFilter,
    openDrawer,
    closeDrawer,
    addNote,
    editNote,
    removeNote,
    reload: loadNotes,
  };
}
