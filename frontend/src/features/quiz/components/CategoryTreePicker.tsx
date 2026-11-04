'use client';

import React, { useMemo } from 'react';
import { TopicItem } from '@/types/models/topic.type';
import { LessonItem } from '@/types/models/lesson.type';
import {
  TreeSelectModal,
  buildTopicTreeNodes,
  buildLessonTreeNodes,
} from '@/components/common/TreeSelectModal';

// ============================================================================
// 1. MODAL CHỌN NHIỀU CHỦ ĐỀ (SELECT A CATEGORY - REUSING TREESELECTMODAL)
// ============================================================================

export interface TopicCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
  selectedTopicIds: string[];
  onChangeSelected: (topicIds: string[]) => void;
}

export function TopicCategoryModalPicker({
  isOpen,
  onClose,
  topics,
  selectedTopicIds,
  onChangeSelected,
}: TopicCategoryModalProps) {
  const nodes = useMemo(() => buildTopicTreeNodes(topics), [topics]);

  return (
    <TreeSelectModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select a category"
      subtitle="Chọn một hoặc nhiều Chủ đề"
      nodes={nodes}
      selectedIds={selectedTopicIds}
      onChangeSelected={onChangeSelected}
      multiple={true}
      emptyText="Không có dữ liệu chủ đề."
      unitLabel="chủ đề"
      searchPlaceholder="Tìm kiếm nhanh chủ đề lịch sử..."
    />
  );
}

// ============================================================================
// 2. MODAL CHỌN NHIỀU BÀI HỌC (SELECT LESSONS - REUSING TREESELECTMODAL)
// ============================================================================

export interface LessonCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonItem[];
  selectedLessonIds: string[];
  onChangeSelected: (lessonIds: string[]) => void;
}

export function LessonCategoryModalPicker({
  isOpen,
  onClose,
  lessons,
  selectedLessonIds,
  onChangeSelected,
}: LessonCategoryModalProps) {
  const nodes = useMemo(() => buildLessonTreeNodes(lessons), [lessons]);

  return (
    <TreeSelectModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select lessons"
      subtitle="Chọn một hoặc nhiều Bài học liên kết"
      nodes={nodes}
      selectedIds={selectedLessonIds}
      onChangeSelected={onChangeSelected}
      multiple={true}
      emptyText="Không có dữ liệu bài học."
      unitLabel="bài học"
      searchPlaceholder="Tìm kiếm nhanh tên bài học (VD: Điện Biên Phủ, Quảng Trị, Tây Nguyên)..."
    />
  );
}
