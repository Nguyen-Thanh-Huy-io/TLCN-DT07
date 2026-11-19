'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  BookOpen,
  Compass,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  StickyNote,
  X,
} from 'lucide-react';
import { NOTE_KIND_META } from '@/features/notes/constants/note-kind.constants';
import {
  NOTE_COLOR_STYLES,
  NOTE_TARGET_TYPE,
  type NoteItem,
} from '@/features/notes/services/note.service';
import {
  removeSavedTimelineNode,
  toggleSavedMaterial,
  type SavedMaterialSnapshot,
} from '@/features/saved-materials/services/saved-material.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import {
  ReaderSourceKind,
  toSavedMaterialKind,
  type ReadableMaterialKind,
} from '../constants/mindmap.constants';
import { type MindmapArticleRef } from '../services/mindmap.service';
import {
  formatPersonalNoteForBranch,
  makeExcerptTitle,
  resolveNoteTargetKind,
  type LoadedSavedPersonalCatalog,
  type SavedTimelineMilestone,
} from '../services/saved-materials.service';

enum SavedFilterTab {
  ALL = 'ALL',
  BOOKMARKS = 'BOOKMARKS',
  NOTES = 'NOTES',
}

interface BranchDraftPayload {
  title: string;
  note?: string;
  articleRef?: MindmapArticleRef;
}

const QUICK_BRANCH_BTN_CLS =
  'inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white cursor-pointer';
const ICON_UNSAVE_CLS =
  'grid size-6 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer';

function matchesFilterQuery(queryLower: string, parts: Array<string | null | undefined>): boolean {
  if (!queryLower) return true;
  return parts.some((p) => (p ?? '').toLocaleLowerCase('vi').includes(queryLower));
}

function SavedStudyItemRow({
  icon,
  title,
  subtitle,
  onOpen,
  onCreateBranch,
  onUnsave,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | null;
  onOpen: () => void;
  onCreateBranch: () => void;
  onUnsave: () => void;
}) {
  return (
    <li className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-2 text-left cursor-pointer"
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-800 hover:text-indigo-700 line-clamp-2">{title}</div>
          {subtitle && <p className="mt-0.5 text-[10.5px] text-slate-500 line-clamp-1">{subtitle}</p>}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onCreateBranch}
          className={QUICK_BRANCH_BTN_CLS}
          title="Thêm làm nhánh Mindmap"
        >
          <Plus size={11} /> Nhánh
        </button>
        <button
          type="button"
          onClick={onUnsave}
          title="Bỏ khỏi yêu thích"
          aria-label="Bỏ khỏi yêu thích"
          className={ICON_UNSAVE_CLS}
        >
          <X size={13} />
        </button>
      </div>
    </li>
  );
}

function SavedNoteEntryCard({
  note,
  onOpenItem,
  onCreateBranch,
}: {
  note: NoteItem;
  onOpenItem: (kind: ReadableMaterialKind, slug: string) => void;
  onCreateBranch: (payload: BranchDraftPayload) => void;
}) {
  const kindMeta = NOTE_KIND_META[note.kind];
  const colorStyle = NOTE_COLOR_STYLES[note.color];
  const targetSlug = note.target?.slug;
  const rawTitle = note.title || note.highlightText || note.content || 'Ghi chú lịch sử';

  const articleRef: MindmapArticleRef | undefined =
    note.targetType === NOTE_TARGET_TYPE.ARTICLE && note.target
      ? { id: note.targetId, slug: note.target.slug, title: note.target.title }
      : undefined;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-700">
          <span className={`size-2 rounded-full ${colorStyle.dot}`} />
          {kindMeta.label}
        </span>
        {note.target?.title && (
          <span className="max-w-[190px] truncate text-[10px] font-medium text-slate-400">
            {note.target.title}
          </span>
        )}
      </div>

      {note.title && <div className="mb-1 text-xs font-bold text-slate-800">{note.title}</div>}
      {note.highlightText && (
        <blockquote className="mb-1.5 rounded-lg border-l-2 border-amber-400 bg-amber-50/60 px-2 py-1 text-[11px] italic text-slate-700 line-clamp-3">
          &ldquo;{note.highlightText}&rdquo;
        </blockquote>
      )}
      {note.content && <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-3">{note.content}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() =>
            onCreateBranch({
              title: makeExcerptTitle(rawTitle),
              note: formatPersonalNoteForBranch(note),
              articleRef,
            })
          }
          className={QUICK_BRANCH_BTN_CLS}
        >
          <Plus size={11} /> Tạo nhánh
        </button>
        {targetSlug && (
          <button
            type="button"
            onClick={() => onOpenItem(resolveNoteTargetKind(note), targetSlug)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            <BookOpen size={11} /> Đọc bài
          </button>
        )}
      </div>
    </li>
  );
}

