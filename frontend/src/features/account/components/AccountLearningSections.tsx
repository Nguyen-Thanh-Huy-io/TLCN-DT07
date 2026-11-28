'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Bookmark, ChevronRight, Compass, ExternalLink, Sparkles, StickyNote, Trash2, X } from 'lucide-react';
import { ContentStatus } from '@/constants/enums';
import api, { extractErrorMessage } from '@/services/api';
import type { PublicArticleSummary, PublicTimeline } from '@/services/public/public-content.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { LearningPathApiService, type LearningPathItem } from '@/services/entities/learner.service';
import { PUBLIC_CURRICULUM_ROUTES, DEFAULT_COVER_IMAGES } from '@/features/public-curriculum/facades/usePublicCurriculumFacade';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/LessonQuizIslands';
import { pathLessons } from '@/features/public-curriculum/components/hub/HubReaderParts';
import { RemoteImage } from '@/components/common/CommonUi';
import { SavedMaterialKind } from '@/features/saved-materials/constants/saved-material.constants';
import {
  removeSavedTimelineNode,
  toggleSavedMaterial,
  useSavedMaterialsSnapshot,
} from '@/features/saved-materials/services/saved-material.service';
import { AccountCard, Notice, type NoticeState } from './AccountSections';
import { SavedNotesPanel } from './SavedNotesPanel';

