'use client';

import React, { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { DifficultyLevel, IconName, ContentStatus } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { AutoSaveState, EditorViewMode, LessonEditorMainTab, LessonHeaderMetaFormProps } from '../types/editor.types';
import { LessonHeaderActions } from './LessonHeaderActions';

interface LessonEditorHeaderProps {
  lessonId: string | null;
  status: ContentStatus;
  isReviewer: boolean;
  saving: boolean;
  autoSaveState: AutoSaveState;
  lastSavedAt: Date | null;
  hasLocalDraft: boolean;
  lastSavedTime: string | null;
  mainTab: LessonEditorMainTab;
  onChangeMainTab: (tab: LessonEditorMainTab) => void;
  blockCount: number;
  hasTopic: boolean;
  submitHint?: string;
  canSubmit?: boolean;
  assigneeName: string;
  assigneeRoleLabel: string;
  onSaveLesson: (nextStatus: ContentStatus) => void;
  onOpenSidePanel: () => void;
  onOpenCurriculumPreview: () => void;
  onRestoreDraft: () => void;
  onDismissDraft: () => void;
  isMoreMenuOpen: boolean;
  onToggleMoreMenu: () => void;
  onCloseMoreMenu: () => void;
  moreMenuRef: RefObject<HTMLDivElement | null>;
}

const MAIN_TAB_ACTIVE_CLASS = 'bg-white text-slate-900 shadow-2xs';
const MAIN_TAB_INACTIVE_CLASS = 'text-slate-600 hover:text-slate-900';

/** Thanh header chính (Tầng 1) của LessonEditor: Thoát + tiêu đề + badge trạng thái,
 * trạng thái auto-save, nút Thuộc tính, nút Gửi duyệt/Cập nhật, và menu "•••" cho các
 * thao tác phụ (lưu nháp, toàn màn hình, trợ lý cây tri thức, khôi phục bản nháp). */
export function LessonEditorHeader({
  lessonId,
  status,
  isReviewer,
  saving,
  autoSaveState,
  lastSavedAt,
  hasLocalDraft,
  lastSavedTime,
  mainTab,
  onChangeMainTab,
  blockCount,
  hasTopic,
  submitHint,
  canSubmit = true,
  assigneeName,
  assigneeRoleLabel,
  onSaveLesson,
  onOpenSidePanel,
  onOpenCurriculumPreview,
  onRestoreDraft,
  onDismissDraft,
  isMoreMenuOpen,
  onToggleMoreMenu,
  onCloseMoreMenu,
  moreMenuRef,
}: LessonEditorHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
      {/* Khối bên trái: Thoát + Tiêu đề trang + Badge trạng thái */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => {
            // Quay lại ĐÚNG trang vừa đến (ví dụ tab "Thư viện" trong Curriculum Studio).
            // Trang danh sách bài học độc lập /lessons đã bị gỡ (gộp vào tab Thư viện để
            // tránh trùng lặp giao diện) nên fallback khi không có lịch sử điều hướng giờ
            // trỏ về /curriculum — nơi duy nhất còn hiển thị danh sách bài học.
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(APP_ROUTES.CURRICULUM);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer shrink-0"
          title="Quay lại"
        >
          <span className="text-base leading-none">←</span>
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
          <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            {lessonId ? 'Chỉnh sửa Bài học' : 'Soạn thảo Bài học'}
          </h1>
        </div>
      </div>

      {/* Khối giữa: Chuyển 2 tab gọn nhẹ [Thông tin | Nội dung] ngay trên header */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 shrink-0">
        <button
          type="button"
          data-testid="tab-lesson-info"
          onClick={() => onChangeMainTab(LessonEditorMainTab.INFO)}
          className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            mainTab === LessonEditorMainTab.INFO ? MAIN_TAB_ACTIVE_CLASS : MAIN_TAB_INACTIVE_CLASS
          }`}
        >
          <span>Thông tin</span>
          {!hasTopic && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
              title="Chưa chọn chủ đề"
            />
          )}
        </button>

        <button
          type="button"
          data-testid="tab-lesson-cms"
          onClick={() => onChangeMainTab(LessonEditorMainTab.CMS)}
          className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            mainTab === LessonEditorMainTab.CMS ? MAIN_TAB_ACTIVE_CLASS : MAIN_TAB_INACTIVE_CLASS
          }`}
        >
          <span>Nội dung</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
            {blockCount}
          </span>
        </button>
      </div>

      {/* Khối bên phải: Cụm công cụ kiểu Sanity (Cảnh báo, Trợ giúp, Phân công, Pill Trạng thái, Lưu, Gửi duyệt, •••) */}
      <LessonHeaderActions
        lessonId={lessonId}
        status={status}
        isReviewer={isReviewer}
        saving={saving}
        autoSaveState={autoSaveState}
        lastSavedAt={lastSavedAt}
        hasLocalDraft={hasLocalDraft}
        lastSavedTime={lastSavedTime}
        canSubmit={canSubmit}
        submitHint={submitHint}
        assigneeName={assigneeName}
        assigneeRoleLabel={assigneeRoleLabel}
        onSaveLesson={onSaveLesson}
        onOpenSidePanel={onOpenSidePanel}
        onOpenCurriculumPreview={onOpenCurriculumPreview}
        onRestoreDraft={onRestoreDraft}
        onDismissDraft={onDismissDraft}
        isMoreMenuOpen={isMoreMenuOpen}
        onToggleMoreMenu={onToggleMoreMenu}
        onCloseMoreMenu={onCloseMoreMenu}
        moreMenuRef={moreMenuRef}
      />
    </header>
  );
}

// --- Merged from LessonDifficultySelector.tsx ---
export interface LessonDifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (val: DifficultyLevel) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; activeClass: string; dotClass: string }
> = {
  [DifficultyLevel.EASY]: {
    label: 'Dễ',
    activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400 font-bold',
    dotClass: 'bg-emerald-500',
  },
  [DifficultyLevel.MEDIUM]: {
    label: 'Trung bình',
    activeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400 font-bold',
    dotClass: 'bg-amber-500',
  },
  [DifficultyLevel.HARD]: {
    label: 'Nâng cao',
    activeClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400 font-bold',
    dotClass: 'bg-rose-500',
  },
};

