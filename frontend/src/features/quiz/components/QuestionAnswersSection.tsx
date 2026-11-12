'use client';

import React from 'react';
import { QuizQuestionType, OrderingItem } from '@/features/lessons/types/quiz.types';
import { TrueFalseAnswerSelector } from '@/components/common/TrueFalseAnswerSelector';
import { TimelineOrderingItemsEditor } from '@/components/common/TimelineOrderingItemsEditor';
import {
  MatchingPairsEditor,
  MatchingPairsValue,
} from '@/components/common/MatchingPairsEditor';
import { OptionItemState } from './question-modal.helper';
import { QuestionOptionsEditor } from './QuestionOptionsEditor';

interface QuestionAnswersSectionProps {
  type: QuizQuestionType;
  options: OptionItemState[];
  correctAnswer: boolean;
  orderingItems: OrderingItem[];
  matchingPairsValue: MatchingPairsValue;
  expandedNotes: Record<string, boolean>;
  onChangeCorrectAnswer: (val: boolean) => void;
  onChangeOrderingItems: (items: OrderingItem[]) => void;
  onChangeMatchingPairs: (pairs: MatchingPairsValue) => void;
  onToggleOptionCorrect: (optId: string) => void;
  onUpdateOptionText: (optId: string, text: string) => void;
  onUpdateOptionExplanation: (optId: string, explanation: string) => void;
  onToggleOptionNote: (optId: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optId: string) => void;
  onError: (msg: string) => void;
}

export function QuestionAnswersSection({
  type,
  options,
  correctAnswer,
  orderingItems,
  matchingPairsValue,
  expandedNotes,
  onChangeCorrectAnswer,
  onChangeOrderingItems,
  onChangeMatchingPairs,
  onToggleOptionCorrect,
  onUpdateOptionText,
  onUpdateOptionExplanation,
  onToggleOptionNote,
  onAddOption,
  onRemoveOption,
  onError,
}: QuestionAnswersSectionProps) {
  if (type === QuizQuestionType.TRUE_FALSE) {
    return (
      <div className="pt-1">
        <TrueFalseAnswerSelector value={correctAnswer} onChange={onChangeCorrectAnswer} />
      </div>
    );
  }

  if (type === QuizQuestionType.ORDERING) {
    return (
      <div className="pt-1">
        <TimelineOrderingItemsEditor
          items={orderingItems}
          onChange={onChangeOrderingItems}
          onError={onError}
        />
      </div>
    );
  }

  if (type === QuizQuestionType.MATCHING) {
    return (
      <div className="pt-1">
        <MatchingPairsEditor
          leftItems={matchingPairsValue.leftItems}
          rightItems={matchingPairsValue.rightItems}
          correctPairs={matchingPairsValue.correctPairs}
          onChange={onChangeMatchingPairs}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <QuestionOptionsEditor
      type={type}
      options={options}
      expandedNotes={expandedNotes}
      onToggleOptionCorrect={onToggleOptionCorrect}
      onUpdateOptionText={onUpdateOptionText}
      onUpdateOptionExplanation={onUpdateOptionExplanation}
      onToggleOptionNote={onToggleOptionNote}
      onAddOption={onAddOption}
      onRemoveOption={onRemoveOption}
    />
  );
}