/** Tab "Học tập" và "Tư liệu đã lưu" của trang tài khoản. */
export function LearningSection() {
  const { enrolledPathIds, isCompleted, unenroll, completedIds, ready } = useLessonProgress();
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    LearningPathApiService.getLearningPaths()
      .then((all) => setPaths((Array.isArray(all) ? all : []).filter((p) => p.status === ContentStatus.PUBLISHED)))
      .catch(() => setPaths([]));
  }, []);

  const enrolled = paths.filter((p) => enrolledPathIds.includes(p.id));

  const leave = async (path: LearningPathItem) => {
    try {
      await unenroll(path.id);
      setConfirmId(null);
      setNotice({ tone: 'ok', text: `Đã hủy đăng ký lộ trình "${path.title}". Tiến độ học tập vẫn được bảo lưu an toàn.` });
    } catch (err) {
      setNotice({ tone: 'error', text: extractErrorMessage(err, 'Không hủy được đăng ký.') });
    }
  };

  return (
    <div className="space-y-6">
    <AccountCard
      id="hoc-tap"
      eyebrow="Khóa học sử học"
      title="Lộ trình của tôi"
      action={
        <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-bold text-[var(--primary,#7A1F24)]">
          <Sparkles size={14} className="text-[var(--gold,#B8893F)]" />
          <span>{enrolled.length} lộ trình</span>
          <span>·</span>
          <span>{completedIds.length} bài hoàn thành</span>
        </div>
      }
    >
      {!ready ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#EFE7D3]" />
      ) : enrolled.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] p-10 text-center bg-white/40">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
            <Compass size={28} />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
            Chưa tham gia lộ trình lịch sử nào
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)] max-w-md mx-auto">
            Khám phá chương trình học theo triều đại và thời kỳ để bắt đầu hành trình khai phá di sản Đại Việt.
          </p>
          <Link
            href={PUBLIC_CURRICULUM_ROUTES.CURRICULUM}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition"
          >
            Khám phá chương trình học ngay <ChevronRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrolled.map((path, index) => {
            const lessons = pathLessons(path);
            const done = lessons.filter((l) => isCompleted(l.id)).length;
            const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
            const next = lessons.find((l) => !isCompleted(l.id)) ?? lessons[0];
            return (
              <article
                key={path.id}
                className="group relative grid gap-4 rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-4 transition-all duration-200 hover:border-[var(--gold,#B8893F)] hover:shadow-md sm:grid-cols-[10rem_minmax(0,1fr)]"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <RemoteImage
                    src={path.coverImageUrl || DEFAULT_COVER_IMAGES[index % DEFAULT_COVER_IMAGES.length]}
                    alt=""
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-full"
                  />
                  <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-[#F5EEDC] backdrop-blur-xs">
                    {percent}% Xong
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)] group-hover:text-[var(--primary,#7A1F24)] transition-colors">
                      {path.title}
                    </h3>
                    <div className="mt-3 mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-muted,#7A6B57)] flex items-center gap-1">
                        <BookOpen size={13} className="text-[var(--gold,#B8893F)]" />
                        {done} / {lessons.length} bài đã hoàn tất
                      </span>
                      <span className="font-extrabold text-[var(--primary,#7A1F24)]">{percent}%</span>
                    </div>
                    {/* Progress Bar Vàng kim */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE0CB]">
                      <div
                        className="h-full bg-gradient-to-r from-[#B8893F] to-[#7A1F24] transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border,#E2D5B8)]/40 pt-3">
                    {next && (
                      <Link
                        href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, path.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
                      >
                        {done === lessons.length ? 'Ôn tập lại' : done ? 'Tiếp tục bài học' : 'Bắt đầu học'}
                        <ChevronRight size={14} />
                      </Link>
                    )}
                    {confirmId === path.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--primary,#7A1F24)] font-semibold">Hủy lộ trình?</span>
                        <button
                          type="button"
                          onClick={() => leave(path)}
                          className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                        >
                          Xác nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 transition"
                        >
                          Không
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(path.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted,#7A6B57)] hover:text-red-700 transition"
                      >
                        <X size={13} /> Hủy đăng ký
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Notice notice={notice} />
    </AccountCard>
    </div>
  );
}

/* ==========================================================================
   3. TƯ LIỆU ĐÃ LƯU & GHI CHÚ (SAVED BOOKMARKS + NOTES SECTION)
   ========================================================================== */
enum BookshelfSubTab {
  BOOKMARKS = 'BOOKMARKS',
  NOTES = 'NOTES',
}

export function SavedBookmarksSection({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [subTab, setSubTab] = useState<BookshelfSubTab>(BookshelfSubTab.BOOKMARKS);
  const savedSnapshot = useSavedMaterialsSnapshot();
  const savedArticles = savedSnapshot.articleIds;
  const savedTimeline = savedSnapshot.timelineNodeIds;
  const [articlesById, setArticlesById] = useState<Map<string, PublicArticleSummary>>(() => new Map());
  const [timelineNodesById, setTimelineNodesById] = useState<
    Map<string, { title: string; dateLabel: string | null; timelineSlug: string; timelineTitle: string }>
  >(() => new Map());
  const [notesCount, setNotesCount] = useState<number | null>(null);

  const savedArticlesCsv = savedArticles.join(',');

  useEffect(() => {
    let alive = true;
    if (!savedArticlesCsv) {
      void Promise.resolve().then(() => {
        if (alive) setArticlesById(new Map());
      });
    } else {
      api
        .get<{ data: PublicArticleSummary[] }>('/public/articles', {
          params: { ids: savedArticlesCsv, limit: savedArticles.length },
        })
        .then((res) => {
          if (!alive) return;
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setArticlesById(new Map(list.map((a) => [a.id, a])));
        })
        .catch(() => {});
    }

    return () => {
      alive = false;
    };
  }, [savedArticlesCsv, savedArticles.length]);

  useEffect(() => {
    let alive = true;
    api
      .get<{ data: PublicTimeline[] }>('/public/timelines')
      .then((res) => {
        if (!alive) return;
        const timelines = Array.isArray(res.data?.data) ? res.data.data : [];
        const map = new Map<string, { title: string; dateLabel: string | null; timelineSlug: string; timelineTitle: string }>();
        timelines.forEach((tl) => {
          tl.nodes?.forEach((node) => {
            map.set(node.id, {
              title: node.title,
              dateLabel: node.dateLabel,
              timelineSlug: tl.slug,
              timelineTitle: tl.title,
            });
          });
        });
        setTimelineNodesById(map);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  // Loại trùng ID đã nằm ở savedArticles (vì lưu bài viết cũng ghim luôn mốc dấu mộc tương ứng).
  const uniqueTimelineIds = useMemo(
    () => savedTimeline.filter((id) => !savedArticles.includes(id)),
    [savedTimeline, savedArticles],
  );

  const totalSaved = savedArticles.length + uniqueTimelineIds.length;

  useEffect(() => {
    onCountChange?.(totalSaved);
  }, [totalSaved, onCountChange]);

  const removeSavedId = (id: string) => {
    if (savedArticles.includes(id)) {
      void toggleSavedMaterial(SavedMaterialKind.ARTICLE, id);
    } else {
      void removeSavedTimelineNode(id);
    }
  };

  return (
    <AccountCard
      id="tu-lieu"
      icon={Bookmark}
      eyebrow="Tủ sách cá nhân"
      title="Tư liệu & Dấu mốc đã lưu"
      action={
        <span className="text-xs font-bold text-[var(--gold,#B8893F)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 rounded-xl border border-[var(--border,#E2D5B8)]">
          {totalSaved} mục đã ghim
        </span>
      }
    >
      {/* Chuyển nhanh giữa Tư liệu đã ghim và Ghi chú đã lưu */}
      <div className="mb-5 flex flex-wrap gap-2 border-b border-[var(--border,#E2D5B8)] pb-3">
        <button
          type="button"
          onClick={() => setSubTab(BookshelfSubTab.BOOKMARKS)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            subTab === BookshelfSubTab.BOOKMARKS
              ? 'border-[var(--primary,#7A1F24)] bg-[var(--primary,#7A1F24)] text-white shadow-xs'
              : 'border-[var(--border,#E2D5B8)] bg-white text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)]'
          }`}
        >
          <Bookmark size={14} /> Tư liệu đã ghim ({totalSaved})
        </button>
        <button
          type="button"
          onClick={() => setSubTab(BookshelfSubTab.NOTES)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            subTab === BookshelfSubTab.NOTES
              ? 'border-[var(--primary,#7A1F24)] bg-[var(--primary,#7A1F24)] text-white shadow-xs'
              : 'border-[var(--border,#E2D5B8)] bg-white text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)]'
          }`}
        >
          <StickyNote size={14} /> Ghi chú & Đánh dấu{notesCount !== null ? ` (${notesCount})` : ''}
        </button>
      </div>

      {subTab === BookshelfSubTab.NOTES ? (
        <SavedNotesPanel onCountChange={setNotesCount} />
      ) : totalSaved === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border,#E2D5B8)] p-10 text-center bg-white/40">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-page,#F5EEDC)] text-[var(--gold,#B8893F)]">
            <Bookmark size={26} />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--text-body,#2D1A10)]">
            Chưa lưu tư liệu nào
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)] max-w-md mx-auto">
            Khi đọc bài viết hoặc khám phá Dòng thời gian, bấm nút Lưu trên thanh công cụ để đưa tư liệu quý vào tủ sách của bạn.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={PUBLIC_ROUTES.TIMELINES}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
            >
              Khám phá Dòng thời gian <ExternalLink size={13} />
            </Link>
            <Link
              href={PUBLIC_ROUTES.ARTICLES}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-4 py-2 text-xs font-bold text-[var(--primary,#7A1F24)] hover:bg-[#F5EEDC] transition"
            >
              Kho tư liệu bài viết <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)] flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--primary,#7A1F24)]" />
                Bài viết & Chuyên đề đã lưu ({savedArticles.length})
              </h4>
              <Link href={PUBLIC_ROUTES.ARTICLES} className="text-xs font-bold text-[var(--primary,#7A1F24)] hover:underline flex items-center gap-1">
                Mở kho bài viết <ChevronRight size={13} />
              </Link>
            </div>
            {savedArticles.length > 0 ? (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {savedArticles.map((id) => {
                  const article = articlesById.get(id);
                  return (
                    <li
                      key={id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-3 transition hover:border-[var(--gold,#B8893F)]"
                    >
                      <div className="min-w-0">
                        {article ? (
                          <Link
                            href={PUBLIC_ROUTES.ARTICLE(article.slug)}
                            className="line-clamp-2 text-sm font-bold text-[var(--text-body,#2D1A10)] hover:text-[var(--primary,#7A1F24)]"
                          >
                            {article.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold text-[var(--text-body,#2D1A10)]">
                            Bài viết #{id.slice(0, 8)}
                          </span>
                        )}
                        {article && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted,#7A6B57)]">
                            {article.category?.name && <span>{article.category.name}</span>}
                            {article.dateLabel && <span>· {article.dateLabel}</span>}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSavedId(id)}
                        title="Bỏ ghim"
                        aria-label="Bỏ ghim bài viết"
                        className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted,#7A6B57)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-[var(--text-muted,#7A6B57)]">Chưa có bài viết nào được lưu.</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)] flex items-center gap-2">
                <Bookmark size={16} className="text-[var(--gold,#B8893F)]" />
                Dấu mốc & Sự kiện đã lưu ({uniqueTimelineIds.length})
              </h4>
              <Link href={PUBLIC_ROUTES.TIMELINES} className="text-xs font-bold text-[var(--primary,#7A1F24)] hover:underline flex items-center gap-1">
                Xem trên dòng thời gian <ChevronRight size={13} />
              </Link>
            </div>
            {uniqueTimelineIds.length > 0 ? (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {uniqueTimelineIds.map((id) => {
                  const node = timelineNodesById.get(id);
                  return (
                    <li
                      key={id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)]/40 p-3 transition hover:border-[var(--gold,#B8893F)]"
                    >
                      <div className="min-w-0">
                        {node ? (
                          <Link
                            href={PUBLIC_ROUTES.TIMELINE(node.timelineSlug)}
                            className="line-clamp-2 text-sm font-bold text-[var(--text-body,#2D1A10)] hover:text-[var(--primary,#7A1F24)]"
                          >
                            {node.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold text-[var(--text-body,#2D1A10)]">
                            Dấu mốc #{id.slice(0, 8)}
                          </span>
                        )}
                        {node && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted,#7A6B57)]">
                            <span>{node.timelineTitle}</span>
                            {node.dateLabel && <span>· {node.dateLabel}</span>}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSavedId(id)}
                        title="Bỏ ghim"
                        aria-label="Bỏ ghim dấu mốc"
                        className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted,#7A6B57)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-[var(--text-muted,#7A6B57)]">Chưa có sự kiện dòng thời gian nào.</p>
            )}
          </div>
        </div>
      )}
    </AccountCard>
  );
}

/* ==========================================================================
   4. BẢO MẬT & PHIÊN ĐĂNG NHẬP (SECURITY SECTION)
   ========================================================================== */
