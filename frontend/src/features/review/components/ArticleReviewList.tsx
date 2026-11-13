'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { UserCell } from '@/components/common/CommonUi';
import { ReviewModal } from './ReviewModal';
import { IconName } from '@/constants/enums';
import { ContentStatus, NoticeTone } from '@/constants/enums';
import { ArticleApiService, type ArticleItem, CONTENT_STATUS_LABELS } from '@/services/entities/article.service';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { ReviewTabState, STATUS_LABELS } from '../constants/review.constant';

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

const EXCLUDED_CATEGORY_SLUG = 'blog';
const EXCLUDED_ARTICLE_SLUG = 'cong-la-ma-va-khong-gian-quyen-luc';

interface ExtendedArticleItem extends ArticleItem {
  creator?: {
    fullName?: string;
    username?: string;
  };
  rejectionReason?: string | null;
}

function isEligibleArticle(art: ArticleItem): boolean {
  const categoryName = (art.category?.name || '').trim().toLowerCase();
  const categorySlug = (art.category?.slug || '').trim().toLowerCase();
  const normalizedSlug = (art.slug || '').trim().toLowerCase();

  return (
    categoryName !== EXCLUDED_CATEGORY_SLUG &&
    categorySlug !== EXCLUDED_CATEGORY_SLUG &&
    normalizedSlug !== EXCLUDED_ARTICLE_SLUG &&
    !normalizedSlug.includes('cong-la-ma')
  );
}

function mapArticleToRow(art: ArticleItem, currentUserId: string | null): ReviewArticleRow {
  const extended = art as ExtendedArticleItem;
  const rawStatus = art.status;
  const summary = (art.summary || '').trim();
  const authorName = extended.creator?.fullName || extended.creator?.username || 'Biên tập viên';

  return {
    id: art.id,
    title: art.title || 'Không có tiêu đề',
    category: art.category?.name || 'Chưa phân loại',
    author: authorName,
    date: art.createdAt ? new Date(art.createdAt).toLocaleDateString('vi-VN') : '-',
    summary: summary.length > 220 ? `${summary.slice(0, 220)}...` : summary,
    status: REVIEW_TAB_BY_STATUS[rawStatus] || STATUS_LABELS[rawStatus] || ReviewTabState.PENDING,
    rawStatus,
    rejectionReason: extended.rejectionReason || null,
    isOwn: Boolean(currentUserId && art.createdBy === currentUserId),
    slug: art.slug,
  };
}

export function ArticleReviewList() {
  const router = useRouter();
  const [tab, setTab] = useState<ReviewTabState>(ReviewTabState.PENDING);
  const [selectedArticle, setSelectedArticle] = useState<ReviewArticleRow | null>(null);
  const [articlesList, setArticlesList] = useState<ReviewArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const currentUserId = useAuthSession()?.id ?? null;

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        setLoading(true);
        const res = await ArticleApiService.list({ limit: 100 });
        const rawList = res.items || [];

        const mapped: ReviewArticleRow[] = rawList
          .filter((art: ArticleItem) => REVIEW_TAB_BY_STATUS[art.status])
          .filter(isEligibleArticle)
          .map((art: ArticleItem) => mapArticleToRow(art, currentUserId));

        if (active) {
          setArticlesList(mapped);
        }
      } catch (error) {
        if (active) {
          setNotice({
            tone: NoticeTone.ERROR,
            text: extractErrorMessage(error, 'Không thể tải danh sách bài viết cần duyệt.'),
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const handleApprove = async (article: ReviewArticleRow) => {
    try {
      await ArticleApiService.review(article.id, {
        status: ContentStatus.PUBLISHED,
      });

      setArticlesList((prev) =>
        prev.map((item) =>
          item.id === article.id
            ? { ...item, status: ReviewTabState.APPROVED, rawStatus: ContentStatus.PUBLISHED }
            : item,
        ),
      );

      setNotice({ tone: NoticeTone.OK, text: `Đã phê duyệt bài viết "${article.title}".` });
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

      setArticlesList((prev) =>
        prev.map((item) =>
          item.id === article.id
            ? {
                ...item,
                status: ReviewTabState.REJECTED,
                rawStatus: ContentStatus.REJECTED,
                rejectionReason: reason,
              }
            : item,
        ),
      );

      setNotice({ tone: NoticeTone.OK, text: `Đã từ chối bài viết "${article.title}". Lý do: ${reason}` });
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể từ chối bài viết.') });
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
          {[ReviewTabState.PENDING, ReviewTabState.APPROVED, ReviewTabState.REJECTED].map((x) => (
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
            aria-label="Tìm bài viết"
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
                  Không có bài viết nào trong danh sách &ldquo;{tab}&rdquo;.
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
                    {r.isOwn && r.status === ReviewTabState.PENDING ? (
                      <span className="text-xs text-amber-600" title="Quy tắc 2 người: bài cần người khác duyệt">
                        Bài của bạn (chờ người khác duyệt)
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="review-button"
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

      {selectedArticle && (
        <ReviewModal
          isOpen={true}
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
