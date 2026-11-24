'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentStatus } from '@/constants/enums';
import { BlogApiService, type BlogPostItem } from '@/services/entities/dashboard.service';
import { extractErrorMessage } from '@/services/api';
import {
  NoticeTone,
  REVIEW_TAB_STATUS,
  ReviewTabState,
  STATUS_LABELS,
  type ReviewConfirmAction,
  type ReviewPost,
} from './ReviewHubView';
import { BlogReviewTable } from './BlogReviewParts';
import { BlogReviewPreviewModal } from './BlogReviewParts';
import { BlogReviewConfirmModal } from './BlogReviewParts';

const stripHtml = (value?: string | null) =>
  (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizePost = (item: BlogPostItem): ReviewPost => {
  const summarySource = item.excerpt || '';
  const summary = stripHtml(summarySource) || 'Bài viết chưa có mô tả.';
  const author = item.author?.username || 'Biên tập viên';

  return {
    id: item.id,
    title: item.title || 'Bài viết chưa có tiêu đề',
    summary: summary.length > 170 ? `${summary.slice(0, 167)}...` : summary,
    author,
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới',
    status: STATUS_LABELS[item.status] || ReviewTabState.PENDING,
    rawStatus: item.status,
    rejectionReason: (item as BlogPostItem & { rejectionReason?: string | null })?.rejectionReason || null,
  };
};

/** Gọi sau mỗi lần duyệt / từ chối thành công (Hàng chờ duyệt dùng để cập nhật số trên tab). */
export function BlogReviewList({ onChanged }: { onChanged?: () => void }) {
  const [tab, setTab] = useState<ReviewTabState>(ReviewTabState.PENDING);
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewPost | null>(null);
  const [previewArticle, setPreviewArticle] = useState<BlogPostItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<ReviewConfirmAction | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await BlogApiService.listForReview(REVIEW_TAB_STATUS[tab]);
        if (active) {
          setPosts(response);
        }
      } catch (error) {
        if (active) {
          setPosts([]);
          setNotice({
            tone: NoticeTone.ERROR,
            text: extractErrorMessage(error, 'Không thể tải danh sách bài viết.'),
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void Promise.resolve().then(loadData);
    return () => {
      active = false;
    };
  }, [tab]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.map(normalizePost).filter(
      (item) =>
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query),
    );
  }, [posts, search]);

  const handleOpenPreview = (item: ReviewPost) => {
    setSelectedItem(item);
    setPreviewArticle(posts.find((post) => post.id === item.id) ?? null);
  };

  const handleReview = async (
    item: ReviewPost,
    status: ContentStatus.PUBLISHED | ContentStatus.REJECTED,
    reason?: string,
  ) => {
    try {
      await BlogApiService.review(item.id, {
        status,
        rejectionReason: status === ContentStatus.REJECTED ? reason?.trim() || undefined : undefined,
      });

      // Bài đã chuyển trạng thái nên rời tab đang xem; tab đích tự tải lại khi được mở.
      setPosts((current) => current.filter((post) => post.id !== item.id));
      onChanged?.();

      setNotice({
        tone: NoticeTone.OK,
        text:
          status === ContentStatus.PUBLISHED
            ? `Đã duyệt bài "${item.title}".`
            : `Đã từ chối bài "${item.title}".`,
      });

      setSelectedItem(null);
      setPreviewArticle(null);
      setConfirmAction(null);
    } catch (error) {
      setNotice({
        tone: NoticeTone.ERROR,
        text: extractErrorMessage(error, 'Không thể cập nhật trạng thái bài.'),
      });
    }
  };

  return (
    <div style={{ background: '#f5f5f4', minHeight: '100%', color: '#1f2a37' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 24px 40px' }}>
        {notice && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 14,
              background: notice.tone === NoticeTone.OK ? '#ecfdf5' : '#fef2f2',
              color: notice.tone === NoticeTone.OK ? '#065f46' : '#991b1b',
            }}
          >
            {notice.text}
          </div>
        )}

        <BlogReviewTable
          tab={tab}
          onChangeTab={setTab}
          search={search}
          onChangeSearch={setSearch}
          loading={loading}
          items={filtered}
          selectedItemId={selectedItem?.id}
          onSelectPost={handleOpenPreview}
        />
      </div>

      <BlogReviewPreviewModal
        selectedItem={selectedItem}
        previewArticle={previewArticle}
        onClose={() => {
          setSelectedItem(null);
          setPreviewArticle(null);
        }}
        onApprove={(item) => setConfirmAction({ type: ContentStatus.PUBLISHED, item })}
        onReject={(item) => setConfirmAction({ type: ContentStatus.REJECTED, item })}
      />

      <BlogReviewConfirmModal
        confirmAction={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={(item, type, reason) => void handleReview(item, type, reason)}
      />
    </div>
  );
}

// === Merged from ReviewModal.tsx ===
export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  itemLabel?: string;
  lessonSummary?: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  lessonTitle,
  itemLabel = 'bài học',
  lessonSummary,
  onApprove,
  onReject,
  onEdit,
}: ReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Kiểm duyệt {itemLabel}: &ldquo;{lessonTitle}&rdquo;</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {!isRejecting ? (
            <>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#374151',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 6 }}>
                  Tóm tắt:
                </strong>
                <p style={{ margin: 0 }}>
                  {lessonSummary && lessonSummary.trim()
                    ? lessonSummary
                    : 'Bài chưa có tóm tắt — mở "Chỉnh sửa trước khi duyệt" để xem toàn bộ nội dung.'}
                </p>
              </div>

              <div className="modal-footer" style={{ gap: 12, flexWrap: 'wrap' }}>
                {onEdit && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      onEdit();
                      onClose();
                    }}
                  >
                    ✎ Chỉnh sửa trước khi duyệt
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRejecting(true)}
                  style={{ color: '#c54646' }}
                >
                  Từ chối phê duyệt
                </button>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: '#287056' }}
                  onClick={() => {
                    onApprove();
                    onClose();
                  }}
                >
                  ✓ Duyệt & Xuất bản
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="field">
                <span>
                  Lý do từ chối <b>*</b>
                </span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc lý do chưa đạt..."
                  required
                />
              </label>
              <div className="modal-footer" style={{ gap: 10 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRejecting(false)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      alert('Vui lòng nhập lý do từ chối!');
                      return;
                    }
                    onReject(rejectReason);
                    setIsRejecting(false);
                    onClose();
                  }}
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
