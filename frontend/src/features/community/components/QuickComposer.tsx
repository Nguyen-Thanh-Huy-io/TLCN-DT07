'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { UploadApiService } from '@/services/api';
import { ComposerMode } from '@/constants/enums';
import {
  CommunityApi,
  CommunityVideoKind,
  type CommunityImageItem,
  type CommunityPost,
  type CommunityVideoItem,
  type SharedBlogEmbed,
} from '../api';
import {
  applyInitialBlogSelection,
  buildFilterBlogs,
  ComposerModeSwitcher,
  ComposerTagsSection,
  resolvePostTitlesAndContent,
  SharedBlogSelectorPane,
} from './QuickComposerParts';
import {
  ComposerAttachmentsPanel,
  MAX_COMMUNITY_IMAGES,
} from './QuickComposerMediaParts';

export { ComposerMode };

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const COMPOSER_COPY: Record<
  ComposerMode,
  {
    heading: string;
    subtitle: string;
    titleLabel: string;
    titlePlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    submitLabel: string;
    contentRows: number;
  }
> = {
  [ComposerMode.QUESTION]: {
    heading: 'Đăng bài viết Cộng đồng',
    subtitle:
      'Đặt câu hỏi sử học, chia sẻ suy nghĩ và tuỳ chọn đính kèm thêm ảnh hoặc video.',
    titleLabel: 'Tiêu đề hoặc câu hỏi trọng tâm',
    titlePlaceholder:
      'Ví dụ: Tư liệu về hệ thống dịch trạm thời Nguyễn dưới triều Minh Mạng?',
    contentLabel: 'Nội dung bài viết',
    contentPlaceholder:
      'Trình bày nội dung câu hỏi, góc nhìn sử học hoặc chú thích cho tư liệu...',
    submitLabel: 'Đăng bài',
    contentRows: 4,
  },
  [ComposerMode.SHARE_BLOG]: {
    heading: 'Chia sẻ bài Blog lên Cộng đồng',
    subtitle:
      'Đính kèm thẻ bài viết chuyên khảo từ Blog để mời cộng đồng đọc và bàn luận.',
    titleLabel: 'Tiêu đề bài đăng chia sẻ trên Cộng đồng',
    titlePlaceholder:
      'Ví dụ: Mời mọi người cùng đọc bài chuyên khảo mới và cho ý kiến!',
    contentLabel: 'Lời dẫn / Cảm nghĩ khi chia sẻ',
    contentPlaceholder:
      'Viết vài dòng giới thiệu điểm tâm đắc trước khi độc giả bấm vào thẻ bài Blog...',
    submitLabel: 'Chia sẻ lên Cộng đồng',
    contentRows: 3,
  },
};

function validateComposerBeforeSubmit(
  userId: string | undefined,
  mode: ComposerMode,
  selectedBlog: SharedBlogEmbed | null,
): string | null {
  if (!userId) return 'Bạn cần đăng nhập để đăng bài lên Cộng đồng.';
  if (mode === ComposerMode.SHARE_BLOG && !selectedBlog) {
    return 'Vui lòng chọn một bài Blog chuyên khảo bạn muốn chia sẻ lên Cộng đồng.';
  }
  return null;
}

interface QuickComposerProps {
  isOpen: boolean;
  initialMode?: ComposerMode;
  initialOpenMedia?: boolean;
  initialSharedBlogSlug?: string | null;
  onClose: () => void;
  onCreated: (post: CommunityPost) => void;
}

