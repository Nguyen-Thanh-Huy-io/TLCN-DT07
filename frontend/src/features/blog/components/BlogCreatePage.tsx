'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import api from '@/services/api';
import { CategoryApiService } from '@/services/entities/article.service';
import { UploadApiService } from '@/services/entities/upload.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const DEFAULT_BLOG_AUTHOR_ID = process.env.NEXT_PUBLIC_BLOG_AUTHOR_ID || 'd2168a5d-05d7-4110-a304-94b17fe5bae5';

type StoryBlock = {
  id: string;
  type: 'paragraph' | 'image';
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

const isBlogCategoryRecord = (value?: string | null) => {
  const normalized = (value ?? '').trim().toLowerCase();
  return ['blog', 'bai-viet', 'bài viết', 'bai viet'].includes(normalized);
};

const resolveBlogCategoryId = async () => {
  const categories = await CategoryApiService.list();
  const existing = categories.find((category) => isBlogCategoryRecord(category.name) || isBlogCategoryRecord(category.slug));

  if (existing) {
    return existing.id;
  }

  const created = await CategoryApiService.create({
    name: 'Blog',
    slug: 'blog',
    description: 'Bài viết blog dành cho việc kiểm duyệt trước khi xuất bản.',
    parentId: null,
    icon: null,
    displayOrder: 999,
  });

  return created.id;
};

const initialBlocks: StoryBlock[] = [
  {
    id: 'block-1',
    type: 'paragraph',
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
  const [title, setTitle] = useState('Cổng La Mã và không gian quyền lực');
  const [excerpt, setExcerpt] = useState(
    'Từ cổng chiến thắng đến quy hoạch thành phố, kiến trúc La Mã đã biến các không gian công cộng thành lời tuyên ngôn quyền lực sống động.'
  );
  const [category, setCategory] = useState('Lịch sử cổ đại');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [period, setPeriod] = useState('Đế quốc La Mã');
  const [events, setEvents] = useState('Cổng thành, đường phố, quyền lực cộng đồng');
  const [characters, setCharacters] = useState('Đế chế La Mã, người dân thành phố, kiến trúc sư');
  const [locations, setLocations] = useState('Roma, quảng trường, khu ngoại vi thành phố');
  const [entities, setEntities] = useState('Đô thị La Mã, triều đại, di tích khảo cổ');
  const [historicalContext, setHistoricalContext] = useState(
    'Bài viết đặt sự kiện trong bối cảnh tổ chức không gian thành phố, quyền lực và đời sống công cộng.'
  );
  const [blocks, setBlocks] = useState<StoryBlock[]>(initialBlocks);
  const [references, setReferences] = useState<ReferenceItem[]>([
    {
      id: 'ref-1',
      title: 'Lịch sử thành phố Roma',
      source: 'Bộ phận nghiên cứu văn hóa cổ đại',
      url: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
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
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

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
        caption: '',
        imageUrl: '',
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

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const blogCategoryId = await resolveBlogCategoryId();

      const payload = {
        title: normalizedTitle,
        slug: `${slugify(normalizedTitle)}-${Date.now().toString(36)}`,
        categoryId: blogCategoryId,
        summary: normalizedExcerpt,
        coverImageUrl: coverImageUrl || null,
        coverCaption: '',
        contentBlocks: blocks
          .filter((block) =>
            (block.type === 'paragraph' && block.text?.trim()) ||
            (block.type === 'image' && (block.caption?.trim() || block.imageUrl))
          )
          .map((block) => ({
            id: block.id,
            type: block.type,
            text: block.type === 'paragraph' ? block.text?.trim() ?? '' : undefined,
            caption: block.type === 'image' ? block.caption?.trim() ?? '' : undefined,
            imageUrl: block.type === 'image' ? block.imageUrl || coverImageUrl || null : undefined,
          })),
        metadata: {
          period: period.trim(),
          events: parseListInput(events),
          characters: parseListInput(characters),
          locations: parseListInput(locations),
          entities: parseListInput(entities),
          context: historicalContext.trim(),
          references: references
            .filter((reference) => reference.title.trim() || reference.source.trim() || reference.url.trim())
            .map((reference) => ({
              title: reference.title.trim(),
              source: reference.source.trim(),
              url: reference.url.trim(),
            })),
        },
        status: 'PENDING_REVIEW',
      };

      await api.post('/articles', payload);

      window.alert('Bài viết của bạn đã được gửi thành công và đang chờ duyệt. Bài sẽ được chuyển tới bộ phận review để kiểm tra trước khi xuất bản.');
      setTitle('');
      setExcerpt('');
      setBlocks(initialBlocks);
      setReferences([
        {
          id: 'ref-1',
          title: '',
          source: '',
          url: '',
        },
      ]);
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
                  <div className="mt-3 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-page)]">
                    <img
                      src={normalizeImageUrl(coverImageUrl)}
                      alt="Ảnh bìa"
                      className="h-52 w-full object-cover"
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
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Thông tin lịch sử</p>

              <div className="mt-4 space-y-4">
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
                    placeholder="Đặt các sự kiện bằng dấu phẩy"
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
                    placeholder="Ví dụ: triều đại, di tích, tòa án, thành phố"
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
                    placeholder="Mô tả ngắn bối cảnh chính trị, văn hóa, đời sống, v.v."
                    className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-page)] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Tài liệu tham khảo</p>
                <button
                  type="button"
                  onClick={addReference}
                  className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
                >
                  + Thêm
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {references.map((reference, index) => (
                  <div key={reference.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-3">
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
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                      <input
                        type="text"
                        value={reference.source}
                        onChange={(event) => updateReference(reference.id, 'source', event.target.value)}
                        placeholder="Vị trí / xuất xứ / tác giả"
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                      />
                    </div>

                    <input
                      type="url"
                      value={reference.url}
                      onChange={(event) => updateReference(reference.id, 'url', event.target.value)}
                      placeholder="https://..."
                      className="mt-3 w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
                    />
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
              <article className="space-y-6">
                {coverImageUrl ? (
                  <div className="overflow-hidden rounded-[20px] border border-[var(--border)]">
                    <img src={normalizeImageUrl(coverImageUrl)} alt={title || 'Ảnh bìa'} className="h-64 w-full object-cover md:h-80" />
                  </div>
                ) : null}

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
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Chưa có tag</span>
                  )}
                </div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{category}</p>

                <h2 className="max-w-3xl font-[family-name:var(--font-heading)] text-3xl leading-tight text-[var(--ink)] md:text-5xl">
                  {title || 'Tiêu đề bài viết'}
                </h2>

                <p className="text-base leading-7 text-[var(--text-body)] md:text-lg">
                  {excerpt || 'Tóm tắt ngắn sẽ hiển thị ở đây.'}
                </p>

                <div className="space-y-5 text-base leading-8 text-[var(--text-body)] md:text-lg">
                  {blocks.length > 0 ? (
                    blocks.map((block) =>
                      block.type === 'paragraph' ? (
                        <p key={block.id}>{block.text || 'Đoạn văn sẽ xuất hiện ở đây.'}</p>
                      ) : (
                        <figure key={block.id} className="space-y-3">
                          {block.imageUrl ? (
                            <img
                              src={normalizeImageUrl(block.imageUrl)}
                              alt={block.caption || 'Hình ảnh trong bài viết'}
                              className="h-56 w-full rounded-[20px] object-cover md:h-72"
                            />
                          ) : null}
                          {block.caption ? <figcaption className="text-sm italic text-[var(--text-muted)]">{block.caption}</figcaption> : null}
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

export default BlogCreatePage;
