'use client';

import { IconName, KeyboardKey } from '@/constants/enums';
import React, { useEffect, useRef, useState } from 'react';
import {
  FillInBlankQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  QUIZ_QUESTION_TYPE_META,
  QuizQuestion,
  QuizQuestionType,
  SingleChoiceQuestion,
  TrueFalseQuestion,
} from '../../types/quiz.types';
import { generateQuizId } from '../../factories/quiz-question.factory';
import {
  CollapsibleExplanationField,
  OptionExplanationBox,
} from '@/components/common/CollapsibleExplanationField';
import { TrueFalseAnswerSelector } from '@/components/common/TrueFalseAnswerSelector';
import { TimelineOrderingItemsEditor } from '@/components/common/TimelineOrderingItemsEditor';
import { MatchingPairsEditor } from '@/components/common/MatchingPairsEditor';
import { Icon } from '@/components/icons/Icon';

export enum MoveDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum MatchingSide {
  LEFT = 'leftItems',
  RIGHT = 'rightItems',
}

type OnChange<T extends QuizQuestion> = (updates: Partial<T>) => void;

const inputCls =
  'w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500';
const smallInputCls =
  'flex-1 text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500';

/** Khung chung: câu dẫn đề bài (tự động giãn chiều cao theo độ dài văn bản) */
function PromptField({
  prompt,
  promptPlaceholder,
  onChange,
}: {
  prompt: string;
  promptPlaceholder: string;
  onChange: (updates: { prompt?: string; explanation?: string }) => void;
}) {
  return (
    <textarea
      rows={Math.max(2, Math.ceil((prompt?.length || 0) / 80))}
      value={prompt}
      onChange={(e) => onChange({ prompt: e.target.value })}
      placeholder={promptPlaceholder}
      className={`${inputCls} resize-y font-medium leading-relaxed`}
    />
  );
}

