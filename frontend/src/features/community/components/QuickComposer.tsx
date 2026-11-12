'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { UploadApiService } from '@/services/entities/upload.service';
import { ComposerMode } from '@/constants/community.constant';
import { CommunityApi, type CommunityPost, type SharedBlogEmbed } from '../api';
import { SharedBlogSelectorPane } from './SharedBlogSelectorPane';
import { ComposerImageUploadSection } from './ComposerImageUploadSection';
import { ComposerTagsSection } from './ComposerTagsSection';
import { ComposerModeSwitcher } from './ComposerModeSwitcher';

export { ComposerMode };

interface QuickComposerProps {
  isOpen: boolean;
  initialMode?: ComposerMode;
  initialSharedBlogSlug?: string | null;
  onClose: () => void;
  onCreated: (post: CommunityPost) => void;
}

function resolvePostTitlesAndContent(
  mode: ComposerMode,
  title: string,
  content: string,
  selectedBlog: SharedBlogEmbed | null,
  customCardCaption: string,
) {
  const cleanTitle =
    title.trim() ||
    (selectedBlog ? `Chia sẻ bài chuyên khảo: ${selectedBlog.title}` : '');
  const cleanContent =
    content.trim() ||
    (selectedBlog
      ? customCardCaption.trim() ||
        `Mình chia sẻ lại bài viết "${selectedBlog.title}" từ HISGO Blog để mọi người cùng tham khảo và thảo luận.`
      : '');
  return { cleanTitle, cleanContent };
}

