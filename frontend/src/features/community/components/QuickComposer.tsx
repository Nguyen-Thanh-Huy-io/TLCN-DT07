'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, ImagePlus, Link2, MessageSquarePlus, ShieldCheck, Share2, Tag, X } from 'lucide-react';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { UploadApiService } from '@/services/entities/upload.service';
import { CommunityApi, type CommunityPost, type SharedBlogEmbed } from '../api';

export type ComposerMode = 'question' | 'share_blog';

interface QuickComposerProps {
  isOpen: boolean;
  initialMode?: ComposerMode;
  initialSharedBlogSlug?: string | null;
  onClose: () => void;
  onCreated: (post: CommunityPost) => void;
}

export function QuickComposer({
  isOpen,
  initialMode = 'question',
  initialSharedBlogSlug = null,
  onClose,
  onCreated,
}: QuickComposerProps) {
  const user = useAuthSession();
  const [mode, setMode] = useState<ComposerMode>(initialMode);
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

  // State cho chế độ Chia sẻ bài Blog kiểu Facebook
  const [availableBlogs, setAvailableBlogs] = useState<SharedBlogEmbed[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<SharedBlogEmbed | null>(null);
  const [customCardCaption, setCustomCardCaption] = useState('');
  const [blogSearchOrUrl, setBlogSearchOrUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingBlogs(true);
    CommunityApi.listShareableBlogs()
      .then((blogs) => {
        if (!mounted) return;
        setAvailableBlogs(blogs);
        if (initialSharedBlogSlug) {
          const found = blogs.find((b) => b.slug === initialSharedBlogSlug);
          if (found) {
            setMode('share_blog');
            setSelectedBlog(found);
            setCustomCardCaption(found.excerpt || '');
            if (!title.trim()) {
              setTitle(`Chia sẻ bài viết: ${found.title}`);
            }
          }
        }
      })
      .finally(() => {
        if (mounted) setLoadingBlogs(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, initialSharedBlogSlug]);

  // Ưu tiên bài Blog của chính người dùng lên đầu danh sách gợi ý
  const filteredBlogs = useMemo(() => {
    const q = blogSearchOrUrl.trim().toLowerCase();
    // Nếu người dùng dán link dạng /blog/ten-bai-viet
    const slugFromUrl = q.includes('/blog/')
      ? q.split('/blog/')[1]?.split(/[?#]/)[0]?.replace(/\/+$/, '')
      : null;

    const sorted = [...availableBlogs].sort((a, b) => {
      const aMine = user?.username && a.authorName?.toLowerCase() === user.username.toLowerCase() ? 1 : 0;
      const bMine = user?.username && b.authorName?.toLowerCase() === user.username.toLowerCase() ? 1 : 0;
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
  }, [availableBlogs, blogSearchOrUrl, user?.username]);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) {
      setErrorMsg('Bạn cần đăng nhập để đăng bài lên Cộng đồng.');
      return;
    }

    if (mode === 'share_blog' && !selectedBlog) {
      setErrorMsg('Vui lòng chọn một bài Blog chuyên khảo bạn muốn chia sẻ lên Cộng đồng.');
      return;
    }

    const cleanTitle =
      title.trim() ||
      (selectedBlog ? `Chia sẻ bài chuyên khảo: ${selectedBlog.title}` : '');
    const cleanContent =
      content.trim() ||
      (selectedBlog
        ? customCardCaption.trim() ||
          `Mình chia sẻ lại bài viết "${selectedBlog.title}" từ HISGO Blog để mọi người cùng tham khảo và thảo luận.`
        : '');

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
        mode === 'share_blog' && selectedBlog
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
        imageUrl: mode === 'question' ? imageUrl : null,
        imageCaption: mode === 'question' ? imageCaption : undefined,
        sharedBlog: sharedBlogPayload,
      });

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
              {mode === 'share_blog'
                ? 'Chia sẻ bài Blog lên Cộng đồng'
                : 'Đặt câu hỏi & Đăng bài ngắn'}
            </h2>
            <p className="mt-1 text-[13px] text-[#7A6B57]">
              {mode === 'share_blog'
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

        {/* Chuyển đổi 2 chế độ: Đặt câu hỏi ngắn vs Chia sẻ bài Blog */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-1">
          <button
            type="button"
            onClick={() => setMode('question')}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-[6px] text-[13px] font-semibold transition-colors ${
              mode === 'question'
                ? 'bg-[#7A1F24] text-[#FAF5E6]'
                : 'text-[#5C4E3C] hover:text-[#14233F]'
            }`}
          >
            <MessageSquarePlus size={14} />
            <span>Đặt câu hỏi / Bài ngắn</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('share_blog')}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-[6px] text-[13px] font-semibold transition-colors ${
              mode === 'share_blog'
                ? 'bg-[#7A1F24] text-[#FAF5E6]'
                : 'text-[#5C4E3C] hover:text-[#14233F]'
            }`}
          >
            <Share2 size={14} />
            <span>Chia sẻ bài từ Blog</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nếu ở chế độ Chia sẻ bài Blog: Chọn bài Blog & Xem trước thẻ Facebook */}
          {mode === 'share_blog' && (
            <div className="space-y-3 rounded-[8px] border border-[#D8C8AA] bg-[#F2E8D5] p-4">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#14233F]">
                  <Link2 size={15} className="text-[#7A1F24]" />
                  <span>Chọn bài chuyên khảo trên HISGO Blog để chia sẻ</span>
                </label>
                {selectedBlog && (
                  <button
                    type="button"
                    onClick={() => setSelectedBlog(null)}
                    className="text-[12px] font-semibold text-[#7A1F24] hover:underline"
                  >
                    Đổi bài Blog khác
                  </button>
                )}
              </div>

              {!selectedBlog ? (
                <>
                  <input
                    type="text"
                    value={blogSearchOrUrl}
                    onChange={(e) => setBlogSearchOrUrl(e.target.value)}
                    placeholder="Tìm theo tên bài Blog hoặc dán đường dẫn /blog/..."
                    className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
                  />

                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {loadingBlogs ? (
                      <p className="py-4 text-center text-[13px] text-[#6E5D4B]">
                        Đang tải danh sách bài viết từ Blog...
                      </p>
                    ) : filteredBlogs.length === 0 ? (
                      <p className="py-4 text-center text-[13px] text-[#6E5D4B]">
                        Không tìm thấy bài Blog phù hợp.
                      </p>
                    ) : (
                      filteredBlogs.map((blog) => (
                        <button
                          key={blog.slug}
                          type="button"
                          onClick={() => handleSelectBlog(blog)}
                          className="flex w-full items-center gap-3 rounded-[6px] border border-[#E2D5B8] bg-[#FDF9F0] p-2.5 text-left transition-colors hover:border-[#7A1F24]"
                        >
                          {blog.coverImageUrl ? (
                            <img
                              src={blog.coverImageUrl}
                              alt={blog.title}
                              className="h-12 w-16 shrink-0 rounded-[4px] object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[4px] bg-[#EADBC0] text-[#7A1F24]">
                              <BookOpen size={16} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-[#14233F]">
                              {blog.title}
                            </p>
                            <p className="truncate text-[12px] text-[#6E5D4B]">
                              Tác giả: {blog.authorName || 'HISGO Blog'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-[4px] bg-[#F2E5C9] px-2 py-1 text-[11px] font-semibold text-[#6B4E16]">
                            Chọn
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* Bản xem trước thẻ chia sẻ kiểu Facebook */
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-[8px] border border-[#D4C5A6] bg-[#FAF5E6]">
                    {selectedBlog.coverImageUrl ? (
                      <img
                        src={selectedBlog.coverImageUrl}
                        alt={selectedBlog.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-between bg-[#2C1E16] px-4 text-[#FAF5E6]">
                        <span className="text-[12px] font-semibold uppercase tracking-wider">
                          HISGO BLOG · CHUYÊN KHẢO LỊCH SỬ
                        </span>
                        <ExternalLink size={16} />
                      </div>
                    )}
                    <div className="p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A19]">
                        HISGO.VN/BLOG · {selectedBlog.authorName || 'CHUYÊN KHẢO'}
                      </p>
                      <h4 className="mt-1 text-[15px] font-bold text-[#14233F]">
                        {selectedBlog.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-[12px] text-[#5C4E3C]">
                        {customCardCaption || selectedBlog.excerpt || 'Nhấp để đọc toàn văn trên trang Blog.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-[#5C4E3C]">
                      Lời chú thích nhỏ hiển thị trong thẻ bài Blog (tùy chỉnh nếu muốn)
                    </label>
                    <input
                      type="text"
                      maxLength={240}
                      value={customCardCaption}
                      onChange={(e) => setCustomCardCaption(e.target.value)}
                      placeholder="Tóm tắt ngắn gọn hiển thị dưới tiêu đề thẻ Blog..."
                      className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="qc-title" className="mb-2 block text-[14px] font-medium text-[#14233F]">
              {mode === 'share_blog'
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
                mode === 'share_blog'
                  ? 'Ví dụ: Mời mọi người cùng đọc bài chuyên khảo mới của mình và cho ý kiến!'
                  : 'Ví dụ: Tư liệu về hệ thống dịch trạm thời Nguyễn dưới triều Minh Mạng?'
              }
              className="h-10 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
            />
          </div>

          <div>
            <label htmlFor="qc-content" className="mb-2 block text-[14px] font-medium text-[#14233F]">
              {mode === 'share_blog'
                ? 'Lời dẫn / Cảm nghĩ của bạn khi chia sẻ'
                : 'Nội dung câu hỏi & chi tiết cần trao đổi'}
            </label>
            <textarea
              id="qc-content"
              rows={mode === 'share_blog' ? 3 : 4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                mode === 'share_blog'
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

            <div>
              <label htmlFor="qc-tags" className="mb-2 block text-[14px] font-medium text-[#14233F]">
                Thẻ chủ đề (nhấn Enter để thêm)
              </label>
              <div className="flex gap-2">
                <input
                  id="qc-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTagsFromInput();
                    }
                  }}
                  placeholder="Khảo cổ, Bia đá, Nhà Trần..."
                  className="h-10 flex-1 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
                />
                <button
                  type="button"
                  onClick={addTagsFromInput}
                  className="inline-flex h-10 items-center gap-1 rounded-[6px] border border-[#D4C5A6] bg-[#F2E8D5] px-3 text-[13px] font-medium text-[#14233F] hover:border-[#8A5A19]"
                >
                  <Tag size={13} />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-6 items-center gap-1.5 rounded-[4px] border border-[#E2D5B8] bg-[#F2E8D5] px-2 text-[12px] font-medium text-[#14233F]"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Xóa thẻ ${tag}`}
                    className="text-[#7A6B57] hover:text-[#7A1F24]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {/* Đính kèm ảnh tư liệu (chỉ hiện khi đăng câu hỏi ngắn trực tiếp) */}
          {mode === 'question' && (
            <div className="rounded-[8px] border border-[#E2D5B8] bg-[#F2E8D5] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#14233F]">
                  <ImagePlus size={15} className="text-[#8A5A19]" />
                  <span>Ảnh tư liệu / Bản đồ đính kèm câu hỏi (tùy chọn)</span>
                </span>
                <label className="inline-flex h-8 cursor-pointer items-center rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[12px] font-medium text-[#14233F] hover:border-[#8A5A19]">
                  <span>
                    {isUploading ? 'Đang tải ảnh...' : imageUrl ? 'Đổi ảnh khác' : 'Chọn tệp ảnh'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="sr-only"
                  />
                </label>
              </div>

              {imageUrl ? (
                <div className="mt-3 space-y-2">
                  <div className="relative overflow-hidden rounded-[6px] border border-[#E2D5B8] bg-[#FDF9F0]">
                    <img
                      src={imageUrl}
                      alt="Ảnh tư liệu đính kèm"
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute right-2 top-2 rounded-[4px] bg-[#14233F] px-2 py-1 text-[11px] font-medium text-[#FAF5E6]"
                    >
                      Gỡ ảnh
                    </button>
                  </div>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Ghi chú nguồn ảnh (ví dụ: Viện Viễn Đông Bác cổ - EFEO, 1925)"
                    className="h-9 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[13px] text-[#14233F] outline-none focus:border-[#8A5A19]"
                  />
                </div>
              ) : null}
            </div>
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
                : mode === 'share_blog'
                  ? 'Chia sẻ lên Cộng đồng'
                  : 'Đăng câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
