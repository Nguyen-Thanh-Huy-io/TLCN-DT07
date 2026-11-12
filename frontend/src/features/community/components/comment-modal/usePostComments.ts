'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { PublicAuthService } from '@/services/auth/public-auth.service';
import { API_BASE_URL } from '@/constants/api-url';
import { CommunityPost } from '../../api';
import { CommunityCommentItem, SortOrder } from './comment-modal.types';
import { getPresetCommentsForPost } from './historical-comments.data';
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

  const storageKey = useMemo(
    () => `hisgo_community_modal_comments_v2:${post.id}`,
    [post.id],
  );

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

  // Tải danh sách bình luận (LocalStorage + Preset + Backend API)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadComments = async () => {
      setIsLoadingComments(true);

      // 1. Đọc bản lưu localStorage nếu người dùng đã tương tác trước đó
      let storedList: CommunityCommentItem[] | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsedJson = JSON.parse(raw);
            if (Array.isArray(parsedJson) && parsedJson.length > 0) {
              storedList = parsedJson;
            }
          }
        } catch {
          // Bỏ qua lỗi đọc localStorage
        }
      }

      const presetList = getPresetCommentsForPost(post);

      // 2. Thử lấy bình luận thực từ Backend nếu không phải seed ID giả lập
      let apiTree: CommunityCommentItem[] = [];
      if (!post.id.startsWith('seed-post-')) {
        try {
          const res = await fetch(`${API_BASE_URL}/posts/${post.id}/comments`, {
            credentials: 'include',
          });
          if (res.ok) {
            const json = await res.json();
            const rawData = json?.data ?? json;
            if (Array.isArray(rawData) && rawData.length > 0) {
              apiTree = mapBackendCommentsToTree(rawData);
            }
          }
        } catch {
          // Dùng dữ liệu dự phòng nếu lỗi kết nối
        }
      }

      if (cancelled) return;

      // Gộp bình luận từ trước để đảm bảo khi mở Popup luôn có đầy đủ bình luận
      let merged: CommunityCommentItem[];
      if (storedList && storedList.length > 0) {
        const existingIds = new Set(storedList.map((item) => item.id));
        const extraFromApi = apiTree.filter((item) => !existingIds.has(item.id));
        merged = [...storedList, ...extraFromApi];
      } else if (apiTree.length > 0) {
        const apiIds = new Set(apiTree.map((item) => item.id));
        const presetToKeep = presetList.filter((item) => !apiIds.has(item.id));
        merged = [...presetToKeep, ...apiTree];
      } else {
        merged = presetList;
      }

      setComments(merged);
      setIsLoadingComments(false);
    };

    void loadComments();

    // Kết nối Socket.io nhận bình luận mới theo thời gian thực
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
          likes: newComment.likesCount || 0,
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

    return () => {
      cancelled = true;
      socket.emit('leave-post-room', { postId: post.id });
      socket.disconnect();
    };
  }, [isOpen, post, storageKey]);

  // Lưu thay đổi bình luận vào localStorage để giữ bền vững
  const persistComments = (nextComments: CommunityCommentItem[]) => {
    setComments(nextComments);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextComments));
      } catch {
        // Bỏ qua lỗi quota
      }
    }
  };

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
    const counted = countAllCommentsInTree(comments);
    return Math.max(post.commentCount, counted);
  }, [comments, post.commentCount]);

  const handleSelectReply = (commentId: string, targetAuthorName: string) => {
    setReplyingTo({ commentId, authorName: targetAuthorName });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  };

  const handleToggleLikeComment = async (commentId: string) => {
    const next = comments.map((item) => {
      if (item.id === commentId) {
        const nextLiked = !item.likedByMe;
        return {
          ...item,
          likedByMe: nextLiked,
          likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)),
        };
      }
      if (item.replies.some((r) => r.id === commentId)) {
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
      }
      return item;
    });

    persistComments(next);

    if (!commentId.startsWith('hist-') && !commentId.startsWith('local-')) {
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
        // Giữ optimistic update
      }
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = composerText.trim();
    if (!trimmed) return;

    const nowIso = new Date().toISOString();
    const newItem: CommunityCommentItem = {
      id: `local-${Date.now()}`,
      authorId: currentUserId,
      authorName: currentUserName,
      authorBadge: currentUserId === post.author?.id ? 'Tác giả' : undefined,
      content: trimmed,
      createdAt: nowIso,
      likes: 0,
      likedByMe: false,
      replies: [],
    };

    const parentCommentId = replyingTo?.commentId || null;

    let nextComments: CommunityCommentItem[];
    if (parentCommentId) {
      nextComments = comments.map((c) =>
        c.id === parentCommentId ? { ...c, replies: [...c.replies, newItem] } : c,
      );
    } else {
      nextComments = [...comments, newItem];
    }

    persistComments(nextComments);
    setComposerText('');
    setReplyingTo(null);

    const updatedTotal = Math.max(
      post.commentCount + 1,
      countAllCommentsInTree(nextComments),
    );
    onCommentAdded?.(post.id, updatedTotal, {
      id: newItem.id,
      authorName: newItem.authorName,
      content: newItem.content,
      createdAt: newItem.createdAt,
    });

    if (!parentCommentId) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
    }

    // Gửi lên Backend nếu bài viết có trong CSDL
    if (!post.id.startsWith('seed-post-')) {
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
            parentId:
              parentCommentId &&
              !parentCommentId.startsWith('hist-') &&
              !parentCommentId.startsWith('local-')
                ? parentCommentId
                : undefined,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const saved = json?.data ?? json;
          if (saved?.id) {
            const synced = nextComments.map((c) => {
              if (c.id === newItem.id) return { ...c, id: saved.id };
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === newItem.id ? { ...r, id: saved.id } : r,
                ),
              };
            });
            persistComments(synced);
          }
        }
      } catch {
        // Đã lưu vào localStorage
      }
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    const next = comments.map((c) => {
      if (c.id === commentId) return { ...c, content: trimmed };
      return {
        ...c,
        replies: c.replies.map((r) =>
          r.id === commentId ? { ...r, content: trimmed } : r,
        ),
      };
    });

    persistComments(next);
    setEditingId(null);
    setEditingText('');

    if (!commentId.startsWith('hist-') && !commentId.startsWith('local-')) {
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
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const next = comments
      .filter((c) => c.id !== commentId)
      .map((c) => ({
        ...c,
        replies: c.replies.filter((r) => r.id !== commentId),
      }));

    persistComments(next);

    if (!commentId.startsWith('hist-') && !commentId.startsWith('local-')) {
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
