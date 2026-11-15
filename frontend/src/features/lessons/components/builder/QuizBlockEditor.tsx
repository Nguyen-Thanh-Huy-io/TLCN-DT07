'use client';

import React, { useState } from 'react';
import { Database, HelpCircle } from 'lucide-react';
import { QuestionBankPickerModal } from '@/features/quiz/components/QuestionBankPickerModal';
import { AddQuestionMenu, MoveDirection, QuizQuestionCard } from '../quiz/QuizQuestionEditors';
import { createDefaultQuestion } from '../../factories/quiz-question.factory';
import type { LessonQuizQuestion, QuizBlockData } from '../../types/block-builder.types';
import type { QuizQuestion, QuizQuestionType } from '../../types/quiz.types';
import {
  LESSON_QUIZ_DEFAULT_TITLE,
  LESSON_QUIZ_MAX_QUESTIONS,
  copyBankQuestion,
  quizBlockQuestions,
} from '../../utils/lesson-quiz.util';

interface QuizBlockEditorProps {
  data: QuizBlockData;
  onChange: (updates: Partial<QuizBlockData>) => void;
  /** Chủ đề của bài học — để hộp "Lấy từ Ngân hàng" lọc sẵn câu cùng chủ đề. */
  topicId?: string;
}

/** Soạn khối Ôn tập: tối đa vài câu, soạn tại chỗ hoặc chép từ Ngân hàng; người học tự kiểm tra, không chấm. */
export function QuizBlockEditor({ data, onChange, topicId }: QuizBlockEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const questions = quizBlockQuestions(data);
  const remaining = LESSON_QUIZ_MAX_QUESTIONS - questions.length;

  // Ghi luôn dạng mới và bỏ các trường dạng cũ (1 câu) để khối chỉ còn một nguồn dữ liệu.
  const saveQuestions = (next: LessonQuizQuestion[]) =>
    onChange({ questions: next, question: undefined, options: undefined, explanation: undefined });

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) =>
    saveQuestions(questions.map((q, i) => (i === index ? ({ ...q, ...updates } as LessonQuizQuestion) : q)));

  const moveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    const target = direction === MoveDirection.UP ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    saveQuestions(next);
  };

  const addQuestion = (type: QuizQuestionType) => {
    if (remaining <= 0) return;
    saveQuestions([...questions, createDefaultQuestion(type)]);
  };

  const pickFromBank = (picked: QuizQuestion[]) => {
    const taken = picked.slice(0, Math.max(remaining, 0));
    saveQuestions([...questions, ...taken.map(copyBankQuestion)]);
    setNotice(
      taken.length < picked.length
        ? `Chỉ thêm ${taken.length}/${picked.length} câu — mỗi khối Ôn tập tối đa ${LESSON_QUIZ_MAX_QUESTIONS} câu.`
        : null,
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <HelpCircle size={16} className="shrink-0 text-amber-700" />
        <input
          value={data.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={LESSON_QUIZ_DEFAULT_TITLE}
          className="flex-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-amber-400"
        />
        <span className="shrink-0 text-xs text-slate-500">
          {questions.length}/{LESSON_QUIZ_MAX_QUESTIONS} câu
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Người học tự làm và bấm &quot;Kiểm tra&quot; để xem đúng/sai và giải thích — không chấm điểm, không lưu kết quả.
      </p>

      {questions.length === 0 && (
        <p className="rounded-lg border border-dashed border-amber-300 bg-white p-4 text-center text-xs text-slate-500">
          Khối chưa có câu hỏi nào.
        </p>
      )}
      {questions.map((question, index) => (
        <QuizQuestionCard
          key={question.id}
          index={index}
          total={questions.length}
          question={question}
          onChange={(updates) => updateQuestion(index, updates)}
          onRemove={() => saveQuestions(questions.filter((_, i) => i !== index))}
          onMove={(direction) => moveQuestion(index, direction)}
        />
      ))}

      {notice && <p className="text-xs font-medium text-amber-800">{notice}</p>}

      {remaining > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <AddQuestionMenu onPick={addQuestion} />
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Database size={13} /> Lấy từ Ngân hàng
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Đã đủ {LESSON_QUIZ_MAX_QUESTIONS} câu. Cần nhiều câu hơn thì thêm khối Ôn tập khác hoặc tạo Đề thi theo chủ đề.
        </p>
      )}

      <QuestionBankPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onPick={pickFromBank}
        alreadySelectedIds={questions.flatMap((q) => (q.sourceQuestionId ? [q.sourceQuestionId] : []))}
        topicId={topicId}
      />
    </div>
  );
}
