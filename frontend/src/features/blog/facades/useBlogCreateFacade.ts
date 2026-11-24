'use client';

import { useState } from 'react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { BlogApiService, type BlogPostItem } from '@/services/entities/dashboard.service';
import { UploadApiService } from '@/services/api';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import {
  StoryBlockTypeEnum,
  ContentStatus,
} from '@/constants/enums';

// === Merged from blog-metadata.util.ts ===
export interface StoryBlock {
  id: string;
  type: StoryBlockTypeEnum;
  heading?: string;
  text?: string;
  caption?: string;
  imageUrl?: string;
}

export interface ReferenceItem {
  id: string;
  title: string;
  source: string;
  url: string;
}

export interface BlogMetadataReference {
  title: string;
  source: string;
  url: string;
}

export interface ExtractedBlogMetadata {
  tags: string[];
  references: BlogMetadataReference[];
}

export const BLOG_ACCENT_PALETTE = [
  'from-[#7b3f2b] via-[#b27342] to-[#d9c09b]',
  'from-[#3a4d43] via-[#6a7d5f] to-[#d2c5a3]',
  'from-[#513b31] via-[#9b724f] to-[#e0c8a8]',
  'from-[#2e3a3d] via-[#58716a] to-[#d7d0bf]',
  'from-[#5a3929] via-[#ad7659] to-[#f0dabc]',
  'from-[#3d4a55] via-[#72828a] to-[#eee1bf]',
] as const;

const BLOCK_TYPE_META = 'meta';
const BLOCK_KIND_METADATA = 'metadata';

function isExplicitMetadataBlock(candidate: Record<string, unknown>): boolean {
  return (
    (candidate.type === BLOCK_TYPE_META &&
      candidate.kind === BLOCK_KIND_METADATA) ||
    candidate.type === BLOCK_KIND_METADATA ||
    candidate.kind === BLOCK_KIND_METADATA
  );
}

function isMetadataBlockCandidate(
  candidate: Record<string, unknown>,
): boolean {
  return (
    isExplicitMetadataBlock(candidate) ||
    Array.isArray(candidate.tags) ||
    Array.isArray(candidate.references) ||
    Boolean(candidate.metadata && typeof candidate.metadata === 'object')
  );
}

function extractNestedMetadataObject(
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  if (candidate.metadata && typeof candidate.metadata === 'object') {
    return candidate.metadata as Record<string, unknown>;
  }
  return candidate;
}

function normalizeTagItem(tag: unknown): string {
  if (typeof tag === 'string') return tag;
  if (tag && typeof tag === 'object') {
    const record = tag as Record<string, unknown>;
    if (typeof record.name === 'string') return record.name;
    if (typeof record.value === 'string') return record.value;
  }
  return '';
}

function normalizeReferenceItem(
  reference: Record<string, unknown>,
): BlogMetadataReference {
  const title =
    typeof reference.title === 'string'
      ? reference.title
      : typeof reference.name === 'string'
        ? reference.name
        : '';
  const source = typeof reference.source === 'string' ? reference.source : '';
  const url =
    typeof reference.url === 'string'
      ? reference.url
      : typeof reference.link === 'string'
        ? reference.link
        : '';
  return { title, source, url };
}

