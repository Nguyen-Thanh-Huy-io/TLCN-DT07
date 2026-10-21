'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import {
  DEFAULT_COVER_IMAGES,
  FILTER_TAB_OPTIONS,
  PATH_TYPE_META,
  PUBLIC_CURRICULUM_ROUTES,
  PUBLIC_DIFFICULTY_META,
} from '../constants/public-curriculum.constants';
import { usePublicCurriculumFacade } from '../facades/usePublicCurriculumFacade';

interface PublicCurriculumViewProps {
  initialPathId?: string | null;
}

export function PublicCurriculumView({ initialPathId }: PublicCurriculumViewProps) {
  const {
    filteredPaths,
    activePath,
    filteredLibraryLessons,
    availableTags,
    loading,
    error,
    stats,
    filterType,
    setFilterType,
    searchKeyword,
    setSearchKeyword,
    selectedTagId,
    setSelectedTagId,
    expandedChapterIds,
    handleSelectPath,
    toggleChapterAccordion,
    expandAllChapters,
    collapseAllChapters,
    reload,
  } = usePublicCurriculumFacade(initialPathId);

  const firstLessonOfActivePath = React.useMemo(() => {
    if (!activePath?.chapters) return null;
    for (const ch of activePath.chapters) {
      if (ch.chapterLessons && ch.chapterLessons.length > 0) {
        const first = ch.chapterLessons[0]?.lesson;
        if (first?.slug) return first;
      }
    }
    return null;
  }, [activePath]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.75),transparent_28%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)] px-3 py-4 md:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden border border-[#d7c5a1] bg-[rgba(249,245,236,0.92)] shadow-[0_24px_65px_rgba(80,47,17,0.08)]">
        <Header activeTab="curriculum" />

        <main className="p-4 md:p-8 lg:p-10">
          {/* 1. HERO BANNER CHƯƠNG TRÌNH HỌC */}
          <section className="relative overflow-hidden rounded-[18px] border border-[#d7c5a1] bg-[#f8f3e8] shadow-sm">
            <img
              src="/assets/citadel.jpg"
              alt="Chương trình học Lịch sử Việt Nam"
              className="absolute inset-y-0 right-0 hidden h-full w-[55%] object-cover object-center opacity-85 lg:block"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#faf7ef_0%,#faf7ef_46%,rgba(250,247,239,0.92)_62%,rgba(250,247,239,0.18)_100%)]" />

            <div className="relative z-10 w-full p-6 md:p-8 lg:max-w-[62%] lg:p-10">
              <nav
                className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#83766d]"
                aria-label="Đường dẫn"
              >
                <Link href="/" className="hover:text-[#6e181b]">
                  Trang chủ
                </Link>
                <span>›</span>
                <strong className="font-semibold text-[#6e181b]">
                  Chương trình học Lịch sử
                </strong>
              </nav>

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6e181b]">
                Hệ thống Lộ trình & Chuyên đề Sử Việt
              </p>
              <h1 className="m-0 font-[family-name:var(--font-heading)] text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.1] tracking-[-0.03em] text-[#3a1012]">
                Khám phá Chương trình học Lịch sử Việt Nam
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#504640] md:text-base">
                Học lịch sử có hệ thống qua các lộ trình theo tiến trình niên biểu hoặc đào sâu từng chuyên đề quân sự, văn hóa, danh nhân — kết hợp bài giảng đa phương tiện và đề ôn tập tương tác.
              </p>

              {/* Thống kê nhanh */}
              <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-lg">
                <div className="rounded-xl border border-[#d7c5a1] bg-white/80 px-3.5 py-2.5 backdrop-blur-xs">
                  <div className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#6e181b]">
                    {stats.totalPaths}
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[#6a5f53]">
                    Lộ trình học
                  </div>
                </div>
                <div className="rounded-xl border border-[#d7c5a1] bg-white/80 px-3.5 py-2.5 backdrop-blur-xs">
                  <div className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#8a6828]">
                    {stats.totalChapters}
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[#6a5f53]">
                    Chương sử
                  </div>
                </div>
                <div className="rounded-xl border border-[#d7c5a1] bg-white/80 px-3.5 py-2.5 backdrop-blur-xs">
                  <div className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#231b15]">
                    {stats.totalLessons}
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[#6a5f53]">
                    Bài học chuyên sâu
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. THANH TÌM KIẾM & BỘ LỌC LOẠI LỘ TRÌNH */}
          <section className="mt-7 rounded-[16px] border border-[#dcc39c] bg-[#f7f1e5] p-4 shadow-2xs md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Tabs lọc loại lộ trình */}
              <div
                className="flex flex-wrap items-center gap-2"
                role="tablist"
                aria-label="Lọc loại lộ trình học"
              >
                {FILTER_TAB_OPTIONS.map((tab) => {
                  const isActive = filterType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setFilterType(tab.id)}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition md:text-sm ${
                        isActive
                          ? 'border-[#6e181b] bg-[#6e181b] text-[#fffbeb] shadow-xs'
                          : 'border-[#d7c5a1] bg-[#fffdf9] text-[#302622] hover:bg-[#efe6d5]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative w-full lg:max-w-md">
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a5f53]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4.2 4.2" />
                </svg>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm lộ trình, chương học hoặc tên bài học..."
                  className="h-10 w-full rounded-full border border-[#d7c5a1] bg-[#fffdf9] pl-10 pr-9 text-sm text-[#231b15] outline-none placeholder:text-[#83766d] focus:border-[#6e181b] focus:ring-2 focus:ring-[#c5a059]/25"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#83766d] hover:text-[#6e181b]"
                    aria-label="Xóa từ khóa"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 3. TRẠNG THÁI ĐANG TẢI / LỖI */}
          {loading ? (
            <div className="mt-8 rounded-[18px] border border-[#d7c5a1] bg-[#f8f3e8] p-12 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#6e181b] border-t-transparent" />
              <p className="font-[family-name:var(--font-heading)] text-lg text-[#501013]">
                Đang tải cấu trúc Chương trình học...
              </p>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-[18px] border border-red-300 bg-red-50/90 p-8 text-center">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-4 rounded-lg bg-[#6e181b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#501013]"
              >
                Thử tải lại
              </button>
            </div>
          ) : (
            <>
              {/* 4. BỐ CỤC CHÍNH: DANH SÁCH LỘ TRÌNH (TRÁI) & CHI TIẾT CHƯƠNG BÀI (PHẢI) */}
              <div className="mt-8 grid gap-7 xl:grid-cols-[380px_1fr]">
                {/* CỘT TRÁI: DANH SÁCH CÁC LỘ TRÌNH HỌC */}
                <aside className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#d7c5a1] pb-2.5">
                    <h2 className="font-[family-name:var(--font-heading)] flex items-center gap-2 text-xl font-bold text-[#3a1012]">
                      <span className="inline-block h-3 w-3 rotate-45 bg-[#6e181b]" />
                      Danh sách Lộ trình ({filteredPaths.length})
                    </h2>
                  </div>

                  {filteredPaths.length === 0 ? (
                    <div className="rounded-2xl border border-[#d7c5a1] bg-[#fcfaf5] p-6 text-center text-sm text-[#6a5f53]">
                      Không tìm thấy lộ trình học nào khớp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {filteredPaths.map((path, idx) => {
                        const isSelected = activePath?.id === path.id;
                        const typeMeta =
                          PATH_TYPE_META[path.pathType] ||
                          PATH_TYPE_META.CHRONOLOGICAL;
                        const chapterCount = path.chapters?.length || 0;
                        const lessonCount = (path.chapters || []).reduce(
                          (sum, ch) => sum + (ch.chapterLessons?.length || 0),
                          0,
                        );
                        const coverImg =
                          path.coverImageUrl ||
                          DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length];

                        return (
                          <button
                            key={path.id}
                            type="button"
                            onClick={() => handleSelectPath(path)}
                            className={`group w-full cursor-pointer overflow-hidden rounded-[16px] border text-left transition duration-200 ${
                              isSelected
                                ? 'border-[#6e181b] bg-[#fffdf8] ring-2 ring-[#6e181b]/20 shadow-[0_14px_30px_rgba(110,24,27,0.12)]'
                                : 'border-[#d7c5a1] bg-[#fcfaf5] hover:-translate-y-0.5 hover:border-[#b9975b] hover:bg-[#fffdf9]'
                            }`}
                          >
                            <div className="flex gap-3.5 p-3.5">
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#e3d3b3]">
                                <img
                                  src={coverImg}
                                  alt={path.title}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeMeta.badgeBg} ${typeMeta.badgeText} ${typeMeta.badgeBorder}`}
                                  >
                                    {typeMeta.label}
                                  </span>
                                  {path.isSequential && (
                                    <span className="rounded-full border border-[#d7c5a1] bg-[#f5ecda] px-2 py-0.5 text-[10px] font-medium text-[#6a5f53]">
                                      Học tuần tự
                                    </span>
                                  )}
                                </div>

                                <h3 className="mt-1.5 font-[family-name:var(--font-heading)] text-lg font-bold leading-snug text-[#231b15] group-hover:text-[#6e181b]">
                                  {path.title}
                                </h3>

                                <div className="mt-2 flex items-center gap-3 text-xs text-[#6a5f53]">
                                  <span>📚 {chapterCount} chương</span>
                                  <span>•</span>
                                  <span>📖 {lessonCount} bài học</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </aside>

                {/* CỘT PHẢI: CHI TIẾT LỘ TRÌNH ĐANG CHỌN & CẤU TRÚC CHƯƠNG - BÀI HỌC */}
                <section className="min-w-0">
                  {activePath ? (
                    <div className="rounded-[18px] border border-[#d7c5a1] bg-[#f8f3e8] p-5 shadow-xs md:p-7">
                      {/* Header thông tin Lộ trình đang chọn */}
                      <div className="flex flex-col justify-between gap-4 border-b border-[#d7c5a1] pb-5 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${
                                PATH_TYPE_META[activePath.pathType]?.badgeBg
                              } ${PATH_TYPE_META[activePath.pathType]?.badgeText} ${
                                PATH_TYPE_META[activePath.pathType]?.badgeBorder
                              }`}
                            >
                              {PATH_TYPE_META[activePath.pathType]?.label}
                            </span>
                            <span className="text-xs text-[#776b61]">
                              • {activePath.chapters?.length || 0} chương học
                            </span>
                          </div>

                          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#501013] md:text-3xl">
                            {activePath.title}
                          </h2>
                          {activePath.description && (
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#504640]">
                              {activePath.description}
                            </p>
                          )}
                        </div>

                        {firstLessonOfActivePath && (
                          <Link
                            href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(
                              firstLessonOfActivePath.slug,
                              activePath.id,
                            )}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#6e181b] bg-[#6e181b] px-5 py-3 text-xs font-semibold text-[#fffbeb] shadow-xs transition hover:bg-[#501013] md:text-sm"
                          >
                            <span>Bắt đầu học lộ trình này</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        )}
                      </div>

                      {/* Thanh công cụ Mở rộng / Thu gọn tất cả các chương */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#302622]">
                          Nội dung chương trình ({activePath.chapters?.length || 0} chương)
                        </h3>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={expandAllChapters}
                            className="cursor-pointer rounded-lg border border-[#d7c5a1] bg-white/80 px-3 py-1.5 font-medium text-[#504640] hover:bg-[#efe6d5]"
                          >
                            Mở tất cả chương
                          </button>
                          <button
                            type="button"
                            onClick={collapseAllChapters}
                            className="cursor-pointer rounded-lg border border-[#d7c5a1] bg-white/80 px-3 py-1.5 font-medium text-[#504640] hover:bg-[#efe6d5]"
                          >
                            Thu gọn
                          </button>
                        </div>
                      </div>

                      {/* Danh sách các Chương (Accordion) */}
                      <div className="mt-4 space-y-4">
                        {(activePath.chapters || []).length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#d7c5a1] bg-white/60 p-8 text-center text-sm text-[#6a5f53]">
                            Lộ trình này hiện chưa có chương học nào.
                          </div>
                        ) : (
                          (activePath.chapters || []).map((chapter, chapterIdx) => {
                            const isExpanded = expandedChapterIds.includes(
                              chapter.id,
                            );
                            const chapterLessons = chapter.chapterLessons || [];

                            return (
                              <article
                                key={chapter.id}
                                className="overflow-hidden rounded-[14px] border border-[#d7c5a1] bg-[#fffdf9] shadow-2xs"
                              >
                                {/* Tiêu đề Chương */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleChapterAccordion(chapter.id)
                                  }
                                  aria-expanded={isExpanded}
                                  className="flex w-full cursor-pointer items-center justify-between gap-4 bg-[#f5eedf] px-5 py-4 text-left transition hover:bg-[#efe5d0]"
                                >
                                  <div className="flex items-start gap-3.5">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6e181b] font-[family-name:var(--font-heading)] text-sm font-bold text-[#fffbeb]">
                                      {chapterIdx + 1}
                                    </span>
                                    <div>
                                      <h4 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#231b15]">
                                        {chapter.title}
                                      </h4>
                                      {chapter.description && (
                                        <p className="mt-0.5 text-xs text-[#6a5f53]">
                                          {chapter.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-3">
                                    <span className="rounded-full border border-[#d7c5a1] bg-white/80 px-3 py-1 text-xs font-semibold text-[#6e181b]">
                                      {chapterLessons.length} bài học
                                    </span>
                                    <span
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d7c5a1] bg-white text-xs text-[#501013] transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                      aria-hidden="true"
                                    >
                                      ▼
                                    </span>
                                  </div>
                                </button>

                                {/* Danh sách Bài học trong Chương */}
                                {isExpanded && (
                                  <div className="divide-y divide-[#eee3ce] px-5 py-2">
                                    {chapterLessons.length === 0 ? (
                                      <p className="py-4 text-xs italic text-[#83766d]">
                                        Chưa có bài học nào trong chương này.
                                      </p>
                                    ) : (
                                      chapterLessons.map((cl, lessonIdx) => {
                                        const lesson = cl.lesson;
                                        if (!lesson) return null;
                                        const diffMeta =
                                          (lesson.difficulty &&
                                            PUBLIC_DIFFICULTY_META[
                                              lesson.difficulty
                                            ]) ||
                                          null;
                                        const tags = (
                                          lesson.lessonTags || []
                                        )
                                          .map((lt) => lt.tag)
                                          .filter(Boolean);

                                        return (
                                          <Link
                                            key={cl.id}
                                            href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(
                                              lesson.slug,
                                              activePath.id,
                                            )}
                                            className="group flex flex-col justify-between gap-3 py-3.5 transition hover:bg-[#faf5ea] sm:flex-row sm:items-center sm:px-2 rounded-lg"
                                          >
                                            <div className="flex items-start gap-3.5 min-w-0">
                                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d7c5a1] bg-[#f8f3e8] text-xs font-semibold text-[#6e181b] group-hover:bg-[#6e181b] group-hover:text-white">
                                                {lessonIdx + 1}
                                              </span>
                                              <div className="min-w-0 flex-1">
                                                <div className="font-[family-name:var(--font-heading)] text-base font-semibold text-[#231b15] group-hover:text-[#6e181b]">
                                                  {lesson.title}
                                                </div>
                                                {lesson.description && (
                                                  <p className="mt-0.5 line-clamp-1 text-xs text-[#6a5f53]">
                                                    {lesson.description}
                                                  </p>
                                                )}
                                                {tags.length > 0 && (
                                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    {tags.map((tag) =>
                                                      tag ? (
                                                        <span
                                                          key={tag.id}
                                                          className="rounded border border-[#e3d3b3] bg-[#f6efe2] px-2 py-0.5 text-[10px] font-medium text-[#681717]"
                                                        >
                                                          #{tag.name}
                                                        </span>
                                                      ) : null,
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
                                              {diffMeta && (
                                                <span
                                                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${diffMeta.className}`}
                                                >
                                                  {diffMeta.label}
                                                </span>
                                              )}
                                              <span className="inline-flex items-center gap-1 rounded-lg border border-[#d7c5a1] bg-[#f8f3e8] px-3 py-1.5 text-xs font-semibold text-[#6e181b] transition group-hover:border-[#6e181b] group-hover:bg-[#6e181b] group-hover:text-white">
                                                <span>Đọc bài</span>
                                                <span aria-hidden="true">→</span>
                                              </span>
                                            </div>
                                          </Link>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </article>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[18px] border border-[#d7c5a1] bg-[#f8f3e8] p-10 text-center text-sm text-[#6a5f53]">
                      Hãy chọn một lộ trình học ở cột bên trái để xem chi tiết các chương và bài học.
                    </div>
                  )}
                </section>
              </div>

              {/* 5. THƯ VIỆN BÀI HỌC & KHÁM PHÁ THEO THẺ TAG */}
              <section className="mt-12 border-t border-[#d7c5a1] pt-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e181b]">
                      Kho tri thức mở
                    </p>
                    <h2 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#231b15] md:text-3xl">
                      Thư viện Bài học Lịch sử ({filteredLibraryLessons.length})
                    </h2>
                  </div>

                  {/* Bộ lọc theo Tag gắn với bài học */}
                  {availableTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTagId(null)}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selectedTagId === null
                            ? 'border-[#6e181b] bg-[#6e181b] text-white'
                            : 'border-[#d7c5a1] bg-[#fffdf9] text-[#504640] hover:bg-[#efe6d5]'
                        }`}
                      >
                        Tất cả chủ đề
                      </button>
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setSelectedTagId(
                              selectedTagId === tag.id ? null : tag.id,
                            )
                          }
                          className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                            selectedTagId === tag.id
                              ? 'border-[#6e181b] bg-[#6e181b] text-white'
                              : 'border-[#d7c5a1] bg-[#fffdf9] text-[#504640] hover:bg-[#efe6d5]'
                          }`}
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLibraryLessons.map((lesson, idx) => {
                    const thumb =
                      lesson.thumbnailUrl ||
                      DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length];
                    const diffMeta =
                      (lesson.difficulty &&
                        PUBLIC_DIFFICULTY_META[lesson.difficulty]) ||
                      null;
                    const tags =
                      lesson.tags ||
                      (lesson.lessonTags || [])
                        .map((lt) => lt.tag)
                        .filter(Boolean);

                    return (
                      <Link
                        key={lesson.id}
                        href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(
                          lesson.slug,
                        )}
                        className="group flex flex-col justify-between overflow-hidden rounded-[18px] border border-[#d7c5a1] bg-[#fffdf8] shadow-[0_8px_22px_rgba(80,52,19,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#6e181b] hover:shadow-[0_16px_32px_rgba(80,52,19,0.1)]"
                      >
                        <div>
                          <div className="relative h-44 overflow-hidden border-b border-[#e3d3b3]">
                            <img
                              src={thumb}
                              alt={lesson.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
                              <span>
                                ⏱ ~{lesson.estimatedReadMinutes || 3} phút đọc
                              </span>
                              {diffMeta && (
                                <span className="rounded-full border border-white/40 bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-xs">
                                  {diffMeta.label}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold leading-snug text-[#231b15] group-hover:text-[#6e181b]">
                              {lesson.title}
                            </h3>
                            {lesson.description && (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#504640]">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#eee3ce] px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 2).map((tag) =>
                              tag ? (
                                <span
                                  key={tag.id}
                                  className="rounded border border-[#e3d3b3] bg-[#f6efe2] px-2 py-0.5 text-[10px] font-medium text-[#681717]"
                                >
                                  #{tag.name}
                                </span>
                              ) : null,
                            )}
                          </div>
                          <span className="text-xs font-semibold text-[#6e181b] group-hover:translate-x-0.5 transition-transform">
                            Vào học →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
