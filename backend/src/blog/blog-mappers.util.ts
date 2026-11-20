import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContentStatus, PostCommentStatus, PostType } from '@prisma/client';
import { ROLE_GROUPS } from '../common/access/access.constant';
import type { PrismaService } from '../common/services/prisma.service';
import type { ListBlogPostsQueryDto } from './dto/blog-post.dto';

export function formatUserDisplayName(user: {
  username: string;
  userProfile?: { firstName?: string | null; lastName?: string | null } | null;
}): string {
  const full = [user.userProfile?.firstName, user.userProfile?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return full || user.username;
}

export async function ensureBlogPostExists(
  prisma: PrismaService,
  postId: string,
): Promise<void> {
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw new NotFoundException(`Bài viết ${postId} không tồn tại`);
  }
}

export async function ensureAuthUserExists(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  const user = await prisma.authUser.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException(`Người dùng ${userId} không tồn tại`);
  }
}

export function mapBlogPost(post: any) {
  return {
    id: post.id,
    postType: post.postType ?? 'QUICK_POST',
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    coverImageUrl: post.coverImageUrl ?? null,
    contentBlocks: post.contentBlocks ?? [],
    status: post.status,
    isFeatured: post.isFeatured ?? false,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    viewCount: post.viewCount ?? 0,
    publishedAt: post.publishedAt ?? null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? {
          id: post.author.id,
          username: post.author.username,
          bio: post.author.userProfile?.bio ?? null,
          avatarUrl: post.author.userProfile?.avatarUrl ?? null,
          followerCount: post.author._count?.followers ?? 0,
        }
      : null,
  };
}

export function mapBlogComment(comment: any) {
  return {
    id: comment.id,
    postId: comment.postId ?? comment.articleId ?? null,
    articleId: comment.postId ?? comment.articleId ?? null,
    authorId: comment.authorId,
    parentId: comment.parentId ?? null,
    content: comment.deletedAt
      ? '[Bình luận đã bị xóa]'
      : (comment.content ?? ''),
    status: comment.status ?? PostCommentStatus.VISIBLE,
    likeCount: comment.likeCount ?? 0,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt ?? null,
    author: comment.author
      ? {
          id: comment.author.id,
          username: comment.author.username,
        }
      : null,
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply: any) => ({
          id: reply.id,
          authorId: reply.authorId,
          parentId: reply.parentId,
          author: reply.author
            ? { id: reply.author.id, username: reply.author.username }
            : null,
          content: reply.deletedAt
            ? '[Bình luận đã bị xóa]'
            : (reply.content ?? ''),
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          likeCount: reply.likeCount ?? 0,
        }))
      : [],
  };
}

function parseTagsList(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) return [];
  const tags: string[] = [];
  for (const t of rawTags) {
    const rawTag: unknown =
      typeof t === 'string'
        ? t
        : typeof t === 'object' && t !== null && 'name' in t
          ? (t as Record<string, unknown>).name
          : '';
    const tagStr =
      typeof rawTag === 'string' ? rawTag.trim().replace(/^#/, '') : '';
    if (tagStr) tags.push(tagStr);
  }
  return tags;
}

function extractTagsAndSharedBlogsFromBlocks(contentBlocks: unknown) {
  let sharedBlogCount = 0;
  const tags: string[] = [];
  if (!Array.isArray(contentBlocks)) return { sharedBlogCount, tags };

  for (const raw of contentBlocks) {
    if (!raw || typeof raw !== 'object') continue;
    const block = raw as Record<string, any>;
    if (block.type !== 'meta' && block.kind !== 'metadata') continue;

    const meta = (
      block.metadata && typeof block.metadata === 'object'
        ? block.metadata
        : block
    ) as Record<string, any>;

    if (meta.sharedBlog?.slug) sharedBlogCount += 1;
    tags.push(...parseTagsList(meta.tags));
  }

  return { sharedBlogCount, tags };
}

