'use client';

import React from 'react';
import { Folder, BookOpen } from 'lucide-react';
import { TreeSelectTrigger } from '@/components/common/TreeSelectModal';
import { TopicItem } from '@/types/models';
import { LessonItem } from '@/types/models';

interface QuestionCategorySectionProps {
  points: number;
  onChangePoints: (val: number) => void;
  topicIds: string[];
  topicsList: TopicItem[];
  onOpenTopicModal: () => void;
  onRemoveTopic: (id: string) => void;
  lessonIds: string[];
  lessonsList: LessonItem[];
  onOpenLessonModal: () => void;
  onRemoveLesson: (id: string) => void;
}

export function QuestionCategorySection({
  points,
  onChangePoints,
  topicIds,
  topicsList,
  onOpenTopicModal,
  onRemoveTopic,
  lessonIds,
  lessonsList,
  onOpenLessonModal,
  onRemoveLesson,
}: QuestionCategorySectionProps) {
  return (
    <div className="lg:col-span-4 space-y-2.5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Điểm số <span className="text-slate-400 font-normal">(Question Mark)</span>
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={points}
          onChange={(e) => onChangePoints(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Phân loại / Chủ đề <span className="text-slate-400 font-normal">(Topics)</span>
        </label>
        <TreeSelectTrigger
          onClick={onOpenTopicModal}
          placeholder="Chung (Bấm để chọn chủ đề...)"
          icon={<Folder size={13} className="text-slate-400 group-hover:text-emerald-600" />}
          badgeColor="emerald"
          selectedItems={topicIds.map((id) => ({
            id,
            label: topicsList.find((t) => t.id === id)?.name || 'Chủ đề đã chọn',
          }))}
          onRemoveItem={onRemoveTopic}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Liên kết bài học <span className="text-slate-400 font-normal">(Lessons)</span>
        </label>
        <TreeSelectTrigger
          onClick={onOpenLessonModal}
          placeholder="Chung (Bấm để chọn bài học...)"
          icon={<BookOpen size={13} className="text-slate-400 group-hover:text-emerald-600" />}
          badgeColor="blue"
          selectedItems={lessonIds.map((id) => ({
            id,
            label: lessonsList.find((l) => l.id === id)?.title || 'Bài học đã chọn',
          }))}
          onRemoveItem={onRemoveLesson}
        />
      </div>
    </div>
  );
}
