import type { BlogPostTypeValue, BlogStatusValue } from '@/services/entities/blog.service';

export const CONTENT_BLOCK_META_TYPE = 'meta';

export const CONTENT_BLOCK_METADATA_KIND = 'metadata';

export enum CommunityVideoKind {
  UPLOAD = 'upload',
  YOUTUBE = 'youtube',
}

export interface CommunityImageItem {
  url: string;
  caption?: string | null;
}

export interface CommunityVideoItem {
  url: string;
  kind: CommunityVideoKind;
  caption?: string | null;
}

export interface CommunityAuthor {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number;
  followedByMe: boolean;
}

export interface CommunityPreviewComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SharedBlogEmbed {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
}

export interface CommunityPost {
  id: string;
  postType: BlogPostTypeValue;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentBlocks: unknown[];
  status: BlogStatusValue;
  isFeatured: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: CommunityAuthor | null;
  previewComment: CommunityPreviewComment | null;
}

export interface CommunityReferenceItem {
  title: string;
  source?: string | null;
}

export interface CommunityContentParsed {
  tags: string[];
  period: string | null;
  locations: string | null;
  paragraphs: string[];
  images: CommunityImageItem[];
  videos: CommunityVideoItem[];
  references: CommunityReferenceItem[];
  sharedBlog: SharedBlogEmbed | null;
}

const YOUTUBE_EMBED_ORIGIN = ['https', '//www.youtube.com/embed/'].join(':');

/** Tách YouTube video ID an toàn và trả về URL iframe embed hợp lệ (hoặc null). */
export function toYoutubeEmbedUrl(rawUrl: string): string | null {
  const clean = rawUrl.trim();
  if (!clean) return null;
  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
      else if (parsed.pathname.startsWith('/shorts/')) id = parsed.pathname.split('/')[2] ?? null;
      else if (parsed.pathname.startsWith('/embed/')) id = parsed.pathname.split('/')[2] ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return `${YOUTUBE_EMBED_ORIGIN}${id}`;
  } catch {
    return null;
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

export function isMetaBlock(block: unknown): block is Record<string, unknown> {
  const record = asRecord(block);
  if (!record) return false;
  return record.type === CONTENT_BLOCK_META_TYPE || record.kind === CONTENT_BLOCK_METADATA_KIND;
}

export function extractTags(meta: Record<string, unknown>): string[] {
  const rawTags = meta.tags;
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      const record = asRecord(tag);
      return typeof record?.name === 'string' ? record.name : '';
    })
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean);
}

export function extractImages(meta: Record<string, unknown>): CommunityImageItem[] {
  const rawImages = meta.images;
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item?.url === 'string')
    .map((item) => ({
      url: item.url as string,
      caption: typeof item.caption === 'string' ? item.caption : null,
    }));
}

export function extractVideos(meta: Record<string, unknown>): CommunityVideoItem[] {
  const rawVideos = meta.videos;
  if (!Array.isArray(rawVideos)) return [];
  return rawVideos
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item?.url === 'string')
    .map((item) => ({
      url: item.url as string,
      kind:
        item.kind === CommunityVideoKind.YOUTUBE
          ? CommunityVideoKind.YOUTUBE
          : CommunityVideoKind.UPLOAD,
      caption: typeof item.caption === 'string' ? item.caption : null,
    }));
}

export function extractReferences(meta: Record<string, unknown>): CommunityContentParsed['references'] {
  const rawReferences = meta.references;
  if (!Array.isArray(rawReferences)) return [];
  return rawReferences
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item?.title === 'string')
    .map((item) => ({
      title: item.title as string,
      source: typeof item.source === 'string' ? item.source : null,
    }));
}

export function extractSharedBlog(meta: Record<string, unknown>): SharedBlogEmbed | null {
  const record = asRecord(meta.sharedBlog);
  if (!record || typeof record.slug !== 'string' || typeof record.title !== 'string') return null;
  return {
    slug: record.slug,
    title: record.title,
    excerpt: typeof record.excerpt === 'string' ? record.excerpt : null,
    coverImageUrl: typeof record.coverImageUrl === 'string' ? record.coverImageUrl : null,
    authorName: typeof record.authorName === 'string' ? record.authorName : null,
  };
}

/** Đọc khối "meta" lưu trong contentBlocks của bài viết (xem QuickComposer.handleSubmit và blog.service.ts getCommunityProfile). */
export function extractCommunityContent(post: CommunityPost): CommunityContentParsed {
  const metaBlock = post.contentBlocks.find(isMetaBlock);
  const metadataField = metaBlock ? asRecord(metaBlock.metadata) : null;
  const meta = metadataField ?? metaBlock ?? {};

  const paragraphs = Array.isArray(meta.paragraphs) && meta.paragraphs.length > 0
    ? (meta.paragraphs.filter((p): p is string => typeof p === 'string'))
    : post.excerpt
      ? [post.excerpt]
      : [];

  return {
    tags: extractTags(meta),
    period: typeof meta.period === 'string' ? meta.period : null,
    locations: typeof meta.locations === 'string' ? meta.locations : null,
    paragraphs,
    images: extractImages(meta),
    videos: extractVideos(meta),
    references: extractReferences(meta),
    sharedBlog: extractSharedBlog(meta),
  };
}