export function computeCommunityContributionStats(
  mappedPosts: Array<{
    likeCount?: number | null;
    commentCount?: number | null;
    viewCount?: number | null;
    contentBlocks?: unknown;
  }>,
) {
  let sharedBlogCount = 0;
  let totalLikesReceived = 0;
  let totalCommentsReceived = 0;
  let totalViewsReceived = 0;
  const topicCounts = new Map<string, number>();

  for (const p of mappedPosts) {
    totalLikesReceived += p.likeCount ?? 0;
    totalCommentsReceived += p.commentCount ?? 0;
    totalViewsReceived += p.viewCount ?? 0;

    const metaInfo = extractTagsAndSharedBlogsFromBlocks(p.contentBlocks);
    sharedBlogCount += metaInfo.sharedBlogCount;
    for (const tag of metaInfo.tags) {
      topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
    }
  }

  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  return {
    postCount: mappedPosts.length,
    sharedBlogCount,
    totalLikesReceived,
    totalCommentsReceived,
    totalViewsReceived,
    topTopics,
  };
}

const DEFAULT_BLOG_PAGE_LIMIT = 12;

const AUTHOR_LONG_FORM_STATUSES = new Set<ContentStatus>([
  ContentStatus.DRAFT,
  ContentStatus.PENDING_REVIEW,
]);

export function orderBlogPosts<
  T extends {
    likeCount?: number | null;
    commentCount?: number | null;
    viewCount?: number | null;
    publishedAt?: Date | string | null;
    createdAt: Date | string;
  },
>(posts: T[], sort?: string): T[] {
  if (sort !== 'trending') return posts;
  const now = Date.now();
  const scoreOf = (post: T) => {
    const engagement =
      (post.likeCount ?? 0) * 2 +
      (post.commentCount ?? 0) * 3 +
      (post.viewCount ?? 0) * 0.1;
    const ageDays = Math.max(
      0,
      (now - new Date(post.publishedAt ?? post.createdAt).getTime()) /
        86_400_000,
    );
    return engagement / Math.pow(ageDays + 1, 0.5) - ageDays * 0.05;
  };
  return [...posts].sort((a, b) => scoreOf(b) - scoreOf(a));
}

export function sliceBlogPostsByCursor<T extends { id: string }>(
  posts: T[],
  query?: ListBlogPostsQueryDto,
): T[] {
  if (!query?.cursor && !query?.limit) return posts;
  const limit = Math.min(
    Math.max(Number(query?.limit) || DEFAULT_BLOG_PAGE_LIMIT, 1),
    50,
  );
  let startIndex = 0;
  if (query?.cursor) {
    const cursorIdx = posts.findIndex((p) => p.id === query.cursor);
    startIndex = cursorIdx >= 0 ? cursorIdx + 1 : posts.length;
  }
  return posts.slice(startIndex, startIndex + limit);
}

export function assertCanModifyBlogPost(
  authorId: string,
  requesterId: string,
  requesterRole: string,
): void {
  const isOwner = authorId === requesterId;
  const isStaff = (ROLE_GROUPS.STAFF as readonly string[]).includes(
    requesterRole,
  );
  if (!isOwner && !isStaff) {
    throw new ForbiddenException(
      'Bạn không có quyền sửa hoặc xóa bài viết này.',
    );
  }
}

export function assertCanSetBlogPublication(
  postType: PostType,
  dto: { status?: ContentStatus; isFeatured?: boolean },
  requesterRole: string,
): void {
  if ((ROLE_GROUPS.REVIEWERS as readonly string[]).includes(requesterRole)) {
    return;
  }
  if (dto.isFeatured) {
    throw new ForbiddenException('Chỉ người duyệt mới được đặt bài nổi bật.');
  }
  if (
    postType === PostType.LONG_FORM &&
    dto.status &&
    !AUTHOR_LONG_FORM_STATUSES.has(dto.status)
  ) {
    throw new ForbiddenException(
      'Bài viết chuyên khảo phải được người duyệt xuất bản.',
    );
  }
}
