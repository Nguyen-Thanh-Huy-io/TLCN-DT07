'use client';

import { APP_ROUTES } from '@/constants/routes';
import { StudioHeader } from './studio/StudioPanels';
import { LearningPathToolbar } from './studio/StudioPanels';
import { ChapterList } from './studio/ChapterList';
import { LessonLibraryPanel } from './studio/LessonLibraryPanel';
import { LearningPathListPanel } from './studio/StudioPanels';
import { AddLessonsToChapterModal } from './studio/StudioModals';
import { LearningPathFormModal } from './studio/StudioModals';
import { CreateChapterModal } from './studio/StudioModals';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { StudioTab, NoticeTone } from '@/constants/enums';
import { useHisgoStudio } from './useHisgoStudio';

export { StudioTab };

/**
 * HISGO Studio — bộ điều phối: giữ toàn bộ state & nghiệp vụ (gọi API, cập nhật lạc
 * quan, drag & drop...), còn phần hiển thị được tách ra các component con trong
 * `studio/` để file này không phình quá lớn (trước đây hơn 1300 dòng dồn hết vào 1 file).
 */
export function HisgoStudioView() {
  const {
    router,
    activeTab,
    setActiveTab,
    learningPaths,
    selectPath,
    libraryLessons,
    loading,
    actionLoading,
    isReviewer,
    notice,
    setNotice,
    expandedChapters,
    showAddLessonModal,
    setShowAddLessonModal,
    targetChapterForLessons,
    selectedLessonIdsForChapter,
    modalSearchTerm,
    setModalSearchTerm,
    quickCreateTitle,
    setQuickCreateTitle,
    isQuickCreating,
    showCreatePathModal,
    setShowCreatePathModal,
    newPathTitle,
    setNewPathTitle,
    newPathDesc,
    setNewPathDesc,
    showEditPathModal,
    setShowEditPathModal,
    editPathTitle,
    setEditPathTitle,
    editPathDesc,
    setEditPathDesc,
    showCreateChapterModal,
    setShowCreateChapterModal,
    newChapterTitle,
    setNewChapterTitle,
    newChapterDesc,
    setNewChapterDesc,
    newChapterSearchTerm,
    setNewChapterSearchTerm,
    newChapterSelectedLessonIds,
    setNewChapterSelectedLessonIds,
    draggingLessonId,
    dragOverLessonId,
    librarySearchTerm,
    setLibrarySearchTerm,
    libraryStatusFilter,
    setLibraryStatusFilter,
    deletingLibraryLesson,
    setDeletingLibraryLesson,
    isDeletingLibraryLesson,
    loadLearningPaths,
    currentPath,
    structureLocked,
    pathPending,
    revisionNotice,
    setRevisionNotice,
    editChapter,
    setEditChapter,
    refreshPathPending,
    toggleChapterExpand,
    handleOpenAddLessonsModal,
    handleQuickCreateLesson,
    handleDeleteLibraryLesson,
    handleToggleSelectLessonInModal,
    handleMoveSelectedLessonInModal,
    handleConfirmAddLessonsToChapter,
    handleRemoveLessonFromChapter,
    handleMoveLessonOrder,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleCreatePath,
    handleOpenEditPathModal,
    handleUpdatePath,
    handleOpenEditChapter,
    handleUpdateChapter,
    handleCreateChapter,
    handleToggleLessonForNewChapter,
    handleMoveNewChapterLessonOrder,
    handleTogglePublishPath,
    handleDeleteChapter,
    filteredLibraryLessons,
    modalFilteredLessons,
    newChapterFilteredLessons,
  } = useHisgoStudio();

  return (
    <div className="hisgo-studio-container max-w-7xl mx-auto space-y-4 pb-6 px-4 sm:px-6">
      {notice && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${
            notice.tone === NoticeTone.ERROR ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold opacity-70 hover:opacity-100">
            Đóng
          </button>
        </div>
      )}
      <StudioHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentPath={currentPath}
        libraryCount={libraryLessons.length}
      />

      {activeTab === StudioTab.CURRICULUM && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            {!currentPath ? (
              // Màn DANH SÁCH (mặc định, không có ?pathId= trên URL) — List → Detail.
              <LearningPathListPanel
                paths={learningPaths}
                loading={loading}
                onSelectPath={selectPath}
                onCreatePath={() => setShowCreatePathModal(true)}
              />
            ) : (
              // Màn CHI TIẾT — đúng 1 Lộ trình đang chọn qua URL.
              <>
                <LearningPathToolbar
                  currentPath={currentPath}
                  onBackToList={() => selectPath(null)}
                  onOpenEditPath={handleOpenEditPathModal}
                  onOpenCreateLesson={() => router.push(APP_ROUTES.LESSONS.CREATE)}
                  onTogglePublishPath={handleTogglePublishPath}
                  canPublish={isReviewer}
                  actionLoading={actionLoading}
                />

                {currentPath && (
                  <div className="mt-3">
                    <EditorRevisionBanner
                      type="LEARNING_PATH"
                      contentId={currentPath.id}
                      status={currentPath.status}
                      pending={pathPending?.revision ?? null}
                      notice={revisionNotice}
                      onChanged={(message) => {
                        setRevisionNotice(message);
                        void loadLearningPaths();
                        void refreshPathPending();
                      }}
                    />
                  </div>
                )}

                {structureLocked && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                    Lộ trình đang <strong>xuất bản</strong>: tên, mô tả lộ trình và chương sửa được (thành bản sửa chờ duyệt);
                    thêm/bớt chương hoặc bài học do người duyệt thực hiện.
                  </div>
                )}

                <ChapterList
                  loading={loading}
                  chapters={currentPath?.chapters}
                  expandedChapters={expandedChapters}
                  onToggleExpand={toggleChapterExpand}
                  onOpenCreateChapter={() => {
                    setNewChapterTitle('');
                    setNewChapterDesc('');
                    setNewChapterSearchTerm('');
                    setNewChapterSelectedLessonIds([]);
                    setShowCreateChapterModal(true);
                  }}
                  onOpenAddLessons={handleOpenAddLessonsModal}
                  onCreateLessonInChapter={(chapter) =>
                    router.push(`${APP_ROUTES.LESSONS.CREATE}?chapterId=${encodeURIComponent(chapter.id)}`)
                  }
                  onOpenLesson={(lessonId) => router.push(`/lessons/create?id=${lessonId}`)}
                  onDeleteChapter={handleDeleteChapter}
                  onRemoveLesson={handleRemoveLessonFromChapter}
                  onMoveLessonOrder={handleMoveLessonOrder}
                  draggingLessonId={draggingLessonId}
                  dragOverLessonId={dragOverLessonId}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  readOnly={structureLocked}
                  onEditChapter={(chapter) => void handleOpenEditChapter(chapter)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === StudioTab.LESSON_LIBRARY && (
        <LessonLibraryPanel
          lessons={filteredLibraryLessons}
          searchTerm={librarySearchTerm}
          onSearchChange={setLibrarySearchTerm}
          statusFilter={libraryStatusFilter}
          onStatusFilterChange={setLibraryStatusFilter}
          onCreateLesson={() => router.push(APP_ROUTES.LESSONS.CREATE)}
          onOpenLesson={(lessonId) => router.push(`/lessons/create?id=${lessonId}`)}
          onDeleteLesson={(lesson) => setDeletingLibraryLesson(lesson)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingLibraryLesson)}
        title="Xóa Bài học lịch sử"
        message={`Bạn có chắc chắn muốn xóa bài học "${deletingLibraryLesson?.title}"? Dữ liệu nội dung và cấu trúc bài học này sẽ bị xóa vĩnh viễn.`}
        confirmLabel={isDeletingLibraryLesson ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteLibraryLesson}
        onClose={() => setDeletingLibraryLesson(null)}
      />

      <AddLessonsToChapterModal
        isOpen={showAddLessonModal}
        chapter={targetChapterForLessons}
        onClose={() => setShowAddLessonModal(false)}
        quickCreateTitle={quickCreateTitle}
        onQuickCreateTitleChange={setQuickCreateTitle}
        onQuickCreate={handleQuickCreateLesson}
        isQuickCreating={isQuickCreating}
        allLessons={libraryLessons}
        searchTerm={modalSearchTerm}
        onSearchChange={setModalSearchTerm}
        filteredLessons={modalFilteredLessons}
        selectedLessonIds={selectedLessonIdsForChapter}
        onToggleLesson={handleToggleSelectLessonInModal}
        onMoveSelectedLesson={handleMoveSelectedLessonInModal}
        onConfirm={handleConfirmAddLessonsToChapter}
        actionLoading={actionLoading}
      />

      <LearningPathFormModal
        isOpen={showCreatePathModal}
        heading="Tạo Lộ trình học mới"
        title={newPathTitle}
        onTitleChange={setNewPathTitle}
        titlePlaceholder="Ví dụ: Lịch sử Việt Nam 1945 - 1975"
        description={newPathDesc}
        onDescriptionChange={setNewPathDesc}
        onClose={() => setShowCreatePathModal(false)}
        onSubmit={handleCreatePath}
        submitLabel="Tạo lộ trình"
        submitLoadingLabel="Đang tạo..."
        loading={actionLoading}
        submitId="btn-confirm-create-path"
      />

      <LearningPathFormModal
        isOpen={showEditPathModal && !!currentPath}
        heading="Sửa Lộ trình học"
        title={editPathTitle}
        onTitleChange={setEditPathTitle}
        description={editPathDesc}
        onDescriptionChange={setEditPathDesc}
        onClose={() => setShowEditPathModal(false)}
        onSubmit={handleUpdatePath}
        submitLabel="Lưu thay đổi"
        submitLoadingLabel="Đang lưu..."
        loading={actionLoading}
        submitId="btn-confirm-edit-path"
      />

      <LearningPathFormModal
        isOpen={Boolean(editChapter)}
        heading="Sửa chương"
        title={editChapter?.title ?? ''}
        onTitleChange={(title) => setEditChapter((c) => (c ? { ...c, title } : c))}
        description={editChapter?.description ?? ''}
        onDescriptionChange={(description) => setEditChapter((c) => (c ? { ...c, description } : c))}
        onClose={() => setEditChapter(null)}
        onSubmit={handleUpdateChapter}
        submitLabel="Lưu thay đổi"
        submitLoadingLabel="Đang lưu..."
        loading={actionLoading}
        submitId="btn-confirm-edit-chapter"
      />

      <CreateChapterModal
        isOpen={showCreateChapterModal}
        pathTitle={currentPath?.title}
        title={newChapterTitle}
        onTitleChange={setNewChapterTitle}
        description={newChapterDesc}
        onDescriptionChange={setNewChapterDesc}
        onClose={() => setShowCreateChapterModal(false)}
        onSubmit={handleCreateChapter}
        loading={actionLoading}
        searchTerm={newChapterSearchTerm}
        onSearchChange={setNewChapterSearchTerm}
        allLessons={libraryLessons}
        filteredLessons={newChapterFilteredLessons}
        selectedLessonIds={newChapterSelectedLessonIds}
        onToggleLesson={handleToggleLessonForNewChapter}
        onMoveSelectedLesson={handleMoveNewChapterLessonOrder}
      />
    </div>
  );
}
