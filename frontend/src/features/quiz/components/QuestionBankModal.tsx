'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';
import { QUIZ_QUESTION_TYPE_META, QuizQuestionType, OrderingItem } from '@/features/lessons/types/quiz.types';
import { generateQuizId } from '@/features/lessons/factories/quiz-question.factory';
import { CreateQuestionPayload, QuestionApiService, QuestionBankItem } from '@/services/entities/question.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem, TopicItem } from '@/types/models';
import { TopicApiService } from '@/services/entities/topic.service';
import { CollapsibleExplanationField } from '@/components/common/CollapsibleExplanationField';
import { MatchingPairsValue, MatchingPairsEditor } from '@/components/common/MatchingPairsEditor';
import { OptionItemState, QuestionDifficulty, createDefaultMatchingPairs, createDefaultOptions, createDefaultOrderingItems, validateQuestionForm, buildQuestionData, parseInitialQuestionState, QUESTION_TYPE_CARDS } from './question-modal.helper';
import { Check, Folder, BookOpen, X, Maximize2, Minimize2 } from 'lucide-react';
import { TreeSelectTrigger, TreeSelectModal, buildTopicTreeNodes, buildLessonTreeNodes } from '@/components/common/TreeSelectModal';
import { TrueFalseAnswerSelector } from '@/components/common/TrueFalseAnswerSelector';
import { TimelineOrderingItemsEditor } from '@/components/common/TimelineOrderingItemsEditor';
import { QuestionOptionsEditor } from './QuestionOptionsEditor';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialQuestion?: QuestionBankItem | null;
}

