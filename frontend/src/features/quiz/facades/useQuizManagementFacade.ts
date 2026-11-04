import { useState, useEffect, useMemo, useCallback } from 'react';
import { QuizApiService, StandaloneQuizItem, CreateStandaloneQuizDto, UpdateStandaloneQuizDto } from '@/services/entities/quiz.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models/lesson.type';

export interface QuizManagementStats {
  totalQuizzes: number;
  activeQuizzes: number;
  draftQuizzes: number;
  totalQuestions: number;
}

export function useQuizManagementFacade() {
  const [quizzes, setQuizzes] = useState<StandaloneQuizItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'DRAFT'>('all');

  // Preview modals state
  const [previewQuiz, setPreviewQuiz] = useState<StandaloneQuizItem | null>(null);
  const [previewLesson, setPreviewLesson] = useState<{
    id: string;
    title: string;
    slug?: string;
    description?: string | null;
    topicTitle?: string;
  } | null>(null);

  // Edit/Create modal state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingQuiz, setEditingQuiz] = useState<StandaloneQuizItem | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load danh sách Quiz & Bài học
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [quizRes, lessonRes] = await Promise.all([
        QuizApiService.getAllQuizzes({ limit: 100 }),
        LessonApiService.getLessons({ limit: 100 }),
      ]);
      setQuizzes(quizRes.items || []);
      setLessons(lessonRes.items || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bộ Quiz:', err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ lọc tìm kiếm
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const query = search.trim().toLowerCase();
      const matchSearch =
        query === '' ||
        quiz.title.toLowerCase().includes(query) ||
        (quiz.description && quiz.description.toLowerCase().includes(query)) ||
        (quiz.lessonTitle && quiz.lessonTitle.toLowerCase().includes(query)) ||
        (quiz.topicTitle && quiz.topicTitle.toLowerCase().includes(query));

      const matchStatus = filterStatus === 'all' || quiz.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [quizzes, search, filterStatus]);

  // Tính toán chỉ số thống kê KPI
  const stats: QuizManagementStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    let activeQuizzes = 0;
    let draftQuizzes = 0;
    let totalQuestions = 0;

    for (const q of quizzes) {
      if (q.status === 'ACTIVE') activeQuizzes++;
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

  const handleOpenLessonPreview = (lessonInfo: {
    id: string;
    title: string;
    slug?: string;
    description?: string | null;
    topicTitle?: string;
  }) => {
    setPreviewLesson(lessonInfo);
  };

  const handleCloseLessonPreview = () => {
    setPreviewLesson(null);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      setActionLoading(true);
      await QuizApiService.deleteStandaloneQuiz(quizId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa đề thi.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveQuiz = async (dto: CreateStandaloneQuizDto) => {
    try {
      setActionLoading(true);
      if (editingQuiz) {
        await QuizApiService.updateStandaloneQuiz(editingQuiz.id, dto as UpdateStandaloneQuizDto);
      } else {
        await QuizApiService.createStandaloneQuiz(dto);
      }
      handleCloseEditor();
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đề thi.');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    quizzes: filteredQuizzes,
    allQuizzesCount: quizzes.length,
    lessons,
    loading,
    actionLoading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    stats,
    // Preview modals
    previewQuiz,
    previewLesson,
    handleOpenQuizPreview,
    handleCloseQuizPreview,
    handleOpenLessonPreview,
    handleCloseLessonPreview,
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
