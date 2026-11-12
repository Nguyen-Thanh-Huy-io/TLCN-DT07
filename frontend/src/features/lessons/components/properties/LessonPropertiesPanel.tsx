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
  status: ContentStatus | string;
  wordCount: number;
  estimatedReadMinutes: number;
  sourceReferenceNote: string;
  setSourceReferenceNote: (v: string) => void;
  resourceLinks: ResourceLinkBlockData[];
  onAddResourceLink: () => void;
  onUpdateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  onRemoveResourceLink: (id: string) => void;
  onSaveLesson: (nextStatus: ContentStatus) => void;

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
  const isBlockMode = sidebarTab === SidebarTab.BLOCK;

  const docTabs = [
    {
      key: SidebarTab.CLASSIFICATION,
      icon: '📋',
      label: 'Hồ sơ',
      sublabel: 'Chủ đề & Thẻ',
      title: 'Chủ đề chính, ảnh bìa, thẻ tag và độ khó',
    },
    {
      key: SidebarTab.MEDIA,
      icon: '📎',
      label: 'Tài liệu',
      badge: mediaCount > 0 ? `${mediaCount}` : undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
      title: 'Tài liệu và tệp nghiên cứu đính kèm',
    },
    {
      key: SidebarTab.QUIZ,
      icon: '❓',
      label: 'Đề ôn tập',
      disabled: !lessonId,
      badge: !lessonId ? '!' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      title: !lessonId ? 'Cần lưu bài học trước khi tạo đề ôn tập' : 'Đề ôn tập trắc nghiệm',
    },
    {
      key: SidebarTab.PUBLISHING,
      icon: '🚀',
      label: 'Xuất bản',
      sublabel: 'Nguồn & Trạng thái',
      title: 'Nguồn tư liệu, liên kết và xuất bản',
    },
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-[350px] shrink-0 flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start pr-0.5 animate-in slide-in-from-right duration-200 z-20 custom-editor-scrollbar">
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-0.5">
          <span className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            {isBlockMode ? 'Thuộc tính khối' : 'Cài đặt bài học'}
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

        {/* TẦNG 1: Chuyển đổi giữa [Thuộc tính khối] và [Cài đặt bài học] */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSidebarTab(SidebarTab.BLOCK)}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isBlockMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>⚙️ Khối đang chọn</span>
            {activeBlock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isBlockMode) {
                setSidebarTab(SidebarTab.CLASSIFICATION);
              }
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isBlockMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>📄 Toàn bài học</span>
          </button>
        </div>

        {/* TẦNG 2: 4 Sub-tabs của Bài học (Dạng lưới 2x2 thoáng đãng, không bao giờ bị cắt chữ) */}
        {!isBlockMode && (
          <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 animate-in fade-in-50 duration-100">
            {docTabs.map((t) => {
              const isQuizLocked = t.key === SidebarTab.QUIZ && t.disabled;
              const isActive = sidebarTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  title={t.title}
                  onClick={() => setSidebarTab(t.key)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-between gap-1 border ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border-blue-400/60 ring-1 ring-blue-500/20'
                      : isQuizLocked
                      ? 'bg-slate-50/50 text-slate-400 border-dashed border-slate-200 hover:text-slate-600'
                      : 'bg-white/70 text-slate-700 border-slate-200/70 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs shrink-0">{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </div>
                  {t.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight shrink-0 ${
                        t.badgeColor ?? 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
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