function SavedTimelineEntryCard({
  item,
  onCreateBranch,
}: {
  item: SavedTimelineMilestone;
  onCreateBranch: (payload: BranchDraftPayload) => void;
}) {
  const branchNote = item.dateLabel ? `${item.timelineTitle} · ${item.dateLabel}` : item.timelineTitle;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
            <Compass size={11} />
            {item.dateLabel || 'Dấu mốc lịch sử'}
          </div>
          <div className="mt-0.5 font-bold text-slate-800 line-clamp-2">{item.title}</div>
          <div className="text-[10.5px] text-slate-500 line-clamp-1">{item.timelineTitle}</div>
        </div>
        <button
          type="button"
          onClick={() => void removeSavedTimelineNode(item.id)}
          title="Bỏ ghim dấu mốc"
          aria-label="Bỏ ghim dấu mốc"
          className={ICON_UNSAVE_CLS}
        >
          <X size={13} />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onCreateBranch({ title: makeExcerptTitle(item.title), note: branchNote })}
          className={QUICK_BRANCH_BTN_CLS}
        >
          <Plus size={11} /> Tạo nhánh
        </button>
        <Link
          href={PUBLIC_ROUTES.TIMELINE(item.timelineSlug)}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600 hover:text-indigo-700"
        >
          <ExternalLink size={10} /> Dòng thời gian
        </Link>
      </div>
    </li>
  );
}

