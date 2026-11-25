'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';
import { ConfirmDialog } from '@/components/common/CommonUi';
import { QUIZ_QUESTION_TYPE_META, QuizQuestionType, OrderingItem, generateQuizId } from '@/features/lessons/types/editor.types';
import { CreateQuestionPayload, QuestionApiService, QuestionBankItem } from '@/services/entities/quiz.service';
import { TopicItem } from '@/types/models';
import { TopicApiService } from '@/services/entities/topic.service';
import { CollapsibleExplanationField } from '@/components/common/EmojiPickerButton';
import { MatchingPairsValue } from '@/components/common/MatchingPairsEditor';
import { OptionItemState, QuestionDifficulty, createDefaultMatchingPairs, createDefaultOptions, createDefaultOrderingItems, validateQuestionForm, buildQuestionData, parseInitialQuestionState } from './question-modal.helper';
import { QuestionTypeCardSelector, QuestionCategorySection, TopicCategoryModalPicker, QuestionAnswersSection, QuestionModalHeader, QuestionModalFooter } from './QuestionBankModalParts';
import { QuestionTopicMode } from '../utils/practice-quiz.helper';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: QuestionBankItem) => void;
  initialQuestion?: QuestionBankItem | null;
  /** Chủ đề gắn sẵn cho câu tạo mới từ ngữ cảnh đề thi hoặc bài học. */
  defaultTopicIds?: string[];
  /** Ngữ cảnh hiển thị trường chủ đề: ngân hàng độc lập hay kế thừa từ đề/bài. */
  topicMode?: QuestionTopicMode;
}

