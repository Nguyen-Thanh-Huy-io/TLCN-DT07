'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  GripVertical,
  Check,
  CircleDot,
  CheckSquare,
  HelpCircle,
  Clock,
  ArrowLeftRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Subscript,
  Superscript,
  Link2,
  ImageIcon,
  X,
  Plus,
  Lightbulb,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';
import {
  QUIZ_QUESTION_TYPE_META,
  QuizQuestionType,
} from '@/features/lessons/types/quiz.types';
import { generateQuizId } from '@/features/lessons/factories/quiz-question.factory';
import {
  CreateQuestionPayload,
  QuestionApiService,
  QuestionBankItem,
} from '@/services/entities/question.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { LessonItem } from '@/types/models/lesson.type';
import { TopicApiService } from '@/services/entities/topic.service';
import { TopicItem } from '@/types/models/topic.type';
import { CategoryTreePicker } from './CategoryTreePicker';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialQuestion?: QuestionBankItem | null;
}

interface QuestionTypeCardConfig {
  type: QuizQuestionType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isReady: boolean;
}

// 5 Loại câu hỏi theo lộ trình Giai đoạn 1 của dự án
const QUESTION_TYPE_CARDS: QuestionTypeCardConfig[] = [
  {
    type: QuizQuestionType.SINGLE_CHOICE,
    title: 'Radio Button',
    subtitle: '(Single Choice)',
    icon: CircleDot,
    isReady: true,
  },
  {
    type: QuizQuestionType.MULTIPLE_CHOICE,
    title: 'Check Box',
    subtitle: '(Multiple Choice)',
    icon: CheckSquare,
    isReady: false,
  },
  {
    type: QuizQuestionType.TRUE_FALSE,
    title: 'Đúng / Sai',
    subtitle: '(True / False)',
    icon: HelpCircle,
    isReady: false,
  },
  {
    type: QuizQuestionType.ORDERING,
    title: 'Dòng thời gian',
    subtitle: '(Timeline Order)',
    icon: Clock,
    isReady: false,
  },
  {
    type: QuizQuestionType.MATCHING,
    title: 'Ghép nối',
    subtitle: '(Matching Pairs)',
    icon: ArrowLeftRight,
    isReady: false,
  },
];

