'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NewNoteInput } from '../facades/useNoteFacade';
import type {
  NoteColorValue,
  NoteInkItem,
  NoteItem,
  UpdateNotePayload,
} from '../services/note.service';
import { buildBlockClusterAnchor } from '../utils/note-anchor.util';
import {
  applyInkHistoryUndo,
  buildInkNotePayload,
  findBlockInkNote,
  mergeEffectiveBlockInkNotes,
  type EffectiveBlockInkNote,
  type InkHistoryEntry,
} from '../utils/note-cluster.util';

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

/**
 * Quản lý trạng thái lạc quan (optimistic state) + hàng đợi đồng bộ tuần tự theo từng khối đoạn:
 * - Nét vừa vẽ/xoá hiển thị tức thì (0ms) mà không chờ API hoàn tất.
 * - Các nét vẽ liên tiếp trên cùng một đoạn được gộp (coalesce) và gửi tuần tự sau khi `POST` trả về ID thật,
 *   loại bỏ hoàn toàn race-condition ghi đè hoặc mất nét.
 */
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
