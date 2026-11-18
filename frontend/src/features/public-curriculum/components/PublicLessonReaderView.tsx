'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { PUBLIC_CURRICULUM_ROUTES } from '../constants/public-curriculum.constants';
import {
  LessonAccessState,
  usePublicLessonReaderFacade,
} from '../facades/usePublicLessonReaderFacade';
import {
  HUB_BUTTON_BASE,
  HUB_BUTTON_VARIANTS,
  HubButton,
} from './hub/HubReaderParts';
import { useLessonProgress } from './hub/useLessonReaderHooks';
import { useLessonRelated, type RelatedEntities } from './hub/HubReaderParts';
import { useLessonMedia } from './hub/useLessonReaderHooks';
import { useNoteFacade } from '@/features/notes/facades/useNoteFacade';
import { NoteReaderLayer } from '@/features/notes/components/NoteReaderLayer';
import '@/components/entity-detail/entity-reader.css';
import {
  ReadingAidsPanel,
  type ReadingEntity,
} from '@/features/reading-aids/components/ReadingAidsPanel';
import { useReadingControls } from '@/features/reading-aids/hooks/useReadingControls';
import { resolveCategoryKind } from '@/services/public/article-kind';
import { DiscussionApiService } from '@/services/entities/discussion.service';

/** Tiêu đề câu hỏi gửi lên Hỏi đáp = dòng đầu của ghi chú (giống ô đăng câu hỏi ở phần Hỏi đáp). */
const DISCUSSION_TITLE_MAX_LENGTH = 80;
import { PUBLIC_ROUTES, fetchCategories, type PublicCategory } from '@/services/public/public-content.service';
import { NOTE_TARGET_TYPE } from '@/features/notes/services/note.service';
import { LessonMobileSyllabusDrawer } from './reader/LessonReaderMainLayout';
import { LessonReaderLoadingSkeleton } from './reader/LessonReaderMainLayout';
import { LessonReaderNotFound } from './reader/LessonReaderMainLayout';
import { LessonGateSection } from './reader/LessonReaderMainLayout';
import { LessonReaderMainLayout } from './reader/LessonReaderMainLayout';

const SYLLABUS_STORAGE_KEY = 'hisgo.hub.syllabus.open';
const SYLLABUS_STORAGE_CLOSED = 'closed';

function resolveReaderLayoutColumns(
  hasLearningPath: boolean,
  syllabusOpen: boolean,
  hasRightSidebar: boolean,
): string {
  if (!hasLearningPath) {
    return hasRightSidebar ? 'xl:grid-cols-[minmax(0,1fr)_17rem]' : 'grid-cols-1';
  }
  if (syllabusOpen) {
    return hasRightSidebar
      ? 'lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_17rem]'
      : 'lg:grid-cols-[17rem_minmax(0,1fr)]';
  }
  return hasRightSidebar
    ? 'lg:grid-cols-[3rem_minmax(0,1fr)] xl:grid-cols-[3rem_minmax(0,1fr)_17rem]'
    : 'lg:grid-cols-[3rem_minmax(0,1fr)]';
}

