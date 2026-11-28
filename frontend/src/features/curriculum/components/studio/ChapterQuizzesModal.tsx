'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName, SortDirection } from '@/constants/enums';
import type { ChapterItem, ChapterQuizInputDto } from '@/services/entities/learner.service';
import type { StandaloneQuizItem } from '@/services/entities/quiz.service';

export const DEFAULT_CHAPTER_QUIZ_PASS_SCORE = 70;
const DISABLED_ARROW_CLASS = 'opacity-30 cursor-not-allowed';

interface ChapterQuizSelectionEditorProps {
  availableQuizzes: StandaloneQuizItem[];
  selectedItems: ChapterQuizInputDto[];
  onChange: (nextItems: ChapterQuizInputDto[]) => void;
}

/**
 * Bộ chọn & cấu hình nhiều Đề kiểm tra cho Chương (dùng chung cho cả Tạo chương mới & Quản lý đề của chương đã có).
 */
export function ChapterQuizSelectionEditor({
  availableQuizzes,
  selectedItems,
  onChange,
}: ChapterQuizSelectionEditorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const quizMap = useMemo(
    () => new Map(availableQuizzes.map((q) => [q.id, q])),
    [availableQuizzes],
  );

  const selectedSet = useMemo(
    () => new Set(selectedItems.map((i) => i.quizId)),
    [selectedItems],
  );

  const filteredQuizzes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return availableQuizzes;
    return availableQuizzes.filter((q) =>
      (q.title || '').toLowerCase().includes(keyword),
    );
  }, [availableQuizzes, searchTerm]);

  const toggleQuiz = (quiz: StandaloneQuizItem) => {
    if (selectedSet.has(quiz.id)) {
      onChange(selectedItems.filter((i) => i.quizId !== quiz.id));
    } else {
      onChange([
        ...selectedItems,
        {
          quizId: quiz.id,
          passScore: quiz.passingScorePercent ?? DEFAULT_CHAPTER_QUIZ_PASS_SCORE,
          isRequired: true,
        },
      ]);
    }
  };

  const moveItem = (idx: number, direction: SortDirection) => {
    const targetIdx = direction === SortDirection.UP ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedItems.length) return;
    const copy = [...selectedItems];
    [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
    onChange(copy);
  };

  const updateItem = (idx: number, patch: Partial<ChapterQuizInputDto>) => {
    const copy = [...selectedItems];
    copy[idx] = { ...copy[idx], ...patch };
    onChange(copy);
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-slate-800">
            Đề kiểm tra của chương ({selectedItems.length} đề)
          </span>
          <p className="text-[11px] text-slate-500">
            Gắn 1 đề kiểm tra cuối chương (THPT 10–11–12) hoặc nhiều đề luyện thực chiến (ĐGNL).
          </p>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {selectedItems.map((item, idx) => {
            const quiz = quizMap.get(item.quizId);
            const title = quiz?.title || `Đề #${item.quizId.slice(0, 8)}`;
            const questionCount = quiz?.questionCount ?? 0;

            return (
              <div
                key={item.quizId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white p-2 px-2.5"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 text-center font-mono text-xs font-bold text-amber-700 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-900">
                      {title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {questionCount} câu · {quiz?.timeLimitMinutes ?? 15} phút
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isRequired !== false}
                      onChange={(e) =>
                        updateItem(idx, { isRequired: e.target.checked })
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                    />
                    <span>Bắt buộc</span>
                  </label>

                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                    <span>Đạt:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      aria-label={`Điểm đạt cho ${title}`}
                      value={item.passScore ?? DEFAULT_CHAPTER_QUIZ_PASS_SCORE}
                      onChange={(e) =>
                        updateItem(idx, {
                          passScore: Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 0),
                          ),
                        })
                      }
                      className="form-input !h-7 !w-14 !px-1.5 !text-xs bg-white text-center"
                    />
                    <span>%</span>
                  </label>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, SortDirection.UP)}
                      className={`p-1 rounded text-slate-500 hover:bg-slate-100 ${
                        idx === 0 ? DISABLED_ARROW_CLASS : ''
                      }`}
                      title="Chuyển lên"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedItems.length - 1}
                      onClick={() => moveItem(idx, SortDirection.DOWN)}
                      className={`p-1 rounded text-slate-500 hover:bg-slate-100 ${
                        idx === selectedItems.length - 1
                          ? DISABLED_ARROW_CLASS
                          : ''
                      }`}
                      title="Chuyển xuống"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(
                          selectedItems.filter((i) => i.quizId !== item.quizId),
                        )
                      }
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Gỡ đề khỏi chương"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Tìm đề trong Ngân hàng đề thi để gắn vào chương..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input !h-8 !text-xs !pl-8 w-full bg-white"
        />
        <span className="absolute left-2.5 top-2 text-slate-400">
          <Icon name={IconName.SEARCH} size={13} />
        </span>
      </div>

      <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {filteredQuizzes.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">
            Không tìm thấy đề thi phù hợp trong Ngân hàng đề.
          </div>
        ) : (
          filteredQuizzes.map((quiz) => {
            const checked = selectedSet.has(quiz.id);
            return (
              <label
                key={quiz.id}
                className={`flex items-center justify-between p-2 px-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                  checked ? 'bg-amber-50/60' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleQuiz(quiz)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 shrink-0"
                  />
                  <span className="truncate text-xs font-semibold text-slate-900">
                    {quiz.title || 'Đề không tiêu đề'}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-slate-500 ml-2">
                  {quiz.questionCount ?? 0} câu · đạt{' '}
                  {quiz.passingScorePercent ?? DEFAULT_CHAPTER_QUIZ_PASS_SCORE}%
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ManageChapterQuizzesModalProps {
  isOpen: boolean;
  chapter: ChapterItem | null;
  availableQuizzes: StandaloneQuizItem[];
  selectedItems: ChapterQuizInputDto[];
  onChangeSelectedItems: (items: ChapterQuizInputDto[]) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function ManageChapterQuizzesModal({
  isOpen,
  chapter,
  availableQuizzes,
  selectedItems,
  onChangeSelectedItems,
  onClose,
  onConfirm,
  loading,
}: ManageChapterQuizzesModalProps) {
  if (!isOpen || !chapter) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col space-y-4 rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quản lý Đề kiểm tra của Chương
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Chương: <strong>{chapter.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <ChapterQuizSelectionEditor
            availableQuizzes={availableQuizzes}
            selectedItems={selectedItems}
            onChange={onChangeSelectedItems}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-xs text-slate-500">
            Đang gắn: <strong>{selectedItems.length}</strong> đề kiểm tra
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button !h-8 !px-3 !text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              id="btn-confirm-chapter-quizzes"
              disabled={loading}
              onClick={onConfirm}
              className="primary-button !h-8 !px-4 !text-xs"
            >
              {loading ? 'Đang lưu...' : 'Lưu cấu trúc đề kiểm tra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
