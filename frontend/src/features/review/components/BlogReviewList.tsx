'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import { ContentStatus } from '@/constants/enums';
import { BlogApiService, type BlogPostItem } from '@/services/entities/blog.service';
import { extractErrorMessage } from '@/services/api';
import { extractMetadataFromBlocks } from '@/features/blog/utils/blog-metadata.util';

export enum ReviewTabState {
  PENDING = 'Chờ duyệt',
  APPROVED = 'Đã duyệt',
  REJECTED = 'Bị từ chối',
}

export enum NoticeTone {
  OK = 'ok',
  ERROR = 'error',
}

type ReviewTab = ReviewTabState;

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
  [ContentStatus.PENDING_REVIEW]: ReviewTabState.PENDING,
  [ContentStatus.PUBLISHED]: ReviewTabState.APPROVED,
  [ContentStatus.REJECTED]: ReviewTabState.REJECTED,
};

const BLOCK_TYPE_IMAGE = 'image';
const BORDER_COLOR_LIGHT = '#e5e7eb';
const BORDER_LIGHT = `1px solid ${BORDER_COLOR_LIGHT}`;

interface ContentBlockData {
  id?: string;
  type?: string;
  kind?: string;
  heading?: string;
  text?: string;
  caption?: string;
  imageUrl?: string;
}

interface ArticleReferenceData {
  id?: string;
  title?: string;
  source?: string;
  url?: string;
}

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

const normalizeImageUrl = (value?: string | null) => resolveBackendAssetUrl(value);

const renderParagraphs = (value: string) =>
  (value || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\r\n/g, '\n'));

