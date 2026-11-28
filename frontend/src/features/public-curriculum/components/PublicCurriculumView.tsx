'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Layers,
  ListTree,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import type { LearningPathItem } from '@/services/entities/learner.service';
import { LearningPathType } from '@/constants/enums';
import {
  PUBLIC_CURRICULUM_ROUTES,
  usePublicCurriculumFacade,
} from '../facades/usePublicCurriculumFacade';
import {
  HUB_BUTTON_BASE,
  HubBadge,
  HubButton,
  HubSyllabus,
  chapterLabel,
  pathLessons,
  pathTopics,
} from './hub/HubReaderParts';
import { useLessonProgress } from './hub/LessonQuizIslands';
import { LearningJourneyRoadmap } from './journey/LearningJourneyRoadmap';
import {
  CurriculumNavigationTabs,
  CURRICULUM_TAB_KEYS,
  type CurriculumTabKey,
} from './CurriculumNavigationTabs';
import { CurriculumFilterBar } from './CurriculumFilterBar';
import { CurriculumTrackRoadmap } from './CurriculumTrackRoadmap';
import { CurriculumTrackShowcase } from './CurriculumTrackShowcase';
import { groupPathsIntoTracks } from '../utils/curriculum-track.util';
import { CurriculumThematicGrid } from './CurriculumThematicGrid';
import { CurriculumLibraryBrowser } from './CurriculumLibraryBrowser';

interface PublicCurriculumViewProps {
  initialPathId?: string | null;
}

