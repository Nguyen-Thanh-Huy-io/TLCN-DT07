'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ListTree,
  NotebookPen,
  PenTool,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { ANNOTATION_DATA_ATTRS } from '@/features/lessons/hooks/useLessonAnnotations';
import type { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import type { NoteFacade } from '@/features/notes/facades/useNoteFacade';
import {
  isMaterialSaved,
  toggleSavedMaterial,
  useSavedMaterialsSnapshot,
} from '@/features/saved-materials/services/saved-material.service';
import { SavedMaterialKind } from '@/features/saved-materials/constants/saved-material.constants';
import {
  ReadingActivePanel,
  ReadingDisplayPopover,
  ReadingExploreModal,
  type FootnoteEntry,
  type ReadingDisplayControls,
  type ReadingEntity,
  type ReadingPreferences,
} from './ReadingAidsParts';

export type { ReadingEntity, ReadingPreferences };

const FOOTNOTE_SELECTOR = `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]`;
const FOOTNOTE_INDEX_ATTR = 'data-footnote-index';

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
 * Thanh Capsule dọc tinh gọn 4 nút cốt lõi ở mép trái màn hình:
 * 1. Trong bài (Mục lục + Chú giải & Thực thể) · 2. Sổ ghi chú · 3. Lưu bài · 4. Hiển thị.
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
  const router = useRouter();
  const sessionUser = useAuthSession();
  const footnotes = useFootnotes(contentRef, htmlTrigger);
  const [activePanel, setActivePanel] = useState<ReadingActivePanel | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const savedSnapshot = useSavedMaterialsSnapshot(Boolean(articleId && sessionUser?.id));
  const saved = Boolean(articleId) && isMaterialSaved(savedSnapshot, SavedMaterialKind.ARTICLE, articleId ?? '');
  const dockRef = useRef<HTMLDivElement>(null);

  const exploreCount = footnotes.length + entities.length;
  const noteCount = noteFacade?.allNotesCount ?? 0;
  const isNoteOpen = Boolean(noteFacade?.isOpen);
  const isDrawActive = Boolean(noteFacade?.drawMode);
  const isFocusMode = Boolean(readingControls?.focusMode);
  const shouldFadeDock = isFocusMode && !activePanel && !isNoteOpen && !isDrawActive;

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

  const handleToggleDraw = useCallback(() => {
    if (!noteFacade) return;
    setActivePanel(null);
    noteFacade.toggleDrawMode();
  }, [noteFacade]);

  const handleToggleSave = () => {
    if (!articleId) return;
    if (!sessionUser) {
      const current =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      router.push(`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(current)}`);
      return;
    }
    void toggleSavedMaterial(SavedMaterialKind.ARTICLE, articleId);
  };

  if (isFullscreen) return null;

  const jumpTo = (el: Element | null) => {
    setActivePanel(null);
    setTimeout(() => scrollToElement(el));
  };

  return (
    <>
      {typeof readingControls?.readProgress === 'number' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
        >
          <div
            style={{ width: `${readingControls.readProgress}%` }}
            className="h-full bg-[#8B261E] transition-[width] duration-150"
          />
        </div>
      )}

      <div
        ref={dockRef}
        className={`fixed bottom-4 left-3 z-40 flex items-center transition-opacity duration-300 xl:bottom-auto xl:left-3.5 xl:top-1/2 xl:-translate-y-1/2 ${
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
            className="flex flex-row items-center gap-1 rounded-full border border-[#E5D8C1] bg-[#FFFCF5]/95 p-1.5 shadow-[0_8px_30px_rgba(45,26,16,0.12)] backdrop-blur-md xl:flex-col xl:gap-1.5"
          >
            <DockIconButton
              icon={ListTree}
              label="Trong bài (Mục lục & Liên quan)"
              active={activePanel === ReadingActivePanel.EXPLORE}
              badge={exploreCount > 0 ? exploreCount : undefined}
              onClick={() => openExclusivePanel(ReadingActivePanel.EXPLORE)}
            />

            {noteFacade && (
              <>
                <DockIconButton
                  icon={NotebookPen}
                  label="Sổ ghi chú"
                  active={isNoteOpen}
                  badge={noteCount}
                  onClick={handleToggleNotes}
                />
                <DockIconButton
                  icon={PenTool}
                  label={isDrawActive ? 'Tắt vẽ tự do' : 'Vẽ & điền chữ tự do'}
                  active={isDrawActive}
                  onClick={handleToggleDraw}
                />
              </>
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

            {readingControls && (
              <DockIconButton
                icon={SlidersHorizontal}
                label="Tùy chỉnh hiển thị"
                active={activePanel === ReadingActivePanel.DISPLAY}
                onClick={() => openExclusivePanel(ReadingActivePanel.DISPLAY)}
              />
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
          <div className="fixed inset-x-3 bottom-20 z-50 flex justify-center sm:static sm:inset-auto sm:ml-3 sm:block">
            <ReadingDisplayPopover controls={readingControls} onClose={() => setActivePanel(null)} />
          </div>
        )}
      </div>

      {activePanel === ReadingActivePanel.EXPLORE && (
        <ReadingExploreModal
          toc={toc}
          readProgress={readingControls?.readProgress}
          footnotes={footnotes}
          entities={entities}
          onJumpToHeading={(headingId) => jumpTo(document.getElementById(headingId))}
          onSummarizeSection={onSummarizeSection}
          onJumpToFootnote={(index) =>
            jumpTo(contentRef.current?.querySelector(`${FOOTNOTE_SELECTOR}[${FOOTNOTE_INDEX_ATTR}="${index}"]`) ?? null)
          }
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
}
