'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { CurriculumSidePanel } from '@/features/curriculum/components/CurriculumSidePanel';
import { TopicParentModalPicker } from './TopicParentModalPicker';
import { TopicEditorHeader, TopicInspectorSidebar, PublishActionType } from './TopicEditorParts';
import { TopicChildrenManager, TopicCoreFieldsCard, TopicHierarchyCard } from './TopicEditorFormParts';
import { LABEL_ROOT_TOPIC, useTopicEditor } from '../hooks/useTopicEditor';

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
