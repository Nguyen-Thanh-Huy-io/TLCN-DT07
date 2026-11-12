'use client';

import { CommunityPost } from '../../api';

export interface CommunityCommentItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorBadge?: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommunityCommentItem[];
}

export interface ModalCommentItem {
  id: string;
  authorName: string;
  content?: string;
}

export enum CommentSortOrder {
  OLDEST = 'oldest',
  NEWEST = 'newest',
  POPULAR = 'popular',
}

export type SortOrder = CommentSortOrder;

export enum CommentSocketAction {
  DELETED = 'deleted',
  LIKED = 'liked',
  UPDATED = 'updated',
}

export interface PostCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: CommunityPost;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
  onCommentAdded?: (
    postId: string,
    totalComments: number,
    latestComment?: { id: string; authorName: string; content: string; createdAt: string },
  ) => void;
}
