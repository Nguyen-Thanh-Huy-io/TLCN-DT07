'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { Badge } from '@/components/common/Badge';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizQuestionType,
} from '@/features/lessons/types/quiz.types';
import {
  QuestionApiService,
  QuestionBankItem,
} from '@/services/entities/question.service';
import { QuestionBankModal } from './QuestionBankModal';

const DIFFICULTY_LABELS: Record<string, { label: string; tone: 'ok' | 'warn' | 'neutral' }> = {
  EASY: { label: 'Dễ', tone: 'ok' },
  MEDIUM: { label: 'Trung bình', tone: 'warn' },
  HARD: { label: 'Khó', tone: 'neutral' },
};

export function QuestionBankView() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [search, setSearch] = useState('');

  // State cho Modal tạo/sửa câu hỏi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await QuestionApiService.getQuestions({ limit: 100 });
      setQuestions(res.items || []);
    } catch (err) {
      console.error('Lỗi tải câu hỏi từ ngân hàng:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
      fetchQuestions();
    } catch (err) {
      console.error('Lỗi khi xóa câu hỏi:', err);
      alert('Không thể xóa câu hỏi. Vui lòng thử lại.');
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchType = selectedType === 'all' || q.type === selectedType;
      const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchSearch =
        search === '' ||
        q.prompt.toLowerCase().includes(search.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(search.toLowerCase())) ||
        (q.lesson?.title && q.lesson.title.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchDiff && matchSearch;
    });
  }, [questions, selectedType, selectedDifficulty, search]);

  return (
    <div className="space-y-6">
      {/* Thanh tiêu đề & nút Thêm câu hỏi */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-red-50 text-red-700 rounded-xl">
              <Icon name={IconName.HELP_CIRCLE} size={20} />
            </span>
            Ngân hàng câu hỏi tập trung
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kho lưu trữ câu hỏi lịch sử trung tâm. Các câu hỏi tại đây được dùng để ghép thành Bộ Quiz hoặc chọn vào Đề ôn tập cuối bài.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="primary-button !h-9 !px-4 !text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Icon name={IconName.PLUS} size={15} />
          <span>Thêm câu hỏi vào ngân hàng</span>
        </button>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi hoặc giải thích..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs w-72 focus:ring-2 focus:ring-red-700 focus:outline-none bg-white"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Icon name={IconName.SEARCH} size={15} />
            </span>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">Tất cả loại câu hỏi</option>
            {Object.values(QuizQuestionType).map((t) => (
              <option key={t} value={t}>
                {QUIZ_QUESTION_TYPE_META[t].label}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong className="text-slate-800">{filteredQuestions.length}</strong> câu hỏi
          </span>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500 animate-pulse">
            Đang tải dữ liệu từ Ngân hàng câu hỏi...
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Icon name={IconName.HELP_CIRCLE} size={32} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            Chưa có câu hỏi nào trong ngân hàng
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto mb-4">
            Hãy bấm nút bên dưới để thêm câu hỏi đầu tiên vào Ngân hàng câu hỏi (Ưu tiên: Trắc nghiệm 1 đáp án).
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="primary-button !h-9 !px-4 !text-xs inline-flex items-center gap-1.5"
          >
            <Icon name={IconName.PLUS} size={14} />
            <span>Tạo câu hỏi mới ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const meta = QUIZ_QUESTION_TYPE_META[q.type] || {
              label: q.type,
              shortLabel: q.type,
              color: 'text-slate-600 bg-slate-50 border-slate-200',
            };

            const optionsList =
              q.data?.options && Array.isArray(q.data.options) ? q.data.options : [];

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    <Badge tone={DIFFICULTY_LABELS[q.difficulty]?.tone || 'gray'}>
                      {DIFFICULTY_LABELS[q.difficulty]?.label || q.difficulty}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">
                      • {q.points} điểm
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(q)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      title="Sửa câu hỏi"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa câu hỏi"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Prompt */}
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {q.prompt}
                </p>

                {/* Options Preview for Single Choice */}
                {optionsList.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {optionsList.map((opt: any, optIdx: number) => (
                      <div
                        key={opt.id || optIdx}
                        className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                          opt.isCorrect
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="truncate">
                          <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt.text}
                        </span>
                        {opt.isCorrect && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold shrink-0 ml-2">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <p className="text-xs text-slate-500 bg-amber-50/50 border border-amber-200/80 rounded-lg p-2.5 leading-relaxed">
                    💡 <strong className="text-amber-900">Giải thích: </strong>
                    {q.explanation}
                  </p>
                )}

                {/* Footer metadata */}
                {q.lesson?.title && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name={IconName.BOOK} size={13} className="text-slate-400" />
                    <span>
                      Liên kết với bài học: <strong>{q.lesson.title}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa câu hỏi */}
      <QuestionBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQuestions}
        initialQuestion={editingQuestion}
      />
    </div>
  );
}