function buildFilterBlogs(
  availableBlogs: SharedBlogEmbed[],
  blogSearchOrUrl: string,
  username?: string,
) {
  const q = blogSearchOrUrl.trim().toLowerCase();
  const slugFromUrl = q.includes('/blog/')
    ? q.split('/blog/')[1]?.split(/[?#]/)[0]?.replace(/\/+$/, '')
    : null;

  const sorted = [...availableBlogs].sort((a, b) => {
    const aMine = username && a.authorName?.toLowerCase() === username.toLowerCase() ? 1 : 0;
    const bMine = username && b.authorName?.toLowerCase() === username.toLowerCase() ? 1 : 0;
    return bMine - aMine;
  });

  if (!q) return sorted;
  return sorted.filter(
    (b) =>
      (slugFromUrl && b.slug.toLowerCase() === slugFromUrl) ||
      b.title.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.authorName || '').toLowerCase().includes(q),
  );
}

function applyInitialBlogSelection(
  blogs: SharedBlogEmbed[],
  slug: string | null,
  currentTitle: string,
  setMode: (m: ComposerMode) => void,
  setSelectedBlog: (b: SharedBlogEmbed | null) => void,
  setCustomCardCaption: (c: string) => void,
  setTitle: (t: string) => void,
) {
  if (!slug) return;
  const found = blogs.find((b) => b.slug === slug);
  if (found) {
    setMode(ComposerMode.SHARE_BLOG);
    setSelectedBlog(found);
    setCustomCardCaption(found.excerpt || '');
    if (!currentTitle.trim()) {
      setTitle(`Chia sẻ bài viết: ${found.title}`);
    }
  }
}

export function QuickComposer({
  isOpen,
  initialMode = ComposerMode.QUESTION,
  initialSharedBlogSlug = null,
  onClose,
  onCreated,
}: QuickComposerProps) {
  const user = useAuthSession();
  const [mode, setMode] = useState<ComposerMode>(initialMode);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [period, setPeriod] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [availableBlogs, setAvailableBlogs] = useState<SharedBlogEmbed[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<SharedBlogEmbed | null>(null);
  const [customCardCaption, setCustomCardCaption] = useState('');
  const [blogSearchOrUrl, setBlogSearchOrUrl] = useState('');

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    void Promise.resolve().then(() => {
      if (mounted) setLoadingBlogs(true);
    });
    CommunityApi.listShareableBlogs()
      .then((blogs) => {
        if (!mounted) return;
        setAvailableBlogs(blogs);
        applyInitialBlogSelection(
          blogs,
          initialSharedBlogSlug,
          title,
          setMode,
          setSelectedBlog,
          setCustomCardCaption,
          setTitle,
        );
      })
      .finally(() => {
        if (mounted) setLoadingBlogs(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, initialSharedBlogSlug, title]);

  const filteredBlogs = useMemo(
    () => buildFilterBlogs(availableBlogs, blogSearchOrUrl, user?.username),
    [availableBlogs, blogSearchOrUrl, user],
  );

  if (!isOpen) return null;

  const handleSelectBlog = (blog: SharedBlogEmbed) => {
    setSelectedBlog(blog);
    setCustomCardCaption(blog.excerpt || '');
    if (!title.trim()) {
      setTitle(`Mời mọi người cùng đọc và thảo luận bài viết: "${blog.title}"`);
    }
  };

  const addTagsFromInput = () => {
    const parts = tagInput
      .split(/[,]+/)
      .map((item) => item.trim().replace(/^#/, ''))
      .filter(Boolean);
    if (parts.length === 0) return;

    const next = [...tags];
    for (const part of parts) {
      if (!next.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    setTags(next.slice(0, 6));
    setTagInput('');
  };

  const removeTag = (target: string) => {
    setTags((prev) => prev.filter((item) => item !== target));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsUploading(true);
    try {
      const uploaded = await UploadApiService.uploadImage(file);
      if (!uploaded?.url) {
        throw new Error('Không nhận được đường dẫn ảnh sau khi tải lên.');
      }
      setImageUrl(uploaded.url);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Tải ảnh tư liệu thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPeriod('');
    setTags([]);
    setTagInput('');
    setImageUrl(null);
    setImageCaption('');
    setSelectedBlog(null);
    setCustomCardCaption('');
    setBlogSearchOrUrl('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) {
      setErrorMsg('Bạn cần đăng nhập để đăng bài lên Cộng đồng.');
      return;
    }

    if (mode === ComposerMode.SHARE_BLOG && !selectedBlog) {
      setErrorMsg('Vui lòng chọn một bài Blog chuyên khảo bạn muốn chia sẻ lên Cộng đồng.');
      return;
    }

    const { cleanTitle, cleanContent } = resolvePostTitlesAndContent(
      mode,
      title,
      content,
      selectedBlog,
      customCardCaption,
    );

    if (!cleanTitle || !cleanContent) {
      setErrorMsg('Vui lòng nhập đầy đủ câu hỏi / tiêu đề và nội dung ngắn.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const finalTags = tagInput.trim()
        ? Array.from(new Set([...tags, tagInput.trim().replace(/^#/, '')]))
        : tags;

      const sharedBlogPayload: SharedBlogEmbed | null =
        mode === ComposerMode.SHARE_BLOG && selectedBlog
          ? {
              ...selectedBlog,
              excerpt: customCardCaption.trim() || selectedBlog.excerpt || null,
            }
          : null;

      const created = await CommunityApi.createQuickPost({
        authorId: user.id,
        title: cleanTitle,
        content: cleanContent,
        period,
        tags: finalTags,
        imageUrl: mode === ComposerMode.QUESTION ? imageUrl : null,
        imageCaption: mode === ComposerMode.QUESTION ? imageCaption : undefined,
        sharedBlog: sharedBlogPayload,
      });

      resetForm();
      onCreated(created);
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể đăng bài viết lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1730]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-composer-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[12px] border border-[#E2D5B8] bg-[#FAF5E6] p-6 text-[#14233F]">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5DAC4] pb-4">
          <div>
            <h2 id="quick-composer-title" className="text-[18px] font-bold text-[#14233F]">
              {mode === ComposerMode.SHARE_BLOG
                ? 'Chia sẻ bài Blog lên Cộng đồng'
                : 'Đặt câu hỏi & Đăng bài ngắn'}
            </h2>
            <p className="mt-1 text-[13px] text-[#7A6B57]">
              {mode === ComposerMode.SHARE_BLOG
                ? 'Đính kèm thẻ bài viết chuyên khảo từ Blog (gồm ảnh bìa, tiêu đề & lời chú thích nhỏ) để mời cộng đồng đọc và bàn luận.'
                : 'Đặt câu hỏi sử học ngắn gọn, chia sẻ tư liệu ảnh cổ hoặc mở chủ đề thảo luận nhanh.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng khung đăng bài"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E2D5B8] bg-[#F2E8D5] text-[#4A3F33] transition-colors hover:border-[#14233F] hover:text-[#14233F]"
          >
            <X size={16} />
          </button>
        </div>

        <ComposerModeSwitcher mode={mode} onChangeMode={setMode} />

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === ComposerMode.SHARE_BLOG && (
            <SharedBlogSelectorPane
              selectedBlog={selectedBlog}
              onSelectBlog={handleSelectBlog}
              onClearBlog={() => setSelectedBlog(null)}
              loadingBlogs={loadingBlogs}
              blogSearchOrUrl={blogSearchOrUrl}
              setBlogSearchOrUrl={setBlogSearchOrUrl}
              customCardCaption={customCardCaption}
              setCustomCardCaption={setCustomCardCaption}
              filteredBlogs={filteredBlogs}
            />
          )}

          <div>
            <label htmlFor="qc-title" className="mb-2 block text-[14px] font-medium text-[#14233F]">
              {mode === ComposerMode.SHARE_BLOG
                ? 'Tiêu đề bài đăng chia sẻ trên Cộng đồng'
                : 'Câu hỏi hoặc chủ đề thảo luận ngắn'}
            </label>
            <input
              id="qc-title"
              type="text"
              maxLength={220}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === ComposerMode.SHARE_BLOG
                  ? 'Ví dụ: Mời mọi người cùng đọc bài chuyên khảo mới của mình và cho ý kiến!'
                  : 'Ví dụ: Tư liệu về hệ thống dịch trạm thời Nguyễn dưới triều Minh Mạng?'
              }
              className="h-10 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
            />
          </div>

          <div>
            <label htmlFor="qc-content" className="mb-2 block text-[14px] font-medium text-[#14233F]">
              {mode === ComposerMode.SHARE_BLOG
                ? 'Lời dẫn / Cảm nghĩ của bạn khi chia sẻ'
                : 'Nội dung câu hỏi & chi tiết cần trao đổi'}
            </label>
            <textarea
              id="qc-content"
              rows={mode === ComposerMode.SHARE_BLOG ? 3 : 4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                mode === ComposerMode.SHARE_BLOG
                  ? 'Viết vài dòng giới thiệu điểm tâm đắc hoặc câu hỏi gợi mở trước khi độc giả bấm vào thẻ bài Blog...'
                  : 'Trình bày ngắn gọn bối cảnh hoặc thắc mắc lịch sử bạn muốn cộng đồng cùng giải đáp...'
              }
              className="w-full resize-none rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] p-3 text-[14px] leading-6 text-[#14233F] outline-none focus:border-[#8A5A19]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="qc-period" className="mb-2 block text-[14px] font-medium text-[#14233F]">
                Thời kỳ / Triều đại (tùy chọn)
              </label>
              <input
                id="qc-period"
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Ví dụ: Thời Lê Sơ (1428–1527)"
                className="h-10 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <ComposerTagsSection
              tagInput={tagInput}
              onChangeTagInput={setTagInput}
              onAddTag={addTagsFromInput}
              tags={tags}
              onRemoveTag={removeTag}
            />
          </div>

          {mode === ComposerMode.QUESTION && (
            <ComposerImageUploadSection
              imageUrl={imageUrl}
              onRemoveImage={() => setImageUrl(null)}
              imageCaption={imageCaption}
              onChangeImageCaption={setImageCaption}
              isUploading={isUploading}
              onFileChange={handleFileChange}
            />
          )}

          <div className="flex items-start gap-2 rounded-[6px] border border-[#E2D5B8] bg-[#F2E8D5] px-3 py-2.5 text-[12px] leading-5 text-[#4A3F33]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#1E4620]" />
            <span>
              Bài đăng xuất bản tức thì và được <strong>HISGO Safety Sentinel (AI)</strong> kiểm duyệt tự động nhằm bảo vệ tính tôn nghiêm lịch sử & văn hóa tranh luận học thuật.
            </span>
          </div>

          {errorMsg ? (
            <div className="rounded-[6px] border border-[#E8C5C6] bg-[#F9E8E6] px-3 py-2 text-[13px] text-[#7A1F24]">
              {errorMsg}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E5DAC4] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-4 text-[13px] font-medium text-[#4A3F33] hover:border-[#14233F] hover:text-[#14233F]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="h-9 rounded-[6px] bg-[#7A1F24] px-5 text-[13px] font-medium text-[#FAF5E6] transition-colors hover:bg-[#651A1E] disabled:opacity-60"
            >
              {isSubmitting
                ? 'Đang đăng...'
                : mode === ComposerMode.SHARE_BLOG
                  ? 'Chia sẻ lên Cộng đồng'
                  : 'Đăng câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
