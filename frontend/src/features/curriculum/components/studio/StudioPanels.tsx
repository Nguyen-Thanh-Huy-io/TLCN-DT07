'use client';

import React from 'react';
import { ContentStatus, IconName } from '@/constants/enums';
import { Icon } from '@/components/icons/Icon';
import {
  CurriculumTrackItem,
  LearningPathItem,
} from '@/services/entities/learner.service';
import { StudioTab } from '../HisgoStudioView';
import { STATUS_LABEL_MAP } from '@/constants/ui-theme';
import { StatusPill } from '@/features/articles/components/ArticleList';
import { ArchiveStatusButton } from '@/components/common/CommonUi';

// --- LearningPathListPanel.tsx ---
interface LearningPathListPanelProps {
  paths: LearningPathItem[];
  tracks?: CurriculumTrackItem[];
  loading: boolean;
  onSelectPath: (id: string) => void;
  onCreatePath: () => void;
  onCreateTrack?: () => void;
  onEditTrack?: (track: CurriculumTrackItem) => void;
  onDeleteTrack?: (track: CurriculumTrackItem) => void;
  onCreateStageInTrack?: (trackId: string, lastStageId: string | null, nextStageOrder: number) => void;
  onCreateThematicPath?: () => void;
  canManageTracks?: boolean;
}

