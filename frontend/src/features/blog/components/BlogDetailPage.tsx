import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { CommentThread } from '@/components/hisgo/CommentThread';
import { fetchBlogPost, fetchBlogPosts, type PublicBlogPostSummary } from '@/services/public/public-content.service';

const accentPalette = [
  'from-[#7b3f2b] via-[#b27342] to-[#d9c09b]',
  'from-[#3a4d43] via-[#6a7d5f] to-[#d2c5a3]',
  'from-[#513b31] via-[#9b724f] to-[#e0c8a8]',
  'from-[#2e3a3d] via-[#58716a] to-[#d7d0bf]',
  'from-[#5a3929] via-[#ad7659] to-[#f0dabc]',
  'from-[#3d4a55] via-[#72828a] to-[#eee1bf]',
];

const extractMetadata = (contentBlocks: unknown) => {
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

  const fallbackPayload =
    Array.isArray(contentBlocks)
      ? contentBlocks.reduce<Record<string, unknown>>((acc, block) => {
          if (!block || typeof block !== 'object') return acc;
          const candidate = block as Record<string, unknown>;
          if ((candidate.type === 'meta' && candidate.kind === 'metadata') || candidate.type === 'metadata' || candidate.kind === 'metadata') {
            return { ...acc, ...(candidate.metadata && typeof candidate.metadata === 'object' ? (candidate.metadata as Record<string, unknown>) : candidate) };
          }
          return acc;
        }, {})
      : {};

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

const renderParagraphs = (value: string) =>
  (value || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\r\n/g, '\n'));

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildParagraphHtml = (value: string) =>
  renderParagraphs(value)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');

const extractBlocksHtml = (contentBlocks: unknown): string => {
  if (!Array.isArray(contentBlocks)) return '';

  return contentBlocks
    .map((block) => {
      if (!block || typeof block !== 'object') return '';

      const candidate = block as Record<string, unknown>;

      if ((candidate.type === 'meta' && candidate.kind === 'metadata') || candidate.type === 'metadata' || candidate.kind === 'metadata') {
        return '';
      }

      if (typeof candidate.content === 'string' && candidate.content.trim()) {
        return buildParagraphHtml(candidate.content as string);
      }

      const heading = typeof candidate.heading === 'string' ? candidate.heading.trim() : '';
      const text = typeof candidate.text === 'string' ? candidate.text.trim() : '';
      const quoteText = typeof candidate.quoteText === 'string' ? candidate.quoteText.trim() : '';
      const imageUrl = typeof candidate.imageUrl === 'string' ? candidate.imageUrl.trim() : '';
      const caption = typeof candidate.caption === 'string' ? candidate.caption.trim() : '';

      if (heading && text) {
        return `<h3>${escapeHtml(heading)}</h3>${buildParagraphHtml(text)}`;
      }

      if (heading) {
        return `<h3>${escapeHtml(heading)}</h3>`;
      }

      if (text) {
        return buildParagraphHtml(text);
      }

      if (quoteText) {
        return `<blockquote>${escapeHtml(quoteText).replace(/\n/g, '<br />')}</blockquote>`;
      }

      if (imageUrl) {
        const figureCaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
        return `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(caption || 'Hình ảnh trong bài viết')}" />${figureCaption}</figure>`;
      }

      return '';
    })
    .filter(Boolean)
    .join('');
};

