import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, Sparkles } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { BlogComposerBar } from '@/features/blog/components/BlogComposerBar';
import { blogCategories, blogPosts, featuredBlogPost } from '@/features/blog/blog-data';

export function BlogLandingPage() {
  const mainPosts = blogPosts.slice(0, 4);
  const sidebarPosts = blogPosts.slice(4, 6);

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#1f2a2b]">
      <Header activeTab="blog" />

      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 lg:px-8 lg:py-10">
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

        <section className="mb-8 flex flex-wrap gap-3">
          {blogCategories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="rounded-full border border-[#d7c7b2] bg-[#fffdf9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2b3a38] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d]"
            >
              {category.name} <span className="ml-1 text-[#7d5d3d]">({category.count})</span>
            </button>
          ))}
        </section>

        <section className="mb-12 grid gap-6 lg:grid-cols-[1.55fr_0.7fr]">
          <article className="overflow-hidden rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] shadow-[0_24px_50px_rgba(31,42,43,0.08)]">
            <div className={`h-72 bg-gradient-to-br ${featuredBlogPost.accent} p-6 md:h-96`}>
              <div className="flex h-full items-end justify-between gap-3">
                <div className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                  {featuredBlogPost.category}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  <Sparkles size={12} /> Bài nổi bật
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.12em] text-[#6d7a75]">
                <span className="inline-flex items-center gap-2"><CalendarDays size={14} /> {featuredBlogPost.date}</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={14} /> {featuredBlogPost.readTime}</span>
              </div>
              <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-heading)] text-3xl leading-tight text-[#1d2b2a] md:text-5xl">
                {featuredBlogPost.title}
              </h2>
              <p className="mb-6 max-w-2xl text-base leading-8 text-[#465c59]">{featuredBlogPost.excerpt}</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[#536560]">
                  Viết bởi <span className="font-semibold text-[#1f2a2b]">{featuredBlogPost.author}</span>
                </div>
                <Link
                  href={`/blog/${featuredBlogPost.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1f2a2b] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#f7f1e7] transition hover:bg-[#8a4d2d]"
                >
                  Đọc bài <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-[#d7c7b2] bg-[#fffdf9] p-5 shadow-[0_22px_44px_rgba(31,42,43,0.06)]">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a4d2d]">Xu hướng</p>
              <ul className="space-y-4">
                {sidebarPosts.map((post) => (
                  <li key={post.slug} className="border-b border-[#efe3d8] pb-4 last:border-b-0 last:pb-0">
                    <Link href={`/blog/${post.slug}`} className="group block space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7d5d3d]">{post.category}</p>
                      <h3 className="text-lg font-semibold leading-6 text-[#23312f] transition group-hover:text-[#8a4d2d]">
                        {post.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[24px] border border-[#d7c7b2] bg-[#1f2a2b] p-5 text-[#f7f1e7] shadow-[0_22px_40px_rgba(31,42,43,0.14)]">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#d8c09d]">Newsletter</p>
              <h3 className="mb-3 text-2xl font-[family-name:var(--font-heading)]">Nhận bài mới mỗi tuần</h3>
              <p className="mb-5 text-sm leading-7 text-[#e9dfd1]">
                Lời kể lịch sử, văn hóa và hình ảnh ký ức được gửi trực tiếp cho bạn.
              </p>
              <button
                type="button"
                className="rounded-full bg-[#f7f1e7] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1f2a2b] transition hover:bg-[#d8c09d]"
              >
                Đăng ký ngay
              </button>
            </div>
          </aside>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a4d2d]">Bài mới nhất</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl text-[#1f2a2b]">Câu chuyện đang được đọc</h2>
            </div>
            <Link href="/" className="text-sm font-semibold text-[#8a4d2d] transition hover:text-[#1f2a2b]">
              Xem chi tiết →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {mainPosts.map((post) => (
              <article key={post.slug} className="overflow-hidden rounded-[24px] border border-[#d7c7b2] bg-[#fffdf9] shadow-[0_16px_30px_rgba(31,42,43,0.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(31,42,43,0.08)]">
                <div className={`h-56 bg-gradient-to-br ${post.accent}`} />
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d5d3d]">
                    <span>{post.category}</span>
                    <span>{post.date}</span>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="block">
                    <h3 className="mb-3 text-2xl font-[family-name:var(--font-heading)] leading-tight text-[#1f2a2b] transition hover:text-[#8a4d2d]">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="mb-4 text-sm leading-7 text-[#536560]">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.12em] text-[#536560]">{post.author}</span>
                    <span className="text-xs uppercase tracking-[0.12em] text-[#7d5d3d]">{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
