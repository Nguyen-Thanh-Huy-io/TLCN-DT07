'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, MessageSquarePlus, Bookmark, ImagePlus, Share2 } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { COMMUNITY_FEED_PAGE_SIZE, CommunityApi, SSR_ME_IDENTIFIER, type CommunityMemberSummary, type CommunityPost } from '../api';
import { CommunityTabKey, ComposerMode, COMMUNITY_TAB_LABELS } from '@/constants/enums';
import { QuickComposer } from './QuickComposer';
import { CommunitySidebar } from './CommunitySidebar';
import { useCommunityPaging, useCommunityRealtimeSocket, useInfiniteScrollObserver } from '../hooks/useCommunityFeedHooks';
import { computePopularTags, fetchTabFeedPosts, matchesPostFilter, updateFollowedAuthorsMap, updateSuggestedMembersList } from '../community-content.util';
import { PostCard } from './PostActionBar';
import { PostCardSkeletonList } from './PostCardParts';

export type { CommunityTabKey };

interface CommunityFeedProps {
  initialPosts: CommunityPost[];
  initialShareBlogSlug?: string | null;
}

export function CommunityFeed({ initialPosts, initialShareBlogSlug = null }: CommunityFeedProps) {
  const router = useRouter();
  const user = useAuthSession();

  const [activeTab, setActiveTab] = useState<CommunityTabKey>(CommunityTabKey.ALL);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [suggestedMembers, setSuggestedMembers] = useState<CommunityMemberSummary[]>([]);
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= COMMUNITY_FEED_PAGE_SIZE);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(Boolean(initialShareBlogSlug));
  const [composerMode, setComposerMode] = useState<ComposerMode>(
    initialShareBlogSlug ? ComposerMode.SHARE_BLOG : ComposerMode.QUESTION,
  );
  const [composerOpenMedia, setComposerOpenMedia] = useState(false);
  const [preselectedBlogSlug, setPreselectedBlogSlug] = useState<string | null>(
    initialShareBlogSlug,
  );
  const [prevShareSlug, setPrevShareSlug] = useState(initialShareBlogSlug);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const rawCursorRef = useRef<string | null>(
    initialPosts[initialPosts.length - 1]?.id ?? null,
  );
  const hasHydratedFeedRef = useRef(false);
  const prevTabRef = useRef(activeTab);

  if (initialShareBlogSlug !== prevShareSlug) {
    setPrevShareSlug(initialShareBlogSlug);
    if (initialShareBlogSlug) {
      setPreselectedBlogSlug(initialShareBlogSlug);
      setComposerMode(ComposerMode.SHARE_BLOG);
      setComposerOpen(true);
    }
  }

  useEffect(() => {
    let active = true;
    void CommunityApi.getSuggestedMembers(4).then((list) => {
      if (!active) return;
      setSuggestedMembers(list);
      setFollowedAuthors((prev) => {
        const next = { ...prev };
        for (const item of list) {
          next[item.id.toLowerCase()] = item.followedByMe;
          next[item.username.toLowerCase()] = item.followedByMe;
        }
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const loadTabFeed = useCallback(
    async (tab: CommunityTabKey, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setErrorMsg('');

      try {
        const result = await fetchTabFeedPosts(
          tab,
          user?.id,
          initialPosts,
          COMMUNITY_FEED_PAGE_SIZE,
        );
        rawCursorRef.current = result.rawCursor;
        setPosts(result.posts);
        setHasMore(result.hasMore);
      } catch {
        if (tab !== CommunityTabKey.SAVED && initialPosts.length > 0) {
          rawCursorRef.current = initialPosts[initialPosts.length - 1]?.id ?? null;
          setPosts(initialPosts);
          setHasMore(false);
        } else {
          setErrorMsg('Không thể tải danh sách bài thảo luận.');
        }
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [initialPosts, user],
  );

  useEffect(() => {
    const isSameTab = prevTabRef.current === activeTab;
    prevTabRef.current = activeTab;

    // Khách vãng lai vào tab ALL đã có sẵn dữ liệu SSR, tránh gọi lại ngay lúc mount gây nháy skeleton.
    const isInitialGuestAll =
      !hasHydratedFeedRef.current &&
      !user?.id &&
      activeTab === CommunityTabKey.ALL &&
      initialPosts.length > 0;
    const shouldSilentHydrate =
      isSameTab && activeTab === CommunityTabKey.ALL && initialPosts.length > 0;

    hasHydratedFeedRef.current = true;
    if (isInitialGuestAll) return;

    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void loadTabFeed(activeTab, { silent: shouldSilentHydrate });
      }
    });
    return () => {
      active = false;
    };
  }, [activeTab, initialPosts.length, loadTabFeed, user]);

  useCommunityRealtimeSocket({
    activeTab,
    userId: user?.id,
    loadTabFeed,
    setPosts,
    setSuggestedMembers,
    setRealtimeNotice,
  });

  const { isLoadingMore, loadMorePosts } = useCommunityPaging({
    posts,
    activeTab,
    hasMore,
    rawCursorRef,
    setPosts,
    setHasMore,
  });

  const isAuthorFollowed = useCallback(
    (author?: { id: string; username: string; followedByMe?: boolean } | null) => {
      if (!author) return false;
      const byId = followedAuthors[author.id.toLowerCase()];
      if (byId !== undefined) return byId;
      const byName = followedAuthors[author.username.toLowerCase()];
      if (byName !== undefined) return byName;
      return Boolean(author.followedByMe);
    },
    [followedAuthors],
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) =>
      matchesPostFilter(post, activeTab, isAuthorFollowed, selectedTag, searchQuery),
    );
  }, [activeTab, isAuthorFollowed, posts, searchQuery, selectedTag]);

  const sentinelRef = useInfiniteScrollObserver({
    enabled: hasMore && activeTab !== CommunityTabKey.SAVED,
    isLoading,
    triggerKey: filteredPosts.length,
    onLoadMore: () => void loadMorePosts(),
  });

  const popularTags = useMemo(() => computePopularTags(posts), [posts]);

  const handleOpenComposer = (
    mode: ComposerMode = ComposerMode.QUESTION,
    openMedia = false,
  ) => {
    if (!user?.id) {
      router.push('/login?redirect=/cong-dong');
      return;
    }
    setPreselectedBlogSlug(null);
    setComposerMode(mode);
    setComposerOpenMedia(openMedia);
    setComposerOpen(true);
  };

  const handleCreatedPost = (created: CommunityPost) => {
    setPosts((current) => [created, ...current.filter((p) => p.id !== created.id)]);
    if (activeTab === CommunityTabKey.SAVED) {
      setActiveTab(CommunityTabKey.ALL);
    }
  };

  const handleLikeUpdate = (postId: string, liked: boolean, likeCount: number) => {
    setPosts((current) =>
      current.map((p) => (p.id === postId ? { ...p, likedByMe: liked, likeCount } : p)),
    );
  };

  const handleBookmarkUpdate = (postId: string, bookmarked: boolean) => {
    setPosts((current) => {
      if (activeTab === CommunityTabKey.SAVED && !bookmarked) {
        return current.filter((p) => p.id !== postId);
      }
      return current.map((p) => (p.id === postId ? { ...p, bookmarkedByMe: bookmarked } : p));
    });
  };

  const handleFollowUpdate = useCallback(
    (identifier: string, following: boolean, followerCount?: number) => {
      setFollowedAuthors((prev) =>
        updateFollowedAuthorsMap(prev, identifier, following, suggestedMembers),
      );
      setSuggestedMembers((current) =>
        updateSuggestedMembersList(current, identifier, following, followerCount),
      );
    },
    [suggestedMembers],
  );

  const handleToggleFollowMemberCard = async (member: CommunityMemberSummary) => {
    const nextState = !isAuthorFollowed(member);
    handleFollowUpdate(member.username, nextState);
    try {
      const res = await CommunityApi.toggleFollow(member.username);
      handleFollowUpdate(member.username, res.following, res.followerCount);
    } catch {
      handleFollowUpdate(member.username, !nextState);
    }
  };

  const myProfileHref = user?.username
    ? `/cong-dong/thanh-vien/${encodeURIComponent(user.username)}`
    : `/cong-dong/thanh-vien/${SSR_ME_IDENTIFIER}`;

  const resetFilters = () => {
    setSelectedTag(null);
    setSearchQuery('');
    if (activeTab === CommunityTabKey.FOLLOWING) {
      setActiveTab(CommunityTabKey.ALL);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[350px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] lg:gap-8">
        <CommunitySidebar
          myProfileHref={myProfileHref}
          username={user?.username}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          popularTags={popularTags}
          suggestedMembers={suggestedMembers}
          isAuthorFollowed={(m) => isAuthorFollowed(m)}
          onToggleFollowMember={(m) => void handleToggleFollowMemberCard(m)}
        />

        <div className="min-w-0 space-y-6">
          {realtimeNotice ? (
            <div className="flex items-start justify-between gap-3 rounded-[8px] border border-[#E8C5C6] bg-[#F9E8E6] px-4 py-3 text-[13px] text-[#7A1F24]">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <span>{realtimeNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRealtimeNotice(null)}
                aria-label="Đóng thông báo"
                className="text-[#7A1F24] hover:opacity-75"
              >
                ×
              </button>
            </div>
          ) : null}

          <CommunityFeedAskBanner
            username={user?.username}
            onOpenComposer={handleOpenComposer}
          />

          <CommunityFeedFilterBar
            activeTab={activeTab}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            totalPosts={filteredPosts.length}
            onResetFilters={resetFilters}
          />

          <CommunityFeedListSection
            errorMsg={errorMsg}
            isLoading={isLoading}
            filteredPosts={filteredPosts}
            activeTab={activeTab}
            isLoggedIn={Boolean(user?.id)}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            onResetFilters={resetFilters}
            onRetryLoadTab={() => void loadTabFeed(activeTab)}
            onSelectTag={(tag) =>
              setSelectedTag((current) =>
                current?.toLowerCase() === tag.toLowerCase() ? null : tag,
              )
            }
            onLikeUpdate={handleLikeUpdate}
            onBookmarkUpdate={handleBookmarkUpdate}
            isAuthorFollowed={isAuthorFollowed}
            currentUserId={user?.id}
            onFollowUpdate={handleFollowUpdate}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMorePosts={() => void loadMorePosts()}
            sentinelRef={sentinelRef}
          />
        </div>
      </div>

      <QuickComposer
        isOpen={composerOpen}
        initialMode={composerMode}
        initialOpenMedia={composerOpenMedia}
        initialSharedBlogSlug={preselectedBlogSlug}
        onClose={() => setComposerOpen(false)}
        onCreated={handleCreatedPost}
      />
    </div>
  );
}

// --- CommunityFeedAskBanner.tsx ---
interface CommunityFeedAskBannerProps {
  username?: string;
  onOpenComposer: (mode?: ComposerMode, openMedia?: boolean) => void;
}

export function CommunityFeedAskBanner({ username, onOpenComposer }: CommunityFeedAskBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-[#E3D6BE] bg-[#FAF5E6] px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={() => onOpenComposer(ComposerMode.QUESTION, false)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[6px] border border-[#E2D5BC] bg-[#FDF9F0] px-4 py-2.5 text-left text-[14px] text-[#6E5D4B] transition-colors hover:border-[#8A5A19] hover:text-[#14233F] cursor-pointer"
      >
        <MessageSquarePlus size={17} className="shrink-0 text-[#7A1F24]" />
        <span className="truncate">
          {username
            ? `${username}, bạn muốn viết bài, đăng ảnh/video hay chia sẻ Blog nào hôm nay?`
            : 'Bạn đang tìm hiểu hay muốn chia sẻ tư liệu lịch sử? Bấm vào đây để đăng bài...'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onOpenComposer(ComposerMode.QUESTION, true)}
        title="Đăng bài kèm Ảnh & Video"
        aria-label="Đăng bài kèm Ảnh & Video"
        className="grid size-10 shrink-0 place-items-center rounded-[6px] border border-[#DFD1B8] bg-[#FDF9F0] text-[#144E75] transition-colors hover:border-[#144E75] cursor-pointer"
      >
        <ImagePlus size={18} />
      </button>

      <button
        type="button"
        onClick={() => onOpenComposer(ComposerMode.SHARE_BLOG, false)}
        title="Chia sẻ bài chuyên khảo từ Blog"
        aria-label="Chia sẻ bài chuyên khảo từ Blog"
        className="grid size-10 shrink-0 place-items-center rounded-[6px] border border-[#DFD1B8] bg-[#FDF9F0] text-[#7A1F24] transition-colors hover:border-[#7A1F24] cursor-pointer"
      >
        <Share2 size={17} />
      </button>
    </div>
  );
}

// --- CommunityFeedEmptyState.tsx ---
interface CommunityFeedEmptyStateProps {
  activeTab: CommunityTabKey;
  isLoggedIn: boolean;
  selectedTag: string | null;
  searchQuery: string;
  onResetFilter: () => void;
}

export function CommunityFeedEmptyState({
  activeTab,
  isLoggedIn,
  selectedTag,
  searchQuery,
  onResetFilter,
}: CommunityFeedEmptyStateProps) {
  if (activeTab === CommunityTabKey.SAVED && !isLoggedIn) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
        <Bookmark size={22} className="mx-auto text-[#8A5A19]" />
        <h2 className="mt-2.5 text-[17px] font-semibold text-[#14233F]">
          Đăng nhập để xem kho thảo luận đã lưu
        </h2>
        <p className="mt-1.5 text-[14px] text-[#6E5D4B]">
          Lưu lại các cuộc thảo luận sử học và bài Blog chia sẻ tâm đắc để tra cứu bất cứ lúc nào.
        </p>
        <Link
          href="/login?redirect=/cong-dong"
          className="mt-4 inline-flex h-10 items-center rounded-[6px] bg-[#7A1F24] px-5 text-[14px] font-medium text-[#FAF5E6]"
        >
          Đăng nhập tài khoản
        </Link>
      </div>
    );
  }

  const getEmptyTitle = () => {
    if (activeTab === CommunityTabKey.SAVED) {
      return 'Bạn chưa lưu bài thảo luận nào trong danh mục này';
    }
    if (activeTab === CommunityTabKey.FOLLOWING) {
      return 'Bạn chưa theo dõi tác giả nào có bài viết hiển thị';
    }
    return 'Không tìm thấy bài thảo luận phù hợp';
  };

  const getEmptyDescription = () => {
    if (activeTab === CommunityTabKey.FOLLOWING) {
      return 'Hãy bấm nút "Theo dõi" tại danh sách Thành viên tiêu biểu ở cột bên trái hoặc trên từng bài viết để nhận thảo luận mới.';
    }
    if (selectedTag || searchQuery) {
      return 'Hãy thử xóa bộ lọc từ khóa hoặc chọn một thẻ chủ đề khác ở cột bên trái.';
    }
    return 'Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ bài viết từ Blog.';
  };

  const hasFilter = Boolean(selectedTag || searchQuery || activeTab === CommunityTabKey.FOLLOWING);

  return (
    <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-8 text-center">
      <h2 className="text-[17px] font-semibold text-[#14233F]">{getEmptyTitle()}</h2>
      <p className="mt-1.5 text-[14px] text-[#6E5D4B]">{getEmptyDescription()}</p>
      {hasFilter ? (
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-3.5 h-9 rounded-[6px] border border-[#D8C8AA] bg-[#F2E8D5] px-4 text-[13px] font-medium text-[#14233F]"
        >
          {activeTab === CommunityTabKey.FOLLOWING ? 'Xem tất cả thảo luận' : 'Xóa bộ lọc đang chọn'}
        </button>
      ) : null}
    </div>
  );
}

// --- CommunityFeedFilterBar.tsx ---
interface CommunityFeedFilterBarProps {
  activeTab: CommunityTabKey;
  selectedTag: string | null;
  searchQuery: string;
  totalPosts: number;
  onResetFilters: () => void;
}

export function CommunityFeedFilterBar({
  activeTab,
  selectedTag,
  searchQuery,
  totalPosts,
  onResetFilters,
}: CommunityFeedFilterBarProps) {
  const hasFilter = Boolean(selectedTag || searchQuery.trim() || activeTab !== CommunityTabKey.ALL);
  if (!hasFilter) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#F1E6D0] px-4 py-2.5 text-[13px] text-[#5C4E3C]">
      <div className="flex flex-wrap items-center gap-2">
        <span>Đang hiển thị:</span>
        <strong className="text-[#14233F]">
          {COMMUNITY_TAB_LABELS[activeTab]}
        </strong>
        {selectedTag ? (
          <span className="rounded-[4px] bg-[#7A1F24] px-2 py-0.5 text-[12px] font-semibold text-[#FAF5E6]">
            #{selectedTag}
          </span>
        ) : null}
        {searchQuery.trim() ? (
          <span className="rounded-[4px] bg-[#FAF5E6] px-2 py-0.5 text-[12px] font-semibold text-[#14233F]">
            Từ khóa: &ldquo;{searchQuery.trim()}&rdquo;
          </span>
        ) : null}
        <span className="text-[#7A6B57] tabular-nums">
          ({totalPosts} bài viết)
        </span>
      </div>

      <button
        type="button"
        onClick={onResetFilters}
        className="font-semibold text-[#7A1F24] hover:underline"
      >
        Đặt lại mặc định
      </button>
    </div>
  );
}

