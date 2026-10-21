'use client';

import React from 'react';
import { Badge } from '@/components/common/Badge';
import { UseQuizEditorReturn } from '../facades/useQuizEditor';
import { QuizQuestionCard } from './quiz/QuizQuestionCard';
import { AddQuestionMenu } from './quiz/AddQuestionMenu';

interface LessonQuizPanelProps {
  lessonId: string | null;
  quiz: UseQuizEditorReturn;
}

/** Tab "Đề ôn tập" trong Panel Thuộc tính của LessonEditor — soạn 1 đề gồm nhiều câu
 * hỏi (5 dạng), luôn gắn với bài học hiện tại, lưu qua API riêng (không gộp content).
 * Nhận `quiz` từ LessonEditor (dùng chung 1 instance với phần hiển thị ở tab Xem trước)
 * thay vì tự gọi `useQuizEditor` riêng — tránh gọi API tải đề 2 lần không cần thiết. */
export function LessonQuizPanel({ lessonId, quiz }: LessonQuizPanelProps) {
  if (!lessonId) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <p className="text-xs text-slate-500 italic">
          Hãy lưu bài học (bấm &quot;Lưu bản nháp&quot; hoặc &quot;Gửi duyệt&quot;) trước khi thêm đề ôn tập —
          đề ôn tập cần gắn vào 1 bài học đã có trong hệ thống.
        </p>
      </div>
    );
  }

  if (quiz.loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <p className="text-xs text-slate-400">Đang tải đề ôn tập...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3" data-testid="lesson-quiz-panel">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Đề ôn tập cuối bài</span>
        <Badge tone={quiz.hasQuiz ? 'emerald' : 'gray'}>
          {quiz.hasQuiz ? `${quiz.questions.length} câu hỏi` : 'Chưa có đề'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tiêu đề đề</label>
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => quiz.setTitle(e.target.value)}
            placeholder="Câu hỏi ôn tập"
            className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">% đạt tối thiểu</label>
          <input
            type="number"
            min={0}
            max={100}
            value={quiz.passingScorePercent}
            onChange={(e) => quiz.setPassingScorePercent(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Tùy chọn"
            className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {quiz.questions.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
          Chưa có câu hỏi nào. Bấm &quot;Thêm câu hỏi&quot; để bắt đầu soạn đề.
        </p>
      ) : (
        <div className="space-y-2">
          {quiz.questions.map((q, idx) => (
            <QuizQuestionCard
              key={q.id}
              index={idx}
              total={quiz.questions.length}
              question={q}
              onChange={(updates) => quiz.updateQuestion(q.id, updates)}
              onRemove={() => quiz.removeQuestion(q.id)}
              onMove={(dir) => quiz.moveQuestion(q.id, dir)}
            />
          ))}
        </div>
      )}

      <AddQuestionMenu onPick={quiz.addQuestion} />

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={quiz.save}
          disabled={quiz.saving === 'SAVING'}
          className="primary-button !h-8 !text-xs !px-4 flex-1 justify-center"
        >
          {quiz.saving === 'SAVING' ? 'Đang lưu...' : quiz.hasQuiz ? 'Lưu thay đổi đề' : 'Lưu đề ôn tập'}
        </button>
        {quiz.hasQuiz && (
          <button
            type="button"
            onClick={quiz.deleteQuiz}
            className="secondary-button !h-8 !text-xs !px-3 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Xóa đề
          </button>
        )}
      </div>
      {quiz.saving === 'SAVED' && (
        <p className="text-[11px] text-emerald-600 text-center">Đã lưu đề ôn tập.</p>
      )}
    </div>
  );
}
