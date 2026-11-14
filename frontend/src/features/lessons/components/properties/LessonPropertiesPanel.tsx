'use client';

import React from 'react';
import { ClassificationSectionKey, DifficultyLevel, IconName, LessonStatus } from '@/constants/enums';
import { LessonMediaItem, SidebarTab } from '../../types/editor.types';
import { LessonQuizPanel } from '../LessonQuizPanel';
import { LessonBlockItem, ResourceLinkBlockData } from '../../types/block-builder.types';
import { LessonItem, TagItem } from '@/types/models';
import { UseQuizEditorReturn } from '../../facades/useQuizEditor';
import { BlockPropertyInspector } from '../builder/BlockPropertyInspector';
import { LessonMediaManager } from '../LessonMediaManager';
import { Badge } from '@/components/common/CommonUi';
import { DIFFICULTY_LABEL_MAP, LESSON_STATUS_LABEL_MAP, LESSON_STATUS_TONE_MAP } from '@/constants/ui-theme';
import { Icon } from '@/components/icons/Icon';
import { LessonDifficultySelector } from '../LessonEditorHeader';
import { LessonTagPicker } from '../LessonTagPicker';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';

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
  status: LessonStatus;
  wordCount: number;
  estimatedReadMinutes: number;
  sourceReferenceNote: string;
  setSourceReferenceNote: (v: string) => void;
  resourceLinks: ResourceLinkBlockData[];
  onAddResourceLink: () => void;
  onUpdateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  onRemoveResourceLink: (id: string) => void;
  onSaveLesson: (nextStatus: LessonStatus) => void;

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
                onClick={() => onSaveLesson(LessonStatus.DRAFT)}
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

// --- Merged from LessonMediaTab.tsx ---
interface LessonMediaTabProps {
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;
  disabled: boolean;
}

/** Tab "Tài liệu đính kèm" trong Panel Thuộc tính: quản lý file PDF, tài liệu nghiên cứu và tư liệu tham khảo đính kèm bài học. */
export function LessonMediaTab({
  mediaList,
  onAddMedia,
  onRemoveMedia,
  disabled,
}: LessonMediaTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3 animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Tài liệu & Tệp đính kèm
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Tải lên tài liệu PDF, tư liệu lịch sử hoặc file tham khảo cho học sinh.
          </p>
        </div>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          {mediaList.length} tệp
        </span>
      </div>

      <LessonMediaManager
        mediaList={mediaList}
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
        disabled={disabled}
      />
    </div>
  );
}

// --- Merged from LessonPublishingTab.tsx ---
interface LessonPublishingTabProps {
  status: LessonStatus;
  wordCount: number;
  estimatedReadMinutes: number;
  sourceReferenceNote: string;
  setSourceReferenceNote: (v: string) => void;
  resourceLinks: ResourceLinkBlockData[];
  onAddResourceLink: () => void;
  onUpdateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  onRemoveResourceLink: (id: string) => void;
  saving: boolean;
  lessonId: string | null;
  onSaveLesson: (nextStatus: LessonStatus) => void;
}

/** Tab "Xuất bản" trong Panel Thuộc tính: trạng thái bài học, số liệu, nguồn tư liệu
 * tham khảo, danh sách Liên kết tài nguyên (luôn xuất ở cuối bài), và 2 nút lưu chính. */
export function LessonPublishingTab({
  status,
  wordCount,
  estimatedReadMinutes,
  sourceReferenceNote,
  setSourceReferenceNote,
  resourceLinks,
  onAddResourceLink,
  onUpdateResourceLink,
  onRemoveResourceLink,
  saving,
  lessonId,
  onSaveLesson,
}: LessonPublishingTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3.5 animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Trạng thái bài học</span>
        <Badge tone={LESSON_STATUS_TONE_MAP[status] || 'slate'}>
          {LESSON_STATUS_LABEL_MAP[status] || status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{wordCount.toLocaleString('vi-VN')} từ</span>
        <span>~{estimatedReadMinutes} phút đọc</span>
      </div>

      <div className="border-t border-slate-100 pt-2.5">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Nguồn tư liệu tham khảo</span>
        <textarea
          rows={3}
          value={sourceReferenceNote}
          onChange={(e) => setSourceReferenceNote(e.target.value)}
          placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư, Lịch sử Việt Nam tập 10..."
          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-slate-50/50"
        />
      </div>

      {/* Liên kết tài nguyên tham khảo (luôn hiển thị cố định ở cuối bài học, không chèn giữa nội dung) */}
      <div className="border-t border-slate-100 pt-2.5" data-testid="sidebar-resource-links">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Liên kết tài nguyên ({resourceLinks.length})
          </span>
          <button
            type="button"
            data-testid="btn-add-resource-link"
            onClick={onAddResourceLink}
            disabled={saving}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            + Thêm
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">Danh sách liên kết/tài liệu đính kèm, luôn xuất ra ở cuối bài học.</p>

        {resourceLinks.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
            Chưa có liên kết tài nguyên nào.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {resourceLinks.map((link, idx) => (
              <div key={link.id} data-testid={`resource-link-item-${idx}`} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => onUpdateResourceLink(link.id, { title: e.target.value })}
                    placeholder="Tên tài liệu/nguồn tham khảo..."
                    className="flex-1 min-w-0 text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveResourceLink(link.id)}
                    disabled={saving}
                    title="Xóa liên kết"
                    className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => onUpdateResourceLink(link.id, { url: e.target.value })}
                  placeholder="Nhập đường dẫn web..."
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 bg-white"
                />
                <input
                  type="text"
                  value={link.note || ''}
                  onChange={(e) => onUpdateResourceLink(link.id, { note: e.target.value })}
                  placeholder="Chú thích (tùy chọn)..."
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 bg-white text-slate-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onSaveLesson(LessonStatus.REVIEW)}
          disabled={saving}
          className="primary-button !h-8 !text-xs !w-full justify-center cursor-pointer font-bold"
        >
          {lessonId ? 'Lưu cập nhật' : 'Gửi duyệt bài học'}
        </button>
        <button
          type="button"
          onClick={() => onSaveLesson(LessonStatus.DRAFT)}
          disabled={saving}
          className="secondary-button !h-8 !text-xs !w-full justify-center cursor-pointer"
        >
          {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
        </button>
      </div>
    </div>
  );
}

// --- Merged from LessonClassificationTab.tsx ---
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
