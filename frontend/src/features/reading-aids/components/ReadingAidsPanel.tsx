'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Layers,
  ListTree,
  MessageSquareQuote,
  NotebookPen,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { QuickCreateFlashcardBox } from '@/features/flashcards/components/QuickCreateFlashcardBox';
import { ANNOTATION_DATA_ATTRS } from '@/features/lessons/extensions/annotation.extension';
import type { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import type { NoteFacade } from '@/features/notes/facades/useNoteFacade';
import {
  ReadingActivePanel,
  ReadingAnnotationsModal,
  ReadingDisplayPopover,
  ReadingTocModal,
  type FootnoteEntry,
  type ReadingDisplayControls,
  type ReadingEntity,
  type ReadingPreferences,
} from './ReadingAidsParts';

export type { ReadingEntity, ReadingPreferences };

const FOOTNOTE_SELECTOR = `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]`;
const FOOTNOTE_INDEX_ATTR = 'data-footnote-index';
const SAVED_ARTICLES_KEY = 'hisgo:saved-articles';
const SAVED_TIMELINE_KEY = 'hisgo.saved';
const SAVED_CHANGE_EVENT = 'hisgo:saved-change';

function subscribeSavedStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(SAVED_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SAVED_CHANGE_EVENT, callback);
  };
}

function readSavedIds(storageKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function toggleSavedArticleStorage(targetId: string): boolean {
  const current = readSavedIds(SAVED_ARTICLES_KEY);
  const nextSaved = !current.includes(targetId);
  const nextList = nextSaved ? [...current, targetId] : current.filter((id) => id !== targetId);
  try {
    localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(nextList));
    const timelineSaved = readSavedIds(SAVED_TIMELINE_KEY);
    const nextTimeline = nextSaved
      ? [...new Set([...timelineSaved, targetId])]
      : timelineSaved.filter((id) => id !== targetId);
    localStorage.setItem(SAVED_TIMELINE_KEY, JSON.stringify(nextTimeline));
    window.dispatchEvent(new Event(SAVED_CHANGE_EVENT));
  } catch {
    // Bỏ qua lỗi storage ở chế độ ẩn danh.
  }
  return nextSaved;
}

function useFootnotes(contentRef: React.RefObject<HTMLElement | null>, htmlTrigger: string): FootnoteEntry[] {
  const [footnotes, setFootnotes] = useState<FootnoteEntry[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const root = contentRef.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOOTNOTE_SELECTOR)].map((el, idx) => ({
        index: el.getAttribute(FOOTNOTE_INDEX_ATTR) ?? String(idx + 1),
        text: el.getAttribute(ANNOTATION_DATA_ATTRS.FOOTNOTE)?.trim() ?? '',
      }));
      setFootnotes(items.filter((item) => item.text));
    });
    return () => clearTimeout(timer);
  }, [contentRef, htmlTrigger]);
  return footnotes;
}

function scrollToElement(el: Element | null) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el instanceof HTMLElement) el.focus({ preventScroll: true });
}