function ChoiceQuestionEditorBase<T extends SingleChoiceQuestion | MultipleChoiceQuestion>({
  data,
  multiple,
  onChange,
}: {
  data: T;
  multiple: boolean;
  onChange: OnChange<T>;
}) {
  const [expandedOptionNotes, setExpandedOptionNotes] = React.useState<Record<string, boolean>>({});
  const correctCount = data.options.filter((o) => o.isCorrect).length;

  const updateOption = (optId: string, text: string) => {
    onChange({ options: data.options.map((o) => (o.id === optId ? { ...o, text } : o)) } as Partial<T>);
  };
  const updateOptionExplanation = (optId: string, explanation: string) => {
    onChange({
      options: data.options.map((o) => (o.id === optId ? { ...o, explanation } : o)),
    } as Partial<T>);
  };
  const toggleNote = (optId: string) => {
    setExpandedOptionNotes((prev) => ({ ...prev, [optId]: !prev[optId] }));
  };
  const handleSelectCorrect = (optId: string) => {
    if (!multiple) {
      onChange({ options: data.options.map((o) => ({ ...o, isCorrect: o.id === optId })) } as Partial<T>);
      return;
    }
    const next = data.options.map((o) => (o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o));
    if (!next.some((o) => o.isCorrect)) {
      alert('Câu hỏi Check Box cần ít nhất 1 đáp án đúng.');
      return;
    }
    onChange({ options: next } as Partial<T>);
  };
  const addOption = () => {
    onChange({
      options: [...data.options, { id: generateQuizId('opt'), text: '', isCorrect: false }],
    } as Partial<T>);
  };
  const removeOption = (optId: string) => {
    if (data.options.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn.');
      return;
    }
    const next = data.options.filter((o) => o.id !== optId);
    if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
    onChange({ options: next } as Partial<T>);
  };

  return (
    <div className="space-y-2.5">
      <PromptField
        prompt={data.prompt}
        promptPlaceholder={
          multiple
            ? 'Câu hỏi trắc nghiệm nhiều đáp án đúng (Check Box)...'
            : 'Câu hỏi trắc nghiệm 1 đáp án...'
        }
        onChange={(updates) => onChange(updates as Partial<T>)}
      />

      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-600">Các phương án lựa chọn:</span>
        <span
          className={`px-2 py-0.5 rounded-full font-semibold border ${
            multiple
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {multiple
            ? `☑ Check Box: Đang chọn ${correctCount}/${data.options.length} đáp án đúng`
            : '◉ Radio: Chọn 1 đáp án đúng duy nhất'}
        </span>
      </div>

      <div className="space-y-2">
        {data.options.map((opt, idx) => {
          const isNoteOpen = expandedOptionNotes[opt.id] || Boolean(opt.explanation?.trim());
          const labelLetter = String.fromCharCode(65 + idx);

          return (
            <div key={opt.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center gap-1.5 cursor-pointer shrink-0"
                  title={multiple ? 'Tick chọn (nhiều đáp án đúng)' : 'Chọn đáp án đúng duy nhất'}
                >
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    name={multiple ? undefined : `correct_opt_${data.id}`}
                    checked={opt.isCorrect}
                    onChange={() => handleSelectCorrect(opt.id)}
                    className={`w-4 h-4 text-emerald-600 shrink-0 cursor-pointer ${
                      multiple ? 'rounded' : ''
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-500 w-4">{labelLetter}.</span>
                </label>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Nội dung lựa chọn ${labelLetter}...`}
                  className={smallInputCls}
                />
                <button
                  type="button"
                  onClick={() => toggleNote(opt.id)}
                  className={`text-[11px] px-2 py-1 rounded border transition-colors shrink-0 cursor-pointer ${
                    opt.explanation
                      ? 'border-amber-300 bg-amber-50 text-amber-800 font-medium'
                      : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Ghi chú giải thích cho đáp án này"
                >
                  {opt.explanation ? '💡 Có giải thích' : '💡 + Giải thích'}
                </button>
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
                  title="Xóa lựa chọn"
                >
                  ✕
                </button>
              </div>

              {isNoteOpen && (
                <OptionExplanationBox
                  labelLetter={labelLetter}
                  isCorrect={opt.isCorrect}
                  value={opt.explanation}
                  onChange={(val) => updateOptionExplanation(opt.id, val)}
                />
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-1.5 w-full cursor-pointer transition"
      >
        + Thêm lựa chọn
      </button>
      <CollapsibleExplanationField
        value={data.explanation}
        onChange={(explanation) => onChange({ explanation } as Partial<T>)}
      />
    </div>
  );
}

export function SingleChoiceEditor({
  data,
  onChange,
}: {
  data: SingleChoiceQuestion;
  onChange: OnChange<SingleChoiceQuestion>;
}) {
  return <ChoiceQuestionEditorBase data={data} multiple={false} onChange={onChange} />;
}

export function MultipleChoiceEditor({
  data,
  onChange,
}: {
  data: MultipleChoiceQuestion;
  onChange: OnChange<MultipleChoiceQuestion>;
}) {
  return <ChoiceQuestionEditorBase data={data} multiple={true} onChange={onChange} />;
}

export function TrueFalseEditor({
  data,
  onChange,
}: {
  data: TrueFalseQuestion;
  onChange: OnChange<TrueFalseQuestion>;
}) {
  return (
    <div className="space-y-2.5">
      <PromptField
        prompt={data.prompt}
        promptPlaceholder="Câu khẳng định cần đánh giá Đúng/Sai..."
        onChange={onChange}
      />
      <TrueFalseAnswerSelector
        compact
        value={data.correctAnswer}
        onChange={(correctAnswer) => onChange({ correctAnswer })}
      />
      <CollapsibleExplanationField
        value={data.explanation}
        onChange={(explanation) => onChange({ explanation })}
      />
    </div>
  );
}

export function OrderingEditor({
  data,
  onChange,
}: {
  data: OrderingQuestion;
  onChange: OnChange<OrderingQuestion>;
}) {
  return (
    <div className="space-y-2.5">
      <PromptField
        prompt={data.prompt}
        promptPlaceholder="Ví dụ: Sắp xếp các sự kiện sau theo đúng thứ tự thời gian..."
        onChange={onChange}
      />
      <TimelineOrderingItemsEditor
        compact
        items={data.items}
        onChange={(items) => onChange({ items, correctOrder: items.map((i) => i.id) })}
      />
      <CollapsibleExplanationField
        value={data.explanation}
        onChange={(explanation) => onChange({ explanation })}
      />
    </div>
  );
}

export function MatchingEditor({
  data,
  onChange,
}: {
  data: MatchingQuestion;
  onChange: OnChange<MatchingQuestion>;
}) {
  return (
    <div className="space-y-2.5">
      <PromptField
        prompt={data.prompt}
        promptPlaceholder="Ví dụ: Nối nhân vật lịch sử với vai trò tương ứng của họ..."
        onChange={onChange}
      />
      <MatchingPairsEditor
        compact
        leftItems={data.leftItems}
        rightItems={data.rightItems}
        correctPairs={data.correctPairs}
        onChange={(next) => onChange(next)}
      />
      <CollapsibleExplanationField
        value={data.explanation}
        onChange={(explanation) => onChange({ explanation })}
      />
    </div>
  );
}

export function FillInBlankEditor({
  data,
  onChange,
}: {
  data: FillInBlankQuestion;
  onChange: OnChange<FillInBlankQuestion>;
}) {
  const [draft, setDraft] = React.useState('');

  const addAnswer = () => {
    const trimmed = draft.trim();
    if (!trimmed || data.acceptedAnswers.includes(trimmed)) return;
    onChange({ acceptedAnswers: [...data.acceptedAnswers, trimmed] });
    setDraft('');
  };
  const removeAnswer = (ans: string) => {
    if (data.acceptedAnswers.length <= 1) {
      alert('Cần ít nhất 1 đáp án được chấp nhận.');
      return;
    }
    onChange({ acceptedAnswers: data.acceptedAnswers.filter((a) => a !== ans) });
  };

  return (
    <div className="space-y-2.5">
      <PromptField
        prompt={data.prompt}
        promptPlaceholder="Ví dụ: Chiến dịch Điện Biên Phủ toàn thắng vào năm ___."
        onChange={onChange}
      />
      <div className="flex flex-wrap gap-1.5">
        {data.acceptedAnswers.map((ans) => (
          <span
            key={ans}
            className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md"
          >
            {ans}
            <button type="button" onClick={() => removeAnswer(ans)} className="text-slate-400 hover:text-rose-600 cursor-pointer">✕</button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === KeyboardKey.ENTER) {
              e.preventDefault();
              addAnswer();
            }
          }}
          placeholder="Nhập 1 biến thể đáp án rồi Enter (ví dụ: 1954, năm 1954)..."
          className={smallInputCls}
        />
        <button type="button" onClick={addAnswer} className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1.5 cursor-pointer shrink-0">
          + Thêm
        </button>
      </div>
      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(data.caseSensitive)}
          onChange={(e) => onChange({ caseSensitive: e.target.checked })}
          className="w-3.5 h-3.5"
        />
        Phân biệt hoa/thường khi chấm
      </label>
      <CollapsibleExplanationField
        value={data.explanation}
        onChange={(explanation) => onChange({ explanation })}
      />
    </div>
  );
}

// --- Merged from AddQuestionMenu.tsx ---
interface AddQuestionMenuProps {
  onPick: (type: QuizQuestionType) => void;
}

/** Popover chọn 1 trong 5 dạng câu hỏi để thêm mới — cùng kiểu tương tác với Block Palette. */
export function AddQuestionMenu({ onPick }: AddQuestionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="primary-button !h-8 !text-xs !px-3 w-full justify-center"
      >
        <Icon name={IconName.PLUS} size={13} />
        <span>Thêm câu hỏi</span>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
          {Object.values(QuizQuestionType).map((type) => {
            const meta = QUIZ_QUESTION_TYPE_META[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onPick(type);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color.split(' ')[1]}`} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Merged from QuizQuestionCard.tsx ---
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
    case QuizQuestionType.SINGLE_CHOICE:
      return <SingleChoiceEditor data={question} onChange={onChange} />;
    case QuizQuestionType.MULTIPLE_CHOICE:
      return <MultipleChoiceEditor data={question} onChange={onChange} />;
    case QuizQuestionType.TRUE_FALSE:
      return <TrueFalseEditor data={question} onChange={onChange} />;
    case QuizQuestionType.ORDERING:
      return <OrderingEditor data={question} onChange={onChange} />;
    case QuizQuestionType.MATCHING:
      return <MatchingEditor data={question} onChange={onChange} />;
    case QuizQuestionType.FILL_IN_BLANK:
      return <FillInBlankEditor data={question} onChange={onChange} />;
    default:
      return null;
  }
}
