'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchAllMyNotes,
  NOTE_TARGET_TYPE,
  type NoteItem,
} from '@/features/notes/services/note.service';
import api from '@/services/api';
import { LearnerApiService, type LibraryLesson } from '@/services/entities/learner.service';
import type { PublicArticleSummary, PublicTimeline } from '@/services/public/public-content.service';
import { MINDMAP_API, ReaderSourceKind, type ReadableMaterialKind } from '../constants/mindmap.constants';

export interface SavedTimelineMilestone {
  id: string;
  title: string;
  dateLabel: string | null;
  timelineSlug: string;
  timelineTitle: string;
}

export function makeExcerptTitle(raw: string, maxLen = 56): string {
  const firstLine = raw.replace(/\s+/g, ' ').trim();
  if (firstLine.length <= maxLen) return firstLine;
  return `${firstLine.slice(0, maxLen - 3).trimEnd()}…`;
}

export function formatPersonalNoteForBranch(note: NoteItem): string {
  const lines: string[] = [];
  if (note.highlightText) lines.push(`"${note.highlightText}"`);
  if (note.content) lines.push(note.content);
  if (note.target?.title) lines.push(`Nguồn: ${note.target.title}`);
  return lines.join('\n\n');
}

export function resolveNoteTargetKind(note: NoteItem): ReadableMaterialKind {
  return note.targetType === NOTE_TARGET_TYPE.LESSON
    ? ReaderSourceKind.LESSON
    : ReaderSourceKind.ARTICLE;
}

export interface LoadedSavedPersonalCatalog {
  articlesById: Map<string, PublicArticleSummary>;
  lessonsById: Map<string, LibraryLesson>;
  timelineById: Map<string, SavedTimelineMilestone>;
  notes: NoteItem[];
}

const PROMISE_STATUS = { FULFILLED: 'fulfilled' } as const;

async function fetchPublicEnvelopeList<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const res = await api.get<{ data: T[] }>(url, params ? { params } : undefined);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

function readFulfilled<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === PROMISE_STATUS.FULFILLED && Array.isArray(result.value) ? result.value : [];
}

export function useSavedPersonalCatalog(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<LoadedSavedPersonalCatalog>({
    articlesById: new Map(),
    lessonsById: new Map(),
    timelineById: new Map(),
    notes: [],
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [artRes, lesRes, tlRes, notesRes] = await Promise.allSettled([
        fetchPublicEnvelopeList<PublicArticleSummary>(MINDMAP_API.PUBLIC_ARTICLES, { limit: 500 }),
        LearnerApiService.getLibrary(),
        fetchPublicEnvelopeList<PublicTimeline>(MINDMAP_API.PUBLIC_TIMELINES),
        fetchAllMyNotes(),
      ]);

      const articles = readFulfilled(artRes);
      const lessons = readFulfilled(lesRes);
      const timelines = readFulfilled(tlRes);
      const notes = readFulfilled(notesRes);

      const timelineById = new Map<string, SavedTimelineMilestone>();
      timelines.forEach((tl) => {
        tl.nodes?.forEach((node) => {
          timelineById.set(node.id, {
            id: node.id,
            title: node.title,
            dateLabel: node.dateLabel,
            timelineSlug: tl.slug,
            timelineTitle: tl.title,
          });
        });
      });

      setCatalog({
        articlesById: new Map(articles.map((a) => [a.id, a])),
        lessonsById: new Map(lessons.map((l) => [l.id, l])),
        timelineById,
        notes,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, reload]);

  return { loading, catalog, reload };
}
