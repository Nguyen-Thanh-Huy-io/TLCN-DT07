'use client';

import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, RotateCcw, Target, X } from 'lucide-react';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizItem,
  QuizQuestion,
  QuizQuestionType,
} from '@/features/lessons/types/quiz.types';
import type { UserQuizAnswer } from '../../strategies/public-curriculum.strategies';
import { HubBadge, HubButton } from './HubUi';

interface QuizEvaluation {
  detailsMap: Map<string, { isCorrect: boolean; correctSummary: string }>;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
}

interface QuestionProps {
  question: QuizQuestion;
  answer: UserQuizAnswer | undefined;
  submitted: boolean;
  setAnswer: (questionId: string, answer: UserQuizAnswer) => void;
  moveOrderingItem: (questionId: string, fromIdx: number, direction: 'UP' | 'DOWN') => void;
}

const OPTION_BASE = 'flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition';

function QuestionBody({ question: q, answer, submitted, setAnswer, moveOrderingItem }: QuestionProps) {
  if (q.type === QuizQuestionType.SINGLE_CHOICE) {
    return (
      <div className="mt-5 space-y-3">
        {q.options.map((opt, idx) => {
          const selected = answer === opt.id;
          const state = submitted
            ? opt.isCorrect
              ? 'border-lh-brand bg-lh-brand-soft text-lh-brand font-semibold'
              : selected
                ? 'border-lh-red bg-lh-red-soft text-lh-red'
                : 'border-lh-line text-lh-muted opacity-70'
            : selected
              ? 'border-lh-brand bg-lh-brand-soft/60 text-lh-ink font-semibold'
              : 'border-lh-line text-lh-ink hover:border-lh-brand/30 hover:bg-lh-surface-2';
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setAnswer(q.id, opt.id)}
              className={`${OPTION_BASE} cursor-pointer ${state}`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  submitted && opt.isCorrect
                    ? 'border-lh-brand bg-lh-brand text-white'
                    : selected
                      ? submitted
                        ? 'border-lh-red bg-lh-red text-white'
                        : 'border-lh-brand bg-lh-brand text-white'
                      : 'border-lh-line bg-white'
                }`}
              >
                {submitted ? (
                  opt.isCorrect ? (
                    <Check className="size-4" />
                  ) : selected ? (
                    <X className="size-4" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </span>
              <span className="flex-1 text-left">{opt.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === QuizQuestionType.MULTIPLE_CHOICE) {
    return (
      <div className="mt-5 space-y-3">
        {q.options.map((opt, idx) => {
          const selected = answer === opt.id;
          const state = submitted
            ? opt.isCorrect
              ? 'border-lh-brand bg-lh-brand-soft text-lh-brand'
              : selected
                ? 'border-lh-red bg-lh-red-soft text-lh-red'
                : 'border-lh-line text-lh-muted'
            : selected
              ? 'border-lh-brand bg-lh-brand-soft/60 text-lh-ink'
              : 'border-lh-line text-lh-ink hover:border-lh-brand/30 hover:bg-lh-surface-2';
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setAnswer(q.id, opt.id)}
              className={`${OPTION_BASE} cursor-pointer ${state}`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  selected ? 'border-lh-brand bg-lh-brand text-white' : 'border-lh-line'
                }`}
              >
                {submitted && opt.isCorrect ? <Check className="size-4" /> : String.fromCharCode(65 + idx)}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === QuizQuestionType.TRUE_FALSE) {
    return (
      <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
        {[
          { value: true, label: 'Đúng' },
          { value: false, label: 'Sai' },
        ].map((choice) => (
          <button
            key={choice.label}
            type="button"
            disabled={submitted}
            onClick={() => setAnswer(q.id, choice.value)}
            className={`${OPTION_BASE} cursor-pointer justify-center ${
              answer === choice.value
                ? 'border-lh-brand bg-lh-brand text-white'
                : 'border-lh-line text-lh-ink hover:bg-lh-surface-2'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === QuizQuestionType.FILL_IN_BLANK) {
    return (
      <input
        type="text"
        disabled={submitted}
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => setAnswer(q.id, e.target.value)}
        placeholder="Nhập câu trả lời của bạn..."
        className="mt-5 h-11 w-full max-w-md rounded-xl border border-lh-line bg-lh-surface px-4 text-sm text-lh-ink outline-none focus:border-lh-brand/50 focus:ring-2 focus:ring-lh-brand/10"
      />
    );
  }

  if (q.type === QuizQuestionType.ORDERING) {
    const order = Array.isArray(answer) ? (answer as string[]) : q.items.map((i) => i.id);
    return (
      <div className="mt-5 space-y-2">
        {order.map((itemId, idx) => (
          <div key={itemId} className="flex items-center justify-between gap-3 rounded-xl border border-lh-line bg-lh-surface px-4 py-3 text-sm text-lh-ink">
            <span className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-lh-surface-2 text-xs font-bold text-lh-brand">{idx + 1}</span>
              {q.items.find((i) => i.id === itemId)?.label || itemId}
            </span>
            {!submitted && (
              <span className="flex gap-1">
                <HubButton variant="outline" className="size-8 p-0" disabled={idx === 0} onClick={() => moveOrderingItem(q.id, idx, 'UP')} aria-label="Đưa lên">
                  <ArrowUp className="size-4" />
                </HubButton>
                <HubButton
                  variant="outline"
                  className="size-8 p-0"
                  disabled={idx === order.length - 1}
                  onClick={() => moveOrderingItem(q.id, idx, 'DOWN')}
                  aria-label="Đưa xuống"
                >
                  <ArrowDown className="size-4" />
                </HubButton>
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (q.type === QuizQuestionType.MATCHING) {
    const pairs = answer && typeof answer === 'object' && !Array.isArray(answer) ? (answer as Record<string, string>) : {};
    return (
      <div className="mt-5 space-y-2.5">
        {q.leftItems.map((left) => (
          <div key={left.id} className="grid gap-2 rounded-xl border border-lh-line bg-lh-surface p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <span className="text-sm font-medium text-lh-ink">{left.label}</span>
            <span className="hidden text-lh-muted sm:inline">↔</span>
            <select
              disabled={submitted}
              value={pairs[left.id] || ''}
              onChange={(e) => setAnswer(q.id, { ...pairs, [left.id]: e.target.value })}
              className="h-10 rounded-xl border border-lh-line bg-lh-surface-2 px-3 text-sm text-lh-ink outline-none"
            >
              <option value="">— Chọn vế ghép —</option>
              {q.rightItems.map((right) => (
                <option key={right.id} value={right.id}>
                  {right.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function HubLessonQuiz({
  quiz,
  evaluation,
  answers,
  submitted,
  setAnswer,
  moveOrderingItem,
  onSubmit,
  onRetry,
}: {
  quiz: QuizItem;
  evaluation: QuizEvaluation | null;
  answers: Record<string, UserQuizAnswer>;
  submitted: boolean;
  setAnswer: QuestionProps['setAnswer'];
  moveOrderingItem: QuestionProps['moveOrderingItem'];
  onSubmit: () => void;
  onRetry: () => void;
}) {
  return (
    <section id="on-tap-cuoi-bai" className="scroll-mt-24 rounded-2xl border border-lh-line bg-lh-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-lh-gold-soft text-lh-gold">
            <Target className="size-5" />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lh-gold">Kiểm tra kiến thức</div>
            <div className="font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">{quiz.title || 'Đề ôn tập cuối bài'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <HubBadge>{quiz.questions.length} câu hỏi</HubBadge>
          <HubBadge tone="gold">Điểm đạt {quiz.passingScorePercent || 70}%</HubBadge>
        </div>
      </div>

      {submitted && evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 ${
            evaluation.passed ? 'bg-lh-brand-soft text-lh-brand' : 'bg-lh-red-soft text-lh-red'
          }`}
        >
          <div>
            <div className="text-sm font-bold">{evaluation.passed ? 'Chúc mừng! Bạn đã vượt qua bài ôn tập.' : 'Cần ôn tập thêm để nắm vững kiến thức.'}</div>
            <div className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold">
              Đúng {evaluation.correctCount}/{evaluation.totalCount} câu ({evaluation.scorePercent}%)
            </div>
          </div>
          <HubButton variant="outline" onClick={onRetry}>
            <RotateCcw className="size-4" /> Làm lại
          </HubButton>
        </motion.div>
      )}

      <div className="mt-6 space-y-8">
        {quiz.questions.map((q, index) => {
          const detail = evaluation?.detailsMap.get(q.id);
          return (
            <div key={q.id} className="border-t border-lh-line pt-6 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-lh-gold">
                  Câu hỏi {index + 1} / {quiz.questions.length}
                </span>
                <HubBadge>{QUIZ_QUESTION_TYPE_META[q.type]?.shortLabel || 'Câu hỏi'}</HubBadge>
                {submitted && detail && (
                  <HubBadge tone={detail.isCorrect ? 'brand' : 'red'}>
                    {detail.isCorrect ? <Check className="size-3" /> : <X className="size-3" />}
                    {detail.isCorrect ? 'Chính xác' : 'Chưa đúng'}
                  </HubBadge>
                )}
              </div>
              <div
                className="mt-3 font-[family-name:var(--font-heading)] text-xl font-bold leading-8 text-lh-ink [&>p]:mb-2 [&>p:last-child]:mb-0 [&_img]:rounded-xl [&_img]:my-3 [&_img]:max-h-96"
                dangerouslySetInnerHTML={{ __html: q.prompt }}
              />
              <QuestionBody
                question={q}
                answer={answers[q.id]}
                submitted={submitted}
                setAnswer={setAnswer}
                moveOrderingItem={moveOrderingItem}
              />
              {submitted && detail && (
                <div className="mt-4 rounded-xl bg-lh-surface-2 p-4 text-sm leading-6 text-lh-muted space-y-2">
                  {!detail.isCorrect && detail.correctSummary && (
                    <p className="font-semibold text-lh-brand">Đáp án đúng: {detail.correctSummary}</p>
                  )}

                  {/* Ghi chú giải thích riêng cho từng lựa chọn của Single Choice */}
                  {q.type === QuizQuestionType.SINGLE_CHOICE && (() => {
                    const selectedOpt = q.options.find((o) => o.id === answers[q.id]);
                    const correctOpt = q.options.find((o) => o.isCorrect);
                    const selectedLetter = selectedOpt ? String.fromCharCode(65 + q.options.indexOf(selectedOpt)) : '';
                    const correctLetter = correctOpt ? String.fromCharCode(65 + q.options.indexOf(correctOpt)) : '';

                    return (
                      <>
                        {selectedOpt?.explanation && (
                          <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                            selectedOpt.isCorrect
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-rose-50/80 border-rose-200 text-rose-900'
                          }`}>
                            <strong>💡 Lưu ý phương án {selectedLetter} ({selectedOpt.isCorrect ? 'Đúng' : 'Bạn đã chọn'}): </strong>
                            {selectedOpt.explanation}
                          </div>
                        )}
                        {!detail.isCorrect && correctOpt?.explanation && correctOpt.id !== selectedOpt?.id && (
                          <div className="p-2.5 rounded-lg border bg-emerald-50/80 border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                            <strong>✅ Vì sao phương án {correctLetter} là đáp án đúng: </strong>
                            {correctOpt.explanation}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {q.explanation && (
                    <p className="text-xs text-lh-ink/80 pt-1 border-t border-lh-line">
                      <span className="font-bold text-lh-ink">Giải thích chung: </span>
                      {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <HubButton className="mt-7" onClick={onSubmit}>
          Kiểm tra đáp án
        </HubButton>
      )}
    </section>
  );
}
