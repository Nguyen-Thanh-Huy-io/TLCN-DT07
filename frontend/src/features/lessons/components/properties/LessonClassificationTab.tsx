'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { DifficultyLevel, ClassificationSectionKey } from '@/constants/enums';
import { DIFFICULTY_LABEL_MAP } from '@/constants/ui-theme';
import { LessonDifficultySelector } from '../LessonDifficultySelector';
import { LessonTagPicker } from '../LessonTagPicker';
import { TagItem } from '@/types/models/tag.type';
import { LessonItem } from '@/types/models/lesson.type';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';

const ACCORDION_OPEN_CLASSES = 'mt-3 pt-2 border-t border-slate-100 animate-in fade-in-50 duration-150';
const ROTATE_ARROW_CLASS = 'rotate-180';

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
  thumbnailUrl?: string;
  onThumbnailChange?: (url: string) => void;
  saving: boolean;
  openSection: 'difficulty' | 'tags' | 'order' | null;
  setOpenSection: (v: 'difficulty' | 'tags' | 'order' | null) => void;
}

/** Tab "Hồ sơ & Phân loại": Chủ đề (xương sống), Ảnh bìa bài học, Thẻ tag (từ khóa ngang), Độ khó và Thứ tự. */
export function LessonClassificationTab({
  currentTopicName,
  onOpenTopicPicker,
  difficulty,
  setDifficulty,
  selectedTags,
  setSelectedTags,
  displayOrder,
  setDisplayOrder,
  thumbnailUrl = '',
  onThumbnailChange,
  saving,
  openSection,
  setOpenSection,
}: LessonClassificationTabProps) {
  const isTagsOpen = openSection !== ClassificationSectionKey.DIFFICULTY;
  const isDifficultyOpen = openSection === ClassificationSectionKey.DIFFICULTY;

  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden animate-in fade-in-50 duration-150">
      {/* Mục 1: Chủ đề học tập (Topic - Xương sống cấu trúc, Bắt buộc) */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span>Chủ đề chính (Topic)</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200/60">
            Xương sống
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {currentTopicName || 'Chưa gắn vào Chủ đề nào'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentTopicName ? 'Gom nhóm bài học vào lộ trình học tập' : 'Vui lòng chọn chủ đề để hiển thị trên cây kiến thức'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTopicPicker}
            disabled={saving}
            className="shrink-0 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
          >
            {currentTopicName ? 'Đổi chủ đề' : 'Chọn chủ đề'}
          </button>
        </div>
      </div>

      {/* Mục 2: Ảnh bìa / Ảnh đại diện bài học */}
      <div className="p-3.5 space-y-2">
        <TopicCoverImagePicker
          value={thumbnailUrl}
          onChange={(url) => onThumbnailChange?.(url)}
          disabled={saving}
          title="Ảnh đại diện bài học"
          compact
        />
      </div>

      {/* Mục 3: Thẻ phân loại (Tags - Từ khóa tìm kiếm ngang, Tùy chọn linh hoạt) */}
      <div className="p-3.5" data-testid="sidebar-tags-field">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === ClassificationSectionKey.TAGS ? null : ClassificationSectionKey.TAGS)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Icon name={IconName.TAG} size={15} className="text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Thẻ tìm kiếm (Tags)</span>
              <p className="text-[10px] text-slate-400 font-normal">Từ khóa phụ liên kết bài viết chéo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {selectedTags.length > 0 ? `${selectedTags.length} thẻ` : '0 thẻ'}
            </span>
            <span className={`text-slate-400 text-xs transition-transform ${isTagsOpen ? ROTATE_ARROW_CLASS : ''}`}>▼</span>
          </div>
        </button>

        <div className={isTagsOpen ? ACCORDION_OPEN_CLASSES : 'hidden'}>
          <LessonTagPicker selectedTags={selectedTags} onChange={setSelectedTags} disabled={saving} hideLabel />
        </div>
      </div>

      {/* Mục 4: Độ khó bài học */}
      <div className="p-3.5">
        <button
          type="button"
          onClick={() => setOpenSection(isDifficultyOpen ? null : ClassificationSectionKey.DIFFICULTY)}
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
            <span className={`text-slate-400 text-xs transition-transform ${isDifficultyOpen ? ROTATE_ARROW_CLASS : ''}`}>▼</span>
          </div>
        </button>

        <div className={isDifficultyOpen ? ACCORDION_OPEN_CLASSES : 'hidden'}>
          <LessonDifficultySelector value={difficulty} onChange={setDifficulty} disabled={saving} hideLabel />
        </div>
      </div>

      {/* Mục 5: Thứ tự hiển thị trong chủ đề */}
      <div className="p-3.5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Thứ tự hiển thị</span>
          <p className="text-[10px] text-slate-400">Vị trí bài học trong chương (1, 2, 3...)</p>
        </div>
        <input
          type="number"
          min={1}
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Math.max(1, parseInt(e.target.value, 10) || 1))}
          disabled={saving}
          className="w-16 text-center text-xs font-bold px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
        />
      </div>
    </div>
  );
}