export function QuestionBankModal({
  isOpen,
  onClose,
  onSuccess,
  initialQuestion,
}: QuestionBankModalProps) {
  const [type, setType] = useState<QuizQuestionType>(QuizQuestionType.SINGLE_CHOICE);
  const [prompt, setPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [points, setPoints] = useState<number>(1);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [topicsList, setTopicsList] = useState<TopicItem[]>([]);
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [lessonsList, setLessonsList] = useState<LessonItem[]>([]);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
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

    Promise.all([
      TopicApiService.getTopics({ limit: 100 }).catch((err) => {
        console.warn('Không thể tải danh sách chủ đề:', err);
        return { items: [] };
      }),
      LessonApiService.getLessons({ limit: 100 }).catch((err) => {
        console.warn('Không thể tải danh sách bài học:', err);
        return { items: [] };
      }),
    ]).then(([topicRes, lessonRes]) => {
      if (isMounted) {
        if (topicRes?.items) setTopicsList(topicRes.items);
        if (lessonRes?.items) setLessonsList(lessonRes.items);
      }
    });

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
      setTopicIds(parsed.topicIds);
      setLessonIds(parsed.lessonIds);
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
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const handleSelectType = (targetType: QuizQuestionType, isReady: boolean) => {
    if (!isReady) {
      setNoticeMsg(
        `Loại câu hỏi "${QUIZ_QUESTION_TYPE_META[targetType]?.label || targetType}" sẽ được kích hoạt ở các bước kế tiếp theo lộ trình kiểm thử!`
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
        lessonIds,
        data: questionData,
      };

      if (initialQuestion?.id) {
        await QuestionApiService.updateQuestion(initialQuestion.id, payload);
      } else {
        await QuestionApiService.createQuestion(payload);
      }

      onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
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
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
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
            <div className="lg:col-span-8">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Loại câu hỏi <span className="text-blue-600 font-normal">(Question Type)</span>
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
              lessonIds={lessonIds}
              lessonsList={lessonsList}
              onOpenLessonModal={() => setIsLessonModalOpen(true)}
              onRemoveLesson={(id) => setLessonIds((prev) => prev.filter((item) => item !== id))}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Nội dung câu hỏi <span className="text-blue-600 font-normal">(Question)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Độ khó:</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="text-[11px] font-semibold py-0.5 px-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="EASY">Dễ (Nhận biết)</option>
                  <option value="MEDIUM">Trung bình (Thông hiểu)</option>
                  <option value="HARD">Khó (Vận dụng cao)</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <TipTapContent
                value={prompt}
                onChange={setPrompt}
                placeholder="Nhập nội dung câu hỏi lịch sử chi tiết (hỗ trợ in đậm, in nghiêng, trích dẫn, danh sách, tải ảnh tư liệu, video YouTube...)"
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
          onClose={onClose}
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

      <LessonCategoryModalPicker
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        lessons={lessonsList}
        selectedLessonIds={lessonIds}
        onChangeSelected={setLessonIds}
      />
    </div>
  );
}

// --- QuestionTypeCardSelector.tsx ---
interface QuestionTypeCardSelectorProps {
  currentType: QuizQuestionType;
  onSelectType: (type: QuizQuestionType, isReady: boolean) => void;
}

export function QuestionTypeCardSelector({
  currentType,
  onSelectType,
}: QuestionTypeCardSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {QUESTION_TYPE_CARDS.map((card) => {
        const isSelected = currentType === card.type;
        const IconComp = card.icon;

        return (
          <button
            key={card.type}
            type="button"
            onClick={() => onSelectType(card.type, card.isReady)}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer min-h-[92px] ${
              isSelected
                ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                : card.isReady
                ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                : 'border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-90'
            }`}
          >
            <span className="absolute top-2 right-2 flex items-center justify-center">
              {isSelected ? (
                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Check size={10} strokeWidth={3} />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
              )}
            </span>

            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${
                isSelected
                  ? 'text-blue-600 bg-blue-100/60'
                  : 'text-slate-500 bg-slate-100/80'
              }`}
            >
              <IconComp size={16} />
            </div>

            <span
              className={`text-[11px] font-bold leading-tight ${
                isSelected ? 'text-blue-900' : 'text-slate-800'
              }`}
            >
              {card.title}
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              {card.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// --- QuestionCategorySection.tsx ---
interface QuestionCategorySectionProps {
  points: number;
  onChangePoints: (val: number) => void;
  topicIds: string[];
  topicsList: TopicItem[];
  onOpenTopicModal: () => void;
  onRemoveTopic: (id: string) => void;
  lessonIds: string[];
  lessonsList: LessonItem[];
  onOpenLessonModal: () => void;
  onRemoveLesson: (id: string) => void;
}

export function QuestionCategorySection({
  points,
  onChangePoints,
  topicIds,
  topicsList,
  onOpenTopicModal,
  onRemoveTopic,
  lessonIds,
  lessonsList,
  onOpenLessonModal,
  onRemoveLesson,
}: QuestionCategorySectionProps) {
  return (
    <div className="lg:col-span-4 space-y-2.5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Điểm số <span className="text-slate-400 font-normal">(Question Mark)</span>
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={points}
          onChange={(e) => onChangePoints(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Phân loại / Chủ đề <span className="text-slate-400 font-normal">(Topics)</span>
        </label>
        <TreeSelectTrigger
          onClick={onOpenTopicModal}
          placeholder="Chung (Bấm để chọn chủ đề...)"
          icon={<Folder size={13} className="text-slate-400 group-hover:text-emerald-600" />}
          badgeColor="emerald"
          selectedItems={topicIds.map((id) => ({
            id,
            label: topicsList.find((t) => t.id === id)?.name || 'Chủ đề đã chọn',
          }))}
          onRemoveItem={onRemoveTopic}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Liên kết bài học <span className="text-slate-400 font-normal">(Lessons)</span>
        </label>
        <TreeSelectTrigger
          onClick={onOpenLessonModal}
          placeholder="Chung (Bấm để chọn bài học...)"
          icon={<BookOpen size={13} className="text-slate-400 group-hover:text-emerald-600" />}
          badgeColor="blue"
          selectedItems={lessonIds.map((id) => ({
            id,
            label: lessonsList.find((l) => l.id === id)?.title || 'Bài học đã chọn',
          }))}
          onRemoveItem={onRemoveLesson}
        />
      </div>
    </div>
  );
}

// --- CategoryTreePicker.tsx ---
// ============================================================================
// 1. MODAL CHỌN NHIỀU CHỦ ĐỀ (SELECT A CATEGORY - REUSING TREESELECTMODAL)
// ============================================================================

export interface TopicCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
  selectedTopicIds: string[];
  onChangeSelected: (topicIds: string[]) => void;
}

export function TopicCategoryModalPicker({
  isOpen,
  onClose,
  topics,
  selectedTopicIds,
  onChangeSelected,
}: TopicCategoryModalProps) {
  const nodes = useMemo(() => buildTopicTreeNodes(topics), [topics]);

  return (
    <TreeSelectModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select a category"
      subtitle="Chọn một hoặc nhiều Chủ đề"
      nodes={nodes}
      selectedIds={selectedTopicIds}
      onChangeSelected={onChangeSelected}
      multiple={true}
      emptyText="Không có dữ liệu chủ đề."
      unitLabel="chủ đề"
      searchPlaceholder="Tìm kiếm nhanh chủ đề lịch sử..."
    />
  );
}

// ============================================================================
// 2. MODAL CHỌN NHIỀU BÀI HỌC (SELECT LESSONS - REUSING TREESELECTMODAL)
// ============================================================================

export interface LessonCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonItem[];
  selectedLessonIds: string[];
  onChangeSelected: (lessonIds: string[]) => void;
}

export function LessonCategoryModalPicker({
  isOpen,
  onClose,
  lessons,
  selectedLessonIds,
  onChangeSelected,
}: LessonCategoryModalProps) {
  const nodes = useMemo(() => buildLessonTreeNodes(lessons), [lessons]);

  return (
    <TreeSelectModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select lessons"
      subtitle="Chọn một hoặc nhiều Bài học liên kết"
      nodes={nodes}
      selectedIds={selectedLessonIds}
      onChangeSelected={onChangeSelected}
      multiple={true}
      emptyText="Không có dữ liệu bài học."
      unitLabel="bài học"
      searchPlaceholder="Tìm kiếm nhanh tên bài học (VD: Điện Biên Phủ, Quảng Trị, Tây Nguyên)..."
    />
  );
}

// --- QuestionAnswersSection.tsx ---
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

// --- QuestionModalHeaderFooter.tsx ---
interface QuestionModalHeaderProps {
  isEdit: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function QuestionModalHeader({
  isEdit,
  isMaximized,
  onToggleMaximize,
  onClose,
}: QuestionModalHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>{isEdit ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}</span>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            CMS Rich Text Editor
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Soạn thảo câu hỏi trắc nghiệm chuẩn sư phạm, hỗ trợ định dạng văn bản chuyên sâu và tải ảnh tư liệu
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleMaximize}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isMaximized ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng cửa sổ"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

interface QuestionModalFooterProps {
  type: QuizQuestionType;
  isEdit: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function getQuestionTypeFooterLabel(type: QuizQuestionType): string {
  switch (type) {
    case QuizQuestionType.MATCHING:
      return 'Loại 5: Ghép nối cặp thông tin (Matching Pairs) • Lưu vào Ngân hàng trung tâm';
    case QuizQuestionType.ORDERING:
      return 'Loại 4: Sắp xếp dòng thời gian (Timeline Order) • Lưu vào Ngân hàng trung tâm';
    case QuizQuestionType.TRUE_FALSE:
      return 'Loại 3: Câu hỏi Đúng / Sai (True / False) • Lưu vào Ngân hàng trung tâm';
    case QuizQuestionType.MULTIPLE_CHOICE:
      return 'Loại 2: Trắc nghiệm nhiều đáp án đúng (Multiple Choice / Check Box) • Lưu vào Ngân hàng trung tâm';
    default:
      return 'Loại 1: Trắc nghiệm 1 đáp án (Single Choice / Radio Button) • Lưu vào Ngân hàng trung tâm';
  }
}

export function QuestionModalFooter({
  type,
  isEdit,
  submitting,
  onClose,
  onSubmit,
}: QuestionModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
      <span className="text-[11px] text-slate-500 hidden sm:inline">
        {getQuestionTypeFooterLabel(type)}
      </span>

      <div className="flex items-center gap-2.5 ml-auto">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
        </button>
      </div>
    </div>
  );
}
