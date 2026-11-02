'use client';

import { useEffect, useMemo, useState } from 'react';
import api, { extractErrorMessage, parsePaginatedResponse } from '@/services/api';
import { ContentStatus } from '@/constants/enums';

type ReviewTab = 'Chờ duyệt' | 'Đã duyệt' | 'Bị từ chối';

type ReviewPost = {
  id: string;
  title: string;
  summary: string;
  contentHtml: string;
  coverImageUrl?: string | null;
  author: string;
  createdAt: string;
  status: ReviewTab;
  rawStatus: string;
  rejectionReason?: string | null;
};

const REVIEWER_ID = process.env.NEXT_PUBLIC_ADMIN_ID || 'd2168a5d-05d7-4110-a304-94b17fe5bae5';
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

const escapeHtml = (value: string | null | undefined) =>
  (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderBlockHtml = (block: any): string => {
  if (!block || typeof block !== 'object') return '';

  if (block.type === 'paragraph') {
    const text =
      block.text ??
      (Array.isArray(block.children)
        ? block.children.map((child: any) => child?.text || '').join('')
        : '') ??
      '';
    return text.trim() ? `<p>${escapeHtml(text)}</p>` : '';
  }

  if (block.type === 'heading') {
    const text = block.text ?? block.content ?? '';
    return text.trim() ? `<h2>${escapeHtml(text)}</h2>` : '';
  }

  if (block.type === 'quote') {
    const text = block.text ?? block.content ?? '';
    return text.trim() ? `<blockquote>${escapeHtml(text)}</blockquote>` : '';
  }

  if (block.type === 'image') {
    const url = block.url ?? block.imageUrl ?? '';
    const caption = block.caption ?? block.alt ?? '';
    if (!url) return '';

    return `
      <figure class="my-6">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" class="mx-auto max-h-[420px] w-full rounded-[18px] object-cover shadow-sm" />
        ${caption ? `<figcaption class="mt-2 text-center text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">${escapeHtml(caption)}</figcaption>` : ''}
      </figure>
    `;
  }

  return '';
};

const renderContentHtml = (item: any): string => {
  if (typeof item?.contentRichText === 'string' && item.contentRichText.trim().startsWith('<')) {
    return item.contentRichText;
  }

  const content = Array.isArray(item?.content) ? item.content : [];
  if (content.length > 0) {
    return content.map((block: any) => renderBlockHtml(block)).join('');
  }

  if (typeof item?.contentRichText === 'string') return item.contentRichText;
  if (typeof item?.content === 'string') return item.content;
  return item?.summary || item?.excerpt || '';
};

const normalizePost = (item: any): ReviewPost => {
  const summary = stripHtml(item.summary || item.contentRichText || item.excerpt) || 'Bài viết chưa có mô tả.';
  const author = item.author?.fullName || item.author?.username || item.author?.email || 'Biên tập viên';
  const status = STATUS_LABELS[item.status] || 'Chờ duyệt';
  const contentHtml = renderContentHtml(item);
  const coverImageUrl = item.coverImageUrl || item.thumbnailUrl || item.image || null;

  return {
    id: item.id,
    title: item.title || 'Bài viết chưa có tiêu đề',
    summary: summary.length > 170 ? `${summary.slice(0, 167)}...` : summary,
    contentHtml,
    coverImageUrl,
    author,
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới',
    status,
    rawStatus: item.status,
    rejectionReason: item.rejectionReason || null,
  };
};

export default function AdminBlogReviewPage() {
  const [tab, setTab] = useState<ReviewTab>('Chờ duyệt');
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingReason, setPendingReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts', {
        params: { page: 1, limit: 100 },
      });

      const parsed = parsePaginatedResponse<any>(response.data);
      const mapped = (parsed.items || []).map(normalizePost);
      setItems(mapped);
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

  const selectedItem = filtered.find((item) => item.id === selectedId) || items.find((item) => item.id === selectedId) || null;

  const handleReview = async (status: 'PUBLISHED' | 'REJECTED', reason?: string) => {
    if (!selectedItem) return;

    try {
      await api.patch(`/posts/${selectedItem.id}/review`, {
        reviewerId: REVIEWER_ID,
        status,
        reviewNote: reason?.trim() || undefined,
      });

      setItems((current) =>
        current.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                status: status === 'PUBLISHED' ? 'Đã duyệt' : 'Bị từ chối',
                rawStatus: status,
                rejectionReason: status === 'REJECTED' ? reason || null : null,
              }
            : item,
        ),
      );

      setNotice({
        tone: 'ok',
        text:
          status === 'PUBLISHED'
            ? `Đã duyệt bài "${selectedItem.title}".`
            : `Đã từ chối bài "${selectedItem.title}".`,
      });
      setPendingReason('');
      setSelectedId(null);
    } catch (error) {
      setNotice({ tone: 'error', text: extractErrorMessage(error, 'Không thể cập nhật trạng thái bài.') });
    }
  };

  const stats = {
    pending: items.filter((item) => item.status === 'Chờ duyệt').length,
    published: items.filter((item) => item.status === 'Đã duyệt').length,
    rejected: items.filter((item) => item.status === 'Bị từ chối').length,
  };

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-8 md:py-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin workspace</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] md:text-5xl">Quản lý bài viết</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-body)]">
                Kiểm tra bài chờ duyệt, phê duyệt hoặc từ chối với lý do rõ ràng trước khi xuất bản lên blog công khai.
              </p>
            </div>
            <a
              href="/blog"
              className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
            >
              Xem blog công khai
            </a>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Chờ duyệt</p>
            <p className="mt-4 text-3xl font-bold text-[var(--ink)]">{stats.pending}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Đã duyệt</p>
            <p className="mt-4 text-3xl font-bold text-[var(--ink)]">{stats.published}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Bị từ chối</p>
            <p className="mt-4 text-3xl font-bold text-[var(--ink)]">{stats.rejected}</p>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-page)] p-1">
              {(['Chờ duyệt', 'Đã duyệt', 'Bị từ chối'] as ReviewTab[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    tab === value
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                  }`}
                  onClick={() => setTab(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <label className="flex min-w-[220px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--text-muted)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm bài viết..."
                className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </label>
          </div>

          {notice && (
            <div
              role="status"
              className={`mb-5 rounded-[18px] border px-4 py-3 text-sm ${
                notice.tone === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {notice.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <th className="px-3 py-2 font-medium">Bài viết</th>
                  <th className="px-3 py-2 font-medium">Tác giả</th>
                  <th className="px-3 py-2 font-medium">Ngày</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                      Đang tải bài viết...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                      Không có bài nào ở trạng thái “{tab}”.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-page)] align-middle">
                      <td className="rounded-l-[18px] px-3 py-4">
                        <div>
                          <p className="text-base font-semibold text-[var(--ink)]">{item.title}</p>
                          <p className="mt-1 max-w-[520px] text-sm leading-6 text-[var(--text-body)]">{item.summary}</p>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-[var(--text-body)]">{item.author}</td>
                      <td className="px-3 py-4 text-sm text-[var(--text-body)]">{item.createdAt}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === 'Chờ duyệt'
                              ? 'bg-amber-100 text-amber-700'
                              : item.status === 'Đã duyệt'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="rounded-r-[18px] px-3 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                            onClick={() => setSelectedId(item.id)}
                          >
                            Xem
                          </button>
                          {item.status === 'Chờ duyệt' && (
                            <>
                              <button
                                type="button"
                                className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                                onClick={() => handleReview('PUBLISHED')}
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                                onClick={() => setSelectedId(item.id)}
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
        </section>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-[620px] rounded-[28px] border border-[var(--border)] bg-[var(--bg-page)] p-6 shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Review bài viết</p>
                <h2 className="mt-2 text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">{selectedItem.title}</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
                onClick={() => setSelectedId(null)}
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-4 text-sm leading-6 text-[var(--text-body)]">
                <p>
                  <span className="font-medium text-[var(--ink)]">Tác giả:</span> {selectedItem.author}
                </p>
                <p>
                  <span className="font-medium text-[var(--ink)]">Ngày gửi:</span> {selectedItem.createdAt}
                </p>
              </div>

              {selectedItem.coverImageUrl && (
                <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--bg-surface)]">
                  <img
                    src={selectedItem.coverImageUrl}
                    alt={selectedItem.title}
                    className="h-[240px] w-full object-cover"
                  />
                </div>
              )}

              <div
                className="mt-5 text-[15px] leading-8 text-[var(--text-body)] [&_img]:my-5 [&_img]:max-h-[420px] [&_img]:w-auto [&_img]:rounded-[18px] [&_p]:mb-4 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--gold)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--ink)]"
                dangerouslySetInnerHTML={{
                  __html: selectedItem.contentHtml || selectedItem.summary,
                }}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--ink)]">Lý do từ chối (nếu có)</label>
              <textarea
                value={pendingReason}
                onChange={(event) => setPendingReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: thiếu nguồn, thiếu bằng chứng, nội dung chưa phù hợp..."
                className="mt-2 w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--ink)] outline-none ring-0 placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700"
                onClick={() => {
                  if (!pendingReason.trim()) {
                    setNotice({ tone: 'error', text: 'Vui lòng nhập lý do từ chối trước khi gửi.' });
                    return;
                  }
                  handleReview('REJECTED', pendingReason);
                }}
              >
                Từ chối
              </button>
              <button
                type="button"
                className="rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white"
                onClick={() => handleReview('PUBLISHED')}
              >
                Duyệt bài
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
