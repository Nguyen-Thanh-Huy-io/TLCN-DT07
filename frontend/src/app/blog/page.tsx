import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { CreatePostComposer } from '@/components/hisgo/CreatePostComposer';
import { blogCategories, featuredPost, popularPosts, recentPosts } from '@/data/blog';

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 md:py-12">
        <section className="mb-12 border-b border-[var(--border)] bg-transparent pb-6">
          <div className="max-w-5xl">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)] font-medium">Lịch sử Việt Nam</p>
            <h1 className="mt-3 text-4xl md:text-5xl lg:text-[4rem] font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] leading-[0.94] tracking-[-0.04em]">
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
            {blogCategories.map((category) => (
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

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[340px]">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between p-6 md:p-8">
                <div>
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <span className="rounded-full border border-[var(--border-gold)] bg-[var(--bg-page)] px-2 py-1 text-[var(--ink)]">{featuredPost.category}</span>
                    <span>{featuredPost.accent}</span>
                  </div>

                  <h2 className="mt-5 text-3xl md:text-[2.1rem] font-bold font-[family-name:var(--font-heading)] leading-[1.05] text-[var(--ink)]">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-4 text-base leading-relaxed text-[var(--text-body)]">
                    {featuredPost.excerpt}
                  </p>
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
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-16 w-16 rounded-[var(--radius-btn)] object-cover"
                      />
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

        <section className="mt-16 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Ghi chép</p>
              <h2 className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">Danh sách đọc</h2>
            </div>
            <button type="button" className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border border-[var(--gold)] bg-[var(--bg-page)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-surface)]">
              Xem thêm
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {popularPosts.map((post) => (
              <div key={post.slug} className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-page)] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{post.category}</p>
                <h3 className="mt-3 text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">{post.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-body)]">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">Tiếp tục đọc →</Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
