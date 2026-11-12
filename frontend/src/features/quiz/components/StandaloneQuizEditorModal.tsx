'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Award,
  Folder,
  FileQuestion,
  HelpCircle,
  CheckCircle2,
  CircleDot,
  ArrowLeftRight,
} from 'lucide-react';
import { StandaloneQuizItem, CreateStandaloneQuizDto } from '@/services/entities/quiz.service';
import { TopicItem } from '@/types/models/topic.type';
import { TopicApiService } from '@/services/entities/topic.service';
import {
  QuizQuestion,
  QuizQuestionType,
  QUIZ_QUESTION_TYPE_META,
} from '@/features/lessons/types/quiz.types';
import { QuestionBankPickerModal } from './QuestionBankPickerModal';
import { TopicCategoryModalPicker } from './CategoryTreePicker';
import { TreeSelectTrigger } from '@/components/common/TreeSelectModal';

export interface StandaloneQuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateStandaloneQuizDto) => Promise<void>;
  editingQuiz: StandaloneQuizItem | null;
  topics?: TopicItem[];
  loading?: boolean;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  [QuizQuestionType.SINGLE_CHOICE]: CircleDot,
  [QuizQuestionType.MULTIPLE_CHOICE]: CheckCircle2,
  [QuizQuestionType.TRUE_FALSE]: HelpCircle,
  [QuizQuestionType.ORDERING]: Clock,
  [QuizQuestionType.MATCHING]: ArrowLeftRight,
};

export function StandaloneQuizEditorModal({
  isOpen,
  onClose,
  onSave,
  editingQuiz,
  topics: initialTopics = [],
  loading = false,
}: StandaloneQuizEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [fetchedTopics, setFetchedTopics] = useState<TopicItem[]>([]);
  const topicsList = initialTopics.length > 0 ? initialTopics : fetchedTopics;
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [passingScorePercent, setPassingScorePercent] = useState<number>(80);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Load danh sách chủ đề nếu chưa có
  useEffect(() => {
    if (!isOpen || initialTopics.length > 0) return;
    let isMounted = true;
    TopicApiService.getTopics({ limit: 100 })
      .then((res) => {
        if (isMounted && res?.items) setFetchedTopics(res.items);
      })
      .catch((err) => {
        console.warn('Không thể tải danh sách chủ đề:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialTopics.length]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = Promise.resolve().then(() => {
      if (editingQuiz) {
        setTitle(editingQuiz.title || '');
        setDescription(editingQuiz.description || '');
        setTopicIds(
          editingQuiz.topics?.map((t) => t.id) || editingQuiz.topicIds || []
        );
        setTimeLimitMinutes(editingQuiz.timeLimitMinutes || 15);
        setPassingScorePercent(editingQuiz.passingScorePercent || 80);
        setQuestions(Array.isArray(editingQuiz.questions) ? editingQuiz.questions : []);
      } else {
        setTitle('');
        setDescription('');
        setTopicIds([]);
        setTimeLimitMinutes(15);
        setPassingScorePercent(80);
        setQuestions([]);
      }
    });

    return () => {
      void timer;
    };
  }, [editingQuiz, isOpen]);

  if (!isOpen) return null;

  const handlePickFromBank = (newQuestions: QuizQuestion[]) => {
    setQuestions((prev) => [...prev, ...newQuestions]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề cho đề thi!');
      return;
    }

    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      topicIds,
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      passingScorePercent: Number(passingScorePercent) || 80,
      questions,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                {editingQuiz ? 'Chỉnh sửa bộ đề' : 'Tạo mới bộ đề Quiz'}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {editingQuiz ? editingQuiz.title : 'Thiết lập thông số & Cấu trúc đề thi'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Tiêu đề đề thi / Quiz <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề khảo thí giai đoạn Nhà Lý - Trần hoặc Đề kiểm tra 15 phút: Bạch Đằng 938"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Mô tả mục tiêu đánh giá (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phạm vi kiến thức, mức độ đánh giá (Nhận biết, Thông hiểu, Vận dụng cao)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Config: Topics assignment, Time, Passing score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Cột 1: Chọn một hoặc nhiều Chủ đề lịch sử */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Folder size={13} className="text-slate-400" />
                  Chủ đề liên kết (Topics)
                </label>
                <TreeSelectTrigger
                  onClick={() => setIsTopicModalOpen(true)}
                  placeholder="Chọn chủ đề bao phủ..."
                  icon={<Folder size={13} className="text-slate-400 group-hover:text-emerald-600" />}
                  badgeColor="emerald"
                  selectedItems={topicIds.map((id) => ({
                    id,
                    label: topicsList.find((t) => t.id === id)?.name || 'Chủ đề đã chọn',
                  }))}
                  onRemoveItem={(id) => setTopicIds((prev) => prev.filter((item) => item !== id))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  Thời gian làm bài (Phút)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Award size={13} className="text-amber-500" />
                  Điểm đạt chuẩn (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScorePercent}
                  onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Danh sách câu hỏi trong đề ({questions.length} câu)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Câu hỏi được tổng hợp trực tiếp từ Ngân hàng câu hỏi tập trung.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Plus size={14} />
                  <span>Chọn từ Ngân hàng câu hỏi</span>
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FileQuestion size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Chưa có câu hỏi nào trong đề</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hãy bấm &quot;Chọn từ Ngân hàng câu hỏi&quot; ở trên để nhặt câu hỏi vào đề.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {questions.map((q, idx) => {
                    const TypeIcon = TYPE_ICONS[q.type] || CircleDot;
                    const meta = QUIZ_QUESTION_TYPE_META[q.type];

                    return (
                      <div
                        key={q.id || idx}
                        className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${meta?.color || 'text-slate-600 bg-slate-100'}`}
                            >
                              <TypeIcon size={11} />
                              <span>{meta?.label || q.type}</span>
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              Mã: {q.id ? q.id.slice(0, 8) : 'Tự tạo'}
                            </span>
                          </div>

                          <div
                            className="text-xs font-medium text-slate-800 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: q.prompt }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Xóa câu hỏi khỏi đề"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {loading ? 'Đang lưu đề thi...' : editingQuiz ? 'Cập nhật đề thi' : 'Lưu & Phát hành đề thi'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal chọn nhiều Chủ đề */}
      <TopicCategoryModalPicker
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        topics={topicsList}
        selectedTopicIds={topicIds}
        onChangeSelected={setTopicIds}
      />

      {/* Picker Modal nhặt câu hỏi */}
      <QuestionBankPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onPick={handlePickFromBank}
        alreadySelectedIds={questions.map((q) => q.id)}
      />
    </>
  );
}
