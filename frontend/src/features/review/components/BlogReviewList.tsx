'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentStatus } from '@/constants/enums';
import { BlogApiService, type BlogPostItem } from '@/services/entities/blog.service';
import { extractErrorMessage } from '@/services/api';
import {
  NoticeTone,
  ReviewTabState,
  STATUS_LABELS,
} from '../constants/review.constant';
import type { ReviewConfirmAction, ReviewPost } from '../types/review.types';
import { BlogReviewTable } from './BlogReviewTable';
import { BlogReviewPreviewModal } from './BlogReviewPreviewModal';
import { BlogReviewConfirmModal } from './BlogReviewConfirmModal';

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

export function BlogReviewList() {
  const [tab, setTab] = useState<ReviewTabState>(ReviewTabState.PENDING);
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewPost | null>(null);
  const [previewArticle, setPreviewArticle] = useState<BlogPostItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ReviewConfirmAction | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await BlogApiService.list();
        if (active) {
          setItems(response.map(normalizePost));
        }
      } catch (error) {
        if (active) {
          setItems([]);
          setNotice({
            tone: NoticeTone.ERROR,
            text: extractErrorMessage(error, 'Không thể tải danh sách bài viết chờ duyệt.'),
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
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTab = item.status === tab;
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [items, search, tab]);

  const handleOpenPreview = async (item: ReviewPost) => {
    try {
      setPreviewLoading(true);
      setSelectedItem(item);
      const detail = (await BlogApiService.list()).find((post) => post.id === item.id) ?? null;
      setPreviewArticle(detail);
    } catch (error) {
      setNotice({
        tone: NoticeTone.ERROR,
        text: extractErrorMessage(error, 'Không thể mở bản xem trước.'),
      });
    } finally {
      setPreviewLoading(false);
    }
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

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                status:
                  status === ContentStatus.PUBLISHED
                    ? ReviewTabState.APPROVED
                    : ReviewTabState.REJECTED,
                rawStatus: status,
                rejectionReason: status === ContentStatus.REJECTED ? reason || null : null,
              }
            : currentItem,
        ),
      );

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
          previewLoading={previewLoading}
          onSelectPost={(item) => void handleOpenPreview(item)}
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
