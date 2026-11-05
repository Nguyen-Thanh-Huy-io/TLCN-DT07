'use client';

import React from 'react';
import {
  HelpCircle,
  Clock,
  Trophy,
  ShieldCheck,
  Play,
  User,
  Sparkles,
  Info,
} from 'lucide-react';

interface QuizBriefingCardProps {
  quizTitle: string;
  topicName?: string | null;
  description?: string | null;
  questionCount: number;
  timeLimitMinutes: number;
  passingScorePercent: number;
  learnerName: string;
  onLearnerNameChange: (name: string) => void;
  onStartExam: () => void;
}

export const QuizBriefingCard: React.FC<QuizBriefingCardProps> = ({
  quizTitle,
  topicName,
  description,
  questionCount,
  timeLimitMinutes,
  passingScorePercent,
  learnerName,
  onLearnerNameChange,
  onStartExam,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden p-6 md:p-8">
      {/* HEADER PHÒNG CHỜ */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8B261E]/10 text-[#8B261E] uppercase tracking-wider mb-3">
          <Sparkles size={13} /> {topicName || 'Chuyên đề Khảo thí Lịch sử'}
        </span>

        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight mb-3">
          {quizTitle}
        </h2>

        {description && (
          <p className="text-stone-600 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* THÔNG SỐ BỘ ĐỀ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-3xl mx-auto mb-8">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <HelpCircle size={20} className="mx-auto text-[#8B261E] mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            {questionCount}
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Câu hỏi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <Clock size={20} className="mx-auto text-amber-600 mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            {timeLimitMinutes} phút
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Thời lượng
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <Trophy size={20} className="mx-auto text-emerald-600 mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            {passingScorePercent}%
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Chuẩn đạt
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-center">
          <ShieldCheck size={20} className="mx-auto text-sky-600 mb-1.5" />
          <div className="text-xl font-bold font-serif text-stone-900">
            Tự động
          </div>
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Chấm điểm tức thì
          </div>
        </div>
      </div>

      {/* THÔNG TIN THÍ SINH & NÚT BẮT ĐẦU */}
      <div className="max-w-md mx-auto bg-[#FAF7F2] p-5 rounded-xl border border-stone-200 mb-6">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <User size={14} className="text-[#8B261E]" /> Tên thí sinh tham gia:
        </label>
        <input
          type="text"
          value={learnerName}
          onChange={(e) => onLearnerNameChange(e.target.value)}
          placeholder="Nhập họ và tên hoặc biệt danh..."
          className="w-full px-4 py-2.5 bg-white rounded-lg border border-stone-300 text-stone-900 text-sm focus:border-[#8B261E] focus:ring-2 focus:ring-[#8B261E]/20 outline-none transition-all mb-4"
        />

        <button
          type="button"
          onClick={onStartExam}
          className="w-full py-3 px-6 rounded-xl bg-[#8B261E] hover:bg-[#731F18] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play size={18} /> Bắt đầu làm bài thi
        </button>
      </div>

      {/* LƯU Ý PHÒNG THI */}
      <div className="max-w-xl mx-auto flex items-start gap-2 text-xs text-stone-500 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
        <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
        <p>
          Thời gian làm bài sẽ bắt đầu đếm ngược ngay khi bạn bấm <strong>&ldquo;Bắt đầu làm bài thi&rdquo;</strong>.
          Hệ thống sẽ tự động thu bài khi hết giờ hoặc khi bạn bấm nộp bài.
        </p>
      </div>
    </div>
  );
};
