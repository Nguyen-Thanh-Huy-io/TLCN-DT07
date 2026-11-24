'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Database, Plus, X, RotateCw, Search } from 'lucide-react';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizQuestion,
  QuizQuestionType,
} from '@/features/lessons/types/editor.types';
import {
  QuestionApiService,
  QuestionBankItem,
} from '@/services/entities/quiz.service';
import {
  ALL_FILTER_VALUE,
  QuestionDifficultyEnum,
} from '@/constants/enums';
import { QuestionBankModal } from './QuestionBankModal';
import { QuestionTopicMode } from '../utils/practice-quiz.helper';

interface QuestionOptionPreview {
  id?: string;
  text?: string;
  isCorrect?: boolean;
}

interface QuestionBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (questions: QuizQuestion[], pickedItems?: QuestionBankItem[]) => void;
  alreadySelectedIds?: string[];
  /** Chủ đề đang soạn — mặc định chỉ hiện câu thuộc chủ đề này, có thể bỏ lọc. */
  topicId?: string;
  /** Chủ đề gắn sẵn cho câu tạo mới ngay trong hộp này. */
  newQuestionTopicIds?: string[];
}

export function QuestionBankPickerModal({
  isOpen,
  onClose,
  onPick,
  alreadySelectedIds = [],
  topicId,
  newQuestionTopicIds,
}: QuestionBankPickerModalProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createTopicIds = useMemo(
    () => newQuestionTopicIds ?? (topicId ? [topicId] : []),
    [newQuestionTopicIds, topicId],
  );
  const [onlyTopic, setOnlyTopic] = useState(true);
  const topicFilter = topicId && onlyTopic ? topicId : undefined;
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(ALL_FILTER_VALUE);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(ALL_FILTER_VALUE);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      QuestionApiService.getQuestions({ limit: 100, topicId: topicFilter })
        .then((res) => {
          if (!isCancelled) {
            setQuestions(res?.items || []);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error('Lỗi tải câu hỏi từ ngân hàng:', err);
            setQuestions([]);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, topicFilter]);

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
      const matchType = selectedType === ALL_FILTER_VALUE || q.type === selectedType;
      const matchDiff = selectedDifficulty === ALL_FILTER_VALUE || q.difficulty === selectedDifficulty;
      const matchSearch =
        search === '' ||
        q.prompt.toLowerCase().includes(search.toLowerCase()) ||
        Boolean(q.explanation && q.explanation.toLowerCase().includes(search.toLowerCase()));
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

    onPick(converted, pickedItems);
    onClose();
  };

  const handleCreated = (saved: QuestionBankItem) => {
    setQuestions((prev) => [saved, ...prev.filter((q) => q.id !== saved.id)]);
    setSelectedIds((prev) => new Set(prev).add(saved.id));
  };

  const handleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    filteredQuestions.forEach((q) => next.add(q.id));
    setSelectedIds(next);
  };

  const handleDeselectAllVisible = () => {
    const next = new Set(selectedIds);
    filteredQuestions.forEach((q) => next.delete(q.id));
    setSelectedIds(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database size={18} className="text-red-700" />
              Chọn câu hỏi từ Ngân hàng đề
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tích chọn câu có sẵn, hoặc tạo câu mới — câu mới được lưu vào Ngân hàng và chọn sẵn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus size={14} /> Tạo câu hỏi mới
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nội dung câu hỏi..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value={ALL_FILTER_VALUE}>Tất cả loại câu hỏi</option>
              <option value={QuizQuestionType.SINGLE_CHOICE}>Trắc nghiệm đơn</option>
              <option value={QuizQuestionType.MULTIPLE_CHOICE}>Nhiều đáp án</option>
              <option value={QuizQuestionType.TRUE_FALSE}>Đúng / Sai</option>
              <option value={QuizQuestionType.ORDERING}>Sắp xếp thứ tự</option>
              <option value={QuizQuestionType.MATCHING}>Nối cặp tương ứng</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value={ALL_FILTER_VALUE}>Tất cả độ khó</option>
              <option value={QuestionDifficultyEnum.EASY}>Dễ</option>
              <option value={QuestionDifficultyEnum.MEDIUM}>Trung bình</option>
              <option value={QuestionDifficultyEnum.HARD}>Khó</option>
            </select>

            {topicId && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={onlyTopic} onChange={(e) => setOnlyTopic(e.target.checked)} />
                Chỉ câu thuộc chủ đề của bài
              </label>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-medium">
              Đã chọn: <strong className="text-red-700">{selectedIds.size}</strong> câu hỏi
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                Chọn tất cả đang hiển thị ({filteredQuestions.length})
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[500px]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RotateCw size={24} className="animate-spin mx-auto mb-2 text-red-700" />
              Đang tải danh sách câu hỏi từ ngân hàng...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const meta = QUIZ_QUESTION_TYPE_META[q.type as QuizQuestionType] || {
                label: q.type,
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
                        {q.difficulty === QuestionDifficultyEnum.EASY
                          ? 'Dễ'
                          : q.difficulty === QuestionDifficultyEnum.HARD
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
                      {q.topics &&
                        q.topics.slice(0, 2).map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded truncate max-w-[140px]"
                          >
                            {t.name}
                          </span>
                        ))}
                    </div>

                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {q.prompt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                    </p>

                    {/* Options preview for single choice */}
                    {q.data?.options && Array.isArray(q.data.options) && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {q.data.options.map((opt: QuestionOptionPreview, idx: number) => (
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

      <QuestionBankModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreated}
        defaultTopicIds={createTopicIds}
        topicMode={QuestionTopicMode.INHERITED}
      />
    </div>
  );
}