const getRelatedBlogPosts = (
  currentPost: PublicBlogPostSummary,
  allPosts: PublicBlogPostSummary[],
  currentTags: string[],
  limit = 3,
) => {
  const normalizedCurrentTags = currentTags.map((t) => t.toLowerCase().trim());
  const currentAuthorId = currentPost.author?.id;
  const currentAuthorName = currentPost.author?.username?.toLowerCase().trim();

  const candidates = allPosts.filter((p) => p.id !== currentPost.id && p.slug !== currentPost.slug);
  if (candidates.length === 0) return [];

  const scored = candidates.map((candidate, index) => {
    const candidateMeta = extractMetadata(candidate.contentBlocks);
    const candidateTags = candidateMeta.tags.map((t) => t.toLowerCase().trim());

    const sharedTagsCount = candidateTags.filter((t) => normalizedCurrentTags.includes(t)).length;
    const isSameAuthor =
      (currentAuthorId && candidate.author?.id && currentAuthorId === candidate.author.id) ||
      (currentAuthorName && candidate.author?.username && currentAuthorName === candidate.author.username.toLowerCase().trim());

    const score =
      sharedTagsCount * 10 +
      (isSameAuthor ? 5 : 0) +
      (candidate.isFeatured ? 2 : 0);

    const timestamp = new Date(candidate.publishedAt || candidate.createdAt || 0).getTime();

    return {
      post: candidate,
      tags: candidateMeta.tags,
      score,
      timestamp,
      index,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.timestamp - a.timestamp;
  });

  return scored.slice(0, limit);
};

export async function BlogDetailPage({ slug }: { slug: string }) {
  const [post, allPosts] = await Promise.all([
    fetchBlogPost(slug),
    fetchBlogPosts(),
  ]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f7f1e7] px-4 py-20 text-[#1f2a2b]">
        <Header activeTab="blog" />
        <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] p-10 text-center shadow-[0_20px_40px_rgba(31,42,43,0.06)]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a4d2d]">Không tìm thấy</p>
          <h1 className="mb-4 font-[family-name:var(--font-heading)] text-4xl">Bài viết không tồn tại</h1>
          <p className="mb-6 text-[#536560]">Đường dẫn bạn mở hiện chưa có trong thư viện blog của HISGO.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-full bg-[#1f2a2b] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#f7f1e7]">
            <ArrowLeft size={15} /> Quay lại blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const blocksHtml = extractBlocksHtml(post.contentBlocks);
  const articleBody = blocksHtml || `<p>${post.excerpt || 'Nội dung bài viết đang được cập nhật.'}</p>`;
  const metadata = extractMetadata(post.contentBlocks);
  const hasReferences = metadata.references.some((reference) => reference.title || reference.source || reference.url);
  const relatedPosts = getRelatedBlogPosts(post, allPosts, metadata.tags, 3);

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-8 md:py-12">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">BLOG</p>
          <h1 className="mt-4 max-w-5xl font-[family-name:var(--font-heading)] text-4xl leading-[0.95] tracking-[-0.04em] text-[var(--ink)] md:text-6xl">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} />
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
            </span>
            <span>
              Viết bởi{' '}
              {post.author?.username ? (
                <Link
                  href={`/blog?author=${encodeURIComponent(post.author.username)}`}
                  className="font-semibold text-[var(--ink)] underline-offset-2 transition-colors hover:text-[#8a4d2d] hover:underline"
                >
                  {post.author.username}
                </Link>
              ) : (
                'HISGO Editorial'
              )}
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_10px_22px_rgba(20,35,63,0.03)] md:p-6">
          {post.coverImageUrl ? (
            <div className="mb-6 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-page)]">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="h-64 w-full object-cover md:h-80"
              />
            </div>
          ) : null}

          {metadata.tags.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          ) : null}

          {post.excerpt ? (
            <div className="mb-8 rounded-[18px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              {renderParagraphs(post.excerpt).map((paragraph, index) => (
                <p
                  key={`excerpt-${index}`}
                  className="text-[1.05rem] leading-[1.9] text-[var(--text-body)] md:text-[1.12rem]"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          <article className="space-y-8 text-[1.06rem] leading-[1.9] text-[var(--text-body)] md:text-[1.15rem]">
            <div
              className="space-y-6 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-[family-name:var(--font-heading)] [&_h3]:text-[1.8rem] [&_h3]:leading-[1.08] [&_h3]:tracking-[-0.03em] [&_h3]:text-[var(--ink)] [&_p]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--gold)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:mx-auto [&_img]:max-w-full [&_img]:rounded-[20px] [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:rounded-[20px] [&_figure]:border [&_figure]:border-[var(--border)] [&_figure]:bg-[var(--bg-page)] [&_figure]:p-3 [&_figure]:text-center [&_figcaption]:mt-3 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:italic [&_figcaption]:text-[var(--text-muted)]"
              dangerouslySetInnerHTML={{ __html: articleBody }}
            />
          </article>

          {hasReferences ? (
            <div className="mt-10 space-y-3 border-t border-[var(--border)] pt-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Tài liệu tham khảo</p>
              <ul className="space-y-2 pl-5 text-[0.95rem] leading-7 text-[var(--text-body)] list-disc">
                {metadata.references.filter((reference) => reference.title || reference.source || reference.url).map((reference, index) => (
                  <li key={`${reference.title || reference.source || 'source'}-${index}`}>
                    {reference.url ? (
                      <a href={reference.url} target="_blank" rel="noreferrer" className="text-[var(--ink)] underline-offset-2 hover:underline">
                        {reference.title || 'Nguồn tham khảo'}
                      </a>
                    ) : (
                      <span>{reference.title || 'Nguồn tham khảo'}</span>
                    )}
                    {reference.source ? <span className="text-[var(--text-muted)]"> — {reference.source}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-10">
            <CommentThread postId={post.id} />
          </div>

          {relatedPosts.length > 0 ? (
            <section className="mt-12 border-t border-[var(--border)] pt-8">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a4d2d]">Khám phá thêm</p>
                  <h2 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
                    Bài viết liên quan
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4d2d] transition hover:text-[var(--ink)]"
                >
                  Xem tất cả blog →
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map(({ post: item, tags: itemTags, index }) => (
                  <article
                    key={item.slug}
                    className="group flex flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] shadow-[0_4px_16px_rgba(20,35,63,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-[#8a4d2d] hover:shadow-[0_12px_28px_rgba(20,35,63,0.08)]"
                  >
                    <Link href={`/blog/${item.slug}`} className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-surface)]">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${
                            accentPalette[index % accentPalette.length]
                          } opacity-80`}
                        />
                      )}
                      {itemTags.length > 0 ? (
                        <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                          #{itemTags[0].replace(/^#/, '')}
                        </span>
                      ) : null}
                    </Link>

                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      <div className="mb-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={12} />
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                        </span>
                        <span>•</span>
                        {item.author?.username ? (
                          <Link
                            href={`/blog?author=${encodeURIComponent(item.author.username)}`}
                            className="transition-colors hover:text-[#8a4d2d] hover:underline"
                          >
                            {item.author.username}
                          </Link>
                        ) : (
                          <span>HISGO</span>
                        )}
                      </div>

                      <h3 className="mb-2 line-clamp-2 font-[family-name:var(--font-heading)] text-lg font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[#8a4d2d]">
                        <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                      </h3>

                      {item.excerpt ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-body)]">
                          {item.excerpt}
                        </p>
                      ) : null}

                      <div className="mt-auto pt-3">
                        <Link
                          href={`/blog/${item.slug}`}
                          className="inline-flex items-center text-xs font-semibold text-[#8a4d2d] transition group-hover:underline"
                        >
                          Đọc tiếp →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <Footer />
    </main>
  );
}
