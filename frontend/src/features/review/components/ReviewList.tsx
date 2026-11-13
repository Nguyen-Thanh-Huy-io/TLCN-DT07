'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/CommonUi';
import { ReviewModal } from './ReviewModal';
import { IconName } from '@/constants/enums';
import { ContentStatus, NoticeTone } from '@/constants/enums';
import type { LessonItem } from '@/types/models';
import api, { extractErrorMessage, parsePaginatedResponse } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import {
  REVIEW_TABS,
  ReviewTabState,
} from '../types/review.types';

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

interface ExtendedLessonItem extends LessonItem {
  creator?: {
    fullName?: string;
    username?: string;
    email?: string;
  };
}

const REVIEW_TAB_BY_STATUS: Record<string, ReviewTabState> = {
  REVIEW: ReviewTabState.PENDING,
  PUBLISHED: ReviewTabState.APPROVED,
  REJECTED: ReviewTabState.REJECTED,
};

function mapLessonToRow(lesson: LessonItem, currentUserId: string | null): ReviewLessonRow {
  const extended = lesson as ExtendedLessonItem;
  const rawStatus = lesson.status;

  const summary = (lesson.contentRichText || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const authorName =
    extended.creator?.fullName ||
    extended.creator?.username ||
    extended.creator?.email ||
    'Biên tập viên';

  return {
    id: lesson.id,
    title: lesson.title || 'Không có tiêu đề',
    topic: lesson.summary || 'Bài đọc độc lập',
    author: authorName,
    date: lesson.createdAt
      ? new Date(lesson.createdAt).toLocaleDateString('vi-VN')
      : '-',
    summary: summary.length > 220 ? `${summary.slice(0, 220)}...` : summary,
    status: REVIEW_TAB_BY_STATUS[rawStatus] || ReviewTabState.PENDING,
    rawStatus,
    rejectionReason: lesson.rejectionReason || null,
    isOwn: Boolean(currentUserId && lesson.createdBy === currentUserId),
  };
}

export function ReviewList() {
  const [tab, setTab] = useState<ReviewTabState>(ReviewTabState.PENDING);
  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonRow | null>(null);
  const [lessonsList, setLessonsList] = useState<ReviewLessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const currentUserId = useAuthSession()?.id ?? null;

  useEffect(() => {
    let active = true;
    const fetchLessonsForReview = async () => {
      try {
        setLoading(true);
        const response = await api.get('/lessons', {
          params: { page: 1, limit: 100 },
        });

        const parsed = parsePaginatedResponse<LessonItem>(response.data);
        const rawList = parsed.items;

        const mapped: ReviewLessonRow[] = rawList
          .filter((lesson: LessonItem) => REVIEW_TAB_BY_STATUS[lesson.status])
          .map((lesson: LessonItem) => mapLessonToRow(lesson, currentUserId));

        if (active) {
          setLessonsList(mapped);
        }
      } catch (error) {
        if (active) {
          setLessonsList([]);
          setNotice({
            tone: NoticeTone.ERROR,
            text: extractErrorMessage(error, 'Không tải được danh sách bài học.'),
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchLessonsForReview();
    return () => {
      active = false;
    };
  }, [currentUserId]);

  const handleApprove = async (lesson: ReviewLessonRow) => {
    try {
      await api.patch(`/lessons/${lesson.id}/review`, {
        status: ContentStatus.PUBLISHED,
      });

      setLessonsList((prev) =>
        prev.map((item) =>
          item.id === lesson.id
            ? { ...item, status: ReviewTabState.APPROVED, rawStatus: ContentStatus.PUBLISHED }
            : item,
        ),
      );

      setNotice({ tone: NoticeTone.OK, text: `Đã phê duyệt bài học "${lesson.title}".` });
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

      setLessonsList((prev) =>
        prev.map((item) =>
          item.id === lesson.id
            ? {
                ...item,
                status: ReviewTabState.REJECTED,
                rawStatus: ContentStatus.REJECTED,
                rejectionReason: reason,
              }
            : item,
        ),
      );

      setNotice({ tone: NoticeTone.OK, text: `Đã từ chối bài học "${lesson.title}". Lý do: ${reason}` });
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể từ chối bài học.') });
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = lessonsList.filter((item) => {
    const matchesTab = item.status === tab;
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.topic.toLowerCase().includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="panel management-panel">
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {REVIEW_TABS.map((x) => (
          <button
            key={x}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              tab === x ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      {notice && (
        <div
          role="status"
          style={{
            margin: '12px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: notice.tone === NoticeTone.OK ? '#ecfdf5' : '#fef2f2',
            color: notice.tone === NoticeTone.OK ? '#065f46' : '#991b1b',
          }}
        >
          {notice.text}
        </div>
      )}
      <div className="toolbar">
        <label className="search-box">
          <Icon name={IconName.SEARCH} size={17} />
          <input
            placeholder="Tìm bài học..."
            aria-label="Tìm bài học"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filters">
          <button type="button">
            <Icon name={IconName.FILTER} size={14} />
            Chủ đề<span>⌄</span>
          </button>
          <button type="button">
            Ngày gửi<span>⌄</span>
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th>BÀI HỌC</th>
              <th>CHỦ ĐỀ</th>
              <th>NGƯỜI TẠO</th>
              <th>NGÀY GỬI</th>
              <th>TRẠNG THÁI / NGUỒN</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Đang tải dữ liệu bài học...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Không có bài học nào trong danh sách &ldquo;{tab}&rdquo;.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.topic}</td>
                  <td>
                    <UserCell initials="NA" name={r.author} />
                  </td>
                  <td>{r.date}</td>
                  <td>
                    <span className="source-ok">✓ Đã cung cấp</span>
                  </td>
                  <td>
                    {r.isOwn && r.status === ReviewTabState.PENDING ? (
                      <span title="Quy trình 2 người: bài cần một người duyệt khác">Bài của bạn — chờ người khác duyệt</span>
                    ) : (
                      <button
                        type="button"
                        className="review-button"
                        onClick={() => setSelectedLesson(r)}
                      >
                        <Icon name={IconName.EYE} size={16} /> {r.status === ReviewTabState.PENDING ? 'Xem & duyệt' : 'Xem'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>{filtered.length} bài học</span>
        <div>
          <button type="button" className="selected">1</button>
        </div>
      </div>

      <ReviewModal
        isOpen={Boolean(selectedLesson)}
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
      />
    </div>
  );
}
