'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { MoveDirection } from '@/features/lessons/components/quiz/QuizQuestionEditors';
import type { QuizBlockData } from '@/features/lessons/types/block-builder.types';
import { QuizQuestionType, type QuizQuestion } from '@/features/lessons/types/quiz.types';
import {
  LESSON_QUIZ_DEFAULT_TITLE,
  LESSON_QUIZ_PLACEHOLDER_ATTR,
  isLessonAnswerCorrect,
  quizBlockQuestions,
} from '@/features/lessons/utils/lesson-quiz.util';
import {
  prepareQuizSessionForLearner,
  type UserQuizAnswer,
} from '../../strategies/public-curriculum.strategies';
import { QuestionBody } from './HubLessonQuiz';

interface QuizSession {
  questions: QuizQuestion[];
  answers: Record<string, UserQuizAnswer>;
}

/** Mỗi lượt làm: xáo lựa chọn / thứ tự / vế ghép, khởi tạo thứ tự cho câu sắp xếp. */
function newSession(block: QuizBlockData): QuizSession {
  const { preparedQuiz, initialAnswers } = prepareQuizSessionForLearner({ questions: quizBlockQuestions(block) });
  return { questions: preparedQuiz.questions, answers: initialAnswers };
}

function moveItem(order: string[], fromIdx: number, direction: 'UP' | 'DOWN'): string[] {
  const target = direction === MoveDirection.UP ? fromIdx - 1 : fromIdx + 1;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Khối Ôn tập ở trang đọc bài: người học tự làm, bấm Kiểm tra để xem đúng/sai và giải thích — không lưu. */
export function LessonQuizBlockView({ block }: { block: QuizBlockData }) {
  const [session, setSession] = useState(() => newSession(block));
  const [checked, setChecked] = useState(false);
  const { questions, answers } = session;
  if (questions.length === 0) return null;

  const setAnswer = (questionId: string, answer: UserQuizAnswer) => {
    if (checked) return;
    setSession((prev) => ({ ...prev, answers: { ...prev.answers, [questionId]: answer } }));
  };

  const moveOrderingItem = (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => {
    const question = questions.find((q) => q.id === questionId);
    if (checked || !question || question.type !== QuizQuestionType.ORDERING) return;
    const current = answers[questionId];
    const order = Array.isArray(current) ? current : question.items.map((item) => item.id);
    setAnswer(questionId, moveItem(order, fromIdx, direction));
  };

  const results = questions.map((q) => isLessonAnswerCorrect(q, answers[q.id]));
  const correctCount = results.filter(Boolean).length;

  return (
    <div className="not-prose space-y-4 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs font-bold uppercase tracking-wide text-amber-700">
          ❓ {block.title || LESSON_QUIZ_DEFAULT_TITLE} · {questions.length} câu
        </p>
        {checked && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-800 shadow-2xs">
            Đúng {correctCount}/{questions.length}
          </span>
        )}
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="m-0 text-sm font-semibold text-stone-900">
              {index + 1}. {question.prompt}
            </p>
            {checked && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  results[index] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {results[index] ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {results[index] ? 'Chính xác' : 'Chưa đúng'}
              </span>
            )}
          </div>
          <QuestionBody
            question={question}
            answer={answers[question.id]}
            submitted={checked}
            setAnswer={setAnswer}
            moveOrderingItem={moveOrderingItem}
          />
          {checked && question.explanation && (
            <p className="mb-0 mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-stone-700">
              {question.explanation}
            </p>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        {checked ? (
          <button
            type="button"
            onClick={() => {
              setSession(newSession(block));
              setChecked(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <RotateCcw size={14} /> Làm lại
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
}

interface QuizIsland {
  element: HTMLElement;
  block: QuizBlockData;
}

/**
 * Nội dung bài học là HTML dựng sẵn (`dangerouslySetInnerHTML`); khối Ôn tập chỉ để lại chỗ giữ chỗ
 * `[data-lesson-quiz="<id>"]`. Hook này tìm các chỗ đó sau mỗi lần HTML đổi và gắn phần làm bài vào bằng portal.
 */
export function useLessonQuizIslands(
  containerRef: React.RefObject<HTMLElement | null>,
  html: string,
  quizBlocks: Map<string, QuizBlockData>,
): React.ReactNode {
  const [islands, setIslands] = useState<QuizIsland[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const found: QuizIsland[] = [];
    container?.querySelectorAll<HTMLElement>(`[${LESSON_QUIZ_PLACEHOLDER_ATTR}]`).forEach((element) => {
      const block = quizBlocks.get(element.getAttribute(LESSON_QUIZ_PLACEHOLDER_ATTR) ?? '');
      if (!block) return;
      element.replaceChildren();
      found.push({ element, block });
    });
    void Promise.resolve().then(() => setIslands(found));
  }, [containerRef, html, quizBlocks]);

  return islands.map(({ element, block }) => {
    // Key theo nội dung: ở màn xem trước, sửa câu hỏi thì lượt làm bắt đầu lại theo nội dung mới.
    const contentKey = `${block.id}:${JSON.stringify(block)}`;
    return createPortal(<LessonQuizBlockView key={contentKey} block={block} />, element, contentKey);
  });
}
