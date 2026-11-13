'use client';

import { useMemo } from 'react';
import { QuizQuestionType, OrderingItem } from '@/features/lessons/types/quiz.types';
import { LessonItem, TopicItem } from '@/types/models';
import { MatchingPairsValue, MatchingPairsEditor } from '@/components/common/MatchingPairsEditor';
import { OptionItemState, QUESTION_TYPE_CARDS } from './question-modal.helper';
import { Check, Folder, BookOpen, X, Maximize2, Minimize2 } from 'lucide-react';
import { TreeSelectTrigger, TreeSelectModal, buildTopicTreeNodes, buildLessonTreeNodes } from '@/components/common/TreeSelectModal';
import { TrueFalseAnswerSelector } from '@/components/common/TrueFalseAnswerSelector';
import { TimelineOrderingItemsEditor } from '@/components/common/TimelineOrderingItemsEditor';
import { QuestionOptionsEditor } from './QuestionOptionsEditor';

// --- QuestionTypeCardSelector.tsx ---
export interface QuestionTypeCardSelectorProps {
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
export interface QuestionCategorySectionProps {
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
export interface QuestionAnswersSectionProps {
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
export interface QuestionModalHeaderProps {
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

export interface QuestionModalFooterProps {
  type: QuizQuestionType;
  isEdit: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function getQuestionTypeFooterLabel(type: QuizQuestionType): string {
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
