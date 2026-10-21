'use client';

import React from 'react';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import { SidebarTab } from '../../types/editor.types';
import { LessonQuizPanel } from '../LessonQuizPanel';
import { LessonClassificationTab } from './LessonClassificationTab';
import { LessonMediaTab } from './LessonMediaTab';
import { LessonPublishingTab } from './LessonPublishingTab';
import { LessonMediaItem } from '../../types/editor.types';
import { ResourceLinkBlockData } from '../../types/block-builder.types';
import { TagItem } from '@/types/models/tag.type';
import { LessonItem } from '@/types/models/lesson.type';
import { UseQuizEditorReturn } from '../../facades/useQuizEditor';

interface LessonPropertiesPanelProps {
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  onClose: () => void;
  mediaCount: number;

  // Classification
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
  title: string;
  openSection: 'difficulty' | 'tags' | 'order' | null;
  setOpenSection: (v: 'difficulty' | 'tags' | 'order' | null) => void;

  // Media
  thumbnailUrl: string;
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;

  // Quiz
  lessonId: string | null;
  quiz: UseQuizEditorReturn;

  // Publishing
  status: ContentStatus | any;
  wordCount: number;
  estimatedReadMinutes: number;
  sourceReferenceNote: string;
  setSourceReferenceNote: (v: string) => void;
  resourceLinks: ResourceLinkBlockData[];
  onAddResourceLink: () => void;
  onUpdateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  onRemoveResourceLink: (id: string) => void;
  onSaveLesson: (nextStatus: ContentStatus | any) => void;

  saving: boolean;
}

/** Cột 3 của LessonEditor: Panel "Thuộc tính bài học" — khung aside + thanh 4 tab
 * (Phân loại / Media / Đề ôn tập / Xuất bản) + nội dung từng tab. */
export function LessonPropertiesPanel({
  sidebarTab,
  setSidebarTab,
  onClose,
  mediaCount,
  currentTopicName,
  onOpenTopicPicker,
  difficulty,
  setDifficulty,
  selectedTags,
  setSelectedTags,
  displayOrder,
  setDisplayOrder,
  topicLessons,
  loadingTopicLessons,
  title,
  openSection,
  setOpenSection,
  thumbnailUrl,
  mediaList,
  onAddMedia,
  onRemoveMedia,
  lessonId,
  quiz,
  status,
  wordCount,
  estimatedReadMinutes,
  sourceReferenceNote,
  setSourceReferenceNote,
  resourceLinks,
  onAddResourceLink,
  onUpdateResourceLink,
  onRemoveResourceLink,
  onSaveLesson,
  saving,
}: LessonPropertiesPanelProps) {
  const tabs: Array<{ key: SidebarTab; label: string }> = [
    { key: SidebarTab.CLASSIFICATION, label: 'Phân loại' },
    { key: SidebarTab.MEDIA, label: `Media ${mediaCount > 0 ? `(${mediaCount})` : ''}` },
    { key: SidebarTab.QUIZ, label: 'Đề ôn tập' },
    { key: SidebarTab.PUBLISHING, label: 'Xuất bản' },
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-[340px] shrink-0 flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start pr-0.5 animate-in slide-in-from-right duration-200 z-20 custom-editor-scrollbar">
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
          <span className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider">Thuộc tính bài học</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition cursor-pointer font-medium"
            title="Thu gọn Sidebar"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 bg-slate-100/90 p-1 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSidebarTab(t.key)}
              className={`py-1.5 px-1 rounded-md text-[11px] font-bold transition text-center cursor-pointer ${
                sidebarTab === t.key ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {sidebarTab === SidebarTab.CLASSIFICATION && (
        <LessonClassificationTab
          currentTopicName={currentTopicName}
          onOpenTopicPicker={onOpenTopicPicker}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          displayOrder={displayOrder}
          setDisplayOrder={setDisplayOrder}
          topicLessons={topicLessons}
          loadingTopicLessons={loadingTopicLessons}
          lessonId={lessonId}
          title={title}
          saving={saving}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      )}

      {sidebarTab === SidebarTab.MEDIA && (
        <LessonMediaTab
          thumbnailUrl={thumbnailUrl}
          mediaList={mediaList}
          onAddMedia={onAddMedia}
          onRemoveMedia={onRemoveMedia}
          disabled={saving}
        />
      )}

      {sidebarTab === SidebarTab.QUIZ && (
        <div className="animate-in fade-in-50 duration-150">
          <LessonQuizPanel lessonId={lessonId} quiz={quiz} />
        </div>
      )}

      {sidebarTab === SidebarTab.PUBLISHING && (
        <LessonPublishingTab
          status={status}
          wordCount={wordCount}
          estimatedReadMinutes={estimatedReadMinutes}
          sourceReferenceNote={sourceReferenceNote}
          setSourceReferenceNote={setSourceReferenceNote}
          resourceLinks={resourceLinks}
          onAddResourceLink={onAddResourceLink}
          onUpdateResourceLink={onUpdateResourceLink}
          onRemoveResourceLink={onRemoveResourceLink}
          saving={saving}
          lessonId={lessonId}
          onSaveLesson={onSaveLesson}
        />
      )}
    </aside>
  );
}
