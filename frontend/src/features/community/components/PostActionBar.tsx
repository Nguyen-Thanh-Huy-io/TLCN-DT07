'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Eye, Flag, Heart, MessageSquare } from 'lucide-react';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { CommunityApi } from '../api';
import { ReportDialog } from './ReportDialog';

interface PostActionBarProps {
  postId: string;
  postTitle: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
}

export function PostActionBar({
  postId,
  postTitle,
  likeCount: initialLikeCount,
  commentCount,
  viewCount,
  likedByMe = false,
  bookmarkedByMe = false,
  commentsOpen,
  onToggleComments,
  onLikeUpdate,
  onBookmarkUpdate,
}: PostActionBarProps) {
  const router = useRouter();
  const user = useAuthSession();
  const [liked, setLiked] = useState(Boolean(likedByMe));
  const [likes, setLikes] = useState(Math.max(0, initialLikeCount));
  const [bookmarked, setBookmarked] = useState(Boolean(bookmarkedByMe));
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  const [prevProps, setPrevProps] = useState({
    likeCount: initialLikeCount,
    likedByMe,
    bookmarkedByMe,
  });

  if (
    initialLikeCount !== prevProps.likeCount ||
    likedByMe !== prevProps.likedByMe ||
    bookmarkedByMe !== prevProps.bookmarkedByMe
  ) {
    setPrevProps({
      likeCount: initialLikeCount,
      likedByMe,
      bookmarkedByMe,
    });
    setLikes(Math.max(0, initialLikeCount));
    setLiked(Boolean(likedByMe));
    setBookmarked(Boolean(bookmarkedByMe));
  }

  const requireAuth = () => {
    if (!user?.id) {
      router.push('/login?redirect=/cong-dong');
      return false;
    }
    return true;
  };

  const handleToggleLike = async () => {
    if (!requireAuth() || isLiking) return;

    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;
    const nextLikes = Math.max(0, prevLikes + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikes(nextLikes);
    onLikeUpdate?.(postId, nextLiked, nextLikes);

    if (postId.startsWith('seed-post-')) return;

    setIsLiking(true);
    try {
      const res = await CommunityApi.toggleLike(postId);
      setLiked(res.liked);
      setLikes(res.likeCount);
      onLikeUpdate?.(postId, res.liked, res.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
      onLikeUpdate?.(postId, prevLiked, prevLikes);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!requireAuth() || isBookmarking) return;

    const prevBookmarked = bookmarked;
    const nextBookmarked = !prevBookmarked;

    setBookmarked(nextBookmarked);
    onBookmarkUpdate?.(postId, nextBookmarked);

    if (postId.startsWith('seed-post-')) return;

    setIsBookmarking(true);
    try {
      const res = await CommunityApi.toggleBookmark(postId);
      setBookmarked(res.bookmarked);
      onBookmarkUpdate?.(postId, res.bookmarked);
    } catch {
      setBookmarked(prevBookmarked);
      onBookmarkUpdate?.(postId, prevBookmarked);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleOpenReport = () => {
    if (!requireAuth()) return;
    setReportOpen(true);
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE5D2] pt-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleLike}
            aria-pressed={liked}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3.5 text-[14px] font-medium transition-colors ${
              liked
                ? 'border-[#7A1F24] bg-[#F9E8E6] text-[#7A1F24]'
                : 'border-[#E2D5BC] bg-[#FAF5E6] text-[#4A3F33] hover:border-[#8A5A19] hover:text-[#14233F]'
            }`}
          >
            <Heart size={15} className={liked ? 'fill-[#7A1F24] text-[#7A1F24]' : ''} />
            <span>Thích</span>
            <span className="tabular-nums font-semibold">{likes.toLocaleString('vi-VN')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleComments}
            aria-expanded={commentsOpen}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3.5 text-[14px] font-medium transition-colors ${
              commentsOpen
                ? 'border-[#14233F] bg-[#14233F] text-[#FAF5E6]'
                : 'border-[#E2D5BC] bg-[#FAF5E6] text-[#4A3F33] hover:border-[#8A5A19] hover:text-[#14233F]'
            }`}
          >
            <MessageSquare size={15} />
            <span>Thảo luận</span>
            <span className="tabular-nums font-semibold">{commentCount.toLocaleString('vi-VN')}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-pressed={bookmarked}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3.5 text-[14px] font-medium transition-colors ${
              bookmarked
                ? 'border-[#8A5A19] bg-[#F2E5C9] text-[#6B4E16]'
                : 'border-[#E2D5BC] bg-[#FAF5E6] text-[#4A3F33] hover:border-[#8A5A19] hover:text-[#14233F]'
            }`}
          >
            <Bookmark size={15} className={bookmarked ? 'fill-[#6B4E16] text-[#6B4E16]' : ''} />
            <span>{bookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3.5">
          <span
            className="inline-flex items-center gap-1.5 text-[13px] text-[#6E5D4B] tabular-nums"
            title="Lượt đọc bài viết"
          >
            <Eye size={15} />
            <span>{viewCount.toLocaleString('vi-VN')} lượt xem</span>
          </span>

          <button
            type="button"
            onClick={handleOpenReport}
            disabled={reported}
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-transparent px-3 text-[13px] font-medium text-[#6E5D4B] transition-colors hover:border-[#E2D5BC] hover:bg-[#F3EAD8] hover:text-[#7A1F24] disabled:opacity-60"
          >
            <Flag size={14} />
            <span>{reported ? 'Đã báo cáo' : 'Báo cáo'}</span>
          </button>
        </div>
      </div>

      <ReportDialog
        postId={postId}
        postTitle={postTitle}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onReported={() => setReported(true)}
      />
    </>
  );
}
