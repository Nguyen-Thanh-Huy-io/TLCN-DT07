'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import '@/components/entity-detail/entity-reader.css';
import {
  buildLessonTocAndHtml,
  type LessonTocEntry,
  normalizeContentToBlocks,
} from '@/features/lessons/utils/lesson-toc.util';
import { extractErrorMessage } from '@/services/api';
import {
  LearnerApiService,
  type LibraryLesson,
  NOT_ENROLLED_CODE,
} from '@/services/entities/learner.service';
import { PUBLIC_ROUTES, type PublicArticleSummary } from '@/services/public/public-content.service';
import { sanitizeRichHtml } from '@/utils/common';
import { ReaderSourceKind } from '../constants/mindmap.constants';
import { MindmapApiService, type MindmapArticleRef } from '../services/mindmap.service';

export interface ReadableStudyMaterial {
  kind: ReaderSourceKind;
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  compiledHtml: string;
  tocItems: LessonTocEntry[];
  publicHref: string;
  articleRef?: MindmapArticleRef;
}

export interface RequestedReaderSource {
  kind: ReaderSourceKind;
  slug: string;
  seq: number;
}

const TAB_ACTIVE_CLS = 'bg-white text-indigo-700 shadow-2xs';
const TAB_IDLE_CLS = 'text-slate-600 hover:text-slate-900';

async function loadArticleMaterial(slug: string): Promise<ReadableStudyMaterial> {
  const art = await MindmapApiService.getArticleDetail(slug);
  if (!art) throw new Error('Không tìm thấy bài viết này.');
  const { blocks } = normalizeContentToBlocks(art.contentBlocks);
  const compiled = buildLessonTocAndHtml(blocks);
  return {
    kind: ReaderSourceKind.ARTICLE,
    id: art.id,
    slug: art.slug,
    title: art.title,
    subtitle: art.dateLabel || art.category?.name || null,
    coverImageUrl: art.coverImageUrl,
    summary: art.summary,
    compiledHtml: compiled.html,
    tocItems: compiled.tocItems,
    publicHref: PUBLIC_ROUTES.ARTICLE(art.slug),
    articleRef: {
      id: art.id,
      slug: art.slug,
      title: art.title,
      coverImageUrl: art.coverImageUrl,
    },
  };
}

async function loadLessonMaterial(slug: string): Promise<ReadableStudyMaterial> {
  const { lesson } = await LearnerApiService.getLesson(slug);
  const { blocks } = normalizeContentToBlocks(lesson.content ?? lesson.contentRichText);
  const compiled = buildLessonTocAndHtml(blocks);
  return {
    kind: ReaderSourceKind.LESSON,
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    subtitle: `${lesson.estimatedReadMinutes} phút đọc`,
    coverImageUrl: lesson.thumbnailUrl,
    summary: lesson.description,
    compiledHtml: compiled.html,
    tocItems: compiled.tocItems,
    publicHref: PUBLIC_ROUTES.LESSON(lesson.slug),
  };
}

const READER_LOADERS: Record<ReaderSourceKind, (slug: string) => Promise<ReadableStudyMaterial>> = {
  [ReaderSourceKind.ARTICLE]: loadArticleMaterial,
  [ReaderSourceKind.LESSON]: loadLessonMaterial,
};

function makeBranchTitleFromExcerpt(raw: string): string {
  const firstLine = raw.replace(/\s+/g, ' ').trim();
  if (firstLine.length <= 56) return firstLine;
  return `${firstLine.slice(0, 53).trimEnd()}…`;
}

