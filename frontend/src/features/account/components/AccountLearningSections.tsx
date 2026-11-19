'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Bookmark, ChevronRight, Compass, ExternalLink, Sparkles, X } from 'lucide-react';
import { ContentStatus } from '@/constants/enums';
import { extractErrorMessage } from '@/services/api';
import { LearningPathApiService, type LearningPathItem } from '@/services/entities/learning-path.service';
import { PUBLIC_CURRICULUM_ROUTES, DEFAULT_COVER_IMAGES } from '@/features/public-curriculum/constants/public-curriculum.constants';
import { useLessonProgress } from '@/features/public-curriculum/components/hub/useLessonReaderHooks';
import { pathLessons } from '@/features/public-curriculum/components/hub/HubReaderParts';
import { RemoteImage } from '@/components/common/RemoteImage';
import { AccountCard, Notice, type NoticeState } from './AccountSections';

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
  );
}

/* ==========================================================================
   3. TƯ LIỆU ĐÃ LƯU (SAVED BOOKMARKS SECTION)
   ========================================================================== */
export function SavedBookmarksSection() {
  const [savedArticles] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('hisgo:saved-articles');
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  const [savedTimeline] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('hisgo.saved');
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  const totalSaved = savedArticles.length + savedTimeline.length;

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
      {totalSaved === 0 ? (
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
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/dong-thoi-gian"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
            >
              Khám phá Dòng thời gian <ExternalLink size={13} />
            </Link>
            <Link
              href="/bai-viet"
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
                <Bookmark size={16} className="text-[var(--gold,#B8893F)]" />
                Dấu mốc & Sự kiện đã lưu ({savedTimeline.length})
              </h4>
              <Link href="/dong-thoi-gian" className="text-xs font-bold text-[var(--primary,#7A1F24)] hover:underline flex items-center gap-1">
                Xem trên dòng thời gian <ChevronRight size={13} />
              </Link>
            </div>
            {savedTimeline.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedTimeline.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-semibold text-[var(--primary,#7A1F24)]"
                  >
                    <span>Mục #{id.slice(0, 8)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted,#7A6B57)]">Chưa có sự kiện dòng thời gian nào.</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border,#E2D5B8)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--text-body,#2D1A10)] flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--primary,#7A1F24)]" />
                Bài viết & Chuyên đề đã lưu ({savedArticles.length})
              </h4>
              <Link href="/bai-viet" className="text-xs font-bold text-[var(--primary,#7A1F24)] hover:underline flex items-center gap-1">
                Mở kho bài viết <ChevronRight size={13} />
              </Link>
            </div>
            {savedArticles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedArticles.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-3 py-1.5 text-xs font-semibold text-[var(--primary,#7A1F24)]"
                  >
                    <span>Bài viết #{id.slice(0, 8)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted,#7A6B57)]">Chưa có bài viết nào được lưu.</p>
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