function SyllabusColumn({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <div className="mb-2 flex items-center justify-between">
          {open && (
            <span className="text-xs font-bold uppercase tracking-wider text-lh-gold">
              Đề cương lộ trình
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-lh-muted hover:bg-lh-surface-2 hover:text-lh-ink ${
              !open ? 'mx-auto' : ''
            }`}
            title={open ? 'Thu gọn đề cương để bài đọc rộng hơn' : 'Mở rộng đề cương'}
            aria-label={open ? 'Thu gọn đề cương' : 'Mở rộng đề cương'}
          >
            {open ? (
              <>
                <ChevronLeft className="size-3.5" /> Thu gọn
              </>
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>
        {open ? (
          <div className="max-h-[calc(100vh-8.5rem)] overflow-y-auto pr-1">
            {children}
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-72 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-lh-line bg-lh-surface text-xs font-bold text-lh-muted transition hover:border-lh-brand/40 hover:text-lh-brand"
            title="Mở đề cương"
          >
            <ChevronRight className="size-4" />
            <span className="[writing-mode:vertical-rl] tracking-wider">ĐỀ CƯƠNG</span>
          </button>
        )}
      </div>
    </aside>
  );
}

interface PublicLessonReaderViewProps {
  slug: string;
  pathId?: string | null;
}

export function PublicLessonReaderView({ slug, pathId }: PublicLessonReaderViewProps) {
  const {
    access,
    lockedPreview,
    reload,
    lesson,
    learningPath,
    loading,
    error,
    tocItems,
    compiledHtml,
    resourceLinks,
    quizBlocks,
    navigationContext,
  } = usePublicLessonReaderFacade(slug, pathId);

  const noteFacade = useNoteFacade(NOTE_TARGET_TYPE.LESSON, lesson?.id || '');
  const { isCompleted, markCompleted, enroll } = useLessonProgress();
  const [mobileSyllabus, setMobileSyllabus] = useState(false);
  const { prefs, focusMode, setFocusMode, readingControls } = useReadingControls();

  const [syllabusOpen, setSyllabusOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(SYLLABUS_STORAGE_KEY) !== SYLLABUS_STORAGE_CLOSED;
    } catch {
      return true;
    }
  });

  const contentRef = useRef<HTMLDivElement>(null);
  useLessonMedia(contentRef, compiledHtml);
  const router = useRouter();

  const toggleSyllabus = () =>
    setSyllabusOpen((open) => {
      try {
        localStorage.setItem(SYLLABUS_STORAGE_KEY, open ? 'closed' : 'open');
      } catch {
        // Bỏ qua: chỉ là tiện ích nhớ trạng thái.
      }
      return !open;
    });

  const hasToc = Boolean(tocItems && tocItems.length >= 2);
  const { related, hasContent: hasRelated } = useLessonRelated(compiledHtml || '');
  const hasRightSidebar = hasToc || hasRelated;
  const readingEntities = useLessonReadingEntities(related);
  const readerColumns = resolveReaderLayoutColumns(Boolean(learningPath), syllabusOpen, hasRightSidebar);

  const { prevLesson, nextLesson, flatLessons, currentIndex, currentChapter } = navigationContext;
  const lessonHref = (s: string) => PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(s, learningPath?.id);
  const backHref = learningPath
    ? `${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${learningPath.id}`
    : PUBLIC_CURRICULUM_ROUTES.CURRICULUM;

  const completeAndContinue = async () => {
    if (!lesson) return;
    await markCompleted(lesson.id);
    if (nextLesson) router.push(lessonHref(nextLesson.slug));
  };

  const done = lesson ? isCompleted(lesson.id) : false;

  const renderMainContent = () => {
    if (loading) {
      return <LessonReaderLoadingSkeleton />;
    }
    if (access !== LessonAccessState.GRANTED) {
      return (
        <LessonGateSection
          access={access as Exclude<LessonAccessState, LessonAccessState.GRANTED>}
          learningPath={learningPath}
          syllabusOpen={syllabusOpen}
          onToggleSyllabus={toggleSyllabus}
          isCompleted={isCompleted}
          lockedPreview={lockedPreview}
          onEnroll={enroll}
          onReload={reload}
          SyllabusColumnComponent={SyllabusColumn}
        />
      );
    }
    if (error || !lesson) {
      return <LessonReaderNotFound error={error} />;
    }
    return (
      <LessonReaderMainLayout
        readerColumns={readerColumns}
        learningPath={learningPath}
        syllabusOpen={syllabusOpen}
        onToggleSyllabus={toggleSyllabus}
        lesson={lesson}
        isCompleted={isCompleted}
        currentIndex={currentIndex}
        flatLessonsCount={flatLessons.length}
        currentChapter={currentChapter}
        done={done}
        tocItems={tocItems}
        contentRef={contentRef}
        compiledHtml={compiledHtml}
        resourceLinks={resourceLinks}
        quizBlocks={quizBlocks}
        prevLessonHref={prevLesson ? lessonHref(prevLesson.slug) : null}
        nextLesson={Boolean(nextLesson)}
        onCompleteAndContinue={completeAndContinue}
        onMarkCompleted={() => lesson && void markCompleted(lesson.id)}
        hasRightSidebar={hasRightSidebar}
        hasToc={hasToc}
        hasRelated={hasRelated}
        related={related}
        SyllabusColumnComponent={SyllabusColumn}
        focusMode={focusMode}
        prefs={prefs}
      />
    );
  };

  return (
    <div
      className={`lh-app ue-reader-theme-wrap ue-theme-${prefs.theme} ${
        focusMode ? 'ue-focus-mode-active' : ''
      } min-h-screen transition-colors duration-200`}
    >
      <Header activeTab="curriculum" />
      <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">
        {focusMode ? (
          <header className="mb-6 flex items-center justify-between border-b border-lh-line/60 pb-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-lh-gold">
                {learningPath ? learningPath.title : 'Chế độ tập trung'}
              </span>
              {currentChapter && (
                <>
                  <span className="text-lh-muted/40">•</span>
                  <span className="text-xs text-lh-muted">
                    Chương {currentChapter.index}: {currentChapter.title}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-lh-line bg-lh-surface px-3 py-1.5 text-xs font-semibold text-lh-ink shadow-sm transition hover:bg-lh-surface-2"
            >
              Thoát chế độ tập trung
            </button>
          </header>
        ) : (
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-lh-line pb-5">
            <Link href={backHref} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.ghost} -ml-3`}>
              <ArrowLeft className="size-4" /> Quay lại lộ trình
            </Link>
            {learningPath && (
              <HubButton variant="outline" className="lg:hidden" onClick={() => setMobileSyllabus(true)}>
                <Menu className="size-4" /> Nội dung
              </HubButton>
            )}
            {learningPath && (
              <div className="hidden text-right lg:block">
                <div className="max-w-sm truncate text-sm font-bold text-lh-ink">{learningPath.title}</div>
                <div className="text-xs text-lh-muted">Tiến độ lưu vào tài khoản của bạn</div>
              </div>
            )}
          </div>
        )}

        {renderMainContent()}

        <LessonMobileSyllabusDrawer
          isOpen={mobileSyllabus}
          learningPath={learningPath}
          activeLessonId={lesson?.id}
          isCompleted={isCompleted}
          onClose={() => setMobileSyllabus(false)}
        />

        {lesson && (
          <>
            <ReadingAidsPanel
              contentRef={contentRef}
              htmlTrigger={compiledHtml}
              toc={tocItems}
              entities={readingEntities}
              onSummarizeSection={(headingId, headingText) => noteFacade.setSummaryTarget({ headingId, headingText })}
              noteFacade={noteFacade}
              articleId={lesson.id || lesson.slug}
              readingControls={readingControls}
            />
            <NoteReaderLayer
              contentRef={contentRef}
              htmlTrigger={compiledHtml}
              facade={noteFacade}
              targetTitle={lesson.title}
              targetType={NOTE_TARGET_TYPE.LESSON}
              onAskCommunity={async (note) => {
                await DiscussionApiService.create({
                  targetType: NOTE_TARGET_TYPE.LESSON,
                  targetId: lesson.id,
                  learningPathId: learningPath?.id,
                  title: note.content.split('\n')[0].slice(0, DISCUSSION_TITLE_MAX_LENGTH),
                  content: note.highlightText ? `> ${note.highlightText}\n\n${note.content}` : note.content,
                });
              }}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** Bài được nhắc trong bài học → Nhân vật / Địa danh / Sự kiện; loại bài suy từ chuyên mục (kế thừa chuyên mục cha). */
function useLessonReadingEntities(related: RelatedEntities): ReadingEntity[] {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      // Không tải được chuyên mục thì các bài không phân được loại, bảng chỉ còn mục lục / chú thích.
      .catch(() => setCategories([]));
  }, []);
  return useMemo(
    () =>
      (related?.groups ?? [])
        .flatMap((group) => group.items)
        .map((article) => ({
          id: article.id,
          name: article.title,
          href: PUBLIC_ROUTES.ARTICLE(article.slug),
          kind: resolveCategoryKind(categories, article.category?.id),
          note: article.dateLabel,
          summary: article.summary,
        })),
    [related, categories],
  );
}
