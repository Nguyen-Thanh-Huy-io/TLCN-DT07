'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, RotateCcw, Target, X } from 'lucide-react';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizItem,
  QuizQuestion,
  QuizQuestionType,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  OrderingQuestion,
  MatchingQuestion,
  FillInBlankQuestion,
} from '@/features/lessons/types/quiz.types';
import type { UserQuizAnswer } from '../../strategies/public-curriculum.strategies';
import { HubBadge, HubButton } from './HubUi';
import { sanitizeRichHtml } from '@/utils/common';

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

interface FlexibleLabelEntity {
  label?: string;
  text?: string;
  content?: string;
  name?: string;
}

function resolveEntityLabel(item: unknown, fallback = ''): string {
  if (!item || typeof item !== 'object') return fallback;
  const target = item as FlexibleLabelEntity;
  return target.label || target.text || target.content || target.name || fallback;
}

const OPTION_BASE = 'flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition';
const OPTION_CORRECT_STYLE = 'border-lh-brand bg-lh-brand-soft text-lh-brand font-semibold';
const OPTION_WRONG_STYLE = 'border-lh-red bg-lh-red-soft text-lh-red';
const OPTION_UNSELECTED_SUBMITTED = 'border-lh-line text-lh-muted opacity-70';

function resolveChoiceStateClass(selected: boolean, isCorrect: boolean, submitted: boolean): string {
  if (!submitted) {
    return selected
      ? 'border-lh-brand bg-lh-brand-soft/60 text-lh-ink font-semibold'
      : 'border-lh-line text-lh-ink hover:border-lh-brand/30 hover:bg-lh-surface-2';
  }
  if (isCorrect) return OPTION_CORRECT_STYLE;
  if (selected) return OPTION_WRONG_STYLE;
  return OPTION_UNSELECTED_SUBMITTED;
}

function resolveOptionBadgeClass(selected: boolean, isCorrect: boolean, submitted: boolean): string {
  if (!submitted) {
    return selected ? 'border-lh-brand bg-lh-brand text-white' : 'border-lh-line bg-white';
  }
  if (isCorrect) return 'border-lh-brand bg-lh-brand text-white';
  if (selected) return 'border-lh-red bg-lh-red text-white';
  return 'border-lh-line bg-white';
}

function renderOptionIconOrLetter(
  idx: number,
  isMulti: boolean,
  selected: boolean,
  isCorrect: boolean,
  submitted: boolean,
) {
  if (submitted) {
    if (isCorrect) return <Check className="size-4" />;
    if (selected) return <X className="size-4" />;
    return String.fromCharCode(65 + idx);
  }
  if (isMulti && selected) {
    return <Check className="size-3.5" />;
  }
  return String.fromCharCode(65 + idx);
}

