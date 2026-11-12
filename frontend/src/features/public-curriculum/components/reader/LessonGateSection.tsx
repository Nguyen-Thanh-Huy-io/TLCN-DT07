'use client';

import React from 'react';
import { LessonAccessState } from '../../facades/usePublicLessonReaderFacade';
import { LearningPathItem } from '@/services/entities/learning-path.service';
import { HubLessonGate } from '../hub/HubLessonGate';
import { HubSyllabus } from '../hub/HubSyllabus';

export interface LessonGatePreview {
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
}

interface LessonGateSectionProps {
  access: Exclude<LessonAccessState, LessonAccessState.GRANTED>;
  learningPath: LearningPathItem | null;
  syllabusOpen: boolean;
  onToggleSyllabus: () => void;
  isCompleted: (id: string) => boolean;
  lockedPreview: LessonGatePreview | null;
  onEnroll: (pathId: string) => Promise<void>;
  onReload: () => Promise<void>;
  SyllabusColumnComponent: React.ComponentType<{
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }>;
}

export function LessonGateSection({
  access,
  learningPath,
  syllabusOpen,
  onToggleSyllabus,
  isCompleted,
  lockedPreview,
  onEnroll,
  onReload,
  SyllabusColumnComponent,
}: LessonGateSectionProps) {
  const gridClass = learningPath
    ? syllabusOpen
      ? 'lg:grid-cols-[17rem_minmax(0,1fr)]'
      : 'lg:grid-cols-[3rem_minmax(0,1fr)]'
    : '';

  return (
    <div className={`grid gap-8 ${gridClass}`}>
      {learningPath && (
        <SyllabusColumnComponent open={syllabusOpen} onToggle={onToggleSyllabus}>
          <HubSyllabus path={learningPath} isCompleted={isCompleted} />
        </SyllabusColumnComponent>
      )}
      <HubLessonGate
        access={access}
        preview={lockedPreview}
        learningPath={learningPath}
        onEnroll={async (pathId) => {
          await onEnroll(pathId);
          await onReload();
        }}
      />
    </div>
  );
}
