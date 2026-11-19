'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Layers, Loader2, Search, StickyNote, Tag, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { PUBLIC_CURRICULUM_ROUTES } from '@/features/public-curriculum/constants/public-curriculum.constants';
import { QuickCreateFlashcardBox } from '@/features/flashcards/components/QuickCreateFlashcardBox';
import { NOTE_KIND_META } from '@/features/notes/constants/note-kind.constants';
import {
  NOTE_COLOR_STYLES,
  NOTE_KIND,
  NOTE_TARGET_TYPE,
  deleteNoteApi,
  fetchAllMyNotes,
  type NoteItem,
  type NoteKindValue,
} from '@/features/notes/services/note.service';

const ALL_KINDS = 'ALL' as const;
type KindFilter = NoteKindValue | typeof ALL_KINDS;

const KIND_FILTER_OPTIONS: ReadonlyArray<{ id: KindFilter; label: string }> = [
  { id: ALL_KINDS, label: 'Tất cả' },
  { id: NOTE_KIND.NOTE, label: NOTE_KIND_META[NOTE_KIND.NOTE].label },
  { id: NOTE_KIND.HIGHLIGHT, label: NOTE_KIND_META[NOTE_KIND.HIGHLIGHT].label },
  { id: NOTE_KIND.DEFINITION, label: NOTE_KIND_META[NOTE_KIND.DEFINITION].label },
  { id: NOTE_KIND.QUESTION, label: NOTE_KIND_META[NOTE_KIND.QUESTION].label },
  { id: NOTE_KIND.IMPORTANT, label: NOTE_KIND_META[NOTE_KIND.IMPORTANT].label },
  { id: NOTE_KIND.SUMMARY, label: NOTE_KIND_META[NOTE_KIND.SUMMARY].label },
];

const targetHrefOf = (note: NoteItem): string | null => {
  const slug = note.target?.slug;
  if (!slug) return null;
  if (note.targetType === NOTE_TARGET_TYPE.ARTICLE) return PUBLIC_ROUTES.ARTICLE(slug);
  if (note.targetType === NOTE_TARGET_TYPE.LESSON) return PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(slug);
  return null;
};