export function QuestionBankModal({
  isOpen,
  onClose,
  onSuccess,
  initialQuestion,
  defaultTopicIds,
  topicMode = QuestionTopicMode.BANK,
}: QuestionBankModalProps) {
  const [type, setType] = useState<QuizQuestionType>(QuizQuestionType.SINGLE_CHOICE);
  const [prompt, setPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [points, setPoints] = useState<number>(1);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [topicsList, setTopicsList] = useState<TopicItem[]>([]);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [options, setOptions] = useState<OptionItemState[]>(createDefaultOptions);
  const [correctAnswer, setCorrectAnswer] = useState<boolean>(true);
  const [orderingItems, setOrderingItems] = useState<OrderingItem[]>(createDefaultOrderingItems);
  const [matchingPairsValue, setMatchingPairsValue] = useState<MatchingPairsValue>(
    createDefaultMatchingPairs
  );
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    TopicApiService.getTopics({ limit: 100 })
      .then((topicRes) => {
        if (isMounted && topicRes?.items) setTopicsList(topicRes.items);
      })
      .catch((err) => console.warn('Không thể tải danh sách chủ đề:', err));

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = Promise.resolve().then(() => {
      const parsed = parseInitialQuestionState(initialQuestion);
      setType(parsed.type);
      setPrompt(parsed.prompt);
      setExplanation(parsed.explanation);
      setDifficulty(parsed.difficulty);
      setPoints(parsed.points);
      setTopicIds(initialQuestion ? parsed.topicIds : (defaultTopicIds ?? []));
      setCorrectAnswer(parsed.correctAnswer);
      setOrderingItems(parsed.orderingItems);
      setMatchingPairsValue(parsed.matchingPairsValue);
      setOptions(parsed.options);
      setExpandedNotes(parsed.expandedNotes);
      setErrorMsg('');
      setNoticeMsg('');
    });

    return () => {
      void timer;
    };
  }, [initialQuestion, isOpen, defaultTopicIds]);

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const isDirty = Boolean(
    initialQuestion
      ? prompt !== (initialQuestion.prompt || '') || explanation !== (initialQuestion.explanation || '')
      : prompt.replace(/<[^>]*>/g, '').trim() ||
          explanation.trim() ||
          options.some((o) => o.text.trim()) ||
          orderingItems.some((item) => item.label.trim()) ||
          matchingPairsValue.leftItems.some((item) => item.label.trim()) ||
          matchingPairsValue.rightItems.some((item) => item.label.trim())
  );

  const handleRequestClose = useCallback(() => {
    if (submitting) return;
    if (isDirty) {
      setCloseConfirmOpen(true);
      return;
    }
    onClose();
  }, [isDirty, submitting, onClose]);

  useEffect(() => {
    if (!isOpen || isTopicModalOpen || closeConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleRequestClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isTopicModalOpen, closeConfirmOpen, handleRequestClose]);

  if (!isOpen) return null;

  const handleSelectType = (targetType: QuizQuestionType, isReady: boolean) => {
    if (!isReady) {
      setNoticeMsg(
        `Dạng câu hỏi "${QUIZ_QUESTION_TYPE_META[targetType]?.label || targetType}" hiện chưa được hỗ trợ.`
      );
      return;
    }
    setNoticeMsg('');
    setType(targetType);

    if (targetType === QuizQuestionType.SINGLE_CHOICE) {
      setOptions((prev) => {
        const firstCorrectIdx = prev.findIndex((o) => o.isCorrect);
        const keepIdx = firstCorrectIdx >= 0 ? firstCorrectIdx : 0;
        return prev.map((o, idx) => ({ ...o, isCorrect: idx === keepIdx }));
      });
    }
  };

  const handleToggleOptionCorrect = (optId: string) => {
    if (type === QuizQuestionType.MULTIPLE_CHOICE) {
      setOptions((prev) =>
        prev.map((o) => (o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o))
      );
    } else {
      setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === optId })));
    }
  };

  const handleRemoveOption = (optId: string) => {
    if (options.length <= 2) {
      setErrorMsg('Câu hỏi trắc nghiệm cần tối thiểu 2 lựa chọn.');
      return;
    }
    const next = options.filter((o) => o.id !== optId);
    if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
    setOptions(next);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const validationError = validateQuestionForm(
      type,
      prompt,
      options,
      orderingItems,
      matchingPairsValue
    );
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const questionData = buildQuestionData(
        type,
        options,
        correctAnswer,
        orderingItems,
        matchingPairsValue
      );

      const payload: CreateQuestionPayload = {
        type,
        prompt: prompt.trim(),
        explanation: explanation.trim() || undefined,
        difficulty,
        points: Number(points) > 0 ? Number(points) : 1,
        topicIds,
        data: questionData,
      };

      const saved = initialQuestion?.id
        ? await QuestionApiService.updateQuestion(initialQuestion.id, payload)
        : await QuestionApiService.createQuestion(payload);

      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      console.error('Lỗi lưu câu hỏi:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Không thể lưu câu hỏi. Vui lòng kiểm tra lại dữ liệu và thử lại.');
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={handleRequestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initialQuestion ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isMaximized
            ? 'fixed inset-2 z-50 rounded-2xl max-h-[calc(100vh-16px)]'
            : 'w-full max-w-5xl lg:max-w-6xl max-h-[94vh] rounded-2xl'
        }`}
      >
        <QuestionModalHeader
          isEdit={Boolean(initialQuestion)}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(!isMaximized)}
          onClose={handleRequestClose}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {errorMsg && (
            <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {noticeMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="text-amber-600 font-bold">ℹ</span>
              <span>{noticeMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 min-w-0">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Loại câu hỏi
              </label>
              <QuestionTypeCardSelector
                currentType={type}
                onSelectType={handleSelectType}
              />
            </div>

            <QuestionCategorySection
              points={points}
              onChangePoints={setPoints}
              topicIds={topicIds}
              topicsList={topicsList}
              onOpenTopicModal={() => setIsTopicModalOpen(true)}
              onRemoveTopic={(id) => setTopicIds((prev) => prev.filter((item) => item !== id))}
              topicMode={topicMode}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                Nội dung câu hỏi <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">Độ khó:</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="text-[11px] font-semibold py-1 px-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none max-w-full"
                >
                  <option value="EASY">Dễ · Nhận biết</option>
                  <option value="MEDIUM">Trung bình · Thông hiểu</option>
                  <option value="HARD">Khó · Vận dụng cao</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <TipTapContent
                value={prompt}
                onChange={setPrompt}
                placeholder="Nhập nội dung câu hỏi lịch sử chi tiết — hỗ trợ in đậm, in nghiêng, trích dẫn, danh sách, tải ảnh tư liệu, video YouTube..."
                showToolbar={true}
                minHeightClass="min-h-[110px]"
              />
            </div>
          </div>

          <QuestionAnswersSection
            type={type}
            options={options}
            correctAnswer={correctAnswer}
            orderingItems={orderingItems}
            matchingPairsValue={matchingPairsValue}
            expandedNotes={expandedNotes}
            onChangeCorrectAnswer={setCorrectAnswer}
            onChangeOrderingItems={setOrderingItems}
            onChangeMatchingPairs={setMatchingPairsValue}
            onToggleOptionCorrect={handleToggleOptionCorrect}
            onUpdateOptionText={(optId, text) =>
              setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, text } : o)))
            }
            onUpdateOptionExplanation={(optId, exp) =>
              setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, explanation: exp } : o)))
            }
            onToggleOptionNote={(optId) =>
              setExpandedNotes((prev) => ({ ...prev, [optId]: !prev[optId] }))
            }
            onAddOption={() =>
              setOptions((prev) => [
                ...prev,
                { id: generateQuizId('opt'), text: '', isCorrect: false },
              ])
            }
            onRemoveOption={handleRemoveOption}
            onError={setErrorMsg}
          />

          <div className="pt-1">
            <CollapsibleExplanationField
              value={explanation}
              onChange={setExplanation}
            />
          </div>
        </div>

        <QuestionModalFooter
          type={type}
          isEdit={Boolean(initialQuestion)}
          submitting={submitting}
          onClose={handleRequestClose}
          onSubmit={() => handleSubmit()}
        />
      </div>

      <TopicCategoryModalPicker
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        topics={topicsList}
        selectedTopicIds={topicIds}
        onChangeSelected={setTopicIds}
      />

      <ConfirmDialog
        isOpen={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={onClose}
        title="Hủy soạn câu hỏi?"
        message="Bạn đã nhập nội dung câu hỏi nhưng chưa lưu. Đóng cửa sổ này sẽ bỏ toàn bộ thay đổi vừa nhập."
        confirmLabel="Đóng & bỏ thay đổi"
        cancelLabel="Tiếp tục soạn"
        tone="warning"
      />
    </div>
  );
}

export { TopicCategoryModalPicker } from './QuestionBankModalParts';