export function LessonDifficultySelector({
  value,
  onChange,
  disabled = false,
  hideLabel = false,
}: LessonDifficultySelectorProps) {
  return (
    <div className="space-y-1.5">
      {!hideLabel && (
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
          Độ khó bài học
        </label>
      )}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/80 border border-slate-200/80 rounded-lg">
        {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((level) => {
          const config = DIFFICULTY_CONFIG[level];
          const isSelected = value === level;

          return (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level)}
              className={`py-1.5 px-0.5 rounded-md text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer border select-none ${
                isSelected
                  ? config.activeClass
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
              <span className="shrink-0 tracking-tight">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Merged from LessonEditorSubHeader.tsx ---
const ACTIVE_TAB_CLASS = 'bg-white text-slate-900 font-bold shadow-2xs';
const INACTIVE_TAB_CLASS = 'text-slate-600 hover:text-slate-900';
const SUBHEADER_TOGGLE_BTN_BASE =
  'h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer font-medium';
const SUBHEADER_TOGGLE_BTN_ACTIVE = 'bg-blue-100 text-blue-700 font-bold';

interface LessonEditorSubHeaderProps {
  activeTab: EditorViewMode;
  onChangeTab: (tab: EditorViewMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showLeftToc: boolean;
  onToggleLeftToc: () => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  inline?: boolean;
}

/** Sub-header: chuyển chế độ xem Soạn thảo/Chia đôi/Xem trước + nút ẩn/hiện
 * cột "Khối nội dung" bên trái, "Thuộc tính" bên phải + Toàn màn hình. */
export function LessonEditorSubHeader({
  activeTab,
  onChangeTab,
  isFullscreen,
  onToggleFullscreen,
  showLeftToc,
  onToggleLeftToc,
  showSidebar = false,
  onToggleSidebar,
  inline = false,
}: LessonEditorSubHeaderProps) {
  return (
    <div
      className={
        inline
          ? 'flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100'
          : 'flex items-center justify-between gap-3 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs'
      }
    >
      <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs md:text-sm font-medium">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === EditorViewMode.EDIT ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS
          }`}
          onClick={() => onChangeTab(EditorViewMode.EDIT)}
          title="Chế độ soạn thảo tập trung"
        >
          <Icon name={IconName.EDIT} size={14} />
          <span>Soạn thảo</span>
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === EditorViewMode.SPLIT ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS
          }`}
          onClick={() => onChangeTab(EditorViewMode.SPLIT)}
          title="Soạn thảo bên trái, xem kết quả bên phải"
        >
          <Icon name={IconName.GRID} size={14} />
          <span>Chia đôi</span>
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === EditorViewMode.PREVIEW ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS
          }`}
          onClick={() => onChangeTab(EditorViewMode.PREVIEW)}
          title="Xem trước toàn bộ giao diện bài học"
        >
          <Icon name={IconName.EYE} size={14} />
          <span>Xem trước</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {!isFullscreen && activeTab !== EditorViewMode.PREVIEW && (
          <button
            type="button"
            onClick={onToggleLeftToc}
            className={`${SUBHEADER_TOGGLE_BTN_BASE} ${
              showLeftToc ? SUBHEADER_TOGGLE_BTN_ACTIVE : ''
            }`}
            title={showLeftToc ? 'Ẩn thanh công cụ khối bên trái' : 'Hiện thanh công cụ khối bên trái'}
          >
            <Icon name={IconName.GRID} size={14} />
            <span>Khối nội dung</span>
          </button>
        )}

        {!isFullscreen && activeTab === EditorViewMode.EDIT && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            data-testid="btn-toggle-properties-sidebar"
            className={`${SUBHEADER_TOGGLE_BTN_BASE} ${
              showSidebar ? SUBHEADER_TOGGLE_BTN_ACTIVE : ''
            }`}
            title={showSidebar ? 'Ẩn bảng thuộc tính khối bên phải' : 'Hiện bảng thuộc tính khối bên phải'}
          >
            <Icon name={IconName.SETTINGS} size={14} />
            <span>Thuộc tính</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`${SUBHEADER_TOGGLE_BTN_BASE} ${
            isFullscreen ? SUBHEADER_TOGGLE_BTN_ACTIVE : ''
          }`}
          title={isFullscreen ? 'Thu nhỏ giao diện' : 'Mở rộng soạn thảo toàn màn hình'}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M10 4v6m0 0H4m6 0L3 3m11 7h6m-6 0V4m0 6l7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
          <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>

        {/* Nút "Thuộc tính" đã bỏ ở đây vì trùng với nút ở header trên (cùng điều khiển showSidebar). */}
      </div>
    </div>
  );
}