function ChoiceQuestionBody({
  question: q,
  answer,
  submitted,
  setAnswer,
}: Omit<QuestionProps, 'moveOrderingItem' | 'question'> & {
  question: SingleChoiceQuestion | MultipleChoiceQuestion;
}) {
  const isMulti = q.type === QuizQuestionType.MULTIPLE_CHOICE;
  const selectedIds = Array.isArray(answer)
    ? (answer as string[])
    : typeof answer === 'string' && answer
      ? [answer]
      : [];

  const handleSelectOption = (optId: string) => {
    if (!isMulti) {
      setAnswer(q.id, optId);
      return;
    }
    const next = selectedIds.includes(optId)
      ? selectedIds.filter((id) => id !== optId)
      : [...selectedIds, optId];
    setAnswer(q.id, next);
  };

  return (
    <div className="mt-5 space-y-3">
      {isMulti && (
        <p className="text-xs font-medium text-lh-muted italic">
          (Có thể chọn nhiều đáp án đúng)
        </p>
      )}
      {q.options.map((opt, idx) => {
        const selected = selectedIds.includes(opt.id);
        const isCorrect = Boolean(opt.isCorrect);
        const state = resolveChoiceStateClass(selected, isCorrect, submitted);
        const badgeBg = resolveOptionBadgeClass(selected, isCorrect, submitted);

        return (
          <button
            key={opt.id}
            type="button"
            disabled={submitted}
            onClick={() => handleSelectOption(opt.id)}
            className={`${OPTION_BASE} cursor-pointer ${state}`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center ${
                isMulti ? 'rounded-md' : 'rounded-full'
              } border text-xs font-bold ${badgeBg}`}
            >
              {renderOptionIconOrLetter(idx, isMulti, selected, isCorrect, submitted)}
            </span>
            <span className="flex-1 text-left">
              {resolveEntityLabel(opt)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseQuestionBody({
  question: q,
  answer,
  submitted,
  setAnswer,
}: Omit<QuestionProps, 'moveOrderingItem' | 'question'> & {
  question: TrueFalseQuestion;
}) {
  const choices = [
    { value: true, label: 'Đúng' },
    { value: false, label: 'Sai' },
  ];

  return (
    <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
      {choices.map((choice) => {
        const selected = answer === choice.value;
        const isRightChoice = q.correctAnswer === choice.value;
        const state = submitted
          ? isRightChoice
            ? OPTION_CORRECT_STYLE
            : selected
              ? 'border-lh-red bg-lh-red-soft text-lh-red font-semibold'
              : OPTION_UNSELECTED_SUBMITTED
          : selected
            ? 'border-lh-brand bg-lh-brand text-white font-semibold'
            : 'border-lh-line text-lh-ink hover:bg-lh-surface-2';

        return (
          <button
            key={choice.label}
            type="button"
            disabled={submitted}
            onClick={() => setAnswer(q.id, choice.value)}
            className={`${OPTION_BASE} cursor-pointer justify-center ${state}`}
          >
            {submitted && isRightChoice && <Check className="size-4 shrink-0" />}
            {submitted && selected && !isRightChoice && <X className="size-4 shrink-0" />}
            <span>{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FillBlankQuestionBody({
  question: q,
  answer,
  submitted,
  setAnswer,
}: Omit<QuestionProps, 'moveOrderingItem' | 'question'> & {
  question: FillInBlankQuestion;
}) {
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

function OrderingQuestionBody({
  question: q,
  answer,
  submitted,
  setAnswer,
  moveOrderingItem,
}: Omit<QuestionProps, 'question'> & {
  question: OrderingQuestion;
}) {
  const order = Array.isArray(answer) ? (answer as string[]) : q.items.map((i) => i.id);

  const handleReorderDragDrop = (fromIdx: number, toIdx: number) => {
    if (submitted || fromIdx === toIdx || toIdx < 0 || toIdx >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setAnswer(q.id, next);
  };

  return (
    <div className="mt-5 space-y-2">
      <p className="text-xs font-medium text-lh-muted italic">
        (Kéo thả trực tiếp hoặc bấm mũi tên Lên/Xuống để sắp xếp các mốc theo đúng thứ tự thời gian từ trước đến sau)
      </p>
      {order.map((itemId, idx) => {
        const isPositionCorrect = submitted && q.correctOrder[idx] === itemId;
        const rowState = submitted
          ? isPositionCorrect
            ? OPTION_CORRECT_STYLE
            : OPTION_WRONG_STYLE
          : 'border-lh-line bg-lh-surface text-lh-ink cursor-grab active:cursor-grabbing hover:border-lh-brand/40';

        const item = q.items.find((i) => i.id === itemId);

        return (
          <div
            key={itemId}
            draggable={!submitted}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', String(idx));
            }}
            onDragOver={(e) => {
              if (!submitted) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromIdx = Number(e.dataTransfer.getData('text/plain'));
              if (!Number.isNaN(fromIdx)) {
                handleReorderDragDrop(fromIdx, idx);
              }
            }}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition ${rowState}`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  submitted
                    ? isPositionCorrect
                      ? 'bg-lh-brand text-white'
                      : 'bg-lh-red text-white'
                    : 'bg-lh-surface-2 text-lh-brand'
                }`}
              >
                {submitted ? (
                  isPositionCorrect ? (
                    <Check className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )
                ) : (
                  idx + 1
                )}
              </span>
              <span>
                {resolveEntityLabel(item, itemId)}
              </span>
            </span>
            {!submitted && (
              <span className="flex gap-1 shrink-0">
                <HubButton
                  variant="outline"
                  className="size-8 p-0"
                  disabled={idx === 0}
                  onClick={() => moveOrderingItem(q.id, idx, 'UP')}
                  aria-label="Đưa lên"
                >
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
        );
      })}
    </div>
  );
}

function MatchingQuestionBody({
  question: q,
  answer,
  submitted,
  setAnswer,
}: Omit<QuestionProps, 'moveOrderingItem' | 'question'> & {
  question: MatchingQuestion;
}) {
  const pairs =
    answer && typeof answer === 'object' && !Array.isArray(answer)
      ? (answer as Record<string, string>)
      : {};
  const correctPairMap = new Map(q.correctPairs.map((p) => [p.leftId, p.rightId]));

  return (
    <div className="mt-5 space-y-2.5">
      <p className="text-xs font-medium text-lh-muted italic">
        (Chọn phương án ở cột bên phải tương ứng với từng mục ở cột bên trái)
      </p>
      {q.leftItems.map((left, idx) => {
        const selectedRightId = pairs[left.id] || '';
        const isPairCorrect =
          submitted && Boolean(selectedRightId) && correctPairMap.get(left.id) === selectedRightId;
        const rowState = submitted
          ? isPairCorrect
            ? 'border-lh-brand bg-lh-brand-soft/60 text-lh-brand'
            : 'border-lh-red bg-lh-red-soft/60 text-lh-red'
          : 'border-lh-line bg-lh-surface';

        return (
          <div
            key={left.id}
            className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center transition ${rowState}`}
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-lh-ink">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  submitted
                    ? isPairCorrect
                      ? 'bg-lh-brand text-white'
                      : 'bg-lh-red text-white'
                    : 'bg-lh-surface-2 text-lh-brand'
                }`}
              >
                {submitted ? (
                  isPairCorrect ? (
                    <Check className="size-3.5" />
                  ) : (
                    <X className="size-3.5" />
                  )
                ) : (
                  idx + 1
                )}
              </span>
              <span>{resolveEntityLabel(left, left.id)}</span>
            </span>
            <span className="hidden text-lh-muted sm:inline">↔</span>
            <select
              disabled={submitted}
              value={selectedRightId}
              onChange={(e) => setAnswer(q.id, { ...pairs, [left.id]: e.target.value })}
              className="h-10 rounded-xl border border-lh-line bg-lh-surface-2 px-3 text-sm text-lh-ink outline-none"
            >
              <option value="">— Chọn vế ghép —</option>
              {q.rightItems.map((right) => (
                <option key={right.id} value={right.id}>
                  {resolveEntityLabel(right, right.id)}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function QuestionBody({ question: q, answer, submitted, setAnswer, moveOrderingItem }: QuestionProps) {
  switch (q.type) {
    case QuizQuestionType.SINGLE_CHOICE:
    case QuizQuestionType.MULTIPLE_CHOICE:
      return <ChoiceQuestionBody question={q} answer={answer} submitted={submitted} setAnswer={setAnswer} />;
    case QuizQuestionType.TRUE_FALSE:
      return <TrueFalseQuestionBody question={q} answer={answer} submitted={submitted} setAnswer={setAnswer} />;
    case QuizQuestionType.FILL_IN_BLANK:
      return <FillBlankQuestionBody question={q} answer={answer} submitted={submitted} setAnswer={setAnswer} />;
    case QuizQuestionType.ORDERING:
      return <OrderingQuestionBody question={q} answer={answer} submitted={submitted} setAnswer={setAnswer} moveOrderingItem={moveOrderingItem} />;
    case QuizQuestionType.MATCHING:
      return <MatchingQuestionBody question={q} answer={answer} submitted={submitted} setAnswer={setAnswer} />;
    default:
      return null;
  }
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
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(q.prompt) }}
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

                  {/* Ghi chú giải thích riêng cho từng lựa chọn (Dùng chung cho Single Choice & Multiple Choice) */}
                  {(q.type === QuizQuestionType.SINGLE_CHOICE ||
                    q.type === QuizQuestionType.MULTIPLE_CHOICE) &&
                    (() => {
                      const rawAns = answers[q.id];
                      const selectedSet = new Set(
                        Array.isArray(rawAns)
                          ? rawAns
                          : typeof rawAns === 'string' && rawAns
                            ? [rawAns]
                            : [],
                      );
                      const relevantOptions = q.options
                        .map((opt, i) => ({ opt, letter: String.fromCharCode(65 + i) }))
                        .filter(
                          ({ opt }) =>
                            Boolean(opt.explanation?.trim()) &&
                            (opt.isCorrect || selectedSet.has(opt.id)),
                        );

                      if (relevantOptions.length === 0) return null;

                      return (
                        <div className="space-y-1.5">
                          {relevantOptions.map(({ opt, letter }) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                                opt.isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
                              }`}
                            >
                              <strong>
                                {opt.isCorrect ? '✅' : '💡'} Phương án {letter} (
                                {opt.isCorrect ? 'Đáp án đúng' : 'Bạn đã chọn'}):{' '}
                              </strong>
                              {opt.explanation}
                            </div>
                          ))}
                        </div>
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
