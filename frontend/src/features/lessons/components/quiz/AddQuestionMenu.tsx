'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { QUIZ_QUESTION_TYPE_META, QuizQuestionType } from '../../types/quiz.types';

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