/** Danh sách toàn bộ ghi chú & đánh dấu đã lưu từ mọi bài viết và bài học. */
export function SavedNotesPanel({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>(ALL_KINDS);
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cardDraftNoteId, setCardDraftNoteId] = useState<string | null>(null);
  const [savedCardNoteIds, setSavedCardNoteIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let alive = true;
    fetchAllMyNotes()
      .then((list) => {
        if (!alive) return;
        setNotes(list);
        onCountChange?.(list.length);
      })
      .catch((err) => {
        if (alive) setError(extractErrorMessage(err, 'Không tải được danh sách ghi chú.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [onCountChange]);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [notes]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi');
    return notes
      .filter((n) => kindFilter === ALL_KINDS || n.kind === kindFilter)
      .filter((n) => !labelFilter || n.labels?.includes(labelFilter))
      .filter((n) => {
        if (!needle) return true;
        const haystack = [n.title, n.content, n.highlightText, n.target?.title, ...(n.labels ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('vi');
        return haystack.includes(needle);
      });
  }, [notes, kindFilter, labelFilter, query]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteNoteApi(id);
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Không xoá được ghi chú.'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-xs text-[var(--text-muted,#7A6B57)]">
        <Loader2 size={15} className="animate-spin" /> Đang tải ghi chú đã lưu…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] bg-white/40 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
            <StickyNote size={22} />
          </div>
          <h4 className="mt-3 font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)]">
            Chưa có ghi chú hay đánh dấu nào
          </h4>
          <p className="mt-1 mx-auto max-w-md text-xs text-[var(--text-muted,#7A6B57)]">
            Khi đọc bài viết hoặc bài học, hãy bôi đen đoạn văn bản bất kỳ hoặc mở sổ ghi chú để lưu lại ý chính — toàn bộ sẽ tập trung tại đây.
          </p>
        </div>
      ) : (
        <>
          {/* Thanh tìm kiếm & lọc */}
          <div className="space-y-2.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[200px] flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted,#7A6B57)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm trong nội dung ghi chú, trích dẫn, tên bài…"
                  className="w-full rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 py-1.5 pl-8 pr-3 text-xs text-[var(--text-body,#2D1A10)] outline-none focus:border-[var(--gold,#B8893F)]"
                />
              </label>

              {allLabels.length > 0 && (
                <select
                  aria-label="Lọc theo nhãn"
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="rounded-lg border border-[var(--border,#E2D5B8)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--text-body,#2D1A10)] outline-none focus:border-[var(--gold,#B8893F)] cursor-pointer"
                >
                  <option value="">Tất cả nhãn ({allLabels.length})</option>
                  {allLabels.map((label) => (
                    <option key={label} value={label}>
                      #{label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {KIND_FILTER_OPTIONS.map((opt) => {
                const active = kindFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKindFilter(opt.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      active
                        ? 'border-[var(--primary,#7A1F24)] bg-[var(--primary,#7A1F24)] text-white'
                        : 'border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/50 text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border,#E2D5B8)] bg-white/40 py-8 text-center text-xs text-[var(--text-muted,#7A6B57)]">
              Không có ghi chú nào khớp bộ lọc hiện tại.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((note) => {
                const kindMeta = NOTE_KIND_META[note.kind] ?? NOTE_KIND_META[NOTE_KIND.NOTE];
                const KindIcon = kindMeta.icon;
                const colorStyle = NOTE_COLOR_STYLES[note.color] ?? NOTE_COLOR_STYLES.YELLOW;
                const href = targetHrefOf(note);
                return (
                  <li
                    key={note.id}
                    className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-4 transition hover:border-[var(--gold,#B8893F)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${colorStyle.badge}`}>
                          <KindIcon size={12} /> {kindMeta.label}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted,#7A6B57)]">
                          {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {note.labels?.map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-0.5 rounded border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary,#7A1F24)]"
                          >
                            <Tag size={10} /> {label}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        {savedCardNoteIds.has(note.id) ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800">
                            <Check size={12} /> Đã tạo thẻ
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCardDraftNoteId(note.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--primary,#7A1F24)] hover:bg-[var(--bg-page,#F5EEDC)] cursor-pointer"
                          >
                            <Layers size={12} /> Tạo thẻ
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === note.id}
                          onClick={() => void handleDelete(note.id)}
                          title="Xoá ghi chú này"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--text-muted,#7A6B57)] hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === note.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Xoá
                        </button>
                      </div>
                    </div>

                    {note.highlightText && (
                      <blockquote className={`mt-2.5 rounded-lg border-l-3 px-3 py-2 text-xs italic leading-relaxed ${colorStyle.bg} ${colorStyle.border} ${colorStyle.text}`}>
                        “{note.highlightText}”
                      </blockquote>
                    )}

                    {note.title && (
                      <p className="mt-2 text-sm font-bold text-[var(--text-body,#2D1A10)]">{note.title}</p>
                    )}

                    {note.content && (
                      <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[var(--text-body,#2D1A10)]">
                        {note.content}
                      </p>
                    )}

                    {cardDraftNoteId === note.id && (
                      <QuickCreateFlashcardBox
                        initialFront={note.highlightText || note.title || note.target?.title || ''}
                        initialBack={note.content || note.highlightText || ''}
                        sourceNoteId={note.id}
                        onSaved={() => {
                          setSavedCardNoteIds((prev) => new Set([...prev, note.id]));
                          setCardDraftNoteId(null);
                        }}
                        onCancel={() => setCardDraftNoteId(null)}
                      />
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border,#E2D5B8)]/50 pt-2.5 text-xs">
                      <span className="truncate font-semibold text-[var(--text-muted,#7A6B57)]">
                        {note.targetType === NOTE_TARGET_TYPE.LESSON ? 'Bài học: ' : 'Bài viết: '}
                        <span className="text-[var(--text-body,#2D1A10)]">
                          {note.target?.title ?? `#${note.targetId.slice(0, 8)}`}
                        </span>
                      </span>
                      {href && (
                        <Link
                          href={href}
                          className="inline-flex shrink-0 items-center gap-1 font-bold text-[var(--primary,#7A1F24)] hover:underline"
                        >
                          Mở bài gốc <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
