'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, PanelLeftOpen, PanelRightOpen, ExternalLink } from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { EntityKnowledgeGraph, EntityReadingToolbar, TextSizeLevel, EntityReadingToc, EntityReadingTimeline } from './EntityReaderParts';
import { DiscussionSection } from '@/features/discussions/components/DiscussionSection';
import { useNoteFacade } from '@/features/notes/facades/useNoteFacade';
import { NoteDrawer, NoteFloatingButton } from '@/features/notes/components/NoteDrawer';
import { NOTE_TARGET_TYPE } from '@/features/notes/services/note.service';
import { sanitizeRichHtml } from '@/utils/common';

// === use-reading-layout.ts ===
export enum ReadingLayoutMode {
  DEFAULT = 'DEFAULT',           // 3 cột (TOC + Bài đọc + Tiến trình)
  FOCUS = 'FOCUS',               // Đọc tập trung (Ẩn cả 2, bài đọc bung tối đa)
  TOC_ONLY = 'TOC_ONLY',         // Chỉ hiển thị Mục lục + Bài đọc
  TIMELINE_ONLY = 'TIMELINE_ONLY'// Chỉ hiển thị Tiến trình + Bài đọc
}

export const READING_LAYOUT_STORAGE_KEY = 'hisgo_reading_layout_mode_v1';

export interface ReadingLayoutState {
  isTocOpen: boolean;
  isTimelineOpen: boolean;
  isFocusMode: boolean;
  layoutClass: string;
  toggleToc: () => void;
  toggleTimeline: () => void;
  toggleFocusMode: () => void;
  resetDefault: () => void;
}

export function useReadingLayout(hasTimeline: boolean = true): ReadingLayoutState {
  const [isTocOpen, setIsTocOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(READING_LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isTocOpen === 'boolean') {
          return parsed.isTocOpen;
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
    return true;
  });

  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return hasTimeline;
    try {
      const saved = localStorage.getItem(READING_LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isTimelineOpen === 'boolean') {
          return hasTimeline && parsed.isTimelineOpen;
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
    return hasTimeline;
  });

  // Đồng bộ lại khi `hasTimeline` thay đổi
  useEffect(() => {
    if (!hasTimeline) {
      void Promise.resolve().then(() => {
        setIsTimelineOpen(false);
      });
    }
  }, [hasTimeline]);

  // Lưu tùy chọn đọc
  const persistState = useCallback((toc: boolean, timeline: boolean) => {
    try {
      localStorage.setItem(
        READING_LAYOUT_STORAGE_KEY,
        JSON.stringify({ isTocOpen: toc, isTimelineOpen: timeline })
      );
    } catch {
      // Bỏ qua lỗi quota/storage
    }
  }, []);

  const toggleToc = useCallback(() => {
    setIsTocOpen((prev) => {
      const next = !prev;
      persistState(next, isTimelineOpen);
      return next;
    });
  }, [isTimelineOpen, persistState]);

  const toggleTimeline = useCallback(() => {
    if (!hasTimeline) return;
    setIsTimelineOpen((prev) => {
      const next = !prev;
      persistState(isTocOpen, next);
      return next;
    });
  }, [hasTimeline, isTocOpen, persistState]);

  const isFocusMode = !isTocOpen && (!hasTimeline || !isTimelineOpen);

  const toggleFocusMode = useCallback(() => {
    if (isFocusMode) {
      // Thoát chế độ tập trung: Phục hồi 3 cột mặc định
      setIsTocOpen(true);
      if (hasTimeline) setIsTimelineOpen(true);
      persistState(true, hasTimeline);
    } else {
      // Bật chế độ tập trung: Ẩn cả 2 bên để bài đọc bung cực đại
      setIsTocOpen(false);
      setIsTimelineOpen(false);
      persistState(false, false);
    }
  }, [isFocusMode, hasTimeline, persistState]);

  const resetDefault = useCallback(() => {
    setIsTocOpen(true);
    if (hasTimeline) setIsTimelineOpen(true);
    persistState(true, hasTimeline);
  }, [hasTimeline, persistState]);

  // Tính toán dynamic CSS class cho Grid Container
  let layoutClass = 'ue-layout-with-both';
  if (!isTocOpen && !isTimelineOpen) {
    layoutClass = 'ue-layout-focus-mode';
  } else if (!isTocOpen && isTimelineOpen) {
    layoutClass = 'ue-layout-timeline-only';
  } else if (isTocOpen && !isTimelineOpen) {
    layoutClass = 'ue-layout-toc-only';
  }

  return {
    isTocOpen,
    isTimelineOpen: hasTimeline && isTimelineOpen,
    isFocusMode,
    layoutClass,
    toggleToc,
    toggleTimeline,
    toggleFocusMode,
    resetDefault,
  };
}

// === EntityReader.tsx ===
interface EntityReaderProps {
  model: EntityReaderModel;
}

