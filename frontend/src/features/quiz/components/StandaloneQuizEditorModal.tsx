'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Award,
  BookOpen,
  FileQuestion,
  HelpCircle,
  CheckCircle2,
  CircleDot,
  ArrowLeftRight,
} from 'lucide-react';
import { StandaloneQuizItem, CreateStandaloneQuizDto } from '@/services/entities/quiz.service';
import { LessonItem } from '@/types/models/lesson.type';
import {
  QuizQuestion,
  QuizQuestionType,
  QUIZ_QUESTION_TYPE_META,
} from '@/features/lessons/types/quiz.types';
import { QuestionBankPickerModal } from './QuestionBankPickerModal';

export interface StandaloneQuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateStandaloneQuizDto) => Promise<void>;
  editingQuiz: StandaloneQuizItem | null;
  lessons: LessonItem[];
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
  lessons,
  loading = false,
}: StandaloneQuizEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonId, setLessonId] = useState<string>('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [passingScorePercent, setPassingScorePercent] = useState<number>(80);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (editingQuiz) {
      setTitle(editingQuiz.title || '');
      setDescription(editingQuiz.description || '');
      setLessonId(editingQuiz.lessonId || '');
      setTimeLimitMinutes(editingQuiz.timeLimitMinutes || 15);
      setPassingScorePercent(editingQuiz.passingScorePercent || 80);
      setQuestions(Array.isArray(editingQuiz.questions) ? editingQuiz.questions : []);
    } else {
      setTitle('');
      setDescription('');
      setLessonId('');
      setTimeLimitMinutes(15);
      setPassingScorePercent(80);
      setQuestions([]);
    }
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
      lessonId: lessonId || undefined,
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
                  placeholder="Ví dụ: Đề kiểm tra 15 phút: Ngô Quyền và Chiến thắng Bạch Đằng 938"
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
                  placeholder="Mô tả phạm vi kiến thức, mức độ đánh giá (Nhận biết, Thông hiểu, Vận dụng)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Config: Lesson reference, Time, Passing score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-slate-400" />
                  Bài học liên kết (Để xem qua)
                </label>
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-red-700 focus:outline-none"
                >
                  <option value="">-- Đề tự do (Không liên kết) --</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
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
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const meta = QUIZ_QUESTION_TYPE_META[q.type];
                    const IconComp = TYPE_ICONS[q.type] || CircleDot;
                    return (
                      <div
                        key={q.id || `q-${idx}`}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                            <IconComp size={10} />
                            {meta?.label || q.type}
                          </span>
                          <span className="text-xs font-medium text-slate-800 truncate">
                            {q.prompt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors shrink-0"
                          title="Xóa câu hỏi khỏi đề"
                        >
                          <Trash2 size={14} />
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : editingQuiz ? 'Lưu thay đổi' : 'Tạo đề Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Question Bank Picker Modal */}
      <QuestionBankPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onPick={handlePickFromBank}
        alreadySelectedIds={questions.map((q) => q.id)}
      />
    </>
  );
}
