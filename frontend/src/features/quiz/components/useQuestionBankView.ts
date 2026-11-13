'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QuizQuestionType } from '@/features/lessons/types/quiz.types';
import { QuestionApiService, QuestionBankItem } from '@/services/entities/question.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models';
import { ALL_FILTER_VALUE } from '@/constants/enums';

export function useQuestionBankView() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>(ALL_FILTER_VALUE);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(ALL_FILTER_VALUE);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(ALL_FILTER_VALUE);
  const [search, setSearch] = useState('');
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await QuestionApiService.getQuestions({ limit: 200 });
      setQuestions(res.items || []);
    } catch (err) {
      console.error('Lỗi tải câu hỏi từ ngân hàng:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchLessons = useCallback(async () => {
    try {
      const res = await LessonApiService.getLessons({ limit: 100 });
      setLessons(res.items || []);
    } catch (err) {
      console.warn('Lỗi tải danh mục bài học:', err);
    }
  }, []);
  useEffect(() => {
    let isMounted = true;
    const timer = Promise.resolve().then(() => {
      if (isMounted) {
        void fetchQuestions();
        void fetchLessons();
      }
    });

    return () => {
      isMounted = false;
      void timer;
    };
  }, [fetchQuestions, fetchLessons]);
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (q: QuestionBankItem) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng câu hỏi?')) {
      return;
    }
    try {
      await QuestionApiService.deleteQuestion(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchQuestions();
    } catch (err) {
      console.error('Lỗi khi xóa câu hỏi:', err);
      alert('Không thể xóa câu hỏi. Vui lòng thử lại.');
    }
  };
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa ${selectedIds.length} câu hỏi đã chọn khỏi Ngân hàng câu hỏi?`
      )
    ) {
      return;
    }
    try {
      await Promise.all(selectedIds.map((id) => QuestionApiService.deleteQuestion(id)));
      setSelectedIds([]);
      fetchQuestions();
    } catch (err) {
      console.error('Lỗi khi xóa hàng loạt:', err);
      alert('Đã xảy ra lỗi khi xóa một số câu hỏi.');
    }
  };
  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchType = selectedType === ALL_FILTER_VALUE || q.type === selectedType;
      const matchDiff =
        selectedDifficulty === ALL_FILTER_VALUE || q.difficulty === selectedDifficulty;
      const matchLesson =
        selectedLessonId === ALL_FILTER_VALUE ||
        (q.lessons && q.lessons.some((l) => l.id === selectedLessonId));
      const cleanPrompt = (q.prompt || '').replace(/<[^>]+>/g, ' ').toLowerCase();
      const matchSearch =
        search === '' ||
        cleanPrompt.includes(search.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(search.toLowerCase())) ||
        (q.topics && q.topics.some((t) => t.name.toLowerCase().includes(search.toLowerCase()))) ||
        (q.lessons && q.lessons.some((l) => l.title.toLowerCase().includes(search.toLowerCase())));
      return matchType && matchDiff && matchLesson && matchSearch;
    });
  }, [questions, selectedType, selectedDifficulty, selectedLessonId, search]);
  // Paginated items
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage, itemsPerPage]);
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedQuestions.map((q) => q.id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const isAllSelected =
    paginatedQuestions.length > 0 &&
    paginatedQuestions.every((q) => selectedIds.includes(q.id));
  // Thống kê nhanh
  const stats = useMemo(() => {
    const singleChoiceCount = questions.filter(
      (q) => q.type === QuizQuestionType.SINGLE_CHOICE
    ).length;
    const linkedLessonCount = questions.filter(
      (q) => (q.lessons && q.lessons.length > 0) || (q.topics && q.topics.length > 0)
    ).length;
    return {
      total: questions.length,
      singleChoice: singleChoiceCount,
      linked: linkedLessonCount,
    };
  }, [questions]);

  return {
    lessons,
    loading,
    selectedType,
    setSelectedType,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedLessonId,
    setSelectedLessonId,
    search,
    setSearch,
    selectedIds,
    setSelectedIds,
    isModalOpen,
    setIsModalOpen,
    editingQuestion,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    fetchQuestions,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleDeleteQuestion,
    handleBulkDelete,
    filteredQuestions,
    totalPages,
    paginatedQuestions,
    handleSelectAll,
    handleToggleSelectOne,
    isAllSelected,
    stats,
  };
}

export type QuestionBankViewFacade = ReturnType<typeof useQuestionBankView>;
