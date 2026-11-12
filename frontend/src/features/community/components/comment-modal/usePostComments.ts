'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { API_BASE_URL } from '@/constants/api-url';
import { CommunityApi, CommunityPost } from '../../api';
import {
  CommentSortOrder,
  CommentSocketAction,
  CommunityCommentItem,
  SortOrder,
} from './comment-modal.types';
import {
  countAllCommentsInTree,
  mapBackendCommentsToTree,
} from './comment-tree.util';

interface UsePostCommentsProps {
  isOpen: boolean;
  post: CommunityPost;
  onCommentAdded?: (
    postId: string,
    totalComments: number,
    latestComment?: { id: string; authorName: string; content: string; createdAt: string },
  ) => void;
}

interface SocketCommentPayload {
  id?: string;
  authorId?: string;
  author?: { id?: string; username?: string };
  authorName?: string;
  content: string;
  createdAt?: string;
  likeCount?: number;
  likesCount?: number;
  parentId?: string | null;
  comment?: { id?: string; content?: string };
  commentId?: string;
  type?: string;
}

export function usePostComments({
  isOpen,
  post,
  onCommentAdded,
}: UsePostCommentsProps) {
  const user = useAuthSession();
  const currentUserName = user?.username || 'Bạn đọc HISGO';
  const currentUserId = user?.id || 'guest-user';

  const [comments, setComments] = useState<CommunityCommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>(CommentSortOrder.OLDEST);

  const [composerText, setComposerText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Tải danh sách bình luận thuần túy từ Database qua Backend API
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const rawData = await CommunityApi.getComments(post.id);
        if (!cancelled && Array.isArray(rawData)) {
          setComments(mapBackendCommentsToTree(rawData));
        }
      } catch {
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingComments(false);
        }
      }
    };

    void loadComments();

    // 2. Kết nối Socket.io nhận bình luận mới theo thời gian thực từ Database
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socket.emit('join-post-room', { postId: post.id });

    socket.on('post:comment-added', (payload: SocketCommentPayload) => {
      const newComment = payload?.comment ?? payload;
      if (!newComment?.id) return;
      setComments((prev) => {
        const mapped: CommunityCommentItem = {
          id: newComment.id,
          authorId: newComment.author?.id || newComment.authorId,
          authorName:
            newComment.author?.username || newComment.authorName || 'Thành viên HISGO',
          content: newComment.content,
          createdAt: newComment.createdAt || new Date().toISOString(),
          likes: newComment.likeCount || newComment.likesCount || 0,
          likedByMe: false,
          replies: [],
        };

        if (newComment.parentId) {
          return prev.map((c) => {
            if (c.id !== newComment.parentId) return c;
            if (c.replies.some((r) => r.id === mapped.id)) return c;
            return { ...c, replies: [...c.replies, mapped] };
          });
        }

        if (prev.some((c) => c.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
    });

    socket.on('post:comment-updated', (payload: SocketCommentPayload) => {
      if (!payload?.commentId) return;
      if (payload.type === CommentSocketAction.DELETED) {
        setComments((prev) =>
          prev
            .filter((c) => c.id !== payload.commentId)
            .map((c) => ({
              ...c,
              replies: c.replies.filter((r) => r.id !== payload.commentId),
            })),
        );
      } else if (payload.type === CommentSocketAction.LIKED) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === payload.commentId) {
              return { ...c, likes: payload.likeCount || 0 };
            }
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === payload.commentId ? { ...r, likes: payload.likeCount || 0 } : r,
              ),
            };
          }),
        );
      } else if (payload.type === CommentSocketAction.UPDATED && payload.comment) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === payload.commentId) {
              return { ...c, content: payload.comment?.content || c.content };
            }
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === payload.commentId ? { ...r, content: payload.comment?.content || r.content } : r,
              ),
            };
          }),
        );
      }
    });

    return () => {
      cancelled = true;
      socket.emit('leave-post-room', { postId: post.id });
      socket.disconnect();
    };
  }, [isOpen, post.id]);

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortOrder === CommentSortOrder.NEWEST) {
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    if (sortOrder === CommentSortOrder.POPULAR) {
      return list.sort(
        (a, b) => b.likes + b.replies.length * 2 - (a.likes + a.replies.length * 2),
      );
    }
    return list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [comments, sortOrder]);

  const totalCommentCount = useMemo(() => {
    return countAllCommentsInTree(comments);
  }, [comments]);

  const handleSelectReply = (commentId: string, targetAuthorName: string) => {
    setReplyingTo({ commentId, authorName: targetAuthorName });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  };

  const handleToggleLikeComment = async (commentId: string) => {
    // Optimistic UI update
    setComments((prev) =>
      prev.map((item) => {
        if (item.id === commentId) {
          const nextLiked = !item.likedByMe;
          return {
            ...item,
            likedByMe: nextLiked,
            likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)),
          };
        }
        return {
          ...item,
          replies: item.replies.map((r) => {
            if (r.id !== commentId) return r;
            const nextLiked = !r.likedByMe;
            return {
              ...r,
              likedByMe: nextLiked,
              likes: Math.max(0, r.likes + (nextLiked ? 1 : -1)),
            };
          }),
        };
      }),
    );

    try {
      await CommunityApi.likeComment(post.id, commentId);
    } catch {
      // Giữ optimistic update hoặc rollback nếu cần
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = composerText.trim();
    if (!trimmed) return;

    const parentCommentId = replyingTo?.commentId || null;
    setComposerText('');
    setReplyingTo(null);

    try {
      const saved = await CommunityApi.addComment(
        post.id,
        trimmed,
        parentCommentId || undefined,
      );

      if (saved?.id) {
        const mapped: CommunityCommentItem = {
          id: saved.id,
          authorId: saved.author?.id || currentUserId,
          authorName: saved.author?.username || currentUserName,
          authorBadge: currentUserId === post.author?.id ? 'Tác giả' : undefined,
          content: saved.content || trimmed,
          createdAt: saved.createdAt || new Date().toISOString(),
          likes: saved.likeCount || 0,
          likedByMe: false,
          replies: [],
        };

        setComments((prev) => {
          if (parentCommentId) {
            return prev.map((c) =>
              c.id === parentCommentId
                ? { ...c, replies: [...c.replies.filter((r) => r.id !== mapped.id), mapped] }
                : c,
            );
          }
          if (prev.some((c) => c.id === mapped.id)) return prev;
          return [...prev, mapped];
        });

        onCommentAdded?.(post.id, totalCommentCount + 1, {
          id: mapped.id,
          authorName: mapped.authorName,
          content: mapped.content,
          createdAt: mapped.createdAt,
        });

        if (!parentCommentId) {
          setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }, 60);
        }
      }
    } catch {
      // Báo lỗi gửi bình luận nếu cần
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    setEditingId(null);
    setEditingText('');

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return { ...c, content: trimmed };
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === commentId ? { ...r, content: trimmed } : r,
          ),
        };
      }),
    );

    try {
      await CommunityApi.updateComment(post.id, commentId, trimmed);
    } catch {
      // Giữ trên giao diện
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // Optimistic UI update
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== commentId),
        })),
    );

    try {
      await CommunityApi.deleteComment(post.id, commentId);
    } catch {
      // Đã cập nhật trên giao diện
    }
  };

  return {
    user,
    currentUserId,
    currentUserName,
    comments,
    sortedComments,
    totalCommentCount,
    isLoadingComments,
    sortOrder,
    setSortOrder,
    composerText,
    setComposerText,
    replyingTo,
    setReplyingTo,
    editingId,
    setEditingId,
    editingText,
    setEditingText,
    inputRef,
    commentsEndRef,
    handleSelectReply,
    handleToggleLikeComment,
    handleSubmitComment,
    handleSaveEdit,
    handleDeleteComment,
  };
}
