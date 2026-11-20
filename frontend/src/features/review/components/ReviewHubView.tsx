'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { REVIEW_HUB_ALL_TAB, REVIEW_HUB_TAB_PARAM, reviewHubRoute } from '@/constants/routes';
import {
  DashboardApiService,
  ReviewQueueType,
  type ReviewQueueData,
  type ReviewQueueItem,
} from '@/services/entities/dashboard.service';
import { extractErrorMessage } from '@/services/api';
import { ArticleReviewList } from './ArticleReviewList';
import { BlogReviewList } from './BlogReviewList';
import { ReviewList } from './ReviewList';
import { RevisionReviewList } from './RevisionReviewList';
import { ModerationDashboardView } from '@/features/moderation/components/ModerationDashboardView';

type HubTab = ReviewQueueType | typeof REVIEW_HUB_ALL_TAB;

/** Thứ tự tab = thứ tự xử lý gợi ý: bản sửa (đang ảnh hưởng nội dung công khai) trước. */
const QUEUE_TYPES: ReviewQueueType[] = [
  ReviewQueueType.REVISION,
  ReviewQueueType.ARTICLE,
  ReviewQueueType.LESSON,
  ReviewQueueType.BLOG,
  ReviewQueueType.REPORT,
];

export const REVIEW_TYPE_LABELS: Record<ReviewQueueType, string> = {
  [ReviewQueueType.REVISION]: 'Bản sửa',
  [ReviewQueueType.ARTICLE]: 'Bài viết',
  [ReviewQueueType.LESSON]: 'Bài học',
  [ReviewQueueType.BLOG]: 'Blog',
  [ReviewQueueType.REPORT]: 'Báo cáo cộng đồng',
};

const TYPE_BADGE: Record<ReviewQueueType, string> = {
  [ReviewQueueType.REVISION]: 'bg-amber-100 text-amber-800',
  [ReviewQueueType.ARTICLE]: 'bg-sky-100 text-sky-800',
  [ReviewQueueType.LESSON]: 'bg-emerald-100 text-emerald-800',
  [ReviewQueueType.BLOG]: 'bg-violet-100 text-violet-800',
  [ReviewQueueType.REPORT]: 'bg-rose-100 text-rose-800',
};

/** Danh sách duyệt chi tiết của từng loại (giữ nguyên thao tác duyệt sẵn có). */
const TYPE_PANEL: Record<ReviewQueueType, React.ComponentType<{ onChanged?: () => void }>> = {
  [ReviewQueueType.REVISION]: RevisionReviewList,
  [ReviewQueueType.ARTICLE]: ArticleReviewList,
  [ReviewQueueType.LESSON]: ReviewList,
  [ReviewQueueType.BLOG]: BlogReviewList,
  [ReviewQueueType.REPORT]: ModerationDashboardView,
};

/** Chờ từ bấy nhiêu ngày trở lên thì tô đỏ. */
const OVERDUE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseTab = (value: string | null): HubTab =>
  QUEUE_TYPES.find((type) => type === value) ?? REVIEW_HUB_ALL_TAB;

function waitingLabel(submittedAt: string, now: number): { text: string; overdue: boolean } {
  const days = Math.floor((now - new Date(submittedAt).getTime()) / DAY_MS);
  return { text: days < 1 ? 'Hôm nay' : `${days} ngày`, overdue: days >= OVERDUE_DAYS };
}

function QueueTable({ items, onOpen }: { items: ReviewQueueItem[]; onOpen: (type: ReviewQueueType) => void }) {
  const [now] = useState(() => Date.now());
  if (items.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Không còn việc nào chờ duyệt.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
            <th className="px-4 py-2.5">Nội dung</th>
            <th className="px-4 py-2.5">Loại</th>
            <th className="px-4 py-2.5">Người gửi</th>
            <th className="px-4 py-2.5">Gửi lúc</th>
            <th className="px-4 py-2.5">Đã chờ</th>
            <th className="px-4 py-2.5 text-right" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const waiting = waitingLabel(item.submittedAt, now);
            return (
              <tr key={`${item.type}-${item.id}`} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-semibold text-slate-900">{item.title}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TYPE_BADGE[item.type]}`}>{REVIEW_TYPE_LABELS[item.type]}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{item.submitterName}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(item.submittedAt).toLocaleString('vi-VN')}</td>
                <td className={`px-4 py-2.5 text-xs font-semibold ${waiting.overdue ? 'text-rose-700' : 'text-slate-600'}`}>{waiting.text}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(item.type)}
                    className="rounded-lg bg-[#8B261E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#731F18] cursor-pointer"
                  >
                    Xem &amp; duyệt
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Hàng chờ duyệt: một nơi cho mọi việc duyệt (bản sửa, bài viết, bài học, blog, báo cáo cộng đồng).
 * Tab "Tất cả" là danh sách chung chờ lâu nhất trước; tab từng loại mở danh sách duyệt chi tiết của loại đó.
 */
export function ReviewHubView() {
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseTab(useSearchParams().get(REVIEW_HUB_TAB_PARAM));
  const [queue, setQueue] = useState<ReviewQueueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    DashboardApiService.getReviewQueue()
      .then(setQueue)
      .catch((err) => setError(extractErrorMessage(err, 'Không tải được hàng chờ duyệt.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const selectTab = (next: HubTab) => router.replace(next === REVIEW_HUB_ALL_TAB ? pathname : reviewHubRoute(next));
  const tabClass = (active: boolean, empty: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold cursor-pointer border ${
      active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
    } ${empty && !active ? 'opacity-50' : ''}`;
  const countBadge = (n: number | undefined) => (
    <span className="rounded-full bg-black/10 px-1.5 text-xs">{loading ? '…' : n ?? 0}</span>
  );
  const Panel = tab === REVIEW_HUB_ALL_TAB ? null : TYPE_PANEL[tab];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => selectTab(REVIEW_HUB_ALL_TAB)} className={tabClass(tab === REVIEW_HUB_ALL_TAB, !queue?.total)}>
          Tất cả {countBadge(queue?.total)}
        </button>
        {QUEUE_TYPES.map((type) => (
          <button key={type} type="button" onClick={() => selectTab(type)} className={tabClass(tab === type, !queue?.counts[type])}>
            {REVIEW_TYPE_LABELS[type]} {countBadge(queue?.counts[type])}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}

      {Panel ? (
        <Panel onChanged={load} />
      ) : loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Đang tải hàng chờ duyệt...</p>
      ) : (
        queue && <QueueTable items={queue.items} onOpen={selectTab} />
      )}
    </div>
  );
}