// --- CommunityFeedListSection.tsx ---
interface CommunityFeedListSectionProps {
  errorMsg: string;
  isLoading: boolean;
  filteredPosts: CommunityPost[];
  activeTab: CommunityTabKey;
  isLoggedIn: boolean;
  selectedTag: string | null;
  searchQuery: string;
  onResetFilters: () => void;
  onRetryLoadTab: () => void;
  onSelectTag: (tag: string) => void;
  onLikeUpdate: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate: (postId: string, bookmarked: boolean) => void;
  isAuthorFollowed: (author?: { id: string; username: string; followedByMe?: boolean } | null) => boolean;
  currentUserId?: string;
  onFollowUpdate: (identifier: string, following: boolean, followerCount?: number) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMorePosts: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

export function CommunityFeedListSection({
  errorMsg,
  isLoading,
  filteredPosts,
  activeTab,
  isLoggedIn,
  selectedTag,
  searchQuery,
  onResetFilters,
  onRetryLoadTab,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
  isAuthorFollowed,
  currentUserId,
  onFollowUpdate,
  isLoadingMore,
  hasMore,
  onLoadMorePosts,
  sentinelRef,
}: CommunityFeedListSectionProps) {
  if (errorMsg) {
    return (
      <div className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 text-[14px] text-[#7A1F24]">
        <p>{errorMsg}</p>
        <button
          type="button"
          onClick={onRetryLoadTab}
          className="mt-2 font-semibold text-[#14233F] underline"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <PostCardSkeletonList count={3} />;
  }

  if (filteredPosts.length === 0) {
    return (
      <CommunityFeedEmptyState
        activeTab={activeTab}
        isLoggedIn={isLoggedIn}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        onResetFilter={onResetFilters}
      />
    );
  }

  const showPagination =
    isLoadingMore || (hasMore && activeTab !== CommunityTabKey.SAVED);

  return (
    <div className="space-y-6">
      {filteredPosts.map((post, idx) => (
        <PostCard
          key={post.id}
          post={post}
          activeTag={selectedTag}
          onSelectTag={onSelectTag}
          onLikeUpdate={onLikeUpdate}
          onBookmarkUpdate={onBookmarkUpdate}
          isFollowedAuthor={isAuthorFollowed(post.author)}
          isOwnPost={Boolean(currentUserId && post.author?.id === currentUserId)}
          priorityLcp={idx === 0}
          onFollowUpdate={onFollowUpdate}
        />
      ))}

      {showPagination ? (
        <div ref={sentinelRef} className="space-y-5 pt-2">
          {isLoadingMore ? (
            <>
              <PostCardSkeletonList count={2} />
              <p className="text-center text-[13.5px] text-[#6E5D4B]">
                Đang tải thêm bài thảo luận...
              </p>
            </>
          ) : (
            <div className="text-center">
              <button
                type="button"
                onClick={onLoadMorePosts}
                className="h-10 rounded-[6px] border border-[#D8C8AA] bg-[#FDF9F0] px-5 text-[14px] font-medium text-[#14233F] hover:border-[#8A5A19] cursor-pointer"
              >
                Tải thêm bài viết
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="pt-2 text-center text-[13px] text-[#7A6B57]">
          Đã hiển thị tất cả bài viết hiện có.
        </p>
      )}
    </div>
  );
}
