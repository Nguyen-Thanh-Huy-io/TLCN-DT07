'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuizApiService } from '@/services/entities/quiz.service';
import { QuizQuestion, QuizQuestionType } from '../types/quiz.types';
import { createDefaultQuestion } from '../factories/quiz-question.factory';
import { MoveDirection } from '../components/quiz/QuizQuestionEditors';

export enum QuizSaveState {
  IDLE = 'IDLE',
  SAVING = 'SAVING',
  SAVED = 'SAVED',
  ERROR = 'ERROR',
}

export interface UseQuizEditorReturn {
  loading: boolean;
  saving: QuizSaveState;
  title: string;
  setTitle: (v: string) => void;
  passingScorePercent: number | '';
  setPassingScorePercent: (v: number | '') => void;
  questions: QuizQuestion[];
  hasQuiz: boolean;
  addQuestion: (type: QuizQuestionType) => void;
  updateQuestion: (id: string, updates: Partial<QuizQuestion>) => void;
  removeQuestion: (id: string) => void;
  moveQuestion: (id: string, direction: MoveDirection | 'UP' | 'DOWN') => void;
  save: () => Promise<void>;
  deleteQuiz: () => Promise<void>;
}

/**
 * Quản lý state soạn Đề ôn tập cuối bài cho 1 lessonId cụ thể. Tải đề có sẵn khi mount
 * (nếu đã có), và lưu qua API riêng (`PUT /lessons/:id/quiz`) — KHÔNG gộp vào `content`
 * của bài học, vì Quiz là thuộc tính cấp bài học (hướng B đã chốt), không phải khối nội
 * dung trong Block Builder.
 */
export function useQuizEditor(lessonId: string | null | undefined): UseQuizEditorReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<QuizSaveState>(QuizSaveState.IDLE);
  const [title, setTitle] = useState('');
  const [passingScorePercent, setPassingScorePercent] = useState<number | ''>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [hasQuiz, setHasQuiz] = useState(false);

  useEffect(() => {
    if (!lessonId) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    QuizApiService.getQuiz(lessonId)
      .then((quiz) => {
        if (!isMounted) return;
        if (quiz) {
          setTitle(quiz.title || '');
          setPassingScorePercent(quiz.passingScorePercent ?? '');
          setQuestions(quiz.questions || []);
          setHasQuiz(true);
        } else {
          setHasQuiz(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải đề ôn tập:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const addQuestion = useCallback((type: QuizQuestionType) => {
    setQuestions((prev) => [...prev, createDefaultQuestion(type)]);
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? ({ ...q, ...updates } as QuizQuestion) : q)),
    );
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const moveQuestion = useCallback((id: string, direction: MoveDirection | 'UP' | 'DOWN') => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === MoveDirection.UP ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
  }, []);

  const save = useCallback(async () => {
    if (!lessonId) {
      alert('Vui lòng lưu bài học trước khi thêm đề ôn tập.');
      return;
    }
    if (questions.length === 0) {
      alert('Đề ôn tập cần có ít nhất 1 câu hỏi.');
      return;
    }
    try {
      setSaving(QuizSaveState.SAVING);
      await QuizApiService.upsertQuiz(lessonId, {
        title: title.trim() || undefined,
        passingScorePercent: typeof passingScorePercent === 'number' ? passingScorePercent : undefined,
        questions,
      });
      setHasQuiz(true);
      setSaving(QuizSaveState.SAVED);
    } catch (err: any) {
      console.error('Lỗi lưu đề ôn tập:', err);
      alert(err?.response?.data?.message || 'Không thể lưu đề ôn tập. Vui lòng kiểm tra lại các câu hỏi.');
      setSaving(QuizSaveState.ERROR);
    }
  }, [lessonId, title, passingScorePercent, questions]);

  const deleteQuiz = useCallback(async () => {
    if (!lessonId || !hasQuiz) return;
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ đề ôn tập của bài học này?')) return;
    try {
      await QuizApiService.deleteQuiz(lessonId);
      setQuestions([]);
      setTitle('');
      setPassingScorePercent('');
      setHasQuiz(false);
      setSaving(QuizSaveState.IDLE);
    } catch (err) {
      console.error('Lỗi xóa đề ôn tập:', err);
      alert('Không thể xóa đề ôn tập.');
    }
  }, [lessonId, hasQuiz]);

  return {
    loading,
    saving,
    title,
    setTitle,
    passingScorePercent,
    setPassingScorePercent,
    questions,
    hasQuiz,
    addQuestion,
    updateQuestion,
    removeQuestion,
    moveQuestion,
    save,
    deleteQuiz,
  };
}