function DockIconButton({
  icon: Icon,
  label,
  active,
  badge,
  filledIcon,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: number;
  filledIcon?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-150 ${
        active
          ? 'bg-[#8B261E] text-white shadow-sm'
          : 'text-stone-600 hover:bg-[#F3EAD8] hover:text-[#8B261E]'
      }`}
    >
      <Icon size={17} strokeWidth={2} className={filledIcon ? 'fill-current' : ''} />
      {typeof badge === 'number' && badge > 0 && (
        <span
          className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ring-2 ring-[#FFFCF5] ${
            active ? 'bg-[#2D1A10] text-white' : 'bg-[#8B261E] text-white'
          }`}
        >
          {badge}
        </span>
      )}
      <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg bg-[#2D1A10] px-2.5 py-1 text-xs font-semibold text-[#FFFCF5] opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

interface ReadingAidsPanelProps {
  contentRef: React.RefObject<HTMLElement | null>;
  htmlTrigger: string;
  toc: LessonTocEntry[];
  entities: ReadingEntity[];
  onSummarizeSection?: (headingId: string, headingText: string) => void;
  noteFacade?: NoteFacade;
  readingControls?: ReadingDisplayControls;
  articleId?: string;
}

/**
 * Thanh Capsule dọc tối giản ở mép trái màn hình (5 nút tròn có nhãn trượt khi rê chuột):
 * 1. Mục lục · 2. Ghi chú · 3. Chú thích · 4. Hiển thị · 5. Lưu bài
 */
export function ReadingAidsPanel({
  contentRef,
  htmlTrigger,
  toc,
  entities,
  onSummarizeSection,
  noteFacade,
  readingControls,
  articleId,
}: ReadingAidsPanelProps) {
  const footnotes = useFootnotes(contentRef, htmlTrigger);
  const [activePanel, setActivePanel] = useState<ReadingActivePanel | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashcardFront, setFlashcardFront] = useState('');
  const [flashcardSaved, setFlashcardSaved] = useState(false);
  const saved = useSyncExternalStore(
    subscribeSavedStorage,
    () => (articleId ? readSavedIds(SAVED_ARTICLES_KEY).includes(articleId) : false),
    () => false,
  );
  const dockRef = useRef<HTMLDivElement>(null);

  const highlightedNotes = (noteFacade?.allNotes ?? []).filter((n) => Boolean(n.highlightText));
  const annotationCount = footnotes.length + highlightedNotes.length + entities.length;
  const noteCount = noteFacade?.allNotesCount ?? 0;
  const isNoteOpen = Boolean(noteFacade?.isOpen);
  const isFocusMode = Boolean(readingControls?.focusMode);
  const shouldFadeDock = isFocusMode && !activePanel && !isNoteOpen;

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!activePanel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) setActivePanel(null);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (activePanel === ReadingActivePanel.DISPLAY && dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [activePanel]);

  const openExclusivePanel = useCallback(
    (panel: ReadingActivePanel) => {
      if (noteFacade?.isOpen) noteFacade.closeDrawer();
      setActivePanel((cur) => (cur === panel ? null : panel));
    },
    [noteFacade],
  );

  const handleToggleNotes = useCallback(() => {
    if (!noteFacade) return;
    setActivePanel(null);
    if (noteFacade.isOpen) noteFacade.closeDrawer();
    else noteFacade.openDrawer();
  }, [noteFacade]);

  const handleToggleSave = () => {
    if (!articleId) return;
    toggleSavedArticleStorage(articleId);
  };

  if (isFullscreen) return null;

  const jumpTo = (el: Element | null) => {
    setActivePanel(null);
    setTimeout(() => scrollToElement(el));
  };

  return (
    <>
      <div
        ref={dockRef}
        className={`fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex items-center transition-opacity duration-300 ${
          shouldFadeDock ? 'opacity-15 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'
        }`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#E5D8C1] bg-[#FFFCF5]/95 text-[#5C2A1E] shadow-lg backdrop-blur-md transition hover:bg-[#F3EAD8]"
            aria-label="Mở công cụ đọc"
          >
            <ChevronRight size={16} />
            <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg bg-[#2D1A10] px-2.5 py-1 text-xs font-semibold text-[#FFFCF5] opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100">
              Mở công cụ đọc
            </span>
          </button>
        ) : (
          <nav
            aria-label="Thanh công cụ đọc bài viết"
            className="flex flex-col items-center gap-1.5 rounded-full border border-[#E5D8C1] bg-[#FFFCF5]/95 p-1.5 shadow-[0_8px_30px_rgba(45,26,16,0.12)] backdrop-blur-md"
          >
            <DockIconButton
              icon={ListTree}
              label="Mục lục"
              active={activePanel === ReadingActivePanel.TOC}
              onClick={() => openExclusivePanel(ReadingActivePanel.TOC)}
            />

            {noteFacade && (
              <DockIconButton
                icon={NotebookPen}
                label="Ghi chú"
                active={isNoteOpen}
                badge={noteCount}
                onClick={handleToggleNotes}
              />
            )}

            <DockIconButton
              icon={MessageSquareQuote}
              label="Chú thích"
              active={activePanel === ReadingActivePanel.ANNOTATIONS}
              badge={annotationCount}
              onClick={() => openExclusivePanel(ReadingActivePanel.ANNOTATIONS)}
            />

            {readingControls && (
              <DockIconButton
                icon={SlidersHorizontal}
                label="Hiển thị"
                active={activePanel === ReadingActivePanel.DISPLAY}
                onClick={() => openExclusivePanel(ReadingActivePanel.DISPLAY)}
              />
            )}

            {articleId && (
              <DockIconButton
                icon={Bookmark}
                label={saved ? 'Đã lưu bài viết' : 'Lưu bài viết'}
                active={saved}
                filledIcon={saved}
                onClick={handleToggleSave}
              />
            )}

            <DockIconButton
              icon={Layers}
              label="Tạo thẻ ghi nhớ"
              active={activePanel === ReadingActivePanel.FLASHCARD}
              onClick={() => {
                const selected = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() ?? '' : '';
                setFlashcardFront(selected);
                setFlashcardSaved(false);
                openExclusivePanel(ReadingActivePanel.FLASHCARD);
              }}
            />

            {typeof readingControls?.readProgress === 'number' && (
              <>
                <div className="my-0.5 h-px w-5 bg-stone-200/90" />
                <div
                  className="group relative flex h-8 w-9 select-none items-center justify-center rounded-full text-[10px] font-bold text-[#8B261E]"
                  aria-label={`Tiến độ đọc ${readingControls.readProgress}%`}
                >
                  <span>{readingControls.readProgress}%</span>
                  <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg bg-[#2D1A10] px-2.5 py-1 text-xs font-semibold text-[#FFFCF5] opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100">
                    Tiến độ đọc: {readingControls.readProgress}%
                  </span>
                </div>
              </>
            )}

            <div className="my-0.5 h-px w-5 bg-stone-200/90" />

            <button
              type="button"
              onClick={() => {
                setActivePanel(null);
                setCollapsed(true);
              }}
              aria-label="Thu gọn thanh công cụ"
              className="group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-700"
            >
              <ChevronLeft size={14} />
              <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg bg-[#2D1A10] px-2.5 py-1 text-xs font-semibold text-[#FFFCF5] opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100">
                Thu gọn
              </span>
            </button>
          </nav>
        )}

        {activePanel === ReadingActivePanel.DISPLAY && readingControls && (
          <div className="ml-3">
            <ReadingDisplayPopover controls={readingControls} onClose={() => setActivePanel(null)} />
          </div>
        )}

        {activePanel === ReadingActivePanel.FLASHCARD && (
          <div className="ml-3 w-[360px] max-w-[85vw] rounded-2xl border border-[#E5D8C1] bg-[#FFFCF5] p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between border-b border-[#E5D8C1]/60 pb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A1F24]">
                <Layers size={14} /> Tạo thẻ ghi nhớ nhanh
              </span>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Đóng"
                className="rounded p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            {flashcardSaved ? (
              <div className="space-y-2 py-2 text-xs text-teal-800">
                <p className="font-semibold">Đã lưu thẻ ghi nhớ vào tài khoản của bạn.</p>
                <button
                  type="button"
                  onClick={() => {
                    setFlashcardFront('');
                    setFlashcardSaved(false);
                  }}
                  className="font-bold text-[#7A1F24] underline cursor-pointer"
                >
                  Tạo thêm thẻ khác
                </button>
              </div>
            ) : (
              <QuickCreateFlashcardBox
                initialFront={flashcardFront}
                initialBack=""
                onSaved={() => setFlashcardSaved(true)}
                onCancel={() => setActivePanel(null)}
              />
            )}
          </div>
        )}
      </div>

      {activePanel === ReadingActivePanel.TOC && (
        <ReadingTocModal
          toc={toc}
          readProgress={readingControls?.readProgress}
          onJumpToHeading={(headingId) => jumpTo(document.getElementById(headingId))}
          onSummarizeSection={onSummarizeSection}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === ReadingActivePanel.ANNOTATIONS && (
        <ReadingAnnotationsModal
          footnotes={footnotes}
          highlightedNotes={highlightedNotes}
          entities={entities}
          onJumpToFootnote={(index) =>
            jumpTo(contentRef.current?.querySelector(`${FOOTNOTE_SELECTOR}[${FOOTNOTE_INDEX_ATTR}="${index}"]`) ?? null)
          }
          onOpenNoteDrawer={noteFacade ? handleToggleNotes : undefined}
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
}
