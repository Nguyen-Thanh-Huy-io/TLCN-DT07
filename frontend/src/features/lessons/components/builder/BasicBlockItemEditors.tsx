'use client';

import React, { useState } from 'react';
import { Database, HelpCircle } from 'lucide-react';
import { QuestionBankPickerModal } from '@/features/quiz/components/QuestionBankPickerModal';
import { AddQuestionMenu, MoveDirection, QuizQuestionCard } from '../quiz/QuizQuestionEditors';
import { createDefaultQuestion, type QuizQuestion, type QuizQuestionType } from '../../types/editor.types';
import {
  LESSON_QUIZ_DEFAULT_TITLE,
  LESSON_QUIZ_MAX_QUESTIONS,
  copyBankQuestion,
  quizBlockQuestions,
} from '../../utils/lesson-quiz.util';
import { TipTapContent } from '../TipTapContent';
import {
  MapBlockData,
  QuoteBlockData,
  ComparisonTableBlockData,
  ComparisonTableRow,
  type LessonQuizQuestion,
  type QuizBlockData,
} from '../../types/block-builder.types';
export { CalloutBlockItemEditor } from './CalloutBlockItemEditor';

// --- TextBlockEditor.tsx ---
interface TextBlockEditorProps {
  content: string;
  onChange: (val: string) => void;
}

/**
 * Khối soạn thảo Văn bản (Rich Text Block) trên Canvas:
 * Giao diện tối giản, tập trung 100% vào nội dung (Distraction-free).
 * Toàn bộ công cụ định dạng Typography được điều khiển từ Cột Phải (Property Inspector).
 */
export function TextBlockEditor({ content, onChange }: TextBlockEditorProps) {
  return (
    <div className="w-full relative group/text-block" data-testid="text-block-editor">
      <TipTapContent
        value={content}
        onChange={onChange}
        compact={true}
        remoteToolbarOnly={true}
        placeholder="Nhập nội dung lịch sử tại đây..."
      />
    </div>
  );
}

// --- MapBlockItemEditor.tsx ---
interface MapBlockItemEditorProps {
  data: MapBlockData;
  onChange: (updates: Partial<MapBlockData>) => void;
}

/**
 * Editor cho khối "Bản đồ" — mô tả địa bàn/địa điểm lịch sử gắn với bài học.
 * Hiện chỉ lưu tên địa danh + mô tả dạng text (chưa tích hợp bản đồ tương tác thật),
 * đủ để hiển thị dạng chú dẫn (xem `LessonBlockRegistry.blockToHtml` case MAP).
 */
