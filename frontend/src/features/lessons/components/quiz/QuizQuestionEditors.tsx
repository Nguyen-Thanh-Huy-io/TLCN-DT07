'use client';
import { KeyboardKey } from '@/constants/enums';

import React from 'react';
import {
  FillInBlankQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  QuizQuestion,
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
  const updateSide = (side: MatchingSide | 'leftItems' | 'rightItems', itemId: string, label: string) => {
    onChange({ [side]: data[side].map((i) => (i.id === itemId ? { ...i, label } : i)) } as any);
  };
  const addSideItem = (side: MatchingSide | 'leftItems' | 'rightItems') => {
    onChange({ [side]: [...data[side], { id: generateQuizId(side === MatchingSide.LEFT ? 'l' : 'r'), label: '' }] } as any);
  };
  const removeSideItem = (side: MatchingSide | 'leftItems' | 'rightItems', itemId: string) => {
    const next = data[side].filter((i) => i.id !== itemId);
    const pairKey = side === MatchingSide.LEFT ? 'leftId' : 'rightId';
    onChange({
      [side]: next,
      correctPairs: data.correctPairs.filter((p) => p[pairKey] !== itemId),
    } as any);
  };
  const updatePairRight = (leftId: string, rightId: string) => {
    const existing = data.correctPairs.filter((p) => p.leftId !== leftId);
    onChange({ correctPairs: [...existing, { leftId, rightId }] });
  };

  return (
    <div className="space-y-2.5">
      <PromptField
        prompt={data.prompt}
        promptPlaceholder="Ví dụ: Nối nhân vật với vai trò của họ..."
        onChange={onChange}
      />
      <div className="grid grid-cols-2 gap-2">
        {([MatchingSide.LEFT, MatchingSide.RIGHT] as const).map((side) => (
          <div key={side} className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              {side === MatchingSide.LEFT ? 'Bên trái' : 'Bên phải'}
            </span>
            {data[side].map((item) => (
              <div key={item.id} className="flex items-center gap-1">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateSide(side, item.id, e.target.value)}
                  placeholder="Nội dung..."
                  className={smallInputCls}
                />
                <button type="button" onClick={() => removeSideItem(side, item.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0">✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSideItem(side)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 rounded-md py-1 w-full cursor-pointer"
            >
              + Thêm
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <span className="text-[11px] font-semibold text-slate-500">Cặp nối đúng</span>
        {data.leftItems.map((left) => {
          const pair = data.correctPairs.find((p) => p.leftId === left.id);
          return (
            <div key={left.id} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate text-slate-700">{left.label || '(chưa đặt tên)'}</span>
              <span className="text-slate-300">↔</span>
              <select
                value={pair?.rightId || ''}
                onChange={(e) => updatePairRight(left.id, e.target.value)}
                className="flex-1 text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>-- chọn --</option>
                {data.rightItems.map((r) => (
                  <option key={r.id} value={r.id}>{r.label || '(chưa đặt tên)'}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
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
