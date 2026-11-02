import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';

const suggestedTags = ['#la-ma', '#kientruc', '#ho-so', '#de-quoc', '#thuan-loi', '#ky-uc'];

export default function BlogCreatePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <div className="mx-auto max-w-[1100px] px-6 py-8 md:py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">HISGO Journal</p>
            <h1 className="mt-2 text-4xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)] md:text-5xl">
              Viết bài mới
            </h1>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Quay lại blog
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form className="space-y-5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-page)] text-sm font-semibold text-[var(--ink)]">
                LT
              </div>

              <div className="flex-1 rounded-[24px] border border-[var(--border)] bg-[var(--bg-page)] px-4 py-3">
                <input
                  id="title"
                  type="text"
                  placeholder="Bạn muốn chia sẻ điều gì về lịch sử hôm nay?"
                  className="w-full bg-transparent text-base text-[var(--ink)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>

            <div className="ml-14 rounded-[20px] border border-[var(--border)] bg-[var(--bg-page)] p-3">
              <textarea
                id="content"
                rows={8}
                placeholder="Viết bài của bạn ở đây..."
                className="w-full resize-none bg-transparent text-base leading-7 text-[var(--ink)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>

            <div className="ml-14 flex flex-wrap items-center gap-2">
              {[
                { label: 'Ảnh', icon: '📷' },
                { label: 'Emoji', icon: '😊' },
                { label: 'Hashtag', icon: '#' },
                { label: 'Tag sự kiện', icon: '🏛️' },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                >
                  <span>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>

            <div className="ml-14 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="title" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Tiêu đề bài viết
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="Cổng La Mã và không gian quyền lực"
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>

              <div>
                <label htmlFor="category" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Chuyên mục
                </label>
                <select
                  id="category"
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                  defaultValue="Lịch sử cổ đại"
                >
                  <option>Lịch sử cổ đại</option>
                  <option>Lịch sử trung đại</option>
                  <option>Lịch sử hiện đại</option>
                  <option>Chiến tranh thế giới</option>
                  <option>Văn hóa</option>
                </select>
              </div>
            </div>

            <div className="ml-14">
              <label htmlFor="excerpt" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Tóm tắt ngắn
              </label>
              <textarea
                id="excerpt"
                rows={3}
                placeholder="Ghi một đoạn mở bài ngắn, rõ khái niệm chính của bài viết..."
                className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
              />
            </div>

            <div className="ml-14">
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Hashtag / tag
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Nhập tag khác, ví dụ: #boi-canh #nhan-vat"
                className="mt-3 w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
              />
            </div>

            <div className="ml-14 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="event" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Sự kiện liên quan
                </label>
                <input
                  id="event"
                  type="text"
                  placeholder="Tùy chọn: Đại hội La Mã, Vương triều..."
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>

              <div>
                <label htmlFor="person" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Nhân vật / đối tượng
                </label>
                <input
                  id="person"
                  type="text"
                  placeholder="Tùy chọn: Julius Caesar, Đế quốc..."
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>
            </div>

            <div className="ml-14 flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
              >
                Xem trước
              </button>
              <button
                type="submit"
                className="group inline-flex items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--gold)] bg-[var(--bg-page)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--gold)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gold)] bg-[var(--bg-surface)] text-sm leading-none transition-colors group-hover:bg-[var(--bg-page)]">
                  ✓
                </span>
                Đăng bài
              </button>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Gợi ý viết bài</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-body)]">
                <li>• Bài viết nên có một câu hỏi chính hoặc một quan điểm rõ trong đoạn mở.</li>
                <li>• Có thể gắn tag với chủ đề lịch sử, văn hóa, nhân vật, địa danh và sự kiện.</li>
                <li>• Nếu có liên kết thực tế, nên nối vào di tích, nhân vật hoặc giai đoạn lịch sử cụ thể.</li>
                <li>• Không ép người dùng chọn quá nhiều metadata rườm rà; cho phép “tùy chọn” thay vì bắt buộc.</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Metadata gợi ý</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['#bien-do', '#nha-van', '#co-dai', '#dia-danh', '#hanh-trinh'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1 text-xs text-[var(--ink)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
