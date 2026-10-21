'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { QUIZ_QUESTION_TYPE_META, QuizQuestion, QuizQuestionType } from '../../types/quiz.types';
import {
  FillInBlankEditor,
  MatchingEditor,
  MultipleChoiceEditor,
  OrderingEditor,
  TrueFalseEditor,
} from './QuizQuestionEditors';

interface QuizQuestionCardProps {
  index: number;
  total: number;
  question: QuizQuestion;
  onChange: (updates: Partial<QuizQuestion>) => void;
  onRemove: () => void;
  onMove: (direction: 'UP' | 'DOWN') => void;
}

/** Card thu gọn/mở rộng cho 1 câu hỏi — cùng kiểu tương tác với mốc Timeline đã có:
 * badge màu theo dạng câu hỏi, ▲▼ đổi thứ tự, ✕ xóa, bấm header để thu gọn/mở rộng. */
export function QuizQuestionCard({ index, total, question, onChange, onRemove, onMove }: QuizQuestionCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = QUIZ_QUESTION_TYPE_META[question.type];

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden" data-testid={`quiz-question-${index}`}>
      <div
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between gap-2 p-2.5 cursor-pointer select-none hover:bg-slate-50/80 transition"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon
            name={IconName.CHEVRON}
            size={11}
            className={`text-slate-400 shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`}
          />
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`}>
            {meta.shortLabel}
          </span>
          <span className="text-xs font-semibold text-slate-800 truncate">
            {question.prompt || 'Câu hỏi chưa có nội dung'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove('UP')}
            disabled={index === 0}
            title="Chuyển lên"
            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove('DOWN')}
            disabled={index === total - 1}
            title="Chuyển xuống"
            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Xóa câu hỏi"
            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-2.5 pt-0 border-t border-slate-100">
          <div className="pt-2.5">{renderEditor(question, onChange)}</div>
        </div>
      )}
    </div>
  );
}

function renderEditor(question: QuizQuestion, onChange: (updates: Partial<QuizQuestion>) => void) {
  switch (question.type) {
    case QuizQuestionType.MULTIPLE_CHOICE:
      return <MultipleChoiceEditor data={question} onChange={onChange as any} />;
    case QuizQuestionType.TRUE_FALSE:
      return <TrueFalseEditor data={question} onChange={onChange as any} />;
    case QuizQuestionType.ORDERING:
      return <OrderingEditor data={question} onChange={onChange as any} />;
    case QuizQuestionType.MATCHING:
      return <MatchingEditor data={question} onChange={onChange as any} />;
    case QuizQuestionType.FILL_IN_BLANK:
      return <FillInBlankEditor data={question} onChange={onChange as any} />;
    default:
      return null;
  }
}