function CompactCurriculumHeader({
  stats,
  completedCount,
  cta,
}: {
  stats: { totalPaths: number; totalChapters: number; totalLessons: number };
  completedCount: number;
  cta: { href: string; label: string };
}) {
  return (
    <section className="flex flex-col justify-between gap-4 border-b border-lh-line/80 pb-6 md:flex-row md:items-center">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-lh-brand">
          <Sparkles className="size-3.5 text-lh-gold" /> Chương trình học lịch sử
        </div>
        <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-lh-ink sm:text-3xl">
          Lộ trình &amp; Chuyên đề Lịch sử
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-lh-line bg-lh-surface px-3 py-1.5 text-xs text-lh-ink shadow-xs">
          <Layers className="size-3.5 text-amber-600" />
          <span className="font-bold">{stats.totalPaths}</span>
          <span className="text-lh-muted">lộ trình</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-lh-line bg-lh-surface px-3 py-1.5 text-xs text-lh-ink shadow-xs">
          <ListTree className="size-3.5 text-sky-600" />
          <span className="font-bold">{stats.totalChapters}</span>
          <span className="text-lh-muted">chương</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-lh-line bg-lh-surface px-3 py-1.5 text-xs text-lh-ink shadow-xs">
          <BookOpen className="size-3.5 text-emerald-600" />
          <span className="font-bold">{stats.totalLessons}</span>
          <span className="text-lh-muted">bài học</span>
        </div>
        {completedCount > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 shadow-xs">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span className="font-bold">{completedCount}</span>
            <span className="text-emerald-700">đã học</span>
          </div>
        )}
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 rounded-xl bg-lh-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-lh-brand/90"
        >
          {cta.label} <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

export function PublicCurriculumView({ initialPathId }: PublicCurriculumViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlPathId = searchParams.get('pathId') || initialPathId;
  const urlTabRaw = searchParams.get('tab');
  const validTabs = Object.values(CURRICULUM_TAB_KEYS) as string[];
  const initialTab: CurriculumTabKey =
    urlTabRaw && validTabs.includes(urlTabRaw)
      ? (urlTabRaw as CurriculumTabKey)
      : CURRICULUM_TAB_KEYS.CORE_TRACKS;

  const updateQueryParams = useCallback(
    (updates: { tab?: CurriculumTabKey; trackId?: string | null; pathId?: string | null }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.tab !== undefined) {
        next.set('tab', updates.tab);
      }
      if (updates.trackId !== undefined) {
        if (updates.trackId) next.set('trackId', updates.trackId);
        else next.delete('trackId');
      }
      if (updates.pathId !== undefined) {
        if (updates.pathId) next.set('pathId', updates.pathId);
        else next.delete('pathId');
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const {
    filteredPaths,
    activePath,
    filteredLibraryLessons,
    availableTags,
    topics,
    activeTopics,
    selectedTopicId,
    setSelectedTopicId,
    loading,
    error,
    stats,
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
  } = usePublicCurriculumFacade(urlPathId);

  const {
    completedIds,
    isCompleted,
    isEnrolled,
    isQuizPassed,
    bestQuizScores,
    enroll,
    loggedIn,
  } = useLessonProgress();
  const [activeTab, setActiveTab] = useState<CurriculumTabKey>(initialTab);
  const [detailViewMode, setDetailViewMode] = useState<'journey' | 'syllabus'>('journey');

  const handleTabChange = (nextTab: CurriculumTabKey) => {
    setActiveTab(nextTab);
    updateQueryParams({ tab: nextTab });
  };

  // Phân loại lộ trình theo loại (Tiến trình niên biểu vs Chuyên đề)
  const coreTracks = useMemo(
    () => filteredPaths.filter((p) => p.pathType === LearningPathType.CHRONOLOGICAL),
    [filteredPaths],
  );

  // Phân nhóm các lộ trình niên biểu thành các Mạch tiến trình
  const trackGroups = useMemo(
    () => groupPathsIntoTracks(coreTracks, { isCompleted, isEnrolled }),
    [coreTracks, isCompleted, isEnrolled],
  );

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    () => searchParams.get('trackId'),
  );

  // Tự động gán selectedTrackId mặc định (track đầu tiên hoặc track chứa activePath)
  useEffect(() => {
    if (!trackGroups.length) {
      setSelectedTrackId(null);
      return;
    }
    if (!selectedTrackId || !trackGroups.some((t) => t.id === selectedTrackId)) {
      const matched = activePath
        ? trackGroups.find((t) => t.paths.some((p) => p.id === activePath.id))
        : null;
      setSelectedTrackId(matched ? matched.id : trackGroups[0].id);
    }
  }, [trackGroups, activePath, selectedTrackId]);

  const activeTrack = useMemo(
    () => trackGroups.find((t) => t.id === selectedTrackId) || trackGroups[0] || null,
    [trackGroups, selectedTrackId],
  );

  const activeTrackPaths = useMemo(
    () => activeTrack?.paths || [],
    [activeTrack],
  );

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    const targetTrack = trackGroups.find((t) => t.id === trackId);
    let nextPathId: string | null = activePath?.id ?? null;
    if (targetTrack && targetTrack.paths.length > 0) {
      if (!activePath || !targetTrack.paths.some((p) => p.id === activePath.id)) {
        handleSelectPath(targetTrack.paths[0]);
        nextPathId = targetTrack.paths[0].id;
      }
    }
    updateQueryParams({ tab: CURRICULUM_TAB_KEYS.CORE_TRACKS, trackId, pathId: nextPathId });
    requestAnimationFrame(() => {
      document.getElementById('truc-thoi-gian-mach')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const thematicCourses = useMemo(
    () => filteredPaths.filter((p) => p.pathType === LearningPathType.THEMATIC),
    [filteredPaths],
  );

  const cta = useMemo(() => {
    if (!loggedIn) {
      return {
        href: `/dang-ky?redirect=${encodeURIComponent(PUBLIC_CURRICULUM_ROUTES.CURRICULUM)}`,
        label: 'Đăng ký tài khoản',
      };
    }
    const enrolledPaths = filteredPaths.filter((p) => isEnrolled(p.id));
    const path =
      enrolledPaths.find((p) => pathLessons(p).some((l) => isCompleted(l.id))) ??
      enrolledPaths[0];
    const lessons = path ? pathLessons(path) : [];
    const next = lessons.find((l) => !isCompleted(l.id)) ?? lessons[0] ?? null;

    return path && next
      ? { href: PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(next.slug, path.id), label: 'Học tiếp ngay' }
      : { href: '#danh-muc-khoa-hoc', label: 'Bắt đầu lộ trình học' };
  }, [filteredPaths, isCompleted, isEnrolled, loggedIn]);

  const onSelectPathAndScroll = (path: LearningPathItem) => {
    handleSelectPath(path);
    updateQueryParams({ pathId: path.id });
    requestAnimationFrame(() => {
      document.getElementById('de-cuong-chi-tiet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="lh-app">
      <Header activeTab="curriculum" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        <CompactCurriculumHeader stats={stats} completedCount={completedIds?.length || 0} cta={cta} />

        {/* Khu vực Tabs điều hướng & Thanh lọc thông minh */}
        <section id="danh-muc-khoa-hoc" className="scroll-mt-24">
          <div className="space-y-5">
            {/* Thanh Tabs chọn phân khu */}
            <CurriculumNavigationTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              counts={{
                coreTracks: coreTracks.length,
                thematic: thematicCourses.length,
                library: filteredLibraryLessons.length,
              }}
            />

            {/* Bộ lọc từ khóa & chọn chủ đề tinh gọn */}
            <CurriculumFilterBar
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
              topics={activeTopics}
              selectedTopicId={selectedTopicId}
              onSelectTopic={setSelectedTopicId}
              resultCount={
                activeTab === CURRICULUM_TAB_KEYS.CORE_TRACKS
                  ? coreTracks.length
                  : activeTab === CURRICULUM_TAB_KEYS.THEMATIC
                    ? thematicCourses.length
                    : filteredLibraryLessons.length
              }
            />
          </div>

          {/* Nội dung tương ứng theo Tab */}
          <div className="mt-8">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl border border-lh-line bg-lh-surface-2" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-lh-red/30 bg-lh-red-soft p-8 text-center">
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-red">{error}</p>
                <HubButton variant="outline" className="mt-4" onClick={reload}>
                  <RotateCcw className="size-4" /> Thử lại
                </HubButton>
              </div>
            ) : activeTab === CURRICULUM_TAB_KEYS.CORE_TRACKS ? (
              <div className="space-y-6">
                {/* Bộ Thẻ Chọn Mạch Nổi Bật (Track Showcase Cards) */}
                <CurriculumTrackShowcase
                  tracks={trackGroups}
                  selectedTrackId={activeTrack?.id || null}
                  onSelectTrack={handleSelectTrack}
                />

                {/* Trục lộ trình niên biểu của mạch đang chọn */}
                <div id="truc-thoi-gian-mach" className="scroll-mt-24 pt-2">
                  <CurriculumTrackRoadmap
                    paths={activeTrackPaths}
                    selectedPathId={activePath?.id || null}
                    selectedTopicId={selectedTopicId}
                    onSelectPath={onSelectPathAndScroll}
                    isCompleted={isCompleted}
                    isEnrolled={isEnrolled}
                    isQuizPassed={isQuizPassed}
                    bestQuizScores={bestQuizScores}
                    onEnroll={enroll}
                    loggedIn={loggedIn}
                  />
                </div>
              </div>
            ) : activeTab === CURRICULUM_TAB_KEYS.THEMATIC ? (
              <CurriculumThematicGrid
                paths={thematicCourses}
                selectedPathId={activePath?.id || null}
                selectedTopicId={selectedTopicId}
                onSelectPath={onSelectPathAndScroll}
                isCompleted={isCompleted}
                isEnrolled={isEnrolled}
                onEnroll={enroll}
                loggedIn={loggedIn}
              />
            ) : (
              <CurriculumLibraryBrowser
                lessons={filteredLibraryLessons}
                availableTags={availableTags}
                selectedTagId={selectedTagId}
                onSelectTag={setSelectedTagId}
                isCompleted={isCompleted}
              />
            )}
          </div>
        </section>

        {/* Khung Chi tiết Lộ trình được chọn (Bản đồ hành trình & Đề cương) */}
        {activePath && (activeTab === CURRICULUM_TAB_KEYS.CORE_TRACKS || activeTab === CURRICULUM_TAB_KEYS.THEMATIC) && (
          <section id="de-cuong-chi-tiet" className="scroll-mt-24 border-t border-lh-line py-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-lh-brand">
                    Đang xem chi tiết khóa học
                  </span>
                  {pathTopics(activePath).map((top) => (
                    <span
                      key={top.id}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                        selectedTopicId === top.id
                          ? 'border-lh-brand bg-lh-brand/10 text-lh-brand font-semibold'
                          : 'border-lh-line bg-lh-surface text-lh-muted'
                      }`}
                    >
                      #{top.name}
                    </span>
                  ))}
                </div>
                <h2 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-ink sm:text-3xl">
                  {activePath.title}
                </h2>
                <p className="mt-1 text-sm text-lh-muted">
                  {detailViewMode === 'journey'
                    ? 'Bản đồ hành trình học tập trực quan từng bài học'
                    : 'Đề cương chi tiết các chương và bài đọc'}
                </p>
              </div>

              {/* Toggle Bản đồ vs Đề cương */}
              <div className="inline-flex rounded-xl border border-lh-line bg-lh-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setDetailViewMode('journey')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    detailViewMode === 'journey'
                      ? 'bg-lh-surface text-lh-brand shadow-sm'
                      : 'text-lh-muted hover:text-lh-ink'
                  }`}
                >
                  <Compass className="size-3.5" /> Bản đồ hành trình
                </button>
                <button
                  type="button"
                  onClick={() => setDetailViewMode('syllabus')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    detailViewMode === 'syllabus'
                      ? 'bg-lh-surface text-lh-brand shadow-sm'
                      : 'text-lh-muted hover:text-lh-ink'
                  }`}
                >
                  <ListTree className="size-3.5" /> Đề cương chi tiết
                </button>
              </div>
            </div>

            {detailViewMode === 'journey' ? (
              <div className="mt-8">
                <LearningJourneyRoadmap
                  path={activePath}
                  isCompleted={isCompleted}
                  isQuizPassed={isQuizPassed}
                  bestQuizScores={bestQuizScores}
                  isEnrolled={isEnrolled(activePath.id)}
                  onEnroll={() => enroll(activePath.id)}
                />
              </div>
            ) : (
              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div>
                  {activePath.description && (
                    <p className="max-w-prose text-sm leading-7 text-lh-muted">
                      {activePath.description}
                    </p>
                  )}
                  <div className="mt-6 divide-y divide-lh-line rounded-2xl border border-lh-line bg-lh-surface">
                    {(activePath.chapters || []).map((chapter, i) => (
                      <div key={chapter.id} className="p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-lh-gold">
                          Chương {i + 1}
                        </div>
                        <div className="mt-1 font-semibold text-lh-ink">
                          {chapterLabel(chapter.title)}
                        </div>
                        {chapter.description && (
                          <p className="mt-1 max-w-prose text-sm leading-6 text-lh-muted">
                            {chapter.description}
                          </p>
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
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
