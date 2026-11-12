'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { HUB_BUTTON_BASE, HUB_BUTTON_VARIANTS, HubButton } from '../hub/HubUi';

interface LessonReaderNavigationFooterProps {
  prevLessonHref?: string | null;
  nextLesson?: boolean;
  done: boolean;
  onCompleteAndContinue: () => void;
  onMarkCompleted: () => void;
}

export function LessonReaderNavigationFooter({
  prevLessonHref,
  nextLesson,
  done,
  onCompleteAndContinue,
  onMarkCompleted,
}: LessonReaderNavigationFooterProps) {
  return (
    <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-lh-line pt-5 sm:flex-row">
      {prevLessonHref ? (
        <Link
          href={prevLessonHref}
          className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}
        >
          <ChevronLeft className="size-4" /> Bài trước
        </Link>
      ) : (
        <span />
      )}

      {nextLesson ? (
        <HubButton onClick={onCompleteAndContinue}>
          {done ? 'Sang bài tiếp theo' : 'Đánh dấu hoàn thành & tiếp tục'}
          {done ? <ArrowRight className="size-4" /> : <CheckCircle2 className="size-4" />}
        </HubButton>
      ) : (
        <HubButton onClick={onMarkCompleted} disabled={done}>
          {done ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành'} <CheckCircle2 className="size-4" />
        </HubButton>
      )}
    </div>
  );
}
