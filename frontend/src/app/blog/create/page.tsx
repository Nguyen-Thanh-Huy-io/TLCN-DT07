'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const DEFAULT_BLOG_AUTHOR_ID = process.env.NEXT_PUBLIC_BLOG_AUTHOR_ID || 'd2168a5d-05d7-4110-a304-94b17fe5bae5';

type StoryBlock = {
  id: string;
  type: 'paragraph' | 'image';
  text?: string;
  caption?: string;
  imageUrl?: string;
};

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80';

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

export default function BlogCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('Cổng La Mã và không gian quyền lực');
  const [excerpt, setExcerpt] = useState(
    'Từ cổng chiến thắng đến quy hoạch thành phố, kiến trúc La Mã đã biến các không gian công cộng thành lời tuyên ngôn quyền lực sống động.'
  );
  const [category, setCategory] = useState('Lịch sử cổ đại');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['#la-ma', '#kientruc', '#ky-uc']);
  const [blocks, setBlocks] = useState<StoryBlock[]>(initialBlocks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(DEFAULT_COVER_IMAGE);

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCoverImageUrl(previewUrl);
  };

  const handleBlockImageChange = (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setBlocks((current) =>
      current.map((block) =>
        block.id === blockId
          ? {
              ...block,
              imageUrl: previewUrl,
            }
          : block
      )
    );
  };

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
        imageUrl: DEFAULT_COVER_IMAGE,
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedExcerpt = excerpt.trim();

    if (!normalizedTitle || !normalizedExcerpt) {
      setSubmitError('Tiêu đề và tóm tắt bài viết là bắt buộc.');
      return;
    }

    const payload = {
      authorId: DEFAULT_BLOG_AUTHOR_ID,
      title: normalizedTitle,
      summary: normalizedExcerpt,
      type: 'BLOG',
      status: 'DRAFT',
      slug: `${slugify(normalizedTitle)}-${Date.now().toString(36)}`,
      content: blocks
        .filter((block) =>
          (block.type === 'paragraph' && block.text?.trim()) ||
          (block.type === 'image' && (block.caption?.trim() || block.imageUrl))
        )
        .map((block) => {
          if (block.type === 'paragraph') {
            return { type: 'paragraph', text: block.text?.trim() ?? '' };
          }

          return {
            type: 'image',
            caption: block.caption?.trim() ?? '',
            url: block.imageUrl ?? coverImageUrl,
          };
        }),
      contentRichText: blocks
        .filter((block) => block.type === 'paragraph' && block.text?.trim())
        .map((block) => `<p>${block.text?.trim()}</p>`)
        .join(''),
      thumbnailUrl: coverImageUrl,
      coverImageUrl: coverImageUrl,
    };

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.message || 'Không thể tạo bài viết.');
      }

      router.push('/blog');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng bài.');
    } finally {
      setIsSubmitting(false);
    }
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

                {coverImageUrl ? (
                  <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-page)]">
                    <div
                      className="h-52 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${coverImageUrl}')` }}
                    />
                  </div>
                ) : null}

                <div className="mt-3 flex h-40 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] text-center text-[var(--text-muted)]">
                  <span className="text-3xl">🖼️</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">Đăng tải ảnh bìa</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em]">Tỷ lệ hình ảnh 16:10</p>
                  </div>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="block w-full max-w-[220px] text-sm text-[var(--text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bg-page)] file:px-3 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.18em] file:text-[var(--ink)]"
                  />
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
                        {block.imageUrl ? (
                          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-page)]">
                            <div
                              className="h-40 w-full bg-cover bg-center"
                              style={{ backgroundImage: `url('${block.imageUrl}')` }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--bg-page)] text-center text-[var(--text-muted)]">
                            <div>
                              <div className="text-2xl">📷</div>
                              <p className="mt-2 text-sm font-medium text-[var(--ink)]">Thêm ảnh cho khối này</p>
                            </div>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleBlockImageChange(block.id, event)}
                          className="block w-full text-sm text-[var(--text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bg-page)] file:px-3 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.18em] file:text-[var(--ink)]"
                        />

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

            {submitError ? (
              <div className="rounded-[16px] border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreview((current) => !current)}
                className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
              >
                {showPreview ? 'Ẩn preview' : 'Xem trước'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--gold)] bg-[var(--bg-page)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gold)] bg-[var(--bg-surface)] text-sm leading-none transition-colors group-hover:bg-[var(--bg-page)]">
                  {isSubmitting ? '…' : '✓'}
                </span>
                {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
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

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(18,17,15,0.72)] px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-page)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-page)]/95 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Xem trước bài viết</p>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto">
              <div className="overflow-hidden border-b border-[var(--border)]">
                <div
                  className="h-64 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${coverImageUrl || DEFAULT_COVER_IMAGE}')`,
                  }}
                />
              </div>

              <article className="space-y-6 px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Chưa có tag
                    </span>
                  )}
                </div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{category}</p>

                <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight text-[var(--ink)] md:text-5xl">
                  {title || 'Tiêu đề bài viết'}
                </h2>

                <p className="text-base leading-7 text-[var(--text-body)] md:text-lg">
                  {excerpt || 'Tóm tắt bài viết sẽ hiển thị ở đây.'}
                </p>

                <div className="space-y-6 text-base leading-8 text-[var(--text-body)] md:text-lg">
                  {blocks.length > 0 ? (
                    blocks.map((block) =>
                      block.type === 'paragraph' ? (
                        <p key={block.id}>{block.text || 'Đoạn văn sẽ xuất hiện ở đây.'}</p>
                      ) : (
                        <figure key={block.id} className="space-y-3">
                          <div
                            className="h-60 w-full rounded-[20px] bg-cover bg-center md:h-80"
                            style={{
                              backgroundImage: `url('${block.imageUrl || DEFAULT_COVER_IMAGE}')`,
                            }}
                          />
                          <figcaption className="text-sm italic text-[var(--text-muted)]">
                            {block.caption || 'Chú thích ảnh sẽ hiển thị ở đây.'}
                          </figcaption>
                        </figure>
                      )
                    )
                  ) : (
                    <p>Chưa có nội dung để xem trước.</p>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}
