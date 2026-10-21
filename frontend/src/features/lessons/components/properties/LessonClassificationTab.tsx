'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { DifficultyLevel } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { LessonDifficultySelector } from '../LessonDifficultySelector';
import { LessonTagPicker } from '../LessonTagPicker';
import { LessonOrderField } from '../LessonOrderField';
import { TagItem } from '@/types/models/tag.type';
import { LessonItem } from '@/types/models/lesson.type';

interface LessonClassificationTabProps {
  currentTopicName?: string;
  onOpenTopicPicker: () => void;
  difficulty: DifficultyLevel;
  setDifficulty: (v: DifficultyLevel) => void;
  selectedTags: TagItem[];
  setSelectedTags: (tags: TagItem[]) => void;
  displayOrder: number;
  setDisplayOrder: (v: number) => void;
  topicLessons: LessonItem[];
  loadingTopicLessons: boolean;
  lessonId: string | null;
  title: string;
  saving: boolean;
  openSection: 'difficulty' | 'tags' | 'order' | null;
  setOpenSection: (v: 'difficulty' | 'tags' | 'order' | null) => void;
}

/** Tab "Phân loại" trong Panel Thuộc tính: Thẻ phân loại (Tags) và Độ khó —
 * bài học độc lập (không phụ thuộc cứng vào Chương học/Topic). */
export function LessonClassificationTab({
  difficulty,
  setDifficulty,
  selectedTags,
  setSelectedTags,
  saving,
  openSection,
  setOpenSection,
}: LessonClassificationTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden animate-in fade-in-50 duration-150">
      {/* Mục 1: Thẻ phân loại (Tags) */}
      <div className="p-3" data-testid="sidebar-tags-field">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'tags' ? null : 'tags')}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Icon name={IconName.TAG} size={15} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Thẻ phân loại (Tags)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {selectedTags.length > 0 ? `${selectedTags.length} thẻ` : 'Chưa gắn thẻ'}
            </span>
            <span className={`text-slate-400 text-xs transition-transform ${openSection !== 'difficulty' ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        <div
          className={
            openSection !== 'difficulty' ? 'mt-3 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-150' : 'hidden'
          }
        >
          <LessonTagPicker selectedTags={selectedTags} onChange={setSelectedTags} disabled={saving} hideLabel />
        </div>
      </div>

      {/* Mục 2: Độ khó bài học (Accordion) */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === 'difficulty' ? null : 'difficulty')}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-sm leading-none">★</span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Độ khó</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {DIFFICULTY_LABEL_MAP[difficulty] || difficulty}
            </span>
            <span className={`text-slate-400 text-xs transition-transform ${openSection === 'difficulty' ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        <div
          className={
            openSection === 'difficulty'
              ? 'mt-3 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-150'
              : 'hidden'
          }
        >
          <LessonDifficultySelector value={difficulty} onChange={setDifficulty} disabled={saving} hideLabel />
        </div>
      </div>
    </div>
  );
}
