import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { CommentThread } from '@/components/hisgo/CommentThread';
import { blogPosts, findBlogPostBySlug } from '@/features/blog/blog-data';

export function BlogDetailPage({ slug }: { slug: string }) {
  const post = findBlogPostBySlug(slug);

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

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#1f2a2b]">
      <Header activeTab="blog" />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a4d2d]">{post.category}</p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight text-[#1f2a2b] md:text-6xl">
            {post.title}
          </h1>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em] text-[#6d7a75]">
          <span className="inline-flex items-center gap-2"><CalendarDays size={14} /> {post.date}</span>
          <span className="inline-flex items-center gap-2"><Clock3 size={14} /> {post.readTime}</span>
          <span>Viết bởi {post.author}</span>
        </div>

        <div className={`mb-10 h-[360px] overflow-hidden rounded-[28px] bg-gradient-to-br ${post.accent}`} />

        <article className="rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] p-6 shadow-[0_18px_35px_rgba(31,42,43,0.05)] md:p-10">
          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-[#d7c7b2] bg-[#f7f1e7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4f5d59]">
                {tag}
              </span>
            ))}
          </div>

          <div className="space-y-6 text-[17px] leading-8 text-[#344542]">
            <p>
              Trong lịch sử Việt Nam, không phải mỗi đoạn đường đều được ghi lại bằng những bản đồ quyền lực hay những tên tuổi nổi bật. Nhiều khoảnh khắc quan trọng, nhiều sự kiện dài hạn, chỉ được hiểu rõ khi ta đọc lại chúng như một câu chuyện sống động của con người và không gian.
            </p>
            <p>
              Bài viết này đưa bạn đi qua những lớp ký ức của một địa điểm, nơi các yếu tố chính trị, văn hóa và đời sống hằng ngày chồng chất lên nhau. Khi nhìn từ góc độ những người đi qua, ngồi lại, làm việc và sinh sống, lịch sử không còn là những chữ khô cứng mà trở thành một nhịp sống có mùi đất, có hình dáng đường phố và có các thuở mùa.
            </p>
            <p>
              Chính ở đó, sự liên tục của lịch sử được thể hiện rõ nhất: không chỉ qua các triều đại, chiến trận hay lễ nghi, mà qua những tấm ảnh trong trí nhớ cộng đồng, qua những ngã ba, quán ăn, ngôi nhà và lối đi đã tồn tại qua nhiều thế hệ.
            </p>
          </div>
        </article>

        <aside className="mt-12 rounded-[28px] border border-[#d7c7b2] bg-[#f7f1e7] p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a4d2d]">Bài viết liên quan</p>
          <div className="grid gap-4 md:grid-cols-2">
            {blogPosts.filter((item) => item.slug !== post.slug).slice(0, 2).map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-[20px] border border-[#d7c7b2] bg-[#fffdf9] p-4 transition hover:border-[#8a4d2d]">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7d5d3d]">{item.category}</p>
                <h3 className="text-xl font-[family-name:var(--font-heading)] text-[#1f2a2b]">{item.title}</h3>
              </Link>
            ))}
          </div>
        </aside>

        <CommentThread postId={post.slug} />
      </main>
      <Footer />
    </div>
  );
}