export const EntityReader: React.FC<EntityReaderProps> = ({ model }) => {
  const noteFacade = useNoteFacade(NOTE_TARGET_TYPE.ARTICLE, model.id || model.slug);
  const [activeId, setActiveId] = useState<string>('');
  const [readProgress, setReadProgress] = useState<number>(0);
  const [textSize, setTextSize] = useState<TextSizeLevel>(TextSizeLevel.MD);

  const hasTimeline = Boolean(model.previous || model.next);
  const {
    isTocOpen,
    isTimelineOpen,
    isFocusMode,
    layoutClass,
    toggleToc,
    toggleTimeline,
    toggleFocusMode,
  } = useReadingLayout(hasTimeline);

  // Tính toán phần trăm tiến độ cuộn & heading active
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(
          100,
          Math.max(0, (window.scrollY / totalHeight) * 100),
        );
        setReadProgress(Math.round(currentProgress));
      }

      const headings = model.toc
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = headings[i];
        if (el && el.getBoundingClientRect().top <= 160) {
          setActiveId(el.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [model.toc]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`ue-container ${isFocusMode ? 'ue-container-focus' : ''}`}>
      {/* THANH ĐIỀU KHIỂN KHÔNG GIAN ĐỌC */}
      <EntityReadingToolbar
        isTocOpen={isTocOpen}
        isTimelineOpen={isTimelineOpen}
        isFocusMode={isFocusMode}
        hasTimeline={hasTimeline}
        readProgress={readProgress}
        textSize={textSize}
        onToggleToc={toggleToc}
        onToggleTimeline={toggleTimeline}
        onToggleFocusMode={toggleFocusMode}
        onTextSizeChange={setTextSize}
        onPrint={handlePrint}
      />

      <div className={`ue-layout ${layoutClass}`}>
        {/* CỘT TRÁI: MỤC LỤC TƯ LIỆU */}
        <EntityReadingToc
          isTocOpen={isTocOpen}
          isFocusMode={isFocusMode}
          toc={model.toc}
          activeId={activeId}
          readProgress={readProgress}
          readMinutes={model.readMinutes}
          hasStatements={model.statements.length > 0}
          onToggleToc={toggleToc}
          onScrollToHeading={scrollToHeading}
        />

        {/* CỘT GIỮA: BÀI ĐỌC CHÍNH */}
        <main className={`ue-article-col ue-text-size-${textSize}`}>
          {model.html ? (
            <div
              className="ue-bio-blocks ue-article-content"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(model.html) }}
            />
          ) : (
            <div className="ue-bio-blocks ue-article-content">
              <p>{model.description || 'Đang cập nhật hồ sơ chi tiết...'}</p>
            </div>
          )}

          {model.resourceLinks.length > 0 && (
            <div className="ue-resource-links">
              <h2>Sử liệu & liên kết tham khảo</h2>
              <div className="ue-resource-links-grid">
                {model.resourceLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ue-resource-link-card"
                  >
                    <span className="ue-resource-link-title">
                      {link.title} <ExternalLink size={14} />
                    </span>
                    {link.note && <p>{link.note}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}

          <EntityKnowledgeGraph statements={model.statements} />

          {/* ĐIỀU HƯỚNG LIÊN HOÀN CUỐI BÀI */}
          {(model.previous || model.next) && (
            <div className="ue-bottom-nav">
              {model.previous ? (
                <Link href={model.previous.href} className="ue-bottom-btn prev">
                  <ChevronLeft size={20} />
                  <div>
                    <span className="ue-bottom-sub">Triều đại trước</span>
                    <strong className="ue-bottom-title">{model.previous.name}</strong>
                    {model.previous.dateLabel && (
                      <span className="ue-bottom-date">{model.previous.dateLabel}</span>
                    )}
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {model.next ? (
                <Link href={model.next.href} className="ue-bottom-btn next">
                  <div className="text-right">
                    <span className="ue-bottom-sub">Triều đại tiếp theo</span>
                    <strong className="ue-bottom-title">{model.next.name}</strong>
                    {model.next.dateLabel && (
                      <span className="ue-bottom-date">{model.next.dateLabel}</span>
                    )}
                  </div>
                  <ChevronRight size={20} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}

          <DiscussionSection targetType="ARTICLE" targetId={model.id} />

          <div className="my-10 text-center text-stone-400 font-serif flex items-center justify-center gap-3">
            <span>✦</span>
            <small className="tracking-widest font-sans uppercase font-bold text-xs text-stone-500">
              {model.periodName ?? 'HISGO BẢO TÀNG SỐ'}
            </small>
            <span>✦</span>
          </div>
        </main>

        {/* CỘT PHẢI: TIẾN TRÌNH DÒNG THỜI GIAN */}
        <EntityReadingTimeline
          hasTimeline={hasTimeline}
          isTimelineOpen={isTimelineOpen}
          isFocusMode={isFocusMode}
          previous={model.previous}
          next={model.next}
          currentName={model.name}
          currentDateLabel={model.dateLabel}
          onToggleTimeline={toggleTimeline}
        />
      </div>

      {/* FIXED EDGE TABS KHI Ở CHẾ ĐỘ ĐỌC TOÀN CẢNH */}
      {isFocusMode && (
        <>
          <button
            type="button"
            onClick={toggleToc}
            className="ue-edge-dock-tab left"
            title="Mở lại Mục lục tư liệu"
          >
            <PanelLeftOpen size={16} />
            <span>MỤC LỤC</span>
          </button>

          {hasTimeline && (
            <button
              type="button"
              onClick={toggleTimeline}
              className="ue-edge-dock-tab right"
              title="Mở lại Tiến trình lịch sử"
            >
              <PanelRightOpen size={16} />
              <span>TIẾN TRÌNH</span>
            </button>
          )}
        </>
      )}
      {/* Sổ ghi chú cá nhân */}
      <NoteFloatingButton facade={noteFacade} />
      <NoteDrawer
        facade={noteFacade}
        targetTitle={model.name}
        targetType={NOTE_TARGET_TYPE.ARTICLE}
      />
    </div>
  );
};
