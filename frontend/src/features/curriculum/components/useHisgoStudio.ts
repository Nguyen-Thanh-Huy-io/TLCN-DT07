'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningPathApiService, LearningPathItem, ChapterItem } from '@/services/entities/learning-path.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models';
import type { PickedTopic } from '@/features/topics/components/TopicPicker';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import { ContentRevisionApiService, isRevisionPending, type ContentRevisionItem } from '@/services/entities/content-revision.service';
import { ContentStatus, StudioTab, SortDirection, CommonFilterOption, NoticeTone } from '@/constants/enums';

export const LOCKED_STATUSES: string[] = [ContentStatus.PUBLISHED, ContentStatus.ARCHIVED];

export function useHisgoStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Active Tab: 'CURRICULUM' (Chương & nhóm) hoặc 'LESSON_LIBRARY' (Thư viện Lesson)
  const [activeTab, setActiveTab] = useState<StudioTab>(StudioTab.CURRICULUM);
  // Dữ liệu Lộ trình và Bài học
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([]);
  // Lộ trình đang chọn được đồng bộ qua URL (?pathId=) thay vì chỉ giữ trong state nội
  // bộ — để F5/chia sẻ link vẫn giữ đúng lộ trình đang xem (List → Detail), và để bấm
  // "Quay lại" thật sự quay về đúng danh sách (không bị reset về lộ trình đầu tiên).
  const selectedPathId = searchParams.get('pathId') || '';
  const selectPath = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set('pathId', id);
      else params.delete('pathId');
      router.push(`/curriculum?${params.toString()}`);
    },
    [router, searchParams],
  );
  const [libraryLessons, setLibraryLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  // Quyền: xuất bản / sửa cấu trúc lộ trình đã xuất bản là việc của người duyệt.
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));
  // Thông báo lỗi/hướng dẫn hiển thị ngay trên Studio (thay cho alert + console.error).
  const [notice, setNotice] = useState<{ tone: NoticeTone | 'error' | 'info'; text: string } | null>(null);
  const showError = useCallback(
    (err: unknown, fallback: string) => setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(err, fallback) }),
    [],
  );
  // Trạng thái Accordion các Chương: key là chapterId, value là boolean mở/đóng
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  // Modal: Gom bài học từ thư viện vào chương
  const [showAddLessonModal, setShowAddLessonModal] = useState<boolean>(false);
  const [targetChapterForLessons, setTargetChapterForLessons] = useState<ChapterItem | null>(null);
  const [selectedLessonIdsForChapter, setSelectedLessonIdsForChapter] = useState<string[]>([]);
  const [modalSearchTerm, setModalSearchTerm] = useState<string>('');
  // Tạo nhanh bài học mới ngay trong modal "Thêm Lesson từ thư viện" — không cần rời trang
  const [quickCreateTitle, setQuickCreateTitle] = useState<string>('');
  const [quickCreateTopic, setQuickCreateTopic] = useState<PickedTopic | null>(null);
  const [isQuickCreating, setIsQuickCreating] = useState<boolean>(false);
  // Modal: Tạo Lộ trình mới
  // (đã bỏ field "Phân loại lộ trình" — không có tác dụng lọc/hiển thị gì ở phía Lộ
  // trình, xem chú thích trong LearningPathFormModal.tsx)
  const [showCreatePathModal, setShowCreatePathModal] = useState<boolean>(false);
  const [newPathTitle, setNewPathTitle] = useState<string>('');
  const [newPathDesc, setNewPathDesc] = useState<string>('');
  // Modal: Sửa Lộ trình học hiện tại (trước đây chỉ có Tạo, chưa có Sửa)
  const [showEditPathModal, setShowEditPathModal] = useState<boolean>(false);
  const [editPathTitle, setEditPathTitle] = useState<string>('');
  const [editPathDesc, setEditPathDesc] = useState<string>('');
  // Modal: Tạo Chương mới — chọn + sắp xếp bài học ngay trong modal này, không cần mở
  // riêng AddLessonsToChapterModal nữa sau khi tạo xong (vẫn giữ modal đó để GOM THÊM
  // bài vào 1 chương đã có sẵn, 2 việc khác nhau).
  const [showCreateChapterModal, setShowCreateChapterModal] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [newChapterDesc, setNewChapterDesc] = useState<string>('');
  const [newChapterSearchTerm, setNewChapterSearchTerm] = useState<string>('');
  const [newChapterSelectedLessonIds, setNewChapterSelectedLessonIds] = useState<string[]>([]);
  // Drag and Drop state cho việc sắp xếp bài học
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);
  // Search và Filter cho Tab Thư viện
  const [librarySearchTerm, setLibrarySearchTerm] = useState<string>('');
  const [libraryStatusFilter, setLibraryStatusFilter] = useState<string>('ALL');
  // Xóa bài học từ Tab Thư viện — tính năng gộp về từ trang /lessons độc lập đã bỏ
  // (trước đây 2 nơi cùng hiển thị "danh sách bài học", gây trùng lặp giao diện).
  const [deletingLibraryLesson, setDeletingLibraryLesson] = useState<LessonItem | null>(null);
  const [isDeletingLibraryLesson, setIsDeletingLibraryLesson] = useState<boolean>(false);
  // Tải danh sách Lộ trình học từ Backend
  const loadLearningPaths = useCallback(async () => {
    try {
      setLoading(true);
      const paths = await LearningPathApiService.getLearningPaths();
      setLearningPaths(paths);
      // KHÔNG tự chọn lộ trình đầu tiên nữa — khi không có `?pathId=` trong URL, màn
      // hình mặc định hiện LearningPathListPanel (danh sách), đúng mô hình List → Detail.
    } catch (err) {
      showError(err, 'Không tải được danh sách lộ trình.');
    } finally {
      setLoading(false);
    }
  }, [showError]);
  // Tải danh sách Bài học độc lập trong Thư viện
  const loadLibraryLessons = useCallback(async () => {
    try {
      const res = await LessonApiService.getLessons({ limit: 100 });
      // `getLessons` trả về { items, total } (PaginatedResult) — KHÔNG có field `.data`.
      setLibraryLessons(res.items || []);
    } catch (err) {
      showError(err, 'Không tải được thư viện bài học.');
    }
  }, [showError]);
  useEffect(() => {
    void Promise.resolve().then(() => {
      loadLearningPaths();
      loadLibraryLessons();
    });
  }, [loadLearningPaths, loadLibraryLessons]);
  // Lộ trình đang được chọn — `null` khi chưa chọn gì (hiện danh sách), KHÔNG fallback
  // về lộ trình đầu tiên nữa (fallback cũ khiến màn Chi tiết luôn hiện dù chưa ai bấm
  // chọn, không thể quay về màn Danh sách được).
  const currentPath = useMemo(() => {
    return learningPaths.find((p) => p.id === selectedPathId) || null;
  }, [learningPaths, selectedPathId]);
  // Biên tập viên mở lộ trình đã xuất bản/lưu trữ: chỉ xem cấu trúc chương.
  const structureLocked = Boolean(currentPath && !isReviewer && LOCKED_STATUSES.includes(currentPath.status));
  // Phiên bản hóa lộ trình / chương đã xuất bản: bản sửa chờ duyệt + bản phủ để form mở tiếp.
  const [pathPending, setPathPending] = useState<{
    revision: ContentRevisionItem;
    draft: { title?: string; description?: string | null };
  } | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [editChapter, setEditChapter] = useState<{ id: string; title: string; description: string } | null>(null);
  const refreshPathPending = useCallback(async () => {
    if (!currentPath || currentPath.status !== ContentStatus.PUBLISHED) {
      setPathPending(null);
      return;
    }
    try {
      setPathPending(await ContentRevisionApiService.openDraft('LEARNING_PATH', currentPath.id));
    } catch {
      setPathPending(null);
    }
  }, [currentPath]);
  useEffect(() => {
    void Promise.resolve().then(() => {
      setRevisionNotice(null);
      void refreshPathPending();
    });
  }, [refreshPathPending]);
  // Tự động mở rộng tất cả các chương khi tải xong
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (currentPath?.chapters) {
        const defaultState: Record<string, boolean> = {};
        currentPath.chapters.forEach((ch) => {
          defaultState[ch.id] = true;
        });
        setExpandedChapters((prev) => ({ ...defaultState, ...prev }));
      }
    });
  }, [currentPath]);
  // Đổi trạng thái mở/thu gọn một chương
  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };
  // Mở modal gom bài học vào chương
  const handleOpenAddLessonsModal = (chapter: ChapterItem) => {
    setTargetChapterForLessons(chapter);
    const existingIds = (chapter.chapterLessons || []).map((cl) => cl.lessonId);
    setSelectedLessonIdsForChapter(existingIds);
    setModalSearchTerm('');
    setQuickCreateTitle('');
    setShowAddLessonModal(true);
  };
  // Tạo nhanh một bài học mới (chỉ cần tiêu đề) và gom luôn vào chương đang mở modal
  const handleQuickCreateLesson = async () => {
    if (!quickCreateTitle.trim() || !quickCreateTopic || !targetChapterForLessons) return;
    try {
      setIsQuickCreating(true);
      const created = await LessonApiService.createLesson({
        title: quickCreateTitle.trim(),
        topicId: quickCreateTopic.id,
      });
      await LearningPathApiService.addLessonsToChapter(targetChapterForLessons.id, [created.id]);
      setQuickCreateTitle('');
      await Promise.all([loadLearningPaths(), loadLibraryLessons()]);
    } catch (err) {
      showError(err, 'Không thể tạo bài học mới. Vui lòng thử lại!');
    } finally {
      setIsQuickCreating(false);
    }
  };
  // Xóa 1 bài học khỏi Thư viện (và khỏi mọi chương đang chứa nó)
  const handleDeleteLibraryLesson = async () => {
    if (!deletingLibraryLesson) return;
    try {
      setIsDeletingLibraryLesson(true);
      await LessonApiService.deleteLesson(deletingLibraryLesson.id);
      setDeletingLibraryLesson(null);
      await Promise.all([loadLearningPaths(), loadLibraryLessons()]);
    } catch (err: unknown) {
      showError(err, 'Không thể xóa bài học.');
    } finally {
      setIsDeletingLibraryLesson(false);
    }
  };
  const handleToggleSelectLessonInModal = (lessonId: string) => {
    setSelectedLessonIdsForChapter((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId],
    );
  };
  const handleMoveSelectedLessonInModal = (lessonId: string, direction: SortDirection | 'UP' | 'DOWN') => {
    setSelectedLessonIdsForChapter((prev) => {
      const idx = prev.indexOf(lessonId);
      if (idx === -1) return prev;
      const targetIdx = direction === SortDirection.UP ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
  };
  const handleConfirmAddLessonsToChapter = async () => {
    if (!targetChapterForLessons) return;
    try {
      setActionLoading(true);
      await LearningPathApiService.addLessonsToChapter(
        targetChapterForLessons.id,
        selectedLessonIdsForChapter,
      );
      if (selectedLessonIdsForChapter.length > 1) {
        await LearningPathApiService.reorderChapterLessons(
          targetChapterForLessons.id,
          selectedLessonIdsForChapter,
        );
      }
      await loadLearningPaths();
      setShowAddLessonModal(false);
    } catch (err) {
      showError(err, 'Không thể thêm bài học vào chương. Vui lòng thử lại!');
    } finally {
      setActionLoading(false);
    }
  };
  const handleRemoveLessonFromChapter = async (
    e: React.MouseEvent,
    chapterId: string,
    lessonId: string,
  ) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn bỏ bài học này khỏi chương?')) return;
    try {
      setActionLoading(true);
      await LearningPathApiService.removeLessonFromChapter(chapterId, lessonId);
      await loadLearningPaths();
    } catch (err) {
      showError(err, 'Không bỏ được bài học khỏi chương.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleMoveLessonOrder = async (
    e: React.MouseEvent,
    chapter: ChapterItem,
    currentIndex: number,
    direction: SortDirection | 'UP' | 'DOWN',
  ) => {
    e.stopPropagation();
    const items = [...(chapter.chapterLessons || [])];
    const targetIndex = direction === SortDirection.UP ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[currentIndex];
    items[currentIndex] = items[targetIndex];
    items[targetIndex] = temp;

    const orderedLessonIds = items.map((cl) => cl.lessonId);

    setLearningPaths((prevPaths) =>
      prevPaths.map((p) => {
        if (p.id !== currentPath?.id) return p;
        return {
          ...p,
          chapters: p.chapters.map((ch) => {
            if (ch.id !== chapter.id) return ch;
            return { ...ch, chapterLessons: items.map((cl, idx) => ({ ...cl, displayOrder: idx + 1 })) };
          }),
        };
      }),
    );

    try {
      await LearningPathApiService.reorderChapterLessons(chapter.id, orderedLessonIds);
    } catch (err) {
      showError(err, 'Không lưu được thứ tự bài học.');
      await loadLearningPaths();
    }
  };
  const handleDragStart = (lessonId: string) => setDraggingLessonId(lessonId);
  const handleDragOver = (e: React.DragEvent, lessonId: string) => {
    e.preventDefault();
    setDragOverLessonId(lessonId);
  };
  const handleDrop = async (chapter: ChapterItem, targetLessonId: string) => {
    if (!draggingLessonId || draggingLessonId === targetLessonId) {
      setDraggingLessonId(null);
      setDragOverLessonId(null);
      return;
    }

    const items = [...(chapter.chapterLessons || [])];
    const fromIndex = items.findIndex((cl) => cl.lessonId === draggingLessonId);
    const toIndex = items.findIndex((cl) => cl.lessonId === targetLessonId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingLessonId(null);
      setDragOverLessonId(null);
      return;
    }

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);

    const orderedLessonIds = items.map((cl) => cl.lessonId);
    setDraggingLessonId(null);
    setDragOverLessonId(null);

    setLearningPaths((prevPaths) =>
      prevPaths.map((p) => {
        if (p.id !== currentPath?.id) return p;
        return {
          ...p,
          chapters: p.chapters.map((ch) => {
            if (ch.id !== chapter.id) return ch;
            return { ...ch, chapterLessons: items.map((cl, idx) => ({ ...cl, displayOrder: idx + 1 })) };
          }),
        };
      }),
    );

    try {
      await LearningPathApiService.reorderChapterLessons(chapter.id, orderedLessonIds);
    } catch (err) {
      showError(err, 'Không lưu được thứ tự bài học.');
      await loadLearningPaths();
    }
  };
  const handleCreatePath = async () => {
    if (!newPathTitle.trim()) {
      alert('Vui lòng nhập tên lộ trình học!');
      return;
    }
    try {
      setActionLoading(true);
      const created = await LearningPathApiService.createLearningPath({
        title: newPathTitle.trim(),
        description: newPathDesc.trim() || undefined,
      });
      await loadLearningPaths();
      selectPath(created.id);
      setShowCreatePathModal(false);
      setNewPathTitle('');
      setNewPathDesc('');
    } catch (err) {
      showError(err, 'Không thể tạo lộ trình. Vui lòng kiểm tra lại!');
    } finally {
      setActionLoading(false);
    }
  };
  const handleOpenEditPathModal = () => {
    if (!currentPath) return;
    // Biên tập viên có bản sửa đang chờ: mở tiếp bản sửa đó (lưu sẽ cập nhật bản sửa).
    const source = !isReviewer && pathPending ? pathPending.draft : currentPath;
    setEditPathTitle(source.title || currentPath.title);
    setEditPathDesc(source.description || '');
    setShowEditPathModal(true);
  };
  const handleUpdatePath = async () => {
    if (!currentPath || !editPathTitle.trim()) {
      alert('Vui lòng nhập tên lộ trình học!');
      return;
    }
    try {
      setActionLoading(true);
      const saved = await LearningPathApiService.updateLearningPath(currentPath.id, {
        title: editPathTitle.trim(),
        description: editPathDesc.trim() || undefined,
      });
      setShowEditPathModal(false);
      if (isRevisionPending(saved)) {
        // Lộ trình đang xuất bản: thành bản sửa chờ duyệt, bản công khai giữ nguyên.
        setRevisionNotice(saved.message);
        await refreshPathPending();
        return;
      }
      await loadLearningPaths();
    } catch (err) {
      showError(err, 'Không thể lưu thay đổi. Vui lòng kiểm tra lại!');
    } finally {
      setActionLoading(false);
    }
  };
  /** Mở sửa tên / mô tả chương; biên tập viên có bản sửa chờ duyệt thì mở tiếp bản sửa đó. */
  const handleOpenEditChapter = async (chapter: { id: string; title: string; description?: string | null; status?: string }) => {
    let source = { title: chapter.title, description: chapter.description ?? '' };
    if (!isReviewer && chapter.status === ContentStatus.PUBLISHED) {
      try {
        const open = await ContentRevisionApiService.openDraft<{ title?: string; description?: string | null }>('CHAPTER', chapter.id);
        if (open) source = { title: open.draft.title ?? chapter.title, description: open.draft.description ?? '' };
      } catch {
        // Không tải được bản sửa: mở bản hiện tại.
      }
    }
    setEditChapter({ id: chapter.id, ...source });
  };
  const handleUpdateChapter = async () => {
    if (!editChapter || !editChapter.title.trim()) {
      alert('Vui lòng nhập tên chương!');
      return;
    }
    try {
      setActionLoading(true);
      const saved = await LearningPathApiService.updateChapter(editChapter.id, {
        title: editChapter.title.trim(),
        description: editChapter.description.trim() || undefined,
      });
      setEditChapter(null);
      if (isRevisionPending(saved)) {
        setRevisionNotice(`Chương: ${saved.message}`);
        return;
      }
      await loadLearningPaths();
    } catch (err) {
      showError(err, 'Không thể lưu chương. Vui lòng kiểm tra lại!');
    } finally {
      setActionLoading(false);
    }
  };
  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim() || !currentPath) {
      alert('Vui lòng nhập tên chương!');
      return;
    }
    try {
      setActionLoading(true);
      const createdChapter = await LearningPathApiService.createChapter({
        learningPathId: currentPath.id,
        title: newChapterTitle.trim(),
        description: newChapterDesc.trim() || undefined,
        displayOrder: (currentPath.chapters?.length || 0) + 1,
      });
      // Gắn luôn các bài học đã chọn + đúng thứ tự đã sắp xếp trong modal — 1 lần tạo
      // là xong, không cần mở lại "Thêm Lesson từ thư viện" cho chương vừa tạo.
      if (newChapterSelectedLessonIds.length > 0) {
        await LearningPathApiService.addLessonsToChapter(createdChapter.id, newChapterSelectedLessonIds);
      }
      await loadLearningPaths();
      setShowCreateChapterModal(false);
      setNewChapterTitle('');
      setNewChapterDesc('');
      setNewChapterSearchTerm('');
      setNewChapterSelectedLessonIds([]);
    } catch (err) {
      showError(err, 'Không thể tạo chương. Vui lòng kiểm tra lại!');
    } finally {
      setActionLoading(false);
    }
  };
  const handleToggleLessonForNewChapter = (lessonId: string) => {
    setNewChapterSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId],
    );
  };
  const handleMoveNewChapterLessonOrder = (lessonId: string, direction: SortDirection | 'UP' | 'DOWN') => {
    setNewChapterSelectedLessonIds((prev) => {
      const idx = prev.indexOf(lessonId);
      if (idx === -1) return prev;
      const targetIdx = direction === SortDirection.UP ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
  };
  /** Xuất bản / chuyển nháp / lưu trữ / khôi phục lộ trình đang chọn. */
  const handleChangePathStatus = async (nextStatus: ContentStatus) => {
    if (!currentPath) return;
    try {
      setActionLoading(true);
      await LearningPathApiService.updateLearningPath(currentPath.id, { status: nextStatus });
      await loadLearningPaths();
    } catch (err) {
      showError(err, 'Không đổi được trạng thái lộ trình.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string, chapterTitle: string) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc chắn muốn xóa "${chapterTitle}" không?`)) return;
    try {
      setActionLoading(true);
      await LearningPathApiService.deleteChapter(chapterId);
      await loadLearningPaths();
    } catch (err) {
      showError(err, 'Không xóa được chương.');
    } finally {
      setActionLoading(false);
    }
  };
  const filteredLibraryLessons = useMemo(() => {
    return libraryLessons.filter((l) => {
      const matchSearch =
        !librarySearchTerm ||
        l.title.toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
        l.slug.toLowerCase().includes(librarySearchTerm.toLowerCase());
      const matchStatus = libraryStatusFilter === CommonFilterOption.ALL || l.status === libraryStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [libraryLessons, librarySearchTerm, libraryStatusFilter]);
  const modalFilteredLessons = useMemo(() => {
    if (!modalSearchTerm) return libraryLessons;
    return libraryLessons.filter((l) => l.title.toLowerCase().includes(modalSearchTerm.toLowerCase()));
  }, [libraryLessons, modalSearchTerm]);
  const newChapterFilteredLessons = useMemo(() => {
    if (!newChapterSearchTerm) return libraryLessons;
    return libraryLessons.filter((l) => l.title.toLowerCase().includes(newChapterSearchTerm.toLowerCase()));
  }, [libraryLessons, newChapterSearchTerm]);

  return {
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
    quickCreateTopic,
    setQuickCreateTopic,
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
    handleChangePathStatus,
    handleDeleteChapter,
    filteredLibraryLessons,
    modalFilteredLessons,
    newChapterFilteredLessons,
  };
}

export type HisgoStudioFacade = ReturnType<typeof useHisgoStudio>;
