'use client';
import { KeyboardKey } from '@/constants/enums';

import React from 'react';
import {
  FillInBlankQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  QuizQuestion,
  TrueFalseQuestion,
} from '../../types/quiz.types';
import { generateQuizId } from '../../factories/quiz-question.factory';

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

/** Khung chung: câu dẫn + giải thích đáp án (dùng cho mọi dạng câu hỏi) */
function PromptAndExplanation({
  prompt,
  explanation,
  promptPlaceholder,
  onChange,
}: {
  prompt: string;
  explanation?: string;
  promptPlaceholder: string;
  onChange: (updates: { prompt?: string; explanation?: string }) => void;
}) {
  return (
    <>
      <textarea
        rows={2}
        value={prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder={promptPlaceholder}
        className={`${inputCls} resize-none font-medium`}
      />
      <input
        type="text"
        value={explanation || ''}
        onChange={(e) => onChange({ explanation: e.target.value })}
        placeholder="Giải thích đáp án (tùy chọn, hiện sau khi học sinh trả lời)..."
        className={`${inputCls} text-slate-500`}
      />
    </>
  );
}

export function MultipleChoiceEditor({
  data,
  onChange,
}: {
  data: MultipleChoiceQuestion;
  onChange: OnChange<MultipleChoiceQuestion>;
}) {
  const updateOption = (optId: string, text: string) => {
    onChange({ options: data.options.map((o) => (o.id === optId ? { ...o, text } : o)) });
  };
  const setCorrect = (optId: string) => {
    onChange({ options: data.options.map((o) => ({ ...o, isCorrect: o.id === optId })) });
  };
  const addOption = () => {
    onChange({ options: [...data.options, { id: generateQuizId('opt'), text: '', isCorrect: false }] });
  };
  const removeOption = (optId: string) => {
    if (data.options.length <= 2) {
      alert('Trắc nghiệm cần ít nhất 2 lựa chọn.');
      return;
    }
    const next = data.options.filter((o) => o.id !== optId);
    if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
    onChange({ options: next });
  };

  return (
    <div className="space-y-2">
      <PromptAndExplanation
        prompt={data.prompt}
        explanation={data.explanation}
        promptPlaceholder="Câu hỏi trắc nghiệm..."
        onChange={onChange}
      />
      <div className="space-y-1.5">
        {data.options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio"
              checked={opt.isCorrect}
              onChange={() => setCorrect(opt.id)}
              title="Đánh dấu là đáp án đúng"
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
            />
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              placeholder="Nội dung lựa chọn..."
              className={smallInputCls}
            />
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
              title="Xóa lựa chọn"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-1.5 w-full cursor-pointer transition"
      >
        + Thêm lựa chọn
      </button>
    </div>
  );
}

export function TrueFalseEditor({
  data,
  onChange,
}: {
  data: TrueFalseQuestion;
  onChange: OnChange<TrueFalseQuestion>;
}) {
  return (
    <div className="space-y-2">
      <PromptAndExplanation
        prompt={data.prompt}
        explanation={data.explanation}
        promptPlaceholder="Câu khẳng định cần đánh giá Đúng/Sai..."
        onChange={onChange}
      />
      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold w-fit">
        <button
          type="button"
          onClick={() => onChange({ correctAnswer: true })}
          className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
            data.correctAnswer ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đúng
        </button>
        <button
          type="button"
          onClick={() => onChange({ correctAnswer: false })}
          className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
            !data.correctAnswer ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sai
        </button>
      </div>
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
  // `correctOrder` luôn chính là thứ tự hiện tại của `items` — tác giả sắp mốc theo
  // đúng thứ tự thời gian thật bằng nút ▲▼, không cần nhập riêng "đáp án đúng".
  const setItemsAndOrder = (items: OrderingQuestion['items']) => {
    onChange({ items, correctOrder: items.map((i) => i.id) });
  };
  const updateLabel = (itemId: string, label: string) => {
    setItemsAndOrder(data.items.map((i) => (i.id === itemId ? { ...i, label } : i)));
  };
  const moveItem = (idx: number, dir: MoveDirection | 'UP' | 'DOWN') => {
    const target = dir === MoveDirection.UP ? idx - 1 : idx + 1;
    if (target < 0 || target >= data.items.length) return;
    const copy = [...data.items];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setItemsAndOrder(copy);
  };
  const addItem = () => setItemsAndOrder([...data.items, { id: generateQuizId('item'), label: '' }]);
  const removeItem = (itemId: string) => {
    if (data.items.length <= 2) {
      alert('Cần ít nhất 2 mốc để sắp xếp.');
      return;
    }
    setItemsAndOrder(data.items.filter((i) => i.id !== itemId));
  };

  return (
    <div className="space-y-2">
      <PromptAndExplanation
        prompt={data.prompt}
        explanation={data.explanation}
        promptPlaceholder="Ví dụ: Sắp xếp các sự kiện sau theo đúng thứ tự thời gian..."
        onChange={onChange}
      />
      <p className="text-[11px] text-slate-400">
        Nhập các mốc theo đúng thứ tự thời gian thật — hệ thống sẽ xáo trộn khi hiển thị cho học sinh.
      </p>
      <div className="space-y-1.5">
        {data.items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center shrink-0">
              {idx + 1}
            </span>
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateLabel(item.id, e.target.value)}
              placeholder="Nội dung mốc sự kiện..."
              className={smallInputCls}
            />
            <button type="button" onClick={() => moveItem(idx, 'UP')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer">▲</button>
            <button type="button" onClick={() => moveItem(idx, 'DOWN')} disabled={idx === data.items.length - 1} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer">▼</button>
            <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">✕</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-1.5 w-full cursor-pointer transition"
      >
        + Thêm mốc
      </button>
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
    <div className="space-y-2">
      <PromptAndExplanation
        prompt={data.prompt}
        explanation={data.explanation}
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
    <div className="space-y-2">
      <PromptAndExplanation
        prompt={data.prompt}
        explanation={data.explanation}
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
    </div>
  );
}
