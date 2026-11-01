'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { Badge } from '@/components/common/Badge';
import { LessonApiService } from '@/services/entities/lesson.service';
import api from '@/services/api';

export interface QuestionBankItem {
  id: string;
  type: 'single_choice' | 'multi_choice' | 'true_false' | 'timeline_order' | 'matching' | 'fill_blank';
  prompt: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  lessonTitle: string;
  historicalPeriod: string;
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Tất cả loại câu hỏi',
  single_choice: 'Trắc nghiệm 1 đáp án',
  multi_choice: 'Nhiều đáp án đúng',
  true_false: 'Đúng / Sai',
  timeline_order: 'Sắp xếp thời gian',
  matching: 'Ghép nối',
  fill_blank: 'Điền khuyết',
};

const DIFFICULTY_LABELS: Record<string, { label: string; tone: 'ok' | 'warn' | 'neutral' }> = {
  EASY: { label: 'Dễ', tone: 'ok' },
  MEDIUM: { label: 'Trung bình', tone: 'warn' },
  HARD: { label: 'Khó', tone: 'neutral' },
};

export function QuestionBankView() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const res = await LessonApiService.getLessons({ limit: 50 });
        const lessons = res.items || [];
        const loadedQuestions: QuestionBankItem[] = [];

        for (const lesson of lessons) {
          try {
            const quizRes = await api.get(`/lessons/${lesson.id}/quiz`);
            const quiz = quizRes.data?.data || quizRes.data;
            if (quiz && Array.isArray(quiz.questions)) {
              for (const q of quiz.questions) {
                const normalizedType =
                  q.type === 'SINGLE_CHOICE'
                    ? 'single_choice'
                    : q.type === 'MULTIPLE_CHOICE'
                      ? 'multi_choice'
                      : q.type === 'TRUE_FALSE'
                        ? 'true_false'
                        : q.type === 'ORDERING'
                          ? 'timeline_order'
                          : q.type === 'MATCHING'
                            ? 'matching'
                            : 'fill_blank';

                loadedQuestions.push({
                  id: q.id || `q-${Math.random()}`,
                  type: normalizedType as any,
                  prompt: q.prompt || q.question || 'Câu hỏi ôn tập',
                  options: q.options || [],
                  explanation: q.explanation || '',
                  points: q.points || 10,
                  difficulty: q.difficulty || 'MEDIUM',
                  lessonTitle: lesson.title,
                  historicalPeriod: (lesson as any).topic?.period?.name || 'Lịch sử Việt Nam',
                });
              }
            }
          } catch {
            // Bài học chưa có đề ôn tập là trạng thái hợp lệ
          }
        }
        setQuestions(loadedQuestions);
      } catch (err) {
        console.error('Failed to load questions from lessons:', err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchType = selectedType === 'all' || q.type === selectedType;
      const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchSearch =
        search === '' ||
        q.prompt.toLowerCase().includes(search.toLowerCase()) ||
        q.lessonTitle.toLowerCase().includes(search.toLowerCase());
      return matchType && matchDiff && matchSearch;
    });
  }, [questions, selectedType, selectedDifficulty, search]);

  return (
    <div className="space-y-6">
      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi hoặc bài học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Icon name={IconName.SEARCH} size={15} />
            </span>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
          >
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong>{filteredQuestions.length}</strong> câu hỏi
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500 animate-pulse">
            Đang tổng hợp dữ liệu câu hỏi từ các bài học...
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Icon name={IconName.HELP_CIRCLE} size={32} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Chưa có câu hỏi nào trong ngân hàng</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Danh sách câu hỏi sẽ được tự động tổng hợp từ các bài học khi biên tập viên soạn đề Quiz tại mục Quản lý bài học.
          </p>
        </div>
      ) : (
        /* Danh sách câu hỏi */
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 px-2.5 py-1 bg-slate-100 rounded-md">
                    {TYPE_LABELS[q.type]}
                  </span>
                  <Badge tone={DIFFICULTY_LABELS[q.difficulty]?.tone || 'gray'}>
                    {DIFFICULTY_LABELS[q.difficulty]?.label || q.difficulty}
                  </Badge>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {q.points} điểm
                </div>
              </div>

              {/* Prompt */}
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {q.prompt}
              </p>

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                        opt.isCorrect
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{opt.text}</span>
                      {opt.isCorrect && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                          Đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Lời giải & Nguồn bài học */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Icon name={IconName.BOOK} size={13} className="text-slate-400" />
                  <span>Thuộc bài học: <strong>{q.lessonTitle}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400 italic">
                  Thời kỳ: {q.historicalPeriod}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
