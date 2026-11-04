'use client';

import React from 'react';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import { SidebarTab } from '../../types/editor.types';
import { LessonQuizPanel } from '../LessonQuizPanel';
import { LessonClassificationTab } from './LessonClassificationTab';
import { LessonMediaTab } from './LessonMediaTab';
import { LessonPublishingTab } from './LessonPublishingTab';
import { LessonMediaItem } from '../../types/editor.types';
import { LessonBlockItem, ResourceLinkBlockData } from '../../types/block-builder.types';
import { TagItem } from '@/types/models/tag.type';
import { LessonItem } from '@/types/models/lesson.type';
import { UseQuizEditorReturn } from '../../facades/useQuizEditor';
import { BlockPropertyInspector } from '../builder/BlockPropertyInspector';

interface LessonPropertiesPanelProps {
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  onClose: () => void;
  mediaCount: number;

  // Block Inspector (Tái sử dụng từ Entity Studio: bấm khối nào sửa khối đó)
  activeBlock: LessonBlockItem | null;
  activeBlockIndex?: number;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveBlock: (id: string) => void;
  onChangeRowColumnCount?: (rowId: string, count: number) => void;
  onUpdateRowRatio?: (rowId: string, widths: number[]) => void;

  // Classification & Cover
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
  onThumbnailChange?: (url: string) => void;
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

/** Cột 3 của LessonEditor: Panel "Thuộc tính bài học & Thuộc tính khối" —
 * Hỗ trợ chuyển đổi nhanh: Khối đang chọn | Hồ sơ bài học | Tài liệu đính kèm | Đề ôn tập | Xuất bản. */
export function LessonPropertiesPanel({
  sidebarTab,
  setSidebarTab,
  onClose,
  mediaCount,
  activeBlock,
  activeBlockIndex,
  onUpdateBlock,
  onRemoveBlock,
  onChangeRowColumnCount,
  onUpdateRowRatio,
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
  onThumbnailChange,
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
  const tabs = [
    {
      key: SidebarTab.BLOCK,
      label: 'Khối',
      badge: activeBlock ? '●' : undefined,
      title: activeBlock ? `Chỉnh khối: ${activeBlock.type}` : 'Thuộc tính khối đang chọn',
    },
    {
      key: SidebarTab.CLASSIFICATION,
      label: 'Hồ sơ',
      title: 'Chủ đề chính, ảnh bìa, thẻ tag và độ khó',
    },
    {
      key: SidebarTab.MEDIA,
      label: `Tài liệu ${mediaCount > 0 ? `(${mediaCount})` : ''}`,
      title: 'Tài liệu và tệp nghiên cứu đính kèm',
    },
    {
      key: SidebarTab.QUIZ,
      label: 'Đề ôn',
      disabled: !lessonId,
      badge: !lessonId ? '!' : undefined,
      title: !lessonId ? 'Cần lưu bài học trước khi tạo đề ôn tập' : 'Đề ôn tập trắc nghiệm',
    },
    {
      key: SidebarTab.PUBLISHING,
      label: 'Xuất bản',
      title: 'Nguồn tư liệu, liên kết và xuất bản',
    },
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-[350px] shrink-0 flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start pr-0.5 animate-in slide-in-from-right duration-200 z-20 custom-editor-scrollbar">
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
          <span className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            {sidebarTab === SidebarTab.BLOCK ? 'Thuộc tính khối' : 'Thuộc tính bài học'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition cursor-pointer font-medium"
            title="Thu gọn Sidebar"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1 bg-slate-100/90 p-1 rounded-lg">
          {tabs.map((t) => {
            const isQuizLocked = t.key === SidebarTab.QUIZ && t.disabled;
            const isActive = sidebarTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                title={t.title}
                onClick={() => setSidebarTab(t.key)}
                className={`py-1.5 px-0.5 rounded-md text-[11px] font-bold transition text-center cursor-pointer flex items-center justify-center gap-0.5 relative ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : isQuizLocked
                    ? 'text-slate-400 hover:text-slate-600 opacity-70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{t.label}</span>
                {t.badge && (
                  <span
                    className={`text-[9px] px-1 py-0 rounded-full font-bold leading-none ${
                      isQuizLocked
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-emerald-500'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {sidebarTab === SidebarTab.BLOCK && (
        <div className="animate-in fade-in-50 duration-150">
          <BlockPropertyInspector
            block={activeBlock}
            blockIndex={activeBlockIndex}
            onUpdateBlock={onUpdateBlock}
            onRemoveBlock={onRemoveBlock}
            onChangeRowColumnCount={onChangeRowColumnCount}
            onUpdateRowRatio={onUpdateRowRatio}
            className="w-full bg-white border border-slate-200 rounded-xl flex flex-col justify-between shrink-0 shadow-2xs select-none"
          />
        </div>
      )}

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
          thumbnailUrl={thumbnailUrl}
          onThumbnailChange={onThumbnailChange}
          saving={saving}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />
      )}

      {sidebarTab === SidebarTab.MEDIA && (
        <LessonMediaTab
          mediaList={mediaList}
          onAddMedia={onAddMedia}
          onRemoveMedia={onRemoveMedia}
          disabled={saving}
        />
      )}

      {sidebarTab === SidebarTab.QUIZ && (
        <div className="animate-in fade-in-50 duration-150">
          {!lessonId ? (
            <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-2xs text-center space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-sm font-bold">
                !
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                Cần lưu bài học trước khi tạo đề ôn tập
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Hệ thống cần ID bài học để liên kết với ngân hàng câu hỏi và bộ Quiz.
              </p>
              <button
                type="button"
                onClick={() => onSaveLesson(ContentStatus.DRAFT)}
                disabled={saving}
                className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{saving ? 'Đang lưu...' : 'Lưu nháp bài học ngay'}</span>
              </button>
            </div>
          ) : (
            <LessonQuizPanel lessonId={lessonId} quiz={quiz} />
          )}
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