// --- Merged from LessonHeaderMetaForm.tsx ---
export const LessonHeaderMetaForm: React.FC<LessonHeaderMetaFormProps> = ({
  data,
  onChange,
  topics,
  disabled = false,
  className = '',
}) => {
  const maxDescLength = 200;
  const currentDescLength = (data.shortDescription || data.description || '').length;
  const currentTopic = topics?.find((t) => t.id === data.topicId);

  return (
    <div
      data-testid="lesson-header-meta-form"
      className={`space-y-3 font-sans ${className}`}
    >
      {/* 1. Nhãn phân nhóm / Chủ đề bài học */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/70">
            {currentTopic ? `Chủ đề: ${currentTopic.name}` : 'BÀI HỌC LỊCH SỬ'}
          </span>
          {currentTopic?.periodName && (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              • {currentTopic.periodName}
            </span>
          )}
        </div>

        <span
          data-testid="desc-counter"
          className={`text-[11px] font-mono ${
            currentDescLength > maxDescLength ? 'text-rose-600 font-bold' : 'text-slate-400'
          }`}
        >
          {currentDescLength}/{maxDescLength} ký tự
        </span>
      </div>

      {/* 2. Tiêu đề bài học - Dạng headline biên tập thoáng đãng, sang trọng */}
      <div className="relative group">
        <input
          id="input-lesson-title"
          data-testid="input-lesson-title"
          type="text"
          disabled={disabled}
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Nhập tiêu đề bài học (Ví dụ: Chiến dịch Điện Biên Phủ năm 1954)..."
          className="w-full text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-amber-500 pb-1.5 focus:outline-none transition-colors bg-transparent placeholder:text-slate-300 placeholder:font-serif leading-tight"
        />
      </div>

      {/* 3. Mô tả ngắn (Giới thiệu & xem trước) */}
      <div className="relative">
        <textarea
          id="textarea-short-desc"
          data-testid="textarea-short-desc"
          rows={2}
          disabled={disabled}
          value={data.description || data.shortDescription || data.summary || ''}
          onChange={(e) => {
            onChange('shortDescription', e.target.value);
            onChange('description', e.target.value);
            onChange('summary', e.target.value);
          }}
          placeholder="Tóm tắt ngắn gọn bối cảnh và ý nghĩa bài học dùng hiển thị ở thẻ tìm kiếm & danh mục xem trước..."
          className="w-full text-sm sm:text-base text-slate-600 font-medium p-1 border-b border-transparent hover:border-slate-200 focus:border-amber-400 focus:outline-none transition-colors bg-transparent placeholder:text-slate-400 resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};
