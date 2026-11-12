'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { ContentStatus } from '@/constants/enums';

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
          <Link href="/topics" className="hover:text-blue-600 transition">
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
