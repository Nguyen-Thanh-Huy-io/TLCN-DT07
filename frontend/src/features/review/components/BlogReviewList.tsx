'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContentStatus } from '@/constants/enums';
import { BlogApiService, type BlogPostItem } from '@/services/entities/blog.service';
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
    status: STATUS_LABELS[item.status] || 'Chờ duyệt',
    rawStatus: item.status,
    rejectionReason: (item as any)?.rejectionReason || null,
  };
};

const normalizeImageUrl = (value?: string | null) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^\/\//.test(trimmed)) return trimmed;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

const renderParagraphs = (value: string) =>
  (value || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\r\n/g, '\n'));

const extractMetadataFromBlocks = (contentBlocks: unknown) => {
  if (!Array.isArray(contentBlocks)) {
    return { tags: [] as string[], references: [] as Array<{ title?: string; source?: string; url?: string }> };
  }

  const metadataCandidate = contentBlocks.find((block) => {
    if (!block || typeof block !== 'object') return false;
    const candidate = block as Record<string, unknown>;
    return (
      (candidate.type === 'meta' && candidate.kind === 'metadata') ||
      candidate.type === 'metadata' ||
      candidate.kind === 'metadata' ||
      Array.isArray(candidate.tags) ||
      Array.isArray(candidate.references) ||
      (candidate.metadata && typeof candidate.metadata === 'object')
    );
  });

  const payload =
    metadataCandidate && typeof metadataCandidate === 'object'
      ? ((metadataCandidate as Record<string, unknown>).metadata && typeof (metadataCandidate as Record<string, unknown>).metadata === 'object'
          ? ((metadataCandidate as Record<string, unknown>).metadata as Record<string, unknown>)
          : (metadataCandidate as Record<string, unknown>))
      : {};

  const fallbackPayload = contentBlocks.reduce<Record<string, unknown>>((acc, block) => {
    if (!block || typeof block !== 'object') return acc;
    const candidate = block as Record<string, unknown>;
    if ((candidate.type === 'meta' && candidate.kind === 'metadata') || candidate.type === 'metadata' || candidate.kind === 'metadata') {
      return { ...acc, ...(candidate.metadata && typeof candidate.metadata === 'object' ? (candidate.metadata as Record<string, unknown>) : candidate) };
    }
    return acc;
  }, {});

  const finalPayload = { ...fallbackPayload, ...payload };
  const rawTags = Array.isArray(finalPayload.tags) ? finalPayload.tags : [];
  const rawReferences = Array.isArray(finalPayload.references) ? finalPayload.references : [];

  return {
    tags: rawTags
      .map((tag) => {
        if (typeof tag === 'string') return tag;
        if (tag && typeof tag === 'object') {
          if ('name' in tag && typeof tag.name === 'string') return tag.name;
          if ('value' in tag && typeof tag.value === 'string') return tag.value;
        }
        return '';
      })
      .filter((tag): tag is string => tag.trim().length > 0)
      .map((tag) => tag.replace(/^#/, '')),
    references: rawReferences
      .filter((reference): reference is Record<string, unknown> => !!reference && typeof reference === 'object')
      .map((reference) => ({
        title: typeof reference.title === 'string' ? reference.title : typeof reference.name === 'string' ? reference.name : '',
        source: typeof reference.source === 'string' ? reference.source : '',
        url: typeof reference.url === 'string' ? reference.url : typeof reference.link === 'string' ? reference.link : '',
      })),
  };
};

export function BlogReviewList() {
  const [tab, setTab] = useState<ReviewTab>('Chờ duyệt');
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewPost | null>(null);
  const [previewArticle, setPreviewArticle] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'PUBLISHED' | 'REJECTED'; item: ReviewPost } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await BlogApiService.list();
      setItems(response.map(normalizePost));
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
      setSelectedItem(item);
      const detail = (await BlogApiService.list()).find((post) => post.id === item.id) ?? null;
      setPreviewArticle(detail as any);
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể mở bản xem trước.') });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleReview = async (item: ReviewPost, status: 'PUBLISHED' | 'REJECTED', reason?: string) => {
    try {
      await BlogApiService.review(item.id, {
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
      setConfirmAction(null);
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
                    <tr
                      key={item.id}
                      onClick={() => handleOpenPreview(item)}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        background: selectedItem?.id === item.id ? '#f9f7f3' : 'transparent',
                      }}
                    >
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
                      <td style={{ padding: '18px 16px', borderBottom: '1px solid #e5e7eb', color: '#5c5f64', fontSize: 13 }}>
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
              border: '1px solid #e5e7eb',
              borderRadius: 24,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: '1px solid #e5e7eb', background: '#f7f3ee', position: 'sticky', top: 0, zIndex: 2 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7d5d3d', fontWeight: 700 }}>
                  Xem trước bài viết
                </div>
                <h3 style={{ margin: '8px 0 0', fontSize: 24, lineHeight: 1.2, color: '#1f2a37', fontWeight: 800 }}>{selectedItem.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: 'PUBLISHED', item: selectedItem })}
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
                    setConfirmAction({ type: 'REJECTED', item: selectedItem });
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
                  <div style={{ overflow: 'hidden', borderRadius: 20, border: '1px solid #e5e7eb', background: '#f4f2ee' }}>
                    <img
                      src={normalizeImageUrl(previewArticle.coverImageUrl || previewArticle.coverImage)}
                      alt={previewArticle.title}
                      style={{ display: 'block', width: '100%', height: 320, objectFit: 'cover' }}
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
                              border: '1px solid #e5e7eb',
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
                    previewArticle.contentBlocks.map((block: any, blockIndex: number) => {
                      const type = block?.type || block?.kind || 'paragraph';
                      const heading = typeof block?.heading === 'string' ? block.heading : '';
                      const text = typeof block?.text === 'string' ? block.text : '';
                      const caption = typeof block?.caption === 'string' ? block.caption : '';
                      const imageUrl = typeof block?.imageUrl === 'string' ? block.imageUrl : '';

                      if (type === 'image' && imageUrl) {
                        return (
                          <figure key={`${imageUrl}-${blockIndex}`} style={{ margin: 0, display: 'grid', gap: 10 }}>
                            <img
                              src={normalizeImageUrl(imageUrl)}
                              alt={caption || previewArticle.title}
                              style={{ display: 'block', width: '100%', maxHeight: 500, objectFit: 'cover', borderRadius: 20, border: '1px solid #e5e7eb' }}
                            />
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
                  const references = metadata.references.length > 0
                    ? metadata.references
                    : Array.isArray(previewArticle?.references)
                      ? previewArticle.references
                      : [];
                  const hasReference = references.some((reference: any) => reference?.title || reference?.source || reference?.url);
                  if (!hasReference) return null;

                  return (
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 18, display: 'grid', gap: 12 }}>
                      <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7d5d3d', fontWeight: 700 }}>
                        Tài liệu tham khảo
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, color: '#2f3c3d', fontSize: 15, lineHeight: 1.7 }}>
                        {references
                          .filter((reference: any) => reference?.title || reference?.source || reference?.url)
                          .map((reference: any, index: number) => (
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
              border: '1px solid #e5e7eb',
              padding: 26,
              boxShadow: '0 28px 70px rgba(15, 23, 42, 0.14)',
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5c5f64', fontWeight: 700 }}>
                {confirmAction.type === 'PUBLISHED' ? 'Xác nhận duyệt' : 'Từ chối bài viết'}
              </div>
              <h3 style={{ margin: '10px 0 0', fontSize: 24, lineHeight: 1.3, color: '#1f2a37', fontWeight: 800 }}>
                {confirmAction.type === 'PUBLISHED' ? 'Bạn có muốn duyệt bài này không?' : 'Bạn có muốn từ chối bài này không?'}
              </h3>
            </div>

            <div style={{ color: '#3d4853', fontSize: 15, lineHeight: 1.8, marginBottom: 18 }}>
              <div><strong>Bài:</strong> {confirmAction.item.title}</div>
              <div><strong>Tác giả:</strong> {confirmAction.item.author}</div>
            </div>

            {confirmAction.type === 'REJECTED' && (
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
                  if (confirmAction.type === 'REJECTED') {
                    if (!rejectReason.trim()) {
                      setNotice({ tone: 'error', text: 'Vui lòng nhập lý do từ chối trước khi gửi.' });
                      return;
                    }
                    handleReview(confirmAction.item, 'REJECTED', rejectReason);
                    return;
                  }

                  handleReview(confirmAction.item, 'PUBLISHED');
                }}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  background: confirmAction.type === 'PUBLISHED' ? '#1f2937' : '#8d3d34',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                {confirmAction.type === 'PUBLISHED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
