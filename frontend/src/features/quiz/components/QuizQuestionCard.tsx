'use client';

import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { QuizQuestionType } from '@/features/lessons/types/quiz.types';
import {
  RawQuizQuestion,
  getOptionLabel,
  isOptionCorrectAnswer,
  ANSWER_LABEL_TRUE,
  ANSWER_LABEL_FALSE,
} from '../utils/quiz-score.helper';

interface QuizQuestionCardProps {
  question: RawQuizQuestion;
  index: number;
  isSelected?: string;
  submitted: boolean;
  onSelectAnswer: (qIndex: number, optionVal: string) => void;
  showExplanation: boolean;
  onToggleExplanation: (qIndex: number) => void;
}

function resolveQuestionTypeLabel(type: string): string {
  if (type === QuizQuestionType.MULTIPLE_CHOICE || type === QuizQuestionType.SINGLE_CHOICE) {
    return 'Trắc nghiệm';
  }
  if (type === QuizQuestionType.TRUE_FALSE) {
    return 'Đúng / Sai';
  }
  return 'Điền khuyết';
}

function checkOptionIsCorrect(q: RawQuizQuestion, val: string): boolean {
  if (q.type === QuizQuestionType.TRUE_FALSE) {
    const isTrue = val === ANSWER_LABEL_TRUE;
    if (typeof q.correctAnswer === 'boolean') return isTrue === q.correctAnswer;
    if (typeof q.correctAnswer === 'string') return val.toLowerCase() === q.correctAnswer.toLowerCase();
  } else if (q.type === QuizQuestionType.MULTIPLE_CHOICE || q.type === QuizQuestionType.SINGLE_CHOICE) {
    const matched = (q.options || []).find((opt) => getOptionLabel(opt) === val);
    return matched ? isOptionCorrectAnswer(matched, q) : false;
  }
  return false;
}

export function QuizQuestionCard({
  question,
  index,
  isSelected,
  submitted,
  onSelectAnswer,
  showExplanation,
  onToggleExplanation,
}: QuizQuestionCardProps) {
  let optionList: string[] = [];
  if (question.type === QuizQuestionType.TRUE_FALSE) {
    optionList = [ANSWER_LABEL_TRUE, ANSWER_LABEL_FALSE];
  } else if (question.options && question.options.length > 0) {
    optionList = question.options.map(getOptionLabel);
  }

  const isCurrentCorrect = isSelected ? checkOptionIsCorrect(question, isSelected) : false;
  const showExpl = submitted || showExplanation;

  return (
    <div
      id={`question-box-${index}`}
      className="p-5 rounded-xl border border-stone-200/80 bg-stone-50/40 hover:border-stone-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#8B261E] text-white flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {resolveQuestionTypeLabel(question.type)}
          </span>
        </div>

        {submitted && (
          <div>
            {isCurrentCorrect ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={13} /> Chính xác
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                <XCircle size={13} /> Chưa đúng
              </span>
            )}
          </div>
        )}
      </div>

      <h4 className="text-sm md:text-base font-medium text-stone-900 mb-3.5 leading-snug">
        {question.prompt}
      </h4>

      {/* Lựa chọn */}
      {optionList.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          {optionList.map((optText, optIdx) => {
            const isOptionSelected = isSelected === optText;
            const isOptionCorrect = checkOptionIsCorrect(question, optText);

            let btnStyle = 'bg-white border-stone-200 hover:bg-stone-50 text-stone-800';

            if (submitted) {
              if (isOptionCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500';
              } else if (isOptionSelected && !isOptionCorrect) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400';
              }
            } else if (isOptionSelected) {
              btnStyle = 'bg-[#8B261E]/5 border-[#8B261E] text-[#8B261E] font-semibold ring-2 ring-[#8B261E]/20';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={submitted}
                onClick={() => onSelectAnswer(index, optText)}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm transition-all duration-150 flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span className="leading-relaxed">{optText}</span>
                {submitted && isOptionCorrect && (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 ml-2" />
                )}
                {submitted && isOptionSelected && !isOptionCorrect && (
                  <XCircle size={15} className="text-rose-500 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Giải thích */}
      {question.explanation && (
        <div className="mt-2.5">
          {!submitted && (
            <button
              type="button"
              onClick={() => onToggleExplanation(index)}
              className="text-xs font-semibold text-stone-500 hover:text-[#8B261E] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <HelpCircle size={12} />
              {showExpl ? 'Ẩn lời giải' : 'Xem gợi ý / giải thích'}
            </button>
          )}

          {showExpl && (
            <div className="mt-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 leading-relaxed">
              <span className="font-bold text-amber-900 block mb-0.5">
                💡 Lời giải thích:
              </span>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
