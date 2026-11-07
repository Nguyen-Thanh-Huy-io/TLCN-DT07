'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentStatus } from '@/constants/enums';
import { ArticleApiService, type ArticleItem } from '@/services/entities/article.service';
import { extractErrorMessage } from '@/services/api';

type ReviewTab = 'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối';

type ReviewPost = {
  id: string;
  title: string;
  summary: string;
  author: string;
  createdAt: string;
  status: ReviewTab;
  rawStatus: string;
  rejectionReason?: string | null;
};

const STATUS_LABELS: Record<string, ReviewTab> = {
  [ContentStatus.PENDING_REVIEW]: 'Chờ duyệt',
  [ContentStatus.PUBLISHED]: 'Đã duyệt',
  [ContentStatus.REJECTED]: 'Bị từ chối',
};

const stripHtml = (value?: string | null) =>
  (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isBlogArticle = (item: ArticleItem) => {
  const categoryName = (item.category?.name ?? '').trim().toLowerCase();
  const categorySlug = (item.category?.slug ?? '').trim().toLowerCase();
  return (
    categorySlug === 'blog' ||
    categoryName === 'blog' ||
    categorySlug === 'bai-viet' ||
    categoryName === 'bài viết' ||
    categoryName === 'bai viet'
  );
};

const normalizePost = (item: ArticleItem): ReviewPost => {
  const summarySource = item.summary || (item as any)?.content || '';
  const summary = stripHtml(summarySource) || 'Bài viết chưa có mô tả.';
  const author =
    (item as any)?.creator?.fullName ||
    (item as any)?.creator?.username ||
    (item as any)?.creator?.email ||
    'Biên tập viên';

  return {
    id: item.id,
    title: item.title || 'Bài viết chưa có tiêu đề',
    summary: summary.length > 170 ? `${summary.slice(0, 167)}...` : summary,
    author,
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới',
    status: STATUS_LABELS[item.status] || 'Chờ duyệt',
    rawStatus: item.status,
    rejectionReason: (item as any)?.rejectionReason || null,
  };
};

export function BlogReviewList() {
  const [tab, setTab] = useState<ReviewTab>('Chờ duyệt');
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewPost | null>(null);
T  const [previewArticle, setPreviewArticle] = useState<ArticleItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await ArticleApiService.list({ page: 1, limit: 100 });
      const blogOnly = (response.items || []).filter(isBlogArticle);
      setItems(blogOnly.map(normalizePost));
    } catch (error) {
      setItems([]);
      setNotice({
        tone: 'error',
        text: extractErrorMessage(error, 'Không thể tải danh sách bài viết chờ duyệt.'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
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

  const stats = {
    pending: items.filter((item) => item.status === 'Chờ duyệt').length,
    published: items.filter((item) => item.status === 'Đã duyệt').length,
    rejected: items.filter((item) => item.status === 'Bị từ chối').length,
  };

  const handleOpenPreview = async (item: ReviewPost) => {
    try {
      setPreviewLoading(true);
      const detail = await ArticleApiService.get(item.id);
      setPreviewArticle(detail);
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể mở bản xem trước.') });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleReview = async (item: ReviewPost, status: 'PUBLISHED' | 'REJECTED', reason?: string) => {
    try {
      await ArticleApiService.review(item.id, {
        status,
        rejectionReason: status === 'REJECTED' ? reason?.trim() || undefined : undefined,
      });

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                status: status === 'PUBLISHED' ? 'Đã duyệt' : 'Bị từ chối',
                rawStatus: status,
                rejectionReason: status === 'REJECTED' ? reason || null : null,
              }
            : currentItem
        )
      );

      setNotice({
        tone: 'ok',
        text:
          status === 'PUBLISHED'
            ? `Đã duyệt bài "${item.title}".`
            : `Đã từ chối bài "${item.title}".`,
      });

      setSelectedItem(null);
      setRejectReason('');
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể cập nhật trạng thái bài.') });
    }
  };

  return (
    <div style={{ background: '#f5f5f4', minHeight: '100%', color: '#1f2a37' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 24px 40px' }}>
        <div style={{ border: '1px solid #e5e7eb', background: '#ffffff', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8, background: '#f3f4f6', borderRadius: 999, padding: 5, border: '1px solid #e5e7eb' }}>
              {(['Chờ duyệt', 'Đã duyệt', 'Bị từ chối'] as ReviewTab[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    background: tab === value ? '#3a3f48' : 'transparent',
                    color: tab === value ? '#fff' : '#5c5f64',
                    fontWeight: 600,
                    fontSize: 14,
                    padding: '10px 18px',
                    cursor: 'pointer',
                  }}
                >
                  {value}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                borderRadius: 999,
                padding: '8px 14px',
                minWidth: 290,
              }}
            >
              <span style={{ fontSize: 16, color: '#4f5d66' }}>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm bài viết..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  color: '#1f2a37',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {notice && (
            <div
              role="status"
              style={{
                marginBottom: 16,
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 14,
                background: notice.tone === 'ok' ? '#ecfdf5' : '#fef2f2',
                color: notice.tone === 'ok' ? '#065f46' : '#991b1b',
              }}
            >
              {notice.text}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', color: '#5a5d62', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid #e5e7eb', width: '42%' }}>Bài viết</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid #e5e7eb', width: '18%' }}>Tác giả</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid #e5e7eb', width: '12%' }}>Ngày</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid #e5e7eb', width: '14%' }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid #e5e7eb', width: '14%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px 12px', color: '#5c5f64' }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px 12px', color: '#5c5f64' }}>
                      Không có bài nào ở trạng thái “{tab}”.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#1f2a37', marginBottom: 6 }}>{item.title}</div>
                        <div style={{ color: '#4d5561', fontSize: 14, lineHeight: 1.6 }}>{item.summary}</div>
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb', color: '#323a41', fontSize: 14 }}>
                        {item.author}
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb', color: '#323a41', fontSize: 14 }}>
                        {item.createdAt}
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: item.status === 'Chờ duyệt' ? '#f3e2a7' : item.status === 'Đã duyệt' ? '#dfeee3' : '#f7d9d5',
                            color: item.status === 'Chờ duyệt' ? '#7a5a00' : item.status === 'Đã duyệt' ? '#1d5a3a' : '#8d3d34',
                            borderRadius: 999,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item)}
                            disabled={previewLoading}
                            style={{
                              border: '1px solid #cfc4b4',
                              borderRadius: 999,
                              background: '#f3efe7',
                              color: '#1d2c32',
                              fontWeight: 600,
                              padding: '8px 12px',
                              cursor: previewLoading ? 'wait' : 'pointer',
                              fontSize: 13,
                              opacity: previewLoading ? 0.7 : 1,
                            }}
                          >
                            {previewLoading ? 'Đang mở...' : 'Xem'}
                          </button>
                          {item.status === 'Chờ duyệt' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReview(item, 'PUBLISHED')}
                                style={{
                                  border: 'none',
                                  borderRadius: 999,
                                  background: '#2d3a3f',
                                  color: '#fff',
                                  fontWeight: 700,
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                }}
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setRejectReason('');
                                }}
                                style={{
                                  border: '1px solid #e3b9b2',
                                  borderRadius: 999,
                                  background: '#f8e3e0',
                                  color: '#8d3d34',
                                  fontWeight: 600,
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                }}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 1100,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#fffdf9',
              borderRadius: 28,
              border: '1px solid #e5e7eb',
              boxShadow: '0 30px 90px rgba(15, 23, 42, 0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px 0' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7d5d3d', fontWeight: 700 }}>
                Xem trước bài viết
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                style={{
                  border: '1px solid #d7dce2',
                  borderRadius: 999,
                  background: '#f5f6f7',
                  color: '#4a4d52',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Đóng
              </button>
            </div>

            <div style={{ padding: '18px 26px 40px' }}>
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a4d2d', fontWeight: 700 }}>
                  {previewArticle.category?.name || 'Blog'}
                </p>
                <h2 style={{ margin: '12px 0 0', fontSize: 42, lineHeight: 1.08, color: '#1f2a37', fontWeight: 800 }}>
                  {previewArticle.title}
                </h2>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, color: '#58646d', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span>{previewArticle.createdAt ? new Date(previewArticle.createdAt).toLocaleDateString('vi-VN') : 'Mới'}</span>
                <span>•</span>
                <span>{previewArticle.createdBy ? 'Biên tập viên' : 'Biên tập viên'}</span>
              </div>

              {previewArticle.coverImageUrl && (
                <div style={{ height: 320, overflow: 'hidden', borderRadius: 24, marginBottom: 28, border: '1px solid #e5e7eb', background: '#f3f5f6' }}>
                  <img
                    src={previewArticle.coverImageUrl}
                    alt={previewArticle.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              {previewArticle.summary && (
                <div style={{ marginBottom: 28, padding: '18px 20px', borderRadius: 18, background: '#f7f1e7', border: '1px solid #e6d7bf', color: '#39454d', fontSize: 18, lineHeight: 1.8 }}>
                  {previewArticle.summary}
                </div>
              )}

              {Array.isArray(previewArticle.contentBlocks) && previewArticle.contentBlocks.length > 0 ? (
                <div style={{ display: 'grid', gap: 20 }}>
                  {previewArticle.contentBlocks.map((block: any, index: number) => {
                    const type = block?.type || block?.kind || 'paragraph';
                    const text = typeof block?.text === 'string' ? block.text : '';
                    const caption = typeof block?.caption === 'string' ? block.caption : '';
                    const imageUrl = typeof block?.imageUrl === 'string' ? block.imageUrl : '';

                    if (type === 'image' && imageUrl) {
                      return (
                        <figure key={`${imageUrl}-${index}`} style={{ margin: 0 }}>
                          <img src={imageUrl} alt={caption || previewArticle.title} style={{ display: 'block', width: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 20, border: '1px solid #e5e7eb' }} />
                          {caption && <figcaption style={{ marginTop: 10, color: '#58646d', fontSize: 14 }}>{caption}</figcaption>}
                        </figure>
                      );
                    }

                    if (text.trim()) {
                      return (
                        <p key={`text-${index}`} style={{ margin: 0, fontSize: 18, lineHeight: 1.9, color: '#2f3c3d' }}>
                          {text}
                        </p>
                      );
                    }

                    return null;
                  })}
                </div>
              ) : (
                <div style={{ color: '#58646d', lineHeight: 1.8, fontSize: 18 }}>
                  {previewArticle.summary || 'Bài viết này chưa có nội dung chi tiết để hiển thị ở chế độ xem trước.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#ffffff',
              borderRadius: 24,
              border: '1px solid #e5e7eb',
              padding: 26,
              boxShadow: '0 28px 70px rgba(15, 23, 42, 0.14)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5c5f64' }}>Review bài viết</div>
                <h2 style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 700, color: '#1f2a37' }}>
                  {selectedItem.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setRejectReason('');
                }}
                style={{
                  border: '1px solid #d7dce2',
                  borderRadius: 999,
                  background: '#f5f6f7',
                  color: '#4a4d52',
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>

            <div style={{ marginBottom: 18, fontSize: 15, color: '#37404b', lineHeight: 1.8 }}>
              <div><strong>Tác giả:</strong> {selectedItem.author}</div>
              <div><strong>Ngày gửi:</strong> {selectedItem.createdAt}</div>
            </div>

            <div style={{ marginTop: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: '#40484f' }}>{selectedItem.summary}</div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontWeight: 700, color: '#1f2a37', marginBottom: 8 }}>Lý do từ chối (nếu có)</label>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: thiếu nguồn, thiếu bằng chứng, nội dung chưa phù hợp..."
                style={{
                  width: '100%',
                  resize: 'vertical',
                  borderRadius: 16,
                  border: '1px solid #dfe3e8',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                  color: '#1f2a37',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
              <button
                type="button"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    setNotice({ tone: 'error', text: 'Vui lòng nhập lý do từ chối trước khi gửi.' });
                    return;
                  }
                  if (!selectedItem) return;
                  handleReview(selectedItem, 'REJECTED', rejectReason);
                }}
                style={{
                  border: '1px solid #dfe3e8',
                  borderRadius: 999,
                  background: '#f3f4f6',
                  color: '#374151',
                  fontWeight: 700,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedItem) return;
                  handleReview(selectedItem, 'PUBLISHED');
                }}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  background: '#1f2937',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                Duyệt bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
