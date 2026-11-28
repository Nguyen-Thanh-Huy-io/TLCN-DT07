import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { BlogComposerBar } from '@/features/blog/components/BlogLandingParts';
import { BlogFeaturedSlider } from '@/features/blog/components/BlogLandingParts';
import { BlogBrowser } from '@/features/blog/components/BlogBrowser';
import { fetchBlogPosts, type PublicBlogPostSummary } from '@/services/public/public-content.service';
import {
  BLOG_ACCENT_PALETTE as accentPalette,
  extractMetadataFromBlocks,
} from '@/features/blog/facades/useBlogCreateFacade';

const DEFAULT_BLOG_DATE_LABEL = 'Mới cập nhật';

function formatBlogDateTime(iso?: string | null): string {
  if (!iso) return DEFAULT_BLOG_DATE_LABEL;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return DEFAULT_BLOG_DATE_LABEL;

  const parts = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(parsed);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const day = pick('day');
  const month = pick('month');
  const year = pick('year');
  const hour = pick('hour');
  const minute = pick('minute');

  return day && month && year
    ? `${day}/${month}/${year} ${hour}:${minute}`
    : DEFAULT_BLOG_DATE_LABEL;
}

const mapPostToCard = (post: PublicBlogPostSummary, index: number) => {
  const metadata = extractMetadataFromBlocks(post.contentBlocks);

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || 'Bài viết lịch sử được HISGO biên tập và cập nhật.',
    category: 'Blog',
    author: post.author?.username || 'HISGO Editorial',
    date: formatBlogDateTime(post.publishedAt || post.createdAt),
    image: post.coverImageUrl || '',
    accent: accentPalette[index % accentPalette.length],
    featured: Boolean(post.isFeatured),
    viewCount: post.viewCount ?? 0,
    tags: metadata.tags,
  };
};