/** Danh sách Lộ trình học gom theo Mạch tiến trình (CurriculumTrack) & Chuyên đề chuyên sâu (THEMATIC). */
export function LearningPathListPanel({
  paths,
  tracks = [],
  loading,
  onSelectPath,
  onCreatePath,
  onCreateTrack,
  onEditTrack,
  onDeleteTrack,
  onCreateStageInTrack,
  onCreateThematicPath,
  canManageTracks = false,
}: LearningPathListPanelProps) {
  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-600 font-medium">Đang tải danh sách lộ trình...</div>;
  }

  const chronologicalPaths = paths.filter((p) => p.pathType !== 'THEMATIC');
  const thematicPaths = paths.filter((p) => p.pathType === 'THEMATIC');

  const sortStagesInTrack = (items: LearningPathItem[]) => {
    const byId = new Map(items.map((p) => [p.id, p]));
    const children = new Map<string, LearningPathItem[]>();
    const roots: LearningPathItem[] = [];
    for (const item of items) {
      if (item.prerequisitePathId && byId.has(item.prerequisitePathId)) {
        const list = children.get(item.prerequisitePathId) || [];
        list.push(item);
        children.set(item.prerequisitePathId, list);
      } else {
        roots.push(item);
      }
    }
    roots.sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0) || (a.displayOrder || 0) - (b.displayOrder || 0));
    const ordered: LearningPathItem[] = [];
    const visited = new Set<string>();
    const queue = [...roots];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr.id)) continue;
      visited.add(curr.id);
      ordered.push(curr);
      const next = (children.get(curr.id) || []).sort(
        (a, b) => (a.stageOrder || 0) - (b.stageOrder || 0) || (a.displayOrder || 0) - (b.displayOrder || 0),
      );
      queue.push(...next);
    }
    for (const item of items) {
      if (!visited.has(item.id)) ordered.push(item);
    }
    return ordered;
  };

  const assignedTrackIds = new Set(tracks.map((t) => t.id));
  const unassignedChrono = sortStagesInTrack(
    chronologicalPaths.filter((p) => !p.trackId || !assignedTrackIds.has(p.trackId)),
  );

  const renderPathCard = (path: LearningPathItem, stageNumber?: number) => {
    const chapterCount = path.chapters?.length || 0;
    const lessonCount = (path.chapters || []).reduce(
      (sum, c) => sum + (c.chapterLessons?.length || 0),
      0,
    );
    return (
      <button
        key={path.id}
        type="button"
        onClick={() => onSelectPath(path.id)}
        className="text-left border border-slate-200 rounded-lg p-3.5 bg-white hover:border-emerald-400 hover:shadow-2xs transition-all flex flex-col justify-between cursor-pointer"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {stageNumber !== undefined && (
                <span className="inline-flex items-center rounded-md bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white">
                  Chặng {String(stageNumber).padStart(2, '0')}
                </span>
              )}
              <StatusPill status={path.status} />
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                  path.pathType === 'THEMATIC'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {path.pathType === 'THEMATIC' ? 'Chuyên đề' : 'Niên biểu'}
              </span>
              {path.stageExamQuiz && (
                <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Thi cuối chặng ({path.stageExamPassScore ?? path.stageExamQuiz.passingScorePercent ?? 70}%)
                </span>
              )}
            </div>
            <Icon name={IconName.ARROW} size={13} className="text-slate-400" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{path.title}</h3>

          {path.description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{path.description}</p>
          )}
        </div>

        <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
          <span className="font-bold text-slate-800">{chapterCount} chương</span>
          <span className="text-slate-400">&bull;</span>
          <span>{lessonCount} bài học</span>
        </div>
      </button>
    );
  };

  if (paths.length === 0 && tracks.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
        <p className="text-sm font-semibold text-slate-800">Chưa có mạch tiến trình hay lộ trình học nào</p>
        <p className="text-xs text-slate-600 mt-1">
          Tạo 1 Mạch tiến trình (Track) hoặc Chuyên đề để bắt đầu xây dựng chương trình học.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {onCreateTrack && (
            <button type="button" onClick={onCreateTrack} className="secondary-button !h-8 !text-xs !px-4 font-bold">
              <Icon name={IconName.PLUS} size={12} />
              <span>Tạo mạch tiến trình</span>
            </button>
          )}
          <button type="button" onClick={onCreatePath} className="primary-button !h-8 !text-xs !px-4 font-bold">
            <Icon name={IconName.PLUS} size={12} />
            <span>Tạo lộ trình đầu tiên</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Khu vực 1: Mạch tiến trình cốt lõi (CurriculumTrack -> Chặng) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Mạch tiến trình cốt lõi</h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Mỗi mạch gồm các chặng học tuần tự (có thể gắn bài kiểm tra cuối chặng để mở khóa chặng sau).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onCreateTrack && (
              <button type="button" onClick={onCreateTrack} className="secondary-button !h-8 !text-xs !px-3 font-bold">
                <Icon name={IconName.PLUS} size={12} />
                <span>Tạo mạch mới</span>
              </button>
            )}
            <button type="button" onClick={onCreatePath} className="primary-button !h-8 !text-xs !px-3.5 font-bold">
              <Icon name={IconName.PLUS} size={12} />
              <span>Tạo lộ trình</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tracks.map((track, trackIdx) => {
            const stages = sortStagesInTrack(
              chronologicalPaths.filter((p) => p.trackId === track.id),
            );
            const lastStage = stages[stages.length - 1] ?? null;
            return (
              <div
                key={track.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        Mạch {String(trackIdx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{track.title}</h3>
                      <span className="text-xs text-slate-500">({stages.length} chặng)</span>
                    </div>
                    {track.description && (
                      <p className="text-xs text-slate-600 mt-1">{track.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onCreateStageInTrack && (
                      <button
                        type="button"
                        onClick={() =>
                          onCreateStageInTrack(track.id, lastStage?.id ?? null, stages.length + 1)
                        }
                        className="primary-button !h-7 !text-xs !px-2.5 font-bold"
                      >
                        <Icon name={IconName.PLUS} size={11} />
                        <span>Thêm chặng {String(stages.length + 1).padStart(2, '0')}</span>
                      </button>
                    )}
                    {canManageTracks && onEditTrack && (
                      <button
                        type="button"
                        onClick={() => onEditTrack(track)}
                        className="secondary-button !h-7 !text-xs !px-2.5"
                      >
                        Sửa mạch
                      </button>
                    )}
                    {canManageTracks && onDeleteTrack && (
                      <button
                        type="button"
                        onClick={() => onDeleteTrack(track)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 h-7 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Xóa mạch
                      </button>
                    )}
                  </div>
                </div>

                {stages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Chưa có chặng nào trong mạch này. Bấm &ldquo;Thêm chặng 01&rdquo; để bắt đầu.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stages.map((stage, idx) => renderPathCard(stage, idx + 1))}
                  </div>
                )}
              </div>
            );
          })}

          {unassignedChrono.length > 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Lộ trình niên biểu chưa gắn mạch ({unassignedChrono.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedChrono.map((stage, idx) => renderPathCard(stage, idx + 1))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Khu vực 2: Chuyên đề chuyên sâu (THEMATIC) */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Chuyên đề chuyên sâu ({thematicPaths.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Các lộ trình học độc lập theo chủ điểm (văn hóa, quân sự, danh nhân...), không ràng buộc chặng.
            </p>
          </div>
          {onCreateThematicPath && (
            <button
              type="button"
              onClick={onCreateThematicPath}
              className="secondary-button !h-8 !text-xs !px-3 font-bold"
            >
              <Icon name={IconName.PLUS} size={12} />
              <span>Tạo chuyên đề</span>
            </button>
          )}
        </div>

        {thematicPaths.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Chưa có chuyên đề chuyên sâu nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {thematicPaths.map((path) => renderPathCard(path))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- LearningPathToolbar.tsx ---
interface LearningPathToolbarProps {
  currentPath: LearningPathItem;
  onBackToList: () => void;
  onOpenEditPath: () => void;
  onOpenCreateLesson: () => void;
  onChangePathStatus: (next: ContentStatus) => void;
  onDeletePath?: () => void;
  /** Chỉ người duyệt được xuất bản / chuyển về nháp. */
  canPublish: boolean;
  actionLoading: boolean;
}

/** Thanh tiêu đề của màn CHI TIẾT 1 Lộ trình (sau khi đã chọn từ LearningPathListPanel)
 * — không còn dropdown chọn lộ trình ở đây nữa (List → Detail: việc chọn lộ trình đã
 * xảy ra ở màn danh sách trước đó), chỉ còn nút "Quay lại" + nhóm hành động. */
export function LearningPathToolbar({
  currentPath,
  onBackToList,
  onOpenEditPath,
  onOpenCreateLesson,
  onChangePathStatus,
  onDeletePath,
  canPublish,
  actionLoading,
}: LearningPathToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBackToList}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
        >
          <span>←</span>
          <span>Danh sách lộ trình</span>
        </button>

        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-slate-900">{currentPath.title}</h2>
          <button
            type="button"
            onClick={onOpenEditPath}
            title="Sửa thông tin lộ trình này"
            className="p-1 text-slate-500 hover:text-emerald-700 rounded shrink-0"
          >
            <Icon name={IconName.EDIT} size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{currentPath.chapters?.length || 0} chương</span>
          {currentPath.description && (
            <>
              <span className="text-slate-400">&bull;</span>
              <span className="truncate max-w-md">{currentPath.description}</span>
            </>
          )}
        </div>
      </div>

      {/* Nhóm nút: 2 thao tác phụ (viền) tách biệt bằng 1 vạch khỏi 1 thao tác chính (nền đặc) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
          <button
            type="button"
            id="btn-add-lesson-from-path"
            onClick={onOpenCreateLesson}
            className="secondary-button !h-8 !text-xs !px-3"
          >
            <Icon name={IconName.PLUS} size={13} />
            <span>Soạn bài học mới</span>
          </button>
        </div>

        <ArchiveStatusButton
          status={currentPath.status}
          isReviewer={canPublish}
          disabled={actionLoading}
          onChangeStatus={onChangePathStatus}
          className="secondary-button !h-8 !text-xs !px-3"
        />
        {canPublish && onDeletePath && (
          <button
            type="button"
            onClick={onDeletePath}
            disabled={actionLoading}
            title="Xóa vĩnh viễn lộ trình này"
            className="!h-8 !text-xs !px-3 font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Icon name={IconName.TRASH} size={13} />
            <span>Xóa lộ trình</span>
          </button>
        )}
        {currentPath.status === ContentStatus.ARCHIVED ? null : canPublish ? (
        <button
          type="button"
          onClick={() =>
            onChangePathStatus(
              currentPath.status === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED,
            )
          }
          disabled={actionLoading}
          className={`!h-8 !text-xs !px-3 font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            currentPath.status === ContentStatus.PUBLISHED
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          <Icon name={IconName.CHECK} size={13} />
          <span>{currentPath.status === ContentStatus.PUBLISHED ? 'Chuyển về Nháp' : 'Xuất bản Lộ trình'}</span>
        </button>
        ) : (
          <span className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-700">
            {currentPath.status === ContentStatus.PUBLISHED ? STATUS_LABEL_MAP[ContentStatus.PUBLISHED] : 'Bản nháp — người duyệt sẽ xuất bản'}
          </span>
        )}
      </div>
    </div>
  );
}

// --- StudioHeader.tsx ---
interface StudioHeaderProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  currentPath: LearningPathItem | null;
  libraryCount: number;
}

/** Header trên cùng của HISGO Studio: tên sản phẩm, badge trạng thái lộ trình đang chọn,
 * và tab chính (Chương & nhóm | Thư viện Lesson). */
export function StudioHeader({ activeTab, onTabChange, currentPath, libraryCount }: StudioHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
            <Icon name={IconName.BOOK} size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Quản lý Lộ trình &amp; Bài học</h1>
              {currentPath && (
                <StatusPill status={currentPath.status} />
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">Biên soạn bài học và tổ chức thành lộ trình học</p>
          </div>
        </div>

        {/* Switcher Tab Chính: Lộ trình & Chương | Thư viện bài học */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            id="tab-curriculum-chapters"
            onClick={() => onTabChange(StudioTab.CURRICULUM)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === StudioTab.CURRICULUM
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon name={IconName.BOOK} size={14} />
            <span>Lộ trình &amp; Chương</span>
          </button>
          <button
            type="button"
            id="tab-lesson-library"
            onClick={() => onTabChange(StudioTab.LESSON_LIBRARY)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === StudioTab.LESSON_LIBRARY
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon name={IconName.FILE} size={14} />
            <span>Thư viện bài học</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-xs font-bold">
              {libraryCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
