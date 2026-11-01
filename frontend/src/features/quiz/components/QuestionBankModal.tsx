'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizQuestionType,
} from '@/features/lessons/types/quiz.types';
import { generateQuizId } from '@/features/lessons/factories/quiz-question.factory';
import {
  CreateQuestionPayload,
  QuestionApiService,
  QuestionBankItem,
} from '@/services/entities/question.service';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialQuestion?: QuestionBankItem | null;
}

const inputCls =
  'w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 bg-white';
const smallInputCls =
  'flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 bg-white';

export function QuestionBankModal({
  isOpen,
  onClose,
  onSuccess,
  initialQuestion,
}: QuestionBankModalProps) {
  const [type, setType] = useState<QuizQuestionType>(QuizQuestionType.SINGLE_CHOICE);
  const [prompt, setPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [points, setPoints] = useState<number>(10);
  const [options, setOptions] = useState<Array<{ id: string; text: string; isCorrect: boolean }>>([
    { id: generateQuizId('opt'), text: '', isCorrect: true },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialQuestion) {
      setType(initialQuestion.type);
      setPrompt(initialQuestion.prompt || '');
      setExplanation(initialQuestion.explanation || '');
      setDifficulty(initialQuestion.difficulty || 'MEDIUM');
      setPoints(initialQuestion.points || 10);
      if (initialQuestion.data?.options && Array.isArray(initialQuestion.data.options)) {
        setOptions(initialQuestion.data.options);
      }
    } else {
      setType(QuizQuestionType.SINGLE_CHOICE);
      setPrompt('');
      setExplanation('');
      setDifficulty('MEDIUM');
      setPoints(10);
      setOptions([
        { id: generateQuizId('opt'), text: '', isCorrect: true },
        { id: generateQuizId('opt'), text: '', isCorrect: false },
      ]);
    }
    setErrorMsg('');
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const handleSetSingleCorrect = (optId: string) => {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === optId })));
  };

  const handleUpdateOptionText = (optId: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, text } : o)));
  };

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: generateQuizId('opt'), text: '', isCorrect: false },
    ]);
  };

  const handleRemoveOption = (optId: string) => {
    if (options.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn.');
      return;
    }
    const next = options.filter((o) => o.id !== optId);
    if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!prompt.trim()) {
      setErrorMsg('Vui lòng nhập câu hỏi / câu dẫn.');
      return;
    }

    if (type === QuizQuestionType.SINGLE_CHOICE) {
      if (options.length < 2) {
        setErrorMsg('Cần ít nhất 2 phương án lựa chọn.');
        return;
      }
      if (options.some((o) => !o.text.trim())) {
        setErrorMsg('Vui lòng nhập đầy đủ nội dung cho các lựa chọn.');
        return;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        setErrorMsg('Vui lòng chọn duy nhất 1 đáp án đúng bằng nút Radio.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: CreateQuestionPayload = {
        type,
        prompt: prompt.trim(),
        explanation: explanation.trim() || undefined,
        difficulty,
        points: Number(points) || 10,
        data: {
          options,
        },
      };

      if (initialQuestion?.id) {
        await QuestionApiService.updateQuestion(initialQuestion.id, payload);
      } else {
        await QuestionApiService.createQuestion(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi lưu câu hỏi:', err);
      setErrorMsg(
        err?.response?.data?.message ||
          'Không thể lưu câu hỏi. Vui lòng kiểm tra lại dữ liệu.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-50 text-red-700">
              <Icon name={IconName.HELP_CIRCLE} size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {initialQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi vào Ngân hàng'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Câu hỏi sẽ được lưu tập trung và có thể chọn vào bất kỳ bài học hoặc bộ Quiz nào.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Dạng câu hỏi & Độ khó & Điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại câu hỏi <span className="text-rose-600">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuizQuestionType)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
              >
                <option value={QuizQuestionType.SINGLE_CHOICE}>
                  {QUIZ_QUESTION_TYPE_META[QuizQuestionType.SINGLE_CHOICE].label}
                </option>
                <option value={QuizQuestionType.TRUE_FALSE}>
                  {QUIZ_QUESTION_TYPE_META[QuizQuestionType.TRUE_FALSE].label}
                </option>
                <option value={QuizQuestionType.MULTIPLE_CHOICE}>
                  {QUIZ_QUESTION_TYPE_META[QuizQuestionType.MULTIPLE_CHOICE].label}
                </option>
                <option value={QuizQuestionType.ORDERING}>
                  {QUIZ_QUESTION_TYPE_META[QuizQuestionType.ORDERING].label}
                </option>
                <option value={QuizQuestionType.MATCHING}>
                  {QUIZ_QUESTION_TYPE_META[QuizQuestionType.MATCHING].label}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Độ khó
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
              >
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Điểm số
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
              />
            </div>
          </div>

          {/* Câu hỏi / Câu dẫn */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung câu hỏi <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Chiến thắng Điện Biên Phủ trên không diễn ra vào năm nào?"
              className={`${inputCls} resize-none font-medium`}
            />
          </div>

          {/* Soạn thảo đáp án cho Single Choice */}
          {type === QuizQuestionType.SINGLE_CHOICE && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Các phương án lựa chọn (Click chọn 1 đáp án đúng):
                </label>
                <span className="text-[11px] text-slate-400">
                  Chọn radio button bên trái để đặt làm đáp án đúng
                </span>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      opt.isCorrect
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <label
                      className="flex items-center gap-1.5 cursor-pointer shrink-0 pl-1"
                      title="Đánh dấu là đáp án đúng duy nhất"
                    >
                      <input
                        type="radio"
                        name="correct_option_radio"
                        checked={opt.isCorrect}
                        onChange={() => handleSetSingleCorrect(opt.id)}
                        className="w-4 h-4 text-emerald-600 shrink-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-600 w-4">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                    </label>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleUpdateOptionText(opt.id, e.target.value)}
                      placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + idx)}...`}
                      className={smallInputCls}
                    />

                    {opt.isCorrect && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded shrink-0">
                        Đáp án đúng
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1 text-xs"
                      title="Xóa lựa chọn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-2 w-full cursor-pointer transition flex items-center justify-center gap-1"
              >
                <span>+ Thêm lựa chọn</span>
              </button>
            </div>
          )}

          {/* Lời giải thích */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giải thích đáp án (Tùy chọn, hiển thị sau khi học sinh trả lời):
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải thích tại sao đáp án này là đúng..."
              className={`${inputCls} resize-none text-slate-600`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="primary-button !h-9 !px-5 !text-xs"
          >
            {submitting ? 'Đang lưu...' : initialQuestion ? 'Cập nhật câu hỏi' : 'Lưu vào Ngân hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
