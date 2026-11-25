'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/CommonUi';
import {
  creatorInitials,
  creatorLabel,
  REVIEW_TABS,
  REVIEW_TAB_STATUS,
  ReviewTabState,
} from '../review.shared';
import { ReviewModal } from './BlogReviewList';
import { ContentStatus, IconName, NoticeTone } from '@/constants/enums';
import type { LessonItem } from '@/types/models';
import api, { extractErrorMessage, parsePaginatedResponse } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';

const LESSON_PAGE_LIMIT_OPTIONS = [20, 50, 100] as const;
const SEARCH_DEBOUNCE_MS = 250;

export interface ReviewLessonRow {
  id: string;
  title: string;
  topic: string;
  author: string;
  date: string;
  summary: string;
  status: ReviewTabState;
  rawStatus?: string;
  rejectionReason?: string | null;
  isOwn: boolean;
}

const REVIEW_TAB_BY_STATUS: Partial<Record<string, ReviewTabState>> = {
  [ContentStatus.PENDING_REVIEW]: ReviewTabState.PENDING,
  [ContentStatus.PUBLISHED]: ReviewTabState.APPROVED,
  [ContentStatus.REJECTED]: ReviewTabState.REJECTED,
};

function mapLessonToRow(lesson: LessonItem, currentUserId: string | null): ReviewLessonRow {
  const rawStatus = lesson.status;

  const summary = (lesson.contentRichText || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const authorName = creatorLabel(lesson.creatorName);

  return {
    id: lesson.id,
    title: lesson.title || 'Không có tiêu đề',
    topic: lesson.summary || 'Bài đọc độc lập',
    author: authorName,
    date: lesson.createdAt
      ? new Date(lesson.createdAt).toLocaleDateString('vi-VN')
      : '-',
    summary: summary.length > 320 ? `${summary.slice(0, 320)}...` : summary,
    status: REVIEW_TAB_BY_STATUS[rawStatus] || ReviewTabState.PENDING,
    rawStatus,
    rejectionReason: lesson.rejectionReason || null,
    isOwn: Boolean(currentUserId && lesson.createdBy === currentUserId),
  };
}

/** Gọi sau mỗi lần duyệt / từ chối thành công (Hàng chờ duyệt dùng để cập nhật số trên tab). */
export function ReviewList({ onChanged }: { onChanged?: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<ReviewTabState>(ReviewTabState.PENDING);
  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonRow | null>(null);
  const [lessonsList, setLessonsList] = useState<ReviewLessonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(LESSON_PAGE_LIMIT_OPTIONS[0]);
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

  const fetchLessonsForReview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/lessons', {
        params: {
          page,
          limit,
          status: REVIEW_TAB_STATUS[tab],
          search: debouncedSearch || undefined,
        },
      });
      const parsed = parsePaginatedResponse<LessonItem>(response.data);
      const mapped = parsed.items.map((lesson) => mapLessonToRow(lesson, currentUserId));
      setLessonsList(mapped);
      setTotal(parsed.total ?? mapped.length);
    } catch (error) {
      setLessonsList([]);
      setTotal(0);
      setNotice({
        tone: NoticeTone.ERROR,
        text: extractErrorMessage(error, 'Không tải được danh sách bài học.'),
      });
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page, limit, currentUserId]);

  useEffect(() => {
    void fetchLessonsForReview();
  }, [fetchLessonsForReview]);

  const handleApprove = async (lesson: ReviewLessonRow) => {
    try {
      await api.patch(`/lessons/${lesson.id}/review`, {
        status: ContentStatus.PUBLISHED,
      });
      setNotice({ tone: NoticeTone.OK, text: `Đã phê duyệt bài học "${lesson.title}".` });
      void fetchLessonsForReview();
      onChanged?.();
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể duyệt bài học.') });
    }
  };

  const handleReject = async (lesson: ReviewLessonRow, reason: string) => {
    try {
      await api.patch(`/lessons/${lesson.id}/review`, {
        status: ContentStatus.REJECTED,
        rejectionReason: reason,
      });
      setNotice({ tone: NoticeTone.OK, text: `Đã từ chối bài học "${lesson.title}". Lý do: ${reason}` });
      void fetchLessonsForReview();
      onChanged?.();
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể từ chối bài học.') });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="panel management-panel min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Kiểm duyệt Bài học</h2>
          <p className="text-xs text-slate-500">
            Duyệt các bài học trong chương trình học ({total.toLocaleString('vi-VN')} bài)
          </p>
        </div>
        <div className="inline-flex self-start sm:self-auto flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {REVIEW_TABS.map((x) => (
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
            placeholder="Tìm bài học theo tiêu đề..."
            aria-label="Tìm bài học"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className="w-full min-w-0 overflow-x-auto">
        <table className="management-table">
          <thead>
            <tr>
              <th>BÀI HỌC</th>
              <th>MÔ TẢ NGẮN</th>
              <th>NGƯỜI TẠO</th>
              <th>NGÀY GỬI</th>
              <th>NGUỒN</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Đang tải dữ liệu bài học...
                </td>
              </tr>
            ) : lessonsList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Không có bài học nào trong danh sách &ldquo;{tab}&rdquo;.
                </td>
              </tr>
            ) : (
              lessonsList.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.topic}</td>
                  <td className="whitespace-nowrap">
                    <UserCell initials={creatorInitials(r.author)} name={r.author} />
                  </td>
                  <td className="whitespace-nowrap">{r.date}</td>
                  <td className="whitespace-nowrap">
                    <span className="source-ok whitespace-nowrap">✓ Đã cung cấp</span>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {r.isOwn && r.status === ReviewTabState.PENDING ? (
                      <span className="text-xs text-amber-600" title="Quy trình 2 người: bài cần một người duyệt khác">
                        Bài của bạn — chờ người khác duyệt
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="review-button whitespace-nowrap"
                        onClick={() => setSelectedLesson(r)}
                      >
                        <Icon name={IconName.EYE} size={16} />{' '}
                        {r.status === ReviewTabState.PENDING ? 'Xem & duyệt' : 'Xem lại'}
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
            Tổng <strong>{total.toLocaleString('vi-VN')}</strong> bài học
          </span>
          <select
            aria-label="Số bài học mỗi trang"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            {LESSON_PAGE_LIMIT_OPTIONS.map((opt) => (
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

      <ReviewModal
        isOpen={Boolean(selectedLesson)}
        isPublished={selectedLesson?.rawStatus === ContentStatus.PUBLISHED}
        rejectionReason={selectedLesson?.rejectionReason}
        onClose={() => setSelectedLesson(null)}
        lessonTitle={selectedLesson?.title || ''}
        lessonSummary={selectedLesson?.summary || ''}
        onApprove={() => {
          if (selectedLesson) {
            void handleApprove(selectedLesson);
          }
        }}
        onReject={(reason) => {
          if (selectedLesson) {
            void handleReject(selectedLesson, reason);
          }
        }}
        onEdit={
          selectedLesson
            ? () => router.push(`/lessons/${selectedLesson.id}`)
            : undefined
        }
      />
    </div>
  );
}
