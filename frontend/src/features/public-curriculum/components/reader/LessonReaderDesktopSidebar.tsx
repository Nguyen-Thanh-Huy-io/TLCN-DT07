'use client';

import React from 'react';
import { LessonToc } from '../hub/LessonToc';
import { LessonRelated } from '../hub/LessonRelated';
import { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';
import type { RelatedEntities } from '../hub/LessonRelated';

interface LessonReaderDesktopSidebarProps {
  hasRightSidebar: boolean;
  hasToc: boolean;
  hasRelated: boolean;
  tocItems: LessonTocEntry[];
  compiledHtml: string;
  related: RelatedEntities;
}

export function LessonReaderDesktopSidebar({
  hasRightSidebar,
  hasToc,
  hasRelated,
  tocItems,
  compiledHtml,
  related,
}: LessonReaderDesktopSidebarProps) {
  if (!hasRightSidebar) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 grid max-h-[calc(100vh-7rem)] gap-6 overflow-y-auto pb-4 pr-1">
        {hasToc && <LessonToc items={tocItems} compact />}
        {hasRelated && <LessonRelated html={compiledHtml} compact precomputed={related} />}
      </div>
    </aside>
  );
}
