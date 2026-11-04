'use client';

import React, { useMemo } from 'react';
import { TopicItem } from '@/types/models/topic.type';
import {
  TreeSelectModal,
  buildTopicTreeNodes,
} from '@/components/common/TreeSelectModal';

export interface LessonTopicModalPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  topics: TopicItem[];
  selectedTopicId: string;
}

export function LessonTopicModalPicker({
  isOpen,
  onClose,
  onSelect,
  topics,
  selectedTopicId,
}: LessonTopicModalPickerProps) {
  const nodes = useMemo(() => buildTopicTreeNodes(topics), [topics]);

  return (
    <TreeSelectModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select a category"
      subtitle="Chọn Chủ đề lịch sử cho bài học"
      nodes={nodes}
      selectedIds={selectedTopicId ? [selectedTopicId] : []}
      onChangeSelected={(ids) => {
        if (ids.length > 0) {
          onSelect(ids[0]);
        } else {
          onSelect('');
        }
      }}
      multiple={false}
      emptyText="Không có dữ liệu chủ đề."
      unitLabel="chủ đề"
    />
  );
}
