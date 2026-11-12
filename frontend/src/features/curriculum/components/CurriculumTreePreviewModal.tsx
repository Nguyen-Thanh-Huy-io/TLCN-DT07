'use client';
import React from 'react';
import { CurriculumSidePanel } from './CurriculumSidePanel';

export interface CurriculumTreePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  highlightTopicId?: string;
  highlightLessonId?: string;
}

/**
 * Slide-over Drawer xem vị trí trong Cây tri thức.
 * Ủy quyền hiển thị cho `CurriculumSidePanel` với `variant="modal"` để tuân thủ DRY.
 */
export function CurriculumTreePreviewModal({
  isOpen,
  onClose,
  title = 'Vị trí trong Cây tri thức',
  subtitle = 'Nhánh lộ trình của chủ đề / bài học này',
  highlightTopicId,
  highlightLessonId,
}: CurriculumTreePreviewModalProps) {
  return (
    <CurriculumSidePanel
      isOpen={isOpen}
      onClose={onClose}
      variant="modal"
      title={title}
      subtitle={subtitle}
      highlightTopicId={highlightTopicId}
      highlightLessonId={highlightLessonId}
    />
  );
}
