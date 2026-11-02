'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';

type StoryBlock = {
  id: string;
  type: 'paragraph' | 'image';
  text?: string;
  caption?: string;
};

const suggestedTags = ['#la-ma', '#kientruc', '#ho-so', '#de-quoc', '#thuan-loi', '#ky-uc'];
const categoryOptions = ['Lịch sử cổ đại', 'Lịch sử trung đại', 'Lịch sử hiện đại', 'Chiến tranh thế giới', 'Văn hóa'];

const initialBlocks: StoryBlock[] = [
  {
    id: 'block-1',
    type: 'paragraph',
    text:
      'Không gian đô thị La Mã không được tạo ra để trốn tránh sự quan sát. Nó được sắp xếp để cho thấy quyền lực, khẳng định trật tự và biến việc đi qua thành một thực hành chính trị. Từng tuyến đường, công trình và di tích đều ngụ ý rằng thành phố là một hình thức tác động có thể được nhìn thấy từ xa.',
  },
  {
    id: 'block-2',
    type: 'image',
    caption: 'Ảnh phụ trợ cho bối cảnh vật chất của quận thành và mặt cắt địa lý.',
  },
  {
    id: 'block-3',
    type: 'paragraph',
    text:
      'Một bài viết dài trong HISGO nên cho phép người kể chuyện đi chậm, đặt một nhịp mở bài rõ ràng, rồi cho người đọc dừng ở các bản cắt hình ảnh và các đoạn quan sát cụ thể. Đây là kiểu narrative phù hợp với lịch sử, nơi những lớp ký ức chồng lên nhau và không gian trở thành một dạng bằng chứng.',
  },
];

export default function BlogCreatePage() {
  const [title, setTitle] = useState('Cổng La Mã và không gian quyền lực');
  const [excerpt, setExcerpt] = useState(
    'Từ cổng chiến thắng đến quy hoạch thành phố, kiến trúc La Mã đã biến các không gian công cộng thành lời tuyên ngôn quyền lực sống động.'
  );
  const [category, setCategory] = useState('Lịch sử cổ đại');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['#la-ma', '#kientruc', '#ky-uc']);
  const [blocks, setBlocks] = useState<StoryBlock[]>(initialBlocks);

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) {
      return;
    }

    setTags((current) => [...current, value]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags((current) => current.filter((tag) => tag !== tagToRemove));
  };

  const addParagraphBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: `paragraph-${Date.now()}`,
        type: 'paragraph',
        text: 'Viết đoạn văn mới để mở rộng lập luận, thêm bối cảnh, nhân vật, hoặc kết nối với các địa danh và thời điểm khác trong lịch sử.',
      },
    ]);
  };

  const addImageBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: `image-${Date.now()}`,
        type: 'image',
        caption: 'Chú thích ảnh hoặc nguồn tham khảo cho khối hình ảnh này.',
      },
    ]);
  };

  const updateBlock = (id: string, field: 'text' | 'caption', value: string) => {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id
          ? {
              ...block,
              [field]: value,
            }
          : block
      )
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)]">
      <Header activeTab="blog" />

      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-8 md:py-12">
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

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-6">
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <div className="grid gap-5 md:grid-cols-[1fr_220px]">
                <div>
                  <label htmlFor="post-title" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Tiêu đề bài viết
                  </label>
                  <input
                    id="post-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Chuyên mục
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="cover-upload" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Ảnh bìa
                </label>
                <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] text-center text-[var(--text-muted)]">
                  <span className="text-3xl">🖼️</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">Đăng tải ảnh bìa</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em]">Tỷ lệ hình ảnh 16:10</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="excerpt" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Tóm tắt ngắn
                </label>
                <textarea
                  id="excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Nội dung bài dài</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addParagraphBlock}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                  >
                    + Đoạn văn
                  </button>
                  <button
                    type="button"
                    onClick={addImageBlock}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                  >
                    + Ảnh
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-3 md:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Khối {index + 1} · {block.type === 'paragraph' ? 'Đoạn văn' : 'Hình ảnh'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
                      >
                        Xóa
                      </button>
                    </div>

                    {block.type === 'paragraph' ? (
                      <textarea
                        value={block.text ?? ''}
                        onChange={(event) => updateBlock(block.id, 'text', event.target.value)}
                        rows={6}
                        className="w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-3 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex h-40 items-center justify-center rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-page)] text-center text-[var(--text-muted)]">
                          <div>
                            <div className="text-2xl">📷</div>
                            <p className="mt-2 text-sm font-medium text-[var(--ink)]">Thêm ảnh cho khối này</p>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={block.caption ?? ''}
                          onChange={(event) => updateBlock(block.id, 'caption', event.target.value)}
                          placeholder="Chú thích ảnh hoặc nguồn tham khảo"
                          className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Tags & liên kết</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Nhập tag khác, ví dụ: #do-thi #hanh-trinh"
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                >
                  Thêm tag
                </button>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="event" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Sự kiện liên quan
                  </label>
                  <input
                    id="event"
                    type="text"
                    placeholder="Đại hội La Mã, các cuộc chiến, địa điểm..."
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                  />
                </div>

                <div>
                  <label htmlFor="person" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Nhân vật / đối tượng
                  </label>
                  <input
                    id="person"
                    type="text"
                    placeholder="Julius Caesar, vương triều, di tích..."
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Mô hình bài dài</p>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-body)]">
                <li>1. Mở bài với một câu hỏi, một quan điểm rõ, và một đoạn dẫn thú vị.</li>
                <li>2. Mở rộng bối cảnh lịch sử, không gian, nhân vật và sự kiện chính.</li>
                <li>3. Chèn hình ảnh hoặc vật liệu quan sát để phá nhịp văn bản.</li>
                <li>4. Kết bài bằng một nhận định hoặc câu hỏi khép vòng cho người đọc.</li>
              </ol>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Gợi ý viết</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-body)]">
                <li>• Không ép người dùng gắn nhiều metadata rườm rà; để các trường “tùy chọn” mở.</li>
                <li>• Một bài dài tốt cần có 3–5 đoạn văn chính và 1–3 khối hình ảnh hỗ trợ.</li>
                <li>• Hãy đưa mối liên kết giữa nơi chốn, vật chất và ký ức vào văn bản.</li>
              </ul>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Xem trước</p>
              <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-page)]">
                <div className="h-32 w-full bg-[url('https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{category}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-6 text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{excerpt}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