export function MapBlockItemEditor({ data, onChange }: MapBlockItemEditorProps) {
  return (
    <div className="space-y-2" data-testid="map-block-editor">
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Tên địa danh
        </label>
        <input
          type="text"
          value={data.locationName}
          onChange={(e) => onChange({ locationName: e.target.value })}
          placeholder="Ví dụ: Lòng chảo Điện Biên Phủ..."
          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Mô tả địa bàn
        </label>
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả vị trí địa lý, vai trò chiến lược, đặc điểm địa hình..."
          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}

// --- QuoteBlockItemEditor.tsx ---
interface QuoteBlockItemEditorProps {
  data: QuoteBlockData;
  onChange: (updates: Partial<QuoteBlockData>) => void;
}

export function QuoteBlockItemEditor({ data, onChange }: QuoteBlockItemEditorProps) {
  return (
    <div className="@container min-w-0 p-3 @[360px]:p-5 rounded-xl border border-slate-200 bg-white relative space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <span className="text-base leading-none text-amber-700">“</span>
          <span>Khối trích dẫn lịch sử (Quote)</span>
        </span>
        <span className="text-[11px] text-slate-500 font-serif italic">
          Lời hịch, sấm truyền, danh ngôn
        </span>
      </div>

      {/* Nội dung câu trích dẫn */}
      <div className="relative pl-3 border-l-4 border-amber-600">
        <textarea
          rows={3}
          value={data.quoteText}
          onChange={(e) => onChange({ quoteText: e.target.value })}
          placeholder="Nhập câu danh ngôn, lời thề, tuyên ngôn lịch sử... (Ví dụ: Đầu tôi chưa rơi xuống đất, xin bệ hạ đừng lo...)"
          className="w-full text-xs sm:text-sm font-serif italic p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 leading-relaxed shadow-2xs"
        />
      </div>

      {/* Người phát ngôn & Bối cảnh */}
      <div className="grid grid-cols-1 @[360px]:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Nhân vật / Tác giả phát ngôn <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.author}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="Ví dụ: Thái sư Trần Thủ Độ, Lý Thường Kiệt..."
            className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Bối cảnh / Thời điểm / Tác phẩm
          </label>
          <input
            type="text"
            value={data.sourceContext || ''}
            onChange={(e) => onChange({ sourceContext: e.target.value })}
            placeholder="Ví dụ: Kháng chiến chống Nguyên Mông lần thứ nhất (1258)..."
            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}

// --- ComparisonTableBlockItemEditor.tsx ---
interface ComparisonTableBlockItemEditorProps {
  data: ComparisonTableBlockData;
  onChange: (updates: Partial<ComparisonTableBlockData>) => void;
}

/**
 * Editor cho khối "Bảng so sánh" — so sánh 2 đối tượng/phe/giai đoạn theo từng tiêu chí.
 * Cho phép đổi tên 2 cột, thêm/xóa/sửa từng dòng tiêu chí.
 */
export function ComparisonTableBlockItemEditor({ data, onChange }: ComparisonTableBlockItemEditorProps) {
  const updateRow = (idx: number, updates: Partial<ComparisonTableRow>) => {
    const rows = data.rows.map((row, i) => (i === idx ? { ...row, ...updates } : row));
    onChange({ rows });
  };

  const addRow = () => {
    onChange({
      rows: [...data.rows, { criteria: 'Tiêu chí mới', colA: '', colB: '' }],
    });
  };

  const removeRow = (idx: number) => {
    if (data.rows.length <= 1) {
      alert('Bảng so sánh cần có ít nhất một dòng tiêu chí.');
      return;
    }
    onChange({ rows: data.rows.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-2.5" data-testid="comparison-table-block-editor">
      <input
        type="text"
        value={data.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Tiêu đề bảng so sánh (tùy chọn)..."
        className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={data.colAName}
          onChange={(e) => onChange({ colAName: e.target.value })}
          placeholder="Tên cột A..."
          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={data.colBName}
          onChange={(e) => onChange({ colBName: e.target.value })}
          placeholder="Tên cột B..."
          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {data.rows.map((row, idx) => (
          <div
            key={idx}
            data-testid={`comparison-row-${idx}`}
            className="p-2 bg-white border border-slate-200 rounded-lg space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={row.criteria}
                onChange={(e) => updateRow(idx, { criteria: e.target.value })}
                placeholder="Tiêu chí..."
                className="flex-1 min-w-0 text-xs font-semibold p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                title="Xóa dòng"
                className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={row.colA}
                onChange={(e) => updateRow(idx, { colA: e.target.value })}
                placeholder="Nội dung cột A..."
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <input
                type="text"
                value={row.colB}
                onChange={(e) => updateRow(idx, { colB: e.target.value })}
                placeholder="Nội dung cột B..."
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-1.5 cursor-pointer transition"
      >
        + Thêm dòng tiêu chí
      </button>
    </div>
  );
}

// === Merged from QuizBlockEditor.tsx ===
export interface QuizBlockEditorProps {
  data: QuizBlockData;
  onChange: (updates: Partial<QuizBlockData>) => void;
  topicId?: string;
}

export function QuizBlockEditor({ data, onChange, topicId }: QuizBlockEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const questions = quizBlockQuestions(data);
  const remaining = LESSON_QUIZ_MAX_QUESTIONS - questions.length;

  const saveQuestions = (next: LessonQuizQuestion[]) =>
    onChange({ questions: next, question: undefined, options: undefined, explanation: undefined });

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) =>
    saveQuestions(questions.map((q, i) => (i === index ? ({ ...q, ...updates } as LessonQuizQuestion) : q)));

  const moveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    const target = direction === MoveDirection.UP ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    saveQuestions(next);
  };

  const addQuestion = (type: QuizQuestionType) => {
    if (remaining <= 0) return;
    saveQuestions([...questions, createDefaultQuestion(type)]);
  };

  const pickFromBank = (picked: QuizQuestion[]) => {
    const taken = picked.slice(0, Math.max(remaining, 0));
    saveQuestions([...questions, ...taken.map(copyBankQuestion)]);
    setNotice(
      taken.length < picked.length
        ? `Chỉ thêm ${taken.length}/${picked.length} câu — mỗi khối Ôn tập tối đa ${LESSON_QUIZ_MAX_QUESTIONS} câu.`
        : null,
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <HelpCircle size={16} className="shrink-0 text-amber-700" />
        <input
          value={data.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={LESSON_QUIZ_DEFAULT_TITLE}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400"
        />
        <span className="shrink-0 text-xs text-slate-500">
          {questions.length}/{LESSON_QUIZ_MAX_QUESTIONS} câu
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Người học tự làm và bấm &quot;Kiểm tra&quot; để xem đúng/sai và giải thích — không chấm điểm, không lưu kết quả.
      </p>

      {questions.length === 0 && (
        <p className="rounded-lg border border-dashed border-amber-300 bg-white p-4 text-center text-xs text-slate-500">
          Khối chưa có câu hỏi nào.
        </p>
      )}
      {questions.map((question, index) => (
        <QuizQuestionCard
          key={question.id}
          index={index}
          total={questions.length}
          question={question}
          onChange={(updates) => updateQuestion(index, updates)}
          onRemove={() => saveQuestions(questions.filter((_, i) => i !== index))}
          onMove={(direction) => moveQuestion(index, direction)}
        />
      ))}

      {notice && <p className="text-xs font-medium text-amber-800">{notice}</p>}

      {remaining > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <AddQuestionMenu onPick={addQuestion} />
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Database size={13} /> Lấy từ Ngân hàng
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Đã đủ {LESSON_QUIZ_MAX_QUESTIONS} câu. Cần nhiều câu hơn thì thêm khối Ôn tập khác hoặc tạo Đề thi theo chủ đề.
        </p>
      )}

      <QuestionBankPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onPick={pickFromBank}
        alreadySelectedIds={questions.flatMap((q) => (q.sourceQuestionId ? [q.sourceQuestionId] : []))}
        topicId={topicId}
      />
    </div>
  );
}
