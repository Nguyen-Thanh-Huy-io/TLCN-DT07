import { SectionTitle } from '@/components/hisgo/SectionTitle';

type CommentItem = {
  id: number;
  author: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  replies?: Array<{
    author: string;
    time: string;
    content: string;
  }>;
  accent?: string;
};

const comments: CommentItem[] = [
  {
    id: 1,
    author: 'Nguyễn Minh Anh',
    role: 'Học viên lịch sử',
    time: '2 giờ trước',
    content:
      'Điểm mạnh nhất trong bài viết là cách nó đặt kiến trúc La Mã trong mối quan hệ với quyền lực và đời sống hàng ngày. Hình ảnh cổng thành không còn là vật thể cô lập mà trở thành một biểu tượng của sự sắp xếp không gian trong toàn bộ đế quốc.',
    likes: 18,
    accent: 'Lượt thích nhiều',
    replies: [
      {
        author: 'Trần Huyền',
        time: '1 giờ trước',
        content:
          'Tôi thấy đồng ý nhất với phần mô tả về “không gian như một lời tuyên ngôn”. Đây đúng là cách nhìn khiến một tàn tích trở nên sống động hơn.',
      },
    ],
  },
  {
    id: 2,
    author: 'Đỗ Quỳnh',
    role: 'Nghiên cứu văn hóa',
    time: '5 giờ trước',
    content:
      'Mỗi đoạn đều gợi ra rằng kiến trúc không chỉ có mục đích kỹ thuật. Nó là phương tiện để cộng đồng nhìn thấy quyền lực và thừa nhận trật tự. Đó là cách rất hợp với góc nhìn HISGO: lịch sử không chỉ là sự kiện, mà là cảm giác của không gian.',
    likes: 12,
  },
  {
    id: 3,
    author: 'Minh Khang',
    role: 'Giảng viên',
    time: 'Hôm qua',
    content:
      'Tôi muốn đề xuất thêm một nhánh nghiên cứu về cách các thành phố La Mã biến các cổng vòm thành trung tâm biểu tượng của việc đi qua, từ quan hệ công dân đến cư dân thuộc địa. Một góc nhìn rất đáng mở rộng cho các bài sau.',
    likes: 9,
  },
];

export function CommentThread() {
  return (
    <section className="mx-auto mt-16 max-w-[1100px] px-6 pb-20 lg:px-8">
      <div className="mb-8">
        <SectionTitle title="Bình luận và phản hồi" subtitle="Thảo luận sâu hơn về không gian, ký ức và quyền lực trong bài viết" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--gold)] bg-[var(--bg-page)] text-sm font-semibold text-[var(--ink)]">
                  {comment.author
                    .split(' ')
                    .slice(-2)
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--ink)]">{comment.author}</h3>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {comment.role} • {comment.time}
                      </p>
                    </div>

                    {comment.accent ? (
                      <span className="inline-flex items-center rounded-full border border-[var(--gold)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--gold)]">
                        {comment.accent}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-base leading-7 text-[var(--text-body)]">{comment.content}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <button type="button" className="transition-colors hover:text-[var(--gold)]">
                      Thích ({comment.likes})
                    </button>
                    <button type="button" className="transition-colors hover:text-[var(--gold)]">
                      Trả lời
                    </button>
                    <button type="button" className="transition-colors hover:text-[var(--gold)]">
                      Chia sẻ
                    </button>
                  </div>

                  {comment.replies && comment.replies.length > 0 ? (
                    <div className="mt-4 space-y-3 border-l border-[var(--border)] pl-4">
                      {comment.replies.map((reply, index) => (
                        <div key={`${comment.id}-reply-${index}`} className="rounded-[var(--radius-btn)] bg-[var(--bg-page)] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--ink)]">{reply.author}</p>
                            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                              {reply.time}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Để lại phản hồi</p>
            <form className="mt-4 space-y-4">
              <div>
                <label htmlFor="comment-name" className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Tên của bạn
                </label>
                <input
                  id="comment-name"
                  type="text"
                  defaultValue="Bạn đọc HISGO"
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>

              <div>
                <label htmlFor="comment-text" className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Bình luận
                </label>
                <textarea
                  id="comment-text"
                  rows={5}
                  placeholder="Bạn nghĩ gì về tác phẩm và cách bài viết tiếp cận chủ đề này?"
                  className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Đính kèm
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]">
                    <span>Ảnh</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['🏛️', '📜', '🧭', '✨', '🗿', '🧱'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-page)] text-lg transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      aria-label={`Chèn biểu tượng ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--gold)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--ink)] transition-opacity hover:opacity-90"
              >
                Gửi bình luận
              </button>
            </form>
          </div>

          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Thảo luận</p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
              <li className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span>Chủ đề nổi bật</span>
                <span className="text-[var(--gold)]">24</span>
              </li>
              <li className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span>Đang thảo luận</span>
                <span className="text-[var(--gold)]">11</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Phản hồi mới</span>
                <span className="text-[var(--gold)]">7</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
