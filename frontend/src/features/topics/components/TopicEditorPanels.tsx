'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { IconName, ContentStatus, KeyboardKey } from '@/constants/enums';
import { TopicCoverImagePicker } from './TopicCoverImagePicker';
import { TopicItem } from '@/types/models';

// === TopicEditorHeader.tsx ===
export enum PublishActionType {
  DRAFT = 'DRAFT',
  PUBLISH = 'PUBLISH',
}

export interface PublishActionMeta {
  targetStatus: ContentStatus;
  labelCreate: string;
  labelEdit: string;
  loadingLabel: string;
}

export const PUBLISH_ACTION_CONFIG: Record<PublishActionType, PublishActionMeta> = {
  [PublishActionType.DRAFT]: {
    targetStatus: ContentStatus.DRAFT,
    labelCreate: 'Lưu bản nháp',
    labelEdit: 'Chuyển về bản nháp',
    loadingLabel: 'Đang lưu nháp...',
  },
  [PublishActionType.PUBLISH]: {
    targetStatus: ContentStatus.PUBLISHED,
    labelCreate: 'Xuất bản chủ đề',
    labelEdit: 'Lưu & Xuất bản',
    loadingLabel: 'Đang xuất bản...',
  },
};

export interface TopicEditorHeaderProps {
  isEditMode: boolean;
  topicId?: string;
  status: ContentStatus;
  savingAction: PublishActionType | null;
  isCurriculumPreviewOpen: boolean;
  onToggleCurriculumPreview: () => void;
  onCancel: () => void;
  onAction: (action: PublishActionType) => void;
}

