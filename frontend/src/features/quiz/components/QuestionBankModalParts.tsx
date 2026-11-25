'use client';

import { useMemo } from 'react';
import { QuizQuestionType, OrderingItem } from '@/features/lessons/types/editor.types';
import { TopicItem } from '@/types/models';
import { MatchingPairsValue, MatchingPairsEditor, TimelineOrderingItemsEditor } from '@/components/common/MatchingPairsEditor';
import { OptionItemState, QUESTION_TYPE_CARDS } from './question-modal.helper';
import { Check, Folder, X, Maximize2, Minimize2 } from 'lucide-react';
import { TreeSelectTrigger, TreeSelectModal, buildTopicTreeNodes } from '@/components/common/TreeSelectModal';
import { TrueFalseAnswerSelector } from '@/components/common/AuthorFollowButton';
import { QuestionOptionsEditor } from './QuestionOptionsEditor';
import {
  QuestionTopicMode,
  resolveQuestionTopicStrategy,
  resolveTopicNames,
} from '../utils/practice-quiz.helper';

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
  topicMode?: QuestionTopicMode;
}

export function QuestionCategorySection({
  points,
  onChangePoints,
  topicIds,
  topicsList,
  onOpenTopicModal,
  onRemoveTopic,
  topicMode = QuestionTopicMode.BANK,
}: QuestionCategorySectionProps) {
  const strategy = resolveQuestionTopicStrategy(topicMode);
  const inheritedNames = resolveTopicNames(topicIds, topicsList);

  return (
    <div className="lg:col-span-4 space-y-2.5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Điểm số
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

      {strategy.collapsedByDefault ? (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900">
              <Folder size={13} className="text-emerald-600 shrink-0" />
              <span>{strategy.inheritedPrefix}</span>
            </span>
            <button
              type="button"
              onClick={onOpenTopicModal}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer shrink-0"
            >
              {strategy.customizeActionLabel}
            </button>
          </div>
          {topicIds.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {(inheritedNames.length > 0 ? inheritedNames : topicIds.map(() => 'Chủ đề đã gắn'))
                .slice(0, 2)
                .map((name, idx) => (
                  <span
                    key={`${topicIds[idx] ?? idx}`}
                    title={name}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] font-medium text-emerald-900 max-w-full leading-snug"
                  >
                    {name}
                  </span>
                ))}
              {topicIds.length > 2 && (
                <span className="text-[11px] font-semibold text-emerald-700 px-1">
                  +{topicIds.length - 2} khác
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-600">{strategy.emptyInheritedText}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {strategy.label}
          </label>
          <TreeSelectTrigger
            onClick={onOpenTopicModal}
            placeholder={strategy.placeholder}
            icon={<Folder size={13} className="text-slate-400 group-hover:text-emerald-600" />}
            badgeColor="emerald"
            selectedItems={topicIds.map((id) => ({
              id,
              label: topicsList.find((t) => t.id === id)?.name || 'Chủ đề đã chọn',
            }))}
            onRemoveItem={onRemoveTopic}
          />
          <p className="text-[11px] text-slate-400 mt-1">{strategy.helperText}</p>
        </div>
      )}
    </div>
  );
}

// --- CategoryTreePicker.tsx ---
// ============================================================================
// 1. MODAL CHỌN NHIỀU CHỦ ĐỀ - REUSING TREESELECTMODAL
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
      title="Chọn chủ đề"
      subtitle="Chọn một hoặc nhiều chủ đề lịch sử"
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
    <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-white shrink-0">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {isEdit ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Soạn thảo câu hỏi lịch sử kèm giải thích đáp án và ảnh tư liệu minh họa
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

const FOOTER_BANK_SUFFIX = 'Lưu vào Ngân hàng trung tâm';

const QUESTION_TYPE_FOOTER_LABELS: Record<QuizQuestionType, string> = {
  [QuizQuestionType.SINGLE_CHOICE]: 'Loại 1: Trắc nghiệm 1 đáp án',
  [QuizQuestionType.MULTIPLE_CHOICE]: 'Loại 2: Trắc nghiệm nhiều đáp án đúng',
  [QuizQuestionType.TRUE_FALSE]: 'Loại 3: Câu hỏi Đúng / Sai',
  [QuizQuestionType.ORDERING]: 'Loại 4: Sắp xếp dòng thời gian',
  [QuizQuestionType.MATCHING]: 'Loại 5: Ghép nối cặp thông tin',
  [QuizQuestionType.FILL_IN_BLANK]: 'Loại 6: Điền vào chỗ trống',
};

export function getQuestionTypeFooterLabel(type: QuizQuestionType): string {
  const title =
    QUESTION_TYPE_FOOTER_LABELS[type] ??
    QUESTION_TYPE_FOOTER_LABELS[QuizQuestionType.SINGLE_CHOICE];
  return `${title} • ${FOOTER_BANK_SUFFIX}`;
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
          className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
        </button>
      </div>
    </div>
  );
}