export function QuickComposer({
  isOpen,
  initialMode = ComposerMode.QUESTION,
  initialOpenMedia = false,
  initialSharedBlogSlug = null,
  onClose,
  onCreated,
}: QuickComposerProps) {
  const user = useAuthSession();
  const [mode, setMode] = useState<ComposerMode>(initialMode);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [showImageBox, setShowImageBox] = useState(initialOpenMedia);
  const [showVideoBox, setShowVideoBox] = useState(initialOpenMedia);
  const [mediaImages, setMediaImages] = useState<CommunityImageItem[]>([]);
  const [imageCaption, setImageCaption] = useState('');
  const [video, setVideo] = useState<CommunityVideoItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
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
      setShowImageBox(initialOpenMedia);
      setShowVideoBox(initialOpenMedia);
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

  const isShareBlog = mode === ComposerMode.SHARE_BLOG;
  const copy = COMPOSER_COPY[mode];

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

  const handleMultiImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, MAX_COMMUNITY_IMAGES - mediaImages.length);
    const batch = Array.from(files).slice(0, remaining);
    if (batch.length === 0) return;

    setErrorMsg('');
    setIsUploading(true);
    try {
      const uploadedList = await Promise.all(
        batch.map((file) => UploadApiService.uploadImage(file)),
      );
      const added: CommunityImageItem[] = uploadedList
        .filter((res) => Boolean(res?.url))
        .map((res) => ({ url: res.url, caption: null }));
      setMediaImages((prev) => [...prev, ...added].slice(0, MAX_COMMUNITY_IMAGES));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Tải ảnh lên Cloudinary thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setErrorMsg('Dung lượng video tối đa 50MB. Với video dài hơn, hãy chuyển sang link YouTube.');
      return;
    }
    setErrorMsg('');
    setIsUploadingVideo(true);
    try {
      const uploaded = await UploadApiService.uploadVideo(file);
      if (!uploaded?.url) throw new Error('Không nhận được đường dẫn video sau khi tải lên.');
      setVideo({ url: uploaded.url, kind: CommunityVideoKind.UPLOAD, caption: null });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Tải video lên Cloudinary thất bại.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setMediaImages([]);
    setImageCaption('');
    setVideo(null);
    setShowImageBox(false);
    setShowVideoBox(false);
    setSelectedBlog(null);
    setCustomCardCaption('');
    setBlogSearchOrUrl('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const guardError = validateComposerBeforeSubmit(user?.id, mode, selectedBlog);
    if (guardError) {
      setErrorMsg(guardError);
      return;
    }

    const mediaCount = mediaImages.length + (video ? 1 : 0);
    const { cleanTitle, cleanContent } = resolvePostTitlesAndContent(
      mode,
      title,
      content,
      selectedBlog,
      customCardCaption,
      mediaCount,
    );

    if (!cleanTitle || !cleanContent) {
      setErrorMsg('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const pendingTag = tagInput.trim().replace(/^#/, '');
      const finalTags = pendingTag ? Array.from(new Set([...tags, pendingTag])) : tags;

      const sharedBlogPayload: SharedBlogEmbed | null =
        isShareBlog && selectedBlog
          ? {
              ...selectedBlog,
              excerpt: customCardCaption.trim() || selectedBlog.excerpt || null,
            }
          : null;

      const captionValue = imageCaption.trim() || null;
      const attachedImages = !isShareBlog
        ? mediaImages.map((img, i) => ({ ...img, caption: i === 0 ? captionValue : img.caption }))
        : undefined;

      const created = await CommunityApi.createQuickPost({
        title: cleanTitle,
        content: cleanContent,
        tags: finalTags,
        images: attachedImages,
        video: !isShareBlog ? video : null,
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
              {copy.heading}
            </h2>
            <p className="mt-1 text-[13px] text-[#7A6B57]">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng khung đăng bài"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E2D5B8] bg-[#F2E8D5] text-[#4A3F33] transition-colors hover:border-[#14233F] hover:text-[#14233F] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <ComposerModeSwitcher mode={mode} onChangeMode={setMode} />

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          {isShareBlog && (
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
              {copy.titleLabel}
            </label>
            <input
              id="qc-title"
              type="text"
              maxLength={220}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.titlePlaceholder}
              className="h-10 w-full rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
            />
          </div>

          <div>
            <label htmlFor="qc-content" className="mb-2 block text-[14px] font-medium text-[#14233F]">
              {copy.contentLabel}
            </label>
            <textarea
              id="qc-content"
              rows={copy.contentRows}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={copy.contentPlaceholder}
              className="w-full resize-none rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] p-3 text-[14px] leading-6 text-[#14233F] outline-none focus:border-[#8A5A19]"
            />
          </div>

          {!isShareBlog && (
            <ComposerAttachmentsPanel
              showImageBox={showImageBox}
              showVideoBox={showVideoBox}
              mediaImages={mediaImages}
              imageCaption={imageCaption}
              video={video}
              isUploading={isUploading}
              isUploadingVideo={isUploadingVideo}
              onToggleImageBox={() => setShowImageBox((v) => !v)}
              onToggleVideoBox={() => setShowVideoBox((v) => !v)}
              onUploadImageFiles={(fl) => void handleMultiImageFiles(fl)}
              onRemoveImage={(idx) =>
                setMediaImages((prev) => prev.filter((_, i) => i !== idx))
              }
              onChangeImageCaption={setImageCaption}
              onUploadVideoFile={(f) => void handleVideoFile(f)}
              onChangeVideo={setVideo}
            />
          )}

          <ComposerTagsSection
            tagInput={tagInput}
            onChangeTagInput={setTagInput}
            onAddTag={addTagsFromInput}
            tags={tags}
            onRemoveTag={(target) => setTags((prev) => prev.filter((item) => item !== target))}
          />

          <div className="flex items-start gap-2 rounded-[6px] border border-[#E2D5B8] bg-[#F2E8D5] px-3 py-2.5 text-[12px] leading-5 text-[#4A3F33]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#1E4620]" />
            <span>
              Bài đăng xuất bản tức thì và được <strong>HISGO Safety Sentinel (AI)</strong> kiểm duyệt tự động nhằm bảo vệ tính tôn nghiêm lịch sử &amp; văn hóa tranh luận học thuật.
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
              className="h-9 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-4 text-[13px] font-medium text-[#4A3F33] hover:border-[#14233F] hover:text-[#14233F] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || isUploadingVideo}
              className="h-9 rounded-[6px] bg-[#7A1F24] px-5 text-[13px] font-medium text-[#FAF5E6] transition-colors hover:bg-[#651A1E] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Đang đăng...' : copy.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
