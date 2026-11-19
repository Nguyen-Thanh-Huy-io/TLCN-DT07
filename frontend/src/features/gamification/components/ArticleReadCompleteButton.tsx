'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { GamificationApiService } from '../services/gamification.service';

export function ArticleReadCompleteButton({ articleId }: { articleId: string }) {
  const user = useAuthSession();
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [xpBanner, setXpBanner] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !articleId) return;
    let alive = true;
    GamificationApiService.getArticleReadStatus(articleId)
      .then((res) => {
        if (alive && res.completed) setCompleted(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [articleId, user]);

  const handleComplete = async () => {
    if (!articleId || completed || submitting) return;
    setSubmitting(true);
    try {
      const res = await GamificationApiService.markArticleReadComplete(articleId);
      setCompleted(true);
      if (res.xpEarned > 0) setXpBanner(res.xpEarned);
    } finally {
      setSubmitting(false);
    }
  };

  if (user === undefined) return null;

  if (user === null) {
    return (
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] px-5 py-4 text-xs text-[#7A6B57]">
        <span>Đăng nhập để ghi nhận hoàn thành đọc bài, tích luỹ chuỗi ngày học và +20 XP.</span>
        <Link
          href="/login"
          className="rounded-xl bg-[#7A1F24] px-4 py-2 font-bold text-white hover:brightness-110"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] px-5 py-4">
      <div className="flex items-center gap-2.5 text-sm font-bold text-[#2D1A10]">
        {completed ? (
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
        ) : (
          <Sparkles size={20} className="text-[#C99C48] shrink-0" />
        )}
        <div>
          <div>
            {completed
              ? 'Đã hoàn thành đọc bài viết này'
              : 'Đã đọc xong tư liệu lịch sử này?'}
          </div>
          {xpBanner !== null && (
            <div className="text-xs font-semibold text-emerald-700">
              +{xpBanner} XP đã được cộng vào hồ sơ sử học của bạn!
            </div>
          )}
        </div>
      </div>

      {!completed ? (
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleComplete()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Đánh dấu đã đọc xong (+20 XP)
        </button>
      ) : (
        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Đã ghi nhận
        </span>
      )}
    </div>
  );
}
