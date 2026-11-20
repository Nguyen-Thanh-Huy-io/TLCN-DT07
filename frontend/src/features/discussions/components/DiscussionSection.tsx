'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  CornerDownRight,
  MessageSquare,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  DiscussionApiService,
  type DiscussionTargetType,
  type DiscussionThreadItem,
} from '@/services/entities/discussion.service';
import { extractErrorMessage } from '@/services/api';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { KeyboardKey, UserRole } from '@/constants/enums';

interface DiscussionSectionProps {
  targetType: DiscussionTargetType;
  targetId: string;
  learningPathId?: string;
  title?: string;
}

export function DiscussionSection({
  targetType,
  targetId,
  learningPathId,
  title = 'Hỏi đáp & Thảo luận',
}: DiscussionSectionProps) {
  const user = useAuthSession();
  const [threads, setThreads] = useState<DiscussionThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ô nhập bình luận chính (Facebook style)
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Trạng thái mở rộng và ô trả lời của từng bình luận
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await DiscussionApiService.list({ targetType, targetId, limit: 100 });
      setThreads(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được thảo luận.'));
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadThreads();
    });
  }, [loadThreads]);

  // Đăng bình luận mới (tự lấy 50 ký tự đầu làm title)
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const text = commentText.trim();
      const firstLine = text.split('\n')[0].slice(0, 80);
      const created = await DiscussionApiService.create({
        targetType,
        targetId,
        learningPathId,
        title: firstLine,
        content: text,
      });
      setThreads((prev) => [created, ...prev]);
      setCommentText('');
    } catch (err) {
      setError(extractErrorMessage(err, 'Vui lòng đăng nhập để bình luận.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Trả lời 1 bình luận
  const handleSendReply = async (threadId: string) => {
    const text = (replyInputs[threadId] || '').trim();
    if (!text) return;
    setReplyingId(threadId);
    try {
      const reply = await DiscussionApiService.reply(threadId, text);
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const currentReplies = t.replies || [];
          return {
            ...t,
            isAnswered: t.isAnswered || reply.isOfficial,
            replies: [...currentReplies, reply],
            _count: { replies: (t._count?.replies ?? currentReplies.length) + 1 },
          };
        }),
      );
      setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
      setExpandedReplies((prev) => ({ ...prev, [threadId]: true }));
    } catch (err) {
      setError(extractErrorMessage(err, 'Gửi câu trả lời thất bại.'));
    } finally {
      setReplyingId(null);
    }
  };

  // Xóa bình luận
  const handleDelete = async (threadId: string) => {
    if (!confirm('Bạn có chắc muốn xoá bình luận này?')) return;
    try {
      await DiscussionApiService.remove(threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch (err) {
      alert(extractErrorMessage(err, 'Xoá thất bại.'));
    }
  };

  return (
    <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Tiêu đề & Tổng số bình luận */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <MessageSquare className="text-amber-600" size={22} />
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {threads.length}
        </span>
      </div>

      {error && <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{error}</div>}

      {/* Ô nhập bình luận chính (đơn giản 1 ô duy nhất, không cồng kềnh) */}
      <form onSubmit={handlePostComment} className="mt-5 flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
          {user?.username ? user.username.charAt(0).toUpperCase() : 'B'}
        </div>
        <div className="flex-1">
          <textarea
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500"
            placeholder={
              user ? 'Viết câu hỏi hoặc chia sẻ ý kiến của bạn về bài này…' : 'Vui lòng đăng nhập để tham gia hỏi đáp…'
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!user || submitting}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!user || submitting || !commentText.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
            >
              <Send size={13} /> {submitting ? 'Đang gửi…' : 'Bình luận'}
            </button>
          </div>
        </div>
      </form>

      {/* Danh sách bình luận & phản hồi lồng nhau */}
      <div className="mt-6 space-y-5">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải bình luận…</div>
        ) : threads.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Chưa có bình luận nào. Hãy là người đầu tiên đặt câu hỏi!
          </div>
        ) : (
          threads.map((t) => {
            const replies = t.replies || [];
            const isShowReplies = expandedReplies[t.id] ?? true;
            const authorName = t.user?.userProfile?.firstName
              ? `${t.user.userProfile.lastName || ''} ${t.user.userProfile.firstName}`
              : t.user?.username || 'Độc giả';

            return (
              <div key={t.id} className="flex gap-3 text-sm">
                {/* Avatar người hỏi */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {authorName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 space-y-1.5">
                  {/* Bong bóng bình luận chính */}
                  <div className="rounded-2xl bg-slate-100/80 px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{authorName}</span>
                      <div className="flex items-center gap-2">
                        {t.isAnswered && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 size={11} /> Đã giải đáp
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-slate-800 whitespace-pre-wrap">{t.content}</p>
                  </div>

                  {/* Nút thao tác dưới bình luận */}
                  <div className="flex items-center gap-4 pl-2 text-xs font-medium text-slate-500">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [t.id]: prev[t.id] !== undefined ? prev[t.id] : '',
                        }))
                      }
                      className="hover:text-amber-700"
                    >
                      Phản hồi
                    </button>

                    {(user?.id === t.userId || user?.role === UserRole.ADMIN) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Danh sách các câu trả lời lồng vào trong (Youtube/FB style) */}
                  {replies.length > 0 && isShowReplies && (
                    <div className="mt-2 space-y-2.5 pl-4 border-l-2 border-slate-200">
                      {replies.map((reply) => {
                        const replyAuthor = reply.user?.userProfile?.firstName
                          ? `${reply.user.userProfile.lastName || ''} ${reply.user.userProfile.firstName}`
                          : reply.user?.username || 'Thành viên';

                        return (
                          <div
                            key={reply.id}
                            className={`rounded-xl px-3.5 py-2 text-xs ${
                              reply.isOfficial
                                ? 'border border-amber-300 bg-amber-50/80'
                                : 'bg-slate-50 border border-slate-200/70'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{replyAuthor}</span>
                                {reply.isOfficial && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-600 px-1 py-0.5 text-[9px] font-bold text-white">
                                    <ShieldCheck size={10} /> Ban Biên Soạn
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-800 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ô nhập câu trả lời nhanh cho thread này */}
                  {replyInputs[t.id] !== undefined && (
                    <div className="mt-2 flex gap-2 pl-4">
                      <CornerDownRight size={16} className="text-slate-400 mt-2 flex-shrink-0" />
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                        placeholder={
                          user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR
                            ? 'Trả lời chính thức với tư cách Ban biên soạn...'
                            : 'Viết câu trả lời của bạn...'
                        }
                        value={replyInputs[t.id] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === KeyboardKey.ENTER && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(t.id);
                          }
                        }}
                        disabled={replyingId === t.id}
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(t.id)}
                        disabled={replyingId === t.id || !(replyInputs[t.id] || '').trim()}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {replyingId === t.id ? '…' : 'Gửi'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
