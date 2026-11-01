import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { blogPosts } from '@/data/blog';

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <article className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <Link href="/blog" className="hover:text-[var(--primary)]">Blog</Link>
          <span>•</span>
          <span>{post.category}</span>
        </div>

        <header className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{post.accent}</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-bold font-[family-name:var(--font-heading)] leading-[1.06] text-[var(--ink)]">
                {post.title}
              </h1>
            </div>

            <div className="text-sm text-[var(--text-muted)] md:text-right">
              <p>Tác giả: {post.author}</p>
              <p className="mt-1">{post.date} • {post.readTime}</p>
            </div>
          </div>
        </header>

        <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)]">
          <img src={post.image} alt={post.title} className="h-[360px] w-full object-cover md:h-[480px]" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.75fr_1.75fr_0.5fr]">
          <aside className="lg:pt-6">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Trong bài này</p>
              <ul className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
                <li>• Bối cảnh và niên đại</li>
                <li>• Nghệ thuật và văn hóa vật chất</li>
                <li>• Hệ quả chính trị</li>
                <li>• Ký ức qua các thế hệ</li>
              </ul>
            </div>
          </aside>

          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-[var(--text-body)] first-letter:text-5xl first-letter:font-bold first-letter:font-[family-name:var(--font-heading)] first-letter:text-[var(--ink)]">
              {post.excerpt}
            </p>

            <div className="mt-8 space-y-6 text-lg leading-8 text-[var(--text-body)]">
              {post.content.map((paragraph, index) => (
                <p key={`${post.slug}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="lg:pt-6">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Liên quan</p>
              <div className="mt-4 space-y-4">
                {blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3).map((related) => (
                  <Link key={related.slug} href={`/blog/${related.slug}`} className="block rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] p-3 transition-colors hover:border-[var(--gold)]">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{related.category}</p>
                    <h3 className="mt-2 text-sm font-semibold text-[var(--ink)]">{related.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </main>
  );
}
