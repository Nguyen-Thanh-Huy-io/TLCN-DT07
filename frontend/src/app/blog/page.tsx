'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { CreatePostComposer } from '@/components/hisgo/CreatePostComposer';
import { blogCategories as fallbackCategories, blogPosts as fallbackPosts } from '@/data/blog';
import api, { parsePaginatedResponse } from '@/services/api';
import { ContentStatus } from '@/constants/enums';

type BlogCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  accent: string;
};

const fallbackImage =
  'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80';

const stripHtml = (value?: string | null) =>
  (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);

const normalizePost = (item: any): BlogCard => {
  const title = item.title || 'Bài viết mới';
  const excerpt = stripHtml(item.summary || item.contentRichText || item.excerpt) || 'Bài viết đang chờ xuất bản.';
  const image = item.coverImageUrl || item.thumbnailUrl || item.image || fallbackImage;
  const author = item.author?.fullName || item.author?.username || item.author?.name || 'HISGO Editorial';
  const publishedAt = item.publishedAt || item.createdAt;
  const dateLabel = publishedAt ? new Date(publishedAt).toLocaleDateString('vi-VN') : 'Mới';
  const readTime = `${Math.max(4, Math.ceil((stripHtml(item.contentRichText || item.summary).length || 320) / 180))} phút đọc`;

  return {
    id: item.id,
    slug: item.slug || slugify(title),
    title,
    excerpt: excerpt.length > 180 ? `${excerpt.slice(0, 177)}...` : excerpt,
    category: item.category || 'Lịch sử Việt Nam',
    author,
    date: dateLabel,
    readTime,
    image,
    accent: item.type || 'HISGO Journal',
  };
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/posts', {
          params: { status: ContentStatus.PUBLISHED, page: 1, limit: 12 },
        });

        const parsed = parsePaginatedResponse<any>(response.data);
        const nextPosts = (parsed.items || []).map(normalizePost);
        setPosts(nextPosts.length ? nextPosts : fallbackPosts.slice(0, 6).map((post) => ({ ...post, id: post.slug })));
      } catch (error) {
        setPosts(fallbackPosts.slice(0, 6).map((post) => ({ ...post, id: post.slug })));
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const featuredPost = posts[0] ?? fallbackPosts[0];
  const popularPosts = posts.slice(1, 4) || fallbackPosts.slice(1, 4);
  const recentPosts = posts.slice(4) || fallbackPosts.slice(4);

  const categories = useMemo(
    () =>
      [...fallbackCategories].map((category) => ({
        ...category,
        count: posts.filter((post) => post.category === category.label).length || category.count,
      })),
    [posts],
  );

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <div className="mx-auto max-w-[1280px] px-6 py-8 md:py-12 lg:px-8">
        <section className="mb-12 border-b border-[var(--border)] pb-6">
          <div className="max-w-5xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">Lịch sử Việt Nam</p>
            <h1 className="mt-3 text-4xl font-bold font-[family-name:var(--font-heading)] leading-[0.94] tracking-[-0.04em] text-[var(--ink)] md:text-5xl lg:text-[4rem]">
              Từ di tích, nhân vật và biến cố đến ký ức cộng đồng.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-body)]">
              HISGO Journal đưa người đọc từ những dấu mốc Việt Nam tới các chiều sâu văn hóa, chính trị và đời sống hàng ngày.
            </p>
          </div>

          <div className="mt-8 max-w-4xl">
            <div className="flex w-full items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                aria-label="Tìm kiếm bài viết"
                placeholder="Tìm kiếm bài viết, sự kiện, nhân vật..."
                className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-3.5 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--primary)]"
              >
                {category.label}
                <span className="ml-2 text-[var(--text-muted)]">{category.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <CreatePostComposer />
        </section>

        {loading ? (
          <div className="mb-12 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-sm text-[var(--text-muted)]">
            Đang tải các bài viết đã xuất bản...
          </div>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                  <div className="relative min-h-[340px]">
                    <img src={featuredPost.image} alt={featuredPost.title} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex flex-col justify-between p-6 md:p-8">
                    <div>
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        <span className="rounded-full border border-[var(--border-gold)] bg-[var(--bg-page)] px-2 py-1 text-[var(--ink)]">{featuredPost.category}</span>
                        <span>{featuredPost.accent}</span>
                      </div>

                      <h2 className="mt-5 text-3xl font-bold font-[family-name:var(--font-heading)] leading-[1.05] text-[var(--ink)] md:text-[2.1rem]">
                        {featuredPost.title}
                      </h2>

                      <p className="mt-4 text-base leading-relaxed text-[var(--text-body)]">{featuredPost.excerpt}</p>
                    </div>

                    <div className="mt-8 space-y-5 border-t border-[var(--border)] pt-5">
                      <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
                        <span>Tác giả: {featuredPost.author}</span>
                        <span>{featuredPost.date}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[var(--text-muted)]">{featuredPost.readTime}</span>
                        <Link
                          href={`/blog/${featuredPost.slug}`}
                          className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                        >
                          Đọc bài
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <aside className="space-y-5">
                <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                  <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">
                    Lịch sử Việt Nam chọn lọc
                  </h3>
                  <div className="mt-4 space-y-4">
                    {popularPosts.map((post) => (
                      <Link key={post.slug} href={`/blog/${post.slug}`} className="group block rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] p-3 transition-colors hover:border-[var(--gold)]">
                        <div className="flex items-center gap-3">
                          <img src={post.image} alt={post.title} className="h-16 w-16 rounded-[var(--radius-btn)] object-cover" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{post.category}</p>
                            <h4 className="mt-1 text-sm font-semibold text-[var(--ink)] line-clamp-2 group-hover:text-[var(--primary)]">
                              {post.title}
                            </h4>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                  <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">Mùa lưu trữ Việt Nam</h3>
                  <ul className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
                    <li className="flex items-center justify-between border-b border-[var(--border)] pb-2"><span>Nhà nước & quyền lực</span><span>12 bài</span></li>
                    <li className="flex items-center justify-between border-b border-[var(--border)] pb-2"><span>Thành thị & giao thương</span><span>9 bài</span></li>
                    <li className="flex items-center justify-between border-b border-[var(--border)] pb-2"><span>Nhân vật & ký ức</span><span>14 bài</span></li>
                    <li className="flex items-center justify-between"><span>Mở rộng thế giới</span><span>7 bài</span></li>
                  </ul>
                </div>
              </aside>
            </section>

            <section className="mt-16">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Mở rộng</p>
                  <h2 className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">So sánh với lịch sử thế giới</h2>
                </div>
                <Link href="/blog" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">Xem thêm →</Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {recentPosts.map((post) => (
                  <article key={post.slug} className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] transition-transform duration-200 hover:-translate-y-1 hover:border-[var(--gold)]">
                    <img src={post.image} alt={post.title} className="h-52 w-full object-cover" />
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <span>{post.category}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold font-[family-name:var(--font-heading)] leading-snug text-[var(--ink)]">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--text-body)]">{post.excerpt}</p>
                      <div className="mt-5 flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>{post.author}</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