export function BlogReviewList() {
  const [tab, setTab] = useState<ReviewTab>(ReviewTabState.PENDING);
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewPost | null>(null);
  const [previewArticle, setPreviewArticle] = useState<BlogPostItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: ContentStatus.PUBLISHED | ContentStatus.REJECTED;
    item: ReviewPost;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể mở bản xem trước.') });
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
                status: status === ContentStatus.PUBLISHED ? ReviewTabState.APPROVED : ReviewTabState.REJECTED,
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
      setRejectReason('');
      setConfirmAction(null);
    } catch (error) {
      setNotice({ tone: NoticeTone.ERROR, text: extractErrorMessage(error, 'Không thể cập nhật trạng thái bài.') });
    }
  };

  return (
    <div style={{ background: '#f5f5f4', minHeight: '100%', color: '#1f2a37' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 24px 40px' }}>
        <div style={{ border: BORDER_LIGHT, background: '#ffffff', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8, background: '#f3f4f6', borderRadius: 999, padding: 5, border: BORDER_LIGHT }}>
              {[ReviewTabState.PENDING, ReviewTabState.APPROVED, ReviewTabState.REJECTED].map((value) => (
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
                border: BORDER_LIGHT,
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
                background: notice.tone === NoticeTone.OK ? '#ecfdf5' : '#fef2f2',
                color: notice.tone === NoticeTone.OK ? '#065f46' : '#991b1b',
              }}
            >
              {notice.text}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', color: '#5a5d62', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: BORDER_LIGHT, width: '42%' }}>Bài viết</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: BORDER_LIGHT, width: '18%' }}>Tác giả</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: BORDER_LIGHT, width: '12%' }}>Ngày</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: BORDER_LIGHT, width: '14%' }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', borderBottom: BORDER_LIGHT, width: '14%' }}>Thao tác</th>
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
                    <tr
                      key={item.id}
                      onClick={() => handleOpenPreview(item)}
                      style={{
                        borderBottom: BORDER_LIGHT,
                        cursor: 'pointer',
                        background: selectedItem?.id === item.id ? '#f9f7f3' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '18px 16px', borderBottom: BORDER_LIGHT, verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#1f2a37', marginBottom: 6 }}>{item.title}</div>
                        <div style={{ color: '#4d5561', fontSize: 14, lineHeight: 1.6 }}>{item.summary}</div>
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: BORDER_LIGHT, color: '#323a41', fontSize: 14 }}>
                        {item.author}
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: BORDER_LIGHT, color: '#323a41', fontSize: 14 }}>
                        {item.createdAt}
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: BORDER_LIGHT }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: item.status === ReviewTabState.PENDING ? '#f3e2a7' : item.status === ReviewTabState.APPROVED ? '#dfeee3' : '#f7d9d5',
                            color: item.status === ReviewTabState.PENDING ? '#7a5a00' : item.status === ReviewTabState.APPROVED ? '#1d5a3a' : '#8d3d34',
                            borderRadius: 999,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', borderBottom: BORDER_LIGHT, color: '#5c5f64', fontSize: 13 }}>
                        {previewLoading && selectedItem?.id === item.id ? 'Đang mở...' : 'Nhấp để xem'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedItem && previewArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 1120,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#fffdf9',
              border: BORDER_LIGHT,
              borderRadius: 24,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: BORDER_LIGHT, background: '#f7f3ee', position: 'sticky', top: 0, zIndex: 2 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7d5d3d', fontWeight: 700 }}>
                  Xem trước bài viết
                </div>
                <h3 style={{ margin: '8px 0 0', fontSize: 24, lineHeight: 1.2, color: '#1f2a37', fontWeight: 800 }}>{selectedItem.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: ContentStatus.PUBLISHED, item: selectedItem })}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    background: '#2d3a3f',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectReason('');
                    setConfirmAction({ type: ContentStatus.REJECTED, item: selectedItem });
                  }}
                  style={{
                    border: '1px solid #e3b9b2',
                    borderRadius: 999,
                    background: '#f8e3e0',
                    color: '#8d3d34',
                    fontWeight: 600,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setPreviewArticle(null);
                  }}
                  style={{
                    border: '1px solid #d7dce2',
                    borderRadius: 999,
                    background: '#f5f6f7',
                    color: '#4a4d52',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 22px 32px' }}>
              <article style={{ display: 'grid', gap: 24 }}>
                {(previewArticle.coverImageUrl || previewArticle.coverImage) && (
                  <div style={{ position: 'relative', width: '100%', height: 320, overflow: 'hidden', borderRadius: 20, border: BORDER_LIGHT, background: '#f4f2ee' }}>
                    <Image
                      src={normalizeImageUrl(previewArticle.coverImageUrl || previewArticle.coverImage)}
                      alt={previewArticle.title}
                      fill
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}

                {(() => {
                  const metadata = extractMetadataFromBlocks(previewArticle?.contentBlocks);
                  const tags = metadata.tags.length > 0
                    ? metadata.tags
                    : Array.isArray(previewArticle?.tags)
                      ? previewArticle.tags
                      : typeof previewArticle?.tags === 'string'
                        ? previewArticle.tags.split(/[\n,]+/)
                        : [];

                  return tags.filter(Boolean).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {tags
                        .filter(Boolean)
                        .map((tag: string, index: number) => (
                          <span
                            key={`${tag}-${index}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 999,
                              border: BORDER_LIGHT,
                              background: '#f7f5f2',
                              padding: '7px 10px',
                              fontSize: 11,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                              color: '#6d5635',
                              fontWeight: 700,
                            }}
                          >
                            #{tag.replace(/^#/, '')}
                          </span>
                        ))}
                    </div>
                  ) : null;
                })()}

                {previewArticle.excerpt || previewArticle.summary ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {renderParagraphs(stripHtml(previewArticle.excerpt || previewArticle.summary || '') || 'Tóm tắt ngắn sẽ hiển thị ở đây.').map((paragraph, index) => (
                      <p key={`excerpt-${index}`} style={{ margin: 0, fontSize: 18, lineHeight: 1.9, color: '#34414d' }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div style={{ display: 'grid', gap: 24 }}>
                  {Array.isArray(previewArticle.contentBlocks) && previewArticle.contentBlocks.length > 0 ? (
                    (previewArticle.contentBlocks as ContentBlockData[]).map((block: ContentBlockData, blockIndex: number) => {
                      const type = block?.type || block?.kind || 'paragraph';
                      const heading = typeof block?.heading === 'string' ? block.heading : '';
                      const text = typeof block?.text === 'string' ? block.text : '';
                      const caption = typeof block?.caption === 'string' ? block.caption : '';
                      const imageUrl = typeof block?.imageUrl === 'string' ? block.imageUrl : '';

                      if (type === BLOCK_TYPE_IMAGE && imageUrl) {
                        return (
                          <figure key={`${imageUrl}-${blockIndex}`} style={{ margin: 0, display: 'grid', gap: 10 }}>
                            <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 20, overflow: 'hidden', border: BORDER_LIGHT }}>
                              <Image
                                src={normalizeImageUrl(imageUrl)}
                                alt={caption || previewArticle.title}
                                fill
                                unoptimized
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            {caption ? <figcaption style={{ textAlign: 'center', color: '#58646d', fontSize: 14, fontStyle: 'italic' }}>{caption}</figcaption> : null}
                          </figure>
                        );
                      }

                      const paragraphs = renderParagraphs(text || 'Đoạn văn sẽ xuất hiện ở đây.');

                      return (
                        <div key={`${type}-${blockIndex}`} style={{ display: 'grid', gap: 12 }}>
                          {heading ? (
                            <h3 style={{ margin: 0, fontSize: 26, lineHeight: 1.1, color: '#1f2a37', fontWeight: 800, letterSpacing: '-0.03em' }}>
                              {heading}
                            </h3>
                          ) : null}
                          {paragraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${block?.id || blockIndex}-paragraph-${paragraphIndex}`} style={{ margin: 0, fontSize: 18, lineHeight: 1.9, color: '#2f3c3d' }}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: '#58646d', lineHeight: 1.8, fontSize: 18 }}>
                      {previewArticle.summary || 'Bài viết này chưa có nội dung chi tiết để hiển thị ở chế độ xem trước.'}
                    </div>
                  )}
                </div>

                {(() => {
                  const metadata = extractMetadataFromBlocks(previewArticle?.contentBlocks);
                  const rawReferences = metadata.references.length > 0
                    ? metadata.references
                    : Array.isArray(previewArticle?.references)
                      ? previewArticle.references
                      : [];
                  const references = rawReferences as ArticleReferenceData[];
                  const hasReference = references.some((reference: ArticleReferenceData) => reference?.title || reference?.source || reference?.url);
                  if (!hasReference) return null;

                  return (
                    <div style={{ borderTop: BORDER_LIGHT, paddingTop: 18, display: 'grid', gap: 12 }}>
                      <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7d5d3d', fontWeight: 700 }}>
                        Tài liệu tham khảo
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, color: '#2f3c3d', fontSize: 15, lineHeight: 1.7 }}>
                        {references
                          .filter((reference: ArticleReferenceData) => reference?.title || reference?.source || reference?.url)
                          .map((reference: ArticleReferenceData, index: number) => (
                            <li key={`${reference?.id || reference?.title || reference?.source || index}`}>
                              {reference?.url ? (
                                <a href={reference.url} target="_blank" rel="noreferrer" style={{ color: '#1f2a37', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                                  {reference.title || 'Nguồn tham khảo'}
                                </a>
                              ) : (
                                <span>{reference.title || 'Nguồn tham khảo'}</span>
                              )}
                              {reference?.source ? <span style={{ color: '#58646d' }}> — {reference.source}</span> : null}
                            </li>
                          ))}
                      </ul>
                    </div>
                  );
                })()}
              </article>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: 24,
              border: BORDER_LIGHT,
              padding: 26,
              boxShadow: '0 28px 70px rgba(15, 23, 42, 0.14)',
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5c5f64', fontWeight: 700 }}>
                {confirmAction.type === ContentStatus.PUBLISHED ? 'Xác nhận duyệt' : 'Từ chối bài viết'}
              </div>
              <h3 style={{ margin: '10px 0 0', fontSize: 24, lineHeight: 1.3, color: '#1f2a37', fontWeight: 800 }}>
                {confirmAction.type === ContentStatus.PUBLISHED ? 'Bạn có muốn duyệt bài này không?' : 'Bạn có muốn từ chối bài này không?'}
              </h3>
            </div>

            <div style={{ color: '#3d4853', fontSize: 15, lineHeight: 1.8, marginBottom: 18 }}>
              <div><strong>Bài:</strong> {confirmAction.item.title}</div>
              <div><strong>Tác giả:</strong> {confirmAction.item.author}</div>
            </div>

            {confirmAction.type === ContentStatus.REJECTED && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 700, color: '#1f2a37', marginBottom: 8 }}>Lý do từ chối</label>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={4}
                  placeholder="Ví dụ: thiếu nguồn, nội dung chưa đạt yêu cầu..."
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
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setRejectReason('');
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
                Hủy
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmAction.type === ContentStatus.REJECTED) {
                    if (!rejectReason.trim()) {
                      setNotice({ tone: NoticeTone.ERROR, text: 'Vui lòng nhập lý do từ chối trước khi gửi.' });
                      return;
                    }
                    handleReview(confirmAction.item, ContentStatus.REJECTED, rejectReason);
                    return;
                  }

                  handleReview(confirmAction.item, ContentStatus.PUBLISHED);
                }}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  background: confirmAction.type === ContentStatus.PUBLISHED ? '#1f2937' : '#8d3d34',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                {confirmAction.type === ContentStatus.PUBLISHED ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
