'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  BookOpen,
  HelpCircle,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  BarChart3,
  Tag,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import {
  ALL_FILTER_VALUE,
  QuizStatusEnum,
} from '@/constants/quiz.constant';
import { useQuizManagementFacade } from '../facades/useQuizManagementFacade';
import { QuizPreviewModal } from './QuizPreviewModal';
import { LessonQuickPreviewModal } from './LessonQuickPreviewModal';
import { StandaloneQuizEditorModal } from './StandaloneQuizEditorModal';
import { QuizStatisticsModal } from './QuizStatisticsModal';

export function QuizManagementView() {
  const [statsQuiz, setStatsQuiz] = React.useState<{ id: string; title: string } | null>(null);
  const {
    quizzes,
    topics,
    selectedTopicId,
    setSelectedTopicId,
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
    // Edit/Create modal
    isEditorOpen,
    editingQuiz,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseEditor,
    handleDeleteQuiz,
    handleSaveQuiz,
  } = useQuizManagementFacade();

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{stats.totalQuizzes}</div>
            <div className="text-xs text-slate-500 font-medium">Tổng số bộ Quiz</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{stats.activeQuizzes}</div>
            <div className="text-xs text-slate-500 font-medium">Đang phát hành</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-700">{stats.draftQuizzes}</div>
            <div className="text-xs text-slate-500 font-medium">Đề nháp (Chưa có câu hỏi)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
            <Database size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-indigo-700">{stats.totalQuestions}</div>
            <div className="text-xs text-slate-500 font-medium">Tổng câu hỏi trong đề</div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar: Search, Filters & Action buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm theo tên đề thi, mã đề hoặc chủ đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search size={16} />
            </span>
          </div>

          {/* Topic filter */}
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-700 max-w-[200px]"
          >
            <option value={ALL_FILTER_VALUE}>Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as QuizStatusEnum | typeof ALL_FILTER_VALUE)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            <option value={ALL_FILTER_VALUE}>Tất cả trạng thái</option>
            <option value={QuizStatusEnum.ACTIVE}>Đang hoạt động</option>
            <option value={QuizStatusEnum.DRAFT}>Bản nháp</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/questions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Database size={14} />
            <span>Ngân hàng câu hỏi</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus size={15} />
            <span>Tạo đề Quiz mới</span>
          </button>
        </div>
      </div>

      {/* 3. DataTable or Empty/Loading States */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium text-slate-600">Đang tải danh sách bộ đề thi & ôn tập Quiz...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-red-50 text-red-700 mb-1">
            <HelpCircle size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy bộ đề Quiz nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hệ thống chưa có bộ đề thi nào khớp với tiêu chí tìm kiếm. Bạn có thể bấm &quot;Tạo đề Quiz mới&quot; để thiết lập bộ đề thi tổng hợp từ Ngân hàng câu hỏi.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Tạo đề Quiz mới ngay</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[240px]">Tên đề Quiz & Mã đề</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Chủ đề bao phủ</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Câu hỏi & Nguồn</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Điều kiện đạt</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px]">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {quizzes.map((quiz) => {
                  const hasQuestions = quiz.questionCount > 0;
                  const quizCode = `QZ-${quiz.id.slice(0, 4).toUpperCase()}`;

                  return (
                    <tr key={quiz.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Cột 1: Tên đề Quiz & Mã đề (Định danh chính) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-red-50 text-red-700 shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 hover:text-red-700 transition-colors line-clamp-1">
                                {quiz.title}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {quizCode}
                              </span>
                            </div>
                            {quiz.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Chủ đề bao phủ */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
                          {quiz.topics && quiz.topics.length > 0 ? (
                            quiz.topics.map((topic) => (
                              <span
                                key={topic.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-100"
                                title={topic.name}
                              >
                                <Tag size={10} className="shrink-0" />
                                <span className="truncate max-w-[120px]">{topic.name}</span>
                              </span>
                            ))
                          ) : quiz.topicTitle ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <Layers size={11} className="shrink-0 text-slate-500" />
                              <span className="truncate max-w-[140px]">{quiz.topicTitle}</span>
                            </span>
                          ) : quiz.lesson ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 max-w-[220px]">
                              <BookOpen size={13} className="text-slate-500 shrink-0" />
                              <span
                                className="text-xs font-medium text-slate-700 truncate cursor-pointer hover:text-red-700"
                                title={quiz.lesson.title}
                                onClick={() => handleOpenLessonPreview(quiz.lesson!)}
                              >
                                {quiz.lesson.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenLessonPreview(quiz.lesson!)}
                                className="text-slate-400 hover:text-red-700 p-0.5 rounded transition-colors shrink-0"
                                title="Xem qua bài học"
                              >
                                <ExternalLink size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Đề tổng hợp tự do</span>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Câu hỏi & Nguồn */}
                      <td className="py-3.5 px-4 text-center">
                        {hasQuestions ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                              {quiz.questionCount} câu
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Ngân hàng đề
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 italic font-medium">Chưa có câu</span>
                        )}
                      </td>

                      {/* Cột 4: Điều kiện đạt */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-xs font-medium text-slate-700">
                          <div>{quiz.passingScorePercent}% điểm</div>
                          <div className="text-[11px] text-slate-400">{quiz.timeLimitMinutes} phút</div>
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {quiz.status === QuizStatusEnum.ACTIVE ? (
                          <Badge tone="ok">Đang hoạt động</Badge>
                        ) : (
                          <Badge tone="warn">Bản nháp</Badge>
                        )}
                      </td>

                      {/* Cột 6: Tác vụ */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem thống kê thí sinh nộp bài */}
                          <button
                            type="button"
                            onClick={() => setStatsQuiz({ id: quiz.id, title: quiz.title })}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem thống kê lượt thi & thí sinh nộp bài"
                          >
                            <BarChart3 size={15} />
                          </button>

                          {/* Nút Xem trước đề */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuizPreview(quiz)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Xem trước đề thi"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Nút Sửa đề */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(quiz)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Chỉnh sửa đề thi"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Nút Xóa đề */}
                          <button
                            type="button"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            disabled={actionLoading}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa đề thi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modals */}
      {/* Modal Xem trước đề thi */}
      <QuizPreviewModal
        isOpen={Boolean(previewQuiz)}
        onClose={handleCloseQuizPreview}
        quiz={previewQuiz}
      />

      {/* Modal Xem qua bài học tham chiếu */}
      <LessonQuickPreviewModal
        isOpen={Boolean(previewLesson)}
        onClose={handleCloseLessonPreview}
        lesson={previewLesson}
      />

      {/* Modal Tạo/Sửa đề Quiz độc lập */}
      <StandaloneQuizEditorModal
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveQuiz}
        editingQuiz={editingQuiz}
        topics={topics}
        loading={actionLoading}
      />

      {/* Modal Thống kê Thí sinh nộp bài cho Editor */}
      <QuizStatisticsModal
        quizId={statsQuiz?.id || null}
        quizTitle={statsQuiz?.title}
        isOpen={Boolean(statsQuiz)}
        onClose={() => setStatsQuiz(null)}
      />
    </div>
  );
}
