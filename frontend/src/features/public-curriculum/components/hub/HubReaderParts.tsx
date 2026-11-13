'use client';

import Link from 'next/link';
import { useState, type ButtonHTMLAttributes, type ReactNode, useEffect, useMemo } from 'react';
import { BookmarkPlus, LockKeyhole, LogIn, UserPlus, BookOpen, Check, ChevronDown, Circle, FileText, GitCommitVertical, Link2, ListTree } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { type LearningPathItem } from '@/services/entities/learning-path.service';
import { LessonAccessState } from '../../facades/usePublicLessonReaderFacade';
import { DEFAULT_COVER_IMAGES, PUBLIC_CURRICULUM_ROUTES, PUBLIC_DIFFICULTY_META } from '../../constants/public-curriculum.constants';
import { AnimatePresence, motion } from 'framer-motion';
import { publishedChapterLessons } from '../../facades/usePublicCurriculumFacade';
import { loadPublicCatalog } from '@/features/search/search-index';
import { type SearchSource } from '@/features/search/search-index';
import { PUBLIC_ROUTES, type PublicArticleSummary } from '@/services/public/public-content.service';

// --- HubLessonGate.tsx ---
interface LessonPreview {
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
}

/** Màn hình thay cho nội dung bài khi người đọc chưa đăng nhập hoặc chưa đăng ký lộ trình. */
export function HubLessonGate({
  access,
  preview,
  learningPath,
  onEnroll,
}: {
  access: Exclude<LessonAccessState, LessonAccessState.GRANTED>;
  preview: LessonPreview | null;
  learningPath: LearningPathItem | null;
  onEnroll: (pathId: string) => Promise<void>;
}) {
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = typeof window === 'undefined' ? '/chuong-trinh-hoc' : window.location.pathname + window.location.search;

  const handleEnroll = async () => {
    if (!learningPath) return;
    setEnrolling(true);
    setError(null);
    try {
      await onEnroll(learningPath.id);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể đăng ký lộ trình. Vui lòng thử lại.'));
      setEnrolling(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-lh-card">
      <div className="relative aspect-[2.6/1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview?.thumbnailUrl || DEFAULT_COVER_IMAGES[0]} alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-lh-surface via-lh-surface/40 to-transparent" />
        <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lh-surface text-lh-brand shadow-xl">
          <LockKeyhole className="size-7" />
        </span>
      </div>
      <div className="p-6 text-center sm:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-lh-gold">Bài học trong lộ trình</div>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-lh-ink sm:text-3xl">
          {preview?.title ?? 'Bài học'}
        </h1>
        {preview?.description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-lh-muted">{preview.description}</p>}

        {access === LessonAccessState.LOGIN_REQUIRED ? (
          <>
            <p className="mx-auto mt-5 max-w-md text-sm text-lh-ink">
              Đăng nhập và đăng ký lộ trình (miễn phí) để đọc toàn bộ bài học, làm đề ôn tập và lưu tiến độ.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href={`/login?redirect=${encodeURIComponent(back)}`} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary}`}>
                <LogIn className="size-4" /> Đăng nhập
              </Link>
              <Link href={`/dang-ky?redirect=${encodeURIComponent(back)}`} className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}>
                <UserPlus className="size-4" /> Tạo tài khoản
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mx-auto mt-5 max-w-md text-sm text-lh-ink">
              Bạn chưa đăng ký lộ trình
              {learningPath ? <strong> “{learningPath.title}”</strong> : ' chứa bài học này'}. Đăng ký miễn phí để bắt đầu học.
            </p>
            {learningPath && (
              <HubButton className="mt-5" onClick={handleEnroll} disabled={enrolling}>
                <BookmarkPlus className="size-4" /> {enrolling ? 'Đang đăng ký...' : 'Đăng ký lộ trình & vào học'}
              </HubButton>
            )}
          </>
        )}
        {error && <p className="mt-3 text-sm text-lh-red">{error}</p>}
      </div>
    </section>
  );
}

// --- HubSyllabus.tsx ---
export function chapterLabel(title: string): string {
  return title.replace(/^\s*Chương\s+\d+\s*[:.\-–]\s*/i, '');
}

export function pathLessons(path: LearningPathItem) {
  return (path.chapters || []).flatMap((ch) => publishedChapterLessons(ch).map((cl) => cl.lesson));
}

export function HubSyllabus({
  path,
  activeLessonId,
  isCompleted,
  onNavigate,
  openChapterIds,
  onToggleChapter,
}: {
  path: LearningPathItem;
  activeLessonId?: string;
  isCompleted: (lessonId: string) => boolean;
  onNavigate?: () => void;
  /** Controlled accordion (catalog page); omit to let the syllabus manage it. */
  openChapterIds?: string[];
  onToggleChapter?: (chapterId: string) => void;
}) {
  const [localOpen, setLocalOpen] = useState<string[]>(() => (path.chapters || []).map((c) => c.id));
  const open = openChapterIds ?? localOpen;
  const toggle =
    onToggleChapter ??
    ((id: string) => setLocalOpen((items) => (items.includes(id) ? items.filter((x) => x !== id) : [...items, id])));

  const lessons = pathLessons(path);
  const done = lessons.filter((l) => isCompleted(l.id)).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-lh-card">
      <div className="border-b border-lh-line p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-lh-brand">Nội dung lộ trình</div>
            <div className="mt-1 text-sm font-semibold text-lh-ink">
              {done}/{lessons.length} bài hoàn thành
            </div>
          </div>
          <span className="grid size-11 place-items-center rounded-full bg-lh-brand-soft text-sm font-extrabold text-lh-brand">
            {percent}%
          </span>
        </div>
        <div className="mt-3">
          <HubProgress value={percent} />
        </div>
      </div>
      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
        {(path.chapters || []).map((chapter, chapterIndex) => {
          const chapterLessons = publishedChapterLessons(chapter);
          const isOpen = open.includes(chapter.id);
          const chapterDone = chapterLessons.filter((cl) => isCompleted(cl.lesson.id)).length;
          return (
            <div key={chapter.id} className="border-b border-lh-line last:border-0">
              <button
                type="button"
                onClick={() => toggle(chapter.id)}
                className="flex w-full cursor-pointer items-start gap-3 p-4 text-left transition hover:bg-lh-surface-2"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-lh-surface-2 text-xs font-bold text-lh-ink">
                  {String(chapterIndex + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-5 text-lh-ink">{chapterLabel(chapter.title)}</span>
                  <span className="mt-1 block text-[13px] font-medium text-lh-muted">
                    {chapterDone}/{chapterLessons.length} bài
                  </span>
                </span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDown className="size-4 text-lh-muted" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2">
                      {chapterLessons.length === 0 && (
                        <p className="px-4 pb-3 text-xs italic text-lh-muted">Chương này chưa có bài học được xuất bản.</p>
                      )}
                      {chapterLessons.map(({ lesson }, index) => {
                        const active = lesson.id === activeLessonId;
                        const completed = isCompleted(lesson.id);
                        const difficulty = lesson.difficulty ? PUBLIC_DIFFICULTY_META[lesson.difficulty] : null;
                        return (
                          <Link
                            key={lesson.id}
                            href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(lesson.slug, path.id)}
                            onClick={onNavigate}
                            className={`group flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition ${
                              active ? 'border-lh-brand bg-lh-brand-soft/60' : 'border-transparent hover:bg-lh-surface-2'
                            }`}
                          >
                            <span
                              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                                completed
                                  ? 'bg-lh-brand text-white'
                                  : active
                                    ? 'bg-lh-brand-soft text-lh-brand ring-1 ring-lh-brand/20'
                                    : 'bg-lh-surface-2 text-lh-muted'
                              }`}
                            >
                              {completed ? (
                                <Check className="size-3.5" />
                              ) : active ? (
                                <Circle className="size-2.5 fill-current" />
                              ) : (
                                <BookOpen className="size-3" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm font-semibold leading-5 ${active ? 'text-lh-brand' : 'text-lh-ink'}`}>
                                {index + 1}. {lesson.title}
                              </span>
                              <span className="mt-1 flex items-center gap-2 text-xs text-lh-muted">
                                <BookOpen className="size-3.5" /> Bài đọc
                                {difficulty && (
                                  <>
                                    <span>•</span> {difficulty.label}
                                  </>
                                )}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- HubUi.tsx ---
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

export const HUB_BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-lh-brand text-white shadow-sm hover:bg-lh-brand-strong',
  secondary: 'bg-lh-brand-soft text-lh-brand hover:bg-lh-brand-soft/70',
  ghost: 'text-lh-muted hover:bg-lh-surface-2 hover:text-lh-ink',
  outline: 'border border-lh-line bg-lh-surface text-lh-ink hover:border-lh-brand/40 hover:text-lh-brand',
};

export const HUB_BUTTON_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-lh-brand/30 disabled:pointer-events-none disabled:opacity-40';

export function HubButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type="button" className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

const BADGE_TONES = {
  neutral: 'bg-lh-surface-2 text-lh-ink/80 font-medium',
  brand: 'bg-lh-brand-soft text-lh-brand font-bold',
  gold: 'bg-lh-gold-soft text-lh-gold font-bold',
  red: 'bg-lh-red-soft text-lh-red font-bold',
} as const;

export function HubBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function HubProgress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-lh-surface-3">
      <motion.div
        className="h-full rounded-full bg-lh-brand"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}

// --- LessonRelated.tsx ---
const MAX_PER_GROUP = 6;
/** Tên quá ngắn dễ khớp nhầm khi dò trong văn bản. */
const MIN_MENTION_LENGTH = 6;
/** Thuộc tính HTML do khối Nhân vật / Sự kiện ghi id bài viết đã liên kết. */
const ARTICLE_ID_ATTRS = ['data-article-id', 'data-entity-id', 'data-event-id'];

const idsFromHtml = (html: string, attr: string) =>
  [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map((m) => m[1]).filter(Boolean);

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

/**
 * Bài viết & dòng thời gian liên quan tới bài học: ưu tiên bài đã gắn qua khối, sau đó dò
 * tên bài được nhắc trong nội dung (giữ dấu, khớp nguyên từ để "Phạm Tu" không dính "Phạm Tuân").
 */
function findRelated(html: string, catalog: SearchSource) {
  const text = stripHtml(html).normalize('NFC').toLocaleLowerCase('vi');
  const mentioned = (name: string) => {
    if (name.length < MIN_MENTION_LENGTH) return false;
    const needle = name.normalize('NFC').toLocaleLowerCase('vi').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${needle}(?=$|[^\\p{L}\\p{M}\\p{N}])`, 'u').test(text);
  };

  const linkedIds = new Set(ARTICLE_ID_ATTRS.flatMap((attr) => idsFromHtml(html, attr)));
  const articles = catalog.articles.filter((a) => linkedIds.has(a.id) || mentioned(a.title));
  const articleSlugs = new Set(articles.map((a) => a.slug));
  const timelines = catalog.timelines
    .filter((t) => t.nodes.some((n) => n.article && articleSlugs.has(n.article.slug)))
    .slice(0, 3);

  // Nhóm theo chuyên mục (Nhân vật, Sự kiện...) để hiển thị gọn.
  const groups = new Map<string, PublicArticleSummary[]>();
  for (const a of articles) {
    const key = a.category?.name ?? 'Bài viết';
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return {
    groups: [...groups.entries()].map(([name, items]) => ({ name, items: items.slice(0, MAX_PER_GROUP) })),
    timelines,
  };
}

export type RelatedEntities = ReturnType<typeof findRelated> | null;

export function useLessonRelated(html: string) {
  const [catalog, setCatalog] = useState<SearchSource | null>(null);

  useEffect(() => {
    let alive = true;
    loadPublicCatalog().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);

  const related = useMemo(() => (catalog && html ? findRelated(html, catalog) : null), [catalog, html]);
  const hasContent = Boolean(related && (related.groups.length > 0 || related.timelines.length > 0));

  return { related, hasContent };
}

export function LessonRelated({
  html,
  compact = false,
  precomputed,
}: {
  html: string;
  compact?: boolean;
  precomputed?: ReturnType<typeof findRelated> | null;
}) {
  const hookResult = useLessonRelated(html);
  const related = precomputed !== undefined ? precomputed : hookResult.related;

  if (!related || related.groups.length + related.timelines.length === 0) return null;

  const heading = 'text-xs font-bold uppercase tracking-[0.14em] text-lh-brand';
  const item = 'flex gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-lh-surface-2';

  return (
    <section
      aria-label="Thông tin liên quan"
      className={compact ? 'grid gap-5' : 'mt-8 grid gap-6 rounded-2xl border border-lh-line bg-lh-surface p-5 sm:grid-cols-2'}
    >
      <div className={`flex items-center gap-2 ${heading} ${compact ? '' : 'sm:col-span-2'}`}>
        <Link2 className="size-4" /> Thông tin liên quan
      </div>

      {related.groups.map((group) => (
        <div key={group.name}>
          <div className="mb-1 text-xs font-semibold text-lh-muted">{group.name}</div>
          {group.items.map((a) => (
            <Link key={a.id} href={PUBLIC_ROUTES.ARTICLE(a.slug)} className={item}>
              {a.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImageUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              ) : (
                <FileText className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              )}
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-lh-ink">{a.title}</span>
                {a.dateLabel && <span className="text-xs text-lh-muted">{a.dateLabel}</span>}
              </span>
            </Link>
          ))}
        </div>
      ))}

      {related.timelines.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-lh-muted">Dòng thời gian</div>
          {related.timelines.map((t) => (
            <Link key={t.id} href={PUBLIC_ROUTES.TIMELINE(t.slug)} className={item}>
              <GitCommitVertical className="mt-0.5 size-4 shrink-0 text-lh-gold" />
              <span className="block font-semibold leading-snug text-lh-ink">{t.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// --- LessonToc.tsx ---
export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

interface TocGroup {
  head: TocEntry;
  children: TocEntry[];
}

/** Gom mục lục thành nhóm: mỗi mục cấp cao nhất kèm các mục con ngay sau nó. */
function groupEntries(items: TocEntry[]): TocGroup[] {
  const top = Math.min(...items.map((i) => i.level));
  const groups: TocGroup[] = [];
  for (const item of items) {
    if (item.level === top || groups.length === 0) groups.push({ head: item, children: [] });
    else groups[groups.length - 1].children.push(item);
  }
  return groups;
}

/** Theo dõi tiêu đề đang đọc để tô sáng trong mục lục. */
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');
  useEffect(() => {
    if (!key) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    for (const id of key.split('|')) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);
  return active;
}

const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Mục lục bài học, thu gọn được: cả khối (nút tiêu đề) và từng nhóm mục con
 * (nhóm chứa mục đang đọc tự mở). `compact` = dạng cột phải dính theo khi cuộn.
 */
export function LessonToc({ items, compact = false }: { items: TocEntry[]; compact?: boolean }) {
  const active = useActiveHeading(items.map((i) => i.id));
  const groups = useMemo(() => groupEntries(items), [items]);
  const [open, setOpen] = useState(compact);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  if (items.length < 2) return null;

  const activeGroup = groups.find((g) => g.head.id === active || g.children.some((c) => c.id === active))?.head.id;
  const linkClass = (id: string, child = false) =>
    `-ml-px block border-l-2 py-1.5 pr-1 text-sm leading-snug transition ${child ? 'pl-6 text-[13px]' : 'pl-3'} ${
      active === id ? 'border-lh-brand font-semibold text-lh-brand' : 'border-transparent text-lh-muted hover:text-lh-ink'
    }`;

  return (
    <nav aria-label="Mục lục bài học" className={compact ? '' : 'mb-7 rounded-2xl border border-lh-line bg-lh-surface p-4'}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lh-brand"
      >
        <ListTree className="size-4" /> Mục lục
        <span className="font-semibold normal-case tracking-normal text-lh-muted">({items.length})</span>
        <ChevronDown className={`ml-auto size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="mt-2 grid gap-0.5 border-l border-lh-line">
          {groups.map((g) => {
            const expanded = g.children.length > 0 && (toggled[g.head.id] ?? g.head.id === activeGroup);
            return (
              <li key={g.head.id}>
                <div className="flex items-start">
                  <a href={`#${g.head.id}`} onClick={scrollTo(g.head.id)} className={`${linkClass(g.head.id)} flex-1`}>
                    {g.head.text}
                  </a>
                  {g.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setToggled((t) => ({ ...t, [g.head.id]: !expanded }))}
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Thu gọn mục con' : `Mở ${g.children.length} mục con`}
                      className="mt-1 grid size-6 shrink-0 place-items-center rounded text-lh-muted hover:bg-lh-surface-2 hover:text-lh-ink"
                    >
                      <ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {expanded && (
                  <ol>
                    {g.children.map((c) => (
                      <li key={c.id}>
                        <a href={`#${c.id}`} onClick={scrollTo(c.id)} className={linkClass(c.id, true)}>
                          {c.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
