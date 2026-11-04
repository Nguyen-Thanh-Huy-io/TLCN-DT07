'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/UserCell';
import { ReviewModal } from './ReviewModal';
import { IconName } from '@/constants/icons';
import { ContentStatus, NoticeTone } from '@/constants/enums';
import { LessonItem } from '@/types/models/lesson.type';
import api, { extractErrorMessage, parsePaginatedResponse } from '@/services/api';
import { useAuthSession } from '@/services/auth/useAuthSession';

export interface ReviewLessonRow {
  id: string;
  title: string;
  topic: string;
  author: string;
  date: string;
  summary: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối';
  rawStatus?: string;
  rejectionReason?: string | null;
  /** Bài do chính người đang đăng nhập soạn — không được tự duyệt. */
  isOwn: boolean;
}

// Bài học dùng LessonStatus (DRAFT | REVIEW | PUBLISHED | REJECTED | ARCHIVED). Bản nháp chưa gửi
// duyệt nên không xuất hiện ở đây.
const REVIEW_TAB_BY_STATUS: Record<string, ReviewLessonRow['status']> = {
  REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

export function ReviewList() {
  const [tab, setTab] = useState<'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối'>('Chờ duyệt');
  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonRow | null>(null);
  const [lessonsList, setLessonsList] = useState<ReviewLessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const currentUserId = useAuthSession()?.id ?? null;

  useEffect(() => {
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
          .map((lesson: LessonItem) => {
          const rawStatus = lesson.status;

          const summary = (lesson.contentRichText || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return {
            id: lesson.id,
            title: lesson.title || 'Không có tiêu đề',
            topic: lesson.summary || 'Bài đọc độc lập',
            author:
              (lesson as any)?.creator?.fullName ||
              (lesson as any)?.creator?.username ||
              (lesson as any)?.creator?.email ||
              'Biên tập viên',
            date: lesson.createdAt
              ? new Date(lesson.createdAt).toLocaleDateString('vi-VN')
              : '-',
            summary: summary.length > 220 ? `${summary.slice(0, 220)}...` : summary,
            status: REVIEW_TAB_BY_STATUS[rawStatus],
            rawStatus,
            rejectionReason: lesson.rejectionReason || null,
            isOwn: Boolean(currentUserId && lesson.createdBy === currentUserId),
          };
        });

        setLessonsList(mapped);
      } catch (error) {
        console.error('Failed to fetch review lessons:', error);
        setLessonsList([]);
        setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không tải được danh sách bài học.') });
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsForReview();
  }, [currentUserId]);

  const handleApprove = async (lesson: ReviewLessonRow) => {
    try {
      await api.patch(`/lessons/${lesson.id}/review`, {
        status: ContentStatus.PUBLISHED,
      });

      setLessonsList((prev) =>
        prev.map((item) =>
          item.id === lesson.id
            ? { ...item, status: 'Đã duyệt', rawStatus: ContentStatus.PUBLISHED }
            : item
        )
      );

      setNotice({ tone: 'ok', text: `Đã phê duyệt bài học "${lesson.title}".` });
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể duyệt bài học.') });
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
                status: 'Bị từ chối',
                rawStatus: ContentStatus.REJECTED,
                rejectionReason: reason,
              }
            : item
        )
      );

      setNotice({ tone: 'ok', text: `Đã từ chối bài học "${lesson.title}". Lý do: ${reason}` });
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể từ chối bài học.') });
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
        {(['Chờ duyệt', 'Đã duyệt', 'Bị từ chối'] as const).map((x) => (
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
                  Không có bài học nào trong danh sách "{tab}".
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
                    {r.isOwn && r.status === 'Chờ duyệt' ? (
                      <span title="Quy trình 2 người: bài cần một người duyệt khác">Bài của bạn — chờ người khác duyệt</span>
                    ) : (
                      <button
                        type="button"
                        className="review-button"
                        onClick={() => setSelectedLesson(r)}
                      >
                        <Icon name={IconName.EYE} size={16} /> {r.status === 'Chờ duyệt' ? 'Xem & duyệt' : 'Xem'}
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
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lessonTitle={selectedLesson?.title || ''}
        lessonSummary={selectedLesson?.summary || ''}
        onApprove={() => selectedLesson && handleApprove(selectedLesson)}
        onReject={(reason) =>
          selectedLesson && handleReject(selectedLesson, reason)
        }
      />
    </div>
  );
}