export async function BlogLandingPage({ author }: { author?: string } = {}) {
  const postsFromApi = await fetchBlogPosts();
  const posts = postsFromApi.map(mapPostToCard);

  if (author) {
    const authorTrimmed = author.trim();
    const authorPosts = posts.filter(
      (p) => p.author.toLowerCase() === authorTrimmed.toLowerCase(),
    );

    return (
      <div className="hisgo-theme min-h-screen bg-[#f7f1e7] text-[#1f2a2b]">
        <Header activeTab="blog" />

        <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 lg:px-8 lg:py-10 font-[family-name:var(--font-body)]">
          <div className="mb-8 flex flex-col gap-4 border-b border-[#d7c7b2] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Link
                  href="/blog"
                  className="text-xs font-bold uppercase tracking-[0.22em] text-[#8a4d2d] transition hover:text-[#1f2a2b]"
                >
                  ← Tất cả bài viết
                </Link>
                <span className="text-[#8a4d2d]">•</span>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#7d5d3d]">
                  Tác giả
                </span>
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl leading-none text-[#1f2a2b] md:text-5xl">
                Bài viết của {authorTrimmed}
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#4f5d59] md:text-base">
              Tìm thấy <strong className="text-[#1f2a2b]">{authorPosts.length}</strong> bài viết được đăng bởi tác giả này.
            </p>
          </div>

          <BlogComposerBar />

          {authorPosts.length === 0 ? (
            <div className="rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] p-10 text-center shadow-[0_20px_40px_rgba(31,42,43,0.06)]">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a4d2d]">HISGO Blog</p>
              <h2 className="mb-4 font-[family-name:var(--font-heading)] text-3xl">
                Chưa có bài viết nào của tác giả &ldquo;{authorTrimmed}&rdquo;
              </h2>
              <p className="mb-6 text-[#536560]">
                Tác giả này hiện chưa có bài viết nào được xuất bản hoặc tên tác giả không khớp.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-full bg-[#1f2a2b] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#f7f1e7] transition hover:bg-[#8a4d2d]"
              >
                Quay lại danh sách blog
              </Link>
            </div>
          ) : (
            <BlogBrowser
              posts={authorPosts}
              eyebrowLabel="Tác giả"
              headingTitle={`Bài viết của ${authorTrimmed}`}
            />
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const featuredPosts = [...posts]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 5);
  const featuredPost = featuredPosts[0] ?? null;
  const sidebarPosts = posts.slice(0, 4);

  if (!featuredPost) {
    return (
      <div className="hisgo-theme flex min-h-screen flex-col bg-[#f7f1e7] text-[#2D1A10]">
        <Header activeTab="blog" />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-20 md:px-6 lg:px-8 font-[family-name:var(--font-body)]">
          <div className="rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] p-10 text-center shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#7A1F24]">HISGO</p>
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold">Chưa có bài viết nào</h1>
            <p className="mb-6 text-[#6B5B4A]">Chưa có nội dung nào để hiển thị. Hãy tạo bài viết đầu tiên cho cộng đồng HISGO.</p>
            <Link
              href="/blog/create"
              className="inline-flex items-center justify-center rounded-xl bg-[#7A1F24] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[#5E161A]"
            >
              Tạo bài viết đầu tiên
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="hisgo-theme flex min-h-screen flex-col bg-[#f7f1e7] text-[#2D1A10]">
      <Header activeTab="blog" />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6 lg:px-8 lg:py-10 font-[family-name:var(--font-body)]">
        <div className="mb-8 flex flex-col gap-4 border-b border-[#d7c7b2] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8a4d2d]">HISGO</p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-none text-[#1f2a2b] md:text-6xl">
              Blog & Lịch sử
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#4f5d59] md:text-base">
            Những câu chuyện văn hóa, sự kiện và nhân vật được kể lại bằng lời văn chậm, sâu và đầy cảm hứng.
          </p>
        </div>

        <BlogComposerBar />

        <section className="mb-12 mt-8 grid gap-6 lg:grid-cols-[1.55fr_0.7fr]">
          <BlogFeaturedSlider posts={featuredPosts} autoPlayInterval={10000} />

          <aside className="h-full">
            <div className="flex h-full flex-col justify-between rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] p-6 shadow-[0_24px_50px_rgba(31,42,43,0.06)]">
              <div>
                <div className="mb-5 flex items-center justify-between border-b border-[#efe3d8] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8a4d2d]/10 text-[#8a4d2d]">
                      <TrendingUp size={15} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a4d2d]">
                        Đọc nhiều
                      </p>
                      <h3 className="font-[family-name:var(--font-heading)] text-xl text-[#1f2a2b]">
                        Xu hướng tuần
                      </h3>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#7d5d3d]">
                    Top nổi bật
                  </span>
                </div>

                <ul className="space-y-4">
                  {sidebarPosts.map((post, index) => (
                    <li
                      key={post.slug}
                      className="border-b border-[#efe3d8] pb-4 last:border-b-0 last:pb-0"
                    >
                      <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3.5">
                        <span className="font-[family-name:var(--font-heading)] text-2xl font-bold leading-none text-[#d7c7b2] transition group-hover:text-[#8a4d2d]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d5d3d]">
                            <span>{post.category}</span>
                            <span>•</span>
                            <span>{post.date}</span>
                          </div>
                          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1f2a2b] transition group-hover:text-[#8a4d2d]">
                            {post.title}
                          </h4>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-2xl border border-[#efe3d8] bg-[#fbf7f0] p-4 text-center">
                <p className="text-xs text-[#536560]">
                  Góp phần gìn giữ và lan tỏa tri thức cùng cộng đồng HISGO
                </p>
                <Link
                  href="/blog/create"
                  className="mt-2 inline-flex items-center justify-center text-xs font-bold text-[#8a4d2d] hover:underline"
                >
                  Viết bài chia sẻ →
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <BlogBrowser posts={posts} />
      </main>
      <Footer />
    </div>
  );
}