export function extractMetadataFromBlocks(
  contentBlocks: unknown,
): ExtractedBlogMetadata {
  if (!Array.isArray(contentBlocks)) {
    return { tags: [], references: [] };
  }

  const metadataCandidate = contentBlocks.find(
    (block): block is Record<string, unknown> =>
      Boolean(block && typeof block === 'object') &&
      isMetadataBlockCandidate(block as Record<string, unknown>),
  );

  const payload = metadataCandidate
    ? extractNestedMetadataObject(metadataCandidate)
    : {};

  const fallbackPayload = contentBlocks.reduce<Record<string, unknown>>(
    (acc, block) => {
      if (!block || typeof block !== 'object') return acc;
      const candidate = block as Record<string, unknown>;
      if (isExplicitMetadataBlock(candidate)) {
        return { ...acc, ...extractNestedMetadataObject(candidate) };
      }
      return acc;
    },
    {},
  );

  const finalPayload = { ...fallbackPayload, ...payload };
  const rawTags = Array.isArray(finalPayload.tags) ? finalPayload.tags : [];
  const rawReferences = Array.isArray(finalPayload.references)
    ? finalPayload.references
    : [];

  return {
    tags: rawTags
      .map(normalizeTagItem)
      .filter((tag) => tag.trim().length > 0)
      .map((tag) => tag.replace(/^#/, '')),
    references: rawReferences
      .filter(
        (reference): reference is Record<string, unknown> =>
          Boolean(reference && typeof reference === 'object'),
      )
      .map(normalizeReferenceItem),
  };
}

const normalizeImageUrl = (url?: string | null) => resolveBackendAssetUrl(url);

const initialBlocks: StoryBlock[] = [
  {
    id: 'block-1',
    type: StoryBlockTypeEnum.PARAGRAPH,
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

const parseListInput = (value: string) =>
  value
    .split(/[\s,]+/)
    .map((item) => item.trim().replace(/^#/, ''))
    .filter(Boolean);

export function useBlogCreateFacade() {
  const currentUser = useAuthSession();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
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
    if (!file) return;

    try {
      const uploadedUrl = normalizeImageUrl(await uploadImageToServer(file));
      setCoverImageUrl(uploadedUrl);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể tải ảnh bìa lên.');
    }
  };

  const handleBlockImageChange = async (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = normalizeImageUrl(await uploadImageToServer(file));
      setBlocks((current) =>
        current.map((block) =>
          block.id === blockId ? { ...block, imageUrl: uploadedUrl } : block
        )
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể tải ảnh vào khối nội dung.');
    }
  };

  const addTag = () => {
    const values = parseListInput(tagInput);
    if (!values.length) return;

    const newTags = values.filter(
      (value) => !tags.some((existing) => existing.toLowerCase() === value.toLowerCase())
    );
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
        reference.id === id ? { ...reference, [field]: value } : reference
      )
    );
  };

  const removeReference = (id: string) => {
    setReferences((current) =>
      current.length > 1 ? current.filter((reference) => reference.id !== id) : current
    );
  };

  const addParagraphBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: `paragraph-${Date.now()}`,
        type: StoryBlockTypeEnum.PARAGRAPH,
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
        type: StoryBlockTypeEnum.IMAGE,
        caption: '',
        imageUrl: '',
      },
    ]);
  };

  const updateBlock = (id: string, field: 'heading' | 'text' | 'caption', value: string) => {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
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
            (block.type === StoryBlockTypeEnum.PARAGRAPH && block.text?.trim()) ||
            (block.type === StoryBlockTypeEnum.IMAGE && (block.caption?.trim() || block.imageUrl))
          )
          .map((block) => ({
            id: block.id,
            type: block.type,
            heading: block.type === StoryBlockTypeEnum.PARAGRAPH ? block.heading?.trim() ?? '' : undefined,
            text: block.type === StoryBlockTypeEnum.PARAGRAPH ? block.text?.trim() ?? '' : undefined,
            caption: block.type === StoryBlockTypeEnum.IMAGE ? block.caption?.trim() ?? '' : undefined,
            imageUrl: block.type === StoryBlockTypeEnum.IMAGE ? block.imageUrl || coverImageUrl || null : undefined,
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

      const payload: Partial<BlogPostItem> = {
        title: normalizedTitle,
        slug: `${slugify(normalizedTitle)}-${Date.now().toString(36)}`,
        excerpt: normalizedExcerpt,
        coverImageUrl: coverImageUrl || null,
        contentBlocks,
        status: ContentStatus.PENDING_REVIEW,
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
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
