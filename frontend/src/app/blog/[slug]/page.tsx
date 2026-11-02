import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { CommentThread } from '@/components/hisgo/CommentThread';
import { blogPosts as fallbackPosts } from '@/data/blog';

const DEFAULT_BLOG_COVER =
  'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80';

const normalizeImageUrl = (url?: string | null) => {
  if (!url) return '';

  const currentApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  return url
    .trim()
    .replace(/^http:\/\/localhost:5000(?=\/)/, currentApiUrl)
    .replace(/^http:\/\/127\.0\.0\.1:5000(?=\/)/, currentApiUrl);
};

const stripHtml = (value?: string | null) =>
  (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const readTimeFromText = (text: string) => {
  const words = Math.max(1, stripHtml(text).split(/\s+/).filter(Boolean).length);
  const minutes = Math.max(4, Math.ceil(words / 180));
  return `${minutes} phút đọc`;
};

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post: any = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/posts?status=PUBLISHED&page=1&limit=100`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const items = data?.data?.items || data?.items || [];
      post = items.find((item: any) => item.slug === slug);
    }
  } catch {
    post = null;
  }

  if (!post) {
    post = fallbackPosts.find((item) => item.slug === slug) ?? null;
  }

  if (!post) {
    notFound();
  }

  const title = post.title || 'Bài viết HISGO';
  const summary = stripHtml(post.summary || post.excerpt || post.contentRichText || '') || 'Bài viết đang chờ xuất bản.';
  const image = normalizeImageUrl(
    post.coverImageUrl ||
      post.thumbnailUrl ||
      post.image ||
      fallbackPosts[0]?.image ||
      DEFAULT_BLOG_COVER,
  );
  const author = post.author?.fullName || post.author?.username || post.author || post.authorName || 'HISGO Editorial';
  const publishedAt = post.publishedAt || post.createdAt;
  const dateLabel = publishedAt ? new Date(publishedAt).toLocaleDateString('vi-VN') : post.date || 'Mới';
  const readTime = post.readTime || readTimeFromText(post.contentRichText || summary);
  const storyBlocks = Array.isArray(post.content)
    ? post.content.filter((block: any) => block && typeof block === 'object')
    : [];

  const galleryImages: Array<{ url: string; caption: string }> = storyBlocks
    .filter((block: any) => block?.type === 'image' && (block.url || block.imageUrl))
    .map((block: any) => ({
      url: block.url || block.imageUrl,
      caption: block.caption || block.alt || 'Hình ảnh trong bài viết',
    }))
    .filter((item: { url: string; caption: string }) => Boolean(item.url));

  const fallbackStoryBlocks =
    post.content && !Array.isArray(post.content)
      ? [{ type: 'paragraph', text: String(post.content) }]
      : [];

  const renderedStoryBlocks = storyBlocks.length > 0 ? storyBlocks : fallbackStoryBlocks;

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <article className="mx-auto max-w-[1260px] px-5 py-8 md:px-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <Link href="/blog" className="transition-colors hover:text-[var(--primary)]">Blog</Link>
          <span>•</span>
          <span>{post.category || 'Lịch sử Việt Nam'}</span>
        </div>

        <header className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_18px_38px_rgba(17,17,19,0.06)]">
            <div className="relative h-[420px] md:h-[520px]">
              <img
                src={image || DEFAULT_BLOG_COVER}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121214]/75 via-[#121214]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--bg-page)]/90">{post.accent || 'HISGO Journal'}</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-bold font-[family-name:var(--font-heading)] leading-[0.96] text-white md:text-5xl xl:text-[4rem]">
                  {title}
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-7">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Nhà xuất bản HISGO</p>
            <p className="mt-5 text-2xl font-medium leading-snug text-[var(--ink)] font-[family-name:var(--font-heading)]">
              {summary}
            </p>

            <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-body)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)]">Tác giả</span>
                <span className="font-medium text-[var(--ink)]">{author}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)]">Ngày</span>
                <span>{dateLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)]">Thời lượng</span>
                <span>{readTime}</span>
              </div>
            </div>

          </div>
        </header>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <p className="text-[1.15rem] leading-[1.9] text-[var(--text-body)] md:text-[1.35rem]">{summary}</p>

          {renderedStoryBlocks.map((block: any, index: number) => {
            if (index === 0 && block?.type === 'paragraph') {
              const firstText = block.text || block.content || '';
              if (firstText) {
                return (
                  <p key={`${slug}-paragraph-${index}`} className="text-lg leading-[1.9] text-[var(--text-body)] md:text-[1.125rem]">
                    {firstText}
                  </p>
                );
              }
            }

            if (block?.type === 'paragraph') {
              const text = block.text || block.content || '';
              if (!text) return null;

              return (
                <p key={`${slug}-paragraph-${index}`} className="text-lg leading-[1.9] text-[var(--text-body)] md:text-[1.125rem]">
                  {text}
                </p>
              );
            }

            if (block?.type === 'heading') {
              const heading = block.text || block.content || `Tiêu đề ${index + 1}`;
              return (
                <h2 key={`${slug}-heading-${index}`} className="mt-2 text-2xl font-bold text-[var(--ink)] md:text-[2rem]">
                  {heading}
                </h2>
              );
            }

            if (block?.type === 'image') {
              const imgUrl = block.url || block.imageUrl || image;
              const imgCaption = block.caption || block.alt || 'Hình ảnh trong bài viết';

              return (
                <figure key={`${slug}-image-${index}`} className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-3 md:p-4">
                  <img src={imgUrl} alt={imgCaption} className="h-[280px] w-full rounded-[18px] object-cover md:h-[420px]" />
                  {imgCaption && <figcaption className="mt-3 px-1 text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">{imgCaption}</figcaption>}
                </figure>
              );
            }

            if (block?.type === 'quote') {
              const quote = block.text || block.content || '';
              if (!quote) return null;
              return (
                <blockquote key={`${slug}-quote-${index}`} className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
                  <p className="text-lg italic leading-[1.8] text-[var(--ink)] md:text-[1.4rem]">“{quote}”</p>
                </blockquote>
              );
            }

            return null;
          })}

          <blockquote className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
            <p className="text-lg italic leading-[1.8] text-[var(--ink)] md:text-[1.45rem]">
              “Câu chuyện lịch sử không chỉ là về sự kiện. Nó là cách ta nhìn những khoảng trống giữa chúng, nơi ký ức được dựng nên bằng đá, lời nói và nhịp sống hằng ngày.”
            </p>
          </blockquote>
        </div>

        <div className="mt-8">
          <CommentThread postId={typeof post?.id === 'string' ? post.id : undefined} />
        </div>
      </article>

      <Footer />
    </main>
  );
}
