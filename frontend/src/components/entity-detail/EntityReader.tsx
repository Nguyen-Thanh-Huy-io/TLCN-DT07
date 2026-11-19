'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { EntityKnowledgeGraph, EntityRelatedByTag } from './EntityKnowledgeGraph';
import { useNoteFacade } from '@/features/notes/facades/useNoteFacade';
import { NoteReaderLayer } from '@/features/notes/components/NoteReaderLayer';
import { ReadingAidsPanel } from '@/features/reading-aids/components/ReadingAidsPanel';
import { useReadingControls } from '@/features/reading-aids/hooks/useReadingControls';
import { useLessonAnnotations } from '@/features/lessons/hooks/useLessonAnnotations';
import { NOTE_TARGET_TYPE } from '@/features/notes/services/note.service';
import { ArticleReadCompleteButton } from '@/features/gamification/components/ArticleReadCompleteButton';
import { sanitizeRichHtml } from '@/utils/common';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

interface EntityReaderProps {
  model: EntityReaderModel;
}

export const EntityReader: React.FC<EntityReaderProps> = ({ model }) => {
  const noteFacade = useNoteFacade(NOTE_TARGET_TYPE.ARTICLE, model.id || model.slug);
  const contentRef = useRef<HTMLDivElement>(null);
  const annotationTooltip = useLessonAnnotations(contentRef, model.html);
  const { prefs, focusMode, setFocusMode, readingControls } = useReadingControls();

  return (
    <div className={`ue-reader-theme-wrap ue-theme-${prefs.theme} ${focusMode ? 'ue-focus-mode-active' : ''}`}>
      <div className="ue-container ue-container-focus pb-24">
        <div className="ue-layout ue-layout-single">
          <main
            className={`ue-article-col ue-text-size-${prefs.textSize} ue-line-spacing-${prefs.lineSpacing} ue-content-width-${prefs.contentWidth}`}
          >
            {focusMode && (
              <header className="mb-8 border-b border-stone-200/80 pb-5 pt-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8C6239]">
                    {model.strategy.badgeLabel} {model.hasKnownDate ? `· ${model.dateLabel}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusMode(false)}
                    className="cursor-pointer rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-600 transition hover:border-[#8B261E] hover:text-[#8B261E]"
                  >
                    Thoát chế độ tập trung
                  </button>
                </div>
                <h1 className="mt-2 font-serif text-3xl font-bold text-[#2D1A10] sm:text-4xl">{model.name}</h1>
              </header>
            )}
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

            {!focusMode && model.resourceLinks.length > 0 && (
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

            {!focusMode && model.id && (
              <ArticleReadCompleteButton articleId={model.id} />
            )}

            {!focusMode && (
              <>
                <EntityKnowledgeGraph statements={model.statements} />
                <EntityRelatedByTag articles={model.relatedByTag} />
              </>
            )}

            {!focusMode && (model.previous || model.next) && (
              <div className="ue-bottom-nav">
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

            {!focusMode && (
              <p className="mt-10 text-center text-sm text-stone-500">
                Có thắc mắc về nội dung này?{' '}
                <Link href={PUBLIC_ROUTES.COMMUNITY} className="font-semibold text-[#8B261E] hover:underline">
                  Hỏi trên Cộng đồng
                </Link>
              </p>
            )}

            {!focusMode && model.periodName && (
              <div className="my-10 flex items-center justify-center gap-3 text-center font-serif text-stone-400">
                <span>✦</span>
                <small className="font-sans text-xs font-bold uppercase tracking-widest text-stone-500">
                  {model.periodName}
                </small>
                <span>✦</span>
              </div>
            )}
          </main>
        </div>

        {annotationTooltip}
        <ReadingAidsPanel
          contentRef={contentRef}
          htmlTrigger={model.html}
          toc={model.toc}
          entities={model.readingEntities}
          onSummarizeSection={(headingId, headingText) => noteFacade.setSummaryTarget({ headingId, headingText })}
          noteFacade={noteFacade}
          articleId={model.id || model.slug}
          readingControls={readingControls}
        />
        <NoteReaderLayer
          contentRef={contentRef}
          htmlTrigger={model.html}
          facade={noteFacade}
          targetTitle={model.name}
          targetType={NOTE_TARGET_TYPE.ARTICLE}
        />
      </div>
    </div>
  );
};