export function MindmapSavedFavoritesPanel({
  loading,
  snapshot,
  catalog,
  onOpenItem,
  onCreateBranch,
}: {
  loading: boolean;
  snapshot: SavedMaterialSnapshot;
  catalog: LoadedSavedPersonalCatalog;
  onOpenItem: (kind: ReadableMaterialKind, slug: string) => void;
  onCreateBranch: (payload: BranchDraftPayload) => void;
}) {
  const [query, setQuery] = useState('');
  const [subTab, setSubTab] = useState<SavedFilterTab>(SavedFilterTab.ALL);
  const qLower = query.trim().toLocaleLowerCase('vi');

  const savedArticles = useMemo(
    () =>
      snapshot.articleIds
        .map((id) => catalog.articlesById.get(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
        .filter((a) => matchesFilterQuery(qLower, [a.title, a.summary])),
    [catalog.articlesById, qLower, snapshot.articleIds],
  );

  const savedLessons = useMemo(
    () =>
      snapshot.lessonIds
        .map((id) => catalog.lessonsById.get(id))
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .filter((l) => matchesFilterQuery(qLower, [l.title, l.description])),
    [catalog.lessonsById, qLower, snapshot.lessonIds],
  );

  const savedTimelines = useMemo(
    () =>
      snapshot.timelineNodeIds
        .filter((id) => !snapshot.articleIds.includes(id))
        .map((id) => catalog.timelineById.get(id))
        .filter((t): t is SavedTimelineMilestone => Boolean(t))
        .filter((t) => matchesFilterQuery(qLower, [t.title, t.timelineTitle, t.dateLabel])),
    [catalog.timelineById, qLower, snapshot.articleIds, snapshot.timelineNodeIds],
  );

  const filteredNotes = useMemo(
    () =>
      catalog.notes.filter((n) =>
        matchesFilterQuery(qLower, [n.title, n.highlightText, n.content, n.target?.title]),
      ),
    [catalog.notes, qLower],
  );

  const bookmarkTotal = savedArticles.length + savedLessons.length + savedTimelines.length;
  const showBookmarks = subTab !== SavedFilterTab.NOTES;
  const showNotes = subTab !== SavedFilterTab.BOOKMARKS;
  const isEmpty =
    (showBookmarks ? bookmarkTotal : 0) + (showNotes ? filteredNotes.length : 0) === 0;

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm bài đã lưu, ghi chú cá nhân…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: SavedFilterTab.ALL, label: `Tất cả (${bookmarkTotal + filteredNotes.length})` },
          { id: SavedFilterTab.BOOKMARKS, label: `Đã lưu (${bookmarkTotal})` },
          { id: SavedFilterTab.NOTES, label: `Đánh dấu (${filteredNotes.length})` },
        ].map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setSubTab(pill.id)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
              subTab === pill.id
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {loading && bookmarkTotal === 0 && filteredNotes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Đang tải tủ sách &amp; đánh dấu…
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-slate-500">
          <Bookmark size={22} className="mx-auto mb-2 text-amber-500 opacity-80" />
          <p className="font-semibold text-slate-700">Chưa có mục yêu thích hay đánh dấu nào</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Bấm biểu tượng đánh dấu ở Bài viết, Bài học hoặc tô sáng đoạn chữ khi đọc trên HISGO để dùng nhanh tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {showBookmarks && savedArticles.length > 0 && (
            <section className="space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
                Bài viết yêu thích ({savedArticles.length})
              </div>
              <ul className="space-y-1.5">
                {savedArticles.map((art) => (
                  <SavedStudyItemRow
                    key={art.id}
                    icon={<FileText size={14} className="text-amber-600" />}
                    title={art.title}
                    subtitle={art.summary}
                    onOpen={() => onOpenItem(ReaderSourceKind.ARTICLE, art.slug)}
                    onCreateBranch={() =>
                      onCreateBranch({
                        title: makeExcerptTitle(art.title),
                        note: art.summary ?? undefined,
                        articleRef: { id: art.id, slug: art.slug, title: art.title, coverImageUrl: art.coverImageUrl },
                      })
                    }
                    onUnsave={() => void toggleSavedMaterial(toSavedMaterialKind(ReaderSourceKind.ARTICLE), art.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {showBookmarks && savedLessons.length > 0 && (
            <section className="space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">
                Bài học yêu thích ({savedLessons.length})
              </div>
              <ul className="space-y-1.5">
                {savedLessons.map((les) => (
                  <SavedStudyItemRow
                    key={les.id}
                    icon={<GraduationCap size={14} className="text-indigo-600" />}
                    title={les.title}
                    subtitle={`${les.estimatedReadMinutes} phút đọc`}
                    onOpen={() => onOpenItem(ReaderSourceKind.LESSON, les.slug)}
                    onCreateBranch={() =>
                      onCreateBranch({ title: makeExcerptTitle(les.title), note: les.description ?? undefined })
                    }
                    onUnsave={() => void toggleSavedMaterial(toSavedMaterialKind(ReaderSourceKind.LESSON), les.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {showBookmarks && savedTimelines.length > 0 && (
            <section className="space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
                Dấu mốc đã ghim ({savedTimelines.length})
              </div>
              <ul className="space-y-1.5">
                {savedTimelines.map((item) => (
                  <SavedTimelineEntryCard key={item.id} item={item} onCreateBranch={onCreateBranch} />
                ))}
              </ul>
            </section>
          )}

          {showNotes && filteredNotes.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
                <StickyNote size={12} /> Ghi chú &amp; Đánh dấu cá nhân ({filteredNotes.length})
              </div>
              <ul className="space-y-2">
                {filteredNotes.map((note) => (
                  <SavedNoteEntryCard
                    key={note.id}
                    note={note}
                    onOpenItem={onOpenItem}
                    onCreateBranch={onCreateBranch}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
