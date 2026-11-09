'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SectionTitle } from '@/components/hisgo/SectionTitle';
import { PublicAuthService } from '@/services/auth/public-auth.service';

const DEFAULT_COMMENT_AUTHOR_ID = process.env.NEXT_PUBLIC_BLOG_AUTHOR_ID || 'd2168a5d-05d7-4110-a304-94b17fe5bae5';
const DEFAULT_COMMENT_USERNAME = process.env.NEXT_PUBLIC_COMMENT_USERNAME || 'Khách';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const COMMENT_STORAGE_PREFIX = 'hisgo-blog-comments';

const getLocalStorageCommentsKey = (postId: string) => `${COMMENT_STORAGE_PREFIX}:${postId}`;

const readStoredComments = (postId: string): CommentItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(getLocalStorageCommentsKey(postId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredComments = (postId: string, comments: CommentItem[]) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getLocalStorageCommentsKey(postId), JSON.stringify(comments));
  } catch {
    // Bỏ qua nếu localStorage đầy hoặc bị chặn.
  }
};

const getCurrentCommentUser = () => {
  const user = PublicAuthService.getCurrentUser();
  return {
    id: user?.id || DEFAULT_COMMENT_AUTHOR_ID,
    username: user?.username || DEFAULT_COMMENT_USERNAME,
  };
};

type ReplyItem = {
  id: string;
  author: string;
  authorId?: string;
  time: string;
  content: string;
  likes?: number;
};

type CommentItem = {
  id: string;
  author: string;
  authorId?: string;
  time: string;
  content: string;
  likes: number;
  replies?: ReplyItem[];
  accent?: string;
};

