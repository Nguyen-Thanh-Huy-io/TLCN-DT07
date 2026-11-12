import { CommunityCommentItem } from './comment-modal.types';

export function formatVietnameseRelativeTime(iso?: string | null): string {
  if (!iso) return 'Vừa xong';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function mapBackendCommentsToTree(
  rawComments: Array<{
    id: string;
    parentId?: string | null;
    authorId?: string;
    author?: { id?: string; username?: string };
    authorName?: string;
    content: string;
    createdAt?: string;
    likesCount?: number;
    likes?: number;
  }>,
): CommunityCommentItem[] {
  const map = new Map<string, CommunityCommentItem>();
  const roots: CommunityCommentItem[] = [];

  rawComments.forEach((c) => {
    map.set(c.id, {
      id: c.id,
      authorId: c.author?.id || c.authorId,
      authorName: c.author?.username || c.authorName || 'Thành viên HISGO',
      content: c.content,
      createdAt: c.createdAt || new Date().toISOString(),
      likes: c.likesCount ?? c.likes ?? 0,
      likedByMe: false,
      replies: [],
    });
  });

  rawComments.forEach((c) => {
    const node = map.get(c.id);
    if (!node) return;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function countAllCommentsInTree(items: CommunityCommentItem[]): number {
  return items.reduce(
    (sum, item) => sum + 1 + countAllCommentsInTree(item.replies || []),
    0,
  );
}
