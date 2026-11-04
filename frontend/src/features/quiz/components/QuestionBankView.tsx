'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  CircleDot,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowLeftRight,
  Filter,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizQuestionType,
} from '@/features/lessons/types/quiz.types';
import {
  QuestionApiService,
  QuestionBankItem,
} from '@/services/entities/question.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models/lesson.type';
import { QuestionBankModal } from './QuestionBankModal';

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; tone: 'ok' | 'warn' | 'neutral' }
> = {
  EASY: { label: 'Dễ', tone: 'ok' },
  MEDIUM: { label: 'Trung bình', tone: 'warn' },
  HARD: { label: 'Khó', tone: 'neutral' },
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  [QuizQuestionType.SINGLE_CHOICE]: CircleDot,
  [QuizQuestionType.MULTIPLE_CHOICE]: CheckCircle2,
  [QuizQuestionType.TRUE_FALSE]: HelpCircle,
  [QuizQuestionType.ORDERING]: Clock,
  [QuizQuestionType.MATCHING]: ArrowLeftRight,
};

export function QuestionBankView() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
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
    fetchQuestions();
    fetchLessons();
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
      const matchType = selectedType === 'all' || q.type === selectedType;
      const matchDiff =
        selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchLesson =
        selectedLessonId === 'all' ||
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

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Tiêu đề & Nút Thêm câu hỏi */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CircleDot size={20} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Ngân hàng câu hỏi tập trung
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kho lưu trữ câu hỏi ôn tập lịch sử. Có thể chọn vào Đề ôn tập cuối bài hoặc ghép thành Bộ Quiz.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="h-10 px-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm câu hỏi mới</span>
        </button>
      </div>

      {/* 2. Ribbon Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-3.5 px-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số câu hỏi
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Layers size={16} />
          </span>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Trắc nghiệm 1 đáp án (Loại 1)
            </p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.singleChoice}</p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CircleDot size={16} />
          </span>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Đã gán vào Bài học
            </p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.linked}</p>
          </div>
          <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen size={16} />
          </span>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Tìm kiếm nội dung, giải thích, bài học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại câu hỏi</option>
            {Object.values(QuizQuestionType).map((t) => (
              <option key={t} value={t}>
                {QUIZ_QUESTION_TYPE_META[t]?.label || t}
              </option>
            ))}
          </select>

          {/* Lesson / Category Filter */}
          <select
            value={selectedLessonId}
            onChange={(e) => {
              setSelectedLessonId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
          >
            <option value="all">Tất cả chuyên đề / bài học</option>
            {lessons.map((ls) => (
              <option key={ls.id} value={ls.id}>
                {ls.title}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-semibold text-blue-900">
              Đã chọn <strong>{selectedIds.length}</strong>
            </span>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-0.5 rounded hover:bg-rose-100/70 transition"
            >
              Xóa đã chọn
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-200 transition"
            >
              Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {/* 4. Table / List View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-500">
              Đang tải danh sách câu hỏi từ cơ sở dữ liệu...
            </p>
          </div>
        ) : paginatedQuestions.length === 0 ? (
          <div className="text-center py-16 p-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <CircleDot size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy câu hỏi phù hợp
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              Chưa có câu hỏi nào thỏa mãn bộ lọc hiện tại. Bạn có thể bấm nút bên dưới để tạo câu hỏi mới.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>Tạo câu hỏi mới</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-2 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Nội dung câu hỏi (Prompt)</th>
                  <th className="py-3.5 px-3 w-40">Dạng câu hỏi</th>
                  <th className="py-3.5 px-3 min-w-[160px]">Chuyên đề / Bài học</th>
                  <th className="py-3.5 px-3 w-28 text-center">Độ khó</th>
                  <th className="py-3.5 px-3 w-20 text-center">Điểm</th>
                  <th className="py-3.5 pl-2 pr-4 w-24 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedQuestions.map((q, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isChecked = selectedIds.includes(q.id);
                  const TypeIcon = TYPE_ICONS[q.type] || CircleDot;
                  const meta = QUIZ_QUESTION_TYPE_META[q.type] || {
                    label: q.type,
                    color: 'text-slate-600 bg-slate-100 border-slate-200',
                  };

                  // Tìm danh sách các đáp án đúng nếu có (Single/Multiple Choice hoặc True/False)
                  const optionsList = Array.isArray(q.data?.options) ? q.data.options : [];
                  const correctOptions = optionsList.filter((opt: any) => opt.isCorrect);
                  const hasTrueFalseAnswer =
                    q.type === QuizQuestionType.TRUE_FALSE &&
                    typeof q.data?.correctAnswer === 'boolean';

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(q.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* STT */}
                      <td className="py-3.5 px-2 text-center text-slate-400 font-medium">
                        {globalIdx}
                      </td>

                      {/* Prompt & Options preview */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p
                            className="font-semibold text-slate-900 leading-snug line-clamp-2"
                            title={q.prompt.replace(/<[^>]+>/g, ' ').trim()}
                          >
                            {q.prompt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                          </p>

                          {/* Quick Answer Preview */}
                          {correctOptions.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="shrink-0">
                                Đáp án đúng{correctOptions.length > 1 ? ` (${correctOptions.length})` : ''}:
                              </span>
                              <strong className="text-emerald-700 truncate max-w-md">
                                {correctOptions.map((o: any) => o.text).join(' • ')}
                              </strong>
                            </div>
                          )}

                          {hasTrueFalseAnswer && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  q.data.correctAnswer ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span className="shrink-0">Đáp án đúng:</span>
                              <strong
                                className={
                                  q.data.correctAnswer ? 'text-emerald-700' : 'text-rose-700'
                                }
                              >
                                {q.data.correctAnswer ? 'Đúng (True)' : 'Sai (False)'}
                              </strong>
                            </div>
                          )}

                          {q.type === QuizQuestionType.ORDERING &&
                            Array.isArray(q.data?.items) &&
                            q.data.items.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span className="shrink-0">
                                  Thứ tự đúng ({q.data.items.length} mốc):
                                </span>
                                <strong className="text-amber-800 truncate max-w-md">
                                  {(Array.isArray(q.data.correctOrder) &&
                                  q.data.correctOrder.length === q.data.items.length
                                    ? q.data.correctOrder.map(
                                        (id: string) =>
                                          q.data.items.find((it: any) => it.id === id)?.label || id
                                      )
                                    : q.data.items.map((it: any) => it.label)
                                  )
                                    .map((lbl: string, i: number) => `${i + 1}. ${lbl}`)
                                    .join(' → ')}
                                </strong>
                              </div>
                            )}

                          {q.type === QuizQuestionType.MATCHING &&
                            Array.isArray(q.data?.leftItems) &&
                            Array.isArray(q.data?.rightItems) &&
                            Array.isArray(q.data?.correctPairs) &&
                            q.data.correctPairs.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                                <span className="shrink-0">
                                  Cặp nối đúng ({q.data.correctPairs.length} cặp):
                                </span>
                                <strong className="text-violet-800 truncate max-w-md">
                                  {q.data.correctPairs
                                    .map((p: any) => {
                                      const l =
                                        q.data.leftItems.find((i: any) => i.id === p.leftId)
                                          ?.label || p.leftId;
                                      const r =
                                        q.data.rightItems.find((i: any) => i.id === p.rightId)
                                          ?.label || p.rightId;
                                      return `${l} ↔ ${r}`;
                                    })
                                    .join(' | ')}
                                </strong>
                              </div>
                            )}

                          {q.explanation && (
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">
                              💡 {q.explanation}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Question Type */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-200 bg-blue-50/60 text-blue-800">
                          <TypeIcon size={12} className="text-blue-600" />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* Lesson / Topic */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {q.topics && q.topics.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {q.topics.slice(0, 2).map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-1.5 text-emerald-900"
                                  title={`Chủ đề: ${t.name}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[190px] font-semibold text-[11px]">
                                    {t.name}
                                  </span>
                                </div>
                              ))}
                              {q.topics.length > 2 && (
                                <span className="text-[10px] font-semibold text-emerald-700 pl-3">
                                  +{q.topics.length - 2} chủ đề khác
                                </span>
                              )}
                            </div>
                          )}

                          {q.lessons && q.lessons.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {q.lessons.slice(0, 2).map((l) => (
                                <div
                                  key={l.id}
                                  className="flex items-center gap-1 text-slate-600"
                                  title={`Bài học: ${l.title}`}
                                >
                                  <BookOpen size={12} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[190px] font-medium text-[11px]">
                                    {l.title}
                                  </span>
                                </div>
                              ))}
                              {q.lessons.length > 2 && (
                                <span className="text-[10px] font-semibold text-blue-700 pl-4">
                                  +{q.lessons.length - 2} bài học khác
                                </span>
                              )}
                            </div>
                          ) : !q.topics || q.topics.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">
                              Chung / Chưa gán
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3.5 px-3 text-center">
                        <Badge tone={DIFFICULTY_CONFIG[q.difficulty]?.tone || 'neutral'}>
                          {DIFFICULTY_CONFIG[q.difficulty]?.label || q.difficulty}
                        </Badge>
                      </td>

                      {/* Points / Mark */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-slate-700">
                          {q.points ?? 1}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">đ</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-2 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(q)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Sửa câu hỏi"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị{' '}
            <strong className="text-slate-800">
              {filteredQuestions.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredQuestions.length)}
            </strong>{' '}
            trong tổng số{' '}
            <strong className="text-slate-800">{filteredQuestions.length}</strong> câu hỏi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Trang trước"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Trang sau"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Modal Tạo / Sửa câu hỏi (Dribbble Design) */}
      <QuestionBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQuestions}
        initialQuestion={editingQuestion}
      />
    </div>
  );
}
