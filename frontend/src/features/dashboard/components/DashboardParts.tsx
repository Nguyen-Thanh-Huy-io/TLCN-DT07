'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, BookOpen, ClipboardList, FileEdit, GitCommitVertical, Hourglass, Inbox, PenLine, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/common/CommonUi';
import { ContentStatus } from '@/constants/enums';
import { APP_ROUTES, REVIEW_HUB_ALL_TAB, reviewHubRoute } from '@/constants/routes';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { REVIEW_TYPE_LABELS } from '@/features/review/components/ReviewHubView';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import {
  DashboardActivityType,
  DashboardApiService,
  DashboardContentType,
  ReviewQueueType,
  type ContentStat,
  type DashboardOverviewData,
  type MyWork,
  type RecentActivityItem,
  type ReviewCounts,
} from '@/services/entities/dashboard.service';

const card = 'rounded-xl border border-slate-200 bg-white p-5 shadow-2xs';
const sectionTitle = 'text-sm font-bold text-slate-900';

// --- ReviewQueueCard ---
/** Người duyệt: tổng việc chờ duyệt + số theo loại, bấm để mở đúng tab của Hàng chờ duyệt. */
export function ReviewQueueCard({ counts }: { counts: ReviewCounts }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const types = Object.values(ReviewQueueType);
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h3 className={`${sectionTitle} flex items-center gap-2`}>
          <Inbox size={16} className="text-[#8B261E]" /> Chờ bạn duyệt
        </h3>
        <Link href={reviewHubRoute(REVIEW_HUB_ALL_TAB)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B261E] hover:underline">
          Mở hàng chờ <ArrowRight size={13} />
        </Link>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{total}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {types.map((type) => (
          <Link
            key={type}
            href={reviewHubRoute(type)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              counts[type] ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-400'
            }`}
          >
            {REVIEW_TYPE_LABELS[type]} <strong>{counts[type]}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- MyWorkCard ---
const EDIT_ROUTE: Record<ReviewQueueType.ARTICLE | ReviewQueueType.LESSON, (id: string) => string> = {
  [ReviewQueueType.ARTICLE]: APP_ROUTES.ARTICLES.DETAIL,
  [ReviewQueueType.LESSON]: APP_ROUTES.LESSONS.DETAIL,
};

/** Biên tập viên: bản nháp, bài đang chờ duyệt, bài bị từ chối cần sửa (kèm lý do). */
export function MyWorkCard({ work }: { work: MyWork }) {
  const stat = (icon: React.ReactNode, value: number, label: string, tone: string) => (
    <div className={`rounded-lg px-3 py-2.5 ${tone}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold">{icon} {label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
  return (
    <div className={card}>
      <h3 className={sectionTitle}>Bài của bạn</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {stat(<FileEdit size={13} />, work.drafts, 'Bản nháp', 'bg-slate-50 text-slate-700')}
        {stat(<Hourglass size={13} />, work.pending, 'Chờ duyệt', 'bg-amber-50 text-amber-900')}
        {stat(<AlertTriangle size={13} />, work.rejectedCount, 'Bị từ chối', work.rejectedCount ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-500')}
      </div>
      {work.rejected.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100">
          {work.rejected.map((item) => (
            <li key={`${item.type}-${item.id}`} className="py-2">
              <Link href={EDIT_ROUTE[item.type](item.id)} className="text-sm font-semibold text-slate-900 hover:text-[#8B261E]">
                {item.title}
              </Link>
              <p className="text-xs text-rose-700">{item.rejectionReason || 'Người duyệt chưa ghi lý do.'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- ContentStockCard ---
const CONTENT_META: Record<DashboardContentType, { label: string; route: string }> = {
  [DashboardContentType.ARTICLE]: { label: 'Bài viết', route: APP_ROUTES.ARTICLES.LIST },
  [DashboardContentType.LESSON]: { label: 'Bài học', route: APP_ROUTES.CURRICULUM },
  [DashboardContentType.TIMELINE]: { label: 'Dòng thời gian', route: APP_ROUTES.TIMELINES.LIST },
  [DashboardContentType.QUIZ]: { label: 'Đề thi', route: APP_ROUTES.QUIZZES },
};

/** Thứ tự + màu từng đoạn trên thanh trạng thái. */
const STATUS_SEGMENTS: { status: ContentStatus; color: string }[] = [
  { status: ContentStatus.PUBLISHED, color: 'bg-emerald-500' },
  { status: ContentStatus.PENDING_REVIEW, color: 'bg-amber-400' },
  { status: ContentStatus.DRAFT, color: 'bg-slate-400' },
  { status: ContentStatus.REJECTED, color: 'bg-rose-500' },
  { status: ContentStatus.ARCHIVED, color: 'bg-slate-200' },
];

export function ContentStockCard({ stat }: { stat: ContentStat }) {
  const meta = CONTENT_META[stat.type];
  const byStatus = stat.byStatus;
  return (
    <Link href={meta.route} className={`${card} block hover:border-slate-300`}>
      <div className="text-xs font-semibold text-slate-500">{meta.label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{stat.total}</div>
      {byStatus ? (
        <>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
            {stat.total > 0 &&
              STATUS_SEGMENTS.map(({ status, color }) => (
                <div key={status} className={color} style={{ width: `${(byStatus[status] / stat.total) * 100}%` }} />
              ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            {STATUS_SEGMENTS.filter(({ status }) => byStatus[status] > 0).map(({ status, color }) => (
              <span key={status} className="inline-flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${color}`} /> {STATUS_LABEL_MAP[status]} {byStatus[status]}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-[11px] text-slate-400">Đề thi chưa có trạng thái xuất bản riêng.</p>
      )}
    </Link>
  );
}

// --- RecentActivityTable ---
const ACTIVITY_META: Record<DashboardActivityType, { label: string; route: (id: string) => string }> = {
  [DashboardActivityType.ARTICLE]: { label: 'Bài viết', route: APP_ROUTES.ARTICLES.DETAIL },
  [DashboardActivityType.LESSON]: { label: 'Bài học', route: APP_ROUTES.LESSONS.DETAIL },
  [DashboardActivityType.TOPIC]: { label: 'Chủ đề', route: APP_ROUTES.TOPICS.DETAIL },
};
const ALL_ACTIVITY_TYPES = 'ALL';

export function RecentActivityTable({ items }: { items: RecentActivityItem[] }) {
  const [filter, setFilter] = useState<DashboardActivityType | typeof ALL_ACTIVITY_TYPES>(ALL_ACTIVITY_TYPES);
  const shown = filter === ALL_ACTIVITY_TYPES ? items : items.filter((i) => i.type === filter);
  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={sectionTitle}>Cập nhật gần đây</h3>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setFilter(ALL_ACTIVITY_TYPES)} className={chip(filter === ALL_ACTIVITY_TYPES)}>Tất cả</button>
          {Object.values(DashboardActivityType).map((type) => (
            <button key={type} type="button" onClick={() => setFilter(type)} className={chip(filter === type)}>
              {ACTIVITY_META[type].label}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 py-8 text-center text-sm text-slate-500">Chưa có cập nhật nào.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="py-2 pr-3">Nội dung</th>
                <th className="py-2 pr-3">Loại</th>
                <th className="py-2 pr-3">Trạng thái</th>
                <th className="py-2 pr-3">Người tạo</th>
                <th className="py-2">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-b border-slate-50 last:border-b-0">
                  <td className="py-2.5 pr-3">
                    <Link href={ACTIVITY_META[item.type].route(item.id)} className="font-semibold text-slate-900 hover:text-[#8B261E]">
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-slate-600">{ACTIVITY_META[item.type].label}</td>
                  <td className="py-2.5 pr-3">
                    <Badge tone={STATUS_TONE_MAP[item.status]}>{STATUS_LABEL_MAP[item.status]}</Badge>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-slate-600">{item.authorName}</td>
                  <td className="py-2.5 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Merged from DashboardView.tsx ---
const QUICK_ACTIONS = [
  { label: 'Viết bài', href: APP_ROUTES.ARTICLES.CREATE, icon: PenLine },
  { label: 'Soạn bài học', href: APP_ROUTES.LESSONS.CREATE, icon: BookOpen },
  { label: 'Tạo đề thi', href: APP_ROUTES.QUIZZES, icon: ClipboardList },
  { label: 'Tạo dòng thời gian', href: APP_ROUTES.TIMELINES.CREATE, icon: GitCommitVertical },
];

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
