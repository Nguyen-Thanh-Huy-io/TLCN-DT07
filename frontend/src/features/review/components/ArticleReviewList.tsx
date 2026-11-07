'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/UserCell';
import { ReviewModal } from './ReviewModal';
import { IconName } from '@/constants/icons';
import { ContentStatus, NoticeTone } from '@/constants/enums';
import { ArticleApiService, ArticleItem, CONTENT_STATUS_LABELS } from '@/services/entities/article.service';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/useAuthSession';

export interface ReviewArticleRow {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  summary: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối';
  rawStatus: string;
  rejectionReason?: string | null;
  isOwn: boolean;
  slug: string;
}

const REVIEW_TAB_BY_STATUS: Record<string, ReviewArticleRow['status']> = {
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

export function ArticleReviewList() {
  const [tab, setTab] = useState<'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối'>('Chờ duyệt');
  const [selectedArticle, setSelectedArticle] = useState<ReviewArticleRow | null>(null);
  const [articlesList, setArticlesList] = useState<ReviewArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const currentUserId = useAuthSession()?.id ?? null;

  const fetchArticlesForReview = async () => {
    try {
      setLoading(true);
      const res = await ArticleApiService.list({ limit: 100 });
      const rawList = res.items || [];

      const mapped: ReviewArticleRow[] = rawList
        .filter((art: ArticleItem) => REVIEW_TAB_BY_STATUS[art.status])
        .filter((art: ArticleItem) => {
          const categoryName = (art.category?.name || '').trim().toLowerCase();
          const categorySlug = (art.category?.slug || '').trim().toLowerCase();
          const normalizedTitle = (art.title || '').trim().toLowerCase();
          const normalizedSlug = (art.slug || '').trim().toLowerCase();

          return (
            categoryName !== 'blog' &&
            categorySlug !== 'blog' &&
            normalizedTitle !== 'cổng la mã và không gian quyền lực' &&
            normalizedSlug !== 'cong-la-ma-va-khong-gian-quyen-luc' &&
            !normalizedSlug.includes('cong-la-ma')
          );
        })
        .map((art: ArticleItem) => {
          const rawStatus = art.status;
          const summary = (art.summary || '').trim();

          return {
            id: art.id,
            title: art.title || 'Không có tiêu đề',
            category: art.category?.name || 'Chưa phân loại',
            author: (art as any)?.creator?.fullName || (art as any)?.creator?.username || 'Biên tập viên',
            date: art.createdAt ? new Date(art.createdAt).toLocaleDateString('vi-VN') : '-',
            summary: summary.length > 220 ? `${summary.slice(0, 220)}...` : summary,
            status: REVIEW_TAB_BY_STATUS[rawStatus],
            rawStatus,
            rejectionReason: (art as any)?.rejectionReason || null,
            isOwn: Boolean(currentUserId && art.createdBy === currentUserId),
            slug: art.slug,
          };
        });

      setArticlesList(mapped);
    } catch (error) {
      setNotice({
        tone: 'error',
        text: extractErrorMessage(error, 'Không thể tải danh sách bài viết cần duyệt.'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticlesForReview();
  }, [currentUserId]);

  const handleApprove = async (article: ReviewArticleRow) => {
    try {
      await ArticleApiService.review(article.id, {
        status: ContentStatus.PUBLISHED,
      });

      setArticlesList((prev) =>
        prev.map((item) =>
          item.id === article.id
            ? { ...item, status: 'Đã duyệt', rawStatus: ContentStatus.PUBLISHED }
            : item
        )
      );

      setNotice({ tone: 'ok', text: `Đã phê duyệt bài viết "${article.title}".` });
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể duyệt bài viết.') });
    }
  };

  const handleReject = async (article: ReviewArticleRow, reason: string) => {
    try {
      await ArticleApiService.review(article.id, {
        status: ContentStatus.REJECTED,
        rejectionReason: reason,
      });

      setArticlesList((prev) =>
        prev.map((item) =>
          item.id === article.id
            ? {
                ...item,
                status: 'Bị từ chối',
                rawStatus: ContentStatus.REJECTED,
                rejectionReason: reason,
              }
            : item
        )
      );

      setNotice({ tone: 'ok', text: `Đã từ chối bài viết "${article.title}". Lý do: ${reason}` });
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể từ chối bài viết.') });
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = articlesList.filter((item) => {
    const matchesTab = item.status === tab;
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.category.toLowerCase().includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="panel management-panel">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kiểm duyệt Bài viết mới tạo</h2>
          <p className="text-xs text-slate-500">Duyệt các bài viết, nhân vật, sự kiện mới được gửi duyệt lần đầu</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
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
            placeholder="Tìm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className="table-scroll">
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
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Đang tải dữ liệu bài viết...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Không có bài viết nào trong danh sách "{tab}".
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.category}</td>
                  <td>
                    <UserCell initials="NA" name={r.author} />
                  </td>
                  <td>{r.date}</td>
                  <td>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {CONTENT_STATUS_LABELS[r.rawStatus as keyof typeof CONTENT_STATUS_LABELS] || r.rawStatus}
                    </span>
                  </td>
                  <td>
                    {r.isOwn && r.status === 'Chờ duyệt' ? (
                      <span className="text-xs text-amber-600" title="Quy tắc 2 người: bài cần người khác duyệt">
                        Bài của bạn (chờ người khác duyệt)
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="review-button"
                        onClick={() => setSelectedArticle(r)}
                      >
                        {r.status === 'Chờ duyệt' ? 'Kiểm duyệt' : 'Xem lại'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedArticle && (
        <ReviewModal
          isOpen={true}
          onClose={() => setSelectedArticle(null)}
          lessonTitle={selectedArticle.title}
          lessonSummary={selectedArticle.summary}
          onApprove={() => {
            handleApprove(selectedArticle);
            setSelectedArticle(null);
          }}
          onReject={(reason) => {
            handleReject(selectedArticle, reason);
            setSelectedArticle(null);
          }}
          onEdit={() => {
            window.location.href = `/articles/${selectedArticle.id}`;
          }}
        />
      )}
    </div>
  );
}
