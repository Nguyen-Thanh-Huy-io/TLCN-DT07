'use client';

import React from 'react';
import {
  X,
  Clock,
  Award,
  HelpCircle,
  CheckCircle2,
  CircleDot,
  ArrowLeftRight,
  BookOpen,
} from 'lucide-react';
import { StandaloneQuizItem } from '@/services/entities/quiz.service';
import {
  QuizQuestion,
  QuizQuestionType,
  QUIZ_QUESTION_TYPE_META,
} from '@/features/lessons/types/quiz.types';

export interface QuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: StandaloneQuizItem | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  [QuizQuestionType.SINGLE_CHOICE]: CircleDot,
  [QuizQuestionType.MULTIPLE_CHOICE]: CheckCircle2,
  [QuizQuestionType.TRUE_FALSE]: HelpCircle,
  [QuizQuestionType.ORDERING]: Clock,
  [QuizQuestionType.MATCHING]: ArrowLeftRight,
};

export function QuizPreviewModal({ isOpen, onClose, quiz }: QuizPreviewModalProps) {
  if (!isOpen || !quiz) return null;

  const questions: QuizQuestion[] = Array.isArray(quiz.questions) ? quiz.questions : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 uppercase tracking-wider">
                Xem trước đề thi
              </span>
              {quiz.lessonTitle && (
                <span className="text-xs text-slate-500 inline-flex items-center gap-1 font-medium">
                  <BookOpen size={12} className="text-slate-400" />
                  {quiz.lessonTitle}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{quiz.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info bar */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200/60 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            <span>Thời lượng: <strong>{quiz.timeLimitMinutes} phút</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-amber-600" />
            <span>Điểm đạt chuẩn: <strong>{quiz.passingScorePercent}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Tổng số câu hỏi: <strong>{questions.length} câu</strong></span>
          </div>
        </div>

        {/* Question List Body */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-180px)]">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Đề thi này chưa có câu hỏi nào.</p>
            </div>
          ) : (
            questions.map((question, idx) => {
              const meta = QUIZ_QUESTION_TYPE_META[question.type];
              const IconComp = TYPE_ICONS[question.type] || CircleDot;

              return (
                <div
                  key={question.id || `q-${idx}`}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                        <IconComp size={12} />
                        {meta?.label || question.type}
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {question.prompt}
                  </h4>

                  {/* Options render based on type */}
                  <div className="space-y-2 pt-1">
                    {(question.type === QuizQuestionType.SINGLE_CHOICE ||
                      question.type === QuizQuestionType.MULTIPLE_CHOICE) && (
                      <div className="grid grid-cols-1 gap-2">
                        {question.options?.map((opt) => {
                          const isCorrect = opt.isCorrect;
                          return (
                            <div
                              key={opt.id}
                              className={`px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-900'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span className="text-[11px] font-bold text-emerald-700 uppercase">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === QuizQuestionType.TRUE_FALSE && (
                      <div className="flex gap-3">
                        <div
                          className={`flex-1 px-4 py-2.5 rounded-lg border text-xs text-center font-medium ${
                            question.correctAnswer === true
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          ĐÚNG {question.correctAnswer === true && '✓'}
                        </div>
                        <div
                          className={`flex-1 px-4 py-2.5 rounded-lg border text-xs text-center font-medium ${
                            question.correctAnswer === false
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          SAI {question.correctAnswer === false && '✓'}
                        </div>
                      </div>
                    )}

                    {question.type === QuizQuestionType.ORDERING && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-500">Thứ tự đúng:</div>
                        {(question.correctOrder || []).map((itemId, oIdx) => {
                          const item = question.items?.find((i) => i.id === itemId);
                          return (
                            <div
                              key={itemId}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-2 text-slate-700"
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px]">
                                {oIdx + 1}
                              </span>
                              <span>{item?.label || itemId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === QuizQuestionType.MATCHING && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-500">Cặp nối đúng:</div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {(question.correctPairs || []).map((pair, pIdx) => {
                            const left = question.leftItems?.find((i) => i.id === pair.leftId);
                            const right = question.rightItems?.find((i) => i.id === pair.rightId);
                            return (
                              <div
                                key={`${pair.leftId}-${pair.rightId}-${pIdx}`}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between text-slate-700"
                              >
                                <span className="font-medium text-slate-800">{left?.label || pair.leftId}</span>
                                <span className="text-slate-400">↔</span>
                                <span className="font-medium text-indigo-700">{right?.label || pair.rightId}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg">
                      <span className="font-semibold text-slate-700">Giải thích: </span>
                      {question.explanation}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
}
