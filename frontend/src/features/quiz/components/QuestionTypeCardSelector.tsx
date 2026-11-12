'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { QuizQuestionType } from '@/features/lessons/types/quiz.types';
import { QUESTION_TYPE_CARDS } from './question-modal.helper';

interface QuestionTypeCardSelectorProps {
  currentType: QuizQuestionType;
  onSelectType: (type: QuizQuestionType, isReady: boolean) => void;
}

export function QuestionTypeCardSelector({
  currentType,
  onSelectType,
}: QuestionTypeCardSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {QUESTION_TYPE_CARDS.map((card) => {
        const isSelected = currentType === card.type;
        const IconComp = card.icon;

        return (
          <button
            key={card.type}
            type="button"
            onClick={() => onSelectType(card.type, card.isReady)}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer min-h-[92px] ${
              isSelected
                ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                : card.isReady
                ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                : 'border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-90'
            }`}
          >
            <span className="absolute top-2 right-2 flex items-center justify-center">
              {isSelected ? (
                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Check size={10} strokeWidth={3} />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
              )}
            </span>

            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${
                isSelected
                  ? 'text-blue-600 bg-blue-100/60'
                  : 'text-slate-500 bg-slate-100/80'
              }`}
            >
              <IconComp size={16} />
            </div>

            <span
              className={`text-[11px] font-bold leading-tight ${
                isSelected ? 'text-blue-900' : 'text-slate-800'
              }`}
            >
              {card.title}
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              {card.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
