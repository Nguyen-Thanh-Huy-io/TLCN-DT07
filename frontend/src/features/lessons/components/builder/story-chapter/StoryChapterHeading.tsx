'use client';

import React from 'react';
import { StoryChapterUnit } from '../../../types/block-builder.types';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { EditorialTransformEnum } from '@/constants/lesson-builder.constant';

interface StoryChapterHeadingProps {
  chapter: StoryChapterUnit;
  chapterIndex: number;
  chapterNumber: string;
  showChapterNumber: boolean;
  showDividers: boolean;
  headingTypoClass: string;
  headingFontStyle?: string;
  headingTransform?: string;
  headingColor: string;
  onUpdateChapter: (updates: Partial<StoryChapterUnit>) => void;
  onSelectSub: (
    e: React.MouseEvent,
    subType: EditorialSubElementType,
    label: string,
    subId?: string
  ) => void;
  getSubRingClass: (
    subType: EditorialSubElementType,
    subId?: string
  ) => string;
}

export function StoryChapterHeading({
  chapter,
  chapterIndex,
  chapterNumber,
  showChapterNumber,
  showDividers,
  headingTypoClass,
  headingFontStyle,
  headingTransform,
  headingColor,
  onUpdateChapter,
  onSelectSub,
  getSubRingClass,
}: StoryChapterHeadingProps) {
  return (
    <div
      onClick={(e) =>
        onSelectSub(
          e,
          'MAIN_HEADING',
          `${chapterNumber} • Tiêu đề chương`,
          chapter.id
        )
      }
      className={`space-y-2 cursor-pointer ${getSubRingClass(
        'MAIN_HEADING',
        chapter.id
      )}`}
    >
      {showChapterNumber && (
        <div className="flex items-center gap-3">
          {/* Nhãn số chương tự động từ getChapterLabel(index): CHƯƠNG I, CHƯƠNG II... */}
          <span
            data-testid={`auto-chapter-number-${chapterIndex}`}
            className="text-xs font-serif font-bold uppercase tracking-[0.16em] text-stone-900 shrink-0 select-none"
          >
            {chapterNumber}
          </span>
          <span className="text-stone-400 select-none">•</span>
          <input
            type="text"
            value={chapter.subtitle || ''}
            onChange={(e) => onUpdateChapter({ subtitle: e.target.value })}
            placeholder="Tiêu đề phụ (VD: Bối cảnh lịch sử)..."
            aria-label="Tiêu đề phụ của chương"
            className="text-xs font-serif font-bold uppercase tracking-[0.14em] text-stone-700 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 min-w-[140px]"
          />
          {showDividers && (
            <span className="flex-1 h-[1.5px] bg-[#785c48]/60" />
          )}
        </div>
      )}

      <input
        type="text"
        value={chapter.title}
        onChange={(e) => onUpdateChapter({ title: e.target.value })}
        placeholder="Nhập tiêu đề chương lịch sử..."
        data-testid={
          chapterIndex === 0
            ? 'input-story-chapter-title'
            : `input-story-chapter-title-${chapterIndex}`
        }
        className={`w-full ${headingTypoClass} font-bold tracking-tight leading-tight bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 ${
          headingTransform === EditorialTransformEnum.UPPERCASE ? 'uppercase' : ''
        }`}
        style={{
          fontFamily: headingFontStyle || undefined,
          color: headingColor,
        }}
      />
    </div>
  );
}