const toRelativeTime = (value?: string) => {
  if (!value) return 'vừa xong';

  const then = new Date(value).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} ngày trước`;
};

const normalizeReply = (item: any, fallbackName = DEFAULT_COMMENT_USERNAME): ReplyItem => ({
  id: item?.id || String(Math.random()),
  author: item?.author?.username || fallbackName,
  authorId: item?.author?.id || item?.authorId || '',
  time: toRelativeTime(item?.createdAt),
  content: item?.content ?? '',
  likes: Number(item?.likeCount ?? item?.likes ?? 0),
});

const normalizeComment = (item: any, fallbackName = DEFAULT_COMMENT_USERNAME): CommentItem => ({
  id: item?.id || String(Math.random()),
  author: item?.author?.username || fallbackName,
  authorId: item?.author?.id || item?.authorId || '',
  time: toRelativeTime(item?.createdAt),
  content: item?.content ?? '',
  likes: Number(item?.likeCount ?? item?.likes ?? 0),
  replies: Array.isArray(item?.replies)
    ? item.replies.map((reply: any) => normalizeReply(reply, fallbackName))
    : [],
});

const updateCommentTree = (
  items: CommentItem[],
  targetId: string,
  commentUpdater: (item: CommentItem) => CommentItem,
  replyUpdater?: (item: ReplyItem) => ReplyItem,
): CommentItem[] =>
  items.map((comment) => {
    if (comment.id === targetId) {
      return commentUpdater(comment);
    }

    if (!comment.replies || comment.replies.length === 0) {
      return comment;
    }

    let changed = false;
    const nextReplies = comment.replies.map((reply) => {
      if (reply.id !== targetId) {
        return reply;
      }

      changed = true;
      return replyUpdater ? replyUpdater(reply) : reply;
    });

    if (!changed) {
      return comment;
    }

    return {
      ...comment,
      replies: nextReplies,
    };
  });

const markDeletedInTree = (items: CommentItem[], targetId: string): CommentItem[] =>
  items
    .filter((comment) => comment.id !== targetId)
    .map((comment) => {
      if (!comment.replies || comment.replies.length === 0) {
        return comment;
      }

      const nextReplies = comment.replies.filter((reply) => reply.id !== targetId);
      return {
        ...comment,
        replies: nextReplies,
      };
    });

const isSameCommentSignature = (left: Pick<CommentItem, 'id' | 'author' | 'content'>, right: Pick<CommentItem, 'id' | 'author' | 'content'>) => {
  if (left.id && right.id && left.id === right.id) {
    return true;
  }

  return left.author === right.author && left.content === right.content;
};

const appendReplyToComment = (items: CommentItem[], parentId: string, reply: ReplyItem): CommentItem[] =>
  items.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), reply],
      };
    }

    if (!comment.replies || comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: comment.replies.some((replyItem) => replyItem.id === reply.id)
        ? comment.replies
        : comment.replies,
    };
  });

export function CommentThread({ postId }: { postId?: string }) {
  const currentUser = getCurrentCommentUser();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [name, setName] = useState(DEFAULT_COMMENT_USERNAME);
  const [content, setContent] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setName(currentUser.username || DEFAULT_COMMENT_USERNAME);
  }, [currentUser.username]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const loadComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          const fallback = readStoredComments(postId);
          setComments(fallback);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        const nextComments = list.map((item: any) => normalizeComment(item, name));
        setComments(nextComments);
        writeStoredComments(postId, nextComments);
      } catch {
        const fallback = readStoredComments(postId);
        setComments(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-post-room', { postId, userId: currentUser.id });
    });

    socket.on('post:comment-added', (payload: any) => {
      const incoming = payload?.comment ?? payload;
      const nextComment = normalizeComment(incoming, name);
      const parentId = incoming?.parentId ?? payload?.parentId;

      setComments((current) => {
        const exists = current.some((item) => item.id === nextComment.id || isSameCommentSignature(item, nextComment));
        if (exists) {
          return current;
        }

        if (parentId) {
          return current.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), { ...nextComment, authorId: nextComment.authorId || incoming?.author?.id }],
                }
              : comment,
          );
        }

        return [nextComment, ...current];
      });
      setFeedbackNotice('Bình luận đã được ghi nhận và hiển thị ngay.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    });

    socket.on('post:comment-updated', (payload: any) => {
      const commentId = payload?.commentId || payload?.comment?.id;
      if (!commentId) return;

      setComments((current) => {
        if (payload?.type === 'deleted') {
          return markDeletedInTree(current, commentId);
        }

        if (payload?.type === 'updated') {
          const existing = current.find((item) => item.id === commentId) ?? current.flatMap((item) => item.replies ?? []).find((reply) => reply.id === commentId);
          const updatedComment = normalizeComment(payload.comment || { id: commentId, content: '', author: { username: name } }, name);
          const mergedUpdated = {
            ...updatedComment,
            authorId: updatedComment.authorId || (existing as any)?.authorId || currentUser.id,
            author: updatedComment.author || (existing as any)?.author || name,
          };

          return updateCommentTree(
            current,
            commentId,
            () => mergedUpdated,
            (reply) => ({ ...reply, content: mergedUpdated.content, time: mergedUpdated.time }),
          );
        }

        if (payload?.type === 'liked') {
          return current.map((comment) => {
            if (comment.id !== commentId) return comment;
            return { ...comment, likes: Number(payload.likeCount ?? comment.likes) };
          });
        }

        return current;
      });
    });

    loadComments();

    return () => {
      socket.emit('leave-post-room', { postId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [postId, name]);

  const isCommentOwner = (authorId?: string) => Boolean(authorId && authorId === currentUser.id);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!postId) {
      setSubmitError('Bài viết chưa sẵn sàng để nhận bình luận.');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setSubmitError('Vui lòng nhập nội dung bình luận.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: currentUser.id,
          content: trimmed,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.message || 'Không thể gửi bình luận.');
      }

      const createdComment = normalizeComment(
        responseData || { content: trimmed, author: { username: name }, createdAt: new Date().toISOString() },
        name,
      );
      setComments((current) => {
        const exists = current.some((item) => isSameCommentSignature(item, createdComment));
        if (exists) {
          return current;
        }
        const next = [createdComment, ...current];
        writeStoredComments(postId, next);
        return next;
      });
      setContent('');
      setFeedbackNotice('Bình luận của bạn đã được ghi nhận.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    } catch {
      const fallbackComment: CommentItem = {
        id: `local-${Date.now()}`,
        author: name,
        authorId: currentUser.id,
        time: 'vừa xong',
        content: trimmed,
        likes: 0,
        replies: [],
      };

      setComments((current) => {
        const exists = current.some((item) => isSameCommentSignature(item, fallbackComment));
        const next = exists ? current : [fallbackComment, ...current];
        writeStoredComments(postId, next);
        return next;
      });
      setContent('');
      setFeedbackNotice('Bình luận của bạn đã được lưu tại trình duyệt này.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!postId) {
      setSubmitError('Bài viết chưa sẵn sàng để nhận trả lời.');
      return;
    }

    const trimmed = (replyDrafts[commentId] || '').trim();
    if (!trimmed) {
      setSubmitError('Vui lòng nhập nội dung trả lời.');
      return;
    }

    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: currentUser.id,
          content: trimmed,
          parentId: commentId,
        }),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.message || 'Không thể gửi trả lời.');
      }

      const reply = normalizeReply(responseData || { content: trimmed, author: { username: name }, createdAt: new Date().toISOString() }, name);
      setComments((current) => {
        const next = current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), reply],
              }
            : comment,
        );
        writeStoredComments(postId, next);
        return next;
      });
      setReplyDrafts((current) => ({ ...current, [commentId]: '' }));
      setReplyingTo(null);
      setFeedbackNotice('Trả lời đã được gửi.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    } catch {
      const fallbackReply: ReplyItem = {
        id: `local-reply-${Date.now()}`,
        author: name,
        authorId: currentUser.id,
        time: 'vừa xong',
        content: trimmed,
        likes: 0,
      };

      setComments((current) => {
        const next = current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), fallbackReply],
              }
            : comment,
        );
        writeStoredComments(postId, next);
        return next;
      });
      setReplyDrafts((current) => ({ ...current, [commentId]: '' }));
      setReplyingTo(null);
      setFeedbackNotice('Trả lời của bạn đã được lưu cục bộ trên trình duyệt.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!postId) {
      setSubmitError('Bài viết chưa sẵn sàng để cập nhật bình luận.');
      return;
    }

    const trimmed = editDraft.trim();
    if (!trimmed) {
      setSubmitError('Nội dung chỉnh sửa không được để trống.');
      return;
    }

    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: currentUser.id,
          content: trimmed,
        }),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.message || 'Không thể cập nhật bình luận.');
      }

      const currentComment = comments.find((item) => item.id === commentId);
      const updated = normalizeComment(responseData || { id: commentId, content: trimmed, author: { username: name }, createdAt: new Date().toISOString() }, name);
      const mergedUpdated = {
        ...updated,
        authorId: updated.authorId || currentComment?.authorId || currentUser.id,
        author: updated.author || currentComment?.author || name,
        content: trimmed,
        time: 'vừa xong',
      };

      setComments((current) => {
        const next = updateCommentTree(
          current,
          commentId,
          () => mergedUpdated,
          (reply) => ({ ...reply, content: trimmed, time: 'vừa xong' }),
        );
        writeStoredComments(postId, next);
        return next;
      });
      setEditingCommentId(null);
      setEditDraft('');
      setFeedbackNotice('Bình luận đã được chỉnh sửa.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    } catch {
      setComments((current) => {
        const next = updateCommentTree(
          current,
          commentId,
          (item) => ({ ...item, content: trimmed, time: 'vừa xong' }),
          (reply) => ({ ...reply, content: trimmed, time: 'vừa xong' }),
        );
        writeStoredComments(postId, next);
        return next;
      });
      setEditingCommentId(null);
      setEditDraft('');
      setFeedbackNotice('Bình luận đã được cập nhật trong trình duyệt.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorId: currentUser.id }),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.message || 'Không thể xóa bình luận.');
      }

      setComments((current) => {
        const next = markDeletedInTree(current, commentId);
        writeStoredComments(postId, next);
        return next;
      });
      setFeedbackNotice('Bình luận đã được xóa.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    } catch {
      setComments((current) => {
        const next = markDeletedInTree(current, commentId);
        writeStoredComments(postId, next);
        return next;
      });
      setFeedbackNotice('Bình luận đã được xóa khỏi trình duyệt.');
      setTimeout(() => setFeedbackNotice(''), 2200);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!postId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.message || 'Không thể thích bình luận.');
      }

      setComments((current) => {
        const next = current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes: Number(responseData?.likeCount ?? comment.likes),
              }
            : comment,
        );
        writeStoredComments(postId, next);
        return next;
      });
    } catch {
      setComments((current) => {
        const next = current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes: Number(comment.likes || 0) + 1,
              }
            : comment,
        );
        writeStoredComments(postId, next);
        return next;
      });
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-[1100px] px-6 pb-20 lg:px-8">
      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Xác nhận</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">Xóa bình luận này?</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">
              Hành động này sẽ ẩn bình luận khỏi bài viết và không thể hoàn tác trực tiếp từ giao diện.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  handleDeleteComment(deleteConfirmId);
                }}
                className="rounded-[var(--radius-btn)] bg-red-600 px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-white"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-8">
        <SectionTitle title="Bình luận và phản hồi" subtitle="Thảo luận sâu hơn về không gian, ký ức và quyền lực trong bài viết" />
      </div>

      <div className="space-y-6">
        <div className="space-y-5">
          {isLoading ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-muted)]">
              Đang tải bình luận...
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-muted)]">
              Chưa có bình luận nào cho bài viết này. Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ nhận xét.
            </div>
          ) : (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--gold)] bg-[var(--bg-page)] text-sm font-semibold text-[var(--ink)]">
                    {comment.author
                      .split(' ')
                      .slice(-2)
                      .map((word) => word[0])
                      .join('')
                      .slice(0, 2)}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-semibold text-[var(--ink)]">{comment.author}</h3>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{comment.time}</p>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-3 space-y-3">
                        <textarea
                          rows={4}
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink)]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditSubmit(comment.id)}
                            className="rounded-[var(--radius-btn)] bg-[var(--gold)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditDraft('');
                            }}
                            className="rounded-[var(--radius-btn)] border border-[var(--border)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-base leading-7 text-[var(--text-body)]">{comment.content}</p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(comment.id)}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1.5 transition-all duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      >
                        Thích ({comment.likes})
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1.5 transition-all duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      >
                        Trả lời
                      </button>

                      {isCommentOwner(comment.authorId) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditDraft(comment.content);
                            }}
                            className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1.5 transition-all duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(comment.id)}
                            className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </>
                      ) : null}
                    </div>

                    {replyingTo === comment.id ? (
                      <div className="mt-4 space-y-3 rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] p-3">
                        <textarea
                          rows={3}
                          value={replyDrafts[comment.id] || ''}
                          onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                          placeholder="Viết câu trả lời..."
                          className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink)]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReplySubmit(comment.id)}
                            className="rounded-[var(--radius-btn)] bg-[var(--gold)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]"
                          >
                            Gửi trả lời
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyDrafts((current) => ({ ...current, [comment.id]: '' }));
                            }}
                            className="rounded-[var(--radius-btn)] border border-[var(--border)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {comment.replies && comment.replies.length > 0 ? (
                      <div className="mt-4 space-y-3 border-l border-[var(--border)] pl-4">
                        {comment.replies.map((reply, index) => (
                          <div key={`${comment.id}-reply-${index}`} className="rounded-[var(--radius-btn)] bg-[var(--bg-page)] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[var(--ink)]">{reply.author}</p>
                              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{reply.time}</span>
                            </div>

                            {editingCommentId === reply.id ? (
                              <div className="mt-3 space-y-3">
                                <textarea
                                  rows={3}
                                  value={editDraft}
                                  onChange={(event) => setEditDraft(event.target.value)}
                                  className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2 text-sm text-[var(--ink)]"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditSubmit(reply.id)}
                                    className="rounded-[var(--radius-btn)] bg-[var(--gold)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ink)]"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditDraft('');
                                    }}
                                    className="rounded-[var(--radius-btn)] border border-[var(--border)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                                  >
                                    Huỷ
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{reply.content}</p>
                            )}

                            {reply.authorId && reply.authorId === currentUser.id ? (
                              <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(reply.id);
                                    setEditDraft(reply.content);
                                  }}
                                  className="rounded-full border border-[var(--border)] bg-[var(--bg-page)] px-2.5 py-1.5"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(reply.id)}
                                  className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-600"
                                >
                                  Xóa
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 md:p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Để lại phản hồi</p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink)]">
              {name}
            </div>

            <div>
              <label htmlFor="comment-text" className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Bình luận
              </label>
              <textarea
                id="comment-text"
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Bạn nghĩ gì về bài viết này?"
                className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
              />
            </div>

            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
            {feedbackNotice ? <p className="text-sm text-[var(--gold)]">{feedbackNotice}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--gold)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--ink)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
