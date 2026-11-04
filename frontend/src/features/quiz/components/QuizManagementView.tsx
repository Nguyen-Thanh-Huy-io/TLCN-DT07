'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { Badge } from '@/components/common/Badge';
import { LessonApiService } from '@/services/entities/lesson.service';
import api from '@/services/api';

export interface QuizOverviewItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  topicTitle: string;
  questionCount: number;
  passingScore: number;
  timeLimitMinutes: number;
  hasQuiz: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'EMPTY';
}

export function QuizManagementView() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'EMPTY'>('all');

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setLoading(true);
        const res = await LessonApiService.getLessons({ limit: 100 });
        const lessons = res.items || [];
        const loaded: QuizOverviewItem[] = [];

        for (const lesson of lessons) {
          let hasQuiz = false;
          let questionCount = 0;
          let passingScore = 80;
          let timeLimitMinutes = 15;

          try {
            const quizRes = await api.get(`/lessons/${lesson.id}/quiz`);
            const quiz = quizRes.data?.data || quizRes.data;
            if (quiz) {
              hasQuiz = true;
              questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
              passingScore = quiz.passingScore ?? 80;
              timeLimitMinutes = quiz.timeLimitMinutes ?? 15;
            }
          } catch {
            // Chưa có quiz
          }

          loaded.push({
            id: `quiz-overview-${lesson.id}`,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            topicTitle: (lesson as any).topic?.name || 'Chuyên đề lịch sử',
            questionCount,
            passingScore,
            timeLimitMinutes,
            hasQuiz,
            status: hasQuiz ? 'ACTIVE' : 'EMPTY',
          });
        }

        setQuizzes(loaded);
      } catch (err) {
        console.error('Failed to load lessons for quiz management:', err);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((q) => {
    const matchSearch =
      search === '' ||
      q.lessonTitle.toLowerCase().includes(search.toLowerCase()) ||
      q.topicTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'ACTIVE' && q.hasQuiz) ||
      (filterStatus === 'EMPTY' && !q.hasQuiz);
    return matchSearch && matchStatus;
  });

  const handleEditQuiz = (lessonId: string) => {
    router.push(`/lessons/${lessonId}?tab=quiz`);
  };

  return (
    <div className="space-y-6">
      {/* Top filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên bài học hoặc chủ đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Icon name={IconName.SEARCH} size={15} />
            </span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">Tất cả trạng thái đề</option>
            <option value="ACTIVE">Đã có đề ôn tập</option>
            <option value="EMPTY">Chưa tạo đề</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredQuizzes.length}</strong> bài học
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500 animate-pulse">
            Đang tải danh sách bài học và trạng thái bộ Quiz...
          </p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Icon name={IconName.SPARK} size={32} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Chưa có bài học nào</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Hệ thống quản lý bộ Quiz liên kết trực tiếp với bài học. Hãy tạo bài học tại mục Quản lý bài học trước khi tạo đề ôn tập.
          </p>
        </div>
      ) : (
        /* Table Quiz */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3.5 px-4">Bài học liên kết</th>
                <th className="py-3.5 px-4">Chuyên đề</th>
                <th className="py-3.5 px-4 text-center">Số câu hỏi</th>
                <th className="py-3.5 px-4 text-center">Điểm đạt</th>
                <th className="py-3.5 px-4 text-center">Thời gian</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                    <div className="truncate" title={quiz.lessonTitle}>
                      {quiz.lessonTitle}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {quiz.topicTitle}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {quiz.questionCount > 0 ? (
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {quiz.questionCount} câu
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chưa có</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                    {quiz.questionCount > 0 ? `${quiz.passingScore}%` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                    {quiz.questionCount > 0 ? `${quiz.timeLimitMinutes} phút` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {quiz.hasQuiz ? (
                      <Badge tone="ok">Đang hoạt động</Badge>
                    ) : (
                      <Badge tone="gray">Chưa cấu hình</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleEditQuiz(quiz.lessonId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Icon name={IconName.EDIT} size={13} />
                      <span>{quiz.hasQuiz ? 'Sửa đề Quiz' : 'Tạo đề Quiz'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
