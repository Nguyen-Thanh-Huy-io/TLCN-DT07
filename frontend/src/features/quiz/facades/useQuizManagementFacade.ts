import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QuizApiService,
  StandaloneQuizItem,
  CreateStandaloneQuizDto,
  UpdateStandaloneQuizDto,
} from '@/services/entities/quiz.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models';
import { TopicApiService } from '@/services/entities/topic.service';
import { TopicItem } from '@/types/models';
import { ALL_FILTER_VALUE, QuizStatusEnum } from '@/constants/enums';

export interface QuizManagementStats {
  totalQuizzes: number;
  activeQuizzes: number;
  draftQuizzes: number;
  totalQuestions: number;
}

export function useQuizManagementFacade() {
  const [quizzes, setQuizzes] = useState<StandaloneQuizItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>(ALL_FILTER_VALUE);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(ALL_FILTER_VALUE);

  // Preview modals state
  const [previewQuiz, setPreviewQuiz] = useState<StandaloneQuizItem | null>(null);

  // Edit/Create modal state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingQuiz, setEditingQuiz] = useState<StandaloneQuizItem | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load danh sách Quiz, Bài học & Chủ đề
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [quizRes, lessonRes, topicRes] = await Promise.all([
        QuizApiService.getAllQuizzes({ limit: 100 }).catch((e) => {
          console.warn('Lỗi tải danh sách Quiz:', e);
          return { items: [] };
        }),
        LessonApiService.getLessons({ limit: 100 }).catch((e) => {
          console.warn('Lỗi tải danh sách Bài học:', e);
          return { items: [] };
        }),
        TopicApiService.getTopics({ limit: 100 }).catch((e) => {
          console.warn('Lỗi tải danh sách Chủ đề:', e);
          return { items: [] };
        }),
      ]);
      setQuizzes(quizRes.items || []);
      setLessons(lessonRes.items || []);
      setTopics(topicRes.items || []);
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách bộ Quiz:', err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = Promise.resolve().then(() => {
      if (isMounted) void loadData();
    });

    return () => {
      isMounted = false;
      void timer;
    };
  }, [loadData]);

  // Bộ lọc tìm kiếm
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const query = search.trim().toLowerCase();
      const matchSearch =
        query === '' ||
        quiz.title.toLowerCase().includes(query) ||
        (quiz.description && quiz.description.toLowerCase().includes(query)) ||
        (quiz.topicTitle && quiz.topicTitle.toLowerCase().includes(query));

      const matchStatus =
        filterStatus === ALL_FILTER_VALUE || quiz.status === filterStatus;

      const matchTopic =
        selectedTopicId === ALL_FILTER_VALUE ||
        (quiz.topics && quiz.topics.some((t) => t.id === selectedTopicId)) ||
        (quiz.topicIds && quiz.topicIds.includes(selectedTopicId));

      return matchSearch && matchStatus && matchTopic;
    });
  }, [quizzes, search, filterStatus, selectedTopicId]);

  // Tính toán chỉ số thống kê KPI
  const stats: QuizManagementStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    let activeQuizzes = 0;
    let draftQuizzes = 0;
    let totalQuestions = 0;

    for (const q of quizzes) {
      if (q.status === QuizStatusEnum.ACTIVE) activeQuizzes++;
      else draftQuizzes++;
      totalQuestions += q.questionCount || 0;
    }

    return { totalQuizzes, activeQuizzes, draftQuizzes, totalQuestions };
  }, [quizzes]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingQuiz(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (quiz: StandaloneQuizItem) => {
    setEditingQuiz(quiz);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingQuiz(null);
  };

  const handleOpenQuizPreview = (quiz: StandaloneQuizItem) => {
    setPreviewQuiz(quiz);
  };

  const handleCloseQuizPreview = () => {
    setPreviewQuiz(null);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.'
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      await QuizApiService.deleteStandaloneQuiz(quizId);
      await loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Có lỗi xảy ra khi xóa đề thi.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveQuiz = async (dto: CreateStandaloneQuizDto) => {
    try {
      setActionLoading(true);
      if (editingQuiz) {
        await QuizApiService.updateStandaloneQuiz(
          editingQuiz.id,
          dto as UpdateStandaloneQuizDto
        );
      } else {
        await QuizApiService.createStandaloneQuiz(dto);
      }
      handleCloseEditor();
      await loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Có lỗi xảy ra khi lưu đề thi.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    quizzes: filteredQuizzes,
    allQuizzesCount: quizzes.length,
    lessons,
    topics,
    loading,
    actionLoading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    selectedTopicId,
    setSelectedTopicId,
    stats,
    // Preview modals
    previewQuiz,
    handleOpenQuizPreview,
    handleCloseQuizPreview,
    // Edit modal
    isEditorOpen,
    editingQuiz,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseEditor,
    handleDeleteQuiz,
    handleSaveQuiz,
    refresh: loadData,
  };
}