function MaterialBrowserList({
  kind,
  query,
  loading,
  articles,
  lessons,
  attachedArticles,
  onQueryChange,
  onOpenItem,
}: {
  kind: ReaderSourceKind;
  query: string;
  loading: boolean;
  articles: PublicArticleSummary[];
  lessons: LibraryLesson[];
  attachedArticles: MindmapArticleRef[];
  onQueryChange: (q: string) => void;
  onOpenItem: (kind: ReaderSourceKind, slug: string) => void;
}) {
  const qLower = query.trim().toLocaleLowerCase('vi');
  const filteredLessons = lessons.filter(
    (l) => !qLower || l.title.toLocaleLowerCase('vi').includes(qLower) || (l.description ?? '').toLocaleLowerCase('vi').includes(qLower),
  );

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={kind === ReaderSourceKind.ARTICLE ? 'Tìm bài viết lịch sử…' : 'Tìm bài học chương trình…'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
        />
      </div>

      {kind === ReaderSourceKind.ARTICLE && attachedArticles.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-600">
            Tư liệu đã gắn trong sơ đồ ({attachedArticles.length})
          </div>
          {attachedArticles.map((art) => (
            <button
              key={art.id}
              type="button"
              onClick={() => onOpenItem(ReaderSourceKind.ARTICLE, art.slug)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-left transition hover:border-indigo-300 cursor-pointer"
            >
              <span className="truncate font-semibold text-indigo-900">{art.title}</span>
              <ChevronRight size={13} className="shrink-0 text-indigo-500" />
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Đang tải tài liệu…
        </div>
      ) : kind === ReaderSourceKind.ARTICLE ? (
        <ul className="space-y-2">
          {articles.map((art) => (
            <li key={art.id}>
              <button
                type="button"
                onClick={() => onOpenItem(ReaderSourceKind.ARTICLE, art.slug)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-indigo-300 hover:shadow-2xs cursor-pointer"
              >
                <FileText size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 line-clamp-2">{art.title}</div>
                  {art.summary && <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{art.summary}</p>}
                </div>
              </button>
            </li>
          ))}
          {articles.length === 0 && (
            <li className="py-8 text-center text-slate-400">Không tìm thấy bài viết phù hợp.</li>
          )}
        </ul>
      ) : (
        <ul className="space-y-2">
          {filteredLessons.map((les) => (
            <li key={les.id}>
              <button
                type="button"
                onClick={() => onOpenItem(ReaderSourceKind.LESSON, les.slug)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-indigo-300 hover:shadow-2xs cursor-pointer"
              >
                <GraduationCap size={15} className="mt-0.5 shrink-0 text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 line-clamp-2">{les.title}</div>
                  <div className="mt-0.5 text-[10.5px] text-slate-500">
                    {les.topic?.name ? `${les.topic.name} · ` : ''}
                    {les.estimatedReadMinutes} phút đọc
                  </div>
                </div>
              </button>
            </li>
          ))}
          {filteredLessons.length === 0 && (
            <li className="py-8 text-center text-slate-400">Không tìm thấy bài học phù hợp.</li>
          )}
        </ul>
      )}
    </div>
  );
}

function MaterialReaderBody({
  material,
  selectedNodeTitle,
  onSelectExcerpt,
  onCreateBranch,
}: {
  material: ReadableStudyMaterial;
  selectedNodeTitle?: string;
  onSelectExcerpt: (text: string) => void;
  onCreateBranch: (payload: { title: string; note?: string; articleRef?: MindmapArticleRef }) => void;
}) {
  const [tocOpen, setTocOpen] = useState(true);

  const captureSelection = () => {
    const selected = window.getSelection()?.toString().trim() ?? '';
    if (selected.length >= 2) {
      onSelectExcerpt(selected.slice(0, 500));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-800" onMouseUp={captureSelection}>
      {material.subtitle && (
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
          {material.subtitle}
        </div>
      )}
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold leading-snug text-slate-900">
        {material.title}
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onCreateBranch({
              title: makeBranchTitleFromExcerpt(material.title),
              note: material.summary ?? undefined,
              articleRef: material.articleRef,
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
          title={`Thêm làm nhánh con của "${selectedNodeTitle || 'Gốc'}"`}
        >
          <Plus size={12} /> Tạo nhánh từ bài này
        </button>
        <span className="text-[11px] text-slate-400">
          Mẹo: Bôi đen đoạn chữ bất kỳ bên dưới để đưa vào Mindmap
        </span>
      </div>

      {material.tocItems.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs">
          <button
            type="button"
            onClick={() => setTocOpen((v) => !v)}
            className="flex w-full items-center justify-between font-bold text-slate-700 cursor-pointer"
          >
            <span>Đề mục chính ({material.tocItems.length})</span>
            <span className="text-[10.5px] font-semibold text-indigo-600">{tocOpen ? 'Thu gọn' : 'Mở'}</span>
          </button>
          {tocOpen && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {material.tocItems.map((item) => (
                <li key={item.id} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-white">
                  <button
                    type="button"
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="min-w-0 flex-1 truncate text-left text-[11.5px] font-medium text-slate-700 hover:text-indigo-700 cursor-pointer"
                    style={{ paddingLeft: `${Math.max(0, item.level - 1) * 10}px` }}
                  >
                    {item.text}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateBranch({ title: makeBranchTitleFromExcerpt(item.text), articleRef: material.articleRef })}
                    className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white cursor-pointer"
                  >
                    + Nhánh
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {material.summary && (
        <p className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 text-xs italic leading-relaxed text-slate-700">
          {material.summary}
        </p>
      )}

      {material.compiledHtml ? (
        <div
          className="ue-article-content mt-4 space-y-3 text-[13.5px] leading-relaxed text-slate-800"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(material.compiledHtml) }}
        />
      ) : (
        <p className="mt-6 text-center text-xs text-slate-400">
          Bài viết này chưa có nội dung khối chi tiết.
        </p>
      )}
    </div>
  );
}

function LockedLessonNotice({ slug }: { slug: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs">
      <div className="grid size-11 place-items-center rounded-full bg-amber-50 text-amber-600">
        <Lock size={20} />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">Bài học thuộc lộ trình chưa ghi danh</h3>
      <p className="mt-1 max-w-xs text-slate-500">
        Hãy mở trang bài học để đăng ký lộ trình miễn phí, sau đó quay lại đây đọc và vẽ sơ đồ.
      </p>
      <Link
        href={PUBLIC_ROUTES.LESSON(slug)}
        target="_blank"
        className="mt-3 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 font-bold text-white hover:bg-indigo-700"
      >
        Mở trang Bài học <ExternalLink size={12} />
      </Link>
    </div>
  );
}

/** Ngăn đọc Bài viết / Bài học chia đôi màn hình ngay trong Mindmap Studio để vừa xem vừa vẽ. */
export function MindmapReferenceDrawer({
  requestedSource,
  attachedArticles,
  selectedNodeTitle,
  onCreateBranchFromText,
  onAppendToSelectedNote,
  onClose,
}: {
  requestedSource: RequestedReaderSource | null;
  attachedArticles: MindmapArticleRef[];
  selectedNodeTitle?: string;
  onCreateBranchFromText: (payload: { title: string; note?: string; articleRef?: MindmapArticleRef }) => void;
  onAppendToSelectedNote: (text: string, articleRef?: MindmapArticleRef) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<ReaderSourceKind>(ReaderSourceKind.ARTICLE);
  const [query, setQuery] = useState('');
  const [wide, setWide] = useState(false);

  const [articles, setArticles] = useState<PublicArticleSummary[]>([]);
  const [lessons, setLessons] = useState<LibraryLesson[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [material, setMaterial] = useState<ReadableStudyMaterial | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [lockedSlug, setLockedSlug] = useState<string | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState('');

  const openMaterial = useCallback(async (targetKind: ReaderSourceKind, slug: string) => {
    setKind(targetKind);
    setDetailLoading(true);
    setDetailError(null);
    setLockedSlug(null);
    setSelectedExcerpt('');
    try {
      const loaded = await READER_LOADERS[targetKind](slug);
      setMaterial(loaded);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { code?: string } } };
      if (axiosErr?.response?.status === 403 && axiosErr?.response?.data?.code === NOT_ENROLLED_CODE) {
        setLockedSlug(slug);
      } else {
        setDetailError(extractErrorMessage(err, 'Không tải được nội dung tài liệu.'));
      }
      setMaterial(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requestedSource) return;
    const timer = setTimeout(() => {
      void openMaterial(requestedSource.kind, requestedSource.slug);
    }, 0);
    return () => clearTimeout(timer);
  }, [openMaterial, requestedSource]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      setListLoading(true);
      const loader =
        kind === ReaderSourceKind.ARTICLE
          ? MindmapApiService.searchArticles(query).then((rows) => {
              if (alive) setArticles(rows);
            })
          : LearnerApiService.getLibrary().then((rows) => {
              if (alive) setLessons(rows);
            });
      void loader.finally(() => {
        if (alive) setListLoading(false);
      });
    }, 180);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [kind, query]);

  const hasDetailState = Boolean(material || lockedSlug || detailError);

  const renderDrawerContent = () => {
    if (detailLoading) {
      return (
        <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 size={16} className="animate-spin text-indigo-600" /> Đang tải nội dung…
        </div>
      );
    }
    if (lockedSlug) return <LockedLessonNotice slug={lockedSlug} />;
    if (detailError) {
      return (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {detailError}
        </div>
      );
    }
    if (material) {
      return (
        <MaterialReaderBody
          material={material}
          selectedNodeTitle={selectedNodeTitle}
          onSelectExcerpt={setSelectedExcerpt}
          onCreateBranch={onCreateBranchFromText}
        />
      );
    }
    return (
      <MaterialBrowserList
        kind={kind}
        query={query}
        loading={listLoading}
        articles={articles}
        lessons={lessons}
        attachedArticles={attachedArticles}
        onQueryChange={setQuery}
        onOpenItem={(k, slug) => void openMaterial(k, slug)}
      />
    );
  };

  return (
    <aside
      aria-label="Ngăn đọc Bài viết và Bài học"
      className={`flex h-full shrink-0 flex-col border-r border-slate-200 bg-white shadow-md transition-all print:hidden ${
        wide ? 'w-[54%] max-w-[760px]' : 'w-[390px] xl:w-[440px]'
      }`}
    >
      {/* Header ngăn đọc */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
        {hasDetailState ? (
          <button
            type="button"
            onClick={() => {
              setMaterial(null);
              setLockedSlug(null);
              setDetailError(null);
              setSelectedExcerpt('');
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            <ArrowLeft size={13} /> Danh sách
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setKind(ReaderSourceKind.ARTICLE)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 cursor-pointer ${
                kind === ReaderSourceKind.ARTICLE ? TAB_ACTIVE_CLS : TAB_IDLE_CLS
              }`}
            >
              <BookOpen size={12} /> Bài viết
            </button>
            <button
              type="button"
              onClick={() => setKind(ReaderSourceKind.LESSON)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 cursor-pointer ${
                kind === ReaderSourceKind.LESSON ? TAB_ACTIVE_CLS : TAB_IDLE_CLS
              }`}
            >
              <GraduationCap size={12} /> Bài học
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {material && (
            <Link
              href={material.publicHref}
              target="_blank"
              title="Mở trang đầy đủ trong tab mới"
              className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setWide((w) => !w)}
            title={wide ? 'Thu gọn ngăn đọc' : 'Mở rộng ngăn đọc'}
            className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            {wide ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Đóng ngăn tài liệu"
            className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Thân ngăn đọc */}
      {renderDrawerContent()}

      {/* Thanh hành động khi người dùng bôi đen chữ trong bài viết/bài học */}
      {selectedExcerpt && material && (
        <div className="border-t border-indigo-200 bg-indigo-50/95 p-3 text-xs shadow-inner">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-indigo-900">
              <Sparkles size={12} className="text-indigo-600" /> Đoạn đã chọn:
            </span>
            <button
              type="button"
              onClick={() => setSelectedExcerpt('')}
              className="rounded p-0.5 text-indigo-400 hover:text-indigo-800 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
          <p className="mb-2.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] italic text-slate-700 line-clamp-2">
            &ldquo;{selectedExcerpt}&rdquo;
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onCreateBranchFromText({
                  title: makeBranchTitleFromExcerpt(selectedExcerpt),
                  note: selectedExcerpt,
                  articleRef: material.articleRef,
                });
                setSelectedExcerpt('');
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Plus size={12} /> Tạo nhánh mới
            </button>
            <button
              type="button"
              disabled={!selectedNodeTitle}
              onClick={() => {
                onAppendToSelectedNote(selectedExcerpt, material.articleRef);
                setSelectedExcerpt('');
              }}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-indigo-300 bg-white px-2.5 py-1.5 font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-45 cursor-pointer"
            >
              + Vào ghi chú
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
