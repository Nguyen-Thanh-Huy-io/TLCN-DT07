'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/CommonUi';
import {
  creatorInitials,
  creatorLabel,
  REVIEW_TAB_STATUS,
  ReviewTabState,
  STATUS_LABELS,
} from '../review.shared';
import { ReviewModal } from './BlogReviewList';
import { ContentStatus, IconName, NoticeTone } from '@/constants/enums';
import {
  ArticleApiService,
  CONTENT_STATUS_LABELS,
  type ArticleItem,
} from '@/services/entities/article.service';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';

const REVIEW_PAGE_LIMIT_OPTIONS = [20, 50, 100] as const;
const SEARCH_DEBOUNCE_MS = 250;

export interface ReviewArticleRow {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  summary: string;
  status: ReviewTabState;
  rawStatus: string;
  rejectionReason?: string | null;
  isOwn: boolean;
  slug: string;
}

const REVIEW_TAB_BY_STATUS: Record<string, ReviewTabState> = {
  [ContentStatus.PENDING_REVIEW]: ReviewTabState.PENDING,
  [ContentStatus.PUBLISHED]: ReviewTabState.APPROVED,
  [ContentStatus.REJECTED]: ReviewTabState.REJECTED,
};

function mapArticleToRow(art: ArticleItem, currentUserId: string | null): ReviewArticleRow {
  const rawStatus = art.status;
  const summary = (art.summary || '').trim();
  const authorName = creatorLabel(art.creatorName);

  return {
    id: art.id,
    title: art.title || 'Không có tiêu đề',
    category: art.category?.name || 'Chưa phân loại',
    author: authorName,
    date: art.createdAt ? new Date(art.createdAt).toLocaleDateString('vi-VN') : '-',
    summary: summary.length > 320 ? `${summary.slice(0, 320)}...` : summary,
    status: REVIEW_TAB_BY_STATUS[rawStatus] || STATUS_LABELS[rawStatus] || ReviewTabState.PENDING,
    rawStatus,
    rejectionReason: art.rejectionReason || null,
    isOwn: Boolean(currentUserId && art.createdBy === currentUserId),
    slug: art.slug,
  };
}

/** Gọi sau mỗi lần duyệt / từ chối thành công (Hàng chờ duyệt dùng để cập nhật số trên tab). */
export function ArticleReviewList({ onChanged }: { onChanged?: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<ReviewTabState>(ReviewTabState.PENDING);
  const [selectedArticle, setSelectedArticle] = useState<ReviewArticleRow | null>(null);
  const [articlesList, setArticlesList] = useState<ReviewArticleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(REVIEW_PAGE_LIMIT_OPTIONS[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const currentUserId = useAuthSession()?.id ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ArticleApiService.list({
        status: REVIEW_TAB_STATUS[tab],
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      const rows = (res.items || []).map((art) => mapArticleToRow(art, currentUserId));
      setArticlesList(rows);
      setTotal(res.total ?? rows.length);
    } catch (error) {
      setArticlesList([]);
      setTotal(0);
      setNotice({
        tone: NoticeTone.ERROR,
        text: extractErrorMessage(error, 'Không thể tải danh sách bài viết cần duyệt.'),
      });
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page, limit, currentUserId]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  const handleApprove = async (article: ReviewArticleRow) => {
    try {
      await ArticleApiService.review(article.id, {
        status: ContentStatus.PUBLISHED,
      });
      setNotice({ tone: NoticeTone.OK, text: `Đã phê duyệt bài viết "${article.title}".` });
      void loadArticles();
      onChanged?.();
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể duyệt bài viết.') });
    }
  };

  const handleReject = async (article: ReviewArticleRow, reason: string) => {
    try {
      await ArticleApiService.review(article.id, {
        status: ContentStatus.REJECTED,
        rejectionReason: reason,
      });
      setNotice({ tone: NoticeTone.OK, text: `Đã từ chối bài viết "${article.title}". Lý do: ${reason}` });
      void loadArticles();
      onChanged?.();
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể từ chối bài viết.') });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="panel management-panel min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Kiểm duyệt Bài viết</h2>
          <p className="text-xs text-slate-500">
            Duyệt các bài viết, nhân vật, sự kiện gửi duyệt lần đầu ({total.toLocaleString('vi-VN')} bài)
          </p>
        </div>
        <div className="inline-flex self-start sm:self-auto flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {[ReviewTabState.PENDING, ReviewTabState.APPROVED, ReviewTabState.REJECTED].map((x) => (
            <button
              key={x}
              type="button"
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                tab === x ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => {
                setTab(x);
                setPage(1);
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={`my-3 rounded-lg border px-3.5 py-2.5 text-sm ${
            notice.tone === NoticeTone.OK
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="toolbar">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={17} />
          <input
            placeholder="Tìm bài viết theo tiêu đề, tóm tắt..."
            aria-label="Tìm bài viết"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className="w-full min-w-0 overflow-x-auto">
        <table className="management-table">
          <thead>
            <tr>
              <th>BÀI VIẾT</th>
              <th>CHUYÊN MỤC</th>
              <th>NGƯỜI TẠO</th>
              <th>NGÀY GỬI</th>
              <th>TRẠNG THÁI</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Đang tải dữ liệu bài viết...
                </td>
              </tr>
            ) : articlesList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Không có bài viết nào trong danh sách &ldquo;{tab}&rdquo;.
                </td>
              </tr>
            ) : (
              articlesList.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td className="whitespace-nowrap">{r.category}</td>
                  <td className="whitespace-nowrap">
                    <UserCell initials={creatorInitials(r.author)} name={r.author} />
                  </td>
                  <td className="whitespace-nowrap">{r.date}</td>
                  <td className="whitespace-nowrap">
                    <span className="inline-block whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {CONTENT_STATUS_LABELS[r.rawStatus as keyof typeof CONTENT_STATUS_LABELS] || r.rawStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {r.isOwn && r.status === ReviewTabState.PENDING ? (
                      <span className="text-xs text-amber-600" title="Quy tắc 2 người: bài cần người khác duyệt">
                        Bài của bạn (chờ người khác duyệt)
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="review-button whitespace-nowrap"
                        onClick={() => setSelectedArticle(r)}
                      >
                        {r.status === ReviewTabState.PENDING ? 'Kiểm duyệt' : 'Xem lại'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Tổng <strong>{total.toLocaleString('vi-VN')}</strong> bài viết
          </span>
          <select
            aria-label="Số bài mỗi trang"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            {REVIEW_PAGE_LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            ‹ Trước
          </button>
          <span className="px-2 font-semibold tabular-nums">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            Sau ›
          </button>
        </div>
      </div>

      {selectedArticle && (
        <ReviewModal
          itemLabel="bài viết"
          isOpen={true}
          isPublished={selectedArticle.rawStatus === ContentStatus.PUBLISHED}
          rejectionReason={selectedArticle.rejectionReason}
          onClose={() => setSelectedArticle(null)}
          lessonTitle={selectedArticle.title}
          lessonSummary={selectedArticle.summary}
          onApprove={() => {
            void handleApprove(selectedArticle);
            setSelectedArticle(null);
          }}
          onReject={(reason) => {
            void handleReject(selectedArticle, reason);
            setSelectedArticle(null);
          }}
          onEdit={() => {
            router.push(`/articles/${selectedArticle.id}`);
          }}
        />
      )}
    </div>
  );
}
