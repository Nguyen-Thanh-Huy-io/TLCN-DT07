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
} from '../review.shared';
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
    <div className="min-w-0">
      {notice && (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-3.5 py-2.5 text-sm ${
            notice.tone === NoticeTone.OK
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
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
  isPublished?: boolean;
  rejectionReason?: string | null;
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
  isPublished = false,
  rejectionReason,
  onApprove,
  onReject,
  onEdit,
}: ReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsRejecting(false);
    setRejectReason('');
    setRejectError(null);
  }, [isOpen, lessonTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Kiểm duyệt ${itemLabel}: ${lessonTitle}`}
      onClick={onClose}
    >
      <div
        className="modal-container"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            {isPublished ? `Xem lại ${itemLabel}` : `Kiểm duyệt ${itemLabel}`}: &ldquo;{lessonTitle}&rdquo;
          </h2>
          <button type="button" className="modal-close" aria-label="Đóng hộp thoại" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {!isRejecting ? (
            <>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-4 text-xs text-slate-700 leading-relaxed">
                <strong className="block mb-1.5 text-slate-900">Tóm tắt nội dung:</strong>
                <p className="m-0">
                  {lessonSummary && lessonSummary.trim()
                    ? lessonSummary
                    : 'Bài chưa có tóm tắt — bấm "Mở trình soạn thảo" để xem toàn bộ nội dung.'}
                </p>
                {rejectionReason && (
                  <p className="mt-2.5 pt-2.5 border-t border-slate-200 text-rose-700 font-medium">
                    Lý do từ chối gần nhất: {rejectionReason}
                  </p>
                )}
              </div>

              {isPublished && (
                <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Nội dung này đã được xuất bản. Để chỉnh sửa chi tiết, hãy mở trực tiếp trong trình soạn thảo.
                </p>
              )}

              <div className="modal-footer" style={{ gap: 10, flexWrap: 'wrap' }}>
                {onEdit && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      onEdit();
                      onClose();
                    }}
                  >
                    ✎ {isPublished ? 'Mở trình soạn thảo' : 'Chỉnh sửa trước khi duyệt'}
                  </button>
                )}
                {!isPublished ? (
                  <>
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
                      ✓ Duyệt &amp; Xuất bản
                    </button>
                  </>
                ) : (
                  <button type="button" className="secondary-button" onClick={onClose}>
                    Đóng
                  </button>
                )}
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
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError(null);
                  }}
                  placeholder="Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc lý do chưa đạt..."
                />
              </label>
              {rejectError && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {rejectError}
                </p>
              )}
              <div className="modal-footer" style={{ gap: 10 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectError(null);
                  }}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      setRejectError('Vui lòng nhập lý do từ chối trước khi xác nhận.');
                      return;
                    }
                    onReject(rejectReason.trim());
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
