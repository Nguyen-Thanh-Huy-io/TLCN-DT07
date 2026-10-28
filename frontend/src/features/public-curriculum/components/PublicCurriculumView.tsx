'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers,
  ListTree,
  LogIn,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { LearningPathItem } from '@/services/entities/learning-path.service';
import { LearningPathType } from '@/constants/enums';
import {
  DEFAULT_COVER_IMAGES,
  FILTER_TAB_OPTIONS,
  PATH_TYPE_META,
  PUBLIC_CURRICULUM_ROUTES,
  PUBLIC_DIFFICULTY_META,
} from '../constants/public-curriculum.constants';
import { usePublicCurriculumFacade } from '../facades/usePublicCurriculumFacade';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubBadge, HubButton, HubProgress } from './hub/HubUi';
import { HubSyllabus, chapterLabel, pathLessons } from './hub/HubSyllabus';
import { useLessonProgress } from './hub/useLessonProgress';

interface PublicCurriculumViewProps {
  initialPathId?: string | null;
}

function nextLessonOf(path: LearningPathItem, isCompleted: (id: string) => boolean) {
  const lessons = pathLessons(path);
  return lessons.find((l) => !isCompleted(l.id)) ?? lessons[0] ?? null;
}

function CurriculumStatsHeader({
  stats,
  completedCount,
  cta,
}: {
  stats: { totalPaths: number; totalChapters: number; totalLessons: number };
  completedCount: number;
  cta: { href: string; label: string };
}) {
  const tiles = [
    { icon: Layers, value: stats.totalPaths, label: 'lộ trình', color: 'text-amber-200' },
    { icon: ListTree, value: stats.totalChapters, label: 'chương', color: 'text-sky-200' },
    { icon: BookOpen, value: stats.totalLessons, label: 'bài học', color: 'text-emerald-200' },
    { icon: CheckCircle2, value: completedCount, label: 'bài đã học', color: 'text-yellow-200' },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-lh-brand p-6 text-white shadow-xl shadow-lh-brand/10 sm:p-8">
      <div className="lh-paper-pattern absolute inset-0 opacity-15" />
      <div className="relative grid gap-7 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <HubBadge tone="gold">
            <Sparkles className="size-3" /> Chương trình học lịch sử
          </HubBadge>
          <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight sm:text-4xl">
            Học sử theo lộ trình, từng chương một.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
            Mỗi lộ trình gồm các chương và bài đọc có đề ôn tập cuối bài. Đăng ký miễn phí một lộ trình để đọc bài và lưu tiến độ vào tài khoản của bạn.
          </p>
          <Link href={cta.href} className={`${HUB_BUTTON_BASE} mt-5 bg-white text-lh-brand hover:bg-white/90`}>
            {cta.label} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-4 lg:grid-cols-2">
          {tiles.map((item) => (
            <div key={item.label} className="border-l-2 border-white/30 py-1 pl-3.5 sm:pl-4">
              <div className="flex items-center gap-2">
                <item.icon className={`size-5 ${item.color}`} />
                <div className="text-xl font-extrabold sm:text-2xl">{item.value}</div>
              </div>
              <div className="mt-1 text-sm font-medium text-white/90">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CourseCard({
  path,
  index,
  selected,
  isCompleted,
  onShowSyllabus,
  loggedIn,
  enrolled,
  onEnroll,
}: {
  path: LearningPathItem;
  index: number;
  selected: boolean;
  isCompleted: (id: string) => boolean;
  onShowSyllabus: () => void;
  loggedIn: boolean;
  enrolled: boolean;
  onEnroll: () => Promise<void>;
}) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollError(null);
    try {
      await onEnroll();
    } catch (err) {
      setEnrollError(extractErrorMessage(err, 'Không thể đăng ký lộ trình. Vui lòng thử lại.'));
    } finally {
      setEnrolling(false);
    }
  };
  const lessons = pathLessons(path);
  const complete = lessons.filter((l) => isCompleted(l.id)).length;
  const percent = lessons.length ? Math.round((complete / lessons.length) * 100) : 0;
  const next = nextLessonOf(path, isCompleted);
  const meta = PATH_TYPE_META[path.pathType];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`group overflow-hidden rounded-2xl border bg-lh-surface shadow-lh-card transition-shadow hover:shadow-lh-card-hover ${
        selected ? 'border-lh-brand/50 ring-2 ring-lh-brand/15' : 'border-lh-line'
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={path.coverImageUrl || DEFAULT_COVER_IMAGES[index % DEFAULT_COVER_IMAGES.length]}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <HubBadge tone={path.pathType === LearningPathType.THEMATIC ? 'gold' : 'brand'}>{meta?.label ?? path.pathType}</HubBadge>
          {path.isSequential && <HubBadge tone="neutral">Học tuần tự</HubBadge>}
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <ListTree className="size-3.5" /> {(path.chapters || []).length} chương
          <span className="text-white/75">•</span>
          <BookOpen className="size-3.5" /> {lessons.length} bài
        </div>
      </div>
      <div className="p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold leading-snug text-lh-ink">{path.title}</h2>
        {(path.description || meta?.description) && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-lh-muted">{path.description || meta?.description}</p>
        )}
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-lh-ink">
              {!enrolled ? 'Chưa đăng ký' : complete ? `Đã học ${complete}/${lessons.length} bài` : 'Đã đăng ký · chưa bắt đầu'}
            </span>
            <span className="font-bold text-lh-brand">{percent}%</span>
          </div>
          <HubProgress value={percent} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          {!next ? (
            <span className="rounded-xl bg-lh-surface-2 px-4 py-2.5 text-center text-sm text-lh-muted">
              Lộ trình chưa có bài học được xuất bản
            </span>
          ) : !loggedIn ? (
            <Link
              href={`/login?redirect=${encodeURIComponent(`${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${path.id}`)}`}
              className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}
            >
              <LogIn className="size-4" /> Đăng nhập để đăng ký học
            </Link>
          ) : !enrolled ? (
            <HubButton onClick={handleEnroll} disabled={enrolling}>
              <BookmarkPlus className="size-4" /> {enrolling ? 'Đang đăng ký...' : 'Đăng ký học (miễn phí)'}
            </HubButton>
          ) : (
            <Link
              href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, path.id)}
              className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary}`}
            >
              {complete ? 'Tiếp tục học' : 'Vào bài đầu tiên'} <ChevronRight className="size-4" />
            </Link>
          )}
          <HubButton variant={selected ? 'secondary' : 'ghost'} onClick={onShowSyllabus}>
            <ListTree className="size-4" /> Đề cương
          </HubButton>
        </div>
        {enrollError && <p className="mt-2 text-sm text-lh-red">{enrollError}</p>}
      </div>
    </motion.article>
  );
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
  const { completedIds, isCompleted, isEnrolled, enroll, loggedIn } = useLessonProgress();

  const cta = useMemo(() => {
    if (!loggedIn) return { href: `/dang-ky?redirect=${encodeURIComponent(PUBLIC_CURRICULUM_ROUTES.CURRICULUM)}`, label: 'Đăng ký tài khoản' };
    const enrolledPaths = filteredPaths.filter((p) => isEnrolled(p.id));
    const path = enrolledPaths.find((p) => pathLessons(p).some((l) => isCompleted(l.id))) ?? enrolledPaths[0];
    const next = path ? nextLessonOf(path, isCompleted) : null;
    return path && next
      ? { href: PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, path.id), label: 'Học tiếp ngay' }
      : { href: '#lo-trinh', label: 'Chọn lộ trình để bắt đầu' };
  }, [filteredPaths, isCompleted, isEnrolled, loggedIn]);

  const showSyllabus = (path: LearningPathItem) => {
    handleSelectPath(path);
    requestAnimationFrame(() => document.getElementById('de-cuong')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="lh-app">
      <Header activeTab="curriculum" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <CurriculumStatsHeader stats={stats} completedCount={completedIds.length} cta={cta} />

        <section id="lo-trinh" className="scroll-mt-24 py-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-lh-ink">Lộ trình khám phá lịch sử</h2>
              <p className="mt-2 text-sm text-lh-muted">Chương trình chọn lọc — Học theo mạch giai đoạn, sự kiện và nhân vật của dân tộc.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-lh-muted" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm lộ trình, chương, bài học..."
                className="h-11 w-full rounded-xl border border-lh-line bg-lh-surface pl-10 pr-4 text-sm text-lh-ink outline-none transition focus:border-lh-brand/50 focus:ring-2 focus:ring-lh-brand/10"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-y border-lh-line py-4">
            {FILTER_TAB_OPTIONS.map((tab) => (
              <HubButton
                key={tab.id}
                variant={filterType === tab.id ? 'secondary' : 'ghost'}
                onClick={() => setFilterType(tab.id)}
                className="px-3 py-2"
              >
                {tab.label}
              </HubButton>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-6 pt-7 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-2xl border border-lh-line bg-lh-surface-2" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-7 rounded-2xl border border-lh-red/30 bg-lh-red-soft p-8 text-center">
              <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-red">{error}</p>
              <HubButton variant="outline" className="mt-4" onClick={reload}>
                <RotateCcw className="size-4" /> Thử lại
              </HubButton>
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-6 md:grid-cols-2">
                <AnimatePresence>
                  {filteredPaths.map((path, index) => (
                    <CourseCard
                      key={path.id}
                      path={path}
                      index={index}
                      selected={activePath?.id === path.id}
                      isCompleted={isCompleted}
                      onShowSyllabus={() => showSyllabus(path)}
                      loggedIn={loggedIn}
                      enrolled={isEnrolled(path.id)}
                      onEnroll={() => enroll(path.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {!filteredPaths.length && (
                <div className="py-20 text-center">
                  <BookOpen className="mx-auto size-8 text-lh-muted" />
                  <div className="mt-3 font-[family-name:var(--font-heading)] text-xl font-bold text-lh-ink">
                    Chưa tìm thấy lộ trình phù hợp
                  </div>
                  <p className="mt-1 text-sm text-lh-muted">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                </div>
              )}
            </>
          )}
        </section>

        {activePath && (
          <section id="de-cuong" className="scroll-mt-24 border-t border-lh-line py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-lh-ink">{activePath.title}</h2>
                <p className="mt-1 text-sm text-lh-muted">Đề cương chi tiết lộ trình học tập</p>
                {activePath.description && (
                  <p className="mt-3 max-w-prose text-sm leading-7 text-lh-muted">{activePath.description}</p>
                )}
                <div className="mt-6 divide-y divide-lh-line rounded-2xl border border-lh-line bg-lh-surface">
                  {(activePath.chapters || []).map((chapter, i) => (
                    <div key={chapter.id} className="p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-lh-gold">Chương {i + 1}</div>
                      <div className="mt-1 font-semibold text-lh-ink">{chapterLabel(chapter.title)}</div>
                      {chapter.description && (
                        <p className="mt-1 max-w-prose text-sm leading-6 text-lh-muted">{chapter.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <HubButton variant="ghost" onClick={expandAllChapters}>
                    Mở tất cả
                  </HubButton>
                  <HubButton variant="ghost" onClick={collapseAllChapters}>
                    Thu gọn
                  </HubButton>
                </div>
              </div>
              <HubSyllabus
                path={activePath}
                isCompleted={isCompleted}
                openChapterIds={expandedChapterIds}
                onToggleChapter={toggleChapterAccordion}
              />
            </div>
          </section>
        )}

        {!loading && !error && (
          <section id="thu-vien" className="scroll-mt-24 border-t border-lh-line py-10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-lh-ink">
                  Thư viện bài học ({filteredLibraryLessons.length})
                </h2>
                <p className="mt-1 text-sm text-lh-muted">Kho tri thức mở với các bài đọc và tài liệu ôn tập trọng tâm</p>
              </div>
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <HubButton
                    variant={selectedTagId === null ? 'secondary' : 'ghost'}
                    className="px-3 py-1.5"
                    onClick={() => setSelectedTagId(null)}
                  >
                    Tất cả chủ đề
                  </HubButton>
                  {availableTags.map((tag) => (
                    <HubButton
                      key={tag.id}
                      variant={selectedTagId === tag.id ? 'secondary' : 'ghost'}
                      className="px-3 py-1.5"
                      onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                    >
                      #{tag.name}
                    </HubButton>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLibraryLessons.map((lesson, idx) => {
                const difficulty = lesson.difficulty ? PUBLIC_DIFFICULTY_META[lesson.difficulty] : null;
                const tags = lesson.tags;
                return (
                  <Link
                    key={lesson.id}
                    href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(lesson.slug)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-lh-card transition hover:-translate-y-1 hover:shadow-lh-card-hover"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={lesson.thumbnailUrl || DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {isCompleted(lesson.id) && (
                        <span className="absolute right-3 top-3">
                          <HubBadge tone="brand">
                            <CheckCircle2 className="size-3" /> Đã học
                          </HubBadge>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-lh-muted">
                        <BookOpen className="size-3.5" /> ~{lesson.estimatedReadMinutes || 3} phút đọc
                        {difficulty && <HubBadge tone="gold">{difficulty.label}</HubBadge>}
                      </div>
                      <h3 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold leading-snug text-lh-ink group-hover:text-lh-brand">
                        {lesson.title}
                      </h3>
                      {lesson.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-lh-muted">{lesson.description}</p>}
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 2).map((tag) =>
                            tag ? (
                              <span key={tag.id} className="rounded-full bg-lh-surface-2 px-2.5 py-1 text-xs font-semibold text-lh-ink/80">
                                #{tag.name}
                              </span>
                            ) : null,
                          )}
                        </div>
                        <span className="text-sm font-semibold text-lh-brand">Vào học →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {!filteredLibraryLessons.length && (
              <p className="py-12 text-center text-sm text-lh-muted">Không có bài học nào khớp với bộ lọc hiện tại.</p>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
