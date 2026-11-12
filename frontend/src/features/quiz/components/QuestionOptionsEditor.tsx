'use client';

import React from 'react';
import {
  GripVertical,
  Check,
  CircleDot,
  CheckSquare,
  X,
  Plus,
  Lightbulb,
} from 'lucide-react';
import { QuizQuestionType } from '@/features/lessons/types/quiz.types';
import { OptionExplanationBox } from '@/components/common/CollapsibleExplanationField';
import { OptionItemState } from './question-modal.helper';

interface QuestionOptionsEditorProps {
  type: QuizQuestionType;
  options: OptionItemState[];
  expandedNotes: Record<string, boolean>;
  onToggleOptionCorrect: (optId: string) => void;
  onUpdateOptionText: (optId: string, text: string) => void;
  onUpdateOptionExplanation: (optId: string, explanation: string) => void;
  onToggleOptionNote: (optId: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optId: string) => void;
}

export function QuestionOptionsEditor({
  type,
  options,
  expandedNotes,
  onToggleOptionCorrect,
  onUpdateOptionText,
  onUpdateOptionExplanation,
  onToggleOptionNote,
  onAddOption,
  onRemoveOption,
}: QuestionOptionsEditorProps) {
  const isMultiple = type === QuizQuestionType.MULTIPLE_CHOICE;
  const correctCount = options.filter((o) => o.isCorrect).length;

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-bold text-slate-800">
            Các phương án lựa chọn <span className="text-blue-600 font-normal">(Options)</span>
          </label>
          {isMultiple ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <CheckSquare size={12} />
              <span>
                Chế độ Check Box: Đang chọn {correctCount}/{options.length} đáp án đúng
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CircleDot size={12} />
              <span>Chế độ Radio: 1 đáp án đúng duy nhất</span>
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {isMultiple ? (
            <>
              Tích chọn ô <strong>Correct</strong> tại <strong>một hoặc nhiều</strong> phương án đúng
            </>
          ) : (
            <>
              Tích chọn ô <strong>Correct</strong> tại phương án đúng duy nhất
            </>
          )}
        </span>
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const labelLetter = String.fromCharCode(65 + idx);
          const isNoteOpen = expandedNotes[opt.id];

          return (
            <div
              key={opt.id}
              className={`p-2.5 rounded-xl border transition-all ${
                opt.isCorrect
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-slate-400 cursor-grab hover:text-slate-600 shrink-0">
                  <GripVertical size={15} />
                </span>

                <button
                  type="button"
                  onClick={() => onToggleOptionCorrect(opt.id)}
                  className="cursor-pointer shrink-0 border-0 bg-transparent p-0"
                >
                  {isMultiple ? (
                    opt.isCorrect ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-slate-300 block hover:border-blue-500" />
                    )
                  ) : opt.isCorrect ? (
                    <CircleDot size={16} className="text-blue-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 block hover:border-blue-500" />
                  )}
                </button>

                <span className="text-xs font-bold text-slate-500 w-4 shrink-0">
                  {labelLetter}.
                </span>

                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => onUpdateOptionText(opt.id, e.target.value)}
                  placeholder={`Nội dung lựa chọn ${labelLetter}...`}
                  className="flex-1 text-xs sm:text-sm p-1 bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => onToggleOptionNote(opt.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                    opt.explanation
                      ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold'
                      : isNoteOpen
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  title="Ghi chú giải thích vì sao đáp án này đúng hoặc sai"
                >
                  <Lightbulb
                    size={12}
                    className={opt.explanation ? 'text-amber-600' : 'text-slate-400'}
                  />
                  <span>{opt.explanation ? 'Có giải thích' : '+ Giải thích'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleOptionCorrect(opt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                    opt.isCorrect
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {opt.isCorrect ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    <span className="w-3 h-3 rounded-xs border border-slate-300" />
                  )}
                  <span>Correct</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveOption(opt.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Xóa lựa chọn này"
                >
                  <X size={15} />
                </button>
              </div>

              {isNoteOpen && (
                <OptionExplanationBox
                  labelLetter={labelLetter}
                  isCorrect={opt.isCorrect}
                  value={opt.explanation}
                  onChange={(val) => onUpdateOptionExplanation(opt.id, val)}
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddOption}
        className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
      >
        <Plus size={14} />
        <span>Thêm phương án lựa chọn (Add Option)</span>
      </button>
    </div>
  );
}
