'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { Badge } from '@/components/common/Badge';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizQuestion,
  QuizQuestionType,
} from '@/features/lessons/types/quiz.types';
import {
  QuestionApiService,
  QuestionBankItem,
} from '@/services/entities/question.service';

interface QuestionBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (questions: QuizQuestion[]) => void;
  alreadySelectedIds?: string[];
}

export function QuestionBankPickerModal({
  isOpen,
  onClose,
  onPick,
  alreadySelectedIds = [],
}: QuestionBankPickerModalProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const loadQuestions = useCallback(async () => {
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
    if (!isOpen) return;
    void loadQuestions();
  }, [isOpen, loadQuestions]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchType = selectedType === 'all' || q.type === selectedType;
      const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchSearch =
        search === '' ||
        q.prompt.toLowerCase().includes(search.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchDiff && matchSearch;
    });
  }, [questions, selectedType, selectedDifficulty, search]);

  const handleConfirm = () => {
    const pickedItems = questions.filter((q) => selectedIds.has(q.id));
    const converted: QuizQuestion[] = pickedItems.map((q) => {
      return {
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        explanation: q.explanation || undefined,
        ...(q.data || {}),
      } as QuizQuestion;
    });

    onPick(converted);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Icon name={IconName.BOOK} size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chọn câu hỏi từ Ngân hàng câu hỏi
              </h3>
              <p className="text-xs text-slate-500">
                Chọn các câu hỏi đã có sẵn trong ngân hàng để đưa vào đề ôn tập bài học này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Toolbar filter */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm câu hỏi theo nội dung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-64 focus:ring-1 focus:ring-blue-600 bg-white"
              />
              <span className="absolute left-2.5 top-2 text-slate-400">
                <Icon name={IconName.SEARCH} size={13} />
              </span>
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
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
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Đã chọn: <strong className="text-blue-600 font-bold">{selectedIds.size}</strong> câu hỏi
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Đang tải danh sách câu hỏi trong ngân hàng...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Không tìm thấy câu hỏi phù hợp
              </p>
              <p className="text-xs text-slate-400">
                Hãy tạo thêm câu hỏi tại mục Ngân hàng câu hỏi trên thanh điều hướng trái.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const meta = QUIZ_QUESTION_TYPE_META[q.type] || {
                label: q.type,
                shortLabel: q.type,
                color: 'text-slate-600 bg-slate-50 border-slate-200',
              };
              const isChecked = selectedIds.has(q.id);
              const isAlreadyInQuiz = alreadySelectedIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                    isChecked
                      ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {q.difficulty === 'EASY'
                          ? 'Dễ'
                          : q.difficulty === 'HARD'
                            ? 'Khó'
                            : 'Trung bình'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {q.points} điểm
                      </span>
                      {isAlreadyInQuiz && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Đã có trong đề
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {q.prompt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                    </p>

                    {/* Options preview for single choice */}
                    {q.data?.options && Array.isArray(q.data.options) && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {q.data.options.map((opt: any, idx: number) => (
                          <div
                            key={opt.id || idx}
                            className={`text-[11px] px-2 py-1 rounded border flex items-center justify-between ${
                              opt.isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="truncate">
                              {String.fromCharCode(65 + idx)}. {opt.text}
                            </span>
                            {opt.isCorrect && (
                              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold ml-1 shrink-0">
                                Đúng
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong>{filteredQuestions.length}</strong> câu hỏi có sẵn
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="primary-button !h-9 !px-5 !text-xs disabled:opacity-40"
            >
              Thêm {selectedIds.size > 0 ? `${selectedIds.size} câu hỏi` : ''} vào đề
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