export function TopicEditorHeader({
  isEditMode,
  topicId,
  status,
  savingAction,
  isCurriculumPreviewOpen,
  onToggleCurriculumPreview,
  onCancel,
  onAction,
}: TopicEditorHeaderProps) {
  const isDraftSaving = savingAction === PublishActionType.DRAFT;
  const isPublishSaving = savingAction === PublishActionType.PUBLISH;

  const draftButtonLabel = isDraftSaving
    ? PUBLISH_ACTION_CONFIG[PublishActionType.DRAFT].loadingLabel
    : isEditMode
      ? PUBLISH_ACTION_CONFIG[PublishActionType.DRAFT].labelEdit
      : PUBLISH_ACTION_CONFIG[PublishActionType.DRAFT].labelCreate;

  const publishButtonLabel = isPublishSaving
    ? PUBLISH_ACTION_CONFIG[PublishActionType.PUBLISH].loadingLabel
    : isEditMode
      ? status === ContentStatus.PUBLISHED
        ? 'Lưu thay đổi'
        : PUBLISH_ACTION_CONFIG[PublishActionType.PUBLISH].labelEdit
      : PUBLISH_ACTION_CONFIG[PublishActionType.PUBLISH].labelCreate;

  return (
    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Link href="/curriculum" className="hover:text-blue-600 transition">
            Chủ đề học tập
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">
            {isEditMode ? 'Chỉnh sửa' : 'Tạo mới'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Chỉnh sửa Chủ đề lịch sử' : 'Thêm Chủ đề mới'}
          </h1>
          {isEditMode && topicId && (
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              ID: {topicId.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-xs px-3.5 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={Boolean(savingAction)}
        >
          Hủy bỏ
        </button>

        <button
          type="button"
          onClick={onToggleCurriculumPreview}
          className={`group relative text-xs px-3 py-2 font-semibold rounded-lg border transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
            isCurriculumPreviewOpen
              ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100'
              : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-300 hover:border-blue-300'
          }`}
          title="Bật/Tắt Trợ lý Sơ đồ Cây tri thức bên phải"
        >
          <Icon name={IconName.GRID} size={14} className={isCurriculumPreviewOpen ? 'text-white' : 'text-blue-600'} />
          <span>Sơ đồ Cây</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </button>

        <button
          type="button"
          onClick={() => onAction(PublishActionType.DRAFT)}
          className="text-xs px-3.5 py-2 font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          disabled={Boolean(savingAction)}
        >
          {isDraftSaving && (
            <span className="w-3 h-3 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
          )}
          <span>{draftButtonLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => onAction(PublishActionType.PUBLISH)}
          className="btn-primary text-xs px-4 py-2 font-medium inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-2xs"
          disabled={Boolean(savingAction)}
        >
          {isPublishSaving && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <span>{publishButtonLabel}</span>
        </button>
      </div>
    </div>
  );
}

// === TopicInspectorSidebar.tsx ===
const CHECK_BADGE_PASS_CLS = 'bg-emerald-100 text-emerald-700';
const CHECK_BADGE_FAIL_CLS = 'bg-slate-200 text-slate-500';
const CHECK_TEXT_PASS_CLS = 'text-slate-700 font-medium';
const CHECK_TEXT_FAIL_CLS = 'text-slate-500';

export interface TimelinePreviewItem {
  id: string;
  name: string;
  displayOrder: number;
  isCurrent: boolean;
  isShifted?: boolean;
}

export interface TopicInspectorSidebarProps {
  isEditMode: boolean;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  displayOrder: number;
  onSelectDisplayOrder: (order: number) => void;
  parentBreadcrumbPath: string;
  previewTimeline: TimelinePreviewItem[];
  isSequential: boolean;
  onSequentialChange: (isSequential: boolean) => void;
  coverImageUrl: string;
  onCoverImageChange: (url: string) => void;
  actionLoading: boolean;
  topicName: string;
  description: string;
  onOpenCurriculumPreview: () => void;
}

function TopicEditorialChecklist({
  isNameValid,
  isDescValid,
  isCoverValid,
  isOrderValid,
  displayOrder,
}: {
  isNameValid: boolean;
  isDescValid: boolean;
  isCoverValid: boolean;
  isOrderValid: boolean;
  displayOrder: number;
}) {
  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-xs">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <Icon name={IconName.SPARK} size={15} className="text-blue-600" />
        <span>Tiêu chuẩn biên tập</span>
      </h3>
      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
        Các tiêu chí giúp chủ đề học tập đạt chất lượng cao trên ứng dụng người dùng:
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isNameValid ? CHECK_BADGE_PASS_CLS : CHECK_BADGE_FAIL_CLS
            }`}
          >
            {isNameValid ? '✓' : '•'}
          </span>
          <span className={isNameValid ? CHECK_TEXT_PASS_CLS : CHECK_TEXT_FAIL_CLS}>
            Tên chủ đề rõ ràng (≥ 5 ký tự)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isDescValid ? CHECK_BADGE_PASS_CLS : CHECK_BADGE_FAIL_CLS
            }`}
          >
            {isDescValid ? '✓' : '•'}
          </span>
          <span className={isDescValid ? CHECK_TEXT_PASS_CLS : CHECK_TEXT_FAIL_CLS}>
            Có mô tả bối cảnh & mục tiêu học
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isCoverValid ? CHECK_BADGE_PASS_CLS : CHECK_BADGE_FAIL_CLS
            }`}
          >
            {isCoverValid ? '✓' : '•'}
          </span>
          <span className={isCoverValid ? CHECK_TEXT_PASS_CLS : CHECK_TEXT_FAIL_CLS}>
            Có ảnh bìa minh họa trực quan
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isOrderValid ? CHECK_BADGE_PASS_CLS : CHECK_BADGE_FAIL_CLS
            }`}
          >
            {isOrderValid ? '✓' : '•'}
          </span>
          <span className={isOrderValid ? CHECK_TEXT_PASS_CLS : CHECK_TEXT_FAIL_CLS}>
            Đã định vị trên cây tri thức (#{displayOrder})
          </span>
        </div>
      </div>
    </div>
  );
}

function TopicLiveTimelinePreview({
  displayOrder,
  parentBreadcrumbPath,
  previewTimeline,
  onSelectDisplayOrder,
  onOpenCurriculumPreview,
}: {
  displayOrder: number;
  parentBreadcrumbPath: string;
  previewTimeline: TimelinePreviewItem[];
  onSelectDisplayOrder: (order: number) => void;
  onOpenCurriculumPreview: () => void;
}) {
  return (
    <div className="bg-white border border-blue-200/90 rounded-xl p-5 shadow-xs ring-1 ring-blue-50">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Vị trí thực tế trên Cây tri thức
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          #{String(displayOrder).padStart(2, '0')}
        </span>
      </div>

      <div className="text-xs text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Đường dẫn:</div>
        <div className="font-medium text-slate-800 text-sm">{parentBreadcrumbPath}</div>
      </div>

      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
        <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
          <span>Thứ tự các chủ đề trong nhánh:</span>
          <span className="text-slate-400 font-normal">{previewTimeline.length} mục</span>
        </div>

        {previewTimeline.map((item, index) => {
          const isTarget = item.isCurrent;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isTarget) onSelectDisplayOrder(index + 1);
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition cursor-pointer text-xs ${
                isTarget
                  ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title={isTarget ? 'Vị trí của chủ đề bạn đang nhập' : `Click để chèn vào vị trí #${index + 1}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span
                  className={`font-mono font-bold text-xs shrink-0 ${
                    isTarget ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  #{String(item.displayOrder).padStart(2, '0')}
                </span>
                <span className="truncate text-xs md:text-sm" title={item.name}>
                  {item.name}
                </span>
              </div>

              <div className="shrink-0">
                {isTarget ? (
                  <span className="text-[10px] bg-white text-blue-700 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                    Đang sửa
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Đặt vào đây</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Vừa sửa bên trái &rarr; Bên phải tự nhảy</span>
        <button
          type="button"
          onClick={onOpenCurriculumPreview}
          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
        >
          Xem toàn cây ↗
        </button>
      </div>
    </div>
  );
}

export function TopicInspectorSidebar({
  isEditMode,
  status,
  createdAt,
  updatedAt,
  displayOrder,
  onSelectDisplayOrder,
  parentBreadcrumbPath,
  previewTimeline,
  isSequential,
  onSequentialChange,
  coverImageUrl,
  onCoverImageChange,
  actionLoading,
  topicName,
  description,
  onOpenCurriculumPreview,
}: TopicInspectorSidebarProps) {
  const isNameValid = topicName.trim().length >= 5;
  const isDescValid = description.trim().length >= 20;
  const isCoverValid = coverImageUrl.trim().length > 0;
  const isOrderValid = displayOrder > 0;

  return (
    <div className="space-y-6">
      <TopicLiveTimelinePreview
        displayOrder={displayOrder}
        parentBreadcrumbPath={parentBreadcrumbPath}
        previewTimeline={previewTimeline}
        onSelectDisplayOrder={onSelectDisplayOrder}
        onOpenCurriculumPreview={onOpenCurriculumPreview}
      />

      {isEditMode && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            Trạng thái nội dung
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === ContentStatus.PUBLISHED
                  ? 'bg-emerald-500'
                  : status === ContentStatus.DRAFT
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-800">
              {status === ContentStatus.PUBLISHED
                ? 'Đang xuất bản'
                : status === ContentStatus.DRAFT
                  ? 'Bản nháp riêng tư'
                  : status === ContentStatus.PENDING_REVIEW
                    ? 'Đang chờ duyệt'
                    : 'Đã lưu trữ'}
            </span>
          </div>

          {createdAt && (
            <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
              <div>Tạo ngày: {new Date(createdAt).toLocaleDateString('vi-VN')}</div>
              {updatedAt && <div>Cập nhật: {new Date(updatedAt).toLocaleDateString('vi-VN')}</div>}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Cấu hình tiến trình học
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSequential}
              onChange={(e) => onSequentialChange(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600"
            />
            <div className="text-xs">
              <span className="font-medium text-slate-800 block">Yêu cầu học tuần tự</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Học sinh phải hoàn thành bài trước để mở khóa bài tiếp theo.
              </span>
            </div>
          </label>
        </div>
      </div>

      <TopicCoverImagePicker
        value={coverImageUrl}
        onChange={onCoverImageChange}
        disabled={actionLoading}
      />

      <TopicEditorialChecklist
        isNameValid={isNameValid}
        isDescValid={isDescValid}
        isCoverValid={isCoverValid}
        isOrderValid={isOrderValid}
        displayOrder={displayOrder}
      />
    </div>
  );
}

// === TopicChildrenManager.tsx ===
export interface TopicChildrenManagerProps {
  topicId: string;
  childrenTopics: TopicItem[];
  availableCandidatesToAttach: TopicItem[];
  selectedCandidateId: string;
  onSelectCandidateId: (id: string) => void;
  actionLoading: boolean;
  onAttachChild: () => void;
  onDetachChild: (id: string, name: string) => void;
  onQuickCreateChild: (name: string) => Promise<void>;
  onNavigateToCreate: () => void;
  onNavigateToEditChild: (childId: string) => void;
}

export function TopicChildrenManager({
  childrenTopics,
  availableCandidatesToAttach,
  selectedCandidateId,
  onSelectCandidateId,
  actionLoading,
  onAttachChild,
  onDetachChild,
  onQuickCreateChild,
  onNavigateToCreate,
  onNavigateToEditChild,
}: TopicChildrenManagerProps) {
  const [isQuickChildOpen, setIsQuickChildOpen] = useState(false);
  const [quickChildName, setQuickChildName] = useState('');
  const [quickCreating, setQuickCreating] = useState(false);

  const handleQuickCreate = async () => {
    const trimmed = quickChildName.trim();
    if (!trimmed) {
      alert('Vui lòng nhập tên chủ đề trực thuộc');
      return;
    }
    try {
      setQuickCreating(true);
      await onQuickCreateChild(trimmed);
      setQuickChildName('');
      setIsQuickChildOpen(false);
    } finally {
      setQuickCreating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>03. Chủ đề trực thuộc</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {childrenTopics.length} chủ đề trực thuộc
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các phân mục trực thuộc chủ đề này trong cấu trúc cây tri thức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickChildOpen((prev) => !prev)}
            className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
              isQuickChildOpen
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <span>{isQuickChildOpen ? '✕ Đóng' : '+ Tạo nhanh chủ đề trực thuộc'}</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md border border-slate-200 transition cursor-pointer"
            title="Mở toàn màn hình để tùy biến sâu"
          >
            <span>Chi tiết ↗</span>
          </button>
        </div>
      </div>

      {/* Thanh Tạo Nhanh Chủ Đề Trực Thuộc Tại Chỗ */}
      {isQuickChildOpen && (
        <div className="mb-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg animate-in fade-in duration-150">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>⚡ Tạo nhanh chủ đề trực thuộc:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={quickChildName}
              onChange={(e) => setQuickChildName(e.target.value)}
              onKeyDown={(e) => e.key === KeyboardKey.ENTER && handleQuickCreate()}
              placeholder="Nhập tên chủ đề trực thuộc..."
              autoFocus
              disabled={quickCreating}
              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsQuickChildOpen(false);
                  setQuickChildName('');
                }}
                disabled={quickCreating}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={quickCreating || !quickChildName.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-2xs transition cursor-pointer"
              >
                {quickCreating ? 'Đang tạo...' : 'Tạo ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách chủ đề trực thuộc hiện tại */}
      {childrenTopics.length > 0 ? (
        <div className="space-y-2 mb-4">
          {childrenTopics.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Icon name={IconName.FOLDER} size={15} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-900 truncate">{child.name}</span>
                {child._count?.lessons !== undefined && (
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
                    {child._count.lessons} bài học
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateToEditChild(child.id)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-white transition"
                >
                  Xem / Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDetachChild(child.id, child.name)}
                  disabled={actionLoading}
                  className="text-[11px] text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition"
                  title="Tách chủ đề này ra thành chủ đề gốc độc lập"
                >
                  Tách ra
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg p-5 text-center mb-4">
          Chủ đề này chưa có phân mục trực thuộc nào.
        </div>
      )}

      {/* Gắn thêm chủ đề hiện có */}
      <div className="pt-3 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-700 block mb-2">
          Gắn thêm một chủ đề hiện có vào chủ đề này:
        </span>
        <div className="flex gap-2">
          <select
            value={selectedCandidateId}
            onChange={(e) => onSelectCandidateId(e.target.value)}
            disabled={actionLoading || availableCandidatesToAttach.length === 0}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 focus:bg-white focus:outline-none"
          >
            <option value="">
              {availableCandidatesToAttach.length > 0
                ? '-- Chọn chủ đề cần gắn trực thuộc --'
                : '-- Không có chủ đề khả dụng để gán --'}
            </option>
            {availableCandidatesToAttach.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {cand.name} {cand.parent ? `(Đang thuộc: ${cand.parent.name})` : '(Chủ đề gốc)'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAttachChild}
            disabled={!selectedCandidateId || actionLoading}
            className="btn-secondary text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {actionLoading ? 'Đang gắn...' : 'Gắn vào chủ đề này'}
          </button>
        </div>
      </div>
    </div>
  );
}
