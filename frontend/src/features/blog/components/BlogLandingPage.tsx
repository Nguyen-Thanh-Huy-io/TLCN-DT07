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
} from '@/features/blog/utils/blog-metadata.util';

const mapPostToCard = (post: PublicBlogPostSummary, index: number) => {
  const metadata = extractMetadataFromBlocks(post.contentBlocks);

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || 'Bài viết lịch sử được HISGO biên tập và cập nhật.',
    category: 'Blog',
    author: post.author?.username || 'HISGO Editorial',
    date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật',
    image: post.coverImageUrl || '',
    accent: accentPalette[index % accentPalette.length],
    featured: Boolean(post.isFeatured),
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
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {authorPosts.map((post) => (
                <article
                  key={post.slug}
                  className="overflow-hidden rounded-[24px] border border-[#d7c7b2] bg-[#fffdf9] shadow-[0_16px_30px_rgba(31,42,43,0.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(31,42,43,0.08)]"
                >
                  <Link href={`/blog/${post.slug}`} className="relative block h-56 overflow-hidden">
                    {post.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${post.accent}`} />
                    )}
                    {post.tags.length > 0 ? (
                      <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                        #{post.tags[0]}
                      </span>
                    ) : null}
                  </Link>
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d5d3d]">
                      <span>{post.category}</span>
                      <span>{post.date}</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-[family-name:var(--font-heading)] leading-tight text-[#1f2a2b] transition hover:text-[#8a4d2d]">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="mb-4 text-sm leading-7 text-[#536560] line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between border-t border-[#efe3d8] pt-3">
                      <span className="text-xs uppercase tracking-[0.12em] text-[#536560]">{post.author}</span>
                      <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-[#8a4d2d] hover:underline">
                        Đọc bài →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
      <div className="hisgo-theme min-h-screen bg-[#f7f1e7] text-[#1f2a2b]">
        <Header activeTab="blog" />
        <main className="mx-auto max-w-[1280px] px-4 py-20 md:px-6 lg:px-8 font-[family-name:var(--font-body)]">
          <div className="rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] p-10 text-center shadow-[0_20px_40px_rgba(31,42,43,0.06)]">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a4d2d]">HISGO</p>
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-4xl">Chưa có bài viết nào</h1>
            <p className="mb-6 text-[#536560]">Chưa có nội dung nào để hiển thị. Hãy tạo bài viết đầu tiên cho cộng đồng HISGO.</p>
            <Link
              href="/blog/create"
              className="inline-flex items-center justify-center rounded-full bg-[#1f2a2b] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#f7f1e7] transition hover:bg-[#8a4d2d]"
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
    <div className="hisgo-theme min-h-screen bg-[#f7f1e7] text-[#1f2a2b]">
      <Header activeTab="blog" />

      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 lg:px-8 lg:py-10 font-[family-name:var(--font-body)]">
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
