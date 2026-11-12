'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { API_BASE_URL } from '@/constants/api-url';
import { CommunityPost } from '../../api';
import { CommunityCommentItem, SortOrder } from './comment-modal.types';
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
  const [sortOrder, setSortOrder] = useState<SortOrder>('oldest');

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
        const res = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          const rawData = json?.data ?? json;
          if (!cancelled && Array.isArray(rawData)) {
            setComments(mapBackendCommentsToTree(rawData));
          }
        } else if (!cancelled) {
          setComments([]);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('post:comment-added', (payload: any) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('post:comment-updated', (payload: any) => {
      if (!payload?.commentId) return;
      if (payload.type === 'deleted') {
        setComments((prev) =>
          prev
            .filter((c) => c.id !== payload.commentId)
            .map((c) => ({
              ...c,
              replies: c.replies.filter((r) => r.id !== payload.commentId),
            })),
        );
      } else if (payload.type === 'liked') {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === payload.commentId) {
              return { ...c, likes: payload.likeCount };
            }
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === payload.commentId ? { ...r, likes: payload.likeCount } : r,
              ),
            };
          }),
        );
      } else if (payload.type === 'updated' && payload.comment) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === payload.commentId) {
              return { ...c, content: payload.comment.content };
            }
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === payload.commentId ? { ...r, content: payload.comment.content } : r,
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
    if (sortOrder === 'newest') {
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    if (sortOrder === 'popular') {
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
      const token = PublicAuthService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
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
      const token = PublicAuthService.getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          content: trimmed,
          parentId: parentCommentId || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const saved = json?.data ?? json;
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
      const token = PublicAuthService.getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ content: trimmed }),
      });
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
      const token = PublicAuthService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE_URL}/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
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
