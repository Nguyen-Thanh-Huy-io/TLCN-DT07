'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createNoteApi,
  deleteNoteApi,
  fetchNoteLabels,
  fetchNotes,
  updateNoteApi,
  NOTE_COLOR,
  type CreateNotePayload,
  type NoteColorValue,
  type NoteInkItem,
  type NoteItem,
  type NoteKindValue,
  type NoteTargetTypeValue,
  type UpdateNotePayload,
} from '../services/note.service';
import { CommonFilterOption } from '@/constants/enums';
import { buildBlockClusterAnchor } from '../utils/note-anchor.util';
import {
  applyInkHistoryUndo,
  buildInkNotePayload,
  findBlockInkNote,
  mergeEffectiveBlockInkNotes,
  type EffectiveBlockInkNote,
  type InkHistoryEntry,
} from '../utils/note-cluster.util';

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

// === Merged from useInkSyncQueue.ts ===
const DEFAULT_INK_EXCERPT = 'Ghi chú vẽ tay';

interface UseInkSyncQueueParams {
  allNotes: NoteItem[];
  readableBlocks: HTMLElement[];
  fallbackColor: NoteColorValue;
  onAddNote: (input: NewNoteInput) => Promise<NoteItem | undefined>;
  onEditNote: (id: string, updates: UpdateNotePayload) => Promise<NoteItem | undefined>;
  onRemoveNote: (id: string) => Promise<void>;
}

export interface InkSyncQueueHandle {
  effectiveBlockNotes: EffectiveBlockInkNote[];
  undoCount: number;
  getBlockItems: (blockStart: number) => NoteInkItem[];
  pushHistory: (entry: InkHistoryEntry) => void;
  commitBlockItems: (blockStart: number, nextItems: NoteInkItem[]) => void;
  undoLast: () => void;
}

export function useInkSyncQueue({
  allNotes,
  readableBlocks,
  fallbackColor,
  onAddNote,
  onEditNote,
  onRemoveNote,
}: UseInkSyncQueueParams): InkSyncQueueHandle {
  const [optimisticBlocks, setOptimisticBlocks] = useState<Record<number, readonly NoteInkItem[]>>({});
  const [undoCount, setUndoCount] = useState(0);

  const historyRef = useRef<InkHistoryEntry[]>([]);
  const desiredBlocksRef = useRef<Map<number, NoteInkItem[]>>(new Map());
  const inFlightBlocksRef = useRef<Set<number>>(new Set());
  const dirtyBlocksRef = useRef<Set<number>>(new Set());
  const pendingNoteIdRef = useRef<Map<number, string>>(new Map());

  const allNotesRef = useRef(allNotes);
  const readableBlocksRef = useRef(readableBlocks);
  const fallbackColorRef = useRef(fallbackColor);
  const addNoteRef = useRef(onAddNote);
  const editNoteRef = useRef(onEditNote);
  const removeNoteRef = useRef(onRemoveNote);

  useEffect(() => {
    allNotesRef.current = allNotes;
    readableBlocksRef.current = readableBlocks;
    fallbackColorRef.current = fallbackColor;
    addNoteRef.current = onAddNote;
    editNoteRef.current = onEditNote;
    removeNoteRef.current = onRemoveNote;
  });

  const clearOptimisticEntry = useCallback((blockStart: number) => {
    desiredBlocksRef.current.delete(blockStart);
    pendingNoteIdRef.current.delete(blockStart);
    setOptimisticBlocks((prev) => {
      if (!(blockStart in prev)) return prev;
      const next = { ...prev };
      delete next[blockStart];
      return next;
    });
  }, []);

  const syncSingleBlockStep = useCallback(async (blockStart: number, nextItems: NoteInkItem[]) => {
    const existing = findBlockInkNote(allNotesRef.current, blockStart);
    const targetNoteId = pendingNoteIdRef.current.get(blockStart) ?? existing?.id;

    if (nextItems.length === 0) {
      if (targetNoteId) {
        await removeNoteRef.current(targetNoteId);
        pendingNoteIdRef.current.delete(blockStart);
      }
      return;
    }

    const blockEl = readableBlocksRef.current[blockStart];
    const built = blockEl
      ? buildBlockClusterAnchor(readableBlocksRef.current, blockStart, blockStart)
      : {
          highlightText: existing?.highlightText ?? '',
          anchor: existing?.anchor ?? { blockStart },
        };

    const payload = buildInkNotePayload(
      blockStart,
      built.anchor.startHint ?? '',
      built.highlightText || DEFAULT_INK_EXCERPT,
      nextItems,
      existing?.color ?? fallbackColorRef.current,
    );

    if (targetNoteId) {
      await editNoteRef.current(targetNoteId, payload);
      return;
    }

    const created = await addNoteRef.current({ ...payload, labels: [] });
    if (created?.id) {
      pendingNoteIdRef.current.set(blockStart, created.id);
    }
  }, []);

  const flushBlock = useCallback(
    async (blockStart: number) => {
      if (inFlightBlocksRef.current.has(blockStart)) {
        dirtyBlocksRef.current.add(blockStart);
        return;
      }

      inFlightBlocksRef.current.add(blockStart);
      try {
        do {
          dirtyBlocksRef.current.delete(blockStart);
          const nextItems = desiredBlocksRef.current.get(blockStart);
          if (nextItems === undefined) break;
          await syncSingleBlockStep(blockStart, nextItems);
        } while (dirtyBlocksRef.current.has(blockStart));

        clearOptimisticEntry(blockStart);
      } catch (err) {
        console.error('Lỗi khi lưu nét vẽ:', err);
        dirtyBlocksRef.current.delete(blockStart);
        clearOptimisticEntry(blockStart);
      } finally {
        inFlightBlocksRef.current.delete(blockStart);
      }
    },
    [clearOptimisticEntry, syncSingleBlockStep],
  );

  const getBlockItems = useCallback((blockStart: number): NoteInkItem[] => {
    const pending = desiredBlocksRef.current.get(blockStart);
    if (pending !== undefined) return [...pending];
    const existing = findBlockInkNote(allNotesRef.current, blockStart);
    return [...(existing?.anchor?.inkItems ?? [])];
  }, []);

  const commitBlockItems = useCallback(
    (blockStart: number, nextItems: NoteInkItem[]) => {
      desiredBlocksRef.current.set(blockStart, nextItems);
      setOptimisticBlocks((prev) => ({ ...prev, [blockStart]: nextItems }));
      void flushBlock(blockStart);
    },
    [flushBlock],
  );

  const pushHistory = useCallback((entry: InkHistoryEntry) => {
    historyRef.current.push(entry);
    setUndoCount(historyRef.current.length);
  }, []);

  const undoLast = useCallback(() => {
    const entry = historyRef.current.pop();
    setUndoCount(historyRef.current.length);
    if (!entry) return;
    const currentItems = getBlockItems(entry.blockStart);
    const nextItems = applyInkHistoryUndo(currentItems, entry);
    commitBlockItems(entry.blockStart, nextItems);
  }, [commitBlockItems, getBlockItems]);

  const effectiveBlockNotes = useMemo(
    () => mergeEffectiveBlockInkNotes(allNotes, optimisticBlocks),
    [allNotes, optimisticBlocks],
  );

  return {
    effectiveBlockNotes,
    undoCount,
    getBlockItems,
    pushHistory,
    commitBlockItems,
    undoLast,
  };
}
