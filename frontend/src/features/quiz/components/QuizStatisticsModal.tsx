'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { QuizApiService, QuizStatisticsData } from '@/services/entities/quiz.service';

interface QuizStatisticsModalProps {
  quizId: string | null;
  quizTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizStatisticsModal({
  quizId,
  quizTitle,
  isOpen,
  onClose,
}: QuizStatisticsModalProps) {
  const [statsData, setStatsData] = useState<QuizStatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !quizId) return;

    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await QuizApiService.getQuizStatistics(quizId);
        if (isMounted) {
          setStatsData(data);
        }
      } catch (err: unknown) {
        console.error('Lỗi khi tải thống kê bài thi:', err);
        if (isMounted) setStatsData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = Promise.resolve().then(fetchStats);

    return () => {
      isMounted = false;
      void timer;
    };
  }, [isOpen, quizId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B261E]/10 text-[#8B261E] flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-stone-900">
                Thống Kê Khảo Thí & Danh Sách Thí Sinh Nộp Bài
              </h3>
              <p className="text-[11px] text-stone-500 line-clamp-1">
                {quizTitle || statsData?.quizTitle || 'Đề kiểm tra trắc nghiệm'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-stone-500 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#8B261E] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Đang tải dữ liệu thống kê khảo thí...</p>
            </div>
          ) : statsData ? (
            <>
              {/* Bảng 3 chỉ số tổng quan */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[11px] text-stone-500 font-medium">Lượt tham gia</div>
                  <div className="text-lg font-bold text-stone-900 mt-0.5">
                    {statsData.summary?.totalAttempts ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="text-[11px] text-emerald-700 font-medium">Tỉ lệ đạt chuẩn</div>
                  <div className="text-lg font-bold text-emerald-800 mt-0.5">
                    {statsData.summary?.passRatePercent ?? 0}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <div className="text-[11px] text-amber-700 font-medium">Điểm trung bình</div>
                  <div className="text-lg font-bold text-amber-800 mt-0.5">
                    {statsData.summary?.averageScore ?? 0}%
                  </div>
                </div>
              </div>

              {/* Danh sách người nộp bài gần đây */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2.5 flex items-center justify-between">
                  <span>Danh sách lượt nộp bài gần đây</span>
                  <span className="text-[11px] text-stone-400 font-normal">
                    Thời gian TB: {statsData.summary?.averageTimeMinutes ?? '0'} phút
                  </span>
                </h4>

                {(statsData.recentAttempts || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                    Chưa có lượt nộp bài nào được ghi nhận cho đề này.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                    {(statsData.recentAttempts || []).map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[11px]">
                            {attempt.learnerName?.charAt(0)?.toUpperCase() || 'T'}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{attempt.learnerName}</div>
                            <div className="text-[10px] text-stone-400">
                              {new Date(attempt.submittedAt).toLocaleTimeString('vi-VN')} &bull;{' '}
                              {new Date(attempt.submittedAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div className="text-[11px] text-stone-500">
                            Làm trong: <strong>{attempt.timeSpentSeconds}s</strong>
                          </div>
                          <div
                            className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                              attempt.isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {attempt.scorePercent}% ({attempt.correctCount}/{attempt.totalQuestions})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
              Không tìm thấy dữ liệu thống kê cho bài thi này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