export function QuestionBankModal({
  isOpen,
  onClose,
  onSuccess,
  initialQuestion,
}: QuestionBankModalProps) {
  const [type, setType] = useState<QuizQuestionType>(QuizQuestionType.SINGLE_CHOICE);
  const [prompt, setPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [points, setPoints] = useState<number>(1);
  const [topicId, setTopicId] = useState<string>('');
  const [topicsList, setTopicsList] = useState<TopicItem[]>([]);
  const [lessonId, setLessonId] = useState<string>('');
  const [lessonsList, setLessonsList] = useState<LessonItem[]>([]);
  const [options, setOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean; explanation?: string }>
  >([
    { id: generateQuizId('opt'), text: '', isCorrect: true },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
  ]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  // Tải danh sách Chủ đề và Bài học để gán phân loại
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

  // Khởi tạo state từ initialQuestion hoặc mặc định
  useEffect(() => {
    if (initialQuestion) {
      setType(initialQuestion.type);
      setPrompt(initialQuestion.prompt || '');
      setExplanation(initialQuestion.explanation || '');
      setDifficulty(initialQuestion.difficulty || 'MEDIUM');
      setPoints(initialQuestion.points ?? 1);
      setTopicId(initialQuestion.topicId || '');
      setLessonId(initialQuestion.lessonId || '');
      if (initialQuestion.data?.options && Array.isArray(initialQuestion.data.options)) {
        setOptions(initialQuestion.data.options);
        const notesMap: Record<string, boolean> = {};
        initialQuestion.data.options.forEach((opt: any) => {
          if (opt.explanation && opt.explanation.trim()) {
            notesMap[opt.id] = true;
          }
        });
        setExpandedNotes(notesMap);
      }
    } else {
      setType(QuizQuestionType.SINGLE_CHOICE);
      setPrompt('');
      setExplanation('');
      setDifficulty('MEDIUM');
      setPoints(1);
      setTopicId('');
      setLessonId('');
      setExpandedNotes({});
      setOptions([
        { id: generateQuizId('opt'), text: '', isCorrect: true },
        { id: generateQuizId('opt'), text: '', isCorrect: false },
        { id: generateQuizId('opt'), text: '', isCorrect: false },
        { id: generateQuizId('opt'), text: '', isCorrect: false },
      ]);
    }
    setErrorMsg('');
    setNoticeMsg('');
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
  };

  const handleSetSingleCorrect = (optId: string) => {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === optId })));
  };

  const handleUpdateOptionText = (optId: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, text } : o)));
  };

  const handleUpdateOptionExplanation = (optId: string, explanation: string) => {
    setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, explanation } : o)));
  };

  const toggleOptionNote = (optId: string) => {
    setExpandedNotes((prev) => ({ ...prev, [optId]: !prev[optId] }));
  };

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: generateQuizId('opt'), text: '', isCorrect: false },
    ]);
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

    const cleanPromptText = prompt.replace(/<[^>]+>/g, '').trim();
    if (!cleanPromptText && !prompt.includes('<img')) {
      setErrorMsg('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    if (type === QuizQuestionType.SINGLE_CHOICE) {
      if (options.length < 2) {
        setErrorMsg('Cần ít nhất 2 phương án lựa chọn.');
        return;
      }
      if (options.some((o) => !o.text.trim())) {
        setErrorMsg('Vui lòng nhập nội dung cho tất cả các phương án đáp án.');
        return;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        setErrorMsg('Vui lòng đánh dấu chọn chính xác 1 đáp án đúng (Correct).');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: CreateQuestionPayload = {
        type,
        prompt: prompt.trim(),
        explanation: explanation.trim() || undefined,
        difficulty,
        points: Number(points) > 0 ? Number(points) : 1,
        topicId: topicId || undefined,
        lessonId: lessonId || undefined,
        data: {
          options,
        },
      };

      if (initialQuestion?.id) {
        await QuestionApiService.updateQuestion(initialQuestion.id, payload);
      } else {
        await QuestionApiService.createQuestion(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi lưu câu hỏi:', err);
      setErrorMsg(
        err?.response?.data?.message ||
          'Không thể lưu câu hỏi. Vui lòng kiểm tra lại dữ liệu và thử lại.'
      );
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{initialQuestion ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}</span>
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
              onClick={() => setIsMaximized(!isMaximized)}
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Thông báo lỗi / chú ý */}
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

          {/* Section 1: Question Type + Question Mark & Assign Category */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Question Type Selector */}
            <div className="lg:col-span-8">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Loại câu hỏi <span className="text-blue-600 font-normal">(Question Type)</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {QUESTION_TYPE_CARDS.map((card) => {
                  const isSelected = type === card.type;
                  const IconComp = card.icon;

                  return (
                    <button
                      key={card.type}
                      type="button"
                      onClick={() => handleSelectType(card.type, card.isReady)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer min-h-[92px] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                          : card.isReady
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                          : 'border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-90'
                      }`}
                    >
                      {/* Top-Right Radio indicator badge */}
                      <span className="absolute top-2 right-2 flex items-center justify-center">
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                        )}
                      </span>

                      {/* Card Center Icon */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${
                          isSelected
                            ? 'text-blue-600 bg-blue-100/60'
                            : 'text-slate-500 bg-slate-100/80'
                        }`}
                      >
                        <IconComp size={16} />
                      </div>

                      {/* Card Labels */}
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
            </div>

            {/* Right: Question Mark, Topic & Lesson Assignment */}
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
                  onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>

              <CategoryTreePicker
                topics={topicsList}
                lessons={lessonsList}
                selectedTopicId={topicId}
                selectedLessonId={lessonId}
                onSelectTopic={(id) => {
                  setTopicId(id);
                  setLessonId('');
                }}
                onSelectLesson={(id, parentTopicId) => {
                  setLessonId(id);
                  if (parentTopicId) setTopicId(parentTopicId);
                }}
                onClear={() => {
                  setTopicId('');
                  setLessonId('');
                }}
              />
            </div>
          </div>

          {/* Section 2: Question Prompt with Rich Formatting Toolbar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Nội dung câu hỏi <span className="text-blue-600 font-normal">(Question)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Độ khó:</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="text-[11px] font-semibold py-0.5 px-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="EASY">Dễ (Nhận biết)</option>
                  <option value="MEDIUM">Trung bình (Thông hiểu)</option>
                  <option value="HARD">Khó (Vận dụng cao)</option>
                </select>
              </div>
            </div>

            {/* Rich Editor Box using CMS TipTapContent */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <TipTapContent
                value={prompt}
                onChange={setPrompt}
                placeholder="Nhập nội dung câu hỏi lịch sử chi tiết (hỗ trợ in đậm, in nghiêng, trích dẫn, danh sách, tải ảnh tư liệu, video YouTube...)"
                showToolbar={true}
                minHeightClass="min-h-[170px] p-3 text-sm font-medium"
              />
            </div>

            {/* Description / Explanation Optional Field */}
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Description (Optional) - Giải thích đáp án chung hoặc chú thích thêm khi hoàn thành..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400 text-slate-700 font-medium"
            />
          </div>

          {/* Section 3: Options List with Drag Handle, Input, Correct Toggle & Delete */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Các phương án lựa chọn <span className="text-blue-600 font-normal">(Options)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Tích chọn ô <strong>Correct</strong> tại phương án đúng duy nhất
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
                      {/* Drag Grip Handle */}
                      <span className="text-slate-400 cursor-grab hover:text-slate-600 shrink-0">
                        <GripVertical size={15} />
                      </span>

                      {/* Radio indicator icon */}
                      <span
                        onClick={() => handleSetSingleCorrect(opt.id)}
                        className="cursor-pointer shrink-0"
                      >
                        {opt.isCorrect ? (
                          <CircleDot size={16} className="text-blue-600" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 block hover:border-blue-500" />
                        )}
                      </span>

                      {/* Letter tag */}
                      <span className="text-xs font-bold text-slate-500 w-4 shrink-0">
                        {labelLetter}.
                      </span>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOptionText(opt.id, e.target.value)}
                        placeholder={`Nội dung lựa chọn ${labelLetter}...`}
                        className="flex-1 text-xs sm:text-sm p-1 bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
                      />

                      {/* Option Explanation Note Button */}
                      <button
                        type="button"
                        onClick={() => toggleOptionNote(opt.id)}
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

                      {/* Correct Checkbox Toggle */}
                      <button
                        type="button"
                        onClick={() => handleSetSingleCorrect(opt.id)}
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

                      {/* Delete Option Icon */}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Xóa lựa chọn này"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Collapsible Per-Option Explanation Sub-Input */}
                    {isNoteOpen && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 pl-8 pr-1 flex items-start gap-2">
                        <span className="text-amber-600 mt-1 shrink-0">
                          <Lightbulb size={13} />
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Giải thích riêng khi học sinh chọn đáp án {labelLetter} (
                              {opt.isCorrect ? (
                                <span className="text-emerald-600">Đáp án đúng</span>
                              ) : (
                                <span className="text-amber-600">Phương án sai / gây nhiễu</span>
                              )}
                              ):
                            </span>
                            {opt.explanation && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOptionExplanation(opt.id, '')}
                                className="text-[10px] text-rose-500 hover:text-rose-700 underline cursor-pointer"
                              >
                                Xóa ghi chú
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={opt.explanation || ''}
                            onChange={(e) =>
                              handleUpdateOptionExplanation(opt.id, e.target.value)
                            }
                            placeholder={
                              opt.isCorrect
                                ? `Vì sao đáp án ${labelLetter} là chính xác (cơ sở lịch sử, bối cảnh)...`
                                : `Vì sao học sinh chọn đáp án ${labelLetter} là sai (lỗi nhầm mốc thời gian, sự kiện)...`
                            }
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Option Button */}
            <button
              type="button"
              onClick={handleAddOption}
              className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-blue-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <Plus size={14} />
              <span>Thêm phương án lựa chọn (Add Option)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Loại 1: Trắc nghiệm 1 đáp án (Single Choice) • Lưu vào Ngân hàng trung tâm
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
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Đang lưu...' : initialQuestion ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
