'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  EntityDetailLayout,
  FormSectionConfig,
} from '@/components/common/EntityDetailLayout';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { useEventEditor } from './editor/useEventEditor';
import { EventOverviewStep } from './editor/EventOverviewStep';
import { EventContentStep } from './editor/EventContentStep';
import { EventRelationsStep } from './editor/EventRelationsStep';
import { EventReviewPublishStep } from './editor/EventReviewPublishStep';
import { EventPreviewModal } from './editor/EventPreviewModal';

export interface EventEditorProps {
  eventId?: string;
}

export function EventEditor({ eventId }: EventEditorProps) {
  const router = useRouter();
  const editor = useEventEditor(eventId);

  if (editor.loadingInitial) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-800 rounded-full animate-spin" />
          <span>Đang tải hồ sơ Sự kiện lịch sử...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4 BƯỚC TINH GỌN THEO ĐÚNG TƯ DUY NGƯỜI BIÊN SOẠN SỬ LIỆU (TỪ 6 BƯỚC CŨ)
  // ---------------------------------------------------------------------------
  const sections: FormSectionConfig[] = [
    {
      id: 'overview',
      stepNumber: 1,
      title: 'Tổng quan',
      subtitle: 'Tên sự kiện, phân loại, thời gian, địa điểm và ảnh đại diện.',
      icon: IconName.FILE,
      content: (
        <EventOverviewStep
          isEditMode={editor.isEditMode}
          status={editor.status}
          lastDraftSavedAt={editor.lastDraftSavedAt}
          title={editor.title}
          onTitleChange={editor.setTitle}
          titleTouched={editor.titleTouched}
          onTitleBlur={() => editor.setTitleTouched(true)}
          activeSlug={editor.activeSlug}
          customSlug={editor.customSlug}
          onCustomSlugChange={editor.setCustomSlug}
          isCustomSlugMode={editor.isCustomSlugMode}
          onToggleCustomSlugMode={() => {
            if (!editor.isCustomSlugMode) {
              editor.setCustomSlug(editor.activeSlug);
              editor.setIsCustomSlugMode(true);
            } else {
              editor.setIsCustomSlugMode(false);
            }
          }}
          categoryGroup={editor.categoryGroup}
          categoryIds={editor.categoryIds}
          onCategoryIdsChange={editor.setCategoryIds}
          metadata={editor.metadata}
          onMetadataChange={editor.setMetadata}
          summary={editor.summary}
          onSummaryChange={editor.setSummary}
          thumbnailUrl={editor.thumbnailUrl}
          onThumbnailUrlChange={editor.setThumbnailUrl}
          timelineMode={editor.timelineMode}
          onTimelineModeChange={editor.setTimelineMode}
          startDateInput={editor.startDateInput}
          onStartDateInputChange={editor.setStartDateInput}
          startIsBce={editor.startIsBce}
          onStartIsBceChange={editor.setStartIsBce}
          parsedStart={editor.parsedStart}
          endDateInput={editor.endDateInput}
          onEndDateInputChange={editor.setEndDateInput}
          endIsBce={editor.endIsBce}
          onEndIsBceChange={editor.setEndIsBce}
          parsedEnd={editor.parsedEnd}
          eventDateNote={editor.eventDateNote}
          onEventDateNoteChange={editor.setEventDateNote}
          isCustomDisplayMode={editor.isCustomDisplayMode}
          onToggleCustomDisplayMode={() =>
            editor.setIsCustomDisplayMode((prev) => !prev)
          }
          locations={editor.locations}
          locationId={editor.locationId}
          onLocationSelect={editor.handleSelectLocation}
          locationLabel={editor.locationLabel}
          onLocationLabelChange={editor.setLocationLabel}
        />
      ),
    },
    {
      id: 'content-detail',
      stepNumber: 2,
      title: 'Nội dung & Diễn biến',
      subtitle:
        'Soạn thảo nội dung lịch sử chi tiết bằng khối Văn bản/Hình ảnh/Video/Timeline...',
      icon: IconName.BOOK,
      content: (
        <EventContentStep
          title={editor.title}
          eventDateNote={editor.eventDateNote}
          contentBlocks={editor.contentBlocks}
          onContentBlocksChange={editor.setContentBlocks}
          onPublish={() => editor.handleSave('PUBLISH')}
        />
      ),
    },
    {
      id: 'knowledge-relations',
      stepNumber: 3,
      title: 'Mạng lưới liên kết',
      subtitle:
        'Quan hệ nhân quả giữa các sự kiện và gắn kết bối cảnh thực thể lịch sử.',
      icon: IconName.USERS,
      content: (
        <EventRelationsStep
          currentEventId={eventId}
          relationGroup={editor.relationGroup}
          roleGroup={editor.roleGroup}
          eventRelations={editor.eventRelations}
          incomingEventRelations={editor.incomingEventRelations}
          otherEvents={editor.otherEvents}
          onAddEventRelation={editor.handleAddEventRelation}
          onRemoveEventRelation={editor.handleRemoveEventRelation}
          availableKnowledgeItems={editor.availableKnowledgeItems}
          linkedKnowledgeItems={editor.linkedKnowledgeItems}
          onAddKnowledgeItems={editor.handleAddKnowledgeItems}
          onRemoveKnowledgeItem={editor.handleRemoveKnowledgeItem}
          entities={editor.entities}
          selectedEntityIds={editor.selectedEntityIds}
          parentId={editor.parentId}
          entityRoles={editor.entityRoles}
          onEntityRolesChange={editor.setEntityRoles}
        />
      ),
    },
    {
      id: 'review-and-publish',
      stepNumber: 4,
      title: 'Kiểm duyệt & Xuất bản',
      subtitle: 'Kiểm tra độ hoàn thiện dữ liệu và thiết lập trạng thái công bố.',
      icon: IconName.CHECK,
      content: (
        <EventReviewPublishStep
          checklist={editor.reviewChecklist}
          onNavigateToStep={(stepIdx) => editor.setActiveStepIndex(stepIdx)}
          status={editor.status}
          onStatusChange={editor.setStatus}
          createdAt={editor.createdAt}
          updatedAt={editor.updatedAt}
          isSaving={editor.savingAction === 'PUBLISH'}
          onPublish={() => editor.handleSave('PUBLISH')}
        />
      ),
    },
  ];

  return (
    <>
      <EntityDetailLayout
        breadcrumbs={[
          { label: 'CMS', href: APP_ROUTES.DASHBOARD },
          { label: 'Từ điển tri thức', href: APP_ROUTES.KNOWLEDGE },
          { label: 'Sự kiện', href: APP_ROUTES.EVENTS.LIST },
          { label: editor.isEditMode ? 'Chỉnh sửa' : 'Tạo mới' },
        ]}
        title={editor.isEditMode ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
        subtitle="Quản lý thông tin, tư liệu và mạng lưới quan hệ lịch sử."
        recordId={eventId}
        status={editor.status}
        savingAction={editor.savingAction}
        onSaveDraft={() => editor.handleSave('DRAFT')}
        onPublish={() => editor.handleSave('PUBLISH')}
        onCancel={() => router.push(APP_ROUTES.EVENTS.LIST)}
        onFillSampleData={editor.handleFillSampleData}
        onPreview={() => editor.setIsPreviewOpen(true)}
        sections={sections}
        activeSectionIndex={editor.activeStepIndex}
        onActiveSectionIndexChange={editor.setActiveStepIndex}
        hideHeaderPublish={true}
        navigationLayout="HORIZONTAL_STEPPER"
        banner={
          <EditorRevisionBanner
            type="EVENT"
            contentId={eventId}
            status={editor.status}
            pending={editor.pendingRevision}
            notice={editor.revisionNotice}
            onChanged={(message) => {
              editor.setRevisionNotice(message);
              void editor.loadReferenceDataAndDetail();
            }}
          />
        }
      />

      {/* Modal Xem trước Sự kiện */}
      <EventPreviewModal
        isOpen={editor.isPreviewOpen}
        onClose={() => editor.setIsPreviewOpen(false)}
        title={editor.title}
        thumbnailUrl={editor.thumbnailUrl}
        eventDateNote={editor.eventDateNote}
        locationLabel={editor.locationLabel}
        summary={editor.summary}
        description={editor.description}
        sourceReferenceNote={editor.sourceReferenceNote}
        mediaList={editor.mediaList}
      />
    </>
  );
}
