'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, GitCommitVertical, PenLine, RefreshCw } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import { DashboardApiService, type DashboardOverviewData } from '@/services/entities/dashboard.service';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import { ContentStockCard, MyWorkCard, RecentActivityTable, ReviewQueueCard } from './DashboardParts';

const QUICK_ACTIONS = [
  { label: 'Viết bài', href: APP_ROUTES.ARTICLES.CREATE, icon: PenLine },
  { label: 'Soạn bài học', href: APP_ROUTES.LESSONS.CREATE, icon: BookOpen },
  { label: 'Tạo đề thi', href: APP_ROUTES.QUIZZES, icon: ClipboardList },
  { label: 'Tạo dòng thời gian', href: APP_ROUTES.TIMELINES.CREATE, icon: GitCommitVertical },
];

/**
 * Dashboard CMS theo việc cần làm: việc của bạn (chờ duyệt / bài của bạn) → kho nội dung theo trạng thái
 * → cập nhật gần đây → thao tác nhanh.
 */
export function DashboardView() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));

  const load = useCallback(() => {
    setLoading(true);
    DashboardApiService.getOverview()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err, 'Không tải được số liệu tổng quan.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
        {error}
        <button type="button" onClick={load} className="ml-2 font-bold underline cursor-pointer">Thử lại</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50">
              <Icon size={15} className="text-[#8B261E]" /> {label}
            </Link>
          ))}
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      <section className={`grid gap-4 ${isReviewer ? 'lg:grid-cols-2' : ''}`}>
        {isReviewer && <ReviewQueueCard counts={data.reviewCounts} />}
        <MyWorkCard work={data.myWork} />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Kho nội dung</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.contentStats.map((stat) => (
            <ContentStockCard key={stat.type} stat={stat} />
          ))}
        </div>
      </section>

      <RecentActivityTable items={data.recentActivities} />
    </div>
  );
}
