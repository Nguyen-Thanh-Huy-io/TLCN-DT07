'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LearningPathApiService,
  LearningPathItem,
  ChapterItem,
  ChapterQuizInputDto,
  CurriculumTrackItem,
} from '@/services/entities/learner.service';
import { LessonApiService } from '@/services/entities/learner.service';
import { QuizApiService, type StandaloneQuizItem } from '@/services/entities/quiz.service';
import { LessonItem } from '@/types/models';
import type { PickedTopic } from '@/features/topics/components/TopicEditor';
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
  // Dữ liệu Mạch tiến trình (Tracks), Lộ trình, Đề thi và Bài học
  const [tracks, setTracks] = useState<CurriculumTrackItem[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<StandaloneQuizItem[]>([]);
  // Modal: Tạo / Sửa Mạch tiến trình
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string>('');
  const [trackDesc, setTrackDesc] = useState<string>('');
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
  const [showCreatePathModal, setShowCreatePathModal] = useState<boolean>(false);
  const [newPathTitle, setNewPathTitle] = useState<string>('');
  const [newPathDesc, setNewPathDesc] = useState<string>('');
  const [newPathCover, setNewPathCover] = useState<string>('');
  const [newPathSequential, setNewPathSequential] = useState<boolean>(false);
  const [newPathType, setNewPathType] = useState<'CHRONOLOGICAL' | 'THEMATIC'>('CHRONOLOGICAL');
  const [newPathTrackId, setNewPathTrackId] = useState<string>('');
  const [newPathStageOrder, setNewPathStageOrder] = useState<number>(0);
  const [newPathPrerequisiteId, setNewPathPrerequisiteId] = useState<string>('');
  const [newPathStageExamQuizId, setNewPathStageExamQuizId] = useState<string>('');
  const [newPathStageExamPassScore, setNewPathStageExamPassScore] = useState<number>(70);
  // Modal: Sửa Lộ trình học hiện tại (trước đây chỉ có Tạo, chưa có Sửa)
  const [showEditPathModal, setShowEditPathModal] = useState<boolean>(false);
  const [editPathTitle, setEditPathTitle] = useState<string>('');
  const [editPathDesc, setEditPathDesc] = useState<string>('');
  const [editPathCover, setEditPathCover] = useState<string>('');
  const [editPathSequential, setEditPathSequential] = useState<boolean>(false);
  const [editPathType, setEditPathType] = useState<'CHRONOLOGICAL' | 'THEMATIC'>('CHRONOLOGICAL');
  const [editPathTrackId, setEditPathTrackId] = useState<string>('');
  const [editPathPrerequisiteId, setEditPathPrerequisiteId] = useState<string>('');
  const [editPathStageExamQuizId, setEditPathStageExamQuizId] = useState<string>('');
  const [editPathStageExamPassScore, setEditPathStageExamPassScore] = useState<number>(70);
  // Modal: Tạo Chương mới — chọn + sắp xếp bài học ngay trong modal này, không cần mở
  // riêng AddLessonsToChapterModal nữa sau khi tạo xong (vẫn giữ modal đó để GOM THÊM
  // bài vào 1 chương đã có sẵn, 2 việc khác nhau).
  const [showCreateChapterModal, setShowCreateChapterModal] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [newChapterDesc, setNewChapterDesc] = useState<string>('');
  const [newChapterSearchTerm, setNewChapterSearchTerm] = useState<string>('');
  const [newChapterSelectedLessonIds, setNewChapterSelectedLessonIds] = useState<string[]>([]);
  const [newChapterQuizItems, setNewChapterQuizItems] = useState<ChapterQuizInputDto[]>([]);
  // Modal: Quản lý Đề kiểm tra của một Chương đã có
  const [showChapterQuizzesModal, setShowChapterQuizzesModal] = useState<boolean>(false);
  const [targetChapterForQuizzes, setTargetChapterForQuizzes] = useState<ChapterItem | null>(null);
  const [chapterQuizItemsDraft, setChapterQuizItemsDraft] = useState<ChapterQuizInputDto[]>([]);
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
  // Tải danh sách Mạch tiến trình, Lộ trình học và Đề thi từ Backend
  const loadLearningPaths = useCallback(async () => {
    try {
      setLoading(true);
      const [paths, trackList, quizRes] = await Promise.all([
        LearningPathApiService.getLearningPaths(),
        LearningPathApiService.getTracks().catch(() => [] as CurriculumTrackItem[]),
        QuizApiService.getAllQuizzes({ limit: 100 }).catch(() => ({ items: [] as StandaloneQuizItem[] })),
      ]);
      setLearningPaths(paths);
      setTracks(trackList);
      setAvailableQuizzes(quizRes.items || []);
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
  const handleOpenCreateTrackModal = () => {
    setEditingTrackId(null);
    setTrackTitle('');
    setTrackDesc('');
    setShowTrackModal(true);
  };
  const handleOpenEditTrackModal = (track: CurriculumTrackItem) => {
    setEditingTrackId(track.id);
    setTrackTitle(track.title);
    setTrackDesc(track.description || '');
    setShowTrackModal(true);
  };
  const handleSaveTrack = async () => {
    if (!trackTitle.trim()) return;
    try {
      setActionLoading(true);
      if (editingTrackId) {
        await LearningPathApiService.updateTrack(editingTrackId, {
          title: trackTitle.trim(),
          description: trackDesc.trim() || undefined,
        });
        setNotice({ tone: NoticeTone.SUCCESS, text: `Đã cập nhật mạch "${trackTitle.trim()}".` });
      } else {
        await LearningPathApiService.createTrack({
          title: trackTitle.trim(),
          description: trackDesc.trim() || undefined,
          displayOrder: tracks.length + 1,
        });
        setNotice({ tone: NoticeTone.SUCCESS, text: `Đã tạo mạch tiến trình "${trackTitle.trim()}".` });
      }
      setShowTrackModal(false);
      await loadLearningPaths();
    } catch (err) {
      showError(err, 'Không thể lưu mạch tiến trình.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteTrack = async (track: CurriculumTrackItem) => {
    if (!window.confirm(`Xóa mạch "${track.title}"? Các lộ trình bên trong vẫn được giữ lại.`)) return;
    try {
      setActionLoading(true);
      await LearningPathApiService.deleteTrack(track.id);
      await loadLearningPaths();
      setNotice({ tone: NoticeTone.SUCCESS, text: `Đã xóa mạch "${track.title}".` });
    } catch (err) {
      showError(err, 'Không thể xóa mạch tiến trình.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleOpenCreateStageInTrack = (
    trackId: string,
    lastStageId: string | null,
    nextStageOrder: number,
  ) => {
    setNewPathTitle('');
    setNewPathDesc('');
    setNewPathCover('');
    setNewPathSequential(true);
    setNewPathType('CHRONOLOGICAL');
    setNewPathTrackId(trackId);
    setNewPathStageOrder(nextStageOrder);
    setNewPathPrerequisiteId(lastStageId || '');
    setNewPathStageExamQuizId('');
    setNewPathStageExamPassScore(70);
    setShowCreatePathModal(true);
  };
  const handleOpenCreateThematicPath = () => {
    setNewPathTitle('');
    setNewPathDesc('');
    setNewPathCover('');
    setNewPathSequential(false);
    setNewPathType('THEMATIC');
    setNewPathTrackId('');
    setNewPathStageOrder(0);
    setNewPathPrerequisiteId('');
    setNewPathStageExamQuizId('');
    setNewPathStageExamPassScore(70);
    setShowCreatePathModal(true);
  };
  const handleCreatePath = async () => {
    if (!newPathTitle.trim()) {
      alert('Vui lòng nhập tên lộ trình học!');
      return;
    }
    try {
      setActionLoading(true);
      const isThematic = newPathType === 'THEMATIC';
      const created = await LearningPathApiService.createLearningPath({
        title: newPathTitle.trim(),
        description: newPathDesc.trim() || undefined,
        coverImageUrl: newPathCover.trim() || undefined,
        isSequential: newPathSequential,
        pathType: newPathType,
        trackId: isThematic ? null : newPathTrackId.trim() || null,
        stageOrder: isThematic ? 0 : newPathStageOrder,
        prerequisitePathId: isThematic ? null : newPathPrerequisiteId.trim() || null,
        stageExamQuizId: newPathStageExamQuizId.trim() || null,
        stageExamPassScore: newPathStageExamQuizId.trim() ? newPathStageExamPassScore : null,
      });
      await loadLearningPaths();
      selectPath(created.id);
      setShowCreatePathModal(false);
      setNewPathTitle('');
      setNewPathDesc('');
      setNewPathCover('');
      setNewPathSequential(false);
      setNewPathType('CHRONOLOGICAL');
      setNewPathTrackId('');
      setNewPathStageOrder(0);
      setNewPathPrerequisiteId('');
      setNewPathStageExamQuizId('');
      setNewPathStageExamPassScore(70);
    } catch (err) {
      showError(err, 'Không thể tạo lộ trình. Vui lòng kiểm tra lại!');
    } finally {
      setActionLoading(false);
    }
  };
  const handleOpenEditPathModal = () => {
    if (!currentPath) return;
    // Biên tập viên có bản sửa đang chờ: mở tiếp bản sửa đó (lưu sẽ cập nhật bản sửa).
    const source = (!isReviewer && pathPending ? pathPending.draft : currentPath) as {
      title?: string;
      description?: string | null;
      coverImageUrl?: string | null;
      isSequential?: boolean;
      pathType?: 'CHRONOLOGICAL' | 'THEMATIC';
      trackId?: string | null;
      prerequisitePathId?: string | null;
      stageExamQuizId?: string | null;
      stageExamPassScore?: number | null;
    };
    setEditPathTitle(source.title || currentPath.title);
    setEditPathDesc(source.description || '');
    setEditPathCover(source.coverImageUrl ?? currentPath.coverImageUrl ?? '');
    setEditPathSequential(Boolean(source.isSequential ?? currentPath.isSequential));
    setEditPathType(source.pathType ?? currentPath.pathType ?? 'CHRONOLOGICAL');
    setEditPathTrackId(source.trackId ?? currentPath.trackId ?? '');
    setEditPathPrerequisiteId(source.prerequisitePathId ?? currentPath.prerequisitePathId ?? '');
    setEditPathStageExamQuizId(source.stageExamQuizId ?? currentPath.stageExamQuizId ?? '');
    setEditPathStageExamPassScore(
      source.stageExamPassScore ??
        currentPath.stageExamPassScore ??
        currentPath.stageExamQuiz?.passingScorePercent ??
        70,
    );
    setShowEditPathModal(true);
  };
  const handleUpdatePath = async () => {
    if (!currentPath || !editPathTitle.trim()) {
      alert('Vui lòng nhập tên lộ trình học!');
      return;
    }
    try {
      setActionLoading(true);
      const isThematic = editPathType === 'THEMATIC';
      const saved = await LearningPathApiService.updateLearningPath(currentPath.id, {
        title: editPathTitle.trim(),
        description: editPathDesc.trim() || undefined,
        coverImageUrl: editPathCover.trim() || undefined,
        isSequential: editPathSequential,
        pathType: editPathType,
        trackId: isThematic ? null : editPathTrackId ? editPathTrackId : null,
        prerequisitePathId: isThematic ? null : editPathPrerequisiteId ? editPathPrerequisiteId : null,
        stageExamQuizId: editPathStageExamQuizId ? editPathStageExamQuizId : null,
        stageExamPassScore: editPathStageExamQuizId ? editPathStageExamPassScore : null,
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
  const handleDeletePath = async () => {
    if (!currentPath) return;
    if (!window.confirm(`Xóa vĩnh viễn lộ trình "${currentPath.title}"? Các bài học gốc trong thư viện vẫn được giữ nguyên.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await LearningPathApiService.deleteLearningPath(currentPath.id);
      selectPath(null);
      await loadLearningPaths();
      setNotice({ tone: NoticeTone.SUCCESS, text: `Đã xóa lộ trình "${currentPath.title}".` });
    } catch (err) {
      showError(err, 'Không thể xóa lộ trình này. Vui lòng kiểm tra lại!');
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
        quizItems: newChapterQuizItems.length > 0 ? newChapterQuizItems : undefined,
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
      setNewChapterQuizItems([]);
    } catch (err) {
      showError(err, 'Không thể tạo chương. Vui lòng kiểm tra lại!');
    } finally {
      setActionLoading(false);
    }
  };
  const handleOpenManageChapterQuizzes = (chapter: ChapterItem) => {
    setTargetChapterForQuizzes(chapter);
    const existing: ChapterQuizInputDto[] = (chapter.chapterQuizzes ?? []).map((cq) => ({
      quizId: cq.quizId,
      passScore: cq.passScore ?? cq.quiz?.passingScorePercent ?? 70,
      isRequired: cq.isRequired,
    }));
    setChapterQuizItemsDraft(existing);
    setShowChapterQuizzesModal(true);
  };
  const handleConfirmChapterQuizzes = async () => {
    if (!targetChapterForQuizzes) return;
    try {
      setActionLoading(true);
      await LearningPathApiService.setChapterQuizzes(
        targetChapterForQuizzes.id,
        chapterQuizItemsDraft,
      );
      await loadLearningPaths();
      setShowChapterQuizzesModal(false);
      setNotice({
        tone: NoticeTone.SUCCESS,
        text: `Đã cập nhật ${chapterQuizItemsDraft.length} đề kiểm tra cho "${targetChapterForQuizzes.title}".`,
      });
    } catch (err) {
      showError(err, 'Không thể lưu danh sách đề kiểm tra cho chương.');
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
    newPathCover,
    setNewPathCover,
    newPathSequential,
    setNewPathSequential,
    newPathType,
    setNewPathType,
    tracks,
    availableQuizzes,
    showTrackModal,
    setShowTrackModal,
    editingTrackId,
    trackTitle,
    setTrackTitle,
    trackDesc,
    setTrackDesc,
    handleOpenCreateTrackModal,
    handleOpenEditTrackModal,
    handleSaveTrack,
    handleDeleteTrack,
    handleOpenCreateStageInTrack,
    handleOpenCreateThematicPath,
    newPathTrackId,
    setNewPathTrackId,
    newPathPrerequisiteId,
    setNewPathPrerequisiteId,
    newPathStageExamQuizId,
    setNewPathStageExamQuizId,
    newPathStageExamPassScore,
    setNewPathStageExamPassScore,
    showEditPathModal,
    setShowEditPathModal,
    editPathTitle,
    setEditPathTitle,
    editPathDesc,
    setEditPathDesc,
    editPathCover,
    setEditPathCover,
    editPathSequential,
    setEditPathSequential,
    editPathType,
    setEditPathType,
    editPathTrackId,
    setEditPathTrackId,
    editPathPrerequisiteId,
    setEditPathPrerequisiteId,
    editPathStageExamQuizId,
    setEditPathStageExamQuizId,
    editPathStageExamPassScore,
    setEditPathStageExamPassScore,
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
    newChapterQuizItems,
    setNewChapterQuizItems,
    showChapterQuizzesModal,
    setShowChapterQuizzesModal,
    targetChapterForQuizzes,
    chapterQuizItemsDraft,
    setChapterQuizItemsDraft,
    handleOpenManageChapterQuizzes,
    handleConfirmChapterQuizzes,
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
    handleDeletePath,
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
