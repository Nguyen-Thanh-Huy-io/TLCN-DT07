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
  NoteColorValue,
  NoteItem,
  NoteTargetTypeValue,
  UpdateNotePayload,
} from '../types/note.types';

export function useNoteFacade(
  targetType: NoteTargetTypeValue,
  targetId: string
) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedHighlight, setSelectedHighlight] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<NoteColorValue | 'ALL'>('ALL');

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
    loadNotes();
  }, [loadNotes]);

  // Bắt sự kiện chọn (bôi đen) văn bản trên bài đọc
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text.length > 3 && text.length < 500) {
          setSelectedHighlight(text);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const openDrawer = useCallback((useCurrentSelection: boolean = false) => {
    if (useCurrentSelection) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text.length > 0) {
          setSelectedHighlight(text);
        }
      }
    }
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addNote = async (
    content: string,
    title?: string,
    color: NoteColorValue = NOTE_COLOR.YELLOW,
    highlightText?: string
  ) => {
    if (!content.trim()) return;

    try {
      const newNote = await createNoteApi({
        targetType,
        targetId,
        content,
        title,
        color,
        highlightText: highlightText || selectedHighlight || undefined,
      });

      setNotes((prev) => [newNote, ...prev]);
      setSelectedHighlight('');
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
    if (colorFilter === 'ALL') return true;
    return n.color === colorFilter;
  });

  return {
    notes: filteredNotes,
    allNotesCount: notes.length,
    loading,
    isOpen,
    selectedHighlight,
    colorFilter,
    setColorFilter,
    setSelectedHighlight,
    openDrawer,
    closeDrawer,
    addNote,
    editNote,
    removeNote,
    reload: loadNotes,
  };
}
