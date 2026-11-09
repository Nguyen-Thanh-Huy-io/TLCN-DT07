'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { BlogApiService, type BlogPostItem } from '@/services/entities/blog.service';
import { UploadApiService } from '@/services/entities/upload.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

type StoryBlock = {
  id: string;
  type: 'paragraph' | 'image';
  heading?: string;
  text?: string;
  caption?: string;
  imageUrl?: string;
};

type ReferenceItem = {
  id: string;
  title: string;
  source: string;
  url: string;
};

const normalizeImageUrl = (url?: string | null) => {
  if (!url) return '';

  const trimmed = url.trim();
  const currentApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  return trimmed
    .replace(/^http:\/\/localhost:5000(?=\/)/, currentApiUrl)
    .replace(/^http:\/\/127\.0\.0\.1:5000(?=\/)/, currentApiUrl);
};

const categoryOptions = ['Blog'];

const renderParagraphs = (value: string) =>
  value
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

const initialBlocks: StoryBlock[] = [
  {
    id: 'block-1',
    type: 'paragraph',
    heading: '',
    text: '',
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

const uploadImageToServer = async (file: File) => {
  const result = await UploadApiService.uploadImage(file);
  if (!result?.url) {
    throw new Error('Không thể tải ảnh lên server.');
  }

  return result.url as string;
};

export function BlogCreatePage() {
  const router = useRouter();
  const currentUser = useAuthSession();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('Blog');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [period, setPeriod] = useState('');
  const [events, setEvents] = useState('');
  const [characters, setCharacters] = useState('');
  const [locations, setLocations] = useState('');
  const [entities, setEntities] = useState('');
  const [historicalContext, setHistoricalContext] = useState('');
  const [blocks, setBlocks] = useState<StoryBlock[]>(initialBlocks);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showHistoricalMeta, setShowHistoricalMeta] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const uploadedUrl = normalizeImageUrl(await uploadImageToServer(file));
      setCoverImageUrl(uploadedUrl);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể tải ảnh bìa lên.');
    }
  };

  const handleBlockImageChange = async (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const uploadedUrl = normalizeImageUrl(await uploadImageToServer(file));
      setBlocks((current) =>
        current.map((block) =>
          block.id === blockId
            ? {
                ...block,
                imageUrl: uploadedUrl,
              }
            : block
        )
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể tải ảnh vào khối nội dung.');
    }
  };

  const addTag = () => {
    const values = parseListInput(tagInput);
    if (!values.length) {
      return;
    }

    const newTags = values.filter((value) => !tags.some((existing) => existing.toLowerCase() === value.toLowerCase()));
    if (!newTags.length) {
      setTagInput('');
      return;
    }

    setTags((current) => [...current, ...newTags]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags((current) => current.filter((tag) => tag !== tagToRemove));
  };

  const addReference = () => {
    setReferences((current) => [
      ...current,
      {
        id: `ref-${Date.now()}`,
        title: '',
        source: '',
        url: '',
      },
    ]);
  };

  const updateReference = (id: string, field: keyof Omit<ReferenceItem, 'id'>, value: string) => {
    setReferences((current) =>
      current.map((reference) =>
        reference.id === id
          ? {
              ...reference,
              [field]: value,
            }
          : reference
      )
    );
  };

  const removeReference = (id: string) => {
    setReferences((current) => (current.length > 1 ? current.filter((reference) => reference.id !== id) : current));
  };

  const parseListInput = (value: string) =>
    value
      .split(/[\s,]+/)
      .map((item) => item.trim().replace(/^#/, ''))
      .filter(Boolean);

  const addParagraphBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: `paragraph-${Date.now()}`,
        type: 'paragraph',
        heading: '',
        text: '',
      },
    ]);
  };

  const addImageBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: `image-${Date.now()}`,
        type: 'image',
        caption: '',
        imageUrl: '',
      },
    ]);
  };

  const updateBlock = (id: string, field: 'heading' | 'text' | 'caption', value: string) => {
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

    setSubmitError('');
    setIsSubmitting(true);

    try {
      if (!currentUser?.id) {
        setSubmitError('Bạn cần đăng nhập trước khi tạo bài blog.');
        return;
      }

      const contentBlocks = [
        ...blocks
          .filter((block) =>
            (block.type === 'paragraph' && block.text?.trim()) ||
            (block.type === 'image' && (block.caption?.trim() || block.imageUrl))
          )
          .map((block) => ({
            id: block.id,
            type: block.type,
            heading: block.type === 'paragraph' ? block.heading?.trim() ?? '' : undefined,
            text: block.type === 'paragraph' ? block.text?.trim() ?? '' : undefined,
            caption: block.type === 'image' ? block.caption?.trim() ?? '' : undefined,
            imageUrl: block.type === 'image' ? block.imageUrl || coverImageUrl || null : undefined,
          })),
        {
          id: 'blog-metadata',
          type: 'meta',
          kind: 'metadata',
          tags,
          references,
          period,
          events,
          characters,
          locations,
          entities,
          historicalContext,
        },
      ];

      const payload: Partial<BlogPostItem> & { authorId?: string } = {
        authorId: currentUser.id,
        title: normalizedTitle,
        slug: `${slugify(normalizedTitle)}-${Date.now().toString(36)}`,
        excerpt: normalizedExcerpt,
        coverImageUrl: coverImageUrl || null,
        contentBlocks,
        status: 'PENDING_REVIEW',
        isFeatured: false,
      };

      await BlogApiService.create(payload);

      window.alert('Bài viết của bạn đã được gửi thành công và đang chờ duyệt. Bài sẽ được chuyển tới bộ phận review để kiểm tra trước khi xuất bản.');
      setTitle('');
      setExcerpt('');
      setBlocks(initialBlocks);
      setReferences([]);
      setCoverImageUrl('');
      setSubmitError('');
      setIsSubmitting(false);
      return;
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
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">HISGO Journal</p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl leading-none text-[var(--ink)] md:text-6xl">
              Viết bài mới
            </h1>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Quay lại blog
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[0_10px_22px_rgba(20,35,63,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Mục tiêu bài viết</p>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-[var(--text-body)] md:text-xl">
              Tạo một bài dài rõ chủ đề, có nhịp văn tự nhiên và giữ sự tin cậy lịch sử trong từng đoạn.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-page)] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Cấu trúc</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--ink)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5">Mở bài</span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5">Bối cảnh</span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5">Lập luận</span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5">Nguồn</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-6">
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <div>
                <label htmlFor="post-title" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Tiêu đề bài viết
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Nhập tiêu đề bài viết, ví dụ: Thành phố và ký ức của người dân"
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
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
                  placeholder="Viết tóm tắt ngắn gợi mở chủ đề, không gian và cảm giác của bài viết..."
                  className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Nội dung bài dài</p>
                  <p className="mt-1 text-sm text-[var(--text-body)]">Xây dựng bố cục theo nhịp đọc lịch sử</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addParagraphBlock}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                  >
                    + Đoạn văn
                  </button>
                  <button
                    type="button"
                    onClick={addImageBlock}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
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
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.heading ?? ''}
                          onChange={(event) => updateBlock(block.id, 'heading', event.target.value)}
                          placeholder="Tiêu đề nhỏ cho đoạn này"
                          className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                        />
                        <textarea
                          value={block.text ?? ''}
                          onChange={(event) => updateBlock(block.id, 'text', event.target.value)}
                          rows={6}
                          placeholder="Viết nội dung đoạn văn của bài: mô tả sự kiện, không gian, nhân vật hoặc cảm giác lịch sử..."
                          className="w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-3 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {block.imageUrl ? (
                          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-page)]">
                            <img
                              src={normalizeImageUrl(block.imageUrl)}
                              alt={block.caption || 'Hình ảnh bài viết'}
                              className="h-40 w-full object-cover"
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
                          className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-center text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                        />
                      </div>
                    )}
                  </div>
                ))}
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
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
              >
                Xem trước
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
              <label htmlFor="cover-upload" className="mb-3 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Ảnh bìa
              </label>

              {coverImageUrl ? (
                <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-page)]">
                  <img
                    src={normalizeImageUrl(coverImageUrl)}
                    alt="Ảnh bìa"
                    className="h-40 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--bg-page)] text-center text-[var(--text-muted)]">
                  <span className="text-3xl">🖼️</span>
                  <p className="text-sm font-medium text-[var(--ink)]">Đăng tải ảnh bìa</p>
                </div>
              )}

              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="mt-3 block w-full text-sm text-[var(--text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bg-page)] file:px-3 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.18em] file:text-[var(--ink)]"
              />
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Tags & liên kết</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1 text-xs text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3">
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
                  placeholder="Nhập tag, ví dụ: #do-thi #hanh-trinh"
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                >
                  Thêm tag
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Thông tin lịch sử</p>
                <button
                  type="button"
                  onClick={() => setShowHistoricalMeta(true)}
                  className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--ink)]"
                >
                  {period || events || characters || locations || entities || historicalContext ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--text-body)]">
                {period || events || characters || locations || entities || historicalContext
                  ? 'Đã thêm thông tin phụ cho bài viết, có thể cập nhật bất cứ lúc nào.'
                  : 'Tùy chọn: thêm thời kỳ, sự kiện, nhân vật và bối cảnh để tăng độ tin cậy lịch sử.'}
              </p>
            </div>

            {showHistoricalMeta ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,17,15,0.48)] px-4 py-8 backdrop-blur-[2px]">
                <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--bg-page)] p-5 shadow-[0_25px_60px_rgba(20,35,63,0.18)] md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Thông tin lịch sử</p>
                      <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl text-[var(--ink)]">Tùy chọn bổ sung</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHistoricalMeta(false)}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                    <div>
                      <label htmlFor="period" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Thời kỳ
                      </label>
                      <input
                        id="period"
                        type="text"
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                        placeholder="Ví dụ: Đế quốc La Mã"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="events" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Sự kiện liên quan
                      </label>
                      <input
                        id="events"
                        type="text"
                        value={events}
                        onChange={(event) => setEvents(event.target.value)}
                        placeholder="Các sự kiện, cách nhau bằng dấu phẩy"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="characters" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Nhân vật / đối tượng
                      </label>
                      <input
                        id="characters"
                        type="text"
                        value={characters}
                        onChange={(event) => setCharacters(event.target.value)}
                        placeholder="Ví dụ: Caesar, người dân, kiến trúc sư"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="locations" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Địa danh
                      </label>
                      <input
                        id="locations"
                        type="text"
                        value={locations}
                        onChange={(event) => setLocations(event.target.value)}
                        placeholder="Ví dụ: Roma, Forum, quảng trường"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="entities" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Thực thể liên quan
                      </label>
                      <input
                        id="entities"
                        type="text"
                        value={entities}
                        onChange={(event) => setEntities(event.target.value)}
                        placeholder="Ví dụ: triều đại, di tích, thành phố"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="historical-context" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Bối cảnh lịch sử
                      </label>
                      <textarea
                        id="historical-context"
                        value={historicalContext}
                        onChange={(event) => setHistoricalContext(event.target.value)}
                        rows={4}
                        placeholder="Mô tả ngắn bối cảnh chính trị, văn hóa, đời sống."
                        className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowHistoricalMeta(false)}
                      className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Tài liệu tham khảo</p>
                <button
                  type="button"
                  onClick={addReference}
                  className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                >
                  + Thêm
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {references.map((reference, index) => (
                  <div key={reference.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-page)] p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Nguồn {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeReference(reference.id)}
                        className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        value={reference.title}
                        onChange={(event) => updateReference(reference.id, 'title', event.target.value)}
                        placeholder="Tên tài liệu / nguồn"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                      <input
                        type="text"
                        value={reference.source}
                        onChange={(event) => updateReference(reference.id, 'source', event.target.value)}
                        placeholder="Vị trí / xuất xứ / tác giả"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <input
                      type="url"
                      value={reference.url}
                      onChange={(event) => updateReference(reference.id, 'url', event.target.value)}
                      placeholder="https://..."
                      className="mt-3 w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Gợi ý viết</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-body)]">
                <li>• Một bài dài tốt cần có 3–5 đoạn văn chính và 1–3 khối hình ảnh hỗ trợ.</li>
                <li>• Hãy gắn nơi chốn, vật chất và ký ức vào từng đoạn để tăng sức nặng lịch sử.</li>
                <li>• Đừng nhồi quá nhiều metadata; giữ cho các trường lịch sử mang tính gợi mở.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(18,17,15,0.62)] px-4 py-8 backdrop-blur-[2px]">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-page)] shadow-[0_24px_60px_rgba(20,35,63,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Xem trước bài viết</p>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5 md:p-8">
              <article className="space-y-8">
                {coverImageUrl ? (
                  <div className="overflow-hidden rounded-[20px] border border-[var(--border)]">
                    <img src={normalizeImageUrl(coverImageUrl)} alt={title || 'Ảnh bìa'} className="h-64 w-full object-cover md:h-80" />
                  </div>
                ) : null}

                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                      >
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                ) : null}

                <h2 className="mt-1 max-w-3xl font-[family-name:var(--font-heading)] text-[2.2rem] font-black leading-[0.95] tracking-[-0.04em] text-[var(--ink)] md:text-[3.2rem]">
                  {title || 'Tiêu đề bài viết'}
                </h2>

                {renderParagraphs(excerpt || 'Tóm tắt ngắn sẽ hiển thị ở đây.').map((paragraph, index) => (
                  <p
                    key={`excerpt-${index}`}
                    className="mt-2 text-[1.05rem] leading-[1.9] text-[var(--text-body)] md:text-[1.12rem]"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {paragraph}
                  </p>
                ))}

                <div className="space-y-8 text-[1.06rem] leading-[1.9] text-[var(--text-body)] md:text-[1.15rem]">
                  {blocks.length > 0 ? (
                    blocks.map((block) =>
                      block.type === 'paragraph' ? (
                        <div key={block.id} className="space-y-4">
                          {block.heading ? (
                            <h3 className="mt-2 font-[family-name:var(--font-heading)] text-[1.8rem] font-black leading-[1.08] tracking-[-0.03em] text-[var(--ink)] md:text-[2.2rem]">
                              {block.heading}
                            </h3>
                          ) : null}
                          <div className="space-y-4">
                            {renderParagraphs(block.text || 'Đoạn văn sẽ xuất hiện ở đây.').map((paragraph, index) => (
                              <p
                                key={`${block.id}-paragraph-${index}`}
                                className="leading-[1.9] tracking-[-0.01em]"
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <figure key={block.id} className="space-y-2 text-center">
                          {block.imageUrl ? (
                            <img
                              src={normalizeImageUrl(block.imageUrl)}
                              alt={block.caption || 'Hình ảnh trong bài viết'}
                              className="mx-auto h-56 w-full rounded-[20px] object-cover md:h-72"
                            />
                          ) : null}
                          {block.caption ? <figcaption className="text-center text-sm italic text-[var(--text-muted)]">{block.caption}</figcaption> : null}
                        </figure>
                      )
                    )
                  ) : (
                    <p>Chưa có nội dung để xem trước.</p>
                  )}
                </div>

                {references.some((reference) => reference.title || reference.source || reference.url) ? (
                  <div className="space-y-3 border-t border-[var(--border)] pt-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Tài liệu tham khảo</p>
                    <ul className="space-y-2 text-[0.95rem] leading-7 text-[var(--text-body)]">
                      {references
                        .filter((reference) => reference.title || reference.source || reference.url)
                        .map((reference, index) => (
                          <li key={`${reference.id || index}`} className="list-disc pl-5">
                            {reference.url ? (
                              <a href={reference.url} target="_blank" rel="noreferrer" className="text-[var(--ink)] underline-offset-2 hover:underline">
                                {reference.title || 'Nguồn tham khảo'}
                              </a>
                            ) : (
                              <span>{reference.title || 'Nguồn tham khảo'}</span>
                            )}
                            {reference.source ? <span className="text-[var(--text-muted)]"> — {reference.source}</span> : null}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

export default BlogCreatePage;
