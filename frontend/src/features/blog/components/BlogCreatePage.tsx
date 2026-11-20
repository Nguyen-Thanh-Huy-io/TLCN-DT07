'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/hisgo/Header';
import { Footer } from '@/components/hisgo/Footer';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import { KEYBOARD_KEYS } from '@/constants/enums';
import {
  BlogPostTypeEnum,
  BLOG_URL_PLACEHOLDER,
} from '@/constants/enums';
import { useBlogCreateFacade } from '../facades/useBlogCreateFacade';
import { BlogStoryBlockItem } from './BlogCreateParts';
import { BlogHistoricalMetaModal } from './BlogCreateParts';
import { BlogPreviewModal } from './BlogCreateParts';

const normalizeImageUrl = (url?: string | null) => resolveBackendAssetUrl(url);

export function BlogCreatePage() {
  const {
    postType,
    setPostType,
    title,
    setTitle,
    excerpt,
    setExcerpt,
    tagInput,
    setTagInput,
    tags,
    period,
    setPeriod,
    events,
    setEvents,
    characters,
    setCharacters,
    locations,
    setLocations,
    entities,
    setEntities,
    historicalContext,
    setHistoricalContext,
    blocks,
    references,
    isSubmitting,
    submitError,
    showPreview,
    setShowPreview,
    showHistoricalMeta,
    setShowHistoricalMeta,
    coverImageUrl,
    handleCoverImageChange,
    handleBlockImageChange,
    addTag,
    removeTag,
    addReference,
    updateReference,
    removeReference,
    addParagraphBlock,
    addImageBlock,
    updateBlock,
    removeBlock,
    handleSubmit,
  } = useBlogCreateFacade();

  const isLongForm = postType === BlogPostTypeEnum.LONG_FORM;
  const isQuickPost = postType === BlogPostTypeEnum.QUICK_POST;

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

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/cong-dong"
              className="inline-flex items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
            >
              Diễn đàn Cộng đồng
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
            >
              Quay lại blog
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[0_10px_22px_rgba(20,35,63,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Mục tiêu bài viết</p>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-[var(--text-body)] md:text-xl">
              Tạo một bài dài rõ chủ đề, có nhịp văn tự nhiên và giữ sự tin cậy lịch sử trong từng đoạn.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-page)] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Hình thức xuất bản</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPostType(BlogPostTypeEnum.LONG_FORM)}
                className={`rounded-[12px] border px-3 py-2 text-xs font-medium transition-colors ${
                  isLongForm
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink)] hover:border-[var(--gold)]'
                }`}
              >
                Chuyên khảo dài (LONG_FORM)
              </button>
              <button
                type="button"
                onClick={() => setPostType(BlogPostTypeEnum.QUICK_POST)}
                className={`rounded-[12px] border px-3 py-2 text-xs font-medium transition-colors ${
                  isQuickPost
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink)] hover:border-[var(--gold)]'
                }`}
              >
                Thảo luận nhanh (QUICK_POST)
              </button>
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
                  <BlogStoryBlockItem
                    key={block.id}
                    block={block}
                    index={index}
                    onUpdateBlock={updateBlock}
                    onBlockImageChange={handleBlockImageChange}
                    onRemoveBlock={removeBlock}
                  />
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    if (event.key === KEYBOARD_KEYS.ENTER) {
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
                      placeholder={BLOG_URL_PLACEHOLDER}
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

      <BlogHistoricalMetaModal
        isOpen={showHistoricalMeta}
        onClose={() => setShowHistoricalMeta(false)}
        period={period}
        setPeriod={setPeriod}
        events={events}
        setEvents={setEvents}
        characters={characters}
        setCharacters={setCharacters}
        locations={locations}
        setLocations={setLocations}
        entities={entities}
        setEntities={setEntities}
        historicalContext={historicalContext}
        setHistoricalContext={setHistoricalContext}
      />

      <BlogPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        coverImageUrl={coverImageUrl}
        title={title}
        excerpt={excerpt}
        tags={tags}
        blocks={blocks}
        references={references}
      />

      <Footer />
    </main>
  );
}

export default BlogCreatePage;
