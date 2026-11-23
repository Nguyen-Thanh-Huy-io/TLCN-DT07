'use client';

import { useState } from 'react';
import { BlogPostType } from '@/constants/enums';
import { CommunityApi, extractCommunityContent, type CommunityPost } from '../api';
import { CommunityPostMediaGallery } from './CommunityPostMediaGallery';
import { PostCommentModal } from './PostCommentModal';
import { PostActionBar } from './PostActionBar';
import { PostAuthorHeader, PostPreviewCommentBox, PostQuestionContent, PostReferencesAndTags, PostSharedBlogCard } from './PostCardParts';

interface PostCardProps {
  post: CommunityPost;
  activeTag?: string | null;
  onSelectTag?: (tag: string) => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
  isFollowedAuthor?: boolean;
  isOwnPost?: boolean;
  showFollowButton?: boolean;
  priorityLcp?: boolean;
  onFollowUpdate?: (authorIdentifier: string, following: boolean, followerCount?: number) => void;
}

export function PostCard({
  post,
  activeTag,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
  isFollowedAuthor,
  isOwnPost = false,
  showFollowButton = true,
  priorityLcp = false,
  onFollowUpdate,
}: PostCardProps) {
  const [expandedText, setExpandedText] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [localPreviewComment, setLocalPreviewComment] = useState<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  } | null>(() => post.previewComment || null);

  const authorName = post.author?.username || 'Thành viên HISGO';
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;
  const isDirectLongForm = post.postType === BlogPostType.LONG_FORM;

  const galleryImages = !sharedBlog
    ? parsed.images.length > 0
      ? parsed.images
      : post.coverImageUrl
        ? [{ url: post.coverImageUrl, caption: null }]
        : []
    : [];
  const postVideos = !sharedBlog ? parsed.videos : [];
  const isMediaPost = Boolean(!sharedBlog && (galleryImages.length > 0 || postVideos.length > 0));

  const fullParagraphText = parsed.paragraphs.join('\n\n');
  const summaryText = post.excerpt || parsed.paragraphs[0] || '';
  const hasMoreContent = !isDirectLongForm && fullParagraphText.length > summaryText.length + 40;

  const trackViewOnce = () => {
    if (viewTracked) return;
    setViewTracked(true);
    void CommunityApi.incrementView(post.id);
  };

  const handleToggleComments = () => {
    trackViewOnce();
    setCommentsOpen((prev) => !prev);
  };

  const handleExpandContent = () => {
    trackViewOnce();
    setExpandedText((prev) => !prev);
  };

  const authorProfileHref = `/cong-dong/thanh-vien/${encodeURIComponent(authorName)}`;
  const effectiveFollowed = isFollowedAuthor ?? Boolean(post.author?.followedByMe);

  const handleToggleFollowAuthor = async () => {
    if (followLoading || isOwnPost) return;
    const identifier = post.author?.id || authorName;
    const nextState = !effectiveFollowed;
    onFollowUpdate?.(identifier, nextState);
    setFollowLoading(true);
    try {
      const res = await CommunityApi.toggleFollow(identifier);
      onFollowUpdate?.(identifier, res.following, res.followerCount);
    } catch {
      onFollowUpdate?.(identifier, !nextState);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <article className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 transition-colors hover:border-[#D8C8AA] md:p-8">
      <PostAuthorHeader
        authorName={authorName}
        authorProfileHref={authorProfileHref}
        publishedAt={post.publishedAt || post.createdAt}
        showFollowButton={showFollowButton}
        isOwnPost={isOwnPost}
        effectiveFollowed={effectiveFollowed}
        followLoading={followLoading}
        onToggleFollow={() => void handleToggleFollowAuthor()}
        isSharedBlog={Boolean(sharedBlog)}
        isMediaPost={isMediaPost}
        period={parsed.period}
        locations={parsed.locations}
      />

      <PostQuestionContent
        title={post.title}
        isDirectLongForm={isDirectLongForm}
        summaryText={summaryText}
        expandedText={expandedText}
        paragraphs={parsed.paragraphs}
        fullParagraphText={fullParagraphText}
        hasMoreContent={hasMoreContent}
        onExpandContent={handleExpandContent}
      />

      {sharedBlog ? (
        <PostSharedBlogCard
          sharedBlog={sharedBlog}
          authorName={authorName}
          onTrackView={trackViewOnce}
          priorityLcp={priorityLcp}
        />
      ) : null}

      <CommunityPostMediaGallery
        images={galleryImages}
        videos={postVideos}
        postTitle={post.title}
        priorityLcp={priorityLcp}
      />

      <PostReferencesAndTags
        references={parsed.references}
        tags={parsed.tags}
        activeTag={activeTag}
        onSelectTag={onSelectTag}
      />

      <PostActionBar
        postId={post.id}
        postTitle={post.title}
        likeCount={post.likeCount}
        commentCount={localCommentCount}
        viewCount={post.viewCount}
        likedByMe={post.likedByMe}
        bookmarkedByMe={post.bookmarkedByMe}
        commentsOpen={commentsOpen}
        onToggleComments={handleToggleComments}
        onLikeUpdate={onLikeUpdate}
        onBookmarkUpdate={onBookmarkUpdate}
      />

      {localPreviewComment ? (
        <PostPreviewCommentBox
          previewComment={localPreviewComment}
          commentCount={localCommentCount}
          onOpenComments={handleToggleComments}
        />
      ) : null}

      <PostCommentModal
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={{ ...post, commentCount: localCommentCount }}
        onLikeUpdate={onLikeUpdate}
        onBookmarkUpdate={onBookmarkUpdate}
        onCommentAdded={(_postId, updatedTotal, latestComment) => {
          setLocalCommentCount(updatedTotal);
          if (latestComment) {
            setLocalPreviewComment(latestComment);
          }
        }}
      />
    </article>
  );
}

export { PostActionBar } from './PostActionBar';
