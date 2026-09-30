'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/UserCell';
import { ReviewModal } from './ReviewModal';
import { IconName } from '@/constants/icons';
import { ContentStatus } from '@/constants/enums';
import api from '@/services/api';

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
}

const DEFAULT_REVIEW_LESSONS: ReviewLessonRow[] = [
  {
    id: 'rev-1',
    title: 'Chiến dịch Điện Biên Phủ năm 1954',
    topic: 'Chiến dịch Điện Biên Phủ',
    author: 'Nguyễn Văn A',
    date: '22/09/2026',
    summary:
      'Bài học tổng hợp chi tiết 3 đợt tiến công của quân ta, phân tích tầm vóc lịch sử của chiến thắng lừng lẫy năm châu, chấn động địa cầu.',
    status: 'Chờ duyệt',
    rawStatus: ContentStatus.PENDING_REVIEW,
  },
  {
    id: 'rev-2',
    title: 'Nguyên nhân bùng nổ Toàn quốc kháng chiến',
    topic: 'Kháng chiến toàn quốc',
    author: 'Mai Trang',
    date: '21/09/2026',
    summary:
      'Lời kêu gọi Toàn quốc kháng chiến của Chủ tịch Hồ Chí Minh đêm ngày 19/12/1946 tại Vạn Phúc, Hà Đông.',
    status: 'Chờ duyệt',
    rawStatus: ContentStatus.PENDING_REVIEW,
  },
  {
    id: 'rev-3',
    title: 'Nội dung Hiệp định Genève 1954',
    topic: 'Hiệp định Genève',
    author: 'Lê Hoàng',
    date: '20/09/2026',
    summary:
      'Các điều khoản chính của hiệp định về chấm dứt chiến sự ở Đông Dương, rút quân và giới tuyến quân sự tạm thời tại vĩ tuyến 17.',
    status: 'Đã duyệt',
    rawStatus: ContentStatus.PUBLISHED,
  },
];

export function ReviewList() {
  const [tab, setTab] = useState<'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối'>('Chờ duyệt');
  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonRow | null>(null);
  const [lessonsList, setLessonsList] = useState<ReviewLessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLessonsForReview = async () => {
      try {
        setLoading(true);
        const response = await api.get('/lessons', {
          params: { page: 1, limit: 100 },
        });

        const items = response.data?.items || response.data?.data || [];
        const rawList = Array.isArray(items) ? items : [];

        if (rawList.length === 0) {
          setLessonsList(DEFAULT_REVIEW_LESSONS);
          return;
        }

        const mapped: ReviewLessonRow[] = rawList.map((lesson: any) => {
          const rawStatus = lesson.status || ContentStatus.DRAFT;
          const statusMap: Record<string, ReviewLessonRow['status']> = {
            [ContentStatus.DRAFT]: 'Chờ duyệt',
            [ContentStatus.PENDING_REVIEW]: 'Chờ duyệt',
            [ContentStatus.PUBLISHED]: 'Đã duyệt',
            [ContentStatus.REJECTED]: 'Bị từ chối',
            [ContentStatus.ARCHIVED]: 'Bị từ chối',
          };

          const summary = (lesson.contentRichText || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return {
            id: lesson.id,
            title: lesson.title || 'Không có tiêu đề',
            topic: lesson.topic?.name || 'Chưa có chủ đề',
            author:
              lesson.creator?.fullName ||
              lesson.creator?.username ||
              lesson.creator?.email ||
              'N/A',
            date: lesson.createdAt
              ? new Date(lesson.createdAt).toLocaleDateString('vi-VN')
              : '-',
            summary: summary.length > 220 ? `${summary.slice(0, 220)}...` : summary,
            status: statusMap[rawStatus] || 'Chờ duyệt',
            rawStatus,
            rejectionReason: lesson.rejectionReason || null,
          };
        });

        setLessonsList(mapped);
      } catch (error) {
        console.error('Failed to fetch review lessons, using fallback:', error);
        setLessonsList(DEFAULT_REVIEW_LESSONS);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsForReview();
  }, []);

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

      alert(`Đã phê duyệt bài học "${lesson.title}" thành công!`);
    } catch (error) {
      console.error('Approve lesson failed:', error);
      alert('Không thể duyệt bài học. Vui lòng kiểm tra quyền admin và token.');
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

      alert(`Đã từ chối bài học "${lesson.title}". Lý do: ${reason}`);
    } catch (error) {
      console.error('Reject lesson failed:', error);
      alert('Không thể từ chối bài học. Vui lòng kiểm tra quyền admin và token.');
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
      <div className="tabs">
        {(['Chờ duyệt', 'Đã duyệt', 'Bị từ chối'] as const).map((x) => (
          <button
            key={x}
            type="button"
            className={tab === x ? 'active' : ''}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
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
                    <button
                      type="button"
                      className="review-button"
                      onClick={() => setSelectedLesson(r)}
                    >
                      <Icon name={IconName.EYE} size={16} /> Xem & duyệt
                    </button>
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
