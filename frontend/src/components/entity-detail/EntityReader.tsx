'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, PanelLeftOpen, PanelRightOpen, ExternalLink } from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { EntityReadingToolbar, TextSizeLevel, EntityReadingToc, EntityReadingTimeline } from './EntityReaderParts';
import { EntityKnowledgeGraph, EntityRelatedByTag } from './EntityKnowledgeGraph';
import { useNoteFacade } from '@/features/notes/facades/useNoteFacade';
import { NoteReaderLayer } from '@/features/notes/components/NoteReaderLayer';
import { ReadingAidsPanel } from '@/features/reading-aids/components/ReadingAidsPanel';
import { useLessonAnnotations } from '@/features/lessons/hooks/useLessonAnnotations';
import { NOTE_TARGET_TYPE } from '@/features/notes/services/note.service';
import { sanitizeRichHtml } from '@/utils/common';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import { MIN_TOC_ENTRIES, useReadingLayout } from './useReadingLayout';

interface EntityReaderProps {
  model: EntityReaderModel;
}

export const EntityReader: React.FC<EntityReaderProps> = ({ model }) => {
  const noteFacade = useNoteFacade(NOTE_TARGET_TYPE.ARTICLE, model.id || model.slug);
  const contentRef = useRef<HTMLDivElement>(null);
  // Đánh số + tooltip chú thích giống trang bài học (bài viết soạn bằng cùng Block Builder).
  const annotationTooltip = useLessonAnnotations(contentRef, model.html);
  const [activeId, setActiveId] = useState<string>('');
  const [readProgress, setReadProgress] = useState<number>(0);
  const [textSize, setTextSize] = useState<TextSizeLevel>(TextSizeLevel.MD);

  const hasTimeline = Boolean(model.previous || model.next);
  const hasToc = model.toc.length >= MIN_TOC_ENTRIES;
  const {
    isTocOpen,
    isTimelineOpen,
    isFocusMode,
    layoutClass,
    toggleToc,
    toggleTimeline,
    toggleFocusMode,
  } = useReadingLayout(hasTimeline, hasToc);

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

  const handlePrint = () => window.print();

  return (
    <div className={`ue-container ${isFocusMode ? 'ue-container-focus' : ''}`}>
      {/* THANH ĐIỀU KHIỂN KHÔNG GIAN ĐỌC */}
      <EntityReadingToolbar
        isTocOpen={isTocOpen}
        isTimelineOpen={isTimelineOpen}
        isFocusMode={isFocusMode}
        hasTimeline={hasTimeline}
        hasToc={hasToc}
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
        {hasToc && (
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
        )}

        {/* CỘT GIỮA: BÀI ĐỌC CHÍNH */}
        <main className={`ue-article-col ue-text-size-${textSize}`}>
          {model.html ? (
            <div
              ref={contentRef}
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
          <EntityRelatedByTag articles={model.relatedByTag} />

          {/* ĐIỀU HƯỚNG LIÊN HOÀN CUỐI BÀI */}
          {(model.previous || model.next) && (
            // Cột phải (≥1280px, đang mở) đã hiện đúng nội dung này — chỉ hiện ở cuối bài khi cột đó ẩn.
            <div className={`ue-bottom-nav ${isTimelineOpen ? 'ue-bottom-nav-beside-column' : ''}`}>
              {model.previous ? (
                <Link href={model.previous.href} className="ue-bottom-btn prev">
                  <ChevronLeft size={20} />
                  <div>
                    <span className="ue-bottom-sub">{model.previousLabel}</span>
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
                    <span className="ue-bottom-sub">{model.nextLabel}</span>
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

          {/* Trang tra cứu không có hỏi đáp riêng (chỉ Bài học có); trao đổi thì qua Cộng đồng. */}
          <p className="mt-10 text-center text-sm text-stone-500">
            Có thắc mắc về nội dung này?{' '}
            <Link href={PUBLIC_ROUTES.COMMUNITY} className="font-semibold text-[#8B261E] hover:underline">
              Hỏi trên Cộng đồng
            </Link>
          </p>

          {model.periodName && (
            <div className="my-10 text-center text-stone-400 font-serif flex items-center justify-center gap-3">
              <span>✦</span>
              <small className="tracking-widest font-sans uppercase font-bold text-xs text-stone-500">{model.periodName}</small>
              <span>✦</span>
            </div>
          )}
        </main>

        {/* CỘT PHẢI: TIẾN TRÌNH DÒNG THỜI GIAN */}
        <EntityReadingTimeline
          hasTimeline={hasTimeline}
          isTimelineOpen={isTimelineOpen}
          isFocusMode={isFocusMode}
          previous={model.previous}
          next={model.next}
          previousLabel={model.previousLabel}
          nextLabel={model.nextLabel}
          adjacentTimeline={model.adjacentTimeline}
          currentName={model.name}
          currentDateLabel={model.dateLabel}
          onToggleTimeline={toggleTimeline}
        />
      </div>

      {/* FIXED EDGE TABS KHI Ở CHẾ ĐỘ ĐỌC TOÀN CẢNH */}
      {isFocusMode && (
        <>
          {hasToc && (
            <button
              type="button"
              onClick={toggleToc}
              className="ue-edge-dock-tab left"
              title="Mở lại Mục lục tư liệu"
            >
              <PanelLeftOpen size={16} />
              <span>MỤC LỤC</span>
            </button>
          )}

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
      {annotationTooltip}
      <ReadingAidsPanel
        contentRef={contentRef}
        htmlTrigger={model.html}
        toc={model.toc}
        entities={model.readingEntities}
        onSummarizeSection={(headingId, headingText) => noteFacade.setSummaryTarget({ headingId, headingText })}
      />
      <NoteReaderLayer
        contentRef={contentRef}
        htmlTrigger={model.html}
        facade={noteFacade}
        targetTitle={model.name}
        targetType={NOTE_TARGET_TYPE.ARTICLE}
      />
    </div>
  );
};
