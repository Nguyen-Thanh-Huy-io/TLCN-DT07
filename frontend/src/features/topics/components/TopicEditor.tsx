'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderTree, X } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import { TopicApiService } from '@/services/entities/topic.service';
import type { TopicItem } from '@/types/models';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { CurriculumSidePanel } from '@/features/curriculum/components/CurriculumSidePanel';
import { TopicParentModalPicker } from './TopicParentModalPicker';
import { TopicEditorHeader, TopicInspectorSidebar, PublishActionType } from './TopicEditorParts';
import { TopicChildrenManager, TopicCoreFieldsCard, TopicHierarchyCard } from './TopicEditorFormParts';
import { LABEL_ROOT_TOPIC, useTopicEditor } from '../hooks/useTopicEditor';

export interface PickedTopic {
  id: string;
  name: string;
  slug?: string;
}

export function TopicPicker({
  value,
  onChange,
  placeholder = 'Chưa gắn vào Chủ đề nào',
}: {
  value: PickedTopic | null;
  onChange: (topic: PickedTopic | null) => void;
  placeholder?: string;
}) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    TopicApiService.getTopics({ limit: 100 })
      .then((res) => {
        if (active) setTopics(res.items || []);
      })
      .catch(() => {
        if (active) setTopics([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const breadcrumbPath = useMemo(() => {
    if (!value) return null;
    const byId = new Map(topics.map((t) => [t.id, t]));
    const current = byId.get(value.id);
    if (!current) return value.name;
    const parts: string[] = [current.name];
    let parentId = current.parentId;
    while (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId)!;
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts.join(' › ');
  }, [value, topics]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-900">
            {value ? value.name : placeholder}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {breadcrumbPath && breadcrumbPath !== value?.name
              ? breadcrumbPath
              : value
                ? 'Chủ đề gốc trong cây tri thức'
                : 'Chọn chủ đề theo nhánh Cha › Con trên cây kiến thức'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              title="Bỏ chọn chủ đề"
              aria-label="Bỏ chọn chủ đề"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs transition hover:border-blue-300 hover:text-blue-800 cursor-pointer"
          >
            <FolderTree size={13} />
            <span>{value ? 'Đổi chủ đề' : 'Chọn chủ đề'}</span>
          </button>
        </div>
      </div>

      <TopicParentModalPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(selectedId) => {
          if (!selectedId) {
            onChange(null);
            return;
          }
          const found = topics.find((t) => t.id === selectedId);
          if (found) {
            onChange({ id: found.id, name: found.name });
          }
        }}
        topics={topics}
        selectedParentId={value?.id ?? null}
        title="Chọn Chủ đề (Topic)"
        subtitle="Duyệt theo nhánh Chủ đề gốc › Chủ đề con hoặc tìm nhanh theo tên"
        allowRootSelect
        rootLabel="Không gắn Chủ đề"
        rootDescription="Để trống chủ đề (bài viết hoặc dòng thời gian độc lập)"
        maxDepth={null}
      />
    </>
  );
}

export interface TopicEditorProps {
  topicId?: string;
}

/** Màn soạn Chủ đề: nối hook `useTopicEditor` với các khối giao diện. */
export function TopicEditor({ topicId }: TopicEditorProps) {
  const router = useRouter();
  const editor = useTopicEditor(topicId);
  const { form, isEditMode } = editor;
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [isCurriculumPreviewOpen, setIsCurriculumPreviewOpen] = useState(false);

  if (editor.loadingInitial) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span>Đang tải dữ liệu chủ đề...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      {isEditMode && (
        <EditorRevisionBanner
          type="TOPIC"
          contentId={topicId}
          status={form.status}
          pending={editor.pendingRevision}
          notice={editor.revisionNotice}
          onChanged={editor.onRevisionChanged}
        />
      )}

      <TopicEditorHeader
        isEditMode={isEditMode}
        topicId={topicId}
        status={form.status}
        savingAction={editor.savingAction}
        isCurriculumPreviewOpen={isCurriculumPreviewOpen}
        onToggleCurriculumPreview={() => setIsCurriculumPreviewOpen((prev) => !prev)}
        onCancel={() => router.push(APP_ROUTES.CURRICULUM)}
        onAction={editor.handleAction}
        isReviewer={editor.isReviewer}
        archiveBusy={editor.actionLoading}
        onChangeArchiveStatus={(next) => void editor.changeArchiveStatus(next)}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void editor.handleAction(PublishActionType.PUBLISH);
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TopicCoreFieldsCard
              name={form.name}
              description={form.description}
              onNameChange={editor.setName}
              onDescriptionChange={editor.setDescription}
            />

            <TopicHierarchyCard
              hasParent={Boolean(form.parentId)}
              rootLabel={LABEL_ROOT_TOPIC}
              breadcrumb={editor.parentBreadcrumb}
              displayOrder={form.displayOrder}
              orderExplanation={editor.orderExplanationText}
              onOpenParentPicker={() => setIsParentPickerOpen(true)}
              onDisplayOrderChange={editor.setDisplayOrder}
            />

            {isEditMode && topicId && (
              <TopicChildrenManager
                topicId={topicId}
                childrenTopics={editor.childrenTopics}
                availableCandidatesToAttach={editor.availableCandidatesToAttach}
                selectedCandidateId={editor.selectedCandidateId}
                onSelectCandidateId={editor.setSelectedCandidateId}
                actionLoading={editor.actionLoading}
                onAttachChild={editor.handleAttachChild}
                onDetachChild={editor.handleDetachChild}
                onQuickCreateChild={editor.handleQuickCreateChild}
                onNavigateToCreate={() => router.push(`${APP_ROUTES.TOPICS.CREATE}?parentId=${topicId}`)}
                onNavigateToEditChild={(childId) => router.push(APP_ROUTES.TOPICS.DETAIL(childId))}
              />
            )}
          </div>

          <TopicInspectorSidebar
            isEditMode={isEditMode}
            status={form.status}
            createdAt={form.createdAt}
            updatedAt={form.updatedAt}
            displayOrder={form.displayOrder}
            onSelectDisplayOrder={editor.setDisplayOrder}
            parentBreadcrumbPath={editor.parentBreadcrumb.pathText}
            previewTimeline={editor.previewTimeline}
            isSequential={form.isSequential}
            onSequentialChange={editor.setIsSequential}
            coverImageUrl={form.coverImageUrl}
            onCoverImageChange={editor.setCoverImageUrl}
            actionLoading={editor.actionLoading}
            topicName={form.name}
            description={form.description}
            onOpenCurriculumPreview={() => setIsCurriculumPreviewOpen(true)}
          />
        </div>
      </form>

      <TopicParentModalPicker
        isOpen={isParentPickerOpen}
        onClose={() => setIsParentPickerOpen(false)}
        onSelect={(newParentId) => editor.setParentId(newParentId || '')}
        topics={editor.allTopics}
        selectedParentId={form.parentId || null}
        currentTopicId={topicId}
      />

      <CurriculumSidePanel
        isOpen={isCurriculumPreviewOpen}
        onClose={() => setIsCurriculumPreviewOpen(false)}
        currentTopicTitle={form.name}
        currentDisplayOrder={form.displayOrder}
        highlightTopicId={topicId || form.parentId || undefined}
      />
    </div>
  );
}
